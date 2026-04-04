import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import { ROLES, USER_STATUS } from '../utils/constants.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, companyName, address, phoneNumber, role, website } = req.body;
  console.log(`[AUTH] Registration attempt for email: ${email}`);

  const userExists = await User.findOne({ email: email.toLowerCase() });

  if (userExists) {
    console.warn(`[AUTH] Registration failed: User ${email} already exists`);
    res.status(400);
    throw new Error('User already exists');
  }

  const selectedRole = role || ROLES.BUYER;

  if (selectedRole === ROLES.BUYER && !address) {
    res.status(400);
    throw new Error('Address is required for buyers');
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    companyName,
    address,
    role: selectedRole,
    phoneNumber,
    website,
  });

  if (user) {
    console.log(`[AUTH] Registration successful for email: ${email}`);
    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
    });
  } else {
    console.error(`[AUTH] Registration failed: Invalid user data for ${email}`);
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt for email: ${email}`);

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && (await user.matchPassword(password))) {
    if (user.status === USER_STATUS.PENDING) {
      console.warn(`[AUTH] Login blocked: Account ${email} is pending approval`);
      res.status(401);
      throw new Error('Your account is pending approval');
    }

    if (user.status === USER_STATUS.REJECTED) {
      console.warn(`[AUTH] Login blocked: Account ${email} is rejected`);
      res.status(401);
      throw new Error('Your account has been rejected');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' for local development compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      address: user.address,
      role: user.role,
      status: user.status,
      token: accessToken,
    });
    console.log(`[AUTH] Login successful for user: ${email} (${user.role})`);
  } else {
    console.warn(`[AUTH] Login failed: Invalid credentials for ${email}`);
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  console.log(`[AUTH] Logout request received`);
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    console.warn(`[AUTH] Refresh failed: No refresh token in cookies`);
    res.status(401);
    throw new Error('Not authorized, no refresh token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      console.error(`[AUTH] Refresh failed: User not found for ID ${decoded._id}`);
      res.status(401);
      throw new Error('User not found');
    }

    const accessToken = generateToken(user);
    console.log(`[AUTH] Token refresh successful for user: ${user.email}`);
    res.json({ token: accessToken });
  } catch (error) {
    console.error(`[AUTH] Refresh failed: Invalid or expired refresh token: ${error.message}`);
    res.status(401);
    throw new Error('Not authorized, refresh token failed');
  }
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
      role: user.role,
      status: user.status,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { registerUser, loginUser, logoutUser, getUserProfile, refreshToken };
