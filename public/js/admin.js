// Admin Dashboard Logic (LaunchX)

let currentSlug = '';
let currentStore = null;
let currentProducts = [];
let currentOrders = [];
let activeOrderFilter = 'all';
let userRole = 'owner'; // 'owner' | 'staff'

document.addEventListener('DOMContentLoaded', async () => {
  initThemeSupport();
  await initStoreSelector();
});

function initThemeSupport() {
  if (localStorage.getItem('nf_theme') === 'light') {
    document.body.classList.add('theme-light');
    const btn = document.getElementById('themeNavBtn');
    if (btn) btn.innerText = '🌙 Dark';
  }
}

function togglePlatformTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  const btn = document.getElementById('themeNavBtn');
  if (isLight) {
    if (btn) btn.innerText = '🌙 Dark';
    localStorage.setItem('nf_theme', 'light');
  } else {
    if (btn) btn.innerText = '☀️ Light';
    localStorage.setItem('nf_theme', 'dark');
  }
}

// 1. Initialize Stores & Multi-Tenancy (Checkpoint 12)
async function initStoreSelector() {
  try {
    const res = await API.getStores();
    const stores = res.stores || [];
    const select = document.getElementById('activeStoreSelect');

    if (stores.length === 0) {
      showToast('No stores found. Redirecting to onboarding...', 'info');
      setTimeout(() => window.location.href = '/', 1500);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const requestedSlug = urlParams.get('store');
    currentSlug = (requestedSlug && stores.some(s => s.slug === requestedSlug))
      ? requestedSlug
      : stores[0].slug;

    select.innerHTML = stores.map(s => `
      <option value="${s.slug}" ${s.slug === currentSlug ? 'selected' : ''}>
        🏬 ${s.name} (${s.slug})
      </option>
    `).join('');

    await loadActiveStore(currentSlug);
  } catch (err) {
    showToast('Failed to load stores: ' + err.message, 'error');
  }
}

async function switchActiveStore(slug) {
  currentSlug = slug;
  // Update query param without full reload
  const newUrl = `${window.location.pathname}?store=${slug}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
  await loadActiveStore(slug);
  showToast(`Switched active store to: ${currentStore.name}`, 'info');
}

async function loadActiveStore(slug) {
  try {
    const res = await API.getStore(slug);
    currentStore = res.store;

    document.getElementById('topStoreName').innerText = currentStore.name;
    document.getElementById('viewStoreLiveBtn').href = `/store/${currentStore.slug}`;
    const editorShortcut = document.getElementById('editorShortcutBtn');
    if (editorShortcut) editorShortcut.href = `/editor/${currentStore.slug}`;
    const sidebarEditor = document.getElementById('sidebarEditorBtn');
    if (sidebarEditor) sidebarEditor.href = `/editor/${currentStore.slug}`;

    // Refresh Dashboard, Products, Orders, and Settings
    await refreshDashboard();
    await loadProducts();
    await loadOrders();
    populateThemeSettings();

  } catch (err) {
    showToast('Error loading active store: ' + err.message, 'error');
  }
}

async function openProjectsModal() {
  try {
    const res = await API.getStores();
    const stores = res.stores || [];
    const container = document.getElementById('projectsListContainer');

    container.innerHTML = stores.map(s => `
      <div style="background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
        <div>
          <div style="font-weight: 700; font-size: 1rem; color: var(--text);">${s.name}</div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--secondary);">slug: ${s.slug} • ${s.businessType || 'General'}</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-sm" onclick="switchActiveStore('${s.slug}'); closeProjectsModal();">
            ${s.slug === currentSlug ? '✓ Active' : 'Switch To Store'}
          </button>
          <a href="/editor/${s.slug}" class="btn btn-primary btn-sm">🎨 Editor</a>
          <a href="/store/${s.slug}" target="_blank" class="btn btn-outline btn-sm">🌐 Live ↗</a>
        </div>
      </div>
    `).join('');

    document.getElementById('projectsModal').classList.add('active');
  } catch (e) {
    showToast('Failed to load saved projects: ' + e.message, 'error');
  }
}

function closeProjectsModal() {
  document.getElementById('projectsModal').classList.remove('active');
}

function toggleRole(role) {
  userRole = role;
  const badge = document.getElementById('roleBadge');
  if (role === 'owner') {
    badge.innerText = 'Role: Store Owner';
    badge.style.background = '#e0e7ff';
    badge.style.color = '#3730a3';
    showToast('Switched to Owner access (Full permissions)', 'info');
  } else {
    badge.innerText = 'Role: Staff Member';
    badge.style.background = '#fef3c7';
    badge.style.color = '#92400e';
    showToast('Switched to Staff access (Operational role)', 'info');
  }
}

function copyStoreUrl() {
  const url = `${window.location.origin}/store/${currentSlug}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Live Storefront URL copied to clipboard!', 'success');
  });
}

// 2. Navigation Tabs
function switchAdminTab(tabKey) {
  document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pane = document.getElementById(`pane-${tabKey}`);
  const nav = document.getElementById(`tabNav-${tabKey}`);
  if (pane) pane.classList.add('active');
  if (nav) nav.classList.add('active');
}

// 3. Dashboard Overview & Animated Metrics (Checkpoint 8 Dynamic Enhancements)
let currentDashboardOrders = [];
let currentChartMode = 'revenue'; // 'revenue' | 'orders'

function animateValue(elem, start, end, duration = 1000, prefix = '', decimals = 0) {
  if (!elem) return;
  const numEnd = Number(end) || 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || isNaN(numEnd)) {
    elem.innerText = prefix + (decimals > 0 ? numEnd.toFixed(decimals) : Math.round(numEnd));
    return;
  }
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = start + (numEnd - start) * ease;
    elem.innerText = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.round(current));
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      elem.innerText = prefix + (decimals > 0 ? numEnd.toFixed(decimals) : Math.round(numEnd));
    }
  }
  requestAnimationFrame(tick);
}

function toggleDashboardChartMode(mode) {
  currentChartMode = mode;
  const revBtn = document.getElementById('chartToggleRevenue');
  const ordBtn = document.getElementById('chartToggleOrders');
  if (revBtn && ordBtn) {
    revBtn.classList.toggle('active', mode === 'revenue');
    ordBtn.classList.toggle('active', mode === 'orders');
  }
  renderDashboardChart(currentDashboardOrders, currentChartMode);
}

function updateHealthMeters(stats, orders) {
  const totalOrders = stats.totalOrders || 0;
  const fulfilledOrders = (orders || []).filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  const fulfillmentPct = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 100;

  const totalProducts = stats.totalProducts || 0;
  const lowStockCount = stats.lowStockCount || 0;
  const inStockPct = totalProducts > 0 ? Math.max(0, Math.round(((totalProducts - lowStockCount) / totalProducts) * 100)) : 100;

  const aovTarget = 1500;
  const aovPct = Math.min(100, Math.round(((stats.averageOrderValue || 0) / aovTarget) * 100));

  const fTxt = document.getElementById('healthFulfillmentTxt');
  const fBar = document.getElementById('healthFulfillmentBar');
  if (fTxt) fTxt.innerText = `${fulfillmentPct}%`;
  if (fBar) fBar.style.width = `${fulfillmentPct}%`;

  const sTxt = document.getElementById('healthStockTxt');
  const sBar = document.getElementById('healthStockBar');
  if (sTxt) sTxt.innerText = `${inStockPct}%`;
  if (sBar) {
    sBar.style.width = `${inStockPct}%`;
    sBar.style.background = inStockPct < 60 
      ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' 
      : 'linear-gradient(90deg, #34d399 0%, #7ee8c4 100%)';
  }

  const aTxt = document.getElementById('healthAovTxt');
  const aBar = document.getElementById('healthAovBar');
  if (aTxt) aTxt.innerText = `${aovPct}%`;
  if (aBar) aBar.style.width = `${aovPct}%`;
}

function renderDashboardChart(orders, mode = 'revenue') {
  const container = document.getElementById('dashboardChartWrapper');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; gap: 8px;">
        <span style="font-size: 1.6rem;">📊</span>
        <span>Awaiting orders. Place an order on the storefront to generate live trajectory metrics.</span>
      </div>
    `;
    return;
  }

  const sorted = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const dataPoints = sorted.map((o, idx) => ({
    label: new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || `Order #${o.orderNumber}`,
    val: mode === 'revenue' ? (o.total || 0) : 1
  }));

  let points = dataPoints;
  if (points.length === 1) {
    points = [
      { label: 'Store Launch', val: 0 },
      { label: points[0].label, val: points[0].val }
    ];
  }

  const maxVal = Math.max(...points.map(p => p.val), 10);
  const width = container.clientWidth || 550;
  const height = 200;
  const paddingX = 35;
  const paddingY = 25;
  const plotW = Math.max(100, width - paddingX * 2);
  const plotH = Math.max(50, height - paddingY * 2);

  const coords = points.map((p, i) => {
    const x = paddingX + (i / Math.max(1, points.length - 1)) * plotW;
    const y = height - paddingY - (p.val / maxVal) * plotH;
    return { x, y, ...p };
  });

  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mintChartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7ee8c4" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#7ee8c4" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
      <line x1="${paddingX}" y1="${height / 2}" x2="${width - paddingX}" y2="${height / 2}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4,4" stroke-width="1" />
      <path d="${areaD}" class="chart-area-path" />
      <path d="${pathD}" class="chart-line-path" />
      ${coords.map(c => `
        <circle cx="${c.x}" cy="${c.y}" r="4.5" class="chart-dot">
          <title>${c.label}: ${mode === 'revenue' ? '₹' + c.val.toFixed(2) : c.val + ' order'}</title>
        </circle>
      `).join('')}
    </svg>
  `;
}

async function refreshDashboard() {
  try {
    const res = await API.getStats(currentSlug);
    const stats = res.stats;

    // Smooth Count-Up Animations for Metric Figures
    animateValue(document.getElementById('metricRevenue'), 0, stats.totalRevenue, 1100, '₹', 2);
    animateValue(document.getElementById('metricOrders'), 0, stats.totalOrders, 900, '', 0);
    document.getElementById('metricActiveOrders').innerText = `${stats.activeOrders} pending fulfillment`;
    animateValue(document.getElementById('metricAov'), 0, stats.averageOrderValue, 1000, '₹', 2);
    animateValue(document.getElementById('metricProducts'), 0, stats.totalProducts, 800, '', 0);
    document.getElementById('metricLowStockCount').innerText = `${stats.lowStockCount} low in stock`;

    // Low stock warning banner with glowing accent
    const alertBanner = document.getElementById('lowStockAlertBanner');
    if (stats.lowStockCount > 0) {
      alertBanner.style.display = 'flex';
      document.getElementById('lowStockAlertText').innerText = `You have ${stats.lowStockCount} item(s) running low on inventory (5 units or less).`;
    } else {
      alertBanner.style.display = 'none';
    }

    // Recent orders and dynamic telemetry chart
    const ordersRes = await API.getOrders(currentSlug, 'all');
    currentDashboardOrders = ordersRes.orders || [];
    const recent = currentDashboardOrders.slice(0, 5);
    renderRecentOrders(recent);

    // Update real-data trajectory chart & operational health meters
    renderDashboardChart(currentDashboardOrders, currentChartMode);
    updateHealthMeters(stats, currentDashboardOrders);

  } catch (err) {
    console.error('Stats error:', err);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTableBody');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">No orders recorded yet. Place an order on the storefront to test.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const itemCount = o.items.reduce((s, it) => s + it.quantity, 0);
    const dateStr = new Date(o.createdAt).toLocaleDateString();
    return `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${o.orderNumber}</td>
        <td>
          <div style="font-weight: 600;">${o.customer.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${o.customer.email}</div>
        </td>
        <td>${itemCount} item${itemCount > 1 ? 's' : ''}</td>
        <td style="font-weight: 700;">₹${o.total.toFixed(2)}</td>
        <td><span class="status-pill status-${o.status}">${o.status}</span></td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${dateStr}</td>
      </tr>
    `;
  }).join('');
}

// 4. Products Management (Checkpoint 10)
async function loadProducts() {
  try {
    const res = await API.getProducts(currentSlug);
    currentProducts = res.products || [];
    renderProductsTable(currentProducts);
  } catch (err) {
    showToast('Failed to load products: ' + err.message, 'error');
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">No products in store catalog. Click "+ Add New Product" or "Import Dummy Products".</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isLow = p.stock <= 5;
    const imgUrl = (p.images && p.images[0]) || '';
    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <img src="${imgUrl}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; background: #eee;">
            <div>
              <div style="font-weight: 700;">${p.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${p.description ? p.description.slice(0, 40) + '...' : ''}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-muted">${p.category}</span></td>
        <td style="font-weight: 700;">₹${p.price.toFixed(2)}</td>
        <td>
          <span style="font-weight: 700;">${p.stock} units</span>
          ${isLow ? '<span class="badge badge-warning" style="margin-left: 6px;">Low</span>' : ''}
        </td>
        <td style="font-family: monospace; font-size: 0.85rem;">${p.sku || 'N/A'}</td>
        <td>
          <div class="flex items-center gap-2">
            <button class="btn btn-outline btn-sm" onclick="openEditProductModal('${p._id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct('${p._id}', '${escapeQuotes(p.name)}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeQuotes(str) {
  return (str || '').replace(/'/g, "\\'");
}

function openAddProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('productModalHeading').innerText = 'Add New Product';
  document.getElementById('productFormModal').classList.add('active');
}

function openEditProductModal(productId) {
  const prod = currentProducts.find(p => p._id === productId);
  if (!prod) return;

  document.getElementById('editProductId').value = prod._id;
  document.getElementById('productModalHeading').innerText = `Edit: ${prod.name}`;
  document.getElementById('pName').value = prod.name;
  document.getElementById('pPrice').value = prod.price;
  document.getElementById('pCompare').value = prod.compareAtPrice || 0;
  document.getElementById('pStock').value = prod.stock;
  document.getElementById('pCategory').value = prod.category;
  document.getElementById('pSku').value = prod.sku || '';
  document.getElementById('pImage').value = (prod.images && prod.images[0]) || '';
  document.getElementById('pDesc').value = prod.description || '';

  document.getElementById('productFormModal').classList.add('active');
}

function closeProductFormModal() {
  document.getElementById('productFormModal').classList.remove('active');
}

async function handleProductFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('editProductId').value;
  const payload = {
    name: document.getElementById('pName').value.trim(),
    price: parseFloat(document.getElementById('pPrice').value),
    compareAtPrice: parseFloat(document.getElementById('pCompare').value) || 0,
    stock: parseInt(document.getElementById('pStock').value, 10) || 0,
    category: document.getElementById('pCategory').value.trim() || 'General',
    sku: document.getElementById('pSku').value.trim(),
    description: document.getElementById('pDesc').value.trim(),
    images: document.getElementById('pImage').value.trim() ? [document.getElementById('pImage').value.trim()] : undefined
  };

  try {
    if (id) {
      await API.updateProduct(currentSlug, id, payload);
      showToast('Product updated successfully', 'success');
    } else {
      await API.createProduct(currentSlug, payload);
      showToast('Product added to catalog', 'success');
    }

    closeProductFormModal();
    await loadProducts();
    await refreshDashboard();
  } catch (err) {
    showToast('Failed to save product: ' + err.message, 'error');
  }
}

async function handleDeleteProduct(productId, name) {
  if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
  try {
    await API.deleteProduct(currentSlug, productId);
    showToast(`Deleted "${name}"`, 'success');
    await loadProducts();
    await refreshDashboard();
  } catch (err) {
    showToast('Delete error: ' + err.message, 'error');
  }
}

// Bulk Actions (Checkpoint 10)
async function executeBulkAction(action, value) {
  try {
    const res = await API.bulkProducts(currentSlug, action, value);
    showToast(res.message, 'success');
    await loadProducts();
    await refreshDashboard();
  } catch (err) {
    showToast('Bulk action error: ' + err.message, 'error');
  }
}

async function triggerDummyImport() {
  try {
    showToast('Importing sample products for this store...', 'info');
    const res = await API.importDummyProducts(currentSlug, currentStore.categories);
    showToast(res.message, 'success');
    await loadProducts();
    await refreshDashboard();
  } catch (err) {
    showToast('Dummy import error: ' + err.message, 'error');
  }
}

// 5. Orders Management & Email Workflow (Checkpoint 11)
async function loadOrders() {
  try {
    const res = await API.getOrders(currentSlug, activeOrderFilter);
    currentOrders = res.orders || [];
    renderOrdersTable(currentOrders);
  } catch (err) {
    showToast('Failed to load orders: ' + err.message, 'error');
  }
}

function filterAdminOrders(status) {
  activeOrderFilter = status;
  document.querySelectorAll('#orderFilterTabs .cat-tab-btn').forEach(b => {
    b.classList.toggle('active', b.innerText.toLowerCase().includes(status));
  });
  loadOrders();
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">No orders found matching status "${activeOrderFilter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const itemsSummary = o.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
    return `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">${o.orderNumber}</td>
        <td>
          <div style="font-weight: 600;">${o.customer.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${o.customer.email} • ${o.customer.city || ''}</div>
        </td>
        <td style="max-width: 240px; font-size: 0.85rem;" title="${itemsSummary}">
          ${itemsSummary.length > 50 ? itemsSummary.slice(0, 50) + '...' : itemsSummary}
        </td>
        <td style="font-weight: 700;">₹${o.total.toFixed(2)}</td>
        <td>
          <select class="form-select" style="padding: 4px 8px; font-size: 0.8rem; width: auto;" onchange="handleOrderStatusChange('${o._id}', event.target.value)">
            <option value="placed" ${o.status === 'placed' ? 'selected' : ''}>Placed</option>
            <option value="packed" ${o.status === 'packed' ? 'selected' : ''}>Packed</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="previewCustomerEmail('${o._id}')">✉️ Send Update</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleOrderStatusChange(orderId, newStatus) {
  try {
    const res = await API.updateOrderStatus(currentSlug, orderId, newStatus);
    showToast(res.message, 'success');
    await refreshDashboard();
  } catch (err) {
    showToast('Failed to update status: ' + err.message, 'error');
  }
}

async function previewCustomerEmail(orderId) {
  try {
    const res = await API.notifyCustomer(currentSlug, orderId);
    const notif = res.notification;

    document.getElementById('notifyCustomerEmail').innerText = notif.to;
    document.getElementById('notifySubject').innerText = notif.subject;
    document.getElementById('notifyBody').innerText = notif.body;

    document.getElementById('emailModal').classList.add('active');
  } catch (err) {
    showToast('Failed to generate notification: ' + err.message, 'error');
  }
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.remove('active');
}

// 6. Theme & Branding Editor (Checkpoint 9)
function populateThemeSettings() {
  if (!currentStore) return;
  const theme = currentStore.theme || {};

  document.getElementById('editStoreName').value = currentStore.name || '';
  document.getElementById('editLogoUrl').value = currentStore.logoUrl || '';
  document.getElementById('editContactEmail').value = currentStore.contactEmail || '';
  document.getElementById('editContactPhone').value = currentStore.contactPhone || '';
  document.getElementById('editAddress').value = currentStore.address || '';

  document.getElementById('editBannerTitle').value = theme.bannerTitle || '';
  document.getElementById('editBannerSubtitle').value = theme.bannerSubtitle || '';
  document.getElementById('editBannerImg').value = theme.bannerImageUrl || '';
  document.getElementById('editPrimaryColor').value = theme.primaryColor || '#4f46e5';
  document.getElementById('editSecondaryColor').value = theme.secondaryColor || '#06b6d4';
  document.getElementById('editFontFamily').value = theme.fontFamily || "'Inter', sans-serif";
  document.getElementById('editBorderRadius').value = theme.borderRadius || '10px';
  document.getElementById('editFooterText').value = theme.footerText || '';
}

async function saveStoreSettings() {
  try {
    const updatePayload = {
      name: document.getElementById('editStoreName').value.trim(),
      logoUrl: document.getElementById('editLogoUrl').value.trim(),
      contactEmail: document.getElementById('editContactEmail').value.trim(),
      contactPhone: document.getElementById('editContactPhone').value.trim(),
      address: document.getElementById('editAddress').value.trim(),
      theme: {
        ...(currentStore.theme || {}),
        bannerTitle: document.getElementById('editBannerTitle').value.trim(),
        bannerSubtitle: document.getElementById('editBannerSubtitle').value.trim(),
        bannerImageUrl: document.getElementById('editBannerImg').value.trim(),
        primaryColor: document.getElementById('editPrimaryColor').value,
        secondaryColor: document.getElementById('editSecondaryColor').value,
        fontFamily: document.getElementById('editFontFamily').value,
        borderRadius: document.getElementById('editBorderRadius').value,
        footerText: document.getElementById('editFooterText').value.trim(),
      }
    };

    const res = await API.updateStore(currentSlug, updatePayload);
    currentStore = res.store;
    document.getElementById('topStoreName').innerText = currentStore.name;
    showToast('Storefront content and styling saved to MongoDB!', 'success');
  } catch (err) {
    showToast('Failed to save settings: ' + err.message, 'error');
  }
}

// 7. Grounded AI Copilot Chatbot (Checkpoints 13 & 14)
function sendCopilotPrompt(question) {
  document.getElementById('copilotInput').value = question;
  askCopilot(question);
}

function handleCopilotSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('copilotInput');
  const question = input.value.trim();
  if (!question) return;
  input.value = '';
  askCopilot(question);
}

async function askCopilot(question) {
  const container = document.getElementById('copilotMessages');
  const sendBtn = document.getElementById('copilotSendBtn');

  // Render user question
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'copilot-msg user';
  userMsgEl.innerHTML = `<div class="copilot-bubble">${escapeHtml(question)}</div>`;
  container.appendChild(userMsgEl);

  // Render thinking indicator
  const thinkingEl = document.createElement('div');
  thinkingEl.className = 'copilot-msg';
  thinkingEl.id = 'copilotThinkingIndicator';
  thinkingEl.innerHTML = `
    <div class="copilot-avatar">AI</div>
    <div class="copilot-bubble" style="color: var(--text-muted);">
      Querying MongoDB database for ${currentStore.name}...
    </div>
  `;
  container.appendChild(thinkingEl);
  container.scrollTop = container.scrollHeight;

  sendBtn.disabled = true;

  try {
    const res = await API.askChatbot(currentSlug, question);
    thinkingEl.remove();

    const formattedAnswer = formatAdminAiMarkdown(res.answer || '');

    // Evidence table builder
    let evidenceHtml = '';
    if (res.dataEvidence && res.dataEvidence.length > 0) {
      const keys = Object.keys(res.dataEvidence[0]);
      evidenceHtml = `
        <div style="margin-top: 10px;">
          <details>
            <summary style="cursor: pointer; font-size: 0.8rem; font-weight: 700; color: var(--primary);">
              🔍 View Grounded Database Evidence (${res.dataEvidence.length} records)
            </summary>
            <div class="evidence-box">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                    ${keys.map(k => `<th style="padding: 4px 6px;">${k}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${res.dataEvidence.map(row => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      ${keys.map(k => `<td style="padding: 4px 6px;">${row[k]}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      `;
    }

    const aiMsgEl = document.createElement('div');
    aiMsgEl.className = 'copilot-msg';
    aiMsgEl.innerHTML = `
      <div class="copilot-avatar">AI</div>
      <div class="copilot-bubble">
        <div>${formattedAnswer}</div>
        ${evidenceHtml}
      </div>
    `;
    container.appendChild(aiMsgEl);
    container.scrollTop = container.scrollHeight;

  } catch (err) {
    thinkingEl.remove();
    const errorEl = document.createElement('div');
    errorEl.className = 'copilot-msg';
    errorEl.innerHTML = `
      <div class="copilot-avatar">AI</div>
      <div class="copilot-bubble" style="color: var(--danger);">
        Error querying database: ${err.message}
      </div>
    `;
    container.appendChild(errorEl);
  } finally {
    sendBtn.disabled = false;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

function formatAdminAiMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.*$)/gim, '<h4 style="color: var(--primary); font-weight: 800; margin: 10px 0 6px 0; font-size: 1.05rem;">$1</h4>');
  html = html.replace(/^#### (.*$)/gim, '<h5 style="color: var(--text); font-weight: 700; margin: 8px 0 4px 0; font-size: 0.95rem;">$1</h5>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--primary); text-decoration: underline;" target="_blank">$1</a>');
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 18px; margin-bottom: 4px;">$1</li>');
  html = html.replace(/^\s*([0-9]+\.)\s+(.*$)/gim, '<li style="margin-left: 18px; margin-bottom: 4px;"><strong>$1</strong> $2</li>');
  html = html.replace(/\n\n/g, '<div style="height: 6px;"></div>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

// 7. Storefront QR Code Suite (LaunchX)
function openStoreQrModal() {
  if (!currentStore && !currentSlug) return;
  const storeName = (currentStore && currentStore.name) || currentSlug;
  const url = `${window.location.origin}/store/${currentSlug}`;

  const titleEl = document.getElementById('adminQrStoreTitle');
  if (titleEl) titleEl.innerText = storeName;
  const urlEl = document.getElementById('adminQrStoreUrl');
  if (urlEl) urlEl.innerText = url;

  const container = document.getElementById('adminQrCodeDisplay');
  if (container) {
    container.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#0B0D17",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  const modal = document.getElementById('storeQrModal');
  if (modal) modal.classList.add('active');
}

function closeStoreQrModal() {
  const modal = document.getElementById('storeQrModal');
  if (modal) modal.classList.remove('active');
}

function downloadAdminStoreQr() {
  const container = document.getElementById('adminQrCodeDisplay');
  if (!container) return;
  const img = container.querySelector('img');
  const canvas = container.querySelector('canvas');
  let dataUrl = '';
  if (img && img.src && img.src.startsWith('data:')) {
    dataUrl = img.src;
  } else if (canvas) {
    dataUrl = canvas.toDataURL('image/png');
  }
  if (!dataUrl) {
    showToast('QR code is still preparing, please try again in a moment', 'info');
    return;
  }
  const link = document.createElement('a');
  link.download = `${currentSlug || 'store'}-qr.png`;
  link.href = dataUrl;
  link.click();
  showToast('QR code downloaded successfully!', 'success');
}

function shareAdminStoreWhatsApp() {
  const url = `${window.location.origin}/store/${currentSlug}`;
  const name = currentStore ? currentStore.name : 'Our Store';
  const text = encodeURIComponent(`Shop online at ${name}: ${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function copyAdminStoreUrl() {
  const url = `${window.location.origin}/store/${currentSlug}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Storefront URL copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy text', 'error');
  });
}

