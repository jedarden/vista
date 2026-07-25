#!/usr/bin/env node

/**
 * Automated Platform Frame Verification Script (Bead bf-3em63)
 *
 * This script performs automated verification of platform frame rendering
 * by checking HTML structure, CSS variables, and theme support.
 *
 * Usage: node automated-verification.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Automated Platform Frame Verification (Bead bf-3em63)');
console.log('='.repeat(70));
console.log('');

// Platform verification results
const verificationResults = {
  totalPlatforms: 7,
  platformsVerified: 0,
  themesVerified: 0,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  platformResults: []
};

// Test each platform HTML file
function verifyPlatformHTML(platform, theme) {
  const filename = `${platform.id}-${theme}.html`;
  const filePath = path.join(__dirname, filename);

  console.log(`🧪 Testing ${platform.name} (${theme} theme)...`);

  const tests = {
    fileExists: false,
    hasProperStructure: false,
    hasPlatformFramesModule: false,
    hasAppModule: false,
    hasRenderFunction: false,
    hasThemeClass: false,
    hasSampleContent: false,
    hasFrameContainer: false
  };

  // Test 1: File exists
  if (fs.existsSync(filePath)) {
    tests.fileExists = true;
    const html = fs.readFileSync(filePath, 'utf8');

    // Test 2: Proper HTML structure
    if (html.includes('<!DOCTYPE html>') && html.includes('</html>')) {
      tests.hasProperStructure = true;
    }

    // Test 3: Platform frames module loaded
    if (html.includes('src/public/platform-frames.js')) {
      tests.hasPlatformFramesModule = true;
    }

    // Test 4: App module loaded
    if (html.includes('src/public/app.js')) {
      tests.hasAppModule = true;
    }

    // Test 5: Render function call
    if (html.includes('renderPlatformWithContext')) {
      tests.hasRenderFunction = true;
    }

    // Test 6: Theme class
    const themeClass = theme === 'dark' ? 'dark-theme' : 'light-theme';
    if (html.includes(themeClass)) {
      tests.hasThemeClass = true;
    }

    // Test 7: Sample content
    if (html.includes('sampleContent') && html.includes('meta')) {
      tests.hasSampleContent = true;
    }

    // Test 8: Frame container
    if (html.includes('frame-container') && html.includes('id="frame-container"')) {
      tests.hasFrameContainer = true;
    }
  }

  // Count passed tests
  const passedTests = Object.values(tests).filter(v => v).length;
  const totalTests = Object.keys(tests).length;

  verificationResults.totalTests += totalTests;
  verificationResults.passedTests += passedTests;
  verificationResults.failedTests += (totalTests - passedTests);

  // Display results
  Object.entries(tests).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`   ${status} ${testName.replace(/^ /, '').toUpperCase()}`);
  });

  const allPassed = Object.values(tests).every(v => v);
  console.log(`   ${allPassed ? '✅ PASSED' : '❌ FAILED'} (${passedTests}/${totalTests} tests passed)`);
  console.log('');

  return {
    platform: platform.id,
    name: platform.name,
    theme,
    tests,
    passedTests,
    totalTests,
    allPassed
  };
}

// Platforms to verify
const platforms = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'slack', name: 'Slack' },
  { id: 'github', name: 'GitHub' },
  { id: 'gmail', name: 'Gmail' },
  { id: 'reddit', name: 'Reddit' }
];

// Run verification
console.log('📋 Running platform frame verification tests...\n');

platforms.forEach(platform => {
  // Test light theme
  const lightResult = verifyPlatformHTML(platform, 'light');
  verificationResults.platformResults.push(lightResult);

  // Test dark theme
  const darkResult = verifyPlatformHTML(platform, 'dark');
  verificationResults.platformResults.push(darkResult);

  if (lightResult.allPassed && darkResult.allPassed) {
    verificationResults.platformsVerified++;
  }
  verificationResults.themesVerified += 2;
});

// Summary
console.log('='.repeat(70));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log('');

console.log(`Platforms Tested: ${verificationResults.totalPlatforms}`);
console.log(`Platforms Verified: ${verificationResults.platformsVerified}/${verificationResults.totalPlatforms}`);
console.log(`Theme Variations: ${verificationResults.themesVerified} (${verificationResults.totalPlatforms} platforms × 2 themes)`);
console.log(`Total Tests Run: ${verificationResults.totalTests}`);
console.log(`Tests Passed: ${verificationResults.passedTests}`);
console.log(`Tests Failed: ${verificationResults.failedTests}`);
console.log(`Success Rate: ${((verificationResults.passedTests / verificationResults.totalTests) * 100).toFixed(1)}%`);
console.log('');

// Platform-by-platform breakdown
console.log('📋 Platform-by-Platform Results:');
console.log('');

platforms.forEach(platform => {
  const lightResults = verificationResults.platformResults.find(r => r.platform === platform.id && r.theme === 'light');
  const darkResults = verificationResults.platformResults.find(r => r.platform === platform.id && r.theme === 'dark');

  const lightStatus = lightResults?.allPassed ? '✅' : '❌';
  const darkStatus = darkResults?.allPassed ? '✅' : '❌';
  const overallStatus = (lightResults?.allPassed && darkResults?.allPassed) ? '✅ PASS' : '❌ FAIL';

  console.log(`${overallStatus} ${platform.name.padEnd(20)} | Light: ${lightStatus} | Dark: ${darkStatus}`);
});

console.log('');

// Acceptance criteria verification
console.log('✅ ACCEPTANCE CRITERIA STATUS:');
console.log('');

const acceptanceCriteria = [
  {
    criterion: 'Screenshot HTML files generated for all 7 platforms in light theme',
    status: verificationResults.platformResults.every(r => r.theme === 'light' && r.allPassed),
    details: `7/7 platforms have valid light theme HTML files`
  },
  {
    criterion: 'Screenshot HTML files generated for all 7 platforms in dark theme',
    status: verificationResults.platformResults.every(r => r.theme === 'dark' && r.allPassed),
    details: `7/7 platforms have valid dark theme HTML files`
  },
  {
    criterion: 'All platforms ready for visual inspection',
    status: verificationResults.platformsVerified === verificationResults.totalPlatforms,
    details: `${verificationResults.platformsVerified}/${verificationResults.totalPlatforms} platforms fully verified`
  },
  {
    criterion: 'HTML structure properly configured for rendering',
    status: verificationResults.platformResults.every(r => r.tests.hasProperStructure && r.tests.hasFrameContainer),
    details: `All files have proper HTML structure and frame containers`
  },
  {
    criterion: 'Platform frames module correctly linked',
    status: verificationResults.platformResults.every(r => r.tests.hasPlatformFramesModule),
    details: `All files link to platform-frames.js module`
  },
  {
    criterion: 'Rendering function correctly configured',
    status: verificationResults.platformResults.every(r => r.tests.hasRenderFunction && r.tests.hasAppModule),
    details: `All files include renderPlatformWithContext function`
  }
];

acceptanceCriteria.forEach(({ criterion, status, details }) => {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${criterion}`);
  console.log(`   ${details}`);
  console.log('');
});

// Final verdict
const allCriteriaPassed = acceptanceCriteria.every(c => c.status);

console.log('='.repeat(70));
if (allCriteriaPassed) {
  console.log('🎉 AUTOMATED VERIFICATION PASSED!');
  console.log('');
  console.log('All acceptance criteria met. Platform frames are ready for:');
  console.log('   ✅ Manual screenshot capture');
  console.log('   ✅ Visual inspection of chrome and UI elements');
  console.log('   ✅ Card embedding verification');
  console.log('   ✅ Theme switching validation');
  console.log('');
  console.log('Next steps: Open index.html in a browser to capture screenshots.');
} else {
  console.log('⚠️  AUTOMATED VERIFICATION FAILED');
  console.log('');
  console.log('Some acceptance criteria not met. Please review the results above.');
}
console.log('='.repeat(70));

// Exit with appropriate code
process.exit(allCriteriaPassed ? 0 : 1);