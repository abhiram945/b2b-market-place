import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded._id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      return next(); // Use return to prevent fall-through
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  // This part is now only reached if the initial 'if' fails
  res.status(401);
  throw new Error('Not authorized, no token');
});

const vendor = (req, res, next) => {
  if (req.user && req.user.role === ROLES.VENDOR) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a vendor');
  }
};

const buyer = (req, res, next) => {
  if (req.user && req.user.role === ROLES.BUYER) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a buyer');
  }
};

const admin = (req, res, next) => {

  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

const vendorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === ROLES.VENDOR || req.user.role === ROLES.ADMIN)) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a vendor or admin');
  }
};

const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded._id).select('-password');
    } catch (error) {
      console.error('Optional auth error:', error);
      // Don't throw error, just continue without req.user
    }
  }
  next();
});

export { protect, vendor, buyer, admin, vendorOrAdmin, optionalProtect };
