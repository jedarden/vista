#!/usr/bin/env node

/**
 * Playwright Screenshot Capture for Platform Frames (Bead vista-860b865e)
 *
 * This script captures screenshots of all 7 platforms in both themes
 * using Playwright to render the HTML files and capture screenshots.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration - 7 PLATFORMS matching the generated HTML files
const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)', category: 'Social' },
  { id: 'facebook', name: 'Facebook', category: 'Social' },
  { id: 'youtube', name: 'YouTube', category: 'Video' },
  { id: 'slack', name: 'Slack', category: 'Messaging' },
  { id: 'github', name: 'GitHub', category: 'Developer' },
  { id: 'gmail', name: 'Gmail', category: 'Email' },
  { id: 'reddit', name: 'Reddit', category: 'Discussion' }
];

const THEMES = ['light', 'dark'];
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots-playwright');

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('📸 Platform Frame Screenshot Capture (Bead vista-860b865e)');
console.log('='.repeat(70));
console.log(`📁 Screenshot Directory: ${SCREENSHOT_DIR}`);
console.log(`🌐 Platforms: ${PLATFORMS.map(p => p.name).join(', ')}`);
console.log(`🎨 Themes: ${THEMES.join(', ')}`);
console.log('');

// Capture screenshot for a specific platform and theme
async function captureScreenshot(browser, platform, theme) {
  const filename = `${platform.id}-${theme}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  const htmlFile = path.join(__dirname, `${platform.id}-${theme}.html`);

  console.log(`🎯 Capturing: ${platform.name} (${theme} theme)`);

  try {
    const page = await browser.newPage();

    // Set viewport size to capture desktop view
    await page.setViewportSize({ width: 1200, height: 800 });

    // Load the HTML file
    const fileUrl = `file://${htmlFile}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    // Wait a bit for any animations or dynamic content to render
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: filepath,
      fullPage: true  // Capture full page including scrollable content
    });

    await page.close();

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
  console.log('🚀 Starting Playwright screenshot capture...\n');

  let browser;
  const results = [];

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✅ Browser launched\n');

    // Capture screenshots for all platforms and themes
    for (const platform of PLATFORMS) {
      for (const theme of THEMES) {
        const result = await captureScreenshot(browser, platform, theme);
        results.push(result);
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

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});