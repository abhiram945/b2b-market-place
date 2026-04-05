
import express from 'express';
const router = express.Router();
import {
  getUsers,
  updateUserStatus,
  toggleMaintenanceMode,
  getMaintenanceStatus,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { userStatusValidation, validate } from '../middleware/validationMiddleware.js'; // Import validation middleware

router.route('/users').get(protect, admin, getUsers);
router.route('/users/:id/status').put(protect, admin, userStatusValidation, validate, updateUserStatus);

router.route('/maintenance')
  .get(getMaintenanceStatus)
  .post(protect, admin, toggleMaintenanceMode);

export default router;
