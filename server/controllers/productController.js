import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';
import { getConfig, updateConfig, addToConfig } from '../utils/appConfigStore.js';
import { enqueueJob, bulkEnqueueJobs, JOB_TYPES } from '../utils/jobQueue.js';
import { normalizeString, normalizeInteger } from '../utils/helpers.js';

const getEffectiveRole = (user) => user?.activeRole || user?.role || user?.roles?.[0];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactCaseInsensitive = (value) => ({ $regex: `^${escapeRegex(value)}$`, $options: 'i' });
const clampOrderQuantities = ({ minOrderQty, maxOrderQty, stockQty }) => {
  const normalizedStock = stockQty !== undefined ? Number(stockQty) : undefined;
  const normalizedMin = minOrderQty !== undefined ? Number(minOrderQty) : undefined;
  let normalizedMax = maxOrderQty !== undefined ? Number(maxOrderQty) : undefined;

  if (normalizedStock !== undefined && normalizedMax !== undefined && normalizedMax > normalizedStock) {
    normalizedMax = normalizedStock;
  }

  return {
    minOrderQty: normalizedMin,
    maxOrderQty: normalizedMax,
    stockQty: normalizedStock,
  };
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const { search, searchId, brand, category, location, minPrice, maxPrice, sort, vendorId } = req.query;

  // req.user is populated by optionalProtect middleware if token exists
  const user = req.user;

  let query = {};

  // Role-based or explicit vendor filtering:
  if (user && getEffectiveRole(user) === ROLES.VENDOR) {
    query.user = user._id;
  } else if (vendorId) {
    if (!mongoose.Types.ObjectId.isValid(String(vendorId))) {
      return res.json({ products: [], page, pages: 0, total: 0 });
    }
    query.user = new mongoose.Types.ObjectId(String(vendorId));
  }

  // --- Search Prioritization ---
  // If searchId is provided, or search looks like an ID, prioritize it
  const potentialId = searchId || search;
  if (potentialId && mongoose.Types.ObjectId.isValid(String(potentialId))) {
      const idQuery = { ...query, _id: new mongoose.Types.ObjectId(String(potentialId)) };
      const productById = await Product.findOne(idQuery);
      if (productById) {
          return res.json({ products: [productById], page: 1, pages: 1, total: 1 });
      }
      // If we looked for an ID but didn't find it, and searchId was explicit, return empty
      if (searchId) return res.json({ products: [], page, pages: 0, total: 0 });
  }

  // --- Traditional Filtering ---
  if (brand) query.brand = exactCaseInsensitive(normalizeString(brand));
  if (category) query.category = exactCaseInsensitive(normalizeString(category));
  if (location) query.location = exactCaseInsensitive(normalizeString(location));
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortOption = {};
  let projection = {};
  if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'price_asc') sortOption = { price: 1 };
  else sortOption = { createdAt: -1 };

  // --- Text Search Logic ---
  if (search) {
    const textQuery = { ...query, $text: { $search: search } };
    let count = await Product.countDocuments(textQuery);

    if (count > 0) {
      const products = await Product.find(textQuery)
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, ...sortOption })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
      return res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
    }

    // --- Regex Fallback ---
    query.title = { $regex: search, $options: 'i' };
  }

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOption)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get filter options (independent of current filters)
// @route   GET /api/products/filter-options
// @access  Public
const getFilterOptions = asyncHandler(async (req, res) => {
  const user = req.user;

  let query = {};

  // Apply role-based filtering if user is authenticated and is a vendor
  if (user && getEffectiveRole(user) === ROLES.VENDOR) {
    query.user = user._id;
  }

  // Get all unique categories and locations from products
  const categories = await Product.distinct('category', query);
  const locations = await Product.distinct('location', query);

  // Get config for brands and conditions
  const config = await getConfig();

  res.json({
    categories: categories.filter(Boolean).sort(),
    locations: locations.filter(Boolean).sort(),
    brands: config.brands || [],
    conditions: config.conditions || []
  });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { user, title, brand, category, location, price, minOrderQty, maxOrderQty, stockQty, condition, eta } = req.body;
  const normalizedQuantities = clampOrderQuantities({ minOrderQty, maxOrderQty, stockQty });

  const product = new Product({
    user,
    title: normalizeString(title),
    brand: normalizeString(brand),
    category: normalizeString(category),
    location: normalizeString(location),
    price,
    minOrderQty: normalizedQuantities.minOrderQty,
    maxOrderQty: normalizedQuantities.maxOrderQty,
    stockQty: normalizedQuantities.stockQty,
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
  const normalizedQuantities = clampOrderQuantities({ minOrderQty, maxOrderQty, stockQty });

  product.title = title !== undefined ? normalizeString(title) : product.title;
  product.brand = brand !== undefined ? normalizeString(brand) : product.brand;
  product.category = category !== undefined ? normalizeString(category) : product.category;
  product.location = location !== undefined ? normalizeString(location) : product.location;
  product.price = price !== undefined ? Number(price) : product.price;
  product.stockQty = normalizedQuantities.stockQty !== undefined ? normalizedQuantities.stockQty : product.stockQty;
  product.minOrderQty = normalizedQuantities.minOrderQty !== undefined ? normalizedQuantities.minOrderQty : product.minOrderQty;
  product.maxOrderQty = normalizedQuantities.maxOrderQty !== undefined ? normalizedQuantities.maxOrderQty : product.maxOrderQty;
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
  await enqueueJob(JOB_TYPES.PRODUCT_NOTIFICATION, {
    productId: updatedProduct._id,
    oldPrice,
    oldStock,
  });

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
  if (stockQty !== undefined && product.maxOrderQty > product.stockQty) {
    product.maxOrderQty = product.stockQty;
  }
  
  if (isStockEnabled !== undefined) {
    product.isStockEnabled = isStockEnabled;
  }

  const updatedProduct = await product.save();

  // Trigger notification check
  await enqueueJob(JOB_TYPES.PRODUCT_NOTIFICATION, {
    productId: updatedProduct._id,
    oldPrice,
    oldStock,
  });

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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdProducts = [];
    const normalizedProducts = [];
    
    // Set to collect new config values to update once at the end
    const newConfigs = {
      brands: new Set(),
      categories: new Set(),
      locations: new Set(),
      conditions: new Set()
    };

    const vendorIds = [...new Set(productsToCreate.map(product => product?.user).filter(Boolean))];
    const vendorRecords = await User.find({
      _id: { $in: vendorIds },
      roles: ROLES.VENDOR,
    }).select('_id').session(session);
    const validVendorIds = new Set(vendorRecords.map(vendor => vendor._id.toString()));

    for (let i = 0; i < productsToCreate.length; i++) {
      const productData = productsToCreate[i];
      
      if (!validVendorIds.has(String(productData.user))) {
          throw new Error(`Invalid or non-vendor user ID provided at index ${i}`);
      }

      const normalizedProduct = {
        user: productData.user,
        title: normalizeString(productData.title),
        brand: normalizeString(productData.brand),
        category: normalizeString(productData.category),
        location: normalizeString(productData.location),
        price: productData.price,
        ...clampOrderQuantities({
          minOrderQty: productData.minOrderQty,
          maxOrderQty: productData.maxOrderQty,
          stockQty: productData.stockQty,
        }),
        condition: normalizeString(productData.condition),
        eta: normalizeInteger(productData.eta),
        isStockEnabled: productData.isStockEnabled !== undefined ? productData.isStockEnabled : true,
      };

      normalizedProducts.push(normalizedProduct);

      // Collect config values
      if (normalizedProduct.brand) newConfigs.brands.add(normalizedProduct.brand.trim());
      if (normalizedProduct.category) newConfigs.categories.add(normalizedProduct.category.trim());
      if (normalizedProduct.location) newConfigs.locations.add(normalizedProduct.location.trim());
      if (normalizedProduct.condition) newConfigs.conditions.add(normalizedProduct.condition.trim());
    }

    if (normalizedProducts.length > 0) {
      const insertedProducts = await Product.insertMany(normalizedProducts, { session });
      createdProducts.push(...insertedProducts);

      // Handover the product notification to the worker thread
      const notificationJobs = insertedProducts.map((p) => ({
        type: JOB_TYPES.PRODUCT_NOTIFICATION,
        payload: {
          productId: p._id,
          oldPrice: 0,
          oldStock: 0,
        },
      }));
      await bulkEnqueueJobs(notificationJobs, { session });
    }

    // Batch update config once
    const config = await getConfig();
    let configUpdated = false;

    for (const key of ['brands', 'categories', 'locations', 'conditions']) {
      if (!config[key]) {
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

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: `${createdProducts.length} products created successfully.`,
      createdCount: createdProducts.length,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`[BULK UPLOAD] Transaction failed: ${error.message}`);
    res.status(400);
    throw new Error(`Bulk upload failed: ${error.message}`);
  }
});

export {
  getProducts,
  createProduct,
  updateProduct,
  updateProductByVendor,
  deleteProduct,
  bulkCreateProducts,
  getFilterOptions,
};
