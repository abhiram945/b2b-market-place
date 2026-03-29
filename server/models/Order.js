import mongoose from 'mongoose';
import { ORDER_STATUS } from '../utils/constants.js';

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        productTitle: { type: String, required: true },
        productBrand: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        location: { type: String, required: true },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User',
        },
      }
    ],
    totalPrice: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    invoiceUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
