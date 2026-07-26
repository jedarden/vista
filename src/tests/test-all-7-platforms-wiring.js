'use strict';

/**
 * End-to-end wiring test for bead bf-2nn6p (final AC):
 *   "all 7 platforms render through renderPlatformWithContext reading from
 *    platform-frames.config.ts, each showing platform-specific realistic
 *    chrome and embedded cards."
 *
 * Verifies the full routing pipeline the way renderPlatformWithContext (app.js)
 * drives it: every platform is resolved through the centralized config
 * (platform-frames-config.js, mirror of src/config/platform-frames.config.ts),
 * then rendered through buildContextFrame (platform-frames.js) with the
 * config-sourced frameType/aspectRatio, yielding platform-specific chrome, an
 * embedded card, theme-aware bg, and no unfilled placeholders — in both dark
 * and light themes. Aggregates the per-frameType sibling tests
 * (social-feed / link-aggregator / video-platform / image-focused).
 *
 * Run: node src/tests/test-all-7-platforms-wiring.js
 */

const fs = require('fs');
const path = require('path');

const PUB = path.resolve(__dirname, '..', 'public');

// The 7 platforms the centralized context system must fully wire.
const PLATFORMS = [
  'facebook',
  'twitter',
  'linkedin',
  'reddit',
  'youtube',
  'instagram',
  'tiktok',
];

// Recognizable per-platform chrome signature (the element that makes the frame
// recognizably THIS platform, not a generic placeholder) and its expected
// frameType — both read from platform-frames.config.ts at runtime below.
const SIGNATURE = {
  facebook:  { chrome: 'fb-post-header',  frameType: 'social-feed'      },
  twitter:   { chrome: 'tw-post-header',  frameType: 'social-feed'      },
  linkedin:  { chrome: 'li-post-header',  frameType: 'social-feed'      },
  reddit:    { chrome: 'rd-subreddit-name|rd-post-title', frameType: 'link-aggregator' },
  youtube:   { chrome: 'yt-video-player', frameType: 'video-platform'   },
  instagram: { chrome: 'ig-post-header',  frameType: 'image-focused'    },
  tiktok:    { chrome: 'tt-video-container', frameType: 'video-platform' },
};

// --- Load platform-frames-config.js (exports only to `window`) ---
global.window = {};
eval(fs.readFileSync(path.join(PUB, 'platform-frames-config.js'), 'utf8'));
const getPlatformFrameConfig = global.window.getPlatformFrameConfig;

// --- Load platform-frames.js (uses module.exports under Node) ---
const pf = require(path.join(PUB, 'platform-frames.js'));
const { buildContextFrame, buildLinkPreviewHTML, getPlatformFrame } = pf;

// Mirrors the wiring gate in app.js's renderPlatformWithContext.
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
    title: `${pid} example title`,
    description: `${pid} example description.`,
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
  }, theme);
  return buildContextFrame(pid, {
    title: `${pid} example title`,
    description: `${pid} example description.`,
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
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

// Sanity: the config declares exactly the 7 platforms
check('CFG all 7 platforms present in config', PLATFORMS.every(p => getPlatformFrameConfig(p)));
check('CFG exactly 7 platforms in config', global.window.getAllPlatformIds().length === PLATFORMS.length);

const darkHTML = {};
const lightHTML = {};

for (const pid of PLATFORMS) {
  const sig = SIGNATURE[pid];
  const tag = `[${pid}]`;

  // AC: routes through renderPlatformWithContext (the centralized context), NOT legacy
  check(`ROUTE ${tag} routes through centralized context (not legacy)`, routesThroughContext(pid));

  // AC: reads frameType + aspectRatio from the centralized config
  {
    const cfg = getPlatformFrameConfig(pid);
    check(`CFG ${tag} frameType === "${sig.frameType}"`, cfg && cfg.frameType === sig.frameType);
    check(`CFG ${tag} aspectRatio present`, cfg && typeof cfg.aspectRatio === 'string' && cfg.aspectRatio.length > 0);
    check(`CFG ${tag} hasThemeSupport === true`, cfg && cfg.hasThemeSupport === true);
  }

  darkHTML[pid] = render(pid, 'dark');
  lightHTML[pid] = render(pid, 'light');
  const d = darkHTML[pid];

  // AC: frameType config drives the DOM (data-frame-type + frame-type-<type> class)
  check(`DOM ${tag} data-frame-type="${sig.frameType}"`, new RegExp(`data-frame-type="${sig.frameType}"`).test(d));
  check(`DOM ${tag} frame-type-${sig.frameType} class`, new RegExp(`frame-type-${sig.frameType}`).test(d));

  // AC: platform-specific realistic chrome (recognizably THIS platform)
  check(`CHROME ${tag} recognizable chrome (${sig.chrome})`, new RegExp(sig.chrome).test(d));
  check(`CHROME ${tag} no unfilled placeholders`, !/\{\{(\w+)\}\}/.test(d));

  // AC: embedded card appears inside the frame chrome
  check(`CARD ${tag} embedded card present`, /link-preview|link-card|context-image|context-placeholder|context-meta|rd-post-title|yt-link-card/.test(d));

  // AC: theme-aware bg via inline --frame-bg var; both themes render; bg differs
  const dv = (d.match(/--frame-bg:([^;]+)/) || [])[1];
  const lv = (lightHTML[pid].match(/--frame-bg:([^;]+)/) || [])[1];
  check(`THEME ${tag} inline --frame-bg var`, /--frame-bg:/.test(d));
  check(`THEME ${tag} dark-theme class`, /dark-theme/.test(d));
  check(`THEME ${tag} light-theme class`, /light-theme/.test(lightHTML[pid]));
  check(`THEME ${tag} dark vs light bg differ`, dv && lv && dv !== lv);
}

// AC: each platform renders DISTINCT chrome (not a shared generic placeholder)
for (let i = 0; i < PLATFORMS.length; i++) {
  for (let j = i + 1; j < PLATFORMS.length; j++) {
    const a = PLATFORMS[i], b = PLATFORMS[j];
    check(`DISTINCT ${a} vs ${b} chrome differ`, darkHTML[a] !== darkHTML[b]);
  }
}

// Report — group by platform for readability
const groups = ['CFG', 'ROUTE', 'CFG', 'DOM', 'CHROME', 'CARD', 'THEME', 'DISTINCT'];
for (const r of results) {
  console.log(`  ${r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${r.label}`);
}
console.log(`\n${PLATFORMS.length} platforms × {routing, config, DOM, chrome, embedded card, dual-theme} + distinctness.`);
console.log(`${failures === 0 ? '\x1b[32mALL ' + results.length + ' CHECKS PASSED\x1b[0m' : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`}`);
process.exit(failures === 0 ? 0 : 1);
