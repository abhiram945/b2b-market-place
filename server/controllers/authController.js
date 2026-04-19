import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import { ROLES, USER_STATUS, ROLE_REQUEST_STATUS } from '../utils/constants.js';
import { addToConfig, getConfig } from '../utils/appConfigStore.js';

const normalizeString = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, companyName, address, phoneNumber, role, website } = req.body;

  const normalizedEmail = normalizeString(email);
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const selectedRole = normalizeString(role) || ROLES.BUYER;

  // Strict check for file uploads during registration
  const tradeLicenseUploaded = !!req.files?.tradeLicense;
  const idDocumentUploaded = !!req.files?.idDocument;
  const vatRegistrationUploaded = !!req.files?.vatRegistration;

  if ((selectedRole === ROLES.VENDOR || selectedRole === ROLES.BUYER) && (!tradeLicenseUploaded || !idDocumentUploaded || !vatRegistrationUploaded)) {
    res.status(400);
    throw new Error('Trade License, ID Document, and VAT Registration certificates are required');
  }

  const user = await User.create({
    _id: req.registrationUserId,
    fullName: normalizeString(fullName),
    email: normalizedEmail,
    password,
    companyName: normalizeString(companyName),
    address: normalizeString(address),
    roles: [selectedRole],
    activeRole: selectedRole,
    phoneNumber: normalizeString(phoneNumber),
    website: normalizeString(website),
  });

  if (user) {
    if (companyName) {
      await addToConfig('companyNames', companyName);
    }
    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = normalizeString(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(password))) {
    if (user.status === USER_STATUS.PENDING) {
      res.status(401);
      throw new Error('Your account is pending approval');
    }

    if (user.status === USER_STATUS.REJECTED) {
      res.status(401);
      throw new Error('Your account has been rejected');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      address: user.address,
      activeRole: user.activeRole,
      roles: user.roles,
      roleRequest: user.roleRequest,
      status: user.status,
      token: accessToken,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no refresh token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded._id);
    
    if (!user) {
        res.status(401);
        throw new Error('User not found');
    }

    const refreshUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      address: user.address,
      activeRole: user.activeRole,
      roles: user.roles,
      status: user.status,
      website: user.website,
    };

    const accessToken = generateToken(refreshUser);
    res.json({ token: accessToken, user: refreshUser });
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, refresh token failed');
  }
});

// @desc    Switch active role
// @route   PUT /api/auth/switch-role
// @access  Private
const switchRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.roles.includes(role)) {
        res.status(400);
        throw new Error('You do not possess this role');
    }

    user.activeRole = role;
    await user.save();

    const accessToken = generateToken(user);
    res.json({
        activeRole: user.activeRole,
        roles: user.roles,
        token: accessToken
    });
});

// @desc    Request for a new portal (buyer/vendor)
// @route   POST /api/auth/request-role
// @access  Private
const requestRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.user._id);

    if (user.roles.includes(role)) {
        res.status(400);
        throw new Error('You already have access to this portal');
    }

    if (user.roleRequest && user.roleRequest.status === ROLE_REQUEST_STATUS.PENDING) {
        res.status(400);
        throw new Error('You already have a pending request');
    }

    user.roleRequest = {
        requestedRole: role,
        status: ROLE_REQUEST_STATUS.PENDING,
        requestDate: new Date()
    };

    await user.save();
    res.json({ message: 'Request submitted successfully. Admin will review it soon.' });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      address: user.address,
      activeRole: user.activeRole,
      roles: user.roles,
      roleRequest: user.roleRequest,
      status: user.status,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
  });
  
const getRegisterConfig = asyncHandler(async (req, res) => {
    const config = await getConfig();
    res.json({ companyNames: config.companyNames });
});

const getDashboardConfig = asyncHandler(async (req, res) => {
    const config = await getConfig();
    res.json({
        banner: config.banner || '/uploads/banners/user-dashboard-banner.png',
        heroHeading: config.heroHeading || '',
        heroSubheading: config.heroSubheading || '',
    });
});

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getUserProfile, 
    refreshToken, 
    getRegisterConfig, 
    getDashboardConfig,
    switchRole,
    requestRole
};
