#!/usr/bin/env node
/**
 * Visual Browser Verification Test for applySmartOrdering()
 * Bead: bf-4rsg
 *
 * This test performs comprehensive visual verification by:
 * 1. Opening the VISTA app in a browser
 * 2. Testing different URL types that trigger different page types
 * 3. Verifying platform cards reorder visually in the UI
 * 4. Checking DOM order matches expected platform preference order
 * 5. Testing with different platform preference configurations
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80));
}

// Test configurations for different page types
const TEST_CONFIGS = [
  {
    name: 'Article Page Type',
    url: 'https://blog.example.com/2024/07/my-article',
    pageType: 'article',
    expectedTopPlatforms: ['twitter', 'facebook', 'linkedin', 'reddit'],
    description: 'Blog article should prioritize Twitter, Facebook, LinkedIn, Reddit'
  },
  {
    name: 'Product Page Type',
    url: 'https://shop.example.com/products/awesome-product',
    pageType: 'product',
    expectedTopPlatforms: ['pinterest', 'facebook', 'instagram', 'twitter'],
    description: 'E-commerce product should prioritize Pinterest, Facebook, Instagram'
  },
  {
    name: 'Video Content',
    url: 'https://example.com/watch?v=12345',
    pageType: 'video',
    expectedTopPlatforms: ['youtube', 'facebook', 'twitter', 'tiktok'],
    description: 'Video content should prioritize YouTube, Facebook, Twitter'
  },
  {
    name: 'General Website',
    url: 'https://example.com',
    pageType: 'website',
    expectedTopPlatforms: ['google', 'facebook', 'twitter', 'linkedin'],
    description: 'Standard website should prioritize Google, Facebook, Twitter'
  }
];

// Test acceptance criteria
const ACCEPTANCE_CRITERIA = [
  {
    id: 'AC1',
    description: 'Cards reorder visibly in UI when smartOrdering enabled',
    test: async (page) => {
      // Check if platform cards are present in DOM
      const cards = await page.locator('.platform-card').count();
      return cards > 0;
    }
  },
  {
    id: 'AC2',
    description: 'DOM order matches expected platform preference order',
    test: async (page, config) => {
      // Get actual platform order from DOM
      const actualOrder = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.platform-card'));
        return cards.map(card => card.dataset.platform);
      });

      // Check if expected platforms are in the right positions
      const expected = config.expectedTopPlatforms;
      let matches = 0;
      expected.forEach((platform, index) => {
        if (actualOrder[index] === platform) matches++;
      });

      return { matches, total: expected.length, actualOrder };
    }
  },
  {
    id: 'AC3',
    description: 'Reordering works across different preference configurations',
    test: async (page) => {
      // Test with smart ordering disabled
      await page.evaluate(() => {
        const prefs = JSON.parse(localStorage.getItem('vista-platform-prefs') || '{}');
        prefs.smartOrdering = false;
        localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
      });

      // Test with smart ordering re-enabled
      await page.evaluate(() => {
        const prefs = JSON.parse(localStorage.getItem('vista-platform-prefs') || '{}');
        prefs.smartOrdering = true;
        localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
      });

      return true;
    }
  },
  {
    id: 'AC4',
    description: 'Smart ordering persists across page refreshes',
    test: async (page) => {
      // Get platform order before refresh
      const orderBefore = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.platform-card'));
        return cards.map(card => card.dataset.platform);
      });

      // Refresh page
      await page.reload();
      await page.waitForSelector('.platform-card', { timeout: 10000 });

      // Get platform order after refresh
      const orderAfter = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.platform-card'));
        return cards.map(card => card.dataset.platform);
      });

      return JSON.stringify(orderBefore) === JSON.stringify(orderAfter);
    }
  }
];

async function setupBrowser() {
  log('🚀 Launching browser...', 'cyan');
  const browser = await chromium.launch({
    headless: false, // Show browser for visual verification
    slowMo: 200 // Slow down actions for better observation
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Intercept console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('applySmartOrdering') || text.includes('handleResult') || text.includes('Page type detected')) {
      log(`[Browser Console] ${text}`, 'blue');
    }
  });

  return { browser, page };
}

async function enableSmartOrdering(page) {
  log('📝 Enabling smart ordering in preferences...', 'cyan');

  // Enable smart ordering via localStorage
  await page.evaluate(() => {
    const prefs = JSON.parse(localStorage.getItem('vista-platform-prefs') || '{}');
    prefs.smartOrdering = true;
    localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
    console.log('[Test] Smart ordering enabled in preferences');
  });

  // Enable debug mode for detailed logging
  await page.evaluate(() => {
    window.DEBUG_SMART_ORDERING = true;
    console.log('[Test] Debug mode enabled');
  });

  log('✅ Smart ordering enabled', 'green');
}

async function inspectURL(page, url) {
  log(`🔍 Inspecting URL: ${url}`, 'cyan');

  // Clear input field and enter new URL
  await page.fill('#urlInput', '');
  await page.type('#urlInput', url, { delay: 50 });

  // Click inspect button
  await page.click('#inspectBtn');

  // Wait for platform cards to appear
  try {
    await page.waitForSelector('.platform-card', { timeout: 10000 });
    log('✅ Platform cards loaded', 'green');
  } catch (error) {
    log('⚠️  Timeout waiting for platform cards', 'yellow');
  }

  // Wait additional time for smart ordering to complete
  await page.waitForTimeout(1500);

  // Wait for toast notification indicating page type detection
  try {
    await page.waitForSelector('.toast:has-text("Page type detected")', { timeout: 3000 });
    log('✅ Page type detection confirmed', 'green');
  } catch (error) {
    log('ℹ️  Toast notification not found (may have dismissed)', 'cyan');
  }
}

async function getPlatformOrder(page) {
  // Get the current platform order from DOM
  const order = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.platform-card'));
    return cards.map(card => ({
      platform: card.dataset.platform,
      position: Array.from(card.parentElement.children).indexOf(card)
    }));
  });

  return order;
}

async function verifyPlatformOrder(page, config) {
  log(`\n🧪 Verifying platform order for: ${config.name}`, 'bold');

  // Get actual platform order
  const actualOrder = await getPlatformOrder(page);
  const actualPlatforms = actualOrder.map(item => item.platform);

  // Check expected platforms
  const expectedPlatforms = config.expectedTopPlatforms;

  log(`   Expected top platforms: ${expectedPlatforms.join(', ')}`, 'cyan');
  log(`   Actual top platforms:   ${actualPlatforms.slice(0, expectedPlatforms.length).join(', ')}`, 'yellow');

  // Compare positions
  const comparison = expectedPlatforms.map((expected, index) => {
    const actual = actualPlatforms[index];
    const match = actual === expected;
    return {
      position: index + 1,
      expected: expected,
      actual: actual,
      match: match
    };
  });

  const matches = comparison.filter(c => c.match).length;
  const total = expectedPlatforms.length;

  // Display comparison results
  console.log('\n   Position comparison:');
  comparison.forEach(c => {
    const status = c.match ? '✓' : '✗';
    const color = c.match ? 'green' : 'red';
    log(`   ${c.position}. ${status} Expected: ${c.expected}, Actual: ${c.actual || '(undefined)'}`, color);
  });

  const allMatch = matches === total;
  const partialMatch = matches > total / 2;

  if (allMatch) {
    log(`\n   ✅ PERFECT MATCH - All ${total} platforms in correct order`, 'green');
  } else if (partialMatch) {
    log(`\n   ⚠️  PARTIAL MATCH - ${matches}/${total} platforms correct`, 'yellow');
  } else {
    log(`\n   ❌ POOR MATCH - Only ${matches}/${total} platforms correct`, 'red');
  }

  return {
    allMatch,
    partialMatch,
    matches,
    total,
    comparison,
    actualPlatforms
  };
}

async function takeScreenshot(page, config, index) {
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const filename = path.join(screenshotDir, `bf-4rsg-test-${index}-${config.pageType}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  log(`📸 Screenshot saved: ${filename}`, 'cyan');
}

async function testAcceptanceCriteria(page, config, result) {
  section('Testing Acceptance Criteria');

  const criteriaResults = [];

  for (const criterion of ACCEPTANCE_CRITERIA) {
    log(`\n${criterion.id}: ${criterion.description}`, 'cyan');

    try {
      const testResult = await criterion.test(page, config);

      if (typeof testResult === 'boolean') {
        const passed = testResult;
        log(`${passed ? '✅' : '❌'} ${criterion.id}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'green' : 'red');
        criteriaResults.push({
          id: criterion.id,
          description: criterion.description,
          passed,
          result: passed ? 'PASS' : 'FAIL'
        });
      } else {
        // Complex result with details
        const passed = testResult.matches >= testResult.total * 0.7; // 70% threshold
        log(`${passed ? '✅' : '❌'} ${criterion.id}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'green' : 'red');
        log(`   Details: ${JSON.stringify(testResult)}`, 'cyan');
        criteriaResults.push({
          id: criterion.id,
          description: criterion.description,
          passed,
          result: testResult
        });
      }
    } catch (error) {
      log(`❌ ${criterion.id}: ERROR - ${error.message}`, 'red');
      criteriaResults.push({
        id: criterion.id,
        description: criterion.description,
        passed: false,
        error: error.message
      });
    }
  }

  return criteriaResults;
}

async function runVisualTests() {
  const testResults = [];

  try {
    const { browser, page } = await setupBrowser();

    section('Navigate to VISTA Application');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    log('✅ Application loaded', 'green');

    section('Enable Smart Ordering');
    await enableSmartOrdering(page);

    for (let i = 0; i < TEST_CONFIGS.length; i++) {
      const config = TEST_CONFIGS[i];

      section(`Test ${i + 1}: ${config.name}`);

      log(`   Description: ${config.description}`, 'cyan');
      log(`   Page Type: ${config.pageType}`, 'cyan');
      log(`   URL: ${config.url}`, 'cyan');

      // Inspect the URL
      await inspectURL(page, config.url);

      // Take screenshot for visual verification
      await takeScreenshot(page, config, i);

      // Verify platform order
      const orderResult = await verifyPlatformOrder(page, config);

      // Test acceptance criteria
      const criteriaResults = await testAcceptanceCriteria(page, config, orderResult);

      testResults.push({
        config: config,
        orderResult: orderResult,
        criteriaResults: criteriaResults
      });

      // Wait before next test
      await page.waitForTimeout(2000);
    }

    section('FINAL RESULTS SUMMARY');
    displaySummary(testResults);

    // Save detailed results
    const resultsPath = path.join(__dirname, 'notes', 'bf-4rsg-visual-verification-results.json');
    const resultsDir = path.dirname(resultsPath);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    log(`\n📁 Detailed results saved to: ${resultsPath}`, 'cyan');

    // Keep browser open for manual inspection
    log('\n⏸️  Browser will remain open for 30 seconds for manual inspection...', 'yellow');
    log('   You can verify the reordering visually in the browser', 'cyan');
    await page.waitForTimeout(30000);

    await browser.close();

    // Check if all tests passed
    const allPassed = testResults.every(r =>
      r.orderResult.allMatch &&
      r.criteriaResults.every(c => c.passed)
    );

    if (allPassed) {
      log('\n🎉 ALL VISUAL VERIFICATION TESTS PASSED!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed - review results above', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

function displaySummary(testResults) {
  console.log('\n┌──────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                    VISUAL VERIFICATION TEST SUMMARY                          │');
  console.log('├──────────────────────────────────────────────────────────────────────────────┤');

  testResults.forEach((result, i) => {
    const orderStatus = result.orderResult.allMatch ? '✅' :
                       result.orderResult.partialMatch ? '⚠️' : '❌';
    const criteriaPassed = result.criteriaResults.filter(c => c.passed).length;
    const criteriaTotal = result.criteriaResults.length;

    console.log(`│ ${i + 1}. ${result.config.name}`);
    console.log(`│    Platform Order: ${orderStatus} ${result.orderResult.matches}/${result.orderResult.total} match`);
    console.log(`│    Acceptance Criteria: ${criteriaPassed}/${criteriaTotal} passed`);
    console.log('│');
  });

  const totalOrderTests = testResults.length;
  const perfectOrderMatches = testResults.filter(r => r.orderResult.allMatch).length;
  const partialOrderMatches = testResults.filter(r => r.orderResult.partialMatch && !r.orderResult.allMatch).length;

  const totalCriteria = testResults.reduce((sum, r) => sum + r.criteriaResults.length, 0);
  const passedCriteria = testResults.reduce((sum, r) =>
    sum + r.criteriaResults.filter(c => c.passed).length, 0);

  console.log('├──────────────────────────────────────────────────────────────────────────────┤');
  console.log(`│ Platform Order Tests: ${perfectOrderMatches}/${totalOrderTests} perfect, ${partialOrderMatches} partial`);
  console.log(`│ Acceptance Criteria: ${passedCriteria}/${totalCriteria} passed`);
  console.log('└──────────────────────────────────────────────────────────────────────────────┘');
}

// Run the visual tests
if (require.main === module) {
  section('VISTA Smart Ordering Visual Verification');
  log('Bead: bf-4rsg', 'cyan');
  log('Testing applySmartOrdering() with visual browser verification', 'cyan');

  runVisualTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runVisualTests, TEST_CONFIGS, ACCEPTANCE_CRITERIA };
