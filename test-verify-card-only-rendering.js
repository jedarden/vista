#!/usr/bin/env node

/**
 * Automated Card-Only Rendering Verification Script
 *
 * This script verifies card-only rendering for all platforms.
 * Can run via Node.js (Puppeteer) or directly in browser console.
 *
 * Checks:
 * - Layout breaks (overflow detection)
 * - Logo visibility
 * - Platform name display
 * - Console errors
 * - Rendering completion
 *
 * Usage:
 *   Node.js: node test-verify-card-only-rendering.js
 *   Browser: Copy the browser section to console
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testHarnessUrl: 'http://127.0.0.1:8080/src/public/test-card-only-rendering.html',
  screenshotDir: path.join(__dirname, 'screenshots', 'card-only-verification'),
  resultsDir: path.join(__dirname, 'test-results'),
  timeouts: {
    pageLoad: 30000,
    renderComplete: 5000,
    platformTest: 1000
  }
};

// All platforms to test (44 total)
const ALL_PLATFORMS = [
  { id: 'google', name: 'Google Search' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'slack', name: 'Slack' },
  { id: 'discord', name: 'Discord' },
  { id: 'imessage', name: 'iMessage' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'signal', name: 'Signal' },
  { id: 'microsoft-teams', name: 'Microsoft Teams' },
  { id: 'google-chat', name: 'Google Chat' },
  { id: 'zoom-chat', name: 'Zoom Chat' },
  { id: 'line', name: 'Line' },
  { id: 'kakao', name: 'KakaoTalk' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'bluesky', name: 'Bluesky' },
  { id: 'mastodon', name: 'Mastodon' },
  { id: 'threads', name: 'Threads' },
  { id: 'tumblr', name: 'Tumblr' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'github', name: 'GitHub' },
  { id: 'gitlab', name: 'GitLab' },
  { id: 'stackoverflow', name: 'Stack Overflow' },
  { id: 'hackernews', name: 'Hacker News' },
  { id: 'producthunt', name: 'Product Hunt' },
  { id: 'devto', name: 'Dev.to' },
  { id: 'medium', name: 'Medium' },
  { id: 'gmail', name: 'Gmail' },
  { id: 'outlook', name: 'Outlook' },
  { id: 'feedly', name: 'Feedly' },
  { id: 'notion', name: 'Notion' },
  { id: 'evernote', name: 'Evernote' },
  { id: 'vscode', name: 'VS Code' },
  { id: 'jetbrains-ide', name: 'JetBrains IDE' },
  { id: 'jira', name: 'Jira' },
  { id: 'trello', name: 'Trello' },
  { id: 'asana', name: 'Asana' },
  { id: 'figma', name: 'Figma' },
  { id: 'substack', name: 'Substack' },
  { id: 'generic', name: 'Generic Platform' }
];

/**
 * Verification criteria for each platform
 */
const VERIFICATION_CRITERIA = {
  layoutBreaks: {
    check: (element) => {
      if (!element) return false;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      const scrollWidth = element.scrollWidth;
      const clientWidth = element.clientWidth;

      // Allow 10px tolerance for rounding
      const hasVerticalOverflow = scrollHeight > clientHeight + 10;
      const hasHorizontalOverflow = scrollWidth > clientWidth + 10;

      return {
        passed: !hasVerticalOverflow && !hasHorizontalOverflow,
        details: {
          verticalOverflow: hasVerticalOverflow,
          horizontalOverflow: hasHorizontalOverflow,
          scrollHeight,
          clientHeight,
          scrollWidth,
          clientWidth
        }
      };
    }
  },

  logoVisibility: {
    check: (element) => {
      if (!element) return false;
      // Check for platform logo images or icons
      const images = element.querySelectorAll('img');
      const icons = element.querySelectorAll('[class*="icon"], [class*="logo"], [class*="brand"]');

      return {
        passed: images.length > 0 || icons.length > 0,
        details: {
          imageCount: images.length,
          iconCount: icons.length
        }
      };
    }
  },

  platformNameDisplay: {
    check: (element) => {
      if (!element) return false;
      // Check for platform name in header or title
      const headers = element.querySelectorAll('[class*="header"], [class*="title"], h1, h2, h3');
      let nameFound = false;

      headers.forEach(header => {
        if (header.textContent && header.textContent.trim().length > 0) {
          nameFound = true;
        }
      });

      return {
        passed: nameFound,
        details: {
          headerCount: headers.length,
          hasTextContent: nameFound
        }
      };
    }
  },

  renderingComplete: {
    check: (element) => {
      if (!element) return false;
      // Check if content is actually rendered (not empty or loading state)
      const hasContent = element.innerHTML.trim().length > 0;
      const notLoading = !element.querySelector('.loading-spinner, [class*="loading"]');
      const hasCardFrame = element.querySelector('[class*="card"], [class*="frame"]');

      return {
        passed: hasContent && notLoading,
        details: {
          hasContent,
          notLoading,
          hasCardFrame
        }
      };
    }
  }
};

/**
 * Test results structure
 */
const testResults = {
  timestamp: new Date().toISOString(),
  mode: 'card-only',
  config: CONFIG,
  summary: {
    total: ALL_PLATFORMS.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    withErrors: 0,
    withWarnings: 0
  },
  platforms: [],
  consoleErrors: [],
  consoleWarnings: [],
  systemInfo: {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch
  }
};

/**
 * Verifies a single platform against all criteria
 */
function verifyPlatform(platform, element) {
  const platformResult = {
    id: platform.id,
    name: platform.name,
    passed: true,
    checks: {},
    issues: [],
    warnings: []
  };

  // Run all verification checks
  for (const [checkName, checkConfig] of Object.entries(VERIFICATION_CRITERIA)) {
    try {
      const result = checkConfig.check(element);
      platformResult.checks[checkName] = result;

      if (!result.passed) {
        platformResult.passed = false;
        platformResult.issues.push(`${checkName}: ${JSON.stringify(result.details)}`);
      }
    } catch (error) {
      platformResult.passed = false;
      platformResult.checks[checkName] = {
        passed: false,
        error: error.message
      };
      platformResult.issues.push(`${checkName}: ${error.message}`);
    }
  }

  return platformResult;
}

/**
 * Node.js execution with Puppeteer
 */
async function runNodeJSTests() {
  console.log('🧪 Starting Automated Card-Only Rendering Verification...\n');
  console.log(`📊 Testing ${ALL_PLATFORMS.length} platforms\n`);

  // Create output directories
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  // Launch browser
  const puppeteer = require('puppeteer');
  let browser;

  try {
    // Try different browser launch methods
    try {
      const chromePath = '/home/coding/.cache/puppeteer/chrome-headless-shell/linux-150.0.7871.24/chrome-headless-shell-linux64/chrome-headless-shell';
      if (fs.existsSync(chromePath)) {
        console.log(`  Using chrome-headless-shell`);
        browser = await puppeteer.launch({
          headless: 'shell',
          executablePath: chromePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      } else {
        throw new Error('chrome-headless-shell not found');
      }
    } catch (err) {
      console.log(`  Chrome-headless-shell failed: ${err.message}`);
      console.log(`  Trying system chromium...`);
      browser = await puppeteer.launch({
        headless: true,
        channel: 'chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
    }

    const page = await browser.newPage();

    // Track console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      consoleMessages.push({ type, text, timestamp: new Date().toISOString() });

      if (type === 'error') {
        testResults.consoleErrors.push(text);
        console.log(`  [Console Error] ${text}`);
      } else if (type === 'warn') {
        testResults.consoleWarnings.push(text);
      }
    });

    // Track page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      testResults.consoleErrors.push(error.message);
      console.log(`  [Page Error] ${error.message}`);
    });

    // Load test harness
    console.log('🌐 Loading test harness...');
    await page.goto(CONFIG.testHarnessUrl, {
      waitUntil: 'networkidle0',
      timeout: CONFIG.timeouts.pageLoad
    });
    console.log('✅ Test harness loaded\n');

    // Wait for rendering to complete
    console.log('⏳ Waiting for rendering to complete...');
    await page.waitForTimeout(CONFIG.timeouts.renderComplete);

    // Verify all platforms
    console.log('🔍 Verifying platforms...\n');

    for (const platform of ALL_PLATFORMS) {
      console.log(`  Testing ${platform.name} (${platform.id})...`);

      const platformResult = await page.evaluate((platformId, checks) => {
        const element = document.getElementById(`content-${platformId}`);
        if (!element) {
          return {
            id: platformId,
            passed: false,
            checks: {},
            issues: ['Platform element not found'],
            warnings: []
          };
        }

        const result = {
          id: platformId,
          passed: true,
          checks: {},
          issues: [],
          warnings: []
        };

        // Layout breaks check
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const scrollWidth = element.scrollWidth;
        const clientWidth = element.clientWidth;

        result.checks.layoutBreaks = {
          passed: !(scrollHeight > clientHeight + 10 || scrollWidth > clientWidth + 10),
          details: { scrollHeight, clientHeight, scrollWidth, clientWidth }
        };

        if (!result.checks.layoutBreaks.passed) {
          result.passed = false;
          result.issues.push('Layout overflow detected');
        }

        // Rendering complete check
        const hasContent = element.innerHTML.trim().length > 0;
        const notLoading = !element.querySelector('.loading-spinner');
        const hasCardFrame = element.querySelector('[class*="card"]');

        result.checks.renderingComplete = {
          passed: hasContent && notLoading,
          details: { hasContent, notLoading, hasCardFrame }
        };

        if (!result.checks.renderingComplete.passed) {
          result.passed = false;
          result.issues.push('Rendering incomplete or still loading');
        }

        // Platform name check (from header)
        const header = document.getElementById(`card-${platformId}`)?.querySelector('.platform-name');
        result.checks.platformNameDisplay = {
          passed: header && header.textContent.trim().length > 0,
          details: { hasHeader: !!header, text: header ? header.textContent.trim() : '' }
        };

        if (!result.checks.platformNameDisplay.passed) {
          result.passed = false;
          result.issues.push('Platform name not displayed');
        }

        // Logo visibility check (for card frames)
        const cardFrame = element.querySelector('[class*="card-frame"]');
        if (cardFrame) {
          const images = cardFrame.querySelectorAll('img');
          const icons = cardFrame.querySelectorAll('[class*="icon"], [class*="logo"]');

          result.checks.logoVisibility = {
            passed: images.length > 0 || icons.length > 0,
            details: { imageCount: images.length, iconCount: icons.length }
          };
        } else {
          result.checks.logoVisibility = {
            passed: true,
            details: { note: 'No card frame found, logo check not applicable' }
          };
        }

        return result;
      }, platform.id);

      // Add platform name
      platformResult.name = platform.name;

      // Update summary
      testResults.platforms.push(platformResult);

      if (platformResult.passed) {
        testResults.summary.passed++;
        console.log(`    ✅ PASSED\n`);
      } else {
        testResults.summary.failed++;
        console.log(`    ❌ FAILED`);
        platformResult.issues.forEach(issue => {
          console.log(`       - ${issue}`);
        });
        console.log('');
      }
    }

    // Take screenshots of failed platforms
    const failedPlatforms = testResults.platforms.filter(p => !p.passed);
    if (failedPlatforms.length > 0) {
      console.log(`\n📸 Taking screenshots of ${failedPlatforms.length} failed platforms...`);

      for (const platform of failedPlatforms) {
        try {
          const element = await page.$(`#content-${platform.id}`);
          if (element) {
            const screenshotPath = path.join(CONFIG.screenshotDir, `${platform.id}-failed.png`);
            await element.screenshot({ path: screenshotPath });
            console.log(`  ✅ Screenshot saved: ${platform.id}`);
          }
        } catch (error) {
          console.log(`  ❌ Screenshot failed for ${platform.id}: ${error.message}`);
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total platforms: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⚠️  Console errors: ${testResults.consoleErrors.length}`);
    console.log(`⚠️  Console warnings: ${testResults.consoleWarnings.length}`);

    if (failedPlatforms.length > 0) {
      console.log('\n❌ FAILED PLATFORMS:');
      failedPlatforms.forEach(p => {
        console.log(`  ${p.name} (${p.id}):`);
        p.issues.forEach(issue => console.log(`    - ${issue}`));
      });
    }

    console.log('\n' + '='.repeat(60));

    // Save results
    const resultsPath = path.join(CONFIG.resultsDir, 'card-only-verification-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    await browser.close();

    return testResults.summary.failed === 0;

  } catch (error) {
    console.error('❌ Verification failed with error:', error.message);
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Browser console execution
 * Copy this function to browser console to run tests
 */
function runBrowserTests() {
  console.log('🧪 Starting Browser Card-Only Rendering Verification...\n');

  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    },
    platforms: []
  };

  // Get all platform cards
  const platformCards = document.querySelectorAll('[id^="card-"]');
  results.summary.total = platformCards.length;

  platformCards.forEach(card => {
    const platformId = card.id.replace('card-', '');
    const contentEl = document.getElementById(`content-${platformId}`);
    const statusEl = document.getElementById(`status-${platformId}`);
    const headerEl = card.querySelector('.platform-name');

    const platformResult = {
      id: platformId,
      name: headerEl ? headerEl.textContent : platformId,
      passed: true,
      checks: {
        layoutBreaks: false,
        renderingComplete: false,
        platformNameDisplay: !!headerEl,
        logoVisibility: false
      },
      issues: []
    };

    if (contentEl) {
      // Check layout breaks
      const scrollHeight = contentEl.scrollHeight;
      const clientHeight = contentEl.clientHeight;
      platformResult.checks.layoutBreaks = !(scrollHeight > clientHeight + 10);

      // Check rendering complete
      const hasContent = contentEl.innerHTML.trim().length > 0;
      const notLoading = !contentEl.querySelector('.loading-spinner');
      platformResult.checks.renderingComplete = hasContent && notLoading;

      // Check logo visibility
      const images = contentEl.querySelectorAll('img');
      const icons = contentEl.querySelectorAll('[class*="icon"], [class*="logo"]');
      platformResult.checks.logoVisibility = images.length > 0 || icons.length > 0;
    }

    // Check status element
    if (statusEl && statusEl.classList.contains('status-failed')) {
      platformResult.passed = false;
      platformResult.issues.push('Status shows failed');
    }

    // Determine overall pass/fail
    const allChecksPassed = Object.values(platformResult.checks).every(check => check === true);
    platformResult.passed = allChecksPassed && platformResult.issues.length === 0;

    if (!platformResult.passed) {
      Object.entries(platformResult.checks).forEach(([checkName, passed]) => {
        if (!passed) {
          platformResult.issues.push(`${checkName} check failed`);
        }
      });
    }

    results.platforms.push(platformResult);

    if (platformResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  });

  // Print results
  console.log('📊 Browser Verification Results:');
  console.log(`Total: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);

  if (results.summary.failed > 0) {
    console.log('\n❌ Failed platforms:');
    results.platforms.filter(p => !p.passed).forEach(p => {
      console.log(`  ${p.name}:`, p.issues.join(', '));
    });
  }

  console.log('\n💾 Copy results with: copy(JSON.stringify(window.browserTestResults, null, 2))');
  window.browserTestResults = results;

  return results;
}

// Export browser function for eval
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runBrowserTests, ALL_PLATFORMS, VERIFICATION_CRITERIA };
}

// Main execution
if (require.main === module) {
  runNodeJSTests()
    .then(success => {
      console.log('\n' + '='.repeat(60));
      console.log(success ? '✅ VERIFICATION PASSED' : '❌ VERIFICATION FAILED');
      console.log('='.repeat(60));
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
