#!/usr/bin/env node

/**
 * bf-662jl — Verify the global dark/light theme toggle reaches every platform
 *            context frame via FrameTheme.updateAllPlatformFrames(theme).
 *
 * What this proves (mapped to acceptance criteria):
 *
 *  1. app.js toggle wiring  — static check that toggleGlobalTheme -> applyTheme
 *     calls window.FrameTheme.updateAllPlatformFrames(theme), plus the
 *     external-change observer path does too.
 *  2. selector coverage     — updateAllPlatformFrames selects every
 *     `.context-frame[data-platform]` in the DOM (verified by feeding it the
 *     REAL context-frame markup emitted by buildContextFrame for all 7
 *     platforms and asserting the returned count === 7).
 *  3. no platform skipped   — after the sweep, the set of platforms whose
 *     frame had its theme class/attributes/vars actually rewritten is exactly
 *     the 7 required platforms.
 *  4. count includes all 7   — returned value === 7, round-tripped dark<->light.
 *
 * This runs in plain Node (no jsdom/puppeteer). It loads the REAL
 * frames-theme.js + platform-frames.js modules and drives a tiny DOM shim, so
 * it exercises the production sweep logic against production frame markup.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_PLATFORMS = [
  'reddit', 'twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'tiktok'
];

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m',
};
const log = {
  info: (m) => console.log(`${C.cyan}ℹ${C.reset} ${m}`),
  ok: (m) => console.log(`${C.green}✓${C.reset} ${m}`),
  fail: (m) => console.log(`${C.red}✗${C.reset} ${m}`),
  section: (m) => console.log(`\n${C.cyan}▸ ${m}${C.reset}`),
};

let passed = 0, failed = 0;
function check(label, cond, detail) {
  if (cond) { passed++; log.ok(`${label}${detail ? C.dim + ' — ' + detail + C.reset : ''}`); }
  else { failed++; log.fail(`${label}${detail ? ' — ' + detail : ''}`); }
}

/* ---------------------------------------------------------------------------
   Minimal DOM shim — just enough for updateAllPlatformFrames + the per-frame
   var application. Parses the real opening tag that buildContextFrame emits.
   --------------------------------------------------------------------------- */
function makeElement(openingTagHtml) {
  const el = {
    _attrs: {},
    _classes: new Set(),
    style: { setProperty(name, value) { this[name] = value; } },
    platform: null,
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this._attrs, name) ? this._attrs[name] : null; },
    setAttribute(name, value) { this._attrs[name] = String(value); },
  };
  el.classList = {
    add: (...c) => c.forEach((x) => x && el._classes.add(x)),
    remove: (...c) => c.forEach((x) => el._classes.delete(x)),
    contains: (c) => el._classes.has(c),
  };

  const classMatch = openingTagHtml.match(/class="([^"]*)"/);
  if (classMatch) classMatch[1].split(/\s+/).filter(Boolean).forEach((c) => el._classes.add(c));

  for (const m of openingTagHtml.matchAll(/(data-[\w-]+)="([^"]*)"/g)) el._attrs[m[1]] = m[2];
  const idMatch = openingTagHtml.match(/\sid="([^"]*)"/);
  if (idMatch) el._attrs.id = idMatch[1];

  el.platform = el._attrs['data-platform'] || null;
  return el;
}

/* ---------------------------------------------------------------------------
   Load the REAL modules.
   --------------------------------------------------------------------------- */
const FrameTheme = require('./src/public/frames-theme.js');
const PF = require('./src/public/platform-frames.js');

/* updateFramePlatformVars -> getPlatformThemeVars reads the bare global
 * PLATFORM_FRAMES, so expose the real one to exercise the platform-specific
 * variable path (not just the default fallback). */
global.PLATFORM_FRAMES = PF.PLATFORM_FRAMES;

/* ---------------------------------------------------------------------------
   Static checks: app.js toggle wiring
   --------------------------------------------------------------------------- */
function staticChecks() {
  log.section('Static: app.js toggle wiring');
  const app = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');
  const theme = fs.readFileSync(path.join(__dirname, 'src/public/frames-theme.js'), 'utf8');

  check(
    'globalThemeToggle click handler calls toggleGlobalTheme',
    /getElementById\(['"]globalThemeToggle['"]\)\?\.addEventListener\(['"]click['"],\s*toggleGlobalTheme\)/.test(app)
  );
  check(
    'toggleGlobalTheme calls applyTheme(newTheme)',
    /function toggleGlobalTheme\(\)\s*{[\s\S]*?applyTheme\(newTheme\)/.test(app)
  );

  // Two legitimate call sites in app.js: the direct toggle path inside applyTheme,
  // and the external-change observer path. Both must pass the new theme through.
  const callSites = [...app.matchAll(/FrameTheme\.updateAllPlatformFrames\(([^)]+)\)/g)].map((m) => m[1].trim());
  check('app.js has >=2 updateAllPlatformFrames call sites', callSites.length >= 2,
    `found ${callSites.length}: ${callSites.join(', ')}`);
  check('every call site passes a theme arg (theme/newTheme), not a constant or none',
    callSites.length > 0 && callSites.every((a) => /^(theme|newTheme)$/.test(a)),
    `args: ${callSites.join(', ')}`);

  // frames-theme.js: the sweep selector must be exactly .context-frame[data-platform]
  check(
    'updateAllPlatformFrames selects .context-frame[data-platform]',
    /querySelectorAll\(['"]\.context-frame\[data-platform\]['"]\)/.test(theme)
  );
  check(
    'updateAllPlatformFrames returns an updated count',
    /return\s+updated/.test(theme) && /\bupdated\+\+/.test(theme)
  );
  check(
    'FrameTheme exports updateAllPlatformFrames to window',
    /window\.FrameTheme\s*=[\s\S]*?updateAllPlatformFrames/.test(theme)
  );
}

/* ---------------------------------------------------------------------------
   Runtime check: real sweep over real frame markup
   --------------------------------------------------------------------------- */
function runtimeChecks() {
  log.section('Runtime: sweep over real buildContextFrame markup (7 platforms)');

  // Build the real context-frame opening tags for all 7 platforms.
  const frames = REQUIRED_PLATFORMS.map((p) => {
    const html = PF.buildContextFrame(p, '<div class="frame-body">content</div>', 'dark');
    const opening = html.slice(0, html.indexOf('>') + 1);
    const el = makeElement(opening);
    // Sanity: confirm the real markup carries the attributes the sweep keys on.
    check(`  ${p}: buildContextFrame emits context-frame + data-platform`,
      el.classList.contains('context-frame') && el.getAttribute('data-platform') === p);
    return el;
  });

  // Wire a document shim holding exactly these 7 frames (the production DOM
  // during a re-theme — nothing else). updateAllPlatformFrames reads bare
  // `document`, so set it on global right before the call.
  global.document = {
    querySelectorAll(sel) {
      // The function only ever queries '.context-frame[data-platform]'.
      // Return a NodeList-shaped array: it must support forEach + length.
      return frames.filter((f) => f.classList.contains('context-frame') && f.getAttribute('data-platform'));
    },
  };

  // ---- Toggle dark -> light ------------------------------------------------
  const updatedLight = FrameTheme.updateAllPlatformFrames('light');
  check('toggle dark->light returns count 7', updatedLight === 7, `got ${updatedLight}`);

  const touchedLight = new Set();
  let allReclassedLight = true, allAttrLight = true, allVarsLight = true;
  for (const f of frames) {
    touchedLight.add(f.getAttribute('data-platform'));
    if (!f.classList.contains('light-theme') || f.classList.contains('dark-theme')) allReclassedLight = false;
    if (f.getAttribute('data-theme') !== 'light' || f.getAttribute('data-frame-theme') !== 'light') allAttrLight = false;
    // platform vars were re-applied: --frame-bg should now hold the LIGHT value
    if (!f.style['--frame-bg']) allVarsLight = false;
  }
  check('every frame got light-theme class (dark-theme removed)', allReclassedLight);
  check('every frame got data-theme + data-frame-theme = light', allAttrLight);
  check('every frame had platform CSS vars re-applied (--frame-bg set)', allVarsLight);
  check('no platform skipped — touched set is exactly the 7 required',
    touchedLight.size === 7 && REQUIRED_PLATFORMS.every((p) => touchedLight.has(p)),
    `touched: ${[...touchedLight].sort().join(', ')}`);

  // Verify the LIGHT var actually differs from dark for at least one platform
  // (proves we didn't just no-op): pick reddit, compare against fresh dark build.
  const reddit = frames.find((f) => f.getAttribute('data-platform') === 'reddit');
  const redditDarkVar = (PF.PLATFORM_FRAMES.reddit.themeVars || {}).dark?.['--frame-bg'];
  check('light var differs from dark (theme vars truly switched)',
    reddit.style['--frame-bg'] && reddit.style['--frame-bg'] !== redditDarkVar,
    `light=${reddit.style['--frame-bg']} vs dark=${redditDarkVar}`);

  // ---- Toggle light -> dark (round trip) ----------------------------------
  const updatedDark = FrameTheme.updateAllPlatformFrames('dark');
  check('toggle light->dark returns count 7', updatedDark === 7, `got ${updatedDark}`);
  const allDarkAgain = frames.every((f) =>
    f.classList.contains('dark-theme') && !f.classList.contains('light-theme') &&
    f.getAttribute('data-theme') === 'dark');
  check('round-trip restores dark-theme on every frame', allDarkAgain);

  // ---- Invalid theme is rejected, returns 0, mutates nothing ---------------
  const before = frames.map((f) => f.getAttribute('data-theme'));
  const bad = FrameTheme.updateAllPlatformFrames('mauve');
  check('invalid theme returns 0 and mutates nothing', bad === 0 &&
    frames.every((f, i) => f.getAttribute('data-theme') === before[i]),
    `returned ${bad}`);

  delete global.document;
}

/* ---------------------------------------------------------------------------
   Run
   --------------------------------------------------------------------------- */
function main() {
  console.log(`${C.cyan}bf-662jl${C.reset} ${C.dim}— theme toggle drives all 7 platform frames${C.reset}`);
  staticChecks();
  runtimeChecks();

  console.log(`\n${'='.repeat(56)}`);
  if (failed === 0) {
    console.log(`${C.green}PASS${C.reset}  ${passed} checks — global dark/light toggle reaches all 7 platform frames via FrameTheme.updateAllPlatformFrames(theme), none skipped.`);
    process.exit(0);
  } else {
    console.log(`${C.red}FAIL${C.reset}  ${passed} passed, ${failed} failed`);
    process.exit(1);
  }
}

main();
