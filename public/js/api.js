// API Client Helper for Launch-Your-Store

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Server request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Stores
  getStores() {
    return this.request('/api/stores');
  },
  getStore(slug) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}`);
  },
  createStore(storeData) {
    return this.request('/api/stores', {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  },
  updateStore(slug, storeData) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  },

  // Products
  getProducts(slug, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products${query ? '?' + query : ''}`);
  },
  getProduct(slug, id) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products/${id}`);
  },
  createProduct(slug, productData) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
  updateProduct(slug, id, productData) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },
  deleteProduct(slug, id) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products/${id}`, {
      method: 'DELETE',
    });
  },
  bulkProducts(slug, action, value, productIds = []) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products/bulk`, {
      method: 'POST',
      body: JSON.stringify({ action, value, productIds }),
    });
  },
  importDummyProducts(slug, categories = []) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products/dummy-import`, {
      method: 'POST',
      body: JSON.stringify({ categories }),
    });
  },
  importCsvProducts(slug, rows) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/products/csv-import`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  // Orders
  getOrders(slug, status = 'all') {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/orders?status=${status}`);
  },
  createOrder(slug, orderData) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  updateOrderStatus(slug, id, status, note = '') {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },
  notifyCustomer(slug, id) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/orders/${id}/notify`, {
      method: 'POST',
    });
  },
  getStats(slug) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/orders/stats/overview`);
  },

  // AI Chatbot
  askChatbot(slug, question) {
    return this.request(`/api/stores/${encodeURIComponent(slug)}/chatbot/query`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }
};

// Global Toast Messenger
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> <div>${message}</div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
