#!/usr/bin/env node
/**
 * bf-65tmk — Project management / RSS platform frame verification.
 *
 * The four frames (jira, trello, asana, feedly) already exist in
 * platform-frames.js with full chrome + themeVars, and frames-theme.css has
 * the .X-context hooks. The gap this bead fills: the brand CSS variables
 * (--jira-bg etc.) referenced by those hooks were never DEFINED, so CSS-driven
 * rendering silently fell back to generic global tokens.
 *
 * This script is the single source-of-truth check: for each platform it asserts
 * that the :root (dark) and [data-theme='light'] values defined in
 * frames-theme.css match the platform's themeVars.dark / themeVars.light in
 * platform-frames.js verbatim (12 properties x 2 modes = 24 per platform,
 * 96 total), and that a .X-context hook exists referencing the brand vars.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, 'src', 'public');
const CSS = fs.readFileSync(path.join(PUB, 'frames-theme.css'), 'utf8');
const JS = fs.readFileSync(path.join(PUB, 'platform-frames.js'), 'utf8');

const PLATFORMS = ['jira', 'trello', 'asana', 'feedly'];
const PROPS = [
  'bg', 'surface', 'border', 'text-primary', 'text-secondary', 'text-muted',
  'accent', 'accent-bg', 'link-color', 'divider', 'input-bg', 'overlay',
];

let pass = 0, fail = 0;
const failures = [];
function check(cond, msg) {
  if (cond) { pass++; }
  else { fail++; failures.push(msg); console.log('  ✗ ' + msg); }
}

/**
 * Extract a value for `--<prefix>-<prop>` from a specific CSS mode block
 * (the :root (dark) block or the [data-theme='light'] block). We split the
 * stylesheet on each `[data-theme='light'] {` to separate dark (everything in
 * :root before the first light block) from light, then regex within.
 */
function splitModes(css) {
  // Remove comments to avoid false matches.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Everything in `:root { ... }` blocks is dark; `[data-theme='light'] { ... }` is light.
  const darkParts = [];
  const lightParts = [];
  // Match :root {...} blocks
  let m;
  const rootRe = /:root\s*\{([\s\S]*?)\}/g;
  while ((m = rootRe.exec(clean)) !== null) darkParts.push(m[1]);
  const lightRe = /\[data-theme=['"]light['"]\]\s*\{([\s\S]*?)\}/g;
  while ((m = lightRe.exec(clean)) !== null) lightParts.push(m[1]);
  return { dark: darkParts.join('\n'), light: lightParts.join('\n') };
}

const { dark: cssDark, light: cssLight } = splitModes(CSS);

/**
 * Extract themeVars for a platform from platform-frames.js.
 * The block looks like:
 *   themeVars: { dark: { '--frame-bg': '#0d1216', ... }, light: { ... } }
 * We find the platform key, then its themeVars, then map --frame-* -> value.
 */
function extractThemeVars(js, platform) {
  // Locate the platform block: `  platform: {` up to the next top-level `  },\n  <nextkey>:` or end.
  const startRe = new RegExp(`\\n  ${platform}:\\s*\\{`);
  const startMatch = startRe.exec(js);
  if (!startMatch) throw new Error(`platform ${platform} not found in JS`);
  const startIdx = startMatch.index;
  // Find the themeVars object within this block.
  const tvIdx = js.indexOf('themeVars:', startIdx);
  if (tvIdx === -1) throw new Error(`${platform}: themeVars not found`);
  // dark block
  const darkIdx = js.indexOf('dark:', tvIdx);
  const darkOpen = js.indexOf('{', darkIdx);
  const darkClose = js.indexOf('}', darkOpen);
  const darkBlock = js.slice(darkOpen + 1, darkClose);
  // light block (after dark close)
  const lightIdx = js.indexOf('light:', darkClose);
  const lightOpen = js.indexOf('{', lightIdx);
  const lightClose = js.indexOf('}', lightOpen);
  const lightBlock = js.slice(lightOpen + 1, lightClose);

  const parse = (block) => {
    const out = {};
    // themeVars values are single-quoted strings (e.g. '#0d1216', 'rgba(0, 0, 0, 0.6)').
    const re = /'(--frame-[a-z-]+)':\s*'([^']+)'/g;
    let mm;
    while ((mm = re.exec(block)) !== null) {
      out[mm[1]] = mm[2].trim();
    }
    return out;
  };
  return { dark: parse(darkBlock), light: parse(lightBlock) };
}

const jsMap = (frameProp) => frameProp; // identity, themeVars use --frame-* keys

console.log('bf-65tmk: verifying jira/trello/asana/feedly CSS brand vars vs JS themeVars\n');

for (const p of PLATFORMS) {
  console.log(`▸ ${p}`);
  // 1. Context hook exists and references brand var.
  const hookRe = new RegExp(`\\.${p}-context\\s*\\{[\\s\\S]*?var\\(--${p}-bg`);
  check(hookRe.test(CSS), `${p}: .${p}-context hook references --${p}-bg`);

  const tv = extractThemeVars(JS, p);
  if (Object.keys(tv.dark).length === 0) {
    check(false, `${p}: failed to extract JS themeVars.dark`);
    continue;
  }

  for (const mode of ['dark', 'light']) {
    const cssSource = mode === 'dark' ? cssDark : cssLight;
    for (const prop of PROPS) {
      const jsVal = tv[mode][`--frame-${prop}`];
      if (jsVal === undefined) {
        check(false, `${p}.${mode}: JS themeVars missing --frame-${prop}`);
        continue;
      }
      // CSS var: `--${p}-${prop}: <value>;` — capture up to `;`
      const re = new RegExp(`--${p}-${prop}\\s*:\\s*([^;]+);`);
      const cssMatch = re.exec(cssSource);
      if (!cssMatch) {
        check(false, `${p}.${mode}: CSS --${p}-${prop} not defined`);
        continue;
      }
      const cssVal = cssMatch[1].trim();
      check(cssVal === jsVal, `${p}.${mode}.--${p}-${prop}: CSS "${cssVal}" === JS "${jsVal}"`);
    }
  }

  // Sanity: dark and light bg must differ for each platform (theme switching works).
  const darkBg = (new RegExp(`--${p}-bg\\s*:\\s*([^;]+);`)).exec(cssDark);
  const lightBg = (new RegExp(`--${p}-bg\\s*:\\s*([^;]+);`)).exec(cssLight);
  if (darkBg && lightBg) {
    check(darkBg[1].trim() !== lightBg[1].trim(),
      `${p}: dark bg (${darkBg[1].trim()}) differs from light bg (${lightBg[1].trim()})`);
  }
}

console.log(`\n────────────────────────────────────────`);
console.log(`PASS: ${pass}   FAIL: ${fail}   (total ${pass + fail})`);
if (fail > 0) {
  console.log('\nFAILURES:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log('\n✓ All 4 platforms: brand CSS vars defined & match JS themeVars verbatim (dark + light).');
