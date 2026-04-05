import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (cart) {
    res.json(cart);
  } else {
    res.json({ user: req.user._id, items: [] });
  }
});

// @desc    Update user cart
// @route   PUT /api/cart
// @access  Private
const updateCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = items;
    const updatedCart = await cart.save();
    res.json(updatedCart);
  } else {
    const newCart = new Cart({
      user: req.user._id,
      items,
    });
    const createdCart = await newCart.save();
    res.status(201).json(createdCart);
  }
});

export { getCart, updateCart };
