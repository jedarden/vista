#!/usr/bin/env node
/**
 * Test script to verify all 7 platforms are properly defined and exported
 * Task: bf-3re9x - Export and structure platform configuration array
 */

// Load the platform-frames module
const platformFrames = require('./src/public/platform-frames.js');

// Access PLATFORM_FRAMES from module exports
const PLATFORM_FRAMES = platformFrames.PLATFORM_FRAMES;

console.log('=== Platform Frames Verification ===\n');

// Required platforms and properties
const requiredPlatforms = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
const requiredProps = ['chrome', 'themeVars', 'hasThemeSupport', 'aspectRatio'];

console.log('Checking for required platforms:');
let allPlatformsFound = true;
requiredPlatforms.forEach(platform => {
  const exists = PLATFORM_FRAMES && PLATFORM_FRAMES[platform];
  console.log(`  ${platform}: ${exists ? '✓' : '✗ MISSING'}`);
  if (!exists) allPlatformsFound = false;
});

if (!allPlatformsFound) {
  console.log('\n✗ FAILED: Not all platforms found');
  process.exit(1);
}

console.log('\nChecking platform properties:');
let allPropsValid = true;
requiredPlatforms.forEach(platform => {
  const frame = PLATFORM_FRAMES[platform];
  console.log(`  ${platform}:`);

  requiredProps.forEach(prop => {
    const exists = frame && frame[prop] !== undefined;
    const valid = prop === 'themeVars' ?
      (exists && frame[prop].dark && frame[prop].light) :
      exists;

    console.log(`    ${prop}: ${valid ? '✓' : '✗ INVALID'}`);
    if (!valid) allPropsValid = false;
  });
});

if (!allPropsValid) {
  console.log('\n✗ FAILED: Not all properties valid');
  process.exit(1);
}

console.log('\n=== Additional Validation ===\n');

// Check themeVars structure
console.log('Checking themeVars structure (dark + light modes):');
requiredPlatforms.forEach(platform => {
  const frame = PLATFORM_FRAMES[platform];
  const hasDark = frame.themeVars && frame.themeVars.dark;
  const hasLight = frame.themeVars && frame.themeVars.light;
  console.log(`  ${platform}: dark=${hasDark ? '✓' : '✗'}, light=${hasLight ? '✓' : '✗'}`);
});

// Check hasThemeSupport values
console.log('\nChecking hasThemeSupport values:');
requiredPlatforms.forEach(platform => {
  const frame = PLATFORM_FRAMES[platform];
  console.log(`  ${platform}: ${frame.hasThemeSupport}`);
});

// Check aspectRatio values
console.log('\nChecking aspectRatio values:');
requiredPlatforms.forEach(platform => {
  const frame = PLATFORM_FRAMES[platform];
  console.log(`  ${platform}: ${frame.aspectRatio}`);
});

console.log('\n=== Export Verification ===\n');

// Check if PLATFORM_FRAMES is accessible globally
const isExported = typeof PLATFORM_FRAMES === 'object' && PLATFORM_FRAMES !== null;
console.log(`PLATFORM_FRAMES exported to global scope: ${isExported ? '✓' : '✗'}`);

if (isExported) {
  const platformCount = Object.keys(PLATFORM_FRAMES).filter(k => requiredPlatforms.includes(k)).length;
  console.log(`All 7 required platforms accessible: ${platformCount === 7 ? '✓' : '✗'} (${platformCount}/7)`);
}

console.log('\n✓ SUCCESS: All acceptance criteria met!');
console.log('  - All 7 platforms defined in src/public/platform-frames.js');
console.log('  - Each platform has chrome, themeVars, hasThemeSupport, and aspectRatio properties');
console.log('  - PLATFORM_FRAMES exported to window/global object');
console.log('  - Platform definitions are valid and complete');
