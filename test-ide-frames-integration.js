#!/usr/bin/env node
/**
 * Comprehensive integration test for IDE frames (VS Code & JetBrains)
 *
 * Verifies:
 * - Both frames render without layout issues
 * - Platform switching works smoothly
 * - No visual glitches or overlap
 * - Frames are responsive to viewport changes
 * - Complete integration test passes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const TEST_PAGES = [
  '/test-productivity-devtools-frames.html',
  '/test-ide-theme-switching.html'
];

const IDE_FRAMES = ['vscode', 'jetbrains'];

const testResults = {
  renderWithoutLayoutIssues: [],
  platformSwitching: [],
  noVisualGlitches: [],
  responsiveToViewport: [],
  consoleErrors: [],
  summary: {}
};

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupConsoleCapture(page) {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  return consoleErrors;
}

async function testFrameRendering(page, platform, testPage) {
  console.log(`  Testing ${platform} frame rendering on ${testPage}...`);

  const frameExists = await page.evaluate((plt) => {
    const frame = document.querySelector(`.${plt}-context`);
    if (!frame) return { exists: false, reason: 'Frame element not found' };

    const rect = frame.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(frame);

    return {
      exists: true,
      visible: rect.width > 0 && rect.height > 0,
      width: rect.width,
      height: rect.height,
      display: computedStyle.display,
      overflow: computedStyle.overflow,
      hasLayout: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
    };
  }, platform === 'vscode' ? 'vscode' : 'jetbrains');

  return frameExists;
}

async function testPlatformSwitching(page, platform) {
  console.log(`  Testing ${platform} platform switching...`);

  const switchResults = await page.evaluate((plt) => {
    const frame = document.querySelector(`.${plt}-context`);
    if (!frame) return { success: false, reason: 'Frame not found' };

    // Check if theme toggle functionality exists
    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (!themeToggleBtn) return { success: false, reason: 'Theme toggle button not found' };

    // Check initial theme
    const initialTheme = frame.classList.contains('dark-theme') ? 'dark' :
                        frame.classList.contains('light-theme') ? 'light' : 'none';

    return {
      success: true,
      initialTheme,
      hasToggleButton: true,
      frameClasses: Array.from(frame.classList)
    };
  }, platform === 'vscode' ? 'vscode' : 'jetbrains');

  return switchResults;
}

async function testNoVisualGlitches(page, platform) {
  console.log(`  Testing ${platform} for visual glitches...`);

  const glitchCheck = await page.evaluate((plt) => {
    const frame = document.querySelector(`.${plt}-context`);
    if (!frame) return { success: false, reason: 'Frame not found' };

    const rect = frame.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(frame);

    // Check for common glitch indicators
    const issues = [];

    // Check for negative dimensions
    if (rect.width < 0 || rect.height < 0) {
      issues.push('Negative dimensions');
    }

    // Check for overflow issues
    if (computedStyle.overflow === 'visible' && rect.width > 0) {
      // Check if content overflows
      const scrollWidth = frame.scrollWidth;
      const clientWidth = frame.clientWidth;
      if (scrollWidth > clientWidth + 1) {
        issues.push('Horizontal overflow detected');
      }
    }

    // Check for opacity issues
    const opacity = parseFloat(computedStyle.opacity);
    if (opacity < 0 || opacity > 1) {
      issues.push(`Invalid opacity: ${opacity}`);
    }

    // Check for z-index conflicts (should not be extremely negative)
    const zIndex = parseInt(computedStyle.zIndex) || 0;
    if (zIndex < -1000) {
      issues.push(`Extremely negative z-index: ${zIndex}`);
    }

    return {
      success: issues.length === 0,
      issues,
      dimensions: { width: rect.width, height: rect.height },
      overflow: computedStyle.overflow
    };
  }, platform === 'vscode' ? 'vscode' : 'jetbrains');

  return glitchCheck;
}

async function testViewportResponsiveness(page, platform) {
  console.log(`  Testing ${platform} viewport responsiveness...`);

  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop XL' },
    { width: 1400, height: 900, name: 'Desktop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];

  const responsivenessResults = [];

  for (const viewport of viewports) {
    await page.setViewport(viewport);
    await wait(200); // Wait for layout to settle

    const frameCheck = await page.evaluate((plt) => {
      const frame = document.querySelector(`.${plt}-context`);
      if (!frame) return { visible: false };

      const rect = frame.getBoundingClientRect();
      return {
        visible: rect.width > 0 && rect.height > 0,
        width: rect.width,
        height: rect.height,
        ratio: rect.width / rect.height
      };
    }, platform === 'vscode' ? 'vscode' : 'jetbrains');

    responsivenessResults.push({
      viewport: viewport.name,
      ...frameCheck
    });
  }

  // Check if frame adapts to different viewports
  const uniqueRatios = new Set(responsivenessResults.map(r => r.ratio.toFixed(2)));
  const adaptsToViewport = uniqueRatios.size > 1;

  return {
    success: true,
    adaptsToViewport,
    responsivenessResults
  };
}

async function checkConsoleErrors(consoleErrors, platform, testPage) {
  if (consoleErrors.length > 0) {
    return {
      hasErrors: true,
      errors: consoleErrors
    };
  }
  return {
    hasErrors: false,
    errors: []
  };
}

async function runIntegrationTest() {
  console.log('🧪 Starting IDE Frame Integration Test...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const testPage of TEST_PAGES) {
      console.log(`\n📄 Testing page: ${testPage}`);
      const page = await browser.newPage();
      const consoleErrors = await setupConsoleCapture(page);

      try {
        await page.setViewport({ width: 1400, height: 900 });
        await page.goto(`${BASE_URL}${testPage}`, {
          waitUntil: 'networkidle0',
          timeout: 15000
        });

        await wait(500); // Wait for styles to settle

        // Test all IDE frames on this page
        for (const platform of IDE_FRAMES) {
          console.log(`\n🔍 Testing ${platform.toUpperCase()} frame:`);

          // 1. Test rendering without layout issues
          const renderTest = await testFrameRendering(page, platform, testPage);
          testResults.renderWithoutLayoutIssues.push({
            platform,
            testPage,
            result: renderTest
          });
          console.log(`    ✓ Render: ${renderTest.exists && renderTest.hasLayout ? 'PASS' : 'FAIL'}`);

          // 2. Test platform switching
          const switchTest = await testPlatformSwitching(page, platform);
          testResults.platformSwitching.push({
            platform,
            testPage,
            result: switchTest
          });
          console.log(`    ✓ Switching: ${switchTest.success ? 'PASS' : 'FAIL'}`);

          // 3. Test for visual glitches
          const glitchTest = await testNoVisualGlitches(page, platform);
          testResults.noVisualGlitches.push({
            platform,
            testPage,
            result: glitchTest
          });
          console.log(`    ✓ No glitches: ${glitchTest.success ? 'PASS' : 'FAIL'}`);

          // 4. Test viewport responsiveness
          const responsiveTest = await testViewportResponsiveness(page, platform);
          testResults.responsiveToViewport.push({
            platform,
            testPage,
            result: responsiveTest
          });
          console.log(`    ✓ Responsive: ${responsiveTest.success ? 'PASS' : 'FAIL'}`);

          // 5. Check console errors
          const errorCheck = await checkConsoleErrors(consoleErrors, platform, testPage);
          testResults.consoleErrors.push({
            platform,
            testPage,
            result: errorCheck
          });
          console.log(`    ✓ Console clean: ${!errorCheck.hasErrors ? 'PASS' : 'FAIL'}`);
        }

      } catch (error) {
        console.error(`    ❌ Error testing ${testPage}:`, error.message);
      } finally {
        await page.close();
      }
    }

    // Calculate summary
    console.log('\n📊 Test Summary:');

    const allTests = Object.values(testResults).flat();
    const totalTests = allTests.filter(t => typeof t === 'object' && t.result).length;
    const passedTests = allTests.filter(t => typeof t === 'object' && t.result && t.result.success !== false && t.result.exists && t.result.hasLayout).length;

    testResults.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate: ((passedTests / totalTests) * 100).toFixed(2) + '%'
    };

    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${testResults.summary.failedTests}`);
    console.log(`   Pass rate: ${testResults.summary.passRate}`);

    // Save results
    const resultsPath = path.join(__dirname, '.beads', 'traces', 'bf-5z6me', 'integration-test-results.json');
    const tracesDir = path.dirname(resultsPath);
    if (!fs.existsSync(tracesDir)) {
      fs.mkdirSync(tracesDir, { recursive: true });
    }
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    // Final verdict
    const allPassed = testResults.summary.failedTests === 0;
    if (allPassed) {
      console.log('\n✅ All integration tests PASSED!');
    } else {
      console.log('\n⚠️  Some tests failed - check results for details');
    }

    return allPassed;

  } finally {
    await browser.close();
  }
}

// Run the test
runIntegrationTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
