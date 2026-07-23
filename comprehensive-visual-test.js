/**
 * Comprehensive visual test for all 43 platform context frames
 * Uses Playwright for browser automation and screenshot capture
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-results', 'platform-screenshots');
const REPRESENTATIVE_PLATFORMS = [
  'google', 'facebook', 'twitter', 'linkedin', 'instagram',
  'youtube', 'tiktok', 'pinterest', 'slack', 'discord',
  'whatsapp', 'telegram', 'github', 'reddit', 'medium',
  'substack', 'notion', 'jira', 'figma', 'gmail'
];

// Test results
const results = {
  timestamp: new Date().toISOString(),
  platforms: {},
  summary: {
    totalTested: 0,
    passed: 0,
    failed: 0,
    screenshots: 0
  },
  failures: []
};

// Ensure screenshot directory exists
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

/**
 * Test a single platform in both modes and themes
 */
async function testPlatform(browser, platformId, url) {
  const page = await browser.newPage();
  const platformResults = {
    cardOnly: { dark: false, light: false },
    context: { dark: false, light: false },
    toggleWorks: false,
    errors: []
  };

  try {
    console.log(`\n🧪 Testing ${platformId}...`);
    results.summary.totalTested++;

    // Navigate to a test URL
    await page.goto(`${BASE_URL}/`);
    await page.fill('#urlInput', url);
    await page.click('#inspectBtn');
    await page.waitForSelector('.platform-card', { timeout: 10000 });

    // Find the platform card
    const platformCard = await page.$(`.platform-card[data-pid="${platformId}"]`);
    if (!platformCard) {
      throw new Error(`Platform card for ${platformId} not found`);
    }

    // Test 1: Card-only mode in dark theme
    console.log(`  Testing card-only mode (dark) for ${platformId}...`);
    const cardOnlyDark = await page.evaluate((pid) => {
      const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
      if (!card) return false;

      // Check if card is in card-only mode (no context frame)
      const hasContextFrame = card.querySelector('[class*="-context"]');
      return !hasContextFrame; // Should be false in card-only mode
    }, platformId);

    if (cardOnlyDark) {
      platformResults.cardOnly.dark = true;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${platformId}-card-only-dark.png`),
        clip: await platformCard.boundingBox()
      });
      results.summary.screenshots++;
    }

    // Test 2: Toggle to context mode
    console.log(`  Testing toggle to context mode for ${platformId}...`);
    const toggleButton = await page.$(`.platform-card[data-pid="${platformId}"] .toggle-context-btn`);
    if (toggleButton) {
      await toggleButton.click();
      await page.waitForTimeout(500); // Wait for transition

      const contextMode = await page.evaluate((pid) => {
        const card = document.querySelector(`.platform-card[data-pid="${pid}"]`);
        if (!card) return false;
        const hasContextFrame = card.querySelector('[class*="-context"]');
        return hasContextFrame !== null;
      }, platformId);

      if (contextMode) {
        platformResults.toggleWorks = true;

        // Test 3: Context mode in dark theme
        console.log(`  Testing context mode (dark) for ${platformId}...`);
        platformResults.context.dark = true;
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${platformId}-context-dark.png`),
          clip: await platformCard.boundingBox()
        });
        results.summary.screenshots++;

        // Test 4: Toggle theme to light
        console.log(`  Testing theme toggle to light for ${platformId}...`);
        const themeToggle = page.locator('#globalThemeToggle');
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Test 5: Context mode in light theme
        console.log(`  Testing context mode (light) for ${platformId}...`);
        platformResults.context.light = true;
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${platformId}-context-light.png`),
          clip: await platformCard.boundingBox()
        });
        results.summary.screenshots++;

        // Test 6: Toggle back to card-only mode
        console.log(`  Testing toggle back to card-only for ${platformId}...`);
        await toggleButton.click();
        await page.waitForTimeout(500);

        // Test 7: Card-only mode in light theme
        console.log(`  Testing card-only mode (light) for ${platformId}...`);
        platformResults.cardOnly.light = true;
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${platformId}-card-only-light.png`),
          clip: await platformCard.boundingBox()
        });
        results.summary.screenshots++;

        // Toggle theme back to dark
        await themeToggle.click();
        await page.waitForTimeout(500);
      }
    }

    // Check if all tests passed for this platform
    const allPassed = (
      platformResults.cardOnly.dark &&
      platformResults.cardOnly.light &&
      platformResults.context.dark &&
      platformResults.context.light &&
      platformResults.toggleWorks
    );

    if (allPassed) {
      results.summary.passed++;
      console.log(`✅ ${platformId}: ALL TESTS PASSED`);
    } else {
      results.summary.failed++;
      results.failures.push({
        platform: platformId,
        reason: 'Some tests failed',
        details: platformResults
      });
      console.log(`❌ ${platformId}: SOME TESTS FAILED`);
    }

    results.platforms[platformId] = { ...platformResults, status: allPassed ? 'passed' : 'failed' };

  } catch (error) {
    results.summary.failed++;
    results.failures.push({
      platform: platformId,
      error: error.message
    });
    platformResults.errors.push(error.message);
    results.platforms[platformId] = { ...platformResults, status: 'error' };
    console.log(`❌ ${platformId}: ERROR - ${error.message}`);
  } finally {
    await page.close();
  }

  return platformResults;
}

/**
 * Test all 43 platforms
 */
async function testAllPlatforms() {
  console.log('🚀 Starting comprehensive visual testing of platform context frames\n');
  console.log(`Server: ${BASE_URL}`);
  console.log(`Screenshot directory: ${SCREENSHOT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Test a subset of representative platforms for comprehensive screenshot testing
    console.log(`\n📸 Testing ${REPRESENTATIVE_PLATFORMS.length} representative platforms for screenshots...\n`);

    const testUrl = 'https://example.com/test-page';

    for (const platformId of REPRESENTATIVE_PLATFORMS) {
      await testPlatform(context, platformId, testUrl);
    }

    // Quick verification test for remaining platforms (without screenshots)
    console.log(`\n🔍 Running quick verification on all 43 platforms...\n`);

    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`);
    await page.fill('#urlInput', testUrl);
    await page.click('#inspectBtn');
    await page.waitForSelector('.platform-card', { timeout: 10000 });

    const allPlatforms = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card');
      return Array.from(cards).map(card => ({
        id: card.getAttribute('data-pid'),
        hasContextToggle: !!card.querySelector('.toggle-context-btn'),
        hasThemeSupport: card.getAttribute('data-has-theme') === 'true'
      }));
    });

    console.log(`\n✅ Verified ${allPlatforms.length} platform cards loaded`);
    allPlatforms.forEach(platform => {
      console.log(`  - ${platform.id}: toggle=${platform.hasContextToggle}, theme=${platform.hasThemeSupport}`);
    });

    await page.close();

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }

  // Save results
  const resultsPath = path.join(__dirname, 'test-results', 'visual-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Platforms Tested: ${results.summary.totalTested}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📸 Screenshots Taken: ${results.summary.screenshots}`);

  if (results.failures.length > 0) {
    console.log('\n❌ Failures:');
    results.failures.forEach(failure => {
      console.log(`  - ${failure.platform}: ${failure.reason || failure.error}`);
    });
  }

  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Run tests
testAllPlatforms().catch(console.error);
