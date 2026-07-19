'use strict';

/**
 * Unit tests for the client-side meta-tag diff (bf-4vcw).
 *
 * These exercise the pure helpers in src/public/client-side-diff.js — the
 * counted-multiset diff that verifyClientSideTags() in app.js relies on to
 * compare server-side rawTags (raw HTML, no JS) against browser-parsed DOM
 * meta tags (after JS executes). No DOM, no network.
 *
 * The previous implementation in app.js keyed two Maps on the tag name only,
 * which collapsed duplicates — so a JS-injected second og:image silently
 * matched the single server-side copy and went undetected. These tests lock
 * down the fixed behaviour:
 *   - diffClientSideTags() flags tags present only after JS (severity→error)
 *   - duplicate copies are counted, not collapsed
 *   - document-order differences never produce false positives
 *   - tags with changed values post-JS are flagged as differing
 *   - it consumes the rawTags shape produced by parseMetaTags()
 */

const {
  normalizeMetaTag,
  buildMetaMultiset,
  diffClientSideTags,
} = require('../../src/public/client-side-diff');

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
    passed++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${description}`);
    console.error(`      ${err.message}`);
  }
}

// A fake DOM element mirroring the subset normalizeMetaTag() touches. The real
// caller passes elements from querySelectorAll('meta[property], meta[name]');
// here we only need getAttribute().
function domMeta(attrs) {
  return {
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
  };
}

// rawTags object shape produced by parseMetaTags() in src/fetcher.js
function rawTag(property, content, name) {
  return { name: name || null, property: property || null, content };
}

// ---------------------------------------------------------------------------

console.log('\nclient-side-diff (bf-4vcw)\n');

test('normalizeMetaTag handles rawTags objects (parseMetaTags shape)', () => {
  const n = normalizeMetaTag(rawTag('og:title', 'Hello'));
  assertEqual(n.key, 'og:title');
  assertEqual(n.content, 'Hello');
});

test('normalizeMetaTag handles DOM elements (getAttribute shape)', () => {
  const n = normalizeMetaTag(domMeta({ property: 'og:image', content: 'a.jpg' }));
  assertEqual(n.key, 'og:image');
  assertEqual(n.content, 'a.jpg');
});

test('normalizeMetaTag falls back to name when property is absent', () => {
  const n = normalizeMetaTag(domMeta({ name: 'twitter:card', content: 'summary' }));
  assertEqual(n.key, 'twitter:card');
});

test('normalizeMetaTag ignores non-og/twitter tags', () => {
  assert(normalizeMetaTag(rawTag(null, 'width=device-width', 'viewport')) === null);
});

test('normalizeMetaTag ignores empty content (so it cannot mask an injection)', () => {
  assert(normalizeMetaTag(rawTag('og:image', '')) === null);
  assert(normalizeMetaTag(domMeta({ property: 'og:image', content: '' })) === null);
});

test('normalizeMetaTag lowercases the key', () => {
  const n = normalizeMetaTag(domMeta({ property: 'OG:TITLE', content: 'X' }));
  assertEqual(n.key, 'og:title');
});

// --- the core diff behaviour ------------------------------------------------

test('flags a tag present only client-side as clientOnly (the JS-injection case)', () => {
  const server = [rawTag('og:title', 'Static')];
  const client = [domMeta({ property: 'og:title', content: 'Static' }),
                  domMeta({ property: 'og:image', content: 'injected.jpg' })];
  const { clientOnlyTags, differingTags } = diffClientSideTags(server, client);
  assertEqual(clientOnlyTags.length, 1);
  assertEqual(clientOnlyTags[0].key, 'og:image');
  assertEqual(clientOnlyTags[0].value, 'injected.jpg');
  assertEqual(clientOnlyTags[0].count, 1);
  assertEqual(differingTags.length, 0);
});

test('does NOT flag tags that are identical on both sides', () => {
  const server = [rawTag('og:title', 'Hi'), rawTag('og:image', 'a.jpg')];
  const client = [domMeta({ property: 'og:image', content: 'a.jpg' }),
                  domMeta({ property: 'og:title', content: 'Hi' })];
  const { clientOnlyTags, differingTags } = diffClientSideTags(server, client);
  assertEqual(clientOnlyTags.length, 0);
  assertEqual(differingTags.length, 0);
});

// --- the bug this bead fixes: duplicates must be counted, not collapsed ------

test('detects a JS-injected DUPLICATE (server 1 / client 2 identical copies)', () => {
  // Old Map approach: both sides collapse to { 'og:image': 'a' } → no diff.
  // Multiset: client has 2, server has 1 → one extra copy appears post-JS.
  const server = [rawTag('og:image', 'a')];
  const client = [domMeta({ property: 'og:image', content: 'a' }),
                  domMeta({ property: 'og:image', content: 'a' })];
  const { clientOnlyTags, differingTags } = diffClientSideTags(server, client);
  assertEqual(clientOnlyTags.length, 0); // key exists server-side, so not "injected"
  assertEqual(differingTags.length, 1);
  assertEqual(differingTags[0].key, 'og:image');
  assertEqual(differingTags[0].count, 1); // the extra copy
});

test('does not flag duplicates when the extra copies are already server-side', () => {
  const server = [rawTag('og:image', 'a'), rawTag('og:image', 'a')];
  const client = [domMeta({ property: 'og:image', content: 'a' })];
  const { clientOnlyTags, differingTags } = diffClientSideTags(server, client);
  assertEqual(clientOnlyTags.length, 0);
  assertEqual(differingTags.length, 0);
});

// --- ordering must be irrelevant --------------------------------------------

test('order differences never produce findings', () => {
  const server = [rawTag('og:title', 'T'), rawTag('og:description', 'D'), rawTag('og:image', 'I')];
  const client = [domMeta({ property: 'og:image', content: 'I' }),
                  domMeta({ property: 'og:title', content: 'T' }),
                  domMeta({ property: 'og:description', content: 'D' })];
  const { clientOnlyTags, differingTags } = diffClientSideTags(server, client);
  assertEqual(clientOnlyTags.length, 0);
  assertEqual(differingTags.length, 0);
});

// --- value changes post-JS --------------------------------------------------

test('flags a value changed by JS as differing (not clientOnly)', () => {
  const server = [rawTag('og:title', 'Static')];
  const client = [domMeta({ property: 'og:title', content: 'Dynamic' })];
  const { clientOnlyTags, differingTags } = diffClientSideTags(server, client);
  assertEqual(clientOnlyTags.length, 0); // key exists server-side
  assertEqual(differingTags.length, 1);
  assertEqual(differingTags[0].value, 'Dynamic');
});

// --- edge cases / robustness ------------------------------------------------

test('returns empty results for empty inputs', () => {
  assertEqual(diffClientSideTags([], []).clientOnlyTags.length, 0);
  assertEqual(diffClientSideTags([], []).differingTags.length, 0);
});

test('handles null/undefined inputs without throwing', () => {
  const r = diffClientSideTags(null, null);
  assertEqual(r.clientOnlyTags.length, 0);
  assertEqual(r.differingTags.length, 0);
});

test('buildMetaMultiset counts per (key, content) pair', () => {
  const ms = buildMetaMultiset([
    rawTag('og:image', 'a'),
    rawTag('og:image', 'a'),
    rawTag('og:image', 'b'),
  ]);
  assertEqual(ms.size, 2); // two distinct (key, content) pairs
  // Inspect by value rather than guessing the internal map key format.
  const entries = Array.from(ms.values());
  const pairA = entries.find(e => e.key === 'og:image' && e.content === 'a');
  const pairB = entries.find(e => e.key === 'og:image' && e.content === 'b');
  assert(pairA, 'expected a counted entry for og:image=a');
  assert(pairB, 'expected a counted entry for og:image=b');
  assertEqual(pairA.count, 2);
  assertEqual(pairB.count, 1);
});

test('buildMetaMultiset keeps distinct contents separate even with a space in one', () => {
  // A NUL separator (not a space) means 'og:image' + 'a b' must not collide
  // with 'og:image a' + 'b'. Both should survive as their own counted pairs.
  const ms = buildMetaMultiset([
    rawTag('og:image', 'a b'),
    rawTag('og:image a', 'b'),
  ]);
  assertEqual(ms.size, 2);
});

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
