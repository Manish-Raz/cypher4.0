const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  storeSlug: {
    type: String,
    required: true,
    index: true,
  },
  orderNumber: {
    type: String,
    required: true,
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
  },
  items: [
    {
      productId: { type: String },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
      selectedVariant: { type: String, default: '' },
      image: { type: String, default: '' },
    }
  ],
  subtotal: {
    type: Number,
    required: true,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed',
    index: true,
  },
  paymentMethod: {
    type: String,
    default: 'Card Payment (Online)',
  },
  timeline: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      note: { type: String },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  }
}, { timestamps: true });

OrderSchema.index({ storeSlug: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
