import express from 'express';
const router = express.Router();
import { getCart, updateCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, getCart)
    .put(protect, updateCart);

export default router;
