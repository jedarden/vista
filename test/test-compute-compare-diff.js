'use strict';

/**
 * Unit tests for computeCompareDiff function (bf-3kwc).
 *
 * Tests the main diff computation function that compares two /api/compare
 * response objects and returns structured diff results.
 */

const { computeCompareDiff, toPlatformMetadata, extractPlatformScores } = require('../src/comparators/computeCompareDiff.js');

// --- assertion helpers ---

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

function assertSetEqual(setA, setB, msg) {
  const arrA = Array.from(setA).sort();
  const arrB = Array.from(setB).sort();
  if (JSON.stringify(arrA) !== JSON.stringify(arrB)) {
    throw new Error(
      (msg || 'assertSetEqual failed') +
        ` — expected ${JSON.stringify(arrB)}, got ${JSON.stringify(arrA)}`
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

// --- test helpers ---

function createPlatformScore(platformId, overrides = {}) {
  return {
    grade: 'A',
    score: 100,
    issues: [],
    fixes: [],
    platform: {
      id: platformId,
      name: `Platform ${platformId}`,
      category: 'social',
      weight: 1,
      ...overrides.platform
    },
    ...overrides
  };
}

function createCompareResponse(scores) {
  return {
    scoring: {
      scores: scores
    }
  };
}

function createErrorResponse() {
  return { error: 'Failed to fetch', url: 'https://example.com' };
}

// --- tests ---

console.log('\ncomputeCompareDiff tests (bf-3kwc)\n');

// Test toPlatformMetadata
test('toPlatformMetadata transforms PlatformScore correctly', () => {
  const score = createPlatformScore('twitter', { grade: 'B', score: 85 });
  const meta = toPlatformMetadata(score);

  assertEqual(meta.platformId, 'twitter');
  assertEqual(meta.platformName, 'Platform twitter');
  assertEqual(meta.category, 'social');
  assertEqual(meta.grade, 'B');
  assertEqual(meta.score, 85);
});

test('toPlatformMetadata handles null input', () => {
  const meta = toPlatformMetadata(null);
  assertEqual(meta, null);
});

test('toPlatformMetadata handles missing platform', () => {
  const score = { grade: 'A', score: 100 };
  const meta = toPlatformMetadata(score);
  assertEqual(meta, null);
});

// Test extractPlatformScores
test('extractPlatformScores extracts scores from successful response', () => {
  const response = createCompareResponse({
    twitter: createPlatformScore('twitter'),
    facebook: createPlatformScore('facebook')
  });
  const scores = extractPlatformScores(response);

  assertEqual(Object.keys(scores).length, 2);
  assert(scores.twitter !== undefined);
  assert(scores.facebook !== undefined);
});

test('extractPlatformScores returns empty object for error response', () => {
  const response = createErrorResponse();
  const scores = extractPlatformScores(response);

  assertEqual(Object.keys(scores).length, 0);
});

test('extractPlatformScores handles null input', () => {
  const scores = extractPlatformScores(null);
  assertEqual(Object.keys(scores).length, 0);
});

// Test computeCompareDiff with identical platforms
test('computeCompareDiff identifies identical platforms', () => {
  const responseA = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 })
  });
  const responseB = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 })
  });

  const diff = computeCompareDiff(responseA, responseB);

  assertSetEqual(diff.identicalPlatforms, new Set(['twitter']));
  assertEqual(diff.changedFields.size, 0);
  assertEqual(diff.missingTags.size, 0);
});

// Test computeCompareDiff with changed fields
test('computeCompareDiff detects changed grade', () => {
  const responseA = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 })
  });
  const responseB = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'B', score: 80 })
  });

  const diff = computeCompareDiff(responseA, responseB);

  assertEqual(diff.identicalPlatforms.size, 0);
  assert(diff.changedFields.has('twitter'));
  const fields = diff.changedFields.get('twitter');
  assert(fields.includes('grade') || fields.includes('score'));
});

// Test computeCompareDiff with missing tags
test('computeCompareDiff detects missing tags from issues', () => {
  const responseA = createCompareResponse({
    twitter: createPlatformScore('twitter', {
      issues: ['og:title missing', 'og:image missing']
    })
  });
  const responseB = createCompareResponse({
    twitter: createPlatformScore('twitter', {
      issues: ['og:title missing']
    })
  });

  const diff = computeCompareDiff(responseA, responseB);

  assert(diff.missingTags.has('twitter'));
  const tags = diff.missingTags.get('twitter');
  assert(tags.includes('og:image'));
});

// Test computeCompareDiff with platforms only in A
test('computeCompareDiff handles platforms only in response A', () => {
  const responseA = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 })
  });
  const responseB = createCompareResponse({});

  const diff = computeCompareDiff(responseA, responseB);

  assertEqual(diff.identicalPlatforms.size, 0);
  assert(diff.changedFields.has('twitter'));
  // Platform exists in A but not B should be treated as a change
  const fields = diff.changedFields.get('twitter');
  assert(fields.length > 0);
});

// Test computeCompareDiff with platforms only in B
test('computeCompareDiff handles platforms only in response B', () => {
  const responseA = createCompareResponse({});
  const responseB = createCompareResponse({
    facebook: createPlatformScore('facebook', { grade: 'A', score: 100 })
  });

  const diff = computeCompareDiff(responseA, responseB);

  assertEqual(diff.identicalPlatforms.size, 0);
  assert(diff.changedFields.has('facebook'));
  const fields = diff.changedFields.get('facebook');
  assert(fields.length > 0);
});

// Test computeCompareDiff with error responses
test('computeCompareDiff handles error response in A', () => {
  const responseA = createErrorResponse();
  const responseB = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 })
  });

  const diff = computeCompareDiff(responseA, responseB);

  assertEqual(diff.identicalPlatforms.size, 0);
  assert(diff.changedFields.has('twitter'));
  const fields = diff.changedFields.get('twitter');
  assert(fields.length > 0);
});

test('computeCompareDiff handles error response in B', () => {
  const responseA = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 })
  });
  const responseB = createErrorResponse();

  const diff = computeCompareDiff(responseA, responseB);

  assertEqual(diff.identicalPlatforms.size, 0);
  assert(diff.changedFields.has('twitter'));
  const fields = diff.changedFields.get('twitter');
  assert(fields.length > 0);
});

// Test computeCompareDiff with multiple platforms
test('computeCompareDiff handles multiple platforms with mixed changes', () => {
  const responseA = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 }),
    facebook: createPlatformScore('facebook', { grade: 'A', score: 100 }),
    linkedin: createPlatformScore('linkedin', { grade: 'B', score: 80 })
  });
  const responseB = createCompareResponse({
    twitter: createPlatformScore('twitter', { grade: 'A', score: 100 }),
    facebook: createPlatformScore('facebook', { grade: 'B', score: 85 }),
    linkedin: createPlatformScore('linkedin', { grade: 'B', score: 80 })
  });

  const diff = computeCompareDiff(responseA, responseB);

  // twitter and linkedin should be identical
  assertSetEqual(diff.identicalPlatforms, new Set(['twitter', 'linkedin']));
  // facebook should have changes
  assert(diff.changedFields.has('facebook'));
});

// Test computeCompareDiff returns required structure
test('computeCompareDiff returns required structure', () => {
  const responseA = createCompareResponse({});
  const responseB = createCompareResponse({});
  const diff = computeCompareDiff(responseA, responseB);

  // Check return type structure
  assert(diff.identicalPlatforms instanceof Set, 'identicalPlatforms should be a Set');
  assert(diff.changedFields instanceof Map, 'changedFields should be a Map');
  assert(diff.missingTags instanceof Map, 'missingTags should be a Map');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
