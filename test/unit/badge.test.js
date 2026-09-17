'use strict';

/**
 * Regression tests for every documented badge mode (README "Score Badge API"
 * and docs/api.md "Badge").
 *
 * Boots the real express app from src/server.js on an ephemeral loopback port
 * and exercises both badge paths (/api/badge and /api/badge.svg) over actual
 * HTTP, covering: dynamic ?url= and manual ?score=&platforms= inputs, all four
 * documented styles, score and grade label modes (including the full
 * documented grade/color table and the documented 0-100 clamping), missing or
 * invalid parameters, SVG escaping of hostile manual values, byte-identical
 * alias responses, the documented cache/rate-limit headers, single-flight
 * de-duplication of concurrent identical ?url= requests, and the documented
 * rate-limit split (429 in url mode only — legacy mode is unthrottled).
 *
 * No network egress: the fetch layer is mocked exactly as in
 * test/unit/http-api.test.js (require.cache swapped BEFORE server.js loads).
 *
 * This file deliberately lives apart from http-api.test.js: it runs in its own
 * process (test/run-unit.js), so its deliberate preview-bucket exhaustion at
 * the end cannot disturb the other suite's documented rate-limit budget.
 */

const FETCHER_PATH = require.resolve('../../src/fetcher');
const realFetcher = require(FETCHER_PATH);

const FIXTURE_HTML = `<!DOCTYPE html>
<html><head>
<title>Badge Fixture Page</title>
<meta name="description" content="Fixture for badge mode tests.">
<meta property="og:title" content="Badge Fixture OG">
<meta property="og:description" content="Badge fixture description.">
<meta property="og:image" content="https://cdn.example.test/og.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
</head><body><h1>Hello</h1></body></html>`;

const FIXTURE_RESPONSE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
};

const OK_URL = 'https://badge.example.test/page';
const FAIL_URL = 'https://fail.example.test/page';
const SSRF_URL = 'https://ssrf.example.test/page';
// Resolves after a timer so concurrent requests land while the fetch is
// still in flight — that is what makes the single-flight assertion
// deterministic.
const SLOW_URL = 'https://slow.example.test/page';

const fetchCalls = [];

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
  if (url === SLOW_URL) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        html: FIXTURE_HTML,
        finalUrl: SLOW_URL,
        redirectChain: [],
        responseHeaders: FIXTURE_RESPONSE_HEADERS,
        statusCode: 200,
      }), 75);
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

async function mockFetchRenderedMetaTags() {
  throw new Error('browser not available in badge tests');
}

require.cache[FETCHER_PATH].exports = {
  ...realFetcher,
  fetchUrl: mockFetchUrl,
  probeImage: mockProbeImage,
  fetchRenderedMetaTags: mockFetchRenderedMetaTags,
};

const { app } = require('../../src/server');

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

let PORT;

async function req(pathAndQuery) {
  const res = await fetch(`http://127.0.0.1:${PORT}${pathAndQuery}`);
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

const SVG_TYPE = 'image/svg+xml; charset=utf-8';
const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=7200';

/** Assert the full documented 200 contract shared by every badge mode. */
function assertBadgeContract(res, desc) {
  assertEq(res.status, 200, `${desc} status`);
  assertEq(res.headers.get('content-type'), SVG_TYPE, `${desc} content type`);
  assertEq(res.headers.get('cache-control'), CACHE_HEADER, `${desc} cache header`);
  assertEq(res.headers.get('x-ratelimit-remaining'), '999', `${desc} rate-limit header`);
  assert(res.text.startsWith('<svg'), `${desc} starts with the SVG root`);
  assert(res.text.endsWith('</svg>'), `${desc} closes the SVG root`);
  assert(res.text.includes('platform score'), `${desc} carries the fixed label`);
}

/**
 * Structural marker unique to each documented style — proves the style
 * parameter actually selects a renderer, not just that output differs.
 */
const STYLE_MARKERS = {
  flat: { include: ['<mask id="a">', 'rx="3"'], exclude: [] },
  'flat-square': { include: ['shape-rendering="crispEdges"'], exclude: ['<mask', '<defs', 'rx='] },
  plastic: { include: ['<defs>', 'stop-opacity=".4"'], exclude: ['<mask'] },
  'for-the-badge': { include: ['height="28"', 'font-weight="bold"'], exclude: [] },
};

function assertStyleMarker(svg, style, desc) {
  const m = STYLE_MARKERS[style];
  assert(m, `${desc}: unknown style ${style}`);
  for (const frag of m.include) {
    assert(svg.includes(frag), `${desc} (${style}) includes ${JSON.stringify(frag)}`);
  }
  for (const frag of m.exclude) {
    assert(!svg.includes(frag), `${desc} (${style}) omits ${JSON.stringify(frag)}`);
  }
}

async function main() {
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1');
    s.once('listening', () => resolve(s));
    s.once('error', reject);
  });
  PORT = server.address().port;

  // ── Both badge paths, defaults ──
  console.log('=== both paths, default mode ===');
  await test('GET /api/badge legacy mode renders the default flat score badge with documented headers', async () => {
    const res = await req('/api/badge?score=85&platforms=25');
    assertBadgeContract(res, 'legacy');
    assert(res.text.includes('85/100'), 'score text');
    assertStyleMarker(res.text, 'flat', 'legacy default');
  });

  await test('GET /api/badge.svg dynamic mode renders the default flat score badge with documented headers', async () => {
    const res = await req(`/api/badge.svg?url=${encodeURIComponent(OK_URL)}`);
    assertBadgeContract(res, 'dynamic default');
    assert(res.text.includes('/100'), 'numeric score text');
    assert(fetchCalls.includes(OK_URL), 'downstream fetch happened for the url');
    assertStyleMarker(res.text, 'flat', 'dynamic default');
  });

  // ── Dynamic URL mode × styles and labels ──
  console.log('=== dynamic url mode: styles and labels ===');
  await test('GET /api/badge.svg?url= renders every documented style', async () => {
    const svgs = [];
    for (const style of ['flat-square', 'plastic', 'for-the-badge']) {
      const res = await req(`/api/badge.svg?url=${encodeURIComponent(OK_URL)}&style=${style}`);
      assertBadgeContract(res, `url mode ${style}`);
      assert(res.text.includes('/100'), `${style} numeric score text`);
      assertStyleMarker(res.text, style, `url mode ${style}`);
      svgs.push(res.text);
    }
    assertEq(new Set(svgs).size, svgs.length, 'each url-mode style renders distinctly');
  });

  await test('GET /api/badge.svg?url= supports label=grade derived from the live score', async () => {
    const res = await req(`/api/badge.svg?url=${encodeURIComponent(OK_URL)}&label=grade`);
    assertBadgeContract(res, 'url mode grade');
    assert(/>([A-F][+-]?)</.test(res.text), `letter grade rendered, got: ${res.text}`);
    assert(!res.text.includes('/100'), 'grade label omits the numeric score');
  });

  // ── Manual mode × styles ──
  console.log('=== manual mode: styles ===');
  await test('GET /api/badge?score=&platforms= renders every documented style distinctly', async () => {
    const svgs = [];
    for (const style of ['flat', 'flat-square', 'plastic', 'for-the-badge']) {
      const res = await req(`/api/badge.svg?score=85&platforms=25&style=${style}`);
      assertBadgeContract(res, `manual ${style}`);
      assert(res.text.includes('85/100'), `${style} score text`);
      assertStyleMarker(res.text, style, `manual ${style}`);
      svgs.push(res.text);
    }
    assertEq(new Set(svgs).size, 4, 'each style has distinct SVG output');
  });

  // ── Score and grade labels: full documented grade/color table ──
  console.log('=== score and grade labels ===');
  await test('score label renders N/100 at both clamp edges', async () => {
    const zero = await req('/api/badge.svg?score=0&platforms=25');
    assertBadgeContract(zero, 'score 0');
    assert(zero.text.includes('0/100'), 'zero score text');

    const hundred = await req('/api/badge.svg?score=100&platforms=25');
    assertBadgeContract(hundred, 'score 100');
    assert(hundred.text.includes('100/100'), 'max score text');
  });

  await test('grade label matches the documented grade/color table at every threshold', async () => {
    // [score, expected grade, expected hex] — boundary values on both sides of
    // every threshold in the README grade table.
    const table = [
      [100, 'A+', '#4c1'], [97, 'A+', '#4c1'],
      [96, 'A', '#4c1'], [93, 'A', '#4c1'],
      [92, 'A-', '#4c1'], [90, 'A-', '#4c1'],
      [89, 'B+', '#97ca00'], [87, 'B+', '#97ca00'],
      [86, 'B', '#97ca00'], [83, 'B', '#97ca00'],
      [82, 'B-', '#97ca00'], [80, 'B-', '#97ca00'],
      [79, 'C+', '#dfb317'], [77, 'C+', '#dfb317'],
      [76, 'C', '#dfb317'], [73, 'C', '#dfb317'],
      [72, 'C-', '#dfb317'], [70, 'C-', '#dfb317'],
      [69, 'D+', '#fe7d37'], [67, 'D+', '#fe7d37'],
      [66, 'D', '#fe7d37'], [63, 'D', '#fe7d37'],
      [62, 'D-', '#fe7d37'], [60, 'D-', '#fe7d37'],
      [59, 'F', '#e05d44'], [0, 'F', '#e05d44'],
    ];
    for (const [score, grade, hex] of table) {
      const res = await req(`/api/badge.svg?score=${score}&platforms=25&label=grade`);
      assertEq(res.status, 200, `status for score=${score}`);
      assert(res.text.includes(`>${grade}<`), `score=${score} renders ${grade}, got: ${res.text.slice(0, 400)}`);
      assert(res.text.includes(`fill="${hex}"`), `grade ${grade} uses documented color ${hex}`);
      assert(!res.text.includes('/100'), `grade label for score=${score} omits the numeric score`);
    }
  });

  // ── Documented clamping ──
  console.log('=== clamping (docs/api.md: scores outside 0-100 are clamped) ===');
  await test('manual scores above 100 clamp to 100 (A+, bright green)', async () => {
    const res = await req('/api/badge.svg?score=150&platforms=25');
    assertBadgeContract(res, 'clamped high');
    assert(res.text.includes('100/100'), 'renders the clamped value');
    assert(res.text.includes('fill="#4c1"'), 'A+ color at the clamp ceiling');
  });

  await test('manual scores below 0 clamp to 0 (F, red)', async () => {
    const res = await req('/api/badge.svg?score=-5&platforms=25');
    assertBadgeContract(res, 'clamped low');
    assert(res.text.includes('0/100'), 'renders the clamped value');
    assert(res.text.includes('fill="#e05d44"'), 'F color at the clamp floor');
  });

  // ── Missing or invalid parameters ──
  console.log('=== missing or invalid parameters ===');
  await test('missing or half-provided manual params return the documented usage error', async () => {
    for (const query of ['', 'url=', 'score=85', 'platforms=25']) {
      const res = await req(`/api/badge.svg?${query}`);
      assertEq(res.status, 400, `status for ?${query}`);
      assert(
        /Provide \?url= OR both \?score= and \?platforms=/.test(res.json.error),
        `usage error for ?${query}, got: ${res.json.error}`
      );
    }
  });

  await test('invalid style and label values return the documented 400 with the valid list', async () => {
    const badStyle = await req('/api/badge.svg?score=85&platforms=25&style=sparkly');
    assertEq(badStyle.status, 400, 'style status');
    assertEq(
      badStyle.json.error,
      'Invalid style. Must be one of: flat, flat-square, plastic, for-the-badge',
      'style error'
    );

    const badLabel = await req('/api/badge.svg?score=85&platforms=25&label=count');
    assertEq(badLabel.status, 400, 'label status');
    assertEq(badLabel.json.error, 'Invalid label. Must be one of: score, grade', 'label error');
  });

  await test('invalid url-mode parameters return the documented 400s', async () => {
    const badUrl = await req('/api/badge.svg?url=not-a-url');
    assertEq(badUrl.status, 400, 'invalid URL status');
    assertEq(badUrl.json.error, 'Invalid URL', 'invalid URL error');

    const badScheme = await req(`/api/badge.svg?url=${encodeURIComponent('ftp://example.test/file')}`);
    assertEq(badScheme.status, 400, 'invalid scheme status');
    assertEq(badScheme.json.error, 'Only http and https URLs are supported', 'invalid scheme error');
  });

  // ── SVG escaping ──
  console.log('=== SVG escaping ===');
  await test('hostile manual values stay inside a valid escaped SVG on both paths', async () => {
    const payload = '85"><script>alert(1)</script>';
    for (const pathName of ['/api/badge', '/api/badge.svg']) {
      const res = await req(`${pathName}?score=${encodeURIComponent(payload)}&platforms=${encodeURIComponent(payload)}`);
      assertEq(res.status, 200, `${pathName} status`);
      assertEq(res.headers.get('content-type'), SVG_TYPE, `${pathName} content type`);
      assert(res.text.startsWith('<svg') && res.text.endsWith('</svg>'), `${pathName} single SVG root`);
      assert(res.text.includes('85/100'), `${pathName} numeric prefix rendered as the score`);
      assert(!res.text.includes('<script>'), `${pathName} script markup not injected`);
      assert(!res.text.includes('</svg><'), `${pathName} payload cannot escape the SVG root`);
    }
  });

  // ── Identical alias responses ──
  console.log('=== alias identity ===');
  await test('/api/badge and /api/badge.svg return byte-identical responses across modes', async () => {
    for (const query of [
      'score=85&platforms=25',
      'score=85&platforms=25&style=plastic&label=grade',
      'score=150&platforms=25&style=for-the-badge',
      'score=-5&platforms=25&style=flat-square&label=grade',
    ]) {
      const alias = await req(`/api/badge?${query}`);
      const svg = await req(`/api/badge.svg?${query}`);
      assertEq(alias.status, 200, `alias status for ${query}`);
      assertEq(svg.status, 200, `.svg status for ${query}`);
      assertEq(alias.text, svg.text, `alias body for ${query}`);
      assertEq(alias.headers.get('content-type'), SVG_TYPE, `alias content type for ${query}`);
      assertEq(svg.headers.get('content-type'), SVG_TYPE, `.svg content type for ${query}`);
      assertEq(alias.headers.get('cache-control'), CACHE_HEADER, `alias cache header for ${query}`);
      assertEq(svg.headers.get('cache-control'), CACHE_HEADER, `.svg cache header for ${query}`);
    }
  });

  // ── Single-flight de-duplication ──
  console.log('=== single-flight de-duplication ===');
  await test('concurrent identical ?url= requests collapse into one upstream fetch', async () => {
    const callsBefore = fetchCalls.length;
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => req(`/api/badge.svg?url=${encodeURIComponent(SLOW_URL)}`))
    );
    for (const res of responses) {
      assertBadgeContract(res, 'de-duplicated request');
      assert(res.text.includes('/100'), 'de-duplicated response carries the score');
    }
    assertEq(
      new Set(responses.map((r) => r.text)).size,
      1,
      'all concurrent responses are byte-identical'
    );
    assertEq(
      fetchCalls.length - callsBefore,
      1,
      'exactly one upstream fetch for five concurrent requests'
    );
  });

  // ── Error mapping in url mode ──
  console.log('=== url mode error mapping ===');
  await test('url mode maps fetch failures to 502 and SSRF rejections to 400', async () => {
    const failed = await req(`/api/badge.svg?url=${encodeURIComponent(FAIL_URL)}`);
    assertEq(failed.status, 502, 'fetch failure status');
    assert(/Failed to fetch URL/.test(failed.json.error), 'fetch failure error');

    const ssrf = await req(`/api/badge.svg?url=${encodeURIComponent(SSRF_URL)}`);
    assertEq(ssrf.status, 400, 'ssrf status');
    assert(/SSRF protection/.test(ssrf.json.error), 'ssrf error');
  });

  // ── Rate limiting: 429 in url mode only ──
  // Must run LAST: it deliberately exhausts the shared preview bucket.
  console.log('=== rate limiting (url mode only) ===');
  await test('legacy manual mode is unthrottled', async () => {
    // More requests than the 30/hr preview bucket — none may be rejected.
    for (let i = 0; i < 35; i++) {
      const res = await req(`/api/badge.svg?score=${i}&platforms=25`);
      assertEq(res.status, 200, `legacy request ${i} status`);
    }
  });

  await test('url mode returns the documented 429 once the preview bucket is empty, while legacy mode still works', async () => {
    // Spend whatever is left of the 30/hr preview bucket, then assert the 429
    // shape (13 url-mode requests were consumed by the tests above).
    let saw429 = null;
    for (let i = 0; i < 40 && !saw429; i++) {
      const res = await req(`/api/badge.svg?url=${encodeURIComponent(OK_URL)}`);
      if (res.status === 429) {
        saw429 = res;
      } else {
        assertEq(res.status, 200, `pre-exhaustion request ${i} status`);
      }
    }
    assert(saw429, 'preview bucket exhausts into a 429');
    assertEq(saw429.json.error, 'Rate limit exceeded', '429 error');
    assertEq(saw429.json.retryAfter, 3600, '429 retryAfter');
    assert(typeof saw429.json.message === 'string', '429 message present');

    // Documented split: the unthrottled legacy mode keeps working.
    const legacy = await req('/api/badge.svg?score=85&platforms=25');
    assertEq(legacy.status, 200, 'legacy status after exhaustion');
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
