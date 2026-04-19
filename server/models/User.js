import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../utils/constants.js';

const lowerTrim = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      set: lowerTrim,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      set: lowerTrim,
    },
    phoneNumber: {
      type: String,
      required: false, // Optional for now, but recommended for WhatsApp
      set: lowerTrim,
    },
    password: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      set: lowerTrim,
    },
    address: {
      type: String,
      required: false, // Required only for buyers, handled in controller
      set: lowerTrim,
    },
    roles: {
      type: [String],
      required: true,
      enum: Object.values(ROLES),
      default: [ROLES.BUYER],
    },
    activeRole: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
      default: ROLES.BUYER,
    },
    roleRequest: {
      requestedRole: { type: String, enum: Object.values(ROLES) },
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      requestDate: { type: Date },
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
    },
    website: {
      type: String,
      required: false,
      set: lowerTrim,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
