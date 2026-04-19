import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ROLES } from '../utils/constants.js';
import mongoose from 'mongoose';
import { enqueueJob, JOB_TYPES } from '../utils/jobQueue.js';

const getEffectiveRole = (user) => user?.activeRole || user?.role || user?.roles?.[0];

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('No items in order');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItems = [];
    let totalPrice = 0;
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('user', 'companyName fullName')
      .session(session);
    const productMap = new Map(products.map(product => [product._id.toString(), product]));

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (item.quantity < product.minOrderQty) {
        throw new Error(`Quantity for ${product.title} must be at least ${product.minOrderQty}`);
      }
      if (item.quantity > product.maxOrderQty) {
        throw new Error(`Quantity for ${product.title} cannot exceed ${product.maxOrderQty}`);
      }
      if (product.stockQty < item.quantity) {
        throw new Error(`Insufficient stock for ${product.title}`);
      }

      // Update stock
      product.stockQty -= item.quantity;
      if (product.maxOrderQty > product.stockQty) {
        product.maxOrderQty = product.stockQty;
      }
      await product.save({ session });

      const itemTotalPrice = product.price * item.quantity;
      totalPrice += itemTotalPrice;

      orderItems.push({
        product: product._id,
        productTitle: product.title,
        productBrand: product.brand,
        quantity: item.quantity,
        price: product.price,
        location: product.location,
        vendor: product.user._id,
        vendorName: product.user.companyName || product.user.fullName,
      });
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalPrice,
    });

    const createdOrder = await order.save({ session });

    // Clear cart in DB
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }).session(session);

    await session.commitTransaction();
    session.endSession();

    await enqueueJob(JOB_TYPES.INVOICE, {
      orderId: createdOrder._id,
      userId: req.user._id,
    });

    return res.status(201).json(createdOrder.toObject());
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400);
    throw new Error(error.message || 'Order creation failed');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user data missing');
  }

  const activeRole = getEffectiveRole(req.user);

  let orders;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (activeRole === ROLES.BUYER) {
    orders = await Order.find({ user: req.user._id }).populate('items.vendor', 'fullName companyName');
  } else if (activeRole === ROLES.VENDOR) {
    // For vendors, find orders that contain at least one of their products
    orders = await Order.find({ 'items.vendor': req.user._id }).populate('user', 'fullName email companyName');
  } else if (activeRole === ROLES.ADMIN) {
    let adminQuery = {};

    if (search) {
      if (!mongoose.Types.ObjectId.isValid(search)) {
        return res.json([]);
      }
      adminQuery = { _id: search };
    }

    orders = await Order.find(adminQuery).populate('user', 'fullName email companyName').populate('items.vendor', 'fullName companyName');
  }
  res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const activeRole = getEffectiveRole(req.user);

  if (activeRole !== ROLES.ADMIN) {
    res.status(401);
    throw new Error('Not authorized to update order status');
  }

  order.status = status;
  await order.save();

  const updatedOrder = await Order.findById(order._id)
    .populate('user', 'fullName email companyName')
    .populate('items.vendor', 'fullName companyName');

  res.json(updatedOrder);
});

// @desc    Get order invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
const getInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is buyer, an admin, or a vendor involved in the order
  const isBuyer = order.user.toString() === req.user._id.toString();
  const isAdmin = getEffectiveRole(req.user) === ROLES.ADMIN;
  const isVendor = order.items.some(item => item.vendor.toString() === req.user._id.toString());

  if (!isBuyer && !isVendor && !isAdmin) {
    res.status(401);
    throw new Error('Not authorized to view this invoice');
  }

  const invoiceName = `invoice_${order._id}.pdf`;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, '..', 'uploads', 'invoices', invoiceName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404);
    throw new Error('Invoice file not found');
  }
});

export { createOrder, getMyOrders, updateOrderStatus, getInvoice };
