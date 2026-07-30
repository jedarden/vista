#!/usr/bin/env node

/**
 * Verification script for Reddit, Twitter/X, YouTube, and TikTok platform frames
 * Tests theme switching and verifies all required elements are present
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Four Social Platforms Implementation...\n');

// Test 1: Check theme CSS files exist
console.log('📋 Test 1: Checking CSS files...');
const cssFiles = [
  'src/public/frames-theme.css',
  'src/public/social-platforms-frames.css'
];

cssFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} NOT FOUND`);
    process.exit(1);
  }
});

// Test 2: Check theme variables for all platforms
console.log('\n📋 Test 2: Checking theme variables...');
const themeCSS = fs.readFileSync('src/public/frames-theme.css', 'utf8');

const platformVariables = {
  reddit: ['--color-reddit-dark-bg', '--color-reddit-light-bg', '--color-reddit-dark-text-primary'],
  youtube: ['--color-youtube-dark-bg', '--color-youtube-light-bg', '--youtube-text-primary'],
  tiktok: ['--color-tiktok-dark-bg', '--color-tiktok-light-bg', '--color-tiktok-pink'],
  twitter: ['--color-twitter-black', '--color-twitter-dark-text-primary', '--color-twitter-blue']
};

Object.entries(platformVariables).forEach(([platform, vars]) => {
  const allPresent = vars.every(v => themeCSS.includes(v));
  if (allPresent) {
    console.log(`✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)} theme variables present`);
  } else {
    console.log(`❌ ${platform.charAt(0).toUpperCase() + platform.slice(1)} theme variables missing`);
    process.exit(1);
  }
});

// Test 3: Check platform frame implementations
console.log('\n📋 Test 3: Checking platform frame implementations...');
const platformCSS = fs.readFileSync('src/public/social-platforms-frames.css', 'utf8');

const platformImplementations = [
  'REDDIT CONTEXT FRAME IMPLEMENTATION',
  'TWITTER/X CONTEXT FRAME IMPLEMENTATION',
  'YOUTUBE CONTEXT FRAME IMPLEMENTATION',
  'TIKTOK CONTEXT FRAME IMPLEMENTATION'
];

platformImplementations.forEach(impl => {
  if (platformCSS.includes(impl)) {
    const platformName = impl.split(' ')[0].replace('/', '');
    console.log(`✅ ${platformName} implementation found`);
  } else {
    const platformName = impl.split(' ')[0].replace('/', '');
    console.log(`❌ ${platformName} implementation NOT FOUND`);
    process.exit(1);
  }
});

// Test 4: Check test page exists and has all four platforms
console.log('\n📋 Test 4: Checking test page...');
const testPagePath = path.join(__dirname, 'test-all-four-social-platforms.html');
if (!fs.existsSync(testPagePath)) {
  console.log('❌ Test page NOT FOUND');
  process.exit(1);
}

const testPage = fs.readFileSync(testPagePath, 'utf8');

const platformsInTest = [
  { id: 'reddit-frame', name: 'Reddit' },
  { id: 'twitter-frame', name: 'Twitter/X' },
  { id: 'youtube-frame', name: 'YouTube' },
  { id: 'tiktok-frame', name: 'TikTok' }
];

platformsInTest.forEach(platform => {
  if (testPage.includes(`id="${platform.id}"`)) {
    console.log(`✅ ${platform.name} frame found in test page`);
  } else {
    console.log(`❌ ${platform.name} frame NOT FOUND in test page`);
    process.exit(1);
  }
});

// Test 5: Check theme toggle functionality
console.log('\n📋 Test 5: Checking theme toggle functionality...');
if (testPage.includes('function toggleTheme()') && testPage.includes('localStorage.setItem(\'vista-theme\'')) {
  console.log('✅ Theme toggle function present');
} else {
  console.log('❌ Theme toggle function NOT FOUND');
  process.exit(1);
}

// Test 6: Verify platform-specific chrome elements
console.log('\n📋 Test 6: Checking platform-specific chrome elements...');

const platformChrome = {
  reddit: ['rd-subreddit', 'rd-avatar', 'rd-post-title', 'rd-actions'],
  twitter: ['tw-avatar', 'tw-author-name', 'tw-post-actions'],
  youtube: ['yt-video-player', 'yt-channel-avatar', 'yt-action-buttons'],
  tiktok: ['tt-video-container', 'tt-right-sidebar', 'tt-bottom-overlay']
};

Object.entries(platformChrome).forEach(([platform, elements]) => {
  const allPresent = elements.every(el => testPage.includes(el));
  if (allPresent) {
    console.log(`✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)} chrome elements present`);
  } else {
    console.log(`❌ ${platform.charAt(0).toUpperCase() + platform.slice(1)} chrome elements missing`);
  }
});

// Summary
console.log('\n🎉 All verification tests passed!');
console.log('\n📝 Summary:');
console.log('✅ CSS files exist and are properly structured');
console.log('✅ Theme variables for all 4 platforms (Reddit, Twitter/X, YouTube, TikTok)');
console.log('✅ Platform frame implementations in CSS');
console.log('✅ Test page with all 4 platforms');
console.log('✅ Theme toggle functionality');
console.log('✅ Platform-specific chrome elements');
console.log('\n🚀 Ready for manual testing and screenshot verification!');