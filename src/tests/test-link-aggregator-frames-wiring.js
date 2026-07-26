'use strict';

/**
 * Regression test for bead bf-o164e:
 *   "Wire Reddit (link-aggregator) frame through rendering context"
 *
 * Verifies the reddit platform renders through the centralized rendering
 * context (buildContextFrame) with realistic, theme-aware link-aggregator
 * chrome — subreddit name, upvote score / vote arrows, comment count — and
 * that the 'link-aggregator' frameType config drives the DOM. Mirrors the
 * sibling social-feed test (test-social-feed-frames-wiring.js).
 *
 * Run: node src/tests/test-link-aggregator-frames-wiring.js
 */

const fs = require('fs');
const path = require('path');

const PUB = path.resolve(__dirname, '..', 'public');
const PLATFORM_ID = 'reddit';

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
  const cfg = getPlatformFrameConfig(PLATFORM_ID);
  const link = buildLinkPreviewHTML(PLATFORM_ID, {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: '#FF4500',
  }, theme);
  return buildContextFrame(PLATFORM_ID, {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: '#FF4500',
    themeColor: '#FF4500',
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
check(`AC1 ${PLATFORM_ID} routes through centralized context (not legacy)`, routesThroughContext(PLATFORM_ID));

// AC2 — link-aggregator chrome: subreddit name, upvote score / vote arrows, comment count
{
  const html = render('dark');
  check('AC2 subreddit name (r/…)', /r\/webdev/.test(html));
  check('AC2 upvote score present', /rd-vote-count">\s*[0-9.]+k?\s*</.test(html));
  check('AC2 vote arrows (▲ ▼)', /rd-upvote-arrow">▲/.test(html) && /rd-downvote-arrow">▼/.test(html));
  check('AC2 comment count (N comments)', /\d+\s+comments/.test(html));
}

// AC3 — card embedded, theme-aware bg, padding
{
  const html = render('dark');
  check('AC3 card embedded (link-preview)', /link-preview|link-card|context-/i.test(html));
  check('AC3 inline --frame-bg var (theme-aware bg)', /--frame-bg:/.test(html));
}

// AC4 — chrome recognizably Reddit (rd-* chrome, not a generic placeholder)
{
  const html = render('dark');
  check('AC4 rd-subreddit chrome', /rd-subreddit/.test(html));
  check('AC4 rd-upvote chrome', /rd-upvote/.test(html));
  check('AC4 no unfilled placeholders', !/\{\{(\w+)\}\}/.test(html));
}

// AC5 — both dark and light themes
{
  const d = render('dark'), l = render('light');
  const dv = (d.match(/--frame-bg:([^;]+)/) || [])[1];
  const lv = (l.match(/--frame-bg:([^;]+)/) || [])[1];
  check('AC5 dark-theme class', /dark-theme/.test(d));
  check('AC5 light-theme class', /light-theme/.test(l));
  check('AC5 dark vs light bg differ', dv !== lv);
}

// frameType config drives the DOM (the "driven by the 'link-aggregator' frameType config" requirement)
{
  const html = render('dark');
  check('FT data-frame-type="link-aggregator"', /data-frame-type="link-aggregator"/.test(html));
  check('FT frame-type-link-aggregator class', /frame-type-link-aggregator/.test(html));
}

// Config sanity: reddit's frameType is exactly 'link-aggregator'
{
  const cfg = getPlatformFrameConfig(PLATFORM_ID);
  check('CFG reddit.frameType === "link-aggregator"', cfg && cfg.frameType === 'link-aggregator');
  check('CFG reddit.hasThemeSupport === true', cfg && cfg.hasThemeSupport === true);
}

// Report
for (const r of results) {
  console.log(`  ${r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${r.label}`);
}
console.log(`\n${failures === 0 ? '\x1b[32mALL CHECKS PASSED\x1b[0m' : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`}`);
process.exit(failures === 0 ? 0 : 1);
