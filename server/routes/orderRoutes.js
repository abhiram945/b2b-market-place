import express from 'express';
const router = express.Router();
import {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  getInvoice,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createOrderValidation, validate } from '../middleware/validationMiddleware.js'; // Import validation middleware

router.route('/').post(protect, createOrderValidation, validate, createOrder).get(protect, getMyOrders);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/invoice').get(protect, getInvoice);

export default router;
