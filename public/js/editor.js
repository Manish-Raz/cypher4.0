// LaunchX Visual Studio Editor Logic

let currentSlug = '';
let currentStore = null;
let historyStack = [];
let historyIndex = -1;
let debounceTimer = null;

const themeArchetypes = {
  modern: {
    primaryColor: '#4f46e5',
    secondaryColor: '#06b6d4',
    fontFamily: "'Inter', sans-serif",
    borderRadius: '10px'
  },
  cyber: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#22D3EE',
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: '4px'
  },
  luxury: {
    primaryColor: '#1e293b',
    secondaryColor: '#d97706',
    fontFamily: "'Playfair Display', Georgia, serif",
    borderRadius: '4px'
  },
  organic: {
    primaryColor: '#b45309',
    secondaryColor: '#15803d',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '16px'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  initThemeSupport();
  setupKeyboardShortcuts();
  setupLiveInspectorListeners();
  await initEditorStores();
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

function setupLiveInspectorListeners() {
  const liveInputIds = [
    'inpPrimaryColor', 'inpSecondaryColor', 'inpFontFamily', 'inpBorderRadius',
    'inpHeroHeadline', 'inpHeroSubtitle', 'inpHeroImage', 'inpStoreName', 'inpFooterText'
  ];

  liveInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        syncLivePreview();
        debounceRecordHistory();
      });
      el.addEventListener('change', () => {
        syncLivePreview();
        recordHistoryState();
      });
    }
  });
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        editorRedo();
      } else {
        e.preventDefault();
        editorUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      editorRedo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveEditorChanges();
    }
  });
}

// 1. Initialize Stores
async function initEditorStores() {
  try {
    const res = await API.getStores();
    const stores = res.stores || [];
    const select = document.getElementById('editorStoreSelect');

    if (stores.length === 0) {
      showToast('No stores available. Redirecting to generator...', 'info');
      setTimeout(() => window.location.href = '/', 1200);
      return;
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const urlParams = new URLSearchParams(window.location.search);
    const requested = (pathParts[0] === 'editor' && pathParts[1]) || urlParams.get('store');

    currentSlug = (requested && stores.some(s => s.slug === requested))
      ? requested
      : stores[0].slug;

    select.innerHTML = stores.map(s => `
      <option value="${s.slug}" ${s.slug === currentSlug ? 'selected' : ''}>
        ✦ ${s.name} (${s.slug})
      </option>
    `).join('');

    await loadStoreForEditing(currentSlug);

  } catch (err) {
    showToast('Failed to load stores: ' + err.message, 'error');
  }
}

async function switchEditorStore(slug) {
  currentSlug = slug;
  const newUrl = `/editor/${slug}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
  await loadStoreForEditing(slug);
  showToast(`Switched active store to: ${currentStore.name}`, 'info');
}

async function loadStoreForEditing(slug) {
  try {
    const res = await API.getStore(slug);
    currentStore = res.store;
    const theme = currentStore.theme || {};

    document.getElementById('editorSlugTag').innerText = `slug: ${currentStore.slug}`;
    document.getElementById('editorLiveLink').href = `/store/${currentStore.slug}`;
    document.getElementById('editorAdminLink').href = `/admin?store=${currentStore.slug}`;

    // Populate Inspector Fields
    document.getElementById('inpStoreName').value = currentStore.name || '';
    document.getElementById('editThemePreset').value = theme.id || 'modern';
    document.getElementById('currentThemeBadge').innerText = (theme.id || 'modern').toUpperCase();
    document.getElementById('inpPrimaryColor').value = theme.primaryColor || '#8B5CF6';
    document.getElementById('inpSecondaryColor').value = theme.secondaryColor || '#22D3EE';
    document.getElementById('inpFontFamily').value = theme.fontFamily || "'Inter', sans-serif";
    document.getElementById('inpBorderRadius').value = theme.borderRadius || '10px';
    document.getElementById('inpHeroHeadline').value = theme.bannerTitle || '';
    document.getElementById('inpHeroSubtitle').value = theme.bannerSubtitle || '';
    document.getElementById('inpHeroImage').value = theme.bannerImageUrl || '';
    document.getElementById('inpFooterText').value = theme.footerText || '';

    // Load Preview Iframe
    refreshPreviewCanvas();

    // Reset history stack
    historyStack = [];
    historyIndex = -1;
    recordHistoryState(true);

  } catch (err) {
    showToast('Failed to load store settings: ' + err.message, 'error');
  }
}

function refreshPreviewCanvas() {
  const iframe = document.getElementById('previewIframe');
  iframe.src = `/store/${currentSlug}?t=${Date.now()}`;
}

// 2. Viewport Switching (Desktop / Tablet / Mobile)
function setViewport(mode) {
  const frame = document.getElementById('canvasFrame');
  document.getElementById('btnViewportDesktop').classList.toggle('active', mode === 'desktop');
  document.getElementById('btnViewportTablet').classList.toggle('active', mode === 'tablet');
  document.getElementById('btnViewportMobile').classList.toggle('active', mode === 'mobile');

  frame.classList.remove('viewport-tablet', 'viewport-mobile');
  if (mode === 'tablet') frame.classList.add('viewport-tablet');
  if (mode === 'mobile') frame.classList.add('viewport-mobile');
}

// 3. Theme Archetype Preset Switcher
function syncLivePreview() {
  const iframe = document.getElementById('previewIframe');
  if (!iframe || !iframe.contentWindow) return;
  const state = captureCurrentState();
  iframe.contentWindow.postMessage({
    type: 'LIVE_THEME_UPDATE',
    theme: {
      id: state.themeId,
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      fontFamily: state.fontFamily,
      borderRadius: state.borderRadius
    },
    bannerTitle: state.bannerTitle,
    bannerSubtitle: state.bannerSubtitle,
    bannerImageUrl: state.bannerImageUrl,
    storeName: state.name,
    footerText: state.footerText
  }, '*');
}

function handleThemePresetChange(themeKey) {
  const preset = themeArchetypes[themeKey];
  if (!preset) return;

  document.getElementById('inpPrimaryColor').value = preset.primaryColor;
  document.getElementById('inpSecondaryColor').value = preset.secondaryColor;
  document.getElementById('inpFontFamily').value = preset.fontFamily;
  document.getElementById('inpBorderRadius').value = preset.borderRadius;
  document.getElementById('currentThemeBadge').innerText = themeKey.toUpperCase();

  syncLivePreview();
  recordHistoryState();
  showToast(`Applied preset: ${themeKey.toUpperCase()}`, 'info');
}

// 4. Undo / Redo History Engine
function captureCurrentState() {
  return {
    name: document.getElementById('inpStoreName').value,
    themeId: document.getElementById('editThemePreset').value,
    primaryColor: document.getElementById('inpPrimaryColor').value,
    secondaryColor: document.getElementById('inpSecondaryColor').value,
    fontFamily: document.getElementById('inpFontFamily').value,
    borderRadius: document.getElementById('inpBorderRadius').value,
    bannerTitle: document.getElementById('inpHeroHeadline').value,
    bannerSubtitle: document.getElementById('inpHeroSubtitle').value,
    bannerImageUrl: document.getElementById('inpHeroImage').value,
    footerText: document.getElementById('inpFooterText').value
  };
}

function applyState(state) {
  document.getElementById('inpStoreName').value = state.name;
  document.getElementById('editThemePreset').value = state.themeId;
  document.getElementById('currentThemeBadge').innerText = state.themeId.toUpperCase();
  document.getElementById('inpPrimaryColor').value = state.primaryColor;
  document.getElementById('inpSecondaryColor').value = state.secondaryColor;
  document.getElementById('inpFontFamily').value = state.fontFamily;
  document.getElementById('inpBorderRadius').value = state.borderRadius;
  document.getElementById('inpHeroHeadline').value = state.bannerTitle;
  document.getElementById('inpHeroSubtitle').value = state.bannerSubtitle;
  document.getElementById('inpHeroImage').value = state.bannerImageUrl;
  document.getElementById('inpFooterText').value = state.footerText;
  syncLivePreview();
  updateUndoRedoButtons();
}

function recordHistoryState(initial = false) {
  const state = captureCurrentState();
  // Cut any redo forward history
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(state);
  historyIndex = historyStack.length - 1;

  if (!initial) {
    showToast('State updated', 'info');
  }
  updateUndoRedoButtons();
}

function debounceRecordHistory() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    recordHistoryState();
  }, 450);
}

function editorUndo() {
  if (historyIndex > 0) {
    historyIndex--;
    applyState(historyStack[historyIndex]);
    showToast('Undo action applied', 'info');
  }
}

function editorRedo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    applyState(historyStack[historyIndex]);
    showToast('Redo action applied', 'info');
  }
}

function updateUndoRedoButtons() {
  document.getElementById('btnUndo').disabled = historyIndex <= 0;
  document.getElementById('btnRedo').disabled = historyIndex >= historyStack.length - 1;
}

// 5. Section highlight & Canvas scroll
function highlightSection(sectionKey, evt) {
  document.querySelectorAll('.section-item-row').forEach(row => row.classList.remove('active'));
  const target = evt ? evt.currentTarget : (window.event ? window.event.currentTarget : null);
  if (target) target.classList.add('active');

  const iframe = document.getElementById('previewIframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'SCROLL_TO', section: sectionKey }, '*');
  }
  showToast(`Focusing section: ${sectionKey}`, 'info');
}

function populateSampleData() {
  document.getElementById('inpHeroHeadline').value = `DISCOVER // ${currentStore.name.toUpperCase()}`;
  document.getElementById('inpHeroSubtitle').value = 'Architectural forms and limited editions engineered for longevity.';
  syncLivePreview();
  recordHistoryState();
}

// 6. Save Changes directly to MongoDB
async function saveEditorChanges() {
  const saveBtn = document.getElementById('btnSaveStore');
  saveBtn.disabled = true;
  saveBtn.innerText = '⏳ Saving...';

  try {
    const payload = {
      name: document.getElementById('inpStoreName').value.trim(),
      theme: {
        ...(currentStore.theme || {}),
        id: document.getElementById('editThemePreset').value,
        primaryColor: document.getElementById('inpPrimaryColor').value,
        secondaryColor: document.getElementById('inpSecondaryColor').value,
        fontFamily: document.getElementById('inpFontFamily').value,
        borderRadius: document.getElementById('inpBorderRadius').value,
        bannerTitle: document.getElementById('inpHeroHeadline').value.trim(),
        bannerSubtitle: document.getElementById('inpHeroSubtitle').value.trim(),
        bannerImageUrl: document.getElementById('inpHeroImage').value.trim(),
        footerText: document.getElementById('inpFooterText').value.trim()
      }
    };

    const res = await API.updateStore(currentSlug, payload);
    currentStore = res.store;
    showToast('Store settings saved to MongoDB successfully!', 'success');
    refreshPreviewCanvas();

  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = '💾 Save to MongoDB';
  }
}
