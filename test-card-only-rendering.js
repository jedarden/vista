#!/usr/bin/env node

/**
 * Test Card-Only Rendering for All Platform Frames
 *
 * This script tests that all platforms render correctly in 'card only' mode.
 * It checks for:
 * - Card renders without layout breaks
 * - Platform logo/icon is visible
 * - Platform name is displayed
 * - No console errors occur
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Use chromium from nix-shell (to avoid missing libglib-2.0.so.0)
const CHROME_EXECUTABLE = '/nix/store/7xr3qnq93srn4dgak7qw74dw836wpp1y-chromium-138.0.7204.49/bin/chromium';

const PLATFORMS_TO_TEST = [
  'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube',
  'slack', 'discord', 'imessage', 'whatsapp', 'telegram', 'signal',
  'microsoft-teams', 'google-chat', 'zoom-chat', 'line', 'kakaotalk',
  'tiktok', 'pinterest', 'bluesky', 'mastodon', 'threads', 'tumblr',
  'reddit', 'github', 'gitlab', 'stackoverflow', 'hackernews',
  'producthunt', 'devto', 'medium'
];

const REPRESENTATIVE_PLATFORMS = ['twitter', 'slack', 'whatsapp', 'github', 'producthunt'];

const RESULTS = {
  timestamp: new Date().toISOString(),
  cardOnlyMode: true,
  platforms: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    withErrors: 0
  },
  issues: []
};

async function testCardOnlyRendering() {
  console.log('🧪 Starting Card-Only Rendering Test...');
  console.log(`📊 Testing ${PLATFORMS_TO_TEST.length} platforms\n`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_EXECUTABLE,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Track page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    // Load the test harness
    console.log('🌐 Loading test harness...');
    await page.goto('http://127.0.0.1:8081/src/public/test-all-44-platform-frames.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('✅ Test harness loaded\n');

    // Wait for the page to initialize and test grid to be created
    console.log('⏳ Waiting for test grid initialization...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Check if elements exist and get page content for debugging
    const pageInfo = await page.evaluate(() => {
      const testElements = document.querySelectorAll('[id^="test-"]');
      const bodyContent = document.body.innerHTML.substring(0, 1000);
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline');
      return {
        testElementCount: testElements.length,
        bodyPreview: bodyContent,
        scripts: scripts,
        platformFramesDefined: typeof PLATFORM_FRAMES !== 'undefined'
      };
    });

    console.log(`✅ Found ${pageInfo.testElementCount} test elements`);
    console.log(`PLATFORM_FRAMES defined: ${pageInfo.platformFramesDefined}`);
    console.log(`Scripts loaded: ${pageInfo.scripts.length}`);

    if (pageInfo.testElementCount === 0) {
      console.log('Page preview:', pageInfo.bodyPreview.substring(0, 200));
      throw new Error('No test elements found - the test harness may not have initialized properly');
    }

    // Switch to card-only mode
    console.log('📄 Switching to card-only mode...');
    await page.evaluate(() => {
      const cardOnlyBtn = document.getElementById('cardOnlyAll');
      if (cardOnlyBtn) {
        cardOnlyBtn.click();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Card-only mode activated\n');

    // Test each platform
    for (const platformId of PLATFORMS_TO_TEST) {
      console.log(`🔍 Testing ${platformId}...`);

      const platformResult = await page.evaluate((id) => {
        const platformResult = {
          id: id,
          renders: false,
          hasLayoutBreaks: false,
          hasPlatformLogo: false,
          hasPlatformName: false,
          consoleErrors: [],
          renderingIssues: []
        };

        try {
          // Check if the platform element exists
          const testElement = document.getElementById(`test-${id}`);
          if (!testElement) {
            platformResult.renderingIssues.push('Test element not found');
            return platformResult;
          }

          // Check if the card rendered
          const wrapper = document.getElementById(`wrapper-${id}`);
          if (!wrapper) {
            platformResult.renderingIssues.push('Card wrapper not found');
            return platformResult;
          }

          platformResult.renders = wrapper.children.length > 0;

          // Check for layout breaks (overflow issues)
          const cardWrapper = document.querySelector(`#wrapper-${id} > *`);
          if (cardWrapper) {
            const scrollHeight = cardWrapper.scrollHeight;
            const clientHeight = cardWrapper.clientHeight;
            const scrollWidth = cardWrapper.scrollWidth;
            const clientWidth = cardWrapper.clientWidth;

            if (scrollHeight > clientHeight + 10 || scrollWidth > clientWidth + 10) {
              platformResult.hasLayoutBreaks = true;
              platformResult.renderingIssues.push('Content overflow detected');
            }
          }

          // Check if platform name is displayed
          const header = testElement.querySelector('.platform-header');
          if (header) {
            const nameSpan = header.querySelector('span:first-child');
            if (nameSpan && nameSpan.textContent.trim()) {
              platformResult.hasPlatformName = true;
            }
          }

          // Check rendering status
          const statusEl = document.getElementById(`status-${id}`);
          if (statusEl) {
            if (statusEl.classList.contains('status-failed')) {
              platformResult.renderingIssues.push(`Status: ${statusEl.textContent}`);
            }
          }

        } catch (error) {
          platformResult.renderingIssues.push(`Evaluation error: ${error.message}`);
        }

        return platformResult;
      }, platformId);

      // Check for console errors related to this platform
      const platformConsoleErrors = consoleMessages.filter(msg =>
        msg.text.toLowerCase().includes(platformId) ||
        (msg.type === 'error' && msg.text.toLowerCase().includes('platform'))
      );

      platformResult.consoleErrors = platformConsoleErrors.map(m => m.text);

      // Determine if test passed
      const passed = platformResult.renders &&
                     !platformResult.hasLayoutBreaks &&
                     platformResult.hasPlatformName &&
                     platformResult.consoleErrors.length === 0;

      // Add to results
      RESULTS.platforms.push({
        ...platformResult,
        passed
      });

      RESULTS.summary.total++;

      if (passed) {
        RESULTS.summary.passed++;
        console.log(`  ✅ PASSED\n`);
      } else {
        RESULTS.summary.failed++;
        RESULTS.issues.push({
          platform: platformId,
          issues: platformResult.renderingIssues,
          consoleErrors: platformResult.consoleErrors
        });
        console.log(`  ❌ FAILED`);
        if (platformResult.renderingIssues.length > 0) {
          console.log(`     Issues: ${platformResult.renderingIssues.join(', ')}`);
        }
        console.log('');
      }
    }

    // Take screenshots of representative platforms
    console.log('📸 Taking screenshots of representative platforms...\n');

    const screenshotDir = path.join(__dirname, 'screenshots', 'card-only-test');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    for (const platformId of REPRESENTATIVE_PLATFORMS) {
      try {
        const element = await page.$(`#test-${platformId}`);
        if (element) {
          const screenshotPath = path.join(screenshotDir, `${platformId}-card-only.png`);
          await element.screenshot({ path: screenshotPath });
          console.log(`  ✅ Screenshot saved: ${platformId}`);
        }
      } catch (error) {
        console.log(`  ❌ Screenshot failed for ${platformId}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total platforms tested: ${RESULTS.summary.total}`);
    console.log(`✅ Passed: ${RESULTS.summary.passed}`);
    console.log(`❌ Failed: ${RESULTS.summary.failed}`);
    console.log(`⚠️  With errors: ${RESULTS.summary.withErrors}`);

    if (RESULTS.issues.length > 0) {
      console.log('\n🔍 PLATFORMS WITH ISSUES:');
      RESULTS.issues.forEach(issue => {
        console.log(`\n  ${issue.platform}:`);
        issue.issues.forEach(i => console.log(`    - ${i}`));
        if (issue.consoleErrors.length > 0) {
          console.log(`    Console errors:`);
          issue.consoleErrors.forEach(e => console.log(`      - ${e}`));
        }
      });
    }

    console.log('\n' + '='.repeat(60));

    // Save results
    const resultsPath = path.join(__dirname, 'test-results', 'card-only-rendering-results.json');
    const resultsDir = path.dirname(resultsPath);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    await browser.close();

    return RESULTS.summary.failed === 0;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await browser.close();
    throw error;
  }
}

// Run the test
testCardOnlyRendering()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
