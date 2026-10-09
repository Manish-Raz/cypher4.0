const express = require('express');
const router = express.Router({ mergeParams: true });
const Product = require('../models/Product');
const Store = require('../models/Store');

// Realistic dummy product pool by category
const dummyCategoryMap = {
  'Hoodies & Jackets': [
    { name: 'Apex Tech Windbreaker', price: 129, stock: 15, img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80', desc: 'Waterproof shell with tactical stash pockets and taped seams.', variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Heavyweight Studio Hoodie', price: 84, stock: 22, img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80', desc: '500 GSM luxury looped terry with drop-shoulder fit.', variants: [{ name: 'Size', options: ['M', 'L', 'XL'] }] }
  ],
  'Graphic Tees': [
    { name: 'Hyperdrive Vintage Washed Tee', price: 42, stock: 18, img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', desc: 'Hand-dyed washed cotton with high-definition graphic.', variants: [{ name: 'Size', options: ['S', 'M', 'L'] }] },
    { name: 'Monochrome Typography Tee', price: 38, stock: 20, img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', desc: 'Clean typographic layout on breathable organic cotton.', variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }] }
  ],
  'Sourdough & Breads': [
    { name: 'Rustic Seeded Sourdough', price: 9.50, stock: 25, img: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80', desc: 'Crusted with toasted flaxseed, sesame, and sunflower seeds.', variants: [{ name: 'Cut', options: ['Whole', 'Sliced'] }] },
    { name: 'San Francisco Style French Batard', price: 7.75, stock: 18, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', desc: 'Tangy and airy crumb with a blistered golden exterior.', variants: [] }
  ],
  'French Pastries': [
    { name: 'Traditional Chocolate Éclair', price: 5.50, stock: 14, img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', desc: 'Filled with velvety dark chocolate pastry cream.', variants: [] },
    { name: 'Pistachio Raspberry Tart', price: 6.95, stock: 10, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', desc: 'Crisp sable shell with roasted pistachio ganache.', variants: [] }
  ],
  'Electronics & Gadgets': [
    { name: 'Acoustic Pro Wireless Headphones', price: 199.99, stock: 12, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', desc: 'Active noise cancellation with 40-hour high fidelity battery.', variants: [{ name: 'Color', options: ['Matte Black', 'Silver'] }] },
    { name: 'Mechanical RGB Hot-Swap Keyboard', price: 129.00, stock: 8, img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', desc: 'Gateron Yellow linear switches with sound dampening foam.', variants: [{ name: 'Switches', options: ['Linear', 'Tactile'] }] }
  ],
  'Home & Living': [
    { name: 'Ceramic Pour-Over Carafe Set', price: 48.00, stock: 16, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', desc: 'Handcrafted stoneware carafe with reusable stainless filter.', variants: [] },
    { name: 'Amber Glass Botanical Candle', price: 26.00, stock: 24, img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80', desc: '100% natural soy wax infused with cedarwood and wild fig.', variants: [{ name: 'Scent', options: ['Cedarwood & Fig', 'Smoked Amber'] }] }
  ],
  'Beauty & Skincare': [
    { name: 'Botanical Barrier Repair Serum', price: 54.00, stock: 20, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', desc: 'Ceramide complex formulated to replenish deep hydration.', variants: [] },
    { name: 'Gentle Rose Cleansing Balm', price: 34.00, stock: 15, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', desc: 'Melt-away cleansing balm enriched with damask rose extract.', variants: [] }
  ]
};

// Generic fallback products if category has no specific pre-defined items
const genericPool = [
  { name: 'Signature Handcrafted Item', price: 39.00, stock: 15, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', desc: 'Premium quality daily essential designed for longevity.', variants: [] },
  { name: 'Limited Edition Artisan Piece', price: 65.00, stock: 8, img: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80', desc: 'Crafted in limited batches using sustainable materials.', variants: [] },
  { name: 'Everyday Minimalist Essential', price: 24.50, stock: 20, img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80', desc: 'Clean, understated design for modern lifestyles.', variants: [] }
];

// GET products for a store
router.get('/', async (req, res) => {
  try {
    const { slug } = req.params;
    const { category, search, sort, status } = req.query;

    const query = { storeSlug: slug.toLowerCase() };

    if (category && category !== 'All' && category !== 'All Products') {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'name_asc') sortOptions = { name: 1 };
    if (sort === 'stock_asc') sortOptions = { stock: 1 };

    const products = await Product.find(query).sort(sortOptions);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const product = await Product.findOne({ _id: id, storeSlug: slug.toLowerCase() });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const {
      name,
      description,
      price,
      compareAtPrice,
      category,
      sku,
      stock,
      images,
      variants,
      status
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and price are required' });
    }

    const newProduct = await Product.create({
      storeSlug: store.slug,
      storeId: store._id,
      name: name.trim(),
      description: description || '',
      price: Number(price),
      compareAtPrice: Number(compareAtPrice) || 0,
      category: category || (store.categories[0] || 'General'),
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      stock: Number(stock) >= 0 ? Number(stock) : 10,
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
      variants: Array.isArray(variants) ? variants : [],
      status: status || 'active',
    });

    // Automatically ensure category is listed in store
    if (newProduct.category && !store.categories.includes(newProduct.category)) {
      store.categories.push(newProduct.category);
      await store.save();
    }

    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const updateData = req.body;
    delete updateData.storeSlug;
    delete updateData.storeId;

    const updated = await Product.findOneAndUpdate(
      { _id: id, storeSlug: slug.toLowerCase() },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const deleted = await Product.findOneAndDelete({ _id: id, storeSlug: slug.toLowerCase() });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST bulk update products (Checkpoint 10)
router.post('/bulk', async (req, res) => {
  try {
    const { slug } = req.params;
    const { action, value, productIds } = req.body;

    const filter = { storeSlug: slug.toLowerCase() };
    if (Array.isArray(productIds) && productIds.length > 0) {
      filter._id = { $in: productIds };
    }

    if (action === 'increase_price') {
      const pct = Number(value) || 10;
      const products = await Product.find(filter);
      for (const p of products) {
        p.price = Math.round((p.price * (1 + pct / 100)) * 100) / 100;
        await p.save();
      }
      return res.json({ success: true, message: `Prices increased by ${pct}% for ${products.length} products` });
    }

    if (action === 'decrease_price') {
      const pct = Number(value) || 10;
      const products = await Product.find(filter);
      for (const p of products) {
        p.price = Math.max(1, Math.round((p.price * (1 - pct / 100)) * 100) / 100);
        await p.save();
      }
      return res.json({ success: true, message: `Prices decreased by ${pct}% for ${products.length} products` });
    }

    if (action === 'set_stock') {
      const newStock = Math.max(0, Number(value) || 20);
      const result = await Product.updateMany(filter, { $set: { stock: newStock } });
      return res.json({ success: true, message: `Stock set to ${newStock} for ${result.modifiedCount} products` });
    }

    res.status(400).json({ success: false, message: 'Unknown bulk action' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST dummy product import (Checkpoint 3: One-click fill)
router.post('/dummy-import', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const { categories } = req.body;
    const targetCats = Array.isArray(categories) && categories.length > 0 ? categories : store.categories;

    const itemsToCreate = [];

    targetCats.forEach(cat => {
      if (cat === 'All' || cat === 'All Products') return;
      const pool = dummyCategoryMap[cat] || genericPool;
      pool.forEach((template, idx) => {
        itemsToCreate.push({
          storeSlug: store.slug,
          storeId: store._id,
          name: `${template.name} (${cat.slice(0, 4)})`,
          description: template.desc,
          price: template.price,
          compareAtPrice: template.price > 40 ? Math.round(template.price * 1.25) : 0,
          category: cat,
          sku: `${cat.slice(0, 3).toUpperCase()}-${idx + 101}`,
          stock: Math.floor(Math.random() * 25) + 5,
          images: [template.img],
          variants: template.variants || [],
          status: 'active'
        });
      });
    });

    if (itemsToCreate.length === 0) {
      // Add default generic items
      genericPool.forEach((template, idx) => {
        itemsToCreate.push({
          storeSlug: store.slug,
          storeId: store._id,
          name: template.name,
          description: template.desc,
          price: template.price,
          compareAtPrice: 0,
          category: store.categories[0] || 'General',
          sku: `GEN-${idx + 101}`,
          stock: 15,
          images: [template.img],
          variants: template.variants || [],
          status: 'active'
        });
      });
    }

    const created = await Product.insertMany(itemsToCreate);

    res.json({
      success: true,
      message: `Successfully imported ${created.length} sample products!`,
      count: created.length,
      products: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET downloadable CSV template (Checkpoint 4)
router.get('/csv-template', (req, res) => {
  const csvContent =
`Name,Price,Category,Stock,SKU,Description,CompareAtPrice,ImageUrl
"Organic Cotton Crewneck",48.00,"Apparel",25,"APP-001","Soft brushed organic cotton fleece sweater",60.00,"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600"
"Minimal Ceramic Coffee Mug",22.00,"Home",15,"HOM-002","Wheel-thrown speckled clay 12oz mug",0,"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"
"Artisan Roasted Whole Beans",18.50,"Coffee",40,"COF-003","Medium roast with chocolate & hazelnut notes",22.00,"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600"`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.csv"');
  res.send(csvContent);
});

// POST CSV import with column mapping and clear error reporting (Checkpoint 4)
router.post('/csv-import', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const { rows } = req.body; // Array of row objects from client CSV parser
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No CSV rows provided' });
    }

    const validProducts = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const name = (row.Name || row.name || row['Product Name'] || '').trim();
      const rawPrice = row.Price || row.price;
      const category = (row.Category || row.category || 'General').trim();
      const rawStock = row.Stock || row.stock;
      const sku = (row.SKU || row.sku || '').trim();
      const description = (row.Description || row.description || '').trim();
      const rawCompareAtPrice = row.CompareAtPrice || row.compareAtPrice || 0;
      const imageUrl = (row.ImageUrl || row.imageUrl || row.Image || '').trim();

      // Row validation
      if (!name) {
        errors.push({ row: rowNum, error: 'Missing product name' });
        return;
      }

      const price = parseFloat(rawPrice);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, error: `Invalid price "${rawPrice}": must be a positive number` });
        return;
      }

      let stock = parseInt(rawStock, 10);
      if (isNaN(stock) || stock < 0) {
        stock = 10; // fallback default
      }

      const compareAtPrice = parseFloat(rawCompareAtPrice) || 0;

      validProducts.push({
        storeSlug: store.slug,
        storeId: store._id,
        name,
        description,
        price,
        compareAtPrice,
        category,
        sku: sku || `SKU-${Date.now().toString().slice(-4)}-${index}`,
        stock,
        images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
        variants: [],
        status: 'active'
      });
    });

    let insertedCount = 0;
    if (validProducts.length > 0) {
      const created = await Product.insertMany(validProducts);
      insertedCount = created.length;

      // Update store categories if new categories were in the CSV
      const newCats = [...new Set(validProducts.map(p => p.category))];
      for (const nc of newCats) {
        if (!store.categories.includes(nc)) {
          store.categories.push(nc);
        }
      }
      await store.save();
    }

    res.json({
      success: true,
      message: `Import processed: ${insertedCount} imported successfully, ${errors.length} rows had errors.`,
      importedCount,
      errorsCount: errors.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
