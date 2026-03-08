
import mongoose from 'mongoose';

const notificationSubscriptionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    productTitle: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['price', 'stock'],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const NotificationSubscription = mongoose.model(
  'NotificationSubscription',
  notificationSubscriptionSchema
);

export default NotificationSubscription;
