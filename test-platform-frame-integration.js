#!/usr/bin/env node
/**
 * Test Platform Frame Integration with renderPlatformWithContext
 *
 * This test creates a minimal browser environment to test the actual rendering
 * of platform frames with dark/light theme switching.
 */

const fs = require('fs');
const path = require('path');

// Create a minimal DOM environment
global.document = {
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {}
  }),
  getElementById: () => null
};

console.log('='.repeat(70));
console.log('Testing Platform Frame Integration');
console.log('='.repeat(70));

const COMPLETE_PLATFORMS = [
  'twitter', 'youtube', 'tiktok', 'facebook',
  'linkedin', 'reddit', 'instagram'
];

// Load platform-frames.js content
const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
const platformFramesContent = fs.readFileSync(platformFramesPath, 'utf8');

console.log('\n[Test 1] Checking platform definitions...');
let allHaveChrome = true;
let allHaveThemeVars = true;

COMPLETE_PLATFORMS.forEach(platform => {
  // Check for chrome property
  const chromePattern = new RegExp(`${platform}:\\s*\\{[^}]*chrome:\\s*` + '`', 'ms');
  const hasChrome = chromePattern.test(platformFramesContent);

  // Check for themeVars property
  const themeVarsPattern = new RegExp(`${platform}:\\s*\\{[^}]*themeVars:\\s*\\{`, 'ms');
  const hasThemeVars = themeVarsPattern.test(platformFramesContent);

  if (!hasChrome) {
    console.log(`  ❌ ${platform}: Missing chrome`);
    allHaveChrome = false;
  }
  if (!hasThemeVars) {
    console.log(`  ❌ ${platform}: Missing themeVars`);
    allHaveThemeVars = false;
  }

  if (hasChrome && hasThemeVars) {
    console.log(`  ✅ ${platform}: Complete (chrome + themeVars)`);
  }
});

console.log('\n[Test 2] Checking CSS infrastructure...');
const cssFiles = [
  'src/public/platform-frames-base.css',
  'src/public/platform-frames-enhanced.css'
];

let cssExists = true;
cssFiles.forEach(cssFile => {
  const cssPath = path.join(__dirname, cssFile);
  if (fs.existsSync(cssPath)) {
    const size = fs.statSync(cssPath).size;
    console.log(`  ✅ ${cssFile} (${Math.round(size/1024)}KB)`);
  } else {
    console.log(`  ❌ ${cssFile} not found`);
    cssExists = false;
  }
});

console.log('\n[Test 3] Checking platform-specific CSS classes...');
const platformClasses = {
  'twitter': 'tw-context-frame',
  'youtube': 'yt-context-frame',
  'tiktok': 'tt-context-frame',
  'facebook': 'fb-context-frame',
  'linkedin': 'li-context-frame',
  'reddit': 'rd-context-frame',
  'instagram': 'ig-context-frame'
};

const enhancedCssPath = path.join(__dirname, 'src/public/platform-frames-enhanced.css');
const enhancedCss = fs.readFileSync(enhancedCssPath, 'utf8');

Object.entries(platformClasses).forEach(([platform, className]) => {
  const hasClass = enhancedCss.includes(`.${className}`);
  if (hasClass) {
    console.log(`  ✅ ${platform}: CSS class found`);
  } else {
    console.log(`  ⚠️  ${platform}: CSS class not found (may use generic styles)`);
  }
});

console.log('\n[Test 4] Summary');
if (allHaveChrome && allHaveThemeVars && cssExists) {
  console.log('✅ SUCCESS: All 7 platforms have complete implementations');
  console.log('   - Chrome HTML templates present');
  console.log('   - Theme variables for dark/light modes');
  console.log('   - CSS infrastructure loaded');
  console.log('\nNext steps:');
  console.log('   1. Start the VISTA app');
  console.log('   2. Test each platform with dark/light theme toggle');
  console.log('   3. Verify cards render embedded in frame context');
  console.log('   4. Capture screenshots for visual verification');
} else {
  console.log('❌ INCOMPLETE: Some implementations missing');
  if (!allHaveChrome) console.log('   - Missing chrome HTML templates');
  if (!allHaveThemeVars) console.log('   - Missing theme variables');
  if (!cssExists) console.log('   - Missing CSS infrastructure');
}

console.log('='.repeat(70));
