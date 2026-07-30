#!/usr/bin/env node
/**
 * Single Pinterest Frame Screenshot Capture
 *
 * Captures just the Pinterest frame test page and saves it as pinterest-frame-capture.png
 */

const { chromium } = require('playwright');
const path = require('path');

async function capturePinterestFrame() {
  console.log('📸 Capturing Pinterest frame screenshot...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const filePath = `file://${path.join(__dirname, '..', 'src', 'public', 'test-pinterest-frame.html')}`;
  const outputPath = path.join(__dirname, 'pinterest-frame-capture.png');

  try {
    await page.goto(filePath, { waitUntil: 'networkidle', timeout: 10000 });

    // Wait for page to fully render
    await page.waitForTimeout(1000);

    // Capture full page screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: true
    });

    console.log(`✅ Screenshot saved: ${outputPath}`);
    console.log(`📁 File size: ${require('fs').statSync(outputPath).size} bytes`);
  } catch (error) {
    console.error('❌ Failed to capture screenshot:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

capturePinterestFrame().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
