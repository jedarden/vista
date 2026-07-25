#!/usr/bin/env node

/**
 * Dark Theme Platform Screenshot Capture using Playwright (Bead bf-b6pnm)
 *
 * This script captures screenshots of all 7 platform frames in dark theme
 * using Playwright, which has better browser support for NixOS environments.
 */

const { chromium } = require('playwright');
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

const BASE_URL = 'http://localhost:8081';
const OUTPUT_DIR = __dirname;
const THEME = 'dark';

async function captureScreenshots() {
  console.log('🌙 Dark Theme Platform Screenshot Capture using Playwright');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Platforms: ${PLATFORMS.length}`);
  console.log('');

  let browser;
  try {
    // Launch browser with necessary permissions
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    });

    const page = await context.newPage();
    const results = [];

    for (const platform of PLATFORMS) {
      const url = `${BASE_URL}/${platform.id}-${THEME}.html`;
      const screenshotPath = path.join(OUTPUT_DIR, `${platform.id}-${THEME}.png`);

      console.log(`📸 Capturing ${platform.name}...`);
      console.log(`   URL: ${url}`);

      try {
        // Navigate to platform page
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for platform frame to render
        await page.waitForSelector('#frame-container', { timeout: 10000 });

        // Additional wait for any JavaScript rendering
        await page.waitForTimeout(2000);

        // Find the platform frame container
        const frameContainer = await page.$('#frame-container');

        if (frameContainer) {
          // Capture screenshot of just the frame container
          await frameContainer.screenshot({ path: screenshotPath });

          // Verify file was created
          if (fs.existsSync(screenshotPath)) {
            const stats = fs.statSync(screenshotPath);
            console.log(`   ✅ Saved: ${platform.id}-${THEME}.png (${Math.round(stats.size / 1024)} KB)`);
            results.push({
              platform: platform.id,
              success: true,
              path: screenshotPath,
              size: stats.size
            });
          } else {
            console.log(`   ❌ Failed to create screenshot file`);
            results.push({
              platform: platform.id,
              success: false,
              error: 'File not created'
            });
          }
        } else {
          console.log(`   ❌ Frame container not found`);
          results.push({
            platform: platform.id,
            success: false,
            error: 'Frame container not found'
          });
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          platform: platform.id,
          success: false,
          error: error.message
        });
      }

      // Small delay between captures
      await page.waitForTimeout(1000);
    }

    await browser.close();

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

    return results;

  } catch (error) {
    console.error('❌ Fatal error:', error.message);

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}

// Main execution
(async () => {
  try {
    await captureScreenshots();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
