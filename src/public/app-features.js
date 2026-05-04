'use strict';

// =============================================================================
// VISTA Phase 4 Polish & Missing Features Implementation
// =============================================================================

// ── Helper to access main app state ──
function getPlatformPrefs() {
  return window.platformPrefs || { favorites: new Set(), hidden: new Set(), columnCount: 3 };
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
      if (currentMode === 'url') {
        urlInput.focus();
        urlInput.select();
      } else {
        switchMode('url');
        setTimeout(() => urlInput.focus(), 100);
      }
      return;
    }

    // 1-4 : Switch tabs
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
        if (editorState && editorState.history && editorState.history.length > 0) {
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
  urlInput.addEventListener('paste', (e) => {
    // Get pasted content
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    if (!pasteData) return;

    // Auto-detect content type
    const trimmed = pasteData.trim();

    // HTML detection
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.includes('<html')) {
      e.preventDefault();
      htmlInput.value = trimmed;
      switchMode('paste');
      showToast('Detected HTML — switched to paste mode', 2000);
      return;
    }

    // Sitemap detection
    if (trimmed.includes('sitemap.xml')) {
      e.preventDefault();
      sitemapInput.value = trimmed;
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
      compareUrl1.value = urls[0];
      compareUrl2.value = urls[1];
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
    const favoriteItem = menu.querySelector('[data-action="favorite"]');
    if (platformPrefs.favorites.has(contextMenuTarget)) {
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
  switch (action) {
    case 'screenshot':
      if (typeof downloadScreenshot === 'function') {
        downloadScreenshot(pid, currentData);
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
  if (currentData && typeof renderPreviews === 'function') {
    renderPreviews(currentData);
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
 * Generate QR code for shareable link
 */
function generateQRCode(url) {
  // Use a simple QR code API or implement basic QR generation
  const qrSize = 200;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}`;
  return qrUrl;
}

/**
 * Show QR code modal
 */
function showQRCodeModal() {
  const shareUrl = window.location.href;
  const qrUrl = generateQRCode(shareUrl);

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
          <img id="qrImage" src="" alt="QR Code" />
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

  // Update QR code image
  document.getElementById('qrImage').src = qrUrl;
  document.querySelector('.qr-url').textContent = shareUrl;

  modal.classList.remove('hidden');
}

/**
 * Download QR code image
 */
async function downloadQRCode() {
  const qrImage = document.getElementById('qrImage');
  if (!qrImage) return;

  try {
    const response = await fetch(qrImage.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'vista-qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('QR Code downloaded!', 2000);
  } catch (err) {
    console.error('QR code download error:', err);
    showToast('Error downloading QR code', 2000);
  }
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

  const previewGrid = document.getElementById('previewGrid');
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
// 9. Blurhash Placeholder for OG Images
// =============================================================================

/**
 * Simple blurhash-like placeholder generator
 * Generates a tiny data URI image with dominant color
 */
function generateBlurhashPlaceholder(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas to extract dominant color
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1;
      canvas.height = 1;

      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

      // Create a tiny blurred placeholder
      const placeholderCanvas = document.createElement('canvas');
      const pctx = placeholderCanvas.getContext('2d');
      placeholderCanvas.width = 32;
      placeholderCanvas.height = 32;

      // Fill with dominant color
      pctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      pctx.fillRect(0, 0, 32, 32);

      // Add some blur effect
      pctx.filter = 'blur(4px)';
      pctx.drawImage(img, 0, 0, 32, 32);

      resolve(placeholderCanvas.toDataURL('image/jpeg', 0.5));
    };

    img.onerror = () => {
      // Return neutral gray placeholder on error
      resolve('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#e0e0e0"/></svg>'));
    };

    img.src = imageUrl;
  });
}

/**
 * Initialize blurhash placeholders for card images
 */
async function initBlurhashPlaceholders(meta) {
  const ogImage = meta.og?.image || meta.twitter?.image;
  if (!ogImage) return;

  const placeholder = await generateBlurhashPlaceholder(ogImage);

  // Apply placeholder to all card images
  document.querySelectorAll('.platform-card .mock-image img').forEach(img => {
    if (!img.complete) {
      img.style.backgroundImage = `url(${placeholder})`;
      img.style.backgroundSize = 'cover';
      img.addEventListener('load', () => {
        img.style.backgroundImage = '';
      }, { once: true });
    }
  });
}

// =============================================================================
// 10. Resizable Split-Pane Editor
// =============================================================================

/**
 * Initialize resizable split-pane editor
 */
function initResizableEditor() {
  const editorContainer = document.getElementById('editorContainer');
  if (!editorContainer) return;

  // Create resizable structure
  const wrapper = document.createElement('div');
  wrapper.className = 'editor-split-wrapper';
  wrapper.innerHTML = `
    <div class="editor-pane" id="editorPane">
      <div class="editor-pane-content"></div>
    </div>
    <div class="editor-resizer" id="editorResizer">
      <div class="resizer-handle"></div>
    </div>
    <div class="preview-pane" id="previewPane">
      <div class="preview-pane-content" id="editorPreviewContent"></div>
    </div>
  `;

  // Move existing editor content
  const editorBody = editorContainer.querySelector('.editor-body');
  if (editorBody) {
    wrapper.querySelector('.editor-pane-content').appendChild(editorBody);
  }

  editorContainer.innerHTML = '';
  editorContainer.appendChild(wrapper);

  // Initialize resizer
  const resizer = document.getElementById('editorResizer');
  const editorPane = document.getElementById('editorPane');
  const previewPane = document.getElementById('previewPane');

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = editorPane.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(250, Math.min(window.innerWidth - 400, startWidth + deltaX));

    editorPane.style.width = newWidth + 'px';
    previewPane.style.width = `calc(100% - ${newWidth}px - 8px)`;
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Save split position to localStorage
      const splitPos = editorPane.offsetWidth;
      localStorage.setItem('vista-editor-split', splitPos.toString());
    }
  });

  // Restore saved split position
  const savedSplit = localStorage.getItem('vista-editor-split');
  if (savedSplit) {
    const splitWidth = parseInt(savedSplit, 10);
    if (splitWidth > 250 && splitWidth < window.innerWidth - 400) {
      editorPane.style.width = splitWidth + 'px';
      previewPane.style.width = `calc(100% - ${splitWidth}px - 8px)`;
    }
  }
}

// =============================================================================
// 11. Mobile Swipe Gestures
// =============================================================================

/**
 * Initialize mobile swipe gestures for cards
 */
function initMobileSwipeGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let currentCardIndex = -1;
  const cards = [];

  // Collect all cards
  const updateCardsList = () => {
    cards.length = 0;
    document.querySelectorAll('.platform-card').forEach(card => {
      cards.push(card);
    });
  };

  previewGrid.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.platform-card');
    if (!card) return;

    updateCardsList();
    currentCardIndex = cards.indexOf(card);
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  previewGrid.addEventListener('touchend', (e) => {
    if (currentCardIndex === -1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentCardIndex > 0) {
        // Swipe right - previous card
        cards[currentCardIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (deltaX < 0 && currentCardIndex < cards.length - 1) {
        // Swipe left - next card
        cards[currentCardIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // Detect vertical swipe down to collapse expanded card
    if (deltaY > 100 && Math.abs(deltaX) < 50) {
      const card = cards[currentCardIndex];
      if (card && card.classList.contains('expanded')) {
        card.classList.remove('expanded');
      }
    }

    currentCardIndex = -1;
  }, { passive: true });
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
    initMobileSwipeGestures();

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
        initBlurhashPlaceholders(data.meta);
        if (data.diagnostics) {
          renderScorePredictions(data.diagnostics, data.scoring?.overall);
        }
        loadCardOrder();
      };
    }

    // Initialize character gauges when editor tab is opened
    const editorTabBtn = document.getElementById('tabnav-editor');
    if (editorTabBtn) {
      editorTabBtn.addEventListener('click', () => {
        setTimeout(initCharacterGauges, 100);
      });
    }
  }, 500);
}

// Auto-initialize
initPhase4Features();
