'use strict';

/**
 * Regression test for bead bf-4fddf:
 *   "Wire video platforms (YouTube, TikTok) through rendering context"
 *
 * Verifies that the two video platforms — youtube (16:9) and tiktok (9:16) —
 * render through the centralized rendering context (buildContextFrame) with
 * realistic, theme-aware video chrome (poster + play overlay, title,
 * channel/author, view/engagement counts), driven by the 'video-platform'
 * frameType config and each platform's distinct aspect ratio. Mirrors the
 * sibling tests test-social-feed-frames-wiring.js and
 * test-link-aggregator-frames-wiring.js.
 *
 * Run: node src/tests/test-video-frames-wiring.js
 */

const fs = require('fs');
const path = require('path');

const PUB = path.resolve(__dirname, '..', 'public');
const PLATFORMS = ['youtube', 'tiktok'];

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
function render(pid, theme) {
  const cfg = getPlatformFrameConfig(pid);
  const link = buildLinkPreviewHTML(pid, {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: pid === 'youtube' ? '#ff0000' : '#ff0050',
  }, theme);
  return buildContextFrame(pid, {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices.',
    image: 'https://example.com/og.png',
    domain: 'example.com',
    site: 'Example',
    dominantColor: pid === 'youtube' ? '#ff0000' : '#ff0050',
    themeColor: pid === 'youtube' ? '#ff0000' : '#ff0050',
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

for (const pid of PLATFORMS) {
  const tag = `[${pid}]`;

  // AC1 — route through renderPlatformWithContext (not legacy)
  check(`AC1 ${tag} routes through centralized context (not legacy)`, routesThroughContext(pid));

  // AC2 — video chrome: poster area with play overlay, title, channel/author, view/engagement count
  {
    const html = render(pid, 'dark');
    if (pid === 'youtube') {
      check(`AC2 ${tag} poster area with play overlay (▶)`, /yt-video-placeholder[^>]*>▶/.test(html));
      check(`AC2 ${tag} title (yt-video-title)`, /yt-video-title/.test(html));
      check(`AC2 ${tag} channel/author (yt-channel-name)`, /yt-channel-name/.test(html));
      check(`AC2 ${tag} view count (N views)`, /\d[\dKkMm]*\s+views/.test(html));
    } else {
      check(`AC2 ${tag} poster area (tt-video-placeholder)`, /tt-video-placeholder/.test(html));
      check(`AC2 ${tag} play overlay (▶)`, /tt-play-overlay[^>]*>▶/.test(html));
      check(`AC2 ${tag} title/caption (tt-caption)`, /tt-caption/.test(html));
      check(`AC2 ${tag} author (tt-username)`, /tt-username/.test(html));
      check(`AC2 ${tag} engagement count (tt-action-count)`, /tt-action-count/.test(html));
    }
  }

  // AC3 — aspect ratio per the config aspectRatio values
  {
    const cfg = getPlatformFrameConfig(pid);
    const expected = pid === 'youtube' ? '16:9' : '9:16';
    check(`AC3 ${tag} config aspectRatio === "${expected}"`, cfg && cfg.aspectRatio === expected);
  }

  // AC4 — card embedded in the video frame, theme-aware bg
  {
    const html = render(pid, 'dark');
    check(`AC4 ${tag} card embedded (link-preview/link-card)`, /link-preview|link-card|context-/i.test(html));
    check(`AC4 ${tag} inline --frame-bg var (theme-aware bg)`, /--frame-bg:/.test(html));
  }

  // AC5 — chrome distinct (platform-specific prefixes), not a generic placeholder
  {
    const html = render(pid, 'dark');
    if (pid === 'youtube') {
      check(`AC5 ${tag} recognizably YouTube (yt-* chrome)`, /yt-video|yt-channel|yt-action/.test(html));
      check(`AC5 ${tag} does not leak tiktok chrome (tt-*)`, !/tt-video-container|tt-action-btn/.test(html));
    } else {
      check(`AC5 ${tag} recognizably TikTok (tt-* chrome)`, /tt-video-container|tt-action-btn|tt-bottom-overlay/.test(html));
      check(`AC5 ${tag} does not leak youtube chrome (yt-*)`, !/yt-video-player|yt-channel-name/.test(html));
    }
    check(`AC5 ${tag} no unfilled placeholders`, !/\{\{(\w+)\}\}/.test(html));
  }

  // AC6 — both dark and light themes render (theme-aware)
  {
    const d = render(pid, 'dark'), l = render(pid, 'light');
    const dv = (d.match(/--frame-bg:([^;]+)/) || [])[1];
    const lv = (l.match(/--frame-bg:([^;]+)/) || [])[1];
    check(`AC6 ${tag} dark-theme class`, /dark-theme/.test(d));
    check(`AC6 ${tag} light-theme class`, /light-theme/.test(l));
    check(`AC6 ${tag} dark vs light bg differ`, dv !== lv);
  }

  // frameType config drives the DOM (the 'video-platform' frameType requirement)
  {
    const html = render(pid, 'dark');
    check(`FT ${tag} data-frame-type="video-platform"`, /data-frame-type="video-platform"/.test(html));
    check(`FT ${tag} frame-type-video-platform class`, /frame-type-video-platform/.test(html));
  }
}

// The two platforms render DISTINCT chrome (not a generic shared placeholder)
{
  const yt = render('youtube', 'dark');
  const tt = render('tiktok', 'dark');
  check('DISTINCT youtube vs tiktok chrome differ', yt !== tt);
  check('DISTINCT youtube carries 16:9 player (yt-video-player)', /yt-video-player/.test(yt));
  check('DISTINCT tiktok carries 9:16 player (tt-video-container)', /tt-video-container/.test(tt));
}

// Config sanity: both platforms share the video-platform frameType
{
  const ytCfg = getPlatformFrameConfig('youtube');
  const ttCfg = getPlatformFrameConfig('tiktok');
  check('CFG youtube.frameType === "video-platform"', ytCfg && ytCfg.frameType === 'video-platform');
  check('CFG tiktok.frameType === "video-platform"', ttCfg && ttCfg.frameType === 'video-platform');
  check('CFG both video-platform share frameType', ytCfg && ttCfg && ytCfg.frameType === ttCfg.frameType);
  check('CFG youtube.hasThemeSupport === true', ytCfg && ytCfg.hasThemeSupport === true);
  check('CFG tiktok.hasThemeSupport === true', ttCfg && ttCfg.hasThemeSupport === true);
}

// Report
for (const r of results) {
  console.log(`  ${r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${r.label}`);
}
console.log(`\n${failures === 0 ? '\x1b[32mALL CHECKS PASSED\x1b[0m' : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`}`);
process.exit(failures === 0 ? 0 : 1);
