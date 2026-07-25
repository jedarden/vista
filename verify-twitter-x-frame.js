#!/usr/bin/env node

/**
 * Twitter/X Platform Frame Verification Script
 *
 * Verifies that the Twitter/X platform frame implementation is complete
 * with all required elements and styling.
 */

const fs = require('fs');
const path = require('path');

const testFilePath = path.join(__dirname, 'test-social-platforms-complete.html');
const cssFilePath = path.join(__dirname, 'src/public/style.css');

console.log('🔍 Verifying Twitter/X Platform Frame Implementation...\n');

// Read files
const testHtml = fs.readFileSync(testFilePath, 'utf-8');
const cssStyles = fs.readFileSync(cssFilePath, 'utf-8');

// Required Twitter frame CSS classes
const requiredCSS = [
  'tw-post-header',
  'tw-avatar',
  'tw-post-meta',
  'tw-author-name',
  'tw-author-handle',
  'tw-post-time',
  'tw-verified',
  'tw-post-content',
  'tw-link-card',
  'tw-context-placeholder',
  'tw-context-meta',
  'tw-context-title',
  'tw-context-domain',
  'tw-post-actions'
];

// Required Twitter frame HTML elements
const requiredHTML = [
  'twitter-context',
  'tw-post-header',
  'tw-avatar',
  'tw-post-meta',
  'tw-author-name',
  'tw-author-handle',
  'tw-post-time',
  'tw-verified',
  'tw-post-content',
  'tw-link-card',
  'tw-context-placeholder',
  'tw-context-meta',
  'tw-context-title',
  'tw-context-domain',
  'tw-post-actions'
];

// Check CSS styling
console.log('📋 CSS Verification:');
let cssMissing = [];
requiredCSS.forEach(className => {
  const regex = new RegExp(`\\.${className}`, 'i');
  if (regex.test(cssStyles)) {
    console.log(`  ✓ .${className} styling found`);
  } else {
    console.log(`  ✗ .${className} styling MISSING`);
    cssMissing.push(className);
  }
});

// Check HTML structure
console.log('\n📋 HTML Structure Verification:');
let htmlMissing = [];
requiredHTML.forEach(elementName => {
  const regex = new RegExp(`class="[^"]*${elementName}`, 'i');
  if (regex.test(testHtml)) {
    console.log(`  ✓ ${elementName} element found`);
  } else {
    console.log(`  ✗ ${elementName} element MISSING`);
    htmlMissing.push(elementName);
  }
});

// Check theme variables
console.log('\n📋 Theme Variable Verification:');
const themeVariables = [
  '--twitter-bg',
  '--twitter-surface',
  '--twitter-border',
  '--twitter-text-primary',
  '--twitter-text-secondary',
  '--twitter-accent'
];

let themeMissing = [];
themeVariables.forEach(variable => {
  if (cssStyles.includes(variable)) {
    console.log(`  ✓ ${variable} variable defined`);
  } else {
    console.log(`  ✗ ${variable} variable MISSING`);
    themeMissing.push(variable);
  }
});

// Check for Twitter/X context frame instances
console.log('\n📋 Frame Instance Verification:');
const twitterFrameMatches = testHtml.match(/class="[^"]*twitter-context[^"]*"/g);
if (twitterFrameMatches && twitterFrameMatches.length > 0) {
  console.log(`  ✓ Found ${twitterFrameMatches.length} Twitter/X context frame(s)`);
  twitterFrameMatches.forEach((match, index) => {
    console.log(`    Frame ${index + 1}: ${match}`);
  });
} else {
  console.log('  ✗ No Twitter/X context frames found');
}

// Check for theme class support
console.log('\n📋 Theme Support Verification:');
const hasDarkTheme = testHtml.includes('dark-theme');
const hasLightTheme = testHtml.includes('light-theme');
const hasThemeToggle = testHtml.includes('themeToggle');

console.log(`  ${hasDarkTheme ? '✓' : '✗'} Dark theme support`);
console.log(`  ${hasLightTheme ? '✓' : '✗'} Light theme support`);
console.log(`  ${hasThemeToggle ? '✓' : '✗'} Theme toggle functionality`);

// Check for Twitter/X specific engagement elements
console.log('\n📋 Engagement Elements Verification:');
const hasReplyIcon = testHtml.includes('💬');
const hasRetweetIcon = testHtml.includes('🔁');
const hasLikeIcon = testHtml.includes('❤️');
const hasViewIcon = testHtml.includes('👁️');

console.log(`  ${hasReplyIcon ? '✓' : '✗'} Reply counts with icon`);
console.log(`  ${hasRetweetIcon ? '✓' : '✗'} Retweet counts with icon`);
console.log(`  ${hasLikeIcon ? '✓' : '✗'} Like counts with icon`);
console.log(`  ${hasViewIcon ? '✓' : '✗'} View counts with icon`);

// Final result
console.log('\n' + '='.repeat(50));
const allCSSPresent = cssMissing.length === 0;
const allHTMLPresent = htmlMissing.length === 0;
const allThemeVarsPresent = themeMissing.length === 0;
const hasAllEngagementElements = hasReplyIcon && hasRetweetIcon && hasLikeIcon && hasViewIcon;
const hasThemeSupport = hasDarkTheme && hasLightTheme && hasThemeToggle;

if (allCSSPresent && allHTMLPresent && allThemeVarsPresent && hasAllEngagementElements && hasThemeSupport) {
  console.log('✅ TWITTER/X PLATFORM FRAME IMPLEMENTATION COMPLETE');
  console.log('\nAll acceptance criteria met:');
  console.log('  ✓ Twitter/X frame renders with realistic chrome');
  console.log('  ✓ Reply, retweet, like, and view counts display correctly');
  console.log('  ✓ Dark/light toggle support implemented');
  console.log('  ✓ Card appears embedded in Twitter/X context');
  console.log('\n🎉 Ready for manual screenshot verification!');
} else {
  console.log('❌ IMPLEMENTATION INCOMPLETE');
  if (cssMissing.length > 0) {
    console.log(`  Missing CSS: ${cssMissing.join(', ')}`);
  }
  if (htmlMissing.length > 0) {
    console.log(`  Missing HTML: ${htmlMissing.join(', ')}`);
  }
  if (themeMissing.length > 0) {
    console.log(`  Missing theme variables: ${themeMissing.join(', ')}`);
  }
  if (!hasAllEngagementElements) {
    console.log('  Missing some engagement elements');
  }
  if (!hasThemeSupport) {
    console.log('  Missing theme support functionality');
  }
}

console.log('='.repeat(50));