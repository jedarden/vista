#!/usr/bin/env node

/**
 * Verification script for content platform context frames implementation
 *
 * This script verifies that:
 * 1. All 6 HTML files exist (3 platforms × 2 themes)
 * 2. Platform configuration exists in platform-frames.js
 * 3. Each platform has proper theme support
 * 4. Each platform has category set to 'content'
 */

const fs = require('fs');
const path = require('path');

const PLATFORMS = ['producthunt', 'devto', 'medium'];
const THEMES = ['light', 'dark'];
const PUBLIC_DIR = path.join(__dirname, 'src', 'public');

console.log('🔍 Verifying Content Platform Context Frames Implementation\n');

let allPassed = true;

// Test 1: Verify HTML files exist
console.log('Test 1: Checking HTML files exist...');
for (const platform of PLATFORMS) {
  for (const theme of THEMES) {
    const filename = `${platform}-${theme}.html`;
    const filepath = path.join(PUBLIC_DIR, filename);
    const exists = fs.existsSync(filepath);

    if (exists) {
      console.log(`  ✓ ${filename} exists`);
    } else {
      console.log(`  ✗ ${filename} MISSING`);
      allPassed = false;
    }
  }
}

// Test 2: Verify platform-frames.js configuration
console.log('\nTest 2: Checking platform-frames.js configuration...');
const platformFramesPath = path.join(PUBLIC_DIR, 'platform-frames.js');
const platformFramesContent = fs.readFileSync(platformFramesPath, 'utf8');

for (const platform of PLATFORMS) {
  const hasConfig = platformFramesContent.includes(`${platform}:`);
  if (hasConfig) {
    // Check for category: 'content'
    const categoryPattern = new RegExp(`${platform}:[^}]*category: 'content'`);
    const hasCorrectCategory = categoryPattern.test(platformFramesContent);

    // Check for hasThemeSupport: true
    const themePattern = new RegExp(`${platform}:[^}]*hasThemeSupport: true`);
    const hasThemeSupport = themePattern.test(platformFramesContent);

    if (hasCorrectCategory && hasThemeSupport) {
      console.log(`  ✓ ${platform} properly configured with category='content' and theme support`);
    } else {
      if (!hasCorrectCategory) {
        console.log(`  ✗ ${platform} missing category='content'`);
        allPassed = false;
      }
      if (!hasThemeSupport) {
        console.log(`  ✗ ${platform} missing hasThemeSupport: true`);
        allPassed = false;
      }
    }
  } else {
    console.log(`  ✗ ${platform} configuration MISSING from platform-frames.js`);
    allPassed = false;
  }
}

// Test 3: Verify theme-specific CSS variables
console.log('\nTest 3: Checking theme CSS variables...');
for (const platform of PLATFORMS) {
  for (const theme of THEMES) {
    // More flexible pattern that handles multi-line structures
    const pattern = new RegExp(`${platform}:[\\s\\S]*themeVars:[\\s\\S]*${theme}:\\s*{[\\s\\S]*'--frame-bg':`);
    const hasThemeVars = pattern.test(platformFramesContent);

    if (hasThemeVars) {
      console.log(`  ✓ ${platform} ${theme} theme has CSS variables defined`);
    } else {
      console.log(`  ✗ ${platform} ${theme} theme MISSING CSS variables`);
      allPassed = false;
    }
  }
}

// Test 4: Verify distinctive styling
console.log('\nTest 4: Checking platform-specific styling...');
const stylingChecks = {
  producthunt: ['#da552f', 'ph-upvote-btn', 'ph-comments-section'],
  devto: ['#3b49df', 'dev-article-title', 'dev-tags'],
  medium: ['#1a8917', 'md-article-header', 'md-responses-section']
};

for (const [platform, markers] of Object.entries(stylingChecks)) {
  for (const marker of markers) {
    if (platformFramesContent.includes(marker)) {
      console.log(`  ✓ ${platform} has distinctive marker: ${marker}`);
    } else {
      console.log(`  ✗ ${platform} missing marker: ${marker}`);
      allPassed = false;
    }
  }
}

// Test 5: Verify chrome structure
console.log('\nTest 5: Checking chrome HTML structure...');
const chromeChecks = {
  producthunt: ['ph-post-header', 'ph-product-icon', 'ph-comments-section'],
  devto: ['dev-article-header', 'dev-author-avatar', 'dev-comments-section'],
  medium: ['md-article-header', 'md-author-section', 'md-responses-section']
};

for (const [platform, elements] of Object.entries(chromeChecks)) {
  for (const element of elements) {
    const pattern = new RegExp(`${platform}:[\\s\\S]*chrome:[\\s\\S]*${element}`);
    const hasElement = pattern.test(platformFramesContent);

    if (hasElement) {
      console.log(`  ✓ ${platform} chrome includes: ${element}`);
    } else {
      console.log(`  ✗ ${platform} chrome missing: ${element}`);
      allPassed = false;
    }
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log('\nContent platform context frames are properly implemented with:');
  console.log('  • All 6 HTML files (3 platforms × 2 themes)');
  console.log('  • Platform configuration in platform-frames.js');
  console.log('  • Category set to "content"');
  console.log('  • Dark/light theme support');
  console.log('  • Platform-specific chrome and styling');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease review the failed checks above.');
  process.exit(1);
}
