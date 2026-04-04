import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ROLES } from '../utils/constants.js';
import mongoose from 'mongoose';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body; // Expecting an array of { productId, quantity }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('No items in order');
  }
  
  const orderItems = [];
  let totalPrice = 0;

  // 1. Validation Loop: Check if all products exist and have enough stock
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (item.quantity < product.minOrderQty) {
      res.status(400);
      throw new Error(`Quantity for ${product.title} must be at least ${product.minOrderQty}`);
    }
    if (item.quantity > product.maxOrderQty) {
      res.status(400);
      throw new Error(`Quantity for ${product.title} cannot exceed ${product.maxOrderQty}`);
    }
    if (product.stockQty < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }
  }

  // 2. Execution Loop: Atomic Stock Updates using findOneAndUpdate
  // This approach is safe without full transactions as it uses atomic $inc and condition check
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.productId, stockQty: { $gte: item.quantity } },
      { $inc: { stockQty: -item.quantity } },
      { new: true }
    );

    if (!product) {
      // This could happen if stock was taken by someone else between our validation and this update
      // We throw error here; already decremented items from previous iterations remain decremented
      // (This is the tradeoff for avoiding full replica-set transactions)
      res.status(400);
      throw new Error(`Stock conflict for ${item.productId}. Please try again.`);
    }

    const itemTotalPrice = product.price * item.quantity;
    totalPrice += itemTotalPrice;

    orderItems.push({
      product: product._id,
      productTitle: product.title,
      productBrand: product.brand,
      quantity: item.quantity,
      price: product.price,
      location: product.location,
      vendor: product.user,
    });
  }

  const order = new Order({
    user: req.user._id,
    items: orderItems,
    totalPrice,
  });

  const createdOrder = await order.save();

  // Generate Invoice and send email (outside transaction logic)
  try {
    const buyer = await User.findById(req.user._id);
    console.log(`Attempting to generate invoice for order: ${createdOrder._id}`);
    const invoiceUrlPath = await generateInvoice(createdOrder, buyer);
    console.log(`Invoice generated successfully: ${invoiceUrlPath}`);
    createdOrder.invoiceUrl = invoiceUrlPath;
    await createdOrder.save();
    console.log(`Order updated with invoiceUrl: ${createdOrder.invoiceUrl}`);
  } catch (error) {
    console.error('CRITICAL: Invoice generation failed for order:', createdOrder._id, error.message);
  }

  return res.status(201).json(createdOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id || !req.user.role) {
    res.status(401);
    throw new Error('Not authorized, user data missing');
  }

  let orders;
  if (req.user.role === ROLES.BUYER) {
    orders = await Order.find({ user: req.user._id }).populate('items.vendor', 'fullName companyName');
  } else if (req.user.role === ROLES.VENDOR) {
    // For vendors, find orders that contain at least one of their products
    orders = await Order.find({ 'items.vendor': req.user._id }).populate('user', 'fullName email companyName');
  } else if (req.user.role === ROLES.ADMIN) {
    orders = await Order.find({}).populate('user', 'fullName email companyName').populate('items.vendor', 'fullName companyName');
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

  if (req.user.role !== ROLES.ADMIN) {
    res.status(401);
    throw new Error('Not authorized to update order status');
  }

  order.status = status;
  const updatedOrder = await order.save();
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
  const isAdmin = req.user.role === ROLES.ADMIN;
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
