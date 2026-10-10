// Storefront Client Logic (LaunchX)

let currentStore = null;
let currentProducts = [];
let activeCategory = 'All';
let searchQuery = '';
let activeSort = 'newest';
let cart = [];
let activeModalProduct = null;
let selectedModalVariant = '';
let modalQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  initStoreTheme();
  const slug = getStoreSlugFromUrl();
  setupEditorIframeBridge();
  loadCart(slug);
  await loadStoreData(slug);
  await loadProducts(slug);
});

function setupEditorIframeBridge() {
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === 'SCROLL_TO') {
      if (e.data.section === 'hero') {
        document.getElementById('heroBanner')?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.data.section === 'catalog') {
        document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.data.section === 'categories') {
        document.getElementById('categoryTabs')?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.data.section === 'cart') {
        toggleCartDrawer(true);
      } else if (e.data.section === 'footer') {
        document.querySelector('.store-footer')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.data.type === 'LIVE_THEME_UPDATE') {
      if (e.data.theme) applyStoreTheme(e.data.theme);
      if (e.data.bannerTitle !== undefined) {
        const el = document.getElementById('heroTitle');
        if (el) el.innerText = e.data.bannerTitle;
      }
      if (e.data.bannerSubtitle !== undefined) {
        const el = document.getElementById('heroSubtitle');
        if (el) el.innerText = e.data.bannerSubtitle;
      }
      if (e.data.bannerImageUrl !== undefined && e.data.bannerImageUrl) {
        const banner = document.getElementById('heroBanner');
        if (banner) banner.style.backgroundImage = `url('${e.data.bannerImageUrl}')`;
      }
      if (e.data.storeName) {
        const navEl = document.getElementById('navStoreName');
        if (navEl) navEl.innerText = e.data.storeName;
        const footEl = document.getElementById('footerStoreName');
        if (footEl) footEl.innerText = e.data.storeName;
      }
      if (e.data.footerText) {
        const copyEl = document.getElementById('footerCopyright');
        if (copyEl) copyEl.innerText = e.data.footerText;
      }
    }
  });
}

function getStoreSlugFromUrl() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'store' && pathParts[1]) {
    return pathParts[1];
  }
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('store') || 'urban-threads';
}

// 1. Load Store Configuration & Dynamic Themes
async function loadStoreData(slug) {
  try {
    const res = await API.getStore(slug);
    currentStore = res.store;

    document.title = `${currentStore.name} | Official Store`;

    // Apply theme styling
    applyStoreTheme(currentStore.theme);

    // Populate Navbar
    document.getElementById('navStoreName').innerText = currentStore.name;
    if (currentStore.logoUrl) {
      const logoImg = document.getElementById('navLogoImg');
      logoImg.src = currentStore.logoUrl;
      logoImg.style.display = 'block';
    }

    // Admin & Editor shortcuts
    const adminLink = document.getElementById('adminShortcutLink');
    if (adminLink) adminLink.href = `/admin?store=${currentStore.slug}`;
    const editorLink = document.getElementById('editorShortcutLink');
    if (editorLink) editorLink.href = `/editor/${currentStore.slug}`;
    const footerAdmin = document.getElementById('footerAdminLink');
    if (footerAdmin) footerAdmin.href = `/admin?store=${currentStore.slug}`;

    // Hero Banner
    const theme = currentStore.theme || {};
    document.getElementById('heroTitle').innerText = theme.bannerTitle || `Welcome to ${currentStore.name}`;
    document.getElementById('heroSubtitle').innerText = theme.bannerSubtitle || 'Curated essentials.';
    if (theme.bannerImageUrl) {
      document.getElementById('heroBanner').style.backgroundImage = `url('${theme.bannerImageUrl}')`;
    }

    // Category Tabs
    renderCategoryTabs(currentStore.categories || []);

    // Footer
    document.getElementById('footerStoreName').innerText = currentStore.name;
    document.getElementById('footerAddress').innerText = currentStore.address || 'Online Direct Store';
    document.getElementById('footerEmail').innerText = `Email: ${currentStore.contactEmail || 'support@store.com'}`;
    document.getElementById('footerPhone').innerText = `Phone: ${currentStore.contactPhone || '+1 (555) 000-0000'}`;
    document.getElementById('footerCopyright').innerText = theme.footerText || `© ${new Date().getFullYear()} ${currentStore.name}. Powered by LaunchX.`;

  } catch (err) {
    showToast('Failed to load store: ' + err.message, 'error');
    document.getElementById('productsGrid').innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0;">
        <h3>Store not found</h3>
        <p class="text-muted">The requested store URL does not exist or has not been published yet.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 14px;">Launch a New Store →</a>
      </div>
    `;
  }
}

function applyStoreTheme(theme = {}) {
  const body = document.getElementById('storeBody');
  const themeId = theme.id || 'modern';

  // Apply theme classes
  body.classList.remove('theme-modern', 'theme-cyber', 'theme-luxury', 'theme-organic');
  body.classList.add(`theme-${themeId}`);

  // Inset custom CSS properties if specified
  const root = document.documentElement;
  if (theme.primaryColor) root.style.setProperty('--sf-primary', theme.primaryColor);
  if (theme.secondaryColor) root.style.setProperty('--sf-secondary', theme.secondaryColor);
  if (theme.fontFamily) root.style.setProperty('--sf-font', theme.fontFamily);
  if (theme.borderRadius) root.style.setProperty('--sf-radius', theme.borderRadius);
}

function renderCategoryTabs(categories) {
  const container = document.getElementById('categoryTabs');
  const allTabs = ['All', ...categories.filter(c => c !== 'All')];

  container.innerHTML = allTabs.map(cat => `
    <button class="cat-tab-btn ${cat === activeCategory ? 'active' : ''}" onclick="filterCategory('${escapeQuotes(cat)}')">
      ${cat === 'All' ? 'All Products' : cat}
    </button>
  `).join('');
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// 2. Load and Render Products
async function loadProducts(slug) {
  try {
    const params = {
      sort: activeSort,
    };
    if (activeCategory !== 'All') {
      params.category = activeCategory;
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    const res = await API.getProducts(slug, params);
    currentProducts = res.products;
    renderProductsGrid(currentProducts);
  } catch (err) {
    showToast('Failed to load products: ' + err.message, 'error');
  }
}

function renderProductsGrid(products) {
  const grid = document.getElementById('productsGrid');

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--sf-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">📦</div>
        <h3>No products found</h3>
        <p>Try searching for a different keyword or select another category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(prod => {
    const isSale = prod.compareAtPrice > prod.price;
    const isLowStock = prod.stock > 0 && prod.stock <= 5;
    const isOutOfStock = prod.stock <= 0;
    const imgUrl = (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

    return `
      <div class="product-card">
        <div class="product-image-wrap" onclick="openProductModal('${prod._id}')">
          <img src="${imgUrl}" alt="${prod.name}" class="product-img" loading="lazy">
          <div class="product-badge-stack">
            ${isSale ? '<span class="badge badge-danger">SALE</span>' : ''}
            ${isLowStock ? `<span class="badge badge-warning">Only ${prod.stock} Left</span>` : ''}
            ${isOutOfStock ? '<span class="badge badge-muted">Sold Out</span>' : ''}
          </div>
        </div>

        <div class="product-body">
          <div class="product-category-meta">${prod.category}</div>
          <h4 class="product-title" onclick="openProductModal('${prod._id}')">${prod.name}</h4>
          <p class="product-desc">${prod.description || 'Premium handcrafted item.'}</p>

          <div class="product-footer">
            <div class="product-price-box">
              <span class="price-current">₹${prod.price.toFixed(2)}</span>
              ${isSale ? `<span class="price-compare">₹${prod.compareAtPrice.toFixed(2)}</span>` : ''}
            </div>

            <button class="add-cart-btn" onclick="quickAddToCart('${prod._id}')" ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? 'Sold Out' : '+ Add'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Category and Filter Events
function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-tab-btn').forEach(b => {
    b.classList.toggle('active', b.innerText.trim() === (cat === 'All' ? 'All Products' : cat));
  });
  loadProducts(currentStore.slug);
}

let searchDebounce = null;
function handleSearch(event) {
  clearTimeout(searchDebounce);
  searchQuery = event.target.value;
  searchDebounce = setTimeout(() => {
    loadProducts(currentStore.slug);
  }, 250);
}

function handleSortChange(event) {
  activeSort = event.target.value;
  loadProducts(currentStore.slug);
}

// 3. Product Details Modal
function openProductModal(productId) {
  const prod = currentProducts.find(p => p._id === productId);
  if (!prod) return;

  activeModalProduct = prod;
  modalQuantity = 1;
  document.getElementById('modalQtyDisplay').innerText = '1';

  document.getElementById('modalProductTitle').innerText = prod.name;
  document.getElementById('modalProductCategory').innerText = prod.category;
  document.getElementById('modalProductPrice').innerText = `₹${prod.price.toFixed(2)}`;
  document.getElementById('modalProductSku').innerText = prod.sku ? `SKU: ${prod.sku}` : '';
  document.getElementById('modalProductDesc').innerText = prod.description || 'No description provided.';
  document.getElementById('modalProductImg').src = (prod.images && prod.images[0]) || '';

  // Stock status
  const stockEl = document.getElementById('modalStockStatus');
  if (prod.stock <= 0) {
    stockEl.innerHTML = '<span class="badge badge-danger">Out of Stock</span>';
    document.getElementById('modalAddToCartBtn').disabled = true;
  } else if (prod.stock <= 5) {
    stockEl.innerHTML = `<span class="badge badge-warning">Hurry! Only ${prod.stock} items remaining</span>`;
    document.getElementById('modalAddToCartBtn').disabled = false;
  } else {
    stockEl.innerHTML = `<span class="badge badge-success">In Stock (${prod.stock} units available)</span>`;
    document.getElementById('modalAddToCartBtn').disabled = false;
  }

  // Variants
  const variantContainer = document.getElementById('modalVariantContainer');
  if (prod.variants && prod.variants.length > 0) {
    const v = prod.variants[0];
    selectedModalVariant = v.options && v.options[0] ? v.options[0] : '';
    variantContainer.innerHTML = `
      <label class="form-label" style="margin-bottom: 6px;">Select ${v.name}:</label>
      <div class="flex items-center gap-2" style="flex-wrap: wrap;">
        ${v.options.map(opt => `
          <button type="button" class="btn btn-outline btn-sm variant-pill ${opt === selectedModalVariant ? 'btn-primary' : ''}" onclick="selectModalVariant('${opt}')">
            ${opt}
          </button>
        `).join('')}
      </div>
    `;
  } else {
    selectedModalVariant = '';
    variantContainer.innerHTML = '';
  }

  document.getElementById('productModal').classList.add('active');
}

function selectModalVariant(opt) {
  selectedModalVariant = opt;
  document.querySelectorAll('.variant-pill').forEach(b => {
    b.classList.toggle('btn-primary', b.innerText.trim() === opt);
    b.classList.toggle('btn-outline', b.innerText.trim() !== opt);
  });
}

function adjustModalQty(delta) {
  if (!activeModalProduct) return;
  modalQuantity = Math.max(1, Math.min(modalQuantity + delta, activeModalProduct.stock || 99));
  document.getElementById('modalQtyDisplay').innerText = modalQuantity;
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  activeModalProduct = null;
}

function addModalItemToCart() {
  if (!activeModalProduct) return;
  addToCart(activeModalProduct, modalQuantity, selectedModalVariant);
  closeProductModal();
  toggleCartDrawer(true);
}

function quickAddToCart(productId) {
  const prod = currentProducts.find(p => p._id === productId);
  if (!prod || prod.stock <= 0) return;
  const defaultVar = (prod.variants && prod.variants[0] && prod.variants[0].options[0]) || '';
  addToCart(prod, 1, defaultVar);
  showToast(`Added "${prod.name}" to your cart`, 'success');
}

// 4. Cart Logic
function loadCart(slug) {
  try {
    const raw = localStorage.getItem(`cart_${slug}`);
    cart = raw ? JSON.parse(raw) : [];
  } catch (e) {
    cart = [];
  }
  updateCartUI();
}

function saveCart() {
  if (currentStore) {
    localStorage.setItem(`cart_${currentStore.slug}`, JSON.stringify(cart));
  }
  updateCartUI();
}

function addToCart(product, quantity = 1, variant = '') {
  const existingIndex = cart.findIndex(item => item.productId === product._id && item.selectedVariant === variant);

  if (existingIndex > -1) {
    cart[existingIndex].quantity = Math.min(cart[existingIndex].quantity + quantity, product.stock);
  } else {
    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      selectedVariant: variant,
      image: (product.images && product.images[0]) || '',
      maxStock: product.stock
    });
  }

  saveCart();
}

function updateCartQty(index, delta) {
  if (cart[index]) {
    const newQty = cart[index].quantity + delta;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = Math.min(newQty, cart[index].maxStock || 99);
    }
    saveCart();
  }
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
}

function toggleCartDrawer(open) {
  const backdrop = document.getElementById('cartDrawerBackdrop');
  backdrop.classList.toggle('active', open);
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCountBadge').innerText = totalCount;
  document.getElementById('cartDrawerCount').innerText = totalCount;

  const container = document.getElementById('cartItemsContainer');

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 0; color: var(--sf-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">🛒</div>
        <h4>Your cart is empty</h4>
        <p style="font-size: 0.85rem; margin-top: 4px;">Discover products and add them to your cart.</p>
      </div>
    `;
    document.getElementById('cartSubtotalText').innerText = '₹0.00';
    document.getElementById('cartShippingText').innerText = '₹0.00';
    document.getElementById('cartTaxText').innerText = '₹0.00';
    document.getElementById('cartTotalText').innerText = '₹0.00';
    document.getElementById('checkoutBtn').disabled = true;
    return;
  }

  document.getElementById('checkoutBtn').disabled = false;

  let subtotal = 0;
  container.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">
            ${item.selectedVariant ? `<span>${item.selectedVariant} • </span>` : ''}
            <span>₹${item.price.toFixed(2)}</span>
          </div>
          <div class="cart-item-stepper">
            <button class="step-btn" onclick="updateCartQty(${index}, -1)">-</button>
            <span style="font-weight: 700; font-size: 0.85rem; width: 20px; text-align: center;">${item.quantity}</span>
            <button class="step-btn" onclick="updateCartQty(${index}, 1)">+</button>
            <button class="btn btn-outline btn-sm" style="margin-left: auto; padding: 2px 6px; font-size: 0.75rem;" onclick="removeCartItem(${index})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const shipping = subtotal > 499 ? 0 : 49.00;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + shipping + tax;

  document.getElementById('cartSubtotalText').innerText = `₹${subtotal.toFixed(2)}`;
  document.getElementById('cartShippingText').innerText = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
  document.getElementById('cartTaxText').innerText = `₹${tax.toFixed(2)}`;
  document.getElementById('cartTotalText').innerText = `₹${grandTotal.toFixed(2)}`;
  if (document.getElementById('checkoutTotalAmount')) {
    document.getElementById('checkoutTotalAmount').innerText = `₹${grandTotal.toFixed(2)}`;
  }
}

// 5. Checkout Modal Flow (Complete Your Order Suite)
let lastRecordedOrder = null;

function initStoreTheme() {
  if (localStorage.getItem('nf_theme') === 'light') {
    document.body.classList.add('theme-light');
    const btn = document.getElementById('storeThemeNavBtn');
    if (btn) btn.innerText = '🌙 Dark';
  }
}

function toggleStoreTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  const btn = document.getElementById('storeThemeNavBtn');
  if (isLight) {
    if (btn) btn.innerText = '🌙 Dark';
    localStorage.setItem('nf_theme', 'light');
  } else {
    if (btn) btn.innerText = '☀️ Light';
    localStorage.setItem('nf_theme', 'dark');
  }
}

function selectPaymentOpt(labelEl, value) {
  document.querySelectorAll('.payment-card-opt').forEach(el => el.classList.remove('active'));
  labelEl.classList.add('active');
  const radio = labelEl.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
  const select = document.getElementById('custPayment');
  if (select) select.value = value;
}

function openCheckoutModal() {
  if (cart.length === 0) return;
  toggleCartDrawer(false);

  // 1. Populate Mini Items Preview in Checkout Modal
  const listEl = document.getElementById('checkoutItemsPreview');
  if (listEl) {
    listEl.innerHTML = cart.map(item => `
      <div class="checkout-item-row">
        <img src="${item.image}" alt="${item.name}" class="checkout-item-img">
        <div class="checkout-item-name">${item.name}</div>
        <div class="checkout-item-qty">Qty: ${item.quantity}</div>
        <div class="checkout-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');
  }

  // 2. Calculations in Rupee (₹)
  let subtotal = 0;
  cart.forEach(it => subtotal += it.price * it.quantity);
  const shipping = subtotal > 499 ? 0 : 49.00;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + shipping + tax;

  const subEl = document.getElementById('checkoutModalSubtotal');
  if (subEl) subEl.innerText = `₹${subtotal.toFixed(2)}`;
  const shipEl = document.getElementById('checkoutModalShipping');
  if (shipEl) shipEl.innerText = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
  const taxEl = document.getElementById('checkoutModalTax');
  if (taxEl) taxEl.innerText = `₹${tax.toFixed(2)}`;
  const totalEl = document.getElementById('checkoutTotalAmount');
  if (totalEl) totalEl.innerText = `₹${grandTotal.toFixed(2)}`;

  const btn = document.getElementById('placeOrderSubmitBtn');
  if (btn) btn.innerHTML = `⚡ Place Order Now (₹${grandTotal.toFixed(2)})`;

  document.getElementById('checkoutFormPane').style.display = 'block';
  document.getElementById('checkoutSuccessPane').style.display = 'none';
  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal(reloadCatalog = false) {
  document.getElementById('checkoutModal').classList.remove('active');
  if (reloadCatalog && currentStore) {
    loadProducts(currentStore.slug);
  }
}

async function handlePlaceOrder(event) {
  event.preventDefault();

  const submitBtn = document.getElementById('placeOrderSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Submitting Order to MongoDB...';

  try {
    const customer = {
      name: document.getElementById('custName').value.trim(),
      email: document.getElementById('custEmail').value.trim(),
      phone: document.getElementById('custPhone').value.trim(),
      address: document.getElementById('custAddress').value.trim(),
      city: document.getElementById('custCity').value.trim(),
    };

    const notes = document.getElementById('custNotes') ? document.getElementById('custNotes').value.trim() : '';
    if (notes) customer.notes = notes;

    const paymentMethod = document.getElementById('custPayment').value;

    const res = await API.createOrder(currentStore.slug, {
      customer,
      items: cart,
      paymentMethod
    });

    lastRecordedOrder = res.order;

    // Clear cart
    cart = [];
    saveCart();

    // Show confirmation
    document.getElementById('confirmedOrderNumber').innerText = res.order.orderNumber;
    document.getElementById('confirmedCustomerEmail').innerText = customer.email;

    document.getElementById('checkoutFormPane').style.display = 'none';
    document.getElementById('checkoutSuccessPane').style.display = 'block';

    showToast(`Order ${res.order.orderNumber} successfully recorded!`, 'success');

  } catch (err) {
    showToast('Failed to place order: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '⚡ Place Order Now';
  }
}

function copyConfirmedOrderRef() {
  const el = document.getElementById('confirmedOrderNumber');
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    showToast('Order tracking number copied!', 'success');
  });
}

function shareCustomerOrderWhatsApp() {
  if (!lastRecordedOrder) return;
  const storeName = currentStore ? currentStore.name : 'Store';
  const orderNum = lastRecordedOrder.orderNumber;
  const total = lastRecordedOrder.total.toFixed(2);
  const itemsText = (lastRecordedOrder.items || []).map(it => `${it.quantity}x ${it.name}`).join(', ');
  const text = encodeURIComponent(`Hi! My order ${orderNum} with ${storeName} for ₹${total} (${itemsText}) is confirmed.`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}
