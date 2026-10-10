# ✦ LaunchX — Spatial AI Minimalism: Multi-Tenant Website Builder & Grounded AI Engine

A production-ready platform where users can describe a business, synthesize an online store in minutes, customize its appearance in an interactive studio editor, preview it across responsive viewports, and publish it live backed by **MongoDB**.

---
# 🚀 LaunchX — AI-Powered E-Commerce Builder

Build and launch your own online store in minutes, without writing code. LaunchX helps small business owners create customized storefronts, manage products and orders, and customize their store designs through a unified platform.

## 🌐 Live Demo

**Live Website:** https://cypher4-0.onrender.com/

## 🌟 Quick Links

| Page | Live URL | Description |
|---|---|---|
| 🚀 Studio Generator & Landing | [Open Studio](https://cypher4-0.onrender.com/) | Landing page, AI-assisted store generation, and store builder |
| 🎨 Visual Studio Editor | [Open Editor](https://cypher4-0.onrender.com/editor) | Responsive previews, section controls, undo/redo, and styling tools |
| ⚙️ Merchant Admin Dashboard | [Open Admin](https://cypher4-0.onrender.com/admin?store=urban-threads) | Store analytics, inventory, order management, and AI Copilot |
| 🔑 Merchant Login | [Open Login](https://cypher4-0.onrender.com/login) | Merchant access portal |
| 🎨 Design System | [Open Design System](https://cypher4-0.onrender.com/design-system) | Design tokens, dark/light themes, and reusable UI components |
| 🏬 Urban Threads | [Open Store](https://cypher4-0.onrender.com/store/urban-threads) | Cyber streetwear storefront |
| 🥐 Artisan Bakery | [Open Store](https://cypher4-0.onrender.com/store/artisan-bakery) | Warm, earthy bakery storefront |
| 🏺 Nordic Minimal Living | [Open Store](https://cypher4-0.onrender.com/store/nordic-minimal-living) | Minimal luxury home-living storefront |
| ❤️ API Health Check | [Check API](https://cypher4-0.onrender.com/api/health) | Checks API availability and database connection status |

## ✨ Features

### 🛍️ Store Creation
- Create customized online stores through a guided builder.
- Configure store names, branding, logos, and contact information.
- Generate storefront layouts using configurable design options.

### 🎨 Visual Store Editor
- Preview designs across desktop, tablet, and mobile viewports.
- Customize store sections and styling.
- Use undo/redo controls while editing.
- Apply reusable design-system components.

### 📦 Product and Inventory Management
- Manage store products and product information.
- Organize inventory and update product details.
- Support store-specific product management.

### 🧾 Order Management
- Access store orders from the merchant dashboard.
- Track and update order statuses.
- Support customer shopping and checkout workflows.

### 🤖 AI-Assisted Experience
- AI-assisted store creation and prompt-based design workflows.
- AI Copilot functionality where configured.
- Simplify the process of creating and managing an online store.

### 🔐 Merchant Access
- Merchant login interface.
- Role-oriented access workflows for store owners and staff, where implemented.

### 📱 Responsive Design
- Responsive storefront layouts.
- Dark and light themes.
- Modern typography, glass-style panels, and bento-grid layouts.

## 🧰 Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API routes

**Database**
- MongoDB Atlas
- Mongoose

**Deployment**
- GitHub
- Render

## 🗂️ Project Structure

```text
Cypher01/
├── public/
│   ├── index.html
│   ├── editor.html
│   ├── admin.html
│   ├── login.html
│   ├── design-system.html
│   ├── store.html
│   ├── css/
│   └── js/
├── server/
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   ├── routes/
│   └── seed/
│       └── seedData.js
├── .gitignore
├── package.json
└── README.md
```

*The structure above represents the expected layout; adjust it if your repository differs.*

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Manish-Raz/cypher4.0.git
cd cypher4.0
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root if your `server.js` loads environment variables from there.

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
NODE_ENV=development
```

Replace the MongoDB placeholder with your own connection string. Never commit `.env` or publish database credentials.

### 4. Start the application

If `package.json` is in the repository root and the server entry point is `server/server.js`, configure this script in `package.json`:

```json
"scripts": {
  "start": "node server/server.js"
}
```

Then run:

```bash
npm start
```

Open http://localhost:5000 in your browser.

## 🔌 API Routes

| Route | Purpose |
|---|---|
| `/api/health` | API and database health status |
| `/api/stores` | Store-related operations |
| `/api/stores/:slug/products` | Store-specific product operations |
| `/api/stores/:slug/orders` | Store-specific order operations |
| `/api/stores/:slug/chatbot` | Store-specific chatbot operations |

The available HTTP methods and request formats depend on the implemented route handlers.

## ☁️ Deployment

LaunchX is deployed using Render, with MongoDB Atlas as its cloud database.

**Production URL:** https://cypher4-0.onrender.com/

Configure these environment variables in your Render service:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NODE_ENV` | Set to `production` |
| `PORT` | Provided automatically by Render |

Ensure MongoDB Atlas permits connections from your hosting service and that your database credentials are valid.

## ⚠️ Deployment Notes

- Render's free web services may spin down after inactivity, causing the first request to take longer.
- Store and dashboard functionality that depends on MongoDB requires a working database connection.
- Sample storefronts depend on the appropriate store records and seed data being present.
- The live links above use the application's configured routes; verify individual features on the deployed site.

## 🔒 Security

- Keep `.env` out of Git.
- Never commit passwords, database URIs, or API keys.
- Use strong database credentials and least-privilege database access.
- Validate and sanitize user input on the server.
- Protect merchant-only operations with appropriate authentication and authorization.

## 🎯 Project Goal

LaunchX aims to make online commerce more accessible by helping small businesses establish an online presence without needing extensive coding knowledge.

## 👨‍💻 Contributors

Developed as a hackathon project for **CYPHER 4.0**.

## 📄 License

Add a license file if you intend to distribute this project as open source.

## 🎨 Design System: Spatial AI Minimalism

### Color Tokens
* **Dark Theme (Default Signature)**:
  * Background: `#0B0D17`
  * Surface: `#151827`
  * Elevated Surface: `#1C2032`
  * Border: `#292D42`
  * Primary: `#8B5CF6` (Violet)
  * Secondary Accent: `#22D3EE` (Cyan)
  * Text: `#F5F6FF`
  * Muted Text: `#A5A9BD`
* **Light Theme**:
  * Background: `#F7F8FC`
  * Surface: `#FFFFFF`
  * Elevated Surface: `#F0F1FA`
  * Border: `#E6E8F0`
  * Primary: `#7048E8`
  * Secondary Accent: `#0891B2`
  * Text: `#181827`
  * Muted Text: `#62657A`

### Typography Hierarchy
* **Headings**: `Space Grotesk` (Geometric, tech-forward)
* **Body**: `Inter` (Optimized readability)
* **Technical Labels & Indicators**: `JetBrains Mono` (SKU tags, latency, tenant IDs, order references)

---

## 📋 Comprehensive Functionality Preserved

1. **AI Prompt Synthesizer & Onboarding Wizard** (`/`):
   - Interactive prompt synthesizer with quick presets.
   - 4-step guided wizard collecting brand details, automatic URL slug generation, and logo selection.
2. **Category Selection & Catalog Ingestion**:
   - Smart category taxonomy presets by business vertical.
   - 1-click realistic dummy product generation or CSV spreadsheet upload with row-by-row error reporting.
3. **Adaptive Spatial Themes**:
   - 4 themes (Modern Minimalist, Cyber Streetwear, Luxury Elegance, Organic Artisan) sharing a non-destructive layout schema.
4. **Instant Multi-Tenant Live URLs**:
   - Generates `/store/:slug` immediately upon database write.
5. **Complete Shopper Storefront**:
   - Real-time catalog filtering, sorting, product details modal with variants, glassmorphic cart drawer, and complete checkout flow.
6. **Merchant Studio Dashboard**:
   - Bento-grid KPI metrics, low-stock warnings, orders workflow, and customer email dispatch simulator.
7. **Visual Studio Editor** (`/editor`):
   - Desktop (1440px), Tablet (768px), and Mobile (375px) responsive frame viewports.
   - Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) action history stack.
   - Live canvas preview with real-time inspector controls and direct MongoDB persistence.
8. **Grounded AI Store Copilot**:
   - Safe, read-only aggregation queries querying confirmed orders and catalog inventory with expandable data proof.

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Seed initial stores (Urban Streetwear & Artisan Bakery)
npm run seed

# 3. Start server
npm start
```
Server runs on port **5000** (`http://localhost:5000`).
