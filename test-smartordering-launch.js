#!/usr/bin/env node

/**
 * Test script to verify VISTA application launches successfully
 * with smartOrdering=true and captures console errors
 */

const puppeteer = require('puppeteer');

async function testSmartOrderingLaunch() {
  console.log('Launching VISTA application with smartOrdering=true...\n');

  const browser = await puppeteer.launch({
    headless: 'new',  // Run in headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });

    // Only log errors and warnings
    if (type === 'error') {
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  WARNING: ${text}`);
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
    pageErrors.push(error.message);
  });

  // Navigate to app with smartOrdering enabled
  const url = 'http://localhost:3000/?smartOrdering=true';
  console.log(`📍 Navigating to: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Page loaded successfully\n');

    // Wait a bit for any async initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if the main UI elements are present
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    const urlInput = await page.$('#urlInput');
    const inspectBtn = await page.$('#inspectBtn');
    const previewGrid = await page.$('#previewGrid');

    console.log('\n🔍 UI Element Checks:');
    console.log(`  URL Input: ${urlInput ? '✅ Present' : '❌ Missing'}`);
    console.log(`  Inspect Button: ${inspectBtn ? '✅ Present' : '❌ Missing'}`);
    console.log(`  Preview Grid: ${previewGrid ? '✅ Present' : '❌ Missing'}`);

    // Check if smartOrdering is enabled in the app state
    const smartOrderingEnabled = await page.evaluate(() => {
      return window.vistaState?.platformPrefs?.smartOrdering === true;
    });
    console.log(`\n⚙️  Smart Ordering Enabled: ${smartOrderingEnabled ? '✅ Yes' : '❌ No'}`);

    // Count platform cards
    const platformCardCount = await page.evaluate(() => {
      return document.querySelectorAll('.platform-card').length;
    });
    console.log(`📇 Platform Cards Rendered: ${platformCardCount}`);

    // Take screenshot for verification
    const screenshotPath = '/home/coding/vista/smartordering-initial-state.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot saved to: ${screenshotPath}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const errorCount = consoleMessages.filter(m => m.type === 'error').length;
    const warningCount = consoleMessages.filter(m => m.type === 'warning').length;

    console.log(`✅ Application launched successfully: Yes`);
    console.log(`❌ Console errors: ${errorCount}`);
    console.log(`⚠️  Console warnings: ${warningCount}`);
    console.log(`📇 Platform cards rendered: ${platformCardCount}`);
    console.log(`⚙️  Smart Ordering enabled: ${smartOrderingEnabled ? 'Yes' : 'No'}`);
    console.log(`📸 Screenshot captured: ${screenshotPath}`);

    if (pageErrors.length > 0) {
      console.log(`\n❌ Page Errors (${pageErrors.length}):`);
      pageErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    if (errorCount === 0 && pageErrors.length === 0) {
      console.log('\n✅ SUCCESS: Application runs with smartOrdering=true without errors!');
    } else {
      console.log('\n❌ FAILURE: Errors detected during launch');
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSmartOrderingLaunch().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
