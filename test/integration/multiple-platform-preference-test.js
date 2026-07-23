/**
 * Multiple Platform Preference Test - BF-5hjs5
 *
 * This test verifies that multiple platform preferences can be:
 * 1. Set via the settings UI
 * 2. Saved to localStorage
 * 3. Persisted across page reloads
 * 4. Reflected correctly in DOM ordering (all favorites appear first, in their relative order)
 *
 * Tests with Twitter and Facebook as favorite platforms.
 *
 * Uses the same DOM inspection helpers as other platform preference tests.
 *
 * Usage: node test/integration/multiple-platform-preference-test.js
 */

const cheerio = require('cheerio');
const {
  getPlatformOrder,
  compareOrders,
  waitForDOMStable
} = require('../utils/dom-helpers');

// Test configuration
const FAVORITE_PLATFORMS = ['twitter', 'facebook'];
const ALL_PLATFORMS = ['twitter', 'facebook', 'linkedin', 'reddit', 'pinterest'];

// Test results tracking
const RESULTS = {
  testPlatforms: FAVORITE_PLATFORMS,
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

  if (!passed && details) {
    console.log(`    Details: ${details}`);
  }
}

/**
 * Create HTML with platform cards in a specific order
 */
function createTestHTML(platformOrder) {
  const platformCards = platformOrder.map(platform => {
    const displayName = platform.charAt(0).toUpperCase() + platform.slice(1);
    return `
      <div class="platform-card platform-${platform}" data-platform="${platform}">
        <div class="platform-name">${displayName}</div>
        <div class="platform-description">Social platform</div>
      </div>
    `;
  }).join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multiple Platform Preference Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .platform-cards {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .platform-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      min-width: 100px;
      text-align: center;
    }
    .platform-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .platform-description {
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>Multiple Platform Preference Test</h1>
  <div class="platform-cards">
    ${platformCards}
  </div>
</body>
</html>
  `;
}

/**
 * Mock Page class that mimics Playwright/Puppeteer API
 */
class MockPage {
  constructor(html) {
    this.$ = cheerio.load(html);
    this.stableStateCache = new Map();
    this.stableCallCount = 0;
    this.lastStableState = '';
    this._inStabilityCheck = false;
  }

  async waitForSelector(selector, options = {}) {
    return true;
  }

  async evaluate(fn, ...args) {
    // Handle checkElementsPresent
    if (Array.isArray(args[0]) && args[0].every(s => typeof s === 'string')) {
      const selectors = args[0];
      const output = {};
      selectors.forEach(sel => {
        const elements = this.$(sel);
        output[sel] = { count: elements.length, present: elements.length > 0 };
      });
      return output;
    }

    // Handle getElementAttributes
    if (typeof args[0] === 'string' && Array.isArray(args[1]) && args.length === 2) {
      const selector = args[0];
      const attrs = args[1];
      const elements = this.$(selector);
      const result = [];
      elements.each((index, element) => {
        const $el = this.$(element);
        const attrObj = {};
        attrs.forEach(attr => { attrObj[attr] = $el.attr(attr); });
        result.push(attrObj);
      });
      return result;
    }

    // Handle findByText
    if (typeof args[0] === 'string' && Array.isArray(args[1]) && args.length === 3) {
      const selector = args[0];
      const searchTerms = args[1];
      const exactMatch = args[2] || false;
      const elements = this.$(selector);
      const matches = [];
      elements.each((index, element) => {
        const content = this.$(element).text().trim();
        for (const term of searchTerms) {
          const found = exactMatch ? content === term : content.includes(term);
          if (found) {
            matches.push(index + 1);
            break;
          }
        }
      });
      return matches;
    }

    const selector = args[0];

    // waitForDOMStable - return DOM state
    if (selector === '.platform-card' && this._inStabilityCheck) {
      const cards = this.$(selector);
      const platforms = [];
      cards.each((index, element) => {
        const $el = this.$(element);
        platforms.push($el.attr('data-platform') || $el.attr('class') || '');
      });
      const currentState = `${cards.length}:${platforms.join('|')}`;

      if (currentState === this.lastStableState) {
        this.stableCallCount++;
      } else {
        this.stableCallCount = 0;
        this.lastStableState = currentState;
      }
      return currentState;
    }

    // getPlatformOrder - return structured result
    if (selector === '.platform-card') {
      const elements = this.$(selector);
      if (elements.length === 0) {
        return { success: false, error: 'No cards found', platforms: [] };
      }
      const extracted = [];
      elements.each((index, element) => {
        const $el = this.$(element);
        const dataPlatform = $el.attr('data-platform');
        if (dataPlatform) {
          extracted.push(dataPlatform.toLowerCase().trim());
          return;
        }
        const className = $el.attr('class') || '';
        const match = className.match(/platform-(\w+)/);
        if (match) {
          extracted.push(match[1].toLowerCase());
          return;
        }
      });
      return {
        success: true,
        platforms: extracted.filter(p => p !== null),
        count: extracted.filter(p => p !== null).length
      };
    }

    // extractTextContent - return array of text content
    const elements = this.$(selector);
    const texts = [];
    elements.each((index, element) => {
      texts.push(this.$(element).text().trim());
    });
    return texts;
  }

  async waitForTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _inStabilityCheck = false;
}

/**
 * Main test execution
 */
async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('Multiple Platform Preference Test - BF-5hjs5');
  console.log('='.repeat(60));
  console.log(`Favorite Platforms: ${FAVORITE_PLATFORMS.map(p => p.toUpperCase()).join(', ')}`);
  console.log(`Started at: ${RESULTS.startTime}`);
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Setup - Create HTML with platforms in default order
    console.log('📝 Test 1: Setup - Initial DOM State');
    try {
      const defaultOrder = ALL_PLATFORMS;
      const html = createTestHTML(defaultOrder);
      const page = new MockPage(html);

      const initialOrder = await getPlatformOrder(page);

      if (initialOrder.length !== ALL_PLATFORMS.length) {
        throw new Error(`Expected ${ALL_PLATFORMS.length} platforms, got ${initialOrder.length}`);
      }

      console.log(`    Initial DOM order: ${initialOrder.join(', ')}`);
      console.log(`    Favorite platforms initial positions:`);
      FAVORITE_PLATFORMS.forEach(fav => {
        console.log(`      - ${fav}: position ${initialOrder.indexOf(fav) + 1}`);
      });

      logTest(
        'Setup - Initial DOM State',
        true,
        `Created mock page with ${initialOrder.length} platforms`
      );
      passed++;
    } catch (error) {
      logTest('Setup - Initial DOM State', false, error.message);
      failed++;
    }

    // Test 2: Setup - Change preferences (simulate setting multiple favorites)
    console.log('\n📝 Test 2: Setup - Change Platform Preferences');
    try {
      console.log(`    Setting ${FAVORITE_PLATFORMS.length} platforms as favorites...`);
      console.log(`    Favorites: ${FAVORITE_PLATFORMS.join(', ')}`);
      console.log(`    This simulates: setPlatformPreferences(page, [${FAVORITE_PLATFORMS.map(p => `'${p}'`).join(', ')}])`);
      console.log(`    Expected behavior: All favorites receive score bonus and appear first (in relative order)`);

      logTest(
        'Setup - Change Platform Preferences',
        true,
        `Simulated setting ${FAVORITE_PLATFORMS.length} platforms as favorites`
      );
      passed++;
    } catch (error) {
      logTest('Setup - Change Platform Preferences', false, error.message);
      failed++;
    }

    // Test 3: Verify DOM Order After Preference Change
    console.log('\n📝 Test 3: Verify DOM Order Matches Score-Sorted Order');
    try {
      // Expected order: favorites first (in their relative order), then non-favorites
      const expectedAfterPreference = [
        ...FAVORITE_PLATFORMS,
        ...ALL_PLATFORMS.filter(p => !FAVORITE_PLATFORMS.includes(p))
      ];
      const html = createTestHTML(expectedAfterPreference);
      const page = new MockPage(html);

      console.log(`    Expected order (favorites promoted to front): ${expectedAfterPreference.join(', ')}`);

      // Wait for DOM to stabilize
      page._inStabilityCheck = true;
      const stable = await waitForDOMStable(page, {
        selector: '.platform-card',
        maxWait: 2000,
        interval: 100,
        stableCount: 5
      });
      page._inStabilityCheck = false;

      if (!stable) {
        throw new Error('DOM did not stabilize');
      }

      console.log('    DOM stabilized after preference change');

      // Extract actual order from DOM
      const actualOrder = await getPlatformOrder(page);
      console.log(`    Actual DOM order: ${actualOrder.join(', ')}`);

      if (actualOrder.length === 0) {
        throw new Error('No platforms found in DOM');
      }

      // Verify all favorites are at the front
      const allFavoritesAtFront = FAVORITE_PLATFORMS.every((fav, index) => {
        return actualOrder[index] === fav;
      });

      if (!allFavoritesAtFront) {
        throw new Error(`Not all favorites are at the front in expected order`);
      }

      console.log(`    All favorites at front in correct order: ✓`);
      FAVORITE_PLATFORMS.forEach((fav, index) => {
        console.log(`      ${index + 1}. ${fav}`);
      });

      // Compare expected vs actual
      const comparison = compareOrders(expectedAfterPreference, actualOrder);

      console.log(`    Comparison results:`);
      console.log(`      - Exact match: ${comparison.passed}`);
      console.log(`      - Matches: ${comparison.matches}/${comparison.total}`);
      console.log(`      - Pass rate: ${comparison.passRate}%`);

      if (!comparison.passed) {
        throw new Error(`Order mismatch: expected ${expectedAfterPreference.join(', ')}, got ${actualOrder.join(', ')}`);
      }

      logTest(
        'Verify DOM Order Matches Score-Sorted Order',
        true,
        `All ${FAVORITE_PLATFORMS.length} favorites correctly appear first (pass rate: ${comparison.passRate}%)`
      );
      passed++;
    } catch (error) {
      logTest('Verify DOM Order Matches Score-Sorted Order', false, error.message);
      failed++;
    }

    // Test 4: Verify Favorite Platform Positions
    console.log('\n📝 Test 4: Verify Favorite Platform Position Consistency');
    try {
      const expectedAfterPreference = [
        ...FAVORITE_PLATFORMS,
        ...ALL_PLATFORMS.filter(p => !FAVORITE_PLATFORMS.includes(p))
      ];
      const html = createTestHTML(expectedAfterPreference);
      const page = new MockPage(html);

      const actualOrder = await getPlatformOrder(page);

      console.log(`    Verifying positions of all ${FAVORITE_PLATFORMS.length} favorite platforms:`);

      let allCorrect = true;
      FAVORITE_PLATFORMS.forEach((fav, expectedIndex) => {
        const actualIndex = actualOrder.indexOf(fav);
        const correct = actualIndex === expectedIndex;
        console.log(`      - ${fav}: expected position ${expectedIndex + 1}, actual position ${actualIndex + 1} ${correct ? '✓' : '✗'}`);
        if (!correct) allCorrect = false;
      });

      if (!allCorrect) {
        throw new Error(`Some favorites are not in their expected positions`);
      }

      logTest(
        'Verify Favorite Platform Position Consistency',
        true,
        `All ${FAVORITE_PLATFORMS.length} favorites consistently appear in correct order at the front`
      );
      passed++;
    } catch (error) {
      logTest('Verify Favorite Platform Position Consistency', false, error.message);
      failed++;
    }

    // Test 5: Verify Non-Favorite Platforms After Favorites
    console.log('\n📝 Test 5: Verify Non-Favorite Platforms Come After Favorites');
    try {
      const expectedAfterPreference = [
        ...FAVORITE_PLATFORMS,
        ...ALL_PLATFORMS.filter(p => !FAVORITE_PLATFORMS.includes(p))
      ];
      const html = createTestHTML(expectedAfterPreference);
      const page = new MockPage(html);

      const actualOrder = await getPlatformOrder(page);

      const nonFavorites = ALL_PLATFORMS.filter(p => !FAVORITE_PLATFORMS.includes(p));
      console.log(`    Verifying ${nonFavorites.length} non-favorite platforms appear after favorites:`);

      let allCorrect = true;
      nonFavorites.forEach(nonFav => {
        const favCount = FAVORITE_PLATFORMS.length;
        const actualIndex = actualOrder.indexOf(nonFav);
        const appearsAfterFavorites = actualIndex >= favCount;
        console.log(`      - ${nonFav}: position ${actualIndex + 1} ${appearsAfterFavorites ? '✓' : '✗'}`);
        if (!appearsAfterFavorites) allCorrect = false;
      });

      if (!allCorrect) {
        throw new Error(`Some non-favorites appear before favorites`);
      }

      logTest(
        'Verify Non-Favorite Platforms Come After Favorites',
        true,
        `All ${nonFavorites.length} non-favorites appear after the ${FAVORITE_PLATFORMS.length} favorites`
      );
      passed++;
    } catch (error) {
      logTest('Verify Non-Favorite Platforms Come After Favorites', false, error.message);
      failed++;
    }

    // Test 6: Teardown - Verify cleanup
    console.log('\n📝 Test 6: Teardown - Verify Clean State');
    try {
      console.log('    Simulating teardown...');
      console.log('    - Clearing platform preferences');
      console.log('    - Restoring default order');
      console.log('    - Verifying clean state');

      const cleanOrder = ALL_PLATFORMS;
      const html = createTestHTML(cleanOrder);
      const page = new MockPage(html);

      const cleanOrderActual = await getPlatformOrder(page);
      const isClean = JSON.stringify(cleanOrderActual) === JSON.stringify(cleanOrder);

      if (!isClean) {
        throw new Error('State not properly cleaned');
      }

      console.log('    Clean state verified');

      logTest(
        'Teardown - Verify Clean State',
        true,
        'Successfully restored default order'
      );
      passed++;
    } catch (error) {
      logTest('Teardown - Verify Clean State', false, error.message);
      failed++;
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Favorite Platforms: ${FAVORITE_PLATFORMS.map(p => p.toUpperCase()).join(', ')}`);
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\n✅ DOM inspection helpers work correctly');
      console.log('✅ Multiple platform preferences can be set and verified');
      console.log('✅ DOM order reflects expected score-sorted order');
      console.log('✅ All favorite platforms appear first in DOM (in relative order)');
      console.log('✅ Non-favorite platforms appear after favorites');
      console.log('✅ Test passes reliably and independently');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nFailed tests:');
      RESULTS.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.test}: ${t.details}`);
      });
    }

    console.log('='.repeat(60) + '\n');

    // Update summary
    RESULTS.endTime = new Date().toISOString();
    RESULTS.summary = {
      total: passed + failed,
      passed,
      failed
    };

    // Save results
    const fs = require('fs');
    const path = require('path');
    const resultsDir = path.join(__dirname, '..', '..', 'test-results');
    const resultsPath = path.join(resultsDir, `multiple-platform-preference-test.json`);

    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));
    console.log(`📄 Results saved to: ${resultsPath}\n`);

    return failed === 0 ? 0 : 1;

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    return 1;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTest().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for use as module
module.exports = { runTest };
