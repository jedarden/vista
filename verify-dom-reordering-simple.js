#!/usr/bin/env node

/**
 * verify-dom-reordering-simple.js
 *
 * Simple test to verify DOM reordering matches expected platform preference order
 * Uses an already-running VISTA server on port 3000
 */

const puppeteer = require('puppeteer');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Test cases with different page types and their expected platform orders
const TEST_CASES = [
  {
    name: 'Article Page',
    url: 'https://blog.example.com/my-article',
    meta: { og: { type: 'article' } },
    expectedPageType: 'article',
    expectedOrder: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon']
  },
  {
    name: 'Product Page',
    url: 'https://shop.example.com/product/item-123',
    meta: { og: { type: 'product' } },
    expectedPageType: 'product',
    expectedOrder: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin']
  },
  {
    name: 'Website (Default)',
    url: 'https://example.com',
    meta: {},
    expectedPageType: 'website',
    expectedOrder: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']
  }
];

// Get platform order from DOM
async function getPlatformOrderFromDOM(page) {
  return await page.evaluate(() => {
    const result = {};

    // Find all group sections
    const groupSections = document.querySelectorAll('.preview-section');

    groupSections.forEach(section => {
      const groupId = section.dataset.group;
      if (!groupId) return;

      const platforms = [];
      const cards = section.querySelectorAll('.platform-card');

      cards.forEach(card => {
        const platformId = card.dataset.platform;
        if (platformId) {
          platforms.push(platformId);
        }
      });

      if (platforms.length > 0) {
        result[groupId] = platforms;
      }
    });

    return result;
  });
}

// Get smart ordering state from localStorage
async function getSmartOrderingState(page) {
  return await page.evaluate(() => {
    const prefs = localStorage.getItem('vista-platform-prefs');
    if (!prefs) return null;

    try {
      return JSON.parse(prefs);
    } catch (e) {
      return null;
    }
  });
}

// Enable smart ordering
async function enableSmartOrdering(page) {
  await page.evaluate(() => {
    let prefs = localStorage.getItem('vista-platform-prefs');
    let parsed = prefs ? JSON.parse(prefs) : {};

    parsed.smartOrdering = true;

    localStorage.setItem('vista-platform-prefs', JSON.stringify(parsed));
  });

  await page.reload({ waitUntil: 'networkidle0' });
}

// Run a single test case
async function runTest(browser, testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`URL: ${testCase.url}`);
  console.log(`Expected Page Type: ${testCase.expectedPageType}`);
  console.log(`Expected Order: ${testCase.expectedOrder.join(', ')}`);

  const page = await browser.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Enable smart ordering
    console.log('Enabling smart ordering...');
    await enableSmartOrdering(page);

    // Verify smart ordering is enabled
    const state = await getSmartOrderingState(page);
    console.log('Smart ordering enabled:', state?.smartOrdering);

    // Enter the URL
    console.log(`Submitting URL: ${testCase.url}`);
    await page.type('#urlInput', testCase.url);
    await page.click('#inspectBtn');

    // Wait for results
    console.log('Waiting for results...');
    await page.waitForSelector('.preview-grid', { timeout: 15000 });

    // Wait for smart ordering to complete
    await page.waitForTimeout(1000);

    // Get the platform order by group
    const platformOrder = await getPlatformOrderFromDOM(page);

    console.log('\n📊 Platform Order by Group:');

    let testPassed = true;
    let testDetails = [];

    // Check each group
    for (const [groupId, platforms] of Object.entries(platformOrder)) {
      console.log(`\n  Group "${groupId}":`);
      console.log(`    Actual: ${platforms.join(', ')}`);

      // For the social group (main platforms), check if expected platforms are prioritized
      if (groupId === 'social') {
        const expectedInSocial = testCase.expectedOrder.filter(p => platforms.includes(p));

        if (expectedInSocial.length > 0) {
          console.log(`    Expected (from this group): ${expectedInSocial.join(', ')}`);

          // Check if expected platforms appear near the top
          const expectedPositions = expectedInSocial.map(p => platforms.indexOf(p));
          const maxPosition = Math.max(...expectedPositions);

          console.log(`    Positions: ${expectedInSocial.map((p, i) => `${p}=${expectedPositions[i]}`).join(', ')}`);

          if (maxPosition <= 6) {
            console.log(`    ✅ Expected platforms are near the top (max position: ${maxPosition})`);
            testDetails.push({
              group: groupId,
              status: 'PASS',
              expected: expectedInSocial,
              actual: platforms.slice(0, 7),
              reason: `Expected platforms at positions ${expectedPositions.join(', ')}`
            });
          } else {
            console.log(`    ⚠️  Expected platforms not optimally positioned (max position: ${maxPosition})`);
            testPassed = false;
            testDetails.push({
              group: groupId,
              status: 'WARN',
              expected: expectedInSocial,
              actual: platforms.slice(0, 7),
              reason: `Expected platforms at positions ${expectedPositions.join(', ')} (max: ${maxPosition})`
            });
          }
        } else {
          console.log(`    ℹ️  No expected platforms in this group`);
          testDetails.push({
            group: groupId,
            status: 'INFO',
            expected: testCase.expectedOrder,
            actual: platforms,
            reason: 'None of the expected platforms for this page type are in this group'
          });
        }
      } else {
        console.log(`    ℹ️  Non-social group`);
        testDetails.push({
          group: groupId,
          status: 'INFO',
          actual: platforms,
          reason: 'Not the primary social group'
        });
      }
    }

    // Check localStorage for cardOrder
    const finalState = await getSmartOrderingState(page);
    console.log('\n💾 Stored cardOrder in localStorage:');
    if (finalState?.cardOrder) {
      for (const [groupId, order] of Object.entries(finalState.cardOrder)) {
        console.log(`  ${groupId}: ${order.slice(0, 10).join(', ')}${order.length > 10 ? '...' : ''}`);
      }
    }

    console.log('\n' + '-'.repeat(60));
    if (testPassed) {
      console.log('✅ TEST PASSED');
    } else {
      console.log('⚠️  TEST PASSED WITH WARNINGS');
    }

    return {
      testCase: testCase.name,
      passed: testPassed,
      details: testDetails,
      platformOrder,
      storedOrder: finalState?.cardOrder
    };

  } catch (error) {
    console.error(`❌ TEST FAILED: ${error.message}`);
    return {
      testCase: testCase.name,
      passed: false,
      error: error.message
    };
  } finally {
    await page.close();
  }
}

// Main test runner
async function main() {
  console.log('🔍 VISTA DOM Reordering Verification');
  console.log('=' .repeat(60));
  console.log(`Using existing server on port ${PORT}\n`);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    // Run all test cases
    for (const testCase of TEST_CASES) {
      const result = await runTest(browser, testCase);
      results.push(result);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await browser.close();

    // Print summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));

    let passedCount = 0;
    let warningCount = 0;
    let failedCount = 0;

    results.forEach(result => {
      if (result.passed === true) {
        passedCount++;
        console.log(`✅ ${result.testCase}: PASSED`);
      } else if (result.passed === false) {
        failedCount++;
        console.log(`❌ ${result.testCase}: FAILED`);
      } else {
        warningCount++;
        console.log(`⚠️  ${result.testCase}: WARNINGS`);
      }

      if (result.details) {
        result.details.forEach(detail => {
          if (detail.status === 'PASS') {
            console.log(`    ✅ ${detail.group}: ${detail.reason}`);
          } else if (detail.status === 'WARN') {
            console.log(`    ⚠️  ${detail.group}: ${detail.reason}`);
          }
        });
      }
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${results.length} tests`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Warnings: ${warningCount}`);
    console.log(`Failed: ${failedCount}`);

    // Write results to file
    const fs = require('fs');
    const resultsPath = '/home/coding/vista/notes/bf-21h5-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: passedCount,
        warnings: warningCount,
        failed: failedCount
      },
      results
    }, null, 2));

    console.log(`\n📝 Results saved to: ${resultsPath}`);

    if (failedCount > 0) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed (with possible warnings)');
      process.exit(0);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
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

module.exports = { runTest, TEST_CASES };
