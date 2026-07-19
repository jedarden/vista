'use strict';

/**
 * Unit tests for the platform redirect-behavior renderer
 * (src/public/platform-redirect-view.js) — bf-4kts.
 *
 * The module is pure (no DOM), so it is exercised directly in Node. Covers the
 * acceptance criteria:
 *   - hop-count warnings when the chain meets/exceeds the common platform limit
 *   - 301 vs 302 caching behavior warnings
 *   - "Platform view" section: meta tags each platform sees given its behavior
 *   - platform-specific give-up marker integrated into the chain diagram
 *   - documented limits for Twitter/X, LinkedIn, Facebook, iMessage, Slack, Discord
 *   - exercised with long redirect chains (5+ hops)
 */

const {
  chainRedirectCount,
  chainExceedsCommonLimit,
  chainAtCommonLimit,
  commonGiveupLandingIndex,
  getPlatformLanding,
  distinctRedirectStatuses,
  summarizeHopMeta,
  renderPlatformRedirectBanner,
  renderPlatformView,
  renderHopGiveupNote,
  renderLandingMetaSummary,
  COMMON_GIVEUP_LIMIT,
} = require('../../src/public/platform-redirect-view');
const { PLATFORMS } = require('../../src/public/platform-redirect-data');
const { buildRedirectChainDiagram } = require('../../src/public/redirect-diagram');

// --- tiny assertion helpers (mirrors redirect-diagram.test.js) ---------------

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

// --- fixtures ----------------------------------------------------------------

// Minimal hop factory matching src/fetcher.js hop shape.
function hop(url, statusCode, extra) {
  return Object.assign({ url, statusCode }, extra || {});
}

// Build a chain of `n` hops (n-1 redirects), all 301 except a 200 final.
function chainOf(n, opts) {
  opts = opts || {};
  const out = [];
  for (let i = 0; i < n; i++) {
    const isFinal = i === n - 1;
    out.push(
      hop(`http://example.com/hop${i + 1}`, isFinal ? 200 : 301, {
        isFinal,
        redirectsTo: isFinal ? undefined : `http://example.com/hop${i + 2}`,
        meta: opts.metaFor && opts.metaFor(i),
      })
    );
  }
  return out;
}

// --- runner ------------------------------------------------------------------

function runTests() {
  console.log('Running platform-redirect-view unit tests...\n');
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

  // === documented platform data is present ===
  console.log('=== Documented platform limits ===');

  test('all six acceptance platforms are documented', () => {
    const ids = PLATFORMS.map((p) => p.id).sort();
    assertEqual(
      ids.join(','),
      'discord,facebook,imessage,linkedin,slack,twitter',
      'expected the six documented crawlers'
    );
  });

  test('every platform carries a maxRedirects, confidence, and source', () => {
    for (const p of PLATFORMS) {
      assert(typeof p.maxRedirects === 'number' && p.maxRedirects > 0, `${p.id} needs maxRedirects`);
      assert(['documented', 'observed', 'low'].includes(p.confidence), `${p.id} bad confidence`);
      assert(typeof p.source === 'string' && p.source.length > 0, `${p.id} needs a source`);
    }
  });

  test('twitter documents the t.co wrapper (extraRedirects)', () => {
    const tw = PLATFORMS.find((p) => p.id === 'twitter');
    assertEqual(tw.extraRedirects, 1, 't.co adds one front hop');
  });

  // === redirect-count math ===
  console.log('\n=== Redirect-count math ===');

  test('chainRedirectCount: 0 for empty/single-hop, N-1 otherwise', () => {
    assertEqual(chainRedirectCount([]), 0);
    assertEqual(chainRedirectCount([hop('http://x/', 200, { isFinal: true })]), 0);
    assertEqual(chainRedirectCount(chainOf(2)), 1);
    assertEqual(chainRedirectCount(chainOf(7)), 6);
  });

  test(`COMMON_GIVEUP_LIMIT is ${COMMON_GIVEUP_LIMIT} (the headline number)`, () => {
    assertEqual(COMMON_GIVEUP_LIMIT, 5);
  });

  test('chainExceedsCommonLimit / chainAtCommonLimit boundaries', () => {
    // 5 hops = 4 redirects: neither at nor exceeding.
    assertEqual(chainExceedsCommonLimit(chainOf(5)), false);
    assertEqual(chainAtCommonLimit(chainOf(5)), false);
    // 6 hops = 5 redirects: exactly at the limit.
    assertEqual(chainAtCommonLimit(chainOf(6)), true);
    assertEqual(chainExceedsCommonLimit(chainOf(6)), false);
    // 7 hops = 6 redirects: exceeds.
    assertEqual(chainExceedsCommonLimit(chainOf(7)), true);
    assertEqual(chainAtCommonLimit(chainOf(7)), false);
  });

  test('commonGiveupLandingIndex caps at the limit and clamps to the last hop', () => {
    // Short chain: a 5-redirect client reaches the final → clamp to last index.
    assertEqual(commonGiveupLandingIndex(chainOf(4)), 3);
    // Long chain (6 redirects): stops at index 5 (the 6th hop).
    assertEqual(commonGiveupLandingIndex(chainOf(7)), 5);
    assertEqual(commonGiveupLandingIndex([]), 0);
  });

  // === per-platform landing ===
  console.log('\n=== Per-platform landing (getPlatformLanding) ===');

  test('Facebook (~5) reaches the final page on a short chain', () => {
    const landing = getPlatformLanding(chainOf(4), { maxRedirects: 5 });
    assertEqual(landing.reachedFinal, true);
    assertEqual(landing.landingIndex, 3);
    assertEqual(landing.atLimit, false, '3 redirects is well under 5');
  });

  test('Facebook (~5) reaches the final page AT the limit (5 redirects)', () => {
    const landing = getPlatformLanding(chainOf(6), { maxRedirects: 5 });
    assertEqual(landing.reachedFinal, true);
    assertEqual(landing.atLimit, true, 'exactly 5 redirects = at the cap');
    assertEqual(landing.effectiveRedirectCount, 5);
  });

  test('Facebook (~5) GIVES UP on a 7-hop chain, landing one hop short', () => {
    const landing = getPlatformLanding(chainOf(7), { maxRedirects: 5 });
    assertEqual(landing.reachedFinal, false);
    assertEqual(landing.landingIndex, 5, 'lands on the 6th hop, not the 7th');
    assertEqual(landing.redirectCount, 6);
  });

  test('t.co wrapper makes Twitter give up EARLIER than Facebook', () => {
    const chain = chainOf(7); // 6 redirects
    const fb = getPlatformLanding(chain, { maxRedirects: 5 });
    const tw = getPlatformLanding(chain, { maxRedirects: 5, extraRedirects: 1 });
    assertEqual(fb.landingIndex, 5);
    assertEqual(tw.landingIndex, 4, 't.co +1 pushes Twitter to stop one hop earlier');
    assertEqual(tw.effectiveRedirectCount, 7);
    assertEqual(tw.reachedFinal, false);
  });

  test('a forgiving crawler (Slack ~20) reaches the final page on long chains', () => {
    const landing = getPlatformLanding(chainOf(7), { maxRedirects: 20 });
    assertEqual(landing.reachedFinal, true);
    assertEqual(landing.landingIndex, 6);
  });

  test('getPlatformLanding does not crash on an empty chain', () => {
    const landing = getPlatformLanding([], { maxRedirects: 5 });
    assertEqual(landing.landingIndex, 0);
  });

  // === distinctRedirectStatuses ===
  console.log('\n=== distinctRedirectStatuses ===');

  test('dedupes redirect codes, skips 304/2xx/4xx, preserves first-seen order', () => {
    const chain = [
      hop('http://a/', 301),
      hop('http://b/', 302),
      hop('http://c/', 301), // dup
      hop('http://d/', 304), // not a redirect — skipped
      hop('http://e/', 200, { isFinal: true }),
    ];
    assertEqual(JSON.stringify(distinctRedirectStatuses(chain)), '[301,302]');
  });

  // === summarizeHopMeta ===
  console.log('\n=== summarizeHopMeta ===');

  test('null/empty meta → null', () => {
    assertEqual(summarizeHopMeta(null), null);
    assertEqual(summarizeHopMeta(undefined), null);
    assertEqual(summarizeHopMeta({}), null);
  });

  test('meta with title + og:image is summarized with flags + tag count', () => {
    const s = summarizeHopMeta({ title: 'Hi', ogImage: 'http://x/i.png', ogTitle: 'Hi' });
    assertEqual(s.title, 'Hi');
    assertEqual(s.hasOgImage, true);
    assertEqual(s.hasTwitterImage, false);
    assertEqual(s.tagCount, 3);
  });

  // === banner: hop-count + caching ===
  console.log('\n=== renderPlatformRedirectBanner ===');

  test('no banner for a chain with no redirects', () => {
    assertEqual(renderPlatformRedirectBanner([]), '');
    assertEqual(
      renderPlatformRedirectBanner([hop('http://x/', 200, { isFinal: true })]),
      ''
    );
  });

  test('a short chain (1 redirect) shows a caching note but NO hop-count warning', () => {
    const html = renderPlatformRedirectBanner([
      hop('http://a/', 301, { redirectsTo: 'http://b/' }),
      hop('http://b/', 200, { isFinal: true }),
    ]);
    assertContains(html, 'platform-banner');
    assertContains(html, 'Redirect caching:');
    assertContains(html, '301 Permanent');
    assertNotContains(html, 'exceeds the common');
    assertNotContains(html, 'right at the common');
  });

  test('a chain AT the limit (5 redirects) shows a CAUTION hop-count row', () => {
    const html = renderPlatformRedirectBanner(chainOf(6));
    assertContains(html, 'platform-banner-row caution');
    assertContains(html, 'right at the common');
    assertContains(html, '5 redirects');
    assertNotContains(html, 'exceeds the common');
  });

  test('a chain EXCEEDING the limit (6 redirects) shows a WARN hop-count row', () => {
    const html = renderPlatformRedirectBanner(chainOf(7));
    assertContains(html, 'platform-banner-row warn');
    assertContains(html, 'exceeds the common');
    assertContains(html, '6 redirects');
    assertContains(html, 'give up before your final page');
  });

  test('301 vs 302 caching differences are both surfaced when both codes appear', () => {
    const chain = [
      hop('http://a/', 301, { redirectsTo: 'http://b/' }),
      hop('http://b/', 302, { redirectsTo: 'http://c/' }),
      hop('http://c/', 200, { isFinal: true }),
    ];
    const html = renderPlatformRedirectBanner(chain);
    assertContains(html, '301 Permanent');
    assertContains(html, 'Cached aggressively'); // 301 detail
    assertContains(html, '302 Temporary');
    assertContains(html, 'Not cached by default'); // 302 detail
    // Code chips reuse the diagram status-badge classes for color consistency.
    assertContains(html, 'hop-status s301');
    assertContains(html, 'hop-status s302');
  });

  // === platform view section ===
  console.log('\n=== renderPlatformView ===');

  test('no section for a chain with no redirects', () => {
    assertEqual(renderPlatformView([]), '');
  });

  test('7-hop chain renders the heading + one card per documented platform', () => {
    const html = renderPlatformView(chainOf(7));
    assertContains(html, 'Platform view — what each crawler sees');
    assertContains(html, 'platform-view-grid');
    // One card per platform in PLATFORMS.
    assertEqual(countOf(html, 'class="platform-view-card'), PLATFORMS.length);
    // Intro states the redirect count.
    assertContains(html, '6 redirects');
  });

  test('cards show the right outcome: Facebook gives up, Slack reaches final', () => {
    const html = renderPlatformView(chainOf(7));
    assertContains(html, 'Gives up'); // at least one platform gives up
    assertContains(html, 'Reaches final'); // at least one reaches
    assertContains(html, 'platform-view-card givesup');
    assertContains(html, 'platform-view-card reaches');
  });

  test('Twitter card notes the t.co wrapper (+1) and gives up earlier', () => {
    const html = renderPlatformView(chainOf(7));
    assertContains(html, "platform's URL wrapper");
    assertContains(html, 'Crawler:'); // bot line on every card
  });

  test('confidence + source provenance is surfaced per platform', () => {
    const html = renderPlatformView(chainOf(7));
    assertContains(html, 'pvc-confidence');
    // every confidence value present in the data appears
    for (const p of PLATFORMS) {
      assertContains(html, p.confidence, `missing confidence ${p.confidence}`);
    }
  });

  test('landing meta summary: hop with meta shows title + og:image flag + count', () => {
    const chain = chainOf(7, {
      metaFor: (i) =>
        i === 5 ? { title: 'Intermediate Hop Six', ogImage: 'http://x/i.png' } : undefined,
    });
    const html = renderLandingMetaSummary(chain, 5);
    assertContains(html, 'Sees:');
    assertContains(html, 'Intermediate Hop Six');
    assertContains(html, 'og:image ✓');
    assertContains(html, '2 tags');
  });

  test('landing meta summary: bare-redirect hop shows the muted "no preview" note', () => {
    const chain = chainOf(7); // no meta on any hop
    const html = renderLandingMetaSummary(chain, 5);
    assertContains(html, 'No previewable meta tags');
    assertContains(html, 'muted');
  });

  // === in-diagram give-up marker ===
  console.log('\n=== renderHopGiveupNote (in-diagram marker) ===');

  test('no marker on a chain that does not exceed the limit', () => {
    for (let i = 0; i < 6; i++) {
      assertEqual(renderHopGiveupNote({}, i, chainOf(6)), '', `hop ${i} should have no marker`);
    }
  });

  test('marker appears exactly once, on the give-up hop, with correct hop numbering', () => {
    const chain = chainOf(7);
    let notes = 0;
    let noteIndex = -1;
    for (let i = 0; i < chain.length; i++) {
      const html = renderHopGiveupNote({}, i, chain);
      if (html) {
        notes++;
        noteIndex = i;
      }
    }
    assertEqual(notes, 1, 'exactly one give-up marker');
    assertEqual(noteIndex, 5, 'marker on the 6th hop (index 5)');
    const html = renderHopGiveupNote({}, 5, chain);
    assertContains(html, 'Common platform give-up point');
    assertContains(html, 'hop 6 of 7');
  });

  test('the marker is integrated into the rendered chain diagram', () => {
    const chain = chainOf(7);
    const html = buildRedirectChainDiagram(chain, { renderHopNote: renderHopGiveupNote });
    assertContains(html, 'hop-giveup-note');
    assertEqual(countOf(html, 'Common platform give-up point'), 1);
  });

  test('a non-exceeding diagram renders no give-up marker even with the callback', () => {
    const chain = chainOf(4);
    const html = buildRedirectChainDiagram(chain, { renderHopNote: renderHopGiveupNote });
    assertNotContains(html, 'hop-giveup-note');
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
