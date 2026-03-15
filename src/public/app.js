'use strict';
/* VISTA frontend application */

// ── State ──
let currentData = null;
let currentMode = 'url'; // 'url' | 'paste'

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
const cropperViewport = $('#cropperViewport');
const cropperImage = $('#cropperImage');
const cropperOverlay = $('#cropperOverlay');
const cropperControls = $('#cropperControls');
const cropperContainer = $('#cropperContainer');
const downloadOverlayBtn = $('#downloadOverlayBtn');
const safeZoneInfo = $('#safeZoneInfo');
const imageInfo = $('#imageInfo');
const cropperBadge = $('#cropperBadge');

// ── Event listeners ──
urlForm.addEventListener('submit', (e) => { e.preventDefault(); inspectUrl(urlInput.value.trim()); });
pasteForm.addEventListener('submit', (e) => { e.preventDefault(); inspectHtml(htmlInput.value.trim(), baseUrlInput.value.trim()); });

$('#switchToPaste').addEventListener('click', () => switchMode('paste'));
$('#switchToUrl').addEventListener('click', () => switchMode('url'));
navInspect.addEventListener('click', () => switchMode('url'));
navPaste.addEventListener('click', () => switchMode('paste'));

$('#shareBtn').addEventListener('click', shareResults);
$('#newInspectBtn').addEventListener('click', resetToHero);

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
    navInspect.classList.add('active');
    navPaste.classList.remove('active');
  } else {
    urlMode.classList.add('hidden');
    pasteMode.classList.remove('hidden');
    navPaste.classList.add('active');
    navInspect.classList.remove('active');
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

  // Header
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <span class="card-platform-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
    <span class="card-platform-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
    <span class="card-grade ${gradeClass(scoreData.grade)}">${scoreData.grade}</span>
  `;
  card.appendChild(header);

  // Body — platform-specific renderer
  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl);
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
