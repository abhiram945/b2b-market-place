
import asyncHandler from 'express-async-handler';
import NotificationSubscription from '../models/NotificationSubscription.js';
import Product from '../models/Product.js'; // Import Product model
import mongoose from 'mongoose'; // Import Mongoose for ObjectId validation

// @desc    Get my subscriptions
// @route   GET /api/notifications
// @access  Private
const getMySubscriptions = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user data missing');
  }

  const subscriptions = await NotificationSubscription.find({ user: req.user._id });
  res.json(subscriptions);
});

// @desc    Toggle a subscription
// @route   POST /api/notifications/toggle
// @access  Private
const toggleSubscription = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user data missing');
  }

  const { productId, type } = req.body; // Removed productTitle from req.body

  // Basic validation for productId and type
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid Product ID');
  }
  if (!['price', 'stock'].includes(type)) { // Validate against enum
    res.status(400);
    throw new Error('Invalid notification type. Must be "price" or "stock".');
  }

  const product = await Product.findById(productId);
  if (!product) {
      res.status(404);
      throw new Error('Product not found');
  }

  const existingSub = await NotificationSubscription.findOne({
    user: req.user._id,
    product: productId,
    type,
  });

  if (existingSub) {
    await existingSub.deleteOne();
    res.json({ wasAdded: false, subscription: existingSub });
  } else {
    const newSub = await NotificationSubscription.create({
      user: req.user._id,
      product: productId,
      productTitle: product.title, // Use server-side product title for data integrity
      type,
    });
    res.status(201).json({ wasAdded: true, subscription: newSub });
  }
});


// @desc    Delete a subscription
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteSubscription = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user data missing');
  }

  const subscription = await NotificationSubscription.findById(req.params.id);

  if (subscription) {
     if (subscription.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this subscription');
    }
    await subscription.deleteOne();
    res.json({ message: 'Subscription removed' });
  } else {
    res.status(404);
    throw new Error('Subscription not found');
  }
});


export { getMySubscriptions, toggleSubscription, deleteSubscription };
