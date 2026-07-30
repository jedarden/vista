/**
 * Test script to verify console errors and initial load with smartOrdering=true
 * Using Puppeteer instead of Playwright
 */

const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Track console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Track page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack
      });
    });

    console.log('Loading vista with smartOrdering=true...');
    await page.goto('http://localhost:3001/?smartOrdering=true', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit more for any delayed errors
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== Console Output ===');
    if (consoleMessages.length === 0) {
      console.log('✓ No console messages');
    } else {
      consoleMessages.forEach(msg => {
        const icon = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${msg.type}] ${msg.text}`);
      });
    }

    console.log('\n=== Page Errors ===');
    if (pageErrors.length === 0) {
      console.log('✓ No page errors');
    } else {
      pageErrors.forEach(error => {
        console.log(`❌ Error: ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack}`);
        }
      });
    }

    // Check for JavaScript errors specifically
    const jsErrors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log('\n=== Summary ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`JavaScript errors: ${jsErrors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    if (jsErrors.length === 0 && pageErrors.length === 0) {
      console.log('\n✓ SUCCESS: Page loaded with smartOrdering=true without errors');
      process.exit(0);
    } else {
      console.log('\n❌ FAILED: Page has errors or warnings');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
