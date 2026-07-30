#!/usr/bin/env node

/**
 * Capture YouTube and TikTok screenshots using ADB (Pixel 6)
 *
 * This script opens the verification page on the connected device
 * and captures screenshots in both themes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error(`Error executing: ${command}`);
    console.error(error.message);
    throw error;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  console.log('📸 Starting YouTube & TikTok Screenshot Capture via ADB...\n');

  // Check if device is connected
  try {
    exec('adb devices');
    console.log('✓ ADB device connected\n');
  } catch (error) {
    console.error('❌ No ADB device connected');
    process.exit(1);
  }

  // First, we need to start a local server to serve the HTML files
  console.log('🚀 Starting local HTTP server...');
  const serverPort = 8080;

  // Kill any existing server on that port
  execSync(`pkill -f "python.*${serverPort}" || true`, { stdio: 'ignore' });

  // Start a simple HTTP server
  const server = execSync('python3 -m http.server 8080', {
    cwd: path.join(__dirname, 'src/public'),
    stdio: 'pipe'
  });
  console.log(`✓ Server running on port ${serverPort}\n`);

  await sleep(2000); // Let server start

  try {
    const testUrl = `http://100.88.10.113:${serverPort}/verify-youtube-tiktok-screenshots.html`;

    console.log('📱 Opening verification page on device...');
    // Open Chrome on the device with our test page
    exec(`adb shell am start -a android.intent.action.VIEW -d '${testUrl}' com.android.chrome`);
    await sleep(5000); // Wait for page to load

    console.log('\n📸 Capturing DARK mode screenshots...');

    // Wait for theme to settle
    await sleep(2000);

    // Take full screenshot in dark mode
    console.log('  → Full page (dark mode)...');
    exec(`adb shell screencap -p > ${path.join(screenshotsDir, 'four-platforms-dark.png')}`);
    console.log('    ✓ Saved: four-platforms-dark.png');

    await sleep(1000);

    // Tap the theme toggle button
    console.log('\n🌓 Switching to LIGHT mode...');
    exec('adb shell input tap 1200 50'); // Approximate position of theme button
    await sleep(2000); // Wait for theme transition

    // Take full screenshot in light mode
    console.log('  → Full page (light mode)...');
    exec(`adb shell screencap -p > ${path.join(screenshotsDir, 'four-platforms-light.png')}`);
    console.log('    ✓ Saved: four-platforms-light.png');

    await sleep(1000);

    console.log('\n✅ Screenshots captured successfully!');
    console.log(`\n📁 Screenshots saved to: ${screenshotsDir}`);
    console.log('\n📋 Files created:');
    console.log('   - four-platforms-dark.png (YouTube + TikTok, dark mode)');
    console.log('   - four-platforms-light.png (YouTube + TikTok, light mode)');

  } catch (error) {
    console.error('❌ Error during capture:', error.message);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      execSync('pkill -f "python.*8080"', { stdio: 'ignore' });
      console.log('✓ Server stopped');
    } catch (e) {
      // Server already stopped
    }
  }
}

// Run the capture
captureScreenshots().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
