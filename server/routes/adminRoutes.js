
import express from 'express';
const router = express.Router();
import {
  getUsers,
  updateUserStatus,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { userStatusValidation, validate } from '../middleware/validationMiddleware.js'; // Import validation middleware

router.route('/users').get(protect, admin, getUsers);
router.route('/users/:id/status').put(protect, admin, userStatusValidation, validate, updateUserStatus);

export default router;
