import express from 'express';
const router = express.Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  refreshToken,
  getRegisterConfig,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerValidation, loginValidation, validate } from '../middleware/validationMiddleware.js'; // Import validation middleware

router.post('/register', registerValidation, validate, registerUser);
router.get('/register-config', getRegisterConfig);
router.post('/login', loginValidation, validate, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshToken);
router.get('/profile', protect, getUserProfile);

export default router;
