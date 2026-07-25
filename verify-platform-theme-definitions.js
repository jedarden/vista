#!/usr/bin/env node
/**
 * Verify Platform Frame Theme Definitions
 *
 * This script checks that all platform frames have proper theme definitions
 * for both light and dark modes, ensuring theme switching will work correctly.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Required CSS variables for proper theming
const REQUIRED_THEME_VARS = [
  '--frame-bg',
  '--frame-surface',
  '--frame-border',
  '--frame-text-primary',
  '--frame-text-secondary',
  '--frame-accent',
  '--frame-link-color'
];

// Load platform frames configuration
function loadPlatformFrames() {
  const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const content = fs.readFileSync(platformFramesPath, 'utf8');

  // Extract PLATFORM_FRAMES object
  const match = content.match(/const PLATFORM_FRAMES = \{([\s\S]*?)\n\};\n\n/);
  if (!match) {
    log('Failed to extract PLATFORM_FRAMES from platform-frames.js', 'red');
    process.exit(1);
  }

  // Parse platform definitions using different approach
  const platforms = [];
  const platformPattern = /(\w+):\s*\{[\s\S]*?name:\s*'([^']+)'/g;
  let platformMatch;

  while ((platformMatch = platformPattern.exec(match[1])) !== null) {
    const platformId = platformMatch[1];
    const platformName = platformMatch[2];

    // Extract full platform block - find from platformId to next platform definition
    const startIndex = content.indexOf(`${platformId}: {`);
    if (startIndex === -1) continue;

    // Find the end of this platform definition (next platform definition or end of PLATFORM_FRAMES)
    let endIndex = content.indexOf('\n  },', startIndex);
    if (endIndex === -1) {
      // Try finding just } without comma
      endIndex = content.indexOf('\n  }', startIndex);
    }

    if (endIndex === -1) continue;

    const platformBlock = content.substring(startIndex, endIndex);

    platforms.push({
      id: platformId,
      name: platformName,
      block: platformBlock
    });
  }

  return platforms;
}

// Extract theme variables from platform block
function extractThemeVars(platformBlock, theme) {
  const themePattern = new RegExp(`${theme}:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, 'm');
  const themeMatch = platformBlock.match(themePattern);

  if (!themeMatch) return null;

  const themeBlock = themeMatch[1];
  const vars = {};

  REQUIRED_THEME_VARS.forEach(varName => {
    const varPattern = new RegExp(`'${varName}':\\s*'([^']+)'`);
    const varMatch = themeBlock.match(varPattern);
    if (varMatch) {
      vars[varName] = varMatch[1];
    }
  });

  return vars;
}

// Check if platform has theme support
function hasThemeSupport(platformBlock) {
  return platformBlock.includes('hasThemeSupport: true') || platformBlock.includes('hasThemeSupport: false');
}

// Test a platform's theme configuration
function testPlatformTheme(platform) {
  const result = {
    platform: platform.id,
    name: platform.name,
    hasThemeSupport: platform.block.includes('hasThemeSupport: true'),
    hasThemeSupportField: platform.block.includes('hasThemeSupport: true') || platform.block.includes('hasThemeSupport: false'),
    dark: { hasConfig: false, complete: false, vars: {} },
    light: { hasConfig: false, complete: false, vars: {} },
    issues: []
  };

  // Extract dark theme vars
  const darkVars = extractThemeVars(platform.block, 'dark');
  result.dark.hasConfig = !!darkVars;
  result.dark.vars = darkVars || {};
  result.dark.complete = darkVars && REQUIRED_THEME_VARS.every(v => darkVars[v]);

  // Extract light theme vars
  const lightVars = extractThemeVars(platform.block, 'light');
  result.light.hasConfig = !!lightVars;
  result.light.vars = lightVars || {};
  result.light.complete = lightVars && REQUIRED_THEME_VARS.every(v => lightVars[v]);

  // Identify issues
  // Check if hasThemeSupport is properly set based on theme config presence
  const hasThemeConfig = result.dark.hasConfig || result.light.hasConfig;

  // Only flag this as an issue if the platform actually has a hasThemeSupport field
  if (result.hasThemeSupportField) {
    if (hasThemeConfig && !result.hasThemeSupport) {
      result.issues.push('Platform has theme config but hasThemeSupport is false (should be true)');
    } else if (!hasThemeConfig && result.hasThemeSupport) {
      result.issues.push('Platform has hasThemeSupport true but no theme config (should be false)');
    }
  } else if (hasThemeConfig && !result.hasThemeSupportField) {
    result.issues.push('Platform has theme config but missing hasThemeSupport field (should be set to true)');
  }

  if (!result.dark.hasConfig) {
    result.issues.push('Missing dark theme configuration');
  } else if (!result.dark.complete) {
    const missingVars = REQUIRED_THEME_VARS.filter(v => !result.dark.vars[v]);
    result.issues.push(`Dark theme missing vars: ${missingVars.join(', ')}`);
  }

  if (!result.light.hasConfig) {
    result.issues.push('Missing light theme configuration');
  } else if (!result.light.complete) {
    const missingVars = REQUIRED_THEME_VARS.filter(v => !result.light.vars[v]);
    result.issues.push(`Light theme missing vars: ${missingVars.join(', ')}`);
  }

  // Check for distinct colors between themes (should not be identical)
  if (result.dark.complete && result.light.complete) {
    const identicalColors = REQUIRED_THEME_VARS.filter(v =>
      result.dark.vars[v] && result.light.vars[v] && result.dark.vars[v] === result.light.vars[v]
    );

    if (identicalColors.length > REQUIRED_THEME_VARS.length / 2) {
      result.issues.push(`Dark and light themes have many identical colors: ${identicalColors.slice(0, 3).join(', ')}`);
    }
  }

  result.passed = result.issues.length === 0;

  return result;
}

// Main test function
function runTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Platform Frame Theme Definition Verification                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log('Loading platform frames...', 'blue');
  const platforms = loadPlatformFrames();
  log(`Found ${platforms.length} platform definitions\n`, 'blue');

  const results = {
    total: platforms.length,
    tested: platforms.length,
    passed: 0,
    failed: 0,
    platforms: []
  };

  // Test each platform
  platforms.forEach(platform => {
    const result = testPlatformTheme(platform);
    results.platforms.push(result);

    if (result.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  });

  // Display results
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST RESULTS                                                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Total Platforms: ${results.total}`, 'bright');
  log(`Tested: ${results.tested}`);
  log(`✓ Passed: ${results.passed}`, 'green');
  log(`✗ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  const passRate = ((results.passed / results.tested) * 100).toFixed(1);
  log(`Pass Rate: ${passRate}%\n`);

  // Show failed platforms
  const failed = results.platforms.filter(r => !r.passed);
  if (failed.length > 0) {
    log('╔════════════════════════════════════════════════════════════════╗', 'yellow');
    log('║  PLATFORMS WITH THEME ISSUES                                   ║', 'yellow');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'yellow');

    failed.forEach(result => {
      log(`✗ ${result.name} (${result.platform})`, 'red');
      result.issues.forEach(issue => {
        log(`  • ${issue}`, 'yellow');
      });
      log('');
    });
  }

  // Show passed platforms
  const passed = results.platforms.filter(r => r.passed);
  if (passed.length > 0) {
    log('╔════════════════════════════════════════════════════════════════╗', 'green');
    log('║  PLATFORMS WITH CORRECT THEME CONFIGURATION                    ║', 'green');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'green');

    // Group by theme support
    const withSupport = passed.filter(r => r.hasThemeSupport);
    const withoutSupport = passed.filter(r => !r.hasThemeSupport);

    log(`Platforms with theme support (${withSupport.length}):`, 'green');
    withSupport.forEach(r => log(`  ✓ ${r.name}`, 'green'));

    if (withoutSupport.length > 0) {
      log(`\nPlatforms without theme support (${withoutSupport.length}):`, 'cyan');
      withoutSupport.forEach(r => log(`  ○ ${r.name} (no theme switching expected)`, 'cyan'));
    }
  }

  // Acceptance criteria status
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  ACCEPTANCE CRITERIA STATUS                                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  const allHaveConfig = results.platforms.every(r => r.dark.hasConfig && r.light.hasConfig);
  const allComplete = results.platforms.every(r => r.dark.complete && r.light.complete);
  const allHaveSupport = results.platforms.every(r => r.hasThemeSupport);

  log(`${allHaveConfig ? '✓' : '✗'} All platforms have theme configuration`, allHaveConfig ? 'green' : 'red');
  log(`${allComplete ? '✓' : '✗'} All platforms have complete theme variables`, allComplete ? 'green' : 'red');
  log(`${allHaveSupport ? '✓' : '○'} All platforms declare theme support`, allHaveSupport ? 'green' : 'cyan');
  log(`${results.failed === 0 ? '✓' : '✗'} No theme configuration issues`, results.failed === 0 ? 'green' : 'red');

  // Final verdict
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  if (results.failed === 0) {
    log('║  ✓✓✓ ALL TESTS PASSED - Theme definitions are correct! ✓✓✓     ║', 'green');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'green');
    process.exit(0);
  } else {
    log('║  ✗✗✗ SOME TESTS FAILED - Theme issues detected above ✗✗✗      ║', 'red');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'red');
    process.exit(1);
  }
}

// Run tests
runTests();
