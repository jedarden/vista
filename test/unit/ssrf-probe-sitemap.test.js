'use strict';

/**
 * Unit + behavioral tests for the SSRF guard on the two outbound-fetch code
 * paths that were previously unguarded:
 *
 *   (a) probeImage() in src/fetcher.js  — fetches the page's og:image /
 *       twitter:image URL (attacker-controlled content).
 *   (b) GET /api/sitemap in src/server.js — fetches ?url= and nested sitemaps.
 *
 * These verify behavior end-to-end (not just source inspection): a local
 * loopback listener proves no egress occurs when the URL is private, and a
 * booted server proves /api/sitemap returns 400 instead of fetching.
 */

const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const FETCHER_SRC = fs.readFileSync(path.join(REPO_ROOT, 'src', 'fetcher.js'), 'utf8');
const SERVER_SRC = fs.readFileSync(path.join(REPO_ROOT, 'src', 'server.js'), 'utf8');

let passed = 0;
let failed = 0;

function test(desc, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`✓ ${desc}`);
      passed++;
    })
    .catch((err) => {
      console.log(`✗ ${desc}`);
      console.log(`  Error: ${err && err.message ? err.message : err}`);
      failed++;
    });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Grab a free ephemeral port on 127.0.0.1 (binds to :0, then closes). */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
}

/** Start a counting HTTP listener on 127.0.0.1; returns { server, port, hits }. */
function startCanary() {
  const hits = { count: 0 };
  const server = http.createServer((req, res) => {
    hits.count++;
    res.writeHead(200, { 'content-type': 'image/png' });
    res.end();
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, hits }));
  });
}

/** Minimal GET via built-in http; returns { statusCode, body }. */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('request timeout')));
  });
}

async function waitForHealth(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const { statusCode } = await httpGet(`http://127.0.0.1:${port}/health`);
      if (statusCode === 200) return;
    } catch (_) {
      // not ready yet
    }
    await sleep(150);
  }
  throw new Error(`server on port ${port} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  const { probeImage } = require(path.join(REPO_ROOT, 'src', 'fetcher'));

  // ---------------------------------------------------------------
  // Source-level guards (mirror the style of the existing integration
  // test, so a regression that removes the call is caught even before
  // the behavioral checks run).
  // ---------------------------------------------------------------
  console.log('=== Source-level guard checks ===');
  await test('probeImage() calls validateUrlOrThrow before any fetch', () => {
    const fnBody = FETCHER_SRC.match(/async function probeImage\(imageUrl\) \{([\s\S]*?)^}/m);
    assert(fnBody, 'could not locate probeImage() body');
    const body = fnBody[1];
    const validateIdx = body.indexOf('validateUrlOrThrow');
    const headFetchIdx = body.indexOf("fetch(imageUrl");
    const probeIdx = body.indexOf('probe(imageUrl');
    assert(validateIdx !== -1, 'probeImage() does not call validateUrlOrThrow');
    assert(headFetchIdx !== -1, 'could not locate HEAD fetch in probeImage()');
    assert(probeIdx !== -1, 'could not locate probe-image-size call in probeImage()');
    assert(
      validateIdx < headFetchIdx && validateIdx < probeIdx,
      'validateUrlOrThrow must run before both the HEAD fetch and the probe call'
    );
    assert(/blocked:\s*true/.test(body), 'probeImage() should signal blocked:true on SSRF rejection');
  });

  await test('/api/sitemap validates sitemapUrl and nested sitemaps', () => {
    const handlerStart = SERVER_SRC.indexOf("app.get('/api/sitemap',");
    assert(handlerStart !== -1, 'could not locate /api/sitemap handler');
    const handler = SERVER_SRC.slice(handlerStart, SERVER_SRC.indexOf('app.', handlerStart + 1));
    assert(handler.includes('validateUrlOrThrow'), 'sitemap handler does not call validateUrlOrThrow');
    // Initial URL: must reject with 400.
    const initIdx = handler.indexOf('validateUrlOrThrow(sitemapUrl)');
    assert(initIdx !== -1, 'sitemap handler does not validate the initial sitemapUrl');
    const init400 = handler.slice(0, initIdx).lastIndexOf('status(400)');
    assert(init400 !== -1 && init400 < initIdx, 'initial sitemap validation must be able to return 400');
    // Nested loop: must validate each nestedSitemapUrl and continue on rejection.
    assert(
      handler.includes('validateUrlOrThrow(nestedSitemapUrl)'),
      'nested sitemap loop does not validate each nestedSitemapUrl'
    );
    const nestedIdx = handler.indexOf('validateUrlOrThrow(nestedSitemapUrl)');
    assert(
      handler.slice(nestedIdx, nestedIdx + 400).includes('continue'),
      'nested sitemap validation must continue (skip) on rejection, not abort the request'
    );
  });

  // ---------------------------------------------------------------
  // (a) probeImage() — loopback / link-local URLs must not be fetched.
  // ---------------------------------------------------------------
  console.log('\n=== probeImage() behavioral checks ===');

  await test('probeImage(): loopback og:image URL issues NO request and returns gracefully', async () => {
    const canary = await startCanary();
    try {
      const url = `http://127.0.0.1:${canary.port}/sneaky.png`;
      const result = await probeImage(url);
      // Non-fatal: returns an object, never throws.
      assert(result && typeof result === 'object', 'probeImage should return a result object');
      assert(result.blocked === true, `expected blocked:true, got: ${JSON.stringify(result)}`);
      assert(result.url === url, 'blocked result should echo the url');
      assert(/SSRF/i.test(result.error || ''), 'error should mention SSRF');
      // The whole point: the listener must not have been contacted.
      assert(canary.hits.count === 0, `expected 0 egress requests, got ${canary.hits.count}`);
    } finally {
      canary.server.close();
    }
  });

  await test('probeImage(): link-local metadata IP (169.254.169.254) is blocked, no throw', async () => {
    const result = await probeImage('http://169.254.169.254/latest/meta-data/iam/');
    assert(result && typeof result === 'object', 'probeImage should return a result object');
    assert(result.blocked === true, `expected blocked:true, got: ${JSON.stringify(result)}`);
    assert(/169\.254\.169\.254/.test(result.error || '') || /SSRF/i.test(result.error || ''), 'error should reference the blocked address/SSRF');
  });

  await test('probeImage(): "localhost" hostname is blocked, no throw', async () => {
    const result = await probeImage('http://localhost:9999/img.png');
    assert(result && result.blocked === true, `expected blocked:true, got: ${JSON.stringify(result)}`);
  });

  await test('probeImage(): file:// URL is blocked, no throw', async () => {
    const result = await probeImage('file:///etc/passwd');
    assert(result && result.blocked === true, `expected blocked:true, got: ${JSON.stringify(result)}`);
  });

  // ---------------------------------------------------------------
  // (b) GET /api/sitemap — private ?url= must 400 and not fetch.
  // ---------------------------------------------------------------
  console.log('\n=== /api/sitemap behavioral checks ===');

  await test('GET /api/sitemap with loopback ?url= returns 400 and does NOT fetch it', async () => {
    const canary = await startCanary();
    const serverPort = await getFreePort();
    const child = spawn('node', ['src/server.js'], {
      cwd: REPO_ROOT,
      env: { ...process.env, PORT: String(serverPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderrBuf = '';
    child.stderr.on('data', (c) => (stderrBuf += c.toString()));
    try {
      await waitForHealth(serverPort);
      const target = `http://127.0.0.1:${canary.port}/api/health`;
      const { statusCode, body } = await httpGet(
        `http://127.0.0.1:${serverPort}/api/sitemap?url=${encodeURIComponent(target)}`
      );
      assert(statusCode === 400, `expected HTTP 400, got ${statusCode}: ${body}`);
      assert(/SSRF|private|internal|blocked|loopback/i.test(body), `expected SSRF error in body, got: ${body}`);
      // Give the server a beat to (not) egress, then prove the canary was untouched.
      await sleep(300);
      assert(canary.hits.count === 0, `expected 0 egress to canary, got ${canary.hits.count}`);
    } finally {
      child.kill('SIGTERM');
      canary.server.close();
      if (failed > 0 && stderrBuf) {
        console.log('  [server stderr]\n' + stderrBuf.split('\n').map((l) => '    ' + l).join('\n'));
      }
    }
  });

  await test('GET /api/sitemap with metadata IP ?url= returns 400', async () => {
    const serverPort = await getFreePort();
    const child = spawn('node', ['src/server.js'], {
      cwd: REPO_ROOT,
      env: { ...process.env, PORT: String(serverPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      await waitForHealth(serverPort);
      const { statusCode, body } = await httpGet(
        `http://127.0.0.1:${serverPort}/api/sitemap?url=${encodeURIComponent('http://169.254.169.254/latest/meta-data/')}`
      );
      assert(statusCode === 400, `expected HTTP 400, got ${statusCode}: ${body}`);
      assert(/SSRF|private|internal|blocked|169\.254/i.test(body), `expected SSRF error in body, got: ${body}`);
    } finally {
      child.kill('SIGTERM');
    }
  });

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
  console.log('\n✅ All tests passed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal test harness error:', err);
  process.exit(1);
});
