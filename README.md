# ✦ LaunchX — Spatial AI Minimalism: Multi-Tenant Website Builder & Grounded AI Engine

A production-ready platform where users can describe a business, synthesize an online store in minutes, customize its appearance in an interactive studio editor, preview it across responsive viewports, and publish it live backed by **MongoDB**.

---

## 🌟 LaunchX Quick Links (Running at `http://localhost:5000`)

| Page | URL | Description |
| :--- | :--- | :--- |
| **🚀 Studio Generator & Landing** | [http://localhost:5000/](http://localhost:5000/) | Spatial AI hero, prompt synthesizer, bento-grid features, and 4-step store builder |
| **🎨 Visual Studio Editor** | [http://localhost:5000/editor](http://localhost:5000/editor) | Desktop / Tablet / Mobile viewports, undo/redo stack, section controls, real-time styling inspector |
| **⚙️ Merchant Admin Dashboard** | [http://localhost:5000/admin?store=urban-threads](http://localhost:5000/admin?store=urban-threads) | Spatial Bento-grid analytics, inventory CRUD, order status flow, & Grounded AI Copilot |
| **🔑 Merchant Access & Auth** | [http://localhost:5000/login](http://localhost:5000/login) | Role-based authentication portal (Store Owner vs Staff Operator) |
| **🎨 Spatial UI Kit / Design System** | [http://localhost:5000/design-system](http://localhost:5000/design-system) | LaunchX tokens: Dark/Light modes, Space Grotesk/Inter/JetBrains Mono, glass panels, bento cards |
| **🏬 Live Store 1 (Cyber Streetwear)** | [http://localhost:5000/store/urban-threads](http://localhost:5000/store/urban-threads) | Space Grotesk dark mode storefront with cart drawer & checkout |
| **🥐 Live Store 2 (Organic Bakery)** | [http://localhost:5000/store/artisan-bakery](http://localhost:5000/store/artisan-bakery) | Warm earthy aesthetic storefront with full product ordering |
| **🏺 Live Store 3 (Luxury Living)** | [http://localhost:5000/store/nordic-minimal-living](http://localhost:5000/store/nordic-minimal-living) | Refined serif luxury living storefront |

---

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
