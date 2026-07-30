/**
 * Simple test script to verify vista application launches with smartOrdering enabled
 * Uses curl and basic HTML inspection instead of Puppeteer
 */

const http = require('http');
const fs = require('fs');

async function testVistaLaunch() {
  console.log('Testing Vista application with smartOrdering enabled...\n');

  const results = {
    serverRunning: false,
    htmlLoaded: false,
    smartOrderingDefault: false,
    appJsAccessible: false,
    console: []
  };

  // Test 1: Check server is running
  console.log('1. Checking if server is running...');
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    if (data.status === 'ok') {
      results.serverRunning = true;
      console.log('   ✓ Server is running and healthy');
    } else {
      console.log('   ✗ Server health check failed');
    }
  } catch (error) {
    console.log('   ✗ Server is not running:', error.message);
    results.console.push({ test: 'server', error: error.message });
  }

  // Test 2: Check main HTML loads
  console.log('\n2. Checking if main HTML loads...');
  try {
    const response = await fetch('http://localhost:3000');
    const html = await response.text();

    if (html.includes('VISTA') && html.includes('Inspect')) {
      results.htmlLoaded = true;
      console.log('   ✓ Main HTML loads successfully');

      // Check for app.js reference
      if (html.includes('app.js')) {
        results.appJsAccessible = true;
        console.log('   ✓ app.js is referenced in HTML');
      }
    } else {
      console.log('   ✗ HTML does not contain expected content');
    }
  } catch (error) {
    console.log('   ✗ Failed to load HTML:', error.message);
    results.console.push({ test: 'html', error: error.message });
  }

  // Test 3: Check app.js for smartOrdering default
  console.log('\n3. Checking app.js for smartOrdering default value...');
  try {
    const response = await fetch('http://localhost:3000/app.js');
    const js = await response.text();

    // Look for the smartOrdering default in platformPrefs
    if (js.includes('smartOrdering: true')) {
      results.smartOrderingDefault = true;
      console.log('   ✓ smartOrdering is set to true by default');

      // Find the line for context
      const lines = js.split('\n');
      for (const line of lines) {
        if (line.includes('smartOrdering: true')) {
          console.log('      Found:', line.trim().substring(0, 80));
          break;
        }
      }
    } else {
      console.log('   ✗ smartOrdering: true not found in app.js');
    }
  } catch (error) {
    console.log('   ✗ Failed to load app.js:', error.message);
    results.console.push({ test: 'app.js', error: error.message });
  }

  // Test 4: Check style.css loads
  console.log('\n4. Checking if style.css loads...');
  try {
    const response = await fetch('http://localhost:3000/style.css');
    const css = await response.text();

    if (css.includes('.platform-card') || css.includes('.hero')) {
      console.log('   ✓ style.css loads successfully');
    } else {
      console.log('   ✗ style.css appears to be empty or corrupted');
    }
  } catch (error) {
    console.log('   ✗ Failed to load style.css:', error.message);
    results.console.push({ test: 'style.css', error: error.message });
  }

  // Test 5: Test API endpoint with a sample URL
  console.log('\n5. Testing API endpoint with sample URL...');
  try {
    const testUrl = 'https://example.com';
    const apiUrl = `http://localhost:3000/api/preview/meta?url=${encodeURIComponent(testUrl)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.meta && data.scoring) {
      console.log('   ✓ API endpoint returns valid data');
      console.log('      - Title:', data.meta.title || '(none)');
      console.log('      - Description:', data.meta.description?.substring(0, 50) + '...' || '(none)');
      console.log('      - Platform scores:', Object.keys(data.scoring.scores || {}).length);
    } else {
      console.log('   ✗ API response does not contain expected data');
    }
  } catch (error) {
    console.log('   ✗ API test failed:', error.message);
    results.console.push({ test: 'api', error: error.message });
  }

  // Test 6: Check that there are no obvious JavaScript errors in app.js
  console.log('\n6. Checking for common JavaScript errors in app.js...');
  try {
    const response = await fetch('http://localhost:3000/app.js');
    const js = await response.text();

    const errorPatterns = [
      /console\.error\(/,
      /throw new Error/,
      /undefined is not a function/,
      /Cannot read propert/
    ];

    let foundErrors = [];
    for (const pattern of errorPatterns) {
      const matches = js.match(pattern);
      if (matches && !js.includes('// eslint-disable')) {
        // Some errors might be in error handling code, so we check context
        foundErrors.push(pattern.toString());
      }
    }

    if (foundErrors.length === 0) {
      console.log('   ✓ No obvious error patterns found');
    } else {
      console.log('   ! Found potential error patterns:', foundErrors.join(', '));
    }
  } catch (error) {
    console.log('   ✗ Error checking app.js:', error.message);
    results.console.push({ test: 'js-check', error: error.message });
  }

  // Print summary
  console.log('\n=== TEST SUMMARY ===');
  const criteria = [
    { name: 'Server is running', passed: results.serverRunning },
    { name: 'Main HTML loads', passed: results.htmlLoaded },
    { name: 'smartOrdering enabled by default', passed: results.smartOrderingDefault },
    { name: 'app.js accessible', passed: results.appJsAccessible }
  ];

  criteria.forEach(c => {
    const status = c.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${c.name}`);
  });

  const allPassed = criteria.every(c => c.passed);
  console.log(`\n${allPassed ? 'ALL CRITERIA PASSED' : 'SOME CRITERIA FAILED'}`);

  if (!allPassed) {
    console.log('\nErrors encountered:');
    results.console.forEach(log => {
      console.log(`  - ${log.test}: ${log.error}`);
    });
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the test
testVistaLaunch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});