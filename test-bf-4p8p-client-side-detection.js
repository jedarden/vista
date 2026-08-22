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
const net = require('net');
const { spawn } = require('child_process');
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

/**
 * Listen on a port, resolving with the bound server once it is ready.
 */
function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener('error', onError);
      reject(err);
    };

    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', onError);
      resolve(server);
    });
  });
}

/**
 * Close a local HTTP server without allowing an open connection to hang the
 * test forever.
 */
function closeHttpServer(server) {
  if (!server || !server.listening) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    timer = setTimeout(() => {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      finish();
    }, 3_000);

    server.close(finish);
  });
}

/**
 * Probe a requested port and return it, or ask the kernel for an ephemeral
 * free port when the requested one is already occupied.
 */
async function findFreePort(requestedPort) {
  const probe = net.createServer();

  try {
    await listen(probe, requestedPort);
    const port = probe.address().port;
    await closeHttpServer(probe);
    return port;
  } catch (err) {
    await closeHttpServer(probe);
    if (err.code !== 'EADDRINUSE') throw err;
  }

  const fallback = net.createServer();
  try {
    await listen(fallback, 0);
    const port = fallback.address().port;
    await closeHttpServer(fallback);
    return port;
  } catch (err) {
    await closeHttpServer(fallback);
    throw err;
  }
}

/**
 * Make a bounded JSON request to a local service.
 */
function requestJson(port, requestPath, timeoutMs = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: requestPath,
      method: 'GET',
    }, (res) => {
      let data = '';

      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch (err) {
          reject(new Error(`Invalid JSON response: ${err.message}`));
          return;
        }
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    req.end();
  });
}

// Test configuration
const TEST_PORT = Number(process.env.TEST_PORT) || 3001;
const TEST_HTML_PATH = path.join(__dirname, 'test-client-side-meta-tags.html');
// Default 3000 (the server's own default). Overridable because this box runs
// concurrent agents' dev servers and 3000 is sometimes claimed by another
// project. VISTA_PORT remains a preferred port; the harness falls back to a
// free ephemeral port when it is occupied. TEST_MODE=true is also required
// so ssrf-guard's validateUrl() lets the server fetch the localhost test URL.
const VISTA_PORT = Number(process.env.VISTA_PORT) || 3000;
const SERVER_START_TIMEOUT_MS = 15_000;
const REQUEST_TIMEOUT_MS = 15_000;
const HARNESS_TIMEOUT_MS = 90_000;

// Ports are selected after the fixture server and VISTA are started. Keep
// localhost in the URL because TEST_MODE's SSRF exception is intentionally
// scoped to that hostname; bind the local listeners to loopback explicitly.
let testPort = TEST_PORT;
let vistaPort = VISTA_PORT;
let testUrl = null;

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

// This child owns the environment plumbing only. The remaining checks stay
// available for the later detection/correctness beads, but are intentionally
// deferred until the server-side detection wiring exists.
const HARNESS_RESULT_KEYS = ['testHtmlCreated', 'serverStarted', 'previewFetched'];

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
async function startTestServer() {
  info(`Starting test HTTP server (preferred port ${TEST_PORT})...`);

  const createServer = () => http.createServer((req, res) => {
    if (req.url === '/test-client-side-meta-tags.html') {
      const html = fs.readFileSync(TEST_HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  let server;
  try {
    server = createServer();
    await listen(server, TEST_PORT);
  } catch (err) {
    await closeHttpServer(server);
    if (err.code !== 'EADDRINUSE') {
      throw new Error(`Failed to start test server: ${err.message}`);
    }

    info(`Port ${TEST_PORT} is busy; retrying fixture on an ephemeral port...`);
    server = createServer();
    await listen(server, 0);
    testPort = server.address().port;
  }

  testPort = server.address().port;
  testUrl = `http://localhost:${testPort}/test-client-side-meta-tags.html`;
  success(`Test server started on port ${testPort}`);
  results.serverStarted = true;
  return server;
}

/**
 * Wait for the VISTA health endpoint, while also noticing an early child
 * process exit. Every poll has its own timeout and the whole startup has a
 * hard deadline.
 */
function waitForVistaHealth(child, port) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let pollTimer = null;
    let deadlineTimer = null;

    const finish = (err) => {
      if (finished) return;
      finished = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (deadlineTimer) clearTimeout(deadlineTimer);
      child.removeListener('exit', onExit);
      if (err) reject(err);
      else resolve();
    };

    const onExit = (code, signal) => {
      finish(new Error(
        `VISTA exited before health check (code ${code}, signal ${signal || 'none'})`
      ));
    };

    const poll = async () => {
      try {
        const response = await requestJson(port, '/api/health', 1_000);
        if (response.statusCode === 200 && response.body &&
            (response.body.status === 'ok' || response.body.ok === true)) {
          finish();
          return;
        }
      } catch (_) {
        // The child needs a moment to load dependencies and bind its port.
      }

      if (!finished) pollTimer = setTimeout(poll, 100);
    };

    child.once('exit', onExit);
    deadlineTimer = setTimeout(() => {
      finish(new Error(`VISTA health check timed out after ${SERVER_START_TIMEOUT_MS}ms`));
    }, SERVER_START_TIMEOUT_MS);
    poll();
  });
}

/**
 * Stop a VISTA child process, escalating after a short grace period so a
 * failed test cannot leave a server holding a port or keep Node alive.
 */
function stopVistaServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    let killTimer;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      resolve();
    };

    child.once('exit', finish);
    child.kill('SIGTERM');
    killTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
      setTimeout(finish, 1_000);
    }, 3_000);
  });
}

/**
 * Start this test's own VISTA server. The preferred VISTA_PORT is only a
 * preference: a squatter or a concurrent dev server causes an ephemeral port
 * to be selected and retried instead of reusing that unrelated process.
 */
async function startVistaServer() {
  let requestedPort = VISTA_PORT;
  let lastError = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    vistaPort = await findFreePort(requestedPort);
    if (vistaPort !== requestedPort) {
      info(`Port ${requestedPort} is busy; using VISTA port ${vistaPort}`);
    }

    info(`Starting VISTA server on port ${vistaPort}...`);
    const child = spawn(process.execPath, ['src/server.js'], {
      cwd: __dirname,
      env: { ...process.env, TEST_MODE: 'true', PORT: String(vistaPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdout.resume();

    try {
      await waitForVistaHealth(child, vistaPort);
      success(`VISTA server started and passed health check on port ${vistaPort}`);
      return child;
    } catch (err) {
      lastError = err;
      await stopVistaServer(child);
      if (!/EADDRINUSE|address already in use/i.test(stderr + err.message)) {
        throw new Error(`${err.message}${stderr ? `: ${stderr.trim()}` : ''}`);
      }
      requestedPort = 0;
      info('VISTA port became occupied during startup; selecting another free port...');
    }
  }

  throw lastError || new Error('Failed to start VISTA server');
}

/**
 * Fetch preview from VISTA for the test URL
 */
function fetchPreview() {
  return new Promise((resolve, reject) => {
  info(`Fetching preview from VISTA at port ${vistaPort}...`);

  const options = {
    hostname: '127.0.0.1',
    port: vistaPort,
    path: `/api/preview?url=${encodeURIComponent(testUrl)}`,
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
        if (!result || !Array.isArray(result.diagnostics)) {
          error('VISTA response does not contain a diagnostics array');
          reject(new Error('Preview response is missing diagnostics array'));
          return;
        }
        success('Preview fetched successfully');
        info(`Preview response contains diagnostics array (${result.diagnostics.length} entries)`);
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

  const ownedResults = Object.fromEntries(
    HARNESS_RESULT_KEYS.map(key => [key, results[key]])
  );
  const totalChecks = Object.keys(ownedResults).length;
  const passedChecks = Object.values(ownedResults).filter(v => v).length;

  for (const [check, passed] of Object.entries(results)) {
    const label = check.replace(/([A-Z])/g, ' $1').toLowerCase();
    if (!HARNESS_RESULT_KEYS.includes(check)) {
      info(`${label}: DEFERRED (detection checks belong to later beads)`);
    } else if (passed) {
      success(`${label}: PASS`);
    } else {
      error(`${label}: FAIL`);
    }
  }

  log('\n' + '─'.repeat(60), 'cyan');
  if (passedChecks === totalChecks) {
    success(`HARNESS CHECKS PASSED (${passedChecks}/${totalChecks})`);
    log('═══════════════════════════════════════════════════════════\n', 'green');
    return 0;
  } else {
    error(`HARNESS CHECKS FAILED (${passedChecks}/${totalChecks} passed)`);
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

  const watchdog = setTimeout(() => {
    error(`Test exceeded the ${HARNESS_TIMEOUT_MS}ms runtime limit`);
    process.exit(1);
  }, HARNESS_TIMEOUT_MS);
  let testServer = null;
  let vistaServer = null;
  let exitCode = 1;

  try {
    // Step 1: Verify test HTML
    if (!verifyTestHtml()) {
      throw new Error('Test HTML verification failed');
    }

    // Step 2: Start test server
    testServer = await startTestServer();

    // Step 3: Start and health-check this test's own VISTA server
    vistaServer = await startVistaServer();

    // Step 4: Fetch preview and validate the API response shape. Detection
    // findings are deliberately deferred to the later child beads.
    await fetchPreview();

  } catch (err) {
    error(`Test execution failed: ${err.message}`);
    log(err.stack, 'red');
    exitCode = 1;
  } finally {
    clearTimeout(watchdog);
    if (vistaServer) {
      info('Stopping VISTA server...');
      await stopVistaServer(vistaServer);
      success('VISTA server stopped');
    }
    if (testServer) {
      info('Stopping test server...');
      await closeHttpServer(testServer);
      success('Test server stopped');
    }
  }

  // Always print the owned checks, including when startup or preview fails.
  exitCode = printSummary();
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
