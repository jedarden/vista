#!/usr/bin/env node

/**
 * bf-thvl6 — Verify each platform frame renders correctly in light and dark themes.
 *
 * WHERE THIS SITS relative to its sibling bead:
 *   bf-662jl proved the MECHANISM — FrameTheme.updateAllPlatformFrames(theme)
 *   reaches all 7 platform frames in the aggregate (every frame gets *a* theme
 *   class, *a* data-theme attr, *some* vars re-applied). It did not check that
 *   the values are the RIGHT ones for each individual platform.
 *
 *   THIS bead (bf-thvl6) proves per-platform CONTENT correctness — for each of
 *   the 7 platforms, individually, that the sweep applies THAT platform's own
 *   theme variables (not the generic default fallback) and that the result is
 *   legible in BOTH themes.
 *
 * Per the acceptance criteria, for EACH of reddit, twitter, facebook, linkedin,
 * instagram, youtube, tiktok, in BOTH dark and light, this verifies:
 *
 *   AC1 — the frame gains the correct {theme}-theme class on toggle
 *         (and drops the other theme's class).
 *   AC2 — data-theme AND data-frame-theme attributes are both the active theme.
 *   AC3 — platform-specific CSS variables (getPlatformThemeVars) are reapplied
 *         per theme: every chrome var on the frame EXACTLY equals
 *         PLATFORM_FRAMES[p].themeVars[theme][var]. This is only possible if
 *         getPlatformThemeVars returned the platform's own vars; had it fallen
 *         back to the generic defaults the values would differ.
 *   AC4 — the chrome is legible: every expected chrome var is defined, the dark
 *         bg is actually dark / light bg actually light, the text/bg contrast
 *         clears WCAG AA (>= 4.5) in both themes, and no unrendered `{{...}}`
 *         template tokens remain (no broken/unthemed elements).
 *
 * It also checks the INITIAL render — the inline styles buildContextFrame emits
 * via getInlineThemeStyles — match the platform vars, so the first paint (before
 * any toggle) is correct too, not just the post-toggle sweep.
 *
 * Runs in plain Node (no jsdom/puppeteer): loads the REAL frames-theme.js +
 * platform-frames.js modules and drives a small DOM shim, so it exercises
 * production logic against production frame markup + production theme vars.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_PLATFORMS = [
  'reddit', 'twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'tiktok'
];

// Every chrome variable a legible platform frame must define in each theme.
const EXPECTED_CHROME_VARS = [
  '--frame-bg',
  '--frame-surface',
  '--frame-border',
  '--frame-text-primary',
  '--frame-text-secondary',
  '--frame-text-muted',
  '--frame-accent',
  '--frame-accent-bg',
  '--frame-link-color',
  '--frame-divider',
  '--frame-input-bg',
  '--frame-overlay',
];

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m',
};
const log = {
  info: (m) => console.log(`${C.cyan}ℹ${C.reset} ${m}`),
  ok: (m) => console.log(`${C.green}✓${C.reset} ${m}`),
  fail: (m) => console.log(`${C.red}✗${C.reset} ${m}`),
  section: (m) => console.log(`\n${C.cyan}${C.bold}▸ ${m}${C.reset}`),
  platform: (m) => console.log(`\n  ${C.bold}${C.cyan}${m}${C.reset}`),
};

let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) {
    passed++;
    log.ok(`${label}${detail ? C.dim + ' — ' + detail + C.reset : ''}`);
  } else {
    failed++;
    failures.push(`${label}${detail ? ' — ' + detail : ''}`);
    log.fail(`${label}${detail ? ' — ' + detail : ''}`);
  }
}

/* ---------------------------------------------------------------------------
   Color helpers — WCAG relative luminance + contrast ratio on hex colors.
   Only used on solid hex bg/text pairs (the chrome vars we care about are hex).
   --------------------------------------------------------------------------- */
function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function channelLum(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channelLum(rgb.r) + 0.7152 * channelLum(rgb.g) + 0.0722 * channelLum(rgb.b);
}
function contrastRatio(fgHex, bgHex) {
  const l1 = relLuminance(fgHex);
  const l2 = relLuminance(bgHex);
  if (l1 == null || l2 == null) return null;
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------------------------------------------------------------------------
   Minimal DOM shim — parses the real opening tag buildContextFrame emits,
   including its inline style attribute (so we can verify the FIRST paint too).
   --------------------------------------------------------------------------- */
function makeElement(openingTagHtml) {
  const el = {
    _attrs: {},
    _classes: new Set(),
    style: { setProperty(name, value) { this[name] = String(value); } },
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

  // Parse the inline style="--frame-bg:#242526;--frame-surface:#3a3b3c;..." that
  // getInlineThemeStyles emits, into the style bag so the FIRST-paint vars are
  // readable exactly like the post-sweep vars are.
  const styleMatch = openingTagHtml.match(/\sstyle="([^"]*)"/);
  if (styleMatch) {
    styleMatch[1].split(';').filter(Boolean).forEach((decl) => {
      const idx = decl.indexOf(':');
      if (idx > -1) el.style.setProperty(decl.slice(0, idx).trim(), decl.slice(idx + 1).trim());
    });
  }
  return el;
}

/* ---------------------------------------------------------------------------
   Load the REAL modules.
   --------------------------------------------------------------------------- */
const FrameTheme = require('./src/public/frames-theme.js');
const PF = require('./src/public/platform-frames.js');

// updateFramePlatformVars -> getPlatformThemeVars reads the bare global
// PLATFORM_FRAMES, so expose the real one to exercise the platform-specific
// variable path (not just the default fallback).
global.PLATFORM_FRAMES = PF.PLATFORM_FRAMES;

/* ---------------------------------------------------------------------------
   Static sanity: getPlatformThemeVars exists and reads platform-specific vars.
   --------------------------------------------------------------------------- */
function staticChecks() {
  log.section('Static: theme-var source + chrome templates');
  const themeSrc = fs.readFileSync(path.join(__dirname, 'src/public/frames-theme.js'), 'utf8');

  check('frames-theme defines getPlatformThemeVars',
    /function getPlatformThemeVars\s*\(/.test(themeSrc));
  check('getPlatformThemeVars reads PLATFORM_FRAMES[p].themeVars[theme]',
    /PLATFORM_FRAMES\[platform\]\.themeVars\?\.\[theme\]/.test(themeSrc));
  check('updateFramePlatformVars applies every theme var via setProperty',
    /updateFramePlatformVars/.test(themeSrc) &&
    /Object\.entries\(themeVars\)\.forEach\(\(\[varName,\s*value\]\)/.test(themeSrc));

  // Each of the 7 platforms must declare BOTH a dark and light themeVars block.
  for (const p of REQUIRED_PLATFORMS) {
    const frame = PF.PLATFORM_FRAMES[p];
    check(`  ${p}: hasThemeSupport = true`, !!frame && frame.hasThemeSupport === true);
    check(`  ${p}: declares themeVars.dark`, !!(frame && frame.themeVars && frame.themeVars.dark),
      frame && frame.themeVars ? Object.keys(frame.themeVars).join(', ') : 'none');
    check(`  ${p}: declares themeVars.light`, !!(frame && frame.themeVars && frame.themeVars.light));
  }
}

/* ---------------------------------------------------------------------------
   Per-platform runtime verification.
   --------------------------------------------------------------------------- */
function buildFrames() {
  // Realistic content so link previews render (no leftover {{}} tokens) and the
  // platform chrome is exercised end-to-end.
  const content = {
    title: 'How to build accessible web apps in 2026',
    description: 'A practical guide to inclusive design.',
    url: 'https://example.com/guide',
    domain: 'example.com',
    image: 'https://example.com/og.png',
    author: 'Jane Doe',
  };

  return REQUIRED_PLATFORMS.map((p) => {
    const html = PF.buildContextFrame(p, content, 'dark');
    const opening = html.slice(0, html.indexOf('>') + 1);
    return { platform: p, html, opening, el: makeElement(opening) };
  });
}

function verifyPlatform(platform, frame, theme) {
  const cfg = PF.PLATFORM_FRAMES[platform];
  const expectedVars = cfg.themeVars[theme];
  const other = theme === 'dark' ? 'light' : 'light';
  const otherTheme = theme === 'dark' ? 'light' : 'dark';

  // AC1 — correct theme class present, the other absent.
  check(`  [${platform}/${theme}] has ${theme}-theme class`,
    frame.el.classList.contains(`${theme}-theme`));
  check(`  [${platform}/${theme}] does NOT carry the ${otherTheme}-theme class`,
    !frame.el.classList.contains(`${otherTheme}-theme`));

  // AC2 — both theme attributes updated to the active theme.
  check(`  [${platform}/${theme}] data-theme = "${theme}"`,
    frame.el.getAttribute('data-theme') === theme, `got "${frame.el.getAttribute('data-theme')}"`);
  check(`  [${platform}/${theme}] data-frame-theme = "${theme}"`,
    frame.el.getAttribute('data-frame-theme') === theme, `got "${frame.el.getAttribute('data-frame-theme')}"`);

  // AC3 — every platform-specific chrome var applied EXACTLY matches the
  // platform's own themeVars[theme]. This is the proof getPlatformThemeVars
  // returned the platform's vars rather than the generic default.
  let allVarsExact = true, firstMismatch = '';
  for (const v of EXPECTED_CHROME_VARS) {
    const got = frame.el.style[v];
    const want = expectedVars[v];
    if (got !== want) {
      allVarsExact = false;
      if (!firstMismatch) firstMismatch = `${v}: got ${got} want ${want}`;
    }
  }
  check(`  [${platform}/${theme}] all 12 chrome vars match platform themeVars exactly`,
    allVarsExact, firstMismatch || 'platform-specific vars applied (not default fallback)');

  // AC4a — legibility: every expected chrome var is defined for this theme.
  const missing = EXPECTED_CHROME_VARS.filter((v) => expectedVars[v] == null);
  check(`  [${platform}/${theme}] defines all 12 chrome vars`, missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : 'complete chrome');

  // AC4b — legibility: dark bg is dark, light bg is light; text inverts with it.
  const bgLum = relLuminance(expectedVars['--frame-bg']);
  const txtLum = relLuminance(expectedVars['--frame-text-primary']);
  if (theme === 'dark') {
    check(`  [${platform}/dark] bg is dark & text is light (inverted for dark)`,
      bgLum < 0.18 && txtLum > 0.4, `bgLum=${bgLum && bgLum.toFixed(3)} txtLum=${txtLum && txtLum.toFixed(3)}`);
  } else {
    check(`  [${platform}/light] bg is light & text is dark (inverted for light)`,
      bgLum > 0.7 && txtLum < 0.18, `bgLum=${bgLum && bgLum.toFixed(3)} txtLum=${txtLum && txtLum.toFixed(3)}`);
  }

  // AC4c — legibility: text/bg contrast clears WCAG AA (>= 4.5) in this theme.
  const ratio = contrastRatio(expectedVars['--frame-text-primary'], expectedVars['--frame-bg']);
  check(`  [${platform}/${theme}] text/bg contrast >= 4.5 (WCAG AA)`,
    ratio != null && ratio >= 4.5, `ratio=${ratio && ratio.toFixed(2)}`);
}

function runtimeChecks() {
  log.section('Runtime: per-platform theme correctness (7 platforms × 2 themes)');

  const frames = buildFrames();

  // Sanity: each built frame is the real context-frame markup the sweep keys on.
  for (const f of frames) {
    check(`  ${f.platform}: buildContextFrame emits .context-frame[data-platform]`,
      f.el.classList.contains('context-frame') && f.el.getAttribute('data-platform') === f.platform);
    // AC4d — no unrendered template tokens in the chrome (no broken elements).
    check(`  ${f.platform}: chrome has no leftover {{...}} template tokens`,
      !/\{\{[^}]+\}\}/.test(f.html));
  }

  // The sweep reads bare `document`, so install a shim returning exactly these
  // 7 frames (the production DOM during a global re-theme).
  global.document = {
    querySelectorAll() {
      return frames.map((f) => f.el).filter((el) =>
        el.classList.contains('context-frame') && el.getAttribute('data-platform'));
    },
  };

  // ---- Verify DARK (initial build was dark, then re-sweep to be explicit) ---
  FrameTheme.updateAllPlatformFrames('dark');
  log.platform('DARK theme');
  for (const f of frames) verifyPlatform(f.platform, f, 'dark');

  // ---- Toggle to LIGHT -----------------------------------------------------
  const nLight = FrameTheme.updateAllPlatformFrames('light');
  check('sweep to light touched all 7 platforms', nLight === 7, `count=${nLight}`);
  log.platform('LIGHT theme');
  for (const f of frames) verifyPlatform(f.platform, f, 'light');

  // ---- Toggle back to DARK (round trip) ------------------------------------
  const nDark = FrameTheme.updateAllPlatformFrames('dark');
  check('sweep back to dark touched all 7 platforms', nDark === 7, `count=${nDark}`);
  let roundTripOk = true;
  for (const f of frames) {
    const el = f.el;
    if (!(el.classList.contains('dark-theme') && !el.classList.contains('light-theme') &&
          el.getAttribute('data-theme') === 'dark' && el.getAttribute('data-frame-theme') === 'dark')) {
      roundTripOk = false;
    }
  }
  check('round-trip dark→light→dark restores dark-theme + attrs on every frame', roundTripOk);

  // ---- First-paint correctness: inline styles emitted at build time --------
  log.platform('FIRST PAINT (initial inline styles)');
  const freshFrames = buildFrames(); // rebuilt from scratch, never swept
  for (const f of freshFrames) {
    const cfg = PF.PLATFORM_FRAMES[f.platform];
    const want = cfg.themeVars.dark;
    let ok = true, mismatch = '';
    for (const v of EXPECTED_CHROME_VARS) {
      if (f.el.style[v] !== want[v]) { ok = false; if (!mismatch) mismatch = `${v}: ${f.el.style[v]} vs ${want[v]}`; }
    }
    check(`  ${f.platform}: initial inline styles match platform dark themeVars`, ok, mismatch || 'first paint correct');
  }

  delete global.document;
}

/* ---------------------------------------------------------------------------
   Run + JSON artifact (mirrors the existing test-7-platforms-report.json shape).
   --------------------------------------------------------------------------- */
function main() {
  console.log(`${C.cyan}${C.bold}bf-thvl6${C.reset} ${C.dim}— per-platform theme correctness, 7 platforms × dark + light${C.reset}`);
  staticChecks();
  runtimeChecks();

  console.log(`\n${'='.repeat(64)}`);

  const report = {
    timestamp: new Date().toISOString(),
    bead: 'bf-thvl6',
    platforms: REQUIRED_PLATFORMS,
    themes: ['dark', 'light'],
    checks: { passed, failed },
    summary: { totalPlatforms: REQUIRED_PLATFORMS.length, allPassed: failed === 0 },
    failures,
  };
  fs.writeFileSync(
    path.join(__dirname, 'test-7-platforms-theme-per-platform-bf-thvl6.json'),
    JSON.stringify(report, null, 2) + '\n'
  );

  if (failed === 0) {
    console.log(`${C.green}PASS${C.reset}  ${passed} checks — all 7 platforms swap theme class, attrs, and ` +
      `platform-specific CSS vars correctly and render legible chrome in BOTH dark and light.`);
    process.exit(0);
  } else {
    console.log(`${C.red}FAIL${C.reset}  ${passed} passed, ${failed} failed`);
    process.exit(1);
  }
}

main();
