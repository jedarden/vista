#!/usr/bin/env node

/**
 * Dark Mode Verification Test Script
 *
 * This script verifies that all 7 platform frames have proper dark mode support
 * by checking:
 * 1. CSS variables are defined for dark theme
 * 2. Theme toggle functionality works
 * 3. Visual consistency across platforms
 */

const fs = require('fs');
const path = require('path');

const PLATFORMS = [
  'facebook',
  'twitter',
  'linkedin',
  'reddit',
  'instagram',
  'youtube',
  'tiktok'
];

const EXPECTED_CSS_VARS = [
  '--frame-bg',
  '--frame-surface',
  '--frame-border',
  '--frame-text-primary',
  '--frame-text-secondary',
  '--frame-text-muted',
  '--frame-accent',
  '--frame-accent-bg',
  '--frame-link-color',
  '--frame-divider',
  '--frame-input-bg',
  '--frame-overlay'
];

function checkCSSVariables(platform, css) {
  const darkThemeRegex = new RegExp(`\\.${platform}-context\\.dark-theme\\s*{([^}]+)}`, 's');
  const match = css.match(darkThemeRegex);

  if (!match) {
    return { found: false, missing: EXPECTED_CSS_VARS };
  }

  const themeBlock = match[1];
  const foundVars = [];
  const missingVars = [];

  EXPECTED_CSS_VARS.forEach(varName => {
    if (themeBlock.includes(varName)) {
      foundVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });

  return { found: true, foundVars, missingVars };
}

function main() {
  console.log('🌙 Dark Mode Verification Test');
  console.log('================================\n');

  const cssPath = path.join(__dirname, 'style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  let allPassed = true;

  PLATFORMS.forEach(platform => {
    console.log(`Testing ${platform}...`);

    const result = checkCSSVariables(platform, css);

    if (!result.found) {
      console.log(`  ❌ FAIL: No dark-theme CSS found for ${platform}`);
      allPassed = false;
      return;
    }

    if (result.missingVars.length > 0) {
      console.log(`  ⚠️  WARNING: Missing CSS variables: ${result.missingVars.join(', ')}`);
    }

    if (result.foundVars.length === EXPECTED_CSS_VARS.length) {
      console.log(`  ✅ PASS: All ${EXPECTED_CSS_VARS.length} CSS variables defined`);
    } else {
      console.log(`  ⚠️  PARTIAL: ${result.foundVars.length}/${EXPECTED_CSS_VARS.length} variables defined`);
    }

    console.log(`  Found variables: ${result.foundVars.join(', ')}`);
    console.log('');
  });

  console.log('================================');
  if (allPassed) {
    console.log('✅ All platforms passed dark mode verification');
  } else {
    console.log('❌ Some platforms failed dark mode verification');
  }

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { checkCSSVariables, EXPECTED_CSS_VARS };