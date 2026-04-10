import { body, validationResult } from 'express-validator';
import { USER_STATUS } from '../utils/constants.js';

// Middleware to handle validation errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user login
export const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Validation rules for product creation
export const productCreationValidation = [
  body('title').notEmpty().withMessage('Product title is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('condition').notEmpty().withMessage('Condition is required'),
  body('minOrderQty').isInt({ gt: 0 }).withMessage('Minimum order quantity must be a positive integer'),
  body('maxOrderQty')
    .isInt({ gt: 0 })
    .withMessage('Maximum order quantity must be a positive integer')
    .custom((value, { req }) => {
      if (value < req.body.minOrderQty) {
        throw new Error('Maximum order quantity cannot be less than minimum order quantity');
      }
      if (req.body.stockQty !== undefined && Number(value) > Number(req.body.stockQty)) {
        throw new Error('Maximum order quantity cannot exceed available stock');
      }
      return true;
    }),
  body('stockQty').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
];

// Validation rules for product update by vendor (partial update)
export const productUpdateByVendorValidation = [
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stockQty').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('isStockEnabled').optional().isBoolean().withMessage('Stock Enabled must be a boolean value'),
];


// Validation rules for user registration
export const registerValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('companyName')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 3 })
    .withMessage('Company name must be at least 3 characters long'),
  body('phoneNumber')
    .optional() // Phone number is optional
    .isMobilePhone('any') // Validates phone number for any locale
    .withMessage('Please enter a valid phone number'),
];

// Validation rules for updating user status
export const userStatusValidation = [
  body('status')
    .isIn(Object.values(USER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`),
];

// Validation rules for creating an order
export const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.productId').isMongoId().withMessage('Invalid Product ID'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
];

// Validation rules for toggling a notification subscription
export const toggleSubscriptionValidation = [
  body('productId').isMongoId().withMessage('Invalid Product ID'),
  body('type').isIn(['price', 'stock']).withMessage('Notification type must be "price" or "stock"'),
];
