'use strict';

// =============================================================================
// VISTA Phase 4 Polish & Missing Features Implementation
// =============================================================================

// ── Helper to get DOM elements (avoid scope issues) ──
function getPreviewGrid() {
  return document.getElementById('previewGrid');
}

function getUrlInput() {
  return document.getElementById('urlInput');
}

function getHtmlInput() {
  return document.getElementById('htmlInput');
}

function getSitemapInput() {
  return document.getElementById('sitemapInput');
}

function getCompareUrl1() {
  return document.getElementById('compareUrl1');
}

function getCompareUrl2() {
  return document.getElementById('compareUrl2');
}

// ── Helper to access main app state ──
function getPlatformPrefs() {
  return window.platformPrefs || { favorites: new Set(), hidden: new Set(), columnCount: 3 };
}

function getCurrentData() {
  return window.currentData || null;
}

function getCurrentMode() {
  return window.currentMode || 'url';
}

// ── Helper to access main app functions (fallback implementations) ──
function switchTab(tabName) {
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (tabBtn && typeof tabBtn.click === 'function') {
    tabBtn.click();
  }
}

function switchMode(mode) {
  const modeMap = {
    'url': 'switchToUrl',
    'paste': 'switchToPaste',
    'compare': 'switchToCompare',
    'sitemap': 'switchToSitemap'
  };
  const btnId = modeMap[mode];
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.click();
  }
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
  }
}

function shareResults() {
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) shareBtn.click();
}

function undoEditorChange() {
  // Fallback - editor undo functionality
  console.log('Undo editor change');
}

function renderPreviews(data) {
  // Trigger re-render by dispatching custom event or using window function
  if (window.renderPreviewsInternal) {
    window.renderPreviewsInternal(data);
  }
}

function getGradeForScore(score) {
  if (score >= 97) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// =============================================================================
// 1. Global Keyboard Shortcuts
// =============================================================================

/**
 * Initialize global keyboard shortcuts
 * - / : Focus URL input
 * - 1-4 : Switch tabs (Previews, Diagnostics, Raw Tags, Cache)
 * - E : Toggle Editor mode
 * - C : Toggle Compare mode
 * - Cmd/Ctrl+Shift+C : Copy code snippet
 * - Cmd/Ctrl+Shift+S : Copy share link
 * - Cmd/Ctrl+Z : Undo last edit (in editor)
 */
function initGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in an input/textarea
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) ||
                     document.activeElement.isContentEditable;
    if (isTyping) {
      // Allow Cmd/Ctrl shortcuts even when typing
      if (!(e.metaKey || e.ctrlKey)) return;
    }

    // / : Focus URL input (only when not typing)
    if (e.key === '/' && !isTyping) {
      e.preventDefault();
      const currentMode = getCurrentMode();
      const urlInput = getUrlInput();
      if (currentMode === 'url' && urlInput) {
        urlInput.focus();
        urlInput.select();
      } else {
        switchMode('url');
        setTimeout(() => {
          const input = getUrlInput();
          if (input) input.focus();
        }, 100);
      }
      return;
    }

    // 1-4 : Switch tabs
    const currentData = getCurrentData();
    if (e.key === '1' && !isTyping) {
      e.preventDefault();
      if (currentData) switchTab('previews');
    }
    if (e.key === '2' && !isTyping) {
      e.preventDefault();
      if (currentData) switchTab('diagnostics');
    }
    if (e.key === '3' && !isTyping) {
      e.preventDefault();
      if (currentData) switchTab('rawtags');
    }
    if (e.key === '4' && !isTyping) {
      e.preventDefault();
      if (currentData) switchTab('cachehub');
    }

    // E : Toggle Editor mode
    if (e.key === 'e' && !isTyping && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (currentData) {
        const editorTab = document.getElementById('tabnav-editor');
        if (editorTab && !editorTab.classList.contains('hidden')) {
          switchTab('editor');
        }
      }
      return;
    }

    // C : Toggle Compare mode
    if (e.key === 'c' && !isTyping && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      switchMode('compare');
      return;
    }

    // Cmd/Ctrl+Shift+C : Copy code snippet
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      if (currentData) {
        switchTab('codesnippet');
        setTimeout(() => {
          const copyBtn = document.getElementById('snippetCopyBtn');
          if (copyBtn) copyBtn.click();
        }, 100);
      }
      return;
    }

    // Cmd/Ctrl+Shift+S : Copy share link
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      shareResults();
      return;
    }

    // Cmd/Ctrl+Z : Undo last edit (in editor)
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      // Only in editor context
      const editorTab = document.getElementById('tabEditor');
      if (editorTab && !editorTab.classList.contains('hidden')) {
        // Check if there's editor state to undo
        if (window.editorState && window.editorState.history && window.editorState.history.length > 0) {
          e.preventDefault();
          undoEditorChange();
        }
      }
      return;
    }
  });
}

// =============================================================================
// 2. Paste Auto-Detection
// =============================================================================

/**
 * Initialize paste auto-detection
 * Detects clipboard content and auto-switches mode
 */
function initPasteAutoDetection() {
  const urlInput = getUrlInput();
  if (!urlInput) return;

  urlInput.addEventListener('paste', (e) => {
    // Get pasted content
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    if (!pasteData) return;

    // Auto-detect content type
    const trimmed = pasteData.trim();

    // HTML detection
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.includes('<html')) {
      e.preventDefault();
      const htmlInput = getHtmlInput();
      if (htmlInput) htmlInput.value = trimmed;
      switchMode('paste');
      showToast('Detected HTML — switched to paste mode', 2000);
      return;
    }

    // Sitemap detection
    if (trimmed.includes('sitemap.xml')) {
      e.preventDefault();
      const sitemapInput = getSitemapInput();
      if (sitemapInput) sitemapInput.value = trimmed;
      switchMode('sitemap');
      showToast('Detected sitemap URL — switched to sitemap mode', 2000);
      return;
    }

    // Multiple URLs detection
    const urls = trimmed.split(/[\n\r]+/).map(line => line.trim()).filter(line =>
      line.startsWith('http://') || line.startsWith('https://')
    );
    if (urls.length >= 2) {
      e.preventDefault();
      const compareUrl1 = getCompareUrl1();
      const compareUrl2 = getCompareUrl2();
      if (compareUrl1) compareUrl1.value = urls[0];
      if (compareUrl2) compareUrl2.value = urls[1];
      switchMode('compare');
      showToast(`Detected ${urls.length} URLs — switched to compare mode`, 2000);
      return;
    }

    // Shortened URL detection
    const shortDomains = ['bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'ow.ly', 'is.gd'];
    const isShortUrl = shortDomains.some(domain => trimmed.includes(domain));
    if (isShortUrl) {
      showToast('Shortened URL detected — VISTA will follow redirects', 2500);
    }
  });
}

// =============================================================================
// 3. Card Right-Click Context Menu
// =============================================================================

let contextMenuTarget = null;

/**
 * Initialize card right-click context menu
 */
function initCardContextMenu() {
  // Create context menu element
  const menu = document.createElement('div');
  menu.className = 'card-context-menu hidden';
  menu.id = 'cardContextMenu';
  menu.innerHTML = `
    <div class="context-menu-item" data-action="screenshot">
      <span class="context-menu-icon">&#128190;</span>
      <span class="context-menu-label">Download Screenshot</span>
      <span class="context-menu-shortcut">Click screenshot button</span>
    </div>
    <div class="context-menu-item" data-action="edit">
      <span class="context-menu-icon">&#9998;</span>
      <span class="context-menu-label">Edit in Editor</span>
      <span class="context-menu-shortcut">E</span>
    </div>
    <div class="context-menu-item" data-action="rawtags">
      <span class="context-menu-icon">&#128196;</span>
      <span class="context-menu-label">View Raw Tags</span>
      <span class="context-menu-shortcut">3</span>
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="favorite">
      <span class="context-menu-icon">&#9733;</span>
      <span class="context-menu-label">Add to Favorites</span>
    </div>
    <div class="context-menu-item" data-action="hide">
      <span class="context-menu-icon">&#128065;</span>
      <span class="context-menu-label">Hide Platform</span>
    </div>
  `;
  document.body.appendChild(menu);

  // Add context menu listeners to preview grid
  const previewGrid = getPreviewGrid();
  if (!previewGrid) return;

  previewGrid.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.platform-card');
    if (!card) return;

    e.preventDefault();
    contextMenuTarget = card.dataset.pid;

    // Position menu
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.remove('hidden');

    // Update favorite label based on state
    const prefs = getPlatformPrefs();
    const favoriteItem = menu.querySelector('[data-action="favorite"]');
    if (prefs.favorites.has(contextMenuTarget)) {
      favoriteItem.querySelector('.context-menu-label').textContent = 'Remove from Favorites';
      favoriteItem.querySelector('.context-menu-icon').textContent = '&#9733;';
      favoriteItem.classList.add('favorited');
    } else {
      favoriteItem.querySelector('.context-menu-label').textContent = 'Add to Favorites';
      favoriteItem.classList.remove('favorited');
    }
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.add('hidden');
      contextMenuTarget = null;
    }
  });

  // Handle menu item clicks
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (!item) return;

    const action = item.dataset.action;
    if (!contextMenuTarget) return;

    handleContextMenuAction(action, contextMenuTarget);
    menu.classList.add('hidden');
    contextMenuTarget = null;
  });
}

/**
 * Handle context menu action
 */
function handleContextMenuAction(action, pid) {
  const currentData = getCurrentData();
  switch (action) {
    case 'screenshot':
      if (typeof window.downloadScreenshot === 'function') {
        window.downloadScreenshot(pid, currentData);
      } else {
        console.log('Screenshot for platform:', pid);
      }
      break;
    case 'edit':
      switchTab('editor');
      // Focus the relevant field in editor
      const field = document.querySelector(`[data-tag="og.title"]`);
      if (field) field.focus();
      break;
    case 'rawtags':
      switchTab('rawtags');
      break;
    case 'favorite':
      toggleFavorite(pid);
      break;
    case 'hide':
      hidePlatform(pid);
      break;
  }
}

/**
 * Toggle platform favorite status
 */
function toggleFavorite(pid) {
  const prefs = getPlatformPrefs();
  if (prefs.favorites.has(pid)) {
    prefs.favorites.delete(pid);
    showToast(`Removed ${PLATFORM_NAMES?.[pid] || pid} from favorites`, 2000);
  } else {
    prefs.favorites.add(pid);
    showToast(`Added ${PLATFORM_NAMES?.[pid] || pid} to favorites`, 2000);
  }
  savePlatformPrefs();
}

/**
 * Hide/show platform
 */
function hidePlatform(pid) {
  const prefs = getPlatformPrefs();
  if (prefs.hidden.has(pid)) {
    prefs.hidden.delete(pid);
    showToast(`Showing ${PLATFORM_NAMES?.[pid] || pid} again`, 2000);
  } else {
    prefs.hidden.add(pid);
    showToast(`Hid ${PLATFORM_NAMES?.[pid] || pid}`, 2000);
  }
  savePlatformPrefs();
  // Re-render to apply changes
  const currentData = getCurrentData();
  if (currentData && typeof window.renderPreviewsInternal === 'function') {
    window.renderPreviewsInternal(currentData);
  }
}

/**
 * Save platform preferences to localStorage
 */
function savePlatformPrefs() {
  const prefs = getPlatformPrefs();
  const toSave = {
    favorites: Array.from(prefs.favorites),
    hidden: Array.from(prefs.hidden),
    columnCount: prefs.columnCount,
    smartOrdering: prefs.smartOrdering !== false,
  };
  localStorage.setItem('vista-platform-prefs', JSON.stringify(toSave));
}

/**
 * Get platform names from main app
 */
const PLATFORM_NAMES = window.PLATFORM_NAMES || {
  google: 'Google Search', facebook: 'Facebook', twitter: 'X (Twitter)',
  linkedin: 'LinkedIn', reddit: 'Reddit', mastodon: 'Mastodon',
  bluesky: 'Bluesky', threads: 'Threads', tumblr: 'Tumblr', pinterest: 'Pinterest',
  slack: 'Slack', discord: 'Discord', whatsapp: 'WhatsApp', imessage: 'iMessage',
  telegram: 'Telegram', signal: 'Signal', teams: 'Microsoft Teams',
  googlechat: 'Google Chat', zoom: 'Zoom Chat', line: 'Line', kakaotalk: 'KakaoTalk',
  notion: 'Notion', jira: 'Jira / Confluence', github: 'GitHub', trello: 'Trello', figma: 'Figma',
  medium: 'Medium', substack: 'Substack', outlook: 'Outlook', gmail: 'Gmail', feedly: 'Feedly / RSS',
};

// =============================================================================
// 4. QR Code for Shareable Link
// =============================================================================

/**
 * Generate QR code for shareable link using client-side library
 */
function generateQRCode(url) {
  // qrcode.js will generate the QR code on a canvas element
  // This function now just returns the URL for display purposes
  return url;
}

/**
 * Show QR code modal with client-side generated QR code
 */
function showQRCodeModal() {
  const shareUrl = window.location.href;

  // Create modal if it doesn't exist
  let modal = document.getElementById('qrModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay hidden';
    modal.id = 'qrModal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Share via QR Code</h3>
          <button class="modal-close" id="qrModalClose">&times;</button>
        </div>
        <div class="modal-body qr-modal-body">
          <div id="qrCodeContainer"></div>
          <p class="qr-url">${shareUrl}</p>
          <div class="qr-actions">
            <button class="action-btn primary" id="qrDownloadBtn">&#128190; Download QR Code</button>
            <button class="action-btn" id="qrCopyUrlBtn">&#128203; Copy URL</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('qrModalClose').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
    document.getElementById('qrDownloadBtn').addEventListener('click', downloadQRCode);
    document.getElementById('qrCopyUrlBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl);
      showToast('URL copied to clipboard', 2000);
    });
  }

  // Clear any existing QR code and generate new one
  const qrContainer = document.getElementById('qrCodeContainer');
  qrContainer.innerHTML = '';

  // Generate QR code using qrcode.js
  new QRCode(qrContainer, {
    text: shareUrl,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Update URL display
  document.querySelector('.qr-url').textContent = shareUrl;

  modal.classList.remove('hidden');
}

/**
 * Download QR code image from canvas
 */
function downloadQRCode() {
  const qrContainer = document.getElementById('qrCodeContainer');
  if (!qrContainer) return;

  // Find the canvas or img element created by qrcode.js
  const canvas = qrContainer.querySelector('canvas');
  const img = qrContainer.querySelector('img');

  let dataUrl;
  if (canvas) {
    dataUrl = canvas.toDataURL('image/png');
  } else if (img) {
    dataUrl = img.src;
  } else {
    showToast('Error: QR code not found', 2000);
    return;
  }

  // Create download link
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'vista-qr-code.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast('QR Code downloaded!', 2000);
}

// =============================================================================
// 5. URL-based Score Badge API Enhancement
// =============================================================================

/**
 * Generate score badge for a given URL
 * This is already implemented in the backend, but we add a frontend helper
 */
async function fetchScoreBadgeForUrl(url) {
  try {
    const response = await fetch(`/api/badge/preview?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch badge');
    const data = await response.response;
    return data;
  } catch (err) {
    console.error('Badge fetch error:', err);
    return null;
  }
}

// =============================================================================
// 6. Per-Platform Character Budget Gauges
// =============================================================================

/**
 * Character limits per platform
 */
const PLATFORM_CHAR_LIMITS = {
  google: { title: 60, description: 158, unit: 'chars' },
  facebook: { title: 60, description: 160, unit: 'chars' },
  twitter: { title: 70, description: 200, unit: 'chars' },
  linkedin: { title: 60, description: 160, unit: 'chars' },
  slack: { title: 80, description: 150, unit: 'chars' },
  discord: { title: 256, description: 4096, unit: 'chars' },
  whatsapp: { title: 80, description: 120, unit: 'chars' },
};

/**
 * Get platform icons from the main app
 */
function getPlatformIcons() {
  return window.PLATFORM_ICONS || {
    google: '🔍', facebook: '📘', twitter: '🐦', linkedin: '💼', reddit: '🤖',
    slack: '💬', discord: '🎮', whatsapp: '📱', imessage: '💬', telegram: '✈️',
    signal: '🔐', teams: '👥', googlechat: '💬', zoom: '🎥', line: '📲',
    kakaotalk: '💛', notion: '📝', jira: '🔧', github: '🐙', trello: '📋',
    figma: '🎨', medium: '📖', substack: '📧', outlook: '📨', gmail: '📩',
    feedly: '📰',
  };
}

/**
 * Render character budget gauges below editor fields
 */
function renderCharacterGauges(field, value, fieldType) {
  const container = document.createElement('div');
  container.className = 'char-gauges-container';

  const title = document.createElement('div');
  title.className = 'char-gauges-title';
  title.textContent = 'Platform limits';
  container.appendChild(title);

  const gauges = document.createElement('div');
  gauges.className = 'char-gauges';

  const icons = getPlatformIcons();
  Object.entries(PLATFORM_CHAR_LIMITS).forEach(([pid, limits]) => {
    const limit = fieldType === 'title' ? limits.title : limits.description;
    if (!limit) return;

    const percent = Math.min(100, (value.length / limit) * 100);
    const status = percent >= 100 ? 'over' : percent >= 85 ? 'warning' : 'ok';

    const gauge = document.createElement('div');
    gauge.className = `char-gauge char-gauge-${status}`;
    gauge.innerHTML = `
      <span class="char-gauge-platform">${icons[pid] || '🌐'}</span>
      <div class="char-gauge-bar">
        <div class="char-gauge-fill" style="width: ${percent}%"></div>
      </div>
      <span class="char-gauge-count">${value.length}/${limit}</span>
    `;
    gauges.appendChild(gauge);
  });

  container.appendChild(gauges);
  return container;
}

/**
 * Initialize character gauges in editor
 */
function initCharacterGauges() {
  const titleField = document.getElementById('editTitle');
  const descField = document.getElementById('editDescription');

  if (titleField) {
    // Remove existing gauges if any
    const existingGauges = titleField.parentNode.querySelector('.char-gauges-container');
    if (existingGauges) existingGauges.remove();

    const gaugesContainer = renderCharacterGauges(titleField, titleField.value, 'title');
    titleField.parentNode.appendChild(gaugesContainer);

    // Add input listener if not already added
    if (!titleField.hasAttribute('data-gauges-initialized')) {
      titleField.setAttribute('data-gauges-initialized', 'true');
      titleField.addEventListener('input', () => {
        titleField.parentNode.querySelector('.char-gauges-container')?.remove();
        const newGauges = renderCharacterGauges(titleField, titleField.value, 'title');
        titleField.parentNode.appendChild(newGauges);
      });
    }
  }

  if (descField) {
    // Remove existing gauges if any
    const existingGauges = descField.parentNode.querySelector('.char-gauges-container');
    if (existingGauges) existingGauges.remove();

    const gaugesContainer = renderCharacterGauges(descField, descField.value, 'description');
    descField.parentNode.appendChild(gaugesContainer);

    // Add input listener if not already added
    if (!descField.hasAttribute('data-gauges-initialized')) {
      descField.setAttribute('data-gauges-initialized', 'true');
      descField.addEventListener('input', () => {
        descField.parentNode.querySelector('.char-gauges-container')?.remove();
        const newGauges = renderCharacterGauges(descField, descField.value, 'description');
        descField.parentNode.appendChild(newGauges);
      });
    }
  }
}

// =============================================================================
// 7. Score Improvement Predictions
// =============================================================================

/**
 * Calculate score improvement prediction for a diagnostic fix
 */
function predictScoreImprovement(diagnostic, currentScore) {
  // This is a simplified prediction - in production would run actual simulation
  const improvements = {
    'missing-og-image': { platforms: ['facebook', 'twitter', 'linkedin', 'slack'], delta: 15 },
    'missing-twitter-card': { platforms: ['twitter'], delta: 10 },
    'title-too-long': { platforms: ['google', 'facebook', 'linkedin'], delta: 5 },
    'description-too-long': { platforms: ['google', 'facebook', 'slack'], delta: 3 },
    'http-image-url': { platforms: ['whatsapp', 'signal'], delta: 8 },
    'relative-image-url': { platforms: ['all'], delta: 12 },
  };

  const key = diagnostic.code;
  const improvement = improvements[key];

  if (!improvement) {
    return {
      platforms: [],
      delta: 0,
      newGrade: currentScore.grade,
    };
  }

  const newScore = Math.min(100, currentScore.score + improvement.delta);
  const newGrade = getGradeForScore(newScore);

  return {
    platforms: improvement.platforms,
    delta: improvement.delta,
    newScore,
    newGrade,
    fromGrade: currentScore.grade,
  };
}

/**
 * Render score improvement predictions in diagnostics
 */
function renderScorePredictions(diagnostics, currentScore) {
  diagnostics.forEach((diag, index) => {
    const prediction = predictScoreImprovement(diag, currentScore);
    if (prediction.delta === 0) return;

    const diagItem = document.querySelectorAll('.diag-item')[index];
    if (!diagItem) return;

    const predictionEl = document.createElement('div');
    predictionEl.className = 'diag-prediction';
    predictionEl.innerHTML = `
      <span class="prediction-icon">&#128200;</span>
      <span class="prediction-text">
        Fixing this improves score by <strong>+${prediction.delta}</strong> points
        ${prediction.fromGrade !== prediction.newGrade ? ` (${prediction.fromGrade} → ${prediction.newGrade})` : ''}
      </span>
    `;

    diagItem.appendChild(predictionEl);
  });
}

// =============================================================================
// 8. Card Drag-to-Reorder
// =============================================================================

/**
 * Initialize card drag-to-reorder functionality
 */
function initCardDragReorder() {
  let draggedCard = null;
  let draggedGroupId = null;

  const previewGrid = getPreviewGrid();
  if (!previewGrid) return;

  previewGrid.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.platform-card');
    if (!card) return;

    draggedCard = card;
    const group = card.closest('.platform-group');
    draggedGroupId = group ? group.id : null;

    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  previewGrid.addEventListener('dragend', (e) => {
    const card = e.target.closest('.platform-card');
    if (card) {
      card.classList.remove('dragging');
    }
    draggedCard = null;
    draggedGroupId = null;
  });

  previewGrid.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedCard) return;

    const targetCard = e.target.closest('.platform-card');
    if (!targetCard || targetCard === draggedCard) return;

    const targetGroup = targetCard.closest('.platform-group');
    if (!targetGroup) return;
    if (draggedGroupId && targetGroup.id !== draggedGroupId) return; // Only allow reorder within group

    const cards = [...targetGroup.querySelectorAll('.platform-card')];
    const draggedIndex = cards.indexOf(draggedCard);
    const targetIndex = cards.indexOf(targetCard);

    if (draggedIndex < targetIndex) {
      targetCard.parentNode.insertBefore(draggedCard, targetCard.nextSibling);
    } else {
      targetCard.parentNode.insertBefore(draggedCard, targetCard);
    }
  });

  previewGrid.addEventListener('drop', (e) => {
    e.preventDefault();
    // Save new order to localStorage
    saveCardOrder();
  });

  // Add draggable attributes to cards after render
  const addDraggable = () => {
    document.querySelectorAll('.platform-card').forEach(card => {
      card.setAttribute('draggable', 'true');
    });
  };
  addDraggable();

  // Re-add draggable when cards are re-rendered
  const observer = new MutationObserver(() => addDraggable());
  observer.observe(previewGrid, { childList: true, subtree: true });
}

/**
 * Save card order to localStorage
 */
function saveCardOrder() {
  const order = {};
  document.querySelectorAll('.platform-group').forEach(group => {
    const groupId = group.id.replace('group-', '');
    const cards = [...group.querySelectorAll('.platform-card')].map(card => card.dataset.pid);
    order[groupId] = cards;
  });
  localStorage.setItem('vista-card-order', JSON.stringify(order));
}

/**
 * Load card order from localStorage
 */
function loadCardOrder() {
  const saved = localStorage.getItem('vista-card-order');
  if (!saved) return;

  try {
    const order = JSON.parse(saved);
    Object.entries(order).forEach(([groupId, platformOrder]) => {
      const group = document.getElementById('group-' + groupId);
      if (!group) return;

      const row = group.querySelector('.cards-row');
      if (!row) return;

      // Reorder cards
      platformOrder.forEach(pid => {
        const card = row.querySelector(`[data-pid="${pid}"]`);
        if (card) row.appendChild(card);
      });
    });
  } catch (e) {
    console.warn('Failed to load card order', e);
  }
}

// =============================================================================
// 9. Image Loading Placeholder with Dominant Color Extraction
// =============================================================================

/**
 * Extract dominant color from an image using canvas
 * Returns a CSS color string (rgb(r, g, b)) or neutral gray on error
 */
function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (e) {
        resolve('#e0e0e0');
      }
    };

    img.onerror = () => resolve('#e0e0e0');
    img.src = imageUrl;
  });
}

/**
 * Initialize loading placeholders for all card images
 * Extracts dominant color and applies it as background while images load
 * Note: Crossfade is handled via inline onload handlers in the HTML
 */
async function initImagePlaceholders(meta) {
  const ogImage = meta?.og?.image || meta?.twitter?.image;
  if (!ogImage) return;

  // Get dominant color for the OG image
  const dominantColor = await extractDominantColor(ogImage);

  // Apply dominant color to all loading containers
  document.querySelectorAll('#previewGrid .img-loading-container').forEach(container => {
    container.style.background = dominantColor;
  });

  // Apply dominant color to direct img elements with loading class
  document.querySelectorAll('#previewGrid img.img-loading').forEach(img => {
    img.style.backgroundColor = dominantColor;
  });
}

// =============================================================================
// 10. Resizable Split-Pane Editor
// =============================================================================

/**
 * Clone preview grid content into editor preview pane
 */
function syncEditorPreview() {
  const mainPreviewGrid = document.getElementById('previewGrid');
  const editorPreviewContent = document.getElementById('editorPreviewContent');
  if (!mainPreviewGrid || !editorPreviewContent) return;

  // Clone the preview grid content
  editorPreviewContent.innerHTML = mainPreviewGrid.innerHTML;

  // Remove the notice if it exists in the preview
  const notice = editorPreviewContent.querySelector('.editor-preview-notice');
  if (notice) notice.remove();

  // Add a header to show this is the live preview
  if (!editorPreviewContent.querySelector('.editor-preview-header')) {
    const header = document.createElement('div');
    header.className = 'editor-preview-header';
    header.innerHTML = '<h4>Live Preview</h4>';
    editorPreviewContent.insertBefore(header, editorPreviewContent.firstChild);
  }
}

/**
 * Initialize resizable split-pane editor
 */
function initResizableEditor() {
  const editorContainer = document.getElementById('editorContainer');
  if (!editorContainer) return;

  // Check if already initialized
  if (editorContainer.querySelector('.editor-split-wrapper')) return;

  // Get the editor header and notice
  const editorHeader = editorContainer.querySelector('.editor-header');
  const editorNotice = editorContainer.querySelector('.editor-preview-notice');

  // Create resizable structure
  const wrapper = document.createElement('div');
  wrapper.className = 'editor-split-wrapper';
  wrapper.innerHTML = `
    <div class="editor-pane" id="editorPane">
      <div class="editor-pane-content" id="editorPaneContent"></div>
    </div>
    <div class="split-divider" id="splitDivider">
      <div class="divider-handle"></div>
    </div>
    <div class="preview-pane" id="previewPane">
      <div class="preview-pane-content" id="editorPreviewContent"></div>
    </div>
  `;

  // Insert the wrapper after the header, before the notice
  if (editorHeader) {
    editorContainer.insertBefore(wrapper, editorHeader.nextSibling);
  } else {
    editorContainer.insertBefore(wrapper, editorContainer.firstChild);
  }

  // Move existing editor content to the left pane
  const editorBody = editorContainer.querySelector('.editor-body');
  if (editorBody) {
    document.getElementById('editorPaneContent').appendChild(editorBody);
  }

  // Remove or hide the old notice since we now have live preview
  if (editorNotice) {
    editorNotice.remove();
  }

  // Initialize resizer with both mouse and touch support
  const divider = document.getElementById('splitDivider');
  const editorPane = document.getElementById('editorPane');
  const previewPane = document.getElementById('previewPane');
  const editorPreviewContent = document.getElementById('editorPreviewContent');

  let isResizing = false;
  let startX = 0;
  let startPercent = 40;

  // Get saved split ratio or use default
  const savedSplit = localStorage.getItem('vista-editor-split-ratio');
  if (savedSplit) {
    startPercent = parseFloat(savedSplit);
  }

  // Set initial widths using percentage
  editorPane.style.width = startPercent + '%';
  previewPane.style.width = (100 - startPercent) + '%';

  // Initial sync of preview content
  syncEditorPreview();

  // Mouse events
  divider.addEventListener('mousedown', startResize);

  // Touch events for tablet/mobile support
  divider.addEventListener('touchstart', (e) => {
    startResize(e.touches[0]);
  });

  function startResize(e) {
    isResizing = true;
    startX = e.clientX;
    startPercent = (editorPane.offsetWidth / wrapper.offsetWidth) * 100;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    // Prevent text selection during drag
    if (e.preventDefault) e.preventDefault();
  }

  // Mouse move
  document.addEventListener('mousemove', handleResize);

  // Touch move
  document.addEventListener('touchmove', (e) => {
    if (!isResizing) return;
    const touch = e.touches[0];
    handleResize(touch);
  }, { passive: false });

  function handleResize(e) {
    if (!isResizing) return;

    const wrapperWidth = wrapper.offsetWidth;
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / wrapperWidth) * 100;
    let newPercent = startPercent + deltaPercent;

    // Enforce min/max widths (200px min for editor, 300px min for preview)
    const minEditorPercent = (200 / wrapperWidth) * 100;
    const maxEditorPercent = 100 - ((300 / wrapperWidth) * 100);

    newPercent = Math.max(minEditorPercent, Math.min(maxEditorPercent, newPercent));

    editorPane.style.width = newPercent + '%';
    previewPane.style.width = (100 - newPercent) + '%';

    // Save split ratio to localStorage
    localStorage.setItem('vista-editor-split-ratio', newPercent.toString());
  }

  // Mouse up
  document.addEventListener('mouseup', endResize);

  // Touch end
  document.addEventListener('touchend', endResize);

  function endResize() {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  // Expose sync function globally for app.js to call
  window.syncEditorPreview = syncEditorPreview;
}

/**
 * Hook into renderPreviews to sync editor preview
 */
function hookRenderPreviews() {
  if (typeof window.renderPreviews === 'function' && !window.renderPreviewsHooked) {
    const originalRenderPreviews = window.renderPreviews;
    window.renderPreviews = function(data) {
      originalRenderPreviews.call(window, data);
      // Sync to editor preview if editor tab is active
      const editorTab = document.getElementById('tabEditor');
      if (editorTab && !editorTab.classList.contains('hidden')) {
        syncEditorPreview();
      }
    };
    window.renderPreviewsHooked = true;
  }
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize all Phase 4 features
 */
function initPhase4Features() {
  // Wait for DOM to be ready and main app to be loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhase4Features);
    return;
  }

  // Wait a bit for the main app to initialize
  setTimeout(() => {
    initGlobalKeyboardShortcuts();
    initPasteAutoDetection();
    initCardContextMenu();
    initCardDragReorder();

    // Hook into renderPreviews for editor preview sync
    hookRenderPreviews();

    // Add QR code button to share actions
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn && !document.getElementById('qrCodeBtn')) {
      const qrBtn = document.createElement('button');
      qrBtn.className = 'action-btn';
      qrBtn.innerHTML = '&#128241; QR Code';
      qrBtn.id = 'qrCodeBtn';
      qrBtn.addEventListener('click', showQRCodeModal);
      shareBtn.parentNode.insertBefore(qrBtn, shareBtn.nextSibling);
    }

    // Hook into existing app functions
    if (typeof window.handleResult === 'function') {
      const originalHandleResult = window.handleResult;
      window.handleResult = function(data) {
        originalHandleResult.call(window, data);
        // Initialize Phase 4 features after results are loaded
        initImagePlaceholders(data.meta);
        if (data.diagnostics) {
          renderScorePredictions(data.diagnostics, data.scoring?.overall);
        }
        loadCardOrder();
      };
    }

    // Expose renderPreviewsInternal for app-features.js use
    if (typeof window.renderPreviews === 'function') {
      window.renderPreviewsInternal = window.renderPreviews;
    }

    // Initialize character gauges and resizable editor when editor tab is opened
    const editorTabBtn = document.getElementById('tabnav-editor');
    if (editorTabBtn) {
      editorTabBtn.addEventListener('click', () => {
        setTimeout(() => {
          initCharacterGauges();
          initResizableEditor();
          syncEditorPreview();
        }, 100);
      });
    }
  }, 500);
}

// Auto-initialize
initPhase4Features();
