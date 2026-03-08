import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    condition: { type: String, required: true },
    minOrderQty: { type: Number, required: true },
    maxOrderQty: { type: Number, required: true },
    stockQty: { type: Number, required: true, default: 0 },
    isStockEnabled: { type: Boolean, default: true },
    eta: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
