#!/usr/bin/env node

/**
 * Twitter/X Frame Screenshot Capture Script
 *
 * This script uses Playwright to capture screenshots of the Twitter/X frame
 * in both dark and light themes for manual verification.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'twitter-x-frame');
const TEST_FILE = `file://${path.join(__dirname, 'test-twitter-frame.html')}`;

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🎸 Starting browser for Twitter/X frame screenshot capture...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log('📄 Loading test page...');
    await page.goto(TEST_FILE, { waitUntil: 'networkidle0' });

    // Wait for page to load completely
    await page.waitForTimeout(2000);

    // Capture dark theme screenshots
    console.log('🌙 Capturing dark theme screenshots...');

    // Overall page in dark theme
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'dark-theme-full.png'),
      fullPage: true
    });

    // Individual frame close-ups in dark theme
    const frames = await page.$$('.twitter-context');
    for (let i = 0; i < frames.length; i++) {
      await frames[i].screenshot({
        path: path.join(SCREENSHOTS_DIR, `dark-theme-frame-${i + 1}.png`)
      });
    }

    // Switch to light theme
    console.log('☀️  Switching to light theme...');
    await page.click('#themeToggle');
    await page.waitForTimeout(2000); // Wait for theme transition

    // Capture light theme screenshots
    console.log('☀️  Capturing light theme screenshots...');

    // Overall page in light theme
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'light-theme-full.png'),
      fullPage: true
    });

    // Individual frame close-ups in light theme
    const lightFrames = await page.$$('.twitter-context');
    for (let i = 0; i < lightFrames.length; i++) {
      await lightFrames[i].screenshot({
        path: path.join(SCREENSHOTS_DIR, `light-theme-frame-${i + 1}.png`)
      });
    }

    // Switch back to dark theme for verification
    console.log('🌙 Switching back to dark theme...');
    await page.click('#themeToggle');
    await page.waitForTimeout(2000);

    // Capture a verification shot showing theme toggle button
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'theme-toggle-button.png'),
      fullPage: false
    });

    console.log('✅ Screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    // List captured files
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    console.log('\n📋 Captured files:');
    files.forEach(file => {
      const filePath = path.join(SCREENSHOTS_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureScreenshots().catch(error => {
  console.error('💥 Screenshot capture failed:', error);
  process.exit(1);
});