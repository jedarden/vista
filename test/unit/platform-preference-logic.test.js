/**
 * Platform Preference Logic Unit Tests - BF-4a7et
 *
 * Unit tests for platform preference core logic that don't require browser automation.
 * Tests the normalizePlatformIds function and related utility functions.
 *
 * Usage: node test/unit/platform-preference-logic.test.js
 */

const {
  normalizePlatformIds
} = require('../../change-platform-preferences');

const RESULTS = {
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
    console.log(`    Expected: ${details}`);
  }
}

/**
 * Assert equality
 */
function assertEqual(actual, expected, testName) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  logTest(testName, passed, passed ? '' : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  return passed;
}

/**
 * Assert array includes
 */
function assertIncludes(array, item, testName) {
  const passed = array.includes(item);
  logTest(testName, passed, passed ? `${item} found in array` : `${item} not found in ${JSON.stringify(array)}`);
  return passed;
}

/**
 * Run all tests
 */
function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Platform Preference Logic Unit Tests - BF-4a7et');
  console.log('='.repeat(60));
  console.log(`Started at: ${RESULTS.startTime}`);
  console.log('='.repeat(60) + '\n');

  let allPassed = true;

  // Test 1: normalizePlatformIds with lowercase inputs
  console.log('Test Group 1: normalizePlatformIds Basic Functionality\n');
  try {
    const input = ['twitter', 'facebook', 'linkedin'];
    const expected = ['twitter', 'facebook', 'linkedin'];
    const result = normalizePlatformIds(input);
    const passed = assertEqual(result, expected, 'Lowercase platform names remain unchanged');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Lowercase platform names remain unchanged', false, error.message);
    allPassed = false;
  }

  // Test 2: normalizePlatformIds with mixed case
  try {
    const input = ['Twitter', 'FACEBOOK', 'LinkedIn'];
    const expected = ['twitter', 'facebook', 'linkedin'];
    const result = normalizePlatformIds(input);
    const passed = assertEqual(result, expected, 'Mixed case platform names are normalized to lowercase');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Mixed case platform names are normalized to lowercase', false, error.message);
    allPassed = false;
  }

  // Test 3: normalizePlatformIds with platform aliases (X -> Twitter)
  try {
    const input = ['x', 'X'];
    const expected = ['twitter', 'twitter'];
    const result = normalizePlatformIds(input);
    const passed = assertEqual(result, expected, 'Platform alias "X" is normalized to "twitter"');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Platform alias "X" is normalized to "twitter"', false, error.message);
    allPassed = false;
  }

  // Test 4: normalizePlatformIds with valid platform names
  console.log('\nTest Group 2: normalizePlatformIds Platform Coverage\n');
  try {
    const platforms = ['reddit', 'telegram', 'discord', 'slack', 'whatsapp'];
    const result = normalizePlatformIds(platforms);
    const passed = assertEqual(result, platforms, 'All valid platform IDs are preserved');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('All valid platform IDs are preserved', false, error.message);
    allPassed = false;
  }

  // Test 5: normalizePlatformIds with new/unknown platforms
  try {
    const input = ['unknown_platform', 'new_social_app'];
    const expected = ['unknown_platform', 'new_social_app'];
    const result = normalizePlatformIds(input);
    const passed = assertEqual(result, expected, 'Unknown platform names pass through as lowercase');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Unknown platform names pass through as lowercase', false, error.message);
    allPassed = false;
  }

  // Test 6: Reddit platform ID normalization
  console.log('\nTest Group 3: Reddit Platform Specific Tests\n');
  try {
    const variations = ['reddit', 'Reddit', 'REDDIT'];
    const result = normalizePlatformIds(variations);
    const expected = ['reddit', 'reddit', 'reddit'];
    const passed = assertEqual(result, expected, 'Reddit platform ID normalizes correctly');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Reddit platform ID normalizes correctly', false, error.message);
    allPassed = false;
  }

  // Test 7: Reddit is included in platform list
  try {
    const platforms = ['reddit', 'twitter', 'facebook'];
    const result = normalizePlatformIds(platforms);
    const hasReddit = result.includes('reddit');
    logTest('Reddit is included in platform list', hasReddit, hasReddit ? 'Reddit found in normalized list' : 'Reddit not found');
    allPassed = allPassed && hasReddit;
  } catch (error) {
    logTest('Reddit is included in platform list', false, error.message);
    allPassed = false;
  }

  // Test 8: Empty array handling
  console.log('\nTest Group 4: Edge Cases\n');
  try {
    const input = [];
    const expected = [];
    const result = normalizePlatformIds(input);
    const passed = assertEqual(result, expected, 'Empty array returns empty array');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Empty array returns empty array', false, error.message);
    allPassed = false;
  }

  // Test 9: Single platform
  try {
    const input = ['reddit'];
    const expected = ['reddit'];
    const result = normalizePlatformIds(input);
    const passed = assertEqual(result, expected, 'Single platform array works correctly');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Single platform array works correctly', false, error.message);
    allPassed = false;
  }

  // Test 10: Large array handling
  try {
    const input = ['reddit', 'twitter', 'facebook', 'linkedin', 'telegram', 'discord', 'slack', 'whatsapp', 'signal', 'teams'];
    const result = normalizePlatformIds(input);
    const passed = result.length === input.length && result.every((r, i) => r === input[i].toLowerCase());
    logTest('Large platform array is handled correctly', passed, passed ? `${result.length} platforms normalized` : 'Normalization failed');
    allPassed = allPassed && passed;
  } catch (error) {
    logTest('Large platform array is handled correctly', false, error.message);
    allPassed = false;
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
  console.log(`Total Tests: ${RESULTS.summary.total}`);
  console.log(`Passed: ${RESULTS.summary.passed}`);
  console.log(`Failed: ${RESULTS.summary.failed}`);
  console.log('='.repeat(60) + '\n');

  if (RESULTS.summary.failed > 0) {
    console.log('Failed Tests:');
    RESULTS.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.test}: ${t.details}`);
    });
    console.log('');
  }

  // Save results
  const fs = require('fs');
  const path = require('path');
  const resultsDir = path.join(__dirname, '..', '..', 'test-results');
  const resultsPath = path.join(resultsDir, 'platform-preference-logic-unit-test.json');

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));
  console.log(`📄 Results saved to: ${resultsPath}\n`);

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests();
