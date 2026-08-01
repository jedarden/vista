'use strict';

/**
 * End-to-end routing verification for bead bf-o164e.
 *
 * Unlike test-link-aggregator-frames-wiring.js (which tests buildContextFrame in
 * isolation and REIMPLEMENTs the wiring gate), this harness loads the REAL
 * app.js and invokes the actual renderPlatformWithContext('reddit', ...) entry
 * point. It proves AC1 against the genuine routing function: reddit must come
 * out of buildContextFrame (the centralized rendering context), NOT the legacy
 * fallback. AC2–AC5 are then asserted against that real output.
 *
 * Run: node verify-reddit-e2e-bf-o164e.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUB = path.resolve(__dirname, 'src', 'public');
const read = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');

// --- Build one shared sandbox and load the three runtime scripts into it ---
// app.js is a browser script: it accesses platform-frames globals (PLATFORM_FRAMES,
// getPlatformFrame, buildContextFrame, getPlatformFrameConfig) that the other two
// scripts attach to `window`. Give the sandbox `window = sandbox` so those land in
// the same global object app.js reads from.
// Minimal DOM shim: app.js grabs element refs at load (e.g. $('#hero')); those
// resolve to null and are harmless for this routing test.
const noopEl = {
  querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  style: {}, setAttribute: () => {}, appendChild: () => {}, insertAdjacentHTML: () => {},
  innerHTML: '', textContent: '', value: '', dataset: {},
};
const documentShim = {
  querySelector: () => noopEl, querySelectorAll: () => [], addEventListener: () => {},
  getElementById: () => noopEl, createElement: () => ({ ...noopEl }),
  body: noopEl, documentElement: noopEl, readyState: 'complete',
};

const sandbox = {
  console,
  document: documentShim,
  fetch: () => { throw new Error('fetch should not be called during this test'); },
  setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  URL, URLSearchParams,
  location: { hash: '', href: 'https://example.com/', pathname: '/' },
  addEventListener: () => {}, removeEventListener: () => {},
  requestAnimationFrame: (cb) => cb && cb(0),
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  navigator: { userAgent: 'node', clipboard: { writeText: () => {} } },
  history: { pushState: () => {}, replaceState: () => {} },
};
// No-op browser constructors app.js may instantiate at load time.
class NoopObserver { constructor() {} observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
sandbox.MutationObserver = NoopObserver;
sandbox.IntersectionObserver = NoopObserver;
sandbox.ResizeObserver = NoopObserver;
sandbox.Event = function () {};
sandbox.CustomEvent = function () {};
sandbox.window = sandbox;            // scripts do `window.X = ...`
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// platform-frames-config.js attaches config + helpers to window(sandbox)
vm.runInContext(read('platform-frames-config.js'), sandbox, { filename: 'platform-frames-config.js' });
// platform-frames.js: prefers module.exports if `module` exists; force the window path
vm.runInContext(read('platform-frames.js'), sandbox, { filename: 'platform-frames.js' });
// app.js: defines renderPlatformWithContext and friends on the sandbox global
vm.runInContext(read('app.js'), sandbox, { filename: 'app.js' });

const render = sandbox.renderPlatformWithContext;
if (typeof render !== 'function') {
  console.error('FATAL: renderPlatformWithContext not exposed on the sandbox global');
  process.exit(2);
}

// Realistic meta payload, shaped like the server's inspection output.
const meta = {
  og: { title: 'How to Build Better APIs', description: 'REST and GraphQL best practices.', image: 'https://example.com/og.png', site_name: 'Example' },
  twitter: { card: 'summary_large_image' },
  themeColor: '#FF4500',
};

let failures = 0;
const results = [];
const check = (label, cond) => { results.push({ label, ok: !!cond }); if (!cond) failures++; };

// Capture console.warn so we can detect whether the legacy-fallback warning fired
// (the real AC1 signal — renderPlatformWithContext logs the warn before falling back).
const warns = [];
const origWarn = console.warn;
console.warn = (...a) => warns.push(a.join(' '));

let dark = '';
let light = '';
try {
  dark = render('reddit', meta, null, 'https://example.com/post', 'dark', '#FF4500');
  light = render('reddit', meta, null, 'https://example.com/post', 'light', '#FF4500');
} finally {
  console.warn = origWarn;
}

// AC1 — routed through the centralized context, NOT legacy.
// The legacy path is taken only when renderPlatformWithContext logs its
// "... not in PLATFORM_FRAMES_CONFIG, using legacy fallback" warn. Absence of
// that warn + presence of the centralized wrapper proves the real route.
const legacyWarned = warns.some((w) => /legacy fallback/i.test(w));
check('AC1 no legacy-fallback warn from real renderPlatformWithContext', !legacyWarned);
check('AC1 reddit-context wrapper (centralized buildContextFrame output)', /reddit-context/.test(dark));
check('AC1 centralized frame-type-link-aggregator class present', /frame-type-link-aggregator/.test(dark));

// AC2 — link-aggregator chrome
check('AC2 subreddit name (r/webdev)', /r\/webdev/.test(dark));
check('AC2 upvote score', /rd-vote-count">\s*[0-9.]+k?\s*</.test(dark));
check('AC2 vote arrows (▲ ▼)', /rd-upvote-arrow">▲/.test(dark) && /rd-downvote-arrow">▼/.test(dark));
check('AC2 comment count (N comments)', /\d+\s+comments/.test(dark));

// AC3 — embedded card + theme-aware bg + padding
check('AC3 inline --frame-bg (theme-aware bg)', /--frame-bg:/.test(dark));
check('AC3 embedded link preview content', /link-preview|link-card|context-/i.test(dark));

// AC4 — recognizably Reddit, no unfilled placeholders
check('AC4 rd-subreddit chrome', /rd-subreddit/.test(dark));
check('AC4 rd-upvote chrome', /rd-upvote/.test(dark));
check('AC4 no unfilled {{placeholders}}', !/\{\{(\w+)\}\}/.test(dark));

// AC5 — both themes render with distinct backgrounds
const dv = (dark.match(/--frame-bg:([^;]+)/) || [])[1];
const lv = (light.match(/--frame-bg:([^;]+)/) || [])[1];
check('AC5 dark-theme class', /dark-theme/.test(dark));
check('AC5 light-theme class', /light-theme/.test(light));
check('AC5 dark vs light bg differ', dv !== lv);

for (const r of results) console.log(`  ${r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${r.label}`);
console.log(`\n${failures === 0 ? '\x1b[32mALL END-TO-END CHECKS PASSED\x1b[0m' : `\x1b[31m${failures} CHECK(S) FAILED\x1b[0m`}`);
process.exit(failures === 0 ? 0 : 1);
