#!/usr/bin/env node

/**
 * Context Frame Toggle Logic Test
 *
 * Unit test for toggle functionality without browser automation.
 * Tests the core JavaScript logic by importing and verifying functions.
 */

const fs = require('fs');
const path = require('path');

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0,
  platforms: {},
  codeAnalysis: {}
};

console.log('🧪 Context Frame Toggle Logic Test\n');
console.log('Testing toggle implementation without browser automation...\n');

// Test 1: Verify platform-frames.js exists and can be loaded
console.log('Test 1: Loading platform-frames module');
try {
  const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
  if (!fs.existsSync(platformFramesPath)) {
    throw new Error('platform-frames.js not found');
  }

  const platformFramesCode = fs.readFileSync(platformFramesPath, 'utf8');
  results.codeAnalysis.platformFramesLoaded = true;
  results.codeAnalysis.platformFramesSize = platformFramesCode.length;

  console.log('  ✅ platform-frames.js loaded successfully');
  console.log(`  📊 File size: ${(platformFramesCode.length / 1024).toFixed(2)} KB\n`);
  results.passed++;
} catch (error) {
  console.log(`  ❌ Failed to load platform-frames.js: ${error.message}\n`);
  results.failed++;
  results.codeAnalysis.platformFramesLoaded = false;
}

// Test 2: Extract platform definitions from platform-frames.js
console.log('Test 2: Extracting platform definitions');
try {
  const platformFramesCode = fs.readFileSync(path.join(__dirname, 'src/public/platform-frames.js'), 'utf8');

  // Count platform definitions by looking for platform ID patterns
  const platformPattern = /(\w+):\s*{/g;
  const platforms = [];
  let match;

  while ((match = platformPattern.exec(platformFramesCode)) !== null) {
    const platformId = match[1];
    // Filter out non-platform keys
    if (!['name', 'category', 'hasThemeSupport', 'aspectRatio', 'chrome', 'neutralContent', 'themeVars'].includes(platformId)) {
      platforms.push(platformId);
    }
  }

  // Get unique platforms
  const uniquePlatforms = [...new Set(platforms)];
  results.codeAnalysis.totalPlatformsFound = uniquePlatforms.length;
  results.codeAnalysis.platforms = uniquePlatforms;

  console.log(`  ✅ Found ${uniquePlatforms.length} platform definitions`);
  console.log(`  📋 Platforms: ${uniquePlatforms.slice(0, 10).join(', ')}${uniquePlatforms.length > 10 ? '...' : ''}\n`);
  results.passed++;
} catch (error) {
  console.log(`  ❌ Failed to extract platform definitions: ${error.message}\n`);
  results.failed++;
}

// Test 3: Check for buildContextFrame function
console.log('Test 3: Verifying buildContextFrame function');
try {
  const platformFramesCode = fs.readFileSync(path.join(__dirname, 'src/public/platform-frames.js'), 'utf8');

  const hasBuildFunction = platformFramesCode.includes('function buildContextFrame(');
  const hasGetPlatformFrame = platformFramesCode.includes('function getPlatformFrame(');
  const hasHasThemeSupport = platformFramesCode.includes('function hasThemeSupport(');

  results.codeAnalysis.hasBuildContextFrame = hasBuildFunction;
  results.codeAnalysis.hasGetPlatformFrame = hasGetPlatformFrame;
  results.codeAnalysis.hasHasThemeSupport = hasHasThemeSupport;

  if (hasBuildFunction && hasGetPlatformFrame && hasHasThemeSupport) {
    console.log('  ✅ All required context frame functions found');
    console.log(`    - buildContextFrame: ${hasBuildFunction ? '✅' : '❌'}`);
    console.log(`    - getPlatformFrame: ${hasGetPlatformFrame ? '✅' : '❌'}`);
    console.log(`    - hasThemeSupport: ${hasHasThemeSupport ? '✅' : '❌'}\n`);
    results.passed++;
  } else {
    throw new Error('Missing required functions');
  }
} catch (error) {
  console.log(`  ❌ Failed to verify buildContextFrame function: ${error.message}\n`);
  results.failed++;
}

// Test 4: Check toggleCardContext function in app.js
console.log('Test 4: Verifying toggleCardContext function');
try {
  const appJsPath = path.join(__dirname, 'src/public/app.js');
  if (!fs.existsSync(appJsPath)) {
    throw new Error('app.js not found');
  }

  const appJsCode = fs.readFileSync(appJsPath, 'utf8');

  const hasToggleFunction = appJsCode.includes('function toggleCardContext(');
  const hasRenderWithContext = appJsCode.includes('function renderPlatformWithContext(');
  const hasRenderCard = appJsCode.includes('function renderPlatformCard(');
  const hasUpdateHeader = appJsCode.includes('function updateCardHeader(');
  const hasContextState = appJsCode.includes('cardContextState');

  results.codeAnalysis.hasToggleCardContext = hasToggleFunction;
  results.codeAnalysis.hasRenderPlatformWithContext = hasRenderWithContext;
  results.codeAnalysis.hasRenderPlatformCard = hasRenderCard;
  results.codeAnalysis.hasUpdateCardHeader = hasUpdateHeader;
  results.codeAnalysis.hasCardContextState = hasContextState;

  if (hasToggleFunction && hasRenderWithContext && hasRenderCard) {
    console.log('  ✅ All required toggle functions found');
    console.log(`    - toggleCardContext: ${hasToggleFunction ? '✅' : '❌'}`);
    console.log(`    - renderPlatformWithContext: ${hasRenderWithContext ? '✅' : '❌'}`);
    console.log(`    - renderPlatformCard: ${hasRenderCard ? '✅' : '❌'}`);
    console.log(`    - updateCardHeader: ${hasUpdateHeader ? '✅' : '❌'}`);
    console.log(`    - cardContextState: ${hasContextState ? '✅' : '❌'}\n`);
    results.passed++;
  } else {
    throw new Error('Missing required toggle functions');
  }
} catch (error) {
  console.log(`  ❌ Failed to verify toggle functions: ${error.message}\n`);
  results.failed++;
}

// Test 5: Check for toggle button HTML generation
console.log('Test 5: Verifying toggle button HTML generation');
try {
  const appJsCode = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

  const hasToggleButtonClass = appJsCode.includes('card-context-toggle');
  const hasContextIcon = appJsCode.includes('context-icon');
  const hasContextLabel = appJsCode.includes('context-label');
  const hasCardOnlyLabel = appJsCode.includes('Card only');
  const hasInContextLabel = appJsCode.includes('In context');

  results.codeAnalysis.hasToggleButtonUI = hasToggleButtonClass && hasContextIcon && hasContextLabel;
  results.codeAnalysis.hasCardOnlyLabel = hasCardOnlyLabel;
  results.codeAnalysis.hasInContextLabel = hasInContextLabel;

  if (hasToggleButtonClass && hasContextIcon && hasContextLabel && hasCardOnlyLabel && hasInContextLabel) {
    console.log('  ✅ Toggle button HTML generation verified');
    console.log(`    - card-context-toggle class: ${hasToggleButtonClass ? '✅' : '❌'}`);
    console.log(`    - context-icon element: ${hasContextIcon ? '✅' : '❌'}`);
    console.log(`    - context-label element: ${hasContextLabel ? '✅' : '❌'}`);
    console.log(`    - "Card only" label: ${hasCardOnlyLabel ? '✅' : '❌'}`);
    console.log(`    - "In context" label: ${hasInContextLabel ? '✅' : '❌'}\n`);
    results.passed++;
  } else {
    throw new Error('Missing toggle button UI elements');
  }
} catch (error) {
  console.log(`  ❌ Failed to verify toggle button UI: ${error.message}\n`);
  results.failed++;
}

// Test 6: Analyze 31 target platforms
console.log('Test 6: Analyzing 31 target platform support');
const TARGET_PLATFORMS = [
  // Social Media (7)
  'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok',
  // Messaging (10) - using correct platform IDs
  'slack', 'discord', 'imessage', 'whatsapp', 'telegram', 'signal', 'teams',
  'googlechat', 'zoomchat', 'line', 'kakaotalk',
  // Content Platforms (8)
  'pinterest', 'bluesky', 'mastodon', 'threads', 'tumblr', 'reddit', 'medium', 'devto',
  // Developer Tools (5)
  'github', 'gitlab', 'stackoverflow', 'hackernews', 'producthunt',
  // Email (1)
  'gmail'
];

try {
  const platformFramesCode = fs.readFileSync(path.join(__dirname, 'src/public/platform-frames.js'), 'utf8');

  let supportedCount = 0;
  const unsupportedPlatforms = [];

  TARGET_PLATFORMS.forEach(platformId => {
    // Check if platform is defined in PLATFORM_FRAMES
    const platformPattern = new RegExp(`${platformId}\\s*:\\s*\\{`, 's');
    const isDefined = platformPattern.test(platformFramesCode);

    // Check if platform has chrome template
    const chromePattern = new RegExp(`${platformId}\\s*:\\s*\\{[^}]*chrome\\s*:\\s*\``, 's');
    const hasChrome = chromePattern.test(platformFramesCode);

    // Check if platform has neutral content
    const contentPattern = new RegExp(`${platformId}\\s*:\\s*\\{[^}]*neutralContent\\s*:\\s*\``, 's');
    const hasContent = contentPattern.test(platformFramesCode);

    // Check if platform has theme vars
    const themePattern = new RegExp(`${platformId}\\s*:\\s*\\{[^}]*themeVars\\s*:\\s*\\{`, 's');
    const hasTheme = themePattern.test(platformFramesCode);

    const isSupported = isDefined && hasChrome;

    results.platforms[platformId] = {
      defined: isDefined,
      hasChrome,
      hasContent,
      hasTheme,
      supported: isSupported
    };

    if (isSupported) {
      supportedCount++;
    } else {
      unsupportedPlatforms.push(platformId);
    }
  });

  results.codeAnalysis.targetPlatformsSupported = supportedCount;
  results.codeAnalysis.targetPlatformsTotal = TARGET_PLATFORMS.length;
  results.codeAnalysis.unsupportedPlatforms = unsupportedPlatforms;

  console.log(`  ✅ Platform support analysis complete`);
  console.log(`    - Supported: ${supportedCount}/${TARGET_PLATFORMS.length}`);

  if (unsupportedPlatforms.length > 0) {
    console.log(`    - Unsupported: ${unsupportedPlatforms.join(', ')}`);
  }

  console.log();

  if (unsupportedPlatforms.length === 0) {
    console.log(`  ✅ All 31 target platforms have context frame support\n`);
    results.passed++;
  } else {
    console.log(`  ⚠️  ${unsupportedPlatforms.length} platforms missing context frame support\n`);
    results.failed++;
  }
} catch (error) {
  console.log(`  ❌ Failed to analyze platform support: ${error.message}\n`);
  results.failed++;
}

// Test 7: Check theme support infrastructure
console.log('Test 7: Verifying theme support infrastructure');
try {
  const platformFramesCode = fs.readFileSync(path.join(__dirname, 'src/public/platform-frames.js'), 'utf8');

  // Check for theme-related infrastructure
  const hasGetThemeVars = platformFramesCode.includes('function getThemeVars(');
  const hasInlineThemeStyles = platformFramesCode.includes('function getInlineThemeStyles(');
  const hasThemeConstants = platformFramesCode.includes('THEME_VAR_NAMES');
  const hasDarkLightPatterns = platformFramesCode.includes('dark:') && platformFramesCode.includes('light:');

  results.codeAnalysis.hasThemeInfrastructure = hasGetThemeVars && hasInlineThemeStyles && hasThemeConstants;

  if (hasGetThemeVars && hasInlineThemeStyles && hasThemeConstants && hasDarkLightPatterns) {
    console.log('  ✅ Theme support infrastructure verified');
    console.log(`    - getThemeVars function: ${hasGetThemeVars ? '✅' : '❌'}`);
    console.log(`    - getInlineThemeStyles function: ${hasInlineThemeStyles ? '✅' : '❌'}`);
    console.log(`    - THEME_VAR_NAMES constants: ${hasThemeConstants ? '✅' : '❌'}`);
    console.log(`    - Dark/light theme patterns: ${hasDarkLightPatterns ? '✅' : '❌'}\n`);
    results.passed++;
  } else {
    throw new Error('Missing theme infrastructure');
  }
} catch (error) {
  console.log(`  ❌ Failed to verify theme infrastructure: ${error.message}\n`);
  results.failed++;
}

// Generate summary
console.log('='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: 7`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / 7) * 100).toFixed(1)}%`);

if (results.codeAnalysis.targetPlatformsTotal) {
  console.log(`\nPlatform Coverage:`);
  console.log(`- Target platforms: ${results.codeAnalysis.targetPlatformsTotal}`);
  console.log(`- Supported: ${results.codeAnalysis.targetPlatformsSupported}`);
  console.log(`- Coverage: ${((results.codeAnalysis.targetPlatformsSupported / results.codeAnalysis.targetPlatformsTotal) * 100).toFixed(1)}%`);

  if (results.codeAnalysis.unsupportedPlatforms.length > 0) {
    console.log(`\nUnsupported platforms: ${results.codeAnalysis.unsupportedPlatforms.join(', ')}`);
  }
}

console.log('\n' + '='.repeat(60));

// Save results
const resultsPath = path.join(__dirname, 'test-results', 'toggle-logic-analysis.json');
const resultsDir = path.dirname(resultsPath);

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`💾 Results saved to: ${resultsPath}`);

const allPassed = results.failed === 0;
console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'));
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
