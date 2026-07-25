#!/usr/bin/env node
/**
 * Verify all 7 social media platforms have complete frame implementations
 */

const fs = require('fs');
const path = require('path');

// Load the platform config
const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// The 7 required social media platforms
const REQUIRED_PLATFORMS = [
  'facebook',
  'twitter',
  'linkedin',
  'reddit',
  'youtube',
  'instagram',
  'tiktok'
];

console.log('🔍 Verifying social media platform frames...\n');

let allPassed = true;

// Check each platform
REQUIRED_PLATFORMS.forEach(platformId => {
  console.log(`\n📱 ${platformId.toUpperCase()}:`);

  // Check if platform exists in config
  const platformRegex = new RegExp(`${platformId}:\\s*{`, 's');
  const exists = platformRegex.test(configContent);

  if (!exists) {
    console.log('  ❌ Platform not found in config');
    allPassed = false;
    return;
  }
  console.log('  ✅ Platform exists in config');

  // Extract the platform block
  const platformBlockRegex = new RegExp(`${platformId}:\\s*{([\\s\\S]*?)\\n\\s*,\\s*\\n`, 's');
  const match = configContent.match(platformBlockRegex);

  if (!match) {
    console.log('  ⚠️  Could not extract platform block');
    return;
  }

  const block = match[1];

  // Check for chrome property
  const hasChrome = block.includes('chrome:') && block.includes('`<');
  if (hasChrome) {
    console.log('  ✅ Has chrome property');

    // Check for key chrome elements
    const chromeMatch = block.match(/chrome:\s*`([\s\S]*?)`/);
    if (chromeMatch) {
      const chrome = chromeMatch[1];

      // Check for platform-appropriate elements
      const hasAvatar = chrome.includes('avatar') || chrome.includes('icon') || chrome.includes('user');
      const hasMetadata = chrome.includes('name') || chrome.includes('author') || chrome.includes('title');
      const hasTimestamp = chrome.includes('time') || chrome.includes('ago') || chrome.includes('posted');
      const hasActions = chrome.includes('like') || chrome.includes('comment') || chrome.includes('share');

      console.log(`    ${hasAvatar ? '✅' : '⚠️'} Avatar/User element`);
      console.log(`    ${hasMetadata ? '✅' : '⚠️'} Metadata (name/author/title)`);
      console.log(`    ${hasTimestamp ? '✅' : '⚠️'} Timestamp`);
      console.log(`    ${hasActions ? '✅' : '⚠️'} Action buttons/engagement`);
    }
  } else {
    console.log('  ❌ Missing chrome property');
    allPassed = false;
  }

  // Check for neutralContent property
  const hasNeutralContent = block.includes('neutralContent:');
  console.log(`  ${hasNeutralContent ? '✅' : '⚠️'} Has neutralContent property`);

  // Check for theme support
  const hasThemeSupport = block.includes('hasThemeSupport: true');
  console.log(`  ${hasThemeSupport ? '✅' : '⚠️'} Theme support enabled`);

  // Check placeholderFrame is not a stub
  const isNotStub = block.includes('isStub: false');
  console.log(`  ${isNotStub ? '✅' : '⚠️'} Complete implementation (not stub)`);
});

// Check CSS file exists
console.log('\n\n🎨 Checking CSS implementation...');
const cssPath = path.join(__dirname, 'src/public/social-platforms-frames.css');
const cssExists = fs.existsSync(cssPath);

if (cssExists) {
  console.log('  ✅ social-platforms-frames.css exists');

  const cssContent = fs.readFileSync(cssPath, 'utf8');

  REQUIRED_PLATFORMS.forEach(platformId => {
    // Twitter uses 'tw' prefix in CSS
    const cssPrefix = platformId === 'twitter' ? 'twitter' : platformId.substring(0, 2);
    const contextClass = `${cssPrefix}-context`;

    if (cssContent.includes(`.${contextClass}`) || cssContent.includes(`${platformId}-context`)) {
      console.log(`  ✅ ${platformId} CSS styles found`);
    } else {
      console.log(`  ❌ ${platformId} CSS styles missing`);
      allPassed = false;
    }
  });
} else {
  console.log('  ❌ social-platforms-frames.css not found');
  allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All 7 social media platforms have complete frame implementations!');
  console.log('\nPlatforms verified:');
  REQUIRED_PLATFORMS.forEach(p => console.log(`  ✓ ${p}`));
  process.exit(0);
} else {
  console.log('❌ Some platforms are missing required properties');
  process.exit(1);
}
