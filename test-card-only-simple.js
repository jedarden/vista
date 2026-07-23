#!/usr/bin/env node

/**
 * Simple Card-Only Rendering Test
 *
 * Loads the test harness page, switches to card-only mode,
 * and extracts the built-in test results.
 */

const puppeteer = require('puppeteer');

async function testCardOnlyRendering() {
  console.log('🧪 Starting Card-Only Rendering Test...\n');

  // Try launching with different methods
  let browser;
  try {
    // Method 1: Try chrome-headless-shell
    const chromePath = '/home/coding/.cache/puppeteer/chrome-headless-shell/linux-150.0.7871.24/chrome-headless-shell-linux64/chrome-headless-shell';
    if (require('fs').existsSync(chromePath)) {
      console.log(`  Using chrome-headless-shell at ${chromePath}`);
      browser = await puppeteer.launch({
        headless: 'shell',
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      throw new Error('chrome-headless-shell not found');
    }
  } catch (err) {
    console.log(`  Chrome-headless-shell failed: ${err.message}`);
    console.log(`  Trying system chromium...`);
    try {
      browser = await puppeteer.launch({
        headless: true,
        channel: 'chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
    } catch (err2) {
      console.log(`  System chromium failed: ${err2.message}`);
      throw new Error('No browser available');
    }
  }

  const page = await browser.newPage();

  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text });
    if (type === 'error') {
      console.log(`  [Console Error] ${text}`);
    }
  });

  // Track page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`  [Page Error] ${error.message}`);
  });

  try {
    // Load the test harness
    console.log('🌐 Loading test harness at http://127.0.0.1:8080/src/public/test-platform-frames-harness.html');
    await page.goto('http://127.0.0.1:8080/src/public/test-platform-frames-harness.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('✅ Test harness loaded\n');

    // Wait for initial tests to complete
    await page.waitForTimeout(3000);

    // Get initial test results (context mode)
    const initialResults = await page.evaluate(() => {
      const total = parseInt(document.getElementById('totalStat').textContent);
      const working = parseInt(document.getElementById('workingStat').textContent);
      const failed = parseInt(document.getElementById('failedStat').textContent);
      const pending = parseInt(document.getElementById('pendingStat').textContent);
      return { total, working, failed, pending };
    });

    console.log('📊 Initial Results (Context Mode):');
    console.log(`  Total: ${initialResults.total}`);
    console.log(`  Working: ${initialResults.working}`);
    console.log(`  Failed: ${initialResults.failed}`);
    console.log(`  Pending: ${initialResults.pending}\n`);

    // Switch to card-only mode
    console.log('📄 Switching to card-only mode...');
    await page.evaluate(() => {
      const cardOnlyBtn = document.getElementById('cardOnlyAll');
      if (cardOnlyBtn) {
        cardOnlyBtn.click();
      }
    });

    await page.waitForTimeout(2000);
    console.log('✅ Card-only mode activated\n');

    // Get card-only test results
    const cardOnlyResults = await page.evaluate(() => {
      const platforms = [];
      const testItems = document.querySelectorAll('.platform-test-item');

      testItems.forEach(item => {
        const platformId = item.id.replace('test-', '');
        const header = item.querySelector('.platform-header span:first-child');
        const platformName = header ? header.textContent.trim() : platformId;
        const statusEl = document.getElementById(`status-${platformId}`);

        let status = 'unknown';
        let statusText = '';

        if (statusEl) {
          statusText = statusEl.textContent.trim();
          if (statusEl.classList.contains('status-working')) {
            status = 'working';
          } else if (statusEl.classList.contains('status-failed')) {
            status = 'failed';
          } else if (statusEl.classList.contains('status-pending')) {
            status = 'pending';
          }
        }

        platforms.push({
          id: platformId,
          name: platformName,
          status,
          statusText
        });
      });

      const total = parseInt(document.getElementById('totalStat').textContent);
      const working = parseInt(document.getElementById('workingStat').textContent);
      const failed = parseInt(document.getElementById('failedStat').textContent);
      const pending = parseInt(document.getElementById('pendingStat').textContent);

      return { platforms, total, working, failed, pending };
    });

    console.log('📊 Card-Only Results:');
    console.log(`  Total: ${cardOnlyResults.total}`);
    console.log(`  Working: ${cardOnlyResults.working}`);
    console.log(`  Failed: ${cardOnlyResults.failed}`);
    console.log(`  Pending: ${cardOnlyResults.pending}\n`);

    // Find failed platforms
    const failedPlatforms = cardOnlyResults.platforms.filter(p => p.status === 'failed');

    if (failedPlatforms.length > 0) {
      console.log(`❌ Failed Platforms (${failedPlatforms.length}):`);
      failedPlatforms.forEach(p => {
        console.log(`  - ${p.name} (${p.id}): ${p.statusText}`);
      });
      console.log('');
    }

    // Check for console errors
    const errorCount = consoleMessages.filter(m => m.type === 'error').length;
    if (errorCount > 0) {
      console.log(`⚠️  Console Errors: ${errorCount}`);
    }

    // Collect detailed results
    const results = {
      timestamp: new Date().toISOString(),
      mode: 'card-only',
      summary: {
        total: cardOnlyResults.total,
        working: cardOnlyResults.working,
        failed: cardOnlyResults.failed,
        pending: cardOnlyResults.pending,
        consoleErrors: errorCount
      },
      platforms: cardOnlyResults.platforms,
      failedPlatforms: failedPlatforms.map(p => ({
        id: p.id,
        name: p.name,
        error: p.statusText
      })),
      consoleErrors: consoleMessages.filter(m => m.type === 'error'),
      pageErrors: pageErrors
    };

    // Save results
    const fs = require('fs');
    const path = require('path');
    const resultsPath = path.join(__dirname, 'test-results', 'card-only-test-results.json');
    const resultsDir = path.dirname(resultsPath);

    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${resultsPath}\n`);

    // Final verdict
    const allWorking = cardOnlyResults.working === cardOnlyResults.total &&
                       cardOnlyResults.pending === 0 &&
                       errorCount === 0;

    if (allWorking) {
      console.log('✅ ALL PLATFORMS PASSED CARD-ONLY RENDERING TEST');
    } else {
      console.log('⚠️  SOME PLATFORMS HAVE ISSUES');
      if (cardOnlyResults.working !== cardOnlyResults.total) {
        console.log(`   - ${cardOnlyResults.failed} platforms failed rendering`);
      }
      if (cardOnlyResults.pending > 0) {
        console.log(`   - ${cardOnlyResults.pending} platforms still pending`);
      }
      if (errorCount > 0) {
        console.log(`   - ${errorCount} console errors detected`);
      }
    }

    await browser.close();
    return allWorking;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await browser.close();
    throw error;
  }
}

// Run the test
testCardOnlyRendering()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
