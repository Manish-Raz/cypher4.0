const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Helper to sanitize slug
const sanitizeSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find({}, 'name slug businessType logoUrl isPublished createdAt').sort({ createdAt: -1 });
    res.json({ success: true, stores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET store by slug
router.get('/:slug', async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create store (Onboarding Wizard)
router.post('/', async (req, res) => {
  try {
    let {
      name,
      slug,
      businessType,
      contactEmail,
      contactPhone,
      address,
      logoUrl,
      categories,
      theme
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }

    const calculatedSlug = slug ? sanitizeSlug(slug) : sanitizeSlug(name);
    if (!calculatedSlug) {
      return res.status(400).json({ success: false, message: 'Invalid store name / slug' });
    }

    // Check if slug exists
    const existing = await Store.findOne({ slug: calculatedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `The store URL slug "${calculatedSlug}" is already taken. Please pick another name or slug.`
      });
    }

    // Default theme definitions
    const themePresets = {
      modern: {
        id: 'modern',
        name: 'Modern Minimalist',
        primaryColor: '#4f46e5',
        secondaryColor: '#06b6d4',
        fontFamily: "'Inter', sans-serif",
        borderRadius: '10px',
        bannerTitle: `Welcome to ${name}`,
        bannerSubtitle: 'Discover our handpicked collection designed with passion and precision.',
        bannerImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        footerText: `© ${new Date().getFullYear()} ${name}. Powered by LaunchX.`
      },
      cyber: {
        id: 'cyber',
        name: 'Cyber Streetwear / Bold Dark',
        primaryColor: '#6366f1',
        secondaryColor: '#ec4899',
        fontFamily: "'Space Grotesk', sans-serif",
        borderRadius: '6px',
        bannerTitle: `OFFICIAL DROP // ${name.toUpperCase()}`,
        bannerSubtitle: 'Engineered for modern culture. Limited runs and premium textiles.',
        bannerImageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
        footerText: `© ${new Date().getFullYear()} ${name}. All rights reserved.`
      },
      luxury: {
        id: 'luxury',
        name: 'Luxury Elegance / Serif',
        primaryColor: '#1e293b',
        secondaryColor: '#d97706',
        fontFamily: "'Playfair Display', Georgia, serif",
        borderRadius: '4px',
        bannerTitle: `The Art of Fine Living: ${name}`,
        bannerSubtitle: 'Exclusively curated pieces reflecting timeless sophistication.',
        bannerImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
        footerText: `© ${new Date().getFullYear()} ${name}. Crafted for connoisseurs.`
      },
      organic: {
        id: 'organic',
        name: 'Organic Artisan / Warm',
        primaryColor: '#b45309',
        secondaryColor: '#15803d',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderRadius: '16px',
        bannerTitle: `Small-Batch Goodness from ${name}`,
        bannerSubtitle: 'Handcrafted with natural ingredients and honest materials.',
        bannerImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
        footerText: `© ${new Date().getFullYear()} ${name}. Made with pure passion.`
      }
    };

    const selectedThemeId = (theme && theme.id) || 'modern';
    const baseTheme = themePresets[selectedThemeId] || themePresets.modern;
    const finalTheme = {
      ...baseTheme,
      ...(theme || {})
    };

    const cleanCategories = Array.isArray(categories) && categories.length > 0
      ? categories.map(c => c.trim()).filter(Boolean)
      : ['Featured', 'All Products'];

    const newStore = await Store.create({
      name: name.trim(),
      slug: calculatedSlug,
      businessType: businessType || 'General Retail',
      contactEmail: contactEmail || 'hello@' + calculatedSlug + '.com',
      contactPhone: contactPhone || '+1 (555) 000-0000',
      address: address || '123 Commerce Way',
      logoUrl: logoUrl || '',
      categories: cleanCategories,
      theme: finalTheme,
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: 'Store created successfully!',
      store: newStore,
      liveUrl: `/store/${newStore.slug}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update store details & theme content (Checkpoint 9: Content Control)
router.put('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const updateData = req.body;

    // Do not allow slug mutation via regular update to preserve live URLs
    delete updateData.slug;
    delete updateData._id;

    const updatedStore = await Store.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.json({ success: true, message: 'Store updated successfully', store: updatedStore });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
