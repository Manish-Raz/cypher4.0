const express = require('express');
const router = express.Router({ mergeParams: true });
const Product = require('../models/Product');
const Order = require('../models/Order');
const Store = require('../models/Store');

/**
 * Helper to call external LLM (Gemini / OpenAI) if API keys are configured
 */
async function callExternalLLM(prompt, store) {
  // 1. Google Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const systemInstruction = `You are LaunchX AI Store & Builder Assistant for store "${store.name}" (slug: "${store.slug}"). You are an expert e-commerce architect who helps the store owner build website components, walks through steps for making and customizing their store, tunes styles, and answers sales/catalog questions. Format your answer with clear markdown, headings, bullet steps, and actionable advice.`;
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }]
          }
        ]
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } catch (err) {
      console.warn('[Gemini LLM error / timeout, falling back to local domain agent]:', err.message);
    }
  }

  // 2. OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are LaunchX AI Store & Builder Assistant for store "${store.name}" (slug: "${store.slug}"). You guide the store owner through building website components, editing sections, customizing CSS styles, and managing e-commerce operations. Provide clear step-by-step instructions in markdown.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim()) return text.trim();
      }
    } catch (err) {
      console.warn('[OpenAI LLM error / timeout, falling back to local domain agent]:', err.message);
    }
  }

  return null;
}

/**
 * Main AI Assistant & Query Handler
 */
async function handleChatbotQuery(req, res) {
  try {
    const slug = (req.params.slug || req.body.slug || 'urban-threads').toLowerCase();
    const question = req.body.question || req.body.message || '';

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty' });
    }

    let store = await Store.findOne({ slug });
    if (!store) {
      store = await Store.findOne() || { name: 'Your Store', slug: 'my-store' };
    }

    const q = question.toLowerCase().trim();

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 1: Step-by-Step Website Building Walkthrough
    // -------------------------------------------------------------------------
    if (
      q.includes('step') ||
      q.includes('how to build website') ||
      q.includes('how to make website') ||
      q.includes('making website') ||
      q.includes('start from scratch') ||
      q.includes('create website') ||
      q.includes('guide') ||
      q.includes('workflow') ||
      q.includes('getting started') ||
      (q.includes('how') && q.includes('build') && !q.includes('product') && !q.includes('banner'))
    ) {
      const answer = `### 🚀 Step-by-Step Guide: Making Your Website on LaunchX

Here is the complete end-to-end walkthrough to create, customize, and launch **${store.name}**:

#### 1️⃣ Step 1: Store Identity & Configuration
- Set your **Store Name**, URL Slug (\`${store.slug}\`), and Category Archetype (e.g. *Streetwear*, *Artisan Bakery*, *Minimal Ceramics*).
- Configure your business currency, tax rate, and shipping fees in the **[⚙️ Admin Dashboard](/admin?store=${store.slug})**.

#### 2️⃣ Step 2: Catalog Ingestion & Inventory Setup
- Populate your catalog with products:
  - **Manual Entry:** Use the **+ Add Product** form with title, SKU, price, stock count, and image URL.
  - **1-Click Smart Import:** Use **Smart CSV Import** or **Dummy Catalog Ingestion** to load pre-configured products instantly.
- Each item is automatically isolated in MongoDB under your tenant slug (\`${store.slug}\`).

#### 3️⃣ Step 3: Component Customization in Visual Studio Editor
- Navigate to the **[🎨 Visual Studio Editor](/editor?store=${store.slug})**:
  - **Hero Banner:** Customize headline, subtitle, background cover photography, and CTA button.
  - **Theme Archetype:** Choose between 4 distinct styles (*Modern Minimalist*, *Cyber Streetwear*, *Luxury Elegance*, *Organic Artisan*).
  - **Design Tokens:** Tweak primary accent colors, font family (*Inter*, *Space Grotesk*, *Playfair Display*), and corner radius (*4px, 8px, 12px, 18px*).
  - **Multi-Device Responsive Preview:** Toggle between Desktop, Tablet (768px), and Mobile (375px) views.

#### 4️⃣ Step 4: Commit & Live Publish to MongoDB
- Click **Commit & Publish Live**.
- The multi-tenant routing engine makes your store live immediately at:
  👉 **\`http://localhost:5000/store/${store.slug}\`**
- Customers can immediately browse, filter by category, add items to cart, and complete live checkout transactions!`;

      return res.json({
        success: true,
        answer,
        queryType: 'website_steps_guide',
        dataEvidence: [
          { Step: '1. Store Identity', Tool: 'Admin Settings / Onboarding Wizard' },
          { Step: '2. Catalog Ingestion', Tool: 'MongoDB Product Collection & CSV Ingestion' },
          { Step: '3. Component Studio', Tool: 'Visual Studio Editor (/editor)' },
          { Step: '4. Live Routing', Tool: 'Sub-millisecond Multi-Tenant Router' }
        ]
      });
    }

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 2: Building & Customizing the Hero Banner Component
    // -------------------------------------------------------------------------
    if (q.includes('hero') || q.includes('banner') || q.includes('cover image') || q.includes('headline')) {
      const answer = `### ✦ How to Build & Customize the Hero Banner Component

The Hero Banner is the focal greeting component of your storefront (\`/store/${store.slug}\`).

#### 🧱 Anatomy of the Hero Banner:
1. **Store Headline (\`<h1>\`):** Primary value proposition (e.g. *"Curated Essentials"*).
2. **Subtitle (\`<p>\`):** Supporting brand description.
3. **Background Cover Photography:** Responsive image with dark glassmorphic overlay for maximum contrast.
4. **Call to Action (\`<a>\`):** Smooth-scroll anchor directing shoppers straight to your catalog.

#### 🛠️ How to Customize:
1. Open the **[🎨 Visual Studio Editor](/editor?store=${store.slug})**.
2. In the right panel under **Hero Banner Content**:
   - Change the **Headline** text.
   - Update the **Subtitle** narrative.
   - Paste a new **Cover Image URL** (from Unsplash, CDN, or uploaded asset).
   - *Pro-tip:* Click **🪄 Regenerate Banner Text** in the left panel to generate high-converting copy automatically!
3. Click **💾 Save to MongoDB** in the top bar to apply changes live!`;

      return res.json({
        success: true,
        answer,
        queryType: 'hero_component_guide',
        dataEvidence: []
      });
    }

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 3: Building & Customizing Product Cards Component
    // -------------------------------------------------------------------------
    if (q.includes('product card') || (q.includes('product') && (q.includes('card') || q.includes('grid') || q.includes('component')))) {
      const answer = `### 📦 How to Build & Customize Product Cards

Product Cards represent individual inventory items in your responsive storefront grid.

#### 🧱 Anatomy of a Product Card:
- **Aspect-Ratio Thumbnail:** Clean product image with smooth hover zoom effect.
- **Category Badge:** Pill badge showing the product collection tag.
- **Product Title & Price:** Formatted currency with clear typography.
- **SKU & Stock Status:** Live indicator (\`In Stock\`, \`Low Stock (N left)\`, \`Out of Stock\`).
- **Add to Cart CTA:** Interactive button that dynamically opens the cart stepper.

#### 🛠️ How to Add & Manage Products:
1. Go to the **[⚙️ Admin Dashboard -> Products](/admin?store=${store.slug})**.
2. Click **+ Add Product** and fill in:
   - **Product Name** & **SKU**
   - **Price** & **Inventory Units**
   - **Category Tag** (e.g. *Sneakers*, *Outerwear*, *Accessories*)
   - **Image URL** & Detailed Description.
3. Hit **Save Product** — the item is immediately saved to MongoDB and appears in your store catalog.
4. *Corner Radius:* To adjust how rounded or sharp your product cards look, open the **[Visual Studio Editor](/editor?store=${store.slug})** and select your desired **Corner Radius** (*4px*, *8px*, *12px*, or *18px*).`;

      return res.json({
        success: true,
        answer,
        queryType: 'product_card_guide',
        dataEvidence: []
      });
    }

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 4: Building Category Tabs & Catalog Filters
    // -------------------------------------------------------------------------
    if ((q.includes('category') || q.includes('tab') || q.includes('filter')) && (q.includes('build') || q.includes('how') || q.includes('create') || q.includes('add'))) {
      const answer = `### 🏷️ How to Build Category Tabs & Filtering

LaunchX features an automatic, zero-config catalog toolbar:

#### ⚡ Automatic Synthesis:
- You do **not** have to manually code category buttons!
- LaunchX automatically queries your MongoDB product collection for all unique \`category\` fields and dynamically synthesizes the corresponding filter tabs (\`All\`, \`Apparel\`, \`Footwear\`, etc.).

#### 🛠️ How to Add a New Category:
1. Open **[⚙️ Admin Dashboard -> Products](/admin?store=${store.slug})**.
2. When creating or editing any product, type your desired category name in the **Category** input field (e.g. *"Limited Edition"* or *"Artisan Ceramics"*).
3. Save the product. The new category tab immediately renders on your live storefront toolbar (\`/store/${store.slug}\`)!
4. Shoppers can also use the **Live Search Bar** and **Sort Dropdown** (*Newest, Price: Low-High, Price: High-Low, A-Z*).`;

      return res.json({
        success: true,
        answer,
        queryType: 'category_toolbar_guide',
        dataEvidence: []
      });
    }

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 5: Building Shopping Cart & Checkout Drawer Component
    // -------------------------------------------------------------------------
    if (q.includes('cart') || q.includes('checkout') || q.includes('drawer') || q.includes('payment') || q.includes('how to buy')) {
      const answer = `### 🛒 How the Shopping Cart & Checkout Drawer Works

Your storefront features a built-in glassmorphic slide-over cart and transaction engine:

#### 🧱 Cart Architecture:
1. **Interactive Cart State:** Items added to cart are tracked with live quantities, unit prices, and thumbnail previews.
2. **Dynamic Order Totals:** Calculates Subtotal, Tax (default 5%), and Grand Total automatically.
3. **1-Click Checkout Form:** Collects customer name, email address, phone, and delivery address.
4. **Live MongoDB Transaction Pipeline:**
   - When the customer clicks **Place Order**, a \`POST /api/stores/${store.slug}/orders\` transaction executes.
   - An isolated Order document is recorded with status \`"placed"\`.
   - MongoDB automatically decreases product inventory counts in real time!
5. **Order Processing:**
   - Track and update orders (*Placed -> Packed -> Shipped -> Delivered*) directly in the **[⚙️ Admin Dashboard -> Orders](/admin?store=${store.slug})**.`;

      return res.json({
        success: true,
        answer,
        queryType: 'cart_checkout_guide',
        dataEvidence: []
      });
    }

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 6: Customizing Themes, Colors, Typography & Styling
    // -------------------------------------------------------------------------
    if (q.includes('theme') || q.includes('color') || q.includes('font') || q.includes('style') || q.includes('css') || q.includes('radius')) {
      const answer = `### 🎨 How to Customize Themes, Colors & Typography

You can customize the visual design of **${store.name}** directly in the **[🎨 Visual Studio Editor](/editor?store=${store.slug})**:

#### 1. Theme Archetypes
Choose from 4 preset design directions in the **Theme Archetype** dropdown:
- **Modern Minimalist:** Crisp, clean styling powered by the *Inter* typeface.
- **Cyber Streetwear:** Tech-forward, high-contrast dark aesthetic with *Space Grotesk*.
- **Luxury Elegance:** Editorial luxury serif styling powered by *Playfair Display*.
- **Organic Artisan:** Warm, natural earthy design with *Plus Jakarta Sans*.

#### 2. Color Palette
- Click the **Primary Color** picker to change brand accents, buttons, and badges.
- Click the **Accent Color** picker to adjust secondary highlights and glow effects.

#### 3. Geometry & Corner Radii
- Choose from **4px** (Precision / Brutalist), **8px** (Refined), **12px** (Smooth Modern), or **18px** (Organic Pill).

#### 4. Instant Live Preview & Persistence
- Changes update in real-time inside the center device canvas.
- Click **💾 Save to MongoDB** to push your custom design tokens live!`;

      return res.json({
        success: true,
        answer,
        queryType: 'theme_customization_guide',
        dataEvidence: []
      });
    }

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 7: Top Selling Products (MongoDB Grounded)
    // -------------------------------------------------------------------------
    if (q.includes('top') || q.includes('best selling') || q.includes('bestseller') || q.includes('most sold')) {
      const orders = await Order.find({ storeSlug: slug, status: { $ne: 'cancelled' } });
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

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 8: Low Stock / Inventory Check (MongoDB Grounded)
    // -------------------------------------------------------------------------
    if (q.includes('low stock') || q.includes('out of stock') || q.includes('running out') || q.includes('inventory') || q.includes('stock alert')) {
      const lowStockProducts = await Product.find({ storeSlug: slug, stock: { $lte: 5 } }).sort({ stock: 1 });

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

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 9: Revenue & Sales Breakdown (MongoDB Grounded)
    // -------------------------------------------------------------------------
    if (q.includes('revenue') || q.includes('sales') || q.includes('earned') || q.includes('money') || q.includes('last week') || q.includes('this week')) {
      const orders = await Order.find({ storeSlug: slug });
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

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 10: Orders Status & Fulfillment Breakdown
    // -------------------------------------------------------------------------
    if (q.includes('order') || q.includes('status') || q.includes('pending') || q.includes('shipped') || q.includes('delivered')) {
      const orders = await Order.find({ storeSlug: slug });

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

    // -------------------------------------------------------------------------
    // DOMAIN INTENT 11: Top Customers / Buyer Activity
    // -------------------------------------------------------------------------
    if (q.includes('customer') || q.includes('buyer') || q.includes('who bought') || q.includes('clients')) {
      const orders = await Order.find({ storeSlug: slug, status: { $ne: 'cancelled' } });
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
        answer: `Top customers ranked by total spend for **${store.name}**:\n\n${listText}`,
        dataEvidence: topCustomers.map(c => ({
          Customer: c.name,
          Email: c.email,
          Orders: c.ordersCount,
          'Total Spend': `₹${c.totalSpent.toFixed(2)}`
        })),
        queryType: 'customers'
      });
    }

    // -------------------------------------------------------------------------
    // Try External LLM if configured
    // -------------------------------------------------------------------------
    const llmAnswer = await callExternalLLM(question, store);
    if (llmAnswer) {
      return res.json({
        success: true,
        answer: llmAnswer,
        queryType: 'external_llm_response',
        dataEvidence: []
      });
    }

    // -------------------------------------------------------------------------
    // Intelligent Fallback Guidance
    // -------------------------------------------------------------------------
    return res.json({
      success: true,
      answer: `Hello! I am your store's **AI Assistant & Website Architect** for **${store.name}**.\n\nI can help you build components and navigate every step of your store:\n- 🚀 *"How do I build my website step-by-step?"*\n- ✦ *"How do I customize the hero banner?"*\n- 📦 *"How do I build product cards?"*\n- 🏷️ *"How do I add category tabs & filters?"*\n- 🛒 *"How does the shopping cart and checkout work?"*\n- 🎨 *"How do I change themes, colors, and fonts?"*\n- 📊 *"What are my top 5 selling products?"*\n- ⚠️ *"Which items are low in stock?"*`,
      dataEvidence: [],
      queryType: 'general_guidance'
    });

  } catch (err) {
    console.error('[Chatbot Route Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Routes supported
router.post('/query', handleChatbotQuery);
router.post('/assistant', handleChatbotQuery);
router.post('/chat', handleChatbotQuery);

module.exports = router;
