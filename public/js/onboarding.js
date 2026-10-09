// Onboarding Wizard Logic (Launch-Your-Store)

let currentStep = 1;
let selectedCategories = ['Hoodies & Jackets', 'Graphic Tees', 'Cargo & Pants', 'Accessories'];
let productImportMode = 'dummy'; // 'dummy' | 'csv'
let selectedTheme = 'modern';
let parsedCsvRows = [];
let createdStoreSlug = '';

// Pre-defined category suggestions by business type
const categoryPresets = {
  'Fashion & Apparel': ['Hoodies & Jackets', 'Graphic Tees', 'Cargo & Pants', 'Accessories', 'Headwear', 'Footwear'],
  'Food & Gourmet Bakery': ['Sourdough & Breads', 'French Pastries', 'Artisan Coffee', 'Gift Boxes', 'Cakes', 'Jams & Honey'],
  'Electronics & Tech': ['Audio & Headphones', 'Keyboards & Mice', 'Desk Setup', 'Cables & Power', 'Smart Gadgets'],
  'Home & Lifestyle': ['Ceramics & Mugs', 'Scented Candles', 'Linen & Pillows', 'Planters', 'Lighting'],
  'Artisanal & Handmade': ['Leather Goods', 'Woodcraft', 'Handmade Jewelry', 'Stationery', 'Pottery'],
  'Beauty & Wellness': ['Skincare Serums', 'Face Balms', 'Bath Salts', 'Hair Care', 'Aromatherapy']
};

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderCategories();
});

function setupEventListeners() {
  const storeNameInput = document.getElementById('storeNameInput');
  const businessTypeSelect = document.getElementById('businessTypeSelect');

  storeNameInput.addEventListener('input', (e) => {
    const slug = slugify(e.target.value);
    document.getElementById('slugPreview').innerText = `http://localhost:5000/store/${slug || 'your-store'}`;
    
    // Auto-update banner headline if still default
    const bannerHeadline = document.getElementById('bannerHeadlineInput');
    if (bannerHeadline && (!bannerHeadline.value || bannerHeadline.value.startsWith('Welcome to'))) {
      bannerHeadline.value = e.target.value ? `Welcome to ${e.target.value}` : 'Welcome to our official store';
    }
  });

  businessTypeSelect.addEventListener('change', (e) => {
    const bType = e.target.value;
    if (categoryPresets[bType]) {
      selectedCategories = [...categoryPresets[bType].slice(0, 4)];
      renderCategories();
    }
  });

  // Drag and drop for CSV
  const dropzone = document.getElementById('csvDropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); });
    });
    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        parseCsvFile(files[0]);
      }
    });
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setPresetLogo(url) {
  document.getElementById('logoUrlInput').value = url;
}

function renderCategories() {
  const container = document.getElementById('categoriesPills');
  if (!container) return;

  const currentType = document.getElementById('businessTypeSelect').value;
  const pool = categoryPresets[currentType] || ['Featured', 'All Products'];

  // Union of pool and any custom selected
  const allAvailable = Array.from(new Set([...pool, ...selectedCategories]));

  container.innerHTML = allAvailable.map(cat => {
    const isSelected = selectedCategories.includes(cat);
    return `
      <div class="category-pill ${isSelected ? 'selected' : ''}" onclick="toggleCategory('${escapeQuotes(cat)}')">
        <span>${isSelected ? '✓' : '+'}</span>
        <span>${cat}</span>
      </div>
    `;
  }).join('');
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

function toggleCategory(cat) {
  if (selectedCategories.includes(cat)) {
    if (selectedCategories.length === 1) {
      showToast('You must keep at least 1 category for your store', 'error');
      return;
    }
    selectedCategories = selectedCategories.filter(c => c !== cat);
  } else {
    selectedCategories.push(cat);
  }
  renderCategories();
}

function addCustomCategory() {
  const input = document.getElementById('customCategoryInput');
  const val = input.value.trim();
  if (!val) return;

  if (!selectedCategories.includes(val)) {
    selectedCategories.push(val);
    renderCategories();
    input.value = '';
    showToast(`Added category: "${val}"`, 'success');
  } else {
    showToast('Category already exists', 'info');
  }
}

function switchProductMode(mode) {
  productImportMode = mode;
  document.getElementById('tabDummy').classList.toggle('active', mode === 'dummy');
  document.getElementById('tabCsv').classList.toggle('active', mode === 'csv');
  document.getElementById('dummySection').style.display = mode === 'dummy' ? 'block' : 'none';
  document.getElementById('csvSection').style.display = mode === 'csv' ? 'block' : 'none';
}

function handleCsvFileSelected(event) {
  const file = event.target.files[0];
  if (file) parseCsvFile(file);
}

function parseCsvFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    processCsvText(text);
  };
  reader.readAsText(file);
}

function processCsvText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    showToast('CSV file is empty or missing data rows', 'error');
    return;
  }

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every(v => v === '')) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });

    // Validate row
    const rowNum = i + 1;
    const name = rowObj.Name || rowObj.name || rowObj['Product Name'];
    const price = parseFloat(rowObj.Price || rowObj.price);
    const stock = parseInt(rowObj.Stock || rowObj.stock || '10', 10);

    let rowStatus = 'Valid';
    let rowError = '';

    if (!name) {
      rowStatus = 'Invalid';
      rowError = 'Missing product name';
    } else if (isNaN(price) || price < 0) {
      rowStatus = 'Invalid';
      rowError = `Bad price "${rowObj.Price}"`;
    }

    if (rowStatus === 'Invalid') {
      errors.push({ row: rowNum, error: rowError });
    }

    rows.push({
      data: rowObj,
      status: rowStatus,
      error: rowError,
      name: name || 'Unnamed',
      price: !isNaN(price) ? `$${price.toFixed(2)}` : 'N/A',
      category: rowObj.Category || rowObj.category || 'General',
      stock: !isNaN(stock) ? stock : 10
    });
  }

  parsedCsvRows = rows;

  // Render preview table
  document.getElementById('csvPreviewContainer').style.display = 'block';
  document.getElementById('parsedRowCount').innerText = rows.length;

  const validCount = rows.filter(r => r.status === 'Valid').length;
  const invalidCount = errors.length;

  const badgeContainer = document.getElementById('csvValidationBadge');
  if (invalidCount === 0) {
    badgeContainer.innerHTML = `<span class="badge badge-success">✓ All ${validCount} rows valid!</span>`;
  } else {
    badgeContainer.innerHTML = `<span class="badge badge-warning">⚠️ ${validCount} valid, ${invalidCount} with errors</span>`;
  }

  const tbody = document.getElementById('csvPreviewTableBody');
  tbody.innerHTML = rows.map((r, idx) => `
    <tr style="${r.status === 'Invalid' ? 'background: #fff1f2;' : ''}">
      <td>#${idx + 2}</td>
      <td style="font-weight: 600;">${r.name}</td>
      <td>${r.price}</td>
      <td>${r.category}</td>
      <td>${r.stock}</td>
      <td>
        ${r.status === 'Valid'
          ? '<span class="badge badge-success">Valid</span>'
          : `<span class="badge badge-danger" title="${r.error}">Error: ${r.error}</span>`}
      </td>
    </tr>
  `).join('');

  showToast(`Parsed ${rows.length} rows from CSV`, 'info');
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

function selectTheme(themeId) {
  selectedTheme = themeId;
  document.querySelectorAll('.theme-option-card').forEach(card => card.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

function goToStep(stepNumber) {
  if (stepNumber < currentStep || createdStoreSlug) {
    proceedToStep(stepNumber);
  }
}

function proceedToStep(step) {
  if (step === 2) {
    const storeName = document.getElementById('storeNameInput').value.trim();
    const email = document.getElementById('contactEmailInput').value.trim();
    if (!storeName) {
      showToast('Please enter your store name before proceeding', 'error');
      document.getElementById('storeNameInput').focus();
      return;
    }
    if (!email) {
      showToast('Please provide a contact email', 'error');
      document.getElementById('contactEmailInput').focus();
      return;
    }
  }

  if (step === 3) {
    if (selectedCategories.length === 0) {
      showToast('Please select at least 1 product category', 'error');
      return;
    }
    if (productImportMode === 'csv' && parsedCsvRows.length === 0) {
      showToast('Please upload a CSV file or switch to 1-Click Dummy Import', 'error');
      return;
    }
  }

  currentStep = step;

  // Switch visible step pane
  document.querySelectorAll('.step-pane').forEach((pane, idx) => {
    pane.classList.toggle('active', idx + 1 === step);
  });

  // Update indicators
  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById(`stepIndicator${i}`);
    ind.classList.remove('active', 'completed');
    if (i === step) ind.classList.add('active');
    else if (i < step) ind.classList.add('completed');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function publishStore() {
  const publishBtn = document.getElementById('publishStoreBtn');
  publishBtn.disabled = true;
  publishBtn.innerHTML = '⏳ Creating Store in MongoDB...';

  try {
    const storeName = document.getElementById('storeNameInput').value.trim();
    const calculatedSlug = slugify(storeName);
    const businessType = document.getElementById('businessTypeSelect').value;
    const contactEmail = document.getElementById('contactEmailInput').value.trim();
    const contactPhone = document.getElementById('contactPhoneInput').value.trim();
    const address = document.getElementById('storeAddressInput').value.trim();
    const logoUrl = document.getElementById('logoUrlInput').value.trim();

    const bannerHeadline = document.getElementById('bannerHeadlineInput').value.trim();
    const bannerSubtitle = document.getElementById('bannerSubtitleInput').value.trim();

    // 1. Create Store Document
    const storeRes = await API.createStore({
      name: storeName,
      slug: calculatedSlug,
      businessType,
      contactEmail,
      contactPhone,
      address,
      logoUrl,
      categories: selectedCategories,
      theme: {
        id: selectedTheme,
        bannerTitle: bannerHeadline || `Welcome to ${storeName}`,
        bannerSubtitle: bannerSubtitle || 'Handcrafted items designed for quality.'
      }
    });

    createdStoreSlug = storeRes.store.slug;

    // 2. Import Products
    if (productImportMode === 'dummy') {
      publishBtn.innerHTML = '📦 Generating dummy inventory...';
      await API.importDummyProducts(createdStoreSlug, selectedCategories);
    } else if (productImportMode === 'csv' && parsedCsvRows.length > 0) {
      publishBtn.innerHTML = '📊 Importing CSV rows...';
      const validRowData = parsedCsvRows.filter(r => r.status === 'Valid').map(r => r.data);
      await API.importCsvProducts(createdStoreSlug, validRowData);
    }

    // 3. Move to Step 4 (Success Screen)
    const liveStoreUrl = `${window.location.origin}/store/${createdStoreSlug}`;
    document.getElementById('createdStoreUrlText').innerText = liveStoreUrl;
    document.getElementById('viewStoreLink').href = `/store/${createdStoreSlug}`;
    document.getElementById('openAdminLink').href = `/admin?store=${createdStoreSlug}`;

    proceedToStep(4);
    showToast(`🎉 Store "${storeName}" is now live!`, 'success');

  } catch (err) {
    showToast(err.message || 'Failed to publish store', 'error');
    publishBtn.disabled = false;
    publishBtn.innerHTML = '⚡ Create & Publish Live Store to MongoDB';
  }
}

function copyStoreUrl() {
  const text = document.getElementById('createdStoreUrlText').innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Storefront URL copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy text', 'error');
  });
}
