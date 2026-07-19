#!/usr/bin/env node
'use strict';

/**
 * Deterministic end-to-end verification of meta-tag DIFF detection across
 * redirect hops (bf-13re).
 *
 * Why this exists: the live-network sibling tests (test-meta-tags-redirect.js,
 * test-multi-hop-redirect.js) hit example.com/github.com and drift. This test
 * is fully self-contained — it stubs node-fetch to replay a fixed 4-hop chain
 * where meta tags are deliberately STRIPPED at one hop and MODIFIED at another,
 * then asserts the fetcher computes the right per-hop metaDiff and that the
 * diagram renderer surfaces the right badges.
 *
 * Chain (each hop serves text/html so the meta-capture hook runs):
 *   hop1 (301) — rich meta + robots noindex ............. redirects → hop2
 *   hop2 (302) — title CHANGED, noindex REMOVED ......... redirects → hop3
 *   hop3 (301) — ALL meaningful meta STRIPPED ........... redirects → hop4
 *   hop4 (200) — some tags re-added (final)
 *
 * Acceptance criteria (bf-13re):
 *   ✓ Compare metaTags between consecutive hops in redirectChain
 *   ✓ Highlight hops where meta tags are stripped (all tags lost)
 *   ✓ Highlight hops where specific tags change (e.g., noindex removed)
 *   ✓ Show diff as visual indicators in the chain diagram
 *   ✓ Display 'meta tag stripped' warning badges on affected hops
 *   ✓ Tested with redirects that strip/modify meta tags
 *
 * The pure diff helpers are covered by test/unit/fetcher-meta-diff.test.js and
 * the badge renderer by test/unit/redirect-diagram.test.js; this test wires the
 * whole pipeline together.
 */

const Module = require('module');

// ---------------------------------------------------------------------------
// Mock HTTP layer — same minimal surface area as test-redirect-chain-metaverify.js
// (the bf-28vl test): response.status, response.headers.get/entries, and an
// async-iterable response.body consumed by readBodyLimited.
// ---------------------------------------------------------------------------
class MockHeaders {
  constructor(map) {
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
    this.body = {
      async *[Symbol.asyncIterator]() {
        yield buf;
      },
    };
  }
}

const html = (title, extra = '') =>
  `<!DOCTYPE html><html><head>` +
  `<meta charset="utf-8">` +
  `<title>${title}</title>` +
  extra +
  `</head><body><h1>${title}</h1></body></html>`;

// Distinct meta at each hop so the cross-hop diff is observable and stable.
const ROUTES = {
  // hop1: rich meta + noindex (page blocking indexing).
  'http://example.com/hop1': {
    status: 301,
    headers: {
      location: 'http://example.com/hop2',
      'content-type': 'text/html; charset=utf-8',
    },
    body: html(
      'Hop 1 — blocked from indexing',
      '<meta name="description" content="original description">' +
        '<meta name="robots" content="noindex, nofollow">' +
        '<meta property="og:title" content="Hop One OG">'
    ),
  },
  // hop2: title CHANGED, robots noindex REMOVED (page became indexable).
  'http://example.com/hop2': {
    status: 302,
    headers: {
      location: 'http://example.com/hop3',
      'content-type': 'text/html; charset=utf-8',
    },
    body: html(
      'Hop 2 — now indexable',
      '<meta name="description" content="original description">' +
        '<meta name="robots" content="index, follow">' +
        '<meta property="og:title" content="Hop Two OG">'
    ),
  },
  // hop3: ALL meaningful meta stripped (only title + charset remain).
  'http://example.com/hop3': {
    status: 301,
    headers: {
      location: 'https://example.com/hop4',
      'content-type': 'text/html; charset=utf-8',
    },
    body: html('Hop 3 — stripped bare'),
  },
  // hop4 (final): a couple of tags come back.
  'https://example.com/hop4': {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
    body: html(
      'Hop 4 — final destination',
      '<meta name="description" content="the real page description">' +
        '<meta property="og:title" content="Final OG Title">'
    ),
  },
};

function mockFetch(url) {
  const route = ROUTES[url];
  if (!route) return Promise.reject(new Error(`mock-fetch: no route for ${url}`));
  return Promise.resolve(new MockResponse(route));
}

// Swap node-fetch for the mock BEFORE requiring fetcher.js.
const nodeFetchPath = require.resolve('node-fetch');
const stubModule = new Module(nodeFetchPath);
stubModule.filename = nodeFetchPath;
stubModule.loaded = true;
stubModule.exports = mockFetch;
require.cache[nodeFetchPath] = stubModule;

const { fetchUrl } = require('./src/fetcher');
const { buildRedirectChainDiagram } = require('./src/public/redirect-diagram');

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
  console.log('bf-13re: meta-tag diff detection between hops');
  console.log('Replaying a 4-hop chain that modifies + strips meta tags...\n');

  const result = await fetchUrl('http://example.com/hop1');
  const chain = result.redirectChain;

  // --- Log the computed metaDiff at each hop ---
  console.log('==============================================================');
  console.log('PER-HOP META DIFF LOG');
  console.log('==============================================================');
  chain.forEach((hop, i) => {
    console.log(`\n[hop ${i + 1}/${chain.length}] ${hop.statusCode} ${hop.url}`);
    console.log(`  meaningful tags: ${require('./src/fetcher').countMeaningfulMetaTags(hop.metaTags)}`);
    if (!hop.metaDiff) {
      console.log('  metaDiff: (none — first hop)');
      return;
    }
    const d = hop.metaDiff;
    console.log(`  metaDiff.stripped       : ${d.stripped === true}`);
    console.log(`  metaDiff.noindexRemoved : ${d.noindexRemoved === true}`);
    console.log(`  metaDiff.changed        : ${JSON.stringify(d.changed || [])}`);
    console.log(`  metaDiff.added          : ${JSON.stringify(d.added || [])}`);
    console.log(`  metaDiff.removed        : ${JSON.stringify(d.removed || [])}`);
  });
  console.log('\n==============================================================\n');

  // --- Structural ---
  console.log('STRUCTURAL CHECKS');
  check('redirectChain has exactly 4 hops', chain.length === 4, `got ${chain.length}`);
  check('finalUrl resolved to the 200 destination', result.finalUrl === 'https://example.com/hop4');

  // --- hop1: first hop has no metaDiff (nothing to compare to) ---
  console.log('\nHOP 1 (first hop — no prior hop to diff against)');
  check('hop 1 has no metaDiff', chain[0].metaDiff === undefined);

  // --- hop2: title changed + noindex removed ---
  console.log('\nHOP 2 (title changed, noindex removed)');
  const d2 = chain[1].metaDiff;
  check('hop 2 has a metaDiff object', !!d2);
  check('hop 2 flags noindexRemoved', d2 && d2.noindexRemoved === true);
  check('hop 2 records the title change', d2 && d2.changed.some((c) => c.field === 'title' && c.from === 'Hop 1 — blocked from indexing' && c.to === 'Hop 2 — now indexable'));
  check('hop 2 records the og:title change', d2 && d2.changed.some((c) => c.field === 'ogTitle'));
  check('hop 2 records the robots change', d2 && d2.changed.some((c) => c.field === 'robots'));
  check('hop 2 is NOT stripped', d2 && d2.stripped !== true);

  // --- hop3: all meaningful meta stripped ---
  console.log('\nHOP 3 (all meaningful meta tags stripped)');
  const d3 = chain[2].metaDiff;
  check('hop 3 has a metaDiff object', !!d3);
  check('hop 3 flags stripped (all tags lost)', d3 && d3.stripped === true);
  check('hop 3 records removal of description', d3 && d3.removed.some((r) => r.field === 'description'));
  check('hop 3 records removal of og:title', d3 && d3.removed.some((r) => r.field === 'ogTitle'));

  // --- hop4: tags re-added (prev hop had none, so no stripped; additions) ---
  console.log('\nHOP 4 (tags re-added after the stripped hop)');
  const d4 = chain[3].metaDiff;
  check('hop 4 has a metaDiff object', !!d4);
  check('hop 4 is NOT stripped (prev had no tags to lose)', d4 && d4.stripped !== true);
  check('hop 4 records description as added', d4 && d4.added.some((a) => a.field === 'description'));
  check('hop 4 records ogTitle as added', d4 && d4.added.some((a) => a.field === 'ogTitle'));

  // --- Diagram rendering surfaces the visual indicators ---
  console.log('\nDIAGRAM BADGE CHECKS');
  const diagram = buildRedirectChainDiagram(chain);
  check('diagram contains the stripped warning badge', diagram.includes('Meta tags stripped'));
  check('diagram contains the noindex-removed badge', diagram.includes('noindex removed'));
  check('diagram contains a meta-diff changed summary', diagram.includes('Meta diff:'));
  check('diagram has exactly one stripped badge', (diagram.match(/Meta tags stripped/g) || []).length === 1);
  check('stripped badge carries the warning class', diagram.includes('hop-meta-badge stripped'));

  // --- Summary ---
  console.log('\n==============================================================');
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log('==============================================================');
  if (failed > 0) {
    console.log('\n✗ VERIFICATION FAILED');
    process.exit(1);
  }
  console.log('\n✓ All bf-13re acceptance criteria verified end-to-end.');
  console.log('  ✓ metaTags compared between consecutive hops in redirectChain');
  console.log('  ✓ hops where meta tags are stripped (all tags lost) are flagged');
  console.log('  ✓ hops where specific tags change (noindex removed) are flagged');
  console.log('  ✓ diff shown as visual indicators in the chain diagram');
  console.log("  ✓ 'meta tag stripped' warning badges shown on affected hops");
  console.log('  ✓ tested with a redirect chain that strips/modifies meta tags');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Unexpected error:', err);
  process.exit(1);
});
