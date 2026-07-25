#!/usr/bin/env node

/**
 * Twitter/X Frame Implementation Verification Script
 *
 * This script verifies that the Twitter/X frame implementation is complete
 * and follows the expected patterns for platform frames.
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, 'src/public/social-platforms-frames.css');
const TEST_FILE = path.join(__dirname, 'test-twitter-frame.html');

console.log('🔍 Verifying Twitter/X Frame Implementation\n');

// Read the CSS file
let cssContent;
try {
  cssContent = fs.readFileSync(CSS_FILE, 'utf8');
} catch (error) {
  console.error('❌ Failed to read CSS file:', error.message);
  process.exit(1);
}

// Read the test file
let testContent;
try {
  testContent = fs.readFileSync(TEST_FILE, 'utf8');
} catch (error) {
  console.error('❌ Failed to read test file:', error.message);
  process.exit(1);
}

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function check(condition, testName, errorMessage) {
  if (condition) {
    results.passed.push(testName);
    console.log(`✅ ${testName}`);
  } else {
    results.failed.push(testName);
    console.log(`❌ ${testName}: ${errorMessage}`);
  }
}

// Check for required Twitter/X CSS classes
console.log('\n📋 Checking required CSS classes:');

const requiredClasses = [
  '.twitter-context',
  '.tw-post-header',
  '.tw-avatar',
  '.tw-post-meta',
  '.tw-author-name',
  '.tw-author-handle',
  '.tw-post-time',
  '.tw-verified',
  '.tw-post-content',
  '.tw-link-card',
  '.tw-context-placeholder',
  '.tw-context-meta',
  '.tw-context-domain',
  '.tw-context-title',
  '.tw-context-description',
  '.tw-post-actions'
];

requiredClasses.forEach(className => {
  check(
    cssContent.includes(className),
    `CSS class ${className} exists`,
    `Missing ${className} in CSS`
  );
});

// Check for theme support
console.log('\n🎨 Checking theme support:');

check(
  cssContent.includes('.twitter-context.light-theme'),
  'Light theme support',
  'Missing .twitter-context.light-theme selector'
);

check(
  cssContent.includes('var(--color-twitter-black)'),
  'Dark theme background',
  'Missing dark theme background color'
);

check(
  cssContent.includes('var(--color-bg-light-primary)'),
  'Light theme background',
  'Missing light theme background color'
);

// Check for Twitter/X specific colors
console.log('\n🎯 Checking Twitter/X brand colors:');

check(
  cssContent.includes('var(--color-twitter-blue)'),
  'Twitter blue accent',
  'Missing Twitter blue accent color'
);

check(
  cssContent.includes('var(--color-twitter-green)') || cssContent.includes('var(--x-retweet-color)'),
  'Retweet green color',
  'Missing retweet green color'
);

check(
  cssContent.includes('var(--color-twitter-pink)') || cssContent.includes('var(--x-like-color)'),
  'Like pink color',
  'Missing like pink color'
);

// Check for engagement action styling
console.log('\n💬 Checking engagement actions:');

check(
  cssContent.includes('.tw-post-actions'),
  'Post actions container',
  'Missing .tw-post-actions styling'
);

check(
  cssContent.includes('.tw-reply-color'),
  'Reply action color',
  'Missing reply action color'
);

check(
  cssContent.includes('.tw-retweet-color'),
  'Retweet action color',
  'Missing retweet action color'
);

check(
  cssContent.includes('.tw-like-color'),
  'Like action color',
  'Missing like action color'
);

check(
  cssContent.includes('.tw-view-color'),
  'View action color',
  'Missing view action color'
);

// Check for hover states
console.log('\n🖱️  Checking interactive states:');

check(
  cssContent.includes(':hover'),
  'Hover states defined',
  'Missing hover states'
);

check(
  cssContent.includes('transition'),
  'Smooth transitions',
  'Missing transitions'
);

// Check for verified badge styling
console.log('\n✓ Checking verified badge:');

check(
  cssContent.includes('.tw-verified'),
  'Verified badge exists',
  'Missing verified badge styling'
);

check(
  cssContent.includes('border-radius: 50%'),
  'Verified badge is circular',
  'Verified badge should be circular'
);

// Check for link card styling
console.log('\n🔗 Checking link card:');

check(
  cssContent.includes('.tw-link-card'),
  'Link card container',
  'Missing link card styling'
);

check(
  cssContent.includes('.tw-context-placeholder'),
  'Context placeholder',
  'Missing context placeholder styling'
);

check(
  cssContent.includes('aspect-ratio: 16/9'),
  'Placeholder aspect ratio',
  'Missing proper aspect ratio'
);

// Check for responsive design
console.log('\n📱 Checking responsive design:');

check(
  cssContent.includes('@media'),
  'Media queries present',
  'Missing responsive design'
);

// Verify test file uses the CSS classes
console.log('\n🧪 Checking test file integration:');

check(
  testContent.includes('twitter-context'),
  'Test file uses twitter-context class',
  'Test file missing twitter-context class'
);

check(
  testContent.includes('theme-toggle'),
  'Test file has theme toggle',
  'Test file missing theme toggle functionality'
);

check(
  testContent.includes('tw-post-header'),
  'Test file uses tw-post-header',
  'Test file missing tw-post-header structure'
);

check(
  testContent.includes('tw-link-card'),
  'Test file uses tw-link-card',
  'Test file missing tw-link-card structure'
);

// Check for proper CSS transitions
console.log('\n⚡ Checking animation and transitions:');

check(
  cssContent.includes('transition: background') || cssContent.includes('transition-property'),
  'Background transitions',
  'Missing background transitions'
);

check(
  cssContent.includes('0.2s ease') || cssContent.includes('200ms'),
  'Transition timing',
  'Missing proper transition timing'
);

// Check for CSS variable usage
console.log('\n🔧 Checking CSS variable usage:');

const cssVariableCount = (cssContent.match(/var\(--/g) || []).length;
check(
  cssVariableCount > 10,
  `CSS variables used (${cssVariableCount} found)`,
  'Insufficient CSS variable usage'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));

console.log(`\n✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed tests:');
  results.failed.forEach(test => console.log(`   - ${test}`));
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! Twitter/X frame implementation is complete.');
  process.exit(0);
}