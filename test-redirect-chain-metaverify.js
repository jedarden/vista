#!/usr/bin/env node
'use strict';

/**
 * Deterministic verification of redirectChain per-hop meta tag extraction.
 *
 * Related bead: bf-28vl ("Verify redirectChain per-hop meta tag extraction").
 *
 * Why this exists: the sibling tests (test-multi-hop-redirect.js,
 * test-meta-tags-redirect.js, test-redirect-chain-html.js) all hit the live
 * network (github.com / example.com), so their hop counts and the exact meta
 * tags they observe can drift as those sites change. This test is fully
 * self-contained: it stubs node-fetch to replay a fixed 4-hop redirect chain
 * with known HTML + meta tags at every hop, then logs the resulting
 * redirectChain and asserts each acceptance criterion.
 *
 * Acceptance criteria (bf-28vl):
 *   - fetchUrl captures response HTML at each redirect hop
 *   - Meta tags are parsed and stored in the redirectChain array
 *   - redirectChain hop structure includes: url, status, headers, html, metaTags
 *   - Verified by logging redirectChain after a 3-4 hop redirect
 *
 * Note on field naming: the acceptance criterion says "status", but the
 * canonical RedirectHop contract (src/types/compare.ts:91) and all 50+
 * consumers use `statusCode`. We assert `statusCode` and treat it as the
 * "status" field.
 */

const Module = require('module');

// ---------------------------------------------------------------------------
// Mock HTTP layer: a tiny Response/Headers stand-in plus a route table.
// Only the surface area that src/fetcher.js actually touches is implemented:
//   response.status, response.headers.get(name),
//   Object.fromEntries(response.headers.entries()), and
//   `for await (const chunk of response.body)`.
// ---------------------------------------------------------------------------

class MockHeaders {
  constructor(map) {
    // node-fetch lowercases header keys; mirror that so .get() is predictable.
    this._map = {};
    for (const [k, v] of Object.entries(map)) {
      this._map[String(k).toLowerCase()] = String(v);
    }
  }
  get(name) {
    return this._map[String(name).toLowerCase()] ?? null;
  }
  entries() {
    return Object.entries(this._map);
  }
}

class MockResponse {
  constructor({ status, headers = {}, body = '' }) {
    this.status = status;
    this.headers = new MockHeaders(headers);
    const buf = Buffer.from(body, 'utf8');
    // Body must be async-iterable (consumed by readBodyLimited).
    this.body = {
      async *[Symbol.asyncIterator]() {
        yield buf;
      },
    };
  }
}

// Each hop serves text/html so the primary HTML/meta-capture hook runs, even
// for 3xx hops. Distinct meta tags per hop make per-hop capture observable.
const html = (title, extra = '') =>
  `<!DOCTYPE html><html><head>` +
  `<meta charset="utf-8">` +
  `<title>${title}</title>` +
  extra +
  `</head><body><h1>${title}</h1></body></html>`;

const ROUTES = {
  'http://example.com/hop1': {
    status: 301,
    headers: {
      location: 'http://example.com/hop2',
      'content-type': 'text/html; charset=utf-8',
      server: 'mock-vista/1.0',
    },
    body: html('Hop 1 — moved permanently', '<meta name="description" content="hop one body">'),
  },
  'http://example.com/hop2': {
    status: 302,
    headers: {
      location: 'http://example.com/hop3',
      'content-type': 'text/html; charset=utf-8',
    },
    body: html('Hop 2 — found', '<meta name="description" content="hop two body">'),
  },
  'http://example.com/hop3': {
    status: 301,
    headers: {
      location: 'https://example.com/hop4', // http -> https upgrade
      'content-type': 'text/html; charset=utf-8',
    },
    body: html('Hop 3 — upgrade', '<meta name="description" content="hop three body">'),
  },
  'https://example.com/hop4': {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      server: 'mock-vista/1.0',
    },
    body: html(
      'Hop 4 — final destination',
      '<meta name="description" content="the real page description">' +
        '<meta property="og:title" content="Final OG Title">' +
        '<meta property="og:image" content="https://example.com/final.png">' +
        '<meta name="twitter:card" content="summary_large_image">'
    ),
  },
};

function mockFetch(url) {
  const route = ROUTES[url];
  if (!route) {
    return Promise.reject(new Error(`mock-fetch: no route for ${url}`));
  }
  return Promise.resolve(new MockResponse(route));
}

// Swap node-fetch for the mock BEFORE requiring fetcher.js so its module-level
// `const fetch = require('node-fetch')` picks up the stub.
const nodeFetchPath = require.resolve('node-fetch');
const stubModule = new Module(nodeFetchPath);
stubModule.filename = nodeFetchPath;
stubModule.loaded = true;
stubModule.exports = mockFetch;
require.cache[nodeFetchPath] = stubModule;

const { fetchUrl } = require('./src/fetcher');

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function check(label, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  console.log('bf-28vl: verify redirectChain per-hop meta tag extraction');
  console.log('Replaying a fixed 4-hop chain (301 → 302 → 301 → 200)...\n');

  const result = await fetchUrl('http://example.com/hop1');
  const chain = result.redirectChain;

  // --- Acceptance criterion: log redirectChain after a 3-4 hop redirect ---
  console.log('==============================================================');
  console.log('REDIRECT CHAIN LOG');
  console.log('==============================================================');
  chain.forEach((hop, i) => {
    console.log(`\n[hop ${i + 1}/${chain.length}]`);
    console.log(`  url        : ${hop.url}`);
    console.log(`  statusCode : ${hop.statusCode}`);
    console.log(`  redirectsTo: ${hop.redirectsTo || '(final)'}`);
    console.log(`  isFinal    : ${hop.isFinal === true}`);
    console.log(`  headers    : ${Object.keys(hop.headers).length} keys (content-type=${hop.headers['content-type']})`);
    console.log(`  html       : ${hop.html ? `${hop.html.length} bytes` : '(none)'}`);
    console.log(`  metaTags   : ${hop.metaTags.length} tag(s)`);
    if (hop.metaTags.length) {
      const summary = hop.metaTags
        .map((t) => t.property || t.name || t['http-equiv'] || 'charset')
        .slice(0, 6)
        .join(', ');
      console.log(`               [${summary}]`);
    }
    if (hop.meta) {
      console.log(`  meta.title : ${hop.meta.title}`);
      console.log(`  meta.og    : title=${hop.meta.ogTitle}, image=${hop.meta.ogImage}`);
    }
    if (hop.warning) console.log(`  warning    : ${hop.warning}`);
  });
  console.log('\n==============================================================\n');

  // --- Structural assertions ---
  console.log('STRUCTURAL CHECKS');
  check('fetchUrl returned a redirectChain array', Array.isArray(chain) && chain.length > 0);
  check('redirectChain has exactly 4 hops', chain.length === 4, `got ${chain.length}`);
  check('finalUrl resolved to the 200 destination', result.finalUrl === 'https://example.com/hop4', `got ${result.finalUrl}`);

  const REQUIRED = ['url', 'statusCode', 'headers', 'html', 'metaTags'];
  console.log('\nPER-HOP REQUIRED-FIELD CHECKS (url, status, headers, html, metaTags)');
  for (let i = 0; i < chain.length; i++) {
    const hop = chain[i];
    for (const field of REQUIRED) {
      // `html` is the only field that is allowed to be absent on a header-only
      // hop, but every hop in this mock serves text/html, so it must be present.
      check(`hop ${i + 1} has '${field}'`, Object.prototype.hasOwnProperty.call(hop, field));
    }
    check(`hop ${i + 1} statusCode is a number`, typeof hop.statusCode === 'number');
    check(`hop ${i + 1} headers is a non-empty object`, typeof hop.headers === 'object' && Object.keys(hop.headers).length > 0);
    check(`hop ${i + 1} html is a non-empty string`, typeof hop.html === 'string' && hop.html.length > 0);
    check(`hop ${i + 1} metaTags is an array`, Array.isArray(hop.metaTags));
  }

  // --- Redirect hop specifics ---
  console.log('\nREDIRECT-HOP CHECKS');
  check('hop 1 statusCode = 301', chain[0].statusCode === 301);
  check('hop 1 redirectsTo hop2', chain[0].redirectsTo === 'http://example.com/hop2');
  check('hop 2 statusCode = 302', chain[1].statusCode === 302);
  check('hop 2 redirectsTo hop3', chain[1].redirectsTo === 'http://example.com/hop3');
  check('hop 3 statusCode = 301', chain[2].statusCode === 301);
  check('hop 3 redirectsTo hop4 (https)', chain[2].redirectsTo === 'https://example.com/hop4');
  check('http→https hop warned about the upgrade', /HTTPS/i.test(chain[2].warning || ''));

  // --- Meta-tag extraction checks ---
  console.log('\nMETA-TAG EXTRACTION CHECKS');
  check('hop 1 captured its own description meta', chain[0].metaTags.some((t) => t.name === 'description' && t.content === 'hop one body'));
  check('hop 2 captured its own description meta', chain[1].metaTags.some((t) => t.name === 'description' && t.content === 'hop two body'));
  check('hop 3 captured its own description meta', chain[2].metaTags.some((t) => t.name === 'description' && t.content === 'hop three body'));

  const finalHop = chain[3];
  check('hop 4 captured og:title', finalHop.metaTags.some((t) => t.property === 'og:title' && t.content === 'Final OG Title'));
  check('hop 4 captured og:image', finalHop.metaTags.some((t) => t.property === 'og:image' && /final\.png$/.test(t.content)));
  check('hop 4 captured twitter:card', finalHop.metaTags.some((t) => t.name === 'twitter:card' && t.content === 'summary_large_image'));
  check('hop 4 parsed critical meta (title/description)', finalHop.meta && finalHop.meta.title === 'Hop 4 — final destination' && finalHop.meta.description === 'the real page description');
  check('hop 4 og:image was resolved to absolute URL', finalHop.meta && finalHop.meta.ogImage === 'https://example.com/final.png');
  check('hop 4 has isFinal flag', finalHop.isFinal === true);

  // --- Raw tag shape (HopRawMetaTag contract) ---
  console.log('\nRAW TAG SHAPE CHECKS');
  const sampleTag = finalHop.metaTags.find((t) => t.property === 'og:title');
  check('meta tag has rawHtml containing <meta', sampleTag && sampleTag.rawHtml && sampleTag.rawHtml.includes('<meta'));
  check('meta tag has numeric index', sampleTag && typeof sampleTag.index === 'number');

  // --- Summary ---
  console.log('\n==============================================================');
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log('==============================================================');
  if (failed > 0) {
    console.log('\n✗ VERIFICATION FAILED');
    process.exit(1);
  }
  console.log('\n✓ All bf-28vl acceptance criteria verified.');
  console.log('  ✓ fetchUrl captures response HTML at each redirect hop');
  console.log('  ✓ Meta tags parsed and stored in redirectChain at each hop');
  console.log('  ✓ redirectChain hop structure includes url, statusCode, headers, html, metaTags');
  console.log('  ✓ redirectChain logged after a 4-hop redirect');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Unexpected error:', err);
  process.exit(1);
});
