/**
 * Platform Frames Screenshot Capture Script
 * Captures screenshots of all 7 platform frames for verification
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Platform configurations
const platforms = [
  { name: 'twitter', file: 'test-twitter-frame.html', width: 600, height: 400 },
  { name: 'instagram', file: 'test-instagram-frame.html', width: 400, height: 500 },
  { name: 'youtube', file: 'test-youtube-frame.html', width: 700, height: 500 },
  { name: 'tiktok', file: 'test-tiktok-frame.html', width: 400, height: 700 },
  { name: 'pinterest', file: 'test-pinterest-frame.html', width: 400, height: 600 },
  { name: 'linkedin', file: 'test-linkedin-frame.html', width: 600, height: 450 },
  { name: 'reddit', file: 'test-reddit-frame.html', width: 600, height: 400 },
];

const BASE_URL = 'http://localhost:8080/';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capturePlatformScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('🎯 Starting platform frame screenshot capture...\n');

  const results = [];

  for (const platform of platforms) {
    console.log(`📸 Capturing ${platform.name}...`);

    try {
      const page = await browser.newPage();

      // Set viewport to match platform dimensions
      await page.setViewport({
        width: platform.width,
        height: platform.height,
        deviceScaleFactor: 2 // Retina quality
      });

      // Navigate to the platform test page
      await page.goto(`${BASE_URL}${platform.file}`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });

      // Wait a bit for any animations to settle
      await page.waitForTimeout(500);

      // Capture screenshot
      const screenshotPath = path.join(OUTPUT_DIR, `${platform.name}-frame.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false
      });

      console.log(`   ✅ Saved: ${screenshotPath}`);

      results.push({
        platform: platform.name,
        status: 'success',
        path: screenshotPath
      });

      await page.close();
    } catch (error) {
      console.error(`   ❌ Error capturing ${platform.name}:`, error.message);

      results.push({
        platform: platform.name,
        status: 'error',
        error: error.message
      });
    }
  }

  await browser.close();

  // Print summary
  console.log('\n📊 Capture Summary:');
  console.log('─'.repeat(50));

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  console.log(`✅ Successful: ${successful}/${platforms.length}`);
  console.log(`❌ Failed: ${failed}/${platforms.length}`);

  if (failed > 0) {
    console.log('\nFailed platforms:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`  - ${r.platform}: ${r.error}`));
  }

  console.log('\n📁 Screenshots saved to:', OUTPUT_DIR);

  return results;
}

// Run the capture
capturePlatformScreenshots()
  .then(results => {
    console.log('\n✨ Screenshot capture complete!');
    process.exit(results.every(r => r.status === 'success') ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
