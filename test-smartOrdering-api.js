/**
 * Test smartOrdering functionality via API
 * Tests the VISTA API to ensure smartOrdering works correctly
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const RESULTS = {
  tests: [],
  errors: [],
  startTime: new Date().toISOString()
};

function logTest(testName, passed, details = '') {
  const result = { test: testName, passed, details, timestamp: new Date().toISOString() };
  RESULTS.tests.push(result);
  console.log(`[${passed ? '✓' : '✗'}] ${testName}${details ? ': ' + details : ''}`);
  if (!passed) {
    RESULTS.errors.push(result);
  }
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : body;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function main() {
  console.log('Starting VISTA smartOrdering API Test...');
  console.log('BASE URL:', BASE_URL);
  console.log('');

  // Test 1: Verify server is running
  console.log('Test 1: Checking server availability');
  try {
    const response = await makeRequest('/');
    const serverRunning = response.status === 200;
    logTest('Server Running', serverRunning, `Status: ${response.status}`);

    if (!serverRunning) {
      throw new Error('Server not available');
    }
  } catch (error) {
    logTest('Server Running', false, error.message);
    throw error;
  }

  // Test 2: Check if page loads with smartOrdering parameter
  console.log('\nTest 2: Loading page with smartOrdering=true');
  try {
    const response = await makeRequest('/?smartOrdering=true');
    const hasHTML = response.data.includes('<!DOCTYPE html');
    const hasVistaTitle = response.data.includes('VISTA');

    logTest('Page Load with smartOrdering', hasVistaTitle,
             hasHTML && hasVistaTitle ? 'HTML loaded successfully' : 'HTML or title missing');

    // Check for smartOrdering in app.js initialization
    const hasSmartOrderingDefault = response.data.includes('smartOrdering: true');
    logTest('smartOrdering Default in Code', hasSmartOrderingDefault,
             hasSmartOrderingDefault ? 'smartOrdering default found' : 'smartOrdering default not found');

  } catch (error) {
    logTest('Page Load with smartOrdering', false, error.message);
  }

  // Test 3: Test the API endpoint for URL analysis
  console.log('\nTest 3: Testing URL analysis API');
  try {
    const testData = {
      url: 'https://example.com',
      smartOrdering: true
    };

    const response = await makeRequest('/api/preview', 'POST', testData);

    if (response.status === 200 || response.status === 202) {
      logTest('API Endpoint Response', true,
               `Status: ${response.status}, Data received: ${typeof response.data === 'object' ? 'yes' : 'no'}`);

      // Check if response contains platform data
      if (typeof response.data === 'object') {
        const hasPlatforms = response.data.platforms || response.data.results || response.data.scores;
        logTest('API Response Structure', !!hasPlatforms,
                 hasPlatforms ? 'Platform data found' : 'Platform data missing');
      }
    } else {
      logTest('API Endpoint Response', false, `Status: ${response.status}`);
    }

  } catch (error) {
    logTest('API Endpoint Response', false, error.message);
  }

  // Test 4: Check for platform cards structure in HTML
  console.log('\nTest 4: Checking HTML structure for platform cards');
  try {
    const response = await makeRequest('/');
    const html = response.data;

    // Look for platform card indicators
    const hasPreviewGrid = html.includes('previewGrid') || html.includes('preview-grid');
    const hasPlatformClass = html.includes('platform-card') || html.includes('platformCard');
    const hasPlatformPrefs = html.includes('platformPrefs');

    logTest('Platform Card Structure', hasPreviewGrid && hasPlatformClass,
             `Grid: ${hasPreviewGrid}, Card class: ${hasPlatformClass}`);

    logTest('Platform Preferences Variable', hasPlatformPrefs,
             hasPlatformPrefs ? 'platformPrefs found in HTML' : 'platformPrefs not found');

  } catch (error) {
    logTest('Platform Card Structure', false, error.message);
  }

  // Test 5: Verify smartOrdering URL parameter handling
  console.log('\nTest 5: Verifying smartOrdering URL parameter handling');
  try {
    const response = await makeRequest('/?smartOrdering=true');
    const html = response.data;

    // Check if the URL parameter is preserved in links or forms
    const hasSmartOrderingParam = html.includes('smartOrdering=true') || html.includes('smartOrdering');

    logTest('smartOrdering Parameter in Response', hasSmartOrderingParam,
             hasSmartOrderingParam ? 'Parameter found in response' : 'Parameter not explicitly found');

  } catch (error) {
    logTest('smartOrdering Parameter Handling', false, error.message);
  }

  // Test 6: Check for favorite/platform interaction buttons
  console.log('\nTest 6: Checking for platform interaction elements');
  try {
    const response = await makeRequest('/');
    const html = response.data;

    const hasFavoriteButtons = html.includes('favorite') || html.includes('fav-btn');
    const hasColumnSelector = html.includes('column') || html.includes('Column');
    const hasSearchInput = html.includes('search') || html.includes('filter');

    logTest('Interaction Elements Found',
             hasFavoriteButtons || hasColumnSelector || hasSearchInput,
             `Favorite: ${hasFavoriteButtons}, Column: ${hasColumnSelector}, Search: ${hasSearchInput}`);

  } catch (error) {
    logTest('Interaction Elements', false, error.message);
  }

  // Test 7: Test with example URL from the page
  console.log('\nTest 7: Testing with example URL (github.com)');
  try {
    const testUrl = 'https://github.com';
    const response = await makeRequest('/api/preview', 'POST', {
      url: testUrl,
      smartOrdering: true
    });

    const requestSuccess = response.status !== 500;
    logTest('Example URL Test', requestSuccess,
             `Status: ${response.status}, URL: ${testUrl}`);

  } catch (error) {
    logTest('Example URL Test', false, error.message);
  }

  // Write results
  RESULTS.endTime = new Date().toISOString();
  RESULTS.summary = {
    total: RESULTS.tests.length,
    passed: RESULTS.tests.filter(t => t.passed).length,
    failed: RESULTS.tests.filter(t => !t.passed).length,
    errors: RESULTS.errors.length
  };

  const fs = require('fs');
  const path = require('path');
  const resultsPath = path.join(__dirname, 'notes', 'bf-5a7dp-api-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('API TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${RESULTS.summary.total}`);
  console.log(`Passed: ${RESULTS.summary.passed}`);
  console.log(`Failed: ${RESULTS.summary.failed}`);
  console.log(`Errors: ${RESULTS.summary.errors}`);
  console.log('');
  console.log(`Results saved to: ${resultsPath}`);
  console.log('='.repeat(60));

  if (RESULTS.summary.failed > 0) {
    console.log('\nFailed tests:');
    RESULTS.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.test}: ${t.details}`);
    });
  }

  process.exit(RESULTS.summary.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});