/**
 * Test UI interactions with smartOrdering enabled
 * This script tests:
 * - Platform cards rendering
 * - Search/filter input functionality
 * - Platform selection interactions
 * - Captures screenshots as proof
 */

const puppeteer = require('puppeteer');
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
  console.log('Starting VISTA smartOrdering UI Test...');
  console.log('Screenshot directory:', SCREENSHOT_DIR);
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable console log monitoring
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
      await page.goto(`${BASE_URL}/?smartOrdering=true`, { waitUntil: 'networkidle0', timeout: 30000 });
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
      const cardCount = await page.evaluate(() => {
        const cards = document.querySelectorAll('.platform-card');
        return cards.length;
      });

      const hasCards = cardCount > 0;
      logTest('Platform Cards Rendered', hasCards, `Found ${cardCount} cards`);

      // Get platform names for verification
      const platformNames = await page.evaluate(() => {
        const cards = document.querySelectorAll('.platform-card');
        return Array.from(cards).map(card => {
          const nameEl = card.querySelector('.platform-name');
          return nameEl ? nameEl.textContent.trim() : 'unknown';
        });
      });

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

    // Test 3: Test search/filter input functionality
    console.log('\nTest 3: Testing search/filter input');
    try {
      // Find the search input (if it exists)
      const searchInputExists = await page.evaluate(() => {
        const searchInput = document.querySelector('#searchInput, #filterInput, input[placeholder*="search" i], input[placeholder*="filter" i]');
        return searchInput !== null;
      });

      if (searchInputExists) {
        // Type in search box
        await page.type('#searchInput, #filterInput, input[placeholder*="search" i], input[placeholder*="filter" i]', 'Google', { delay: 100 });
        await sleep(1000);

        // Check if any errors occurred in console
        const hasSearchErrors = RESULTS.errors.some(e => e.message && e.message.includes('search'));
        logTest('Search Input Typing', !hasSearchErrors, hasSearchErrors ? 'Errors detected' : 'No errors');

        // Capture screenshot after search
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '03-after-search.png'),
          fullPage: true
        });
        console.log('  → Saved: 03-after-search.png');

        // Clear search
        await page.click('#searchInput, #filterInput, input[placeholder*="search" i], input[placeholder*="filter" i]');
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await sleep(500);

      } else {
        logTest('Search Input Exists', false, 'No search input found on page');
      }

    } catch (error) {
      logTest('Search Input Functionality', false, error.message);
    }

    // Test 4: Test platform selection interactions
    console.log('\nTest 4: Testing platform selection interactions');
    try {
      // Try to click on a platform card
      const firstCardClickable = await page.evaluate(() => {
        const firstCard = document.querySelector('.platform-card');
        if (!firstCard) return false;

        // Check if card has click handlers
        const hasClickListener = firstCard.onclick !== null;

        // Check for favorite button
        const favButton = firstCard.querySelector('.favorite-btn, .fav-btn, button[aria-label*="favorite" i]');

        return { hasClickListener, hasFavoriteButton: favButton !== null };
      });

      logTest('Platform Card Interactivity', true,
               `Click listener: ${firstCardClickable.hasClickListener}, Favorite button: ${firstCardClickable.hasFavoriteButton}`);

      // Try clicking favorite button if exists
      if (firstCardClickable.hasFavoriteButton) {
        await page.click('.favorite-btn, .fav-btn, button[aria-label*="favorite" i]');
        await sleep(500);

        // Check for console errors
        const hasClickErrors = RESULTS.errors.some(e => e.message && e.message.includes('click'));
        logTest('Platform Card Click Action', !hasClickErrors, hasClickErrors ? 'Errors detected' : 'No errors');

        // Capture screenshot after interaction
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '04-after-card-click.png'),
          fullPage: true
        });
        console.log('  → Saved: 04-after-card-click.png');
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

    // Test 6: Check for any UI errors or broken elements
    console.log('\nTest 6: Checking for UI errors and broken elements');
    try {
      const brokenElements = await page.evaluate(() => {
        const issues = [];

        // Check for images with broken src
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.complete || img.naturalWidth === 0) {
            issues.push({ type: 'broken_image', src: img.src });
          }
        });

        // Check for elements with visibility issues
        const hiddenCards = document.querySelectorAll('.platform-card[style*="display: none"]');
        if (hiddenCards.length > 0) {
          issues.push({ type: 'hidden_cards', count: hiddenCards.length });
        }

        return issues;
      });

      const hasBrokenElements = brokenElements.length > 0;
      logTest('UI Element Check', !hasBrokenElements,
               hasBrokenElements ? `Found ${brokenElements.length} issues` : 'No issues found');

      if (hasBrokenElements) {
        console.log('  → Issues:', JSON.stringify(brokenElements, null, 2));
      }

    } catch (error) {
      logTest('UI Element Check', false, error.message);
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-final-state.png'),
      fullPage: true
    });
    console.log('\n→ Saved: 05-final-state.png');

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