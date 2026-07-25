#!/usr/bin/env node

/**
 * Automated screenshot capture for theme transition testing
 * Captures both dark and light themes, plus rapid switching states
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'theme-transitions');
const TEST_PAGE = 'file://' + path.join(__dirname, 'test-visual-theme-transitions.html');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureThemeScreenshots() {
  console.log('🎨 Capturing Theme Transition Screenshots');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport to a common desktop size
  await page.setViewport({ width: 1280, height: 800 });

  console.log('📄 Loading test page...');
  await page.goto(TEST_PAGE, { waitUntil: 'networkidle0' });

  // Wait for the page to fully render
  await page.waitForTimeout(1000);

  // Capture dark theme (default)
  console.log('🌙 Capturing dark theme...');
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'theme-dark.png'),
    fullPage: true
  });

  // Switch to light theme
  console.log('☀️ Switching to light theme...');
  await page.evaluate(() => {
    document.body.setAttribute('data-theme', 'light');
  });

  // Wait for transition to complete (0.3s + buffer)
  await page.waitForTimeout(500);

  // Capture light theme
  console.log('☀️ Capturing light theme...');
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'theme-light.png'),
    fullPage: true
  });

  // Test rapid switching
  console.log('⚡ Testing rapid theme switching...');

  const rapidTestScreenshots = [];

  for (let i = 0; i < 5; i++) {
    // Toggle theme
    await page.evaluate(() => {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);
    });

    // Small delay to capture transition in progress
    await page.waitForTimeout(100); // Capture during transition

    // Capture the transition state
    const filename = `rapid-switch-${i + 1}-${(i % 2 === 0) ? 'to-light' : 'to-dark'}.png`;
    await page.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      fullPage: true
    });

    rapidTestScreenshots.push(filename);

    // Wait for transition to complete before next toggle
    await page.waitForTimeout(300);
  }

  // Final state
  console.log('📊 Capturing final state...');
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'theme-final.png'),
    fullPage: true
  });

  await browser.close();

  console.log('\n✅ Screenshots captured successfully!');
  console.log('📁 Output directory:', OUTPUT_DIR);
  console.log('\nCaptured files:');
  console.log('  • theme-dark.png - Dark theme');
  console.log('  • theme-light.png - Light theme');
  console.log('  • theme-final.png - Final state after rapid switching');
  rapidTestScreenshots.forEach(file => {
    console.log(`  • ${file} - Rapid switching state`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('📋 Next steps:');
  console.log('1. Review screenshots for visual polish');
  console.log('2. Check for smooth transitions (no jarring changes)');
  console.log('3. Verify no visual artifacts during rapid switching');
  console.log('4. Confirm colors match X\'s design language');
}

// Run the capture
captureThemeScreenshots().catch(console.error);
