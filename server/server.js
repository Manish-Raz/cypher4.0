require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedDatabase = require('./seed/seedData');

const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/stores', storeRoutes);
app.use('/api/stores/:slug/products', productRoutes);
app.use('/api/stores/:slug/orders', orderRoutes);
app.use('/api/stores/:slug/chatbot', chatbotRoutes);

// Friendly HTML Routes
app.get('/store/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'store.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/admin/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'editor.html'));
});

app.get('/editor/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'editor.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/design-system', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'design-system.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Start server and connect DB
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 LaunchX Engine is running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`✨ Onboarding Wizard: http://localhost:${PORT}/`);
      console.log(`🎨 Design System:    http://localhost:${PORT}/design-system`);
      console.log(`🏬 Sample Store 1:   http://localhost:${PORT}/store/urban-threads`);
      console.log(`🥐 Sample Store 2:   http://localhost:${PORT}/store/artisan-bakery`);
      console.log(`⚙️  Admin Dashboard:  http://localhost:${PORT}/admin?store=urban-threads`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
