const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  storeSlug: {
    type: String,
    required: true,
    index: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  compareAtPrice: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: 'General',
    index: true,
  },
  sku: {
    type: String,
    default: '',
  },
  stock: {
    type: Number,
    default: 15,
    min: 0,
  },
  images: {
    type: [String],
    default: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
  },
  variants: [
    {
      name: { type: String }, // e.g. "Size"
      options: [{ type: String }], // e.g. ["S", "M", "L", "XL"]
    }
  ],
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

ProductSchema.index({ storeSlug: 1, category: 1 });
ProductSchema.index({ storeSlug: 1, name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
