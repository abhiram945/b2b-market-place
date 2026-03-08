
import express from 'express';
const router = express.Router();
import {
  getMySubscriptions,
  toggleSubscription,
  deleteSubscription,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { toggleSubscriptionValidation, validate } from '../middleware/validationMiddleware.js'; // Import validation middleware

router.route('/').get(protect, getMySubscriptions);
router.route('/toggle').post(protect, toggleSubscriptionValidation, validate, toggleSubscription);
router.route('/:id').delete(protect, deleteSubscription);


export default router;
