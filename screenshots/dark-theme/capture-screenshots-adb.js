#!/usr/bin/env node

/**
 * Dark Theme Platform Screenshot Capture using ADB (Bead bf-b6pnm)
 *
 * This script captures screenshots of all 7 platform frames in dark theme
 * using Android Debug Bridge (ADB) with a phone connected via Tailscale.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'discord', name: 'Discord' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'signal', name: 'Signal' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'mastodon', name: 'Mastodon' }
];

const SERVER_URL = 'http://100.88.10.113:8081'; // Access server via Tailscale from phone
const OUTPUT_DIR = __dirname;
const THEME = 'dark';

console.log('🌙 Dark Theme Platform Screenshot Capture using ADB');
console.log('='.repeat(60));
console.log(`Server URL: ${SERVER_URL}`);
console.log(`Output directory: ${OUTPUT_DIR}`);
console.log(`Platforms: ${PLATFORMS.length}`);
console.log('');

// Check ADB connection
try {
  const adbCheck = execSync('adb-check', { encoding: 'utf8' });
  console.log('✅ ADB connected:', adbCheck.trim());
} catch (error) {
  console.error('❌ ADB not connected. Please run: adb-check');
  process.exit(1);
}

console.log('');

async function captureScreenshots() {
  const results = [];

  for (const platform of PLATFORMS) {
    const url = `${SERVER_URL}/${platform.id}-${THEME}.html`;
    const screenshotPath = path.join(OUTPUT_DIR, `${platform.id}-${THEME}.png`);

    console.log(`📸 Capturing ${platform.name}...`);
    console.log(`   URL: ${url}`);

    try {
      // Open the platform page in Chrome
      execSync(
        `adb shell am start -a android.intent.action.VIEW -d '${url}' com.android.chrome`,
        { stdio: 'ignore' }
      );

      // Wait for page to load and render
      console.log('   ⏳ Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Take screenshot
      execSync(
        'adb shell screencap -p > /tmp/screen.png',
        { stdio: 'ignore' }
      );

      // Copy to final location
      execSync(
        `cp /tmp/screen.png '${screenshotPath}'`,
        { stdio: 'ignore' }
      );

      // Verify file was created and has content
      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        if (stats.size > 10000) { // At least 10KB
          console.log(`   ✅ Saved: ${platform.id}-${THEME}.png (${Math.round(stats.size / 1024)} KB)`);
          results.push({
            platform: platform.id,
            success: true,
            path: screenshotPath,
            size: stats.size
          });
        } else {
          console.log(`   ❌ Screenshot too small (${stats.size} bytes) - may be blank`);
          results.push({
            platform: platform.id,
            success: false,
            error: 'Screenshot too small'
          });
        }
      } else {
        console.log(`   ❌ Failed to create screenshot file`);
        results.push({
          platform: platform.id,
          success: false,
          error: 'File not created'
        });
      }

      // Small delay between platforms
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        platform: platform.id,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// Main execution
(async () => {
  try {
    console.log('📱 Make sure Chrome is open on the phone and ready to accept deep links...');
    console.log('⏳ Starting capture in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const results = await captureScreenshots();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SCREENSHOT CAPTURE SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${PLATFORMS.length}`);
    console.log(`❌ Failed: ${failed.length}/${PLATFORMS.length}`);

    if (failed.length > 0) {
      console.log('\nFailed platforms:');
      failed.forEach(r => {
        console.log(`  - ${r.platform}: ${r.error}`);
      });
    }

    if (successful.length === PLATFORMS.length) {
      console.log('\n🎉 All screenshots captured successfully!');
      console.log('\nNext steps:');
      console.log('1. Verify screenshots: node verify-dark-theme-screenshots.js');
      console.log('2. Commit: git add screenshots/dark-theme/*-dark.png');
      console.log('3. Close bead: br close bf-b6pnm');
    }

    process.exit(successful.length === PLATFORMS.length ? 0 : 1);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();
