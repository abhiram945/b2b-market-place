import express from 'express';
const router = express.Router();
import {
  getUsers,
  updateUserStatus,
  toggleMaintenanceMode,
  getMaintenanceStatus,
  uploadBrandLogo,
  uploadBanner,
  getDocument,
  getConfigController // Import the new controller
} from '../controllers/adminController.js';
import { bulkCreateProducts } from '../controllers/productController.js'; // Import bulkCreateProducts
import { protect, admin } from '../middleware/authMiddleware.js';
import { userStatusValidation, validate } from '../middleware/validationMiddleware.js'; // Import validation middleware
import multer from 'multer';
import path from 'path';

// Multer for images
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === 'banner') {
      cb(null, 'uploads/banners/');
    } else {
      cb(null, 'uploads/brands/');
    }
  },
  filename(req, file, cb) {
    if (file.fieldname === 'banner') {
      // Save banner with a fixed name and original extension
      cb(null, `user-dashboard-banner${path.extname(file.originalname)}`);
    } else {
      // Use the name from body for brand logo
      const name = req.body.name ? req.body.name.toLowerCase().replace(/\s+/g, '-') : 'brand';
      cb(null, `${name}${path.extname(file.originalname)}`);
    }
  },
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: function (req, file, cb) {
    // Only allow PNG files
    const isValidExtension = path.extname(file.originalname).toLowerCase() === '.png';
    const isValidMimetype = file.mimetype === 'image/png';

    if (isValidExtension && isValidMimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed. Please upload a valid PNG image.'));
    }
  },
});

router.route('/users').get(protect, admin, getUsers);
router.route('/users/:id/status').put(protect, admin, userStatusValidation, validate, updateUserStatus);

router.route('/maintenance')
  .get(getMaintenanceStatus)
  .post(protect, admin, toggleMaintenanceMode);

// New route for bulk product upload
router.route('/products/bulk').post(protect, admin, bulkCreateProducts);

// Image upload routes
router.post('/upload/brand-logo', protect, admin, uploadImage.single('image'), uploadBrandLogo);
router.post('/upload/banner', protect, admin, uploadImage.single('banner'), uploadBanner);

// Document retrieval route
router.get('/documents/:filename', protect, admin, getDocument);

// New route to get configuration
router.route('/config').get(protect, admin, getConfigController);


export default router;
