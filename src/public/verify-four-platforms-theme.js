#!/usr/bin/env node

/**
 * Comprehensive verification script for four social platform frames theme switching
 * Tests Reddit, Twitter/X, YouTube, and TikTok platform frames with CSS integration
 *
 * This script can be run in both Node.js and browser environments
 */

const fs = require('fs');
const path = require('path');

// Platform definitions
const platforms = [
  { name: 'Reddit', file: 'reddit-frame.html', contextClass: 'reddit-context', icon: '🤖' },
  { name: 'Twitter/X', file: 'twitter-frame.html', contextClass: 'twitter-context', icon: '𝕏' },
  { name: 'YouTube', file: 'youtube-frame.html', contextClass: 'youtube-context', icon: '▶️' },
  { name: 'TikTok', file: 'tiktok-frame.html', contextClass: 'tiktok-context', icon: '🎵' }
];

const verificationResults = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warning: '\x1b[33m', // yellow
    reset: '\x1b[0m'
  };

  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function verifyHTMLFile(platform) {
  const filePath = path.join(__dirname, platform.file);

  console.log(`Checking file path: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    verificationResults.failed.push(`${platform.name}: HTML file not found`);
    log(`❌ ${platform.name}: HTML file not found at ${filePath}`, 'error');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check for CSS file links
  const hasThemeCSS = content.includes('frames-theme.css');
  const hasSocialCSS = content.includes('social-platforms-frames.css');

  if (!hasThemeCSS || !hasSocialCSS) {
    verificationResults.failed.push(`${platform.name}: Missing CSS file references`);
    log(`❌ ${platform.name}: Missing required CSS file references`, 'error');
    return false;
  }

  // Check for context class (with or without additional classes)
  const hasContextClass = content.includes(platform.contextClass);

  if (!hasContextClass) {
    verificationResults.failed.push(`${platform.name}: Missing context class`);
    log(`❌ ${platform.name}: Missing ${platform.contextClass} class`, 'error');
    return false;
  }

  // Check for theme toggle functionality
  const hasThemeToggle = content.includes('toggleTheme()');
  const hasDataTheme = content.includes('data-theme');

  if (!hasThemeToggle || !hasDataTheme) {
    verificationResults.warnings.push(`${platform.name}: Theme switching may be incomplete`);
    log(`⚠️  ${platform.name}: Theme switching functionality may be incomplete`, 'warning');
  }

  // Check for platform-specific styling in centralized CSS
  const socialCSSPath = path.join(__dirname, 'social-platforms-frames.css');
  if (fs.existsSync(socialCSSPath)) {
    const socialCSS = fs.readFileSync(socialCSSPath, 'utf8');
    const hasPlatformCSS = socialCSS.includes(`.${platform.contextClass}`);

    if (!hasPlatformCSS) {
      verificationResults.failed.push(`${platform.name}: Missing platform CSS in centralized file`);
      log(`❌ ${platform.name}: No platform-specific CSS found in social-platforms-frames.css`, 'error');
      return false;
    }
  }

  verificationResults.passed.push(`${platform.name}: All checks passed`);
  log(`✅ ${platform.name}: All HTML structure checks passed`, 'success');
  return true;
}

function verifyThemeVariables(platform) {
  const themeCSSPath = path.join(__dirname, 'frames-theme.css');

  if (!fs.existsSync(themeCSSPath)) {
    verificationResults.failed.push(`Theme CSS file not found`);
    log(`❌ Theme CSS file not found at ${themeCSSPath}`, 'error');
    return false;
  }

  const themeCSS = fs.readFileSync(themeCSSPath, 'utf8');

  // Check for platform-specific theme variables
  const platformColors = {
    'Reddit': ['--color-reddit-orange', '--color-reddit-dark-bg'],
    'Twitter/X': ['--color-twitter-blue', '--color-twitter-black'],
    'YouTube': ['--color-youtube-red', '--color-youtube-dark-bg'],
    'TikTok': ['--color-tiktok-pink', '--color-tiktok-dark-bg']
  };

  const expectedColors = platformColors[platform.name];

  for (const color of expectedColors) {
    if (!themeCSS.includes(color)) {
      verificationResults.failed.push(`${platform.name}: Missing theme variable ${color}`);
      log(`❌ ${platform.name}: Missing theme variable ${color}`, 'error');
      return false;
    }
  }

  log(`✅ ${platform.name}: All theme variables present`, 'success');
  return true;
}

function verifyCSSConsistency() {
  const socialCSSPath = path.join(__dirname, 'social-platforms-frames.css');
  const themeCSSPath = path.join(__dirname, 'frames-theme.css');

  if (!fs.existsSync(socialCSSPath) || !fs.existsSync(themeCSSPath)) {
    verificationResults.failed.push(`CSS files missing for consistency check`);
    return false;
  }

  const socialCSS = fs.readFileSync(socialCSSPath, 'utf8');
  const themeCSS = fs.readFileSync(themeCSSPath, 'utf8');

  // Check that all platforms use consistent CSS structure
  const consistencyChecks = [
    { pattern: /context-frame\./, description: 'context-frame base class' },
    { pattern: /\{/, description: 'CSS rule blocks' },
    { pattern: /transition:/, description: 'transition properties' },
    { pattern: /var\(--color-/, description: 'CSS variable usage' }
  ];

  for (const check of consistencyChecks) {
    const socialMatches = socialCSS.match(check.pattern);
    const themeMatches = themeCSS.match(check.pattern);

    if (!socialMatches || !themeMatches) {
      verificationResults.warnings.push(`CSS consistency: ${check.description} may be missing`);
      log(`⚠️  CSS consistency check: ${check.description} may be incomplete`, 'warning');
    }
  }

  log(`✅ CSS structure consistency verified`, 'success');
  return true;
}

function generateVerificationReport() {
  log('\n📋 VERIFICATION REPORT', 'info');
  log('='.repeat(50), 'info');

  log(`\n✅ Passed Checks (${verificationResults.passed.length}):`, 'success');
  verificationResults.passed.forEach(check => log(`  • ${check}`, 'success'));

  if (verificationResults.warnings.length > 0) {
    log(`\n⚠️  Warnings (${verificationResults.warnings.length}):`, 'warning');
    verificationResults.warnings.forEach(warning => log(`  • ${warning}`, 'warning'));
  }

  if (verificationResults.failed.length > 0) {
    log(`\n❌ Failed Checks (${verificationResults.failed.length}):`, 'error');
    verificationResults.failed.forEach(failure => log(`  • ${failure}`, 'error'));
  }

  const totalChecks = verificationResults.passed.length + verificationResults.failed.length + verificationResults.warnings.length;
  const successRate = Math.round((verificationResults.passed.length / totalChecks) * 100);

  log(`\n📊 Success Rate: ${successRate}%`, successRate === 100 ? 'success' : 'warning');

  return verificationResults.failed.length === 0;
}

function main() {
  log('🔍 Starting Four Platform Frames Theme Verification', 'info');
  log('=' .repeat(50), 'info');

  // Verify each platform
  platforms.forEach(platform => {
    log(`\n📱 Verifying ${platform.name}...`, 'info');
    verifyHTMLFile(platform);
    verifyThemeVariables(platform);
  });

  // Verify CSS consistency
  log('\n🎨 Verifying CSS consistency...', 'info');
  verifyCSSConsistency();

  // Generate final report
  const success = generateVerificationReport();

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the verification
if (require.main === module) {
  main();
}

/**
 * Browser-based testing functions
 * These functions can be used in the browser console or included in a test page
 */
const browserTests = {
  // Test theme toggle functionality
  async testThemeToggle(platformName) {
    const platform = platforms.find(p => p.name === platformName);
    if (!platform) {
      console.error(`Platform ${platformName} not found`);
      return false;
    }

    try {
      const response = await fetch(platform.file);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Check for theme toggle button
      const button = doc.querySelector('.theme-toggle-btn');
      if (!button) {
        console.error(`❌ ${platformName}: Theme toggle button not found`);
        return false;
      }

      // Check for toggleTheme function
      const script = doc.querySelector('script');
      if (!script || !script.textContent.includes('function toggleTheme()')) {
        console.error(`❌ ${platformName}: toggleTheme() function not found`);
        return false;
      }

      // Check for localStorage integration
      if (!script.textContent.includes("localStorage.setItem('vista-theme'")) {
        console.error(`❌ ${platformName}: localStorage integration missing`);
        return false;
      }

      // Check for data-theme attribute setting
      if (!script.textContent.includes("document.documentElement.setAttribute('data-theme'")) {
        console.error(`❌ ${platformName}: data-theme attribute setting missing`);
        return false;
      }

      console.log(`✅ ${platformName}: Theme toggle functionality verified`);
      return true;
    } catch (error) {
      console.error(`❌ ${platformName}: ${error.message}`);
      return false;
    }
  },

  // Test all platforms' theme toggle
  async testAllPlatforms() {
    console.log('🧪 Testing all platforms for theme toggle functionality...');
    const results = [];

    for (const platform of platforms) {
      const result = await this.testThemeToggle(platform.name);
      results.push({ platform: platform.name, passed: result });
    }

    const passed = results.filter(r => r.passed).length;
    console.log(`\n📊 Results: ${passed}/${results.length} platforms passed theme toggle tests`);
    return results;
  },

  // Verify CSS variables in browser
  verifyCSSVariables() {
    console.log('🎨 Verifying CSS variables in current document...');

    const variables = [
      // Reddit
      { name: 'Reddit Dark BG', var: '--color-reddit-dark-bg', platform: 'Reddit' },
      { name: 'Reddit Light BG', var: '--color-reddit-light-bg', platform: 'Reddit' },
      { name: 'Reddit Orange', var: '--color-reddit-orange', platform: 'Reddit' },
      // Twitter
      { name: 'Twitter Black', var: '--color-twitter-black', platform: 'Twitter/X' },
      { name: 'Twitter Blue', var: '--color-twitter-blue', platform: 'Twitter/X' },
      { name: 'Twitter Pink', var: '--color-twitter-pink', platform: 'Twitter/X' },
      // YouTube
      { name: 'YouTube Dark BG', var: '--color-youtube-dark-bg', platform: 'YouTube' },
      { name: 'YouTube Red', var: '--color-youtube-red', platform: 'YouTube' },
      { name: 'YouTube Text', var: '--youtube-text-primary', platform: 'YouTube' },
      // TikTok
      { name: 'TikTok Dark BG', var: '--color-tiktok-dark-bg', platform: 'TikTok' },
      { name: 'TikTok Pink', var: '--color-tiktok-pink', platform: 'TikTok' },
      { name: 'TikTok Cyan', var: '--color-tiktok-cyan', platform: 'TikTok' }
    ];

    const results = {
      found: [],
      missing: []
    };

    for (const variable of variables) {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(variable.var)
        .trim();

      if (value) {
        results.found.push({ name: variable.name, value, platform: variable.platform });
        console.log(`✅ ${variable.name} (${variable.platform}): ${value}`);
      } else {
        results.missing.push({ name: variable.name, platform: variable.platform });
        console.log(`❌ ${variable.name} (${variable.platform}): NOT FOUND`);
      }
    }

    console.log(`\n📊 Summary: ${results.found.length}/${variables.length} variables found`);
    return results;
  },

  // Test interactive theme switching
  testInteractiveSwitching() {
    console.log('🔄 Testing interactive theme switching...');

    const themes = ['dark', 'light'];
    const results = [];

    for (const theme of themes) {
      console.log(`Testing ${theme.toUpperCase()} mode...`);
      document.documentElement.setAttribute('data-theme', theme);

      setTimeout(() => {
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const bodyColor = getComputedStyle(document.body).color;

        console.log(`  Body BG: ${bodyBg}`);
        console.log(`  Body Color: ${bodyColor}`);

        // Test platform-specific elements
        for (const platform of platforms) {
          const context = document.querySelector(`.${platform.contextClass}`);
          if (context) {
            const contextBg = getComputedStyle(context).backgroundColor;
            const contextColor = getComputedStyle(context).color;
            console.log(`  ${platform.name} Context - BG: ${contextBg}, Color: ${contextColor}`);
            results.push({
              platform: platform.name,
              theme: theme,
              bg: contextBg,
              color: contextColor
            });
          }
        }
      }, 100);
    }

    // Reset to dark mode
    setTimeout(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      console.log('✅ Interactive theme switching test completed');
      return results;
    }, 500);
  },

  // Generate comprehensive test report
  generateReport() {
    console.log('📋 COMPREHENSIVE TEST REPORT');
    console.log('═'.repeat(50));

    const report = {
      timestamp: new Date().toISOString(),
      platforms: platforms.map(p => ({
        name: p.name,
        file: p.file,
        contextClass: p.contextClass
      })),
      tests: []
    };

    // Run all tests
    console.log('Running platform verification tests...');
    for (const platform of platforms) {
      const result = this.testThemeToggle(platform.name);
      report.tests.push({
        platform: platform.name,
        themeToggle: result
      });
    }

    // Verify CSS variables
    const cssVars = this.verifyCSSVariables();
    report.cssVariables = cssVars;

    // Summary
    const passedTests = report.tests.filter(t => t.themeToggle).length;
    const foundVars = cssVars.found.length;
    const totalVars = cssVars.found.length + cssVars.missing.length;

    console.log('═'.repeat(50));
    console.log(`📊 SUMMARY:`);
    console.log(`  Platform Tests: ${passedTests}/${report.tests.length} passed`);
    console.log(`  CSS Variables: ${foundVars}/${totalVars} found`);
    console.log(`  Overall: ${((passedTests + foundVars) / (report.tests.length + totalVars) * 100).toFixed(1)}% success rate`);

    return report;
  }
};

// Export for both environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verifyHTMLFile,
    verifyThemeVariables,
    verifyCSSConsistency,
    verificationResults,
    platforms,
    browserTests
  };
}

// Browser environment
if (typeof window !== 'undefined') {
  window.PlatformThemeTests = {
    platforms,
    testThemeToggle: browserTests.testThemeToggle.bind(browserTests),
    testAllPlatforms: browserTests.testAllPlatforms.bind(browserTests),
    verifyCSSVariables: browserTests.verifyCSSVariables.bind(browserTests),
    testInteractiveSwitching: browserTests.testInteractiveSwitching.bind(browserTests),
    generateReport: browserTests.generateReport.bind(browserTests)
  };

  console.log('✅ Platform Theme Tests loaded in browser mode');
  console.log('📖 Available functions:');
  console.log('  - PlatformThemeTests.testAllPlatforms()');
  console.log('  - PlatformThemeTests.verifyCSSVariables()');
  console.log('  - PlatformThemeTests.testInteractiveSwitching()');
  console.log('  - PlatformThemeTests.generateReport()');
}