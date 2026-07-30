#!/usr/bin/env node

/**
 * Platform Context Frame Screenshot Capture Script
 *
 * Captures screenshots of all platform context frames in both dark and light modes,
 * and both card-only and in-context views using Puppeteer.
 *
 * Usage: node screenshots/capture-platform-context-frames.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Representative platforms to screenshot (10 platforms)
const PLATFORMS_TO_SCREENSHOT = [
  'google', 'twitter', 'slack', 'github', 'gmail',
  'discord', 'linkedin', 'reddit', 'medium', 'figma'
];

const TEST_URL = 'http://127.0.0.1:3000/src/public/test-platform-frames-harness.html';

// Screenshot output directory
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'platform-context-frames');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

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
 * Capture screenshots for a single platform
 */
async function capturePlatformScreenshots(page, platformId) {
  console.log(`\n📸 Capturing screenshots for ${platformId}...`);

  const screenshots = {
    platform: platformId,
    darkCardOnly: null,
    darkInContext: null,
    lightCardOnly: null,
    lightInContext: null
  };

  try {
    // Find the platform card in the test harness
    const cardSelector = `#test-${platformId}`;
    const cardExists = await page.$(cardSelector);

    if (!cardExists) {
      console.log(`  ⚠️  Platform card not found: ${platformId}`);
      return screenshots;
    }

    // 1. Capture dark mode - card only
    console.log(`  🌙 Dark mode - Card only...`);
    await page.evaluate(() => {
      // Set to card-only mode
      if (typeof harness !== 'undefined' && harness.setViewMode) {
        harness.setViewMode('card');
      }
    });
    await sleep(500);

    // Scroll to ensure element is visible
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, cardSelector);
    await sleep(500);

    const cardElement = await page.$(cardSelector);
    if (cardElement) {
      const darkCardPath = path.join(SCREENSHOTS_DIR, `${platformId}-dark-card-only.png`);
      await cardElement.screenshot({ path: darkCardPath });
      screenshots.darkCardOnly = darkCardPath;
      console.log(`    ✓ Saved: ${darkCardPath}`);
    }

    // 2. Capture dark mode - in context
    console.log(`  🌙 Dark mode - In context...`);
    await page.evaluate(() => {
      if (typeof harness !== 'undefined' && harness.setViewMode) {
        harness.setViewMode('context');
      }
    });
    await sleep(500);

    const darkContextPath = path.join(SCREENSHOTS_DIR, `${platformId}-dark-in-context.png`);
    const darkContextElement = await page.$(cardSelector);
    if (darkContextElement) {
      await darkContextElement.screenshot({ path: darkContextPath });
      screenshots.darkInContext = darkContextPath;
      console.log(`    ✓ Saved: ${darkContextPath}`);
    }

    // 3. Switch to light mode
    console.log(`  ☀️ Switching to light mode...`);
    await page.evaluate(() => {
      if (typeof harness !== 'undefined' && harness.toggleTheme) {
        harness.toggleTheme();
      }
    });
    await sleep(1000);

    // 4. Capture light mode - card only
    console.log(`  ☀️ Light mode - Card only...`);
    await page.evaluate(() => {
      if (typeof harness !== 'undefined' && harness.setViewMode) {
        harness.setViewMode('card');
      }
    });
    await sleep(500);

    const lightCardPath = path.join(SCREENSHOTS_DIR, `${platformId}-light-card-only.png`);
    const lightCardElement = await page.$(cardSelector);
    if (lightCardElement) {
      await lightCardElement.screenshot({ path: lightCardPath });
      screenshots.lightCardOnly = lightCardPath;
      console.log(`    ✓ Saved: ${lightCardPath}`);
    }

    // 5. Capture light mode - in context
    console.log(`  ☀️ Light mode - In context...`);
    await page.evaluate(() => {
      if (typeof harness !== 'undefined' && harness.setViewMode) {
        harness.setViewMode('context');
      }
    });
    await sleep(500);

    const lightContextPath = path.join(SCREENSHOTS_DIR, `${platformId}-light-in-context.png`);
    const lightContextElement = await page.$(cardSelector);
    if (lightContextElement) {
      await lightContextElement.screenshot({ path: lightContextPath });
      screenshots.lightInContext = lightContextPath;
      console.log(`    ✓ Saved: ${lightContextPath}`);
    }

    // Switch back to dark mode for next platform
    await page.evaluate(() => {
      if (typeof harness !== 'undefined' && harness.toggleTheme) {
        harness.toggleTheme();
      }
    });
    await sleep(500);

    console.log(`  ✅ ${platformId} screenshot capture complete!`);

  } catch (error) {
    console.log(`  ❌ Error capturing ${platformId}: ${error.message}`);
  }

  return screenshots;
}

/**
 * Main screenshot capture function
 */
async function captureAllScreenshots() {
  console.log('🚀 Starting platform context frame screenshot capture...');
  console.log(`Test URL: ${TEST_URL}`);
  console.log(`Platforms to screenshot: ${PLATFORMS_TO_SCREENSHOT.length}`);
  console.log(`Output directory: ${SCREENSHOTS_DIR}\n`);

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
    console.log('📄 Loading test harness...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('✅ Test harness loaded\n');

    // Wait for the harness to initialize
    await sleep(3000);

    const results = [];
    for (const platformId of PLATFORMS_TO_SCREENSHOT) {
      const platformScreenshots = await capturePlatformScreenshots(page, platformId);
      results.push(platformScreenshots);

      // Small delay between platforms
      await sleep(1000);
    }

    // Save screenshot results
    const resultsPath = path.join(__dirname, 'test-results', 'screenshot-capture-results.json');
    const resultsDir = path.dirname(resultsPath);

    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      screenshotsDir: SCREENSHOTS_DIR,
      platforms: results,
      totalScreenshots: results.length * 4 // 4 screenshots per platform
    }, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('📊 SCREENSHOT CAPTURE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Platforms processed: ${results.length}`);
    console.log(`Total screenshots: ${results.length * 4} (4 per platform)`);
    console.log(`Output directory: ${SCREENSHOTS_DIR}`);

    const successfulCaptures = results.filter(r =>
      r.darkCardOnly && r.darkInContext && r.lightCardOnly && r.lightInContext
    );

    console.log(`Successful captures: ${successfulCaptures.length}/${results.length}`);
    console.log(`Results saved to: ${resultsPath}`);

    console.log('\n✅ Screenshot capture complete!');

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