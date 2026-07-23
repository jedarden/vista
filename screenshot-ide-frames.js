#!/usr/bin/env node
/**
 * Screenshot IDE context frames (VS Code and JetBrains)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const platforms = [
  { name: 'vscode', path: '/test-productivity-devtools-frames.html' },
  { name: 'jetbrains', path: '/test-productivity-devtools-frames.html' }
];

async function takeScreenshots() {
  console.log('🧪 Capturing IDE frame screenshots...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  for (const platform of platforms) {
    console.log(`📸 Capturing ${platform.name}...`);
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1400, height: 900 });
      await page.goto(`${BASE_URL}${platform.path}`, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Wait a moment for styles to settle
      await page.waitForTimeout(500);

      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // For VS Code, get the first vscode-context element
      if (platform.name === 'vscode') {
        const element = await page.$('.vscode-context');
        if (element) {
          await element.screenshot({
            path: path.join(screenshotsDir, 'vscode-frame.png')
          });
          console.log('   ✅ VS Code frame captured');
        }
      }

      // For JetBrains, get the first jetbrains-context element
      if (platform.name === 'jetbrains') {
        const element = await page.$('.jetbrains-context');
        if (element) {
          await element.screenshot({
            path: path.join(screenshotsDir, 'jetbrains-frame.png')
          });
          console.log('   ✅ JetBrains frame captured');
        }
      }

      // Also capture full page for reference
      await page.screenshot({
        path: path.join(screenshotsDir, `${platform.name}-full-page.png`),
        fullPage: false
      });

      if (consoleErrors.length > 0) {
        console.log(`   ⚠️  Console errors: ${consoleErrors.join(', ')}`);
      } else {
        console.log('   ✅ No console errors');
      }

    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n✅ Screenshots saved to ./screenshots/');
}

takeScreenshots().catch(console.error);
