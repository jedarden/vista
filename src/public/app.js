'use strict';
/* VISTA frontend application */

// ── State ──
let currentData = null;
let currentMode = 'url'; // 'url' | 'paste' | 'compare'
let cardContextState = {}; // Track context mode per platform: { pid: { context: boolean, theme: 'dark'|'light' } }
let compareData = { before: null, after: null, swapped: false }; // Comparison state

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
  loadRecents();
  initOgGenerator();
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    urlInput.value = urlParam;
    inspectUrl(urlParam);
  }
});

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

// ── Inspect ──
async function inspectUrl(url) {
  if (!url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    urlInput.value = url;
  }
  showLoading();
  try {
    const resp = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Fetch failed');
    handleResult(data);
  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 3000);
  }
}

async function inspectHtml(html, base) {
  if (!html) { showToast('Please paste some HTML first.', 2000); return; }
  showLoading();
  try {
    const resp = await fetch(`/api/preview${base ? '?base=' + encodeURIComponent(base) : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/html' },
      body: html,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Parse failed');
    handleResult(data);
  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 3000);
  }
}

function handleResult(data) {
  hideLoading();
  currentData = data;
  saveToRecents(data);

  // Compact hero
  hero.classList.add('compact');
  document.body.classList.add('has-results');

  // Render all panels
  renderSummaryBar(data);
  renderPreviews(data);
  initCropper(data);
  renderDiagnostics(data.diagnostics);
  renderRawTags(data.meta);
  renderRedirects(data.redirectChain, data.responseHeaders);
  renderFixes(data.autoFixes);

  // Show results
  resultsSection.classList.remove('hidden');
  switchTab('previews');

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update URL (shareable)
  if (data.url && data.url !== window.location.href) {
    history.pushState({}, '', '/?url=' + encodeURIComponent(data.url));
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

// Cropper state
let cropperState = {
  enabledPlatforms: new Set(Object.keys(PLATFORM_CROPS)),
  imageNaturalWidth: 0,
  imageNaturalHeight: 0,
  imageAspectRatio: 0,
};

// Toggle all platforms on by default
Object.keys(PLATFORM_CROPS).forEach(pid => cropperState.enabledPlatforms.add(pid));

function renderPreviews(data) {
  previewGrid.innerHTML = '';
  PLATFORM_GROUPS.forEach((group, gi) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'platform-group' + (group.collapsed ? ' collapsed' : '');
    groupEl.id = 'group-' + group.id;

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

    group.platforms.forEach((pid, i) => {
      const scoreData = data.scoring.scores[pid];
      if (!scoreData) return;
      const card = buildCard(pid, scoreData, data, i * 60); // staggered delay
      row.appendChild(card);
    });

    groupEl.appendChild(row);
    previewGrid.appendChild(groupEl);
  });
}

function buildCard(pid, scoreData, data, animDelay) {
  const card = document.createElement('div');
  card.className = `platform-card ${gradeClass(scoreData.grade)}`;
  card.style.animationDelay = animDelay + 'ms';
  card.dataset.pid = pid;

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
    body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme);
  } else {
    body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl);
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
  const contextToggle = header.querySelector('.card-context-toggle');
  contextToggle.addEventListener('click', () => toggleCardContext(pid, data));

  const themeToggle = header.querySelector('.card-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
  }

  return card;
}

// Platforms that support dark/light mode
const PLATFORMS_WITH_THEME = ['discord', 'slack', 'twitter', 'telegram'];

function toggleCardContext(pid, data) {
  cardContextState[pid].context = !cardContextState[pid].context;
  const body = document.getElementById(`card-body-${pid}`);
  if (body) {
    if (cardContextState[pid].context) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme);
    } else {
      body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl);
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
function renderPlatformCard(pid, meta, imageProbe, baseUrl) {
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
    ? `<img src="${escHtml(url)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" loading="lazy" /><span class="img-placeholder" style="display:none">No image</span>`
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
          <div class="wa-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" style="width:68px;height:68px;object-fit:cover" />` : ''}</div>
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
        <div class="signal-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" style="width:76px;height:76px;object-fit:cover" />` : ''}</div>
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
        <div class="notion-img-cell">${ogImage ? `<img src="${escHtml(ogImage)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : ''}</div>
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
function renderPlatformWithContext(pid, meta, imageProbe, baseUrl, theme = 'dark') {
  const ogTitle = meta.og.title || meta.title || '';
  const ogDesc = meta.og.description || meta.description || '';
  const ogImage = meta.og.image || meta.twitter.image || '';
  const ogSite = meta.og.site_name || '';
  const domain = getDomain(baseUrl);
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  switch (pid) {
    case 'google':
      return renderGoogleContext(ogTitle, ogDesc, domain);

    case 'facebook':
      return renderFacebookContext(ogTitle, ogDesc, ogImage, domain, ogSite);

    case 'twitter':
      return renderTwitterContext(ogTitle, ogDesc, ogImage, domain, theme);

    case 'linkedin':
      return renderLinkedInContext(ogTitle, ogDesc, ogImage, domain);

    case 'reddit':
      return renderRedditContext(ogTitle, ogDesc, ogImage, domain);

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
      return renderGitHubContext(ogTitle, ogDesc, ogImage, domain);

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
        <div class="context-body">${renderPlatformCard(pid, meta, imageProbe, baseUrl)}</div>
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

function renderFacebookContext(title, desc, image, domain, site) {
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
      ${image ? `<div class="fb-context-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="fb-context-placeholder"></div>'}
    </div>
    <div class="fb-post-stats">👍 24 · 💬 8 · 🔗 5</div>
  </div>`;
}

function renderTwitterContext(title, desc, image, domain, theme) {
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
      ${image ? `<div class="tw-context-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="tw-context-placeholder"></div>'}
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
      ${image ? `<div class="li-context-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="li-context-placeholder"></div>'}
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
      ${image ? `<div class="rd-context-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="rd-context-placeholder"></div>'}
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
              ${image ? `<div class="slack-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="slack-placeholder"></div>'}
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
              ${image ? `<div class="discord-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="discord-placeholder"></div>'}
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
            ${image ? `<img src="${escHtml(image)}" class="wa-link-thumb" alt="" onerror="this.style.display='none'" loading="lazy" />` : '<div class="wa-link-thumb-placeholder"></div>'}
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
            ${image ? `<div class="im-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="im-link-placeholder"></div>'}
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
            ${image ? `<div class="tg-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="tg-link-placeholder"></div>'}
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
            ${image ? `<img src="${escHtml(image)}" class="signal-link-thumb" alt="" onerror="this.style.display='none'" loading="lazy" />` : '<div class="signal-link-thumb-placeholder"></div>'}
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
              ${image ? `<div class="teams-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="teams-link-placeholder"></div>'}
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
              ${image ? `<div class="gchat-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="gchat-link-placeholder"></div>'}
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
      ${image ? `<div class="mdn-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="mdn-link-placeholder"></div>'}
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
      ${image ? `<div class="bsky-link-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="bsky-link-placeholder"></div>'}
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
      ${image ? `<div class="th-context-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="th-context-placeholder"></div>'}
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
        ${image ? `<div class="tumblr-thumb"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="tumblr-thumb-placeholder"></div>'}
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
        ${image ? `<div class="pin-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="pin-image-placeholder"></div>'}
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
          ${image ? `<div class="notion-embed-thumb"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="notion-embed-thumb-placeholder"></div>'}
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
          ${image ? `<div class="jira-card-thumb"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="jira-card-thumb-placeholder"></div>'}
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

function renderGitHubContext(title, desc, image, domain) {
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  return `<div class="context-frame github-context">
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
            ${image ? `<div class="gh-preview-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="gh-preview-placeholder"></div>'}
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
          ${image ? `<div class="trello-card-thumb"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="trello-card-thumb-placeholder"></div>'}
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
            ${image ? `<div class="figma-card-thumb"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="figma-card-thumb-placeholder"></div>'}
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
          ${image ? `<div class="medium-article-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="medium-article-placeholder"></div>'}
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
        ${image ? `<div class="substack-post-image"><img src="${escHtml(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="substack-post-placeholder"></div>'}
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
            ${image ? `<img src="${escHtml(image)}" class="email-thumb" alt="" onerror="this.style.display='none'" loading="lazy" />` : '<div class="email-thumb-placeholder"></div>'}
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
            ${image ? `<img src="${escHtml(image)}" class="feedly-thumb" alt="" onerror="this.style.display='none'" loading="lazy" />` : '<div class="feedly-thumb-placeholder"></div>'}
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
}

// ── Raw Tags ──
function renderRawTags(meta) {
  let html = '';

  // Core tags
  html += `<div class="raw-section"><h3>Core Tags</h3>
    <table class="tags-table">
      <thead><tr><th>Tag</th><th>Value</th></tr></thead>
      <tbody>
        ${metaRow('title', meta.title)}
        ${metaRow('description', meta.description)}
        ${metaRow('robots', meta.robots)}
        ${metaRow('theme-color', meta.themeColor)}
        ${metaRow('favicon', meta.favicon)}
      </tbody>
    </table>
  </div>`;

  // Open Graph
  const ogKeys = Object.keys(meta.og).filter(k => !k.startsWith('_'));
  if (ogKeys.length > 0) {
    html += `<div class="raw-section"><h3>Open Graph (og:*)</h3>
      <table class="tags-table">
        <thead><tr><th>Property</th><th>Value</th></tr></thead>
        <tbody>
          ${ogKeys.map(k => metaRow('og:' + k, meta.og[k], k === 'image')).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // Twitter Card
  const twKeys = Object.keys(meta.twitter);
  if (twKeys.length > 0) {
    html += `<div class="raw-section"><h3>Twitter Card (twitter:*)</h3>
      <table class="tags-table">
        <thead><tr><th>Name</th><th>Value</th></tr></thead>
        <tbody>
          ${twKeys.map(k => metaRow('twitter:' + k, meta.twitter[k], k === 'image')).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // JSON-LD
  if (meta.jsonLd && meta.jsonLd.length > 0) {
    html += `<div class="raw-section"><h3>JSON-LD Structured Data</h3>
      ${meta.jsonLd.map(j => `<pre class="jsonld-block">${escHtml(JSON.stringify(j, null, 2))}</pre>`).join('')}
    </div>`;
  }

  rawTagsPanel.innerHTML = html;
}

function metaRow(key, value, isImage) {
  if (!value && value !== 0) {
    return `<tr><td class="tag-key">${escHtml(key)}</td><td class="tag-val" style="color:var(--text3);font-style:italic">—</td></tr>`;
  }
  let valHtml = escHtml(String(value));
  if (isImage && value) {
    valHtml += `<br><img class="tag-image-thumb" src="${escHtml(value)}" alt="" onerror="this.style.display='none'" loading="lazy" />`;
  }
  return `<tr><td class="tag-key">${escHtml(key)}</td><td class="tag-val">${valHtml}</td></tr>`;
}

// ── Redirects & Headers ──
function renderRedirects(chain, headers) {
  let html = '';

  if (chain && chain.length > 0) {
    html += `<h2 class="section-heading">Redirect Chain</h2><div class="redirect-chain">`;
    chain.forEach((hop, i) => {
      const isFinal = hop.isFinal;
      const sc = hop.statusCode || 0;
      let sCls = 's2xx';
      if (sc >= 300 && sc < 400) sCls = 's3xx';
      else if (sc >= 400) sCls = 's4xx';
      html += `<div class="redirect-hop">
        <div class="hop-connector">
          <div class="hop-dot${isFinal ? ' final' : ''}"></div>
          ${i < chain.length - 1 ? '<div class="hop-line"></div>' : ''}
        </div>
        <div class="hop-info">
          <div class="hop-url"><span class="hop-status ${sCls}">${sc}</span>${escHtml(hop.url)}</div>
          ${hop.warning ? `<div class="hop-warning">&#9888; ${escHtml(hop.warning)}</div>` : ''}
          ${hop.redirectsTo ? `<div style="font-size:12px;color:var(--text3);margin-top:3px">&#8594; ${escHtml(hop.redirectsTo)}</div>` : ''}
        </div>
      </div>`;
    });
    html += '</div>';
  } else {
    html += `<p style="color:var(--text2);margin-bottom:24px">No redirects — direct response.</p>`;
  }

  if (headers && Object.keys(headers).length > 0) {
    html += `<h2 class="section-heading">Response Headers</h2>
      <table class="headers-table">
        <tbody>
          ${Object.entries(headers).map(([k, v]) => `<tr><td class="header-name">${escHtml(k)}</td><td class="header-val">${escHtml(v)}</td></tr>`).join('')}
        </tbody>
      </table>`;
  }

  redirectPanel.innerHTML = html;
}

// ── Auto-Fixes ──
function renderFixes(fixes) {
  if (!fixes || fixes.length === 0) {
    fixesPanel.innerHTML = '<p class="fixes-intro" style="color:var(--green)">&#10003; No fixes needed! Your meta tags look great.</p>';
    return;
  }

  let html = `<p class="fixes-intro">Found ${fixes.length} suggested fix${fixes.length !== 1 ? 'es' : ''} to improve your social card performance.</p>
    <div class="fixes-panel">`;

  fixes.forEach(fix => {
    if (!fix.tag) return;
    html += `<div class="fix-item">
      <div class="fix-msg">${escHtml(fix.message)}</div>
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
    btn.classList.toggle('active', btn.dataset.tab === tabId);
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

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
window.copyText = copyText;

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
    // Fetch both URLs in parallel
    const [resp1, resp2] = await Promise.all([
      fetch(`/api/preview?url=${encodeURIComponent(normalizedUrl1)}`),
      fetch(`/api/preview?url=${encodeURIComponent(normalizedUrl2)}`)
    ]);

    const [data1, data2] = await Promise.all([
      resp1.json(),
      resp2.json()
    ]);

    if (!resp1.ok) throw new Error(`URL 1: ${data1.error || 'Fetch failed'}`);
    if (!resp2.ok) throw new Error(`URL 2: ${data2.error || 'Fetch failed'}`);

    // Store comparison data
    compareData.before = data1;
    compareData.after = data2;
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
