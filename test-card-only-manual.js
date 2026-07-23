/**
 * Simplified Card-Only Rendering Test
 *
 * This test manually verifies card-only rendering by:
 * 1. Loading the test harness
 * 2. Checking for basic HTML structure
 * 3. Documenting findings
 */

const fs = require('fs');
const path = require('path');

// Platforms to test
const PLATFORMS_TO_TEST = [
  'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube',
  'slack', 'discord', 'imessage', 'whatsapp', 'telegram', 'signal',
  'microsoft-teams', 'google-chat', 'zoom-chat', 'line', 'kakaotalk',
  'tiktok', 'pinterest', 'bluesky', 'mastodon', 'threads', 'tumblr',
  'reddit', 'github', 'gitlab', 'stackoverflow', 'hackernews',
  'producthunt', 'devto', 'medium'
];

// Representative platforms for screenshots
const REPRESENTATIVE_PLATFORMS = ['twitter', 'slack', 'whatsapp', 'github', 'producthunt'];

console.log('🧪 Manual Card-Only Rendering Test');
console.log('='.repeat(60));
console.log(`\n📊 Testing ${PLATFORMS_TO_TEST.length} platforms`);
console.log(`📸 Baseline platforms: ${REPRESENTATIVE_PLATFORMS.join(', ')}\n`);

// Read the test harness
const harnessPath = path.join(__dirname, 'src/public/test-platform-frames-harness.html');
const harnessContent = fs.readFileSync(harnessPath, 'utf-8');

// Read platform-frames.js
const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
const framesContent = fs.readFileSync(framesPath, 'utf-8');

console.log('✅ Test harness loaded');
console.log('✅ Platform frames loaded\n');

// Check each platform
const results = {
  total: PLATFORMS_TO_TEST.length,
  tested: 0,
  passed: 0,
  failed: 0,
  issues: []
};

PLATFORMS_TO_TEST.forEach(platformId => {
  console.log(`🔍 Checking ${platformId}...`);

  const platformResult = {
    id: platformId,
    hasFrameDefinition: false,
    hasFrameData: false,
    hasChrome: false,
    hasThemeVars: false,
    issues: []
  };

  // Check if platform is defined in platform-frames.js
  const platformRegex = new RegExp(`\\b${platformId}\\s*:\\s*\\{`, 'i');
  const hasDefinition = platformRegex.test(framesContent);
  platformResult.hasFrameDefinition = hasDefinition;

  if (!hasDefinition) {
    platformResult.issues.push('No platform definition found');
  }

  // Check for chrome property
  const chromeRegex = new RegExp(`${platformId}\\s*:[\\s\\S]*?chrome\\s*:\\s*[\`'\"]`, 'i');
  const hasChrome = chromeRegex.test(framesContent);
  platformResult.hasChrome = hasChrome;

  if (!hasChrome) {
    platformResult.issues.push('No chrome property found');
  }

  // Check for themeVars
  const themeRegex = new RegExp(`${platformId}\\s*:[\\s\\S]*?themeVars\\s*:\\s*\\{`, 'i');
  const hasThemeVars = themeRegex.test(framesContent);
  platformResult.hasThemeVars = hasThemeVars;

  if (!hasThemeVars) {
    platformResult.issues.push('No themeVars found');
  }

  // Check if test element exists in harness
  const testElementRegex = new RegExp(`test-${platformId}`, 'i');
  const hasTestElement = testElementRegex.test(harnessContent);
  platformResult.hasTestElement = hasTestElement;

  if (!hasTestElement) {
    platformResult.issues.push('No test element in harness');
  }

  // Overall pass/fail
  const passed = hasDefinition && hasChrome && hasThemeVars && hasTestElement;

  results.tested++;
  if (passed) {
    results.passed++;
    console.log(`  ✅ PASSED`);
  } else {
    results.failed++;
    results.issues.push(platformResult);
    console.log(`  ❌ FAILED`);
    platformResult.issues.forEach(issue => {
      console.log(`     - ${issue}`);
    });
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total platforms tested: ${results.total}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

if (results.issues.length > 0) {
  console.log('\n🔍 PLATFORMS WITH ISSUES:');
  results.issues.forEach(issue => {
    console.log(`\n  ${issue.id}:`);
    issue.issues.forEach(i => console.log(`    - ${i}`));
  });
}

console.log('\n' + '='.repeat(60));
console.log('📸 BASELINE SCREENSHOTS REQUIRED');
console.log('='.repeat(60));
console.log(`\nThe following representative platforms need manual screenshots:`);
REPRESENTATIVE_PLATFORMS.forEach(platform => {
  console.log(`  - ${platform}`);
});
console.log(`\nTo capture screenshots:`);
console.log(`  1. Open: src/public/test-platform-frames-harness.html in a browser`);
console.log(`  2. Click the "📄 Card Only All" button`);
console.log(`  3. Take screenshots of the representative platforms listed above`);
console.log(`  4. Save to: screenshots/card-only-test/`);

console.log('\n' + '='.repeat(60));
console.log('🔗 NEXT STEPS');
console.log('='.repeat(60));
console.log(`
1. Open test harness in browser:
   file://${path.join(__dirname, 'src/public/test-platform-frames-harness.html')}

2. Click "📄 Card Only All" button

3. Verify visual rendering:
   - Cards render without layout breaks
   - Platform logos/icons are visible
   - Platform names are displayed
   - No visual glitches

4. Check browser console for errors

5. Take baseline screenshots of 5 representative platforms

6. Document any issues found
`);

// Save results
const resultsPath = path.join(__dirname, 'card-only-manual-test-results.json');
fs.writeFileSync(resultsPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  results: results,
  representativePlatforms: REPRESENTATIVE_PLATFORMS
}, null, 2));

console.log(`\n💾 Results saved to: ${resultsPath}`);

process.exit(results.failed > 0 ? 1 : 0);
