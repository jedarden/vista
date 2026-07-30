'use strict';

/**
 * Integration test for client-side-only meta-tag detection (bf-4wa).
 *
 * End-to-end verification that a page which injects og:/twitter: meta tags
 * only via JavaScript is correctly flagged. Exercises the real pipeline with
 * no network and no browser:
 *
 *   1. parseMetaTags() on the RAW HTML returns rawTags — and because the raw
 *      HTML (what a crawler fetches, before JS runs) contains only the static
 *      tags, the JS-injected tags must NOT appear in rawTags. This is the
 *      "server-side raw HTML" half of the raw-vs-rendered comparison.
 *   2. buildPreviewResult() includes rawTags in its response JSON — both at
 *      the top level and as meta.rawTags — so the browser can run the diff.
 *   3. diffClientSideTags(serverRawTags, renderedDomTags) flags every
 *      JS-injected tag as `clientOnly`, which app.js turns into a
 *      severity:'error' finding ("js-injected-tags").
 *   4. detectClientSideOnlyTags() (the server-side Common Mistakes Detector)
 *      emits a severity:'error' finding with SSR/prerendering guidance when
 *      og:/twitter: tags sit in <body>.
 *
 * Fixture: test-spa-meta.html — a page whose static HTML has no og tags but
 * injects og:image / og:title / og:description into <head> via setTimeout,
 * mirroring a real SPA.
 *
 * The pure diff building blocks are covered by client-side-diff.test.js
 * (bf-4vcw); this test wires them to the SPA fixture and the server response.
 */

const fs = require('fs');
const path = require('path');
const { parseMetaTags } = require('../../src/fetcher');
const { diffClientSideTags } = require('../../src/public/client-side-diff');
const { detectClientSideOnlyTags } = require('../../src/diagnostics');
const { buildPreviewResult } = require('../../src/server');

// --- tiny assertion helpers (match the house style: no test runner) ---------

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      (msg || 'assertEqual failed') +
        ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function test(description, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed++;
      console.log(`  ✓ ${description}`);
    })
    .catch(err => {
      failed++;
      console.error(`  ✗ ${description}`);
      console.error(`      ${err.message}`);
    });
}

// --- fixture ----------------------------------------------------------------

const SPA_HTML = fs.readFileSync(
  path.join(__dirname, '..', '..', 'test-spa-meta.html'),
  'utf8'
);

// The three tags test-spa-meta.html injects via setTimeout after load. We
// model the post-JS DOM by adding these to the raw tag list. In the browser
// these arrive as real <meta> elements; normalizeMetaTag() treats rawTags
// objects and DOM elements identically, so we can use the rawTag shape here.
const INJECTED_TAGS = [
  { property: 'og:image', content: 'https://example.com/injected-image.jpg' },
  { property: 'og:title', content: 'Injected Title via JS' },
  { property: 'og:description', content: 'This description was injected by JavaScript' },
];

// A page that places an og tag literally in <body> markup — the server-side
// heuristic's target (no JS execution needed to spot this one).
const BODY_TAG_HTML =
  '<!DOCTYPE html><html><head><title>Body Meta</title></head>' +
  '<body><meta property="og:title" content="meta tag in body"></body></html>';

// ---------------------------------------------------------------------------

async function main() {
  console.log('\nclient-side SPA detection (bf-4wa)\n');

  // 1. rawTags must reflect the pre-JS HTML a crawler actually fetches.

  await test('parseMetaTags().rawTags omits JS-injected og tags (raw HTML only)', () => {
    const meta = parseMetaTags(SPA_HTML, 'https://example.com/spa');
    assert(Array.isArray(meta.rawTags), 'rawTags should be an array');
    // The static HTML only carries a charset tag — no og/twitter tags at all.
    const ogOrTwitter = meta.rawTags.filter(
      t => (t.property && t.property.startsWith('og:')) ||
           (t.name && t.name.startsWith('twitter:'))
    );
    assertEqual(ogOrTwitter.length, 0, 'no og/twitter tags should be in raw HTML');
    // And the convenience fields agree: nothing was parsed out. (og fields are
    // absent on an empty {} object, so they're undefined — assert absence.)
    assert(!meta.og.image, 'og.image should be absent in raw HTML');
    assert(!meta.og.title, 'og.title should be absent in raw HTML');
    assert(!meta.og.description, 'og.description should be absent in raw HTML');
  });

  // 2. The server response includes rawTags so the browser can run the diff.

  await test('buildPreviewResult() includes rawTags in the response JSON', async () => {
    const result = await buildPreviewResult({
      html: SPA_HTML,
      baseUrl: 'https://example.com/spa',
      redirectChain: [],
      responseHeaders: {},
      statusCode: 200,
      sourceUrl: 'https://example.com/spa',
    });
    // Top-level convenience copy…
    assert(Array.isArray(result.rawTags), 'result.rawTags should be an array');
    // …and the same array on meta, which is what verifyClientSideTags() reads.
    assert(Array.isArray(result.meta.rawTags), 'result.meta.rawTags should be an array');
    assertEqual(result.meta.rawTags.length, result.rawTags.length);
    // The raw HTML still carries no injected tags — proving rawTags is pre-JS.
    assert(!result.rawTags.some(t => t.property === 'og:image'),
      'rawTags must not contain the JS-injected og:image');
    // The HTML body is shipped too (app.js writes it into an iframe to run JS).
    assert(typeof result.html === 'string' && result.html.length > 0,
      'response must include html for client-side rendering');
  });

  // 3. The diff flags every JS-injected tag as clientOnly.

  await test('diffClientSideTags flags all JS-injected tags as clientOnly', () => {
    const serverMeta = parseMetaTags(SPA_HTML, 'https://example.com/spa');
    // Simulate the rendered DOM: the static tags PLUS the JS-injected ones.
    const renderedTags = serverMeta.rawTags.concat(INJECTED_TAGS);
    const { clientOnlyTags, differingTags } =
      diffClientSideTags(serverMeta.rawTags, renderedTags);

    assertEqual(clientOnlyTags.length, 3);
    const keys = clientOnlyTags.map(t => t.key).sort();
    assertEqual(keys.join(','), 'og:description,og:image,og:title');
    // Brand-new keys are "injected", not "modified".
    assertEqual(differingTags.length, 0);
  });

  await test('diffClientSideTags is silent when the SPA injects nothing', () => {
    const serverMeta = parseMetaTags(SPA_HTML, 'https://example.com/spa');
    // Rendered DOM identical to raw → no JS injection → no findings.
    const { clientOnlyTags, differingTags } =
      diffClientSideTags(serverMeta.rawTags, serverMeta.rawTags);
    assertEqual(clientOnlyTags.length, 0);
    assertEqual(differingTags.length, 0);
  });

  await test('a JS-modified value is flagged as differing, not clientOnly', () => {
    // Static HTML ships og:title=A; JS rewrites it to B. The key exists
    // server-side, so it is a modification (warning), not an injection (error).
    const serverTags = [{ property: 'og:title', content: 'A' }];
    const renderedTags = [{ property: 'og:title', content: 'B' }];
    const { clientOnlyTags, differingTags } =
      diffClientSideTags(serverTags, renderedTags);
    assertEqual(clientOnlyTags.length, 0);
    assertEqual(differingTags.length, 1);
    assertEqual(differingTags[0].value, 'B');
  });

  // 4. The server-side detector emits an error with SSR/prerender guidance.

  await test('detectClientSideOnlyTags flags body meta as error with SSR guidance', () => {
    const meta = parseMetaTags(BODY_TAG_HTML, 'https://example.com/body');
    const findings = detectClientSideOnlyTags(BODY_TAG_HTML, meta);
    assertEqual(findings.length, 1);
    assertEqual(findings[0].severity, 'error');
    assert(/SSR|prerender/i.test(findings[0].fix),
      'fix should mention SSR or prerendering');
    assertEqual(findings[0].code, 'client-side-only-tags');
  });

  await test('detectClientSideOnlyTags stays quiet on a clean head-only page', () => {
    const meta = parseMetaTags(SPA_HTML, 'https://example.com/spa');
    const findings = detectClientSideOnlyTags(SPA_HTML, meta);
    // Static HTML has no og/twitter tags in <body> (they are JS-injected into
    // <head> at runtime, which the server cannot see) → no server-side finding.
    assertEqual(findings.length, 0);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
