/**
 * WCAG AA contrast regression tests — vista-2971663c
 *
 * Converts the manual contrast verification documented in
 * docs/THEME_VARIABLE_VERIFICATION.md (§3 — open a browser, load
 * src/public/contrast-utility.js, run contrastReport('dark') /
 * contrastReport('light') in the console) into an automated, DOM-free test
 * over BOTH documented theme surfaces:
 *
 *   1. frames-theme.css            — the `--{platform}-*` alias namespaces
 *                                    defined in `:root` (dark) and
 *                                    `[data-theme='light']` blocks, the file
 *                                    that doc designates as the source of
 *                                    truth for platform theme colors.
 *   2. src/public/platform-frames.js — the runtime frame registry whose
 *                                    `themeVars.dark/light` render every
 *                                    context frame (including `generic`, the
 *                                    frame unknown platforms fall back to).
 *
 * Enforced combinations are exactly the ones the documented verification
 * PASS/FAILs (contrast-utility's checkPlatformContrast): text-primary on bg,
 * text-secondary on bg, and text-primary on surface, at the WCAG AA normal
 * text threshold (≥4.5:1). Accent/link colors are reported by the manual tool
 * but deliberately excluded from its pass criteria (brand accents such as
 * KakaoTalk yellow cannot meet 4.5:1 as text), so they are excluded here too.
 *
 * Known AA violations are not hidden: each sits in an explicit ratchet
 * allowlist pinned at its current measured floor, so it can never get worse,
 * and each entry asserts it is STILL a violation — the moment someone fixes a
 * color the test fails and forces the allowlist entry to be removed. Any NEW
 * violation (not in the allowlist) fails outright.
 *
 * Color math is ContrastChecker itself (the documented tool), not a
 * reimplementation. No DOM, no network, no installed dependencies — parses CSS
 * text and loads two dependency-free modules, so it runs in a clean checkout.
 *
 * Usage: node test/unit/wcag-contrast.test.js  (or via npm test)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const THEME_CSS_PATH = path.join(ROOT, 'src', 'public', 'frames-theme.css');
const ContrastChecker = require(path.join(ROOT, 'src', 'public', 'contrast-utility.js'));
const PlatformFrames = require(path.join(ROOT, 'src', 'public', 'platform-frames.js'));
const { PLATFORMS } = require(path.join(ROOT, 'src', 'scorer.js'));

// WCAG AA for normal text. ContrastChecker.meetsWCAG encodes this too; the
// literal is what the ratchet allowlist is measured against.
const AA_NORMAL = 4.5;

// The combinations the documented manual verification PASS/FAILs.
const COMBOS = [
  { key: 'text-primary-on-bg', fg: 'text-primary', bg: 'bg' },
  { key: 'text-secondary-on-bg', fg: 'text-secondary', bg: 'bg' },
  { key: 'text-primary-on-surface', fg: 'text-primary', bg: 'surface' },
];

// Ratchet allowlist — current AA violations, pinned at their measured floor
// (value truncated to 2dp at pin time). `colors` documents the offending pair.
// An entry may only be removed by FIXING the color: the test asserts each
// entry still violates AA (see below).
const KNOWN_VIOLATIONS = {
  css: {
    'hackernews:light:text-secondary-on-bg': { floor: 3.84, colors: '#828282 on #ffffff' },
    'jetbrains:dark:text-secondary-on-bg': { floor: 3.58, colors: '#808080 on #2b2b2b' },
    'notion:light:text-secondary-on-bg': { floor: 4.47, colors: '#787774 on #ffffff' },
    'reddit:light:text-secondary-on-bg': { floor: 4.17, colors: '#7c7c7c on #ffffff' },
  },
  registry: {
    'imessage:light:text-secondary-on-bg': { floor: 3.92, colors: '#6e6e73 on #e5e1e5' },
    'stackoverflow:dark:text-secondary-on-bg': { floor: 4.22, colors: '#808080 on #1e1e1e' },
    'hackernews:light:text-secondary-on-bg': { floor: 3.84, colors: '#828282 on #ffffff' },
    'notion:light:text-secondary-on-bg': { floor: 4.47, colors: '#787774 on #ffffff' },
    'jetbrains:dark:text-secondary-on-bg': { floor: 3.58, colors: '#808080 on #2b2b2b' },
  },
};

// Namespaces the original verification report (THEME_VARIABLE_VERIFICATION.md)
// claims AA compliance for — they must remain present in the CSS surface.
const ORIGINALLY_VERIFIED = ['youtube', 'twitch', 'twitter', 'reddit', 'tiktok', 'github', 'gitlab'];

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

// ── CSS parsing ─────────────────────────────────────────────────────────────

/**
 * Parse frames-theme.css into per-theme custom-property maps.
 * `:root` blocks → dark, `[data-theme='light']` blocks → light, anything
 * else → 'other' (captured but never consumed). Inline comments are stripped
 * so commented-out declarations cannot enter the audit.
 */
function parseThemeCss(cssText) {
  const vars = { dark: {}, light: {}, other: {} };
  let ctx = 'other';
  for (const rawLine of cssText.split('\n')) {
    const line = rawLine.replace(/\/\*.*?\*\//g, '').trimEnd();
    const selector = line.match(/^([a-zA-Z\[:.#][^{]*)\{/);
    if (selector) {
      ctx = /^\s*:root\s*$/.test(selector[1].trim())
        ? 'dark'
        : /data-theme\s*=\s*['"]light['"]/.test(selector[1])
          ? 'light'
          : 'other';
    }
    if (line.includes('}')) ctx = 'other';
    const decl = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/);
    if (decl) vars[ctx][decl[1]] = decl[2].trim();
  }
  return vars;
}

/**
 * Resolve a custom property to a concrete color, following var() references.
 * Lookup prefers the requested theme and falls back to the other one, which
 * is exactly the CSS cascade: per-theme alias blocks define both themes, while
 * the global `--color-*` tokens live only in `:root` and apply to both.
 */
function resolveVar(vars, name, theme, depth = 0) {
  if (depth > 10) return null; // cycle / runaway chain
  const declared = vars[theme][name] ?? vars[theme === 'dark' ? 'light' : 'dark'][name];
  if (declared === undefined) return null;
  const ref = declared.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/);
  if (ref) return resolveVar(vars, ref[1], theme, depth + 1) ?? (ref[2] ? ref[2].trim() : null);
  return declared;
}

/**
 * Every single-segment namespace that owns a `--{ns}-bg` alias (e.g.
 * `--reddit-bg` → reddit). Global tokens (`--color-*-bg`) and sub-element
 * vars (`--x-avatar-bg`) cannot match a single segment, and `x` is a display
 * alias of twitter, not a namespace of its own (docs/PLATFORM_INVENTORY.md).
 */
function cssNamespaces(vars) {
  const names = new Set();
  for (const theme of ['dark', 'light']) {
    for (const name of Object.keys(vars[theme])) {
      const m = name.match(/^--([a-z0-9]+)-bg$/);
      if (m && m[1] !== 'color') names.add(m[1]);
    }
  }
  return [...names].sort();
}

// ── 1. The shared math and its thresholds ───────────────────────────────────
section('1. ContrastChecker math and WCAG thresholds (the documented tool, pinned)');
check('white on black is 21:1',
  Math.abs(ContrastChecker.calculateContrastRatio('#ffffff', '#000000') - 21) < 1e-9);
check('identical colors are 1:1',
  Math.abs(ContrastChecker.calculateContrastRatio('#1a1a1a', '#1a1a1a') - 1) < 1e-9);
check('3-digit hex is expanded (#fff on #000)',
  Math.abs(ContrastChecker.calculateContrastRatio('#fff', '#000') - 21) < 1e-9);
check('AA normal-text threshold is 4.5',
  ContrastChecker.meetsWCAG(4.5, 'normal', 'AA') === true &&
  ContrastChecker.meetsWCAG(4.49, 'normal', 'AA') === false);
check('AA large-text threshold is 3.0',
  ContrastChecker.meetsWCAG(3.0, 'large', 'AA') === true &&
  ContrastChecker.meetsWCAG(2.99, 'large', 'AA') === false);
check('AAA normal-text threshold is 7.0',
  ContrastChecker.meetsWCAG(7.0, 'normal', 'AAA') === true &&
  ContrastChecker.meetsWCAG(6.99, 'normal', 'AAA') === false);

// ── 2. frames-theme.css coverage ────────────────────────────────────────────
section('2. frames-theme.css parses and every namespace is auditable in both themes');
const cssText = fs.readFileSync(THEME_CSS_PATH, 'utf8');
const cssVars = parseThemeCss(cssText);
const cssNamespacesList = cssNamespaces(cssVars);
check('theme CSS defines platform namespaces', cssNamespacesList.length > 0,
  `found ${cssNamespacesList.length}`);
check('all 7 originally verified namespaces are still present',
  ORIGINALLY_VERIFIED.every((p) => cssNamespacesList.includes(p)),
  `missing: ${ORIGINALLY_VERIFIED.filter((p) => !cssNamespacesList.includes(p)).join(', ') || 'none'}`);

// The four properties each documented combination needs, per namespace × theme.
const REQUIRED_PROPS = ['bg', 'surface', 'text-primary', 'text-secondary'];
const cssColors = {}; // `${ns}:${theme}:${prop}` → concrete color
for (const ns of cssNamespacesList) {
  for (const theme of ['dark', 'light']) {
    for (const prop of REQUIRED_PROPS) {
      cssColors[`${ns}:${theme}:${prop}`] = resolveVar(cssVars, `--${ns}-${prop}`, theme);
    }
  }
}
for (const ns of cssNamespacesList) {
  for (const theme of ['dark', 'light']) {
    const missing = REQUIRED_PROPS.filter((p) => !cssColors[`${ns}:${theme}:${p}`]);
    check(`${ns}: ${theme} theme resolves bg, surface, text-primary, text-secondary`,
      missing.length === 0, `unresolved: ${missing.map((m) => `--${ns}-${m}`).join(', ') || 'none'}`);
  }
}
check('dark and light actually differ for the originally verified namespaces',
  ORIGINALLY_VERIFIED.every((p) =>
    REQUIRED_PROPS.some((prop) =>
      cssColors[`${p}:dark:${prop}`] !== cssColors[`${p}:light:${prop}`])));

// Alpha guard: ContrastChecker's documented math ignores the alpha channel, so
// a translucent text/background entering the audit would be silently
// mis-audited. Refuse to audit such values instead.
function hasAlpha(value) {
  return /^rgba\(/i.test(value) || /\s*\/\s*/.test(value) && /color-mix|oklch|lab\(/i.test(value);
}
const alphaHits = Object.entries(cssColors).filter(([, v]) => v && hasAlpha(v));
check('no audited CSS color carries an alpha channel the math would ignore',
  alphaHits.length === 0, alphaHits.map(([k]) => k).join(', ') || 'none');

// ── 3. CSS surface: WCAG AA on the documented combinations ──────────────────
section('3. frames-theme.css: documented combinations meet WCAG AA (allowlisted violations ratcheted)');
const cssAllowlistHits = new Set();
for (const ns of cssNamespacesList) {
  for (const theme of ['dark', 'light']) {
    for (const combo of COMBOS) {
      const key = `${ns}:${theme}:${combo.key}`;
      const fg = cssColors[`${ns}:${theme}:${combo.fg}`];
      const bg = cssColors[`${ns}:${theme}:${combo.bg}`];
      const ratio = ContrastChecker.calculateContrastRatio(fg, bg);
      const allow = KNOWN_VIOLATIONS.css[key];
      if (allow) {
        cssAllowlistHits.add(key);
        check(`${key} stays at its pinned floor (currently ${ratio.toFixed(2)}:1, ${allow.colors})`,
          ratio >= allow.floor - 1e-9,
          `regressed below ${allow.floor}:1 — now ${ratio.toFixed(2)}:1`);
        check(`${key} is still a violation (fix the color, then remove the allowlist entry)`,
          ratio < AA_NORMAL,
          `now ${ratio.toFixed(2)}:1 ≥ ${AA_NORMAL}:1 — graduate it out of KNOWN_VIOLATIONS.css`);
      } else {
        check(`${key} ≥ ${AA_NORMAL}:1 (AA)`,
          ratio >= AA_NORMAL - 1e-9,
          `${ratio.toFixed(2)}:1 — ${fg} on ${bg}`);
      }
    }
  }
}

// ── 4. Runtime registry: WCAG AA on the documented combinations ─────────────
section('4. PLATFORM_FRAMES themeVars: documented combinations meet WCAG AA (allowlisted violations ratcheted)');
const registryAllowlistHits = new Set();
const registryIds = Object.keys(PlatformFrames.PLATFORM_FRAMES); // includes `generic` — it renders for unknown platforms
for (const id of registryIds) {
  for (const theme of ['dark', 'light']) {
    const vars = PlatformFrames.PLATFORM_FRAMES[id].themeVars[theme];
    for (const combo of COMBOS) {
      const key = `${id}:${theme}:${combo.key}`;
      const fg = vars[`--frame-${combo.fg}`];
      const bg = vars[`--frame-${combo.bg}`];
      check(`${key} colors are parseable`, Boolean(fg && bg && ContrastChecker.colorToRGB(fg) && ContrastChecker.colorToRGB(bg)),
        `${fg} / ${bg}`);
      if (!fg || !bg || !ContrastChecker.colorToRGB(fg) || !ContrastChecker.colorToRGB(bg)) continue;
      check(`${key} carries no alpha the math would ignore`, !hasAlpha(fg) && !hasAlpha(bg), `${fg} / ${bg}`);
      const ratio = ContrastChecker.calculateContrastRatio(fg, bg);
      const allow = KNOWN_VIOLATIONS.registry[key];
      if (allow) {
        registryAllowlistHits.add(key);
        check(`${key} stays at its pinned floor (currently ${ratio.toFixed(2)}:1, ${allow.colors})`,
          ratio >= allow.floor - 1e-9,
          `regressed below ${allow.floor}:1 — now ${ratio.toFixed(2)}:1`);
        check(`${key} is still a violation (fix the color, then remove the allowlist entry)`,
          ratio < AA_NORMAL,
          `now ${ratio.toFixed(2)}:1 ≥ ${AA_NORMAL}:1 — graduate it out of KNOWN_VIOLATIONS.registry`);
      } else {
        check(`${key} ≥ ${AA_NORMAL}:1 (AA)`,
          ratio >= AA_NORMAL - 1e-9,
          `${ratio.toFixed(2)}:1 — ${fg} on ${bg}`);
      }
    }
  }
}

// ── 5. Coverage guards ──────────────────────────────────────────────────────
section('5. Coverage: every documented product platform is audited by this suite');
check('scorer platform inventory is non-empty', PLATFORMS.length > 0, `${PLATFORMS.length}`);
check('every canonical product platform has a runtime frame entry',
  PLATFORMS.every((p) => Boolean(PlatformFrames.PLATFORM_FRAMES[p.id])),
  PLATFORMS.filter((p) => !PlatformFrames.PLATFORM_FRAMES[p.id]).map((p) => p.id).join(', ') || 'none');
check('every allowlisted CSS violation was exercised (no stale entries)',
  Object.keys(KNOWN_VIOLATIONS.css).every((k) => cssAllowlistHits.has(k)),
  Object.keys(KNOWN_VIOLATIONS.css).filter((k) => !cssAllowlistHits.has(k)).join(', ') || 'all exercised');
check('every allowlisted registry violation was exercised (no stale entries)',
  Object.keys(KNOWN_VIOLATIONS.registry).every((k) => registryAllowlistHits.has(k)),
  Object.keys(KNOWN_VIOLATIONS.registry).filter((k) => !registryAllowlistHits.has(k)).join(', ') || 'all exercised');

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`WCAG AA contrast: ${passes} passed, ${failures} failed ` +
  `(${cssNamespacesList.length} CSS namespaces × 2 themes, ${registryIds.length} registry entries × 2 themes, ` +
  `${Object.keys(KNOWN_VIOLATIONS.css).length + Object.keys(KNOWN_VIOLATIONS.registry).length} ratcheted violations)`);
console.log(`${'─'.repeat(60)}`);
process.exit(failures > 0 ? 1 : 0);
