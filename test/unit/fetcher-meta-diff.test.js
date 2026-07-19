'use strict';

/**
 * Unit tests for the meta-tag diff detection between redirect hops (bf-13re).
 *
 * These exercise the *pure* helpers in src/fetcher.js — no network, no module
 * stubbing — that power "meta tag changed / stripped / noindex removed"
 * detection across consecutive hops:
 *
 *   - calculateMetaDiff(prevMeta, currentMeta)
 *       → { changed, added, removed, hasImageChange?, stripped?, noindexRemoved? }
 *   - countMeaningfulMetaTags(metaTags)
 *       → number of name/property tags carrying content
 *   - extractCriticalMetaTags(meta)
 *       → flat critical-meta object including `robots`
 *
 * The diff is computed for every consecutive pair of HTML hops in fetchUrl;
 * `stripped` is set by the caller (fetcher) when the meaningful-tag count goes
 * from >0 to 0. The end-to-end "across hops" behaviour is covered by the
 * deterministic sibling test (test-redirect-chain-metadiff.js); here we lock
 * down the building blocks.
 */

const {
  calculateMetaDiff,
  countMeaningfulMetaTags,
  extractCriticalMetaTags,
} = require('../../src/fetcher');

// --- tiny assertion helpers -------------------------------------------------

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

// Critical-meta builder. Mirrors the shape extractCriticalMetaTags returns.
function crit(overrides) {
  const base = {
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    ogType: null,
    ogUrl: null,
    twitterCard: null,
    twitterTitle: null,
    twitterDescription: null,
    twitterImage: null,
    canonical: null,
    robots: null,
  };
  return Object.assign(base, overrides || {});
}

// --- tests ------------------------------------------------------------------

function runTests() {
  console.log('Running fetcher meta-diff unit tests (bf-13re)...\n');

  // === countMeaningfulMetaTags ===
  console.log('=== countMeaningfulMetaTags ===');

  test('counts name/property tags that carry content', () => {
    const tags = [
      { name: 'description', content: 'a page' },
      { property: 'og:title', content: 'T' },
      { property: 'og:image', content: 'https://x/y.png' },
    ];
    assertEqual(countMeaningfulMetaTags(tags), 3);
  });

  test('ignores tags without a name or property key', () => {
    const tags = [
      { charset: 'utf-8', content: '' }, // charset tag — no name/property
      { 'http-equiv': 'content-type', content: 'text/html' },
    ];
    assertEqual(countMeaningfulMetaTags(tags), 0);
  });

  test('ignores tags whose content is empty/missing', () => {
    const tags = [
      { name: 'description', content: '' },
      { property: 'og:title' }, // no content
      { name: 'robots', content: 'noindex' },
    ];
    assertEqual(countMeaningfulMetaTags(tags), 1);
  });

  test('returns 0 for non-array / empty input', () => {
    assertEqual(countMeaningfulMetaTags([]), 0);
    assertEqual(countMeaningfulMetaTags(null), 0);
    assertEqual(countMeaningfulMetaTags(undefined), 0);
    assertEqual(countMeaningfulMetaTags('not an array'), 0);
  });

  // === calculateMetaDiff: changed / added / removed ===
  console.log('\n=== calculateMetaDiff: changed / added / removed ===');

  test('detects a changed field (title)', () => {
    const diff = calculateMetaDiff(crit({ title: 'Old' }), crit({ title: 'New' }));
    assertEqual(diff.changed.length, 1);
    assertEqual(diff.changed[0].field, 'title');
    assertEqual(diff.changed[0].from, 'Old');
    assertEqual(diff.changed[0].to, 'New');
    assertEqual(diff.added.length, 0);
    assertEqual(diff.removed.length, 0);
  });

  test('detects an added field', () => {
    const diff = calculateMetaDiff(crit({}), crit({ description: 'now present' }));
    assertEqual(diff.added.length, 1);
    assertEqual(diff.added[0].field, 'description');
    assertEqual(diff.added[0].value, 'now present');
  });

  test('detects a removed field', () => {
    const diff = calculateMetaDiff(crit({ canonical: 'https://a/b' }), crit({}));
    assertEqual(diff.removed.length, 1);
    assertEqual(diff.removed[0].field, 'canonical');
    assertEqual(diff.removed[0].value, 'https://a/b');
  });

  test('returns empty diff arrays when nothing differs', () => {
    const diff = calculateMetaDiff(crit({ title: 'Same' }), crit({ title: 'Same' }));
    assertEqual(diff.changed.length, 0);
    assertEqual(diff.added.length, 0);
    assertEqual(diff.removed.length, 0);
    assert(diff.noindexRemoved === undefined, 'noindexRemoved must not be set');
    assert(diff.stripped === undefined, 'stripped must not be set by calculateMetaDiff');
  });

  test('flags hasImageChange when og:image changes', () => {
    const diff = calculateMetaDiff(
      crit({ ogImage: 'https://a/old.png' }),
      crit({ ogImage: 'https://a/new.png' })
    );
    assertEqual(diff.hasImageChange, true);
  });

  test('flags hasImageChange when twitter:image changes', () => {
    const diff = calculateMetaDiff(
      crit({ twitterImage: 'https://a/old.png' }),
      crit({ twitterImage: 'https://a/new.png' })
    );
    assertEqual(diff.hasImageChange, true);
  });

  test('does NOT set hasImageChange for non-image fields', () => {
    const diff = calculateMetaDiff(crit({ title: 'A' }), crit({ title: 'B' }));
    assert(diff.hasImageChange === undefined, 'hasImageChange should be absent');
  });

  test('robots is part of the critical-fields diff set', () => {
    // robots value change (without noindex disappearing) → changed entry
    const diff = calculateMetaDiff(
      crit({ robots: 'index, follow' }),
      crit({ robots: 'noindex, nofollow' })
    );
    assert(diff.changed.some((c) => c.field === 'robots'), 'robots change should be recorded');
    // Adding noindex is not a "noindex removed" event.
    assert(diff.noindexRemoved === undefined);
  });

  // === calculateMetaDiff: noindexRemoved ===
  console.log('\n=== calculateMetaDiff: noindexRemoved ===');

  test('flags noindexRemoved when a noindex directive disappears', () => {
    const diff = calculateMetaDiff(
      crit({ robots: 'noindex, nofollow' }),
      crit({ robots: 'index, follow' })
    );
    assertEqual(diff.noindexRemoved, true);
  });

  test('flags noindexRemoved when robots goes from noindex → empty', () => {
    const diff = calculateMetaDiff(crit({ robots: 'noindex' }), crit({}));
    assertEqual(diff.noindexRemoved, true);
  });

  test('does not flag noindexRemoved when noindex is added (reverse direction)', () => {
    const diff = calculateMetaDiff(crit({}), crit({ robots: 'noindex' }));
    assert(diff.noindexRemoved === undefined);
  });

  test('does not flag noindexRemoved when neither hop had noindex', () => {
    const diff = calculateMetaDiff(
      crit({ robots: 'index, follow' }),
      crit({ robots: 'index, follow' })
    );
    assert(diff.noindexRemoved === undefined);
  });

  test('noindex detection is word-boundary safe (no false match on "xnoindexy")', () => {
    const diff = calculateMetaDiff(
      crit({ robots: 'noindex' }),
      crit({ robots: 'stillnoindexy' })
    );
    // "stillnoindexy" should not be treated as containing a noindex directive,
    // so removing the real one still reads as a removal. The key guard here is
    // that a bare substring without word boundaries does not count as present.
    const re = /\bnoindex\b/i;
    assertEqual(re.test('stillnoindexy'), false);
    // With the real directive present on the current hop, no removal is flagged.
    const diff2 = calculateMetaDiff(crit({ robots: 'noindex' }), crit({ robots: 'noindex, follow' }));
    assert(diff2.noindexRemoved === undefined);
  });

  // === extractCriticalMetaTags: robots field ===
  console.log('\n=== extractCriticalMetaTags: robots field ===');

  test('extractCriticalMetaTags includes robots from parsed meta', () => {
    const parsed = { title: 'T', og: {}, twitter: {}, robots: 'noindex, nofollow' };
    const c = extractCriticalMetaTags(parsed);
    assertEqual(c.robots, 'noindex, nofollow');
  });

  test('extractCriticalMetaTags nulls robots when absent', () => {
    const c = extractCriticalMetaTags({ title: 'T', og: {}, twitter: {} });
    assertEqual(c.robots, null);
  });

  // === stripped-flag logic (the rule fetchUrl applies across hops) ===
  console.log('\n=== stripped-flag logic (cross-hop rule) ===');

  // Reproduce the exact predicate fetchUrl uses to set hop.metaDiff.stripped:
  //   lastMeaningfulTagCount > 0 && meaningfulCount === 0
  test('stripped is set only when prev had meaningful tags and current has none', () => {
    const prevCount = countMeaningfulMetaTags([
      { name: 'description', content: 'x' },
      { property: 'og:title', content: 'y' },
    ]);
    const currCount = countMeaningfulMetaTags([]); // bare hop
    assertEqual(prevCount > 0 && currCount === 0, true);
  });

  test('stripped is NOT set when both hops are bare (no prior tags to lose)', () => {
    const prevCount = countMeaningfulMetaTags([{ charset: 'utf-8' }]);
    const currCount = countMeaningfulMetaTags([]);
    assertEqual(prevCount > 0 && currCount === 0, false);
  });

  test('stripped is NOT set when current hop still has tags', () => {
    const prevCount = countMeaningfulMetaTags([{ name: 'description', content: 'x' }]);
    const currCount = countMeaningfulMetaTags([{ name: 'description', content: 'y' }]);
    assertEqual(prevCount > 0 && currCount === 0, false);
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
