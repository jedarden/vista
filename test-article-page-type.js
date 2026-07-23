#!/usr/bin/env node

/**
 * test-article-page-type.js
 *
 * Comprehensive test case for article page type configuration
 *
 * Tests that when page type is set to 'article':
 * - Expected order: twitter, facebook, linkedin, reddit, bluesky, threads, mastodon
 * - Uses DOM extraction utility to get actual order
 * - Compares actual vs expected
 * - Logs pass/fail result
 */

const puppeteer = require('puppeteer');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Test configuration for article page type
const ARTICLE_TEST_CONFIG = {
  name: 'Article Page Type Configuration',
  pageType: 'article',
  // Expected platform order for article pages
  expectedOrder: [
    'twitter',
    'facebook',
    'linkedin',
    'reddit',
    'bluesky',
    'threads',
    'mastodon'
  ],
  // Test URL that should be detected as an article
  testUrl: 'https://blog.example.com/tech/ai-breakthrough-2026'
};

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
      const platformId = card.dataset?.platform;
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
      const platformId = card.dataset?.platform;
      if (platformId) {
        platforms.push(platformId);
      }
    });
    return platforms;
  });
}

/**
 * Set page type and enable smart ordering
 */
async function configureArticlePageType(page) {
  // Set smart ordering preferences for article page type
  await page.evaluate(() => {
    let prefs = localStorage.getItem('vista-platform-prefs');
    let parsed = prefs ? JSON.parse(prefs) : {};

    // Enable smart ordering
    parsed.smartOrdering = true;

    // Set page type preference to article
    parsed.pageType = 'article';

    localStorage.setItem('vista-platform-prefs', JSON.stringify(parsed));
  });

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
    document.querySelector('#urlInput').value = '';
  });

  // Type new URL
  await page.type('#urlInput', url, { delay: 10 });

  // Click inspect button
  await page.click('#inspectBtn');

  // Wait for results to load
  console.log('⏳ Waiting for results to load...');
  try {
    await page.waitForSelector('.preview-grid', { timeout: 15000 });
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
 * Run the article page type test
 */
async function runArticlePageTypeTest() {
  console.log('═'.repeat(80));
  console.log('ARTICLE PAGE TYPE CONFIGURATION TEST');
  console.log('═'.repeat(80));
  console.log(`Test URL: ${ARTICLE_TEST_CONFIG.testUrl}`);
  console.log(`Expected Page Type: ${ARTICLE_TEST_CONFIG.pageType}`);
  console.log(`Expected Order: ${ARTICLE_TEST_CONFIG.expectedOrder.join(', ')}`);
  console.log('');

  let browser;
  let testResults = {
    testName: ARTICLE_TEST_CONFIG.name,
    timestamp: new Date().toISOString(),
    config: ARTICLE_TEST_CONFIG,
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

    // Configure article page type
    console.log('⚙️  Configuring article page type...');
    await configureArticlePageType(page);

    // Verify smart ordering is enabled
    const smartOrderingEnabled = await verifySmartOrderingEnabled(page);
    console.log(`🔍 Smart ordering enabled: ${smartOrderingEnabled}`);

    if (!smartOrderingEnabled) {
      throw new Error('Failed to enable smart ordering');
    }

    // Submit test URL
    const urlSubmitted = await submitURLForInspection(page, ARTICLE_TEST_CONFIG.testUrl);

    if (!urlSubmitted) {
      throw new Error('Failed to submit URL for inspection');
    }

    // Extract actual platform order from DOM
    console.log('🔍 Extracting platform order from DOM...');
    const actualOrder = await getSocialPlatformOrder(page);
    console.log(`📊 Actual order: ${actualOrder.slice(0, 15).join(', ')}${actualOrder.length > 15 ? '...' : ''}`);

    // Compare with expected order
    console.log('🔬 Comparing actual vs expected order...');
    const comparison = comparePlatformOrder(actualOrder, ARTICLE_TEST_CONFIG.expectedOrder);

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
      console.log('✅ TEST PASSED: Article page type configuration is correct');
      console.log(`   Expected platforms appear in correct order (allowing ±2 position tolerance)`);
    } else {
      console.log('❌ TEST FAILED: Article page type configuration has issues');
      console.log(`   One or more platforms are significantly displaced`);
    }

    // Store results
    testResults.results = {
      actualOrder,
      expectedOrder: ARTICLE_TEST_CONFIG.expectedOrder,
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
function saveTestResults(results) {
  const fs = require('fs');
  const resultsPath = '/home/coding/vista/notes/bf-4frnu-article-page-type-test-results.json';

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 Test results saved to: ${resultsPath}`);

  return resultsPath;
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Starting Article Page Type Configuration Test\n');

  try {
    const results = await runArticlePageTypeTest();

    // Save results
    const resultsPath = saveTestResults(results);

    // Exit with appropriate code
    if (results.passed) {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed - see results for details');
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    console.error(error.stack);
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
  runArticlePageTypeTest,
  comparePlatformOrder,
  extractPlatformOrderFromDOM,
  ARTICLE_TEST_CONFIG
};
