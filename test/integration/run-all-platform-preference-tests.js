/**
 * Platform Preference Test Suite Runner - BF-5hjs5
 *
 * This script runs all platform preference tests as a suite.
 * Each test can also be run independently.
 *
 * Usage:
 *   node test/integration/run-all-platform-preference-tests.js
 *
 * Individual tests:
 *   node test/integration/first-platform-preference-test.js
 *   node test/integration/twitter-platform-preference-test.js
 *   node test/integration/facebook-platform-preference-test.js
 *   node test/integration/pinterest-platform-preference-test.js
 *   node test/integration/multiple-platform-preference-test.js
 */

const path = require('path');
const { execSync } = require('child_process');

// Test configurations
const TESTS = [
  {
    name: 'First Platform Preference Test (Reddit)',
    file: 'first-platform-preference-test.js',
    platform: 'reddit',
    description: 'Original test for Reddit platform preference'
  },
  {
    name: 'Twitter Platform Preference Test',
    file: 'twitter-platform-preference-test.js',
    platform: 'twitter',
    description: 'Twitter as favorite platform'
  },
  {
    name: 'Facebook Platform Preference Test',
    file: 'facebook-platform-preference-test.js',
    platform: 'facebook',
    description: 'Facebook as favorite platform'
  },
  {
    name: 'Pinterest Platform Preference Test',
    file: 'pinterest-platform-preference-test.js',
    platform: 'pinterest',
    description: 'Pinterest as favorite platform'
  },
  {
    name: 'Multiple Platform Preference Test',
    file: 'multiple-platform-preference-test.js',
    platform: 'twitter, facebook',
    description: 'Twitter and Facebook as favorite platforms'
  }
];

// Results tracking
const SUITE_RESULTS = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {}
};

/**
 * Run a single test
 */
function runTest(testConfig) {
  console.log('\n' + '='.repeat(70));
  console.log(`Running: ${testConfig.name}`);
  console.log('='.repeat(70));
  console.log(`Platform: ${testConfig.platform}`);
  console.log(`Description: ${testConfig.description}`);
  console.log(`File: ${testConfig.file}`);
  console.log('='.repeat(70) + '\n');

  try {
    const testPath = path.join(__dirname, testConfig.file);
    const startTime = Date.now();

    execSync(`node "${testPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..')
    });

    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(70));
    console.log(`✅ ${testConfig.name} - PASSED`);
    console.log('='.repeat(70) + '\n');

    return {
      name: testConfig.name,
      platform: testConfig.platform,
      passed: true,
      duration
    };

  } catch (error) {
    const duration = Date.now() - Date.now();

    console.log('\n' + '='.repeat(70));
    console.log(`❌ ${testConfig.name} - FAILED`);
    console.log('='.repeat(70) + '\n');

    return {
      name: testConfig.name,
      platform: testConfig.platform,
      passed: false,
      duration,
      error: error.message
    };
  }
}

/**
 * Main suite execution
 */
async function runSuite() {
  console.log('\n' + '='.repeat(70));
  console.log('PLATFORM PREFERENCE TEST SUITE - BF-5hjs5');
  console.log('='.repeat(70));
  console.log(`Started at: ${SUITE_RESULTS.startTime}`);
  console.log(`Total tests: ${TESTS.length}`);
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;
  const totalDuration = 0;

  // Run each test
  for (const test of TESTS) {
    const startTime = Date.now();
    const result = runTest(test);
    const duration = Date.now() - startTime;

    result.duration = duration;

    SUITE_RESULTS.tests.push(result);

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  // Calculate summary
  SUITE_RESULTS.endTime = new Date().toISOString();
  SUITE_RESULTS.summary = {
    total: TESTS.length,
    passed,
    failed,
    passRate: ((passed / TESTS.length) * 100).toFixed(2) + '%'
  };

  // Print suite summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUITE SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${SUITE_RESULTS.summary.total}`);
  console.log(`✅ Passed: ${SUITE_RESULTS.summary.passed}`);
  console.log(`❌ Failed: ${SUITE_RESULTS.summary.failed}`);
  console.log(`Pass Rate: ${SUITE_RESULTS.summary.passRate}`);
  console.log(`Duration: ${new Date(SUITE_RESULTS.endTime) - new Date(SUITE_RESULTS.startTime)}ms`);
  console.log('='.repeat(70));

  // List all test results
  console.log('\nIndividual Test Results:');
  console.log('-'.repeat(70));
  SUITE_RESULTS.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    const platform = test.platform ? ` [${test.platform.toUpperCase()}]` : '';
    console.log(`${icon} ${test.name}${platform} - ${test.duration}ms`);
  });
  console.log('-'.repeat(70) + '\n');

  // List failed tests
  if (failed > 0) {
    console.log('\nFailed Tests:');
    SUITE_RESULTS.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}: ${test.error || 'Unknown error'}`);
    });
    console.log('');
  }

  // Save suite results
  const fs = require('fs');
  const resultsDir = path.join(__dirname, '..', '..', 'test-results');
  const resultsPath = path.join(resultsDir, `platform-preference-test-suite.json`);

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(resultsPath, JSON.stringify(SUITE_RESULTS, null, 2));
  console.log(`📄 Suite results saved to: ${resultsPath}\n`);

  // Final message
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✅ All platform preference tests pass successfully');
    console.log('✅ DOM inspection helpers work correctly across all platforms');
    console.log('✅ Tests can be run independently or as a suite');
    console.log('✅ Minimum 3 test configurations exceeded (5 total tests)');
    console.log('\nTest Configurations:');
    TESTS.forEach(test => {
      console.log(`  - ${test.name}: ${test.platform}`);
    });
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log(`\n${failed} of ${TESTS.length} tests failed.`);
  }

  console.log('='.repeat(70) + '\n');

  return failed === 0 ? 0 : 1;
}

// Run the suite
runSuite().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('\n❌ Suite execution failed:', error);
  process.exit(1);
});
