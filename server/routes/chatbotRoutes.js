const express = require('express');
const router = express.Router({ mergeParams: true });
const Product = require('../models/Product');
const Order = require('../models/Order');
const Store = require('../models/Store');

// Safe, Grounded AI Chatbot Engine (Checkpoints 13 & 14)
router.post('/query', async (req, res) => {
  try {
    const { slug } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty' });
    }

    const storeSlug = slug.toLowerCase();
    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const q = question.toLowerCase().trim();

    // Intent 1: Top selling products
    if (q.includes('top') || q.includes('best selling') || q.includes('bestseller') || q.includes('most sold')) {
      const orders = await Order.find({ storeSlug, status: { $ne: 'cancelled' } });
      const itemStats = {};

      orders.forEach(order => {
        order.items.forEach(it => {
          if (!itemStats[it.name]) {
            itemStats[it.name] = { name: it.name, unitsSold: 0, revenue: 0, price: it.price };
          }
          itemStats[it.name].unitsSold += it.quantity;
          itemStats[it.name].revenue += (it.price * it.quantity);
        });
      });

      const sorted = Object.values(itemStats).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);

      if (sorted.length === 0) {
        return res.json({
          success: true,
          answer: `No sales transactions have been recorded yet for **${store.name}**. Once orders are placed, I will calculate and display your top selling items.`,
          dataEvidence: [],
          queryType: 'top_products'
        });
      }

      const listText = sorted.map((item, idx) => `${idx + 1}. **${item.name}** — ${item.unitsSold} unit${item.unitsSold > 1 ? 's' : ''} sold ($${item.revenue.toFixed(2)})`).join('\n');

      return res.json({
        success: true,
        answer: `Here are the top performing products for **${store.name}** based on your confirmed orders:\n\n${listText}`,
        dataEvidence: sorted.map(item => ({
          Product: item.name,
          'Units Sold': item.unitsSold,
          'Unit Price': `$${item.price.toFixed(2)}`,
          'Total Revenue': `$${item.revenue.toFixed(2)}`
        })),
        queryType: 'top_products'
      });
    }

    // Intent 2: Low stock / inventory check
    if (q.includes('low stock') || q.includes('out of stock') || q.includes('running out') || q.includes('inventory') || q.includes('stock alert')) {
      const lowStockProducts = await Product.find({ storeSlug, stock: { $lte: 5 } }).sort({ stock: 1 });

      if (lowStockProducts.length === 0) {
        return res.json({
          success: true,
          answer: `Good news! None of your products currently have low stock (<= 5 units). All catalog items have healthy inventory levels.`,
          dataEvidence: [],
          queryType: 'low_stock'
        });
      }

      const listText = lowStockProducts.map(p => `- **${p.name}**: Only ${p.stock} left in stock (SKU: ${p.sku || 'N/A'}, Category: ${p.category})`).join('\n');

      return res.json({
        success: true,
        answer: `I found **${lowStockProducts.length}** product${lowStockProducts.length > 1 ? 's' : ''} that require inventory replenishment:\n\n${listText}`,
        dataEvidence: lowStockProducts.map(p => ({
          Product: p.name,
          SKU: p.sku || 'N/A',
          Category: p.category,
          'Remaining Stock': p.stock,
          Price: `₹${p.price.toFixed(2)}`
        })),
        queryType: 'low_stock'
      });
    }

    // Intent 3: Revenue / sales / weekly comparison
    if (q.includes('revenue') || q.includes('sales') || q.includes('earned') || q.includes('money') || q.includes('last week') || q.includes('this week')) {
      const orders = await Order.find({ storeSlug });
      const nonCancelled = orders.filter(o => o.status !== 'cancelled');

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      let totalRevenue = 0;
      let thisWeekRevenue = 0;
      let lastWeekRevenue = 0;
      let thisWeekCount = 0;
      let lastWeekCount = 0;

      nonCancelled.forEach(o => {
        totalRevenue += o.total;
        const d = new Date(o.createdAt);
        if (d >= oneWeekAgo) {
          thisWeekRevenue += o.total;
          thisWeekCount++;
        } else if (d >= twoWeeksAgo && d < oneWeekAgo) {
          lastWeekRevenue += o.total;
          lastWeekCount++;
        }
      });

      const avgOrder = nonCancelled.length > 0 ? (totalRevenue / nonCancelled.length) : 0;

      return res.json({
        success: true,
        answer: `Here is the financial summary for **${store.name}**:\n` +
          `- **Lifetime Revenue:** ₹${totalRevenue.toFixed(2)} across ${nonCancelled.length} fulfilled/active orders.\n` +
          `- **This Past Week:** ₹${thisWeekRevenue.toFixed(2)} (${thisWeekCount} orders).\n` +
          `- **Previous Week:** ₹${lastWeekRevenue.toFixed(2)} (${lastWeekCount} orders).\n` +
          `- **Average Order Value (AOV):** ₹${avgOrder.toFixed(2)}.`,
        dataEvidence: [
          { Period: 'Past 7 Days (This Week)', Revenue: `₹${thisWeekRevenue.toFixed(2)}`, Orders: thisWeekCount },
          { Period: 'Prior 7 Days (Last Week)', Revenue: `₹${lastWeekRevenue.toFixed(2)}`, Orders: lastWeekCount },
          { Period: 'All-Time Total', Revenue: `₹${totalRevenue.toFixed(2)}`, Orders: nonCancelled.length }
        ],
        queryType: 'revenue'
      });
    }

    // Intent 4: Order status & pending orders
    if (q.includes('order') || q.includes('status') || q.includes('pending') || q.includes('shipped') || q.includes('delivered')) {
      const orders = await Order.find({ storeSlug });

      const breakdown = { placed: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0 };
      orders.forEach(o => {
        if (breakdown[o.status] !== undefined) breakdown[o.status]++;
      });

      const needsAction = breakdown.placed + breakdown.packed;

      return res.json({
        success: true,
        answer: `**${store.name}** currently has **${orders.length}** total recorded orders:\n` +
          `- **Placed (Needs review):** ${breakdown.placed}\n` +
          `- **Packed (Ready to ship):** ${breakdown.packed}\n` +
          `- **Shipped (In transit):** ${breakdown.shipped}\n` +
          `- **Delivered:** ${breakdown.delivered}\n` +
          `- **Cancelled:** ${breakdown.cancelled}\n\n` +
          `There are **${needsAction}** orders waiting for fulfillment in your dashboard.`,
        dataEvidence: Object.entries(breakdown).map(([status, count]) => ({
          Status: status.toUpperCase(),
          'Order Count': count
        })),
        queryType: 'orders_breakdown'
      });
    }

    // Intent 5: Top customers / Customer spend
    if (q.includes('customer') || q.includes('buyer') || q.includes('who bought') || q.includes('clients')) {
      const orders = await Order.find({ storeSlug, status: { $ne: 'cancelled' } });
      const customerMap = {};

      orders.forEach(o => {
        const email = o.customer.email;
        if (!customerMap[email]) {
          customerMap[email] = { name: o.customer.name, email, ordersCount: 0, totalSpent: 0 };
        }
        customerMap[email].ordersCount++;
        customerMap[email].totalSpent += o.total;
      });

      const topCustomers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

      if (topCustomers.length === 0) {
        return res.json({
          success: true,
          answer: `No customer orders have been recorded yet for **${store.name}**.`,
          dataEvidence: [],
          queryType: 'customers'
        });
      }

      const listText = topCustomers.map((c, i) => `${i + 1}. **${c.name}** (${c.email}) — ${c.ordersCount} order${c.ordersCount > 1 ? 's' : ''}, spent ₹${c.totalSpent.toFixed(2)}`).join('\n');

      return res.json({
        success: true,
        answer: `Top customers ranked by total spend:\n\n${listText}`,
        dataEvidence: topCustomers.map(c => ({
          Customer: c.name,
          Email: c.email,
          Orders: c.ordersCount,
          'Total Spend': `₹${c.totalSpent.toFixed(2)}`
        })),
        queryType: 'customers'
      });
    }

    // Intent 6: Categories and catalog breakdown
    if (q.includes('category') || q.includes('categories') || q.includes('catalog') || q.includes('how many product')) {
      const products = await Product.find({ storeSlug });
      const catCount = {};

      products.forEach(p => {
        const cat = p.category || 'Uncategorized';
        catCount[cat] = (catCount[cat] || 0) + 1;
      });

      const listText = Object.entries(catCount).map(([c, count]) => `- **${c}**: ${count} product${count > 1 ? 's' : ''}`).join('\n');

      return res.json({
        success: true,
        answer: `**${store.name}** has **${products.length}** total products across **${Object.keys(catCount).length}** categories:\n\n${listText}`,
        dataEvidence: Object.entries(catCount).map(([Category, Count]) => ({ Category, 'Product Count': Count })),
        queryType: 'categories'
      });
    }

    // Checkpoint 14: Safety & honesty for out-of-domain questions
    return res.json({
      success: true,
      answer: `I don't have that data in your store records. I am your store's AI Copilot and strictly query your actual MongoDB catalog, orders, and customer activity. You can ask me:\n- *"What are my top 5 selling products?"*\n- *"Which products are low on stock?"*\n- *"What is my revenue this week vs last week?"*\n- *"Show my orders breakdown"* \n- *"Who are my top customers?"*`,
      dataEvidence: [],
      queryType: 'out_of_scope'
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
