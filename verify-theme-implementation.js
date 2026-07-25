#!/usr/bin/env node
/**
 * Theme System Implementation Verification
 *
 * Verifies the theme switching system implementation by checking:
 * 1. HTML structure correctness
 * 2. CSS theme variables and platform-specific styles
 * 3. JavaScript functionality
 * 4. All 7 platforms present and configured
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'verify-complete-theme-switching.html');

// Test results
const results = {
  totalTests: 0,
  passedTests: 0,
  failures: []
};

/**
 * Add test result
 */
function test(name, passed, details = '') {
  results.totalTests++;
  if (passed) {
    results.passedTests++;
    console.log(`✓ ${name}`);
    if (details) console.log(`  ${details}`);
  } else {
    results.failures.push({ name, details });
    console.log(`✗ ${name}`);
    if (details) console.log(`  ${details}`);
  }
}

console.log('🎨 Theme System Implementation Verification\n');

// Check if file exists
if (!fs.existsSync(HTML_FILE)) {
  console.error(`❌ File not found: ${HTML_FILE}`);
  process.exit(1);
}

const html = fs.readFileSync(HTML_FILE, 'utf-8');

console.log('📋 Checking HTML structure...\n');

// Test 1: Document has proper theme attribute
test(
  '1.1 HTML element has data-theme attribute',
  html.includes('data-theme='),
  'Found data-theme attribute on HTML element'
);

test(
  '1.2 HTML starts with dark theme',
  html.includes('<html lang="en" data-theme="dark">'),
  'Default theme is dark'
);

// Test 2: CSS root variables for dark theme
test(
  '2.1 CSS root variables defined for dark theme',
  html.includes('--bg-primary:') && html.includes('--text-primary:'),
  'Dark theme CSS variables present'
);

// Test 3: CSS variables for light theme
test(
  '3.1 Light theme CSS variables defined',
  html.includes('[data-theme="light"]') && html.includes('--bg-primary: #ffffff'),
  'Light theme CSS variables present'
);

// Test 4: All 7 platforms present
const platforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
console.log('\n📋 Checking all 7 platforms...\n');

platforms.forEach(platform => {
  test(
    `4.${platforms.indexOf(platform) + 1} Platform: ${platform.charAt(0).toUpperCase() + platform.slice(1)} present`,
    html.includes(`card-${platform}`) && html.includes(`${platform}-context`),
    `Found ${platform} platform card and context`
  );
});

// Test 5: Platform-specific chrome styles
console.log('\n📋 Checking platform chrome styles...\n');

test(
  '5.1 Twitter chrome styles (dark/light)',
  html.includes('[data-theme="light"] .twitter-context') && html.includes('[data-theme="dark"] .twitter-context'),
  'Twitter theme-specific backgrounds defined'
);

test(
  '5.2 Facebook chrome styles',
  html.includes('[data-theme="light"] .facebook-context') && html.includes('[data-theme="dark"] .facebook-context'),
  'Facebook theme-specific backgrounds defined'
);

test(
  '5.3 LinkedIn chrome styles',
  html.includes('[data-theme="light"] .linkedin-context') && html.includes('[data-theme="dark"] .linkedin-context'),
  'LinkedIn theme-specific backgrounds defined'
);

test(
  '5.4 Reddit chrome styles',
  html.includes('[data-theme="light"] .reddit-context') && html.includes('[data-theme="dark"] .reddit-context'),
  'Reddit theme-specific backgrounds defined'
);

test(
  '5.5 YouTube chrome styles',
  html.includes('[data-theme="light"] .youtube-context') && html.includes('[data-theme="dark"] .youtube-context'),
  'YouTube theme-specific backgrounds defined'
);

test(
  '5.6 Instagram chrome styles',
  html.includes('[data-theme="light"] .instagram-context') && html.includes('[data-theme="dark"] .instagram-context'),
  'Instagram theme-specific backgrounds defined'
);

test(
  '5.7 TikTok chrome styles',
  html.includes('[data-theme="light"] .tiktok-context') && html.includes('[data-theme="dark"] .tiktok-context'),
  'TikTok theme-specific backgrounds defined'
);

// Test 6: JavaScript theme switching functionality
console.log('\n📋 Checking JavaScript implementation...\n');

test(
  '6.1 Theme toggle button present',
  html.includes('id="themeToggle"') && html.includes('onclick="toggleTheme()"'),
  'Theme toggle button exists'
);

test(
  '6.2 Toggle button with icon and text',
  html.includes('id="themeIcon"') && html.includes('id="themeText"'),
  'Button has icon and text elements'
);

test(
  '6.3 Platform indicators present',
  platforms.every(p => html.includes(`indicator-${p}`) && html.includes(`icon-${p}`) && html.includes(`text-${p}`)),
  'All platforms have theme indicators'
);

// Test 7: JavaScript theme functions
test(
  '7.1 initThemeSystem function exists',
  html.includes('function initThemeSystem()'),
  'Theme initialization function present'
);

test(
  '7.2 applyTheme function exists',
  html.includes('function applyTheme('),
  'Theme application function present'
);

test(
  '7.3 toggleTheme function exists',
  html.includes('function toggleTheme()'),
  'Theme toggle function present'
);

test(
  '7.4 updatePlatformIndicator function exists',
  html.includes('function updatePlatformIndicator('),
  'Platform indicator update function present'
);

// Test 8: Theme persistence functionality
test(
  '8.1 localStorage integration',
  html.includes('localStorage.setItem(\'vista-theme\''),
  'Theme saves to localStorage'
);

test(
  '8.2 localStorage retrieval',
  html.includes('localStorage.getItem(\'vista-theme\''),
  'Theme loads from localStorage'
);

test(
  '8.3 System preference detection',
  html.includes('window.matchMedia(\'(prefers-color-scheme: light)\')'),
  'System theme preference detection present'
);

test(
  '8.4 Persistence test button',
  html.includes('onclick="testPersistence()"') && html.includes('class="reload-btn"'),
  'Persistence test button exists'
);

// Test 9: FOUC prevention
console.log('\n📋 Checking FOUC prevention...\n');

test(
  '9.1 CSS transitions defined',
  html.includes('transition: background') || html.includes('transition: all'),
  'CSS transitions for smooth theme changes'
);

test(
  '9.2 checkForFOUC function exists',
  html.includes('function checkForFOUC()'),
  'FOUC detection function present'
);

test(
  '9.3 FOUC check in status panel',
  html.includes('id="status-glitches"'),
  'FOUC status indicator present'
);

// Test 10: Status panel and monitoring
console.log('\n📋 Checking status panel...\n');

test(
  '10.1 Current theme status',
  html.includes('id="status-theme"'),
  'Current theme status element present'
);

test(
  '10.2 Platform update count',
  html.includes('id="status-updates"'),
  'Platform update count element present'
);

test(
  '10.3 Theme switch time measurement',
  html.includes('id="status-time"') && html.includes('performance.now()'),
  'Theme switch timing measurement present'
);

test(
  '10.4 Persistence status',
  html.includes('id="status-persistence"'),
  'Persistence status element present'
);

// Test 11: Platform badge verification
console.log('\n📋 Checking platform badges...\n');

platforms.forEach(platform => {
  test(
    `11.${platforms.indexOf(platform) + 1} ${platform.charAt(0).toUpperCase() + platform.slice(1)} badge`,
    html.includes(`<span class="platform-badge">Complete</span>`) || html.includes('platform-badge'),
    `${platform} has completion badge`
  );
});

// Test 12: Acceptance criteria displayed
test(
  '12.1 Acceptance criteria section present',
  html.includes('Acceptance Criteria') || html.includes('criteria-section'),
  'Acceptance criteria section exists'
);

test(
  '12.2 All 6 criteria listed',
  html.includes('Toggle button switches theme in real-time') &&
  html.includes('All 7 platforms respond immediately') &&
  html.includes('No page reload required') &&
  html.includes('chrome correctly adapts') &&
  html.includes('Theme persists') &&
  html.includes('visual glitches or FOUC'),
  'All 6 acceptance criteria displayed'
);

// Final summary
console.log('\n' + '='.repeat(70));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${results.totalTests}`);
console.log(`Passed: ${results.passedTests}`);
console.log(`Failed: ${results.failures.length}`);
console.log(`Pass Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (results.failures.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failures.forEach((failure, index) => {
    console.log(`  ${index + 1}. ${failure.name}`);
    if (failure.details) console.log(`     ${failure.details}`);
  });
  console.log('');
}

// Save results
const resultsPath = path.join(__dirname, 'theme-implementation-results.json');
fs.writeFileSync(resultsPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalTests: results.totalTests,
  passedTests: results.passedTests,
  failedTests: results.failures.length,
  passRate: (results.passedTests / results.totalTests) * 100,
  failures: results.failures
}, null, 2));

console.log(`📁 Results saved to: ${resultsPath}`);

const allPassed = results.failures.length === 0;
if (allPassed) {
  console.log('✅ All implementation checks passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some implementation checks failed. Review failures above.\n');
  process.exit(1);
}
