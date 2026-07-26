/**
 * bf-1l2bl — Static verification that EVERY platform frame has complete
 * dark/light theme support.
 *
 * Loads the REAL production module (src/public/platform-frames.js) via require()
 * and asserts, for each platform + the generic template:
 *   1. hasThemeSupport === true
 *   2. themeVars.dark exists and defines every THEME_VAR_NAMES variable
 *   3. themeVars.light exists and defines every THEME_VAR_NAMES variable
 *   4. dark and light palettes actually differ (the toggle is meaningful)
 *
 * Run:  node verify-all-44-theme-static-bf-1l2bl.js
 */
'use strict';

const path = require('path');

// Load the production module — it has a CommonJS module.exports block.
const PF = require(path.join(__dirname, 'src/public/platform-frames.js'));

const {
  PLATFORM_FRAMES,
  THEME_VAR_NAMES,
  hasThemeSupport,
  getSupportedPlatforms,
} = PF;

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m',
};

const platforms = getSupportedPlatforms();
// Include the generic template too — bf-2e9hk added theme support to it.
const allKeys = [...platforms, 'generic'];

let failures = 0;
const rows = [];

function check(label, ok, detail = '') {
  const mark = ok ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
  if (!ok) failures++;
  rows.push(`  ${mark} ${label}${detail ? C.dim + '  ' + detail + C.reset : ''}`);
}

console.log(`${C.bold}\n=== bf-1l2bl Static Theme-Support Verification ===${C.reset}`);
console.log(`Platform source: src/public/platform-frames.js`);
console.log(`Canonical variable set (THEME_VAR_NAMES): ${THEME_VAR_NAMES.length} vars`);
console.log(`Platforms (excl generic): ${platforms.length}  |  + generic template = ${allKeys.length}\n`);

for (const id of allKeys) {
  const frame = PLATFORM_FRAMES[id];
  if (!frame) { check(`${id}: entry exists`, false); continue; }

  // 1. hasThemeSupport flag
  check(`${id}.hasThemeSupport === true`,
    frame.hasThemeSupport === true,
    `(name: ${frame.name || '—'})`);

  // 2 & 3. both themes present with every canonical variable
  for (const mode of ['dark', 'light']) {
    const vars = frame.themeVars && frame.themeVars[mode];
    if (!vars) { check(`${id}.themeVars.${mode} present`, false); continue; }
    const missing = THEME_VAR_NAMES.filter(v => !(v in vars));
    check(`${id}.themeVars.${mode} defines all ${THEME_VAR_NAMES.length} vars`,
      missing.length === 0,
      missing.length ? `missing: ${missing.join(', ')}` : '');
  }

  // 4. the two themes must actually differ somewhere
  const d = frame.themeVars && frame.themeVars.dark;
  const l = frame.themeVars && frame.themeVars.light;
  if (d && l) {
    const diff = THEME_VAR_NAMES.filter(v => d[v] !== l[v]);
    check(`${id} dark vs light differ`, diff.length > 0,
      diff.length ? `${diff.length}/${THEME_VAR_NAMES.length} vars differ` : 'PALETTES IDENTICAL');
  }

  console.log(`${C.cyan}${id}${C.reset}`);
  rows.splice(-4).forEach(r => console.log(r));
  rows.length = 0;
}

// Summary
const themeable = platforms.filter(id => hasThemeSupport(id));
console.log(`\n${C.bold}--- Summary ---${C.reset}`);
console.log(`Platforms supporting theme toggle: ${themeable.length} / ${platforms.length}`);
console.log(`Generic template theme support:    ${hasThemeSupport('generic') ? 'yes' : 'no'}`);
console.log(`Total entries verified:            ${allKeys.length}`);

if (failures === 0) {
  console.log(`${C.green}${C.bold}\nRESULT: ALL PLATFORMS PASS static theme verification.${C.reset}`);
} else {
  console.log(`${C.red}${C.bold}\nRESULT: ${failures} check(s) FAILED.${C.reset}`);
}
process.exit(failures === 0 ? 0 : 1);
