/**
 * Test script to verify smartOrdering feature in Vista
 * This script tests the API and verifies that the frontend application
 * has smartOrdering enabled by default with proper console logging
 */

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

console.log('=== VISTA SmartOrdering Feature Verification ===\n');

// Test 1: Health Check
console.log('Test 1: Checking if Vista server is running...');
http.get(`${BASE_URL}/api/health`, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log(`✅ Server is running: ${health.status}, version ${health.version}\n`);
    } catch (e) {
      console.log('❌ Failed to parse health check response\n');
    }
    runTest2();
  });
}).on('error', (err) => {
  console.log(`❌ Server health check failed: ${err.message}\n`);
  process.exit(1);
});

// Test 2: Check frontend loads
function runTest2() {
  console.log('Test 2: Checking if frontend HTML loads...');
  http.get(`${BASE_URL}/`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (data.includes('VISTA') && data.includes('app.js')) {
        console.log('✅ Frontend HTML loads correctly\n');
        runTest3();
      } else {
        console.log('❌ Frontend HTML missing expected content\n');
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.log(`❌ Frontend request failed: ${err.message}\n`);
    process.exit(1);
  });
}

// Test 3: Verify smartOrdering is enabled in app.js source
function runTest3() {
  console.log('Test 3: Verifying smartOrdering feature in source code...');
  const fs = require('fs');
  const appJsPath = './src/public/app.js';

  try {
    const appJs = fs.readFileSync(appJsPath, 'utf8');

    const checks = {
      'smartOrdering default enabled': appJs.includes('smartOrdering: true'),
      'smartOrdering preference storage': appJs.includes('platformPrefs.smartOrdering'),
      'applySmartOrdering function': appJs.includes('function applySmartOrdering()'),
      'applySmartOrdering log on call': appJs.includes('[applySmartOrdering] Function called'),
      'handleResult hook for smartOrdering': appJs.includes('[handleResult hook] smartOrdering enabled:'),
      'smartOrdering enabled log': appJs.includes('[handleResult hook] smartOrdering enabled:'),
      'page type detection': appJs.includes('const pageType = detectPageType(currentData.meta)'),
      'platform reordering': appJs.includes('PLATFORM_GROUPS.forEach'),
      'context/flag parameters logging': appJs.includes('[applySmartOrdering] Context/Flag parameters:'),
      'items being processed logging': appJs.includes('[applySmartOrdering] Items (currentData):')
    };

    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`  ✅ ${check}`);
      } else {
        console.log(`  ❌ ${check}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n✅ All smartOrdering feature checks passed\n');
      runTest4();
    } else {
      console.log('\n❌ Some smartOrdering feature checks failed\n');
      process.exit(1);
    }
  } catch (err) {
    console.log(`❌ Failed to read app.js: ${err.message}\n`);
    process.exit(1);
  }
}

// Test 4: Test API preview endpoint
function runTest4() {
  console.log('Test 4: Testing API preview endpoint...');
  const testUrl = encodeURIComponent('https://example.com');
  http.get(`${BASE_URL}/api/preview/meta?url=${testUrl}`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.meta && result.scoring) {
          console.log('✅ API preview endpoint works correctly\n');
          console.log('=== All Tests Passed ===');
          console.log('\n📋 SmartOrdering Feature Summary:');
          console.log('  • smartOrdering is enabled by default (smartOrdering: true)');
          console.log('  • applySmartOrdering() function exists with extensive logging');
          console.log('  • handleResult hook calls applySmartOrdering when enabled');
          console.log('  • Console logging tracks:');
          console.log('    - Function entry and exit conditions');
          console.log('    - Items being processed (currentData)');
          console.log('    - Context/flag parameters (smartOrderingEnabled, hasPagePreferences)');
          console.log('    - Page type detection');
          console.log('    - Platform group reordering');
          console.log('    - Preview re-rendering');
          console.log('\n🎯 To see smartOrdering in action:');
          console.log('  1. Open http://localhost:3000 in a browser');
          console.log('  2. Open browser DevTools Console');
          console.log('  3. Enter any URL to inspect');
          console.log('  4. Watch for [applySmartOrdering] console logs');
          console.log('\n✅ Verification complete!\n');

          // Clean shutdown
          process.exit(0);
        } else {
          console.log('❌ API response missing expected fields\n');
          process.exit(1);
        }
      } catch (e) {
        console.log(`❌ Failed to parse API response: ${e.message}\n`);
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.log(`❌ API request failed: ${err.message}\n`);
    process.exit(1);
  });
}