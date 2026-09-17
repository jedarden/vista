/**
 * Platform-frame accessibility contract tests — vista-0010242d
 *
 * Automates the accessibility primitives documented in
 * docs/PLATFORM_FRAMES_CSS_GUIDE.md ("Accessibility Features") across the
 * three frame stylesheets and the runtime frame registry
 * (src/public/platform-frames.js):
 *
 *  1. Keyboard focus states — the documented :focus-visible rules exist for
 *     interactive frame elements in platform-frames-base.css
 *     (.platform-frame a/button/[role=button]) and
 *     social-platforms-frames.css (.context-frame …), plus the
 *     .frame-base:focus-within ring in frames-theme.css — and no frame
 *     stylesheet suppresses the focus outline anywhere.
 *  2. High contrast — @media (prefers-contrast: high) blocks strengthen
 *     frame and card borders (base stylesheet + frames-theme.css).
 *  3. Reduced motion — @media (prefers-reduced-motion: reduce) blocks zero
 *     animation/transition durations for the frame subtrees in all three
 *     stylesheets; the shimmer loading animation the guard exists to
 *     silence is still present for it to silence.
 *  4. Semantic structure — the documented markup primitives (.platform-frame,
 *     .frame-post-meta, .frame-username-link, …) are defined in the base
 *     stylesheet, and every runtime frame template uses native interactive
 *     elements only: no click-handling divs/spans, no href-less anchors.
 *  5. Screen-reader labeling — the .sr-only utility has the canonical
 *     clipping pattern, every <img> carries an alt attribute (the frames
 *     use decorative alt=""), and every button in every template has an
 *     accessible name — visible text where there is one, aria-label for
 *     icon-only chrome controls.
 *
 * Static analysis only: a small brace-balanced CSS reader plus string
 * checks on the templates and buildContextFrame output. No DOM, no
 * dependencies — runs in a clean checkout via npm test.
 *
 * Usage: node test/unit/platform-frame-accessibility.test.js  (or npm test)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PlatformFrames = require(path.join(ROOT, 'src', 'public', 'platform-frames.js'));

const { PLATFORM_FRAMES, buildContextFrame } = PlatformFrames;
const PLATFORM_IDS = Object.keys(PLATFORM_FRAMES).filter((id) => id !== 'generic');

const STYLESHEET_FILES = [
  'platform-frames-base.css',
  'social-platforms-frames.css',
  'frames-theme.css',
];

// ── Tiny CSS reader ─────────────────────────────────────────────────────────
// Enough structure for these stylesheets: comments stripped, @media blocks
// flattened into { media, selector, body } records, everything @-rule that
// is not @media (@keyframes, @import, …) skipped as a unit. Semicolons never
// appear inside declaration values in these files, so a plain split is safe.

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readBalancedBlock(css, openBraceIdx) {
  let depth = 0;
  for (let i = openBraceIdx; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return { body: css.slice(openBraceIdx + 1, i), end: i + 1 };
    }
  }
  return { body: css.slice(openBraceIdx + 1), end: css.length };
}

function parseRules(css, media = null) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const prelude = css.slice(i, open).trim().replace(/\s+/g, ' ');
    const { body, end } = readBalancedBlock(css, open);
    if (/^@media\b/i.test(prelude)) {
      rules.push(...parseRules(body, prelude.replace(/^@media\s*/i, '').trim()));
    } else if (prelude.startsWith('@') || !prelude) {
      // @keyframes / @font-face / stray braces — no selector rules inside
    } else {
      rules.push({ media, selector: prelude, body });
    }
    i = end;
  }
  return rules;
}

function declarations(ruleBody) {
  return ruleBody
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(':');
      if (idx === -1) return null;
      return { prop: d.slice(0, idx).trim().toLowerCase(), value: d.slice(idx + 1).trim() };
    })
    .filter(Boolean);
}

function hasDecl(rule, prop, valueRe) {
  return declarations(rule.body).some(
    (d) => d.prop === prop && (!valueRe || valueRe.test(d.value))
  );
}

function inMedia(rules, mediaRe) {
  return rules.filter((r) => r.media && mediaRe.test(r.media));
}

function rulesTouching(rules, selectorFragment) {
  return rules.filter((r) => r.selector.includes(selectorFragment));
}

// True when some selector in the rule set targets `.cls` exactly (not a
// longer class name that merely starts with the same text).
const ESC_RE = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function coversClass(rules, cls) {
  const re = new RegExp(`\\.${ESC_RE(cls)}(?![-\\w])`);
  return rules.some((r) => r.selector.split(',').some((sel) => re.test(sel.trim())));
}

// ── Harness ─────────────────────────────────────────────────────────────────
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

const PARSED = {};
for (const file of STYLESHEET_FILES) {
  PARSED[file] = parseRules(
    stripComments(fs.readFileSync(path.join(ROOT, 'src', 'public', file), 'utf8'))
  );
}

const BASE = PARSED['platform-frames-base.css'];
const SOCIAL = PARSED['social-platforms-frames.css'];
const THEME = PARSED['frames-theme.css'];

const REDUCED_MEDIA = /prefers-reduced-motion\s*:\s*reduce/i;
const CONTRAST_MEDIA = /prefers-contrast\s*:\s*high/i;
const FOCUS_VISIBLE_OUTLINE = (rule) =>
  Boolean(rule) &&
  hasDecl(rule, 'outline', /2px\s+solid\s+var\(--frame-accent\)/) &&
  hasDecl(rule, 'outline-offset', /^2px$/);

// ── 1. Keyboard focus states ────────────────────────────────────────────────
section('1. Keyboard focus states (documented: "Focus visible states")');

const baseFocus = rulesTouching(BASE, '.platform-frame a:focus-visible');
check('base stylesheet styles a:focus-visible inside .platform-frame (top level, no media query)',
  baseFocus.length === 1 && baseFocus[0].media === null);
check('the same base rule covers button:focus-visible and [role="button"]:focus-visible',
  Boolean(baseFocus[0]) &&
  baseFocus[0].selector.includes('.platform-frame button:focus-visible') &&
  baseFocus[0].selector.includes('.platform-frame [role="button"]:focus-visible'));
check('base focus rule paints a 2px accent outline with an offset',
  FOCUS_VISIBLE_OUTLINE(baseFocus[0]));

const socialFocus = rulesTouching(SOCIAL, '.context-frame a:focus-visible');
check('social frames stylesheet styles a:focus-visible inside .context-frame',
  socialFocus.length === 1 && socialFocus[0].media === null);
check('the same context-frame rule covers button and [role="button"]',
  Boolean(socialFocus[0]) &&
  socialFocus[0].selector.includes('.context-frame button:focus-visible') &&
  socialFocus[0].selector.includes('.context-frame [role="button"]:focus-visible'));
check('context-frame focus rule paints a 2px accent outline with an offset',
  FOCUS_VISIBLE_OUTLINE(socialFocus[0]));

const themeFocus = rulesTouching(THEME, '.frame-base:focus-within');
check('frames-theme.css keeps a focus-within ring on .frame-base',
  themeFocus.length === 1 && themeFocus[0].media === null &&
  hasDecl(themeFocus[0], 'outline', /2px\s+solid\s+var\(--frame-accent\)/));

for (const [file, rules] of Object.entries(PARSED)) {
  const suppressions = rules.filter((r) =>
    hasDecl(r, 'outline', /^(none|0)$/) || hasDecl(r, 'outline-width', /^0$/));
  check(`${file}: never suppresses the focus outline`, suppressions.length === 0,
    suppressions.map((r) => `${r.selector} { outline: … }`).join('; '));
}

// ── 2. High contrast ────────────────────────────────────────────────────────
section('2. High contrast (documented: "High contrast: Enhanced border support")');

const baseContrast = inMedia(BASE, CONTRAST_MEDIA);
check('base stylesheet has a (prefers-contrast: high) block', baseContrast.length > 0);
check('high contrast thickens the .platform-frame border to 2px',
  baseContrast.some((r) => r.selector.includes('.platform-frame') &&
    hasDecl(r, 'border-width', /^2px$/)));
check('high contrast thickens .frame-content-card borders to 2px',
  baseContrast.some((r) => r.selector.includes('.frame-content-card') &&
    hasDecl(r, 'border-width', /^2px$/)));

const themeContrast = inMedia(THEME, CONTRAST_MEDIA);
check('frames-theme.css has a (prefers-contrast: high) block', themeContrast.length > 0);
check('high contrast thickens .frame-base and .frame-link-preview borders to 2px',
  ['.frame-base', '.frame-link-preview'].every((sel) =>
    themeContrast.some((r) => r.selector.includes(sel) && hasDecl(r, 'border-width', /^2px$/))));

// ── 3. Reduced motion ───────────────────────────────────────────────────────
section('3. Reduced motion (documented: "Respects user preferences")');

const baseReduced = inMedia(BASE, REDUCED_MEDIA);
check('base stylesheet has a (prefers-reduced-motion: reduce) block', baseReduced.length > 0);
check('the base block covers the whole frame subtree including pseudo-elements',
  ['.platform-frame', '.platform-frame *', '.platform-frame *::before', '.platform-frame *::after']
    .every((sel) => baseReduced.some((r) => r.selector.includes(sel))));
check('the base block zeroes animation and transition durations with !important',
  baseReduced.some((r) =>
    hasDecl(r, 'animation-duration', /^0\.01ms\s*!important$/) &&
    hasDecl(r, 'transition-duration', /^0\.01ms\s*!important$/)));
check('the base block stops looping animations (animation-iteration-count: 1)',
  baseReduced.some((r) => hasDecl(r, 'animation-iteration-count', /^1\s*!important$/)));

check('base stylesheet still ships the shimmer animation the guard silences',
  BASE.some((r) => hasDecl(r, 'animation', /shimmer/) && /infinite/.test(
    declarations(r.body).find((d) => d.prop === 'animation').value)),
  'without it the reduced-motion guard guards nothing');

const socialReduced = inMedia(SOCIAL, REDUCED_MEDIA);
check('social frames stylesheet reduces motion for .context-frame and its subtree',
  socialReduced.some((r) =>
    r.selector.includes('.context-frame') && r.selector.includes('.context-frame *') &&
    hasDecl(r, 'animation-duration', /^0\.01ms\s*!important$/) &&
    hasDecl(r, 'transition-duration', /^0\.01ms\s*!important$/)));

const themeReduced = inMedia(THEME, REDUCED_MEDIA);
check('frames-theme.css disables transitions on frame surfaces under reduced motion',
  ['.frame-base', '.frame-link', '.frame-sidebar-item'].every((sel) =>
    themeReduced.some((r) => r.selector.includes(sel) && hasDecl(r, 'transition', /^none$/))));

// ── 4. Semantic structure ───────────────────────────────────────────────────
section('4. Semantic structure');

// 4a. The markup primitives documented in PLATFORM_FRAMES_CSS_GUIDE.md exist
// as real selectors in the base stylesheet.
const documentedPrimitives = [
  'platform-frame', 'platform-frame-compact', 'platform-frame-expanded',
  'frame-chrome', 'frame-chrome-header', 'frame-chrome-footer',
  'frame-avatar', 'frame-username', 'frame-username-link', 'frame-userhandle',
  'frame-timestamp', 'frame-post-meta', 'frame-user-info', 'frame-post-stats',
  'frame-post-content', 'frame-post-text',
  'frame-neutral-content', 'frame-content-card', 'frame-content-card-hoverable',
  'frame-placeholder', 'frame-grid',
];
for (const cls of documentedPrimitives) {
  check(`documented primitive .${cls} is defined in the base stylesheet`, coversClass(BASE, cls));
}

// 4b. Runtime templates use native interactive elements only.
const CLICKABLE_RE = /<(div|span)\b[^>]*\sonclick=/;
const ANCHOR_RE = /<a\b([^>]*)>/g;

let clickDivs = [];
let hreflessAnchors = [];
for (const id of Object.keys(PLATFORM_FRAMES)) {
  const f = PLATFORM_FRAMES[id];
  const templates = `${f.chrome}${f.neutralContent}`;
  if (CLICKABLE_RE.test(templates)) clickDivs.push(id);
  let m;
  ANCHOR_RE.lastIndex = 0;
  while ((m = ANCHOR_RE.exec(templates)) !== null) {
    if (!/\shref=/.test(m[1])) hreflessAnchors.push(id);
  }
}
check('frame templates never fake buttons with onclick divs/spans', clickDivs.length === 0,
  clickDivs.join(', '));
check('every <a> in the frame templates carries an href (an href-less anchor is not focusable)',
  hreflessAnchors.length === 0, [...new Set(hreflessAnchors)].join(', '));

section('4b. Every rendered frame keeps its machine-readable structure');
const CONTENT = {
  title: 'ACCESSIBILITY-TITLE',
  description: 'ACCESSIBILITY-DESCRIPTION',
  image: 'https://example.com/ACCESSIBILITY-IMAGE.png',
  domain: 'accessibility.example',
  site: 'ACCESSIBILITY-SITE',
  themeColor: '#123456',
  linkPreview: '<div class="accessibility-card">ACCESSIBILITY-CARD</div>',
};
for (const id of PLATFORM_IDS) {
  for (const theme of ['dark', 'light']) {
    let html = '';
    let ok = true;
    try {
      html = buildContextFrame(id, { ...CONTENT }, theme);
    } catch (e) {
      ok = false;
    }
    check(`${id} (${theme}): renders a single context-frame root`,
      ok && html.trim().startsWith('<div') && html.includes('class="context-frame'));
    check(`${id} (${theme}): root stamps data-platform for assistive tooling`,
      ok && html.includes(`data-platform="${id}"`));
  }
}

// ── 5. Screen-reader labeling ───────────────────────────────────────────────
section('5. Screen-reader labeling');

const srOnly = rulesTouching(BASE, '.sr-only').filter((r) => r.selector.trim() === '.sr-only');
check('base stylesheet defines the documented .sr-only utility', srOnly.length === 1);
check('.sr-only uses the canonical clipping pattern (1px box, clip, overflow hidden)',
  Boolean(srOnly[0]) &&
  hasDecl(srOnly[0], 'position', /^absolute$/) &&
  hasDecl(srOnly[0], 'width', /^1px$/) &&
  hasDecl(srOnly[0], 'height', /^1px$/) &&
  hasDecl(srOnly[0], 'overflow', /^hidden$/) &&
  hasDecl(srOnly[0], 'clip', /rect\(\s*0/) &&
  hasDecl(srOnly[0], 'white-space', /^nowrap$/));

const BUTTON_RE = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
const IMG_RE = /<img\b([^>]*)>/g;

function scanLabels(source, label) {
  const problems = [];
  let btn;
  BUTTON_RE.lastIndex = 0;
  while ((btn = BUTTON_RE.exec(source)) !== null) {
    const attrs = btn[1];
    const text = btn[2].replace(/<[^>]*>/g, '').trim();
    const hasAccessibleName =
      /aria-label(?:ledby)?\s*=/.test(attrs) || /\stitle\s*=/.test(attrs) ||
      /[A-Za-z0-9]/.test(text);
    if (!hasAccessibleName) problems.push(`${label}: icon-only button ${JSON.stringify(text)} lacks aria-label`);
  }
  let img;
  IMG_RE.lastIndex = 0;
  while ((img = IMG_RE.exec(source)) !== null) {
    if (!/\salt=/.test(img[1])) problems.push(`${label}: <img> without alt`);
  }
  return problems;
}

let registryProblems = [];
for (const id of Object.keys(PLATFORM_FRAMES)) {
  registryProblems.push(
    ...scanLabels(`${PLATFORM_FRAMES[id].chrome}${PLATFORM_FRAMES[id].neutralContent}`, id));
}
check('every button in every frame template has an accessible name (text or aria-label)',
  registryProblems.filter((p) => p.includes('button')).length === 0,
  registryProblems.filter((p) => p.includes('button')).slice(0, 5).join('; '));
check('every <img> in every frame template carries alt (decorative images use alt="")',
  registryProblems.filter((p) => p.includes('img')).length === 0,
  registryProblems.filter((p) => p.includes('img')).slice(0, 5).join('; '));

let renderedProblems = [];
for (const id of PLATFORM_IDS) {
  for (const theme of ['dark', 'light']) {
    renderedProblems.push(...scanLabels(buildContextFrame(id, { ...CONTENT }, theme), `${id}/${theme}`));
  }
}
check('rendered frames keep every button named and every image labelled',
  renderedProblems.length === 0, renderedProblems.slice(0, 5).join('; '));

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Platform-frame accessibility: ${passes} passed, ${failures} failed`);
console.log(`${'─'.repeat(60)}`);
process.exit(failures > 0 ? 1 : 0);
