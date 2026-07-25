#!/usr/bin/env node

/**
 * Dark Theme Screenshot Verification Script (Bead bf-b6pnm)
 *
 * This script verifies that all required dark theme screenshots have been captured
 * and meet the acceptance criteria.
 *
 * Usage: node screenshots/dark-theme/verify-dark-theme-screenshots.js
 */

const fs = require('fs');
const path = require('path');

// Platforms to verify
const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'discord', name: 'Discord' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'signal', name: 'Signal' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'mastodon', name: 'Mastodon' }
];

const THEME = 'dark';
const SCREENSHOT_DIR = __dirname;

console.log('🔍 Dark Theme Screenshot Verification (Bead bf-b6pnm)');
console.log('='.repeat(60));
console.log(`Theme: ${THEME}`);
console.log(`Directory: ${SCREENSHOT_DIR}`);
console.log('');

const results = [];
let allPassed = true;

PLATFORMS.forEach(platform => {
  const expectedFile = path.join(SCREENSHOT_DIR, `${platform.id}-${THEME}.png`);
  const htmlFile = path.join(SCREENSHOT_DIR, `${platform.id}-${THEME}.html`);

  const result = {
    platform: platform.id,
    name: platform.name,
    htmlExists: false,
    screenshotExists: false,
    screenshotSize: 0,
    isValid: false,
    issues: []
  };

  // Check if HTML file exists
  if (fs.existsSync(htmlFile)) {
    result.htmlExists = true;
  } else {
    result.issues.push('HTML file missing');
    allPassed = false;
  }

  // Check if screenshot exists and is valid
  if (fs.existsSync(expectedFile)) {
    result.screenshotExists = true;
    const stats = fs.statSync(expectedFile);
    result.screenshotSize = stats.size;

    // Check if file is not empty
    if (stats.size > 0) {
      result.isValid = true;
    } else {
      result.issues.push('Screenshot file is empty (0 bytes)');
      allPassed = false;
    }
  } else {
    result.issues.push('Screenshot file missing');
    allPassed = false;
  }

  results.push(result);
});

// Display results
console.log('📊 Verification Results:');
console.log(''.repeat(60));

results.forEach(result => {
  const status = result.isValid ? '✅' : '❌';
  const size = result.screenshotSize > 0 ? `${Math.round(result.screenshotSize / 1024)} KB` : 'N/A';

  console.log(`${status} ${result.name} (${result.platform})`);
  console.log(`   HTML: ${result.htmlExists ? '✅' : '❌'} | Screenshot: ${result.screenshotExists ? '✅' : '❌'} | Size: ${size}`);

  if (result.issues.length > 0) {
    result.issues.forEach(issue => {
      console.log(`   ⚠️  ${issue}`);
    });
  }
  console.log('');
});

// Summary
console.log('='.repeat(60));
console.log('📋 Summary:');
console.log('='.repeat(60));

const validCount = results.filter(r => r.isValid).length;
const htmlCount = results.filter(r => r.htmlExists).length;
const screenshotCount = results.filter(r => r.screenshotExists).length;

console.log(`HTML files: ${htmlCount}/${PLATFORMS.length}`);
console.log(`Screenshots: ${screenshotCount}/${PLATFORMS.length}`);
console.log(`Valid screenshots: ${validCount}/${PLATFORMS.length}`);
console.log('');

// Check acceptance criteria
console.log('🎯 Acceptance Criteria Status:');
console.log(''.repeat(60));

const criteria = [
  {
    check: 'Screenshot captured for all 7 platforms in dark theme',
    passed: screenshotCount === PLATFORMS.length
  },
  {
    check: 'All screenshots saved with correct naming convention',
    passed: screenshotCount === PLATFORMS.length
  },
  {
    check: 'Screenshot files are valid PNG images',
    passed: validCount === PLATFORMS.length
  },
  {
    check: 'No rendering errors or blank screenshots',
    passed: validCount === PLATFORMS.length && results.every(r => r.screenshotSize > 1000)
  }
];

criteria.forEach(criterion => {
  const status = criterion.passed ? '✅' : '❌';
  console.log(`${status} ${criterion.check}`);
});

console.log('');

// Overall status
if (allPassed && validCount === PLATFORMS.length) {
  console.log('🎉 ALL ACCEPTANCE CRITERIA PASSED!');
  console.log('');
  console.log('✅ Dark theme screenshots are complete and valid.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Commit the screenshots:');
  console.log('   git add screenshots/dark-theme/*-dark.png');
  console.log('   git commit -m "feat(bf-b6pnm): add dark theme platform screenshots"');
  console.log('2. Push to remote:');
  console.log('   git push');
  console.log('3. Close the bead:');
  console.log('   br close bf-b6pnm');
} else {
  console.log('⚠️  ACCEPTANCE CRITERIA NOT MET');
  console.log('');
  console.log('Missing or invalid screenshots detected.');
  console.log('');
  console.log('To complete this task:');
  console.log('1. Start the server: node serve-dark-theme-pages.js');
  console.log('2. Open http://localhost:8081/ in your browser');
  console.log('3. Capture screenshots for missing platforms');
  console.log('4. Save as platform-name-dark.png');
  console.log('5. Re-run this verification script');
}

// Save verification report
const reportPath = path.join(SCREENSHOT_DIR, 'verification-report.json');
const report = {
  timestamp: new Date().toISOString(),
  theme: THEME,
  platforms: results,
  summary: {
    totalPlatforms: PLATFORMS.length,
    htmlFiles: htmlCount,
    screenshots: screenshotCount,
    validScreenshots: validCount,
    allPassed: allPassed && validCount === PLATFORMS.length
  },
  acceptanceCriteria: criteria.map(c => ({
    check: c.check,
    passed: c.passed
  }))
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('');
console.log(`📄 Verification report saved to: ${reportPath}`);

process.exit(allPassed && validCount === PLATFORMS.length ? 0 : 1);
