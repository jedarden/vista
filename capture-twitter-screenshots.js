#!/usr/bin/env node

/**
 * Capture Twitter/X Frame Screenshots
 *
 * This script launches a headless browser and captures screenshots
 * of the Twitter/X context frame in both light and dark modes.
 *
 * Usage: node capture-twitter-screenshots.js
 *
 * Requirements:
 * - Node.js with puppeteer installed
 * - test-twitter-frame.html must exist in the same directory
 * - notes/ directory must exist (will be created if missing)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure notes directory exists
const notesDir = path.join(__dirname, 'notes');
if (!fs.existsSync(notesDir)) {
  console.log('Creating notes directory...');
  fs.mkdirSync(notesDir, { recursive: true });
}

async function captureScreenshots() {
  let browser;

  try {
    console.log('🚀 Starting browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({
      width: 1400,
      height: 900,
      deviceScaleFactor: 2 // For crisp screenshots
    });

    const testFilePath = path.join(__dirname, 'test-twitter-frame.html');

    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }

    console.log('📄 Loading Twitter/X frame test page...');
    await page.goto('file://' + testFilePath, {
      waitUntil: 'networkidle0'
    });

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    // Define screenshot paths
    const darkModePath = path.join(notesDir, 'vista-twitter-x-dark-mode.png');
    const lightModePath = path.join(notesDir, 'vista-twitter-x-light-mode.png');

    // Capture dark mode screenshot (default)
    console.log('🌙 Capturing dark mode screenshot...');
    await page.screenshot({
      path: darkModePath,
      fullPage: true
    });
    console.log(`   ✅ Saved to: ${darkModePath}`);

    // Find and click theme toggle button
    console.log('☀️  Switching to light mode...');
    const themeToggle = await page.$('#themeToggle');
    if (themeToggle) {
      await themeToggle.click();
      await page.waitForTimeout(1000); // Wait for theme transition
      console.log('   ✅ Theme switched successfully');
    } else {
      throw new Error('Theme toggle button not found!');
    }

    // Capture light mode screenshot
    console.log('☀️  Capturing light mode screenshot...');
    await page.screenshot({
      path: lightModePath,
      fullPage: true
    });
    console.log(`   ✅ Saved to: ${lightModePath}`);

    console.log('\n✨ All screenshots captured successfully!');
    console.log(`   Dark mode: ${darkModePath}`);
    console.log(`   Light mode: ${lightModePath}`);

  } catch (error) {
    console.error('\n❌ Error capturing screenshots:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔚 Browser closed.');
    }
  }
}

captureScreenshots();
