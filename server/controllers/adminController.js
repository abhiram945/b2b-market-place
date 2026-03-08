import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { sendEmail, sendWhatsApp } from '../utils/notificationSender.js';
import { USER_STATUS } from '../utils/constants.js';

// @desc    Get all users (with optional status filter)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  console.log("2. AdminController: 'getUsers' function called.");
  const { status } = req.query;
  const filter = status ? { status } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }); // Sort by creation date, newest first
  console.log(`4. AdminController: Sending users data (filtered by status: ${status || 'all'}):`, users.length);
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

    // Send notification
    if (status === USER_STATUS.APPROVED || status === USER_STATUS.REJECTED) {
      const subject = `Your Account has been ${status}`;
      const message = `Hi ${user.fullName}, your registration on the B2B marketplace has been ${status}.`;
      
      await sendEmail(user.email, subject, message);

      if (user.phoneNumber) {
        await sendWhatsApp(user.phoneNumber, message);
      }
    }

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { getUsers, updateUserStatus };
