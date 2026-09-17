/**
 * PLATFORM_FRAMES schema & template contract tests — vista-255d3ac4
 *
 * Pins the contract of the runtime frame registry in
 * src/public/platform-frames.js — the module app.js's frame pipeline
 * (buildContextFrame / getPlatformFrame / getThemeVars) is built on:
 *
 *  1. Schema — every registry entry carries the required fields with the
 *     required types (name, category, hasThemeSupport, aspectRatio, chrome,
 *     neutralContent, themeVars.dark/light).
 *  2. Supported platform IDs — IDs are unique and resolvable, and every
 *     platform wired in PLATFORM_FRAMES_CONFIG (the browser runtime mirror of
 *     src/platform-frames.config.ts — the wiring source of truth) has
 *     complete runtime frame data. config-wired ⇒ runtime-ready.
 *  3. Placeholder resolution — templates only use {{word}} placeholders the
 *     interpolator can match, interpolateTemplate mechanics are pinned, and
 *     every content-bearing placeholder a template uses resolves to the
 *     caller-supplied value through buildContextFrame. No {{...}} may ever
 *     survive into rendered HTML.
 *  4. Theme-variable availability — every platform defines ALL THEME_VAR_NAMES
 *     for BOTH dark and light, and getThemeVars degrades to dark, never {}.
 *  5. Helper output — pinned shapes for every exported helper.
 *  6. Legacy fallback — unknown platforms resolve to the generic frame (with
 *     the name overridden), never a crash.
 *  7. app.js fallback wiring (source-level) — a platform missing from the
 *     config routes to the legacy renderer; unexpected errors route to the
 *     safe fallback frame.
 *
 * No DOM, no network — both modules load clean in Node.
 *
 * Usage: node test/unit/platform-frames-schema.test.js  (or via npm test)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PlatformFrames = require(path.join(ROOT, 'src', 'public', 'platform-frames.js'));
const APP_JS_PATH = path.join(ROOT, 'src', 'public', 'app.js');

const {
  PLATFORM_FRAMES,
  THEME_VAR_NAMES,
  getPlatformFrame,
  hasThemeSupport,
  getThemeVars,
  getPlatformsWithThemeSupport,
  generateThemeCSS,
  generateAllThemeCSS,
  buildContextFrame,
  buildLinkPreviewHTML,
  getSupportedPlatforms,
  interpolateTemplate,
  getInlineThemeStyles,
} = PlatformFrames;

// ── Load the config mirror (browser module: give it a window, then promote) ──
global.window = {};
require(path.join(ROOT, 'src', 'public', 'platform-frames-config.js'));
const getAllPlatformIds = global.window.getAllPlatformIds;
const getPlatformFrameConfig = global.window.getPlatformFrameConfig;

let failures = 0;
let passes = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passes++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

// Documented value domains (docs/PLATFORM_FRAMES.md + src/tests/test-platform-frames-config.js)
const VALID_CATEGORIES = ['social', 'messaging', 'collaboration', 'content', 'email', 'rss', 'other'];
const VALID_ASPECT_RATIOS = ['1:1', '1.91:1', '16:9', '9:16', '2:3', 'variable'];

// What buildContextFrame injects into chrome on top of the caller's content
const STRUCTURAL_SLOTS = ['mainResult', 'userMessage', 'linkPreview', 'linkCard', 'cardContent', 'linkCards'];

const PLATFORM_IDS = Object.keys(PLATFORM_FRAMES).filter((id) => id !== 'generic');

// Content markers — unique strings whose presence in rendered HTML proves the
// placeholder carrying them actually resolved.
const CONTENT = {
  title: 'MARKER-TITLE-7f3a',
  description: 'MARKER-DESC-91cd',
  image: 'https://example.com/og-MARKER-IMAGE.png',
  domain: 'marker-domain.example',
  site: 'MARKER-SITE',
  themeColor: '#123456',
  cardHTML: '<div class="marker-card-html">MARKER-CARD</div>',
};

console.log(`\nPLATFORM_FRAMES contract (${PLATFORM_IDS.length} platforms + generic)\n`);

// ── 1. Registry schema ──────────────────────────────────────────────────────
section('1. Every registry entry carries the required fields with the required types');
for (const id of Object.keys(PLATFORM_FRAMES)) {
  const f = PLATFORM_FRAMES[id];
  const label = (desc) => `${id}: ${desc}`;
  check(label('name is a non-empty string'), typeof f.name === 'string' && f.name.length > 0);
  check(label('category is a documented category'),
    VALID_CATEGORIES.includes(f.category), `got ${JSON.stringify(f.category)}`);
  check(label('hasThemeSupport is boolean'), typeof f.hasThemeSupport === 'boolean');
  check(label('aspectRatio is a documented ratio'),
    VALID_ASPECT_RATIOS.includes(f.aspectRatio), `got ${JSON.stringify(f.aspectRatio)}`);
  check(label('chrome is a non-empty template'),
    typeof f.chrome === 'string' && f.chrome.trim().length > 0);
  check(label('neutralContent is a string (may be empty)'), typeof f.neutralContent === 'string');
  check(label('themeVars defines dark and light'),
    Boolean(f.themeVars) && typeof f.themeVars.dark === 'object' && typeof f.themeVars.light === 'object');
}

// ── 2. Supported platform IDs ───────────────────────────────────────────────
section('2. Supported platform IDs are well-formed and config-wired platforms are runtime-ready');
check('registry is non-empty', PLATFORM_IDS.length > 0);
check('platform IDs are unique', new Set(Object.keys(PLATFORM_FRAMES)).size === Object.keys(PLATFORM_FRAMES).length);
check('getSupportedPlatforms() excludes the generic fallback', !getSupportedPlatforms().includes('generic'));
check('getSupportedPlatforms() matches the registry keys',
  JSON.stringify([...getSupportedPlatforms()].sort()) === JSON.stringify([...PLATFORM_IDS].sort()));

const configIds = getAllPlatformIds();
check('config registry is non-empty', configIds.length > 0);
check('no duplicate config IDs', new Set(configIds).size === configIds.length);
for (const pid of configIds) {
  const frame = PLATFORM_FRAMES[pid];
  check(`config-wired "${pid}" has complete runtime frame data`,
    Boolean(frame) && Boolean(frame.chrome) &&
    Boolean(frame.themeVars && frame.themeVars.dark && frame.themeVars.light),
    frame ? 'frame missing chrome/themeVars' : 'missing from PLATFORM_FRAMES');
  check(`config-wired "${pid}" resolves via getPlatformFrameConfig`,
    Boolean(getPlatformFrameConfig(pid)));
}

// ── 3. Placeholder resolution ───────────────────────────────────────────────
section('3. Placeholder resolution');
check('interpolateTemplate replaces provided variables',
  interpolateTemplate('Hello {{name}}, welcome to {{place}}!', { name: 'Ada', place: 'Vista' }) ===
  'Hello Ada, welcome to Vista!');
check('interpolateTemplate blanks unknown placeholders',
  interpolateTemplate('keep {{known}} drop {{unknown}}', { known: 'this' }) === 'keep this drop ');
check('interpolateTemplate stringifies non-string values',
  interpolateTemplate('{{count}} items', { count: 3 }) === '3 items');
check('interpolateTemplate leaves plain text untouched',
  interpolateTemplate('no placeholders here', {}) === 'no placeholders here');

const phRe = /\{\{(\w+)\}\}/g;
const anyLeftoverRe = /\{\{[^}]*\}\}/;
for (const id of Object.keys(PLATFORM_FRAMES)) {
  const f = PLATFORM_FRAMES[id];
  const templates = `${f.chrome}${f.neutralContent}`;
  const bare = templates.replace(phRe, '').replace(/\s+/g, '');
  check(`${id}: templates contain no malformed {{...}} placeholders`, bare.includes('{{') === false);
}

// Which content-bearing placeholders a platform's templates use, resolved the
// way buildContextFrame resolves them (structural slots carry mainContent /
// linkPreview; everything else comes straight off the content object).
function expectedMarkers(f) {
  const chrome = f.chrome;
  const neutral = f.neutralContent;
  const wants = (re) => re.test(chrome);
  const markers = [];
  const neutralHas = (name) => neutral.includes(`{{${name}}}`);
  const mainContentCarries = (name) =>
    (wants(/\{\{mainResult\}\}/) || wants(/\{\{userMessage\}\}/)) && neutralHas(name);
  if (chrome.includes('{{title}}') || mainContentCarries('title')) markers.push(CONTENT.title);
  if (chrome.includes('{{description}}') || mainContentCarries('description')) markers.push(CONTENT.description);
  if (chrome.includes('{{domain}}') || mainContentCarries('domain')) markers.push(CONTENT.domain);
  if (chrome.includes('{{site}}') || mainContentCarries('site')) markers.push(CONTENT.site);
  if (chrome.includes('{{themeColor}}') || mainContentCarries('themeColor')) markers.push(CONTENT.themeColor);
  if (wants(/\{\{linkPreview\}\}/) || wants(/\{\{linkCard\}\}/) || wants(/\{\{cardContent\}\}/)) {
    markers.push('MARKER-CARD');
  }
  return markers;
}

for (const id of Object.keys(PLATFORM_FRAMES)) {
  const f = PLATFORM_FRAMES[id];
  const html = buildContextFrame(id, { ...CONTENT }, 'dark');
  const markers = expectedMarkers(f);
  check(`${id}: rendered HTML carries every content placeholder it uses`,
    markers.every((m) => html.includes(m)),
    `missing ${markers.filter((m) => !html.includes(m)).join(', ') || '?'}`);
  check(`${id}: no {{...}} survives into rendered HTML`, !anyLeftoverRe.test(html));
}

section('3b. Unknown platforms render a NAMED generic header (platformName resolves)');
const fallbackHtml = buildContextFrame('mystery-platform', { ...CONTENT }, 'dark');
check('generic fallback header carries the platform id, not an empty title',
  fallbackHtml.includes('<span class="context-title">mystery-platform</span>'));

// ── 4. Theme-variable availability ──────────────────────────────────────────
section('4. Theme-variable availability');
check('THEME_VAR_NAMES catalog is non-empty', THEME_VAR_NAMES.length > 0);
for (const id of Object.keys(PLATFORM_FRAMES)) {
  const f = PLATFORM_FRAMES[id];
  for (const mode of ['dark', 'light']) {
    const vars = f.themeVars[mode];
    const missing = THEME_VAR_NAMES.filter((name) => !vars[name]);
    check(`${id}: ${mode} theme defines every catalogued --frame-* variable`,
      missing.length === 0, `missing ${missing.join(', ') || '?'}`);
    check(`${id}: ${mode} theme values are non-empty strings`,
      THEME_VAR_NAMES.every((name) => typeof vars[name] === 'string' && vars[name].length > 0));
  }
  check(`${id}: dark and light themes differ (a toggle that changes nothing is a bug)`,
    JSON.stringify(f.themeVars.dark) !== JSON.stringify(f.themeVars.light));
}
check("getThemeVars(pid, 'light') returns the light set",
  getThemeVars('twitter', 'light') === PLATFORM_FRAMES.twitter.themeVars.light);
check('getThemeVars defaults to dark',
  getThemeVars('twitter') === PLATFORM_FRAMES.twitter.themeVars.dark);
check('getThemeVars falls back to dark for an unknown mode (never {})',
  getThemeVars('twitter', 'sepia') === PLATFORM_FRAMES.twitter.themeVars.dark);
check("getThemeVars('unknown-platform') returns the generic dark set",
  getThemeVars('unknown-platform', 'dark') === PLATFORM_FRAMES.generic.themeVars.dark);

// ── 5. Helper output ────────────────────────────────────────────────────────
section('5. Helper output');
check('getPlatformFrame returns the registry entry itself',
  getPlatformFrame('twitter') === PLATFORM_FRAMES.twitter);
check('hasThemeSupport mirrors hasThemeSupport for a themeable platform',
  hasThemeSupport('twitter') === true);
check('getPlatformsWithThemeSupport matches the registry',
  JSON.stringify(getPlatformsWithThemeSupport().sort()) ===
  JSON.stringify(Object.keys(PLATFORM_FRAMES).filter((id) => PLATFORM_FRAMES[id].hasThemeSupport).sort()));
check('generateThemeCSS targets the platform+theme class pair',
  generateThemeCSS('twitter', 'dark').startsWith('.twitter-context.dark-theme {'));
check('generateThemeCSS emits custom properties',
  /--frame-bg:\s*#000000/.test(generateThemeCSS('twitter', 'dark')));
check('generateAllThemeCSS emits both theme classes for a themeable platform',
  generateAllThemeCSS('twitter').includes('.twitter-context.dark-theme') &&
  generateAllThemeCSS('twitter').includes('.twitter-context.light-theme'));
check('getInlineThemeStyles joins custom properties for inline use',
  getInlineThemeStyles('twitter', 'dark').includes('--frame-bg:#000000'));
check('buildLinkPreviewHTML escapes HTML in content',
  buildLinkPreviewHTML('unknown-platform', { title: '<script>alert(1)</script>', domain: 'x.example' }, 'dark')
    .includes('&lt;script&gt;'));

const built = buildContextFrame('twitter', { ...CONTENT }, 'dark');
check('buildContextFrame wraps output in a context-frame with the platform class',
  built.includes('class="context-frame twitter-context dark-theme"'));
check('buildContextFrame stamps data-platform and theme attributes',
  built.includes('data-platform="twitter"') && built.includes('data-theme="dark"') &&
  built.includes('data-frame-theme="dark"'));
check('buildContextFrame inlines the theme variables',
  built.includes('--frame-bg:#000000'));
const firstId = (built.match(/id="(frame-twitter-\d+)"/) || [])[1];
const secondId = ((buildContextFrame('twitter', { ...CONTENT }, 'dark')).match(/id="(frame-twitter-\d+)"/) || [])[1];
check('buildContextFrame generates a unique instance id per call',
  Boolean(firstId) && Boolean(secondId) && firstId !== secondId);
check('buildContextFrame embeds the caller-supplied card HTML',
  built.includes('MARKER-CARD'));

// Non-themeable branch: probe with a temporary registry entry (removed again).
const PROBE_ID = '__contract_probe__';
try {
  PLATFORM_FRAMES[PROBE_ID] = {
    name: 'Contract Probe',
    category: 'other',
    hasThemeSupport: false,
    aspectRatio: 'variable',
    chrome: '<div class="probe">{{cardContent}}</div>',
    neutralContent: '',
    themeVars: {
      dark: Object.fromEntries(THEME_VAR_NAMES.map((n) => [n, '#111111'])),
      light: Object.fromEntries(THEME_VAR_NAMES.map((n) => [n, '#eeeeee'])),
    },
  };
  check('hasThemeSupport honours an explicit false', hasThemeSupport(PROBE_ID) === false);
  check('generateAllThemeCSS emits only the dark class for a non-themeable platform',
    generateAllThemeCSS(PROBE_ID).includes(`.${PROBE_ID}-context.dark-theme`) &&
    !generateAllThemeCSS(PROBE_ID).includes('light-theme'));
  check('buildContextFrame omits the theme class for a non-themeable platform',
    buildContextFrame(PROBE_ID, { ...CONTENT }, 'light').includes('class="context-frame __contract_probe__-context"') &&
    !buildContextFrame(PROBE_ID, { ...CONTENT }, 'light').includes('light-theme'));
} finally {
  delete PLATFORM_FRAMES[PROBE_ID];
}
check('probe entry removed from the registry', !(PROBE_ID in PLATFORM_FRAMES));

// ── 6. Legacy fallback & safe handling of unknown platforms ────────────────
section('6. Legacy fallback and safe handling of unknown platforms');
const UNKNOWN_INPUTS = [undefined, null, '', 'no-such-platform', 'Twitter', 42];
for (const input of UNKNOWN_INPUTS) {
  const label = `unknown input ${JSON.stringify(input)}`;
  let frame;
  let noThrow = true;
  try {
    frame = getPlatformFrame(input);
  } catch (e) {
    noThrow = false;
  }
  check(`${label}: getPlatformFrame does not throw`, noThrow);
  check(`${label}: resolves to the generic frame shape`,
    Boolean(frame) && Boolean(frame.chrome) && Boolean(frame.themeVars && frame.themeVars.dark));
  check(`${label}: fallback name echoes the requested id as-is (spread override, type preserved)`,
    frame.name === input);
}

check("unknown platform: hasThemeSupport is boolean (generic's value) — pinned, not aspirational",
  typeof hasThemeSupport('no-such-platform') === 'boolean');
check('unknown platform: getThemeVars still yields a full variable set',
  THEME_VAR_NAMES.every((n) => getThemeVars('no-such-platform', 'dark')[n]));
check('unknown platform: generateThemeCSS still produces a themed rule',
  generateThemeCSS('no-such-platform', 'dark').includes('--frame-bg'));
check('unknown platform: getInlineThemeStyles still yields inline vars',
  getInlineThemeStyles('no-such-platform', 'dark').includes('--frame-bg:'));
check('unknown platform: buildContextFrame renders the generic chrome, stamped with the id',
  (() => {
    const html = buildContextFrame('no-such-platform', { ...CONTENT }, 'dark');
    return html.includes('data-platform="no-such-platform"') &&
      html.includes('context-header') &&
      html.includes('MARKER-CARD');
  })());
check('unknown platform: buildLinkPreviewHTML falls back to the generic preview',
  buildLinkPreviewHTML('no-such-platform', { ...CONTENT }, 'dark').includes('generic-link-preview'));
check('unknown platform: interpolation of a template with no vars is safe',
  interpolateTemplate(PLATFORM_FRAMES.generic.chrome, {}).includes('context-header'));

// ── 7. app.js fallback wiring (source-level) ────────────────────────────────
section('7. app.js routes config misses to the legacy renderer (source-level)');
const appSource = fs.readFileSync(APP_JS_PATH, 'utf8');
check('renderPlatformWithContext consults getPlatformFrameConfig',
  appSource.includes('getPlatformFrameConfig(pid)'));
check('a config miss routes to renderPlatformWithContextLegacy',
  /if \(!frameConfig\) \{[\s\S]{0,220}renderPlatformWithContextLegacy\(/.test(appSource));
check('a missing platform-frames runtime routes to the legacy renderer',
  /platform-frames runtime not loaded, using legacy fallback/.test(appSource));
check('an invalid runtime frame routes to the generic frame',
  /Invalid frame configuration for \$\{pid\}, using fallback/.test(appSource));
check('unexpected errors route to the safe fallback frame',
  /return renderSafeFallbackFrame\(pid, contentData, theme\)/.test(appSource));

console.log(`\n${'─'.repeat(60)}`);
console.log(`PLATFORM_FRAMES contract: ${passes} passed, ${failures} failed`);
console.log(`${'─'.repeat(60)}`);
process.exit(failures > 0 ? 1 : 0);
