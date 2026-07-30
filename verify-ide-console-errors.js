/**
 * Verify no console errors when rendering IDE frames
 * Checks for JavaScript errors, warnings, and resource loading failures
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting IDE frame console error verification...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-extensions', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Track console messages
  const consoleLogs = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const resourceFailures = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    const logEntry = {
      type,
      text,
      location: location ? { url: location.url, lineNumber: location.lineNumber } : null
    };

    consoleLogs.push(logEntry);

    if (type === 'error') {
      consoleErrors.push(logEntry);
      console.error(`[CONSOLE ERROR] ${text}`);
      if (location) {
        console.error(`  at ${location.url}:${location.lineNumber}`);
      }
    } else if (type === 'warning') {
      consoleWarnings.push(logEntry);
      console.warn(`[CONSOLE WARNING] ${text}`);
    }
  });

  page.on('pageerror', error => {
    const errorEntry = {
      text: error.message,
      stack: error.stack
    };
    consoleErrors.push({ type: 'pageerror', ...errorEntry });
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      failure: request.failure().errorText,
      resourceType: request.resourceType()
    };
    resourceFailures.push(failure);
    console.error(`[RESOURCE FAILED] ${failure.resourceType}: ${failure.url}`);
    console.error(`  Reason: ${failure.failure}`);
  });

  try {
    // Navigate to the IDE test page
    const testPagePath = path.join(__dirname, 'test-ide-theme-switching.html');
    const fileUrl = `file://${testPagePath}`;

    console.log(`Loading test page: ${fileUrl}\n`);
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 10000 });

    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Test 1: Initial load console state
    console.log('\n=== Test 1: Initial Load ===');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    console.log(`Resource failures: ${resourceFailures.length}`);

    // Test 2: Run console tests via page button
    console.log('\n=== Test 2: Running Automated Tests ===');
    await page.click('button[onclick="runConsoleTests()"]');
    await page.waitForTimeout(2000);

    // Test 3: Theme toggle
    console.log('\n=== Test 3: Theme Toggle ===');
    await page.click('button[onclick="toggleTheme()"]');
    await page.waitForTimeout(500);

    await page.click('button[onclick="toggleTheme()"]');
    await page.waitForTimeout(500);

    // Test 4: Rapid theme cycling
    console.log('\n=== Test 4: Rapid Theme Cycling ===');
    for (let i = 0; i < 5; i++) {
      await page.click('button[onclick="toggleAllThemes()"]');
      await page.waitForTimeout(200);
    }

    // Wait for any delayed errors
    await page.waitForTimeout(1000);

    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    console.log(`Resource failures: ${resourceFailures.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.type}: ${err.text}`);
        if (err.location) {
          console.log(`     at ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    } else {
      console.log('\n✅ No console errors detected');
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  CONSOLE WARNINGS:');
      consoleWarnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.text}`);
      });
    } else {
      console.log('\n✅ No console warnings detected');
    }

    if (resourceFailures.length > 0) {
      console.log('\n❌ RESOURCE LOADING FAILURES:');
      resourceFailures.forEach((fail, i) => {
        console.log(`  ${i + 1}. ${fail.resourceType}: ${fail.url}`);
        console.log(`     Reason: ${fail.failure}`);
      });
    } else {
      console.log('\n✅ No resource loading failures');
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      results: {
        totalConsoleMessages: consoleLogs.length,
        errors: consoleErrors.length,
        warnings: consoleWarnings.length,
        resourceFailures: resourceFailures.length,
        passed: consoleErrors.length === 0 && resourceFailures.length === 0
      },
      details: {
        consoleErrors,
        consoleWarnings,
        resourceFailures
      }
    };

    const reportPath = path.join(__dirname, 'notes', 'bf-6ddu3-console-verification.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Exit with appropriate code
    await browser.close();

    if (report.results.passed) {
      console.log('\n✅ ALL CHECKS PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ SOME CHECKS FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
})();
