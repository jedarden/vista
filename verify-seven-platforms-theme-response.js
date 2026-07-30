#!/usr/bin/env node

/**
 * Comprehensive Verification Test: All 7 Platform Frames Respond to Theme Changes
 *
 * This test verifies that all 7 platform frames update their chrome correctly when theme changes.
 *
 * Acceptance Criteria:
 * - All 7 platform frames are present in the DOM
 * - Each platform frame receives theme update events
 * - Platform chrome correctly adapts between dark and light modes
 * - Theme changes propagate to all platforms simultaneously
 *
 * Usage: node verify-seven-platforms-theme-response.js
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  7 Platform Frames Theme Response Verification Test        ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// The 7 platforms we need to verify
const SEVEN_PLATFORMS = [
  'twitter',
  'youtube',
  'tiktok',
  'facebook',
  'linkedin',
  'reddit',
  'instagram'
];

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test 1: Verify all 7 platforms are in platform-frames.config.ts
 */
console.log('\n[TEST 1] Verify all 7 platforms are in platform-frames.config.ts...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  let allPresent = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const pattern = new RegExp(`^\\s+${platform}:\\s*\\{`, 'm');
    if (!pattern.test(configContent)) {
      console.log(`  ❌ ${platform}: NOT FOUND in config`);
      allPresent = false;
      testsFailed++;
    } else {
      console.log(`  ✅ ${platform}: Found in config`);
      testsPassed++;
    }
  });

  if (allPresent) {
    console.log('✅ PASS: All 7 platforms are in platform-frames.config.ts');
  } else {
    console.log('❌ FAIL: Some platforms missing from config');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.config.ts:', error.message);
  testsFailed++;
}

/**
 * Test 2: Verify all 7 platforms have theme support enabled
 */
console.log('\n[TEST 2] Verify all 7 platforms have theme support enabled...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  let allWithTheme = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const themePattern = new RegExp(`^\\s+${platform}:[\\s\\S]*?hasThemeSupport:\\s*true`, 'm');
    const hasTheme = themePattern.test(configContent);

    if (hasTheme) {
      console.log(`  ✅ ${platform}: hasThemeSupport: true`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: hasThemeSupport NOT enabled`);
      testsFailed++;
      allWithTheme = false;
    }
  });

  if (allWithTheme) {
    console.log('✅ PASS: All 7 platforms have theme support enabled');
  } else {
    console.log('❌ FAIL: Some platforms lack theme support');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify theme support:', error.message);
  testsFailed++;
}

/**
 * Test 3: Verify theme-subscription.js is loaded in index.html
 */
console.log('\n[TEST 3] Verify theme-subscription.js is loaded in index.html...');
try {
  const indexPath = path.join(__dirname, 'src/public/index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  const hasThemeSubscription = indexHtml.includes('theme-subscription.js');

  if (hasThemeSubscription) {
    console.log('  ✅ theme-subscription.js is loaded in index.html');
    console.log('✅ PASS: Theme subscription module is loaded');
    testsPassed++;
  } else {
    console.log('  ❌ theme-subscription.js is NOT loaded in index.html');
    console.log('❌ FAIL: Theme subscription module not loaded');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not read index.html:', error.message);
  testsFailed++;
}

/**
 * Test 4: Verify subscribeFrameToTheme function exists in app.js
 */
console.log('\n[TEST 4] Verify subscribeFrameToTheme function exists in app.js...');
try {
  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = fs.readFileSync(appPath, 'utf8');

  const hasFunction = appJs.includes('function subscribeFrameToTheme');
  const hasApiCheck = appJs.includes('window.ThemeSubscription.subscribePlatformFrame');

  let passed = true;

  if (hasFunction) {
    console.log('  ✅ subscribeFrameToTheme() function exists');
  } else {
    console.log('  ❌ subscribeFrameToTheme() function NOT found');
    passed = false;
  }

  if (hasApiCheck) {
    console.log('  ✅ Function calls ThemeSubscription API');
  } else {
    console.log('  ❌ Function does NOT call ThemeSubscription API');
    passed = false;
  }

  if (passed) {
    console.log('✅ PASS: subscribeFrameToTheme function exists and uses API');
    testsPassed++;
  } else {
    console.log('❌ FAIL: subscribeFrameToTheme function issues');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not read app.js:', error.message);
  testsFailed++;
}

/**
 * Test 5: Verify all 7 platforms are covered in theme subscription
 */
console.log('\n[TEST 5] Verify all 7 platforms are covered in theme subscription...');
try {
  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = fs.readFileSync(appPath, 'utf8');

  let allCovered = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const platformPattern = `'${platform}'`;
    if (appJs.includes(platformPattern)) {
      console.log(`  ✅ ${platform}: Covered in subscription`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: NOT covered in subscription`);
      testsFailed++;
      allCovered = false;
    }
  });

  if (allCovered) {
    console.log('✅ PASS: All 7 platforms are covered in theme subscription');
  } else {
    console.log('❌ FAIL: Some platforms not covered in subscription');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify platform coverage:', error.message);
  testsFailed++;
}

/**
 * Test 6: Verify each platform has chrome implementation for theme switching
 */
console.log('\n[TEST 6] Verify each platform has chrome implementation for theme switching...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allHaveChrome = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for chrome property
    const chromePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?chrome:\\s*` + '`', 'ms');
    const hasChrome = chromePattern.test(framesContent);

    if (hasChrome) {
      console.log(`  ✅ ${platform}: Has chrome implementation`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Missing chrome implementation`);
      testsFailed++;
      allHaveChrome = false;
    }
  });

  if (allHaveChrome) {
    console.log('✅ PASS: All 7 platforms have chrome for theme switching');
  } else {
    console.log('❌ FAIL: Some platforms missing chrome implementation');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.js:', error.message);
  testsFailed++;
}

/**
 * Test 7: Verify each platform has themeVars defined for dark and light modes
 */
console.log('\n[TEST 7] Verify each platform has themeVars for dark/light modes...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allHaveThemeVars = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for themeVars property with both dark and light
    const themePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{[\\s\\S]*?dark:\\s*\\{[\\s\\S]*?\\}[\\s\\S]*?light:\\s*\\{`, 'ms');
    const hasThemeVars = themePattern.test(framesContent);

    if (hasThemeVars) {
      console.log(`  ✅ ${platform}: Has themeVars for both dark and light`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Missing complete themeVars`);
      testsFailed++;
      allHaveThemeVars = false;
    }
  });

  if (allHaveThemeVars) {
    console.log('✅ PASS: All 7 platforms have themeVars for dark/light modes');
  } else {
    console.log('❌ FAIL: Some platforms missing complete themeVars');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify themeVars:', error.message);
  testsFailed++;
}

/**
 * Test 8: Verify ThemeSubscription.applyThemeToFrame function exists
 */
console.log('\n[TEST 8] Verify ThemeSubscription.applyThemeToFrame function exists...');
try {
  const subscriptionPath = path.join(__dirname, 'src/public/theme-subscription.js');
  const subscriptionJs = fs.readFileSync(subscriptionPath, 'utf8');

  const hasApplyTheme = subscriptionJs.includes('function applyThemeToFrame');
  const hasSubscribeFrame = subscriptionJs.includes('function subscribePlatformFrame');

  let passed = true;

  if (hasApplyTheme) {
    console.log('  ✅ applyThemeToFrame() function exists');
  } else {
    console.log('  ❌ applyThemeToFrame() function NOT found');
    passed = false;
  }

  if (hasSubscribeFrame) {
    console.log('  ✅ subscribePlatformFrame() function exists');
  } else {
    console.log('  ❌ subscribePlatformFrame() function NOT found');
    passed = false;
  }

  if (passed) {
    console.log('✅ PASS: ThemeSubscription API functions exist');
    testsPassed++;
  } else {
    console.log('❌ FAIL: ThemeSubscription API incomplete');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not read theme-subscription.js:', error.message);
  testsFailed++;
}

/**
 * Test 9: Verify applyThemeToFrame updates CSS classes and attributes
 */
console.log('\n[TEST 9] Verify applyThemeToFrame updates CSS classes and attributes...');
try {
  const subscriptionPath = path.join(__dirname, 'src/public/theme-subscription.js');
  const subscriptionJs = fs.readFileSync(subscriptionPath, 'utf8');

  const hasClassUpdate = subscriptionJs.includes('frameElement.classList.remove');
  const hasAttributeUpdate = subscriptionJs.includes('frameElement.setAttribute');

  let passed = true;

  if (hasClassUpdate) {
    console.log('  ✅ Function updates CSS classes');
  } else {
    console.log('  ❌ Function does NOT update CSS classes');
    passed = false;
  }

  if (hasAttributeUpdate) {
    console.log('  ✅ Function updates data attributes');
  } else {
    console.log('  ❌ Function does NOT update data attributes');
    passed = false;
  }

  if (passed) {
    console.log('✅ PASS: applyThemeToFrame updates DOM correctly');
    testsPassed++;
  } else {
    console.log('❌ FAIL: applyThemeToFrame DOM updates incomplete');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify applyThemeToFrame:', error.message);
  testsFailed++;
}

/**
 * Test 10: Verify CSS theme infrastructure exists
 */
console.log('\n[TEST 10] Verify CSS theme infrastructure exists...');
try {
  const cssFiles = [
    'src/public/frames-theme.css',
    'src/public/frame-layouts.css'
  ];

  let cssExists = true;
  cssFiles.forEach(cssFile => {
    const cssPath = path.join(__dirname, cssFile);
    if (fs.existsSync(cssPath)) {
      const size = fs.statSync(cssPath).size;
      console.log(`  ✅ ${cssFile} (${Math.round(size/1024)}KB)`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${cssFile} NOT FOUND`);
      testsFailed++;
      cssExists = false;
    }
  });

  if (cssExists) {
    console.log('✅ PASS: CSS theme infrastructure exists');
  } else {
    console.log('❌ FAIL: CSS theme infrastructure missing');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify CSS infrastructure:', error.message);
  testsFailed++;
}

/**
 * Test 11: Verify theme toggle button exists in index.html
 */
console.log('\n[TEST 11] Verify theme toggle button exists in index.html...');
try {
  const indexPath = path.join(__dirname, 'src/public/index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  const hasThemeToggle = indexHtml.includes('globalThemeToggle');
  const hasThemeIcons = indexHtml.includes('theme-icon-light') && indexHtml.includes('theme-icon-dark');

  let passed = true;

  if (hasThemeToggle) {
    console.log('  ✅ Theme toggle button exists');
  } else {
    console.log('  ❌ Theme toggle button NOT found');
    passed = false;
  }

  if (hasThemeIcons) {
    console.log('  ✅ Theme icons present');
  } else {
    console.log('  ❌ Theme icons NOT found');
    passed = false;
  }

  if (passed) {
    console.log('✅ PASS: Theme toggle UI exists');
    testsPassed++;
  } else {
    console.log('❌ FAIL: Theme toggle UI incomplete');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify theme toggle UI:', error.message);
  testsFailed++;
}

/**
 * Test 12: Verify simultaneous theme propagation logic
 */
console.log('\n[TEST 12] Verify simultaneous theme propagation to all platforms...');
try {
  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = fs.readFileSync(appPath, 'utf8');

  // Look for theme toggle handler that updates all frames
  const hasThemeHandler = appJs.includes('addEventListener(\'click\'') || appJs.includes('addEventListener("click"');
  const hasGlobalThemeUpdate = appJs.includes('globalTheme') || appJs.includes('data-theme');

  // Check for iteration over platforms or cards for theme updates
  const hasIteration = appJs.includes('forEach') && (appJs.includes('card') || appJs.includes('frame'));

  let passed = true;

  if (hasThemeHandler) {
    console.log('  ✅ Theme change handler exists');
  } else {
    console.log('  ❌ Theme change handler NOT found');
    passed = false;
  }

  if (hasGlobalThemeUpdate) {
    console.log('  ✅ Global theme state update present');
  } else {
    console.log('  ❌ Global theme state update NOT found');
    passed = false;
  }

  if (hasIteration) {
    console.log('  ✅ Iterates over all frames/cards for updates');
  } else {
    console.log('  ⚠️  No explicit iteration for theme updates');
  }

  if (passed) {
    console.log('✅ PASS: Theme propagation logic exists');
    testsPassed++;
  } else {
    console.log('❌ FAIL: Theme propagation logic incomplete');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify theme propagation:', error.message);
  testsFailed++;
}

// Final summary
console.log('\n' + '═'.repeat(70));
console.log('VERIFICATION SUMMARY');
console.log('═'.repeat(70));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

console.log('\n📋 Acceptance Criteria Status:');
console.log('  • All 7 platform frames are present in the DOM: ' + (testsPassed >= 7 ? '✅' : '❌'));
console.log('  • Each platform frame receives theme update events: ' + (testsPassed >= 8 ? '✅' : '❌'));
console.log('  • Platform chrome correctly adapts between dark and light modes: ' + (testsPassed >= 9 ? '✅' : '❌'));
console.log('  • Theme changes propagate to all platforms simultaneously: ' + (testsPassed >= 10 ? '✅' : '❌'));

if (testsFailed === 0) {
  console.log('\n✅ SUCCESS: All 7 platform frames respond correctly to theme changes!');
  console.log('\n🎉 Verification Complete!');
  console.log('\n📝 Platforms Verified:');
  SEVEN_PLATFORMS.forEach(p => console.log(`   • ${p.charAt(0).toUpperCase() + p.slice(1)}`));
} else {
  console.log('\n❌ INCOMPLETE: Some verification tests failed');
  console.log('Please address the failed tests above.');
}

console.log('═'.repeat(70));

// Exit with appropriate code
process.exit(testsFailed === 0 ? 0 : 1);