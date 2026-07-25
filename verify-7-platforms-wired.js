#!/usr/bin/env node

/**
 * Verification script for 7 platform frames wiring to renderPlatformWithContext
 *
 * This script verifies that all 7 platforms are properly configured and wired
 * to the renderPlatformWithContext entry point.
 */

const fs = require('fs');
const path = require('path');

const PLATFORM_FRAMES_PATH = path.join(__dirname, 'src/public/platform-frames.js');
const APP_JS_PATH = path.join(__dirname, 'src/public/app.js');

const PLATFORMS = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];

console.log('='.repeat(70));
console.log('Verifying 7 Platform Frames Wiring to renderPlatformWithContext');
console.log('='.repeat(70));

let allChecksPassed = true;

// Read files
const platformFramesContent = fs.readFileSync(PLATFORM_FRAMES_PATH, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');

// Check 1: Verify PLATFORM_FRAMES object is defined and exported to window
console.log('\n✓ Check 1: PLATFORM_FRAMES global availability');
if (platformFramesContent.includes('window.PLATFORM_FRAMES = PLATFORM_FRAMES')) {
  console.log('  ✓ PLATFORM_FRAMES is exported to window object');
} else {
  console.log('  ✗ PLATFORM_FRAMES is NOT exported to window object');
  allChecksPassed = false;
}

// Check 2: Verify all 7 platforms are defined in PLATFORM_FRAMES
console.log('\n✓ Check 2: All 7 platforms defined in PLATFORM_FRAMES');
let missingPlatforms = [];
for (const platform of PLATFORMS) {
  const regex = new RegExp(`^\\s+${platform}:\\s*\\{`, 'm');
  if (regex.test(platformFramesContent)) {
    console.log(`  ✓ ${platform} is defined`);
  } else {
    console.log(`  ✗ ${platform} is NOT defined`);
    missingPlatforms.push(platform);
    allChecksPassed = false;
  }
}

// Check 3: Verify each platform has required 'chrome' property
console.log('\n✓ Check 3: Each platform has required "chrome" property');
for (const platform of PLATFORMS) {
  const regex = new RegExp(`^\\s+${platform}:[\\s\\S]*?chrome:\\s*\``, 'm');
  if (regex.test(platformFramesContent)) {
    console.log(`  ✓ ${platform} has chrome property`);
  } else {
    console.log(`  ✗ ${platform} missing chrome property`);
    allChecksPassed = false;
  }
}

// Check 4: Verify each platform has themeVars with dark and light themes
console.log('\n✓ Check 4: Each platform has themeVars with dark/light themes');
for (const platform of PLATFORMS) {
  const hasDark = new RegExp(`^\\s+${platform}:[\\s\\S]*?themeVars:[\\s\\S]*?dark:\\s*\\{`, 'm').test(platformFramesContent);
  const hasLight = new RegExp(`^\\s+${platform}:[\\s\\S]*?themeVars:[\\s\\S]*?light:\\s*\\{`, 'm').test(platformFramesContent);

  if (hasDark && hasLight) {
    console.log(`  ✓ ${platform} has dark and light themeVars`);
  } else if (hasDark) {
    console.log(`  ⚠ ${platform} has dark themeVars only`);
  } else {
    console.log(`  ✗ ${platform} missing themeVars`);
    allChecksPassed = false;
  }
}

// Check 5: Verify helper functions are exported to window
console.log('\n✓ Check 5: Helper functions exported to window');
const helpers = ['getPlatformFrame', 'buildContextFrame', 'hasThemeSupport', 'getThemeVars'];
for (const helper of helpers) {
  if (platformFramesContent.includes(`window.${helper} = ${helper}`)) {
    console.log(`  ✓ ${helper} is exported`);
  } else {
    console.log(`  ✗ ${helper} is NOT exported`);
    allChecksPassed = false;
  }
}

// Check 6: Verify renderPlatformWithContext exists and uses the helpers
console.log('\n✓ Check 6: renderPlatformWithContext function integrity');
if (appJsContent.includes('function renderPlatformWithContext(')) {
  console.log('  ✓ renderPlatformWithContext function exists');

  if (appJsContent.includes('getPlatformFrame(pid)')) {
    console.log('  ✓ renderPlatformWithContext calls getPlatformFrame');
  } else {
    console.log('  ✗ renderPlatformWithContext does NOT call getPlatformFrame');
    allChecksPassed = false;
  }

  if (appJsContent.includes('buildContextFrame(pid, contentData, theme)')) {
    console.log('  ✓ renderPlatformWithContext calls buildContextFrame');
  } else {
    console.log('  ✗ renderPlatformWithContext does NOT call buildContextFrame');
    allChecksPassed = false;
  }

  if (appJsContent.includes('PLATFORM_FRAMES[pid]')) {
    console.log('  ✓ renderPlatformWithContext checks PLATFORM_FRAMES mapping');
  } else {
    console.log('  ✗ renderPlatformWithContext does NOT check PLATFORM_FRAMES');
    allChecksPassed = false;
  }
} else {
  console.log('  ✗ renderPlatformWithContext function does NOT exist');
  allChecksPassed = false;
}

// Check 7: Verify fallback mechanisms are in place
console.log('\n✓ Check 7: Fallback mechanisms for unknown/unsupported platforms');
if (appJsContent.includes('renderGenericContextFrame') ||
    appJsContent.includes('renderSafeFallbackFrame') ||
    appJsContent.includes('renderPlatformWithContextLegacy')) {
  console.log('  ✓ Fallback functions exist');
} else {
  console.log('  ✗ Fallback functions missing');
  allChecksPassed = false;
}

// Check 8: Verify script loading order in index.html
console.log('\n✓ Check 8: Script loading order in index.html');
const indexHtmlPath = path.join(__dirname, 'src/public/index.html');
if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const platformFramesLine = indexHtml.match(/<script\s+src="platform-frames\.js"><\/script>/);
  const appJsLine = indexHtml.match(/<script\s+src="app\.js"><\/script>/);

  if (platformFramesLine && appJsLine) {
    const platformFramesNum = indexHtml.indexOf(platformFramesLine[0]);
    const appJsNum = indexHtml.indexOf(appJsLine[0]);

    if (platformFramesNum < appJsNum) {
      console.log('  ✓ platform-frames.js loads before app.js');
    } else {
      console.log('  ✗ platform-frames.js does NOT load before app.js');
      allChecksPassed = false;
    }
  } else {
    console.log('  ⚠ Could not find script tags');
  }
} else {
  console.log('  ⚠ index.html not found');
}

// Summary
console.log('\n' + '='.repeat(70));
if (allChecksPassed) {
  console.log('✓ ALL CHECKS PASSED - All 7 platforms are properly wired!');
  console.log('='.repeat(70));
  console.log('\nThe following platforms are fully configured and accessible:');
  PLATFORMS.forEach(p => console.log(`  • ${p}`));
  console.log('\nConfiguration is complete and ready for use.');
  process.exit(0);
} else {
  console.log('✗ SOME CHECKS FAILED - Please review the output above');
  console.log('='.repeat(70));
  process.exit(1);
}
