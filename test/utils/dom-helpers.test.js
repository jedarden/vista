/**
 * Unit tests for DOM Helper Utilities
 *
 * These tests verify that the utility functions work correctly.
 * Note: Full integration tests would require a running browser.
 */

const {
  compareOrders
} = require('./dom-helpers');

/**
 * Test suite for compareOrders
 */
function testCompareOrders() {
  console.log('Testing compareOrders...');

  const tests = [
    {
      name: 'Perfect match',
      expected: ['twitter', 'facebook', 'linkedin'],
      actual: ['twitter', 'facebook', 'linkedin'],
      expectedPassed: true,
      expectedMatches: 3
    },
    {
      name: 'Complete mismatch',
      expected: ['twitter', 'facebook', 'linkedin'],
      actual: ['reddit', 'pinterest', 'instagram'],
      expectedPassed: false,
      expectedMatches: 0
    },
    {
      name: 'Partial match',
      expected: ['twitter', 'facebook', 'linkedin'],
      actual: ['twitter', 'linkedin', 'facebook'],
      expectedPassed: false,
      expectedMatches: 1
    },
    {
      name: 'Extra actual platforms',
      expected: ['twitter', 'facebook'],
      actual: ['twitter', 'facebook', 'linkedin', 'reddit'],
      expectedPassed: false,
      expectedMatches: 2
    },
    {
      name: 'Missing actual platforms',
      expected: ['twitter', 'facebook', 'linkedin', 'reddit'],
      actual: ['twitter', 'facebook'],
      expectedPassed: false,
      expectedMatches: 2
    },
    {
      name: 'Empty arrays',
      expected: [],
      actual: [],
      expectedPassed: true,
      expectedMatches: 0
    },
    {
      name: 'Expected empty, actual has items',
      expected: [],
      actual: ['twitter'],
      expectedPassed: false,
      expectedMatches: 0
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = compareOrders(test.expected, test.actual);

      const passedMatch = result.matches === test.expectedMatches;
      const passedResult = result.passed === test.expectedPassed;

      if (passedMatch && passedResult) {
        console.log(`  ✓ ${test.name}`);
        passed++;
      } else {
        console.log(`  ✗ ${test.name}`);
        console.log(`    Expected matches: ${test.expectedMatches}, got: ${result.matches}`);
        console.log(`    Expected passed: ${test.expectedPassed}, got: ${result.passed}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n  Passed: ${passed}/${tests.length}`);
  console.log(`  Failed: ${failed}/${tests.length}`);

  return { passed, failed, total: tests.length };
}

/**
 * Test suite for error handling
 */
function testErrorHandling() {
  console.log('\nTesting error handling...');

  const tests = [
    {
      name: 'Null expected',
      expected: null,
      actual: ['twitter'],
      shouldThrow: true
    },
    {
      name: 'Null actual',
      expected: ['twitter'],
      actual: null,
      shouldThrow: true
    },
    {
      name: 'Non-array expected',
      expected: 'twitter',
      actual: ['twitter'],
      shouldThrow: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      compareOrders(test.expected, test.actual);

      if (test.shouldThrow) {
        console.log(`  ✗ ${test.name} - Should have thrown error`);
        failed++;
      } else {
        console.log(`  ✓ ${test.name}`);
        passed++;
      }
    } catch (error) {
      if (test.shouldThrow) {
        console.log(`  ✓ ${test.name} - Threw expected error`);
        passed++;
      } else {
        console.log(`  ✗ ${test.name} - Unexpected error: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n  Passed: ${passed}/${tests.length}`);
  console.log(`  Failed: ${failed}/${tests.length}`);

  return { passed, failed, total: tests.length };
}

/**
 * Test suite for comparison result structure
 */
function testResultStructure() {
  console.log('\nTesting result structure...');

  const result = compareOrders(
    ['twitter', 'facebook', 'linkedin'],
    ['twitter', 'linkedin', 'facebook']
  );

  const requiredFields = ['passed', 'matches', 'total', 'passRate', 'results', 'missing', 'extra'];
  let passed = 0;
  let failed = 0;

  for (const field of requiredFields) {
    if (!(field in result)) {
      console.log(`  ✗ Missing field: ${field}`);
      failed++;
    } else {
      passed++;
    }
  }

  // Check results array structure
  if (Array.isArray(result.results)) {
    let hasAllFields = true;
    const resultFields = ['position', 'expected', 'actual', 'match'];
    for (const field of resultFields) {
      if (!(field in result.results[0])) {
        console.log(`  ✗ Results missing field: ${field}`);
        hasAllFields = false;
        failed++;
      }
    }
    if (hasAllFields) {
      console.log(`  ✓ Results array has correct structure`);
      passed++;
    }
  } else {
    console.log(`  ✗ Results is not an array`);
    failed++;
  }

  console.log(`\n  Passed: ${passed}/${requiredFields.length + 1}`);
  console.log(`  Failed: ${failed}/${requiredFields.length + 1}`);

  return { passed, failed, total: requiredFields.length + 1 };
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('='.repeat(60));
  console.log('DOM Helper Utilities - Unit Tests');
  console.log('='.repeat(60));

  const compareResults = testCompareOrders();
  const errorResults = testErrorHandling();
  const structureResults = testResultStructure();

  const totalPassed = compareResults.passed + errorResults.passed + structureResults.passed;
  const totalFailed = compareResults.failed + errorResults.failed + structureResults.failed;
  const totalTests = compareResults.total + errorResults.total + structureResults.total;

  console.log('\n' + '='.repeat(60));
  console.log('OVERALL RESULTS');
  console.log('='.repeat(60));
  console.log(`Total passed: ${totalPassed}/${totalTests}`);
  console.log(`Total failed: ${totalFailed}/${totalTests}`);
  console.log('='.repeat(60));

  return totalFailed === 0 ? 0 : 1;
}

// Export test runner for use as module
module.exports = { runAllTests };

// Run tests if executed directly
if (require.main === module) {
  const exitCode = runAllTests();
  process.exit(exitCode);
}
