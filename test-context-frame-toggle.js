#!/usr/bin/env node

/**
 * Context Frame Toggle Functionality Test
 *
 * Comprehensive test for verifying context frame toggle functionality across all platforms.
 *
 * Test Coverage:
 * - Toggle from 'card only' to 'in context' mode
 * - Verify context frame appears and contains expected content
 * - Toggle back to 'card only' mode
 * - Detect visual glitches during transitions
 * - Rapid toggle switching stress test
 * - Platform-specific context frame validation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 31 platforms from card-only verification
const PLATFORMS = [
  // Social Media (7)
  'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok',
  // Messaging (10)
  'slack', 'discord', 'imessage', 'whatsapp', 'telegram', 'signal', 'microsoft-teams',
  'google-chat', 'zoom-chat', 'line', 'kakao',
  // Content Platforms (8)
  'pinterest', 'bluesky', 'mastodon', 'threads', 'tumblr', 'reddit', 'medium', 'devto',
  // Developer Tools (5)
  'github', 'gitlab', 'stackoverflow', 'hackernews', 'producthunt',
  // Email (1)
  'gmail'
];

const TEST_URL = 'https://example.com/test-page';

// Test results structure
const results = {
  timestamp: new Date().toISOString(),
  totalPlatforms: PLATFORMS.length,
  tested: 0,
  passed: 0,
  failed: 0,
  failures: [],
  screenshots: {
    cardOnly: [],
    inContext: [],
    transitions: []
  },
  rapidToggleResults: [],
  glitchDetection: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupBrowser() {
  // Try chrome-headless-shell first, fallback to system chromium
  let browser;
  try {
    // Find chrome-headless-shell dynamically
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

/**
 * Find chrome-headless-shell executable dynamically
 */
function findChromeHeadlessShell() {
  const puppeteerCache = '/home/coding/.cache/puppeteer/chrome-headless-shell';
  if (!fs.existsSync(puppeteerCache)) {
    return null;
  }

  // Find all version directories
  const versions = fs.readdirSync(puppeteerCache)
    .filter(entry => {
      const entryPath = path.join(puppeteerCache, entry);
      return fs.statSync(entryPath).isDirectory() && entry.startsWith('linux-');
    })
    .sort()
    .reverse(); // Get latest version first

  for (const version of versions) {
    const shellPath = path.join(puppeteerCache, version, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(shellPath)) {
      return shellPath;
    }
  }

  return null;
}

/**
 * Check for visual glitches by comparing layout stability
 */
async function detectGlitches(page, selector) {
  const glitchInfo = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { hasGlitch: true, reason: 'Element not found' };

    const rect = el.getBoundingClientRect();

    // Check for reasonable dimensions
    if (rect.width < 50 || rect.height < 50) {
      return { hasGlitch: true, reason: 'Element too small', width: rect.width, height: rect.height };
    }

    if (rect.width > 2000 || rect.height > 3000) {
      return { hasGlitch: true, reason: 'Element too large', width: rect.width, height: rect.height };
    }

    // Check for negative or NaN values
    if (rect.x < 0 || rect.y < 0 || isNaN(rect.width) || isNaN(rect.height)) {
      return { hasGlitch: true, reason: 'Invalid geometry', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }

    // Check if element is in viewport
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );

    if (!isInViewport) {
      return { hasGlitch: true, reason: 'Element outside viewport', top: rect.top, left: rect.left };
    }

    return { hasGlitch: false, width: rect.width, height: rect.height };
  }, selector);

  return glitchInfo;
}

/**
 * Verify context frame content exists
 */
async function verifyContextFrameContent(page, platformId) {
  const contentCheck = await page.evaluate((pid) => {
    const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!card) return { hasContent: false, reason: 'Card not found' };

    // Check for context frame element
    const contextFrame = card.querySelector('.context-frame');
    if (!contextFrame) return { hasContent: false, reason: 'Context frame not found' };

    // Check for platform-specific context class
    const platformContext = card.querySelector(`.${pid}-context`);
    if (!platformContext) return { hasContent: false, reason: 'Platform context class not found' };

    // Check for chrome/content elements
    const hasChrome = contextFrame.querySelector('[class*="chrome"], [class*="header"], [class*="container"]') !== null;
    const hasLinkPreview = contextFrame.querySelector('[class*="link"], [class*="preview"], [class*="card"]') !== null;

    return {
      hasContent: true,
      hasChrome,
      hasLinkPreview,
      innerHTML: contextFrame.innerHTML.substring(0, 200) // Sample for debugging
    };
  }, platformId);

  return contentCheck;
}

/**
 * Test rapid toggle switching for a platform
 */
async function testRapidToggleSwitching(page, platformId, iterations = 10) {
  const toggleResults = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    // Perform toggle
    const toggleSuccess = await page.evaluate((pid) => {
      const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
      if (!card) return false;

      const toggleBtn = card.querySelector('.card-context-toggle');
      if (!toggleBtn || toggleBtn.disabled) return false;

      toggleBtn.click();
      return true;
    }, platformId);

    const duration = Date.now() - startTime;

    // Wait for render
    await sleep(100);

    // Check for glitches
    const cardSelector = `.platform-card[data-pid="${platformId}"]`;
    const glitchCheck = await detectGlitches(page, cardSelector);

    toggleResults.push({
      iteration: i + 1,
      toggleSuccess,
      duration,
      hasGlitch: glitchCheck.hasGlitch,
      glitchReason: glitchCheck.reason
    });

    // Fail fast if toggle stops working
    if (!toggleSuccess) {
      break;
    }
  }

  return toggleResults;
}

/**
 * Test single platform context frame toggle
 */
async function testPlatformToggle(browser, platformId) {
  const page = await browser.newPage();

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const platformResult = {
    platform: platformId,
    toggleWorking: false,
    contextFrameRenders: false,
    contextFrameHasContent: false,
    cardOnlyRestores: false,
    noVisualGlitches: true,
    rapidTogglePassed: false,
    issues: []
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

    // Step 1: Verify initial card-only state
    console.log(`  Step 1: Verify card-only state`);
    const initialCard = await page.$(cardSelector);
    if (!initialCard) {
      platformResult.issues.push('Platform card not found');
      await page.close();
      return platformResult;
    }

    // Step 2: Toggle to in-context mode
    console.log(`  Step 2: Toggle to in-context mode`);
    const toggleSuccess = await page.evaluate((pid) => {
      const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
      if (!card) return false;

      const toggleBtn = card.querySelector('.card-context-toggle');
      if (!toggleBtn || toggleBtn.disabled) {
        return { success: false, reason: 'Toggle button not found or disabled' };
      }

      // Check initial state
      const initialState = toggleBtn.querySelector('.context-label').textContent;

      toggleBtn.click();

      return { success: true, initialState };
    }, platformId);

    if (!toggleSuccess.success) {
      platformResult.issues.push(`Toggle failed: ${toggleSuccess.reason || 'Unknown error'}`);
      await page.close();
      return platformResult;
    }

    platformResult.toggleWorking = true;
    await sleep(500); // Wait for render

    // Step 3: Verify context frame appears
    console.log(`  Step 3: Verify context frame appears`);
    const contextCheck = await verifyContextFrameContent(page, platformId);
    platformResult.contextFrameRenders = contextCheck.hasContent;
    platformResult.contextFrameHasContent = contextCheck.hasContent;

    if (!contextCheck.hasContent) {
      platformResult.issues.push(`Context frame missing: ${contextCheck.reason}`);
    } else if (!contextCheck.hasChrome && !contextCheck.hasLinkPreview) {
      platformResult.issues.push('Context frame appears empty (no chrome or link preview)');
    }

    // Step 4: Check for visual glitches
    console.log(`  Step 4: Check for visual glitches`);
    const glitchCheck = await detectGlitches(page, cardSelector);
    if (glitchCheck.hasGlitch) {
      platformResult.noVisualGlitches = false;
      platformResult.issues.push(`Visual glitch detected: ${glitchCheck.reason}`);
      results.glitchDetection.push({
        platform: platformId,
        reason: glitchCheck.reason,
        details: glitchCheck
      });
    }

    // Step 5: Toggle back to card-only mode
    console.log(`  Step 5: Toggle back to card-only mode`);
    const toggleBack = await page.evaluate((pid) => {
      const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
      if (!card) return false;

      const toggleBtn = card.querySelector('.card-context-toggle');
      if (!toggleBtn) return false;

      toggleBtn.click();
      return true;
    }, platformId);

    platformResult.cardOnlyRestores = toggleBack;
    await sleep(500);

    // Step 6: Verify card-only restoration
    console.log(`  Step 6: Verify card-only restoration`);
    const cardOnlyCheck = await page.evaluate((sel) => {
      const card = document.querySelector(sel);
      if (!card) return false;

      // Should not have context-frame class
      const hasContextFrame = card.querySelector('.context-frame') !== null;
      return !hasContextFrame; // card-only means no context frame
    }, cardSelector);

    if (!cardOnlyCheck) {
      platformResult.issues.push('Card-only mode not properly restored');
    }

    // Step 7: Rapid toggle switching test
    console.log(`  Step 7: Rapid toggle switching test (10 iterations)`);
    const rapidResults = await testRapidToggleSwitching(page, platformId, 10);
    results.rapidToggleResults.push({
      platform: platformId,
      iterations: rapidResults
    });

    // Analyze rapid toggle results
    const successfulToggles = rapidResults.filter(r => r.toggleSuccess && !r.hasGlitch).length;
    const rapidToggleRate = successfulToggles / rapidResults.length;
    platformResult.rapidTogglePassed = rapidToggleRate >= 0.8; // 80% success rate required

    if (rapidToggleRate < 0.8) {
      platformResult.issues.push(
        `Rapid toggle test failed: ${successfulToggles}/${rapidResults.length} successful toggles`
      );
    }

    console.log(`  ✓ ${platformId}: Toggle=${platformResult.toggleWorking ? '✅' : '❌'}, ` +
                `Context=${platformResult.contextFrameRenders ? '✅' : '❌'}, ` +
                `Glitches=${platformResult.noVisualGlitches ? '✅' : '❌'}, ` +
                `Rapid=${platformResult.rapidTogglePassed ? '✅' : '❌'}`);

  } catch (error) {
    platformResult.issues.push(`Test error: ${error.message}`);
    console.log(`  ❌ ${platformId}: Test error - ${error.message}`);
  } finally {
    await page.close();
  }

  return platformResult;
}

/**
 * Run all toggle tests
 */
async function runAllToggleTests() {
  console.log('🧪 Starting Context Frame Toggle Functionality Test...\n');
  console.log(`Testing ${PLATFORMS.length} platforms\n`);

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots', 'context-toggle-test');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await setupBrowser();

  try {
    for (const platformId of PLATFORMS) {
      results.tested++;

      const platformResult = await testPlatformToggle(browser, platformId);

      // Determine pass/fail
      const passed = platformResult.toggleWorking &&
                    platformResult.contextFrameRenders &&
                    platformResult.contextFrameHasContent &&
                    platformResult.cardOnlyRestores &&
                    platformResult.noVisualGlitches &&
                    platformResult.rapidTogglePassed;

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
        results.failures.push(platformResult);
      }
    }
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Platforms: ${results.totalPlatforms}`);
  console.log(`Tested: ${results.tested}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tested) * 100).toFixed(1)}%`);

  if (results.failures.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('FAILED PLATFORMS');
    console.log('='.repeat(60));
    results.failures.forEach(failure => {
      console.log(`\n${failure.platform}:`);
      failure.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    });
  }

  // Check for glitches across all platforms
  if (results.glitchDetection.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('VISUAL GLITCHES DETECTED');
    console.log('='.repeat(60));
    results.glitchDetection.forEach(glitch => {
      console.log(`  ${glitch.platform}: ${glitch.reason}`);
    });
  }

  // Rapid toggle summary
  const rapidToggleStats = results.rapidToggleResults.map(r => ({
    platform: r.platform,
    successRate: r.iterations.filter(i => i.toggleSuccess && !i.hasGlitch).length / r.iterations.length
  }));

  const avgRapidToggleSuccess = rapidToggleStats.reduce((sum, s) => sum + s.successRate, 0) / rapidToggleStats.length;
  console.log('\n' + '='.repeat(60));
  console.log('RAPID TOGGLE STATISTICS');
  console.log('='.repeat(60));
  console.log(`Average success rate: ${(avgRapidToggleSuccess * 100).toFixed(1)}%`);

  const worstPlatforms = rapidToggleStats
    .filter(s => s.successRate < 0.8)
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 5);

  if (worstPlatforms.length > 0) {
    console.log('\nPlatforms with lowest rapid toggle success:');
    worstPlatforms.forEach(p => {
      console.log(`  ${p.platform}: ${(p.successRate * 100).toFixed(1)}%`);
    });
  }

  // Save results to JSON
  const resultsPath = path.join(__dirname, 'test-results', 'context-frame-toggle-results.json');
  const resultsDir = path.dirname(resultsPath);

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  // Create human-readable report
  const reportPath = path.join(__dirname, 'notes', 'bf-nm996-toggle-test-report.md');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportContent = generateMarkdownReport(results);
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Report saved to: ${reportPath}`);

  // Final verdict
  const allTestsPassed = results.failed === 0 && results.glitchDetection.length === 0;

  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
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
  let md = `# Context Frame Toggle Test Report\n\n`;
  md += `**Date:** ${new Date(results.timestamp).toLocaleString()}\n`;
  md += `**Task:** bf-nm996 - Test context frame and toggle functionality\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Platforms:** ${results.totalPlatforms}\n`;
  md += `- **Tested:** ${results.tested}\n`;
  md += `- **Passed:** ${results.passed}\n`;
  md += `- **Failed:** ${results.failed}\n`;
  md += `- **Success Rate:** ${((results.passed / results.tested) * 100).toFixed(1)}%\n\n`;

  if (results.failures.length > 0) {
    md += `## Failed Platforms\n\n`;
    results.failures.forEach(failure => {
      md += `### ${failure.platform}\n\n`;
      failure.issues.forEach(issue => {
        md += `- ❌ ${issue}\n`;
      });
      md += `\n`;
    });
  }

  if (results.glitchDetection.length > 0) {
    md += `## Visual Glitches Detected\n\n`;
    results.glitchDetection.forEach(glitch => {
      md += `- **${glitch.platform}:** ${glitch.reason}\n`;
    });
    md += `\n`;
  }

  md += `## Rapid Toggle Test Results\n\n`;
  md += `Average success rate: ${(results.rapidToggleResults.reduce((sum, r) =>
    sum + (r.iterations.filter(i => i.toggleSuccess && !i.hasGlitch).length / r.iterations.length), 0
  ) / results.rapidToggleResults.length * 100).toFixed(1)}%\n\n`;

  const problematicPlatforms = results.rapidToggleResults
    .filter(r => {
      const successRate = r.iterations.filter(i => i.toggleSuccess && !i.hasGlitch).length / r.iterations.length;
      return successRate < 0.8;
    })
    .map(r => ({
      platform: r.platform,
      successRate: r.iterations.filter(i => i.toggleSuccess && !i.hasGlitch).length / r.iterations.length
    }))
    .sort((a, b) => a.successRate - b.successRate);

  if (problematicPlatforms.length > 0) {
    md += `### Platforms with Low Toggle Success (<80%)\n\n`;
    problematicPlatforms.forEach(p => {
      md += `- **${p.platform}:** ${(p.successRate * 100).toFixed(1)}%\n`;
    });
    md += `\n`;
  }

  md += `## Acceptance Criteria Status\n\n`;
  md += `- ✅ All 31 platforms successfully toggle between modes: ${results.passed === results.tested ? '✅' : '❌'}\n`;
  md += `- ✅ Context frames render correctly when shown: ${results.passed === results.tested ? '✅' : '❌'}\n`;
  md += `- ✅ No rendering glitches or flicker during transitions: ${results.glitchDetection.length === 0 ? '✅' : '❌'}\n`;
  md += `- ✅ Rapid toggle switching works smoothly: ${results.failed === 0 ? '✅' : '❌'}\n`;
  md += `- ✅ Any missing/broken context frames are documented: ${results.failures.length > 0 ? '✅' : 'ℹ️'}\n\n`;

  const allPassed = results.failed === 0 && results.glitchDetection.length === 0;
  md += `## Test Status\n\n`;
  md += allPassed ? `**✅ PASSED** - All acceptance criteria met\n` : `**⚠️ FAILED** - Some acceptance criteria not met\n`;

  return md;
}

// Run the tests
runAllToggleTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
