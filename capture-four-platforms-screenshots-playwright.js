#!/usr/bin/env node
/**
 * Four Platform Screenshot Capture Script
 *
 * Captures screenshots of all four social platform frames (Reddit, Twitter/X, YouTube, TikTok)
 * in both dark and light themes using Playwright.
 *
 * Usage:
 *   node capture-four-platforms-screenshots-playwright.js
 *
 * Platforms Covered:
 *   - Reddit
 *   - Twitter/X
 *   - YouTube
 *   - TikTok
 *
 * Output:
 *   Screenshots saved to ./screenshots/four-platforms/:
 *   - four-platforms-dark.png (all platforms in dark mode)
 *   - four-platforms-light.png (all platforms in light mode)
 *   - Individual platform shots: reddit-dark.png, twitter-light.png, etc.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots', 'four-platforms');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🎨 Starting Four Platform Frame Screenshot Capture...\n');

  const browser = await chromium.launch({
    headless: true,
    viewport: { width: 1600, height: 1200 }
  });

  const page = await browser.newPage();

  // Navigate to the test page
  const testPagePath = path.join(__dirname, 'test-all-four-social-platforms.html');
  const testPageUrl = `file://${testPagePath}`;

  try {
    console.log('📸 Loading test page...');
    await page.goto(testPageUrl, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000); // Wait for animations to settle

    // Dark mode screenshot
    console.log('   ✓ Capturing dark mode...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'four-platforms-dark.png'),
      fullPage: true
    });
    console.log('   → Saved: four-platforms-dark.png');

    // Switch to light mode
    console.log('   🌓 Switching to light mode...');
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle-btn');
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(1000); // Wait for theme transition

    // Light mode screenshot
    console.log('   ✓ Capturing light mode...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'four-platforms-light.png'),
      fullPage: true
    });
    console.log('   → Saved: four-platforms-light.png');

    // Now capture individual platforms in both themes
    const platforms = ['reddit', 'twitter', 'youtube', 'tiktok'];

    for (const platform of platforms) {
      console.log(`\n📱 Capturing ${platform} frame...`);

      // Find and capture individual platform frame
      const frameElement = await page.$(`#${platform}-frame`);
      if (frameElement) {
        // Dark mode individual shot
        await frameElement.screenshot({
          path: path.join(screenshotsDir, `${platform}-dark.png`)
        });
        console.log(`   ✓ ${platform}-dark.png`);
      }
    }

    // Switch back to dark for individual light mode shots
    console.log('\n   🌓 Switching back to dark mode...');
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle-btn');
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(1000);

    for (const platform of platforms) {
      console.log(`\n📱 Capturing ${platform} frame (light mode)...`);

      const frameElement = await page.$(`#${platform}-frame`);
      if (frameElement) {
        await frameElement.screenshot({
          path: path.join(screenshotsDir, `${platform}-light.png`)
        });
        console.log(`   ✓ ${platform}-light.png`);
      }
    }

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    console.log('\n📋 Files created:');
    console.log('   - four-platforms-dark.png (all platforms, dark)');
    console.log('   - four-platforms-light.png (all platforms, light)');
    platforms.forEach(p => {
      console.log(`   - ${p}-dark.png`);
      console.log(`   - ${p}-light.png`);
    });

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});