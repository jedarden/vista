/**
 * DOM Helpers Integration Test with Puppeteer
 *
 * Basic integration test that verifies DOM helper functions work correctly
 * with Puppeteer and can access/read DOM elements from real pages.
 *
 * This test validates that:
 * - DOM helpers can access and read DOM elements from the page
 * - Helper functions return expected data structures
 * - DOM helpers are properly integrated with Puppeteer
 * - Tests pass when run in isolation
 */

'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Import DOM helpers
const {
  getPlatformOrder,
  compareOrders,
  waitForDOMStable,
  checkElementsPresent,
  extractTextContent,
  getElementAttributes,
  findByText
} = require('../utils/dom-helpers');

// Test configuration
const TEST_CONFIG = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
};

/**
 * Create a simple test HTML page with platform cards
 */
function createTestHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOM Helpers Test Page</title>
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
    .test-section {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border-radius: 8px;
    }
    .text-elements {
      display: flex;
      gap: 10px;
    }
    .text-item {
      padding: 10px;
      background: #e9e9e9;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>DOM Helpers Integration Test Page</h1>

  <div class="test-section">
    <h2>Platform Cards</h2>
    <div class="platform-cards">
      <div class="platform-card platform-twitter" data-platform="twitter">
        <div class="platform-name">Twitter</div>
        <div class="platform-description">Social media platform</div>
      </div>
      <div class="platform-card platform-facebook" data-platform="facebook">
        <div class="platform-name">Facebook</div>
        <div class="platform-description">Social network</div>
      </div>
      <div class="platform-card platform-linkedin" data-platform="linkedin">
        <div class="platform-name">LinkedIn</div>
        <div class="platform-description">Professional network</div>
      </div>
      <div class="platform-card platform-reddit" data-platform="reddit">
        <div class="platform-name">Reddit</div>
        <div class="platform-description">Community platform</div>
      </div>
      <div class="platform-card platform-pinterest" data-platform="pinterest">
        <div class="platform-name">Pinterest</div>
        <div class="platform-description">Image sharing</div>
      </div>
    </div>
  </div>

  <div class="test-section">
    <h2>Text Elements</h2>
    <div class="text-elements">
      <div class="text-item">First Text</div>
      <div class="text-item">Second Text</div>
      <div class="text-item">Third Text</div>
    </div>
  </div>

  <div class="test-section">
    <h2>Attribute Elements</h2>
    <div class="attribute-elements">
      <div class="attr-item" data-id="1" data-category="test">Item 1</div>
      <div class="attr-item" data-id="2" data-category="test">Item 2</div>
      <div class="attr-item" data-id="3" data-category="example">Item 3</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Setup function - initializes browser and test environment
 * Called before all tests to establish preconditions
 */
async function setupTestEnvironment() {
  console.log('\n🚀 Setting up test environment...');

  const browser = await puppeteer.launch(TEST_CONFIG);
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('✅ Browser launched successfully');

  // Create test HTML and load it
  console.log('📄 Creating test page...');
  const testHTML = createTestHTML();
  await page.setContent(testHTML, { waitUntil: 'networkidle0' });
  console.log('✅ Test page loaded');

  return { browser, page };
}

/**
 * Teardown function - cleans up browser and test resources
 * Called after all tests to ensure clean state
 */
async function teardownTestEnvironment(browser, page) {
  console.log('\n🧹 Cleaning up test environment...');

  try {
    if (page && !page.isClosed()) {
      await page.close();
      console.log('✅ Page closed');
    }
  } catch (error) {
    console.warn('⚠️  Warning: Error closing page:', error.message);
  }

  try {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  } catch (error) {
    console.warn('⚠️  Warning: Error closing browser:', error.message);
  }

  console.log('✅ Test environment cleaned up');
}

/**
 * Run a single test with proper error handling
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function to execute
 * @param {Object} page - Puppeteer page instance
 * @returns {Object} Test result with passed flag and any error
 */
async function runTest(testName, testFn, page) {
  try {
    await testFn(page);
    return { passed: true, error: null };
  } catch (error) {
    return { passed: false, error: error.message };
  }
}

/**
 * Run the integration tests
 */
async function runTests() {
  console.log('🧪 DOM Helpers Integration Test with Puppeteer');
  console.log('='.repeat(60));

  let browser;
  let page;
  let passed = 0;
  let failed = 0;
  let testResults = [];

  try {
    // Setup: Initialize browser and test environment
    const setupResult = await setupTestEnvironment();
    browser = setupResult.browser;
    page = setupResult.page;

    // Test 1: getPlatformOrder basic functionality
    console.log('\n📋 Test 1: getPlatformOrder() basic functionality');
    const test1 = await runTest('getPlatformOrder basic functionality', async (page) => {
      const platforms = await getPlatformOrder(page);

      if (!Array.isArray(platforms)) {
        throw new Error('getPlatformOrder did not return an array');
      }

      if (platforms.length !== 5) {
        throw new Error(`Expected 5 platforms, got ${platforms.length}`);
      }

      const expectedPlatforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'pinterest'];
      const matchCount = platforms.filter((p, i) => p === expectedPlatforms[i]).length;

      if (matchCount !== 5) {
        throw new Error(`Platform order mismatch. Expected: ${expectedPlatforms.join(', ')}, Got: ${platforms.join(', ')}`);
      }

      console.log(`     Platforms: ${platforms.join(', ')}`);
    }, page);

    testResults.push({ name: 'getPlatformOrder basic functionality', ...test1 });
    if (test1.passed) {
      console.log('  ✅ getPlatformOrder returns correct platform order');
      passed++;
    } else {
      console.log(`  ❌ getPlatformOrder failed: ${test1.error}`);
      failed++;
    }

    // Test 2: getPlatformOrder with custom selector
    console.log('\n📋 Test 2: getPlatformOrder() with custom selector');
    const test2 = await runTest('getPlatformOrder with custom selector', async (page) => {
      const attrItems = await getPlatformOrder(page, {
        selector: '.attr-item',
        timeout: 5000
      });

      if (!Array.isArray(attrItems)) {
        throw new Error('getPlatformOrder with custom selector did not return an array');
      }

      if (attrItems.length !== 3) {
        throw new Error(`Expected 3 attr-item elements, got ${attrItems.length}`);
      }

      console.log(`     Found ${attrItems.length} elements`);
    }, page);

    testResults.push({ name: 'getPlatformOrder with custom selector', ...test2 });
    if (test2.passed) {
      console.log('  ✅ getPlatformOrder works with custom selector');
      passed++;
    } else {
      console.log(`  ❌ getPlatformOrder with custom selector failed: ${test2.error}`);
      failed++;
    }

    // Test 3: compareOrders functionality
    console.log('\n📋 Test 3: compareOrders() functionality');
    const test3 = await runTest('compareOrders functionality', async (page) => {
      const expected = ['twitter', 'facebook', 'linkedin', 'reddit', 'pinterest'];
      const actual = await getPlatformOrder(page);
      const comparison = compareOrders(expected, actual);

      if (!comparison || typeof comparison !== 'object') {
        throw new Error('compareOrders did not return an object');
      }

      const requiredFields = ['passed', 'matches', 'total', 'passRate', 'results', 'missing', 'extra'];
      for (const field of requiredFields) {
        if (!(field in comparison)) {
          throw new Error(`compareOrders missing field: ${field}`);
        }
      }

      if (!comparison.passed) {
        throw new Error('compareOrders did not detect perfect match');
      }

      if (comparison.matches !== comparison.total) {
        throw new Error(`matches (${comparison.matches}) != total (${comparison.total})`);
      }

      if (comparison.passRate !== 100) {
        throw new Error(`passRate (${comparison.passRate}) != 100`);
      }

      console.log(`     Passed: ${comparison.passed}, Matches: ${comparison.matches}/${comparison.total}, Pass Rate: ${comparison.passRate}%`);
    }, page);

    testResults.push({ name: 'compareOrders functionality', ...test3 });
    if (test3.passed) {
      console.log('  ✅ compareOrders returns correct comparison result');
      passed++;
    } else {
      console.log(`  ❌ compareOrders failed: ${test3.error}`);
      failed++;
    }

    // Test 4: compareOrders with mismatch
    console.log('\n📋 Test 4: compareOrders() with mismatch detection');
    const test4 = await runTest('compareOrders with mismatch detection', async (page) => {
      const expected = ['facebook', 'twitter', 'linkedin', 'reddit', 'pinterest'];
      const actual = await getPlatformOrder(page);
      const comparison = compareOrders(expected, actual);

      if (comparison.passed) {
        throw new Error('compareOrders should detect mismatch');
      }

      if (comparison.matches === comparison.total) {
        throw new Error('compareOrders should not show perfect match');
      }

      if (comparison.passRate === 100) {
        throw new Error('passRate should not be 100 for mismatch');
      }

      console.log(`     Passed: ${comparison.passed}, Matches: ${comparison.matches}/${comparison.total}, Pass Rate: ${comparison.passRate}%`);
    }, page);

    testResults.push({ name: 'compareOrders with mismatch detection', ...test4 });
    if (test4.passed) {
      console.log('  ✅ compareOrders correctly detects mismatches');
      passed++;
    } else {
      console.log(`  ❌ compareOrders mismatch detection failed: ${test4.error}`);
      failed++;
    }

    // Test 5: waitForDOMStable
    console.log('\n📋 Test 5: waitForDOMStable() functionality');
    const test5 = await runTest('waitForDOMStable functionality', async (page) => {
      const isStable = await waitForDOMStable(page, {
        selector: '.platform-card',
        maxWait: 2000,
        interval: 100,
        stableCount: 5
      });

      if (typeof isStable !== 'boolean') {
        throw new Error('waitForDOMStable did not return boolean');
      }

      if (!isStable) {
        throw new Error('DOM should be stable immediately after page load');
      }
    }, page);

    testResults.push({ name: 'waitForDOMStable functionality', ...test5 });
    if (test5.passed) {
      console.log('  ✅ waitForDOMStable correctly detects stable DOM');
      passed++;
    } else {
      console.log(`  ❌ waitForDOMStable failed: ${test5.error}`);
      failed++;
    }

    // Test 6: checkElementsPresent single selector
    console.log('\n📋 Test 6: checkElementsPresent() single selector');
    const test6 = await runTest('checkElementsPresent single selector', async (page) => {
      const result = await checkElementsPresent(page, '.platform-card');

      if (!result || typeof result !== 'object') {
        throw new Error('checkElementsPresent did not return object');
      }

      if (!('count' in result) || !('present' in result)) {
        throw new Error('checkElementsPresent missing count or present fields');
      }

      if (result.count !== 5) {
        throw new Error(`Expected count of 5, got ${result.count}`);
      }

      if (!result.present) {
        throw new Error('Elements should be present');
      }

      console.log(`     Count: ${result.count}, Present: ${result.present}`);
    }, page);

    testResults.push({ name: 'checkElementsPresent single selector', ...test6 });
    if (test6.passed) {
      console.log('  ✅ checkElementsPresent works with single selector');
      passed++;
    } else {
      console.log(`  ❌ checkElementsPresent failed: ${test6.error}`);
      failed++;
    }

    // Test 7: checkElementsPresent multiple selectors
    console.log('\n📋 Test 7: checkElementsPresent() multiple selectors');
    const test7 = await runTest('checkElementsPresent multiple selectors', async (page) => {
      const result = await checkElementsPresent(page, ['.platform-card', '.platform-name', '.nonexistent']);

      if (!result || typeof result !== 'object') {
        throw new Error('checkElementsPresent did not return object');
      }

      if (!('.platform-card' in result) || !('.platform-name' in result) || !('.nonexistent' in result)) {
        throw new Error('checkElementsPresent missing selector results');
      }

      if (result['.platform-card'] !== true) {
        throw new Error('.platform-card should be present');
      }

      if (result['.platform-name'] !== true) {
        throw new Error('.platform-name should be present');
      }

      if (result['.nonexistent'] !== false) {
        throw new Error('.nonexistent should not be present');
      }

      console.log(`     Results: ${JSON.stringify(result)}`);
    }, page);

    testResults.push({ name: 'checkElementsPresent multiple selectors', ...test7 });
    if (test7.passed) {
      console.log('  ✅ checkElementsPresent works with multiple selectors');
      passed++;
    } else {
      console.log(`  ❌ checkElementsPresent multiple selectors failed: ${test7.error}`);
      failed++;
    }

    // Test 8: extractTextContent
    console.log('\n📋 Test 8: extractTextContent() functionality');
    const test8 = await runTest('extractTextContent functionality', async (page) => {
      const texts = await extractTextContent(page, '.platform-name');

      if (!Array.isArray(texts)) {
        throw new Error('extractTextContent did not return array');
      }

      if (texts.length !== 5) {
        throw new Error(`Expected 5 text elements, got ${texts.length}`);
      }

      const expectedTexts = ['Twitter', 'Facebook', 'LinkedIn', 'Reddit', 'Pinterest'];
      const allMatch = expectedTexts.every((text, i) => texts[i] === text);

      if (!allMatch) {
        throw new Error(`Text content mismatch. Expected: ${expectedTexts.join(', ')}, Got: ${texts.join(', ')}`);
      }

      console.log(`     Texts: ${texts.join(', ')}`);
    }, page);

    testResults.push({ name: 'extractTextContent functionality', ...test8 });
    if (test8.passed) {
      console.log('  ✅ extractTextContent returns correct text content');
      passed++;
    } else {
      console.log(`  ❌ extractTextContent failed: ${test8.error}`);
      failed++;
    }

    // Test 9: extractTextContent with options
    console.log('\n📋 Test 9: extractTextContent() with options');
    const test9 = await runTest('extractTextContent with options', async (page) => {
      const texts = await extractTextContent(page, '.text-item', {
        trim: true,
        filterEmpty: true
      });

      if (!Array.isArray(texts)) {
        throw new Error('extractTextContent did not return array');
      }

      if (texts.length !== 3) {
        throw new Error(`Expected 3 text items, got ${texts.length}`);
      }

      console.log(`     Texts: ${texts.join(', ')}`);
    }, page);

    testResults.push({ name: 'extractTextContent with options', ...test9 });
    if (test9.passed) {
      console.log('  ✅ extractTextContent works with options');
      passed++;
    } else {
      console.log(`  ❌ extractTextContent with options failed: ${test9.error}`);
      failed++;
    }

    // Test 10: getElementAttributes
    console.log('\n📋 Test 10: getElementAttributes() functionality');
    const test10 = await runTest('getElementAttributes functionality', async (page) => {
      const attributes = await getElementAttributes(page, '.platform-card', 'data-platform');

      if (!Array.isArray(attributes)) {
        throw new Error('getElementAttributes did not return array');
      }

      if (attributes.length !== 5) {
        throw new Error(`Expected 5 attribute objects, got ${attributes.length}`);
      }

      const expectedPlatforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'pinterest'];
      const allMatch = expectedPlatforms.every((platform, i) =>
        attributes[i] && attributes[i]['data-platform'] === platform
      );

      if (!allMatch) {
        throw new Error(`Attribute values mismatch. Expected: ${expectedPlatforms.join(', ')}, Got: ${attributes.map(a => a['data-platform']).join(', ')}`);
      }

      console.log(`     Attributes: ${attributes.map(a => a['data-platform']).join(', ')}`);
    }, page);

    testResults.push({ name: 'getElementAttributes functionality', ...test10 });
    if (test10.passed) {
      console.log('  ✅ getElementAttributes returns correct attributes');
      passed++;
    } else {
      console.log(`  ❌ getElementAttributes failed: ${test10.error}`);
      failed++;
    }

    // Test 11: findByText
    console.log('\n📋 Test 11: findByText() functionality');
    const test11 = await runTest('findByText functionality', async (page) => {
      const indices = await findByText(page, '.platform-name', 'Twitter', false);

      if (!Array.isArray(indices)) {
        throw new Error('findByText did not return array');
      }

      if (indices.length !== 1 || indices[0] !== 1) {
        throw new Error(`Expected to find Twitter at position 1, got indices: ${indices.join(', ')}`);
      }

      console.log(`     Found 'Twitter' at position: ${indices[0]}`);
    }, page);

    testResults.push({ name: 'findByText functionality', ...test11 });
    if (test11.passed) {
      console.log('  ✅ findByText correctly finds elements by text');
      passed++;
    } else {
      console.log(`  ❌ findByText failed: ${test11.error}`);
      failed++;
    }

    // Test 12: findByText with multiple searches
    console.log('\n📋 Test 12: findByText() with multiple searches');
    const test12 = await runTest('findByText with multiple searches', async (page) => {
      const indices = await findByText(page, '.platform-name', ['Twitter', 'Facebook', 'LinkedIn'], false);

      if (!Array.isArray(indices)) {
        throw new Error('findByText did not return array');
      }

      if (indices.length !== 3) {
        throw new Error(`Expected to find 3 platforms, got ${indices.length} at positions: ${indices.join(', ')}`);
      }

      const expectedIndices = [1, 2, 3];
      const allMatch = expectedIndices.every((idx, i) => indices[i] === idx);

      if (!allMatch) {
        throw new Error(`Position mismatch. Expected: ${expectedIndices.join(', ')}, Got: ${indices.join(', ')}`);
      }

      console.log(`     Found platforms at positions: ${indices.join(', ')}`);
    }, page);

    testResults.push({ name: 'findByText with multiple searches', ...test12 });
    if (test12.passed) {
      console.log('  ✅ findByText works with multiple searches');
      passed++;
    } else {
      console.log(`  ❌ findByText with multiple searches failed: ${test12.error}`);
      failed++;
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tests: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\n✅ DOM helpers are properly integrated with Puppeteer');
      console.log('✅ Helper functions return expected data structures');
      console.log('✅ DOM helpers can access and read DOM elements from pages');
      console.log('✅ Tests pass when run in isolation');
      console.log('✅ Tests have proper setup and teardown for reliable execution');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nFailed tests:');
      testResults.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    return failed === 0 ? 0 : 1;

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);

    // Ensure cleanup even on fatal errors
    await teardownTestEnvironment(browser, page);
    return 1;

  } finally {
    // Teardown: Clean up browser and test resources
    // This runs regardless of test results to ensure no resource leaks
    if (browser || page) {
      await teardownTestEnvironment(browser, page);
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for use as module
module.exports = { runTests };