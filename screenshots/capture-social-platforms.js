#!/usr/bin/env node

/**
 * 7 Social Media Platforms Screenshot Capture
 *
 * Captures screenshots for all 7 required social media platforms in both themes:
 * - Facebook, Instagram, LinkedIn, Reddit, Twitter/X, YouTube, TikTok
 *
 * Usage: node screenshots/capture-social-platforms.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// The 7 required social media platforms
const SOCIAL_PLATFORMS = [
  'facebook',
  'instagram', 
  'linkedin',
  'reddit',
  'twitter',
  'youtube',
  'tiktok'
];

const TEST_URL = 'http://127.0.0.1:8080/test-all-platforms-theme-switching.html';

// Screenshot output directory
const SCREENSHOTS_DIR = path.join(__dirname, 'social-platforms-verification');
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
 * Capture screenshots for a single platform in both themes
 */
async function capturePlatformScreenshots(page, platformId) {
  console.log(`\n📸 Capturing screenshots for ${platformId}...`);

  const screenshots = {
    platform: platformId,
    dark: null,
    light: null
  };

  try {
    // Find the platform card in the test harness
    const cardSelector = `#frame-${platformId}`;

    // Wait for the platform to be available
    await page.waitForSelector(cardSelector, { timeout: 10000 }).catch(() => {
      console.log(`  ⚠️  Platform card not found: ${platformId}`);
    });

    // 1. Capture dark theme
    console.log(`  🌙 Dark theme...`);
    await page.evaluate((id) => {
      const container = document.getElementById(`frame-${id}`);
      if (container && typeof window.switchTheme === 'function') {
        window.switchTheme(id, 'dark');
      }
    }, platformId);
    await sleep(2000);

    const darkPath = path.join(SCREENSHOTS_DIR, `${platformId}-dark.png`);
    const element = await page.$(cardSelector);
    if (element) {
      await element.screenshot({ path: darkPath });
      screenshots.dark = darkPath;
      console.log(`    ✓ Saved: ${darkPath}`);
    }

    // 2. Capture light theme
    console.log(`  ☀️ Light theme...`);
    await page.evaluate((id) => {
      const container = document.getElementById(`frame-${id}`);
      if (container && typeof window.switchTheme === 'function') {
        window.switchTheme(id, 'light');
      }
    }, platformId);
    await sleep(2000);

    const lightPath = path.join(SCREENSHOTS_DIR, `${platformId}-light.png`);
    const lightElement = await page.$(cardSelector);
    if (lightElement) {
      await lightElement.screenshot({ path: lightPath });
      screenshots.light = lightPath;
      console.log(`    ✓ Saved: ${lightPath}`);
    }

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
  console.log('🚀 Starting 7 Social Media Platforms screenshot capture...');
  console.log(`Test URL: ${TEST_URL}`);
  console.log(`Platforms to screenshot: ${SOCIAL_PLATFORMS.length}`);
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
    await sleep(5000);

    const results = [];
    for (const platformId of SOCIAL_PLATFORMS) {
      const platformScreenshots = await capturePlatformScreenshots(page, platformId);
      results.push(platformScreenshots);

      // Small delay between platforms
      await sleep(1000);
    }

    // Save screenshot results
    const resultsPath = path.join(__dirname, 'test-results', 'social-platforms-capture-results.json');
    const resultsDir = path.dirname(resultsPath);

    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      screenshotsDir: SCREENSHOTS_DIR,
      platforms: results,
      totalScreenshots: results.length * 2 // 2 screenshots per platform
    }, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('📊 SOCIAL MEDIA PLATFORMS SCREENSHOT CAPTURE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Platforms processed: ${results.length}`);
    console.log(`Total screenshots: ${results.length * 2} (2 per platform)`);
    console.log(`Output directory: ${SCREENSHOTS_DIR}`);

    const successfulCaptures = results.filter(r =>
      r.dark && r.light
    );

    console.log(`Successful captures: ${successfulCaptures.length}/${results.length}`);
    console.log(`Results saved to: ${resultsPath}`);

    console.log('\n✅ Social media platforms screenshot capture complete!');

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
