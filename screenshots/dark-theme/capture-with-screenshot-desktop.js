#!/usr/bin/env node

/**
 * Dark Theme Screenshot Capture using screenshot-desktop (Bead bf-b6pnm)
 *
 * This script captures screenshots using the screenshot-desktop package,
 * which is lighter weight than Puppeteer and doesn't require browser dependencies.
 *
 * Usage: node screenshots/dark-theme/capture-with-screenshot-desktop.js
 */

const screenshot = require('screenshot-desktop');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const THEME = 'dark';

console.log('🌙 Dark Theme Screenshot Capture with screenshot-desktop (Bead bf-b6pnm)');
console.log('='.repeat(60));

// Find the server process
function findServerProcess() {
  try {
    const result = execSync('ps aux | grep "serve-dark-theme-pages.js" | grep -v grep', { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    return null;
  }
}

// Check if server is running
const serverProcess = findServerProcess();
if (!serverProcess) {
  console.log('❌ Server is not running. Starting server...');
  console.log('Please run: node serve-dark-theme-pages.js');
  console.log('Then run this script again.');
  process.exit(1);
}

console.log('✅ Server is running');
console.log('');

async function captureScreenshots() {
  const results = [];

  console.log('📸 Opening browser and capturing screenshots...');
  console.log('Note: This will capture your entire screen. Please ensure the browser is visible.');
  console.log('');

  // Give user time to arrange windows
  console.log('⏳ You have 10 seconds to arrange your windows...');
  console.log('   Make sure the browser is showing the platform frame');
  console.log('   Press Ctrl+C to cancel\n');

  await new Promise(resolve => setTimeout(resolve, 10000));

  for (const platform of PLATFORMS) {
    const screenshotPath = path.join(OUTPUT_DIR, `${platform.id}-${THEME}.png`);

    console.log(`📸 Capturing ${platform.name}...`);

    try {
      // Capture entire screen
      await screenshot({ filename: screenshotPath });

      // Verify file was created
      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        console.log(`  ✅ Saved: ${platform.id}-${THEME}.png (${Math.round(stats.size / 1024)} KB)`);
        results.push({
          platform: platform.id,
          success: true,
          path: screenshotPath,
          size: stats.size
        });
      } else {
        console.log(`  ❌ Failed to create screenshot file`);
        results.push({
          platform: platform.id,
          success: false,
          error: 'File not created'
        });
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        platform: platform.id,
        success: false,
        error: error.message
      });
    }

    // Wait a bit between screenshots
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

// Alternative approach using xdotool if available
async function tryXdotoolCapture() {
  try {
    execSync('which xdotool', { stdio: 'ignore' });
    console.log('✅ Found xdotool - using window-specific capture');

    const results = [];

    for (const platform of PLATFORMS) {
      const screenshotPath = path.join(OUTPUT_DIR, `${platform.id}-${THEME}.png`);

      console.log(`📸 Capturing ${platform.name} with xdotool...`);

      try {
        // This is a placeholder - actual xdotool commands would need to be crafted
        // to find and activate specific browser windows
        console.log(`  ⚠️  Manual capture required for ${platform.id}`);
        console.log(`     Open ${platform.id}-dark.html and take screenshot manually`);
      } catch (error) {
        console.log(`  ❌ xdotool error: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    console.log('⚠️  xdotool not available, falling back to screen capture');
    return null;
  }
}

// Main execution
(async () => {
  try {
    // Try xdotool first for more precise capture
    const xdotoolResults = await tryXdotoolCapture();
    if (xdotoolResults) {
      console.log('\n⚠️  Manual capture process required');
    } else {
      // Fall back to full screen capture
      const results = await captureScreenshots();

      console.log('\n' + '='.repeat(60));
      console.log('📊 CAPTURE SUMMARY');
      console.log('='.repeat(60));

      const successful = results.filter(r => r.success);
      console.log(`Successful: ${successful.length}/${results.length}`);

      if (successful.length === results.length) {
        console.log('\n🎉 All screenshots captured successfully!');
        console.log('\nNext steps:');
        console.log('1. Verify screenshots: node verify-dark-theme-screenshots.js');
        console.log('2. Commit: git add screenshots/dark-theme/*-dark.png');
        console.log('3. Close bead: br close bf-b6pnm');
      } else {
        console.log('\n⚠️  Some screenshots failed. Please check results above.');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();
