# ⚡ Launch-Your-Store: Multi-Tenant E-Commerce Builder & Grounded AI Engine

A complete, production-ready platform where any small business owner can create, customize, and publish a live online store in minutes backed by **MongoDB**.

---

## 🌟 Quick Links (Server Running at `http://localhost:5000`)

| Page | URL | Description |
| :--- | :--- | :--- |
| **🚀 Onboarding Wizard** | [http://localhost:5000/](http://localhost:5000/) | 4-step wizard to create and publish a live store |
| **🎨 Design System** | [http://localhost:5000/design-system](http://localhost:5000/design-system) | Interactive UI kit showcasing CSS tokens, typography, forms, & live theme switcher |
| **🏬 Live Store 1 (Streetwear)** | [http://localhost:5000/store/urban-threads](http://localhost:5000/store/urban-threads) | Cyber Streetwear theme storefront with cart & checkout |
| **🥐 Live Store 2 (Bakery)** | [http://localhost:5000/store/artisan-bakery](http://localhost:5000/store/artisan-bakery) | Organic Artisan warm theme storefront |
| **⚙️ Merchant Admin Panel** | [http://localhost:5000/admin?store=urban-threads](http://localhost:5000/admin?store=urban-threads) | Real-time analytics, inventory CRUD, order status flow, & AI Copilot |

---

## 📋 15 Checkpoints Implementation Map

1. **Onboarding Form Wizard** (`/`):
   - 4-step guided wizard collecting store name, business type, contact details, physical address, and logo URL with validation.
   - Real-time slug generator (e.g. `Velvet & Oak` → `http://localhost:5000/store/velvet-oak`).

2. **Category Selection**:
   - Pre-populated smart category pills tailored to business types (Fashion, Bakery, Tech, Home, Artisanal).
   - Dynamic "+ Add Custom Category" input to support custom business models.

3. **1-Click Dummy Product Import**:
   - Single-click generates 4–8 realistic, high-resolution products matching the chosen categories with pricing, descriptions, SKUs, inventory, and variants.

4. **Excel / CSV Upload & Validation**:
   - Downloadable official `.csv` template with sample headers (`Name`, `Price`, `Category`, `Stock`, `SKU`, `Description`, `ImageUrl`).
   - Drag-and-drop CSV parser with row-by-row validation table, invalid row flagging, and clear error reports.

5. **Theme Selection with Live Interactive Preview**:
   - 4 distinct, cohesive design themes:
     - **Modern Minimalist**: Clean slate, indigo/cyan, Inter sans-serif, 10px radius.
     - **Cyber Streetwear**: Dark mode, electric violet & hot pink, Space Grotesk, sharp 4px radius.
     - **Luxury Elegance**: Deep navy, champagne gold, Playfair Display serif, refined luxury.
     - **Organic Artisan**: Earthy amber, forest sage, Plus Jakarta Sans, warm 16px radius.
   - Customizer allows setting Hero Banner Title & Subtitle.

6. **Unique Live URL**:
   - Every store gets an instant path-based live URL (`http://localhost:5000/store/:slug`).
   - Immediate clipboard copy, visit storefront button, and admin direct link upon completion.

7. **Complete Shopper Storefront**:
   - Sticky navbar with store branding, category tabs, and cart count badge.
   - Live search bar and sort dropdown (Price Low-to-High, High-to-Low, Name).
   - Product catalog with badges (`SALE`, `Low Stock`, `Sold Out`).
   - Product detail modal with image view, description, variant selection, and quantity stepper.
   - Slide-over Cart Drawer with subtotal, shipping calculation, and tax breakdown.
   - Complete Checkout Modal with shipping form, mock payment gateway, real-time inventory decrement, and order reference confirmation.

8. **Admin Panel Dashboard**:
   - Overview KPI cards: Gross Revenue, Total Orders, Average Order Value (AOV), and Catalog Products.
   - Real-time Low-Stock Alert banner (flags products with $\le 5$ units).
   - Recent transactions table with status pills.

9. **Full Content & Theme Control (No Code)**:
   - Visual editor in Admin under *Theme & Branding*: change store name, logo, banner headline, subtitle, hero image URL, accent colors, typography, border radius, and footer copyright with instant save to MongoDB.

10. **Product & Inventory Management**:
    - Full CRUD (Create, Read, Update, Delete) for products.
    - Add/Edit modal with price, compare-at price, stock level, category, and SKU.
    - Bulk operations: `+10% Price Increase`, `-10% Discount`, and `Set All Stock = 25`.

11. **Order Management & Customer Updates**:
    - Filter orders by workflow state: `placed`, `packed`, `shipped`, `delivered`, `cancelled`.
    - Dropdown to transition status, automatically appending to the order's history timeline.
    - "Send Update" button: displays a branded email notification preview dispatched to the customer.

12. **Multi-Tenant Isolation & Role-Based Access**:
    - Database schemas strictly index and scope all products, orders, and themes by `storeSlug`.
    - Tenant switcher dropdown in the sidebar to toggle between stores seamlessly.
    - Role switcher between **Store Owner** (full privileges) and **Staff Member** (operational privileges).

13. **AI Chatbot ("Store Copilot")**:
    - Natural language query interface powered by MongoDB aggregation pipelines.
    - Answers questions such as:
      - *"What are my top 5 selling products?"*
      - *"Which products are low on stock?"*
      - *"What is my revenue this week vs last week?"*
      - *"Show my orders breakdown"*
      - *"Who are my top customers?"*

14. **Chatbot Safety & Grounding (Zero Hallucination)**:
    - Queries are strictly read-only and scoped to the active `storeSlug`.
    - Includes an interactive **View Database Evidence** inspector that surfaces the actual database records behind each answer.
    - Safeguard rule: For questions outside the store domain (e.g. weather, external stocks, or another store's metrics), honestly replies that it does not have access to that information.

15. **Fully Responsive UI**:
    - Fluid CSS grid and flexbox layouts optimized for mobile, tablet, and desktop screens across the onboarding wizard, storefront, and merchant dashboard.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB ODM), CORS, Dotenv.
- **Database**: Local MongoDB (`mongodb://127.0.0.1:27017/launch_your_store`).
- **Frontend**: Clean semantic HTML5, Modern CSS Design System (CSS custom properties), Modular JavaScript API Client.
- **Multi-Tenancy**: Tenant scoping via unique store slugs in all queries (`Product.find({ storeSlug })`, `Order.find({ storeSlug })`).

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Seed default stores (Urban Streetwear & Artisan Bakery)
npm run seed

# 3. Start the server
npm start
```
Server runs on port **5000** (`http://localhost:5000`).
