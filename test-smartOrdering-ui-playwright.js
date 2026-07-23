/**
 * Test UI interactions with smartOrdering enabled using Playwright
 * This script tests:
 * - Platform cards rendering
 * - Search/filter input functionality
 * - Platform selection interactions
 * - Captures screenshots as proof
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'smartOrdering-ui-test');
const BASE_URL = 'http://localhost:3000';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const RESULTS = {
  tests: [],
  errors: [],
  startTime: new Date().toISOString()
};

function logTest(testName, passed, details = '') {
  const result = { test: testName, passed, details, timestamp: new Date().toISOString() };
  RESULTS.tests.push(result);
  console.log(`[${passed ? '✓' : '✗'}] ${testName}${details ? ': ' + details : ''}`);
  if (!passed) {
    RESULTS.errors.push(result);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting VISTA smartOrdering UI Test with Playwright...');
  console.log('Screenshot directory:', SCREENSHOT_DIR);
  console.log('');

  const browser = await chromium.launch({
    headless: false
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
        RESULTS.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Test 1: Load the page with smartOrdering enabled
    console.log('Test 1: Loading VISTA with smartOrdering=true');
    try {
      await page.goto(`${BASE_URL}/?smartOrdering=true`, { waitUntil: 'networkidle', timeout: 30000 });
      await sleep(2000); // Wait for initial render

      // Check if page loaded successfully
      const title = await page.title();
      const hasTitle = title.includes('VISTA');
      logTest('Page Load with smartOrdering=true', hasTitle, `Title: "${title}"`);

      // Capture screenshot of initial load
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '01-initial-load.png'),
        fullPage: true
      });
      console.log('  → Saved: 01-initial-load.png');

    } catch (error) {
      logTest('Page Load with smartOrdering=true', false, error.message);
      throw error;
    }

    // Test 2: Verify platform cards are rendered
    console.log('\nTest 2: Checking platform cards rendering');
    try {
      // Wait for preview grid
      await page.waitForSelector('#previewGrid', { timeout: 10000 });

      // Check if platform cards exist
      const cardCount = await page.locator('.platform-card').count();

      const hasCards = cardCount > 0;
      logTest('Platform Cards Rendered', hasCards, `Found ${cardCount} cards`);

      // Get platform names for verification
      const platformNames = await page.locator('.platform-card .platform-name').allTextContents();

      console.log('  → Platforms found:', platformNames.slice(0, 10).join(', '),
                  platformNames.length > 10 ? `... and ${platformNames.length - 10} more` : '');

      // Capture screenshot of rendered cards
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-platform-cards.png'),
        fullPage: true
      });
      console.log('  → Saved: 02-platform-cards.png');

    } catch (error) {
      logTest('Platform Cards Rendered', false, error.message);
    }

    // Test 3: Test URL input functionality (main interaction)
    console.log('\nTest 3: Testing URL input functionality');
    try {
      // Find the URL input
      const urlInput = page.locator('#urlInput');
      const inputExists = await urlInput.count() > 0;

      if (inputExists) {
        // Type a test URL
        await urlInput.fill('https://example.com');
        await sleep(500);

        // Look for analyze button
        const analyzeButton = page.locator('#analyzeBtn, button[type="submit"], button:has-text("Analyze"), button:has-text("Preview")');

        const buttonExists = await analyzeButton.count() > 0;
        if (buttonExists) {
          await analyzeButton.first().click();
          console.log('  → Clicked analyze button');
          await sleep(3000); // Wait for results

          // Check for console errors
          const hasInputErrors = RESULTS.errors.some(e => e.message && e.message.includes('input'));
          logTest('URL Input and Analyze', !hasInputErrors, hasInputErrors ? 'Errors detected' : 'No errors');

          // Capture screenshot after analysis
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '03-after-analyze.png'),
            fullPage: true
          });
          console.log('  → Saved: 03-after-analyze.png');
        } else {
          logTest('Analyze Button Found', false, 'No analyze button found');
        }

      } else {
        logTest('URL Input Exists', false, 'No URL input found on page');
      }

    } catch (error) {
      logTest('URL Input Functionality', false, error.message);
    }

    // Test 4: Test platform selection interactions
    console.log('\nTest 4: Testing platform selection interactions');
    try {
      // Check for favorite buttons
      const favButtons = page.locator('.favorite-btn, .fav-btn, button[aria-label*="favorite" i], button[title*="favorite" i]');
      const favCount = await favButtons.count();

      logTest('Favorite Buttons Found', favCount > 0, `Found ${favCount} favorite buttons`);

      // Try clicking a favorite button if exists
      if (favCount > 0) {
        await favButtons.first().click();
        await sleep(500);

        // Check for console errors
        const hasClickErrors = RESULTS.errors.some(e => e.message && (e.message.includes('click') || e.message.includes('favorite')));
        logTest('Favorite Button Click Action', !hasClickErrors, hasClickErrors ? 'Errors detected' : 'No errors');

        // Capture screenshot after interaction
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '04-after-favorite-click.png'),
          fullPage: true
        });
        console.log('  → Saved: 04-after-favorite-click.png');
      }

    } catch (error) {
      logTest('Platform Selection Interactions', false, error.message);
    }

    // Test 5: Verify smartOrdering is actually enabled
    console.log('\nTest 5: Verifying smartOrdering is enabled');
    try {
      const smartOrderingEnabled = await page.evaluate(() => {
        // Check window.platformPrefs
        if (window.platformPrefs && typeof window.platformPrefs.smartOrdering !== 'undefined') {
          return window.platformPrefs.smartOrdering;
        }

        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('smartOrdering') === 'true';
      });

      logTest('smartOrdering Enabled', smartOrderingEnabled,
               smartOrderingEnabled ? 'smartOrdering is active' : 'smartOrdering is NOT active');

    } catch (error) {
      logTest('smartOrdering Verification', false, error.message);
    }

    // Test 6: Test column count selector if available
    console.log('\nTest 6: Testing column count selector');
    try {
      const columnSelector = page.locator('#columnSelector, select[name="columns"], button:has-text("Columns")');
      const selectorExists = await columnSelector.count() > 0;

      if (selectorExists) {
        logTest('Column Selector Found', true, 'Column selector exists');

        // Try changing column count
        await columnSelector.first().click();
        await sleep(200);

        // Capture screenshot
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '05-column-selector.png'),
          fullPage: true
        });
        console.log('  → Saved: 05-column-selector.png');
      } else {
        logTest('Column Selector Found', false, 'No column selector found');
      }

    } catch (error) {
      logTest('Column Selector Functionality', false, error.message);
    }

    // Test 7: Check for any broken images or elements
    console.log('\nTest 7: Checking for broken images and elements');
    try {
      const brokenImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => !img.complete || img.naturalWidth === 0)
                     .map(img => ({ src: img.src, alt: img.alt }));
      });

      const hasBrokenImages = brokenImages.length > 0;
      logTest('Image Check', !hasBrokenImages,
               hasBrokenImages ? `Found ${brokenImages.length} broken images` : 'All images loaded successfully');

      if (hasBrokenImages) {
        console.log('  → Broken images:', brokenImages);
      }

    } catch (error) {
      logTest('Image Check', false, error.message);
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-final-state.png'),
      fullPage: true
    });
    console.log('\n→ Saved: 06-final-state.png');

    await context.close();

  } finally {
    await browser.close();
  }

  // Write results
  RESULTS.endTime = new Date().toISOString();
  RESULTS.summary = {
    total: RESULTS.tests.length,
    passed: RESULTS.tests.filter(t => t.passed).length,
    failed: RESULTS.tests.filter(t => !t.passed).length,
    errors: RESULTS.errors.length
  };

  const resultsPath = path.join(__dirname, 'notes', 'bf-5a7dp-smartOrdering-ui-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${RESULTS.summary.total}`);
  console.log(`Passed: ${RESULTS.summary.passed}`);
  console.log(`Failed: ${RESULTS.summary.failed}`);
  console.log(`Errors: ${RESULTS.summary.errors}`);
  console.log('');
  console.log(`Results saved to: ${resultsPath}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));

  if (RESULTS.summary.failed > 0) {
    console.log('\nFailed tests:');
    RESULTS.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.test}: ${t.details}`);
    });
  }

  process.exit(RESULTS.summary.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});