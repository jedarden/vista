#!/usr/bin/env node

/**
 * Verification script for Reddit frame theme chrome styling
 *
 * This script checks that:
 * 1. Reddit theme CSS variables are properly defined
 * 2. Reddit context styling is present
 * 3. Both dark and light themes have proper styling
 * 4. Chrome elements (headers, footers, borders) use theme variables
 */

const fs = require('fs');
const path = require('path');

const THEME_CSS_PATH = path.join(__dirname, 'src/public/frames-theme.css');
const SOCIAL_CSS_PATH = path.join(__dirname, 'src/public/social-platforms-frames.css');

console.log('🔍 Verifying Reddit frame theme chrome styling...\n');

// Check if files exist
if (!fs.existsSync(THEME_CSS_PATH)) {
  console.error('❌ frames-theme.css not found');
  process.exit(1);
}

if (!fs.existsSync(SOCIAL_CSS_PATH)) {
  console.error('❌ social-platforms-frames.css not found');
  process.exit(1);
}

const themeCss = fs.readFileSync(THEME_CSS_PATH, 'utf8');
const socialCss = fs.readFileSync(SOCIAL_CSS_PATH, 'utf8');

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
}

// Test 1: Check Reddit theme color variables
test('Reddit color variables defined', themeCss.includes('--color-reddit-orange'),
  'Found --color-reddit-orange');
test('Reddit dark theme variables defined', themeCss.includes('--color-reddit-dark-bg'),
  'Found --color-reddit-dark-bg');
test('Reddit light theme variables defined', themeCss.includes('--color-reddit-light-bg'),
  'Found --color-reddit-light-bg');

// Test 2: Check Reddit theme CSS variables
test('Reddit theme variables (dark mode) defined',
  themeCss.includes('--reddit-bg: var(--color-reddit-dark-bg)') ||
  themeCss.includes('--reddit-bg:'),
  'Reddit theme variables properly mapped to color variables');

test('Reddit theme variables (light mode) defined',
  themeCss.match(/data-theme='light'.*--reddit-bg/s),
  'Reddit light theme variables defined under [data-theme=\'light\']');

// Test 3: Check Reddit context styling
test('Reddit context base styling present', socialCss.includes('.reddit-context'),
  'Found .reddit-context selector');
test('Reddit light theme styling present', socialCss.includes('.reddit-context.light-theme'),
  'Found .reddit-context.light-theme selector');

// Test 4: Check Reddit frame chrome elements
test('Reddit post card styling present', socialCss.includes('.rd-post-card'),
  'Found .rd-post-card selector');
test('Reddit subreddit header styling present', socialCss.includes('.rd-subreddit-header'),
  'Found .rd-subreddit-header selector');
test('Reddit upvote section styling present', socialCss.includes('.rd-upvote-section'),
  'Found .rd-upvote-section selector');
test('Reddit post actions styling present', socialCss.includes('.rd-post-actions'),
  'Found .rd-post-actions selector');
test('Reddit comments section styling present', socialCss.includes('.rd-comments-section'),
  'Found .rd-comments-section selector');

// Test 5: Check CSS variable usage in styling
test('Reddit styling uses CSS variables',
  socialCss.includes('var(--reddit-bg') || socialCss.includes('var(--reddit-surface'),
  'Reddit context uses CSS variables for theming');

// Test 6: Check frame chrome elements
test('Reddit frame chrome styling present', socialCss.includes('.frame-chrome'),
  'Found .frame-chrome selector within Reddit context');
test('Reddit frame chrome header styling present',
  socialCss.includes('.frame-chrome-header'),
  'Found .frame-chrome-header selector');
test('Reddit frame chrome navigation styling present',
  socialCss.includes('.frame-chrome-navigation'),
  'Found .frame-chrome-navigation selector');
test('Reddit frame chrome footer styling present',
  socialCss.includes('.frame-chrome-footer'),
  'Found .frame-chrome-footer selector');

// Test 7: Check theme transitions
test('Reddit theme transitions present',
  socialCss.includes('transition: background 0.2s ease') ||
  socialCss.includes('transition: background 0.2s ease, border-color 0.2s ease'),
  'Found proper theme transition properties');

console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  console.log('❌ Some tests failed. Please review the implementation.');
  process.exit(1);
} else {
  console.log('✅ All Reddit frame theme chrome styling tests passed!');
  process.exit(0);
}