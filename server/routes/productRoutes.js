
import express from 'express';
const router = express.Router();
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductByVendor,
} from '../controllers/productController.js';
import { protect, vendor, admin } from '../middleware/authMiddleware.js';
import { productCreationValidation, productUpdateByVendorValidation, validate } from '../middleware/validationMiddleware.js';

router.route('/').get(getProducts).post(protect, admin, productCreationValidation, validate, createProduct);

router
  .route('/:id')
  .put(protect, admin, productCreationValidation, validate, updateProduct)
  .delete(protect, admin, deleteProduct);

router.route('/:id/vendor-update').put(protect, vendor, productUpdateByVendorValidation, validate, updateProductByVendor);

export default router;
