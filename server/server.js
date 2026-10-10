const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/stores', storeRoutes);
app.use('/api/stores/:slug/products', productRoutes);
app.use('/api/stores/:slug/orders', orderRoutes);
app.use('/api/stores/:slug/chatbot', chatbotRoutes);
app.use('/api/ai', chatbotRoutes);

// Health check: verify that the server is responding
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LaunchX API is running',
    database:
      require('mongoose').connection.readyState === 1
        ? 'connected'
        : 'disconnected',
  });
});

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

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
  });
});

// Start server only after the database connects
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB Atlas connected successfully');

    await seedDatabase();
    console.log('Database seeding completed');

    app.listen(PORT, () => {
      console.log('\n==============================================');
      console.log('🚀 LaunchX Engine is running!');
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
      console.log(`🎨 Design System: http://localhost:${PORT}/design-system`);
      console.log(`🏬 Sample Store: http://localhost:${PORT}/store/urban-threads`);
      console.log(`⚙️ Admin: http://localhost:${PORT}/admin?store=urban-threads`);
      console.log('==============================================\n');
    });
  } catch (err) {
    console.error('Failed to start LaunchX:', err.message);
    process.exitCode = 1;
  }
};

startServer();