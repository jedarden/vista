#!/usr/bin/env node

/**
 * Test script to verify theme subscription integration for all 7 platform frames
 *
 * This script checks:
 * 1. theme-subscription.js is loaded in index.html
 * 2. subscribeFrameToTheme() function exists in app.js
 * 3. All 7 platforms (twitter, facebook, linkedin, reddit, youtube, instagram, tiktok) are covered
 * 4. ThemeSubscription API calls are properly implemented
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`✗ Cannot read file: ${filePath}`, 'red');
    return null;
  }
}

function testThemeSubscriptionLoaded() {
  log('\n=== Test 1: theme-subscription.js loaded in index.html ===', 'blue');

  const indexPath = path.join(__dirname, 'src/public/index.html');
  const indexHtml = checkFile(indexPath);

  if (!indexHtml) return false;

  const hasThemeSubscription = indexHtml.includes('theme-subscription.js');

  if (hasThemeSubscription) {
    log('✓ theme-subscription.js is loaded in index.html', 'green');
    return true;
  } else {
    log('✗ theme-subscription.js is NOT loaded in index.html', 'red');
    return false;
  }
}

function testSubscribeFrameFunction() {
  log('\n=== Test 2: subscribeFrameToTheme() function exists ===', 'blue');

  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = checkFile(appPath);

  if (!appJs) return false;

  const hasFunction = appJs.includes('function subscribeFrameToTheme');
  const hasApiCheck = appJs.includes('window.ThemeSubscription.subscribePlatformFrame');

  let passed = true;

  if (hasFunction) {
    log('✓ subscribeFrameToTheme() function exists', 'green');
  } else {
    log('✗ subscribeFrameToTheme() function NOT found', 'red');
    passed = false;
  }

  if (hasApiCheck) {
    log('✓ Function calls ThemeSubscription API', 'green');
  } else {
    log('✗ Function does NOT call ThemeSubscription API', 'red');
    passed = false;
  }

  return passed;
}

function testAll7PlatformsCovered() {
  log('\n=== Test 3: All 7 platforms covered in subscription ===', 'blue');

  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = checkFile(appPath);

  if (!appJs) return false;

  const platforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
  const allPlatformsPattern = platforms.join("', '");
  const fullPattern = `['${allPlatformsPattern}']`;
  const hasAllPlatforms = appJs.includes(fullPattern);

  let passed = true;

  platforms.forEach(platform => {
    const platformPattern = `'${platform}'`;
    if (appJs.includes(platformPattern)) {
      log(`✓ Platform '${platform}' is covered`, 'green');
    } else {
      log(`✗ Platform '${platform}' is NOT covered`, 'red');
      passed = false;
    }
  });

  if (hasAllPlatforms) {
    log('✓ All 7 platforms in single subscription check', 'green');
  } else {
    log('✗ All 7 platforms NOT in single subscription check', 'red');
    passed = false;
  }

  return passed;
}

function testThemeSubscriptionFile() {
  log('\n=== Test 4: theme-subscription.js file integrity ===', 'blue');

  const subscriptionPath = path.join(__dirname, 'src/public/theme-subscription.js');
  const subscriptionJs = checkFile(subscriptionPath);

  if (!subscriptionJs) return false;

  const requiredExports = [
    'subscribe',
    'unsubscribe',
    'getCurrentTheme',
    'subscribePlatformFrame',
    'applyThemeToFrame'
  ];

  let passed = true;

  requiredExports.forEach(exportName => {
    if (subscriptionJs.includes(exportName)) {
      log(`✓ Export '${exportName}' exists`, 'green');
    } else {
      log(`✗ Export '${exportName}' NOT found`, 'red');
      passed = false;
    }
  });

  const hasGlobalExposure = subscriptionJs.includes('window.ThemeSubscription = ThemeSubscription');
  if (hasGlobalExposure) {
    log('✓ ThemeSubscription exposed to window', 'green');
  } else {
    log('✗ ThemeSubscription NOT exposed to window', 'red');
    passed = false;
  }

  return passed;
}

function testSubscriptionCalls() {
  log('\n=== Test 5: subscribeFrameToTheme() is actually called ===', 'blue');

  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = checkFile(appPath);

  if (!appJs) return false;

  const calls = (appJs.match(/subscribeFrameToTheme\(/g) || []).length;

  if (calls >= 3) {
    log(`✓ subscribeFrameToTheme() is called ${calls} times`, 'green');
    return true;
  } else {
    log(`✗ subscribeFrameToTheme() called only ${calls} times (expected at least 3)`, 'red');
    return false;
  }
}

function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   Platform Frame Theme Subscription Integration Test   ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const results = {
    'Test 1: theme-subscription.js loaded': testThemeSubscriptionLoaded(),
    'Test 2: subscribeFrameToTheme() function': testSubscribeFrameFunction(),
    'Test 3: All 7 platforms covered': testAll7PlatformsCovered(),
    'Test 4: theme-subscription.js integrity': testThemeSubscriptionFile(),
    'Test 5: subscription calls exist': testSubscriptionCalls()
  };

  log('\n=== Test Summary ===', 'blue');

  let passCount = 0;
  let failCount = 0;

  Object.entries(results).forEach(([name, passed]) => {
    if (passed) {
      log(`✓ ${name}`, 'green');
      passCount++;
    } else {
      log(`✗ ${name}`, 'red');
      failCount++;
    }
  });

  log(`\nTotal: ${passCount} passed, ${failCount} failed`, failCount === 0 ? 'green' : 'yellow');

  if (failCount === 0) {
    log('\n🎉 All tests passed! Theme subscription is fully integrated.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the issues above.', 'yellow');
  }

  return failCount === 0;
}

// Run all tests
const success = runAllTests();
process.exit(success ? 0 : 1);
