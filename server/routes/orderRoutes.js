const express = require('express');
const router = express.Router({ mergeParams: true });
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');

// GET all orders for this store
router.get('/', async (req, res) => {
  try {
    const { slug } = req.params;
    const { status, limit } = req.query;

    const query = { storeSlug: slug.toLowerCase() };
    if (status && status !== 'all') {
      query.status = status;
    }

    const ordersQuery = Order.find(query).sort({ createdAt: -1 });
    if (limit) {
      ordersQuery.limit(parseInt(limit, 10));
    }

    const orders = await ordersQuery;
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const order = await Order.findOne({ _id: id, storeSlug: slug.toLowerCase() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST place order (Checkout flow - Checkpoint 7 & 11)
router.post('/', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase() });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const { customer, items, paymentMethod } = req.body;

    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({ success: false, message: 'Customer name and email are required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    let subtotal = 0;
    const orderItems = [];

    // Verify products and calculate subtotal
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, storeSlug: store.slug });
      const itemPrice = product ? product.price : (Number(item.price) || 0);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = itemPrice * qty;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        name: product ? product.name : (item.name || 'Store Item'),
        price: itemPrice,
        quantity: qty,
        selectedVariant: item.selectedVariant || '',
        image: product && product.images && product.images[0] ? product.images[0] : (item.image || '')
      });

      // Deduct stock if product exists
      if (product) {
        product.stock = Math.max(0, product.stock - qty);
        await product.save();
      }
    }

    const shippingFee = subtotal > 100 ? 0 : 5.00;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await Order.create({
      storeSlug: store.slug,
      orderNumber,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || ''
      },
      items: orderItems,
      subtotal,
      shippingFee,
      tax,
      total,
      status: 'placed',
      paymentMethod: paymentMethod || 'Online Card Payment',
      timeline: [
        {
          status: 'placed',
          timestamp: new Date(),
          note: 'Customer completed order on storefront.'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update order status (Checkpoint 11: Workflow management)
router.put('/:id/status', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['placed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findOne({ _id: id, storeSlug: slug.toLowerCase() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status.toUpperCase()} by store operator.`
    });

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} status changed to ${status}`,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST send status update to customer (Checkpoint 11: Customer notifications)
router.post('/:id/notify', async (req, res) => {
  try {
    const { slug, id } = req.params;
    const order = await Order.findOne({ _id: id, storeSlug: slug.toLowerCase() });
    const store = await Store.findOne({ slug: slug.toLowerCase() });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const emailSubject = `Order Update: ${order.orderNumber} is now ${order.status.toUpperCase()}`;
    const emailBody = `Hi ${order.customer.name},

Great news from ${store ? store.name : 'our store'}!
Your order ${order.orderNumber} has been updated to "${order.status.toUpperCase()}".

Order Summary:
${order.items.map(it => `- ${it.name} (Qty: ${it.quantity}) - $${(it.price * it.quantity).toFixed(2)}`).join('\n')}

Order Total: $${order.total.toFixed(2)}
Shipping to: ${order.customer.address}, ${order.customer.city}

Thank you for shopping with us!
- The ${store ? store.name : 'Store'} Team`;

    res.json({
      success: true,
      message: `Notification simulated and ready for ${order.customer.email}`,
      notification: {
        to: order.customer.email,
        subject: emailSubject,
        body: emailBody,
        status: order.status,
        sentAt: new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET overview stats (Checkpoint 8: Dashboard overview)
router.get('/stats/overview', async (req, res) => {
  try {
    const { slug } = req.params;
    const storeSlug = slug.toLowerCase();

    const orders = await Order.find({ storeSlug });
    const products = await Product.find({ storeSlug });

    let totalRevenue = 0;
    let placedCount = 0;
    let packedCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach(o => {
      if (o.status !== 'cancelled') {
        totalRevenue += o.total;
      }
      if (o.status === 'placed') placedCount++;
      if (o.status === 'packed') packedCount++;
      if (o.status === 'shipped') shippedCount++;
      if (o.status === 'delivered') deliveredCount++;
      if (o.status === 'cancelled') cancelledCount++;
    });

    const activeOrders = placedCount + packedCount + shippedCount;
    const lowStockCount = products.filter(p => p.stock <= 5).length;
    const aov = orders.length > 0 ? (totalRevenue / (orders.length - cancelledCount || 1)) : 0;

    res.json({
      success: true,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: orders.length,
        averageOrderValue: Math.round(aov * 100) / 100,
        totalProducts: products.length,
        lowStockCount,
        activeOrders,
        statusBreakdown: {
          placed: placedCount,
          packed: packedCount,
          shipped: shippedCount,
          delivered: deliveredCount,
          cancelled: cancelledCount
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
