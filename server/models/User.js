import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../utils/constants.js';

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: false, // Optional for now, but recommended for WhatsApp
    },
    password: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: false, // Required only for buyers, handled in controller
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
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
    },
    tradeLicense: {
      type: String,
      required: false, // Required for vendors/buyers, handled in controller
    },
    idDocument: {
      type: String,
      required: false, // Required for vendors/buyers, handled in controller
    },
    vatRegistration: {
      type: String,
      required: false, // Required for vendors/buyers, handled in controller
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
