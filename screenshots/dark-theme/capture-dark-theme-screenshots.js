#!/usr/bin/env node

/**
 * Dark Theme Platform Screenshot Capture Script (Bead bf-b6pnm)
 *
 * This script captures screenshots of all platform frames in dark theme using Puppeteer.
 *
 * Usage: node screenshots/dark-theme/capture-dark-theme-screenshots.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Platforms to screenshot
const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'discord', name: 'Discord' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'signal', name: 'Signal' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'mastodon', name: 'Mastodon' }
];

const OUTPUT_DIR = __dirname;

console.log('🌙 Dark Theme Platform Screenshot Capture (Bead bf-b6pnm)');
console.log('='.repeat(60));

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Setup browser with best configuration
 */
async function setupBrowser() {
  let browser;
  try {
    // Try chrome-headless-shell first
    const chromePath = findChromeHeadlessShell();
    if (chromePath && fs.existsSync(chromePath)) {
      console.log(`Using chrome-headless-shell at ${chromePath}`);
      browser = await puppeteer.launch({
        headless: 'shell',
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
    } else {
      throw new Error('chrome-headless-shell not found');
    }
  } catch (err) {
    console.log(`Chrome-headless-shell failed: ${err.message}`);
    console.log(`Trying system chromium...`);
    try {
      browser = await puppeteer.launch({
        headless: true,
        channel: 'chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
    } catch (err2) {
      console.log(`System chromium failed: ${err2.message}`);
      throw new Error('No browser available');
    }
  }
  return browser;
}

/**
 * Find chrome-headless-shell executable
 */
function findChromeHeadlessShell() {
  const puppeteerCache = '/home/coding/.cache/puppeteer/chrome-headless-shell';
  if (!fs.existsSync(puppeteerCache)) {
    return null;
  }

  const versions = fs.readdirSync(puppeteerCache)
    .filter(entry => {
      const entryPath = path.join(puppeteerCache, entry);
      return fs.statSync(entryPath).isDirectory() && entry.startsWith('linux-');
    })
    .sort()
    .reverse();

  for (const version of versions) {
    const shellPath = path.join(puppeteerCache, version, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(shellPath)) {
      return shellPath;
    }
  }

  return null;
}

/**
 * Capture screenshot for a single platform
 */
async function capturePlatformScreenshot(page, platform) {
  console.log(`\n📸 Capturing screenshot for ${platform.name} (${platform.id}-dark.html)...`);

  try {
    const htmlPath = path.join(OUTPUT_DIR, `${platform.id}-dark.html`);
    const screenshotPath = path.join(OUTPUT_DIR, `${platform.id}-dark.png`);

    if (!fs.existsSync(htmlPath)) {
      console.log(`  ⚠️  HTML file not found: ${htmlPath}`);
      return false;
    }

    // Load the HTML file
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log(`  ✅ Page loaded`);

    // Wait for frame to render
    await sleep(2000);

    // Get the platform frame container
    const frameContainer = await page.$('.platform-frame-container');

    if (!frameContainer) {
      console.log(`  ⚠️  Platform frame container not found`);
      return false;
    }

    // Take screenshot of just the frame container
    await frameContainer.screenshot({ path: screenshotPath });
    console.log(`  ✅ Screenshot saved: ${platform.id}-dark.png`);

    // Verify the screenshot was created and is not empty
    const stats = fs.statSync(screenshotPath);
    if (stats.size === 0) {
      console.log(`  ⚠️  Screenshot is empty`);
      return false;
    }

    console.log(`  ✅ Screenshot size: ${Math.round(stats.size / 1024)} KB`);
    return true;

  } catch (error) {
    console.log(`  ❌ Error capturing ${platform.id}: ${error.message}`);
    return false;
  }
}

/**
 * Main screenshot capture function
 */
async function captureAllScreenshots() {
  console.log(`Platforms to screenshot: ${PLATFORMS.length}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  let browser;
  try {
    browser = await setupBrowser();
    console.log('✅ Browser launched\n');
  } catch (error) {
    console.error('❌ Failed to launch browser:', error.message);
    process.exit(1);
  }

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    const results = [];

    for (const platform of PLATFORMS) {
      const success = await capturePlatformScreenshot(page, platform);
      results.push({
        platform: platform.id,
        name: platform.name,
        success,
        screenshot: success ? `${platform.id}-dark.png` : null
      });

      // Small delay between platforms
      await sleep(1000);
    }

    // Save results
    const successfulCaptures = results.filter(r => r.success);

    console.log('\n' + '='.repeat(60));
    console.log('📊 SCREENSHOT CAPTURE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Platforms processed: ${results.length}`);
    console.log(`Successful captures: ${successfulCaptures.length}/${results.length}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    if (successfulCaptures.length < results.length) {
      console.log('\n⚠️  Failed captures:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name} (${r.platform})`);
      });
    }

    // Save results to JSON
    const resultsPath = path.join(OUTPUT_DIR, 'screenshot-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      theme: 'dark',
      platforms: results,
      summary: {
        total: results.length,
        successful: successfulCaptures.length,
        failed: results.length - successfulCaptures.length
      }
    }, null, 2));

    console.log(`\n✅ Results saved to: ${resultsPath}`);

    if (successfulCaptures.length === results.length) {
      console.log('\n🎉 All screenshots captured successfully!');
    } else {
      console.log('\n⚠️  Some screenshots failed - see details above');
    }

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
captureAllScreenshots()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
