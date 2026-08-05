#!/usr/bin/env node

/**
 * Capture comprehensive screenshots for Facebook, LinkedIn, and Reddit frames
 * Uses ADB to control Android phone Chrome browser
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500' }
];

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots-social-frames');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function adbCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error(`ADB command failed: ${cmd}`);
    return null;
  }
}

function openUrlInChrome(url) {
  console.log(`📱 Opening ${url} in Chrome...`);

  // Open Chrome with the URL
  adbCommand(`adb shell am start -a android.intent.action.VIEW -d '${url}' com.android.chrome`);

  // Wait for page to load
  console.log('⏳ Waiting for page load...');
  sleep(3000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function takeScreenshot(filename) {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  console.log(`📸 Capturing screenshot: ${filename}`);

  // Take screenshot on device
  adbCommand('adb shell screencap -p /sdcard/screen.png');

  // Pull screenshot to local machine
  adbCommand(`adb pull /sdcard/screen.png "${filepath}"`);

  // Clean up device screenshot
  adbCommand('adb shell rm /sdcard/screen.png');

  return filepath;
}

function clickThemeToggle() {
  console.log('🔄 Clicking theme toggle button...');

  // Click the theme toggle button (top-right corner)
  adbCommand('adb shell input tap 1050 100');

  // Wait for theme transition
  sleep(500);
}

async function capturePlatformScreenshots(platform) {
  console.log(`\n🎨 Capturing ${platform.name} frames...`);
  console.log('=' .repeat(50));

  const testUrl = `${BASE_URL}/test-${platform.id}-frame.html`;
  const results = [];

  // Open test page
  openUrlInChrome(testUrl);

  // Dark mode screenshot
  console.log(`🌙 Dark mode - ${platform.name}`);
  const darkScreenshot = takeScreenshot(`${platform.id}-dark-theme.png`);
  results.push({ mode: 'dark', file: darkScreenshot });

  // Switch to light mode
  clickThemeToggle();
  sleep(1000);

  // Light mode screenshot
  console.log(`☀️ Light mode - ${platform.name}`);
  const lightScreenshot = takeScreenshot(`${platform.id}-light-theme.png`);
  results.push({ mode: 'light', file: lightScreenshot });

  return results;
}

async function main() {
  console.log('🚀 Starting comprehensive screenshot capture...');
  console.log(`📁 Screenshot directory: ${SCREENSHOT_DIR}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const allResults = [];

  for (const platform of PLATFORMS) {
    const results = await capturePlatformScreenshots(platform);
    allResults.push({
      platform: platform.id,
      name: platform.name,
      screenshots: results
    });

    // Small pause between platforms
    sleep(1000);
  }

  console.log('\n✅ Screenshot capture completed!');
  console.log('=' .repeat(50));

  allResults.forEach(result => {
    console.log(`\n${result.name}:`);
    result.screenshots.forEach(ss => {
      console.log(`  ${ss.mode.padEnd(6)}: ${ss.file}`);
    });
  });

  // Generate report
  const reportPath = path.join(SCREENSHOT_DIR, 'capture-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

main().catch(console.error);