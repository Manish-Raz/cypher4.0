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

// 3. Dashboard Overview (Checkpoint 8)
async function refreshDashboard() {
  try {
    const res = await API.getStats(currentSlug);
    const stats = res.stats;

    document.getElementById('metricRevenue').innerText = `₹${stats.totalRevenue.toFixed(2)}`;
    document.getElementById('metricOrders').innerText = stats.totalOrders;
    document.getElementById('metricActiveOrders').innerText = `${stats.activeOrders} pending fulfillment`;
    document.getElementById('metricAov').innerText = `₹${stats.averageOrderValue.toFixed(2)}`;
    document.getElementById('metricProducts').innerText = stats.totalProducts;
    document.getElementById('metricLowStockCount').innerText = `${stats.lowStockCount} low in stock`;

    // Low stock warning banner
    const alertBanner = document.getElementById('lowStockAlertBanner');
    if (stats.lowStockCount > 0) {
      alertBanner.style.display = 'flex';
      document.getElementById('lowStockAlertText').innerText = `You have ${stats.lowStockCount} item(s) running low on inventory (5 units or less).`;
    } else {
      alertBanner.style.display = 'none';
    }

    // Recent orders
    const ordersRes = await API.getOrders(currentSlug, 'all');
    const recent = (ordersRes.orders || []).slice(0, 5);
    renderRecentOrders(recent);

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

    const formattedAnswer = res.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

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

