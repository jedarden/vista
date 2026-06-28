'use strict';
/* VISTA frontend application */

// ── State ──
let currentData = null;
let currentMode = 'url'; // 'url' | 'paste' | 'compare'
let cardContextState = {}; // Track context mode per platform: { pid: { context: boolean, theme: 'dark'|'light' } }
let compareData = { before: null, after: null, swapped: false }; // Comparison state
let hasCelebratedPerfectScore = false; // Track one-time celebration per session

// ── Debug Flags ──
/**
 * DEBUG_SMART_ORDERING: Enable detailed logging for smart ordering functionality
 *
 * To enable from browser console:
 *   window.DEBUG_SMART_ORDERING = true;
 *
 * To disable from browser console:
 *   window.DEBUG_SMART_ORDERING = false;
 *
 * When enabled, logs:
 * - Input platform cards array with scores before reordering
 * - Computed scores for each platform card (score, grade, passing/warning/failing counts)
 * - Preferred platform order based on detected page type
 * - Platform groups before and after reordering
 * - Output array after reordering
 * - localStorage save operations
 */
let DEBUG_SMART_ORDERING = false; // Set to true to enable smart ordering debug logs

// ── Keyboard Navigation State ──
let focusedCardIndex = -1; // Index of currently focused card in preview grid
let focusedCardPids = []; // Array of platform IDs in current grid
let editorUndoStack = []; // Undo stack for editor changes

// ── Theme State ──
// globalTheme is declared in frames-theme.js (loaded before this file)

// ── Accessibility: Screen Reader Announcements ──
/**
 * Announce a message to screen readers via aria-live regions
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 */
function announce(message, priority = 'polite') {
  const announcerId = priority === 'assertive' ? 'errorAnnouncer' : 'resultsAnnouncer';
  const announcer = document.getElementById(announcerId);
  if (announcer) {
    // Clear first to ensure repeated messages are read
    announcer.textContent = '';
    // Use setTimeout to allow screen readers to register the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

// Initialize theme from localStorage or system preference
function initTheme() {
  const savedTheme = localStorage.getItem('vista-theme');
  if (savedTheme) {
    globalTheme = savedTheme;
  } else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      globalTheme = 'light';
    }
  }
  applyTheme(globalTheme);
}

function applyTheme(theme) {
  globalTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vista-theme', theme);

  // Update theme toggle icon and accessible label
  const themeToggle = document.getElementById('globalThemeToggle');
  if (themeToggle) {
    themeToggle.querySelector('.theme-icon-light').style.display = theme === 'dark' ? 'inline' : 'none';
    themeToggle.querySelector('.theme-icon-dark').style.display = theme === 'light' ? 'inline' : 'none';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleGlobalTheme() {
  const newTheme = globalTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  // Re-render cards that support theme to update their appearance
  if (currentData) {
    renderPreviews(currentData);
  }
}

// ── DOM refs ──
const $ = (sel) => document.querySelector(sel);
const hero = $('#hero');
const heroTagline = $('#heroTagline');
const urlMode = $('#urlMode');
const pasteMode = $('#pasteMode');
const urlForm = $('#urlForm');
const urlInput = $('#urlInput');
const pasteForm = $('#pasteForm');
const htmlInput = $('#htmlInput');
const baseUrlInput = $('#baseUrlInput');
const resultsSection = $('#resultsSection');
const loadingOverlay = $('#loadingOverlay');
const toast = $('#toast');
const overallGrade = $('#overallGrade');
const summaryCounts = $('#summaryCounts');
const summaryUrl = $('#summaryUrl');
const diagBadge = $('#diagBadge');
const previewGrid = $('#previewGrid');
const diagPanel = $('#diagPanel');
const rawTagsPanel = $('#rawTagsPanel');
const redirectPanel = $('#redirectPanel');
const fixesPanel = $('#fixesPanel');
const recentBar = $('#recentBar');
const navInspect = $('#navInspect');
const navPaste = $('#navPaste');
const navCompare = $('#navCompare');
const compareMode = $('#compareMode');
const compareForm = $('#compareForm');
const compareUrl1 = $('#compareUrl1');
const compareUrl2 = $('#compareUrl2');
const compareBtn = $('#compareBtn');
const swapUrlsBtn = $('#swapUrlsBtn');
const tabCompareBtn = $('#tabCompareBtn');
const cropperViewport = $('#cropperViewport');
const cropperImage = $('#cropperImage');
const cropperOverlay = $('#cropperOverlay');
const cropperControls = $('#cropperControls');
const cropperContainer = $('#cropperContainer');
const downloadOverlayBtn = $('#downloadOverlayBtn');
const safeZoneInfo = $('#safeZoneInfo');
const imageInfo = $('#imageInfo');
const cropperBadge = $('#cropperBadge');

// Badge modal DOM refs
const badgeBtn = $('#badgeBtn');
const badgeModal = $('#badgeModal');
const badgeModalClose = $('#badgeModalClose');
const badgePreview = $('#badgePreview');
const badgeStyleSelect = $('#badgeStyleSelect');
const badgeEmbedCode = $('#badgeEmbedCode');
const badgeCopyBtn = $('#badgeCopyBtn');
const badgeDirectUrl = $('#badgeDirectUrl');
const badgeUrlCopyBtn = $('#badgeUrlCopyBtn');

// QR modal DOM refs
const qrBtn = $('#qrBtn');
const qrModal = $('#qrModal');
const qrModalClose = $('#qrModalClose');
const qrPreview = $('#qrPreview');
const qrCode = $('#qrCode');
const qrShareUrl = $('#qrShareUrl');
const qrUrlCopyBtn = $('#qrUrlCopyBtn');

// OG Generator DOM refs
const oggenCanvas = $('#oggenCanvas');
const oggenBgType = $('#oggenBgType');
const oggenBgColor = $('#oggenBgColor');
const oggenBgGradientRow = $('#oggenBgGradientRow');
const oggenGradientStart = $('#oggenGradientStart');
const oggenGradientEnd = $('#oggenGradientEnd');
const oggenGradientDir = $('#oggenGradientDir');
const oggenBgImageRow = $('#oggenBgImageRow');
const oggenBgImageInput = $('#oggenBgImageInput');
const oggenBgImageSize = $('#oggenBgImageSize');
const oggenBgColorRow = $('#oggenBgColorRow');
const oggenTitle = $('#oggenTitle');
const oggenSubtitle = $('#oggenSubtitle');
const oggenFont = $('#oggenFont');
const oggenTextColor = $('#oggenTextColor');
const oggenLogoPos = $('#oggenLogoPos');
const oggenLogoInput = $('#oggenLogoInput');
const oggenLogoSize = $('#oggenLogoSize');
const oggenLogoUploadRow = $('#oggenLogoUploadRow');
const oggenDownloadBtn = $('#oggenDownloadBtn');
const oggenUseInEditorBtn = $('#oggenUseInEditorBtn');
const oggenResetBtn = $('#oggenResetBtn');

// Sitemap DOM refs
const navSitemap = $('#navSitemap');
const sitemapMode = $('#sitemapMode');
const sitemapForm = $('#sitemapForm');
const sitemapInput = $('#sitemapInput');
const sitemapBtn = $('#sitemapBtn');
const tabSitemapBtn = $('#tabSitemapBtn');
const sitemapSummaryStats = $('#sitemapSummaryStats');
const heatmapTableHead = $('#heatmapTableHead');
const heatmapTableBody = $('#heatmapTableBody');
const heatmapSort = $('#heatmapSort');
const exportSitemapCsv = $('#exportSitemapCsv');
const exportSitemapJson = $('#exportSitemapJson');
const sitemapProgress = $('#sitemapProgress');
const progressFill = $('#progressFill');
const progressText = $('#progressText');

// Sitemap state
let sitemapData = null;
let sitemapResults = [];

// ── Event listeners ──
urlForm.addEventListener('submit', (e) => { e.preventDefault(); inspectUrl(urlInput.value.trim()); });
pasteForm.addEventListener('submit', (e) => { e.preventDefault(); inspectHtml(htmlInput.value.trim(), baseUrlInput.value.trim()); });

// Paste detection on URL input
urlInput.addEventListener('paste', async (e) => {
  const paste = (e.clipboardData || window.clipboardData).getData('text');
  if (!paste) return;

  // Detect content type and handle accordingly
  await handlePasteDetection(paste);
});

// Suggestion chip actions and dismissal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggestion-action')) {
    const action = e.target.dataset.action;
    if (action === 'switch-sitemap') {
      clearSuggestionChips();
      switchMode('sitemap');
    }
    if (action === 'switch-compare') {
      clearSuggestionChips();
      switchMode('compare');
    }
    if (action === 'open-templates') {
      clearSuggestionChips();
      // Switch to Templates tab if results section is visible
      if (!resultsSection.classList.contains('hidden')) {
        switchTab('templates');
        // Announce to screen readers
        announce('Opened Templates tab. Choose a template to create meta tags for your page.');
      }
    }
  }
  if (e.target.classList.contains('suggestion-dismiss')) {
    const chip = e.target.closest('.suggestion-chips');
    if (chip) chip.remove();
  }
});

$('#switchToPaste').addEventListener('click', () => switchMode('paste'));
$('#switchToUrl').addEventListener('click', () => switchMode('url'));
navInspect.addEventListener('click', () => switchMode('url'));
navPaste.addEventListener('click', () => switchMode('paste'));
navCompare.addEventListener('click', () => switchMode('compare'));
$('#switchToInspectFromCompare').addEventListener('click', () => switchMode('url'));
compareForm.addEventListener('submit', (e) => { e.preventDefault(); handleCompareSubmit(); });
swapUrlsBtn.addEventListener('click', handleSwapUrls);

$('#shareBtn').addEventListener('click', shareResults);
$('#newInspectBtn').addEventListener('click', resetToHero);

// Badge modal event listeners
badgeBtn?.addEventListener('click', openBadgeModal);
badgeModalClose?.addEventListener('click', closeBadgeModal);

// QR modal event listeners
qrBtn?.addEventListener('click', openQrModal);
qrModalClose?.addEventListener('click', closeQrModal);
qrUrlCopyBtn?.addEventListener('click', () => {
  const url = qrShareUrl.value;
  if (url) {
    copyText(url);
    showToast('URL copied!', 1500);
  }
});
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
badgeCopyBtn?.addEventListener('click', copyBadgeEmbedCode);
badgeUrlCopyBtn?.addEventListener('click', copyBadgeUrl);

// Close modal on overlay click
badgeModal?.addEventListener('click', (e) => {
  if (e.target === badgeModal) closeBadgeModal();
});

// OG Generator event listeners
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenGradientStart?.addEventListener('input', updateOggenCanvas);
oggenGradientEnd?.addEventListener('input', updateOggenCanvas);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
oggenTitle?.addEventListener('input', updateOggenCanvas);
oggenSubtitle?.addEventListener('input', updateOggenCanvas);
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenTextColor?.addEventListener('input', updateOggenCanvas);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
oggenLogoInput?.addEventListener('change', handleLogoUpload);
oggenLogoSize?.addEventListener('input', updateOggenCanvas);
oggenDownloadBtn?.addEventListener('click', downloadOggenImage);
oggenResetBtn?.addEventListener('click', resetOggen);
oggenUseInEditorBtn?.addEventListener('click', useOggenInEditor);

// Sitemap event listeners
navSitemap?.addEventListener('click', () => switchMode('sitemap'));
$('#switchToInspectFromSitemap')?.addEventListener('click', () => switchMode('url'));
sitemapForm?.addEventListener('submit', (e) => { e.preventDefault(); handleSitemapSubmit(); });
heatmapSort?.addEventListener('change', handleHeatmapSort);
exportSitemapCsv?.addEventListener('click', exportSitemapDataAsCsv);
exportSitemapJson?.addEventListener('click', exportSitemapDataAsJson);

// Sitemap example chips
document.querySelectorAll('.chip[data-sitemap]').forEach(chip => {
  chip.addEventListener('click', () => {
    sitemapInput.value = chip.dataset.sitemap;
    switchMode('sitemap');
    handleSitemapSubmit();
  });
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Tab keyboard navigation (ARIA tablist pattern — arrow keys move focus)
document.querySelectorAll('.tabs-inner[role="tablist"]').forEach(tablist => {
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]:not(.hidden)')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tabs[(idx + 1) % tabs.length].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tabs[(idx - 1 + tabs.length) % tabs.length].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabs[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      tabs[tabs.length - 1].focus();
    }
  });
});

// Example chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    urlInput.value = chip.dataset.url;
    switchMode('url');
    inspectUrl(chip.dataset.url);
  });
});

// Auto-load from URL param on page load
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadRecents();
  initOgGenerator();
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    urlInput.value = urlParam;
    inspectUrl(urlParam);
  }
  if (params.has('feedback')) {
    initFeedbackWidget();
  }
});

// Global theme toggle listener
document.getElementById('globalThemeToggle')?.addEventListener('click', toggleGlobalTheme);

// ── Mode switching ──
function switchMode(mode) {
  currentMode = mode;
  if (mode === 'url') {
    urlMode.classList.remove('hidden');
    pasteMode.classList.add('hidden');
    compareMode.classList.add('hidden');
    if (sitemapMode) sitemapMode.classList.add('hidden');
    navInspect.classList.add('active');
    navPaste.classList.remove('active');
    navCompare?.classList.remove('active');
    navSitemap?.classList.remove('active');
    tabCompareBtn?.classList.add('hidden');
    tabSitemapBtn?.classList.add('hidden');
  } else if (mode === 'paste') {
    urlMode.classList.add('hidden');
    pasteMode.classList.remove('hidden');
    compareMode.classList.add('hidden');
    if (sitemapMode) sitemapMode.classList.add('hidden');
    navPaste.classList.add('active');
    navInspect.classList.remove('active');
    navCompare?.classList.remove('active');
    navSitemap?.classList.remove('active');
    tabCompareBtn?.classList.add('hidden');
    tabSitemapBtn?.classList.add('hidden');
  } else if (mode === 'compare') {
    urlMode.classList.add('hidden');
    pasteMode.classList.add('hidden');
    compareMode.classList.remove('hidden');
    if (sitemapMode) sitemapMode.classList.add('hidden');
    navCompare?.classList.add('active');
    navInspect.classList.remove('active');
    navPaste.classList.remove('active');
    navSitemap?.classList.remove('active');
  } else if (mode === 'sitemap') {
    urlMode.classList.add('hidden');
    pasteMode.classList.add('hidden');
    compareMode.classList.add('hidden');
    if (sitemapMode) sitemapMode.classList.remove('hidden');
    navSitemap?.classList.add('active');
    navInspect?.classList.remove('active');
    navPaste?.classList.remove('active');
    navCompare?.classList.remove('active');
  }
}

// ── Paste detection ──
async function handlePasteDetection(pastedText) {
  const trimmed = pastedText.trim();

  // HTML detection: starts with '<', '<!DOCTYPE', or contains '<html'
  if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().includes('<html')) {
    // Clear existing suggestion chips
    clearSuggestionChips();

    // Wait for paste to complete, then switch modes
    setTimeout(() => {
      switchMode('paste');
      htmlInput.value = trimmed;
      showToast('Detected HTML — switched to Paste mode', 2500);
    }, 10);
    return;
  }

  // Multiple URLs detection (2+ URLs separated by newlines)
  const urls = trimmed.split(/[\r\n]+/).map(u => u.trim()).filter(u => u);
  if (urls.length >= 2) {
    showSuggestionChip('Multiple URLs detected', 'Switch to Compare mode?', 'switch-compare');
    return;
  }

  // Sitemap detection
  if (trimmed.toLowerCase().includes('sitemap')) {
    showSuggestionChip('This looks like a sitemap', 'Switch to Sitemap mode?', 'switch-sitemap');
    return;
  }

  // Shortened URL detection (common URL shorteners)
  const shorteners = ['bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly', 'short.link'];
  const isShortened = shorteners.some(domain => trimmed.toLowerCase().includes(domain));
  if (isShortened) {
    setTimeout(() => {
      showToast('Shortened URL — VISTA will follow redirects', 3000);
    }, 100);
  }
}

function showSuggestionChip(title, message, action) {
  // Clear existing chips first
  clearSuggestionChips();

  const chip = document.createElement('div');
  chip.className = 'suggestion-chips';
  chip.innerHTML = `
    <span class="suggestion-icon">&#9432;</span>
    <span class="suggestion-text"><strong>${title}</strong> — ${message}</span>
    <button class="suggestion-action" data-action="${action}">Switch</button>
    <button class="suggestion-dismiss" aria-label="Dismiss">&times;</button>
  `;

  // Insert after the URL input form
  const insertAfter = document.querySelector('#urlMode .input-mode-toggle');
  if (insertAfter && insertAfter.parentNode) {
    insertAfter.parentNode.insertBefore(chip, insertAfter.nextSibling);
  }
}

function clearSuggestionChips() {
  document.querySelectorAll('.suggestion-chips').forEach(el => el.remove());
}

// ── Inspect ──
/**
 * Progressive loading implementation:
 * 1. Show skeleton grid instantly
 * 2. Call /api/preview/meta, populate score and text cards
 * 3. Call /api/preview/images in parallel with /api/preview/headers
 * 4. Fill in image cards and diagnostics tab as they arrive
 * 5. Hide loading state when all complete
 */
async function progressiveLoad({ url, html, base }) {
  const isHtml = !!html;
  const startTime = performance.now();

  // Step 1: Fetch metadata first (fast, ~200-400ms)
  let metaResp;
  if (isHtml) {
	metaResp = await fetch(`/api/preview/meta${base ? '?base=' + encodeURIComponent(base) : ''}`, {
	  method: 'POST',
	  headers: { 'Content-Type': 'text/html' },
	  body: html,
	});
  } else {
	metaResp = await fetch(`/api/preview/meta?url=${encodeURIComponent(url)}`);
  }

  if (!metaResp.ok) {
	const error = await metaResp.json();
	throw new Error(error.error || 'Failed to fetch metadata');
  }

  const metaData = await metaResp.json();
  const metaTime = performance.now() - startTime;
  console.log(`[Progressive] Metadata loaded in ${metaTime.toFixed(0)}ms`);

  // Extract dominant color immediately for placeholder background
  const ogImageUrl = metaData.meta.og.image || metaData.meta.twitter.image;
  if (ogImageUrl) {
    // Don't await - extract in background, use placeholder color meanwhile
    extractDominantColor(ogImageUrl).then(color => {
      metaData.dominantColor = color;
      console.log(`[Progressive] Dominant color extracted: ${color}`);
    });
  }

  // Step 2: Populate score and text cards immediately
  currentData = metaData; // Store for later merging
  window.currentRedirectChain = metaData.redirectChain || null;
  saveToRecents(metaData);

  // Check for missing meta tags and show suggestion
  checkForNoMetaTags(metaData);

  // Compact hero and show results section
  hero.classList.add('compact');
  document.body.classList.add('has-results');
  resultsSection.classList.remove('hidden');
  switchTab('previews');

  // Render summary bar and text-based previews
  renderSummaryBar(metaData);
  renderTextPreviewsOnly(metaData);

  // Update URL for sharing
  if (metaData.url && metaData.url !== window.location.href) {
	history.pushState({}, '', '/?url=' + encodeURIComponent(metaData.url));
  }

  // Step 3: Fetch images and headers in parallel, update UI as each completes
  let imagesData = null;
  let headersData = null;
  let imagesComplete = false;
  let headersComplete = false;

  const imagesPromise = fetchImagesAndHeaders({ url, html, base, isHtml })
	.then(data => {
	  imagesData = data;
	  imagesComplete = true;
	  const imagesTime = performance.now() - startTime;
	  console.log(`[Progressive] Images loaded in ${imagesTime.toFixed(0)}ms`);
	  return data;
	})
	.catch(err => {
	  console.error('[Progressive] Images fetch failed:', err);
	  imagesComplete = true;
	  return null;
	});

  const headersPromise = fetchHeaders({ url, html, base, isHtml })
	.then(data => {
	  headersData = data;
	  headersComplete = true;
	  const headersTime = performance.now() - startTime;
	  console.log(`[Progressive] Headers loaded in ${headersTime.toFixed(0)}ms`);
	  return data;
	})
	.catch(err => {
	  console.error('[Progressive] Headers fetch failed:', err);
	  headersComplete = true;
	  return null;
	});

  // Handle images loading first - update previews with images
  imagesPromise.then((imgs) => {
	if (imgs) {
	  // Merge images data with current metadata
	  const withImages = mergeData(metaData, imgs, null);
	  currentData = withImages;

	  // Extract dominant color for OG image placeholder
	  const ogImageUrl = withImages.meta.og.image || withImages.meta.twitter.image;
	  if (ogImageUrl) {
		extractDominantColor(ogImageUrl).then(color => {
		  withImages.dominantColor = color;
		  currentData = withImages;
		  // Re-render with dominant color
		  updatePreviewsWithImages(withImages);
		});
	  }

	  // Update previews with images
	  updatePreviewsWithImages(withImages);
	}

	// Check if both are complete
	if (headersComplete) {
	  finalizeProgressiveLoad(metaData, imagesData, headersData, startTime);
	}
  });

  // Handle headers loading - update diagnostics
  headersPromise.then((hdrs) => {
	if (hdrs) {
	  // Merge headers data with current metadata
	  const withHeaders = mergeData(metaData, imagesData, hdrs);

	  // Update diagnostics tab
	  updateDiagnostics(withHeaders);

	  // Update redirects and fixes
	  if (withHeaders.redirectChain || withHeaders.responseHeaders || withHeaders.headerAnalysis) {
		renderRedirects(withHeaders.redirectChain, withHeaders.responseHeaders, withHeaders.headerAnalysis);
	  }
	  if (withHeaders.autoFixes) {
		renderFixes(withHeaders.autoFixes);
	  }
	}

	// Check if both are complete
	if (imagesComplete) {
	  finalizeProgressiveLoad(metaData, imagesData, headersData, startTime);
	}
  });
}

/**
 * Finalize progressive loading after both images and headers complete.
 * Performs client-side verification and initializes remaining features.
 */
async function finalizeProgressiveLoad(metaData, imagesData, headersData, startTime) {
  const totalTime = performance.now() - startTime;
  console.log(`[Progressive] All data loaded in ${totalTime.toFixed(0)}ms`);

  // Merge all data
  const completeData = mergeData(metaData, imagesData, headersData);
  currentData = completeData;

  // Extract dominant color if not already done
  const ogImageUrl = completeData.meta.og.image || completeData.meta.twitter.image;
  if (ogImageUrl && !completeData.dominantColor) {
	completeData.dominantColor = await extractDominantColor(ogImageUrl);
  }

  // Client-side DOM verification for JS-injected tags
  if (completeData.html && completeData.meta) {
	try {
	  const clientFindings = await verifyClientSideTags(completeData.html, completeData.meta);
	  if (clientFindings.length > 0) {
		completeData.diagnostics = [...(completeData.diagnostics || []), ...clientFindings];
		// Re-render diagnostics with client-side findings
		updateDiagnostics(completeData);
	  }
	} catch (e) {
	  console.warn('Client-side tag verification failed:', e);
	}
  }

  // Render raw tags and other panels
  renderRawTags(completeData.meta);

  // Initialize editor and other features
  initEditor(completeData);
  initCacheHub();
  generateCodeSnippet();

  // Announce final results
  if (completeData.scoring) {
	const { grade, score } = completeData.scoring.overall;
	const { passing, warning, failing } = completeData.scoring.summary;
	announce(`Inspection complete. Overall grade: ${grade} (${score}/100). ${passing} passing, ${warning} warnings, ${failing} failing.`);
  }

  // Update sr-only h1 for results page state
  const resultsHeading = document.getElementById('resultsPageHeading');
  if (resultsHeading) {
	const domain = (completeData.finalUrl || completeData.url || '').replace(/^https?:\/\//, '').split('/')[0];
	resultsHeading.textContent = `VISTA Results: ${domain}`;
  }

  // Check for perfect score and trigger celebration
  checkAndCelebrate(completeData);

  // Show first-visit toast (show once per user)
  showFirstVisitToast();
}

async function fetchImagesAndHeaders({ url, html, base, isHtml }) {
  if (isHtml) {
	return await fetch(`/api/preview/images${base ? '?base=' + encodeURIComponent(base) : ''}`, {
	  method: 'POST',
	  headers: { 'Content-Type': 'text/html' },
	  body: html,
	}).then(resp => resp.json());
  } else {
	return await fetch(`/api/preview/images?url=${encodeURIComponent(url)}`).then(resp => resp.json());
  }
}

async function fetchHeaders({ url, html, base, isHtml }) {
  if (isHtml) {
	return await fetch(`/api/preview/headers${base ? '?base=' + encodeURIComponent(base) : ''}`, {
	  method: 'POST',
	  headers: { 'Content-Type': 'text/html' },
	  body: html,
	}).then(resp => resp.json());
  } else {
	return await fetch(`/api/preview/headers?url=${encodeURIComponent(url)}`).then(resp => resp.json());
  }
}

function mergeData(metaData, imagesData, headersData) {
  const merged = { ...metaData };

  if (imagesData) {
	Object.assign(merged, {
	  previews: imagesData.previews,
	  imageProbe: imagesData.imageProbe,
	  cropper: imagesData.cropper,
	});
  }

  if (headersData) {
	Object.assign(merged, {
	  headers: headersData.headers,
	  security: headersData.security,
	  cors: headersData.cors,
	  performance: headersData.performance,
	  server: headersData.server,
	  diagnostics: headersData.diagnostics || [],
	  headerAnalysis: headersData.headerAnalysis,
	});
  }

  return merged;
}


/**
 * Update diagnostics tab with header analysis results
 */
function updateDiagnostics(data) {
  if (!data.diagnostics || data.diagnostics.length === 0) {
    diagPanel.innerHTML = '<div class="diag-empty">&#10003; No issues detected. All checks passed.</div>';
    announce('No diagnostic issues found. All checks passed.');
    return;
  }

  renderDiagnostics(data.diagnostics);
  console.log('[Progressive] Diagnostics tab populated');
}

async function inspectUrl(url) {
  if (!url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    urlInput.value = url;
  }
  renderSkeletons(); // Show skeletons immediately at 0ms - skeleton cards serve as loading indicator
  try {
	await progressiveLoad({ url });
  } catch (err) {
    // Clear skeletons and show error
    previewGrid.innerHTML = '';
    showToast('Error: ' + err.message, 3000);
    announce('Error: ' + err.message, 'assertive');
  }
}

async function inspectHtml(html, base) {
  if (!html) { showToast('Please paste some HTML first.', 2000); return; }
  renderSkeletons(); // Show skeletons immediately at 0ms - skeleton cards serve as loading indicator
  try {
	await progressiveLoad({ html, base });
  } catch (err) {
    // Clear skeletons and show error
    previewGrid.innerHTML = '';
    showToast('Error: ' + err.message, 3000);
    announce('Error: ' + err.message, 'assertive');
  }
}

/**
 * Client-side DOM verification for meta tags.
 * Parses HTML in a real DOM (executes JavaScript) and compares with server-parsed tags.
 * Returns array of diagnostic findings for client-side-only tags.
 */
async function verifyClientSideTags(html, serverMeta) {
  const findings = [];

  // Create a hidden iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.style.position = 'absolute';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  document.body.appendChild(iframe);

  try {
    // Write the HTML to the iframe (this executes any JavaScript)
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait a bit for JavaScript to execute (max 2 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract meta tags from the rendered DOM
    const clientMetas = new Map();
    const metaTags = iframeDoc.querySelectorAll('meta[property], meta[name]');

    metaTags.forEach(tag => {
      const property = tag.getAttribute('property');
      const name = tag.getAttribute('name');
      const content = tag.getAttribute('content');
      const key = property || name;

      if (key && content) {
        const lowerKey = key.toLowerCase();
        // Focus on og:* and twitter:* tags
        if (lowerKey.startsWith('og:') || lowerKey.startsWith('twitter:')) {
          clientMetas.set(lowerKey, content);
        }
      }
    });

    // Build set of server-side meta tags (from raw HTML, no JS execution)
    const serverMetas = new Map();
    if (serverMeta.rawTags) {
      serverMeta.rawTags.forEach(tag => {
        const key = tag.property || tag.name;
        if (key && tag.content) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.startsWith('og:') || lowerKey.startsWith('twitter:')) {
            serverMetas.set(lowerKey, tag.content);
          }
        }
      });
    }

    // Find tags that only exist client-side (injected by JS)
    const clientOnlyTags = [];
    for (const [key, value] of clientMetas) {
      if (!serverMetas.has(key)) {
        clientOnlyTags.push({ key, value });
      }
    }

    // Find tags with different values between server and client
    const differingTags = [];
    for (const [key, clientValue] of clientMetas) {
      const serverValue = serverMetas.get(key);
      if (serverValue && serverValue !== clientValue) {
        differingTags.push({ key, serverValue, clientValue });
      }
    }

    // Create diagnostic findings
    if (clientOnlyTags.length > 0) {
      const tagList = clientOnlyTags.slice(0, 5).map(t => t.key).join(', ');
      const more = clientOnlyTags.length > 5 ? ` (+${clientOnlyTags.length - 5} more)` : '';
      findings.push({
        severity: 'error',
        code: 'js-injected-tags',
        message: `Meta tags only appear after JavaScript executes: ${tagList}${more} — social crawlers that don't execute JS will not see these tags`,
        fix: 'Move critical meta tags to static HTML in <head>, or use Server-Side Rendering (SSR) to ensure tags exist in the initial HTML response',
        platforms: 'Facebook, LinkedIn, Twitter, WhatsApp, and most other crawlers',
      });
    }

    if (differingTags.length > 0) {
      const tagList = differingTags.slice(0, 3).map(t => t.key).join(', ');
      findings.push({
        severity: 'warning',
        code: 'js-modified-tags',
        message: `Meta tags have different values after JavaScript execution: ${tagList} — crawlers may see different values than browsers`,
        fix: 'Ensure meta tags have correct values in the initial HTML, or use SSR to render the correct values server-side',
        platforms: 'Multiple platforms (crawler-dependent)',
      });
    }
  } catch (e) {
    // Silently fail — client-side verification is best-effort
    console.warn('Client-side tag verification failed:', e);
  } finally {
    // Clean up iframe
    document.body.removeChild(iframe);
  }

  return findings;
}

async function handleResult(data) {
  currentData = data;
  window.currentRedirectChain = data.redirectChain || null;
  saveToRecents(data);

  // Extract dominant color for OG image placeholder BEFORE rendering
  const ogImageUrl = data.meta.og.image || data.meta.twitter.image;
  if (ogImageUrl) {
    data.dominantColor = await extractDominantColor(ogImageUrl);
  }

  // Compact hero
  hero.classList.add('compact');
  document.body.classList.add('has-results');

  // Client-side DOM verification for JS-injected tags
  if (data.html && data.meta) {
    try {
      const clientFindings = await verifyClientSideTags(data.html, data.meta);
      if (clientFindings.length > 0) {
        // Merge client-side findings with server diagnostics
        data.diagnostics = [...(data.diagnostics || []), ...clientFindings];
      }
    } catch (e) {
      // Silently fail — client-side verification is best-effort
      console.warn('Client-side tag verification failed:', e);
    }
  }

  // Crossfade from skeleton to content
  const skeletonCards = document.querySelectorAll('.platform-skeleton-card');
  if (skeletonCards.length > 0 && !prefersReducedMotion()) {
    // Fade out skeletons
    skeletonCards.forEach(card => {
      card.classList.add('skeleton-fade-out');
    });

    // Wait for fade-out to complete, then render content
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  // Render all panels with fade-in (skeleton cards already served as loading indicator)
  renderSummaryBar(data);
  renderPreviews(data);
  initCropper(data);
  renderDiagnostics(data.diagnostics);
  renderRawTags(data.meta);
  renderRedirects(data.redirectChain, data.responseHeaders, data.headerAnalysis);
  renderFixes(data.autoFixes);

  // Phase 2: Initialize editor and new features
  initEditor(data);
  initCacheHub();
  generateCodeSnippet();

  // Show results
  resultsSection.classList.remove('hidden');
  switchTab('previews');

  // Update sr-only h1 for results page state (WCAG 1.3.1 / axe page-has-heading-one)
  const resultsHeading = document.getElementById('resultsPageHeading');
  if (resultsHeading) {
    const domain = (data.finalUrl || data.url || '').replace(/^https?:\/\//, '').split('/')[0];
    resultsHeading.textContent = `VISTA Results: ${domain}`;
  }

  // Announce results to screen readers (WCAG 4.1.3)
  if (data.scoring) {
    const { grade, score } = data.scoring.overall;
    const { passing, warning, failing } = data.scoring.summary;
    announce(`Inspection complete. Overall grade: ${grade} (${score}/100). ${passing} passing, ${warning} warnings, ${failing} failing.`);
  }

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update URL (shareable)
  if (data.url && data.url !== window.location.href) {
    history.pushState({}, '', '/?url=' + encodeURIComponent(data.url));
  }
}

// ── Perfect Score Celebration ──
function isPerfectScore(data) {
  if (!data.scoring || !data.scoring.scores) return false;
  const scores = data.scoring.scores;
  const platformIds = Object.keys(scores);
  // Check if all 31 platforms have A+ grade
  if (platformIds.length !== 31) return false;
  return platformIds.every(pid => scores[pid]?.grade === 'A+');
}

function triggerConfetti() {
  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Check if canvas-confetti is available
  if (typeof confetti === 'undefined') {
    console.warn('canvas-confetti not loaded');
    return;
  }

  // Trigger a subtle confetti burst from the center
  const duration = 3000;
  const end = Date.now() + duration;

  // Create a subtle celebration effect
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#eab308', '#ec4899'],
      scalar: 0.8,
      drift: 0.5,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#eab308', '#ec4899'],
      scalar: 0.8,
      drift: -0.5,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());

  // Optional: Play subtle sound (muted by default, respect user preferences)
  // Sound is opt-in via a future settings toggle
}

function checkAndCelebrate(data) {
  // One-time celebration per session
  if (hasCelebratedPerfectScore) return;

  if (isPerfectScore(data)) {
    hasCelebratedPerfectScore = true;
    // Small delay to let the results render first
    setTimeout(() => {
      triggerConfetti();
    }, 300);
  }
}

// ── Summary bar ──
function renderSummaryBar(data) {
  const g = data.scoring.overall.grade;
  overallGrade.textContent = g;
  overallGrade.className = 'grade-badge ' + gradeClass(g);

  const { passing, warning, failing } = data.scoring.summary;
  summaryCounts.innerHTML = `
    <span class="count-chip"><span class="dot dot-pass"></span>${passing} passing</span>
    <span class="count-chip"><span class="dot dot-warn"></span>${warning} warning</span>
    <span class="count-chip"><span class="dot dot-fail"></span>${failing} failing</span>
  `;

  const displayUrl = data.finalUrl || data.url;
  summaryUrl.innerHTML = `<a href="${escHtml(displayUrl)}" target="_blank" rel="noopener">${escHtml(displayUrl)}</a>`;

  const errCount = (data.diagnostics || []).filter(d => d.severity === 'error').length;
  const warnCount = (data.diagnostics || []).filter(d => d.severity === 'warning').length;
  const total = errCount + warnCount;
  diagBadge.textContent = total > 0 ? String(total) : '';

  // Check for perfect score and trigger celebration
  checkAndCelebrate(data);
}

// ── Preview Grid ──
const PLATFORM_GROUPS = [
  {
    id: 'social',
    title: 'Social & Microblogging',
    collapsed: false,
    platforms: ['google','facebook','twitter','linkedin','reddit','mastodon','bluesky','threads','tumblr','pinterest'],
  },
  {
    id: 'messaging',
    title: 'Messaging',
    collapsed: true,
    platforms: ['slack','discord','whatsapp','imessage','telegram','signal','teams','googlechat','zoom','line','kakaotalk'],
  },
  {
    id: 'collab',
    title: 'Collaboration & Productivity',
    collapsed: true,
    platforms: ['notion','jira','github','trello','figma'],
  },
  {
    id: 'content',
    title: 'Content, Email & RSS',
    collapsed: true,
    platforms: ['medium','substack','outlook','gmail','feedly'],
  },
];

const PLATFORM_ICONS = {
  google: '🔍', facebook: '📘', twitter: '🐦', linkedin: '💼', reddit: '🤖',
  mastodon: '🐘', bluesky: '🦋', threads: '🧵', tumblr: '📷', pinterest: '📌',
  slack: '💬', discord: '🎮', whatsapp: '📱', imessage: '💬', telegram: '✈️',
  signal: '🔐', teams: '👥', googlechat: '💬', zoom: '🎥', line: '📲', kakaotalk: '💛',
  notion: '📝', jira: '🔧', github: '🐙', trello: '📋', figma: '🎨',
  medium: '📖', substack: '📧', outlook: '📨', gmail: '📩', feedly: '📰',
};

const PLATFORM_NAMES = {
  google: 'Google Search', facebook: 'Facebook', twitter: 'X (Twitter)',
  linkedin: 'LinkedIn', reddit: 'Reddit', mastodon: 'Mastodon',
  bluesky: 'Bluesky', threads: 'Threads', tumblr: 'Tumblr', pinterest: 'Pinterest',
  slack: 'Slack', discord: 'Discord', whatsapp: 'WhatsApp', imessage: 'iMessage',
  telegram: 'Telegram', signal: 'Signal', teams: 'Microsoft Teams',
  googlechat: 'Google Chat', zoom: 'Zoom Chat', line: 'Line', kakaotalk: 'KakaoTalk',
  notion: 'Notion', jira: 'Jira / Confluence', github: 'GitHub', trello: 'Trello', figma: 'Figma',
  medium: 'Medium', substack: 'Substack', outlook: 'Outlook', gmail: 'Gmail', feedly: 'Feedly / RSS',
};

// ── Platform Skeleton Types ──
// Defines which skeleton layout each platform uses during loading state
// 'tall': Image on top (Facebook, Twitter, LinkedIn, Reddit, etc.)
// 'short': Thumbnail on left (WhatsApp, Slack, Notion, etc.)
// 'text-only': No image region (Google search results)
const PLATFORM_SKELETON_TYPES = {
  // Social & Microblogging
  google: 'text-only',
  facebook: 'tall',
  twitter: 'tall',
  linkedin: 'tall',
  reddit: 'tall',
  mastodon: 'tall',
  bluesky: 'tall',
  threads: 'tall',
  tumblr: 'tall',
  pinterest: 'tall',
  // Messaging
  slack: 'short',
  discord: 'tall',
  whatsapp: 'short',
  imessage: 'short',
  telegram: 'tall',
  signal: 'short',
  teams: 'tall',
  googlechat: 'tall',
  zoom: 'tall',
  line: 'tall',
  kakaotalk: 'tall',
  // Collaboration & Productivity
  notion: 'short',
  jira: 'short',
  github: 'tall',
  trello: 'short',
  figma: 'short',
  // Content, Email & RSS
  medium: 'tall',
  substack: 'tall',
  outlook: 'short',
  gmail: 'short',
  feedly: 'short',
};

// ── Platform Crop Specifications ──
// Each platform has: aspect ratio (min/max), crop mode (center/cover/contain), display size
const PLATFORM_CROPS = {
  // Social & Microblogging (blue)
  google: { category: 'social', aspect: { min: 0, max: Infinity }, cropMode: 'contain', displaySize: null, note: 'Uses full OG image, no fixed crop' },
  facebook: { category: 'social', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  twitter: { category: 'social', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: 'summary_large_image: 1200×630' },
  linkedin: { category: 'social', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 627 }, note: '1200×627 optimal' },
  reddit: { category: 'social', aspect: { min: 1, max: 1.91 }, cropMode: 'contain', displaySize: null, note: 'Flexible, max 1.91:1' },
  mastodon: { category: 'social', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  bluesky: { category: 'social', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  threads: { category: 'social', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  tumblr: { category: 'social', aspect: { min: 1, max: 1 }, cropMode: 'cover', displaySize: { w: 500, h: 500 }, note: '1:1 square crop' },
  pinterest: { category: 'social', aspect: { min: 0.67, max: 0.67 }, cropMode: 'cover', displaySize: { w: 1000, h: 1500 }, note: '2:3 vertical preferred' },

  // Messaging (green)
  slack: { category: 'messaging', aspect: { min: 0, max: Infinity }, cropMode: 'contain', displaySize: null, note: 'Full image shown' },
  discord: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  whatsapp: { category: 'messaging', aspect: { min: 1, max: 1 }, cropMode: 'cover', displaySize: { w: 400, h: 400 }, note: 'Square thumbnail ~68×68px' },
  imessage: { category: 'messaging', aspect: { min: 1.5, max: 1.5 }, cropMode: 'cover', displaySize: { w: 600, h: 400 }, note: '3:2 landscape' },
  telegram: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  signal: { category: 'messaging', aspect: { min: 1, max: 1 }, cropMode: 'cover', displaySize: { w: 300, h: 300 }, note: 'Square thumbnail 76×76px' },
  teams: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  googlechat: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  zoom: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  line: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  kakaotalk: { category: 'messaging', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },

  // Collaboration (purple)
  notion: { category: 'collaboration', aspect: { min: 1.5, max: 1.5 }, cropMode: 'cover', displaySize: { w: 600, h: 400 }, note: '56px wide thumbnail' },
  jira: { category: 'collaboration', aspect: { min: 1.5, max: 1.5 }, cropMode: 'cover', displaySize: { w: 600, h: 400 }, note: '56px wide thumbnail' },
  github: { category: 'collaboration', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  trello: { category: 'collaboration', aspect: { min: 1, max: 1 }, cropMode: 'cover', displaySize: { w: 300, h: 300 }, note: '56px wide thumbnail' },
  figma: { category: 'collaboration', aspect: { min: 1.5, max: 1.5 }, cropMode: 'cover', displaySize: { w: 600, h: 400 }, note: '56px wide thumbnail' },

  // Content (orange)
  medium: { category: 'content', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },
  substack: { category: 'content', aspect: { min: 1.91, max: 1.91 }, cropMode: 'cover', displaySize: { w: 1200, h: 630 }, note: '1200×630 optimal' },

  // Email (yellow)
  outlook: { category: 'email', aspect: { min: 1.5, max: 1.5 }, cropMode: 'cover', displaySize: { w: 600, h: 400 }, note: '80×80px thumbnail' },
  gmail: { category: 'email', aspect: { min: 1.5, max: 1.5 }, cropMode: 'cover', displaySize: { w: 600, h: 400 }, note: '80×80px thumbnail' },

  // RSS (pink)
  feedly: { category: 'rss', aspect: { min: 1.28, max: 1.28 }, cropMode: 'cover', displaySize: { w: 512, h: 400 }, note: '90×70px thumbnail' },
};

// Category colors
const CATEGORY_COLORS = {
  social: '#3b82f6',      // blue
  messaging: '#22c55e',   // green
  collaboration: '#a855f7', // purple
  content: '#f97316',     // orange
  email: '#eab308',       // yellow
  rss: '#ec4899',         // pink
};

const CATEGORY_LABELS = {
  social: 'Social & Microblogging',
  messaging: 'Messaging',
  collaboration: 'Collaboration & Productivity',
  content: 'Content Platforms',
  email: 'Email',
  rss: 'RSS / Readers',
};

// Platform character limits (title and description truncation points)
const PLATFORM_CHAR_LIMITS = {
  // Social & Microblogging
  google: { title: 60, desc: 160, pixelBased: true }, // Pixel-based: ~500-550px width
  facebook: { title: 60, desc: 120 }, // OG title: 60-80 chars shown, desc: ~120
  twitter: { title: 70, desc: 280 }, // X: 280 char total budget, title takes priority
  linkedin: { title: 60, desc: 150 }, // LinkedIn: 60-70 title, 150-200 desc
  reddit: { title: 80, desc: 200 }, // Reddit: generous limits
  mastodon: { title: 70, desc: 250 }, // Mastodon: 500 char total, title + desc
  bluesky: { title: 70, desc: 250 }, // Bluesky: 300 char post limit
  threads: { title: 70, desc: 250 }, // Threads: 500 char limit
  tumblr: { title: 60, desc: 120 }, // Tumblr: similar to FB
  pinterest: { title: 60, desc: 150 }, // Pinterest: 60 title, 150 desc

  // Messaging
  slack: { title: 70, desc: 200 }, // Slack: unfurls show ~70 title, 200 desc
  discord: { title: 80, desc: 200 }, // Discord: generous limits
  whatsapp: { title: 60, desc: 150 }, // WhatsApp: similar to FB
  imessage: { title: 60, desc: 150 }, // iMessage: similar to WhatsApp
  telegram: { title: 70, desc: 200 }, // Telegram: generous limits
  signal: { title: 60, desc: 150 }, // Signal: similar to WhatsApp
  teams: { title: 70, desc: 200 }, // Teams: similar to Slack
  googlechat: { title: 70, desc: 200 }, // Google Chat: similar to Slack
  zoom: { title: 70, desc: 200 }, // Zoom Chat: similar to Slack
  line: { title: 60, desc: 150 }, // LINE: similar to WhatsApp
  kakaotalk: { title: 60, desc: 150 }, // KakaoTalk: similar to WhatsApp

  // Collaboration & Productivity
  notion: { title: 60, desc: 120 }, // Notion: compact preview
  jira: { title: 60, desc: 120 }, // Jira: compact preview
  github: { title: 60, desc: 120 }, // GitHub: compact preview
  trello: { title: 60, desc: 120 }, // Trello: compact preview
  figma: { title: 60, desc: 120 }, // Figma: compact preview

  // Content, Email & RSS
  medium: { title: 70, desc: 160 }, // Medium: generous
  substack: { title: 70, desc: 160 }, // Substack: generous
  outlook: { title: 60, desc: 150 }, // Outlook: compact
  gmail: { title: 60, desc: 150 }, // Gmail: compact
  feedly: { title: 70, desc: 180 }, // Feedly: generous
};

// Average character width in pixels (for monospace approximation)
const AVG_CHAR_WIDTH = 8.5; // Approximate width of a character in typical preview font

// Calculate character limit for pixel-based platforms (Google)
function getPixelBasedLimit(text, maxWidth) {
  if (!text) return 0;
  // Simple approximation: count characters and estimate width
  // For better accuracy, we could use canvas text measurement
  return Math.floor(maxWidth / AVG_CHAR_WIDTH);
}

// Cropper state
let cropperState = {
  enabledPlatforms: new Set(Object.keys(PLATFORM_CROPS)),
  imageNaturalWidth: 0,
  imageNaturalHeight: 0,
  imageAspectRatio: 0,
};

// Toggle all platforms on by default
Object.keys(PLATFORM_CROPS).forEach(pid => cropperState.enabledPlatforms.add(pid));

// ── Skeleton Rendering ──

// Get skeleton type for a platform
function getSkeletonType(pid) {
  return PLATFORM_SKELETON_TYPES[pid] || 'tall';
}

// Get skeleton HTML for a platform based on its skeleton type
function getSkeletonHtml(pid) {
  const skeletonType = getSkeletonType(pid);
  const icon = PLATFORM_ICONS[pid] || '🌐';
  const name = PLATFORM_NAMES[pid] || pid;

  let bodyHtml = '';
  if (skeletonType === 'tall') {
    bodyHtml = `
      <div class="skeleton-body-tall">
        <div class="skeleton-tall-img"></div>
        <div class="skeleton-tall-meta">
          <div class="skeleton-tall-domain"></div>
          <div class="skeleton-tall-title"></div>
          <div class="skeleton-tall-desc"></div>
          <div class="skeleton-tall-desc-short"></div>
        </div>
      </div>
    `;
  } else if (skeletonType === 'short') {
    bodyHtml = `
      <div class="skeleton-body-short">
        <div class="skeleton-short-thumb"></div>
        <div class="skeleton-short-meta">
          <div class="skeleton-short-domain"></div>
          <div class="skeleton-short-title"></div>
          <div class="skeleton-short-desc"></div>
        </div>
      </div>
    `;
  } else if (skeletonType === 'text-only') {
    bodyHtml = `
      <div class="skeleton-body-text">
        <div class="skeleton-text-breadcrumb">
          <div class="skeleton-text-favicon"></div>
          <div class="skeleton-text-domain"></div>
        </div>
        <div class="skeleton-text-title"></div>
        <div class="skeleton-text-desc"></div>
        <div class="skeleton-text-desc-short"></div>
      </div>
    `;
  }

  return `
    <div class="skeleton-header">
      <div class="skeleton-icon"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-badge"></div>
    </div>
    ${bodyHtml}
    <div class="skeleton-footer">
      <div class="skeleton-issue"></div>
      <div class="skeleton-issue"></div>
      <div class="skeleton-issue"></div>
    </div>
  `;
}

// Render skeleton cards for all platforms
function renderSkeletons() {
  previewGrid.innerHTML = '';
  let globalIndex = 0;

  PLATFORM_GROUPS.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'platform-group' + (group.collapsed ? ' collapsed' : '');
    groupEl.id = 'group-' + group.id;
    groupEl.dataset.groupId = group.id;

    const header = document.createElement('div');
    header.className = 'platform-group-header';
    header.innerHTML = `
      <span class="group-chevron">&#9660;</span>
      <span class="group-title">${escHtml(group.title)}</span>
      <span class="group-subtitle">Loading...</span>
    `;
    header.addEventListener('click', () => {
      groupEl.classList.toggle('collapsed');
    });
    groupEl.appendChild(header);

    const row = document.createElement('div');
    row.className = 'cards-row skeleton-row';
    row.dataset.groupId = group.id;

    // Use custom order if available, otherwise use default group order
    let platforms = group.platforms;
    if (platformPrefs.cardOrder[group.id]) {
      const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
      const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
      platforms = [...customOrder, ...newPlatforms];
    }

    platforms.forEach((pid, i) => {
      const card = document.createElement('div');
      card.className = `platform-skeleton-card`;
      card.dataset.pid = pid;
      card.dataset.groupId = group.id;

      // Stagger animation: 50ms delay per card (unless reduced motion preferred)
      if (!prefersReducedMotion()) {
        card.style.animationDelay = (globalIndex * 50) + 'ms';
      } else {
        card.style.animationDelay = '0ms';
      }

      card.innerHTML = getSkeletonHtml(pid);
      row.appendChild(card);
      globalIndex++;
    });

    groupEl.appendChild(row);
    previewGrid.appendChild(groupEl);
  });
}

// Show skeleton cards immediately at 0ms (wrapper function for clarity)
function showSkeletonCards() {
  renderSkeletons();
}

function renderPreviews(data) {
  previewGrid.innerHTML = '';
  PLATFORM_GROUPS.forEach((group, gi) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'platform-group' + (group.collapsed ? ' collapsed' : '');
    groupEl.id = 'group-' + group.id;
    groupEl.dataset.groupId = group.id;

    // Count scores for group
    const groupScores = group.platforms.map(pid => data.scoring.scores[pid]).filter(Boolean);
    const gPassing = groupScores.filter(s => ['A+','A'].includes(s.grade)).length;
    const gWarn = groupScores.filter(s => ['B','C'].includes(s.grade)).length;
    const gFail = groupScores.filter(s => ['D','F'].includes(s.grade)).length;

    const header = document.createElement('div');
    header.className = 'platform-group-header';
    header.innerHTML = `
      <span class="group-chevron">&#9660;</span>
      <span class="group-title">${escHtml(group.title)}</span>
      <span class="group-subtitle">${gPassing} &#10003; ${gWarn > 0 ? gWarn + ' &#9888; ' : ''}${gFail > 0 ? gFail + ' &#10007;' : ''}</span>
    `;
    header.addEventListener('click', () => {
      groupEl.classList.toggle('collapsed');
    });
    groupEl.appendChild(header);

    const row = document.createElement('div');
    row.className = 'cards-row';
    row.dataset.groupId = group.id;

    // Use custom order if available, otherwise use default group order
    let platforms = group.platforms;
    if (platformPrefs.cardOrder[group.id]) {
      // Filter to only include platforms that still exist in the group
      const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
      // Add any new platforms that aren't in the custom order yet
      const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
      platforms = [...customOrder, ...newPlatforms];
    }

    platforms.forEach((pid, i) => {
      const scoreData = data.scoring.scores[pid];
      if (!scoreData) return;
      // Respect prefers-reduced-motion for staggered animation delay
      const animDelay = prefersReducedMotion() ? 0 : i * 60;
      const card = buildCard(pid, scoreData, data, animDelay, group.id);
      row.appendChild(card);
    });

    groupEl.appendChild(row);
    previewGrid.appendChild(groupEl);
  });

  // Initialize drag and drop for cards
  initCardDragAndDrop();
}

/**
 * Render text-only previews immediately after metadata loads.
 * Shows score badge and card text content, with loading indicators for images.
 * This allows users to see text content within ~600ms while images load progressively.
 */
function renderTextPreviewsOnly(data) {
  // Store that we're in progressive loading mode
  window.progressiveLoading = true;

  // Crossfade skeleton cards to text-only content
  const reducedMotion = prefersReducedMotion();

  PLATFORM_GROUPS.forEach((group, gi) => {
    // Find existing skeleton row or create new structure
    let groupEl = document.getElementById('group-' + group.id);
    let row, header;

    if (groupEl) {
      // Update existing group header with actual scores
      header = groupEl.querySelector('.platform-group-header');
      row = groupEl.querySelector('.cards-row');

      // Count scores for group
      const groupScores = group.platforms.map(pid => data.scoring.scores[pid]).filter(Boolean);
      const gPassing = groupScores.filter(s => ['A+','A'].includes(s.grade)).length;
      const gWarn = groupScores.filter(s => ['B','C'].includes(s.grade)).length;
      const gFail = groupScores.filter(s => ['D','F'].includes(s.grade)).length;

      header.innerHTML = `
        <span class="group-chevron">&#9660;</span>
        <span class="group-title">${escHtml(group.title)}</span>
        <span class="group-subtitle">${gPassing} &#10003; ${gWarn > 0 ? gWarn + ' &#9888; ' : ''}${gFail > 0 ? gFail + ' &#10007;' : ''}</span>
      `;
      header.addEventListener('click', () => {
        groupEl.classList.toggle('collapsed');
      });
    } else {
      // Fallback: create new group structure (shouldn't happen with proper skeleton flow)
      groupEl = document.createElement('div');
      groupEl.className = 'platform-group' + (group.collapsed ? ' collapsed' : '');
      groupEl.id = 'group-' + group.id;
      groupEl.dataset.groupId = group.id;

      // Count scores for group
      const groupScores = group.platforms.map(pid => data.scoring.scores[pid]).filter(Boolean);
      const gPassing = groupScores.filter(s => ['A+','A'].includes(s.grade)).length;
      const gWarn = groupScores.filter(s => ['B','C'].includes(s.grade)).length;
      const gFail = groupScores.filter(s => ['D','F'].includes(s.grade)).length;

      header = document.createElement('div');
      header.className = 'platform-group-header';
      header.innerHTML = `
        <span class="group-chevron">&#9660;</span>
        <span class="group-title">${escHtml(group.title)}</span>
        <span class="group-subtitle">${gPassing} &#10003; ${gWarn > 0 ? gWarn + ' &#9888; ' : ''}${gFail > 0 ? gFail + ' &#10007;' : ''}</span>
      `;
      header.addEventListener('click', () => {
        groupEl.classList.toggle('collapsed');
      });
      groupEl.appendChild(header);

      row = document.createElement('div');
      row.className = 'cards-row';
      row.dataset.groupId = group.id;
      groupEl.appendChild(row);
      previewGrid.appendChild(groupEl);
    }

    // Use custom order if available
    let platforms = group.platforms;
    if (platformPrefs.cardOrder[group.id]) {
      const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
      const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
      platforms = [...customOrder, ...newPlatforms];
    }

    // Crossfade: fade out skeleton cards, then replace with text-only cards
    let globalIndex = 0;
    platforms.forEach((pid, i) => {
      const scoreData = data.scoring.scores[pid];
      if (!scoreData) return;

      const existingSkeleton = row.querySelector(`.platform-skeleton-card[data-pid="${pid}"]`);
      const animDelay = reducedMotion ? 0 : globalIndex * 50; // 50ms stagger for crossfade

      if (existingSkeleton) {
        // Crossfade out: add fade-out class
        existingSkeleton.classList.add('skeleton-fade-out');
        existingSkeleton.style.transition = reducedMotion ? 'none' : `opacity 150ms ease, transform 150ms ease`;
        existingSkeleton.style.transitionDelay = animDelay + 'ms';

        // After fade-out, replace with text-only card
        setTimeout(() => {
          const textCard = buildTextOnlyCard(pid, scoreData, data, reducedMotion ? 0 : i * 60, group.id);

          // Add fade-in animation
          if (!reducedMotion) {
            textCard.classList.add('skeleton-fade-in');
            textCard.style.animationDelay = animDelay + 'ms';
          }

          existingSkeleton.replaceWith(textCard);
        }, reducedMotion ? 0 : 150 + animDelay);
      } else {
        // No skeleton found, directly add text-only card
        const textCard = buildTextOnlyCard(pid, scoreData, data, reducedMotion ? 0 : i * 60, group.id);

        if (!reducedMotion) {
          textCard.classList.add('skeleton-fade-in');
        }

        row.appendChild(textCard);
      }

      globalIndex++;
    });
  });
}

/**
 * Build a text-only card with loading indicator for images.
 * Used during progressive loading to show text content immediately.
 */
function buildTextOnlyCard(pid, scoreData, data, animDelay, groupId) {
  const card = document.createElement('div');
  card.className = `platform-card ${gradeClass(scoreData.grade)}`;
  card.style.animationDelay = animDelay + 'ms';
  card.dataset.pid = pid;
  card.dataset.groupId = groupId;
  card.dataset.loadingImages = 'true';
  card.tabIndex = -1;
  card.draggable = true;

  // Initialize context state
  if (!cardContextState[pid]) {
    cardContextState[pid] = { context: false, theme: 'dark' };
  }

  // Header with loading badge
  const header = document.createElement('div');
  header.className = 'card-header';
  const supportsTheme = PLATFORMS_WITH_THEME.includes(pid);

  header.innerHTML = `
    <span class="card-platform-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
    <span class="card-platform-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
    <div class="card-header-controls">
      ${supportsTheme ? `
        <button class="card-theme-toggle" data-pid="${pid}" title="Toggle theme" disabled>
          <span class="theme-icon">${cardContextState[pid].theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      ` : ''}
      <button class="card-screenshot-btn" data-pid="${pid}" title="Download screenshot" disabled>
        <span>&#128190;</span>
      </button>
      <button class="card-context-toggle" data-pid="${pid}" title="Toggle context view" disabled>
        <span class="context-icon">🃏</span>
        <span class="context-label">Loading...</span>
      </button>
      <span class="card-grade ${gradeClass(scoreData.grade)}">${scoreData.grade}</span>
    </div>
  `;
  card.appendChild(header);

  // Body with text content and loading placeholder for images
  const body = document.createElement('div');
  body.className = 'card-body';
  body.id = `card-body-${pid}`;

  // Render card with text but no actual images (use placeholders)
  body.innerHTML = renderPlatformCard(pid, data.meta, null, data.finalUrl, null);

  // Add loading spinner overlay for image areas
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'card-image-loading';
  loadingOverlay.innerHTML = '<div class="loading-spinner-small"></div>';
  body.appendChild(loadingOverlay);

  card.appendChild(body);

  // Footer with issues
  if (scoreData.issues && scoreData.issues.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    scoreData.issues.slice(0, 3).forEach(issue => {
      const div = document.createElement('div');
      div.className = 'card-issue';
      const isError = scoreData.grade === 'D' || scoreData.grade === 'F';
      div.innerHTML = `<span class="${isError ? 'issue-icon-err' : 'issue-icon-warn'}">${isError ? '✗' : '⚠'}</span><span>${escHtml(issue)}</span>`;
      footer.appendChild(div);
    });
    card.appendChild(footer);
  }

  return card;
}

/**
 * Update existing cards with image data as it arrives.
 * Replaces loading placeholders with actual images progressively.
 */
function updatePreviewsWithImages(data) {
  const reducedMotion = prefersReducedMotion();
  const crossfadeDuration = reducedMotion ? 0 : 150; // 150ms crossfade

  // Update each existing card with image data
  PLATFORM_GROUPS.forEach((group) => {
    group.platforms.forEach((pid) => {
      const existingCard = document.querySelector(`.platform-card[data-pid="${pid}"]`);
      if (!existingCard) return;

      // Remove loading state
      delete existingCard.dataset.loadingImages;

      // Update score badge in case it changed
      const scoreData = data.scoring.scores[pid];
      if (scoreData) {
        const gradeBadge = existingCard.querySelector('.card-grade');
        if (gradeBadge) {
          gradeBadge.className = 'card-grade ' + gradeClass(scoreData.grade);
          gradeBadge.textContent = scoreData.grade;
        }

        // Update card grade class
        existingCard.className = `platform-card ${gradeClass(scoreData.grade)}`;
      }

      // Update card body with images using crossfade
      const body = existingCard.querySelector(`#card-body-${pid}`);
      if (body) {
        // Crossfade: fade out old content, replace, fade in new content
        if (!reducedMotion) {
          body.style.opacity = '0';
          body.style.transform = 'translateY(4px)';
          body.style.transition = `opacity ${crossfadeDuration}ms ease, transform ${crossfadeDuration}ms`;
        }

        setTimeout(() => {
          // Remove loading overlay
          const loadingOverlay = body.querySelector('.card-image-loading');
          if (loadingOverlay) {
            loadingOverlay.remove();
          }

          // Re-render with actual images
          body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl, data.dominantColor);

          // Fade in new content
          if (!reducedMotion) {
            body.style.opacity = '1';
            body.style.transform = 'translateY(0)';
          }
        }, crossfadeDuration);
      }

      // Enable controls that were disabled during loading
      const screenshotBtn = existingCard.querySelector('.card-screenshot-btn');
      if (screenshotBtn) {
        screenshotBtn.disabled = false;
        screenshotBtn.addEventListener('click', () => downloadScreenshot(pid, data));
      }

      const contextToggle = existingCard.querySelector('.card-context-toggle');
      if (contextToggle) {
        contextToggle.disabled = false;
        contextToggle.querySelector('.context-label').textContent = 'Card only';
        contextToggle.addEventListener('click', () => toggleCardContext(pid, data));
      }

      const themeToggle = existingCard.querySelector('.card-theme-toggle');
      if (themeToggle) {
        themeToggle.disabled = false;
        themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
      }

      // Add context menu listener
      existingCard.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, group.id, data));
    });
  });

  // No longer in progressive loading mode
  window.progressiveLoading = false;

  // Initialize drag and drop for cards
  initCardDragAndDrop();
}

function buildCard(pid, scoreData, data, animDelay, groupId) {
  const card = document.createElement('div');
  card.className = `platform-card ${gradeClass(scoreData.grade)}`;
  card.style.animationDelay = animDelay + 'ms';
  card.dataset.pid = pid;
  card.dataset.groupId = groupId;
  card.tabIndex = -1; // Make focusable but not tab-focused by default
  card.draggable = true; // Enable drag and drop

  // Initialize context state for this card
  if (!cardContextState[pid]) {
    cardContextState[pid] = { context: false, theme: 'dark' };
  }

  // Header with context toggle
  const header = document.createElement('div');
  header.className = 'card-header';
  const supportsTheme = PLATFORMS_WITH_THEME.includes(pid);

  header.innerHTML = `
    <span class="card-platform-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
    <span class="card-platform-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
    <div class="card-header-controls">
      ${supportsTheme ? `
        <button class="card-theme-toggle" data-pid="${pid}" title="Toggle theme">
          <span class="theme-icon">${cardContextState[pid].theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      ` : ''}
      <button class="card-screenshot-btn" data-pid="${pid}" title="Download screenshot">
        <span>&#128190;</span>
      </button>
      <button class="card-context-toggle" data-pid="${pid}" title="Toggle context view">
        <span class="context-icon">${cardContextState[pid].context ? '🖼️' : '🃏'}</span>
        <span class="context-label">${cardContextState[pid].context ? 'In context' : 'Card only'}</span>
      </button>
      <span class="card-grade ${gradeClass(scoreData.grade)}">${scoreData.grade}</span>
    </div>
  `;
  card.appendChild(header);

  // Body — platform-specific renderer
  const body = document.createElement('div');
  body.className = 'card-body';
  body.id = `card-body-${pid}`;

  if (cardContextState[pid].context) {
    body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme, data.dominantColor);
  } else {
    body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl, data.dominantColor);
  }
  card.appendChild(body);

  // Footer with issues
  if (scoreData.issues && scoreData.issues.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    scoreData.issues.slice(0, 3).forEach(issue => {
      const div = document.createElement('div');
      div.className = 'card-issue';
      const isError = scoreData.grade === 'D' || scoreData.grade === 'F';
      div.innerHTML = `<span class="${isError ? 'issue-icon-err' : 'issue-icon-warn'}">${isError ? '✗' : '⚠'}</span><span>${escHtml(issue)}</span>`;
      footer.appendChild(div);
    });
    card.appendChild(footer);
  }

  // Event listeners for toggles
  const screenshotBtn = header.querySelector('.card-screenshot-btn');
  screenshotBtn.addEventListener('click', () => downloadScreenshot(pid, data));

  const contextToggle = header.querySelector('.card-context-toggle');
  contextToggle.addEventListener('click', () => toggleCardContext(pid, data));

  const themeToggle = header.querySelector('.card-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
  }

  // Context menu listener
  card.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, groupId, data));

  return card;
}

// ── Screenshot download ──
async function downloadScreenshot(pid, data) {
  const btn = document.querySelector(`.card-screenshot-btn[data-pid="${pid}"]`);
  if (!btn) return;

  // Show loading state
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner-small"></span>';
  btn.disabled = true;

  try {
    const response = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: pid,
        meta: data.meta,
        imageProbe: data.imageProbe,
        url: data.finalUrl || data.url,
        format: 'svg',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate screenshot');
    }

    // Get the blob
    const blob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pid}-card.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Screenshot downloaded!', 2000);
  } catch (err) {
    console.error('Screenshot download error:', err);
    showToast('Error: ' + err.message, 3000);
  } finally {
    // Restore button state
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

// Platforms that support dark/light mode (from platform-frames module)
const PLATFORMS_WITH_THEME = typeof getPlatformsWithThemeSupport === 'function'
  ? getPlatformsWithThemeSupport()
  : ['discord', 'slack', 'twitter', 'telegram', 'github']; // fallback if module not loaded

function toggleCardContext(pid, data) {
  cardContextState[pid].context = !cardContextState[pid].context;
  const body = document.getElementById(`card-body-${pid}`);
  if (body) {
    if (cardContextState[pid].context) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme, data.dominantColor);
    } else {
      body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl, data.dominantColor);
    }
  }
  updateCardHeader(pid);
}

function toggleCardTheme(pid, data) {
  cardContextState[pid].theme = cardContextState[pid].theme === 'dark' ? 'light' : 'dark';
  if (cardContextState[pid].context) {
    const body = document.getElementById(`card-body-${pid}`);
    if (body) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme);
    }
  }
  updateCardHeader(pid);
}

function updateCardHeader(pid) {
  const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
  if (!card) return;

  const contextToggle = card.querySelector('.card-context-toggle');
  const themeToggle = card.querySelector('.card-theme-toggle');

  if (contextToggle) {
    contextToggle.querySelector('.context-icon').textContent = cardContextState[pid].context ? '🖼️' : '🃏';
    contextToggle.querySelector('.context-label').textContent = cardContextState[pid].context ? 'In context' : 'Card only';
  }

  if (themeToggle) {
    themeToggle.querySelector('.theme-icon').textContent = cardContextState[pid].theme === 'dark' ? '🌙' : '☀️';
  }
}

// ── Platform card renderers ──
function renderPlatformCard(pid, meta, imageProbe, baseUrl, dominantColor) {
  const ogTitle = meta.og.title || meta.title || '';
  const ogDesc = meta.og.description || meta.description || '';
  const ogImage = meta.og.image || meta.twitter.image || '';
  const twitterCard = meta.twitter.card || 'summary_large_image';
  const twTitle = meta.twitter.title || ogTitle;
  const twDesc = meta.twitter.description || ogDesc;
  const twImage = meta.twitter.image || ogImage;
  const ogSite = meta.og.site_name || '';
  const themeColor = meta.themeColor || '#5865f2';
  const domain = getDomain(baseUrl);
  const faviconUrl = meta.favicon || '';

  const imgHtml = (url, cls) => url
    ? `<div class="img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${escHtml(url)}" alt="" onerror="this.parentElement.style.display='none';this.nextElementSibling?.style.display='flex'" loading="lazy" onload="this.classList.add('loaded')" /><span class="img-placeholder" style="display:none">No image</span></div>`
    : `<span class="img-placeholder">No image</span>`;

  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  switch (pid) {
    case 'google':
      return `<div class="google-card">
        <div class="google-breadcrumb">
          <span class="google-favicon">${faviconUrl ? `<img src="${escHtml(faviconUrl)}" alt="" onerror="this.parentElement.style.background='#ddd'" loading="lazy" />` : ''}</span>
          <span class="google-domain">${escHtml(domain)}</span>
        </div>
        <div class="google-title">${escHtml(trunc(meta.title || ogTitle, 60))}</div>
        <div class="google-desc">${escHtml(trunc(meta.description || ogDesc, 158))}</div>
      </div>`;

    case 'facebook':
    case 'threads':
      return `<div class="${pid === 'threads' ? 'threads-card' : 'fb-card'}">
        <div class="mock-image ${pid === 'threads' ? 'threads-image' : 'fb-image'}">${imgHtml(ogImage)}</div>
        <div class="${pid === 'threads' ? 'threads-meta' : 'fb-meta'}">
          <div class="${pid === 'threads' ? 'threads-domain' : 'fb-domain'}">${escHtml(domain.toUpperCase())}</div>
          <div class="${pid === 'threads' ? 'threads-title' : 'fb-title'}">${escHtml(trunc(ogTitle, 60))}</div>
          ${ogDesc ? `<div class="${pid === 'threads' ? 'threads-desc' : 'fb-desc'}">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
        </div>
      </div>`;

    case 'twitter': {
      const isLarge = twitterCard === 'summary_large_image';
      return `<div class="tw-card${isLarge ? '' : ' tw-summary'}">
        <div class="mock-image tw-image${isLarge ? '' : ' square'}">${imgHtml(twImage)}</div>
        <div class="tw-meta">
          <div class="tw-title">${escHtml(trunc(twTitle, 70))}</div>
          ${twDesc ? `<div class="tw-desc">${escHtml(trunc(twDesc, 200))}</div>` : ''}
          <div class="tw-domain">${escHtml(domain)}</div>
        </div>
      </div>`;
    }

    case 'linkedin':
      return `<div class="li-card">
        <div class="mock-image li-image">${imgHtml(ogImage)}</div>
        <div class="li-meta">
          <div class="li-title">${escHtml(trunc(ogTitle, 60))}</div>
          <div class="li-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'reddit':
      return `<div class="rd-card">
        <div class="mock-image rd-image">${imgHtml(ogImage)}</div>
        <div class="rd-meta">
          <div class="rd-title">${escHtml(trunc(ogTitle || meta.title, 90))}</div>
          ${ogDesc ? `<div class="rd-desc">${escHtml(trunc(ogDesc, 200))}</div>` : ''}
          <div class="rd-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'mastodon':
      return `<div class="mastodon-card">
        <div class="mock-image mastodon-image">${imgHtml(ogImage)}</div>
        <div class="mastodon-meta">
          <div class="mastodon-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="mastodon-desc">${escHtml(trunc(ogDesc, 200))}</div>` : ''}
          <div class="mastodon-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'bluesky':
      return `<div class="bluesky-card">
        <div class="mock-image bluesky-image">${imgHtml(ogImage)}</div>
        <div class="bluesky-meta">
          <div class="bluesky-title">${escHtml(trunc(ogTitle, 160))}</div>
          ${ogDesc ? `<div class="bluesky-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="bluesky-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'tumblr':
      return `<div class="tumblr-card">
        <div class="mock-image square" style="width:130px;flex-shrink:0;background:#2c3e50">${imgHtml(ogImage)}</div>
        <div class="tumblr-meta">
          <div class="tumblr-title">${escHtml(trunc(ogTitle, 60))}</div>
          ${ogDesc ? `<div class="tumblr-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="tumblr-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'pinterest':
      return `<div class="pinterest-card">
        <div class="mock-image vertical pinterest-image">${imgHtml(ogImage)}</div>
        <div class="pinterest-meta">
          <div class="pinterest-title">${escHtml(trunc(ogTitle, 60))}</div>
          ${ogDesc ? `<div class="pinterest-desc">${escHtml(trunc(ogDesc, 100))}</div>` : ''}
          <div class="pinterest-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'slack':
      return `<div class="slack-card">
        <div class="slack-site">${escHtml(ogSite || domain)}</div>
        <div class="slack-title">${escHtml(trunc(ogTitle, 80))}</div>
        ${ogDesc ? `<div class="slack-desc">${escHtml(trunc(ogDesc, 150))}</div>` : ''}
        ${ogImage ? `<div class="slack-image"><div class="mock-image" style="height:160px;aspect-ratio:auto">${imgHtml(ogImage)}</div></div>` : ''}
      </div>`;

    case 'discord':
      return `<div class="discord-card" style="border-left-color:${escHtml(themeColor)}">
        ${ogSite ? `<div class="discord-site">${escHtml(ogSite)}</div>` : ''}
        <div class="discord-title">${escHtml(trunc(ogTitle, 256))}</div>
        ${ogDesc ? `<div class="discord-desc">${escHtml(trunc(ogDesc, 300))}</div>` : ''}
        ${ogImage ? `<div class="discord-image"><div class="mock-image" style="height:180px;aspect-ratio:auto;background:#1e2028">${imgHtml(ogImage)}</div></div>` : ''}
      </div>`;

    case 'whatsapp':
      return `<div class="wa-card">
        <div class="wa-card-inner">
          <div class="wa-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" class="img-loading" style="width:68px;height:68px;object-fit:cover" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : ''}</div>
          <div class="wa-meta">
            <div class="wa-domain">${escHtml(domain)}</div>
            <div class="wa-title">${escHtml(trunc(ogTitle, 80))}</div>
            ${ogDesc ? `<div class="wa-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          </div>
        </div>
      </div>`;

    case 'imessage':
      return `<div class="im-card">
        <div class="mock-image im-image">${imgHtml(ogImage)}</div>
        <div class="im-meta">
          <div class="im-title">${escHtml(trunc(ogTitle || meta.title, 80))}</div>
          <div class="im-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'telegram':
      return `<div class="tg-card">
        <div class="mock-image tg-image">${imgHtml(ogImage)}</div>
        <div class="tg-meta">
          <div class="tg-title">${escHtml(trunc(ogTitle, 200))}</div>
          ${ogDesc ? `<div class="tg-desc">${escHtml(trunc(ogDesc, 170))}</div>` : ''}
          <div class="tg-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'signal':
      return `<div class="signal-card">
        <div class="signal-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" class="img-loading" style="width:76px;height:76px;object-fit:cover" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : ''}</div>
        <div class="signal-meta">
          <div class="signal-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="signal-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="signal-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'teams':
      return `<div class="teams-card">
        <div class="mock-image teams-image">${imgHtml(ogImage)}</div>
        <div class="teams-meta">
          <div class="teams-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="teams-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="teams-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'googlechat':
      return `<div class="gchat-card">
        <div class="mock-image gchat-image">${imgHtml(ogImage)}</div>
        <div class="gchat-meta">
          <div class="gchat-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="gchat-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="gchat-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'zoom':
    case 'line':
    case 'kakaotalk':
      return `<div class="generic-card">
        <div class="mock-image generic-image">${imgHtml(ogImage)}</div>
        <div class="generic-meta">
          <div class="generic-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="generic-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="generic-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'notion':
      return `<div class="notion-card">
        <div class="notion-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" class="img-loading" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : ''}</div>
        <div class="notion-meta">
          <div class="notion-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="notion-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="notion-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'jira':
      return `<div class="jira-card">
        <div class="jira-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : ''}</div>
        <div class="jira-meta">
          <div class="jira-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="jira-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="jira-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'github':
      return `<div class="github-card">
        <div class="mock-image github-image">${imgHtml(ogImage)}</div>
        <div class="github-meta">
          <div class="github-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="github-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="github-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'trello':
      return `<div class="trello-card">
        <div class="trello-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : ''}</div>
        <div class="trello-meta">
          <div class="trello-title">${escHtml(trunc(ogTitle, 80))}</div>
          <div class="trello-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'figma':
      return `<div class="figma-card">
        <div class="figma-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : ''}</div>
        <div class="figma-meta">
          <div class="figma-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="figma-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="figma-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'medium':
    case 'substack': {
      const cls = pid;
      return `<div class="${cls}-card">
        <div class="mock-image ${cls}-image">${imgHtml(ogImage)}</div>
        <div class="${cls}-meta">
          <div class="${cls}-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="${cls}-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="${cls}-domain">${escHtml(domain)}</div>
        </div>
      </div>`;
    }

    case 'outlook':
    case 'gmail':
      return `<div class="email-card">
        <div class="email-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : ''}</div>
        <div class="email-meta">
          <div class="email-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="email-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="email-domain">${escHtml(domain)}</div>
        </div>
      </div>`;

    case 'feedly':
      return `<div class="feedly-card">
        <div class="feedly-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : ''}</div>
        <div class="feedly-meta">
          <div class="feedly-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="feedly-desc">${escHtml(trunc(ogDesc, 120))}</div>` : ''}
          <div class="feedly-source">${escHtml(domain)} &bull; just now</div>
        </div>
      </div>`;

    default:
      return `<div class="generic-card">
        <div class="mock-image generic-image">${imgHtml(ogImage)}</div>
        <div class="generic-meta">
          <div class="generic-title">${escHtml(trunc(ogTitle, 80))}</div>
          ${ogDesc ? `<div class="generic-desc">${escHtml(trunc(ogDesc, 160))}</div>` : ''}
          <div class="generic-domain">${escHtml(domain)}</div>
        </div>
      </div>`;
  }
}

// ── Platform Context Frame Renderers ──
// Uses platform-frames module for structured context frame generation
function renderPlatformWithContext(pid, meta, imageProbe, baseUrl, theme = 'dark', dominantColor) {
  const ogTitle = meta.og.title || meta.title || '';
  const ogDesc = meta.og.description || meta.description || '';
  const ogImage = meta.og.image || meta.twitter.image || '';
  const ogSite = meta.og.site_name || '';
  const domain = getDomain(baseUrl);
  const themeColor = meta.themeColor || '#5865f2';

  // Prepare content data for the platform frame
  const contentData = {
    title: ogTitle,
    description: ogDesc,
    image: ogImage,
    domain: domain,
    site: ogSite,
    dominantColor: dominantColor,
    themeColor: themeColor,
  };

  // Use new platform-frames module for platforms with structured frames
  if (typeof buildContextFrame === 'function') {
    switch (pid) {
      case 'twitter':
      case 'slack':
      case 'discord':
        // Proof of concept: use new structured frame generation
        return buildContextFrame(pid, contentData, theme);

      // Other platforms still use legacy renderers (to be migrated)
      default:
        return renderPlatformWithContextLegacy(pid, ogTitle, ogDesc, ogImage, domain, ogSite, theme, dominantColor, meta, imageProbe, baseUrl);
    }
  } else {
    // Fallback if platform-frames module not loaded
    return renderPlatformWithContextLegacy(pid, ogTitle, ogDesc, ogImage, domain, ogSite, theme, dominantColor, meta, imageProbe, baseUrl);
  }
}

// Legacy context frame renderer (for platforms not yet migrated)
function renderPlatformWithContextLegacy(pid, ogTitle, ogDesc, ogImage, domain, ogSite, theme, dominantColor, meta, imageProbe, baseUrl) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  switch (pid) {
    case 'google':
      return renderGoogleContext(ogTitle, ogDesc, domain);

    case 'facebook':
      return renderFacebookContext(ogTitle, ogDesc, ogImage, domain, ogSite, dominantColor);

    case 'twitter':
      return renderTwitterContext(ogTitle, ogDesc, ogImage, domain, theme, dominantColor);

    case 'linkedin':
      return renderLinkedInContext(ogTitle, ogDesc, ogImage, domain, dominantColor);

    case 'reddit':
      return renderRedditContext(ogTitle, ogDesc, ogImage, domain, dominantColor);

    case 'slack':
      return renderSlackContext(ogTitle, ogDesc, ogImage, domain, ogSite, theme);

    case 'discord':
      return renderDiscordContext(ogTitle, ogDesc, ogImage, domain, ogSite, theme);

    case 'whatsapp':
      return renderWhatsAppContext(ogTitle, ogDesc, ogImage, domain);

    case 'imessage':
      return renderiMessageContext(ogTitle, ogDesc, ogImage, domain);

    case 'telegram':
      return renderTelegramContext(ogTitle, ogDesc, ogImage, domain, theme);

    case 'signal':
      return renderSignalContext(ogTitle, ogDesc, ogImage, domain);

    case 'teams':
      return renderTeamsContext(ogTitle, ogDesc, ogImage, domain);

    case 'googlechat':
      return renderGoogleChatContext(ogTitle, ogDesc, ogImage, domain);

    case 'mastodon':
      return renderMastodonContext(ogTitle, ogDesc, ogImage, domain);

    case 'bluesky':
      return renderBlueskyContext(ogTitle, ogDesc, ogImage, domain);

    case 'threads':
      return renderThreadsContext(ogTitle, ogDesc, ogImage, domain);

    case 'tumblr':
      return renderTumblrContext(ogTitle, ogDesc, ogImage, domain);

    case 'pinterest':
      return renderPinterestContext(ogTitle, ogDesc, ogImage, domain);

    case 'notion':
      return renderNotionContext(ogTitle, ogDesc, ogImage, domain);

    case 'jira':
      return renderJiraContext(ogTitle, ogDesc, ogImage, domain);

    case 'github':
      return renderGitHubContext(ogTitle, ogDesc, ogImage, domain, theme);

    case 'trello':
      return renderTrelloContext(ogTitle, ogDesc, ogImage, domain);

    case 'figma':
      return renderFigmaContext(ogTitle, ogDesc, ogImage, domain);

    case 'medium':
      return renderMediumContext(ogTitle, ogDesc, ogImage, domain);

    case 'substack':
      return renderSubstackContext(ogTitle, ogDesc, ogImage, domain);

    case 'outlook':
    case 'gmail':
      return renderEmailContext(ogTitle, ogDesc, ogImage, domain, pid);

    case 'feedly':
      return renderFeedlyContext(ogTitle, ogDesc, ogImage, domain);

    case 'zoom':
    case 'line':
    case 'kakaotalk':
      return renderGenericMessagingContext(ogTitle, ogDesc, ogImage, domain, pid);

    default:
      return `<div class="context-frame generic-context">
        <div class="context-header"><span class="context-title">${escHtml(PLATFORM_NAMES[pid] || pid)}</span></div>
        <div class="context-body">${renderPlatformCard(pid, meta, imageProbe, baseUrl, dominantColor)}</div>
      </div>`;
  }
}

// Context frame implementations
function renderGoogleContext(title, desc, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame google-context">
    <div class="google-search-bar">
      <span class="search-icon">🔍</span>
      <span class="search-text">Search...</span>
    </div>
    <div class="google-results">
      <div class="google-result-item">
        <div class="google-breadcrumb">
          <span class="google-favicon">🌐</span>
          <span class="google-domain">${escHtml(domain)}</span>
        </div>
        <div class="google-title">${escHtml(trunc(title || 'Page Title', 60))}</div>
        <div class="google-desc">${escHtml(trunc(desc || 'Page description appears here...', 158))}</div>
      </div>
      <div class="google-result-item google-result-dim">
        <div class="google-breadcrumb"><span class="google-favicon">📄</span><span class="google-domain">Another result</span></div>
        <div class="google-title">Related Search Result</div>
      </div>
      <div class="google-result-item google-result-dim">
        <div class="google-breadcrumb"><span class="google-favicon">📄</span><span class="google-domain">More results</span></div>
        <div class="google-title">Additional Result Link</div>
      </div>
    </div>
  </div>`;
}

function renderFacebookContext(title, desc, image, domain, site, dominantColor) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame facebook-context">
    <div class="fb-post-header">
      <div class="fb-avatar"></div>
      <div class="fb-post-meta">
        <span class="fb-author-name">Jane Smith</span>
        <span class="fb-post-time">2h · 🌍</span>
      </div>
      <span class="fb-menu">•••</span>
    </div>
    <div class="fb-post-content">Check out this interesting article!</div>
    <div class="fb-link-preview">
      <div class="fb-context-domain">${escHtml((site || domain).toUpperCase())}</div>
      <div class="fb-context-title">${escHtml(trunc(title, 60))}</div>
      <div class="fb-context-desc">${escHtml(trunc(desc, 100))}</div>
      ${image ? `<div class="fb-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="fb-context-placeholder"></div>'}
    </div>
    <div class="fb-post-stats">👍 24 · 💬 8 · 🔗 5</div>
  </div>`;
}

function renderTwitterContext(title, desc, image, domain, theme, dominantColor) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const isDark = theme === 'dark';
  return `<div class="context-frame twitter-context ${isDark ? 'twitter-dark' : 'twitter-light'}">
    <div class="tw-post-header">
      <div class="tw-avatar"></div>
      <div class="tw-post-meta">
        <span class="tw-author-name">Alex Johnson</span>
        <span class="tw-author-handle">@alexj</span>
        <span class="tw-post-time">· 2h</span>
      </div>
      <span class="tw-verified">✓</span>
    </div>
    <div class="tw-post-content">You have to see this! 🔗</div>
    <div class="tw-link-card">
      ${image ? `<div class="tw-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="tw-context-placeholder"></div>'}
      <div class="tw-context-meta">
        <div class="tw-context-title">${escHtml(trunc(title, 60))}</div>
        <div class="tw-context-domain">${escHtml(domain)}</div>
      </div>
    </div>
    <div class="tw-post-actions">💬 12 · 🔁 34 · ❤️ 128</div>
  </div>`;
}

function renderLinkedInContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame linkedin-context">
    <div class="li-post-header">
      <div class="li-avatar"></div>
      <div class="li-post-meta">
        <span class="li-author-name">Sarah Chen</span>
        <span class="li-post-headline">Product Manager at Tech Corp</span>
        <span class="li-post-time">2h · 🌐</span>
      </div>
    </div>
    <div class="li-post-content">Great article on industry trends!</div>
    <div class="li-link-preview">
      ${image ? `<div class="li-context-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="li-context-placeholder"></div>'}
      <div class="li-context-meta">
        <div class="li-context-title">${escHtml(trunc(title, 80))}</div>
        <div class="li-context-domain">${escHtml(domain)}</div>
      </div>
    </div>
    <div class="li-post-stats">👍 45 · 💬 12 · 🔁 8</div>
  </div>`;
}

function renderRedditContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame reddit-context">
    <div class="rd-post-header">
      <div class="rd-upvote">▲</div>
      <div class="rd-post-main">
        <span class="rd-subreddit">r/interesting</span>
        <span class="rd-post-time">Posted by u/reader · 3h ago</span>
      </div>
    </div>
    <div class="rd-post-title">${escHtml(trunc(title, 100))}</div>
    <div class="rd-link-preview">
      <div class="rd-context-domain">(self.${escHtml(domain.split('.')[0])})</div>
      ${image ? `<div class="rd-context-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="rd-context-placeholder"></div>'}
      <div class="rd-context-desc">${escHtml(trunc(desc, 150))}</div>
    </div>
    <div class="rd-post-actions">💬 23 comments · 🔗 share · save</div>
  </div>`;
}

function renderSlackContext(title, desc, image, domain, site, theme) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const isDark = theme === 'dark';
  return `<div class="context-frame slack-context ${isDark ? 'slack-dark' : 'slack-light'}">
    <div class="slack-sidebar">
      <div class="slack-workspace">Acme Co</div>
      <div class="slack-channel"># general</div>
      <div class="slack-channel"># random</div>
    </div>
    <div class="slack-main">
      <div class="slack-channel-header"># general</div>
      <div class="slack-messages">
        <div class="slack-message slack-message-dim">
          <div class="slack-msg-avatar"></div>
          <div class="slack-msg-content">
            <span class="slack-msg-author">Mike</span>
            <span class="slack-msg-time">10:30 AM</span>
            <p>Has anyone seen this?</p>
          </div>
        </div>
        <div class="slack-message">
          <div class="slack-msg-avatar"></div>
          <div class="slack-msg-content">
            <span class="slack-msg-author">You</span>
            <span class="slack-msg-time">10:32 AM</span>
            <div class="slack-link-preview">
              <div class="slack-site">${escHtml(site || domain)}</div>
              <div class="slack-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="slack-desc">${escHtml(trunc(desc, 150))}</div>` : ''}
              ${image ? `<div class="slack-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="slack-placeholder"></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderDiscordContext(title, desc, image, domain, site, theme) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const isDark = theme === 'dark';
  return `<div class="context-frame discord-context ${isDark ? 'discord-dark' : 'discord-light'}">
    <div class="discord-sidebar">
      <div class="discord-server">Gaming Hub</div>
      <div class="discord-channel"># general</div>
      <div class="discord-channel"># off-topic</div>
    </div>
    <div class="discord-main">
      <div class="discord-channel-header"># general</div>
      <div class="discord-messages">
        <div class="discord-message discord-message-dim">
          <div class="discord-msg-avatar"></div>
          <div class="discord-msg-content">
            <span class="discord-msg-author">GameMaster</span>
            <span class="discord-msg-time">Today at 10:30 AM</span>
            <p>Check this out everyone!</p>
          </div>
        </div>
        <div class="discord-message">
          <div class="discord-msg-avatar"></div>
          <div class="discord-msg-content">
            <span class="discord-msg-author">You</span>
            <span class="discord-msg-time">Today at 10:31 AM</span>
            <div class="discord-link-preview" style="border-left-color:${escHtml(site || '#5865f2')}">
              ${site ? `<div class="discord-site">${escHtml(site)}</div>` : ''}
              <div class="discord-title">${escHtml(trunc(title, 256))}</div>
              ${desc ? `<div class="discord-desc">${escHtml(trunc(desc, 300))}</div>` : ''}
              ${image ? `<div class="discord-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="discord-placeholder"></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderWhatsAppContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame whatsapp-context">
    <div class="wa-chat-header">
      <span class="wa-back">←</span>
      <div class="wa-contact">Tech Group</div>
      <span class="wa-menu">⋮</span>
    </div>
    <div class="wa-messages">
      <div class="wa-message wa-message-incoming">
        <div class="wa-msg-bubble">
          <p>Have you seen this link?</p>
          <span class="wa-msg-time">10:30 AM</span>
        </div>
      </div>
      <div class="wa-message wa-message-outgoing">
        <div class="wa-msg-bubble wa-msg-with-link">
          <div class="wa-link-preview">
            <div class="wa-link-favicon">🌐</div>
            <div class="wa-link-meta">
              <div class="wa-domain">${escHtml(domain)}</div>
              <div class="wa-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="wa-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
            </div>
            ${image ? `<img src="${escHtml(image)}" class="wa-link-thumb img-loading" alt="" onerror="this.style.display='none'" loading="lazy" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : '<div class="wa-link-thumb-placeholder"></div>'}
          </div>
          <span class="wa-msg-time">10:31 AM ✓✓</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderiMessageContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame imessage-context">
    <div class="im-chat-header">
      <span class="im-back">‹ Groups</span>
      <span class="im-contact-name">Sarah</span>
      <span class="im-video">📹</span>
    </div>
    <div class="im-messages">
      <div class="im-message im-message-incoming">
        <div class="im-bubble">
          <p>Look at this article!</p>
          <span class="im-time">10:30 AM</span>
        </div>
      </div>
      <div class="im-message im-message-outgoing">
        <div class="im-bubble im-bubble-with-link">
          <div class="im-link-preview">
            ${image ? `<div class="im-link-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="im-link-placeholder"></div>'}
            <div class="im-link-meta">
              <div class="im-title">${escHtml(trunc(title, 80))}</div>
              <div class="im-domain">${escHtml(domain)}</div>
            </div>
          </div>
          <span class="im-time">10:31 AM</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderTelegramContext(title, desc, image, domain, theme) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const isDark = theme === 'dark';
  return `<div class="context-frame telegram-context ${isDark ? 'telegram-dark' : 'telegram-light'}">
    <div class="tg-chat-header">
      <span class="tg-back">←</span>
      <div class="tg-contact">News Channel</div>
      <span class="tg-menu">⋮</span>
    </div>
    <div class="tg-messages">
      <div class="tg-message tg-message-incoming">
        <div class="tg-msg-avatar">N</div>
        <div class="tg-bubble">
          <p>Breaking news:</p>
          <div class="tg-link-preview">
            ${image ? `<div class="tg-link-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="tg-link-placeholder"></div>'}
            <div class="tg-link-meta">
              <div class="tg-title">${escHtml(trunc(title, 200))}</div>
              ${desc ? `<div class="tg-desc">${escHtml(trunc(desc, 170))}</div>` : ''}
              <div class="tg-domain">${escHtml(domain)}</div>
            </div>
          </div>
          <span class="tg-time">10:30</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderSignalContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame signal-context">
    <div class="signal-chat-header">
      <span class="signal-back">←</span>
      <div class="signal-contact">Family Group</div>
      <span class="signal-video">📹</span>
    </div>
    <div class="signal-messages">
      <div class="signal-message signal-message-outgoing">
        <div class="signal-bubble">
          <div class="signal-link-preview">
            ${image ? `<img src="${escHtml(image)}" class="signal-link-thumb img-loading" alt="" onerror="this.style.display='none'" loading="lazy" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : '<div class="signal-link-thumb-placeholder"></div>'}
            <div class="signal-link-meta">
              <div class="signal-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="signal-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
              <div class="signal-domain">${escHtml(domain)}</div>
            </div>
          </div>
          <span class="signal-time">10:31 AM ✓✓</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderTeamsContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame teams-context">
    <div class="teams-sidebar">
      <div class="teams-teams">Teams</div>
      <div class="teams-channel">General Channel</div>
    </div>
    <div class="teams-main">
      <div class="teams-channel-header">General</div>
      <div class="teams-messages">
        <div class="teams-message teams-message-dim">
          <div class="teams-msg-avatar">JD</div>
          <div class="teams-msg-content">
            <span class="teams-msg-author">John Doe</span>
            <span class="teams-msg-time">10:30 AM</span>
            <p>Sharing this link:</p>
          </div>
        </div>
        <div class="teams-message">
          <div class="teams-msg-avatar">ME</div>
          <div class="teams-msg-content">
            <span class="teams-msg-author">You</span>
            <span class="teams-msg-time">10:31 AM</span>
            <div class="teams-link-preview">
              ${image ? `<div class="teams-link-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="teams-link-placeholder"></div>'}
              <div class="teams-link-meta">
                <div class="teams-title">${escHtml(trunc(title, 80))}</div>
                ${desc ? `<div class="teams-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
                <div class="teams-domain">${escHtml(domain)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderGoogleChatContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame gchat-context">
    <div class="gchat-sidebar">
      <div class="gchat-room">Project Room</div>
      <div class="gchat-dm">Direct Messages</div>
    </div>
    <div class="gchat-main">
      <div class="gchat-header">Project Room</div>
      <div class="gchat-messages">
        <div class="gchat-message gchat-message-dim">
          <div class="gchat-msg-avatar">A</div>
          <div class="gchat-msg-content">
            <span class="gchat-msg-author">Alice</span>
            <p>Found this resource</p>
          </div>
        </div>
        <div class="gchat-message">
          <div class="gchat-msg-avatar">Y</div>
          <div class="gchat-msg-content">
            <span class="gchat-msg-author">You</span>
            <div class="gchat-link-preview">
              ${image ? `<div class="gchat-link-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="gchat-link-placeholder"></div>'}
              <div class="gchat-link-meta">
                <div class="gchat-title">${escHtml(trunc(title, 80))}</div>
                ${desc ? `<div class="gchat-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
                <div class="gchat-domain">${escHtml(domain)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderMastodonContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame mastodon-context">
    <div class="mdn-post-header">
      <div class="mdn-avatar"></div>
      <div class="mdn-post-meta">
        <span class="mdn-author-name">@developer@mastodon.social</span>
        <span class="mdn-post-time">2h ago</span>
      </div>
    </div>
    <div class="mdn-post-content">Sharing this interesting post!</div>
    <div class="mdn-link-preview">
      ${image ? `<div class="mdn-link-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="mdn-link-placeholder"></div>'}
      <div class="mdn-link-meta">
        <div class="mdn-title">${escHtml(trunc(title, 80))}</div>
        ${desc ? `<div class="mdn-desc">${escHtml(trunc(desc, 200))}</div>` : ''}
        <div class="mdn-domain">${escHtml(domain)}</div>
      </div>
    </div>
    <div class="mdn-post-actions">💬 5 · 🔁 12 · ⭐ 34</div>
  </div>`;
}

function renderBlueskyContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame bluesky-context">
    <div class="bsky-post-header">
      <div class="bsky-avatar"></div>
      <div class="bsky-post-meta">
        <span class="bsky-author-name">@user.bsky.social</span>
        <span class="bsky-post-time">· 2h</span>
      </div>
    </div>
    <div class="bsky-post-content">Great read! 📖</div>
    <div class="bsky-link-preview">
      ${image ? `<div class="bsky-link-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="bsky-link-placeholder"></div>'}
      <div class="bsky-link-meta">
        <div class="bsky-title">${escHtml(trunc(title, 160))}</div>
        ${desc ? `<div class="bsky-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
        <div class="bsky-domain">${escHtml(domain)}</div>
      </div>
    </div>
    <div class="bsky-post-stats">💬 3 · 🔁 8 · ❤️ 24</div>
  </div>`;
}

function renderThreadsContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame threads-context">
    <div class="th-post-header">
      <div class="th-avatar"></div>
      <div class="th-post-meta">
        <span class="th-author-name">@creator</span>
        <span class="th-post-time">2h</span>
      </div>
    </div>
    <div class="th-post-content">Check this out!</div>
    <div class="th-link-preview">
      <div class="th-context-domain">${escHtml(domain.toUpperCase())}</div>
      <div class="th-context-title">${escHtml(trunc(title, 60))}</div>
      ${desc ? `<div class="th-context-desc">${escHtml(trunc(desc, 100))}</div>` : ''}
      ${image ? `<div class="th-context-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="th-context-placeholder"></div>'}
    </div>
    <div class="th-post-actions">💬 12 · ❤️ 89 · 🔗 5</div>
  </div>`;
}

function renderTumblrContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame tumblr-context">
    <div class="tumblr-post-header">
      <div class="tumblr-avatar">B</div>
      <div class="tumblr-post-meta">
        <span class="tumblr-blog">blog-name</span>
        <span class="tumblr-time">2 hours ago</span>
      </div>
    </div>
    <div class="tumblr-post-content">Reblogging this!</div>
    <div class="tumblr-link-preview">
      <div class="tumblr-card-inner">
        ${image ? `<div class="tumblr-thumb img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="tumblr-thumb-placeholder"></div>'}
        <div class="tumblr-meta">
          <div class="tumblr-title">${escHtml(trunc(title, 60))}</div>
          ${desc ? `<div class="tumblr-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
          <div class="tumblr-domain">${escHtml(domain)}</div>
        </div>
      </div>
    </div>
    <div class="tumblr-post-actions">💬 5 · 🔁 23</div>
  </div>`;
}

function renderPinterestContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame pinterest-context">
    <div class="pin-grid">
      <div class="pin-item pin-item-dim"></div>
      <div class="pin-item pin-item-dim"></div>
    </div>
    <div class="pin-overlay">
      <div class="pin-card">
        ${image ? `<div class="pin-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="pin-image-placeholder"></div>'}
        <div class="pin-meta">
          <div class="pin-title">${escHtml(trunc(title, 60))}</div>
          ${desc ? `<div class="pin-desc">${escHtml(trunc(desc, 100))}</div>` : ''}
          <div class="pin-domain">${escHtml(domain)}</div>
        </div>
        <div class="pin-actions">💾 · 🔗</div>
      </div>
    </div>
  </div>`;
}

function renderNotionContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame notion-context">
    <div class="notion-sidebar">
      <div class="notion-workspace">Workspace</div>
      <div class="notion-page">📄 Documentation</div>
      <div class="notion-page">📋 Tasks</div>
    </div>
    <div class="notion-main">
      <div class="notion-breadcrumbs">Workspace › Documentation</div>
      <div class="notion-content">
        <div class="notion-block">Related resources:</div>
        <div class="notion-embed">
          ${image ? `<div class="notion-embed-thumb img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="notion-embed-thumb-placeholder"></div>'}
          <div class="notion-embed-meta">
            <div class="notion-title">${escHtml(trunc(title, 80))}</div>
            ${desc ? `<div class="notion-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
            <div class="notion-domain">${escHtml(domain)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderJiraContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame jira-context">
    <div class="jira-sidebar">
      <div class="jira-project">PROJ</div>
      <div class="jira-link">📋 Backlog</div>
      <div class="jira-link">📊 Active Sprint</div>
    </div>
    <div class="jira-main">
      <div class="jira-issue-header">
        <span class="jira-issue-key">PROJ-123</span>
        <span class="jira-issue-type">📋 Task</span>
      </div>
      <div class="jira-content">
        <div class="jira-description">Related link:</div>
        <div class="jira-link-card">
          ${image ? `<div class="jira-card-thumb img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="jira-card-thumb-placeholder"></div>'}
          <div class="jira-card-meta">
            <div class="jira-title">${escHtml(trunc(title, 80))}</div>
            ${desc ? `<div class="jira-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
            <div class="jira-domain">${escHtml(domain)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderGitHubContext(title, desc, image, domain, theme = 'dark') {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const isDark = theme === 'dark';
  return `<div class="context-frame github-context ${isDark ? 'gh-dark' : 'gh-light'}">
    <div class="gh-header">
      <div class="gh-repo">owner/repository</div>
      <div class="gh-tabs">Code · Issues · Pull requests</div>
    </div>
    <div class="gh-content">
      <div class="gh-issue">
        <div class="gh-issue-header">💬 Discussion</div>
        <div class="gh-issue-body">
          <div class="gh-comment">Check out this resource:</div>
          <div class="gh-link-preview">
            ${image ? `<div class="gh-preview-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="gh-preview-placeholder"></div>'}
            <div class="gh-preview-meta">
              <div class="gh-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="gh-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
              <div class="gh-domain">${escHtml(domain)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderTrelloContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame trello-context">
    <div class="trello-board">
      <div class="trello-list trello-list-dim">
        <div class="trello-list-header">To Do</div>
        <div class="trello-card-placeholder"></div>
      </div>
      <div class="trello-list trello-list-active">
        <div class="trello-list-header">In Progress</div>
        <div class="trello-card">
          ${image ? `<div class="trello-card-thumb img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="trello-card-thumb-placeholder"></div>'}
          <div class="trello-card-meta">
            <div class="trello-title">${escHtml(trunc(title, 80))}</div>
            <div class="trello-domain">${escHtml(domain)}</div>
          </div>
        </div>
        <div class="trello-card-placeholder"></div>
      </div>
      <div class="trello-list trello-list-dim">
        <div class="trello-list-header">Done</div>
      </div>
    </div>
  </div>`;
}

function renderFigmaContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame figma-context">
    <div class="figma-sidebar">
      <div class="figma-file">Design File</div>
      <div class="figma-page">Page 1</div>
    </div>
    <div class="figma-main">
      <div class="figma-canvas">
        <div class="figma-frame figma-frame-dim"></div>
        <div class="figma-frame figma-frame-active">
          <div class="figma-link-card">
            ${image ? `<div class="figma-card-thumb img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="figma-card-thumb-placeholder"></div>'}
            <div class="figma-card-meta">
              <div class="figma-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="figma-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
              <div class="figma-domain">${escHtml(domain)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderMediumContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame medium-context">
    <div class="medium-sidebar">
      <div class="medium-home">Home</div>
      <div class="medium-featured">Featured</div>
    </div>
    <div class="medium-main">
      <div class="medium-feed">
        <div class="medium-article medium-article-dim">
          <div class="medium-clap">👏</div>
          <div class="medium-title-dim">Another Story</div>
        </div>
        <div class="medium-article medium-article-featured">
          <div class="medium-author">By Author</div>
          <div class="medium-article-title">${escHtml(trunc(title, 80))}</div>
          ${desc ? `<div class="medium-article-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
          ${image ? `<div class="medium-article-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="medium-article-placeholder"></div>'}
          <div class="medium-article-meta">${escHtml(domain)} · 5 min read</div>
          <div class="medium-actions">👏 234 · 💬 12</div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderSubstackContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame substack-context">
    <div class="substack-header">
      <div class="substack-logo">S</div>
      <div class="substack-publication">The Newsletter</div>
    </div>
    <div class="substack-content">
      <div class="substack-post substack-post-dim">
        <div class="substack-post-title-dim">Previous Post</div>
      </div>
      <div class="substack-post substack-post-featured">
        <div class="substack-post-meta">March 15 · By Author</div>
        <div class="substack-post-title">${escHtml(trunc(title, 80))}</div>
        ${desc ? `<div class="substack-post-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
        ${image ? `<div class="substack-post-image img-loading-container"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" /></div>` : '<div class="substack-post-placeholder"></div>'}
        <div class="substack-post-actions">❤️ 456 · 🔁 89</div>
      </div>
    </div>
  </div>`;
}

function renderEmailContext(title, desc, image, domain, type) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const appName = type === 'gmail' ? 'Gmail' : 'Outlook';
  return `<div class="context-frame email-context email-${type}">
    <div class="email-sidebar">
      <div class="email-folder">📥 Inbox</div>
      <div class="email-folder">📤 Sent</div>
      <div class="email-folder">📝 Drafts</div>
    </div>
    <div class="email-main">
      <div class="email-header">${appName} - Inbox</div>
      <div class="email-list">
        <div class="email-row email-row-dim">
          <div class="email-sender">Other Sender</div>
          <div class="email-subject-dim">Another email</div>
        </div>
        <div class="email-row email-row-featured">
          <div class="email-sender">notifications@${escHtml(domain)}</div>
          <div class="email-subject">${escHtml(trunc(title, 80))}</div>
          <div class="email-preview">
            ${image ? `<img src="${escHtml(image)}" class="email-thumb img-loading" alt="" onerror="this.style.display='none'" loading="lazy" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : '<div class="email-thumb-placeholder"></div>'}
            ${desc ? `<div class="email-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderFeedlyContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame feedly-context">
    <div class="feedly-sidebar">
      <div class="feedly-all">All Articles</div>
      <div class="feedly-source">${escHtml(domain)}</div>
    </div>
    <div class="feedly-main">
      <div class="feedly-articles">
        <div class="feedly-article feedly-article-dim">
          <div class="feedly-title-dim">Previous Article</div>
        </div>
        <div class="feedly-article feedly-article-featured">
          <div class="feedly-article-header">
            ${image ? `<img src="${escHtml(image)}" class="feedly-thumb img-loading" alt="" onerror="this.style.display='none'" loading="lazy" onload="this.classList.add('loaded');this.classList.remove('img-loading')" />` : '<div class="feedly-thumb-placeholder"></div>'}
            <div class="feedly-meta">
              <div class="feedly-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="feedly-desc">${escHtml(trunc(desc, 120))}</div>` : ''}
              <div class="feedly-source">${escHtml(domain)} · just now</div>
            </div>
          </div>
          <div class="feedly-actions">📖 · 🔖 · 🔗</div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderGenericMessagingContext(title, desc, image, domain, pid) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const name = PLATFORM_NAMES[pid] || pid;
  return `<div class="context-frame generic-messaging-context">
    <div class="generic-chat-header">
      <span class="generic-back">←</span>
      <div class="generic-contact">${escHtml(name)} Chat</div>
      <span class="generic-menu">⋮</span>
    </div>
    <div class="generic-messages">
      <div class="generic-message generic-message-outgoing">
        <div class="generic-bubble">
          <div class="generic-link-preview">
            ${image ? `<div class="generic-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="generic-link-placeholder"></div>'}
            <div class="generic-link-meta">
              <div class="generic-title">${escHtml(trunc(title, 80))}</div>
              ${desc ? `<div class="generic-desc">${escHtml(trunc(desc, 160))}</div>` : ''}
              <div class="generic-domain">${escHtml(domain)}</div>
            </div>
          </div>
          <span class="generic-time">10:31 AM</span>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Crop Visualizer ──
function initCropper(data) {
  const ogImage = data.meta.og.image || data.meta.twitter.image;
  if (!ogImage) {
    cropperContainer.innerHTML = '<div class="cropper-empty">No image found in meta tags.</div>';
    cropperBadge.textContent = '';
    return;
  }

  cropperBadge.textContent = Object.keys(PLATFORM_CROPS).length;

  // Load image
  cropperImage.src = ogImage;
  cropperImage.onload = () => {
    cropperState.imageNaturalWidth = cropperImage.naturalWidth;
    cropperState.imageNaturalHeight = cropperImage.naturalHeight;
    cropperState.imageAspectRatio = cropperImage.naturalWidth / cropperImage.naturalHeight;

    renderImageInfo(data.imageProbe);
    renderCropperControls();
    updateCropperOverlay();
  };

  cropperImage.onerror = () => {
    cropperContainer.innerHTML = '<div class="cropper-empty">Failed to load image.</div>';
  };

  // Download button handler
  downloadOverlayBtn.onclick = exportCropperOverlay;
}

function renderImageInfo(imageProbe) {
  const w = cropperState.imageNaturalWidth;
  const h = cropperState.imageNaturalHeight;
  const ar = cropperState.imageAspectRatio.toFixed(2);
  const mp = ((w * h) / 1000000).toFixed(2);

  imageInfo.innerHTML = `
    <div class="info-row"><span class="info-label">Dimensions:</span> <span class="info-value">${w} × ${h} px</span></div>
    <div class="info-row"><span class="info-label">Aspect Ratio:</span> <span class="info-value">${ar}:1</span></div>
    <div class="info-row"><span class="info-label">Megapixels:</span> <span class="info-value">${mp} MP</span></div>
    ${imageProbe?.contentType ? `<div class="info-row"><span class="info-label">Type:</span> <span class="info-value">${imageProbe.contentType}</span></div>` : ''}
  `;
}

function renderCropperControls() {
  const groups = [
    { id: 'social', label: 'Social & Microblogging', platforms: ['google','facebook','twitter','linkedin','reddit','mastodon','bluesky','threads','tumblr','pinterest'] },
    { id: 'messaging', label: 'Messaging', platforms: ['slack','discord','whatsapp','imessage','telegram','signal','teams','googlechat','zoom','line','kakaotalk'] },
    { id: 'collaboration', label: 'Collaboration & Productivity', platforms: ['notion','jira','github','trello','figma'] },
    { id: 'content', label: 'Content Platforms', platforms: ['medium','substack'] },
    { id: 'email', label: 'Email', platforms: ['outlook','gmail'] },
    { id: 'rss', label: 'RSS / Readers', platforms: ['feedly'] },
  ];

  let html = '<div class="cropper-controls-inner">';
  html += '<div class="cropper-controls-header">';
  html += '<button class="action-btn" id="selectAllPlatforms">Select All</button>';
  html += '<button class="action-btn" id="clearAllPlatforms">Clear All</button>';
  html += '</div>';

  groups.forEach(group => {
    const color = CATEGORY_COLORS[group.id];
    html += `<div class="cropper-group" style="--group-color:${color}">`;
    html += `<div class="cropper-group-header">`;
    html += `<input type="checkbox" class="cropper-group-toggle" data-group="${group.id}" checked />`;
    html += `<span class="cropper-group-title">${escHtml(group.label)}</span>`;
    html += `<span class="cropper-group-count">${group.platforms.length}</span>`;
    html += '</div>';

    html += '<div class="cropper-group-platforms">';
    group.platforms.forEach(pid => {
      const crop = PLATFORM_CROPS[pid];
      if (!crop) return;
      const pct = calculateVisiblePercentage(crop);
      html += `<label class="cropper-platform-toggle">`;
      html += `<input type="checkbox" data-platform="${pid}" checked />`;
      html += `<span class="platform-checkbox" style="border-color:${color}"></span>`;
      html += `<span class="platform-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>`;
      html += `<span class="platform-pct">${pct}%</span>`;
      html += `</label>`;
    });
    html += '</div></div>';
  });

  html += '</div>';
  cropperControls.innerHTML = html;

  // Add event listeners
  document.querySelectorAll('.cropper-group-toggle').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const group = e.target.dataset.group;
      const platforms = groups.find(g => g.id === group)?.platforms || [];
      platforms.forEach(pid => {
        const cb = document.querySelector(`input[data-platform="${pid}"]`);
        if (cb) cb.checked = e.target.checked;
      });
      updateEnabledPlatforms();
      updateCropperOverlay();
    });
  });

  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
    cb.addEventListener('change', () => {
      updateEnabledPlatforms();
      updateCropperOverlay();
    });
  });

  document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
    document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
    document.querySelectorAll('.cropper-group-toggle').forEach(cb => cb.checked = true);
    updateEnabledPlatforms();
    updateCropperOverlay();
  });

  document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
    document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
    document.querySelectorAll('.cropper-group-toggle').forEach(cb => cb.checked = false);
    updateEnabledPlatforms();
    updateCropperOverlay();
  });
}

function updateEnabledPlatforms() {
  cropperState.enabledPlatforms.clear();
  document.querySelectorAll('.cropper-platform-toggle input:checked').forEach(cb => {
    cropperState.enabledPlatforms.add(cb.dataset.platform);
  });
}

function calculateVisiblePercentage(crop) {
  const imgW = cropperState.imageNaturalWidth;
  const imgH = cropperState.imageNaturalHeight;
  if (!imgW || !imgH) return 100;

  const imgAR = imgW / imgH;
  const cropAR = crop.aspect.max || crop.aspect.min;

  let visiblePct = 100;

  if (crop.cropMode === 'contain') {
    // Full image visible
    visiblePct = 100;
  } else if (crop.cropMode === 'cover') {
    // Calculate how much of the source image is visible
    if (imgAR > cropAR) {
      // Image is wider than crop - sides are cropped
      visiblePct = Math.round((cropAR / imgAR) * 100);
    } else if (imgAR < cropAR) {
      // Image is taller than crop - top/bottom are cropped
      visiblePct = Math.round((imgAR / cropAR) * 100);
    }
    visiblePct = Math.max(0, Math.min(100, visiblePct));
  }

  return visiblePct;
}

function updateCropperOverlay() {
  const imgW = cropperState.imageNaturalWidth;
  const imgH = cropperState.imageNaturalHeight;
  if (!imgW || !imgH) return;

  const svg = cropperOverlay;
  svg.setAttribute('viewBox', `0 0 ${imgW} ${imgH}`);
  svg.innerHTML = '';

  // Calculate all crop rectangles
  const crops = [];
  const enabledPids = Array.from(cropperState.enabledPlatforms);

  // Find intersection (safe zone)
  let safeZone = { x: 0, y: 0, w: imgW, h: imgH };

  enabledPids.forEach(pid => {
    const crop = PLATFORM_CROPS[pid];
    if (!crop) return;

    const rect = calculateCropRect(crop, imgW, imgH);
    if (rect) {
      crops.push({ pid, rect, color: CATEGORY_COLORS[crop.category] });

      // Intersect with safe zone
      safeZone.x = Math.max(safeZone.x, rect.x);
      safeZone.y = Math.max(safeZone.y, rect.y);
      safeZone.w = Math.min(safeZone.w, rect.x + rect.w) - safeZone.x;
      safeZone.h = Math.min(safeZone.h, rect.y + rect.h) - safeZone.y;
    }
  });

  // Draw all platform crops (semi-transparent)
  crops.forEach(({ rect, color }) => {
    const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectEl.setAttribute('x', rect.x);
    rectEl.setAttribute('y', rect.y);
    rectEl.setAttribute('width', rect.w);
    rectEl.setAttribute('height', rect.h);
    rectEl.setAttribute('fill', color);
    rectEl.setAttribute('fill-opacity', '0.15');
    rectEl.setAttribute('stroke', color);
    rectEl.setAttribute('stroke-width', '2');
    rectEl.setAttribute('stroke-dasharray', '8,4');
    svg.appendChild(rectEl);
  });

  // Draw safe zone (intersection of all)
  if (enabledPids.length > 0 && safeZone.w > 0 && safeZone.h > 0) {
    const safeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    safeRect.setAttribute('x', safeZone.x);
    safeRect.setAttribute('y', safeZone.y);
    safeRect.setAttribute('width', safeZone.w);
    safeRect.setAttribute('height', safeZone.h);
    safeRect.setAttribute('fill', 'none');
    safeRect.setAttribute('stroke', '#ffffff');
    safeRect.setAttribute('stroke-width', '4');
    safeRect.setAttribute('stroke-dasharray', '12,6');
    safeRect.classList.add('safe-zone-rect');
    svg.appendChild(safeRect);

    // Safe zone label
    const safePct = ((safeZone.w * safeZone.h) / (imgW * imgH) * 100).toFixed(1);
    safeZoneInfo.innerHTML = `
      <div class="info-row"><span class="info-label">Safe Zone:</span> <span class="info-value">${Math.round(safeZone.w)} × ${Math.round(safeZone.h)} px</span></div>
      <div class="info-row"><span class="info-label">Coverage:</span> <span class="info-value">${safePct}% of image</span></div>
      <div class="info-row"><span class="info-label">Platforms:</span> <span class="info-value">${enabledPids.length} selected</span></div>
    `;
  } else {
    safeZoneInfo.innerHTML = '<div class="info-row">Select platforms to see safe zone</div>';
  }

  // Update cropper badge count
  cropperBadge.textContent = enabledPids.length;
}

function calculateCropRect(crop, imgW, imgH) {
  const imgAR = imgW / imgH;
  const cropAR = crop.aspect.max || crop.aspect.min;

  if (crop.cropMode === 'contain') {
    // Full image is visible
    return { x: 0, y: 0, w: imgW, h: imgH };
  }

  if (crop.cropMode === 'cover') {
    let cropW, cropH;

    if (imgAR > cropAR) {
      // Image is wider - crop sides
      cropW = imgH * cropAR;
      cropH = imgH;
    } else {
      // Image is taller - crop top/bottom
      cropW = imgW;
      cropH = imgW / cropAR;
    }

    // Center the crop
    const x = (imgW - cropW) / 2;
    const y = (imgH - cropH) / 2;

    return { x, y, w: cropW, h: cropH };
  }

  return null;
}

async function exportCropperOverlay() {
  const canvas = document.createElement('canvas');
  canvas.width = cropperState.imageNaturalWidth;
  canvas.height = cropperState.imageNaturalHeight;
  const ctx = canvas.getContext('2d');

  // Draw image
  ctx.drawImage(cropperImage, 0, 0);

  // Draw overlays
  const enabledPids = Array.from(cropperState.enabledPlatforms);

  enabledPids.forEach(pid => {
    const crop = PLATFORM_CROPS[pid];
    if (!crop) return;

    const rect = calculateCropRect(crop, canvas.width, canvas.height);
    if (rect) {
      const color = CATEGORY_COLORS[crop.category];
      // Semi-transparent fill
      ctx.fillStyle = color + '40'; // hex + 25% alpha
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      // Stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 8]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  // Draw safe zone
  let safeZone = { x: 0, y: 0, w: canvas.width, h: canvas.height };
  enabledPids.forEach(pid => {
    const crop = PLATFORM_CROPS[pid];
    if (!crop) return;
    const rect = calculateCropRect(crop, canvas.width, canvas.height);
    if (rect) {
      safeZone.x = Math.max(safeZone.x, rect.x);
      safeZone.y = Math.max(safeZone.y, rect.y);
      safeZone.w = Math.min(safeZone.w, rect.x + rect.w) - safeZone.x;
      safeZone.h = Math.min(safeZone.h, rect.y + rect.h) - safeZone.y;
    }
  });

  if (enabledPids.length > 0 && safeZone.w > 0 && safeZone.h > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.setLineDash([24, 12]);
    ctx.strokeRect(safeZone.x, safeZone.y, safeZone.w, safeZone.h);
  }

  // Export
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vista-crop-overlay.png';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Overlay exported!', 2000);
  }, 'image/png');
}

// ── Diagnostics ──
function renderDiagnostics(diags) {
  if (!diags || diags.length === 0) {
    diagPanel.innerHTML = '<div class="diag-empty">&#10003; No issues detected. All checks passed.</div>';
    announce('No diagnostic issues found. All checks passed.');
    return;
  }

  const sorted = [...diags].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return (order[a.severity] || 9) - (order[b.severity] || 9);
  });

  diagPanel.innerHTML = sorted.map(d => {
    const icon = d.severity === 'error' ? '&#10005;' : d.severity === 'warning' ? '&#9888;' : '&#9432;';
    return `<div class="diag-item ${d.severity}">
      <span class="diag-icon">${icon}</span>
      <div class="diag-body">
        <div class="diag-msg">${escHtml(d.message)}</div>
        ${d.fix ? `<div class="diag-fix">${escHtml(d.fix)}</div>` : ''}
        ${d.platforms ? `<div class="diag-platforms">Affects: ${escHtml(d.platforms)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Announce diagnostic findings to screen readers
  const errorCount = sorted.filter(d => d.severity === 'error').length;
  const warningCount = sorted.filter(d => d.severity === 'warning').length;
  const infoCount = sorted.filter(d => d.severity === 'info').length;

  let message = 'Diagnostic findings: ';
  if (errorCount > 0) message += `${errorCount} error${errorCount > 1 ? 's' : ''}. `;
  if (warningCount > 0) message += `${warningCount} warning${warningCount > 1 ? 's' : ''}. `;
  if (infoCount > 0) message += `${infoCount} info${infoCount > 1 ? 's' : ''}. `;

  announce(message.trim());
}

// ── Raw Tags (Metadata Viewer) ──
// Store all metadata globally for export/filtering
let allMetadataRows = [];

function renderRawTags(meta) {
  allMetadataRows = [];

  // Helper to determine source
  const getSource = (value, field) => {
    if (!value && value !== 0) return 'default';
    // For og:image:url, check if it's from the parsed structure
    if (field.startsWith('og:image:') && meta.og._image) return 'parsed';
    return 'html';
  };

  // Core tags
  const coreFields = [
    { key: 'title', value: meta.title },
    { key: 'description', value: meta.description },
    { key: 'robots', value: meta.robots },
    { key: 'theme-color', value: meta.themeColor },
    { key: 'favicon', value: meta.favicon },
  ];
  coreFields.forEach(f => {
    allMetadataRows.push({
      tag: f.key,
      value: f.value,
      source: getSource(f.value, f.key),
      isImage: f.key === 'favicon',
    });
  });

  // Open Graph tags
  Object.keys(meta.og).forEach(k => {
    if (k.startsWith('_')) return;
    const value = meta.og[k];
    const isImage = k === 'image' || k.startsWith('image');
    allMetadataRows.push({
      tag: 'og:' + k,
      value: value,
      source: getSource(value, 'og:' + k),
      isImage: isImage,
    });

    // Handle hierarchical og:image:* sub-properties
    if (k === 'image' && meta.og._image) {
      // Add og:image:url if it's different from og:image
      if (meta.og._image.url && meta.og._image.url !== value) {
        allMetadataRows.push({
          tag: 'og:image:url',
          value: meta.og._image.url,
          source: 'parsed',
          isImage: true,
          parentTag: 'og:image',
        });
      }
      // Add og:image:secure_url
      if (meta.og._image.secure_url && meta.og._image.secure_url !== meta.og._image.url) {
        allMetadataRows.push({
          tag: 'og:image:secure_url',
          value: meta.og._image.secure_url,
          source: 'parsed',
          isImage: true,
          parentTag: 'og:image',
        });
      }
      // Add og:image:width
      if (meta.og._image.width) {
        allMetadataRows.push({
          tag: 'og:image:width',
          value: meta.og._image.width,
          source: 'parsed',
          isImage: false,
          parentTag: 'og:image',
        });
      }
      // Add og:image:height
      if (meta.og._image.height) {
        allMetadataRows.push({
          tag: 'og:image:height',
          value: meta.og._image.height,
          source: 'parsed',
          isImage: false,
          parentTag: 'og:image',
        });
      }
      // Add og:image:alt
      if (meta.og._image.alt) {
        allMetadataRows.push({
          tag: 'og:image:alt',
          value: meta.og._image.alt,
          source: 'parsed',
          isImage: false,
          parentTag: 'og:image',
        });
      }
      // Add og:image:type
      if (meta.og._image.type) {
        allMetadataRows.push({
          tag: 'og:image:type',
          value: meta.og._image.type,
          source: 'parsed',
          isImage: false,
          parentTag: 'og:image',
        });
      }
    }
  });

  // Twitter Card tags
  Object.keys(meta.twitter).forEach(k => {
    const value = meta.twitter[k];
    const isImage = k === 'image' || k.startsWith('image');
    allMetadataRows.push({
      tag: 'twitter:' + k,
      value: value,
      source: getSource(value, 'twitter:' + k),
      isImage: isImage,
    });
  });

  // Other meta tags
  if (meta.other) {
    Object.keys(meta.other).forEach(k => {
      const value = meta.other[k];
      allMetadataRows.push({
        tag: 'meta:' + k,
        value: value,
        source: 'html',
        isImage: false,
      });
    });
  }

  // JSON-LD (count as entries)
  if (meta.jsonLd && meta.jsonLd.length > 0) {
    meta.jsonLd.forEach((j, i) => {
      const type = j['@type'] || 'unknown';
      allMetadataRows.push({
        tag: `json-ld[${i}]:@type`,
        value: type,
        source: 'html',
        isImage: false,
      });
    });
  }

  renderMetadataTable();
}

function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  let html = `<div class="metadata-viewer">
    <div class="metadata-toolbar">
      <div class="metadata-filter">
        <input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
        <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
      </div>
      <div class="metadata-actions">
        <button class="action-btn" onclick="exportMetadataAsJson()">&#128190; Export JSON</button>
        <button class="action-btn" onclick="exportMetadataAsCsv()">&#128190; Export CSV</button>
      </div>
    </div>
    <div class="metadata-table-wrapper">
      <table class="metadata-table">
        <thead>
          <tr>
            <th class="col-tag">Tag Name</th>
            <th class="col-value">Value</th>
            <th class="col-source">Source</th>
            <th class="col-copy"></th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows.length > 0 ? filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('') : '<tr><td colspan="4" class="no-results">No tags match your filter</td></tr>'}
        </tbody>
      </table>
    </div>`;

  // Add JSON-LD section at bottom if present
  const hasJsonLd = allMetadataRows.some(r => r.tag.startsWith('json-ld'));
  if (hasJsonLd && !filter) {
    html += `<div class="raw-section">
      <h3>JSON-LD Structured Data</h3>
      ${currentData?.meta?.jsonLd?.map(j => `<pre class="jsonld-block">${escHtml(JSON.stringify(j, null, 2))}</pre>`).join('') || ''}
    </div>`;
  }

  html += '</div>';
  rawTagsPanel.innerHTML = html;

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}

function renderMetadataRow(row, idx) {
  const hasValue = row.value || row.value === 0;
  const valueDisplay = hasValue
    ? (row.isImage && row.value ? escHtml(row.value) + `<br><img class="tag-image-thumb" src="${escHtml(row.value)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : escHtml(String(row.value)))
    : '<span class="empty-value">—</span>';

  const sourceClass = row.source === 'html' ? 'source-html' : row.source === 'parsed' ? 'source-parsed' : 'source-default';
  const sourceLabel = row.source === 'html' ? 'HTML' : row.source === 'parsed' ? 'Parsed' : 'Default';
  const hierarchyIndicator = row.parentTag ? `<span class="hierarchy-indicator" title="Child of ${row.parentTag}">↳</span>` : '';

  return `<tr class="metadata-row ${hasValue ? '' : 'row-empty'}">
    <td class="col-tag">
      ${hierarchyIndicator}
      <span class="tag-name">${escHtml(row.tag)}</span>
    </td>
    <td class="col-value">${valueDisplay}</td>
    <td class="col-source"><span class="source-badge ${sourceClass}">${sourceLabel}</span></td>
    <td class="col-copy">
      ${hasValue ? `<button class="copy-btn" onclick="copyMetadataValue('${escHtml(String(row.value)).replace(/'/g, "\\'")}')" title="Copy value">&#128203;</button>` : ''}
    </td>
  </tr>`;
}

function copyMetadataValue(value) {
  copyText(value);
  showToast('Copied to clipboard', 1500);
}

function exportMetadataAsJson() {
  if (!allMetadataRows.length || !currentData) return;

  const exportData = {
    url: currentData.url,
    finalUrl: currentData.finalUrl,
    timestamp: new Date().toISOString(),
    metadata: allMetadataRows.map(r => ({
      tag: r.tag,
      value: r.value,
      source: r.source,
    })),
    rawMeta: currentData.meta,
  };

  downloadFile(JSON.stringify(exportData, null, 2), 'metadata.json', 'application/json');
  showToast('Metadata exported as JSON', 2000);
}

function exportMetadataAsCsv() {
  if (!allMetadataRows.length) return;

  const headers = ['Tag', 'Value', 'Source'];
  const rows = allMetadataRows.map(r => [
    escapeCsv(r.tag),
    escapeCsv(String(r.value ?? '')),
    r.source,
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  downloadFile(csv, 'metadata.csv', 'text/csv');
  showToast('Metadata exported as CSV', 2000);
}

// ── Redirects & Headers ──
function renderRedirects(chain, headers, headerAnalysis = null) {
  let html = '';

  // Add JSON export buttons
  html += `<div class="redirect-actions">
    ${chain && chain.length > 0 ? `<button class="action-btn" id="exportRedirectJson" onclick="exportRedirectChain()">&#128190; Export Chain as JSON</button>` : ''}
    <button class="action-btn" id="exportHeadersJson" onclick="exportHeadersAsJson()">&#128190; Export Headers as JSON</button>
  </div>`;

  if (chain && chain.length > 0) {
    html += `<h2 class="section-heading">Redirect Chain</h2><div class="redirect-chain">`;
    chain.forEach((hop, i) => {
      const isFinal = hop.isFinal;
      const sc = hop.statusCode || 0;
      let sCls = 's2xx';
      if (sc >= 300 && sc < 400) sCls = 's3xx';
      else if (sc >= 400) sCls = 's4xx';

      html += `<div class="redirect-hop" data-hop-index="${i}">
        <div class="hop-connector">
          <div class="hop-dot${isFinal ? ' final' : ''}"></div>
          ${i < chain.length - 1 ? '<div class="hop-line"></div>' : ''}
        </div>
        <div class="hop-info">
          <div class="hop-url"><span class="hop-status ${sCls}">${sc}</span>${escHtml(truncateUrl(hop.url))}</div>
          ${hop.warning ? `<div class="hop-warning">&#9888; ${escHtml(hop.warning)}</div>` : ''}
          ${hop.redirectsTo ? `<div class="hop-redirect">&#8594; ${escHtml(truncateUrl(hop.redirectsTo))}</div>` : ''}

          ${hop.meta ? renderHopMeta(hop.meta, hop.metaDiff) : ''}

          ${hop.metaError ? `<div class="hop-meta-error">Meta tags unavailable: ${escHtml(hop.metaError)}</div>` : ''}
        </div>
      </div>`;
    });
    html += '</div>';

    // Add meta tag diff legend
    html += `<div class="diff-legend">
      <span class="legend-item"><span class="legend-dot changed"></span> Changed</span>
      <span class="legend-item"><span class="legend-dot added"></span> Added</span>
      <span class="legend-item"><span class="legend-dot removed"></span> Removed</span>
      <span class="legend-item"><span class="legend-dot critical"></span> Critical (og:image, twitter:image)</span>
    </div>`;
  } else {
    html += `<p style="color:var(--text2);margin-bottom:24px">No redirects — direct response.</p>`;
  }

  // Header Analysis Section
  if (headerAnalysis) {
    html += renderHeaderAnalysis(headerAnalysis);
  }

  // Raw Headers Table
  if (headers && Object.keys(headers).length > 0) {
    html += `<h2 class="section-heading">All Response Headers</h2>
      <table class="headers-table">
        <thead>
          <tr><th>Header Name</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${Object.entries(headers).map(([k, v]) => `<tr><td class="header-name">${escHtml(k)}</td><td class="header-val">${escHtml(v)}</td></tr>`).join('')}
        </tbody>
      </table>`;
  }

  redirectPanel.innerHTML = html;
}

/**
 * Render header analysis with issues and recommendations.
 */
function renderHeaderAnalysis(analysis) {
  let html = '<div class="header-analysis-section">';

  // Image Headers Section
  if (analysis.imageHeaders) {
    html += renderImageHeaders(analysis.imageHeaders);
  }

  // Issues Section
  if (analysis.issues && analysis.issues.length > 0) {
    html += `<h2 class="section-heading">Header Issues</h2>`;
    html += '<div class="header-issues-list">';
    for (const issue of analysis.issues) {
      html += renderHeaderIssue(issue);
    }
    html += '</div>';
  }

  // Recommendations Section
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    html += `<h2 class="section-heading">Header Recommendations</h2>`;
    html += '<div class="header-recommendations-list">';
    for (const rec of analysis.recommendations) {
      html += renderHeaderRecommendation(rec);
    }
    html += '</div>';
  }

  // Key Headers Summary
  if (analysis.headers && Object.keys(analysis.headers).length > 0) {
    html += `<h2 class="section-heading">Key Headers</h2>
      <table class="headers-table">
        <thead>
          <tr><th>Header</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${Object.entries(analysis.headers).map(([k, v]) => `<tr><td class="header-name">${escHtml(k)}</td><td class="header-val">${escHtml(v)}</td></tr>`).join('')}
        </tbody>
      </table>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render image headers section.
 */
function renderImageHeaders(imageHeaders) {
  let html = '<div class="image-headers-section">';
  html += '<h2 class="section-heading">og:image Response Headers</h2>';

  const hasIssue = !imageHeaders.cors;

  html += '<div class="image-headers-grid">';
  html += `<div class="image-header-row">
    <span class="image-header-label">URL:</span>
    <span class="image-header-value"><a href="${escHtml(imageHeaders.url)}" target="_blank" rel="noopener">${escHtml(truncateUrl(imageHeaders.url))}</a></span>
  </div>`;
  html += `<div class="image-header-row">
    <span class="image-header-label">Status:</span>
    <span class="image-header-value">${imageHeaders.statusCode}</span>
  </div>`;
  html += `<div class="image-header-row">
    <span class="image-header-label">Content-Type:</span>
    <span class="image-header-value">${escHtml(imageHeaders.contentType || 'N/A')}</span>
  </div>`;
  html += `<div class="image-header-row">
    <span class="image-header-label">Content-Length:</span>
    <span class="image-header-value">${imageHeaders.contentLength ? formatBytes(imageHeaders.contentLength) : 'N/A'}</span>
  </div>`;
  html += `<div class="image-header-row">
    <span class="image-header-label">CORS:</span>
    <span class="image-header-value ${hasIssue ? 'header-issue' : ''}">${escHtml(imageHeaders.cors || '<span class="missing-header">Not set</span>')}</span>
  </div>`;
  html += '</div>';

  if (hasIssue) {
    html += `<div class="header-notice warning">
      <span class="notice-icon">&#9888;</span>
      <span>Missing CORS header on og:image. Some platforms (Facebook, LinkedIn) may fail to display your image.</span>
    </div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render a single header issue.
 */
function renderHeaderIssue(issue) {
  const severityClass = issue.severity || 'info';
  const icon = severityClass === 'error' ? '&#10006;' : severityClass === 'warning' ? '&#9888;' : '&#8505;';
  const severityLabel = severityClass === 'error' ? 'Error' : severityClass === 'warning' ? 'Warning' : 'Info';

  let html = `<div class="header-issue ${severityClass}">
    <div class="header-issue-header">
      <span class="header-issue-icon">${icon}</span>
      <span class="header-issue-title">${escHtml(issue.message)}</span>
      <span class="header-issue-severity">${severityLabel}</span>
    </div>`;

  if (issue.header) {
    html += `<div class="header-issue-detail">
      <span class="issue-detail-label">Header:</span>
      <code class="issue-detail-value">${escHtml(issue.header)}</code>
    </div>`;
  }

  if (issue.detail) {
    html += `<div class="header-issue-detail">
      <span class="issue-detail-label">Detail:</span>
      <span class="issue-detail-value">${escHtml(issue.detail)}</span>
    </div>`;
  }

  if (issue.affectedPlatforms) {
    html += `<div class="header-issue-detail">
      <span class="issue-detail-label">Affected:</span>
      <span class="issue-detail-value">${escHtml(Array.isArray(issue.affectedPlatforms) ? issue.affectedPlatforms.join(', ') : issue.affectedPlatforms)}</span>
    </div>`;
  }

  if (issue.recommendation) {
    html += `<div class="header-issue-fix">
      <span class="issue-fix-label">&#10003; Fix:</span>
      <span class="issue-fix-value">${escHtml(issue.recommendation)}</span>
    </div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render a single header recommendation.
 */
function renderHeaderRecommendation(rec) {
  let html = `<div class="header-recommendation">
    <div class="header-rec-header">
      <span class="header-rec-icon">&#128161;</span>
      <span class="header-rec-title">${escHtml(rec.message)}</span>
    </div>`;

  if (rec.detail) {
    html += `<div class="header-rec-detail">${escHtml(rec.detail)}</div>`;
  }

  if (rec.recommendation) {
    html += `<div class="header-rec-fix">
      <span class="rec-fix-label">Recommendation:</span>
      <span class="rec-fix-value">${escHtml(rec.recommendation)}</span>
    </div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Export headers as JSON.
 */
function exportHeadersAsJson() {
  if (!currentData) return;

  const exportData = {
    url: currentData.url,
    finalUrl: currentData.finalUrl,
    timestamp: new Date().toISOString(),
    responseHeaders: currentData.responseHeaders,
    headerAnalysis: currentData.headerAnalysis || null,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `headers-${new Date().getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Headers exported as JSON');
}

/**
 * Render meta tags for a single hop with diff highlighting.
 */
function renderHopMeta(meta, diff) {
  if (!meta) return '';

  const fields = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'ogTitle', label: 'OG Title' },
    { key: 'ogDescription', label: 'OG Description' },
    { key: 'ogImage', label: 'OG Image', isImage: true },
    { key: 'ogType', label: 'OG Type' },
    { key: 'ogUrl', label: 'OG URL' },
    { key: 'twitterCard', label: 'Twitter Card' },
    { key: 'twitterTitle', label: 'Twitter Title' },
    { key: 'twitterDescription', label: 'Twitter Description' },
    { key: 'twitterImage', label: 'Twitter Image', isImage: true },
  ];

  let hasContent = false;
  let metaHtml = '<div class="hop-meta">';

  for (const field of fields) {
    const value = meta[field.key];
    if (!value) continue;

    hasContent = true;
    const changeClass = getFieldChangeClass(diff, field.key);
    const isCritical = field.isImage;

    metaHtml += `<div class="hop-meta-row ${changeClass} ${isCritical ? 'critical' : ''}">
      <span class="hop-meta-label">${field.label}:</span>
      <span class="hop-meta-value">${isImageField(field.key) ? renderMetaImage(value) : escHtml(truncateValue(value))}</span>
      ${renderChangeIndicator(diff, field.key)}
    </div>`;
  }

  metaHtml += '</div>';
  return hasContent ? metaHtml : '';
}

/**
 * Get CSS class for a field based on diff status.
 */
function getFieldChangeClass(diff, field) {
  if (!diff) return '';

  const changed = diff.changed?.find(c => toCamelCase(c.field) === field);
  if (changed) return 'changed';

  const added = diff.added?.find(a => toCamelCase(a.field) === field);
  if (added) return 'added';

  const removed = diff.removed?.find(r => toCamelCase(r.field) === field);
  if (removed) return 'removed';

  return '';
}

/**
 * Render change indicator (arrow/icon) for a field.
 */
function renderChangeIndicator(diff, field) {
  if (!diff) return '';

  const changed = diff.changed?.find(c => toCamelCase(c.field) === field);
  if (changed) {
    return `<span class="change-indicator changed" title="Changed from: ${escHtml(truncateValue(changed.from))}">&#8694;</span>`;
  }

  const added = diff.added?.find(a => toCamelCase(a.field) === field);
  if (added) {
    return `<span class="change-indicator added" title="Added at this hop">+</span>`;
  }

  const removed = diff.removed?.find(r => toCamelCase(r.field) === field);
  if (removed) {
    return `<span class="change-indicator removed" title="Removed at this hop">&minus;</span>`;
  }

  return '';
}

/**
 * Check if a field is an image field.
 */
function isImageField(field) {
  return field === 'ogImage' || field === 'twitterImage';
}

/**
 * Render meta image with thumbnail.
 */
function renderMetaImage(url) {
  const truncated = truncateUrl(url);
  return `<span class="meta-image-link">${escHtml(truncated)}</span>`;
}

/**
 * Convert kebab-case to camelCase.
 */
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Truncate URL for display.
 */
function truncateUrl(url) {
  if (!url) return '';
  if (url.length <= 60) return url;
  return url.substring(0, 30) + '...' + url.substring(url.length - 25);
}

/**
 * Truncate value for display.
 */
function truncateValue(value) {
  if (!value) return '';
  if (value.length <= 100) return value;
  return value.substring(0, 100) + '...';
}

/**
 * Export redirect chain as JSON file.
 */
function exportRedirectChain() {
  const chain = window.currentRedirectChain;
  if (!chain) {
    showToast('No redirect chain data available');
    return;
  }

  const data = {
    exportedAt: new Date().toISOString(),
    chain: chain.map(hop => ({
      url: hop.url,
      statusCode: hop.statusCode,
      isFinal: hop.isFinal,
      redirectsTo: hop.redirectsTo || null,
      warning: hop.warning || null,
      meta: hop.meta || null,
      metaDiff: hop.metaDiff || null,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `redirect-chain-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Redirect chain exported as JSON');
}

// ── Auto-Fixes ──
function renderFixes(fixes) {
  if (!fixes || fixes.length === 0) {
    fixesPanel.innerHTML = '<p class="fixes-intro" style="color:var(--green)">&#10003; No fixes needed! Your meta tags look great.</p>';
    return;
  }

  // Calculate impact for each fix and sort by impact
  const fixesWithImpact = fixes.map(fix => {
    const impact = simulateFix(
      fix.code,
      currentData?.meta || {},
      currentData?.imageProbe || null,
      currentData?.scoring || { scores: {}, overall: { grade: 'F', score: 0 } }
    );
    const impactLevel = getImpactLevel(impact.platformsImproved.length);
    return { ...fix, impact, impactLevel };
  }).sort((a, b) => b.impact.platformsImproved.length - a.impact.platformsImproved.length);

  // Calculate total impact for "Fix all" button
  const totalImpact = simulateAllFixes(
    fixes,
    currentData?.meta || {},
    currentData?.imageProbe || null,
    currentData?.scoring || { scores: {}, overall: { grade: 'F', score: 0 } }
  );

  let html = `<p class="fixes-intro">Found ${fixes.length} suggested fix${fixes.length !== 1 ? 'es' : ''} to improve your social card performance.</p>`;

  // Add "Fix all" preview button if there are multiple fixes
  if (fixes.length > 1) {
    const totalImproved = totalImpact.platformsImproved.length;
    const fromGrade = totalImpact.fromOverallGrade;
    const toGrade = totalImpact.toOverallGrade;
    html += `<div class="fix-all-preview">
      <span class="fix-all-preview-text">Apply all ${fixes.length} fixes &rarr; <strong>${fromGrade} to ${toGrade}</strong> overall (${totalImproved} platforms improved)</span>
    </div>`;
  }

  html += '<div class="fixes-panel">';

  fixesWithImpact.forEach(fix => {
    if (!fix.tag) return;

    const improved = fix.impact.platformsImproved;
    const impactLevel = fix.impactLevel;

    // Build impact label
    let impactLabel = '';
    let impactClass = '';
    if (improved.length > 0) {
      const gradeChanges = {};
      improved.forEach(p => {
        const key = `${p.from}→${p.to}`;
        if (!gradeChanges[key]) gradeChanges[key] = [];
        gradeChanges[key].push(p.name);
      });

      const changeParts = [];
      for (const [change, platforms] of Object.entries(gradeChanges)) {
        if (platforms.length <= 3) {
          changeParts.push(`${change} on ${platforms.join(', ')}`);
        } else {
          changeParts.push(`${change} on ${platforms.length} platforms`);
        }
      }

      impactLabel = changeParts.join(', ');
      impactClass = impactLevel === 'high' ? 'impact-high' : impactLevel === 'medium' ? 'impact-medium' : 'impact-low';
    } else {
      impactLabel = 'No score change expected';
      impactClass = 'impact-low';
    }

    html += `<div class="fix-item">
      <div class="fix-msg">${escHtml(fix.message)}</div>
      ${improved.length > 0 ? `<div class="fix-impact ${impactClass}">&#8594; ${escHtml(impactLabel)}</div>` : ''}
      <div class="fix-code-wrap">
        <span class="fix-code">${escHtml(fix.tag)}</span>
        <button class="fix-copy-btn" onclick="copyText(${JSON.stringify(fix.tag)})">Copy</button>
      </div>
      ${fix.platforms ? `<div class="fix-platforms">Platforms: ${escHtml(fix.platforms)}</div>` : ''}
    </div>`;
  });

  html += '</div>';
  fixesPanel.innerHTML = html;
}

// ── Tab switching ──
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    // ARIA tab pattern: aria-selected + roving tabindex
    btn.setAttribute('aria-selected', String(isActive));
    btn.tabIndex = isActive ? 0 : -1;
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    const id = pane.id.replace('tab', '').toLowerCase();
    pane.classList.toggle('hidden', id !== tabId);
  });
}

// ── Recent inspections ──
const RECENT_KEY = 'vista_recents';
const MAX_RECENTS = 10;

function saveToRecents(data) {
  const url = data.url;
  if (!url || url === 'https://example.com') return;
  let recents = loadRecentsList();
  // Remove existing
  recents = recents.filter(r => r.url !== url);
  // Add to front
  recents.unshift({ url, title: data.meta?.og?.title || data.meta?.title || url, ts: Date.now() });
  recents = recents.slice(0, MAX_RECENTS);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
  renderRecentBar(recents);
}

function loadRecentsList() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch (_) { return []; }
}

function loadRecents() {
  const recents = loadRecentsList();
  if (recents.length > 0) renderRecentBar(recents);
}

function renderRecentBar(recents) {
  if (!recents.length) return;
  recentBar.innerHTML = `<span class="recent-label">Recent:</span>` +
    recents.map(r => `<button class="recent-chip" onclick="inspectUrl(${JSON.stringify(r.url)})">${escHtml(getDomain(r.url))}</button>`).join('');
  recentBar.classList.add('visible');
}

// ── Share ──
function shareResults() {
  if (!currentData) return;
  const url = window.location.href;
  copyText(url);
  showToast('Share link copied!', 2000);
}

/**
 * Generate QR code from URL
 * @param {string} url - The URL to encode in the QR code
 * @param {Object} options - Optional configuration
 * @param {number} options.width - QR code width in pixels (default: 200)
 * @param {number} options.height - QR code height in pixels (default: 200)
 * @param {string} options.colorDark - Dark color hex (default: '#000000')
 * @param {string} options.colorLight - Light color hex (default: '#ffffff')
 * @param {string} options.correctLevel - Error correction level 'L|M|Q|H' (default: 'H')
 * @returns {Promise<string|null>} Data URL of the generated QR code, or null on error
 */
function generateQRCode(url, options = {}) {
  return new Promise((resolve) => {
    // Validate URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('generateQRCode: Invalid or empty URL provided');
      resolve(null);
      return;
    }

    // Trim whitespace
    url = url.trim();

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      console.warn('generateQRCode: Invalid URL format:', url, e);
      resolve(null);
      return;
    }

    // Set default options
    const opts = {
      width: options.width || 200,
      height: options.height || 200,
      colorDark: options.colorDark || '#000000',
      colorLight: options.colorLight || '#ffffff',
      correctLevel: options.correctLevel || QRCode.CorrectLevel.H
    };

    // Create a temporary container for QR code generation
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    try {
      // Generate QR code using qrcodejs library
      const qrCode = new QRCode(tempContainer, {
        text: url,
        width: opts.width,
        height: opts.height,
        colorDark: opts.colorDark,
        colorLight: opts.colorLight,
        correctLevel: opts.correctLevel
      });

      // Wait for the QR code to be generated (qrcodejs uses img with data URL)
      // Use a small timeout to ensure generation is complete
      setTimeout(() => {
        const img = tempContainer.querySelector('img');
        if (img && img.src) {
          const dataUrl = img.src;
          // Clean up temporary container
          document.body.removeChild(tempContainer);
          resolve(dataUrl);
        } else {
          // Fallback: check for canvas element
          const canvas = tempContainer.querySelector('canvas');
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            document.body.removeChild(tempContainer);
            resolve(dataUrl);
          } else {
            console.warn('generateQRCode: Failed to generate QR code for:', url);
            document.body.removeChild(tempContainer);
            resolve(null);
          }
        }
      }, 100);
    } catch (e) {
      console.error('generateQRCode: Error generating QR code:', e);
      document.body.removeChild(tempContainer);
      resolve(null);
    }
  });
}

// ── Badge Modal ──
let _badgeModalLastFocus = null;

function _badgeModalFocusTrap(e) {
  if (e.key === 'Escape') {
    closeBadgeModal();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusable = [...badgeModal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

function openBadgeModal() {
  if (!currentData) return;

  updateBadgePreview();
  _badgeModalLastFocus = document.activeElement;
  badgeModal.classList.remove('hidden');
  // Focus the first focusable element in the modal
  const firstFocusable = badgeModal.querySelector(
    'button:not([disabled]), input:not([disabled]), select:not([disabled])'
  );
  firstFocusable?.focus();
  document.addEventListener('keydown', _badgeModalFocusTrap);
}

function closeBadgeModal() {
  badgeModal.classList.add('hidden');
  document.removeEventListener('keydown', _badgeModalFocusTrap);
  // Restore focus to the element that opened the modal
  _badgeModalLastFocus?.focus();
  _badgeModalLastFocus = null;
}

function updateBadgePreview() {
  if (!currentData) return;

  const score = currentData.scoring.overall.score;
  const platforms = Object.keys(currentData.scoring.scores).length;
  const style = badgeStyleSelect?.value || 'flat';

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const badgeUrl = `${baseUrl}/api/badge?score=${score}&platforms=${platforms}&style=${style}`;

  // Update preview
  badgePreview.innerHTML = `<img src="${badgeUrl}" alt="Platform Score Badge" />`;

  // Update embed code
  const embedCode = `<a href="${baseUrl}/api/badge?score=${score}&platforms=${platforms}&style=${style}">
  <img src="${badgeUrl}" alt="Platform Score Badge" />
</a>`;
  badgeEmbedCode.value = embedCode;

  // Update direct URL
  badgeDirectUrl.value = badgeUrl;
}

function copyBadgeEmbedCode() {
  if (!badgeEmbedCode.value) return;
  copyText(badgeEmbedCode.value);
  showToast('Embed code copied!', 2000);
}

function copyBadgeUrl() {
  if (!badgeDirectUrl.value) return;
  copyText(badgeDirectUrl.value);
  showToast('Badge URL copied!', 2000);
}

// ── QR Code Modal ──
let _qrModalLastFocus = null;

function _qrModalFocusTrap(e) {
  if (e.key === 'Escape') {
    closeQrModal();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusable = [...qrModal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

function openQrModal() {
  if (!currentData) return;

  // Generate QR code for the current share URL
  const shareUrl = window.location.href;

  // Clear any existing QR code
  qrCode.innerHTML = '';

  // Generate new QR code using qrcodejs library
  // Respect prefers-reduced-motion by disabling animations
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  new QRCode(qrCode, {
    text: shareUrl,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Update the share URL input
  qrShareUrl.value = shareUrl;

  // Show modal
  _qrModalLastFocus = document.activeElement;
  qrModal.classList.remove('hidden');

  // Focus the first focusable element in the modal
  const firstFocusable = qrModal.querySelector(
    'button:not([disabled]), input:not([disabled]), select:not([disabled])'
  );
  firstFocusable?.focus();
  document.addEventListener('keydown', _qrModalFocusTrap);
}

function closeQrModal() {
  qrModal.classList.add('hidden');
  document.removeEventListener('keydown', _qrModalFocusTrap);
  // Restore focus to the element that opened the modal
  _qrModalLastFocus?.focus();
  _qrModalLastFocus = null;
}

// ── Reset ──
function resetToHero() {
  resultsSection.classList.add('hidden');
  hero.classList.remove('compact');
  document.body.classList.remove('has-results');
  currentData = null;
  history.pushState({}, '', '/');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Utilities ──
function showLoading() {
  loadingOverlay.classList.remove('hidden');
  announce('Loading. Fetching and analyzing data.');
}
function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function showToast(msg, duration) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), duration || 3000);
}

/**
 * Show first-visit toast (one-time per user)
 * Displays a helpful hint about card expansion and diagnostics on first inspection
 */
function showFirstVisitToast() {
  const STORAGE_KEY = 'vista-first-visit-shown';
  const alreadyShown = localStorage.getItem(STORAGE_KEY);

  if (!alreadyShown) {
    // Show the toast with a dismissible message
    const toastMsg = 'Click any card to expand. Try the Diagnostics tab for issues.';

    // Create a dismissible toast
    toast.innerHTML = `
      <span>${toastMsg}</span>
      <button class="toast-dismiss" aria-label="Dismiss" style="margin-left:12px;background:none;border:none;color:inherit;cursor:pointer;font-size:16px;">&times;</button>
    `;

    toast.classList.remove('hidden');

    // Handle dismiss button click
    const dismissBtn = toast.querySelector('.toast-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        toast.classList.add('hidden');
        localStorage.setItem(STORAGE_KEY, 'true');
      });
    }

    // Auto-hide after 8 seconds (longer than regular toasts)
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hidden');
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 8000);

    // Mark as shown
    localStorage.setItem(STORAGE_KEY, 'true');
  }
}

/**
 * Check if the page has no meta tags and show template picker suggestion
 * Detects if Open Graph and Twitter Card tags are missing
 */
function checkForNoMetaTags(metaData) {
  if (!metaData || !metaData.meta) return;

  const meta = metaData.meta;
  const hasOgTags = !!(meta.og &&
    (meta.og.title || meta.og.description || meta.og.image));
  const hasTwitterTags = !!(meta.twitter &&
    (meta.twitter.title || meta.twitter.description || meta.twitter.image || meta.twitter.card));

  // Only show suggestion if page has no OG or Twitter Card tags
  if (!hasOgTags && !hasTwitterTags) {
    // Clear any existing suggestion chips first
    clearSuggestionChips();

    // Create suggestion chip with action to open Templates tab
    const chip = document.createElement('div');
    chip.className = 'suggestion-chips';
    chip.innerHTML = `
      <span class="suggestion-icon">&#128556;</span>
      <span class="suggestion-text"><strong>This page has no Open Graph or Twitter Card tags.</strong> Want to create them?</span>
      <button class="suggestion-action" data-action="open-templates">Open Templates</button>
      <button class="suggestion-dismiss" aria-label="Dismiss">&times;</button>
    `;

    // Insert after the URL input form
    const insertAfter = document.querySelector('#urlMode .input-mode-toggle');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(chip, insertAfter.nextSibling);
    }

    // Log for debugging
    console.log('[NoMetaTags] No meta tags detected. Showing template suggestion.');
  }
}

function gradeClass(grade) {
  return 'grade-' + grade.replace('+', 'plus');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return url || ''; }
}

/**
 * Extract dominant color from an image URL using canvas
 * Returns a Promise that resolves to a CSS color string (rgb(r, g, b))
 * Falls back to neutral gray (#e0e0e0) on error
 */
function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Sample center pixel for dominant color
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1, 0, 0, 1, 1);
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

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
window.copyText = copyText;
window.downloadScreenshot = downloadScreenshot;
window.renderPreviewsInternal = renderPreviews;

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
}

// ── OG Generator ──
let oggenState = {
  bgType: 'solid',
  bgColor: '#1a1a2e',
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
  gradientDir: 'horizontal',
  bgImage: null,
  bgImageSize: 'cover',
  title: '',
  subtitle: '',
  font: 'system',
  textColor: '#ffffff',
  logoPos: 'none',
  logoImage: null,
  logoSize: 80
};

const OGGEN_FONTS = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"SF Mono", "Fira Code", Consolas, monospace',
  inter: 'Inter, sans-serif',
  roboto: 'Roboto, sans-serif',
  'open-sans': '"Open Sans", sans-serif',
  montserrat: 'Montserrat, sans-serif',
  playfair: '"Playfair Display", serif'
};

function initOgGenerator() {
  if (!oggenCanvas) return;
  updateOggenCanvas();
}

function handleBgTypeChange() {
  oggenState.bgType = oggenBgType.value;

  // Toggle visibility of background controls
  oggenBgColorRow.classList.toggle('hidden', oggenState.bgType !== 'solid');
  oggenBgGradientRow.classList.toggle('hidden', oggenState.bgType !== 'gradient');
  oggenBgImageRow.classList.toggle('hidden', oggenState.bgType !== 'image');

  updateOggenCanvas();
}

function handleBgImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      oggenState.bgImage = img;
      updateOggenCanvas();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function handleLogoPosChange() {
  oggenState.logoPos = oggenLogoPos.value;
  const showUpload = oggenState.logoPos !== 'none';
  oggenLogoUploadRow.classList.toggle('hidden', !showUpload);
  updateOggenCanvas();
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      oggenState.logoImage = img;
      updateOggenCanvas();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function updateOggenCanvas() {
  if (!oggenCanvas) return;

  const ctx = oggenCanvas.getContext('2d');
  const width = 1200;
  const height = 630;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  drawBackground(ctx, width, height);

  // Draw content
  drawContent(ctx, width, height);

  // Draw logo
  drawLogo(ctx, width, height);
}

function drawBackground(ctx, width, height) {
  switch (oggenState.bgType) {
    case 'solid':
      ctx.fillStyle = oggenBgColor.value;
      ctx.fillRect(0, 0, width, height);
      break;

    case 'gradient':
      let gradient;
      const startColor = oggenGradientStart.value;
      const endColor = oggenGradientEnd.value;
      const dir = oggenGradientDir.value;

      if (dir === 'horizontal') {
        gradient = ctx.createLinearGradient(0, 0, width, 0);
      } else if (dir === 'vertical') {
        gradient = ctx.createLinearGradient(0, 0, 0, height);
      } else {
        gradient = ctx.createLinearGradient(0, 0, width, height);
      }

      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;

    case 'image':
      if (oggenState.bgImage) {
        const img = oggenState.bgImage;
        const mode = oggenBgImageSize.value;

        if (mode === 'stretch') {
          ctx.drawImage(img, 0, 0, width, height);
        } else if (mode === 'contain') {
          const scale = Math.min(width / img.width, height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        } else {
          // cover
          const scale = Math.max(width / img.width, height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        }
      } else {
        // Fallback to solid color
        ctx.fillStyle = oggenBgColor.value;
        ctx.fillRect(0, 0, width, height);
      }
      break;
  }
}

function drawContent(ctx, width, height) {
  const title = oggenTitle.value.trim();
  const subtitle = oggenSubtitle.value.trim();
  const textColor = oggenTextColor.value;
  const font = OGGEN_FONTS[oggenFont.value] || OGGEN_FONTS.system;

  if (!title && !subtitle) return;

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate content area (leave space for logo)
  const padding = 60;
  let topY = padding;
  let bottomY = height - padding;

  if (oggenState.logoPos === 'top-left' || oggenState.logoPos === 'top-right') {
    topY += oggenState.logoSize + 20;
  }
  if (oggenState.logoPos === 'bottom-left' || oggenState.logoPos === 'bottom-right') {
    bottomY -= oggenState.logoSize + 20;
  }

  const availableHeight = bottomY - topY;

  // Draw title with auto-sizing
  if (title) {
    const maxFontSize = 64;
    const minFontSize = 24;
    let fontSize = maxFontSize;

    ctx.font = `700 ${fontSize}px ${font}`;

    // Measure and truncate to fit
    let measuredTitle = fitText(ctx, title, width - padding * 2);
    let metrics = ctx.measureText(measuredTitle);
    let textWidth = metrics.width;
    let textHeight = fontSize * 1.2;

    // Auto-size down if too wide
    while (textWidth > width - padding * 2 && fontSize > minFontSize) {
      fontSize -= 2;
      ctx.font = `700 ${fontSize}px ${font}`;
      measuredTitle = fitText(ctx, title, width - padding * 2);
      metrics = ctx.measureText(measuredTitle);
      textWidth = metrics.width;
      textHeight = fontSize * 1.2;
    }

    const titleY = subtitle ? topY + availableHeight / 3 : height / 2;
    ctx.fillText(measuredTitle, width / 2, titleY);

    // Draw subtitle if present
    if (subtitle) {
      const subFontSize = Math.min(fontSize * 0.5, 36);
      ctx.font = `400 ${subFontSize}px ${font}`;
      const measuredSub = fitText(ctx, subtitle, width - padding * 2);
      ctx.fillText(measuredSub, width / 2, titleY + textHeight + 20);
    }
  } else if (subtitle) {
    // Only subtitle
    const fontSize = 40;
    ctx.font = `400 ${fontSize}px ${font}`;
    const measuredSub = fitText(ctx, subtitle, width - padding * 2);
    ctx.fillText(measuredSub, width / 2, height / 2);
  }
}

function fitText(ctx, text, maxWidth) {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;

  // Binary search for best fit
  let left = 0;
  let right = text.length;

  while (left < right) {
    const mid = Math.ceil((left + right) / 2);
    const truncated = text.slice(0, mid);
    if (ctx.measureText(truncated + '…').width <= maxWidth) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }

  return text.slice(0, left) + '…';
}

function drawLogo(ctx, width, height) {
  if (oggenState.logoPos === 'none' || !oggenState.logoImage) return;

  const img = oggenState.logoImage;
  const size = parseInt(oggenLogoSize.value) || 80;
  const padding = 40;

  let x, y;

  switch (oggenState.logoPos) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = width - size - padding;
      y = padding;
      break;
    case 'bottom-left':
      x = padding;
      y = height - size - padding;
      break;
    case 'bottom-right':
      x = width - size - padding;
      y = height - size - padding;
      break;
    case 'center':
      x = (width - size) / 2;
      y = (height - size) / 2;
      break;
  }

  ctx.drawImage(img, x, y, size, size);
}

function downloadOggenImage() {
  if (!oggenCanvas) return;

  oggenCanvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'og-image-1200x630.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('OG image downloaded!', 2000);
  }, 'image/png');
}

function useOggenInEditor() {
  // For now, show a message about how to use the generated image
  showToast('Download the image and upload it to your server.', 3000);
}

function resetOggen() {
  oggenState = {
    bgType: 'solid',
    bgColor: '#1a1a2e',
    gradientStart: '#1a1a2e',
    gradientEnd: '#16213e',
    gradientDir: 'horizontal',
    bgImage: null,
    bgImageSize: 'cover',
    title: '',
    subtitle: '',
    font: 'system',
    textColor: '#ffffff',
    logoPos: 'none',
    logoImage: null,
    logoSize: 80
  };

  // Reset form controls
  if (oggenBgType) oggenBgType.value = 'solid';
  if (oggenBgColor) oggenBgColor.value = '#1a1a2e';
  if (oggenGradientStart) oggenGradientStart.value = '#1a1a2e';
  if (oggenGradientEnd) oggenGradientEnd.value = '#16213e';
  if (oggenGradientDir) oggenGradientDir.value = 'horizontal';
  if (oggenBgImageSize) oggenBgImageSize.value = 'cover';
  if (oggenTitle) oggenTitle.value = '';
  if (oggenSubtitle) oggenSubtitle.value = '';
  if (oggenFont) oggenFont.value = 'system';
  if (oggenTextColor) oggenTextColor.value = '#ffffff';
  if (oggenLogoPos) oggenLogoPos.value = 'none';
  if (oggenLogoSize) oggenLogoSize.value = 80;
  if (oggenBgImageInput) oggenBgImageInput.value = '';
  if (oggenLogoInput) oggenLogoInput.value = '';

  // Reset UI state
  if (oggenBgColorRow) oggenBgColorRow.classList.remove('hidden');
  if (oggenBgGradientRow) oggenBgGradientRow.classList.add('hidden');
  if (oggenBgImageRow) oggenBgImageRow.classList.add('hidden');
  if (oggenLogoUploadRow) oggenLogoUploadRow.classList.add('hidden');

  updateOggenCanvas();
  showToast('OG Generator reset', 1500);
}

// ── Compare Mode Functions ──

async function handleCompareSubmit() {
  const url1 = compareUrl1.value.trim();
  const url2 = compareUrl2.value.trim();

  if (!url1 || !url2) {
    showToast('Please enter both URLs to compare', 2000);
    return;
  }

  // Normalize URLs
  const normalizedUrl1 = url1.startsWith('http://') || url1.startsWith('https://') ? url1 : 'https://' + url1;
  const normalizedUrl2 = url2.startsWith('http://') || url2.startsWith('https://') ? url2 : 'https://' + url2;

  showLoading();

  try {
    // Use the dedicated /api/compare endpoint (single request for both URLs)
    const resp = await fetch(`/api/compare?a=${encodeURIComponent(normalizedUrl1)}&b=${encodeURIComponent(normalizedUrl2)}`);
    const data = await resp.json();

    if (!resp.ok) {
      // Check if the error is in the response body
      if (data.error) throw new Error(data.error);
      throw new Error('Comparison failed');
    }

    // Check for individual URL errors
    if (data.a.error) throw new Error(`URL A: ${data.a.error}`);
    if (data.b.error) throw new Error(`URL B: ${data.b.error}`);

    // Store comparison data
    compareData.before = data.a;
    compareData.after = data.b;
    compareData.swapped = false;

    // Show results
    hideLoading();
    renderComparisonResults();

    // Update hero
    hero.classList.add('compact');
    document.body.classList.add('has-results');
    resultsSection.classList.remove('hidden');

    // Show compare tab
    tabCompareBtn?.classList.remove('hidden');
    switchTab('compare');

    // Announce comparison results to screen readers
    const gradeBefore = data.a.scoring?.overall?.grade || '?';
    const gradeAfter = data.b.scoring?.overall?.grade || '?';
    const scoreBefore = data.a.scoring?.overall?.score || 0;
    const scoreAfter = data.b.scoring?.overall?.score || 0;
    const change = scoreAfter - scoreBefore;
    const changeText = change > 0 ? `+${change}` : change.toString();
    announce(`Comparison complete. Before: ${gradeBefore} (${scoreBefore}/100). After: ${gradeAfter} (${scoreAfter}/100). Change: ${changeText}.`);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 3000);
  }
}

function handleSwapUrls() {
  if (!compareData.before || !compareData.after) return;

  // Swap the data
  const temp = compareData.before;
  compareData.before = compareData.after;
  compareData.after = temp;
  compareData.swapped = !compareData.swapped;

  // Re-render
  renderComparisonResults();
  showToast('URLs swapped (A/B Test mode)', 1500);
}

function renderComparisonResults() {
  if (!compareData.before || !compareData.after) return;

  const data1 = compareData.before;
  const data2 = compareData.after;

  // Render score comparison
  renderScoreComparison(data1, data2);

  // Render meta tag diff
  renderMetaTagDiff(data1.meta, data2.meta);

  // Render platform comparison
  renderPlatformComparison(data1.scoring.scores, data2.scoring.scores);
}

function renderScoreComparison(data1, data2) {
  const grade1 = data1.scoring.overall.grade;
  const grade2 = data2.scoring.overall.grade;
  const score1 = data1.scoring.overall.score;
  const score2 = data2.scoring.overall.score;

  const grade1El = document.getElementById('scoreGrade1');
  const grade2El = document.getElementById('scoreGrade2');
  const url1El = document.getElementById('scoreUrl1');
  const url2El = document.getElementById('scoreUrl2');

  if (grade1El) {
    grade1El.textContent = grade1;
    grade1El.className = 'score-col-grade ' + gradeClass(grade1);
  }

  if (grade2El) {
    grade2El.textContent = grade2;
    grade2El.className = 'score-col-grade ' + gradeClass(grade2);
  }

  if (url1El) {
    url1El.textContent = data1.finalUrl || data1.url;
  }

  if (url2El) {
    url2El.textContent = data2.finalUrl || data2.url;
  }

  // Announce score comparison to screen readers
  const scoreDelta = score2 - score1;
  let message = `Comparison complete. Before score: ${grade1} (${score1}/100). After score: ${grade2} (${score2}/100).`;
  if (scoreDelta !== 0) {
    message += ` Score change: ${scoreDelta > 0 ? '+' : ''}${scoreDelta} points.`;
  } else {
    message += ' No score change.';
  }
  announce(message);
}

function renderMetaTagDiff(meta1, meta2) {
  const tbody = document.getElementById('diffTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  // Collect all tag keys from both meta objects
  const allKeys = new Set([...Object.keys(flattenMeta(meta1)), ...Object.keys(flattenMeta(meta2))]);

  // Track if any diffs found
  let hasChanges = false;

  allKeys.forEach(key => {
    const val1 = getMetaValue(meta1, key);
    const val2 = getMetaValue(meta2, key);

    if (val1 !== val2) {
      hasChanges = true;
      const row = document.createElement('tr');

      // Determine the type of change
      let rowClass = '';
      let val1Class = '';
      let val2Class = '';

      if (val1 === null) {
        rowClass = 'diff-row-added';
        val2Class = 'diff-value-added';
      } else if (val2 === null) {
        rowClass = 'diff-row-removed';
        val1Class = 'diff-value-removed';
      } else {
        rowClass = 'diff-row-changed';
        val1Class = 'diff-value-changed';
        val2Class = 'diff-value-changed';
      }

      row.className = rowClass;

      row.innerHTML = `
        <td><span class="diff-tag-key">${escHtml(key)}</span></td>
        <td>${val1 !== null ? `<span class="${val1Class}">${escHtml(String(val1))}</span>` : '<span class="diff-empty">(missing)</span>'}</td>
        <td>${val2 !== null ? `<span class="${val2Class}">${escHtml(String(val2))}</span>` : '<span class="diff-empty">(missing)</span>'}</td>
      `;

      tbody.appendChild(row);
    }
  });

  if (!hasChanges) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:20px;">No differences found in meta tags</td></tr>';
  }
}

function renderPlatformComparison(scores1, scores2) {
  const grid = document.getElementById('platformComparisonGrid');
  if (!grid) return;

  grid.innerHTML = '';

  // Get all platform IDs
  const allPids = new Set([...Object.keys(scores1), ...Object.keys(scores2)]);

  allPids.forEach(pid => {
    const score1 = scores1[pid];
    const score2 = scores2[pid];

    if (!score1 || !score2) return;

    const grade1 = score1.grade;
    const grade2 = score2.grade;

    // Calculate change direction
    const gradeOrder = ['F', 'D', 'C', 'B', 'A', 'A+'];
    const idx1 = gradeOrder.indexOf(grade1);
    const idx2 = gradeOrder.indexOf(grade2);

    let changeClass = 'unchanged';
    let changeText = 'No change';

    if (idx2 > idx1) {
      changeClass = 'improved';
      changeText = '↑ Improved';
    } else if (idx2 < idx1) {
      changeClass = 'degraded';
      changeText = '↓ Degraded';
    }

    const row = document.createElement('div');
    row.className = 'platform-comparison-row';
    row.innerHTML = `
      <div class="platform-comparison-name">
        <span>${PLATFORM_ICONS[pid] || '🌐'}</span>
        <span>${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
      </div>
      <div class="platform-comparison-score">
        <span class="platform-comparison-grade ${gradeClass(grade1)}">${grade1}</span>
        <span class="platform-comparison-change ${changeClass}">${changeText}</span>
      </div>
      <div class="platform-comparison-score">
        <span class="platform-comparison-grade ${gradeClass(grade2)}">${grade2}</span>
      </div>
    `;

    grid.appendChild(row);
  });
}

// Helper function to flatten meta object for comparison
function flattenMeta(meta, prefix = '') {
  const result = {};

  for (const [key, value] of Object.entries(meta)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenMeta(value, fullKey));
    } else if (value !== null && value !== undefined && value !== '') {
      result[fullKey] = value;
    }
  }

  return result;
}

// Helper function to get meta value by dot-notation key
function getMetaValue(meta, key) {
  const parts = key.split('.');
  let current = meta;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current;
}

// ── Sitemap Mode Functions ──

async function handleSitemapSubmit() {
  const sitemapUrl = sitemapInput?.value?.trim();
  if (!sitemapUrl) {
    showToast('Please enter a sitemap URL', 2000);
    return;
  }

  // Normalize URL
  const normalizedUrl = sitemapUrl.startsWith('http://') || sitemapUrl.startsWith('https://')
    ? sitemapUrl
    : 'https://' + sitemapUrl;

  // Show progress
  if (sitemapProgress) sitemapProgress.classList.remove('hidden');
  if (progressText) progressText.textContent = 'Fetching sitemap...';
  if (progressFill) progressFill.style.width = '10%';

  try {
    const resp = await fetch(`/api/sitemap?url=${encodeURIComponent(normalizedUrl)}`);
    const data = await resp.json();

    if (!resp.ok) throw new Error(data.error || 'Sitemap fetch failed');

    // Store results
    sitemapData = data;
    sitemapResults = data.results || [];

    // Update progress
    if (progressText) progressText.textContent = `Analyzed ${sitemapResults.length} pages`;
    if (progressFill) progressFill.style.width = '100%';

    // Hide progress after delay
    setTimeout(() => {
      if (sitemapProgress) sitemapProgress.classList.add('hidden');
    }, 1500);

    // Render sitemap results
    renderSitemapResults(data);

    // Update hero
    hero.classList.add('compact');
    document.body.classList.add('has-results');
    if (resultsSection) resultsSection.classList.remove('hidden');

    // Show sitemap tab
    if (tabSitemapBtn) tabSitemapBtn.classList.remove('hidden');
    switchTab('sitemap');

    // Announce sitemap results to screen readers
    const { totalFound, crawled, errors } = data;
    announce(`Sitemap analysis complete. Found ${totalFound} URLs, crawled ${crawled} pages, ${errors} errors.`);

    // Scroll to results
    if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    if (sitemapProgress) sitemapProgress.classList.add('hidden');
    showToast('Error: ' + err.message, 3000);
  }
}

function renderSitemapResults(data) {
  // Render summary stats
  if (sitemapSummaryStats) {
    const { totalFound, crawled, errors, hasMore } = data;
    sitemapSummaryStats.innerHTML = `
      <div class="sitemap-stat">
        <span class="stat-label">Total URLs:</span>
        <span class="stat-value">${totalFound}</span>
      </div>
      <div class="sitemap-stat">
        <span class="stat-label">Crawled:</span>
        <span class="stat-value">${crawled}</span>
      </div>
      <div class="sitemap-stat">
        <span class="stat-label">Errors:</span>
        <span class="stat-value ${errors > 0 ? 'stat-error' : ''}">${errors}</span>
      </div>
      ${hasMore ? '<div class="sitemap-stat"><span class="stat-note">Limited to 100 URLs</span></div>' : ''}
    `;
  }

  // Render heatmap table
  renderHeatmapTable(sitemapResults);
}

function renderHeatmapTable(results) {
  if (!heatmapTableHead || !heatmapTableBody) return;

  // Clear existing content
  heatmapTableHead.innerHTML = '';
  heatmapTableBody.innerHTML = '';

  if (results.length === 0) {
    heatmapTableBody.innerHTML = '<tr><td colspan="32" style="text-align:center;padding:20px;">No results found</td></tr>';
    return;
  }

  // Build header row
  const headerRow = document.createElement('tr');

  // Page/URL column header
  const pageHeader = document.createElement('th');
  pageHeader.className = 'heatmap-th sticky-header';
  pageHeader.textContent = 'Page';
  headerRow.appendChild(pageHeader);

  // Overall score column header
  const scoreHeader = document.createElement('th');
  scoreHeader.className = 'heatmap-th sticky-header';
  scoreHeader.textContent = 'Score';
  headerRow.appendChild(scoreHeader);

  // Platform column headers
  const platformOrder = ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord', 'whatsapp', 'imessage', 'telegram'];
  platformOrder.forEach(pid => {
    const th = document.createElement('th');
    th.className = 'heatmap-th platform-header';
    th.innerHTML = `<span class="platform-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>`;
    th.title = PLATFORM_NAMES[pid] || pid;
    headerRow.appendChild(th);
  });

  heatmapTableHead.appendChild(headerRow);

  // Build data rows
  results.forEach(result => {
    if (result.error) return; // Skip errored results

    const row = document.createElement('tr');
    row.className = 'heatmap-tr';
    row.dataset.url = result.url;

    // Page URL cell
    const pageCell = document.createElement('td');
    pageCell.className = 'heatmap-td url-cell';
    const displayUrl = result.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    pageCell.innerHTML = `<a href="${escHtml(result.url)}" target="_blank" rel="noopener" title="${escHtml(result.url)}">${escHtml(displayUrl)}</a>`;
    row.appendChild(pageCell);

    // Overall score cell
    const scoreCell = document.createElement('td');
    scoreCell.className = 'heatmap-td score-cell';
    scoreCell.innerHTML = `
      <span class="heatmap-grade ${gradeClass(result.overallGrade)}">${result.overallGrade}</span>
      <span class="heatmap-score">${result.overallScore}</span>
    `;
    row.appendChild(scoreCell);

    // Platform cells
    platformOrder.forEach(pid => {
      const cell = document.createElement('td');
      cell.className = 'heatmap-td platform-cell';

      const score = result.scores[pid];
      if (score) {
        const { grade, score: points } = score;
        cell.className += ` ${gradeClass(grade)}`;
        cell.innerHTML = `<span class="platform-grade">${grade}</span>`;
        cell.title = `${PLATFORM_NAMES[pid] || pid}: ${grade} (${points})`;
      } else {
        cell.className += ' no-data';
        cell.innerHTML = '<span class="platform-grade">-</span>';
      }

      row.appendChild(cell);
    });

    heatmapTableBody.appendChild(row);
  });
}

function handleHeatmapSort() {
  if (!heatmapSort || !sitemapResults.length) return;

  const sortBy = heatmapSort.value;
  let sorted = [...sitemapResults];

  switch (sortBy) {
    case 'score-asc':
      sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      break;
    case 'url-asc':
      sorted.sort((a, b) => a.url.localeCompare(b.url));
      break;
    case 'url-desc':
      sorted.sort((a, b) => b.url.localeCompare(a.url));
      break;
  }

  renderHeatmapTable(sorted);
}

function exportSitemapDataAsCsv() {
  if (!sitemapResults.length) {
    showToast('No data to export', 2000);
    return;
  }

  const headers = ['URL', 'Final URL', 'Status Code', 'Title', 'Description', 'Image', 'Overall Grade', 'Overall Score'];
  const platformOrder = ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord', 'whatsapp', 'imessage', 'telegram'];
  platformOrder.forEach(pid => {
    headers.push(`${PLATFORM_NAMES[pid] || pid} Grade`);
    headers.push(`${PLATFORM_NAMES[pid] || pid} Score`);
  });

  const rows = sitemapResults.map(result => {
    if (result.error) {
      return [result.url, '', '', '', '', '', 'Error', result.error];
    }

    const row = [
      result.url,
      result.finalUrl || result.url,
      result.statusCode || '',
      escapeCsv(result.title),
      escapeCsv(result.description),
      result.image,
      result.overallGrade,
      result.overallScore,
    ];

    platformOrder.forEach(pid => {
      const score = result.scores[pid];
      if (score) {
        row.push(score.grade);
        row.push(score.score);
      } else {
        row.push('');
        row.push('');
      }
    });

    return row;
  });

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  downloadFile(csv, 'sitemap-report.csv', 'text/csv');
  showToast('CSV exported', 2000);
}

function exportSitemapDataAsJson() {
  if (!sitemapResults.length) {
    showToast('No data to export', 2000);
    return;
  }

  const json = JSON.stringify({
    sitemapUrl: sitemapData?.sitemapUrl,
    totalFound: sitemapData?.totalFound,
    crawled: sitemapData?.crawled,
    timestamp: new Date().toISOString(),
    results: sitemapResults,
  }, null, 2);

  downloadFile(json, 'sitemap-report.json', 'application/json');
  showToast('JSON exported', 2000);
}

function escapeCsv(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Phase 2: Editor & Additional Features ──

// Editor state
let editorState = {
  original: {},
  edited: {},
  dirty: false
};

// Platform customization state
let platformPrefs = {
  favorites: new Set(),
  hidden: new Set(),
  columnCount: 3,
  smartOrdering: true,
  cardOrder: {} // Map of groupId -> array of platform IDs in custom order
};

// Command palette state
let commandPaletteOpen = false;
let commandPaletteSelectedIndex = 0;
let recentCommands = [];

// Initialize editor when results are loaded
function initEditor(data) {
  if (!data || !data.meta) return;

  editorState.original = {
    title: data.meta.title || '',
    description: data.meta.description || '',
    'og.title': data.meta.og?.title || '',
    'og.description': data.meta.og?.description || '',
    'og.image': data.meta.og?.image || '',
    'og.url': data.meta.og?.url || '',
    'og.site_name': data.meta.og?.site_name || '',
    'og.type': data.meta.og?.type || '',
    'twitter.card': data.meta.twitter?.card || '',
    'twitter.title': data.meta.twitter?.title || '',
    'twitter.description': data.meta.twitter?.description || '',
    'twitter.image': data.meta.twitter?.image || ''
  };

  editorState.edited = { ...editorState.original };
  editorState.dirty = false;

  // Populate form fields
  populateEditorForm();
  updateEditorCharCounts();
  updateEditorFieldImpactLabels(data);
}

/**
 * Update editor field impact labels to show how many platforms each field affects
 */
function updateEditorFieldImpactLabels(data) {
  // Map each field to the platforms that use it
  const fieldPlatformMap = {
    'editTitleImpact': ['google', 'mastodon', 'bluesky', 'medium', 'substack', 'tumblr', 'pinterest', 'notion', 'jira', 'github', 'trello', 'figma', 'imessage', 'telegram', 'googlechat', 'zoom', 'line', 'kakaotalk'],
    'editDescriptionImpact': ['google', 'mastodon', 'bluesky', 'medium', 'substack', 'slack', 'teams', 'telegram'],
    'editOgTitleImpact': ['facebook', 'threads', 'twitter', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'medium', 'substack', 'tumblr', 'pinterest', 'slack', 'discord', 'whatsapp', 'signal', 'teams', 'googlechat', 'zoom', 'line', 'kakaotalk', 'notion', 'jira', 'github', 'trello', 'figma', 'outlook', 'gmail', 'feedly'],
    'editOgDescriptionImpact': ['facebook', 'threads', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'medium', 'substack', 'slack', 'teams', 'telegram'],
    'editOgImageImpact': ['facebook', 'threads', 'twitter', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'medium', 'substack', 'tumblr', 'pinterest', 'slack', 'discord', 'whatsapp', 'imessage', 'telegram', 'signal', 'teams', 'googlechat', 'zoom', 'line', 'kakaotalk', 'notion', 'jira', 'github', 'trello', 'figma', 'outlook', 'gmail', 'feedly'],
    'editTwitterCardImpact': ['twitter'],
  };

  for (const [labelId, platformIds] of Object.entries(fieldPlatformMap)) {
    const labelEl = document.getElementById(labelId);
    if (labelEl) {
      // Count how many of these platforms would improve if the field was properly filled
      const currentScoring = data.scoring || { scores: {} };
      let affectedCount = 0;

      // Check each platform to see if it would benefit from this field
      for (const pid of platformIds) {
        const platformScore = currentScoring.scores[pid];
        if (platformScore && platformScore.score < 100) {
          affectedCount++;
        }
      }

      if (affectedCount > 0) {
        labelEl.textContent = `(${affectedCount} platforms)`;
      } else {
        labelEl.textContent = '';
      }
    }
  }
}

function populateEditorForm() {
  const fields = [
    { id: 'editTitle', tag: 'title' },
    { id: 'editDescription', tag: 'description' },
    { id: 'editOgTitle', tag: 'og.title' },
    { id: 'editOgDescription', tag: 'og.description' },
    { id: 'editOgImage', tag: 'og.image' },
    { id: 'editOgUrl', tag: 'og.url' },
    { id: 'editOgSiteName', tag: 'og.site_name' },
    { id: 'editOgType', tag: 'og.type' },
    { id: 'editTwitterCard', tag: 'twitter.card' },
    { id: 'editTwitterTitle', tag: 'twitter.title' },
    { id: 'editTwitterDescription', tag: 'twitter.description' },
    { id: 'editTwitterImage', tag: 'twitter.image' }
  ];

  fields.forEach(field => {
    const el = document.getElementById(field.id);
    if (el) {
      el.value = editorState.original[field.tag] || '';
      el.classList.remove('modified');
    }
  });
}

function updateEditorCharCounts() {
  const fields = [
    { id: 'editTitle', countId: 'editTitleCount', max: 200 },
    { id: 'editDescription', countId: 'editDescriptionCount', max: 300 },
    { id: 'editOgTitle', countId: 'editOgTitleCount', max: 200 },
    { id: 'editOgDescription', countId: 'editOgDescriptionCount', max: 300 },
    { id: 'editTwitterTitle', countId: 'editTwitterTitleCount', max: 200 },
    { id: 'editTwitterDescription', countId: 'editTwitterDescriptionCount', max: 300 }
  ];

  fields.forEach(field => {
    const el = document.getElementById(field.id);
    const countEl = document.getElementById(field.countId);
    if (el && countEl) {
      const len = el.value.length;
      countEl.textContent = len;
      if (len > field.max) {
        countEl.style.color = 'var(--red)';
      } else if (len > field.max * 0.9) {
        countEl.style.color = 'var(--yellow)';
      } else {
        countEl.style.color = 'var(--text3)';
      }
    }
  });

  // Update character gauges for title and description fields
  const titleText = document.getElementById('editTitle')?.value || '';
  const descText = document.getElementById('editDescription')?.value || '';
  const ogTitleText = document.getElementById('editOgTitle')?.value || '';
  const ogDescText = document.getElementById('editOgDescription')?.value || '';

  renderCharGauges('editTitle', titleText, 'title');
  renderCharGauges('editDescription', descText, 'description');
  renderCharGauges('editOgTitle', ogTitleText, 'title');
  renderCharGauges('editOgDescription', ogDescText, 'description');
}

/**
 * Render per-platform character budget gauges
 * @param {string} fieldId - The ID of the editor field
 * @param {string} text - The text content to analyze
 * @param {string} fieldType - 'title' or 'description'
 */
function renderCharGauges(fieldId, text, fieldType) {
  const container = document.getElementById(`${fieldId}Gauges`);
  if (!container) return;

  const textLen = text.length;
  const fieldKey = fieldType === 'title' ? 'title' : 'desc';

  // Count platforms by status
  let okCount = 0;
  let warnCount = 0;
  let overCount = 0;
  let totalCount = 0;

  PLATFORM_GROUPS.forEach(group => {
    group.platforms.forEach(pid => {
      const limits = PLATFORM_CHAR_LIMITS[pid];
      if (!limits) return;
      totalCount++;
      const limit = limits[fieldKey];
      if (textLen <= limit * 0.8) okCount++;
      else if (textLen <= limit) warnCount++;
      else overCount++;
    });
  });

  // Build gauges HTML
  let html = `<div class="char-gauges">`;

  // Summary line (always visible, clickable to expand/collapse all)
  html += `<div class="char-gauge-summary" onclick="toggleAllCharGauges('${fieldId}')" data-field="${fieldId}">`;
  const statusEmoji = overCount > 0 ? '🔴' : warnCount > 0 ? '🟡' : '🟢';
  html += `<span class="summary-status">${statusEmoji}</span>`;
  html += `<span class="summary-text">${fieldType === 'title' ? 'Title' : 'Description'}: OK on ${okCount}/${totalCount} platforms</span>`;
  if (warnCount > 0) html += `<span class="summary-warn"> · ${warnCount} near limit</span>`;
  if (overCount > 0) html += `<span class="summary-over"> · ${overCount} truncated</span>`;
  html += `</div>`;

  // Gauge groups (collapsible)
  html += `<div class="char-gauge-groups" data-field="${fieldId}">`;

  PLATFORM_GROUPS.forEach(group => {
    html += `<div class="char-gauge-group ${group.collapsed ? 'collapsed' : ''}" data-group="${group.id}">`;
    html += `<div class="char-gauge-group-header" onclick="toggleCharGaugeGroup('${group.id}')">`;
    html += `<span class="group-chevron">${group.collapsed ? '&#9654;' : '&#9660;'}</span>`;
    html += `<span class="group-title">${group.title}</span>`;

    // Count status for this group
    let gOk = 0, gWarn = 0, gOver = 0, gTotal = 0;
    group.platforms.forEach(pid => {
      const limits = PLATFORM_CHAR_LIMITS[pid];
      if (!limits) return;
      gTotal++;
      const limit = limits[fieldKey];
      if (textLen <= limit * 0.8) gOk++;
      else if (textLen <= limit) gWarn++;
      else gOver++;
    });
    html += `<span class="group-summary">${gOk}/${gTotal} OK</span>`;
    html += `</div>`;

    html += `<div class="char-gauge-group-content">`;
    html += `<div class="char-gauge-grid">`;

    group.platforms.forEach(pid => {
      const limits = PLATFORM_CHAR_LIMITS[pid];
      if (!limits) return;
      const limit = limits[fieldKey];
      const icon = PLATFORM_ICONS[pid] || '🌐';
      const name = PLATFORM_NAMES[pid] || pid;

      // Calculate fill percentage and color
      const fillPct = Math.min(100, (textLen / limit) * 100);
      let barColor = 'var(--green)';
      if (textLen > limit) barColor = 'var(--red)';
      else if (textLen > limit * 0.8) barColor = 'var(--yellow)';

      // Find truncation point (word boundary)
      let truncateWord = '';
      if (textLen > limit) {
        const truncated = text.substring(0, limit);
        const lastSpace = truncated.lastIndexOf(' ');
        truncateWord = lastSpace > 0 ? text.substring(lastSpace + 1, lastSpace + 20) + '...' : '...';
      }

      html += `<div class="char-gauge-item" title="${name}: ${textLen}/${limit} chars used${textLen > limit ? ' — truncates after "' + truncateWord + '"' : ''}">`;
      html += `<span class="gauge-icon">${icon}</span>`;
      html += `<div class="gauge-bar-container">`;
      html += `<div class="gauge-bar-fill" style="width: ${fillPct}%; background: ${barColor};"></div>`;
      html += `<div class="gauge-bar-cutline"></div>`;
      html += `</div>`;
      html += `</div>`;
    });

    html += `</div></div></div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

/**
 * Toggle collapse state of a character gauge group
 */
function toggleCharGaugeGroup(groupId) {
  const groupEl = document.querySelector(`.char-gauge-group[data-group="${groupId}"]`);
  if (groupEl) {
    groupEl.classList.toggle('collapsed');
    const chevron = groupEl.querySelector('.group-chevron');
    if (chevron) {
      chevron.innerHTML = groupEl.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
    }
  }
}

// Make toggleCharGaugeGroup globally accessible for onclick handlers
window.toggleCharGaugeGroup = toggleCharGaugeGroup;

/**
 * Toggle all character gauge groups (expand/collapse all)
 */
function toggleAllCharGauges(fieldId) {
  const container = document.getElementById(`${fieldId}Gauges`);
  if (!container) return;

  const groups = container.querySelectorAll('.char-gauge-group');
  const allCollapsed = Array.from(groups).every(g => g.classList.contains('collapsed'));

  groups.forEach(group => {
    if (allCollapsed) {
      group.classList.remove('collapsed');
      const chevron = group.querySelector('.group-chevron');
      if (chevron) chevron.innerHTML = '&#9660;';
    } else {
      group.classList.add('collapsed');
      const chevron = group.querySelector('.group-chevron');
      if (chevron) chevron.innerHTML = '&#9654;';
    }
  });
}

// Make toggleAllCharGauges globally accessible
window.toggleAllCharGauges = toggleAllCharGauges;

function handleEditorInput(e) {
  const el = e.target;
  const tag = el.dataset.tag;
  if (!tag) return;

  editorState.edited[tag] = el.value;
  editorState.dirty = true;

  // Mark as modified
  if (el.value !== editorState.original[tag]) {
    el.classList.add('modified');
  } else {
    el.classList.remove('modified');
  }

  updateEditorCharCounts();

  // Debounced preview update
  clearTimeout(editorState.previewTimeout);
  editorState.previewTimeout = setTimeout(() => {
    updatePreviewsWithEdits();
  }, 300);
}

function updatePreviewsWithEdits() {
  if (!currentData) return;

  // Store original grade for comparison
  const originalGrade = currentData.scoring?.overall?.grade;
  const originalScore = currentData.scoring?.overall?.score;

  // Create modified meta object
  const modifiedMeta = { ...currentData.meta };

  // Apply edits
  if (editorState.edited.title) modifiedMeta.title = editorState.edited.title;
  if (editorState.edited.description) modifiedMeta.description = editorState.edited.description;
  if (editorState.edited['og.title']) modifiedMeta.og = { ...modifiedMeta.og, title: editorState.edited['og.title'] };
  if (editorState.edited['og.description']) modifiedMeta.og = { ...modifiedMeta.og, description: editorState.edited['og.description'] };
  if (editorState.edited['og.image']) modifiedMeta.og = { ...modifiedMeta.og, image: editorState.edited['og.image'] };
  if (editorState.edited['og.url']) modifiedMeta.og = { ...modifiedMeta.og, url: editorState.edited['og.url'] };
  if (editorState.edited['og.site_name']) modifiedMeta.og = { ...modifiedMeta.og, site_name: editorState.edited['og.site_name'] };
  if (editorState.edited['og.type']) modifiedMeta.og = { ...modifiedMeta.og, type: editorState.edited['og.type'] };
  if (editorState.edited['twitter.card']) modifiedMeta.twitter = { ...modifiedMeta.twitter, card: editorState.edited['twitter.card'] };
  if (editorState.edited['twitter.title']) modifiedMeta.twitter = { ...modifiedMeta.twitter, title: editorState.edited['twitter.title'] };
  if (editorState.edited['twitter.description']) modifiedMeta.twitter = { ...modifiedMeta.twitter, description: editorState.edited['twitter.description'] };
  if (editorState.edited['twitter.image']) modifiedMeta.twitter = { ...modifiedMeta.twitter, image: editorState.edited['twitter.image'] };

  // Re-render previews with modified data
  const modifiedData = { ...currentData, meta: modifiedMeta };
  renderPreviews(modifiedData);

  // Recalculate and announce score changes
  if (typeof scoreAll === 'function') {
    const newScoring = scoreAll(modifiedMeta, currentData.imageProbe);
    const newGrade = newScoring.overall?.grade;
    const newScore = newScoring.overall?.score;

    // Announce if grade changed
    if (originalGrade && newGrade && originalGrade !== newGrade) {
      announce(`Score updated from ${originalGrade} (${originalScore}/100) to ${newGrade} (${newScore}/100).`);
    }
  }
}

function resetEditor() {
  editorState.edited = { ...editorState.original };
  editorState.dirty = false;
  populateEditorForm();
  updateEditorCharCounts();

  // Reset previews
  if (currentData) {
    renderPreviews(currentData);
  }

  // Announce reset
  const grade = currentData.scoring?.overall?.grade;
  const score = currentData.scoring?.overall?.score;
  announce(`Editor reset to original values. Overall grade: ${grade} (${score}/100).`);

  showToast('Editor reset to original values', 2000);
}

// Editor event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Editor input listeners
  const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
  editorInputs.forEach(input => {
    input.addEventListener('input', handleEditorInput);
  });

  // Reset button
  document.getElementById('editorResetBtn')?.addEventListener('click', resetEditor);

  // Apply button (just shows confirmation - edits don't persist)
  document.getElementById('editorApplyBtn')?.addEventListener('click', () => {
    showToast('Changes applied to preview. Remember to update your actual website!', 3000);
  });

  // Code snippet framework selector
  document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);

  // Code snippet copy button
  document.getElementById('snippetCopyBtn')?.addEventListener('click', copyCodeSnippet);

  // Column layout selector
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => setColumnLayout(parseInt(btn.dataset.columns)));
  });

  // Export preferences
  document.getElementById('exportPrefsBtn')?.addEventListener('click', exportPreferences);

  // Import preferences
  document.getElementById('importPrefsBtn')?.addEventListener('click', () => {
    document.getElementById('importPrefsInput').click();
  });

  document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);

  // Facebook purge button
  document.getElementById('fbPurgeBtn')?.addEventListener('click', handleFbPurge);

  // Initialize templates
  initTemplates();

  // Load platform preferences
  loadPlatformPrefs();

  // Initialize command palette
  initCommandPalette();

  // Initialize global keyboard shortcuts
  initGlobalKeyboardShortcuts();

  // Initialize cache hub links
  initCacheHub();
});

// ── Code Snippet Generator ──
function generateCodeSnippet() {
  const framework = document.getElementById('snippetFramework')?.value || 'html';
  const codeEl = document.getElementById('snippetCode');

  if (!codeEl || !currentData) return;

  const meta = editorState.dirty ? editorState.edited : {
    title: currentData.meta?.title || '',
    description: currentData.meta?.description || '',
    'og.title': currentData.meta?.og?.title || '',
    'og.description': currentData.meta?.og?.description || '',
    'og.image': currentData.meta?.og?.image || '',
    'og.type': currentData.meta?.og?.type || 'website',
    'twitter.card': currentData.meta?.twitter?.card || 'summary_large_image'
  };

  let code = '';

  switch (framework) {
    case 'html':
      code = generateHtmlSnippet(meta);
      break;
    case 'nextjs':
      code = generateNextJsSnippet(meta);
      break;
    case 'nuxt':
      code = generateNuxtSnippet(meta);
      break;
    case 'remix':
      code = generateRemixSnippet(meta);
      break;
    case 'astro':
      code = generateAstroSnippet(meta);
      break;
    case 'sveltekit':
      code = generateSvelteKitSnippet(meta);
      break;
    case 'gatsby':
      code = generateGatsbySnippet(meta);
      break;
    case 'hugo':
      code = generateHugoSnippet(meta);
      break;
    case 'jekyll':
      code = generateJekyllSnippet(meta);
      break;
  }

  codeEl.querySelector('code').textContent = code;
}

function generateHtmlSnippet(meta) {
  return `<!-- Primary Meta Tags -->
<title>${escHtml(meta.title || '')}</title>
<meta name="title" content="${escHtml(meta.title || '')}" />
<meta name="description" content="${escHtml(meta.description || '')}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="${escHtml(meta['og.type'] || 'website')}" />
<meta property="og:url" content="${escHtml(currentData?.finalUrl || currentData?.url || '')}" />
<meta property="og:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
<meta property="og:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
<meta property="og:image" content="${escHtml(meta['og.image'] || '')}" />

<!-- Twitter -->
<meta property="twitter:card" content="${escHtml(meta['twitter.card'] || 'summary_large_image')}" />
<meta property="twitter:url" content="${escHtml(currentData?.finalUrl || currentData?.url || '')}" />
<meta property="twitter:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
<meta property="twitter:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
<meta property="twitter:image" content="${escHtml(meta['og.image'] || '')}" />`;
}

function generateNextJsSnippet(meta) {
  return `import Head from 'next/head';

export default function MetaTags() {
  return (
    <Head>
      <title>${escHtml(meta.title || '')}</title>
      <meta name="description" content="${escHtml(meta.description || '')}" />

      {/* Open Graph */}
      <meta property="og:type" content="${escHtml(meta['og.type'] || 'website')}" />
      <meta property="og:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta property="og:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta property="og:image" content="${escHtml(meta['og.image'] || '')}" />

      {/* Twitter */}
      <meta name="twitter:card" content="${escHtml(meta['twitter.card'] || 'summary_large_image')}" />
      <meta name="twitter:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta name="twitter:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta name="twitter:image" content="${escHtml(meta['og.image'] || '')}" />
    </Head>
  );
}`;
}

function generateNuxtSnippet(meta) {
  return `<script setup>
useHead({
  title: '${escHtml(meta.title || '')}',
  meta: [
    { name: 'description', content: '${escHtml(meta.description || '')}' },
    { property: 'og:type', content: '${escHtml(meta['og.type'] || 'website')}' },
    { property: 'og:title', content: '${escHtml(meta['og.title'] || meta.title || '')}' },
    { property: 'og:description', content: '${escHtml(meta['og.description'] || meta.description || '')}' },
    { property: 'og:image', content: '${escHtml(meta['og.image'] || '')}' },
    { name: 'twitter:card', content: '${escHtml(meta['twitter.card'] || 'summary_large_image')}' },
    { name: 'twitter:title', content: '${escHtml(meta['og.title'] || meta.title || '')}' },
    { name: 'twitter:description', content: '${escHtml(meta['og.description'] || meta.description || '')}' },
    { name: 'twitter:image', content: '${escHtml(meta['og.image'] || '')}' }
  ]
})
</script>`;
}

function generateRemixSnippet(meta) {
  return `import { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: "${escHtml(meta.title || '')}" },
    { name: "description", content: "${escHtml(meta.description || '')}" },
    { property: "og:type", content: "${escHtml(meta['og.type'] || 'website')}" },
    { property: "og:title", content: "${escHtml(meta['og.title'] || meta.title || '')}" },
    { property: "og:description", content: "${escHtml(meta['og.description'] || meta.description || '')}" },
    { property: "og:image", content: "${escHtml(meta['og.image'] || '')}" },
    { name: "twitter:card", content: "${escHtml(meta['twitter.card'] || 'summary_large_image')}" },
    { name: "twitter:title", content: "${escHtml(meta['og.title'] || meta.title || '')}" },
    { name: "twitter:description", content: "${escHtml(meta['og.description'] || meta.description || '')}" },
    { name: "twitter:image", content: "${escHtml(meta['og.image'] || '')}" }
  ];
};`;
}

function generateAstroSnippet(meta) {
  return `---
import Layout from '../layouts/Layout.astro';

const meta = {
  title: '${escHtml(meta.title || '')}',
  description: '${escHtml(meta.description || '')}',
  ogType: '${escHtml(meta['og.type'] || 'website')}',
  ogTitle: '${escHtml(meta['og.title'] || meta.title || '')}',
  ogDescription: '${escHtml(meta['og.description'] || meta.description || '')}',
  ogImage: '${escHtml(meta['og.image'] || '')}',
  twitterCard: '${escHtml(meta['twitter.card'] || 'summary_large_image')}'
};
---

<Layout title={meta.title}>
  <meta name="description" content={meta.description} />
  <meta property="og:type" content={meta.ogType} />
  <meta property="og:title" content={meta.ogTitle} />
  <meta property="og:description" content={meta.ogDescription} />
  <meta property="og:image" content={meta.ogImage} />
  <meta name="twitter:card" content={meta.twitterCard} />
  <meta name="twitter:title" content={meta.ogTitle} />
  <meta name="twitter:description" content={meta.ogDescription} />
  <meta name="twitter:image" content={meta.ogImage} />

  <slot />
</Layout>`;
}

function generateSvelteKitSnippet(meta) {
  return `<script>
  export let ssr = true;

  const meta = {
    title: '${escHtml(meta.title || '')}',
    description: '${escHtml(meta.description || '')}',
    ogType: '${escHtml(meta['og.type'] || 'website')}',
    ogTitle: '${escHtml(meta['og.title'] || meta.title || '')}',
    ogDescription: '${escHtml(meta['og.description'] || meta.description || '')}',
    ogImage: '${escHtml(meta['og.image'] || '')}',
    twitterCard: '${escHtml(meta['twitter.card'] || 'summary_large_image')}'
  };

  if (ssr) {
    import('svelte-head').then(({ setHead }) => {
      setHead({
        title: meta.title,
        meta: [
          { name: 'description', content: meta.description },
          { property: 'og:type', content: meta.ogType },
          { property: 'og:title', content: meta.ogTitle },
          { property: 'og:description', content: meta.ogDescription },
          { property: 'og:image', content: meta.ogImage },
          { name: 'twitter:card', content: meta.twitterCard },
          { name: 'twitter:title', content: meta.ogTitle },
          { name: 'twitter:description', content: meta.ogDescription },
          { name: 'twitter:image', content: meta.ogImage }
        ]
      });
    });
  }
</script>

<svelte:head>
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
  <meta property="og:type" content={meta.ogType} />
  <meta property="og:title" content={meta.ogTitle} />
  <meta property="og:description" content={meta.ogDescription} />
  <meta property="og:image" content={meta.ogImage} />
  <meta name="twitter:card" content={meta.twitterCard} />
  <meta name="twitter:title" content={meta.ogTitle} />
  <meta name="twitter:description" content={meta.ogDescription} />
  <meta name="twitter:image" content={meta.ogImage} />
</svelte:head>
}

function generateGatsbySnippet(meta) {
  return `import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ location }) => {
  const canonicalUrl = location?.href || '${escHtml(currentData?.finalUrl || currentData?.url || '')}';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>${escHtml(meta.title || '')}</title>
      <meta name="description" content="${escHtml(meta.description || '')}" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="${escHtml(meta['og.type'] || 'website')}" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta property="og:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta property="og:image" content="${escHtml(meta['og.image'] || '')}" />

      {/* Twitter */}
      <meta name="twitter:card" content="${escHtml(meta['twitter.card'] || 'summary_large_image')}" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta name="twitter:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta name="twitter:image" content="${escHtml(meta['og.image'] || '')}" />
    </Helmet>
  );
};

export default SEO;`;
}

function generateHugoSnippet(meta) {
  return `{{/*
  VISTA SEO Meta Tags

  Add to your site's front matter or configure in config.toml:

  [params]
    title = "${escHtml(meta.title || '')}"
    description = "${escHtml(meta.description || '')}"
    images = ["${escHtml(meta['og.image'] || '')}"]

  [params.opengraph]
    title = "${escHtml(meta['og.title'] || meta.title || '')}"
    description = "${escHtml(meta['og.description'] || meta.description || '')}"
    type = "${escHtml(meta['og.type'] || 'website')}"
    image = "${escHtml(meta['og.image'] || '')}"

  [params.twitter]
    card = "${escHtml(meta['twitter.card'] || 'summary_large_image')}"
    title = "${escHtml(meta['og.title'] || meta.title || '')}"
    description = "${escHtml(meta['og.description'] || meta.description || '')}"
    image = "${escHtml(meta['og.image'] || '')}"
*/}}

{{/* or use via partial: {{ partial "head" . }} */}}

{{/* Direct template example */}}
<title>{{ .Site.Params.title | default .Title }}</title>
<meta name="description" content="{{ .Site.Params.description }}" />

{{/* Open Graph */}}
<meta property="og:type" content="{{ .Site.Params.opengraph.type | default "website" }}" />
<meta property="og:url" content="{{ .Permalink }}" />
<meta property="og:title" content="{{ .Site.Params.opengraph.title | default .Title }}" />
<meta property="og:description" content="{{ .Site.Params.opengraph.description }}" />
<meta property="og:image" content="{{ .Site.Params.opengraph.image | absURL }}" />

{{/* Twitter */}}
<meta name="twitter:card" content="{{ .Site.Params.twitter.card | default "summary_large_image" }}" />
<meta name="twitter:url" content="{{ .Permalink }}" />
<meta name="twitter:title" content="{{ .Site.Params.twitter.title | default .Title }}" />
<meta name="twitter:description" content="{{ .Site.Params.twitter.description }}" />
<meta name="twitter:image" content="{{ .Site.Params.twitter.image | absURL }}" />`;
}

function generateJekyllSnippet(meta) {
  return `---
# VISTA SEO Meta Tags
#
# Place this front matter in your page or post.
# For site-wide defaults, add to _config.yml:
#
# seo:
#   title: "${escHtml(meta.title || '')}"
#   description: "${escHtml(meta.description || '')}"
#   image: "${escHtml(meta['og.image'] || '')}"
#   twitter:
#     card: "${escHtml(meta['twitter.card'] || 'summary_large_image')}"
#
# Then use the jekyll-seo-plugin tag: {% seo %}

title: "${escHtml(meta.title || '')}"
description: "${escHtml(meta.description || '')}"
# Serve for Open Graph, Twitter Cards, Facebook, Pinterest
image: "${escHtml(meta['og.image'] || '')}"
# Override site defaults or add platform-specific:
og:
  title: "${escHtml(meta['og.title'] || meta.title || '')}"
  type: "${escHtml(meta['og.type'] || 'website')}"
  description: "${escHtml(meta['og.description'] || meta.description || '')}"
twitter:
  card: "${escHtml(meta['twitter.card'] || 'summary_large_image')}"
  title: "${escHtml(meta['og.title'] || meta.title || '')}"
  description: "${escHtml(meta['og.description'] || meta.description || '')}"

---

{{/* If using jekyll-seo-plugin, just add: {% seo %} */}}
{{/* Otherwise, manual tags: */}}

<title>{{ page.title | default: site.title }}</title>
<meta name="description" content="{{ page.description | default: site.description }}" />

{{/* Open Graph */}}
<meta property="og:type" content="{{ page.og.type | default: 'website' }}" />
<meta property="og:url" content="{{ page.url | absolute_url }}" />
<meta property="og:title" content="{{ page.og.title | default: page.title | default: site.title }}" />
<meta property="og:description" content="{{ page.og.description | default: page.description | default: site.description }}" />
<meta property="og:image" content="{{ page.image | default: site.image | absolute_url }}" />

{{/* Twitter */}}
<meta name="twitter:card" content="{{ page.twitter.card | default: site.twitter.card | default: 'summary_large_image' }}" />
<meta name="twitter:url" content="{{ page.url | absolute_url }}" />
<meta name="twitter:title" content="{{ page.twitter.title | default: page.og.title | default: page.title | default: site.title }}" />
<meta name="twitter:description" content="{{ page.twitter.description | default: page.og.description | default: page.description | default: site.description }}" />
<meta name="twitter:image" content="{{ page.image | default: site.image | absolute_url }}" />`;
}

<slot />`;
}

function copyCodeSnippet() {
  const codeEl = document.getElementById('snippetCode');
  if (!codeEl) return;

  const code = codeEl.querySelector('code')?.textContent;
  if (!code) return;

  navigator.clipboard.writeText(code).then(() => {
    showToast('Code snippet copied to clipboard', 2000);
  }).catch(() => {
    showToast('Failed to copy code', 2000);
  });
}

// ── Template Library ──
const TEMPLATES = [
  {
    id: 'blog',
    icon: '📝',
    title: 'Blog Post',
    desc: 'Optimized for articles and blog content',
    tags: ['article', 'blog'],
    values: {
      'og.type': 'article',
      'og.title': 'Your Article Title Here - Blog Name',
      'og.description': 'A compelling 2-3 sentence summary of your article that entices readers to click through.',
      'og.image': 'https://example.com/blog-hero-image.jpg',
      'og.site_name': 'Your Blog Name',
      'twitter.card': 'summary_large_image',
      'article:author': 'Author Name',
      'article:published_time': '2024-01-15T10:00:00Z',
      'article:section': 'Technology',
      'schema.type': 'Article',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Your Article Title Here',
        'author': {
          '@type': 'Person',
          'name': 'Author Name'
        },
        'datePublished': '2024-01-15',
        'dateModified': '2024-01-15',
        'description': 'A compelling 2-3 sentence summary of your article.',
        'image': 'https://example.com/blog-hero-image.jpg',
        'publisher': {
          '@type': 'Organization',
          'name': 'Your Blog Name',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://example.com/logo.png'
          }
        }
      }
    },
    notes: 'Blog posts benefit from summary_large_image cards. Include author info and publish date for SEO. Use 1200x630px images for optimal display. Add article:section for categorization.'
  },
  {
    id: 'saas',
    icon: '💼',
    title: 'SaaS Landing',
    desc: 'Perfect for software product pages',
    tags: ['product', 'saas'],
    values: {
      'og.type': 'website',
      'og.title': 'Product Name - Tagline that explains value',
      'og.description': 'Brief description of your SaaS product highlighting key benefits and target audience.',
      'og.image': 'https://example.com/product-screenshot.jpg',
      'og.site_name': 'Product Name',
      'twitter.card': 'summary_large_image',
      'twitter:label1': 'Pricing',
      'twitter:data1': 'From $29/month',
      'schema.type': 'SoftwareApplication',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Product Name',
        'description': 'Brief description of your SaaS product.',
        'applicationCategory': 'BusinessApplication',
        'offers': {
          '@type': 'Offer',
          'price': '29.00',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.8',
          'ratingCount': '1250'
        }
      }
    },
    notes: 'SaaS landing pages should emphasize value proposition. Use pricing in twitter:data1 for Slack unfurls. Include aggregateRating if available. 1200x630px recommended for hero images.'
  },
  {
    id: 'ecommerce',
    icon: '🛒',
    title: 'E-commerce',
    desc: 'Product and shopping pages',
    tags: ['product', 'shop'],
    values: {
      'og.type': 'product',
      'og.title': 'Product Name - Product Category',
      'og.description': 'Product description highlighting key features, materials, and benefits.',
      'og.image': 'https://example.com/product-photo.jpg',
      'og.site_name': 'Store Name',
      'og.product:availability': 'in stock',
      'og.product:condition': 'new',
      'og.product:price:amount': '99.99',
      'og.product:price:currency': 'USD',
      'twitter.card': 'summary_large_image',
      'twitter:label1': 'Price',
      'twitter:data1': '$99.99',
      'schema.type': 'Product',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Product Name',
        'description': 'Product description highlighting key features.',
        'image': 'https://example.com/product-photo.jpg',
        'brand': {
          '@type': 'Brand',
          'name': 'Brand Name'
        },
        'offers': {
          '@type': 'Offer',
          'price': '99.99',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'itemCondition': 'https://schema.org/NewCondition'
        }
      }
    },
    notes: 'Product pages require price and availability for rich results. Use high-quality product images (square 1:1 ratio for Pinterest). Include brand information for Google Shopping.'
  },
  {
    id: 'portfolio',
    icon: '🎨',
    title: 'Portfolio',
    desc: 'Personal portfolio and showcase',
    tags: ['website', 'personal'],
    values: {
      'og.type': 'website',
      'og.title': 'Your Name - Portfolio / Job Title',
      'og.description': 'Professional bio: Your expertise, experience, and what you create.',
      'og.image': 'https://example.com/portfolio-preview.jpg',
      'og.site_name': 'yourname.com',
      'twitter.card': 'summary_large_image',
      'schema.type': 'Person',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Your Name',
        'jobTitle': 'Job Title',
        'description': 'Professional bio: Your expertise and what you create.',
        'url': 'https://yourname.com',
        'image': 'https://example.com/portfolio-preview.jpg',
        'sameAs': [
          'https://linkedin.com/in/yourprofile',
          'https://github.com/yourusername',
          'https://twitter.com/yourusername'
        ],
        'knowsAbout': ['Design', 'Development', 'UI/UX']
      }
    },
    notes: 'Portfolio pages should showcase your best work. Link to social profiles in sameAs for authorship. Use professional headshots or portfolio highlights for og.image.'
  },
  {
    id: 'event',
    icon: '📅',
    title: 'Event',
    desc: 'Conferences, meetups, and events',
    tags: ['event', 'calendar'],
    values: {
      'og.type': 'website',
      'og.title': 'Event Name - Date | Location',
      'og.description': 'Event description: what, who should attend, key speakers, and why it matters.',
      'og.image': 'https://example.com/event-banner.jpg',
      'og.site_name': 'Event Name',
      'twitter.card': 'summary_large_image',
      'schema.type': 'Event',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'Event',
        'name': 'Event Name',
        'description': 'Event description: what, who should attend, and key speakers.',
        'startDate': '2024-03-15T09:00:00',
        'endDate': '2024-03-15T17:00:00',
        'location': {
          '@type': 'Place',
          'name': 'Venue Name',
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': '123 Main St',
            'addressLocality': 'City',
            'postalCode': '12345',
            'addressCountry': 'US'
          }
        },
        'image': 'https://example.com/event-banner.jpg',
        'organizer': {
          '@type': 'Organization',
          'name': 'Organizer Name'
        },
        'offers': {
          '@type': 'Offer',
          'price': '199.00',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'url': 'https://example.com/registration'
        }
      }
    },
    notes: 'Event pages need location and dates for calendar integration. Include pricing and registration link in offers. Use event posters or venue photos for images. Ensure dates are in ISO 8601 format.'
  },
  {
    id: 'recipe',
    icon: '🍳',
    title: 'Recipe',
    desc: 'Food blog and recipe pages',
    tags: ['article', 'food'],
    values: {
      'og.type': 'article',
      'og.title': 'Recipe Name - Cooking Time | Difficulty',
      'og.description': 'Tempting description of the dish with key ingredients and why it is delicious.',
      'og.image': 'https://example.com/recipe-photo.jpg',
      'og.site_name': 'Food Blog Name',
      'twitter.card': 'summary_large_image',
      'article:author': 'Chef Name',
      'article:published_time': '2024-01-15T10:00:00Z',
      'article:section': 'Recipes',
      'schema.type': 'Recipe',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        'name': 'Recipe Name',
        'description': 'Tempting description of the dish.',
        'image': 'https://example.com/recipe-photo.jpg',
        'author': {
          '@type': 'Person',
          'name': 'Chef Name'
        },
        'datePublished': '2024-01-15',
        'prepTime': 'PT15M',
        'cookTime': 'PT30M',
        'totalTime': 'PT45M',
        'recipeYield': '4 servings',
        'recipeCategory': 'Dinner',
        'nutrition': {
          '@type': 'NutritionInformation',
          'calories': '350 kcal',
          'proteinContent': '25g'
        },
        'recipeIngredient': [
          '1 lb chicken breast',
          '2 cups broccoli',
          '1/4 cup soy sauce'
        ],
        'recipeInstructions': [
          {
            '@type': 'HowToStep',
            'text': 'Prepare ingredients...'
          }
        ]
      }
    },
    notes: 'Recipe pages need cooking time, servings, and ingredients for rich cards. Use high-quality food photos (4:3 aspect ratio). Nutrition information helps with health-related searches.'
  },
  {
    id: 'podcast',
    icon: '🎙️',
    title: 'Podcast',
    desc: 'Audio content and episodes',
    tags: ['audio', 'podcast'],
    values: {
      'og.type': 'website',
      'og.title': 'Episode #123: Episode Title - Podcast Name',
      'og.description': 'Episode summary: topics discussed, guests, and key takeaways.',
      'og.image': 'https://example.com/podcast-cover-art.jpg',
      'og.site_name': 'Podcast Name',
      'og.audio': 'https://example.com/episode.mp3',
      'twitter.card': 'summary_large_image',
      'twitter:label1': 'Episode',
      'twitter:data1': '#123',
      'schema.type': 'PodcastEpisode',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'PodcastEpisode',
        'name': 'Episode #123: Episode Title',
        'description': 'Episode summary: topics discussed and key takeaways.',
        'datePublished': '2024-01-15',
        'partOfSeries': {
          '@type': 'PodcastSeries',
          'name': 'Podcast Name'
        },
        'image': 'https://example.com/podcast-cover-art.jpg',
        'enclosure': {
          '@type': 'MediaObject',
          'contentUrl': 'https://example.com/episode.mp3'
        },
        'associatedMedia': {
          '@type': 'MediaObject',
          'contentUrl': 'https://example.com/episode.mp3',
          'encodingFormat': 'audio/mpeg'
        }
      }
    },
    notes: 'Podcast episodes should include episode number and duration. Use square cover art (1:1) for best display. Link to audio file in og.audio for embeddable players.'
  },
  {
    id: 'docs',
    icon: '📚',
    title: 'Documentation',
    desc: 'Technical docs and knowledge base',
    tags: ['docs', 'reference'],
    values: {
      'og.type': 'website',
      'og.title': 'Documentation - Feature Name | Product',
      'og.description': 'Clear description of what this documentation covers and who it is for.',
      'og.image': 'https://example.com/docs-preview.jpg',
      'og.site_name': 'Product Docs',
      'twitter.card': 'summary',
      'twitter:label1': 'Read Time',
      'twitter:data1': '5 min read',
      'schema.type': 'TechArticle',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': 'Documentation - Feature Name',
        'description': 'Clear description of what this documentation covers.',
        'proficiencyLevel': 'Beginner',
        'dependencies': 'Previous knowledge of basic concepts',
        'image': 'https://example.com/docs-preview.jpg'
      }
    },
    notes: 'Documentation pages should use summary card (not summary_large_image). Include read time estimates. Link to related docs in dependencies. Ensure URLs are clean and hierarchical.'
  },
  {
    id: 'oss',
    icon: '🐙',
    title: 'Open Source',
    desc: 'GitHub projects and OSS pages',
    tags: ['github', 'code'],
    values: {
      'og.type': 'website',
      'og.title': 'Repository Name - Short description',
      'og.description': 'What this project does, who it is for, and why it is useful.',
      'og.image': 'https://example.com/repo-social-preview.jpg',
      'og.site_name': 'GitHub - username/repo',
      'twitter.card': 'summary_large_image',
      'twitter:label1': 'Language',
      'twitter:data1': 'TypeScript',
      'schema.type': 'SoftwareSourceCode',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        'name': 'Repository Name',
        'description': 'What this project does and why it is useful.',
        'codeRepository': 'https://github.com/username/repo',
        'programmingLanguage': 'TypeScript',
        'license': 'MIT',
        'runtimePlatform': 'Node.js',
        'author': {
          '@type': 'Person',
          'name': 'Author Name'
        },
        'contributor': [
          {'@type': 'Person', 'name': 'Contributor 1'},
          {'@type': 'Person', 'name': 'Contributor 2'}
        ]
      }
    },
    notes: 'OSS projects should show GitHub stars/forks in preview. Include programming language and license in structured data. Use repo social preview images (1200x630px) for professional look.'
  },
  {
    id: 'newsletter',
    icon: '📧',
    title: 'Newsletter',
    desc: 'Email subscriptions and archives',
    tags: ['email', 'content'],
    values: {
      'og.type': 'website',
      'og.title': 'Newsletter Name - Issue #123: Main Topic',
      'og.description': 'Brief summary of this issue: featured articles, key insights, and what readers will learn.',
      'og.image': 'https://example.com/newsletter-header.jpg',
      'og.site_name': 'Newsletter Name',
      'twitter.card': 'summary_large_image',
      'article:author': 'Editor Name',
      'article:published_time': '2024-01-15T10:00:00Z',
      'twitter:label1': 'Subscribers',
      'twitter:data1': '10K+',
      'schema.type': 'Article',
      'schema.data': {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Newsletter Issue #123: Main Topic',
        'description': 'Brief summary of this issue and what readers will learn.',
        'author': {
          '@type': 'Person',
          'name': 'Editor Name'
        },
        'datePublished': '2024-01-15',
        'publisher': {
          '@type': 'Organization',
          'name': 'Newsletter Name'
        },
        'image': 'https://example.com/newsletter-header.jpg'
      }
    },
    notes: 'Newsletter archives should include issue numbers and publication dates. Show subscriber count to build credibility. Use branded header images for consistency across issues.'
  }
];

function initTemplates() {
  const grid = document.getElementById('templatesGrid');
  if (!grid) return;

  grid.innerHTML = TEMPLATES.map(tpl => `
    <div class="template-card" data-template="${tpl.id}">
      <div class="template-icon">${tpl.icon}</div>
      <div class="template-title">${escHtml(tpl.title)}</div>
      <div class="template-desc">${escHtml(tpl.desc)}</div>
      <div class="template-tags">
        ${tpl.tags.map(tag => `<span class="template-tag">${escHtml(tag)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  // Add click handlers
  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => applyTemplate(card.dataset.template));
  });
}

function applyTemplate(templateId) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template || !currentData) return;

  // Apply template values to editor state
  Object.entries(template.values).forEach(([key, value]) => {
    editorState.edited[key] = value;
  });

  // Update form
  populateEditorForm();

  // Update modified classes
  document.querySelectorAll('.editor-input, .editor-select').forEach(el => {
    const tag = el.dataset.tag;
    if (tag && editorState.edited[tag] !== editorState.original[tag]) {
      el.classList.add('modified');
    }
  });

  // Update previews
  updatePreviewsWithEdits();

  showToast(`Applied "${template.title}" template`, 2000);

  // Switch to editor tab
  switchTab('editor');
}

// ── Cache Hub ──
function initCacheHub() {
  // Update cache hub links when currentData changes
  if (!currentData) return;

  const url = encodeURIComponent(currentData.finalUrl || currentData.url || '');

  document.getElementById('cacheFb')?.setAttribute('href', `https://developers.facebook.com/tools/debug/?q=${url}`);
  document.getElementById('cacheTwitter')?.setAttribute('href', `https://cards-dev.twitter.com/validator`);
  document.getElementById('cacheLinkedin')?.setAttribute('href', `https://www.linkedin.com/post-inspector/`);
  document.getElementById('cacheWhatsapp')?.setAttribute('href', `https://faq.whatsapp.com/general/how-to-create-click-to-chat-link`);
}

async function handleFbPurge() {
  if (!currentData) return;

  const token = document.getElementById('fbAppToken')?.value;
  if (!token) {
    showToast('Please enter a Facebook App Token', 2000);
    return;
  }

  const url = currentData.finalUrl || currentData.url;
  if (!url) {
    showToast('No URL available', 2000);
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/?id=${encodeURIComponent(url)}&scrape=true&access_token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (data.error) {
      showToast('Error: ' + data.error.message, 3000);
    } else {
      showToast('Facebook cache purged successfully!', 2000);
    }
  } catch (err) {
    showToast('Failed to purge Facebook cache', 2000);
  }
}

// ── Platform Customization ──
function loadPlatformPrefs() {
  const saved = localStorage.getItem('vista-platform-prefs');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      platformPrefs.favorites = new Set(parsed.favorites || []);
      platformPrefs.hidden = new Set(parsed.hidden || []);
      platformPrefs.columnCount = parsed.columnCount || 3;
      platformPrefs.smartOrdering = parsed.smartOrdering !== false;
      platformPrefs.cardOrder = parsed.cardOrder || {};
    } catch (e) {
      console.warn('Failed to load platform preferences', e);
    }
  }

  updateColumnLayoutUI();
  updateFavoritesList();
  updateHiddenList();
}

function savePlatformPrefs() {
  const prefs = {
    favorites: Array.from(platformPrefs.favorites),
    hidden: Array.from(platformPrefs.hidden),
    columnCount: platformPrefs.columnCount,
    smartOrdering: platformPrefs.smartOrdering,
    cardOrder: platformPrefs.cardOrder
  };
  localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
}

function setColumnLayout(count) {
  platformPrefs.columnCount = count;
  savePlatformPrefs();
  updateColumnLayoutUI();

  // Update grid layout
  if (previewGrid) {
    previewGrid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
  }
}

function updateColumnLayoutUI() {
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.columns) === platformPrefs.columnCount);
  });
}

function toggleFavorite(pid) {
  if (platformPrefs.favorites.has(pid)) {
    platformPrefs.favorites.delete(pid);
  } else {
    platformPrefs.favorites.add(pid);
  }
  savePlatformPrefs();
  updateFavoritesList();
}

function toggleHidden(pid) {
  if (platformPrefs.hidden.has(pid)) {
    platformPrefs.hidden.delete(pid);
  } else {
    platformPrefs.hidden.add(pid);
  }
  savePlatformPrefs();
  updateHiddenList();
  renderPreviews(currentData); // Re-render to apply hiding
}

function updateFavoritesList() {
  const list = document.getElementById('favoritesList');
  if (!list) return;

  if (platformPrefs.favorites.size === 0) {
    list.innerHTML = '<p class="empty-state">No favorites yet</p>';
    return;
  }

  list.innerHTML = Array.from(platformPrefs.favorites).map(pid => `
    <div class="platform-item">
      <span class="platform-item-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
      <span class="platform-item-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
      <button class="platform-item-remove" data-pid="${pid}">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
  });
}

function updateHiddenList() {
  const list = document.getElementById('hiddenPlatformsList');
  if (!list) return;

  if (platformPrefs.hidden.size === 0) {
    list.innerHTML = '<p class="empty-state">No hidden platforms</p>';
    return;
  }

  list.innerHTML = Array.from(platformPrefs.hidden).map(pid => `
    <div class="platform-item">
      <span class="platform-item-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
      <span class="platform-item-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
      <button class="platform-item-remove" data-pid="${pid}">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
  });
}

function exportPreferences() {
  const prefs = {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: Array.from(platformPrefs.favorites),
    hidden: Array.from(platformPrefs.hidden),
    columnCount: platformPrefs.columnCount,
    smartOrdering: platformPrefs.smartOrdering
  };

  const blob = new Blob([JSON.stringify(prefs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vista-preferences.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Preferences exported', 2000);
}

function importPreferences(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const prefs = JSON.parse(event.target.result);
      platformPrefs.favorites = new Set(prefs.favorites || []);
      platformPrefs.hidden = new Set(prefs.hidden || []);
      platformPrefs.columnCount = prefs.columnCount || 3;
      platformPrefs.smartOrdering = prefs.smartOrdering !== false;

      savePlatformPrefs();
      updateColumnLayoutUI();
      updateFavoritesList();
      updateHiddenList();

      if (currentData) {
        renderPreviews(currentData);
      }

      showToast('Preferences imported', 2000);
    } catch (err) {
      showToast('Failed to import preferences', 2000);
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset input
}

// ── What If Toggle ──
let whatIfMode = false;
let disabledTags = new Set();

function toggleWhatIfMode() {
  whatIfMode = !whatIfMode;

  const btn = document.getElementById('whatIfToggleBtn');
  if (btn) {
    btn.classList.toggle('active', whatIfMode);
    btn.textContent = whatIfMode ? '✓ What If On' : '🔍 What If';
  }

  if (whatIfMode) {
    showWhatIfPanel();
  } else {
    disabledTags.clear();
    if (currentData) {
      renderPreviews(currentData);
    }
  }
}

function showWhatIfPanel() {
  // Show a modal or panel with tag toggles
  const panel = document.createElement('div');
  panel.className = 'what-if-panel';
  panel.id = 'whatIfPanel';
  panel.innerHTML = `
    <div class="what-if-header">
      <h4>What If Mode</h4>
      <p class="what-if-subtitle">Toggle tags off to see fallback behavior</p>
      <button class="what-if-close" id="whatIfClose">&times;</button>
    </div>
    <div class="what-if-body">
      <div class="what-if-section">
        <h5>Open Graph Tags</h5>
        <label class="what-if-toggle"><input type="checkbox" data-tag="og.title" checked /> og:title</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="og.description" checked /> og:description</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="og.image" checked /> og:image</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="og.type" checked /> og:type</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="og.url" checked /> og:url</label>
      </div>
      <div class="what-if-section">
        <h5>Twitter Card Tags</h5>
        <label class="what-if-toggle"><input type="checkbox" data-tag="twitter.card" checked /> twitter:card</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="twitter.title" checked /> twitter:title</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="twitter.description" checked /> twitter:description</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="twitter.image" checked /> twitter:image</label>
      </div>
      <div class="what-if-section">
        <h5>Basic Tags</h5>
        <label class="what-if-toggle"><input type="checkbox" data-tag="title" checked /> title</label>
        <label class="what-if-toggle"><input type="checkbox" data-tag="description" checked /> description</label>
      </div>
    </div>
    <div class="what-if-footer">
      <button class="action-btn" id="whatIfReset">Reset All</button>
      <button class="action-btn primary" id="whatIfApply">Update Previews</button>
    </div>
  `;

  document.body.appendChild(panel);

  // Add event listeners
  panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) {
        disabledTags.add(cb.dataset.tag);
      } else {
        disabledTags.delete(cb.dataset.tag);
      }
    });
  });

  document.getElementById('whatIfClose')?.addEventListener('click', closeWhatIfPanel);
  document.getElementById('whatIfReset')?.addEventListener('click', resetWhatIfToggles);
  document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
}

function closeWhatIfPanel() {
  const panel = document.getElementById('whatIfPanel');
  if (panel) {
    panel.remove();
  }
  whatIfMode = false;
  const btn = document.getElementById('whatIfToggleBtn');
  if (btn) {
    btn.classList.remove('active');
    btn.textContent = '🔍 What If';
  }
}

function resetWhatIfToggles() {
  document.querySelectorAll('#whatIfPanel .what-if-toggle input').forEach(cb => {
    cb.checked = true;
  });
  disabledTags.clear();
}

function applyWhatIfChanges() {
  if (!currentData) return;

  // Create modified meta with disabled tags removed
  const modifiedMeta = { ...currentData.meta };

  disabledTags.forEach(tag => {
    const parts = tag.split('.');
    if (parts.length === 1) {
      delete modifiedMeta[tag];
    } else {
      const [namespace, key] = parts;
      if (modifiedMeta[namespace]) {
        const temp = { ...modifiedMeta[namespace] };
        delete temp[key];
        modifiedMeta[namespace] = Object.keys(temp).length > 0 ? temp : undefined;
      }
    }
  });

  // Re-render with modified data
  const modifiedData = { ...currentData, meta: modifiedMeta };
  renderPreviews(modifiedData);

  // Announce score change for screen readers
  const tagCount = disabledTags.size;
  announce(`What If mode applied. ${tagCount} tag${tagCount > 1 ? 's' : ''} disabled. Preview cards updated to show fallback behavior.`);

  // Show warnings for missing tags
  showMissingTagWarnings(modifiedMeta);

  closeWhatIfPanel();
  showToast('Previews updated with What If changes', 2000);
}

function showMissingTagWarnings(meta) {
  // Add warning indicators to platforms affected by missing tags
  const warnings = [];

  if (!meta.og?.title && !meta.title) {
    warnings.push('Missing: og:title or title');
  }
  if (!meta.og?.description && !meta.description) {
    warnings.push('Missing: og:description or description');
  }
  if (!meta.og?.image) {
    warnings.push('Missing: og:image');
  }

  if (warnings.length > 0) {
    showToast('What If: ' + warnings.join(', '), 4000);
  }
}

// Add event listener for What If button
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);

// ── Inline Card Editing ──
function initInlineEditing() {
  // Add contenteditable to card titles and descriptions
  document.addEventListener('click', (e) => {
    const target = e.target;

    // Check if clicking on an editable element
    if (target.classList.contains('editable-title') || target.classList.contains('editable-desc')) {
      if (!target.isContentEditable) {
        target.contentEditable = 'true';
        target.dataset.originalContent = target.textContent;
        target.focus();
        document.execCommand('selectAll', false, null);
      }
    }
  });

  document.addEventListener('blur', (e) => {
    const target = e.target;
    if (target.classList.contains('editable-title') || target.classList.contains('editable-desc')) {
      if (target.isContentEditable) {
        target.contentEditable = 'false';
        const newContent = target.textContent;
        const originalContent = target.dataset.originalContent;

        if (newContent !== originalContent) {
          // Sync to editor
          syncInlineEditToEditor(target.dataset.tag, newContent);
        }

        delete target.dataset.originalContent;
      }
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('editable-title') || e.target.classList.contains('editable-desc')) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.target.blur();
      }
      if (e.key === 'Escape') {
        e.target.textContent = e.target.dataset.originalContent || '';
        e.target.blur();
      }
    }
  });
}

function syncInlineEditToEditor(tag, value) {
  if (!tag) return;

  // Update editor state
  editorState.edited[tag] = value;
  editorState.dirty = true;

  // Update editor form if visible
  const formField = document.querySelector(`[data-tag="${tag}"]`);
  if (formField && formField.tagName !== 'DIV') {
    formField.value = value;
    formField.classList.add('modified');
  }

  // Update all cards with this tag
  document.querySelectorAll(`[data-tag="${tag}"].editable-title, [data-tag="${tag}"].editable-desc`).forEach(el => {
    el.textContent = value;
  });

  showToast('Card updated in editor', 1500);
}

// ── Diagnostic Tracking ──
let fixedDiagnostics = new Set();

function initDiagnosticTracking() {
  // Track which diagnostics have been fixed
  if (!currentData?.diagnostics) return;

  fixedDiagnostics.clear();

  // Add "Fix" buttons to diagnostics
  document.querySelectorAll('.diag-item').forEach((item, index) => {
    if (item.dataset.fixed === 'true') return;

    const fixBtn = document.createElement('button');
    fixBtn.className = 'diag-fix-btn';
    fixBtn.innerHTML = '&#10003; Fix';
    fixBtn.dataset.index = index;

    fixBtn.addEventListener('click', () => applyDiagnosticFix(index));

    const actionsDiv = item.querySelector('.diag-actions') || document.createElement('div');
    actionsDiv.className = 'diag-actions';
    actionsDiv.appendChild(fixBtn);
    item.appendChild(actionsDiv);
  });
}

function applyDiagnosticFix(index) {
  if (!currentData?.diagnostics) return;

  const diagnostic = currentData.diagnostics[index];
  if (!diagnostic) return;

  // Extract suggested value from diagnostic
  const suggestedValue = extractSuggestedValue(diagnostic);
  if (!suggestedValue) {
    showToast('No suggested fix available', 2000);
    return;
  }

  // Apply to editor
  const tagMatch = diagnostic.fix?.match(/meta\s+(\S+)\s*=/);
  if (tagMatch) {
    const tag = tagMatch[1].replace(/['"]/g, '');
    const normalizedTag = normalizeTagKey(tag);

    editorState.edited[normalizedTag] = suggestedValue;
    editorState.dirty = true;

    // Update form
    const formField = document.querySelector(`[data-tag="${normalizedTag}"]`);
    if (formField) {
      formField.value = suggestedValue;
      formField.classList.add('modified');
    }

    // Mark diagnostic as fixed
    fixedDiagnostics.add(index);

    // Update UI
    const diagItem = document.querySelectorAll('.diag-item')[index];
    if (diagItem) {
      diagItem.classList.add('fixed');
      diagItem.dataset.fixed = 'true';
      const fixBtn = diagItem.querySelector('.diag-fix-btn');
      if (fixBtn) fixBtn.remove();
    }

    // Update previews
    updatePreviewsWithEdits();

    // Update score
    recalculateScore();

    showToast('Fix applied to editor', 2000);
  }
}

function extractSuggestedValue(diagnostic) {
  // Try to extract suggested value from diagnostic message or fix
  const fix = diagnostic.fix || '';
  const contentMatch = fix.match(/content="([^"]+)"/);
  if (contentMatch) return contentMatch[1];

  const valueMatch = fix.match(/value="([^"]+)"/);
  if (valueMatch) return valueMatch[1];

  // Try message
  const msg = diagnostic.msg || '';
  const suggestedMatch = msg.match(/suggested[:\s]+"([^"]+)"/i);
  if (suggestedMatch) return suggestedMatch[1];

  return null;
}

function normalizeTagKey(tag) {
  // Convert various tag formats to our internal format
  const mapping = {
    'og:title': 'og.title',
    'og:description': 'og.description',
    'og:image': 'og.image',
    'og:type': 'og.type',
    'twitter:card': 'twitter.card',
    'twitter:title': 'twitter.title',
    'twitter:description': 'twitter.description',
    'twitter:image': 'twitter.image',
    'title': 'title',
    'description': 'description'
  };
  return mapping[tag] || tag;
}

function recalculateScore() {
  if (!currentData) return;

  // Simple score recalculation - in a real app, this would call the backend
  const totalDiagnostics = currentData.diagnostics?.length || 0;
  const fixedCount = fixedDiagnostics.size;
  const remaining = totalDiagnostics - fixedCount;

  if (remaining > 0) {
    showToast(`${fixedCount} issue${fixedCount !== 1 ? 's' : ''} fixed. ${remaining} remaining.`, 2000);
  } else {
    showToast('All diagnostics fixed! 🎉', 2000);
    triggerConfetti();
  }
}

// ── Smart Platform Ordering ──
function detectPageType(meta) {
  if (!meta) return 'website';

  // Check og:type first
  const ogType = meta.og?.type?.toLowerCase();
  if (ogType) {
    if (ogType.includes('article')) return 'article';
    if (ogType.includes('product')) return 'product';
    if (ogType.includes('video')) return 'video';
    if (ogType.includes('profile')) return 'profile';
  }

  // Check schema.org
  if (meta.schema) {
    const schema = JSON.stringify(meta.schema).toLowerCase();
    if (schema.includes('article') || schema.includes('blogposting')) return 'article';
    if (schema.includes('product')) return 'product';
    if (schema.includes('video')) return 'video';
  }

  // Check URL patterns
  const url = (meta.og?.url || meta.canonical || '').toLowerCase();
  if (url.includes('/blog/') || url.includes('/article/') || url.includes('/post/')) return 'article';
  if (url.includes('/product/') || url.includes('/shop/') || url.includes('/item/')) return 'product';

  return 'website';
}

function getPlatformOrderForPageType(pageType) {
  const orders = {
    article: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon'],
    product: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin'],
    video: ['twitter', 'facebook', 'youtube', 'tiktok', 'instagram'],
    website: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']
  };

  return orders[pageType] || orders.website;
}

function applySmartOrdering() {
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] ===== FUNCTION START =====');
  }

  // Early exit conditions
  if (!currentData) {
    if (DEBUG_SMART_ORDERING) {
      console.log('[applySmartOrdering] Early exit: no currentData available');
    }
    return;
  }
  if (!platformPrefs.smartOrdering) {
    if (DEBUG_SMART_ORDERING) {
      console.log('[applySmartOrdering] Early exit: smart ordering disabled in preferences');
    }
    return;
  }

  // Log items being processed
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] Items (currentData):', {
      hasData: !!currentData,
      hasMeta: !!currentData?.meta,
      ogType: currentData?.meta?.og?.type,
      canonical: currentData?.meta?.canonical,
      url: currentData?.meta?.canonical || currentData?.meta?.og?.url || '(none)'
    });

    // Log context/flag parameters
    console.log('[applySmartOrdering] Context/Flag parameters:', {
      smartOrderingEnabled: platformPrefs.smartOrdering,
      hasPagePreferences: !!platformPrefs.pageType
    });
  }

  const pageType = detectPageType(currentData.meta);
  if (DEBUG_SMART_ORDERING) {
    console.log(`[applySmartOrdering] Page type detected: "${pageType}"`);
  }

  const preferredOrder = getPlatformOrderForPageType(pageType);
  if (DEBUG_SMART_ORDERING) {
    console.log(`[applySmartOrdering] Preferred platform order for "${pageType}":`, preferredOrder);
  }

  // Log input platform cards array with scores BEFORE reordering
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] ===== INPUT STATE (before reordering) =====');
    PLATFORM_GROUPS.forEach((group, groupIndex) => {
      console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}" [${group.id}]:`);
      console.log('[applySmartOrdering]   Platform order BEFORE:', group.platforms);

      // Log computed scores for each platform in this group
      group.platforms.forEach(pid => {
        const scoreData = currentData?.scoring?.scores?.[pid];
        if (scoreData) {
          console.log(`[applySmartOrdering]   - ${pid}:`, {
            score: scoreData.score,
            grade: scoreData.grade,
            passing: scoreData.passing?.length || 0,
            warning: scoreData.warning?.length || 0,
            failing: scoreData.failing?.length || 0
          });
        } else {
          console.log(`[applySmartOrdering]   - ${pid}: (no score data)`);
        }
      });
    });
  }

  // Update platform groups to show relevance
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] ===== REORDERING PLATFORMS =====');
  }

  PLATFORM_GROUPS.forEach((group, groupIndex) => {
    const originalOrder = [...group.platforms];
    group.platforms.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Update platformPrefs.cardOrder to persist the smart ordering
    // This ensures renderPreviews() uses the new smart order instead of custom order
    if (!platformPrefs.cardOrder) {
      platformPrefs.cardOrder = {};
    }
    platformPrefs.cardOrder[group.id] = [...group.platforms];

    if (DEBUG_SMART_ORDERING) {
      if (JSON.stringify(originalOrder) !== JSON.stringify(group.platforms)) {
        console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}" REORDERED:`, {
          from: originalOrder,
          to: group.platforms
        });
      } else {
        console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}": no change needed`);
      }
    }
  });

  // Log output array AFTER reordering
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] ===== OUTPUT STATE (after reordering) =====');
    PLATFORM_GROUPS.forEach((group, groupIndex) => {
      console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}" [${group.id}]:`);
      console.log('[applySmartOrdering]   Platform order AFTER:', group.platforms);

      // Show how order changed
      const storedOrder = platformPrefs.cardOrder?.[group.id];
      if (storedOrder) {
        console.log('[applySmartOrdering]   Stored in cardOrder:', storedOrder);
      }
    });
  }

  // Save the updated preferences to persist across page refreshes
  try {
    localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
    if (DEBUG_SMART_ORDERING) {
      console.log('[applySmartOrdering] Platform preferences saved to localStorage');
    }
  } catch (e) {
    console.error('[applySmartOrdering] Failed to save preferences:', e);
  }

  // Re-render previews
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] Re-rendering previews with new platform order...');
  }
  renderPreviews(currentData);
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] Preview re-render complete');
  }

  showToast(`Page type detected: ${pageType}. Platforms reordered.`, 2000);

  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] ===== FUNCTION COMPLETE ✅ =====');
  }
}

// ── Initialize inline editing on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  initInlineEditing();
});

// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};

// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = function(data) {
  originalHandleResult2(data);
  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] about to call applySmartOrdering after 200ms delay');
    setTimeout(applySmartOrdering, 200);
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }
};

// ── Command Palette ──
const COMMANDS = [
  { id: 'inspect', icon: '🔍', label: 'Inspect URL', category: 'Actions', shortcut: '↵', action: () => switchMode('url') },
  { id: 'paste', icon: '📋', label: 'Paste HTML', category: 'Actions', shortcut: '', action: () => switchMode('paste') },
  { id: 'compare', icon: '⚖️', label: 'Compare URLs', category: 'Actions', shortcut: '', action: () => switchMode('compare') },
  { id: 'sitemap', icon: '🗺️', label: 'Crawl Sitemap', category: 'Actions', shortcut: '', action: () => switchMode('sitemap') },
  { id: 'reset', icon: '🔄', label: 'New Inspection', category: 'Actions', shortcut: '', action: resetToHero },
  { id: 'tab-previews', icon: '👁️', label: 'Go to Previews', category: 'Tabs', shortcut: '', action: () => switchTab('previews') },
  { id: 'tab-editor', icon: '✏️', label: 'Go to Editor', category: 'Tabs', shortcut: '', action: () => switchTab('editor') },
  { id: 'tab-diagnostics', icon: '🔧', label: 'Go to Diagnostics', category: 'Tabs', shortcut: '', action: () => switchTab('diagnostics') },
  { id: 'tab-codesnippet', icon: '📝', label: 'Go to Code Snippet', category: 'Tabs', shortcut: '', action: () => switchTab('codesnippet') },
  { id: 'tab-templates', icon: '📦', label: 'Go to Templates', category: 'Tabs', shortcut: '', action: () => switchTab('templates') },
  { id: 'tab-cachehub', icon: '🗑️', label: 'Go to Cache Hub', category: 'Tabs', shortcut: '', action: () => switchTab('cachehub') },
  { id: 'tab-customize', icon: '⚙️', label: 'Go to Customize', category: 'Tabs', shortcut: '', action: () => switchTab('customization') },
  { id: 'theme', icon: '🌓', label: 'Toggle Dark/Light Mode', category: 'Settings', shortcut: '', action: toggleGlobalTheme },
  { id: 'export', icon: '💾', label: 'Export Preferences', category: 'Settings', shortcut: '', action: exportPreferences },
];

function initCommandPalette() {
  // Create command palette overlay
  const overlay = document.createElement('div');
  overlay.className = 'command-palette-overlay hidden';
  overlay.id = 'commandPalette';
  overlay.innerHTML = `
    <div class="command-palette">
      <input type="text" class="command-palette-input" id="commandInput" placeholder="Type a command or search..." autocomplete="off" />
      <div class="command-palette-results" id="commandResults"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Add event listeners
  const input = document.getElementById('commandInput');
  input.addEventListener('input', filterCommands);
  input.addEventListener('keydown', handleCommandKeydown);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCommandPalette();
  });

  // Global keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if (e.key === 'Escape') {
      closeCommandPalette();
    }
  });
}

function toggleCommandPalette() {
  const palette = document.getElementById('commandPalette');
  if (!palette) return;

  commandPaletteOpen = !commandPaletteOpen;

  if (commandPaletteOpen) {
    palette.classList.remove('hidden');
    document.getElementById('commandInput').focus();
    renderCommands(COMMANDS);
  } else {
    closeCommandPalette();
  }
}

function closeCommandPalette() {
  const palette = document.getElementById('commandPalette');
  if (palette) palette.classList.add('hidden');
  commandPaletteOpen = false;
  commandPaletteSelectedIndex = 0;
}

function renderCommands(commands) {
  const results = document.getElementById('commandResults');
  if (!results) return;

  const grouped = {};
  commands.forEach(cmd => {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  });

  let html = '';
  let index = 0;

  Object.entries(grouped).forEach(([category, cmds]) => {
    html += `<div class="command-palette-category">${escHtml(category)}</div>`;
    cmds.forEach(cmd => {
      const isRecent = recentCommands.includes(cmd.id);
      html += `
        <div class="command-palette-item ${index === commandPaletteSelectedIndex ? 'selected' : ''} ${isRecent ? 'recent' : ''}" data-cmd="${cmd.id}">
          <span class="command-palette-item-icon">${cmd.icon}</span>
          <span class="command-palette-item-label">${escHtml(cmd.label)}</span>
          ${cmd.shortcut ? `<span class="command-palette-item-shortcut">${cmd.shortcut}</span>` : ''}
        </div>
      `;
      index++;
    });
  });

  results.innerHTML = html;

  // Add click handlers
  results.querySelectorAll('.command-palette-item').forEach(item => {
    item.addEventListener('click', () => executeCommand(item.dataset.cmd));
  });
}

function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}

function handleCommandKeydown(e) {
  const items = document.querySelectorAll('.command-palette-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    commandPaletteSelectedIndex = Math.min(commandPaletteSelectedIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    commandPaletteSelectedIndex = Math.max(commandPaletteSelectedIndex - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const selected = items[commandPaletteSelectedIndex];
    if (selected) {
      executeCommand(selected.dataset.cmd);
    }
    return;
  }

  items.forEach((item, i) => {
    item.classList.toggle('selected', i === commandPaletteSelectedIndex);
  });
}

function executeCommand(id) {
  const cmd = COMMANDS.find(c => c.id === id);
  if (!cmd) return;

  // Add to recent commands
  recentCommands = recentCommands.filter(c => c !== id);
  recentCommands.unshift(id);
  recentCommands = recentCommands.slice(0, 5);

  closeCommandPalette();
  cmd.action();
}

// ── Global Keyboard Shortcuts ──
function initGlobalKeyboardShortcuts() {
  // Helper: check if we should ignore shortcuts (when typing in input/textarea)
  function shouldIgnoreShortcut(e) {
    const tag = e.target.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
    const isContentEditable = e.target.isContentEditable;
    return isInput || isContentEditable;
  }

  // Helper: get all focusable cards in current grid
  function getFocusableCards() {
    return Array.from(document.querySelectorAll('.platform-card'));
  }

  // Helper: focus a specific card by index
  function focusCard(index) {
    const cards = getFocusableCards();
    if (cards.length === 0) return;

    // Update focused card index
    focusedCardIndex = index;
    focusedCardPids = cards.map(c => c.dataset.pid);

    // Clamp index
    if (focusedCardIndex < 0) focusedCardIndex = cards.length - 1;
    if (focusedCardIndex >= cards.length) focusedCardIndex = 0;

    const card = cards[focusedCardIndex];
    card.setAttribute('tabindex', '0');
    card.focus();

    // Update visual focus state
    cards.forEach((c, i) => {
      c.classList.toggle('focused', i === focusedCardIndex);
    });
  }

  // Helper: unfocus all cards
  function unfocusAllCards() {
    const cards = getFocusableCards();
    cards.forEach(c => {
      c.setAttribute('tabindex', '-1');
      c.classList.remove('focused');
    });
    focusedCardIndex = -1;
    focusedCardPids = [];
  }

  // Helper: save editor state to undo stack
  function saveEditorUndoState() {
    if (!editorState.dirty) return;
    editorUndoStack.push({ ...editorState.edited });
    // Limit stack size
    if (editorUndoStack.length > 50) editorUndoStack.shift();
  }

  // Global keydown handler
  document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in input/textarea (unless it's a specific shortcut)
    if (shouldIgnoreShortcut(e)) {
      // Cmd+Z and Cmd+Shift+[CS] should work even in inputs
      if (!((e.metaKey || e.ctrlKey) && (e.key === 'z' || (e.shiftKey && (e.key === 'C' || e.key === 'S'))))) {
        return;
      }
    }

    const cmdOrCtrl = e.metaKey || e.ctrlKey;

    // '/' → focus URL input
    if (e.key === '/' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      unfocusAllCards();
      switchMode('url');
      urlInput.focus();
      urlInput.select();
      return;
    }

    // '1' '2' '3' '4' → switch tabs
    if (!cmdOrCtrl && !e.shiftKey && !e.altKey && '1234'.includes(e.key)) {
      const tabMap = { '1': 'previews', '2': 'diagnostics', '3': 'rawtags', '4': 'cachehub' };
      const tabId = tabMap[e.key];
      if (tabId) {
        e.preventDefault();
        unfocusAllCards();
        switchTab(tabId);
      }
      return;
    }

    // 'E' → toggle Editor mode (switch to Editor tab)
    if (e.key === 'e' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      unfocusAllCards();
      switchTab('editor');
      return;
    }

    // 'C' → toggle Compare mode (switch to compare mode)
    if (e.key === 'c' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      unfocusAllCards();
      switchMode('compare');
      return;
    }

    // Arrow keys ← → → navigate between cards when grid is focused
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      const cards = getFocusableCards();
      if (cards.length > 0 && document.activeElement.classList.contains('platform-card')) {
        e.preventDefault();
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        focusCard(focusedCardIndex + direction);
      }
      return;
    }

    // Enter → expand focused card (toggle context view)
    if (e.key === 'Enter' && !cmdOrCtrl && !e.shiftKey && !e.altKey) {
      if (focusedCardIndex >= 0) {
        const card = getFocusableCards()[focusedCardIndex];
        if (card) {
          const pid = card.dataset.pid;
          if (pid) {
            e.preventDefault();
            toggleCardContext(pid);
          }
        }
      }
      return;
    }

    // Cmd+Shift+C → copy code snippet
    if (cmdOrCtrl && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyCodeSnippet();
      return;
    }

    // Cmd+Shift+S → copy share link
    if (cmdOrCtrl && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      shareResults();
      return;
    }

    // Cmd+Z → undo last edit (in editor)
    if (cmdOrCtrl && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      if (editorUndoStack.length > 0) {
        const previousState = editorUndoStack.pop();
        editorState.edited = previousState;
        editorState.dirty = true;
        populateEditorForm();
        updateEditorCharCounts();
        updatePreviewsWithEdits();
        showToast('Undo successful');
      }
      return;
    }
  });

  // Save state before editor changes for undo
  const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
  editorInputs.forEach(el => {
    el.addEventListener('focus', () => {
      if (editorState.dirty) {
        saveEditorUndoState();
      }
    });
  });

  // Make cards focusable with mouse click
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.platform-card');
    if (card) {
      const cards = getFocusableCards();
      const index = cards.indexOf(card);
      if (index >= 0) {
        focusCard(index);
      }
    } else {
      unfocusAllCards();
    }
  });

  // Unfocus cards when switching tabs
  const originalSwitchTab = switchTab;
  switchTab = function(tabId) {
    originalSwitchTab(tabId);
    unfocusAllCards();
  };
}

// ── Feedback widget ──
function initFeedbackWidget() {
  const widget = document.getElementById('feedbackWidget');
  if (!widget) return;
  widget.classList.remove('hidden');

  const fab = document.getElementById('feedbackFab');
  const panel = document.getElementById('feedbackPanel');
  const closeBtn = document.getElementById('feedbackPanelClose');
  const cancelBtn = document.getElementById('feedbackCancelBtn');
  const submitBtn = document.getElementById('feedbackSubmitBtn');
  const ratingGroup = document.getElementById('feedbackRating');
  const contextEl = document.getElementById('feedbackContext');

  let selectedRating = 0;

  function openPanel() {
    panel.classList.remove('hidden');
    fab.setAttribute('aria-expanded', 'true');
    // Populate context with currently inspected URL if available
    const inspectedUrl = currentData?.url || currentData?.inspectedUrl || null;
    if (inspectedUrl) {
      contextEl.textContent = 'Context: ' + inspectedUrl;
      contextEl.classList.add('has-context');
    } else {
      contextEl.textContent = '';
      contextEl.classList.remove('has-context');
    }
    closeBtn.focus();
  }

  function closePanel() {
    panel.classList.add('hidden');
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  fab.addEventListener('click', () => {
    if (panel.classList.contains('hidden')) {
      openPanel();
    } else {
      closePanel();
    }
  });

  closeBtn.addEventListener('click', closePanel);
  cancelBtn.addEventListener('click', closePanel);

  // Star rating interaction
  ratingGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.rating-btn');
    if (!btn) return;
    selectedRating = parseInt(btn.dataset.rating, 10);
    Array.from(ratingGroup.querySelectorAll('.rating-btn')).forEach((b, i) => {
      const active = i < selectedRating;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  });

  // Keyboard: close panel on Escape
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  submitBtn.addEventListener('click', () => {
    const category = document.getElementById('feedbackCategory').value;
    const comment = document.getElementById('feedbackComment').value.trim();

    const payload = {
      rating: selectedRating || null,
      category: category || null,
      comment: comment || null,
      context: contextEl.textContent || null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Log structured feedback to console for agent pickup
    console.log('[vista:feedback]', JSON.stringify(payload));

    // Show success message
    const body = panel.querySelector('.feedback-panel-body');
    body.innerHTML = '<div class="feedback-success">&#10003; Thank you for your feedback!</div>';
    setTimeout(closePanel, 1800);
  });
}

// ── Card Drag and Drop ──
let draggedCard = null;
let draggedFromGroup = null;

function initCardDragAndDrop() {
  const cards = document.querySelectorAll('.platform-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragStart(e) {
  draggedCard = this;
  draggedFromGroup = this.dataset.groupId;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.platform-card').forEach(card => {
    card.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedCard) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedCard !== this) {
    const toGroup = this.dataset.groupId;
    const fromGroup = draggedFromGroup;

    // Get all cards in both groups
    const fromRow = document.querySelector(`.cards-row[data-group-id="${fromGroup}"]`);
    const toRow = document.querySelector(`.cards-row[data-group-id="${toGroup}"]`);

    if (!fromRow || !toRow) return false;

    const fromCards = Array.from(fromRow.querySelectorAll('.platform-card'));
    const toCards = Array.from(toRow.querySelectorAll('.platform-card'));

    // Build new order arrays
    const fromOrder = fromCards.map(c => c.dataset.pid);
    const toOrder = toCards.map(c => c.dataset.pid);

    // Remove dragged card from source order
    const draggedPid = draggedCard.dataset.pid;
    const newFromOrder = fromOrder.filter(pid => pid !== draggedPid);

    // Find insertion point in target
    const targetPid = this.dataset.pid;
    const targetIndex = toOrder.indexOf(targetPid);
    const newToOrder = [...toOrder];
    newToOrder.splice(targetIndex, 0, draggedPid);

    // Update platformPrefs
    if (fromGroup === toGroup) {
      // Same group - just reorder
      platformPrefs.cardOrder[fromGroup] = newToOrder;
    } else {
      // Different groups - move between groups
      platformPrefs.cardOrder[fromGroup] = newFromOrder;
      platformPrefs.cardOrder[toGroup] = newToOrder;
    }

    savePlatformPrefs();

    // Re-render to show new order
    renderPreviews(currentData);
  }

  return false;
}

// ── Card Context Menu ──
let contextMenu = null;
let contextMenuTargetPid = null;
let contextMenuTargetGroupId = null;

function initContextMenu() {
  // Create context menu element if it doesn't exist
  if (!contextMenu) {
    contextMenu = document.createElement('div');
    contextMenu.id = 'cardContextMenu';
    contextMenu.className = 'card-context-menu hidden';
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="copy-screenshot">
        <span class="context-menu-icon">&#128190;</span>
        <span>Copy screenshot</span>
      </div>
      <div class="context-menu-item" data-action="open-editor">
        <span class="context-menu-icon">&#9998;</span>
        <span>Open in editor</span>
      </div>
      <div class="context-menu-item" data-action="view-raw">
        <span class="context-menu-icon">&#128196;</span>
        <span>View raw tags</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="toggle-hidden">
        <span class="context-menu-icon">&#128065;</span>
        <span>Hide this platform</span>
      </div>
      <div class="context-menu-item" data-action="toggle-favorite">
        <span class="context-menu-icon">&#11088;</span>
        <span>Star / unstar</span>
      </div>
    `;
    document.body.appendChild(contextMenu);

    // Add click handlers to menu items
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', handleContextMenuAction);
    });
  }

  // Close menu on click elsewhere
  document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
      closeContextMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContextMenu();
    }
  });
}

function showCardContextMenu(e, pid, groupId, data) {
  e.preventDefault();

  // Initialize context menu if needed
  if (!contextMenu) {
    initContextMenu();
  }

  contextMenuTargetPid = pid;
  contextMenuTargetGroupId = groupId;

  // Update "Hide this platform" text based on current state
  const hideItem = contextMenu.querySelector('[data-action="toggle-hidden"] span:last-child');
  const favItem = contextMenu.querySelector('[data-action="toggle-favorite"] span:last-child');

  if (platformPrefs.hidden.has(pid)) {
    hideItem.textContent = 'Show this platform';
  } else {
    hideItem.textContent = 'Hide this platform';
  }

  if (platformPrefs.favorites.has(pid)) {
    favItem.textContent = 'Unstar';
  } else {
    favItem.textContent = 'Star';
  }

  // Position menu
  const x = e.clientX;
  const y = e.clientY;

  // Ensure menu doesn't go off screen
  const menuWidth = 200;
  const menuHeight = 180;
  const maxX = window.innerWidth - menuWidth - 10;
  const maxY = window.innerHeight - menuHeight - 10;

  contextMenu.style.left = Math.min(x, maxX) + 'px';
  contextMenu.style.top = Math.min(y, maxY) + 'px';
  contextMenu.classList.remove('hidden');
}

function closeContextMenu() {
  if (contextMenu) {
    contextMenu.classList.add('hidden');
  }
  contextMenuTargetPid = null;
  contextMenuTargetGroupId = null;
}

function handleContextMenuAction(e) {
  const action = this.dataset.action;
  const pid = contextMenuTargetPid;

  if (!pid) return;

  switch (action) {
    case 'copy-screenshot':
      downloadScreenshot(pid, currentData);
      break;
    case 'open-editor':
      // Switch to editor tab and focus this platform's fields
      const editorTab = document.getElementById('tabnav-editor');
      if (editorTab && !editorTab.classList.contains('hidden')) {
        editorTab.click();
        // Focus the first relevant field
        const firstField = document.querySelector('#editOgTitle, #editTitle');
        if (firstField) firstField.focus();
      }
      break;
    case 'view-raw':
      // Switch to raw tags tab
      const rawTab = document.querySelector('.tab-btn[data-tab="rawtags"]');
      if (rawTab) rawTab.click();
      break;
    case 'toggle-hidden':
      toggleHidden(pid);
      break;
    case 'toggle-favorite':
      toggleFavorite(pid);
      break;
  }

  closeContextMenu();
}

// ── Mobile Swipe & Long-Press Support ──
let longPressTimer = null;
let longPressCard = null;
let longPressData = null;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
const SWIPE_ANGLE_LIMIT = 30; // Maximum angle from horizontal/vertical
const LONG_PRESS_DURATION = 500; // ms

// Check if user prefers reduced motion
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initMobileLongPress() {
  // Use event delegation to handle touch gestures on dynamically added cards
  previewGrid.addEventListener('touchstart', handleTouchStart, { passive: true });
  previewGrid.addEventListener('touchend', handleTouchEnd);
  previewGrid.addEventListener('touchmove', handleTouchMove, { passive: true });
}

function handleTouchStart(e) {
  const card = e.target.closest('.platform-card');
  if (!card) return;

  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();

  longPressCard = card;
  longPressTimer = setTimeout(() => {
    if (longPressCard) {
      const pid = longPressCard.dataset.pid;
      const groupId = longPressCard.dataset.groupId;
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      showCardContextMenu(e, pid, groupId, currentData);
      longPressCard = null;
      longPressTimer = null;
    }
  }, LONG_PRESS_DURATION);
}

function handleTouchEnd(e) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (longPressCard) {
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only process as swipe if movement is significant and quick enough
    if ((absDeltaX > SWIPE_THRESHOLD || absDeltaY > SWIPE_THRESHOLD) && deltaTime < 500) {
      // Calculate angle to determine swipe direction
      const angle = Math.atan2(absDeltaY, absDeltaX) * (180 / Math.PI);

      // Horizontal swipe (angle < 30 degrees from horizontal)
      if (absDeltaX > absDeltaY && angle < SWIPE_ANGLE_LIMIT) {
        handleHorizontalSwipe(deltaX, longPressCard);
      }
      // Vertical swipe down (angle > 60 degrees from horizontal, i.e., closer to vertical)
      else if (absDeltaY > absDeltaX && angle > (90 - SWIPE_ANGLE_LIMIT)) {
        handleVerticalSwipe(deltaY, longPressCard);
      }
    }
  }

  longPressCard = null;
}

function handleTouchMove(e) {
  // Cancel long-press if user moves their finger significantly
  if (longPressTimer) {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Allow small movements for touch accuracy, but cancel on larger movements
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
}

/**
 * Handle horizontal swipe for platform navigation
 * @param {number} deltaX - Horizontal distance (positive = right, negative = left)
 * @param {HTMLElement} card - The card that was swiped
 */
function handleHorizontalSwipe(deltaX, card) {
  const pid = card.dataset.pid;
  const groupId = card.dataset.groupId;

  // Find all cards in the same group
  const group = document.querySelector(`.platform-group[data-group-id="${groupId}"]`);
  if (!group) return;

  const cards = Array.from(group.querySelectorAll('.platform-card'));
  const currentIndex = cards.indexOf(card);
  if (currentIndex === -1) return;

  let targetIndex;

  // Swipe left (negative deltaX) -> next card
  // Swipe right (positive deltaX) -> previous card
  if (deltaX < 0) {
    // Swipe left: go to next card
    targetIndex = currentIndex + 1;
    if (targetIndex >= cards.length) {
      targetIndex = 0; // Wrap to beginning
    }
  } else {
    // Swipe right: go to previous card
    targetIndex = currentIndex - 1;
    if (targetIndex < 0) {
      targetIndex = cards.length - 1; // Wrap to end
    }
  }

  const targetCard = cards[targetIndex];
  if (!targetCard) return;

  // Focus the target card with animation (respect prefers-reduced-motion)
  if (!prefersReducedMotion) {
    // Add visual feedback for the swipe
    card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    card.style.transform = deltaX < 0 ? 'translateX(-20px)' : 'translateX(20px)';
    card.style.opacity = '0.5';

    setTimeout(() => {
      card.style.transform = '';
      card.style.opacity = '';
    }, 200);
  }

  // Focus the target card
  targetCard.focus();
  targetCard.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });

  // Optional: Vibrate for feedback
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/**
 * Handle vertical swipe down to collapse expanded card
 * @param {number} deltaY - Vertical distance (positive = down)
 * @param {HTMLElement} card - The card that was swiped
 */
function handleVerticalSwipe(deltaY, card) {
  // Only respond to swipe down (positive deltaY)
  if (deltaY < 0) return;

  const pid = card.dataset.pid;

  // Check if this card is in expanded context mode
  if (cardContextState[pid] && cardContextState[pid].context) {
    // Collapse the card
    toggleCardContext(pid, currentData);

    // Visual feedback for the collapse action
    if (!prefersReducedMotion) {
      card.style.transition = 'transform 0.2s ease';
      card.style.transform = 'translateY(10px)';

      setTimeout(() => {
        card.style.transform = '';
      }, 200);
    }

    // Vibrate for feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }
}

// Initialize mobile touch support
initMobileLongPress();
