#!/usr/bin/env node
/**
 * Automated Platform Frame Screenshot Capture (Playwright)
 *
 * This script captures screenshots of all 8 platform context frame test pages
 * in both dark and light modes using Playwright.
 *
 * Usage:
 *   node screenshots/capture-frames-playwright.js
 *   npm run screenshots
 *
 * Requirements:
 *   - Playwright installed (already in package.json devDependencies)
 *   - Test HTML files exist in src/public/
 *
 * Platforms Covered:
 *   - Twitter (X): test-twitter-frame.html
 *   - Instagram: test-instagram-frame.html
 *   - YouTube: test-youtube-frame.html
 *   - TikTok: test-tiktok-frame.html
 *   - Pinterest: test-pinterest-frame.html
 *   - LinkedIn: test-linkedin-frame.html
 *   - Reddit: test-reddit-frame.html
 *   - Facebook: test-facebook-frame.html
 *
 * Output:
 *   Screenshots saved to ./screenshots/ with platform-identifying names:
 *   - {platform}-dark.png (e.g., twitter-dark.png)
 *   - {platform}-light.png (e.g., twitter-light.png)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const platforms = [
  { name: 'twitter', file: 'test-twitter-frame.html' },
  { name: 'instagram', file: 'test-instagram-frame.html' },
  { name: 'youtube', file: 'test-youtube-frame.html' },
  { name: 'tiktok', file: 'test-tiktok-frame.html' },
  { name: 'pinterest', file: 'test-pinterest-frame.html' },
  { name: 'linkedin', file: 'test-linkedin-frame.html' },
  { name: 'reddit', file: 'test-reddit-frame.html' },
  { name: 'facebook', file: 'test-facebook-frame.html' }
];

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🧪 Starting platform frame screenshot capture with Playwright...\n');

  const browser = await chromium.launch({
    headless: true
  });

  let successCount = 0;
  let failCount = 0;

  for (const platform of platforms) {
    console.log(`📸 Capturing ${platform.name}...`);
    const page = await browser.newPage();
    const filePath = `file://${path.join(__dirname, '..', 'src', 'public', platform.file)}`;

    try {
      await page.goto(filePath, { waitUntil: 'networkidle', timeout: 10000 });

      // Wait for animations/theme loading
      await page.waitForTimeout(500);

      // Dark mode screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `${platform.name}-frame-dark.png`),
        fullPage: true
      });
      console.log(`   ✓ Dark mode: ${platform.name}-frame-dark.png`);

      // Switch to light mode
      await page.evaluate(() => {
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.click();
      });

      await page.waitForTimeout(500);

      // Light mode screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `${platform.name}-frame-light.png`),
        fullPage: true
      });
      console.log(`   ✓ Light mode: ${platform.name}-frame-light.png`);

      console.log(`   ✅ ${platform.name} captured successfully\n`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to capture ${platform.name}:`, error.message);
      failCount++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('='.repeat(50));
  console.log(`✅ Screenshot capture complete!`);
  console.log(`   Success: ${successCount}/${platforms.length}`);
  if (failCount > 0) {
    console.log(`   Failed: ${failCount}/${platforms.length}`);
  }
  console.log(`\n📁 Screenshots saved to: ${screenshotsDir}`);
  console.log('='.repeat(50));
}

captureScreenshots().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
