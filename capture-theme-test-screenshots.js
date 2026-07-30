#!/usr/bin/env node

/**
 * Helper script to capture theme switching test screenshots
 * This creates a simple HTML page that loads all platforms and allows manual screenshot capture
 */

const fs = require('fs');
const path = require('path');

const PLATFORMS = [
  // Screenshot platforms (12 representative platforms)
  'google', 'facebook', 'twitter', 'slack', 'discord',
  'github', 'reddit', 'instagram', 'linkedin', 'medium', 'youtube', 'telegram'
];

const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'theme-test');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Theme Test Screenshot Guide');
console.log('='.repeat(60));
console.log('\nThis script will help you capture screenshots for theme testing.');
console.log('\nSteps:');
console.log('1. Open the test harness in your browser:');
console.log('   http://127.0.0.1:8080/src/public/test-platform-frames-harness.html');
console.log('\n2. For each platform below:');
console.log('   - Find the platform card');
console.log('   - Click toggle to enter "in context" mode');
console.log('   - Click theme toggle (☀️/🌙)');
console.log('   - Take screenshot of dark mode');
console.log('   - Click theme toggle again');
console.log('   - Take screenshot of light mode');
console.log('\n3. Save screenshots to:', OUTPUT_DIR);
console.log('\nPlatforms to screenshot:\n');

PLATFORMS.forEach((platform, index) => {
  console.log(`${index + 1}. ${platform}`);
  console.log(`   - ${platform}-dark.png`);
  console.log(`   - ${platform}-light.png`);
});

console.log('\n' + '='.repeat(60));
console.log('\n💡 Tip: Use browser DevTools to take screenshots:');
console.log('   - Open DevTools (F12 or Cmd+Option+I)');
console.log('   - Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Linux/Windows)');
console.log('   - Type "screenshot" and select "Capture node screenshot"');
console.log('   - Click on the platform card to capture just that element');
console.log('\nOr use the full-page screenshot:');
console.log('   - Right-click on page → "Capture full size screenshot"');
console.log('   - Crop to the relevant platform card');

console.log('\nExpected screenshot count:', PLATFORMS.length * 2, '(2 per platform)');
console.log('\n' + '='.repeat(60));
