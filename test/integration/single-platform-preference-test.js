/**
 * Single Platform Preference Test Case - BF-4a7et
 *
 * This test verifies that a single platform preference can be:
 * 1. Set via the settings UI
 * 2. Saved to localStorage
 * 3. Persisted across page reloads
 *
 * Focus: Reddit platform preference
 *
 * Usage: node test/integration/single-platform-preference-test.js
 */

const { chromium } = require('playwright');
const {
  setPlatformPreferences,
  getPlatformPreferences,
  waitDOMStable
} = require('../../change-platform-preferences');

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

    await page.waitForTimeout(100);
  }

  throw new Error('Page did not initialize within timeout');
}

/**
 * Main test execution
 */
async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log(`Single Platform Preference Test - ${TEST_PLATFORM.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log(`Started at: ${RESULTS.startTime}`);
  console.log(`Test Platform: ${TEST_PLATFORM}`);
  console.log('='.repeat(60) + '\n');

  let browser;
  let page;

  try {
    // Setup: Launch browser
    console.log('🔧 Setup: Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
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
  const resultsPath = path.join(resultsDir, `single-platform-preference-test-${TEST_PLATFORM}.json`);

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
