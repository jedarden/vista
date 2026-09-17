'use strict';

/**
 * HTTP contract tests for every VISTA API endpoint (docs/api.md).
 *
 * Boots the real express app from src/server.js on an ephemeral loopback
 * port and exercises each route over actual HTTP, asserting the documented
 * contract: parameters, status codes, error bodies, content types,
 * Cache-Control headers, and rate-limit behaviour.
 *
 * No network egress: the fetch layer (src/fetcher.js) is mocked by swapping
 * require.cache BEFORE server.js is loaded, so `fetchUrl`, `probeImage` and
 * `fetchRenderedMetaTags` are replaced with deterministic fixtures. parseMetaTags,
 * scoring, diagnostics, header analysis, screenshot SVG/PNG rendering and ZIP
 * assembly all run for real. SSRF rejections are exercised through the real
 * ssrf-guard (literal loopback/metadata IPs never need DNS).
 *
 * Rate-limit budget note (buckets are per-IP, per-hour, in-process):
 *   preview   ≤ 22 of 30 tokens used (validation + mocked-success paths)
 *   sitemap    6 of 5  — deliberately exceeds the bucket to prove the 429 shape
 *   screenshot 30 of 30 — deliberately exhausted to prove the 30/hr limit,
 *                        the per-platform billing of /api/screenshots, and 429
 * These tests therefore must stay in this order and must not be parallelised
 * with other requests from the same process-hour.
 */

const path = require('path');

// ---------------------------------------------------------------------------
// Mock the fetch layer before server.js pulls it in.
// ---------------------------------------------------------------------------

const FETCHER_PATH = require.resolve('../../src/fetcher');
const realFetcher = require(FETCHER_PATH);

const FIXTURE_HTML = `<!DOCTYPE html>
<html><head>
<title>Example Page Title</title>
<meta name="description" content="Example description for contract tests.">
<meta property="og:title" content="OG Title">
<meta property="og:description" content="OG description for contract tests.">
<meta property="og:image" content="https://cdn.example.test/og.png">
<meta property="og:url" content="https://example.test/page">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Example Site">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Twitter Title">
<meta name="twitter:image" content="https://cdn.example.test/twitter.png">
<link rel="icon" href="/favicon.ico">
<meta name="theme-color" content="#ff0000">
</head><body><h1>Hello</h1></body></html>`;

const FIXTURE_RESPONSE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=3600',
  'content-encoding': 'gzip',
  etag: '"abc123"',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-frame-options': 'SAMEORIGIN',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  server: 'nginx',
};

const OK_URL = 'https://example.test/page';
const FAIL_URL = 'https://fail.example.test/page';
const SSRF_URL = 'https://ssrf.example.test/page';

const fetchCalls = [];

/** Route table for the mocked fetchUrl. Unknown URLs reject like a network error. */
function mockFetchUrl(url) {
  fetchCalls.push(url);
  if (url === OK_URL) {
    return Promise.resolve({
      html: FIXTURE_HTML,
      finalUrl: OK_URL,
      redirectChain: [],
      responseHeaders: FIXTURE_RESPONSE_HEADERS,
      statusCode: 200,
    });
  }
  if (url === FAIL_URL) {
    return Promise.reject(new Error('mock: connection refused'));
  }
  if (url === SSRF_URL) {
    return Promise.reject(new Error('URL blocked by SSRF protection: private/internal address'));
  }
  return Promise.reject(new Error(`mock fetch: no fixture for ${url}`));
}

/** Same shape the real probeImage returns on success (no network). */
async function mockProbeImage(imageUrl) {
  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    contentType: 'image/png',
    contentLength: 48120,
    responseTime: 42,
    cors: null,
    statusCode: 200,
  };
}

/** The real endpoint treats this as best-effort; failing it must not fail the request. */
async function mockFetchRenderedMetaTags() {
  throw new Error('browser not available in contract tests');
}

require.cache[FETCHER_PATH].exports = {
  ...realFetcher,
  fetchUrl: mockFetchUrl,
  probeImage: mockProbeImage,
  fetchRenderedMetaTags: mockFetchRenderedMetaTags,
};

const { app } = require('../../src/server');

// The purge contract depends on these being absent; make the test independent
// of the ambient environment.
delete process.env.CLOUDFLARE_API_TOKEN;
delete process.env.FACEBOOK_APP_TOKEN;

// ---------------------------------------------------------------------------
// Harness (plain-node style, mirroring the other test/unit files).
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(desc, fn) {
  return Promise.resolve()
    .then(fn)
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

function assertEq(actual, expected, msg) {
  assert(
    actual === expected,
    `${msg || 'assertEq failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

/** Ephemeral port the app binds to inside main(); set before any request. */
let PORT;

/** Minimal request helper — returns { status, headers, body(Buffer), text, json }. */
async function req(pathAndQuery, opts) {
  const res = await fetch(`http://127.0.0.1:${PORT}${pathAndQuery}`, opts);
  const body = Buffer.from(await res.arrayBuffer());
  let json;
  return {
    status: res.status,
    headers: res.headers,
    body,
    text: body.toString('utf8'),
    get json() {
      if (json === undefined) json = JSON.parse(body.toString('utf8'));
      return json;
    },
  };
}

const JSON_TYPE = { 'Content-Type': 'application/json' };
const HTML_TYPE = { 'Content-Type': 'text/html' };

async function main() {
  // Bind the app to an ephemeral loopback port (wait for 'listening' so
  // server.address() is populated).
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1');
    s.once('listening', () => resolve(s));
    s.once('error', reject);
  });
  PORT = server.address().port;

  // Health
  console.log('=== Health ===');
  await test('GET /health returns {ok:true}', async () => {
    const res = await req('/health');
    assertEq(res.status, 200, 'status');
    assertEq(res.json.ok, true, 'body.ok');
    assert(/application\/json/.test(res.headers.get('content-type')), 'JSON content type');
  });

  await test('GET /api/health returns {status:ok, version}', async () => {
    const res = await req('/api/health');
    assertEq(res.status, 200, 'status');
    assertEq(res.json.status, 'ok', 'status field');
    assert(typeof res.json.version === 'string' && res.json.version.length > 0, 'version string');
  });

  // CORS
  console.log('=== CORS ===');
  await test('responses carry Access-Control-Allow-Origin: * and OPTIONS preflight returns 200', async () => {
    const res = await req('/api/platforms');
    assertEq(res.headers.get('access-control-allow-origin'), '*', 'ACAO header');
    const pre = await req('/api/preview', { method: 'OPTIONS' });
    assertEq(pre.status, 200, 'preflight status');
    assertEq(pre.headers.get('access-control-allow-origin'), '*', 'preflight ACAO');
  });

  // Static
  console.log('=== Static UI ===');
  await test('GET / serves the UI as text/html', async () => {
    const res = await req('/');
    assertEq(res.status, 200, 'status');
    assert(/text\/html/.test(res.headers.get('content-type')), 'html content type');
    assert(res.text.includes('<html'), 'looks like HTML');
  });

  // Platforms
  console.log('=== /api/platforms ===');
  await test('GET /api/platforms lists platforms with skeleton data', async () => {
    const res = await req('/api/platforms');
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assert(Array.isArray(body.platforms) && body.platforms.length >= 40, 'platforms array');
    for (const p of body.platforms) {
      assert(p.id && p.name, `platform entry has id+name: ${JSON.stringify(p)}`);
    }
    const ids = body.platforms.map((p) => p.id);
    for (const known of ['google', 'facebook', 'twitter', 'linkedin', 'slack']) {
      assert(ids.includes(known), `platform list includes ${known}`);
    }
    assert(body.skeletonTypes && typeof body.skeletonTypes === 'object' && Object.keys(body.skeletonTypes).length > 0, 'skeletonTypes map');
    assert(body.platformSkeletonMap && typeof body.platformSkeletonMap === 'object' && Object.keys(body.platformSkeletonMap).length > 0, 'platformSkeletonMap');
  });

  // Preview — GET
  console.log('=== /api/preview ===');
  await test('GET /api/preview without ?url= returns 400', async () => {
    const res = await req('/api/preview');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing ?url= parameter', 'error message');
  });

  await test('GET /api/preview with an unparseable ?url= returns 400', async () => {
    const res = await req('/api/preview?url=not-a-url');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid URL', 'error message');
  });

  await test('GET /api/preview with a non-http(s) scheme returns 400', async () => {
    const res = await req(`/api/preview?url=${encodeURIComponent('ftp://example.test/file')}`);
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Only http and https URLs are supported', 'error message');
  });

  await test('GET /api/preview success returns the full preview contract', async () => {
    const res = await req(`/api/preview?url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    assertEq(res.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=600', 'cache header');
    const body = res.json;
    assertEq(body.url, OK_URL, 'echoes url');
    assertEq(body.finalUrl, OK_URL, 'finalUrl');
    assertEq(body.statusCode, 200, 'upstream statusCode');
    assertEq(body.meta.og.title, 'OG Title', 'meta.og.title');
    assertEq(body.meta.twitter.card, 'summary_large_image', 'meta.twitter.card');
    assert(Array.isArray(body.rawTags) && body.rawTags.length > 0, 'rawTags');
    assert(body.imageProbe && body.imageProbe.width === 1200, 'imageProbe dimensions');
    assert(typeof body.html === 'string' && body.html.includes('og:title'), 'capped raw html');
    assert(Array.isArray(body.diagnostics), 'diagnostics array');
    assert(Array.isArray(body.autoFixes), 'autoFixes array');
    assert(Array.isArray(body.redirectChain), 'redirectChain');
    assert(body.headerAnalysis && typeof body.headerAnalysis === 'object', 'headerAnalysis');
    assertEq(typeof body.scoring.overall.score, 'number', 'scoring.overall.score type');
    assert(body.scoring.overall.score >= 0 && body.scoring.overall.score <= 100, 'score in 0..100');
    assert(body.scoring.scores && body.scoring.scores.twitter, 'per-platform scores keyed by id');
  });

  // Preview — POST
  await test('POST /api/preview with a text/html body analyses the inline HTML', async () => {
    const res = await req('/api/preview', { method: 'POST', headers: HTML_TYPE, body: FIXTURE_HTML });
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.finalUrl, 'https://example.com', 'default base');
    assertEq(body.meta.og.title, 'OG Title', 'parsed og:title');
  });

  await test('POST /api/preview with JSON {html} and ?base= overrides the base URL', async () => {
    const res = await req(
      `/api/preview?base=${encodeURIComponent('https://base.example.test/')}`,
      { method: 'POST', headers: JSON_TYPE, body: JSON.stringify({ html: FIXTURE_HTML }) }
    );
    assertEq(res.status, 200, 'status');
    assertEq(res.json.finalUrl, 'https://base.example.test/', 'base override');
  });

  await test('POST /api/preview with an unusable body returns 400', async () => {
    const res = await req('/api/preview', { method: 'POST', headers: JSON_TYPE, body: '{"nope":1}' });
    assertEq(res.status, 400, 'status');
    assert(/POST body must be HTML text or JSON/.test(res.json.error), 'error message');
  });

  // preview/meta
  console.log('=== /api/preview/meta ===');
  await test('GET /api/preview/meta without ?url= returns 400', async () => {
    const res = await req('/api/preview/meta');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing ?url= parameter', 'error message');
  });

  await test('GET /api/preview/meta success returns text data without image probing', async () => {
    const res = await req(`/api/preview/meta?url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.meta.title, 'Example Page Title', 'meta.title');
    assertEq(body.meta.og.image, 'https://cdn.example.test/og.png', 'meta.og.image');
    assertEq(body.meta.twitter.site, null, 'absent twitter fields are null');
    assert(body.scoring && body.scoring.scores && body.scoring.overall, 'scoring block');
    assert(body.previews && body.previews.google && body.previews.twitter, 'text previews');
    assertEq(body.previews.google.type, 'google-serp', 'google preview type');
    assert(Array.isArray(body.meta.rawTags), 'rawTags for client-side diff');
    assert(typeof body.html === 'string', 'capped html for client-side verification');
    assertEq(res.headers.get('cache-control'), null, 'no Cache-Control on this endpoint');
  });

  await test('POST /api/preview/meta with an unusable body returns 400', async () => {
    const res = await req('/api/preview/meta', { method: 'POST', headers: JSON_TYPE, body: '{}' });
    assertEq(res.status, 400, 'status');
    assert(/POST body must be HTML text or JSON/.test(res.json.error), 'error message');
  });

  // preview/headers
  console.log('=== /api/preview/headers ===');
  await test('GET /api/preview/headers without ?url= returns 400', async () => {
    const res = await req('/api/preview/headers');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing ?url= parameter', 'error message');
  });

  await test('GET /api/preview/headers success returns header diagnostics', async () => {
    const res = await req(`/api/preview/headers?url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    const body = res.json;
    for (const key of ['headers', 'security', 'cors', 'server', 'performance', 'analysis', 'headerAnalysis', 'responseHeaders', 'diagnostics', 'autoFixes', 'redirectChain']) {
      assert(body[key] !== undefined, `response includes ${key}`);
    }
    assert(typeof body.security.score === 'number', 'security.score');
    assert(['A', 'B', 'C', 'D', 'F'].includes(body.security.grade), 'security.grade');
    assert(Array.isArray(body.headers.security) && body.headers.security.length > 0, 'categorized security headers');
    assertEq(body.responseHeaders['strict-transport-security'], FIXTURE_RESPONSE_HEADERS['strict-transport-security'], 'raw headers echoed');
    assert(Array.isArray(body.diagnostics), 'diagnostics computed with imageProbe=null');
  });

  await test('POST /api/preview/headers analyses inline HTML with empty upstream headers', async () => {
    const res = await req('/api/preview/headers', { method: 'POST', headers: HTML_TYPE, body: FIXTURE_HTML });
    assertEq(res.status, 200, 'status');
    assertEq(res.json.statusCode, 200, 'synthetic statusCode');
    assertEq(res.json.responseHeaders['server'], undefined, 'no upstream headers');
    assert(res.json.security.score < 100, 'missing headers reduce the security score');
  });

  // preview/images
  console.log('=== /api/preview/images ===');
  await test('GET /api/preview/images without ?url= returns 400', async () => {
    const res = await req('/api/preview/images');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing ?url= parameter', 'error message');
  });

  await test('GET /api/preview/images success returns probe data, crop ratios and recommendations', async () => {
    const res = await req(`/api/preview/images?url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assert(body.imageProbe && body.imageProbe.width === 1200 && body.imageProbe.height === 630, 'top-level imageProbe (cropRatios stripped)');
    assert(body.images.og && body.images.og.cropRatios, 'images.og carries cropRatios');
    assert(body.images.twitter, 'images.twitter probed');
    assert(Array.isArray(body.images.all) && body.images.all.length >= 2, 'all probed images listed');
    assert(Array.isArray(body.images.hero), 'hero images array');
    assert(Array.isArray(body.recommendations) && body.recommendations.length >= 1, 'twitter summary-card recommendation for a 16:9 image');
    assert(Array.isArray(body.diagnostics) && Array.isArray(body.autoFixes), 'full diagnostics block');
  });

  // compare
  console.log('=== /api/compare ===');
  await test('GET /api/compare without both URLs returns 400', async () => {
    const res = await req(`/api/compare?a=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 400, 'status');
    assert(/Missing \?a= or \?b=/.test(res.json.error), 'error message');
  });

  await test('GET /api/compare with an invalid URL returns 400 naming the bad parameter', async () => {
    const res = await req(`/api/compare?a=${encodeURIComponent(OK_URL)}&b=garbage`);
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid URL in ?b=', 'error message');
  });

  await test('GET /api/compare success returns side-by-side previews with cache headers', async () => {
    const res = await req(
      `/api/compare?a=${encodeURIComponent(OK_URL)}&b=${encodeURIComponent(OK_URL)}`
    );
    assertEq(res.status, 200, 'status');
    assertEq(res.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=600', 'cache header');
    const body = res.json;
    assert(body.a && body.a.meta && body.a.scoring, 'side a is a full preview');
    assert(body.b && body.b.meta && body.b.scoring, 'side b is a full preview');
  });

  await test('GET /api/compare keeps 200 and reports a per-side error when only one side fails', async () => {
    const res = await req(
      `/api/compare?a=${encodeURIComponent(FAIL_URL)}&b=${encodeURIComponent(OK_URL)}`
    );
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assert(body.a.error && body.a.url === FAIL_URL, 'failed side carries error + url');
    assert(body.b.meta && body.b.scoring, 'healthy side is a full preview');
  });

  await test('GET /api/compare returns 502 when both sides fail', async () => {
    const res = await req(
      `/api/compare?a=${encodeURIComponent(FAIL_URL)}&b=${encodeURIComponent(SSRF_URL)}`
    );
    assertEq(res.status, 502, 'status');
    assertEq(res.json.error, 'Failed to fetch both URLs', 'error message');
    assert(res.json.urlA && res.json.urlB, 'per-side errors included');
  });

  // sitemap
  console.log('=== /api/sitemap ===');
  await test('GET /api/sitemap without ?url= returns 400', async () => {
    const res = await req('/api/sitemap');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing ?url= parameter', 'error message');
  });

  await test('GET /api/sitemap with an unparseable URL returns 400', async () => {
    const res = await req('/api/sitemap?url=not-a-url');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid URL', 'error message');
  });

  await test('GET /api/sitemap with a non-http(s) scheme returns 400', async () => {
    const res = await req(`/api/sitemap?url=${encodeURIComponent('file:///etc/sitemap.xml')}`);
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Only http and https URLs are supported', 'error message');
  });

  await test('GET /api/sitemap with a loopback URL returns 400 SSRF error without fetching', async () => {
    const res = await req(`/api/sitemap?url=${encodeURIComponent('http://127.0.0.1:9/sitemap.xml')}`);
    assertEq(res.status, 400, 'status');
    assert(/URL blocked by SSRF protection/.test(res.json.error), `SSRF error, got: ${res.json.error}`);
  });

  await test('GET /api/sitemap returns 429 once the 5/hr sitemap bucket is empty (shared rateLimited shape)', async () => {
    // Bucket state: 4 tokens consumed above, limit 5. This 5th request takes
    // the last token — it must fail validation (400) WITHOUT any network I/O,
    // since .test domains do not resolve and the real fetch would hang. The
    // 6th request is then rejected from the empty bucket.
    const last = await req('/api/sitemap?url=not-a-url');
    assertEq(last.status, 400, 'final allowed request still processed');
    const res = await req('/api/sitemap?url=not-a-url');
    assertEq(res.status, 429, 'status');
    assertEq(res.json.error, 'Rate limit exceeded', 'error');
    assertEq(res.json.retryAfter, 3600, 'retryAfter is 3600s');
    assert(typeof res.json.message === 'string', 'message present');
  });

  // screenshots
  console.log('=== /api/screenshot (GET) ===');
  await test('GET /api/screenshot rejects an unknown platform with 400', async () => {
    const res = await req(`/api/screenshot?platform=bogus&url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid platform', 'error');
    assert(/Platform must be one of:/.test(res.json.message), 'message lists valid platforms');
  });

  await test('GET /api/screenshot validates theme, scale and format', async () => {
    const base = `platform=twitter&url=${encodeURIComponent(OK_URL)}`;
    for (const [qs, err, re] of [
      [`theme=sepia`, 'Invalid theme', /"light" or "dark"/],
      [`scale=3x`, 'Invalid scale', /"1x" or "2x"/],
      [`format=jpg`, 'Invalid format', /"svg" or "png"/],
    ]) {
      const res = await req(`/api/screenshot?${base}&${qs}`);
      assertEq(res.status, 400, `status for ${qs}`);
      assertEq(res.json.error, err, `error for ${qs}`);
      assert(re.test(res.json.message), `message for ${qs}`);
    }
  });

  await test('GET /api/screenshot requires ?url= and a parseable http(s) URL', async () => {
    const missing = await req('/api/screenshot?platform=twitter');
    assertEq(missing.status, 400, 'missing url status');
    assertEq(missing.json.error, 'Missing ?url= parameter', 'missing url error');

    const invalid = await req('/api/screenshot?platform=twitter&url=nope');
    assertEq(invalid.status, 400, 'invalid url status');
    assertEq(invalid.json.error, 'Invalid URL', 'invalid url error');
  });

  await test('GET /api/screenshot format=svg returns image/svg+xml with rate-limit and cache headers', async () => {
    const res = await req(
      `/api/screenshot?platform=twitter&format=svg&url=${encodeURIComponent(OK_URL)}`
    );
    assertEq(res.status, 200, 'status');
    assert(/image\/svg\+xml/.test(res.headers.get('content-type')), 'svg content type');
    assertEq(res.headers.get('content-disposition'), 'attachment; filename="twitter-card.svg"', 'disposition');
    assert(/max-age=300/.test(res.headers.get('cache-control')), 'cache header');
    assert(/\d+/.test(res.headers.get('x-ratelimit-remaining') || ''), 'X-RateLimit-Remaining header');
    assert(res.text.includes('<svg'), 'SVG payload');
  });

  await test('GET /api/screenshot defaults to PNG (image/png, PNG magic bytes)', async () => {
    const res = await req(`/api/screenshot?platform=twitter&url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    assertEq(res.headers.get('content-type'), 'image/png', 'png content type');
    assertEq(res.headers.get('content-disposition'), 'attachment; filename="twitter-card.png"', 'disposition');
    const magic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert(res.body.subarray(0, 8).equals(magic), 'body starts with the PNG signature');
  });

  console.log('=== /api/screenshot (POST) ===');
  await test('POST /api/screenshot requires a valid platform', async () => {
    const res = await req('/api/screenshot', { method: 'POST', headers: JSON_TYPE, body: '{}' });
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid platform', 'error');
  });

  await test('POST /api/screenshot requires meta or url', async () => {
    const res = await req('/api/screenshot', {
      method: 'POST',
      headers: JSON_TYPE,
      body: JSON.stringify({ platform: 'twitter' }),
    });
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing metadata. Provide either meta object or url.', 'error');
  });

  await test('POST /api/screenshot renders from an inline meta object (no fetch)', async () => {
    const callsBefore = fetchCalls.length;
    const res = await req('/api/screenshot', {
      method: 'POST',
      headers: JSON_TYPE,
      body: JSON.stringify({
        platform: 'twitter',
        meta: {
          title: 'Inline Title',
          description: 'Inline description',
          og: { title: 'Inline OG', description: 'Inline OG desc', image: 'https://cdn.example.test/og.png', type: 'website' },
          twitter: { card: 'summary_large_image', title: 'Inline TW', description: 'Inline TW desc', image: 'https://cdn.example.test/og.png' },
        },
        imageProbe: { url: 'https://cdn.example.test/og.png', width: 1200, height: 630 },
        format: 'svg',
      }),
    });
    assertEq(res.status, 200, 'status');
    assertEq(fetchCalls.length, callsBefore, 'no downstream fetch performed');
    assert(res.text.includes('<svg'), 'SVG payload');
  });

  console.log('=== /api/screenshots (ZIP) ===');
  await test('GET /api/screenshots validates the platform list before consuming rate limit', async () => {
    const missing = await req(`/api/screenshots?url=${encodeURIComponent(OK_URL)}`);
    assertEq(missing.status, 400, 'missing platforms status');
    assert(/platforms=twitter,facebook,linkedin/.test(missing.json.message), 'usage hint');

    const invalid = await req(`/api/screenshots?platforms=twitter,nope&url=${encodeURIComponent(OK_URL)}`);
    assertEq(invalid.status, 400, 'invalid platform status');
    assert(/Invalid platform\(s\): nope/.test(invalid.json.message), 'names the invalid platform');

    const tooMany = await req(`/api/screenshots?platforms=${'twitter,'.repeat(20)}twitter&url=${encodeURIComponent(OK_URL)}`);
    assertEq(tooMany.status, 400, 'too many platforms status');
    assertEq(tooMany.json.error, 'Too many platforms', 'error');
    assert(/Maximum 20/.test(tooMany.json.message), 'message states the cap');
  });

  await test('GET /api/screenshots streams a ZIP attachment for the requested platforms', async () => {
    const res = await req(
      `/api/screenshots?platforms=twitter,facebook&format=svg&url=${encodeURIComponent(OK_URL)}`
    );
    assertEq(res.status, 200, 'status');
    assertEq(res.headers.get('content-type'), 'application/zip', 'zip content type');
    assert(/^attachment/.test(res.headers.get('content-disposition') || ''), 'attachment disposition');
    assertEq(res.body.subarray(0, 2).toString('latin1'), 'PK', 'body starts with the ZIP signature');
  });

  await test('GET /api/screenshots consumes one token per platform and rejects batches that exceed the bucket', async () => {
    // 20 platforms against a partially-spent bucket: the batch check stops
    // mid-way with a distinctive "You can generate N screenshots" message.
    const res = await req(
      `/api/screenshots?platforms=${'twitter,'.repeat(19)}twitter&url=${encodeURIComponent(OK_URL)}`
    );
    assertEq(res.status, 429, 'status');
    assertEq(res.json.error, 'Rate limit exceeded', 'error');
    assert(/You can generate \d+ screenshots in this batch/.test(res.json.message), `batch message, got: ${res.json.message}`);
    assertEq(res.json.retryAfter, 3600, 'retryAfter');
  });

  await test('GET /api/screenshot returns the 429 shape once the screenshot bucket is empty', async () => {
    // The bucket is now exhausted (30/hr), including the per-platform tokens
    // consumed by the ZIP requests above.
    const res = await req(`/api/screenshot?platform=twitter&url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 429, 'status');
    assertEq(res.json.error, 'Rate limit exceeded', 'error');
    assertEq(res.json.message, 'Too many screenshot requests. Please try again later.', 'message');
    assertEq(res.json.retryAfter, 3600, 'retryAfter');
  });

  // badge
  console.log('=== /api/badge + /api/badge.svg ===');
  await test('GET /api/badge legacy mode renders the SVG with badge cache headers', async () => {
    const res = await req('/api/badge?score=85&platforms=25');
    assertEq(res.status, 200, 'status');
    assertEq(res.headers.get('content-type'), 'image/svg+xml; charset=utf-8', 'content type');
    assertEq(res.headers.get('cache-control'), 'public, max-age=3600, stale-while-revalidate=7200', 'cache header');
    assert(res.text.startsWith('<svg'), 'SVG payload');
    assert(res.text.includes('platform score'), 'label text');
    assert(res.text.includes('85/100'), 'score text');
  });

  await test('GET /api/badge grade label mode shows the letter grade', async () => {
    const res = await req('/api/badge.svg?score=95&platforms=25&label=grade');
    assertEq(res.status, 200, 'status');
    assert(res.text.includes('>A<'), `grade letter, got: ${res.text}`);
  });

  await test('GET /api/badge validates style and label parameters', async () => {
    const badStyle = await req('/api/badge?score=85&platforms=25&style=sparkly');
    assertEq(badStyle.status, 400, 'style status');
    assert(/Invalid style/.test(badStyle.json.error), 'style error');

    const badLabel = await req('/api/badge?score=85&platforms=25&label=count');
    assertEq(badLabel.status, 400, 'label status');
    assert(/Invalid label/.test(badLabel.json.error), 'label error');

    const missing = await req('/api/badge');
    assertEq(missing.status, 400, 'missing params status');
    assert(/Provide \?url= OR both \?score= and \?platforms=/.test(missing.json.error), 'missing params error');
  });

  await test('GET /api/badge.svg url mode fetches, scores and returns the SVG', async () => {
    const res = await req(`/api/badge.svg?url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    assertEq(res.headers.get('content-type'), 'image/svg+xml; charset=utf-8', 'content type');
    assert(res.text.startsWith('<svg'), 'SVG payload');
    assert(res.text.includes('/100'), 'score text');
    assert(fetchCalls.includes(OK_URL), 'downstream fetch happened for the url');
  });

  await test('GET /api/badge url mode maps fetch failures to 502 and SSRF rejections to 400', async () => {
    const failed = await req(`/api/badge.svg?url=${encodeURIComponent(FAIL_URL)}`);
    assertEq(failed.status, 502, 'fetch failure status');
    assert(/Failed to fetch URL/.test(failed.json.error), 'fetch failure error');

    const ssrf = await req(`/api/badge.svg?url=${encodeURIComponent(SSRF_URL)}`);
    assertEq(ssrf.status, 400, 'ssrf status');
    assert(/SSRF protection/.test(ssrf.json.error), 'ssrf error');
  });

  // badge/preview
  console.log('=== /api/badge/preview ===');
  await test('GET /api/badge/preview returns score, grade and embed code', async () => {
    const res = await req(`/api/badge/preview?url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.url, OK_URL, 'echoes url');
    assert(typeof body.score === 'number' && body.score >= 0 && body.score <= 100, 'score 0..100');
    assert(typeof body.platforms === 'number', 'platform count');
    assert(/^[A-F][+-]?$/.test(body.grade), `grade letter, got: ${body.grade}`);
    assert(body.embedCode.includes('/api/badge.svg?url='), 'embed code uses the .svg path');
    assert(body.embedCode.includes('<img'), 'embed code is an img tag');
  });

  await test('GET /api/badge/preview requires ?url=', async () => {
    const res = await req('/api/badge/preview');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing ?url= parameter', 'error message');
  });

  // snippet
  console.log('=== /api/snippet ===');
  await test('GET /api/snippet requires ?format=', async () => {
    const res = await req('/api/snippet');
    assertEq(res.status, 400, 'status');
    assert(/Provide \?format= with one of:/.test(res.json.message), 'message lists formats');
  });

  await test('GET /api/snippet rejects unsupported formats', async () => {
    const res = await req('/api/snippet?format=angular');
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid format', 'error');
  });

  await test('GET /api/snippet without a url returns the empty template', async () => {
    const res = await req('/api/snippet?format=nextjs');
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.format, 'nextjs', 'format echoed');
    assertEq(body.url, null, 'url null');
    assert(typeof body.snippet === 'string' && body.snippet.length > 0, 'snippet text');
    assert(typeof body.meta === 'object', 'meta block');
  });

  await test('GET /api/snippet?url= generates from the fetched page', async () => {
    const res = await req(`/api/snippet?format=html&url=${encodeURIComponent(OK_URL)}`);
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.url, OK_URL, 'url echoed');
    assertEq(body.meta.og.title, 'OG Title', 'meta from fixture');
    assert(body.snippet.includes('og:title'), 'snippet contains og tags');
  });

  // templates
  console.log('=== /api/templates ===');
  await test('GET /api/templates lists summaries for every template', async () => {
    const res = await req('/api/templates');
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.count, body.templates.length, 'count matches list length');
    assert(body.templates.length >= 10, 'all template files listed');
    for (const t of body.templates) {
      assert(t.id && t.title, `template summary has id+title: ${JSON.stringify(t)}`);
      assert(Array.isArray(t.tags), 'tags array');
    }
  });

  await test('GET /api/templates/:name resolves by FILENAME and returns the full template', async () => {
    // Note the deliberate quirk: :name is the template FILE name (as listed in
    // availableTemplates), while the summary `id` comes from the file's
    // content and can differ — blog-post.json carries id "blog".
    const res = await req('/api/templates/blog-post');
    assertEq(res.status, 200, 'status');
    assertEq(res.json.id, 'blog', 'content id inside blog-post.json');
    assert(typeof res.json.title === 'string' && res.json.title.length > 0, 'template title');
  });

  await test('GET /api/templates/:name returns 404 with the available list for unknown names', async () => {
    const res = await req('/api/templates/does-not-exist');
    assertEq(res.status, 404, 'status');
    assertEq(res.json.error, 'Template not found', 'error');
    assert(Array.isArray(res.json.availableTemplates) && res.json.availableTemplates.includes('blog-post'), 'available templates listed');
  });

  await test('GET /api/templates/:name rejects path traversal', async () => {
    const res = await req(`/api/templates/${encodeURIComponent('../server')}`);
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Invalid template name', 'error message');
  });

  // purge
  console.log('=== /api/purge ===');
  await test('POST /api/purge requires a url in the body', async () => {
    const res = await req('/api/purge', { method: 'POST', headers: JSON_TYPE, body: '{}' });
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Missing url in request body', 'error message');
  });

  await test('POST /api/purge rejects non-http(s) URLs', async () => {
    const res = await req('/api/purge', {
      method: 'POST',
      headers: JSON_TYPE,
      body: JSON.stringify({ url: 'gopher://example.test/x' }),
    });
    assertEq(res.status, 400, 'status');
    assertEq(res.json.error, 'Only http and https URLs are supported', 'error message');
  });

  await test('POST /api/purge without credentials reports skips, not failures', async () => {
    const res = await req('/api/purge', {
      method: 'POST',
      headers: JSON_TYPE,
      body: JSON.stringify({ url: OK_URL }),
    });
    assertEq(res.status, 200, 'status');
    const body = res.json;
    assertEq(body.url, OK_URL, 'echoes url');
    assert(Array.isArray(body.purged) && body.purged.length === 0, 'nothing purged without credentials');
    assert(Array.isArray(body.failed) && body.failed.length === 0, 'nothing failed');
    assert(body.skipped.some((s) => /cloudflare-edge-cache/.test(s)), 'cloudflare skip reported');
    assert(body.skipped.some((s) => /facebook-cache/.test(s)), 'default facebook purge skipped without a token');
  });

  // Shut down so the process can exit.
  server.close();
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();

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
