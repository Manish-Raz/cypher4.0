require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');

const sampleStores = [
  {
    name: 'Urban Vibe Streetwear',
    slug: 'urban-threads',
    businessType: 'Fashion & Streetwear',
    contactEmail: 'support@urbanvibestore.com',
    contactPhone: '+1 (555) 392-8811',
    address: '428 Mercer Street, Soho, New York, NY',
    logoUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80',
    categories: ['Hoodies & Jackets', 'Graphic Tees', 'Cargo & Pants', 'Accessories'],
    theme: {
      id: 'cyber',
      name: 'Cyber Streetwear / Bold Dark',
      primaryColor: '#6366f1',
      secondaryColor: '#ec4899',
      fontFamily: "'Space Grotesk', sans-serif",
      borderRadius: '6px',
      bannerTitle: 'DROP 04 / LIMITLESS METROPOLIS',
      bannerSubtitle: 'Heavyweight oversized silhouettes and weather-resistant tech fabrics engineered for the street.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
      footerText: '© 2026 Urban Vibe Apparel Corp. All rights reserved.'
    },
    isPublished: true,
  },
  {
    name: 'Golden Crust Artisan Bakery',
    slug: 'artisan-bakery',
    businessType: 'Gourmet Food & Bakery',
    contactEmail: 'hello@goldencrustbakery.com',
    contactPhone: '+1 (555) 749-3320',
    address: '14 Elmwood Lane, Portland, OR',
    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80',
    categories: ['Sourdough & Breads', 'French Pastries', 'Artisan Coffee', 'Gift Boxes'],
    theme: {
      id: 'organic',
      name: 'Organic Artisan / Warm',
      primaryColor: '#b45309',
      secondaryColor: '#15803d',
      fontFamily: "'Playfair Display', serif",
      borderRadius: '16px',
      bannerTitle: 'Freshly Baked at Dawn Every Morning',
      bannerSubtitle: 'Slow-fermented wild yeast sourdoughs and delicate butter-laminated viennoiserie.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
      footerText: '© 2026 Golden Crust Artisan Bakery. Baked with love & sourdough.'
    },
    isPublished: true,
  }
];

const urbanProducts = [
  {
    name: 'Cyber Matrix Tech Windbreaker',
    description: 'Triple-layer waterproof breathable shell with magnetic utility straps and matte black hardware.',
    price: 139.00,
    compareAtPrice: 175.00,
    category: 'Hoodies & Jackets',
    sku: 'UV-JKT-001',
    stock: 12,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }],
  },
  {
    name: 'Heavyweight Heavy Acid Hoodie',
    description: '480 GSM organic cotton french terry with custom distressing and raw hem finish.',
    price: 89.00,
    compareAtPrice: 110.00,
    category: 'Hoodies & Jackets',
    sku: 'UV-HOD-002',
    stock: 24,
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Size', options: ['M', 'L', 'XL'] }],
  },
  {
    name: 'Sub-Zero Oversized Graphic Tee',
    description: 'High-density screenprint on vintage enzyme-washed single jersey. Drop-shoulder relaxed boxy cut.',
    price: 45.00,
    compareAtPrice: 0,
    category: 'Graphic Tees',
    sku: 'UV-TEE-003',
    stock: 4, // low stock!
    images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Size', options: ['S', 'M', 'L'] }],
  },
  {
    name: 'Modular Tactical Cargo Joggers',
    description: 'Reinforced ripstop nylon with 6 ergonomic utility pockets, D-ring accents, and tapered ankles.',
    price: 98.00,
    compareAtPrice: 125.00,
    category: 'Cargo & Pants',
    sku: 'UV-PNT-004',
    stock: 18,
    images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Size', options: ['30', '32', '34'] }],
  },
  {
    name: 'Neon Horizon Crossbody Rig',
    description: 'Cordura ballistic nylon waist / shoulder sling bag with waterproof YKK aquaguard zippers.',
    price: 52.00,
    compareAtPrice: 65.00,
    category: 'Accessories',
    sku: 'UV-ACC-005',
    stock: 3, // low stock!
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Color', options: ['Stealth Black', 'Cyber Violet'] }],
  },
  {
    name: 'Reflective Low-Profile Beanie',
    description: 'Ribbed merino wool blend featuring interwoven 3M reflective yarn for night visibility.',
    price: 29.00,
    compareAtPrice: 0,
    category: 'Accessories',
    sku: 'UV-ACC-006',
    stock: 35,
    images: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Color', options: ['Black', 'Slate Grey'] }],
  }
];

const bakeryProducts = [
  {
    name: 'Heritage Country Sourdough Boule',
    description: '48-hour cold-fermented loaf using stoneground heirloom wheat and natural levain with a dark blistered crust.',
    price: 8.50,
    compareAtPrice: 0,
    category: 'Sourdough & Breads',
    sku: 'BK-SDR-101',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Style', options: ['Whole Boule', 'Pre-Sliced'] }],
  },
  {
    name: 'Pure Butter French Croissant (4-Pack)',
    description: 'Hand-laminated with Normandy AOP butter, achieving 81 delicate layers of flaky, golden perfection.',
    price: 14.00,
    compareAtPrice: 16.00,
    category: 'French Pastries',
    sku: 'BK-PAS-102',
    stock: 2, // low stock!
    images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Type', options: ['Butter Classic', 'Pain Au Chocolat'] }],
  },
  {
    name: 'Cardamom & Cinnamon Morning Bun',
    description: 'Swirled croissant pastry tossed in fragrant green cardamom sugar and Ceylon cinnamon.',
    price: 4.75,
    compareAtPrice: 0,
    category: 'French Pastries',
    sku: 'BK-PAS-103',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'],
    variants: [],
  },
  {
    name: 'Single-Origin Ethiopian Cold Brew Beans',
    description: 'Whole bean coffee roasted light-medium with tasting notes of bergamot, peach nectar, and wild honey.',
    price: 19.50,
    compareAtPrice: 22.00,
    category: 'Artisan Coffee',
    sku: 'BK-COF-104',
    stock: 40,
    images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80'],
    variants: [{ name: 'Grind', options: ['Whole Bean', 'French Press', 'Drip'] }],
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Checking existing stores...');

    const existingCount = await Store.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed] Database already contains ${existingCount} stores. Preserving existing data.`);
      return;
    }

    console.log('[Seed] Seeding sample stores, products, and orders...');

    // 1. Urban Threads
    const store1 = await Store.create(sampleStores[0]);
    const createdUrbanProducts = await Product.insertMany(
      urbanProducts.map(p => ({ ...p, storeSlug: store1.slug, storeId: store1._id }))
    );

    // Urban Threads Orders
    await Order.insertMany([
      {
        storeSlug: store1.slug,
        orderNumber: '#ORD-801',
        customer: {
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          phone: '+1 555-234-9988',
          address: '742 Broadway St Apt 4B',
          city: 'New York',
          postalCode: '10003'
        },
        items: [
          {
            productId: String(createdUrbanProducts[0]._id),
            name: createdUrbanProducts[0].name,
            price: createdUrbanProducts[0].price,
            quantity: 1,
            selectedVariant: 'Size: L',
            image: createdUrbanProducts[0].images[0]
          },
          {
            productId: String(createdUrbanProducts[2]._id),
            name: createdUrbanProducts[2].name,
            price: createdUrbanProducts[2].price,
            quantity: 2,
            selectedVariant: 'Size: M',
            image: createdUrbanProducts[2].images[0]
          }
        ],
        subtotal: 229.00,
        shippingFee: 0,
        tax: 18.32,
        total: 247.32,
        status: 'shipped',
        paymentMethod: 'Credit Card (Stripe)',
        timeline: [
          { status: 'placed', timestamp: new Date(Date.now() - 3600000 * 48), note: 'Order placed by customer' },
          { status: 'packed', timestamp: new Date(Date.now() - 3600000 * 36), note: 'Items packed in warehouse' },
          { status: 'shipped', timestamp: new Date(Date.now() - 3600000 * 24), note: 'Dispatched via FedEx Express #FX-992144' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 48)
      },
      {
        storeSlug: store1.slug,
        orderNumber: '#ORD-802',
        customer: {
          name: 'Maya Chen',
          email: 'maya.chen@example.com',
          phone: '+1 555-891-2309',
          address: '1240 Pine St',
          city: 'San Francisco',
          postalCode: '94109'
        },
        items: [
          {
            productId: String(createdUrbanProducts[1]._id),
            name: createdUrbanProducts[1].name,
            price: createdUrbanProducts[1].price,
            quantity: 1,
            selectedVariant: 'Size: XL',
            image: createdUrbanProducts[1].images[0]
          }
        ],
        subtotal: 89.00,
        shippingFee: 10.00,
        tax: 7.12,
        total: 106.12,
        status: 'delivered',
        paymentMethod: 'Apple Pay',
        timeline: [
          { status: 'placed', timestamp: new Date(Date.now() - 3600000 * 96), note: 'Order placed' },
          { status: 'packed', timestamp: new Date(Date.now() - 3600000 * 80), note: 'Packed' },
          { status: 'shipped', timestamp: new Date(Date.now() - 3600000 * 60), note: 'Shipped via UPS' },
          { status: 'delivered', timestamp: new Date(Date.now() - 3600000 * 12), note: 'Delivered to front porch' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 96)
      },
      {
        storeSlug: store1.slug,
        orderNumber: '#ORD-803',
        customer: {
          name: 'Marcus Vance',
          email: 'marcus.v@example.com',
          phone: '+1 555-430-1172',
          address: '502 Michigan Ave',
          city: 'Chicago',
          postalCode: '60611'
        },
        items: [
          {
            productId: String(createdUrbanProducts[3]._id),
            name: createdUrbanProducts[3].name,
            price: createdUrbanProducts[3].price,
            quantity: 1,
            selectedVariant: 'Size: 32',
            image: createdUrbanProducts[3].images[0]
          },
          {
            productId: String(createdUrbanProducts[4]._id),
            name: createdUrbanProducts[4].name,
            price: createdUrbanProducts[4].price,
            quantity: 1,
            selectedVariant: 'Color: Stealth Black',
            image: createdUrbanProducts[4].images[0]
          }
        ],
        subtotal: 150.00,
        shippingFee: 0,
        tax: 12.00,
        total: 162.00,
        status: 'placed',
        paymentMethod: 'Credit Card',
        timeline: [
          { status: 'placed', timestamp: new Date(Date.now() - 3600000 * 2), note: 'Order received and awaiting warehouse review' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 2)
      }
    ]);

    // 2. Bakery Store
    const store2 = await Store.create(sampleStores[1]);
    const createdBakeryProducts = await Product.insertMany(
      bakeryProducts.map(p => ({ ...p, storeSlug: store2.slug, storeId: store2._id }))
    );

    // Bakery Orders
    await Order.insertMany([
      {
        storeSlug: store2.slug,
        orderNumber: '#ORD-201',
        customer: {
          name: 'Sarah Jenkins',
          email: 'sjenkins@example.com',
          phone: '+1 555-888-2199',
          address: '22 Hawthorne Blvd',
          city: 'Portland',
          postalCode: '97214'
        },
        items: [
          {
            productId: String(createdBakeryProducts[0]._id),
            name: createdBakeryProducts[0].name,
            price: createdBakeryProducts[0].price,
            quantity: 2,
            selectedVariant: 'Style: Whole Boule',
            image: createdBakeryProducts[0].images[0]
          },
          {
            productId: String(createdBakeryProducts[1]._id),
            name: createdBakeryProducts[1].name,
            price: createdBakeryProducts[1].price,
            quantity: 1,
            selectedVariant: 'Type: Butter Classic',
            image: createdBakeryProducts[1].images[0]
          }
        ],
        subtotal: 31.00,
        shippingFee: 5.00,
        tax: 0,
        total: 36.00,
        status: 'delivered',
        paymentMethod: 'Contactless Card',
        timeline: [
          { status: 'placed', timestamp: new Date(Date.now() - 3600000 * 8), note: 'Morning order placed' },
          { status: 'delivered', timestamp: new Date(Date.now() - 3600000 * 4), note: 'Handed to customer at store pickup' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 8)
      }
    ]);

    console.log('[Seed] Database successfully populated with 2 sample stores!');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('[Seed] Done.');
    process.exit(0);
  });
}

module.exports = seedDatabase;
