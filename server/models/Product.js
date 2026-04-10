import mongoose from 'mongoose';

const lowerTrim = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: { type: String, required: true, set: lowerTrim },
    brand: { type: String, required: true, set: lowerTrim },
    category: { type: String, required: true, set: lowerTrim },
    location: { type: String, required: true, set: lowerTrim },
    price: { type: Number, required: true, default: 0 },
    condition: { type: String, required: true, set: lowerTrim },
    minOrderQty: { type: Number, required: true },
    maxOrderQty: { type: Number, required: true },
    stockQty: { type: Number, required: true, default: 0 },
    isStockEnabled: { type: Boolean, default: true },
    eta: { type: Number, required: false },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ user: 1, createdAt: -1 });
productSchema.index({ brand: 1, category: 1, location: 1 });
productSchema.index({ title: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
