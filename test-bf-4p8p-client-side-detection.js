#!/usr/bin/env node
/**
 * Test: Client-Side-Only Tag Detection (bf-4p8p)
 *
 * This test verifies that VISTA correctly detects and reports meta tags
 * that are injected via JavaScript (client-side only).
 *
 * Test case:
 * 1. Create a test HTML file with JavaScript-injected meta tags
 * 2. Run preview against that file
 * 3. Verify diagnostic appears with 'error' severity
 * 4. Verify diagnostic message is actionable
 * 5. Document test results
 *
 * Usage: node test-bf-4p8p-client-side-detection.js
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

// Test configuration
const TEST_PORT = 3001;
const TEST_HTML_PATH = path.join(__dirname, 'test-client-side-meta-tags.html');
const TEST_URL = `http://localhost:${TEST_PORT}/test-client-side-meta-tags.html`;
const VISTA_PORT = 3000;
const VISTA_URL = `http://localhost:${VISTA_PORT}/api/preview`;

// Test results tracking
const results = {
  testHtmlCreated: false,
  serverStarted: false,
  previewFetched: false,
  diagnosticFound: false,
  severityCorrect: false,
  messageActionable: false,
  codeCorrect: false,
  platformsSpecified: false,
  fixProvided: false,
};

/**
 * Verify the test HTML file exists and contains the expected JavaScript
 */
function verifyTestHtml() {
  info('Verifying test HTML file...');

  if (!fs.existsSync(TEST_HTML_PATH)) {
    error('Test HTML file does not exist');
    return false;
  }

  const html = fs.readFileSync(TEST_HTML_PATH, 'utf8');

  // Check that it contains JavaScript-injected meta tags
  const hasJsInjection = html.includes('createElement(\'meta\')') ||
                        html.includes('createElement("meta")');
  if (!hasJsInjection) {
    error('Test HTML does not contain JavaScript meta tag injection');
    return false;
  }

  // Check that meta tags are NOT in static HTML (before script)
  const headEnd = html.indexOf('</head>');
  const scriptStart = html.indexOf('<script>', headEnd);
  const metaBeforeScript = html.substring(headEnd, scriptStart).includes('<meta');

  if (metaBeforeScript) {
    error('Test HTML contains static meta tags - they should all be injected via JS');
    return false;
  }

  success('Test HTML file verified');
  results.testHtmlCreated = true;
  return true;
}

/**
 * Start a simple HTTP server to serve the test HTML
 */
function startTestServer() {
  return new Promise((resolve, reject) => {
    info(`Starting test HTTP server on port ${TEST_PORT}...`);

    const server = http.createServer((req, res) => {
      if (req.url === '/test-client-side-meta-tags.html') {
        const html = fs.readFileSync(TEST_HTML_PATH, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(TEST_PORT, (err) => {
      if (err) {
        error(`Failed to start test server: ${err.message}`);
        reject(err);
        return;
      }

      success(`Test server started on port ${TEST_PORT}`);
      results.serverStarted = true;
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        error(`Port ${TEST_PORT} already in use`);
        reject(new Error(`Port ${TEST_PORT} already in use`));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Fetch preview from VISTA for the test URL
 */
function fetchPreview() {
  return new Promise((resolve, reject) => {
  info(`Fetching preview from VISTA at ${VISTA_PORT}...`);

  const url = new URL(VISTA_URL);
  url.searchParams.set('url', TEST_URL);

  const options = {
    hostname: 'localhost',
    port: VISTA_PORT,
    path: `/api/preview?url=${encodeURIComponent(TEST_URL)}`,
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode !== 200) {
        error(`VISTA returned status ${res.statusCode}`);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      try {
        const result = JSON.parse(data);
        success('Preview fetched successfully');
        results.previewFetched = true;
        resolve(result);
      } catch (err) {
        error(`Failed to parse VISTA response: ${err.message}`);
        reject(err);
      }
    });
  });

  req.on('error', (err) => {
    error(`Failed to fetch preview: ${err.message}`);
    reject(err);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    reject(new Error('Request timeout'));
  });

  req.end();
  });
}

/**
 * Verify the diagnostic findings
 */
function verifyDiagnostics(previewResult) {
  info('Verifying diagnostic findings...');

  if (!previewResult.diagnostics || !Array.isArray(previewResult.diagnostics)) {
    error('No diagnostics array in preview result');
    return false;
  }

  // Look for client-side-only tag diagnostics
  const clientSideDiagnostics = previewResult.diagnostics.filter(d =>
    d.code === 'js-injected-tags' ||
    d.code === 'client-side-only-tags' ||
    (d.message && d.message.toLowerCase().includes('javascript'))
  );

  if (clientSideDiagnostics.length === 0) {
    error('No client-side-only tag diagnostic found');
    info(`Available diagnostics: ${previewResult.diagnostics.map(d => d.code).join(', ')}`);
    return false;
  }

  success(`Found ${clientSideDiagnostics.length} client-side-only tag diagnostic(s)`);
  results.diagnosticFound = true;

  // Verify each diagnostic
  for (const diag of clientSideDiagnostics) {
    log(`\n  Diagnostic:`, 'yellow');
    log(`    Code: ${diag.code}`, 'yellow');
    log(`    Severity: ${diag.severity}`, 'yellow');
    log(`    Message: ${diag.message}`, 'yellow');
    log(`    Platforms: ${diag.platforms}`, 'yellow');

    // Check severity
    if (diag.severity === 'error') {
      success('  Severity is correctly set to "error"');
      results.severityCorrect = true;
    } else {
      error(`  Expected severity "error", got "${diag.severity}"`);
    }

    // Check code
    if (diag.code === 'js-injected-tags' || diag.code === 'client-side-only-tags') {
      success(`  Diagnostic code is correct: ${diag.code}`);
      results.codeCorrect = true;
    }

    // Check message is actionable
    const actionableKeywords = ['move', 'ssr', 'prerendering', 'server-side', 'static', 'head'];
    const messageLower = diag.message.toLowerCase();
    if (actionableKeywords.some(kw => messageLower.includes(kw))) {
      success('  Diagnostic message is actionable');
      results.messageActionable = true;
    } else {
      error('  Diagnostic message is not actionable enough');
    }

    // Check platforms specified
    if (diag.platforms && diag.platforms.length > 0) {
      success(`  Platforms specified: ${diag.platforms}`);
      results.platformsSpecified = true;
    } else {
      error('  No platforms specified');
    }

    // Check fix provided
    if (diag.fix && diag.fix.length > 0) {
      success('  Fix/suggestion provided');
      results.fixProvided = true;
      log(`    Fix: ${diag.fix}`, 'yellow');
    } else {
      error('  No fix/suggestion provided');
    }
  }

  return true;
}

/**
 * Print test summary
 */
function printSummary() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(v => v).length;

  for (const [check, passed] of Object.entries(results)) {
    const label = check.replace(/([A-Z])/g, ' $1').toLowerCase();
    if (passed) {
      success(`${label}: PASS`);
    } else {
      error(`${label}: FAIL`);
    }
  }

  log('\n' + '─'.repeat(60), 'cyan');
  if (passedChecks === totalChecks) {
    success(`ALL TESTS PASSED (${passedChecks}/${totalChecks})`);
    log('═══════════════════════════════════════════════════════════\n', 'green');
    return 0;
  } else {
    error(`SOME TESTS FAILED (${passedChecks}/${totalChecks} passed)`);
    log('═══════════════════════════════════════════════════════════\n', 'red');
    return 1;
  }
}

/**
 * Main test execution
 */
async function runTest() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                           ║', 'cyan');
  log('║   VISTA Client-Side-Only Tag Detection Test (bf-4p8p)  ║', 'cyan');
  log('║                                                           ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  let testServer = null;
  let exitCode = 1;

  try {
    // Step 1: Verify test HTML
    if (!verifyTestHtml()) {
      throw new Error('Test HTML verification failed');
    }

    // Step 2: Start test server
    testServer = await startTestServer();

    // Wait a bit for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Fetch preview from VISTA
    const previewResult = await fetchPreview();

    // Step 4: Verify diagnostics
    if (!verifyDiagnostics(previewResult)) {
      throw new Error('Diagnostic verification failed');
    }

    // Print summary
    exitCode = printSummary();

  } catch (err) {
    error(`Test execution failed: ${err.message}`);
    log(err.stack, 'red');
    exitCode = 1;
  } finally {
    // Cleanup
    if (testServer) {
      info('Stopping test server...');
      testServer.close();
      success('Test server stopped');
    }
  }

  process.exit(exitCode);
}

// Run the test
if (require.main === module) {
  runTest().catch(err => {
    error(`Unhandled error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runTest, results };
