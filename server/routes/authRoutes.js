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
import multer from 'multer';
import path from 'path';

// Multer storage for registration documents
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Only PDF documents are allowed!');
    }
  },
});

router.post('/register', 
  upload.fields([
    { name: 'tradeLicense', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'vatRegistration', maxCount: 1 }
  ]),
  registerValidation, 
  validate, 
  registerUser
);
router.get('/register-config', getRegisterConfig);
router.post('/login', loginValidation, validate, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshToken);
router.get('/profile', protect, getUserProfile);

export default router;
