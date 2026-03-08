import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { checkAndSendNotifications } from '../utils/notificationSender.js';
import { ROLES } from '../utils/constants.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const { search, brand, category, location, minPrice, maxPrice, sort } = req.query;

  // Handle optional auth
  let user = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded._id).select('-password');
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }

  let query = {};

  // Apply role-based filtering if user is authenticated and is a vendor
  if (user && user.role === ROLES.VENDOR) {
    query.user = user._id;
  }
  // For 'buyer', 'admin', and guests, no user-specific filter is applied here.

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }
  if (brand) {
    query.brand = brand;
  }
  if (category) {
    query.category = category;
  }
  if (location) {
    query.location = location;
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      query.price.$lte = Number(maxPrice);
    }
  }

  let sortOption = {};
  if (sort === 'price_desc') {
    sortOption = { price: -1 };
  } else if (sort === 'price_asc') {
    sortOption = { price: 1 };
  } else {
    // Default sort by createdAt for admin list
    sortOption = { createdAt: -1 };
  }

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOption)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { user, title, brand, category, location, price, minOrderQty, maxOrderQty, stockQty, condition, eta } = req.body;

  const product = new Product({
    user,
    title,
    brand,
    category,
    location,
    price,
    minOrderQty,
    maxOrderQty,
    stockQty,
    condition,
    eta,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Capture old values for notification service
  const oldPrice = product.price;
  const oldStock = product.stockQty;

  // Admin can update any field from the body
  const {
    title,
    brand,
    category,
    location,
    price,
    stockQty,
    isStockEnabled,
    minOrderQty,
    maxOrderQty,
    eta,
  } = req.body;

  product.title = title || product.title;
  product.brand = brand || product.brand;
  product.category = category || product.category;
  product.location = location || product.location;
  product.price = price !== undefined ? Number(price) : product.price;
  product.stockQty = stockQty !== undefined ? Number(stockQty) : product.stockQty;
  product.minOrderQty = minOrderQty !== undefined ? Number(minOrderQty) : product.minOrderQty;
  product.maxOrderQty = maxOrderQty !== undefined ? Number(maxOrderQty) : product.maxOrderQty;
  product.eta = eta || product.eta;

  if (isStockEnabled !== undefined) {
    product.isStockEnabled = isStockEnabled;
  }

  const updatedProduct = await product.save();

  // Trigger notification check
  checkAndSendNotifications(updatedProduct, oldPrice, oldStock);

  res.json(updatedProduct);
});

// @desc    Update a product (by vendor)
// @route   PUT /api/products/:id/vendor-update
// @access  Private/Vendor
const updateProductByVendor = asyncHandler(async (req, res) => {
  const { price, stockQty, isStockEnabled } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Ensure the user updating the product is the one who created it
  if (product.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this product');
  }
  
  // Capture old values for notification service
  const oldPrice = product.price;
  const oldStock = product.stockQty;

  // Rule: Can only decrease or maintain price
  if (price !== undefined && Number(price) > product.price) {
    res.status(400);
    throw new Error('Vendors can only decrease the product price.');
  }

  product.price = price !== undefined ? Number(price) : product.price;
  product.stockQty = stockQty !== undefined ? Number(stockQty) : product.stockQty;
  
  if (isStockEnabled !== undefined) {
    product.isStockEnabled = isStockEnabled;
  }

  const updatedProduct = await product.save();

  // Trigger notification check
  checkAndSendNotifications(updatedProduct, oldPrice, oldStock);

  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export {
  getProducts,
  createProduct,
  updateProduct,
  updateProductByVendor,
  deleteProduct,
};
