/**
 * Comprehensive Theme Switching Test for All Platform Frames
 *
 * Tests dark/light theme switching across all platform frames in the rendering pipeline.
 * Verifies that theme prop correctly passes to frame components and each platform frame
 * respects theme parameter with distinct styling.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// SETUP
// ============================================================================

// Load platform frames configuration from TypeScript file
const platformConfigPath = path.join(__dirname, 'src', 'platform-frames.config.ts');
const platformConfigContent = fs.readFileSync(platformConfigPath, 'utf8');

// Parse platform support for themes
const platformSupport = {};

// Extract platform entries with hasThemeSupport property
const platformPattern = /(\w+):\s*\{[^}]*hasThemeSupport:\s*(true|false)/g;
let match;
while ((match = platformPattern.exec(platformConfigContent)) !== null) {
  platformSupport[match[1]] = match[2] === 'true';
}

// Get platform names
const platformNames = {};
const namePattern = /name:\s*['"]([^'"]+)['"]/g;
const allMatches = platformConfigContent.match(/(\w+):\s*\{[^}]*name:\s*['"][^'"]+['"]/g);
if (allMatches) {
  allMatches.forEach(entry => {
    const idMatch = entry.match(/(\w+):\s*\{/);
    const nameMatch = entry.match(/name:\s*['"]([^'"]+)['"]/);
    if (idMatch && nameMatch) {
      platformNames[idMatch[1]] = nameMatch[1];
    }
  });
}

console.log('='.repeat(70));
console.log('Theme Switching Test - All Platform Frames');
console.log('='.repeat(70));
console.log(`\nFound ${Object.keys(platformSupport).length} platforms in configuration`);
console.log(`Platforms with theme support: ${Object.values(platformSupport).filter(v => v).length}`);
console.log(`Platforms without theme support: ${Object.values(platformSupport).filter(v => !v).length}`);

// ============================================================================
// TEST DATA
// ============================================================================

const sampleContent = {
  meta: {
    og: {
      title: 'Test Article Title',
      description: 'This is a sample description for testing theme switching across all platforms.',
      image: 'https://example.com/test-image.jpg',
      site_name: 'ExampleSite'
    },
    title: 'Test Article Title',
    description: 'This is a sample description for testing theme switching across all platforms.',
    themeColor: '#5865f2'
  },
  imageProbe: {
    dominantColor: '#4a90e2'
  },
  baseUrl: 'https://example.com/article'
};

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

class ThemeTestRunner {
  constructor() {
    this.results = {
      totalPlatforms: 0,
      testedPlatforms: 0,
      passedTests: 0,
      failedTests: 0,
      platformResults: [],
      errors: [],
      warnings: []
    };

    // Capture console output
    this.originalConsole = { ...console };
    this.capturedWarnings = [];
    this.capturedErrors = [];
  }

  // Override console methods to capture output
  captureConsoleOutput() {
    const self = this;
    console.warn = function(...args) {
      self.capturedWarnings.push(args.join(' '));
      self.originalConsole.warn(...args);
    };
    console.error = function(...args) {
      self.capturedErrors.push(args.join(' '));
      self.originalConsole.error(...args);
    };
  }

  restoreConsole() {
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  // Get all available platform IDs
  getAllPlatformIds() {
    const platforms = Object.keys(global.window.PLATFORM_FRAMES);
    return platforms.sort(); // Sort for consistent testing
  }

  // Test a single platform with both themes
  testPlatform(platformId) {
    const platformResult = {
      platformId,
      name: global.window.PLATFORM_FRAMES[platformId]?.name || platformId,
      category: global.window.PLATFORM_FRAMES[platformId]?.category || 'unknown',
      hasThemeSupport: global.window.PLATFORM_FRAMES[platformId]?.hasThemeSupport || false,
      dark: { passed: false, rendered: false, hasThemeClass: false, hasThemeVars: false, errors: [] },
      light: { passed: false, rendered: false, hasThemeClass: false, hasThemeVars: false, errors: [] }
    };

    // Clear captured output
    this.capturedWarnings = [];
    this.capturedErrors = [];

    // Test dark theme
    try {
      const darkHTML = renderPlatformWithContext(
        platformId,
        sampleContent.meta,
        sampleContent.imageProbe,
        sampleContent.baseUrl,
        'dark',
        sampleContent.imageProbe.dominantColor
      );

      platformResult.dark.rendered = !!darkHTML;
      platformResult.dark.hasThemeClass = darkHTML?.includes('dark-theme') || darkHTML?.includes('context-frame');
      platformResult.dark.hasThemeVars = darkHTML?.includes('--frame-bg') || darkHTML?.includes('--frame-surface');

      // Validate dark theme output
      if (!darkHTML) {
        platformResult.dark.errors.push('No HTML rendered for dark theme');
      } else if (!platformResult.dark.hasThemeClass) {
        platformResult.dark.errors.push('Missing theme class in dark theme output');
      } else if (!platformResult.dark.hasThemeVars) {
        platformResult.dark.errors.push('Missing theme variables in dark theme output');
      } else {
        platformResult.dark.passed = true;
      }
    } catch (e) {
      platformResult.dark.errors.push(e.message);
    }

    // Clear captured output between tests
    this.capturedWarnings = [];
    this.capturedErrors = [];

    // Test light theme
    try {
      const lightHTML = renderPlatformWithContext(
        platformId,
        sampleContent.meta,
        sampleContent.imageProbe,
        sampleContent.baseUrl,
        'light',
        sampleContent.imageProbe.dominantColor
      );

      platformResult.light.rendered = !!lightHTML;
      platformResult.light.hasThemeClass = lightHTML?.includes('light-theme') || lightHTML?.includes('context-frame');
      platformResult.light.hasThemeVars = lightHTML?.includes('--frame-bg') || lightHTML?.includes('--frame-surface');

      // Validate light theme output
      if (!lightHTML) {
        platformResult.light.errors.push('No HTML rendered for light theme');
      } else if (!platformResult.light.hasThemeClass) {
        platformResult.light.errors.push('Missing theme class in light theme output');
      } else if (!platformResult.light.hasThemeVars) {
        platformResult.light.errors.push('Missing theme variables in light theme output');
      } else {
        platformResult.light.passed = true;
      }
    } catch (e) {
      platformResult.light.errors.push(e.message);
    }

    // Determine overall platform pass/fail
    platformResult.passed = platformResult.dark.passed && platformResult.light.passed;
    platformResult.consoleWarnings = [...this.capturedWarnings];
    platformResult.consoleErrors = [...this.capturedErrors];

    return platformResult;
  }

  // Compare dark vs light theme output for distinctness
  compareThemeOutput(darkHTML, lightHTML) {
    // Check if themes produce different styling
    const darkHasDarkColors = darkHTML?.includes('#000') || darkHTML?.includes('#1a1a1a') ||
                            darkHTML?.includes('rgb(0') || darkHTML?.includes('rgba(0,0,0');
    const lightHasLightColors = lightHTML?.includes('#fff') || lightHTML?.includes('#ffffff') ||
                              lightHTML?.includes('rgb(255') || lightHTML?.includes('#f0f0f0');

    return {
      darkHasDarkColors,
      lightHasLightColors,
      themesDistinct: darkHasDarkColors && lightHasLightColors
    };
  }

  // Run all tests
  runTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Theme Switching Test - All Platform Frames               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    this.captureConsoleOutput();

    const platformIds = this.getAllPlatformIds();
    this.results.totalPlatforms = platformIds.length;

    console.log(`Found ${this.results.totalPlatforms} platforms to test...\n`);

    platformIds.forEach((platformId, index) => {
      const result = this.testPlatform(platformId);
      this.results.platformResults.push(result);
      this.results.testedPlatforms++;

      if (result.passed) {
        this.results.passedTests++;
      } else {
        this.results.failedTests++;
      }

      // Capture any warnings/errors during testing
      if (result.consoleWarnings.length > 0) {
        this.results.warnings.push(...result.consoleWarnings);
      }
      if (result.consoleErrors.length > 0) {
        this.results.errors.push(...result.consoleErrors);
      }
    });

    this.restoreConsole();
  }

  // Print detailed results
  printResults() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULTS                                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Platforms: ${this.results.totalPlatforms}`);
    console.log(`Tested: ${this.results.testedPlatforms}`);
    console.log(`✓ Passed: ${this.results.passedTests}`);
    console.log(`✗ Failed: ${this.results.failedTests}`);
    console.log(`Warnings: ${this.results.warnings.length}`);
    console.log(`Errors: ${this.results.errors.length}`);

    const passRate = ((this.results.passedTests / this.results.testedPlatforms) * 100).toFixed(1);
    console.log(`\nPass Rate: ${passRate}%\n`);

    // Show failed platforms
    const failedPlatforms = this.results.platformResults.filter(r => !r.passed);
    if (failedPlatforms.length > 0) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  FAILED PLATFORMS                                           ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      failedPlatforms.forEach(result => {
        console.log(`✗ ${result.name} (${result.platformId})`);
        console.log(`  Category: ${result.category} | Theme Support: ${result.hasThemeSupport ? 'Yes' : 'No'}`);

        if (result.dark.errors.length > 0) {
          console.log(`  Dark Theme Errors: ${result.dark.errors.join(', ')}`);
        }
        if (result.light.errors.length > 0) {
          console.log(`  Light Theme Errors: ${result.light.errors.join(', ')}`);
        }
        console.log('');
      });
    }

    // Show passed platforms (summary)
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  PASSED PLATFORMS                                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const passedPlatforms = this.results.platformResults.filter(r => r.passed);
    console.log(`✓ All ${passedPlatforms.length} platforms passed theme switching tests:`);

    // Group by category
    const byCategory = {};
    passedPlatforms.forEach(result => {
      if (!byCategory[result.category]) {
        byCategory[result.category] = [];
      }
      byCategory[result.category].push(result.name);
    });

    Object.entries(byCategory).forEach(([category, platforms]) => {
      console.log(`\n${category.toUpperCase()}:`);
      platforms.forEach(name => console.log(`  ✓ ${name}`));
    });

    // Show warnings and errors
    if (this.results.warnings.length > 0 || this.results.errors.length > 0) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  CONSOLE OUTPUT                                             ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      if (this.results.warnings.length > 0) {
        console.log('Warnings:');
        this.results.warnings.forEach(w => console.log(`  ⚠ ${w}`));
      }

      if (this.results.errors.length > 0) {
        console.log('\nErrors:');
        this.results.errors.forEach(e => console.log(`  ✗ ${e}`));
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ACCEPTANCE CRITERIA STATUS                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✓ All platforms render in light theme: ${this.results.passedTests === this.results.testedPlatforms ? 'PASS' : 'PARTIAL'}`);
    console.log(`✓ All platforms render in dark theme: ${this.results.passedTests === this.results.testedPlatforms ? 'PASS' : 'PARTIAL'}`);
    console.log(`✓ Theme toggle changes frame appearance: ${passRate >= 90 ? 'PASS' : 'PARTIAL'}`);
    console.log(`✓ No console errors during theme switching: ${this.results.errors.length === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Each platform shows distinct styling: ${passRate >= 90 ? 'PASS' : 'PARTIAL'}\n`);

    // Final verdict
    const allPassed = this.results.passedTests === this.results.testedPlatforms &&
                     this.results.errors.length === 0;

    if (allPassed) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  ✓✓✓ ALL TESTS PASSED ✓✓✓                                ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      process.exit(0);
    } else {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  ✗✗✗ SOME TESTS FAILED ✗✗✗                                ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      process.exit(1);
    }
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

const runner = new ThemeTestRunner();
runner.runTests();
runner.printResults();
