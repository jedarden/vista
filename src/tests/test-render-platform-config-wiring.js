/**
 * Verification test for bf-4st7v:
 *   "Connect renderPlatformWithContext to platform-frames.config.ts"
 *
 * WHY A VM, NOT A BROWSER: this box (NixOS) has no usable Chrome — both the
 * puppeteer-bundled and playwright browsers crash on missing GUI libs, and
 * they are not patched for nix-ld. Rather than skip runtime verification, we
 * load the REAL shipped source (platform-frames-config.js + platform-frames.js
 * + app.js) into a Node `vm` context with permissive browser stubs and exercise
 * the real `renderPlatformWithContext` directly.
 *
 * Faithfulness notes:
 *   - app.js is a classic (non-module) script whose top-level function
 *     declarations are hoisted to the context global. Even if its
 *     DOMContentLoaded init throws against our stubs, `renderPlatformWithContext`
 *     and every callee stay defined (hoisting precedes statement execution),
 *     so the function under test is the genuine shipped code.
 *   - config.js and frames.js share lexical scope with app.js in the context,
 *     so bare-identifier references (getPlatformFrameConfig, buildContextFrame,
 *     getPlatformFrame, PLATFORM_FRAMES) resolve to the real definitions —
 *     exactly as they do across classic <script> tags in the browser.
 *   - We do NOT stub buildContextFrame away: we *wrap* the real one so the real
 *     pipeline still runs and we can observe the config-derived metadata it
 *     receives.
 *
 * Proves all five acceptance criteria:
 *   1. Each wired platform resolves via getPlatformFrameConfig().
 *   2. An absent platform falls back to the legacy/safe renderer WITHOUT throwing.
 *   3. The rendering context (contentData to buildContextFrame) receives
 *      frameType + aspectRatio from the config entry.
 *   4. getAllPlatformIds()/PLATFORM_FRAMES_CONFIG is the single source of truth
 *      for which platforms are wired (the gate is the 7-entry config, not the
 *      larger PLATFORM_FRAMES chrome map).
 *   5. No regression: the 7 config platforms render via buildContextFrame and
 *      produce non-empty framed HTML; absent platforms render via legacy.
 *
 * Run: node src/tests/test-render-platform-config-wiring.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUB = path.resolve(__dirname, '..', 'public');
const readSrc = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');

// The 7 platforms defined in src/platform-frames.config.ts (the wired set).
const CONFIG_PLATFORMS = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
// Platforms in the larger chrome map but NOT in the config — must fall back to legacy.
const ABSENT_PLATFORMS = ['slack', 'discord', 'github', 'notion', 'totally-unknown-xyz'];

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failures++;
    console.error(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
  }
}

// ── Permissive browser stubs ────────────────────────────────────────────────
// `any()` is callable, property-accessible, assignable, constructible, and
// crucially NOT thenable — so `document.getElementById('x').classList.add('y')`
// and similar DOM chains in init code never throw.
function makeAny() {
  const f = function () { return anyStub; };
  return new Proxy(f, {
    get(_t, prop) {
      if (prop === 'then') return undefined;
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === 'valueOf') return () => 0;
      if (prop === 'length') return 0;
      return anyStub;
    },
    set() { return true; },
    apply() { return anyStub; },
    construct() { return {}; },
    has() { return true; },
  });
}
const anyStub = makeAny();
const objProxy = () => new Proxy({}, {
  get(t, p) { return p in t ? t[p] : anyStub; },
  set(t, p, v) { t[p] = v; return true; },
  has() { return true; },
});

const sandbox = {
  console,
  // Real where it matters / is free:
  URL, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  // Permissive DOM-ish globals:
  document: objProxy(),
  window: null, // set below to a proxy
  navigator: objProxy(),
  location: objProxy(),
  localStorage: objProxy(),
  sessionStorage: objProxy(),
  history: objProxy(),
  screen: objProxy(),
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  getComputedStyle: () => objProxy(),
  requestAnimationFrame: (cb) => setTimeout(() => cb(0), 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  fetch: () => Promise.resolve(objProxy()),
  IntersectionObserver: function () { return { observe() {}, unobserve() {}, disconnect() {} }; },
  ResizeObserver: function () { return { observe() {}, unobserve() {}, disconnect() {} }; },
  MutationObserver: function () { return { observe() {}, disconnect() {} }; },
  PerformanceObserver: function () { return { observe() {}, disconnect() {} }; },
  customElements: objProxy(),
  CSS: objProxy(),
};
sandbox.window = objProxy();
sandbox.self = sandbox.window;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// Load the real shipped scripts in browser order.
const scriptErrors = [];
for (const file of ['platform-frames-config.js', 'platform-frames.js', 'app.js']) {
  try {
    vm.runInContext(readSrc(file), sandbox, { filename: file });
  } catch (e) {
    // Top-level throws from init code are expected against stubs; record but
    // continue — hoisted function declarations remain available regardless.
    scriptErrors.push(`${file}: ${e && e.message ? e.message : e}`);
  }
}

console.log('Loaded scripts. Init-time errors (expected, do not affect hoisted fns):');
scriptErrors.forEach((e) => console.log(`  · ${e.split('\n')[0]}`));

// The function under test must be present despite any init throws.
check('renderPlatformWithContext is defined (hoisted through init errors)',
  typeof sandbox.renderPlatformWithContext === 'function',
  `typeof = ${typeof sandbox.renderPlatformWithContext}`);
check('getPlatformFrameConfig is defined (config module loaded)',
  typeof sandbox.getPlatformFrameConfig === 'function');
check('buildContextFrame is defined (frames module loaded)',
  typeof sandbox.buildContextFrame === 'function');

if (typeof sandbox.renderPlatformWithContext !== 'function') {
  console.error('\nABORT: function under test is not available.');
  process.exit(1);
}

// ── Criterion #4: config is the single source of truth ──────────────────────
console.log('\nCriterion #4 — config is the gate, not the larger chrome map:');
const wiredIds = sandbox.getAllPlatformIds();
check('getAllPlatformIds() exposes exactly the 7 wired platforms',
  Array.isArray(wiredIds) && wiredIds.length === 7
  && CONFIG_PLATFORMS.every((id) => wiredIds.includes(id)),
  `got ${JSON.stringify(wiredIds)}`);

// PLATFORM_FRAMES is a `const` (shared lexical scope, not a global property),
// so read it from inside the context — exactly how app.js reaches it.
const chromeKeys = vm.runInContext(
  `Object.keys(PLATFORM_FRAMES).filter(k => k !== 'generic')`, sandbox);
check('config (7) is a strict subset of the PLATFORM_FRAMES chrome map',
  chromeKeys.length > wiredIds.length && wiredIds.every((id) => chromeKeys.includes(id)),
  `config=${wiredIds.length} chrome=${chromeKeys.length}`);

// ── Wrap the real buildContextFrame to observe config-derived metadata ──────
const captured = [];
const origBuild = sandbox.buildContextFrame;
sandbox.buildContextFrame = function (pid, contentData, theme) {
  captured.push({
    pid,
    frameType: contentData && contentData.frameType,
    aspectRatio: contentData && contentData.aspectRatio,
    hasThemeSupport: contentData && contentData.hasThemeSupport,
  });
  return origBuild.call(this, pid, contentData, theme);
};

const sampleMeta = {
  og: { title: 'Example Title', description: 'Example description', image: 'https://example.com/img.png', site_name: 'Example' },
  themeColor: '#5865f2',
};

function callRender(pid) {
  captured.length = 0;
  let html = null, threw = null;
  try {
    html = sandbox.renderPlatformWithContext(pid, sampleMeta, null, 'https://example.com/page', 'dark', '#3366cc');
  } catch (e) { threw = e && e.message ? e.message : String(e); }
  const cap = captured.find((c) => c.pid === pid) || null;
  return { html, threw, capturedCount: captured.length, captured: cap };
}

// ── Criteria #1, #3, #5: config platforms route through buildContextFrame ───
console.log('\nCriteria #1,#3,#5 — config platforms render via buildContextFrame:');
for (const pid of CONFIG_PLATFORMS) {
  const r = callRender(pid);
  const cfg = sandbox.getPlatformFrameConfig(pid);
  check(`[${pid}] resolves in config (getPlatformFrameConfig)`, !!cfg);
  check(`[${pid}] renders without throwing`, !r.threw, r.threw);
  check(`[${pid}] returns non-empty HTML string`,
    typeof r.html === 'string' && r.html.length > 0, `type=${typeof r.html}`);
  check(`[${pid}] routed through buildContextFrame`, r.capturedCount > 0, 'used a fallback path instead');
  check(`[${pid}] context received frameType from config ("${cfg && cfg.frameType}")`,
    !!r.captured && r.captured.frameType === (cfg && cfg.frameType),
    r.captured ? `got ${r.captured.frameType}` : 'no capture');
  check(`[${pid}] context received aspectRatio from config ("${cfg && cfg.aspectRatio}")`,
    !!r.captured && r.captured.aspectRatio === (cfg && cfg.aspectRatio),
    r.captured ? `got ${r.captured.aspectRatio}` : 'no capture');
}

// ── Criteria #2, #5: absent platforms fall back to legacy, never throw ──────
console.log('\nCriteria #2,#5 — absent platforms fall back to legacy, never throw:');
for (const pid of ABSENT_PLATFORMS) {
  const r = callRender(pid);
  check(`[${pid}] not in config (getPlatformFrameConfig → undefined)`,
    sandbox.getPlatformFrameConfig(pid) === undefined);
  check(`[${pid}] falls back without throwing`, !r.threw, r.threw);
  check(`[${pid}] fallback returns non-empty HTML`,
    typeof r.html === 'string' && r.html.length > 0, `type=${typeof r.html}`);
  check(`[${pid}] did NOT route through buildContextFrame (legacy path)`,
    r.capturedCount === 0, `unexpectedly captured ${r.capturedCount} time(s)`);
}

console.log(`\n${failures === 0 ? '\x1b[32mALL CHECKS PASSED\x1b[0m' : '\x1b[31m' + failures + ' CHECK(S) FAILED\x1b[0m'}`);
process.exit(failures === 0 ? 0 : 1);
