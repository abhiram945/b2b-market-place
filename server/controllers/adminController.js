import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { USER_STATUS } from '../utils/constants.js';
import { getConfig, updateConfig, addToConfig } from '../utils/appConfigStore.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { enqueueJob, JOB_TYPES } from '../utils/jobQueue.js';
import mongoose from 'mongoose';

const normalizeString = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all users (with optional status filter)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { status, searchId } = req.query;
  const filter = status ? { status } : {};
  if (searchId) {
    if (!mongoose.Types.ObjectId.isValid(String(searchId))) {
      return res.json([]);
    }
    filter._id = String(searchId);
  }
  const users = await User.find(filter).sort({ createdAt: -1 }); // Sort by creation date, newest first
  res.json(users);
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);

  if (user) {
    user.status = status;
    const updatedUser = await user.save();

    if (status === USER_STATUS.APPROVED || status === USER_STATUS.REJECTED) {
      await enqueueJob(JOB_TYPES.USER_STATUS_NOTIFICATION, {
        userId: user._id,
        status,
      });
    }

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Toggle maintenance mode
// @route   POST /api/admin/maintenance
// @access  Private/Admin
const toggleMaintenanceMode = asyncHandler(async (req, res) => {
  const { maintenanceMode } = req.body;
  const config = await getConfig();
  config.maintenanceMode = maintenanceMode;
  await updateConfig(config);
  res.json({ message: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}`, maintenanceMode });
});

// @desc    Get maintenance mode status
// @route   GET /api/admin/maintenance
// @access  Public
const getMaintenanceStatus = asyncHandler(async (req, res) => {
  const config = await getConfig();
  res.json({ maintenanceMode: config.maintenanceMode });
});

// @desc    Upload brand logo
// @route   POST /api/admin/upload/brand-logo
// @access  Private/Admin
const uploadBrandLogo = asyncHandler(async (req, res) => {
  const name = normalizeString(req.body.name);
  if (!name) {
    res.status(400);
    throw new Error('Brand name is required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Image file is required');
  }
  // Add brand name to config if not exists
  await addToConfig('brands', name);

  res.json({ 
    message: 'Brand logo uploaded successfully', 
    name: name,
    logoPath: `/uploads/brands/${req.file.filename}` 
  });
});

// @desc    Upload banner image
// @route   POST /api/admin/upload/banner
// @access  Private/Admin
const uploadBanner = asyncHandler(async (req, res) => {
  const config = await getConfig();
  const heroHeading = req.body.heroHeading?.trim() || '';
  const heroSubheading = req.body.heroSubheading?.trim() || '';

  if (!req.file && !heroHeading && !heroSubheading) {
    res.status(400);
    throw new Error('Banner image, heading, or subheading is required');
  }

  if (req.file) {
    const bannerPath = `/uploads/banners/${req.file.filename}`;
    config.banner = bannerPath;
  }

  config.heroHeading = heroHeading;
  config.heroSubheading = heroSubheading;
  await updateConfig(config);

  res.json({
    message: 'Banner settings updated successfully',
    bannerPath: config.banner,
    heroHeading: config.heroHeading,
    heroSubheading: config.heroSubheading,
  });
});

// @desc    Get user document
// @route   GET /api/admin/users/:userId/documents/:docType
// @access  Private/Admin
const getDocument = asyncHandler(async (req, res) => {
  const { userId, docType } = req.params;
  const filename = `${userId}-${docType}.pdf`;
  const filePath = path.resolve(__dirname, '..', 'uploads', 'documents', filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404);
    throw new Error('Document not found');
  }
});

// @desc    Get configuration (includes banner path)
// @route   GET /api/admin/config
// @access  Private/Admin
const getConfigController = asyncHandler(async (req, res) => {
  const config = await getConfig();
  res.json(config);
});


export { getUsers, updateUserStatus, toggleMaintenanceMode, getMaintenanceStatus, uploadBrandLogo, uploadBanner, getDocument, getConfigController };
