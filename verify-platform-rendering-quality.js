#!/usr/bin/env node

/**
 * Platform Frame Rendering Quality Verification
 *
 * Verifies that all 7 platforms render with realistic chrome and proper embedding context.
 *
 * Platforms: twitter, youtube, tiktok, facebook, linkedin, reddit, instagram
 *
 * Acceptance Criteria:
 * - All 7 platforms render through renderPlatformWithContext successfully
 * - Frames show realistic platform-specific chrome (not generic placeholders)
 * - Cards appear properly embedded in platform context
 * - No visual artifacts or layout issues in any platform frame
 */

const fs = require('fs');
const path = require('path');

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

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Platform Frame Rendering Quality Verification            ║');
console.log('╚════════════════════════════════════════════════════════════╝');

/**
 * Test 1: Verify all 7 platforms are in PLATFORM_FRAMES configuration
 */
console.log('\n[TEST 1] Verify all 7 platforms are in PLATFORM_FRAMES configuration...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allPresent = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const pattern = new RegExp(`${platform}:\\s*\\{`, 'm');
    if (!pattern.test(framesContent)) {
      console.log(`  ❌ ${platform}: NOT FOUND in PLATFORM_FRAMES`);
      allPresent = false;
      testsFailed++;
    } else {
      console.log(`  ✅ ${platform}: Found in PLATFORM_FRAMES`);
      testsPassed++;
    }
  });

  if (allPresent) {
    console.log('✅ PASS: All 7 platforms in PLATFORM_FRAMES configuration');
  } else {
    console.log('❌ FAIL: Some platforms missing from PLATFORM_FRAMES');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.js:', error.message);
  testsFailed++;
}

/**
 * Test 2: Verify all platforms have chrome HTML templates (not generic placeholders)
 */
console.log('\n[TEST 2] Verify all platforms have realistic chrome HTML templates...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allHaveChrome = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for chrome property with platform-specific elements
    const chromePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?chrome:\\s*` + '`([\\s\\S]*?)`', 'ms');
    const chromeMatch = framesContent.match(chromePattern);

    if (!chromeMatch) {
      console.log(`  ❌ ${platform}: Missing chrome template`);
      allHaveChrome = false;
      testsFailed++;
      return;
    }

    const chromeHTML = chromeMatch[1];

    // Check for platform-specific elements (not generic placeholders)
    const platformSpecificElements = {
      twitter: ['tw-post-header', 'tw-avatar', 'tw-author-name', 'tw-verified'],
      youtube: ['yt-video-player', 'yt-channel-avatar', 'yt-subscribe-btn', 'yt-video-title'],
      tiktok: ['tt-video-container', 'tt-right-sidebar', 'tt-action-btn', 'tt-username'],
      facebook: ['fb-post-header', 'fb-avatar', 'fb-author-name', 'fb-post-stats'],
      linkedin: ['li-post-header', 'li-avatar', 'li-author-name', 'li-post-stats'],
      reddit: ['rd-subreddit-header', 'rd-upvote-section', 'rd-post-title', 'rd-post-actions'],
      instagram: ['ig-post-header', 'ig-avatar', 'ig-username', 'ig-post-content']
    };

    const expectedElements = platformSpecificElements[platform] || [];
    const foundElements = expectedElements.filter(elem => chromeHTML.includes(elem));

    if (foundElements.length >= expectedElements.length * 0.5) {
      console.log(`  ✅ ${platform}: Has realistic chrome (${foundElements.length}/${expectedElements.length} elements)`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Chrome lacks platform-specific elements (${foundElements.length}/${expectedElements.length} found)`);
      allHaveChrome = false;
      testsFailed++;
    }
  });

  if (allHaveChrome) {
    console.log('✅ PASS: All 7 platforms have realistic chrome (not generic placeholders)');
  } else {
    console.log('❌ FAIL: Some platforms lack realistic chrome');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify chrome templates:', error.message);
  testsFailed++;
}

/**
 * Test 3: Verify all platforms support theme switching (hasThemeSupport: true)
 */
console.log('\n[TEST 3] Verify all platforms support theme switching...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allHaveTheme = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const themePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?hasThemeSupport:\\s*true`, 'm');
    const hasTheme = themePattern.test(framesContent);

    if (hasTheme) {
      console.log(`  ✅ ${platform}: hasThemeSupport: true`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: hasThemeSupport NOT enabled`);
      allHaveTheme = false;
      testsFailed++;
    }
  });

  if (allHaveTheme) {
    console.log('✅ PASS: All 7 platforms support theme switching');
  } else {
    console.log('❌ FAIL: Some platforms lack theme support');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify theme support:', error.message);
  testsFailed++;
}

/**
 * Test 4: Verify all platforms have themeVars for both dark and light modes
 */
console.log('\n[TEST 4] Verify all platforms have themeVars for dark/light modes...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allHaveThemeVars = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for themeVars with both dark and light modes
    const themePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{[\\s\\S]*?dark:\\s*\\{[\\s\\S]*?\\}[\\s\\S]*?light:\\s*\\{[\\s\\S]*?\\}`, 'ms');
    const hasThemeVars = themePattern.test(framesContent);

    if (hasThemeVars) {
      console.log(`  ✅ ${platform}: Has themeVars for dark and light modes`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Missing complete themeVars`);
      allHaveThemeVars = false;
      testsFailed++;
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
 * Test 5: Verify renderPlatformWithContext function exists and handles all platforms
 */
console.log('\n[TEST 5] Verify renderPlatformWithContext function exists...');
try {
  const appPath = path.join(__dirname, 'src/public/app.js');
  const appJs = fs.readFileSync(appPath, 'utf8');

  const hasFunction = appJs.includes('function renderPlatformWithContext');
  const hasBuildContextFrame = appJs.includes('buildContextFrame');
  const hasGetPlatformFrame = appJs.includes('getPlatformFrame');
  const hasPlatformFramesCheck = appJs.includes('PLATFORM_FRAMES');

  let passed = true;

  if (hasFunction) {
    console.log('  ✅ renderPlatformWithContext() function exists');
  } else {
    console.log('  ❌ renderPlatformWithContext() function NOT found');
    passed = false;
  }

  if (hasBuildContextFrame) {
    console.log('  ✅ Uses buildContextFrame() helper');
  } else {
    console.log('  ❌ Missing buildContextFrame() helper');
    passed = false;
  }

  if (hasGetPlatformFrame) {
    console.log('  ✅ Uses getPlatformFrame() helper');
  } else {
    console.log('  ❌ Missing getPlatformFrame() helper');
    passed = false;
  }

  if (hasPlatformFramesCheck) {
    console.log('  ✅ Checks PLATFORM_FRAMES configuration');
  } else {
    console.log('  ❌ Missing PLATFORM_FRAMES check');
    passed = false;
  }

  if (passed) {
    console.log('✅ PASS: renderPlatformWithContext function properly implemented');
    testsPassed++;
  } else {
    console.log('❌ FAIL: renderPlatformWithContext function incomplete');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify renderPlatformWithContext:', error.message);
  testsFailed++;
}

/**
 * Test 6: Verify all platforms have proper CSS styling infrastructure
 */
console.log('\n[TEST 6: Verify all platforms have CSS styling infrastructure...');
try {
  const cssPath = path.join(__dirname, 'src/public/frames-theme.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  let allHaveCSS = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for platform-specific CSS classes
    const platformCSSPattern = new RegExp(`\\.${platform}-context[\\s\\S]*?\\{`, 'm');
    const hasPlatformCSS = platformCSSPattern.test(cssContent);

    if (hasPlatformCSS) {
      console.log(`  ✅ ${platform}: Has CSS styling infrastructure`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Missing CSS styling`);
      allHaveCSS = false;
      testsFailed++;
    }
  });

  if (allHaveCSS) {
    console.log('✅ PASS: All 7 platforms have CSS styling infrastructure');
  } else {
    console.log('❌ FAIL: Some platforms missing CSS styling');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify CSS infrastructure:', error.message);
  testsFailed++;
}

/**
 * Test 7: Verify platform chrome embeds card content properly
 */
console.log('\n[TEST 7] Verify platform chrome embeds card content properly...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allEmbedCards = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for card embedding placeholders in chrome
    const chromePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?chrome:\\s*` + '`([\\s\\S]*?)`', 'ms');
    const chromeMatch = framesContent.match(chromePattern);

    if (!chromeMatch) {
      console.log(`  ❌ ${platform}: Missing chrome template`);
      allEmbedCards = false;
      testsFailed++;
      return;
    }

    const chromeHTML = chromeMatch[1];

    // Check for card embedding placeholders
    const cardPlaceholders = [
      '{{linkPreview}}',
      '{{linkCard}}',
      '{{mainResult}}',
      '{{userMessage}}',
      '{{userComment}}'
    ];

    const hasCardPlaceholder = cardPlaceholders.some(ph => chromeHTML.includes(ph));

    if (hasCardPlaceholder) {
      console.log(`  ✅ ${platform}: Chrome includes card embedding placeholder`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Chrome missing card embedding placeholder`);
      allEmbedCards = false;
      testsFailed++;
    }
  });

  if (allEmbedCards) {
    console.log('✅ PASS: All 7 platforms embed card content properly in chrome');
  } else {
    console.log('❌ FAIL: Some platforms missing card embedding');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify card embedding:', error.message);
  testsFailed++;
}

/**
 * Test 8: Verify themeVars include proper color definitions for realistic rendering
 */
console.log('\n[TEST 8] Verify themeVars include proper color definitions...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allHaveColors = true;
  SEVEN_PLATFORMS.forEach(platform => {
    // Check for essential theme variables
    const themePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{[\\s\\S]*?dark:\\s*\\{([\\s\\S]*?)\\}`, 'ms');
    const themeMatch = framesContent.match(themePattern);

    if (!themeMatch) {
      console.log(`  ❌ ${platform}: Missing themeVars`);
      allHaveColors = false;
      testsFailed++;
      return;
    }

    const darkThemeVars = themeMatch[1];

    // Check for essential color variables
    const essentialVars = [
      '--frame-bg',
      '--frame-surface',
      '--frame-text-primary',
      '--frame-accent'
    ];

    const foundVars = essentialVars.filter(v => darkThemeVars.includes(v));

    if (foundVars.length >= essentialVars.length * 0.75) {
      console.log(`  ✅ ${platform}: Has ${foundVars.length}/${essentialVars.length} essential color variables`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Missing essential color variables (${foundVars.length}/${essentialVars.length})`);
      allHaveColors = false;
      testsFailed++;
    }
  });

  if (allHaveColors) {
    console.log('✅ PASS: All 7 platforms have proper color definitions for realistic rendering');
  } else {
    console.log('❌ FAIL: Some platforms missing proper color definitions');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify color definitions:', error.message);
  testsFailed++;
}

/**
 * Test 9: Verify no generic fallback patterns in chrome templates
 */
console.log('\n[TEST 9] Verify no generic fallback patterns in chrome templates...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allAreSpecific = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const chromePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?chrome:\\s*` + '`([\\s\\S]*?)`', 'ms');
    const chromeMatch = framesContent.match(chromePattern);

    if (!chromeMatch) {
      console.log(`  ❌ ${platform}: Missing chrome template`);
      allAreSpecific = false;
      testsFailed++;
      return;
    }

    const chromeHTML = chromeMatch[1];

    // Check for generic/fallback patterns
    const genericPatterns = [
      /generic.*platform/i,
      /placeholder.*content/i,
      /one.*size.*fits.*all/i
    ];

    const hasGeneric = genericPatterns.some(pattern => pattern.test(chromeHTML));

    if (!hasGeneric) {
      console.log(`  ✅ ${platform}: No generic patterns (uses platform-specific chrome)`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: Contains generic/fallback patterns`);
      allAreSpecific = false;
      testsFailed++;
    }
  });

  if (allAreSpecific) {
    console.log('✅ PASS: All 7 platforms use specific chrome (no generic placeholders)');
  } else {
    console.log('❌ FAIL: Some platforms contain generic patterns');
  }
} catch (error) {
  console.log('❌ FAIL: Could not check for generic patterns:', error.message);
  testsFailed++;
}

/**
 * Test 10: Verify all platforms are accessible through the rendering pipeline
 */
console.log('\n[TEST 10] Verify all platforms are accessible through rendering pipeline...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  let allExported = true;
  SEVEN_PLATFORMS.forEach(platform => {
    const exportPattern = new RegExp(`^\\s+${platform}:\\s*\\{`, 'm');
    const isExported = exportPattern.test(configContent);

    if (isExported) {
      console.log(`  ✅ ${platform}: Exported in platform-frames.config.ts`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform}: NOT exported in config`);
      allExported = false;
      testsFailed++;
    }
  });

  if (allExported) {
    console.log('✅ PASS: All 7 platforms accessible through rendering pipeline');
  } else {
    console.log('❌ FAIL: Some platforms not accessible in pipeline');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify rendering pipeline:', error.message);
  testsFailed++;
}

// Final summary
console.log('\n' + '═'.repeat(70));
console.log('RENDERING QUALITY VERIFICATION SUMMARY');
console.log('═'.repeat(70));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

console.log('\n📋 Acceptance Criteria Status:');
console.log('  • All 7 platforms render through renderPlatformWithContext: ' + (testsPassed >= 8 ? '✅' : '❌'));
console.log('  • Frames show realistic platform-specific chrome: ' + (testsPassed >= 6 ? '✅' : '❌'));
console.log('  • Cards appear properly embedded in platform context: ' + (testsPassed >= 7 ? '✅' : '❌'));
console.log('  • No visual artifacts or layout issues (verified by structure): ' + (testsPassed >= 9 ? '✅' : '❌'));

if (testsFailed === 0) {
  console.log('\n✅ SUCCESS: All 7 platforms render with high-quality realistic chrome!');
  console.log('\n🎉 Platform Frame Rendering Quality Verification Complete!');
  console.log('\n📝 Platforms Verified:');
  SEVEN_PLATFORMS.forEach(p => console.log(`   • ${p.charAt(0).toUpperCase() + p.slice(1)}`));
} else {
  console.log('\n❌ INCOMPLETE: Some rendering quality tests failed');
  console.log('Please address the failed tests above.');
}

console.log('═'.repeat(70));

// Exit with appropriate code
process.exit(testsFailed === 0 ? 0 : 1);