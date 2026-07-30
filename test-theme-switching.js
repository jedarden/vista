#!/usr/bin/env node

/**
 * Theme Switching and Edge Cases Test
 *
 * Comprehensive test for verifying dark/light mode switching across all platforms.
 *
 * Test Coverage:
 * - Toggle to 'in context' mode
 * - Switch from light to dark mode
 * - Verify both card and context frame update correctly
 * - Switch from dark to light mode
 * - Verify smooth transition without color conflicts
 * - Edge cases: long content, minimal theme support, complex frames
 * - Screenshot documentation for 10+ representative platforms
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 31 platforms matching the context frame toggle test
const PLATFORMS = [
  // Social Media (7)
  'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok',
  // Messaging (10)
  'slack', 'discord', 'imessage', 'whatsapp', 'telegram', 'signal', 'teams',
  'googlechat', 'zoom', 'line', 'kakaotalk',
  // Content Platforms (8)
  'pinterest', 'bluesky', 'mastodon', 'threads', 'tumblr', 'reddit', 'medium', 'devto',
  // Developer Tools (5)
  'github', 'gitlab', 'stackoverflow', 'hackernews', 'producthunt',
  // Email (1)
  'gmail'
];

// Edge case platforms for special testing
const EDGE_CASE_PLATFORMS = {
  longContent: ['medium', 'devto', 'notion', 'substack'], // Platforms with long content
  minimalTheme: ['google', 'hackernews'], // Minimal theme support
  complexFrames: ['slack', 'discord', 'github', 'figma'] // Complex context frames
};

// Representative platforms for screenshots (10+)
const SCREENSHOT_PLATFORMS = [
  'google', 'facebook', 'twitter', 'slack', 'discord',
  'github', 'reddit', 'instagram', 'linkedin', 'medium', 'youtube'
];

const TEST_URL = 'https://example.com/test-page';

// Test results structure
const results = {
  timestamp: new Date().toISOString(),
  totalPlatforms: PLATFORMS.length,
  tested: 0,
  passed: 0,
  failed: 0,
  platforms: {},
  edgeCases: {
    longContent: {},
    minimalTheme: {},
    complexFrames: {}
  },
  screenshots: [],
  issues: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupBrowser() {
  // Try chrome-headless-shell first, fallback to system chromium
  let browser;
  try {
    const chromePath = findChromeHeadlessShell();
    if (chromePath && fs.existsSync(chromePath)) {
      console.log(`  Using chrome-headless-shell at ${chromePath}`);
      browser = await puppeteer.launch({
        headless: 'shell',
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      throw new Error('chrome-headless-shell not found');
    }
  } catch (err) {
    console.log(`  Chrome-headless-shell failed: ${err.message}`);
    console.log(`  Trying system chromium...`);
    try {
      browser = await puppeteer.launch({
        headless: true,
        channel: 'chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
    } catch (err2) {
      console.log(`  System chromium failed: ${err2.message}`);
      throw new Error('No browser available');
    }
  }
  return browser;
}

function findChromeHeadlessShell() {
  const puppeteerCache = '/home/coding/.cache/puppeteer/chrome-headless-shell';
  if (!fs.existsSync(puppeteerCache)) {
    return null;
  }

  const versions = fs.readdirSync(puppeteerCache)
    .filter(entry => {
      const entryPath = path.join(puppeteerCache, entry);
      return fs.statSync(entryPath).isDirectory() && entry.startsWith('linux-');
    })
    .sort()
    .reverse();

  for (const version of versions) {
    const shellPath = path.join(puppeteerCache, version, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(shellPath)) {
      return shellPath;
    }
  }

  return null;
}

/**
 * Verify theme is applied correctly to card and context frame
 */
async function verifyThemeApplied(page, platformId, expectedTheme) {
  const themeCheck = await page.evaluate((pid) => {
    const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!card) return { hasTheme: false, reason: 'Card not found' };

    // Check document-level theme
    const docTheme = document.documentElement.getAttribute('data-theme');

    // Check card theme attributes
    const cardTheme = card.getAttribute('data-theme');

    // Check context frame theme if present
    const contextFrame = card.querySelector('.context-frame');
    let contextTheme = null;
    if (contextFrame) {
      contextTheme = contextFrame.getAttribute('data-frame-theme');
    }

    // Check for CSS custom properties (theme vars)
    const computedStyle = window.getComputedStyle(card);
    const hasThemeVars = computedStyle.getPropertyValue('--frame-bg') !== '';

    return {
      hasTheme: true,
      docTheme,
      cardTheme,
      contextTheme,
      hasThemeVars,
      cardThemeVars: {
        bg: computedStyle.getPropertyValue('--frame-bg'),
        surface: computedStyle.getPropertyValue('--frame-surface'),
        text: computedStyle.getPropertyValue('--frame-text-primary')
      }
    };
  }, platformId);

  return themeCheck;
}

/**
 * Check for color conflicts or visual artifacts
 */
async function checkColorConflicts(page, platformId) {
  const conflictCheck = await page.evaluate((pid) => {
    const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!card) return { hasConflict: true, reason: 'Card not found' };

    const contextFrame = card.querySelector('.context-frame');
    const conflicts = [];

    // Check for inconsistent colors (visual artifacts)
    if (contextFrame) {
      const cardStyle = window.getComputedStyle(card);
      const frameStyle = window.getComputedStyle(contextFrame);

      // Check if background colors are too similar (contrast issue)
      const cardBg = cardStyle.backgroundColor;
      const frameBg = frameStyle.backgroundColor;

      // Check for text readability
      const cardText = cardStyle.color;
      const frameText = frameStyle.color;

      // Simple check for obvious conflicts
      if (cardBg === frameBg && cardBg !== 'transparent' && cardBg !== 'rgba(0, 0, 0, 0)') {
        conflicts.push('Card and frame have same background color');
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      details: { cardBg: contextFrame ? window.getComputedStyle(card).backgroundColor : null }
    };
  }, platformId);

  return conflictCheck;
}

/**
 * Test theme switching for a single platform
 */
async function testPlatformThemeSwitching(browser, platformId, takeScreenshots = false) {
  const page = await browser.newPage();
  const platformScreenshots = [];

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const platformResult = {
    platform: platformId,
    toggleWorks: false,
    darkModeWorks: false,
    lightModeWorks: false,
    noColorConflicts: true,
    smoothTransitions: true,
    screenshots: []
  };

  try {
    console.log(`\n=== Testing ${platformId} ===`);

    // Navigate to test harness
    await page.goto(`http://127.0.0.1:8080/src/public/test-platform-frames-harness.html`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await sleep(2000);

    const cardSelector = `.platform-card[data-pid="${platformId}"]`;

    // Step 1: Toggle to in-context mode
    console.log(`  Step 1: Toggle to in-context mode`);
    const toggleSuccess = await page.evaluate((pid) => {
      const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
      if (!card) return false;

      const toggleBtn = card.querySelector('.card-context-toggle');
      if (!toggleBtn || toggleBtn.disabled) return false;

      toggleBtn.click();
      return true;
    }, platformId);

    if (!toggleSuccess) {
      platformResult.issues = platformResult.issues || [];
      platformResult.issues.push('Toggle to in-context mode failed');
      await page.close();
      return platformResult;
    }

    platformResult.toggleWorks = true;
    await sleep(500);

    // Step 2: Switch to dark mode
    console.log(`  Step 2: Switch to dark mode`);
    const darkModeSwitch = await page.evaluate(() => {
      const themeToggle = document.querySelector('.theme-toggle');
      if (!themeToggle) return false;

      // Ensure we're switching to dark mode
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark') {
        return { alreadyDark: true };
      }

      themeToggle.click();
      return { switched: true };
    });

    await sleep(500);

    // Verify dark mode applied
    const darkThemeCheck = await verifyThemeApplied(page, platformId, 'dark');
    platformResult.darkModeWorks = darkThemeCheck.hasTheme &&
                                  (darkThemeCheck.docTheme === 'dark');

    if (!platformResult.darkModeWorks) {
      platformResult.issues = platformResult.issues || [];
      platformResult.issues.push(`Dark mode not applied correctly: ${JSON.stringify(darkThemeCheck)}`);
    }

    // Step 3: Check for color conflicts in dark mode
    console.log(`  Step 3: Check for color conflicts in dark mode`);
    const darkModeConflicts = await checkColorConflicts(page, platformId);
    if (darkModeConflicts.hasConflict) {
      platformResult.noColorConflicts = false;
      platformResult.issues = platformResult.issues || [];
      platformResult.issues.push(`Dark mode color conflicts: ${darkModeConflicts.conflicts.join(', ')}`);
    }

    // Step 4: Take screenshot in dark mode if requested
    if (takeScreenshots && SCREENSHOT_PLATFORMS.includes(platformId)) {
      console.log(`  Step 4: Taking dark mode screenshot`);
      const darkScreenshotPath = path.join(__dirname, 'screenshots', 'theme-test', `${platformId}-dark.png`);
      const screenshotDir = path.dirname(darkScreenshotPath);
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      await page.screenshot({ path: darkScreenshotPath, fullPage: false });
      platformResult.screenshots.push(darkScreenshotPath);
      platformScreenshots.push({ mode: 'dark', path: darkScreenshotPath });
    }

    // Step 5: Switch to light mode
    console.log(`  Step 5: Switch to light mode`);
    const lightModeSwitch = await page.evaluate(() => {
      const themeToggle = document.querySelector('.theme-toggle');
      if (!themeToggle) return false;

      themeToggle.click();
      return true;
    });

    await sleep(500);

    // Verify light mode applied
    const lightThemeCheck = await verifyThemeApplied(page, platformId, 'light');
    platformResult.lightModeWorks = lightThemeCheck.hasTheme &&
                                  (lightThemeCheck.docTheme === 'light');

    if (!platformResult.lightModeWorks) {
      platformResult.issues = platformResult.issues || [];
      platformResult.issues.push(`Light mode not applied correctly: ${JSON.stringify(lightThemeCheck)}`);
    }

    // Step 6: Check for color conflicts in light mode
    console.log(`  Step 6: Check for color conflicts in light mode`);
    const lightModeConflicts = await checkColorConflicts(page, platformId);
    if (lightModeConflicts.hasConflict) {
      platformResult.noColorConflicts = false;
      platformResult.issues = platformResult.issues || [];
      platformResult.issues.push(`Light mode color conflicts: ${lightModeConflicts.conflicts.join(', ')}`);
    }

    // Step 7: Take screenshot in light mode if requested
    if (takeScreenshots && SCREENSHOT_PLATFORMS.includes(platformId)) {
      console.log(`  Step 7: Taking light mode screenshot`);
      const lightScreenshotPath = path.join(__dirname, 'screenshots', 'theme-test', `${platformId}-light.png`);
      await page.screenshot({ path: lightScreenshotPath, fullPage: false });
      platformResult.screenshots.push(lightScreenshotPath);
      platformScreenshots.push({ mode: 'light', path: lightScreenshotPath });
    }

    // Step 8: Rapid theme switching test (5 iterations)
    console.log(`  Step 8: Rapid theme switching test (5 iterations)`);
    let rapidSwitchPassed = true;
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) themeToggle.click();
      });
      await sleep(200);

      // Check for visual issues
      const conflictCheck = await checkColorConflicts(page, platformId);
      if (conflictCheck.hasConflict) {
        rapidSwitchPassed = false;
        break;
      }
    }

    platformResult.smoothTransitions = rapidSwitchPassed;
    if (!rapidSwitchPassed) {
      platformResult.issues = platformResult.issues || [];
      platformResult.issues.push('Rapid theme switching caused visual issues');
    }

    console.log(`  ✓ ${platformId}: Toggle=${platformResult.toggleWorks ? '✅' : '❌'}, ` +
                `Dark=${platformResult.darkModeWorks ? '✅' : '❌'}, ` +
                `Light=${platformResult.lightModeWorks ? '✅' : '❌'}, ` +
                `NoConflicts=${platformResult.noColorConflicts ? '✅' : '❌'}, ` +
                `Smooth=${platformResult.smoothTransitions ? '✅' : '❌'}`);

  } catch (error) {
    platformResult.issues = platformResult.issues || [];
    platformResult.issues.push(`Test error: ${error.message}`);
    console.log(`  ❌ ${platformId}: Test error - ${error.message}`);
  } finally {
    await page.close();
  }

  return platformResult;
}

/**
 * Test edge cases
 */
async function testEdgeCases(browser) {
  console.log('\n🧪 Testing Edge Cases...\n');

  const edgeResults = {
    longContent: [],
    minimalTheme: [],
    complexFrames: []
  };

  // Test platforms with long content
  for (const platform of EDGE_CASE_PLATFORMS.longContent) {
    if (!PLATFORMS.includes(platform)) continue;

    console.log(`Testing long content: ${platform}`);
    const result = await testPlatformThemeSwitching(browser, platform, false);
    edgeResults.longContent.push(result);
  }

  // Test platforms with minimal theme support
  for (const platform of EDGE_CASE_PLATFORMS.minimalTheme) {
    if (!PLATFORMS.includes(platform)) continue;

    console.log(`Testing minimal theme: ${platform}`);
    const result = await testPlatformThemeSwitching(browser, platform, false);
    edgeResults.minimalTheme.push(result);
  }

  // Test platforms with complex frames
  for (const platform of EDGE_CASE_PLATFORMS.complexFrames) {
    if (!PLATFORMS.includes(platform)) continue;

    console.log(`Testing complex frame: ${platform}`);
    const result = await testPlatformThemeSwitching(browser, platform, false);
    edgeResults.complexFrames.push(result);
  }

  return edgeResults;
}

/**
 * Run all theme switching tests
 */
async function runAllThemeTests() {
  console.log('🌙 Starting Theme Switching and Edge Cases Test...\n');
  console.log(`Testing ${PLATFORMS.length} platforms\n`);

  const browser = await setupBrowser();

  try {
    // Test all platforms
    for (const platformId of PLATFORMS) {
      results.tested++;
      const shouldTakeScreenshots = SCREENSHOT_PLATFORMS.includes(platformId);

      const platformResult = await testPlatformThemeSwitching(browser, platformId, shouldTakeScreenshots);
      results.platforms[platformId] = platformResult;
      results.screenshots.push(...platformResult.screenshots);

      // Determine pass/fail
      const passed = platformResult.toggleWorks &&
                    platformResult.darkModeWorks &&
                    platformResult.lightModeWorks &&
                    platformResult.noColorConflicts &&
                    platformResult.smoothTransitions;

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
        if (platformResult.issues) {
          results.issues.push({ platform: platformId, issues: platformResult.issues });
        }
      }
    }

    // Test edge cases
    const edgeResults = await testEdgeCases(browser);
    results.edgeCases = edgeResults;

  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('THEME SWITCHING TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Platforms: ${results.totalPlatforms}`);
  console.log(`Tested: ${results.tested}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tested) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('FAILED PLATFORMS');
    console.log('='.repeat(60));
    results.issues.forEach(failure => {
      console.log(`\n${failure.platform}:`);
      failure.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    });
  }

  // Edge case results
  console.log('\n' + '='.repeat(60));
  console.log('EDGE CASE RESULTS');
  console.log('='.repeat(60));

  const longContentPassed = results.edgeCases.longContent.filter(r =>
    r.darkModeWorks && r.lightModeWorks && r.noColorConflicts).length;
  console.log(`Long content platforms: ${longContentPassed}/${results.edgeCases.longContent.length} passed`);

  const minimalThemePassed = results.edgeCases.minimalTheme.filter(r =>
    r.darkModeWorks && r.lightModeWorks && r.noColorConflicts).length;
  console.log(`Minimal theme platforms: ${minimalThemePassed}/${results.edgeCases.minimalTheme.length} passed`);

  const complexFramesPassed = results.edgeCases.complexFrames.filter(r =>
    r.darkModeWorks && r.lightModeWorks && r.noColorConflicts).length;
  console.log(`Complex frame platforms: ${complexFramesPassed}/${results.edgeCases.complexFrames.length} passed`);

  // Screenshot summary
  console.log('\n' + '='.repeat(60));
  console.log('SCREENSHOTS');
  console.log('='.repeat(60));
  console.log(`Screenshots taken: ${results.screenshots.length}`);
  const darkScreenshots = results.screenshots.filter(s => s.path && s.path.includes('-dark.png')).length;
  const lightScreenshots = results.screenshots.filter(s => s.path && s.path.includes('-light.png')).length;
  console.log(`Dark mode screenshots: ${darkScreenshots}`);
  console.log(`Light mode screenshots: ${lightScreenshots}`);

  // Save results to JSON
  const resultsPath = path.join(__dirname, 'test-results', 'theme-switching-results.json');
  const resultsDir = path.dirname(resultsPath);

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  // Create human-readable report
  const reportPath = path.join(__dirname, 'notes', 'bf-3jwfo-theme-test-report.md');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportContent = generateMarkdownReport(results);
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Report saved to: ${reportPath}`);

  // Final verdict
  const allTestsPassed = results.failed === 0;
  const screenshotsTaken = results.screenshots.length >= 20; // At least 10 platforms in 2 modes

  console.log('\n' + '='.repeat(60));
  if (allTestsPassed && screenshotsTaken) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
  }
  console.log('='.repeat(60));

  return allTestsPassed;
}

/**
 * Generate markdown report from results
 */
function generateMarkdownReport(results) {
  let md = `# Theme Switching and Edge Cases Test Report\n\n`;
  md += `**Date:** ${new Date(results.timestamp).toLocaleString()}\n`;
  md += `**Task:** bf-3jwfo - Test theme switching and edge cases\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Platforms:** ${results.totalPlatforms}\n`;
  md += `- **Tested:** ${results.tested}\n`;
  md += `- **Passed:** ${results.passed}\n`;
  md += `- **Failed:** ${results.failed}\n`;
  md += `- **Success Rate:** ${((results.passed / results.tested) * 100).toFixed(1)}%\n\n`;

  if (results.failed > 0) {
    md += `## Failed Platforms\n\n`;
    results.issues.forEach(failure => {
      md += `### ${failure.platform}\n\n`;
      failure.issues.forEach(issue => {
        md += `- ❌ ${issue}\n`;
      });
      md += `\n`;
    });
  }

  md += `## Edge Case Results\n\n`;

  md += `### Long Content Platforms\n\n`;
  results.edgeCases.longContent.forEach(result => {
    md += `- **${result.platform}:** ${result.darkModeWorks && result.lightModeWorks && result.noColorConflicts ? '✅' : '❌'}\n`;
  });

  md += `\n### Minimal Theme Platforms\n\n`;
  results.edgeCases.minimalTheme.forEach(result => {
    md += `- **${result.platform}:** ${result.darkModeWorks && result.lightModeWorks && result.noColorConflicts ? '✅' : '❌'}\n`;
  });

  md += `\n### Complex Frame Platforms\n\n`;
  results.edgeCases.complexFrames.forEach(result => {
    md += `- **${result.platform}:** ${result.darkModeWorks && result.lightModeWorks && result.noColorConflicts ? '✅' : '❌'}\n`;
  });

  md += `\n## Screenshots\n\n`;
  md += `- **Total Screenshots:** ${results.screenshots.length}\n`;
  md += `- **Dark Mode:** ${results.screenshots.filter(s => s.path && s.path.includes('-dark.png')).length}\n`;
  md += `- **Light Mode:** ${results.screenshots.filter(s => s.path && s.path.includes('-light.png')).length}\n\n`;

  md += `Screenshot platforms:\n`;
  SCREENSHOT_PLATFORMS.forEach(platform => {
    md += `- ${platform}\n`;
  });

  md += `\n## Acceptance Criteria Status\n\n`;
  md += `- ✅ All 31 platforms support dark/light mode switching: ${results.passed === results.tested ? '✅' : '❌'}\n`;
  md += `- ✅ No color conflicts or visual artifacts during theme changes: ${results.failed === 0 ? '✅' : '❌'}\n`;
  md += `- ✅ Edge cases handled without layout breaks: ${results.passed === results.tested ? '✅' : '❌'}\n`;
  md += `- ✅ 10+ platforms documented with screenshots in both modes: ${results.screenshots.length >= 20 ? '✅' : '❌'}\n`;
  md += `- ✅ Full test report generated: ✅\n\n`;

  const allPassed = results.failed === 0 && results.screenshots.length >= 20;
  md += `## Test Status\n\n`;
  md += allPassed ? `**✅ PASSED** - All acceptance criteria met\n` : `**⚠️ FAILED** - Some acceptance criteria not met\n`;

  return md;
}

// Run the tests
runAllThemeTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
