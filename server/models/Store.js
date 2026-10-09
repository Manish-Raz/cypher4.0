const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Store slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  businessType: {
    type: String,
    default: 'General Retail',
  },
  contactEmail: {
    type: String,
    default: 'contact@example.com',
  },
  contactPhone: {
    type: String,
    default: '+1 (555) 019-2834',
  },
  address: {
    type: String,
    default: '100 Market Street, Suite 400',
  },
  logoUrl: {
    type: String,
    default: '',
  },
  categories: {
    type: [String],
    default: ['All', 'Featured'],
  },
  theme: {
    id: { type: String, default: 'modern' }, // 'modern', 'cyber', 'luxury', 'organic'
    name: { type: String, default: 'Modern Minimalist' },
    primaryColor: { type: String, default: '#4f46e5' },
    secondaryColor: { type: String, default: '#06b6d4' },
    fontFamily: { type: String, default: "'Inter', sans-serif" },
    borderRadius: { type: String, default: '10px' },
    bannerTitle: { type: String, default: 'Welcome to our official store' },
    bannerSubtitle: { type: String, default: 'Curated premium items crafted for discerning tastes.' },
    bannerImageUrl: { type: String, default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80' },
    footerText: { type: String, default: 'Crafted with Launch-Your-Store. All rights reserved.' }
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Store', StoreSchema);
