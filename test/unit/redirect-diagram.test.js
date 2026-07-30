'use strict';

/**
 * Unit tests for the redirect-chain diagram renderer (src/public/redirect-diagram.js).
 *
 * The renderer is a pure (chain, opts) => HTML-string function with no DOM
 * access, so it can be exercised directly in Node. These tests cover the
 * acceptance criteria for bf-wapd:
 *   - renderRedirects()/buildRedirectChainDiagram() builds a visual diagram
 *     with down-arrow connectors between hops
 *   - status codes shown as color-coded badges (301=blue, 302=yellow, ...)
 *   - URLs displayed with truncation for long paths
 *   - hop numbers labeled (1, 2, 3, ...) with a "Final" tag on the last hop
 *   - exercised with 2-hop and 5-hop redirect chains
 */

const {
  buildRedirectChainDiagram,
  renderMetaDiffBadges,
  statusBadgeClass,
  truncateUrl,
  escHtml,
} = require('../../src/public/redirect-diagram');

// --- tiny assertion helpers -------------------------------------------------

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

function assertContains(haystack, needle, msg) {
  if (String(haystack).indexOf(needle) === -1) {
    throw new Error((msg || 'assertContains failed') + ` — missing ${JSON.stringify(needle)}`);
  }
}

function assertNotContains(haystack, needle, msg) {
  if (String(haystack).indexOf(needle) !== -1) {
    throw new Error((msg || 'assertNotContains failed') + ` — found ${JSON.stringify(needle)}`);
  }
}

/** Count non-overlapping occurrences of needle in haystack. */
function countOf(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = String(haystack).indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = String(haystack).indexOf(needle, idx + needle.length);
  }
  return count;
}

// --- shared fixtures --------------------------------------------------------

// Minimal hop factory matching the shape produced by src/fetcher.js.
function hop(url, statusCode, extra) {
  return Object.assign({ url, statusCode }, extra || {});
}

// --- test runner ------------------------------------------------------------

function runTests() {
  console.log('Running redirect-diagram unit tests...\n');

  let passed = 0;
  let failed = 0;

  function test(description, fn) {
    try {
      fn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${description}`);
      console.log(`  Error: ${err.message}`);
      failed++;
    }
  }

  // === empty / null chains ===
  console.log('=== Empty & null chains ===');

  test('empty chain renders the "No redirects" message', () => {
    const html = buildRedirectChainDiagram([]);
    assertContains(html, 'redirect-empty', 'should render the empty placeholder');
    assertContains(html, 'No redirects', 'should mention no redirects');
  });

  test('null chain renders the "No redirects" message', () => {
    const html = buildRedirectChainDiagram(null);
    assertContains(html, 'No redirects');
  });

  test('undefined chain renders the "No redirects" message', () => {
    const html = buildRedirectChainDiagram(undefined);
    assertContains(html, 'No redirects');
  });

  // === 2-hop chain (acceptance criterion) ===
  console.log('\n=== 2-hop chain ===');

  const twoHop = [
    hop('http://old.example.com/', 301, { redirectsTo: 'https://example.com/' }),
    hop('https://example.com/page', 200, { isFinal: true }),
  ];

  test('2-hop chain renders exactly two hop rows', () => {
    const html = buildRedirectChainDiagram(twoHop);
    assertEqual(countOf(html, 'class="redirect-hop"'), 2, 'expected 2 redirect-hop rows');
  });

  test('hop numbers are labeled 1 and 2', () => {
    const html = buildRedirectChainDiagram(twoHop);
    assertContains(html, '>1<', 'hop 1 missing its number badge');
    assertContains(html, '>2<', 'hop 2 missing its number badge');
  });

  test('a down-arrow connector appears between hops but not after the last', () => {
    const html = buildRedirectChainDiagram(twoHop);
    // The inter-hop arrow glyph is rendered in a .hop-arrow element.
    assertEqual(countOf(html, 'class="hop-arrow"'), 1, 'expected exactly 1 inter-hop arrow');
  });

  test('only the final hop is tagged "Final"', () => {
    const html = buildRedirectChainDiagram(twoHop);
    assertEqual(countOf(html, 'hop-final-tag'), 1, 'expected exactly one Final tag');
    assertContains(html, '>Final<');
  });

  test('301 badge is blue (s301) and 200 badge is green (s200)', () => {
    const html = buildRedirectChainDiagram(twoHop);
    assertContains(html, 'hop-status s301', '301 should map to the s301 (blue) badge');
    assertContains(html, 'hop-status s200', '200 should map to the s200 (green) badge');
  });

  test('redirect target is rendered with an inline arrow', () => {
    const html = buildRedirectChainDiagram(twoHop);
    assertContains(html, 'hop-arrow-inline');
    assertContains(html, 'https://example.com/');
  });

  // === 5-hop chain (acceptance criterion) ===
  console.log('\n=== 5-hop chain ===');

  const fiveHop = [
    hop('http://a.example/', 301, { redirectsTo: 'http://b.example/' }),
    hop('http://b.example/', 302, { redirectsTo: 'http://c.example/' }),
    hop('http://c.example/', 307, { redirectsTo: 'http://d.example/' }),
    hop('http://d.example/', 301, { redirectsTo: 'https://e.example/very/long/path' }),
    hop('https://e.example/very/long/path/that/keeps/going', 200, { isFinal: true }),
  ];

  test('5-hop chain renders exactly five hop rows', () => {
    const html = buildRedirectChainDiagram(fiveHop);
    assertEqual(countOf(html, 'class="redirect-hop"'), 5, 'expected 5 redirect-hop rows');
  });

  test('5-hop chain labels hops 1..5', () => {
    const html = buildRedirectChainDiagram(fiveHop);
    for (let n = 1; n <= 5; n++) {
      assertContains(html, `>${n}<`, `hop ${n} missing its number badge`);
    }
  });

  test('5-hop chain has 4 inter-hop arrows (n-1) and exactly one Final tag', () => {
    const html = buildRedirectChainDiagram(fiveHop);
    assertEqual(countOf(html, 'class="hop-arrow"'), 4, 'expected n-1 = 4 inter-hop arrows');
    assertEqual(countOf(html, 'hop-final-tag'), 1, 'expected exactly one Final tag');
  });

  test('5-hop chain mixes s301 (blue), s302 (yellow), s307 (teal), s200 (green) badges', () => {
    const html = buildRedirectChainDiagram(fiveHop);
    assertContains(html, 'hop-status s301');
    assertContains(html, 'hop-status s302');
    assertContains(html, 'hop-status s307');
    assertContains(html, 'hop-status s200');
  });

  // === 3-hop chain ===
  console.log('\n=== 3-hop chain ===');

  test('3-hop chain renders 3 rows and 2 arrows', () => {
    const threeHop = [
      hop('http://x.example/', 301, { redirectsTo: 'http://y.example/' }),
      hop('http://y.example/', 302, { redirectsTo: 'http://z.example/' }),
      hop('http://z.example/', 200, { isFinal: true }),
    ];
    const html = buildRedirectChainDiagram(threeHop);
    assertEqual(countOf(html, 'class="redirect-hop"'), 3);
    assertEqual(countOf(html, 'class="hop-arrow"'), 2);
  });

  // === URL truncation in rendered output ===
  console.log('\n=== URL truncation (rendered) ===');

  test('long URLs are truncated with an ellipsis in the diagram', () => {
    const longUrl =
      'https://example.com/this/is/a/very/long/path/that/exceeds/sixty/characters.html';
    const html = buildRedirectChainDiagram([hop(longUrl, 200, { isFinal: true })]);
    assertContains(html, '...', 'long URL should be truncated');
    // Truncation keeps head + tail, so both the host and trailing segment survive.
    assertContains(html, 'https://example.com');
    assertContains(html, 'characters.html');
  });

  test('short URLs are rendered verbatim (no ellipsis)', () => {
    const shortUrl = 'https://example.com/page';
    const html = buildRedirectChainDiagram([hop(shortUrl, 200, { isFinal: true })]);
    assertContains(html, shortUrl);
    assertNotContains(html, '...', 'short URL should not be truncated');
  });

  // === status badge / status code display ===
  console.log('\n=== Status display ===');

  test('zero/unknown status renders an em-dash and the s(unk) badge', () => {
    const html = buildRedirectChainDiagram([hop('https://example.com/', 0, { isFinal: true })]);
    assertContains(html, '>—<', 'unknown status should render an em-dash');
    assertContains(html, 'hop-status sunk');
  });

  test('warning and metaError rows render when present', () => {
    const html = buildRedirectChainDiagram([
      hop('https://example.com/', 200, {
        isFinal: true,
        warning: 'mixed-redirect',
        metaError: 'parse failed',
      }),
    ]);
    assertContains(html, 'hop-warning');
    assertContains(html, 'mixed-redirect');
    assertContains(html, 'hop-meta-error');
    assertContains(html, 'parse failed');
  });

  // === renderMeta callback ===
  console.log('\n=== renderMeta callback ===');

  test('renderMeta callback is invoked per hop and its output is included', () => {
    const calls = [];
    const html = buildRedirectChainDiagram(
      [hop('https://example.com/', 200, { isFinal: true })],
      {
        renderMeta: (h) => {
          calls.push(h.url);
          return '<div class="custom-meta">META</div>';
        },
      }
    );
    assertEqual(calls.length, 1, 'renderMeta should be called once for the single hop');
    assertEqual(calls[0], 'https://example.com/');
    assertContains(html, 'custom-meta');
    assertContains(html, 'META');
  });

  test('renderMeta returning empty string adds nothing', () => {
    const html = buildRedirectChainDiagram(
      [hop('https://example.com/', 200, { isFinal: true })],
      { renderMeta: () => '' }
    );
    assertNotContains(html, 'custom-meta');
  });

  // === helpers (statusBadgeClass / truncateUrl / escHtml) ===
  console.log('\n=== statusBadgeClass mapping ===');

  test('statusBadgeClass maps specific codes to dedicated classes', () => {
    assertEqual(statusBadgeClass(200), 's200');
    assertEqual(statusBadgeClass(301), 's301');
    assertEqual(statusBadgeClass(302), 's302');
    assertEqual(statusBadgeClass(303), 's303');
    assertEqual(statusBadgeClass(304), 's304');
    assertEqual(statusBadgeClass(307), 's307');
    assertEqual(statusBadgeClass(308), 's308');
  });

  test('statusBadgeClass falls back to range buckets and unknown', () => {
    assertEqual(statusBadgeClass(201), 's2xx', '201 should fall back to s2xx');
    assertEqual(statusBadgeClass(299), 's2xx');
    assertEqual(statusBadgeClass(305), 's3xx', '305 should fall back to s3xx');
    assertEqual(statusBadgeClass(404), 's4xx');
    assertEqual(statusBadgeClass(500), 's5xx');
    assertEqual(statusBadgeClass(0), 'sunk', '0 should be unknown');
    assertEqual(statusBadgeClass(undefined), 'sunk');
    assertEqual(statusBadgeClass(NaN), 'sunk');
  });

  console.log('\n=== truncateUrl ===');

  test('truncateUrl returns short URLs unchanged', () => {
    const u = 'https://example.com/short';
    assertEqual(truncateUrl(u), u);
  });

  test('truncateUrl returns empty string for null/undefined/empty', () => {
    assertEqual(truncateUrl(null), '');
    assertEqual(truncateUrl(undefined), '');
    assertEqual(truncateUrl(''), '');
  });

  test('truncateUrl truncates long URLs to head + ellipsis + tail', () => {
    const longUrl =
      'https://example.com/this/is/a/very/long/path/that/exceeds/sixty/characters.html';
    const out = truncateUrl(longUrl);
    assertContains(out, '...', 'truncated URL should contain an ellipsis');
    assertEqual(out.length < longUrl.length, true, 'truncated URL should be shorter');
    // head = first 30 chars, tail = last 25 chars.
    assertEqual(out.startsWith(longUrl.substring(0, 30)), true, 'should keep the 30-char head');
    assertEqual(out.endsWith(longUrl.substring(longUrl.length - 25)), true, 'should keep the 25-char tail');
  });

  console.log('\n=== escHtml ===');

  test('escHtml escapes &, <, >, "', () => {
    assertEqual(escHtml('a & b < c > d "e"'), 'a &amp; b &lt; c &gt; d &quot;e&quot;');
  });

  test('escHtml returns empty string for null/undefined', () => {
    assertEqual(escHtml(null), '');
    assertEqual(escHtml(undefined), '');
  });

  // === renderMetaDiffBadges (bf-13re: meta-tag diff between hops) ===
  console.log('\n=== renderMetaDiffBadges (meta-tag diff badges) ===');

  test('null/undefined diff renders no badges', () => {
    assertEqual(renderMetaDiffBadges(null), '');
    assertEqual(renderMetaDiffBadges(undefined), '');
  });

  test('an empty diff (no changes) renders no badges', () => {
    assertEqual(renderMetaDiffBadges({ changed: [], added: [], removed: [] }), '');
    assertEqual(renderMetaDiffBadges({}), '');
  });

  test('stripped diff renders the "Meta tags stripped" warning badge', () => {
    const html = renderMetaDiffBadges({ stripped: true });
    assertContains(html, 'hop-meta-badge', 'should render a badge');
    assertContains(html, 'stripped', 'badge should carry the stripped class');
    assertContains(html, 'Meta tags stripped', 'should surface the headline text');
  });

  test('noindex-removed diff renders the noindex badge', () => {
    const html = renderMetaDiffBadges({ noindexRemoved: true });
    assertContains(html, 'hop-meta-badge');
    assertContains(html, 'noindex', 'badge should carry the noindex class');
    assertContains(html, 'noindex removed', 'should surface the noindex-removed text');
  });

  test('a changed/added/removed summary renders the changed badge', () => {
    const html = renderMetaDiffBadges({
      changed: [{ field: 'title', from: 'A', to: 'B' }],
      added: [{ field: 'og:image', value: 'https://x/y.png' }],
      removed: [],
    });
    assertContains(html, 'hop-meta-badge');
    assertContains(html, 'changed', 'badge should carry the changed class');
    assertContains(html, 'Meta diff:', 'should prefix the summary');
    assertContains(html, '1 changed', 'should count changed fields');
    assertContains(html, '1 added', 'should count added fields');
    // Removed count is omitted when zero.
    assertNotContains(html, 'removed');
  });

  test('the summary counts all three categories when present', () => {
    const html = renderMetaDiffBadges({
      changed: [{ field: 'a', from: '1', to: '2' }],
      added: [{ field: 'b', value: 'x' }],
      removed: [{ field: 'c', value: 'y' }],
    });
    assertContains(html, '1 changed');
    assertContains(html, '1 added');
    assertContains(html, '1 removed');
  });

  test('stripped suppresses the redundant changed/added/removed summary', () => {
    // When all tags are lost the headline "stripped" badge already tells the
    // story; the field-by-field summary should not also be rendered.
    const html = renderMetaDiffBadges({
      stripped: true,
      removed: [
        { field: 'title', value: 'Gone' },
        { field: 'description', value: 'Gone too' },
      ],
    });
    assertContains(html, 'Meta tags stripped');
    assertNotContains(html, 'Meta diff:', 'summary should be suppressed when stripped');
  });

  test('multiple badges stack together (stripped + noindex-removed)', () => {
    // Both flags can co-occur; both badges should render.
    const html = renderMetaDiffBadges({ stripped: true, noindexRemoved: true });
    assertContains(html, 'Meta tags stripped');
    assertContains(html, 'noindex removed');
  });

  // === diagram integration: badges appear on the right hop ===
  console.log('\n=== Diagram integration: meta-diff badges per hop ===');

  test('a hop with metaDiff renders its diff badges inside the diagram', () => {
    const chain = [
      hop('http://a.example/', 301, {
        redirectsTo: 'http://b.example/',
        metaDiff: { noindexRemoved: true },
      }),
      hop('http://b.example/', 200, {
        isFinal: true,
        metaDiff: {
          changed: [{ field: 'title', from: 'A', to: 'B' }],
          added: [],
          removed: [],
        },
      }),
    ];
    const html = buildRedirectChainDiagram(chain);
    assertContains(html, 'hop-meta-badges', 'badge container should be present');
    assertContains(html, 'noindex removed');
    assertContains(html, 'Meta diff:');
  });

  test('the stripped badge appears on the exact hop that lost its tags', () => {
    const chain = [
      hop('http://a.example/', 301, { redirectsTo: 'http://b.example/' }),
      hop('http://b.example/', 301, {
        redirectsTo: 'http://c.example/',
        metaDiff: { stripped: true },
      }),
      hop('http://c.example/', 200, { isFinal: true }),
    ];
    const html = buildRedirectChainDiagram(chain);
    assertEqual(countOf(html, 'Meta tags stripped'), 1, 'exactly one stripped badge');
  });

  test('hops with no metaDiff render no badge container', () => {
    const chain = [
      hop('http://a.example/', 301, { redirectsTo: 'http://b.example/' }),
      hop('http://b.example/', 200, { isFinal: true }),
    ];
    const html = buildRedirectChainDiagram(chain);
    assertNotContains(html, 'hop-meta-badges', 'no badge container when no diff');
    assertNotContains(html, 'hop-meta-badge');
  });

  // --- summary ---
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

runTests();
