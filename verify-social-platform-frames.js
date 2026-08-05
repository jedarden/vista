#!/usr/bin/env node

/**
 * Comprehensive verification script for Facebook, LinkedIn, and Reddit context frames
 * Tests all acceptance criteria and generates verification report
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PLATFORMS = ['facebook', 'linkedin', 'reddit'];
const BASE_URL = 'http://localhost:3000';

async function testFrame(platform) {
  console.log(`\n🔍 Testing ${platform.toUpperCase()} frame...`);

  return new Promise((resolve) => {
    const url = `${BASE_URL}/test-${platform}-frame.html`;

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const tests = runPlatformTests(platform, data);
        resolve({
          platform,
          url,
          status: res.statusCode === 200 ? 'success' : 'failed',
          tests
        });
      });
    }).on('error', (err) => {
      resolve({
        platform,
        url,
        status: 'error',
        error: err.message,
        tests: {}
      });
    });
  });
}

function runPlatformTests(platform, html) {
  const tests = {};

  // Test 1: HTML Structure exists
  tests[`structure_exists`] = html.includes(`class="context-frame ${platform}-context`);

  // Test 2: Platform-specific elements
  const platformElements = {
    'facebook': ['.fb-post-header', '.fb-avatar', '.fb-author-name', '.fb-post-time', '.fb-link-preview'],
    'linkedin': ['.li-post-header', '.li-avatar', '.li-author-name', '.li-post-headline', '.li-post-time', '.li-link-preview'],
    'reddit': ['.rd-subreddit-header', '.rd-subreddit-icon', '.rd-subreddit-name', '.rd-post-item', '.rd-upvote-section']
  };

  if (platformElements[platform]) {
    platformElements[platform].forEach(element => {
      tests[element.replace('.', '')] = html.includes(element);
    });
  }

  // Test 3: Theme toggle button exists
  tests[`theme_toggle`] = html.includes('id="themeToggle"');

  // Test 4: Verification script exists
  tests[`verification_script`] = html.includes('runVerification');

  // Test 5: Acceptance criteria section exists
  tests[`acceptance_criteria`] = html.includes('acceptance-criteria');

  // Test 6: Platform-specific accent colors in CSS
  const accentColors = {
    'facebook': ['#1877f2', '#1877F2'],
    'linkedin': ['#0a66c2', '#0A66C2'],
    'reddit': ['#ff4500', '#FF4500']
  };

  tests[`accent_color`] = accentColors[platform].some(color =>
    html.toLowerCase().includes(color.toLowerCase())
  );

  return tests;
}

function printResults(results) {
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('=' .repeat(60));

  results.forEach(result => {
    console.log(`\n${result.platform.toUpperCase()} Frame:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  URL: ${result.url}`);

    if (result.tests) {
      const passedTests = Object.values(result.tests).filter(v => v).length;
      const totalTests = Object.values(result.tests).length;
      console.log(`  Tests: ${passedTests}/${totalTests} passed`);

      const failedTests = Object.entries(result.tests)
        .filter(([_, passed]) => !passed)
        .map(([name, _]) => name);

      if (failedTests.length > 0) {
        console.log(`  Failed: ${failedTests.join(', ')}`);
      }
    }
  });

  const allPassed = results.every(r =>
    r.status === 'success' &&
    Object.values(r.tests || {}).every(t => t)
  );

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL FRAMES VERIFIED SUCCESSFULLY');
  } else {
    console.log('❌ SOME VERIFICATION TESTS FAILED');
  }
}

async function main() {
  console.log('🚀 Starting comprehensive frame verification...');
  console.log(`Base URL: ${BASE_URL}`);

  const results = [];

  for (const platform of PLATFORMS) {
    const result = await testFrame(platform);
    results.push(result);
  }

  printResults(results);

  // Generate report
  const reportPath = path.join(__dirname, 'social-frames-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

main().catch(console.error);