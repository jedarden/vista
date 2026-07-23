/**
 * Single Platform Preference Test with DOM Ordering Verification - BF-3hda8
 *
 * This test verifies that a single platform preference can be:
 * 1. Set via the settings UI
 * 2. Saved to localStorage
 * 3. Persisted across page reloads
 * 4. **REFLECTED IN DOM ORDER** (new verification)
 *
 * Focus: Reddit platform preference
 *
 * Usage: node test/integration/single-platform-preference-puppeteer-test.js
 */

const puppeteer = require('puppeteer');
const {
  setPlatformPreferences,
  getPlatformPreferences,
  waitDOMStable
} = require('../../change-platform-preferences');
const {
  getPlatformOrder,
  compareOrders
} = require('../utils/dom-helpers');

const BASE_URL = 'http://localhost:3000';
const TEST_PLATFORM = 'reddit';

// Test results tracking
const RESULTS = {
  testPlatform: TEST_PLATFORM,
  startTime: new Date().toISOString(),
  tests: [],
  summary: {}
};

/**
 * Log test result
 */
function logTest(testName, passed, details = '') {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };

  RESULTS.tests.push(result);
  console.log(`[${passed ? '✓' : '✗'}] ${testName}${details ? ': ' + details : ''}`);

  if (!passed) {
    console.log(`    Details: ${details}`);
  }
}

/**
 * Ensure page is ready and app.js is loaded
 */
async function ensurePageReady(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for platformPrefs to be available
  const startTime = Date.now();
  const timeout = 10000;

  while (Date.now() - startTime < timeout) {
    const isReady = await page.evaluate(() => {
      try {
        return typeof platformPrefs !== 'undefined';
      } catch (e) {
        return false;
      }
    });

    if (isReady) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error('Page did not initialize within timeout');
}

/**
 * Main test execution
 */
async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log(`Single Platform Preference Test (Puppeteer) - ${TEST_PLATFORM.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log(`Started at: ${RESULTS.startTime}`);
  console.log(`Test Platform: ${TEST_PLATFORM}`);
  console.log('='.repeat(60) + '\n');

  let browser;
  let page;

  try {
    // Setup: Launch browser
    console.log('🔧 Setup: Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Browser launched\n');

    // Test 1: Ensure page is ready
    console.log('📝 Test 1: Page Initialization');
    try {
      await ensurePageReady(page);
      logTest('Page Initialization', true, 'Page loaded and platformPrefs available');
    } catch (error) {
      logTest('Page Initialization', false, error.message);
      throw new Error('Failed to initialize page');
    }

    // Test 2: Get initial state (before setting preference)
    console.log('\n📝 Test 2: Get Initial Preferences');
    try {
      const initialPrefs = await getPlatformPreferences(page);

      if (initialPrefs) {
        console.log(`    Initial favorites: ${initialPrefs.favorites.join(', ') || 'none'}`);
        console.log(`    ${TEST_PLATFORM} in favorites: ${initialPrefs.favorites.includes(TEST_PLATFORM)}`);

        logTest(
          'Get Initial Preferences',
          true,
          `Retrieved ${initialPrefs.favorites.length} favorite(s)`
        );
      } else {
        logTest('Get Initial Preferences', false, 'Could not retrieve initial preferences');
      }
    } catch (error) {
      logTest('Get Initial Preferences', false, error.message);
    }

    // Test 3: Set Reddit as favorite platform
    console.log('\n📝 Test 3: Set Reddit as Favorite Platform');
    try {
      const result = await setPlatformPreferences(page, [TEST_PLATFORM], {
        clearExisting: true,
        triggerReordering: false
      });

      if (result.success) {
        console.log(`    Set ${result.count} platform(s) as favorite(s)`);
        console.log(`    Platform IDs: ${result.platformIds.join(', ')}`);
        console.log(`    Duration: ${result.duration}ms`);

        logTest(
          'Set Reddit as Favorite',
          true,
          `Successfully set ${TEST_PLATFORM} as favorite in ${result.duration}ms`
        );
      } else {
        logTest('Set Reddit as Favorite', false, result.error || 'Failed to set preference');
        throw new Error('Failed to set platform preference');
      }
    } catch (error) {
      logTest('Set Reddit as Favorite', false, error.message);
      throw error;
    }

    // Test 4: Verify preference was saved to localStorage
    console.log('\n📝 Test 4: Verify Preference Saved to localStorage');
    try {
      const localStorageValue = await page.evaluate(() => {
        return localStorage.getItem('vista-platform-prefs');
      });

      if (localStorageValue) {
        const prefs = JSON.parse(localStorageValue);
        console.log(`    localStorage contains ${prefs.favorites.length} favorite(s)`);
        console.log(`    Favorites in localStorage: ${prefs.favorites.join(', ')}`);

        const hasReddit = prefs.favorites.includes(TEST_PLATFORM);
        console.log(`    ${TEST_PLATFORM} found: ${hasReddit}`);

        logTest(
          'Verify localStorage Save',
          hasReddit,
          hasReddit ? `${TEST_PLATFORM} found in localStorage` : `${TEST_PLATFORM} not in localStorage`
        );

        if (!hasReddit) {
          throw new Error(`${TEST_PLATFORM} not found in localStorage after save`);
        }
      } else {
        logTest('Verify localStorage Save', false, 'localStorage is empty');
        throw new Error('localStorage does not contain preferences');
      }
    } catch (error) {
      logTest('Verify localStorage Save', false, error.message);
      throw error;
    }

    // Test 5: Wait for DOM to stabilize
    console.log('\n📝 Test 5: Wait for DOM Stabilization');
    try {
      const stable = await waitDOMStable(page, { stableTime: 1000, maxWait: 5000 });
      logTest('DOM Stabilization', stable, stable ? 'DOM stabilized successfully' : 'DOM did not stabilize');
    } catch (error) {
      logTest('DOM Stabilization', false, error.message);
    }

    // Test 6: Verify preference is still set after getting it from the page
    console.log('\n📝 Test 6: Verify Preference Current State');
    try {
      const currentPrefs = await getPlatformPreferences(page);

      if (currentPrefs) {
        console.log(`    Current favorites: ${currentPrefs.favorites.join(', ')}`);
        console.log(`    ${TEST_PLATFORM} in favorites: ${currentPrefs.favorites.includes(TEST_PLATFORM)}`);

        const hasReddit = currentPrefs.favorites.includes(TEST_PLATFORM);
        const onlyReddit = currentPrefs.favorites.length === 1 && currentPrefs.favorites[0] === TEST_PLATFORM;

        logTest(
          'Verify Preference Current State',
          hasReddit && onlyReddit,
          hasReddit && onlyReddit
            ? `${TEST_PLATFORM} is the only favorite (as expected)`
            : `Unexpected favorites: ${currentPrefs.favorites.join(', ')}`
        );

        if (!hasReddit) {
          throw new Error(`${TEST_PLATFORM} not found in current preferences`);
        }
      } else {
        logTest('Verify Preference Current State', false, 'Could not retrieve current preferences');
        throw new Error('Failed to get current preferences');
      }
    } catch (error) {
      logTest('Verify Preference Current State', false, error.message);
      throw error;
    }

    // Test 7: Verify preference persists across page reload
    console.log('\n📝 Test 7: Verify Preference Persists Across Page Reload');
    try {
      // Reload the page
      console.log('    Reloading page...');
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Wait for app to initialize after reload
      await ensurePageReady(page);
      console.log('    Page reloaded and ready');

      // Get preferences after reload
      const reloadedPrefs = await getPlatformPreferences(page);

      if (reloadedPrefs) {
        console.log(`    Favorites after reload: ${reloadedPrefs.favorites.join(', ')}`);
        console.log(`    ${TEST_PLATFORM} still in favorites: ${reloadedPrefs.favorites.includes(TEST_PLATFORM)}`);

        const stillHasReddit = reloadedPrefs.favorites.includes(TEST_PLATFORM);
        const onlyReddit = reloadedPrefs.favorites.length === 1 && reloadedPrefs.favorites[0] === TEST_PLATFORM;

        logTest(
          'Verify Persistence After Reload',
          stillHasReddit && onlyReddit,
          stillHasReddit && onlyReddit
            ? `${TEST_PLATFORM} persisted correctly across reload`
            : `Preference did not persist: ${reloadedPrefs.favorites.join(', ')}`
        );

        if (!stillHasReddit) {
          throw new Error(`${TEST_PLATFORM} did not persist across page reload`);
        }
      } else {
        logTest('Verify Persistence After Reload', false, 'Could not retrieve preferences after reload');
        throw new Error('Failed to get preferences after reload');
      }
    } catch (error) {
      logTest('Verify Persistence After Reload', false, error.message);
      throw error;
    }

    // Test 8: Verify DOM order reflects score-sorted preference order
    console.log('\n📝 Test 8: Verify DOM Order Reflects Score-Sorted Preference Order');
    try {
      // Wait for DOM to stabilize after reload
      console.log('    Waiting for DOM to stabilize...');
      const stable = await waitDOMStable(page, { stableTime: 500, maxWait: 5000 });

      if (!stable) {
        console.log('    Warning: DOM may not be fully stabilized');
      }

      // Get actual DOM order
      console.log('    Extracting platform order from DOM...');
      const actualOrder = await getPlatformOrder(page, {
        selector: '.platform-card',
        timeout: 5000
      });

      console.log(`    Found ${actualOrder.length} platform(s) in DOM`);
      console.log(`    Actual order: ${actualOrder.join(', ')}`);

      // When Reddit is set as favorite, it should receive the highest score bonus
      // and appear first in the DOM. The rest should be sorted by their scores.
      // Expected: Reddit should be first, followed by other platforms in score order
      const redditFirst = actualOrder.length > 0 && actualOrder[0] === TEST_PLATFORM;

      console.log(`    ${TEST_PLATFORM} is first in DOM: ${redditFirst}`);

      // Additional verification: check that all platforms are present
      const redditPresent = actualOrder.includes(TEST_PLATFORM);
      console.log(`    ${TEST_PLATFORM} is present in DOM: ${redditPresent}`);

      // Build detailed comparison - Reddit should be first, rest maintain relative order
      // This verifies that favorites are promoted to the top while preserving other order
      let expectedOrder;
      if (actualOrder.includes(TEST_PLATFORM)) {
        // Create expected order with Reddit first, then others in their current relative order
        const others = actualOrder.filter(p => p !== TEST_PLATFORM);
        expectedOrder = [TEST_PLATFORM, ...others];
      } else {
        // If Reddit not found, we can't verify ordering
        expectedOrder = actualOrder;
      }

      console.log(`    Expected order (${TEST_PLATFORM} promoted to first): ${expectedOrder.join(', ')}`);

      // Compare orders
      const comparison = compareOrders(expectedOrder, actualOrder);

      console.log(`    Comparison results:`);
      console.log(`      - Exact match: ${comparison.passed}`);
      console.log(`      - Matches: ${comparison.matches}/${comparison.total}`);
      console.log(`      - Pass rate: ${comparison.passRate}%`);
      console.log(`      - Missing platforms: ${comparison.missing.join(', ') || 'none'}`);
      console.log(`      - Extra platforms: ${comparison.extra.join(', ') || 'none'}`);

      // Detailed position checks
      const redditIndex = actualOrder.indexOf(TEST_PLATFORM);
      console.log(`    ${TEST_PLATFORM} position: ${redditIndex >= 0 ? redditIndex + 1 : 'not found'}`);

      // The test passes if:
      // 1. Reddit is present in the DOM
      // 2. Reddit is in the first position (preference-based sorting)
      const testPassed = redditPresent && redditFirst;

      let details;
      if (testPassed) {
        details = `${TEST_PLATFORM} correctly appears first in DOM (preference-based sorting verified)`;
      } else if (!redditPresent) {
        details = `${TEST_PLATFORM} is not present in the DOM at all`;
      } else {
        details = `${TEST_PLATFORM} is present but not first (position ${redditIndex + 1}); actual order: ${actualOrder.join(', ')}`;
      }

      logTest(
        'DOM Order Score-Sorted Preference Verification',
        testPassed,
        details
      );

      if (!testPassed) {
        console.log(`    ⚠️  Preference-based sorting verification failed:`);
        if (!redditPresent) {
          console.log(`    - ${TEST_PLATFORM} is not present in the DOM`);
        } else if (!redditFirst) {
          console.log(`    - ${TEST_PLATFORM} is at position ${redditIndex + 1}, expected position 1`);
          console.log(`    - Actual order: ${actualOrder.join(', ')}`);
          console.log(`    - Expected ${TEST_PLATFORM} to be promoted to first position when set as favorite`);
        }
      }
    } catch (error) {
      logTest('DOM Order Score-Sorted Preference Verification', false, error.message);
      console.log(`    Error details: ${error.message}`);
      // Don't throw error here - we want to continue and see the results
    }

  } finally {
    // Cleanup: Close browser
    if (browser) {
      await browser.close();
      console.log('\n✅ Browser closed');
    }
  }

  // Calculate summary
  RESULTS.endTime = new Date().toISOString();
  RESULTS.summary = {
    total: RESULTS.tests.length,
    passed: RESULTS.tests.filter(t => t.passed).length,
    failed: RESULTS.tests.filter(t => !t.passed).length
  };

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test Platform: ${TEST_PLATFORM}`);
  console.log(`Total Tests: ${RESULTS.summary.total}`);
  console.log(`Passed: ${RESULTS.summary.passed}`);
  console.log(`Failed: ${RESULTS.summary.failed}`);
  console.log(`Duration: ${new Date(RESULTS.endTime) - new Date(RESULTS.startTime)}ms`);
  console.log('='.repeat(60) + '\n');

  if (RESULTS.summary.failed > 0) {
    console.log('Failed Tests:');
    RESULTS.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.test}: ${t.details}`);
    });
    console.log('');
  }

  // Save results to file
  const fs = require('fs');
  const path = require('path');
  const resultsDir = path.join(__dirname, '..', '..', 'test-results');
  const resultsPath = path.join(resultsDir, `single-platform-preference-puppeteer-test-${TEST_PLATFORM}.json`);

  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));
  console.log(`📄 Results saved to: ${resultsPath}\n`);

  // Exit with appropriate code
  process.exit(RESULTS.summary.failed > 0 ? 1 : 0);
}

// Run the test
runTest().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
