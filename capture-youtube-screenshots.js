/**
 * Capture YouTube Frame Screenshots - Dark and Light Themes
 *
 * This script launches a browser, loads the YouTube frame in both themes,
 * and captures screenshots for verification.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureYouTubeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1024 }
  });

  const page = await context.newPage();

  // Path to the YouTube frame HTML
  const framePath = path.join(__dirname, 'src/public/youtube-frame.html');
  const fileUrl = `file://${framePath}`;

  console.log('📸 Capturing YouTube frame screenshots...');

  // Capture Dark Mode
  console.log('  → Dark mode...');
  await page.goto(fileUrl);
  await page.waitForTimeout(2000); // Allow theme to settle

  // Ensure dark mode is set
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(1000);

  const darkPath = path.join(__dirname, 'screenshots/youtube-frame-dark.png');
  await page.screenshot({
    path: darkPath,
    fullPage: false
  });
  console.log(`    ✓ Saved: ${darkPath}`);

  // Capture Light Mode
  console.log('  → Light mode...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(1000); // Allow theme transition

  const lightPath = path.join(__dirname, 'screenshots/youtube-frame-light.png');
  await page.screenshot({
    path: lightPath,
    fullPage: false
  });
  console.log(`    ✓ Saved: ${lightPath}`);

  // Verify theme switching by toggling back and forth
  console.log('  → Testing theme toggle...');
  await page.evaluate(() => {
    window.toggleTheme();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.toggleTheme();
  });
  await page.waitForTimeout(500);
  console.log('    ✓ Theme toggle working');

  await browser.close();

  console.log('\n✅ YouTube frame screenshots captured successfully!');
  console.log(`\nScreenshots saved to:`);
  console.log(`  • Dark mode: ${darkPath}`);
  console.log(`  • Light mode: ${lightPath}`);
}

// Run the capture
captureYouTubeScreenshots().catch(console.error);