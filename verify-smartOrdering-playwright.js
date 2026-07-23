/**
 * Test script to verify vista application launches with smartOrdering enabled
 * Uses Playwright instead of Puppeteer
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function testVistaLaunch() {
  console.log('Launching Vista application with smartOrdering enabled (Playwright)...');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages
  const consoleMessages = [];
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    consoleMessages.push({
      type,
      text,
      location: msg.location
    });

    if (type === 'error') {
      errors.push({ text, location: msg.location });
    } else if (type === 'warning') {
      warnings.push({ text, location: msg.location });
    }
  });

  // Track page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Track request failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  try {
    // Navigate to vista with smartOrdering enabled (default)
    console.log('Loading http://localhost:3000');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Check for platform cards
    const platformCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-platform-id]');
      return Array.from(cards).map(card => ({
        platformId: card.getAttribute('data-platform-id'),
        visible: card.offsetParent !== null
      }));
    });

    console.log(`Found ${platformCards.length} platform cards`);

    // Check if smartOrdering is enabled
    const smartOrderingEnabled = await page.evaluate(() => {
      // Check if platformPrefs.smartOrdering is accessible
      if (typeof window.platformPrefs !== 'undefined') {
        return window.platformPrefs.smartOrdering;
      }

      // Check localStorage
      try {
        const saved = localStorage.getItem('vista-platform-prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.smartOrdering !== false; // defaults to true
        }
      } catch (e) {
        console.error('Error checking localStorage:', e);
      }

      return true; // default
    });

    console.log(`SmartOrdering enabled: ${smartOrderingEnabled}`);

    // Test basic typing interaction
    console.log('Testing basic typing interaction...');
    await page.type('#urlInput', 'https://example.com');
    await page.waitForTimeout(500);

    const inputValue = await page.$eval('#urlInput', input => input.value);
    console.log(`URL Input value: ${inputValue}`);

    // Test platform selection
    console.log('Testing platform selection...');
    const platformSelectorBtn = await page.$('#platformSelectorBtn');
    if (platformSelectorBtn) {
      await platformSelectorBtn.click();
      await page.waitForTimeout(500);
      console.log('Platform selector button clicked successfully');

      // Check if dropdown is visible
      const dropdownVisible = await page.$eval('.platform-dropdown', dropdown => {
        return window.getComputedStyle(dropdown).display !== 'none';
      });
      console.log(`Platform dropdown visible: ${dropdownVisible}`);
    }

    // Take screenshot of initial state
    const screenshotPath = '/tmp/vista-smartOrdering-initial.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`Screenshot saved to ${screenshotPath}`);

    // Verify screenshot was created
    if (fs.existsSync(screenshotPath)) {
      const stats = fs.statSync(screenshotPath);
      console.log(`Screenshot size: ${stats.size} bytes`);
    }

    // Print results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);
    console.log(`Platform cards found: ${platformCards.length}`);
    console.log(`SmartOrdering enabled: ${smartOrderingEnabled}`);

    if (errors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text}`);
        if (err.location) {
          console.log(`   at ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    }

    if (warnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      warnings.forEach((warn, i) => {
        console.log(`${i + 1}. ${warn.text}`);
      });
    }

    if (pageErrors.length > 0) {
      console.log('\n=== PAGE ERRORS ===');
      pageErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.message}`);
      });
    }

    if (failedRequests.length > 0) {
      console.log('\n=== FAILED REQUESTS ===');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.url}`);
        console.log(`   Failure: ${req.failure ? req.failure.errorText : 'unknown'}`);
      });
    }

    // Check acceptance criteria
    console.log('\n=== ACCEPTANCE CRITERIA ===');

    const criteria = [];

    // Application starts successfully
    const appStarted = pageErrors.length === 0;
    criteria.push({ name: 'Application starts successfully', passed: appStarted });

    // No console errors on initial load
    const noConsoleErrors = errors.length === 0;
    criteria.push({ name: 'No console errors on initial load', passed: noConsoleErrors });

    // Platform cards render in UI
    const platformCardsRender = platformCards.length > 0;
    criteria.push({ name: 'Platform cards render in UI', passed: platformCardsRender });

    // SmartOrdering is enabled
    const smartOrderingOn = smartOrderingEnabled === true;
    criteria.push({ name: 'SmartOrdering is enabled', passed: smartOrderingOn });

    // Basic UI interactions work
    const typingWorks = inputValue === 'https://example.com';
    criteria.push({ name: 'Basic typing works', passed: typingWorks });

    // Screenshot captured
    const screenshotCaptured = fs.existsSync(screenshotPath);
    criteria.push({ name: 'Screenshot captured', passed: screenshotCaptured });

    criteria.forEach(c => {
      const status = c.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${status}: ${c.name}`);
    });

    const allPassed = criteria.every(c => c.passed);
    console.log(`\n${allPassed ? 'ALL CRITERIA PASSED' : 'SOME CRITERIA FAILED'}`);

    await browser.close();

    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('Test failed:', error);
    await browser.close();
    process.exit(1);
  }
}

// Run the test
testVistaLaunch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
