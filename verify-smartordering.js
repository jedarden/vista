#!/usr/bin/env node
/**
 * Verify Smart Ordering Functionality
 *
 * This script tests that applySmartOrdering() successfully reorders platform cards
 * based on detected page type.
 */

const puppeteer = require('puppeteer');

async function verifySmartOrdering() {
  console.log('🧪 Starting Smart Ordering Verification...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Intercept console logs to detect applySmartOrdering calls
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('applySmartOrdering') || text.includes('handleResult hook') || text.includes('smartOrdering')) {
        logs.push(text);
        console.log(`[BROWSER LOG] ${text}`);
      }
    });

    // Navigate to the application
    console.log('📡 Navigating to Vista...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Wait for the app to load
    await page.waitForTimeout(1000);

    // Enable smart ordering in preferences
    console.log('⚙️  Enabling smart ordering...');
    await page.evaluate(() => {
      if (typeof platformPrefs !== 'undefined') {
        platformPrefs.smartOrdering = true;
        localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
      }
    });

    // Get initial platform order before inspection
    console.log('📋 Getting initial platform order...');
    const initialOrder = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card');
      return Array.from(cards).map(card => card.dataset.platform);
    });
    console.log('Initial platform order:', initialOrder.slice(0, 10).join(', '), '...');

    // Submit a URL for inspection (article type)
    console.log('🔍 Inspecting article URL...');
    const testUrl = 'https://www.example.com/article/test';

    // Type URL and submit
    await page.type('#urlInput', testUrl);
    await page.click('#urlForm button[type="submit"]');

    // Wait for results
    console.log('⏳ Waiting for results...');
    await page.waitForTimeout(5000);

    // Check if applySmartOrdering was called
    const hasFunctionCalled = logs.some(l => l.includes('[applySmartOrdering] Function called'));
    const hasComplete = logs.some(l => l.includes('[applySmartOrdering] Function complete'));
    const hasErrors = logs.some(l => l.includes('ERROR') || l.includes('Failed'));

    console.log('\n=== LOG ANALYSIS ===');
    console.log(`Hook called: ${logs.some(l => l.includes('[handleResult hook]')) ? '✅ YES' : '❌ NO'}`);
    console.log(`Function called: ${hasFunctionCalled ? '✅ YES' : '❌ NO'}`);
    console.log(`Function complete: ${hasComplete ? '✅ YES' : '❌ NO'}`);
    console.log(`Errors detected: ${hasErrors ? '❌ YES' : '✅ NO'}`);

    // Get platform order after smart ordering
    console.log('\n📋 Getting platform order after smart ordering...');
    const finalOrder = await page.evaluate(() => {
      const cards = document.querySelectorAll('.platform-card');
      return Array.from(cards).map(card => card.dataset.platform);
    });
    console.log('Final platform order:', finalOrder.slice(0, 10).join(', '), '...');

    // Check if order changed
    const orderChanged = JSON.stringify(initialOrder) !== JSON.stringify(finalOrder);
    console.log(`\nOrder changed: ${orderChanged ? '✅ YES' : '❌ NO'}`);

    // Check for page type detection in logs
    const pageTypeLog = logs.find(l => l.includes('Page type detected'));
    console.log(`Page type detected: ${pageTypeLog ? '✅ YES' : '❌ NO'}`);
    if (pageTypeLog) {
      console.log(`  -> ${pageTypeLog}`);
    }

    // Final verdict
    console.log('\n=== FINAL VERIFICATION ===');
    const allPassed = hasFunctionCalled && hasComplete && !hasErrors && orderChanged;

    if (allPassed) {
      console.log('✅ ALL CHECKS PASSED: Smart ordering is working correctly!');
      return 0;
    } else {
      console.log('❌ SOME CHECKS FAILED');
      if (!hasFunctionCalled) console.log('  - applySmartOrdering was not called');
      if (!hasComplete) console.log('  - applySmartOrdering did not complete');
      if (hasErrors) console.log('  - Errors were detected');
      if (!orderChanged) console.log('  - Platform order did not change');
      return 1;
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return 1;
  } finally {
    await browser.close();
  }
}

// Run the verification
verifySmartOrdering()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} Verification completed with exit code ${exitCode}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
