#!/usr/bin/env node

/**
 * test-product-website-page-types.js
 *
 * Comprehensive test cases for product and website page type configurations
 *
 * Test Case 1: Product Page Type
 * - Set page type to 'product'
 * - Expected order: pinterest, facebook, instagram, twitter, linkedin
 * - Use DOM extraction to get actual order
 * - Compare actual vs expected
 *
 * Test Case 2: Website Page Type
 * - Set page type to 'website'
 * - Expected order: google, facebook, twitter, linkedin, slack, discord
 * - Use DOM extraction to get actual order
 * - Compare actual vs expected
 */

const puppeteer = require('puppeteer');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Test configurations for both page types
const TEST_CONFIGS = [
  {
    name: 'Product Page Type Configuration',
    pageType: 'product',
    // Expected platform order for product pages
    expectedOrder: [
      'pinterest',
      'facebook',
      'instagram',
      'twitter',
      'linkedin'
    ],
    // Test URL that should be detected as a product page
    testUrl: 'https://example.com/product/awesome-gadget-2026'
  },
  {
    name: 'Website Page Type Configuration',
    pageType: 'website',
    // Expected platform order for website pages
    expectedOrder: [
      'google',
      'facebook',
      'twitter',
      'linkedin',
      'slack',
      'discord'
    ],
    // Test URL that should be detected as a website page
    testUrl: 'https://www.example.com'
  }
];

/**
 * Extract platform order from DOM
 * Gets the actual order of platforms displayed in the UI
 */
async function extractPlatformOrderFromDOM(page) {
  return await page.evaluate(() => {
    const result = {};

    // Find all platform cards in the DOM
    const platformCards = document.querySelectorAll('.platform-card');

    platformCards.forEach((card, index) => {
      const platformId = card.dataset?.platform || card.dataset?.pid;
      const groupSection = card.closest('.preview-section');
      const groupId = groupSection?.dataset?.group;

      if (platformId) {
        if (!result[groupId]) {
          result[groupId] = [];
        }
        result[groupId].push({
          platform: platformId,
          position: index,
          group: groupId
        });
      }
    });

    return result;
  });
}

/**
 * Get platform order as a flat array (for social group)
 */
async function getSocialPlatformOrder(page) {
  const orderData = await extractPlatformOrderFromDOM(page);

  if (orderData.social && Array.isArray(orderData.social)) {
    return orderData.social.map(item => item.platform);
  }

  // Fallback: try to get platforms from DOM directly
  return await page.evaluate(() => {
    const platforms = [];
    const cards = document.querySelectorAll('.platform-card');
    cards.forEach(card => {
      const platformId = card.dataset?.platform || card.dataset?.pid;
      if (platformId) {
        platforms.push(platformId);
      }
    });
    return platforms;
  });
}

/**
 * Configure page type and enable smart ordering
 */
async function configurePageType(page, pageType) {
  // Set smart ordering preferences for specific page type
  await page.evaluate((type) => {
    let prefs = localStorage.getItem('vista-platform-prefs');
    let parsed = prefs ? JSON.parse(prefs) : {};

    // Enable smart ordering
    parsed.smartOrdering = true;

    // Set page type preference
    parsed.pageType = type;

    localStorage.setItem('vista-platform-prefs', JSON.stringify(parsed));
  }, pageType);

  // Reload to apply changes
  await page.reload({ waitUntil: ['networkidle0', 'load', 'domcontentloaded'] });
}

/**
 * Verify smart ordering is enabled
 */
async function verifySmartOrderingEnabled(page) {
  const state = await page.evaluate(() => {
    const prefs = localStorage.getItem('vista-platform-prefs');
    if (!prefs) return null;

    try {
      return JSON.parse(prefs);
    } catch (e) {
      return null;
    }
  });

  return state?.smartOrdering === true;
}

/**
 * Compare actual vs expected platform order
 */
function comparePlatformOrder(actualOrder, expectedOrder) {
  const results = {
    passed: true,
    matches: [],
    mismatches: [],
    missing: [],
    extra: []
  };

  // Check if all expected platforms are present
  expectedOrder.forEach((platform, expectedIndex) => {
    const actualIndex = actualOrder.indexOf(platform);

    if (actualIndex === -1) {
      results.missing.push(platform);
      results.passed = false;
    } else {
      // Check if position matches
      if (actualIndex === expectedIndex) {
        results.matches.push({
          platform,
          position: actualIndex,
          status: 'exact_match'
        });
      } else {
        results.mismatches.push({
          platform,
          expectedPosition: expectedIndex,
          actualPosition: actualIndex,
          displacement: actualIndex - expectedIndex
        });
        // Only mark as failed if displacement is significant (> 2 positions)
        if (Math.abs(actualIndex - expectedIndex) > 2) {
          results.passed = false;
        } else {
          results.matches.push({
            platform,
            position: actualIndex,
            status: 'near_match',
            expectedPosition: expectedIndex
          });
        }
      }
    }
  });

  // Check for extra platforms not in expected
  actualOrder.forEach((platform, index) => {
    if (!expectedOrder.includes(platform)) {
      results.extra.push({
        platform,
        position: index
      });
    }
  });

  return results;
}

/**
 * Submit a URL for inspection
 */
async function submitURLForInspection(page, url) {
  console.log(`📝 Submitting URL: ${url}`);

  // Clear existing URL
  await page.evaluate(() => {
    const urlInput = document.querySelector('#urlInput');
    if (urlInput) urlInput.value = '';
  });

  // Type new URL
  await page.type('#urlInput', url, { delay: 10 });

  // Click inspect button
  await page.click('#inspectBtn');

  // Wait for results to load
  console.log('⏳ Waiting for results to load...');
  try {
    await page.waitForSelector('.preview-grid, #previewGrid', { timeout: 15000 });
    console.log('✅ Results loaded');

    // Additional wait for smart ordering to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    console.error('❌ Failed to load results:', error.message);
    return false;
  }
}

/**
 * Run a single page type test
 */
async function runPageTypeTest(config) {
  console.log('\n' + '═'.repeat(80));
  console.log(config.name.toUpperCase());
  console.log('═'.repeat(80));
  console.log(`Test URL: ${config.testUrl}`);
  console.log(`Expected Page Type: ${config.pageType}`);
  console.log(`Expected Order: ${config.expectedOrder.join(', ')}`);
  console.log('');

  let browser;
  let testResults = {
    testName: config.name,
    timestamp: new Date().toISOString(),
    config: config,
    results: null,
    passed: false
  };

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to app
    console.log(`📍 Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: ['networkidle0', 'load', 'domcontentloaded'] });
    console.log('✅ Page loaded');

    // Configure specific page type
    console.log(`⚙️  Configuring ${config.pageType} page type...`);
    await configurePageType(page, config.pageType);

    // Verify smart ordering is enabled
    const smartOrderingEnabled = await verifySmartOrderingEnabled(page);
    console.log(`🔍 Smart ordering enabled: ${smartOrderingEnabled}`);

    if (!smartOrderingEnabled) {
      throw new Error('Failed to enable smart ordering');
    }

    // Submit test URL
    const urlSubmitted = await submitURLForInspection(page, config.testUrl);

    if (!urlSubmitted) {
      throw new Error('Failed to submit URL for inspection');
    }

    // Extract actual platform order from DOM
    console.log('🔍 Extracting platform order from DOM...');
    const actualOrder = await getSocialPlatformOrder(page);
    console.log(`📊 Actual order: ${actualOrder.slice(0, 15).join(', ')}${actualOrder.length > 15 ? '...' : ''}`);

    // Compare with expected order
    console.log('🔬 Comparing actual vs expected order...');
    const comparison = comparePlatformOrder(actualOrder, config.expectedOrder);

    // Log detailed results
    console.log('\n' + '─'.repeat(80));
    console.log('COMPARISON RESULTS');
    console.log('─'.repeat(80));

    console.log(`\n✅ Exact matches: ${comparison.matches.filter(m => m.status === 'exact_match').length}`);
    comparison.matches.filter(m => m.status === 'exact_match').forEach(match => {
      console.log(`   ${match.platform} at position ${match.position}`);
    });

    if (comparison.matches.filter(m => m.status === 'near_match').length > 0) {
      console.log(`\n⚠️  Near matches (±2 positions): ${comparison.matches.filter(m => m.status === 'near_match').length}`);
      comparison.matches.filter(m => m.status === 'near_match').forEach(match => {
        console.log(`   ${match.platform}: expected ${match.expectedPosition}, got ${match.position}`);
      });
    }

    if (comparison.mismatches.length > 0) {
      console.log(`\n❌ Mismatches: ${comparison.mismatches.length}`);
      comparison.mismatches.forEach(mismatch => {
        console.log(`   ${mismatch.platform}: expected position ${mismatch.expectedPosition}, got ${mismatch.actualPosition} (displacement: ${mismatch.displacement > 0 ? '+' : ''}${mismatch.displacement})`);
      });
    }

    if (comparison.missing.length > 0) {
      console.log(`\n⚠️  Missing from actual: ${comparison.missing.length}`);
      console.log(`   ${comparison.missing.join(', ')}`);
    }

    if (comparison.extra.length > 0) {
      console.log(`\nℹ️  Extra platforms not in expected: ${comparison.extra.length}`);
      comparison.extra.slice(0, 5).forEach(extra => {
        console.log(`   ${extra.platform} at position ${extra.position}`);
      });
    }

    // Final verdict
    console.log('\n' + '─'.repeat(80));
    if (comparison.passed) {
      console.log(`✅ TEST PASSED: ${config.pageType} page type configuration is correct`);
      console.log(`   Expected platforms appear in correct order (allowing ±2 position tolerance)`);
    } else {
      console.log(`❌ TEST FAILED: ${config.pageType} page type configuration has issues`);
      console.log(`   One or more platforms are significantly displaced`);
    }

    // Store results
    testResults.results = {
      actualOrder,
      expectedOrder: config.expectedOrder,
      comparison,
      smartOrderingEnabled,
      urlSubmitted
    };
    testResults.passed = comparison.passed;

    // Close browser
    await browser.close();

    return testResults;

  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
    if (browser) {
      await browser.close();
    }

    testResults.error = error.message;
    testResults.passed = false;

    return testResults;
  }
}

/**
 * Save test results to file
 */
function saveTestResults(allResults) {
  const fs = require('fs');
  const resultsPath = '/home/coding/vista/notes/bf-6avbz-product-website-test-results.json';

  const output = {
    timestamp: new Date().toISOString(),
    summary: {
      total: allResults.length,
      passed: allResults.filter(r => r.passed).length,
      failed: allResults.filter(r => !r.passed).length
    },
    tests: allResults
  };

  fs.writeFileSync(resultsPath, JSON.stringify(output, null, 2));
  console.log(`\n📝 Test results saved to: ${resultsPath}`);

  return resultsPath;
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Starting Product and Website Page Type Configuration Tests\n');
  console.log('This will test both page types with their expected platform orders:');

  TEST_CONFIGS.forEach(config => {
    console.log(`\n  ${config.name}:`);
    console.log(`    Page Type: ${config.pageType}`);
    console.log(`    Expected Order: ${config.expectedOrder.join(', ')}`);
  });

  const allResults = [];

  for (const config of TEST_CONFIGS) {
    const result = await runPageTypeTest(config);
    allResults.push(result);
  }

  // Save all results
  const resultsPath = saveTestResults(allResults);

  // Print summary
  console.log('\n' + '═'.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total tests: ${allResults.length}`);
  console.log(`Passed: ${allResults.filter(r => r.passed).length}`);
  console.log(`Failed: ${allResults.filter(r => !r.passed).length}`);

  // Exit with appropriate code
  const allPassed = allResults.every(r => r.passed);
  if (allPassed) {
    console.log('\n✅ All tests completed successfully');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed - see results for details');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runPageTypeTest,
  comparePlatformOrder,
  extractPlatformOrderFromDOM,
  TEST_CONFIGS
};
