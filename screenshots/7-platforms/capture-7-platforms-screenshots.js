#!/usr/bin/env node

/**
 * Capture Platform Screenshots via ADB (Bead bf-yc1oj)
 *
 * This script captures screenshots of all 7 platforms in both themes
 * using ADB to control Chrome on the connected Pixel 6.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration - CORRECT 7 PLATFORMS
const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'instagram', name: 'Instagram' }
];

const THEMES = ['light', 'dark'];
const TAILSCALE_IP = '100.88.10.113'; // Pixel 6 Tailscale IP
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('📸 Platform Frame Screenshot Capture (Bead bf-yc1oj)');
console.log('='.repeat(70));
console.log(`📱 Target Device: Pixel 6 via ADB`);
console.log(`📁 Screenshot Directory: ${SCREENSHOT_DIR}`);
console.log(`🌐 Platforms: ${PLATFORMS.map(p => p.name).join(', ')}`);
console.log('');

// Helper function to execute ADB commands
function adb(command) {
  try {
    return execSync(`adb ${command}`, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`❌ ADB command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Capture screenshot for a specific platform and theme
async function captureScreenshot(platform, theme) {
  const filename = `${platform.id}-${theme}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  const htmlFile = path.join(__dirname, `${platform.id}-${theme}.html`);

  console.log(`🎯 Capturing: ${platform.name} (${theme} theme)`);

  try {
    // Start a simple HTTP server to serve the HTML files
    const serverPort = 8080;
    const serverProcess = require('child_process').spawn('python3', ['-m', 'http.server', String(serverPort)], {
      cwd: __dirname,
      stdio: 'ignore'
    });

    // Wait for server to start
    await sleep(1000);

    // Open Chrome on the phone with the URL
    const url = `http://${TAILSCALE_IP}:${serverPort}/${path.basename(htmlFile)}`;
    adb(`shell am start -a android.intent.action.VIEW -d '${url}' com.android.chrome`);
    console.log(`   ✓ Opened Chrome with ${url}`);

    // Wait for page to load (3 seconds for reliable rendering)
    await sleep(3000);

    // Capture screenshot
    adb(`shell screencap -p /sdcard/${filename}`);
    console.log(`   ✓ Captured screenshot on device`);

    // Pull screenshot to local machine
    adb(`pull /sdcard/${filename} ${filepath}`);
    console.log(`   ✓ Downloaded to ${filepath}`);

    // Clean up device screenshot
    adb(`shell rm /sdcard/${filename}`);
    console.log(`   ✓ Cleaned up device storage`);

    // Kill the HTTP server
    serverProcess.kill();
    console.log(`   ✓ Stopped HTTP server`);

    console.log(`   ✅ Saved: ${filename}`);
    console.log('');

    return { success: true, platform: platform.id, theme, filepath };
  } catch (error) {
    console.error(`   ❌ Failed to capture ${platform.name} (${theme})`);
    console.error(`   Error: ${error.message}`);
    console.log('');

    return { success: false, platform: platform.id, theme, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting screenshot capture...\n');

  // Verify ADB connection
  try {
    const devices = adb('devices').split('\n').filter(line => line.includes('\tdevice'));
    if (devices.length === 0) {
      console.error('❌ No ADB devices connected. Please connect your device.');
      process.exit(1);
    }
    console.log('✅ ADB device connected\n');
  } catch (error) {
    console.error('❌ ADB check failed. Is ADB installed and device connected?');
    process.exit(1);
  }

  // Capture screenshots for all platforms and themes
  const results = [];

  for (const platform of PLATFORMS) {
    for (const theme of THEMES) {
      const result = await captureScreenshot(platform, theme);
      results.push(result);

      // Small delay between captures to avoid overwhelming the device
      await sleep(1000);
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SCREENSHOT CAPTURE SUMMARY');
  console.log('='.repeat(70));
  console.log('');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total Screenshots: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  // Platform-by-platform breakdown
  console.log('📋 Platform-by-Platform Results:');
  console.log('');

  PLATFORMS.forEach(platform => {
    const lightResult = results.find(r => r.platform === platform.id && r.theme === 'light');
    const darkResult = results.find(r => r.platform === platform.id && r.theme === 'dark');

    const lightStatus = lightResult?.success ? '✅' : '❌';
    const darkStatus = darkResult?.success ? '✅' : '❌';
    const overallStatus = (lightResult?.success && darkResult?.success) ? '✅ PASS' : '❌ FAIL';

    console.log(`${overallStatus} ${platform.name.padEnd(20)} | Light: ${lightStatus} | Dark: ${darkStatus}`);
  });

  console.log('');

  // Acceptance criteria check
  console.log('✅ ACCEPTANCE CRITERIA STATUS:');
  console.log('');

  const allLightSuccessful = PLATFORMS.every(p => {
    const result = results.find(r => r.platform === p.id && r.theme === 'light');
    return result?.success;
  });

  const allDarkSuccessful = PLATFORMS.every(p => {
    const result = results.find(r => r.platform === p.id && r.theme === 'dark');
    return result?.success;
  });

  const criteria = [
    {
      criterion: 'Screenshot captured for all 7 platforms in light theme',
      status: allLightSuccessful,
      details: `${successful.filter(r => r.theme === 'light').length}/7 light theme screenshots`
    },
    {
      criterion: 'Screenshot captured for all 7 platforms in dark theme',
      status: allDarkSuccessful,
      details: `${successful.filter(r => r.theme === 'dark').length}/7 dark theme screenshots`
    },
    {
      criterion: 'All platforms captured successfully',
      status: failed.length === 0,
      details: `${successful.length}/${results.length} screenshots successful`
    }
  ];

  criteria.forEach(({ criterion, status, details }) => {
    const icon = status ? '✅' : '❌';
    console.log(`${icon} ${criterion}`);
    console.log(`   ${details}`);
    console.log('');
  });

  // Final verdict
  const allCriteriaPassed = criteria.every(c => c.status);

  console.log('='.repeat(70));
  if (allCriteriaPassed) {
    console.log('🎉 SCREENSHOT CAPTURE COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('All acceptance criteria met. Next steps:');
    console.log('   ✅ Review screenshots in: ' + SCREENSHOT_DIR);
    console.log('   ✅ Verify cards render embedded in frames');
    console.log('   ✅ Check platform chrome looks realistic');
    console.log('   ✅ Look for rendering artifacts or layout issues');
  } else {
    console.log('⚠️  SCREENSHOT CAPTURE INCOMPLETE');
    console.log('');
    console.log('Some acceptance criteria not met. Please review the results above.');
    if (failed.length > 0) {
      console.log('');
      console.log('Failed captures:');
      failed.forEach(f => {
        console.log(`   ❌ ${f.platform} (${f.theme}): ${f.error}`);
      });
    }
  }
  console.log('='.repeat(70));

  process.exit(allCriteriaPassed ? 0 : 1);
}

// Run the main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});