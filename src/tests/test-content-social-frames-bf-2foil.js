/**
 * Test: Content & Social Platform Context Frames (bf-2foil)
 *
 * Verifies that the five content/social platforms have complete, renderable
 * context frames with working dark/light theming:
 *   - Medium       (article response)
 *   - Dev.to       (article comments)
 *   - Hacker News  (comment thread)
 *   - Product Hunt (comment section)
 *   - Pinterest    (pin/image sharing)
 *
 * Checks:
 *   1. Each platform is present in PLATFORM_FRAMES with chrome + themeVars
 *   2. Each frame renders valid HTML via buildContextFrame in BOTH themes
 *   3. Rendered output carries the platform-context class + inline theme vars
 *   4. frames-theme.css defines the per-platform CSS theme variables
 *
 * Run: node src/tests/test-content-social-frames-bf-2foil.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const PF = require('../public/platform-frames.js');

const TARGETS = [
  { id: 'medium', name: 'Medium', accent: '#1a8917' },
  { id: 'devto', name: 'Dev.to', accent: '#3b49df' },
  { id: 'hackernews', name: 'Hacker News', accent: '#ff6600' },
  { id: 'producthunt', name: 'Product Hunt', accent: '#da552f' },
  { id: 'pinterest', name: 'Pinterest', accent: '#E60023' },
];

const THEMES = ['dark', 'light'];

// Sample content covering each platform's neutral-content placeholders
const SAMPLE = {
  title: 'Sample Article Title',
  description: 'A short description of the shared link.',
  domain: 'example.com',
  site: 'example.com',
  comment: 'A neutral placeholder comment.',
  response: 'A neutral placeholder response.',
};

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

// Load frames-theme.css once for the CSS-variable checks
const framesThemeCss = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'frames-theme.css'),
  'utf8'
);

console.log('Testing content & social platform context frames (bf-2foil)...\n');

for (const { id, name, accent } of TARGETS) {
  console.log(`\n[${name}] (${id})`);

  // --- 1. Presence & structure ---
  const frame = PF.getPlatformFrame(id);
  assert(!!frame, `${name} exists in PLATFORM_FRAMES`);

  if (frame) {
    assert(typeof frame.chrome === 'string' && frame.chrome.length > 0, `${name} has non-empty chrome template`);
    assert(frame.themeVars && frame.themeVars.dark && frame.themeVars.light, `${name} defines dark + light themeVars`);
    assert(frame.hasThemeSupport === true, `${name} has hasThemeSupport === true`);
    assert(frame.themeVars.dark['--frame-accent'] === accent, `${name} dark accent is ${accent}`);
    assert(frame.themeVars.light['--frame-accent'] === accent, `${name} light accent is ${accent}`);

    // --- 2. Rendering in both themes ---
    for (const theme of THEMES) {
      let html = '';
      let renderErr = null;
      try {
        html = PF.buildContextFrame(id, { ...SAMPLE }, theme);
      } catch (e) {
        renderErr = e;
      }
      assert(!renderErr, `${name} renders without error in ${theme} mode`);
      assert(typeof html === 'string' && html.length > 0, `${name} produces non-empty HTML in ${theme} mode`);

      // --- 3. Class + inline theme vars present ---
      assert(html.includes(`class="context-frame ${id}-context`), `${name} output carries .${id}-context class in ${theme} mode`);
      assert(html.includes(`data-theme="${theme}"`), `${name} output carries data-theme="${theme}"`);
      assert(html.includes('style="--frame-bg'), `${name} output applies inline theme vars in ${theme} mode`);

      // Inline vars must reflect the correct theme's values
      const expectedBg = frame.themeVars[theme]['--frame-bg'];
      assert(html.includes(`--frame-bg:${expectedBg}`), `${name} inline --frame-bg matches ${theme} themeVars (${expectedBg})`);
    }
  }

  // --- 4. CSS theme variables defined in frames-theme.css ---
  // Both a default (:root) and a light ([data-theme='light']) definition should exist.
  const darkDefs = (framesThemeCss.match(new RegExp(`--${id}-bg:`, 'g')) || []).length;
  assert(darkDefs >= 2, `${name} has CSS theme variables in frames-theme.css (found ${darkDefs} --${id}-bg defs; expect >=2 for dark+light)`);
}

console.log(`\n────────────────────────────────────────`);
console.log(`Result: ${passed} passed, ${failed} failed`);
console.log(failed === 0 ? '✅ ALL CONTENT/SOCIAL FRAME TESTS PASSED' : '❌ SOME TESTS FAILED');

process.exit(failed === 0 ? 0 : 1);
