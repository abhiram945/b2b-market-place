import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { checkAndSendNotifications } from '../utils/notificationSender.js';
import { ROLES } from '../utils/constants.js';
import { getConfig, updateConfig, addToConfig } from '../utils/jsonStore.js';

const normalizeString = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const normalizeInteger = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactCaseInsensitive = (value) => ({ $regex: `^${escapeRegex(value)}$`, $options: 'i' });

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const { search, brand, category, location, minPrice, maxPrice, sort } = req.query;

  // req.user is populated by optionalProtect middleware if token exists
  const user = req.user;

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
    query.brand = exactCaseInsensitive(normalizeString(brand));
  }
  if (category) {
    query.category = exactCaseInsensitive(normalizeString(category));
  }
  if (location) {
    query.location = exactCaseInsensitive(normalizeString(location));
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

  const config = await getConfig();

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count, config });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { user, title, brand, category, location, price, minOrderQty, maxOrderQty, stockQty, condition, eta } = req.body;

  const product = new Product({
    user,
    title: normalizeString(title),
    brand: normalizeString(brand),
    category: normalizeString(category),
    location: normalizeString(location),
    price,
    minOrderQty,
    maxOrderQty,
    stockQty,
    condition: normalizeString(condition),
    eta: normalizeInteger(eta),
  });

  const createdProduct = await product.save();

  // Update dynamic config
  if (brand) await addToConfig('brands', brand);
  if (category) await addToConfig('categories', category);
  if (location) await addToConfig('locations', location);
  if (condition) await addToConfig('conditions', condition);

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
    condition,
    eta,
  } = req.body;

  product.title = title !== undefined ? normalizeString(title) : product.title;
  product.brand = brand !== undefined ? normalizeString(brand) : product.brand;
  product.category = category !== undefined ? normalizeString(category) : product.category;
  product.location = location !== undefined ? normalizeString(location) : product.location;
  product.price = price !== undefined ? Number(price) : product.price;
  product.stockQty = stockQty !== undefined ? Number(stockQty) : product.stockQty;
  product.minOrderQty = minOrderQty !== undefined ? Number(minOrderQty) : product.minOrderQty;
  product.maxOrderQty = maxOrderQty !== undefined ? Number(maxOrderQty) : product.maxOrderQty;
  product.eta = eta !== undefined ? normalizeInteger(eta) : product.eta;
  product.condition = condition !== undefined ? normalizeString(condition) : product.condition;

  if (isStockEnabled !== undefined) {
    product.isStockEnabled = isStockEnabled;
  }

  const updatedProduct = await product.save();

  // Update dynamic config
  if (brand) await addToConfig('brands', brand);
  if (category) await addToConfig('categories', category);
  if (location) await addToConfig('locations', location);
  if (condition) await addToConfig('conditions', condition);

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

// @desc    Bulk create products
// @route   POST /api/admin/products/bulk
// @access  Private/Admin
const bulkCreateProducts = asyncHandler(async (req, res) => {
  const productsToCreate = req.body; // Expecting an array of product objects

  if (!Array.isArray(productsToCreate) || productsToCreate.length === 0) {
    res.status(400);
    throw new Error('No products provided for bulk upload');
  }
  const createdProducts = [];
  const failedProducts = [];
  
  // Set to collect new config values to update once at the end
  const newConfigs = {
    brands: new Set(),
    categories: new Set(),
    locations: new Set(),
    conditions: new Set()
  };

  for (let i = 0; i < productsToCreate.length; i++) {
    const productData = productsToCreate[i];
    const logPrefix = `[PRODUCT ${i + 1}/${productsToCreate.length}]`;
    
    try {
      if (!productData.title || !productData.price || !productData.user) {
        console.warn(`${logPrefix} Validation failed: Missing required fields`);
        failedProducts.push({ product: productData, error: 'Missing required fields (title, price, user)' });
        continue;
      }

      const vendorExists = await User.findById(productData.user);
      if (!vendorExists || vendorExists.role !== ROLES.VENDOR) {
          console.warn(`${logPrefix} Validation failed: Invalid vendor ID ${productData.user}`);
          failedProducts.push({ product: productData, error: 'Invalid or non-vendor user ID provided' });
          continue;
      }

      const product = new Product({
        user: productData.user,
        title: normalizeString(productData.title),
        brand: normalizeString(productData.brand),
        category: normalizeString(productData.category),
        location: normalizeString(productData.location),
        price: productData.price,
        minOrderQty: productData.minOrderQty,
        maxOrderQty: productData.maxOrderQty,
        stockQty: productData.stockQty,
        condition: normalizeString(productData.condition),
        eta: normalizeInteger(productData.eta),
        isStockEnabled: productData.isStockEnabled !== undefined ? productData.isStockEnabled : true,
      });

      const createdProduct = await product.save();
      createdProducts.push(createdProduct);

      // Collect config values
      if (product.brand) newConfigs.brands.add(product.brand.trim());
      if (product.category) newConfigs.categories.add(product.category.trim());
      if (product.location) newConfigs.locations.add(product.location.trim());
      if (product.condition) newConfigs.conditions.add(product.condition.trim());

    } catch (error) {
      console.error(`${logPrefix} System error: ${error.message}`);
      failedProducts.push({ product: productData, error: error.message });
    }
  }

  // Batch update config once
  try {
    const config = await getConfig();
    let configUpdated = false;

    for (const key of ['brands', 'categories', 'locations', 'conditions']) {
      if (!config[key]) {
        console.warn(`[BULK UPLOAD] Key '${key}' missing in config, initializing...`);
        config[key] = [];
      }
      
      for (const val of newConfigs[key]) {
        if (!val) continue;
        const normalized = val.toLowerCase().trim();
        // Check if exists (case-insensitive)
        const exists = config[key].some(v => v && v.toLowerCase() === normalized);
        
        if (!exists) {
          config[key].push(normalized);
          configUpdated = true;
        }
      }
    }

    if (configUpdated) {
      await updateConfig(config);
    }
  } catch (configError) {
    console.error(`[BULK UPLOAD] CRITICAL: Failed to update configuration:`, configError.message);
  }

  res.status(201).json({
    message: `${createdProducts.length} products created successfully.${failedProducts.length > 0 ? ` ${failedProducts.length} products failed.` : ''}`,
    createdCount: createdProducts.length,
    failedCount: failedProducts.length,
    failedProducts: failedProducts,
  });
});

export {
  getProducts,
  createProduct,
  updateProduct,
  updateProductByVendor,
  deleteProduct,
  bulkCreateProducts,
};
