'use strict';

/**
 * Regression test for bead bf-51k74:
 *   "Wire social-feed platforms (Facebook, X/Twitter, LinkedIn) through rendering context"
 *
 * Verifies the three social-feed platforms render through the centralized
 * rendering context (buildContextFrame) with realistic, distinct, theme-aware
 * feed chrome — and that the 'social-feed' frameType config drives the DOM.
 *
 * Run: node src/tests/test-social-feed-frames-wiring.js
 */

const fs = require('fs');
const path = require('path');

const PUB = path.resolve(__dirname, '..', 'public');

// --- Load platform-frames-config.js (exports only to `window`) ---
global.window = {};
eval(fs.readFileSync(path.join(PUB, 'platform-frames-config.js'), 'utf8'));
const getPlatformFrameConfig = global.window.getPlatformFrameConfig;

// --- Load platform-frames.js (uses module.exports under Node) ---
const pf = require(path.join(PUB, 'platform-frames.js'));
const { buildContextFrame, buildLinkPreviewHTML, getPlatformFrame } = pf;

const PLATFORMS = ['facebook', 'twitter', 'linkedin'];

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
function render(pid, theme) {
  const cfg = getPlatformFrameConfig(pid);
  const link = buildLinkPreviewHTML(pid, {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: '#1877f2',
  }, theme);
  return buildContextFrame(pid, {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: '#1877f2',
    themeColor: '#1877f2',
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

// AC1 — route through renderPlatformWithContext (not legacy)
for (const pid of PLATFORMS) {
  check(`AC1 ${pid} routes through centralized context (not legacy)`, routesThroughContext(pid));
}

// AC2 — social-feed chrome: author name + handle + content + engagement
for (const pid of PLATFORMS) {
  const html = render(pid, 'dark');
  check(`AC2 ${pid} author name`, /author-name/i.test(html));
  check(`AC2 ${pid} handle (handle/headline/username)`, /author-handle|post-headline|username/i.test(html));
  check(`AC2 ${pid} post content area`, /post-content/i.test(html));
  check(`AC2 ${pid} engagement bar (stats/actions)`, /post-stats|post-actions/i.test(html));
}

// AC3 — card embedded, theme-aware bg, max-width
for (const pid of PLATFORMS) {
  const html = render(pid, 'dark');
  check(`AC3 ${pid} card embedded`, /link-preview|link-card|context-/i.test(html));
  check(`AC3 ${pid} inline --frame-bg var`, /--frame-bg:/.test(html));
}

// AC4 — chrome distinct per platform
const fb = render('facebook', 'dark'), tw = render('twitter', 'dark'), li = render('linkedin', 'dark');
check('AC4 facebook-only chrome', /fb-post/.test(fb) && !/tw-post|li-post/.test(fb));
check('AC4 twitter-only chrome', /tw-post/.test(tw) && !/fb-post|li-post/.test(tw));
check('AC4 linkedin-only chrome', /li-post/.test(li) && !/fb-post|tw-post/.test(li));

// AC5 — both dark and light themes
for (const pid of PLATFORMS) {
  const d = render(pid, 'dark'), l = render(pid, 'light');
  const dv = (d.match(/--frame-bg:([^;]+)/) || [])[1];
  const lv = (l.match(/--frame-bg:([^;]+)/) || [])[1];
  check(`AC5 ${pid} dark-theme class`, /dark-theme/.test(d));
  check(`AC5 ${pid} light-theme class`, /light-theme/.test(l));
  check(`AC5 ${pid} dark vs light differ`, dv !== lv);
}

// frameType config drives the DOM (the "driven by the 'social-feed' frameType config" requirement)
for (const pid of PLATFORMS) {
  const html = render(pid, 'dark');
  check(`FT ${pid} data-frame-type="social-feed"`, /data-frame-type="social-feed"/.test(html));
  check(`FT ${pid} frame-type-social-feed class`, /frame-type-social-feed/.test(html));
}

// Facebook handle (closes the AC2 "display name + handle" gap)
const fbHtml = render('facebook', 'dark');
check('FB handle text present', /@jane\.smith/.test(fbHtml));
check('FB fb-author-handle element', /fb-author-handle/.test(fbHtml));

// Report
for (const r of results) {
  console.log(`  ${r.ok ? '[32m✓[0m' : '[31m✗[0m'} ${r.label}`);
}
console.log(`\n${failures === 0 ? '[32mALL CHECKS PASSED[0m' : `[31m${failures} CHECK(S) FAILED[0m`}`);
process.exit(failures === 0 ? 0 : 1);
