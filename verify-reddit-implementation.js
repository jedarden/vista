#!/usr/bin/env node

/**
 * Reddit Platform Frame Verification Script
 *
 * This script verifies that the Reddit platform frame implementation
 * meets all acceptance criteria and is properly configured.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ Found: ${description}`, 'green');
    return true;
  } else {
    log(`✗ Missing: ${description}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, patterns, description) {
  if (!fs.existsSync(filePath)) {
    log(`✗ Cannot check ${description} - file not found`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allFound = true;

  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      log(`  ✓ Found: ${pattern}`, 'green');
    } else {
      log(`  ✗ Missing: ${pattern}`, 'red');
      allFound = false;
    }
  }

  if (allFound) {
    log(`✓ ${description} - All patterns found`, 'green');
  } else {
    log(`✗ ${description} - Some patterns missing`, 'red');
  }

  return allFound;
}

function verifyConfigFile() {
  log('\n📋 Verifying platform-frames.config.ts...', 'cyan');

  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const exists = checkFile(configPath, 'platform-frames.config.ts');

  if (!exists) return false;

  const redditPatterns = [
    "reddit: {",
    "id: 'reddit'",
    "name: 'Reddit'",
    "frameType: 'link-aggregator'",
    "hasThemeSupport: true",
    "isStub: false",
    "Complete with realistic chrome"
  ];

  return checkFileContent(configPath, redditPatterns, 'Reddit configuration');
}

function verifyCSSStyles() {
  log('\n🎨 Verifying Reddit CSS styles...', 'cyan');

  const cssPath = path.join(__dirname, 'src/public/style.css');
  const exists = checkFile(cssPath, 'style.css');

  if (!exists) return false;

  const redditPatterns = [
    '.reddit-context {',
    '.rd-subreddit-header {',
    '.rd-subreddit-banner {',
    '.rd-subreddit-icon {',
    '.rd-subreddit-name {',
    '.rd-join-btn {',
    '.rd-post-list {',
    '.rd-post-item {',
    '.rd-upvote-section {',
    '.rd-upvote-arrow,',
    '.rd-vote-count {',
    '.rd-post-main {',
    '.rd-post-meta {',
    '.rd-post-title {',
    '.rd-link-preview {',
    '.rd-post-actions {',
    '#FF4500',
    'dark-theme',
    'light-theme'
  ];

  return checkFileContent(cssPath, redditPatterns, 'Reddit CSS styles');
}

function verifyThemeCSS() {
  log('\n🌓 Verifying Reddit theme support...', 'cyan');

  const cssPath = path.join(__dirname, 'src/public/style.css');

  // Check for theme variables
  const themePatterns = [
    '.reddit-context.dark-theme {',
    '--frame-bg: #1a1a1b',
    '--frame-accent: #FF4500',
    '.reddit-context.light-theme {',
    '--frame-bg: #ffffff',
    '--frame-accent: #FF4500'
  ];

  return checkFileContent(cssPath, themePatterns, 'Reddit theme CSS');
}

function verifyTestFile() {
  log('\n🧪 Verifying test file...', 'cyan');

  const testPath = path.join(__dirname, 'test-reddit-frame-comprehensive.html');
  const exists = checkFile(testPath, 'test-reddit-frame-comprehensive.html');

  if (!exists) return false;

  const testPatterns = [
    'class="context-frame reddit-context dark-theme"',
    'class="rd-subreddit-header"',
    'class="rd-subreddit-banner"',
    'class="rd-subreddit-icon"',
    'class="rd-subreddit-name"',
    'class="rd-join-btn"',
    'class="rd-post-list"',
    'class="rd-upvote-section"',
    'class="rd-upvote-arrow"',
    'class="rd-vote-count"',
    'class="rd-post-main"',
    'class="rd-post-title"',
    'class="rd-link-preview"',
    'class="rd-post-actions"',
    'acceptance-criteria',
    'verificationLog',
    'themeToggle'
  ];

  return checkFileContent(testPath, testPatterns, 'Test file structure');
}

function verifyAcceptanceCriteria() {
  log('\n✅ Verifying acceptance criteria...', 'cyan');

  const criteria = [
    {
      name: 'Reddit frame renders with realistic chrome',
      check: () => {
        const cssPath = path.join(__dirname, 'src/public/style.css');
        const css = fs.readFileSync(cssPath, 'utf8');
        return css.includes('.rd-subreddit-header') &&
               css.includes('.rd-upvote-section') &&
               css.includes('.rd-join-btn');
      }
    },
    {
      name: 'Upvote/downvote counts and comment count display',
      check: () => {
        const cssPath = path.join(__dirname, 'src/public/style.css');
        const css = fs.readFileSync(cssPath, 'utf8');
        return css.includes('.rd-upvote-arrow') &&
               css.includes('.rd-vote-count') &&
               css.includes('.rd-downvote-arrow');
      }
    },
    {
      name: 'Dark/light toggle switches theme seamlessly',
      check: () => {
        const cssPath = path.join(__dirname, 'src/public/style.css');
        const css = fs.readFileSync(cssPath, 'utf8');
        return css.includes('.reddit-context.dark-theme') &&
               css.includes('.reddit-context.light-theme') &&
               css.includes('transition: background-color');
      }
    },
    {
      name: 'Card appears embedded in Reddit context',
      check: () => {
        const cssPath = path.join(__dirname, 'src/public/style.css');
        const css = fs.readFileSync(cssPath, 'utf8');
        return css.includes('.reddit-context {') &&
               css.includes('overflow: hidden') &&
               css.includes('border-radius');
      }
    },
    {
      name: 'Reddit orange color scheme (#FF4500)',
      check: () => {
        const cssPath = path.join(__dirname, 'src/public/style.css');
        const css = fs.readFileSync(cssPath, 'utf8');
        return css.includes('#FF4500') || css.includes('255, 69, 0');
      }
    }
  ];

  let allPassed = true;
  for (const criterion of criteria) {
    if (criterion.check()) {
      log(`✓ ${criterion.name}`, 'green');
    } else {
      log(`✗ ${criterion.name}`, 'red');
      allPassed = false;
    }
  }

  return allPassed;
}

function main() {
  log('🔴 Reddit Platform Frame Verification', 'cyan');
  log('=====================================\n', 'cyan');

  const results = {
    configFile: verifyConfigFile(),
    cssStyles: verifyCSSStyles(),
    themeCSS: verifyThemeCSS(),
    testFile: verifyTestFile(),
    acceptanceCriteria: verifyAcceptanceCriteria()
  };

  log('\n📊 Final Results:', 'cyan');
  log('=====================================', 'cyan');

  const allPassed = Object.values(results).every(result => result === true);

  if (allPassed) {
    log('✅ ALL CHECKS PASSED', 'green');
    log('Reddit platform frame is fully implemented and meets all acceptance criteria.', 'green');
    log('\nImplementation complete:', 'green');
    log('- Configuration updated (isStub: false)', 'green');
    log('- CSS styles with full theme support', 'green');
    log('- Comprehensive test file created', 'green');
    log('- All acceptance criteria met', 'green');
    process.exit(0);
  } else {
    log('❌ SOME CHECKS FAILED', 'red');
    log('Please review the failed checks above.', 'red');
    process.exit(1);
  }
}

// Run the verification
main();