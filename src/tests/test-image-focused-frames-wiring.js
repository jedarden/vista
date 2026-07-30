'use strict';

/**
 * Regression test for bead bf-2nn6p:
 *   "Wire Instagram (image-focused) frame through rendering context"
 *
 * Verifies that instagram — the image-focused platform (1:1) — renders through
 * the centralized rendering context (buildContextFrame) with realistic,
 * theme-aware Instagram chrome (gradient avatar, username, timestamp, menu,
 * 1:1 image area, caption + hashtags, like/comment/share actions), driven by
 * the 'image-focused' frameType config. Mirrors the sibling tests
 * test-social-feed-frames-wiring.js, test-link-aggregator-frames-wiring.js, and
 * test-video-frames-wiring.js.
 *
 * Run: node src/tests/test-image-focused-frames-wiring.js
 */

const fs = require('fs');
const path = require('path');

const PUB = path.resolve(__dirname, '..', 'public');
const PLATFORM = 'instagram';

// --- Load platform-frames-config.js (exports only to `window`) ---
global.window = {};
eval(fs.readFileSync(path.join(PUB, 'platform-frames-config.js'), 'utf8'));
const getPlatformFrameConfig = global.window.getPlatformFrameConfig;

// --- Load platform-frames.js (uses module.exports under Node) ---
const pf = require(path.join(PUB, 'platform-frames.js'));
const { buildContextFrame, buildLinkPreviewHTML, getPlatformFrame } = pf;

// Mirrors the wiring gate in app.js's renderPlatformWithContext: a platform
// routes through the centralized context (NOT legacy) iff it is present in the
// config AND the runtime frame carries chrome.
function routesThroughContext(pid) {
  const frameConfig = (typeof getPlatformFrameConfig === 'function') ? getPlatformFrameConfig(pid) : undefined;
  if (!frameConfig) return false;
  if (typeof buildContextFrame !== 'function' || typeof getPlatformFrame !== 'function') return false;
  const f = getPlatformFrame(pid);
  return !!(f && typeof f === 'object' && f.chrome);
}

// Build contentData the way renderPlatformWithContext does, then render.
function render(theme) {
  const cfg = getPlatformFrameConfig(PLATFORM);
  const link = buildLinkPreviewHTML(PLATFORM, {
    title: 'Sunset Over the Coast',
    description: 'A golden-hour shot from the cliffs.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: '#e1306c',
  }, theme);
  return buildContextFrame(PLATFORM, {
    title: 'Sunset Over the Coast',
    description: 'A golden-hour shot from the cliffs.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: '#e1306c',
    themeColor: '#e1306c',
    cardHTML: link,
    frameType: cfg.frameType,
    aspectRatio: cfg.aspectRatio,
    hasThemeSupport: cfg.hasThemeSupport,
  }, theme);
}

let failures = 0;
const results = [];
function check(label, cond) {
  results.push({ label, ok: !!cond });
  if (!cond) failures++;
}

const tag = `[${PLATFORM}]`;

// AC1 — route through renderPlatformWithContext (not legacy)
check(`AC1 ${tag} routes through centralized context (not legacy)`, routesThroughContext(PLATFORM));

// AC2 — image-focused chrome: avatar, username, timestamp, menu, caption +
// hashtags, like/comment/share actions, and a 1:1 image area
{
  const html = render('dark');
  check(`AC2 ${tag} avatar (ig-avatar)`, /ig-avatar/.test(html));
  check(`AC2 ${tag} username (ig-username)`, /ig-username/.test(html));
  check(`AC2 ${tag} timestamp (ig-post-time)`, /ig-post-time/.test(html));
  check(`AC2 ${tag} menu (ig-menu)`, /ig-menu/.test(html));
  check(`AC2 ${tag} caption (ig-caption)`, /ig-caption/.test(html));
  check(`AC2 ${tag} hashtags (ig-hashtags)`, /ig-hashtags/.test(html));
  check(`AC2 ${tag} actions (ig-post-actions)`, /ig-post-actions/.test(html));
  // The image-focused 1:1 image area surfaces as the embedded card preview.
  check(`AC2 ${tag} image area (ig-context-image|ig-context-placeholder)`, /ig-context-image|ig-context-placeholder/.test(html));
}

// AC3 — aspect ratio per the config aspectRatio value (1:1)
{
  const cfg = getPlatformFrameConfig(PLATFORM);
  check(`AC3 ${tag} config aspectRatio === "1:1"`, cfg && cfg.aspectRatio === '1:1');
}

// AC4 — card embedded in the image-focused frame, theme-aware bg
{
  const html = render('dark');
  check(`AC4 ${tag} card embedded (ig-link-preview)`, /ig-link-preview/.test(html));
  check(`AC4 ${tag} inline --frame-bg var (theme-aware bg)`, /--frame-bg:/.test(html));
}

// AC5 — recognizably Instagram (ig-* chrome), not a generic placeholder, no leaks
{
  const html = render('dark');
  check(`AC5 ${tag} recognizably Instagram (ig-* chrome)`, /ig-post-header|ig-username|ig-post-actions/.test(html));
  check(`AC5 ${tag} does not leak other-platform chrome`, !/yt-video-player|tt-video-container|rd-subreddit|fb-post-header|li-post-header|tw-post-header/.test(html));
  check(`AC5 ${tag} no unfilled placeholders`, !/\{\{(\w+)\}\}/.test(html));
}

// AC6 — both dark and light themes render (theme-aware, bg differs)
{
  const d = render('dark'), l = render('light');
  const dv = (d.match(/--frame-bg:([^;]+)/) || [])[1];
  const lv = (l.match(/--frame-bg:([^;]+)/) || [])[1];
  check(`AC6 ${tag} dark-theme class`, /dark-theme/.test(d));
  check(`AC6 ${tag} light-theme class`, /light-theme/.test(l));
  check(`AC6 ${tag} dark vs light bg differ`, dv !== lv);
}

// frameType config drives the DOM (the 'image-focused' frameType requirement)
{
  const html = render('dark');
  check(`FT ${tag} data-frame-type="image-focused"`, /data-frame-type="image-focused"/.test(html));
  check(`FT ${tag} frame-type-image-focused class`, /frame-type-image-focused/.test(html));
}

// Config sanity: instagram carries the image-focused frameType + theme support
{
  const cfg = getPlatformFrameConfig(PLATFORM);
  check('CFG instagram.frameType === "image-focused"', cfg && cfg.frameType === 'image-focused');
  check('CFG instagram.hasThemeSupport === true', cfg && cfg.hasThemeSupport === true);
}

// Shared image-focused chrome CSS exists in style.css (the bf-2nn6p wiring piece)
{
  const css = fs.readFileSync(path.join(PUB, 'style.css'), 'utf8');
  check('CSS .context-frame.frame-type-image-focused rule present', /\.context-frame\.frame-type-image-focused\b/.test(css));
  check('CSS image-focused bg sourced from --frame-bg', /\.context-frame\.frame-type-image-focused[^}]*background:\s*var\(--frame-bg\)/.test(css));
}

// Report
for (const r of results) {
  console.log(`  ${r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${r.label}`);
}
console.log(`\n${failures === 0 ? '\x1b[32mALL CHECKS PASSED\x1b[0m' : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`}`);
process.exit(failures === 0 ? 0 : 1);
