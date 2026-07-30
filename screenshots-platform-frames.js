#!/usr/bin/env node
/**
 * Automated Screenshot Capture for Platform Frames
 *
 * This script captures screenshots of all 7 platform context frame test pages:
 * - Twitter (X)
 * - Instagram
 * - YouTube
 * - TikTok
 * - Pinterest
 * - LinkedIn
 * - Reddit
 *
 * Usage:
 *   node screenshots-platform-frames.js
 *   npm run screenshots
 *
 * Requirements:
 *   - The vista server must be running on port 3000 (run `npm start`)
 *   - Puppeteer is installed (already in package.json dependencies)
 *
 * Output:
 *   Screenshots are saved to ./screenshots/ directory with platform-identifying names:
 *   - twitter-frame.png
 *   - instagram-frame.png
 *   - youtube-frame.png
 *   - tiktok-frame.png
 *   - pinterest-frame.png
 *   - linkedin-frame.png
 *   - reddit-frame.png
 *
 * Dependencies: puppeteer (v25.3.0+)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// All 7 platform frame test pages
const platforms = [
  { name: 'Twitter', path: '/test-twitter-frame.html' },
  { name: 'Instagram', path: '/test-instagram-frame.html' },
  { name: 'YouTube', path: '/test-youtube-frame.html' },
  { name: 'TikTok', path: '/test-tiktok-frame.html' },
  { name: 'Pinterest', path: '/test-pinterest-frame.html' },
  { name: 'LinkedIn', path: '/test-linkedin-frame.html' },
  { name: 'Reddit', path: '/test-reddit-frame.html' }
];

async function takeScreenshots() {
  console.log('🧪 Starting automated platform frame screenshot capture...\n');

  // Check if server is reachable
  console.log(`📡 Checking if server is running on ${BASE_URL}...`);
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
  } catch (error) {
    console.error(`\n❌ ERROR: Cannot connect to ${BASE_URL}`);
    console.error('Please start the vista server first: npm start\n');
    process.exit(1);
  }
  console.log('   ✅ Server is reachable\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (const platform of platforms) {
    console.log(`📸 Capturing ${platform.name}...`);
    const page = await browser.newPage();

    try {
      // Set viewport size (desktop dimensions)
      await page.setViewport({ width: 1200, height: 800 });

      // Navigate to the platform frame test page
      await page.goto(`${BASE_URL}${platform.path}`, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Wait for animations to settle
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotPath = path.join(screenshotsDir, `${platform.name.toLowerCase()}-frame.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false
      });

      console.log(`   ✅ Saved to ${screenshotPath}`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error capturing ${platform.name}:`, error.message);
      failCount++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Screenshot capture complete!`);
  console.log(`   Success: ${successCount}/${platforms.length}`);
  if (failCount > 0) {
    console.log(`   Failed: ${failCount}/${platforms.length}`);
  }
  console.log(`\n📁 Screenshots saved to: ${screenshotsDir}`);
  console.log('='.repeat(50));
}

// Run the capture
takeScreenshots().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});