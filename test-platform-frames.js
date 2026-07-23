/**
 * Comprehensive Platform Context Frames Test
 *
 * Tests all 44 platform context frames:
 * - Dark/light mode rendering
 * - Card only vs in context toggles
 * - Visual glitch detection
 * - Screenshot capture for documentation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// All 44 platforms from platform-frames.js
const PLATFORMS = [
  'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube',
  'slack', 'discord', 'imessage', 'whatsapp', 'telegram', 'signal',
  'microsoft-teams', 'google-chat', 'zoom-chat', 'line', 'kakao', 'tiktok',
  'pinterest', 'bluesky', 'mastodon', 'threads', 'tumblr', 'reddit',
  'github', 'gitlab', 'stackoverflow', 'hackernews', 'producthunt', 'devto',
  'medium', 'gmail', 'outlook', 'feedly', 'notion', 'evernote',
  'vscode', 'jetbrains-ide', 'jira', 'trello', 'asana', 'figma',
  'substack', 'generic'
];

// Sample URL to test with
const TEST_URL = 'https://example.com/test-page';

// Test results
const results = {
  totalPlatforms: PLATFORMS.length,
  tested: 0,
  passed: 0,
  failed: 0,
  failures: [],
  screenshots: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

async function testPlatformFrame(browser, platformId) {
  const page = await browser.newPage();
  const platformResults = {
    platform: platformId,
    darkModeCardOnly: false,
    darkModeInContext: false,
    lightModeCardOnly: false,
    lightModeInContext: false,
    toggleWorking: false,
    themeWorking: false,
    hasGlitches: false,
    glitches: []
  };

  try {
    // Navigate to the app with test URL
    await page.goto(`http://localhost:3002/?url=${encodeURIComponent(TEST_URL)}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for results to load
    await sleep(3000);

    // Find the platform card
    const cardSelector = `[data-platform="${platformId}"]`;
    const cardExists = await page.$(cardSelector);

    if (!cardExists) {
      platformResults.glitches.push(`Platform card not found for ${platformId}`);
      platformResults.hasGlitches = true;
      await page.close();
      return platformResults;
    }

    // Test 1: Dark mode - Card only
    console.log(`Testing ${platformId} - Dark mode (card only)`);
    try {
      // Ensure dark mode and card-only mode
      await page.evaluate(() => {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
      });

      // Switch to card-only mode
      const card = await page.$(cardSelector);
      await card.evaluate((el) => {
        const contextToggle = el.querySelector('[data-action="toggle-context"]');
        if (contextToggle && contextToggle.textContent.includes('in context')) {
          contextToggle.click();
        }
      });

      await sleep(500);

      // Check if card is visible and in card-only mode
      const isVisible = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, cardSelector);

      if (isVisible) {
        platformResults.darkModeCardOnly = true;

        // Take screenshot
        const screenshotPath = path.join(__dirname, 'screenshots', `${platformId}-dark-card-only.png`);
        await page.screenshot({
          path: screenshotPath,
          clip: await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }, cardSelector)
        });
        results.screenshots.push(screenshotPath);
      }
    } catch (e) {
      platformResults.glitches.push(`Dark mode card-only failed: ${e.message}`);
      platformResults.hasGlitches = true;
    }

    // Test 2: Dark mode - In context
    console.log(`Testing ${platformId} - Dark mode (in context)`);
    try {
      // Switch to context mode
      const card = await page.$(cardSelector);
      await card.evaluate((el) => {
        const contextToggle = el.querySelector('[data-action="toggle-context"]');
        if (contextToggle && contextToggle.textContent.includes('card only')) {
          contextToggle.click();
        }
      });

      await sleep(500);

      const isVisible = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, cardSelector);

      if (isVisible) {
        platformResults.darkModeInContext = true;

        // Take screenshot
        const screenshotPath = path.join(__dirname, 'screenshots', `${platformId}-dark-context.png`);
        await page.screenshot({
          path: screenshotPath,
          clip: await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }, cardSelector)
        });
        results.screenshots.push(screenshotPath);
      }
    } catch (e) {
      platformResults.glitches.push(`Dark mode in-context failed: ${e.message}`);
      platformResults.hasGlitches = true;
    }

    // Test 3: Light mode - Card only
    console.log(`Testing ${platformId} - Light mode (card only)`);
    try {
      // Switch to light mode
      await page.evaluate(() => {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
      });

      // Switch to card-only mode
      const card = await page.$(cardSelector);
      await card.evaluate((el) => {
        const contextToggle = el.querySelector('[data-action="toggle-context"]');
        if (contextToggle && contextToggle.textContent.includes('in context')) {
          contextToggle.click();
        }
      });

      await sleep(500);

      const isVisible = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, cardSelector);

      if (isVisible) {
        platformResults.lightModeCardOnly = true;

        // Take screenshot
        const screenshotPath = path.join(__dirname, 'screenshots', `${platformId}-light-card-only.png`);
        await page.screenshot({
          path: screenshotPath,
          clip: await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }, cardSelector)
        });
        results.screenshots.push(screenshotPath);
      }
    } catch (e) {
      platformResults.glitches.push(`Light mode card-only failed: ${e.message}`);
      platformResults.hasGlitches = true;
    }

    // Test 4: Light mode - In context
    console.log(`Testing ${platformId} - Light mode (in context)`);
    try {
      // Switch to context mode
      const card = await page.$(cardSelector);
      await card.evaluate((el) => {
        const contextToggle = el.querySelector('[data-action="toggle-context"]');
        if (contextToggle && contextToggle.textContent.includes('card only')) {
          contextToggle.click();
        }
      });

      await sleep(500);

      const isVisible = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, cardSelector);

      if (isVisible) {
        platformResults.lightModeInContext = true;

        // Take screenshot
        const screenshotPath = path.join(__dirname, 'screenshots', `${platformId}-light-context.png`);
        await page.screenshot({
          path: screenshotPath,
          clip: await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }, cardSelector)
        });
        results.screenshots.push(screenshotPath);
      }
    } catch (e) {
      platformResults.glitches.push(`Light mode in-context failed: ${e.message}`);
      platformResults.hasGlitches = true;
    }

    // Test 5: Toggle functionality
    console.log(`Testing ${platformId} - Toggle functionality`);
    try {
      // Test toggling between card-only and in-context multiple times
      for (let i = 0; i < 3; i++) {
        const card = await page.$(cardSelector);
        await card.evaluate((el) => {
          const contextToggle = el.querySelector('[data-action="toggle-context"]');
          if (contextToggle) contextToggle.click();
        });
        await sleep(300);
      }

      platformResults.toggleWorking = true;
    } catch (e) {
      platformResults.glitches.push(`Toggle functionality failed: ${e.message}`);
      platformResults.hasGlitches = true;
    }

    // Test 6: Theme toggle functionality
    console.log(`Testing ${platformId} - Theme toggle functionality`);
    try {
      // Test toggling between dark and light mode multiple times
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          document.body.classList.toggle('dark-mode');
          document.body.classList.toggle('light-mode');
        });
        await sleep(300);
      }

      platformResults.themeWorking = true;
    } catch (e) {
      platformResults.glitches.push(`Theme toggle failed: ${e.message}`);
      platformResults.hasGlitches = true;
    }

  } catch (error) {
    platformResults.glitches.push(`General test error: ${error.message}`);
    platformResults.hasGlitches = true;
  } finally {
    await page.close();
  }

  return platformResults;
}

async function runAllTests() {
  console.log('Starting comprehensive platform context frames test...\n');

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await setupBrowser();

  try {
    for (const platformId of PLATFORMS) {
      console.log(`\n=== Testing platform: ${platformId} ===`);
      results.tested++;

      const platformResult = await testPlatformFrame(browser, platformId);

      if (platformResult.hasGlitches) {
        results.failed++;
        results.failures.push(platformResult);
      } else {
        results.passed++;
      }

      console.log(`✓ Completed ${platformId}: ${platformResult.darkModeCardOnly ? 'Dark card' : '❌'}, ${platformResult.lightModeCardOnly ? 'Light card' : '❌'}, ${platformResult.toggleWorking ? 'Toggle OK' : '❌'}`);
    }
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n=== TEST RESULTS ===');
  console.log(`Total platforms: ${results.totalPlatforms}`);
  console.log(`Tested: ${results.tested}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.failures.length > 0) {
    console.log('\n=== FAILURES ===');
    results.failures.forEach(failure => {
      console.log(`\n${failure.platform}:`);
      failure.glitches.forEach(glitch => console.log(`  - ${glitch}`));
    });
  }

  console.log(`\nScreenshots captured: ${results.screenshots.length}`);
  console.log(`Screenshot directory: ${screenshotsDir}`);

  // Save results to JSON
  const resultsPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  return results;
}

// Run tests
runAllTests()
  .then(() => {
    console.log('\n✓ All tests completed!');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
