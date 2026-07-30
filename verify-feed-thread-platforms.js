#!/usr/bin/env node

/**
 * Verification script for RSS reader, Hacker News, and Email thread context frames
 */

const fs = require('fs');
const path = require('path');

// Load the platform-frames.js file
const framesContent = fs.readFileSync(path.join(__dirname, 'src/public/platform-frames.js'), 'utf8');

// Check if platforms exist
function checkPlatformExists(platformName, category) {
  const regex = new RegExp(`${platformName}:\\s*{[^}]*category:\\s*'${category}'`, 's');
  return regex.test(framesContent);
}

// Check if theme CSS exists
function checkThemeCSS(platformPrefix) {
  const cssPath = path.join(__dirname, 'src/public/style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const hasDarkTheme = cssContent.includes(`.${platformPrefix}-context.dark-theme`);
  const hasLightTheme = cssContent.includes(`.${platformPrefix}-context.light-theme`);
  const hasBaseStyles = cssContent.includes(`.${platformPrefix}-context {`);

  return { hasBaseStyles, hasDarkTheme, hasLightTheme };
}

// Check for threading structure
function checkThreadingStructure(platformId, chrome) {
  if (platformId === 'gmail') {
    return chrome.includes('gmail-message') && chrome.includes('gmail-thread-header');
  }
  if (platformId === 'hackernews') {
    return chrome.includes('hn-comment') && chrome.includes('hn-post-header');
  }
  if (platformId === 'feedly') {
    return chrome.includes('fl-article') && chrome.includes('fl-sidebar');
  }
  return false;
}

// Extract chrome template
function extractChromeTemplate(platformId) {
  const regex = new RegExp(`${platformId}:\\s*{[^}]*chrome:\\s*` + '`([^`]*)`', 's');
  const match = framesContent.match(regex);
  return match ? match[1] : '';
}

console.log('=== Feed & Thread Platform Context Frames Verification ===\n');

const platforms = [
  { id: 'feedly', name: 'Feedly (RSS Reader)', category: 'rss' },
  { id: 'hackernews', name: 'Hacker News', category: 'social' },
  { id: 'gmail', name: 'Gmail (Email Thread)', category: 'email' }
];

let allPassed = true;

platforms.forEach(platform => {
  console.log(`Testing ${platform.name}...`);

  // Check platform exists
  const exists = checkPlatformExists(platform.id, platform.category);
  console.log(`  ✓ Platform definition exists: ${exists ? 'PASS' : 'FAIL'}`);
  if (!exists) allPassed = false;

  // Check chrome template
  const chrome = extractChromeTemplate(platform.id);
  const hasChrome = chrome.length > 0;
  console.log(`  ✓ Chrome template exists: ${hasChrome ? 'PASS' : 'FAIL'}`);
  if (!hasChrome) allPassed = false;

  // Check threading structure
  const hasThreading = checkThreadingStructure(platform.id, chrome);
  console.log(`  ✓ Threading/feed structure: ${hasThreading ? 'PASS' : 'FAIL'}`);
  if (!hasThreading) allPassed = false;

  // Check CSS
  const cssCheck = checkThemeCSS(platform.id);
  console.log(`  ✓ Base CSS styles: ${cssCheck.hasBaseStyles ? 'PASS' : 'FAIL'}`);
  console.log(`  ✓ Dark theme CSS: ${cssCheck.hasDarkTheme ? 'PASS' : 'FAIL'}`);
  console.log(`  ✓ Light theme CSS: ${cssCheck.hasLightTheme ? 'PASS' : 'FAIL'}`);
  if (!cssCheck.hasBaseStyles || !cssCheck.hasDarkTheme || !cssCheck.hasLightTheme) {
    allPassed = false;
  }

  // Check for link preview integration
  const hasLinkPreview = chrome.includes('{{linkPreview}}') || chrome.includes('{{userArticle}}') || chrome.includes('{{userComment}}') || chrome.includes('{{userMessage}}');
  console.log(`  ✓ Link preview integration: ${hasLinkPreview ? 'PASS' : 'FAIL'}`);
  if (!hasLinkPreview) allPassed = false;

  console.log('');
});

console.log('=== Verification Summary ===');
if (allPassed) {
  console.log('✅ All checks PASSED');
  console.log('\nPlatform implementations verified:');
  console.log('• Feedly: RSS feed reader with article list context');
  console.log('• Hacker News: Threaded comment discussion');
  console.log('• Gmail: Email conversation threading');
  console.log('\nAll platforms support:');
  console.log('• Dark/light theme switching');
  console.log('• Natural link card embedding');
  console.log('• Proper context structure (feed/thread)');
  process.exit(0);
} else {
  console.log('❌ Some checks FAILED');
  process.exit(1);
}
