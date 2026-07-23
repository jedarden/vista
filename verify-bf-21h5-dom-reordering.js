/**
 * Comprehensive DOM Reordering Verification for BF-21h5
 *
 * This script tests that platform cards reorder correctly when preferences change.
 * It uses Playwright to control the browser, change preferences, and verify DOM order.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configurations matching the test HTML file
const TEST_CONFIGS = [
  {
    name: 'Article Page Type',
    url: 'https://blog.example.com/2024/07/my-article',
    pageType: 'article',
    expectedOrder: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon'],
    description: 'Blog article should prioritize Twitter, Facebook, LinkedIn, Reddit',
    preferredPlatforms: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon']
  },
  {
    name: 'Product Page Type',
    url: 'https://shop.example.com/products/awesome-product',
    pageType: 'product',
    expectedOrder: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin'],
    description: 'E-commerce product should prioritize Pinterest, Facebook, Instagram, Twitter',
    preferredPlatforms: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin']
  },
  {
    name: 'General Website',
    url: 'https://example.com',
    pageType: 'website',
    expectedOrder: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord'],
    description: 'Standard website should prioritize Google, Facebook, Twitter, LinkedIn',
    preferredPlatforms: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']
  }
];

/**
 * Extract current platform order from DOM
 */
async function getPlatformOrder(page) {
  try {
    const platforms = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card');
      return Array.from(cards).map(card => {
        // Try multiple selectors to get platform name
        const platformName = card.dataset.platform ||
                             card.querySelector('.platform-name')?.textContent?.trim() ||
                             card.querySelector('[data-platform]')?.getAttribute('data-platform') ||
                             card.className.match(/platform-(\w+)/)?.[1] ||
                             '';
        return platformName.toLowerCase();
      }).filter(p => p); // Remove empty entries
    });

    return platforms;
  } catch (error) {
    console.error(`Error extracting platform order: ${error.message}`);
    return [];
  }
}

/**
 * Set platform preferences and trigger reordering
 */
async function setPreferencesAndReorder(page, platformNames) {
  try {
    console.log(`  Setting preferences: ${platformNames.join(', ')}`);

    const result = await page.evaluate((platforms) => {
      try {
        // Clear existing favorites
        if (window.platformPrefs && window.platformPrefs.favorites) {
          window.platformPrefs.favorites.clear();
        }

        // Add new platforms to favorites
        platforms.forEach(pid => {
          if (window.platformPrefs && window.platformPrefs.favorites) {
            window.platformPrefs.favorites.add(pid);
          }
        });

        // Save to localStorage
        const prefs = {
          favorites: Array.from(window.platformPrefs?.favorites || []),
          hidden: [],
          columnCount: 3,
          smartOrdering: true,
          cardOrder: {}
        };
        localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));

        // Trigger reordering if available
        if (typeof window.applySmartOrdering === 'function') {
          window.applySmartOrdering();
        }

        return { success: true, favorites: prefs.favorites };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, platformNames);

    if (!result.success) {
      console.error(`  Failed to set preferences: ${result.error}`);
      return false;
    }

    console.log(`  Preferences set successfully: ${result.favorites.join(', ')}`);
    return true;

  } catch (error) {
    console.error(`Error in setPreferencesAndReorder: ${error.message}`);
    return false;
  }
}

/**
 * Wait for DOM to stabilize after reordering
 */
async function waitForDOMStable(page, maxWait = 5000) {
  const startTime = Date.now();
  let lastState = '';
  let stableCount = 0;

  while (Date.now() - startTime < maxWait) {
    try {
      const currentState = await page.evaluate(() => {
        const cards = document.querySelectorAll('.platform-card');
        const platforms = Array.from(cards).map(card =>
          card.dataset.platform || ''
        ).join(',');
        return `${cards.length}:${platforms}`;
      });

      if (currentState === lastState) {
        stableCount++;
        if (stableCount >= 10) { // 10 consecutive checks with no change
          return true;
        }
      } else {
        stableCount = 0;
        lastState = currentState;
      }

      await page.waitForTimeout(100);
    } catch (error) {
      console.error(`Error checking DOM stability: ${error.message}`);
      return false;
    }
  }

  return false;
}

/**
 * Compare expected vs actual platform order
 */
function compareOrders(expected, actual) {
  const limit = Math.min(expected.length, actual.length);
  const results = [];

  for (let i = 0; i < limit; i++) {
    results.push({
      position: i + 1,
      expected: expected[i],
      actual: actual[i],
      match: expected[i] === actual[i]
    });
  }

  // Add any extra actual platforms
  for (let i = limit; i < actual.length; i++) {
    results.push({
      position: i + 1,
      expected: null,
      actual: actual[i],
      match: false
    });
  }

  const matches = results.filter(r => r.match).length;
  const total = expected.length;
  const passRate = (matches / total) * 100;

  return {
    results,
    matches,
    total,
    passRate,
    passed: matches === total
  };
}

/**
 * Run a single test configuration
 */
async function runTest(page, config) {
  console.log(`\n📋 Testing: ${config.name}`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Expected order: ${config.expectedOrder.join(', ')}`);

  try {
    // Navigate to VISTA
    console.log(`  Navigating to VISTA...`);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Enter the test URL
    console.log(`  Entering test URL...`);
    const urlInput = await page.$('input[type="url"], input[name="url"], #url-input');
    if (urlInput) {
      await urlInput.fill(config.url);
      await page.waitForTimeout(500);
    } else {
      console.error(`  Could not find URL input field`);
      return { success: false, error: 'URL input not found' };
    }

    // Click inspect button
    console.log(`  Clicking inspect button...`);
    const inspectButton = await page.$('button[type="submit"], button:has-text("Inspect"), button:has-text("Analyze")');
    if (inspectButton) {
      await inspectButton.click();
      console.log(`  Waiting for cards to load...`);
      await page.waitForTimeout(3000);
    } else {
      console.error(`  Could not find inspect button`);
      return { success: false, error: 'Inspect button not found' };
    }

    // Wait for platform cards to appear
    console.log(`  Waiting for platform cards...`);
    await page.waitForSelector('.platform-card', { timeout: 10000 }).catch(() => {
      console.log(`  No platform cards found within timeout`);
    });

    // Set platform preferences
    console.log(`  Setting platform preferences...`);
    const prefSuccess = await setPreferencesAndReorder(page, config.preferredPlatforms);
    if (!prefSuccess) {
      console.log(`  ⚠️ Could not set preferences, continuing with current order`);
    }

    // Wait for DOM to stabilize
    console.log(`  Waiting for DOM to stabilize...`);
    await waitForDOMStable(page);
    await page.waitForTimeout(1000);

    // Get actual platform order
    console.log(`  Extracting platform order from DOM...`);
    const actualOrder = await getPlatformOrder(page);
    console.log(`  Actual order: ${actualOrder.slice(0, config.expectedOrder.length).join(', ')}`);

    // Compare orders
    const comparison = compareOrders(config.expectedOrder, actualOrder);

    console.log(`  ${comparison.passed ? '✅ PASS' : '❌ FAIL'} - ${comparison.matches}/${comparison.total} platforms match`);

    return {
      success: true,
      config: config.name,
      url: config.url,
      expectedOrder: config.expectedOrder,
      actualOrder: actualOrder.slice(0, config.expectedOrder.length),
      comparison,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`  ❌ Test failed: ${error.message}`);
    return {
      success: false,
      config: config.name,
      url: config.url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate test report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success && r.comparison?.passed).length,
      failed: results.filter(r => !r.success || !r.comparison?.passed).length,
      partial: results.filter(r => r.success && r.comparison && !r.comparison.passed && r.comparison.matches > 0).length
    },
    tests: results
  };

  return report;
}

/**
 * Save results to file
 */
function saveResults(report) {
  const resultsDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const resultsFile = path.join(resultsDir, `bf-21h5-dom-reordering-${timestamp}.json`);

  fs.writeFileSync(resultsFile, JSON.stringify(report, null, 2));
  console.log(`\n📊 Results saved to: ${resultsFile}`);

  return resultsFile;
}

/**
 * Print summary to console
 */
function printSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DOM REORDERING VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${report.summary.total}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`⚠️ Partial: ${report.summary.partial}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log('='.repeat(60));

  report.tests.forEach((test, i) => {
    console.log(`\n${i + 1}. ${test.config}`);
    if (!test.success) {
      console.log(`   ❌ ERROR: ${test.error || 'Unknown error'}`);
    } else if (test.comparison?.passed) {
      console.log(`   ✅ PASS - All platforms in correct order`);
    } else if (test.comparison) {
      console.log(`   ⚠️ PARTIAL - ${test.comparison.matches}/${test.comparison.total} platforms match`);
      console.log(`   Expected: ${test.expectedOrder.join(', ')}`);
      console.log(`   Actual: ${test.actualOrder.join(', ')}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  const allPassed = report.summary.passed === report.summary.total;
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test runner
 */
async function main() {
  console.log('🔍 DOM Reordering Verification - BF-21h5');
  console.log('Starting tests...\n');

  const browser = await chromium.launch({
    headless: true, // Run headless for automation
    timeout: 60000
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  const results = [];

  try {
    for (const config of TEST_CONFIGS) {
      const result = await runTest(page, config);
      results.push(result);

      // Small delay between tests
      await page.waitForTimeout(2000);
    }
  } finally {
    await browser.close();
  }

  // Generate and save report
  const report = generateReport(results);
  const resultsFile = saveResults(report);
  printSummary(report);

  // Exit with appropriate code
  process.exit(report.summary.passed === report.summary.total ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runTest,
  compareOrders,
  getPlatformOrder,
  setPreferencesAndReorder
};
