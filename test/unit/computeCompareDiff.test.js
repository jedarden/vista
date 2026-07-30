#!/usr/bin/env node

/**
 * Comprehensive test suite for computeCompareDiff function (bf-263q)
 *
 * Tests edge case handling and validation for diff computation:
 * 1. Platforms present in A but missing in B (and vice versa)
 * 2. Null/undefined metadata fields
 * 3. Empty or malformed tag arrays
 * 4. Validation tests for the diff output
 */

const { computeCompareDiff, toPlatformMetadata, extractPlatformScores } = require('../../src/comparators/computeCompareDiff.js');

let failed = 0;
function check(name, condition) {
  if (condition) {
    console.log('  ✓ PASS: ' + name);
  } else {
    console.log('  ✗ FAIL: ' + name);
    failed++;
  }
}

function arrayEquals(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

function setEquals(setA, setB) {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

function mapEquals(mapA, mapB) {
  if (mapA.size !== mapB.size) return false;
  for (const [key, valA] of mapA) {
    if (!mapB.has(key)) return false;
    const valB = mapB.get(key);
    if (!arrayEquals(valA, valB)) return false;
  }
  return true;
}

// Helper to create a mock platform score
function mockPlatformScore(platformId, overrides = {}) {
  return {
    platform: {
      id: platformId,
      name: `Platform ${platformId}`,
      category: 'Test Category',
      weight: 1.0
    },
    grade: 'A',
    score: 85,
    issues: [],
    fixes: [],
    ...overrides
  };
}

// Helper to create a mock response
function mockResponse(scores = {}) {
  return {
    scoring: {
      scores: scores
    }
  };
}

console.log('=== computeCompareDiff Edge Case Tests (bf-263q) ===\n');

// ============================================================================
// Test 1: Platforms present in A but missing in B (and vice versa)
// ============================================================================
console.log('Test 1: Platforms present in A but missing in B (and vice versa)');

const platformA = mockPlatformScore('twitter', { grade: 'A', score: 90 });
const platformB = mockPlatformScore('facebook', { grade: 'B', score: 75 });

const responseA = mockResponse({ twitter: platformA });
const responseB = mockResponse({ facebook: platformB });

const diff1 = computeCompareDiff(responseA, responseB);

check('twitter not in identicalPlatforms (removed)', !diff1.identicalPlatforms.has('twitter'));
check('facebook not in identicalPlatforms (added)', !diff1.identicalPlatforms.has('facebook'));
check('twitter in changedFields (removed)', diff1.changedFields.has('twitter'));
check('facebook in changedFields (added)', diff1.changedFields.has('facebook'));

// Test platform only in A
const responseOnlyA = mockResponse({ linkedin: mockPlatformScore('linkedin') });
const emptyResponse = mockResponse({});

const diffOnlyA = computeCompareDiff(responseOnlyA, emptyResponse);
check('linkedin detected as changed when only in A', diffOnlyA.changedFields.has('linkedin'));
check('linkedin not in identicalPlatforms', !diffOnlyA.identicalPlatforms.has('linkedin'));

// Test platform only in B
const diffOnlyB = computeCompareDiff(emptyResponse, responseOnlyA);
check('linkedin detected as changed when only in B', diffOnlyB.changedFields.has('linkedin'));
check('linkedin not in identicalPlatforms', !diffOnlyB.identicalPlatforms.has('linkedin'));

// ============================================================================
// Test 2: Null/undefined metadata fields
// ============================================================================
console.log('\nTest 2: Null/undefined metadata fields');

// Test null response
const diffNullA = computeCompareDiff(null, mockResponse({ twitter: platformA }));
check('null first response handled gracefully', diffNullA !== null);
check('null first response returns empty identicalPlatforms', diffNullA.identicalPlatforms.size === 0);

const diffNullB = computeCompareDiff(mockResponse({ twitter: platformA }), null);
check('null second response handled gracefully', diffNullB !== null);
check('null second response returns empty identicalPlatforms', diffNullB.identicalPlatforms.size === 0);

// Test undefined response
const diffUndefinedA = computeCompareDiff(undefined, mockResponse({ twitter: platformA }));
check('undefined first response handled gracefully', diffUndefinedA !== null);

const diffUndefinedB = computeCompareDiff(mockResponse({ twitter: platformA }), undefined);
check('undefined second response handled gracefully', diffUndefinedB !== null);

// Test both null/undefined
const diffBothNull = computeCompareDiff(null, null);
check('both null responses returns empty identicalPlatforms', diffBothNull.identicalPlatforms.size === 0);

const diffBothUndefined = computeCompareDiff(undefined, undefined);
check('both undefined responses returns empty identicalPlatforms', diffBothUndefined.identicalPlatforms.size === 0);

// Test platform with null/undefined fields
const platformWithNulls = mockPlatformScore('twitter', {
  grade: null,
  score: null,
  issues: null,
  fixes: null
});

const responseWithNulls = mockResponse({ twitter: platformWithNulls });
const diffWithNulls = computeCompareDiff(responseWithNulls, responseWithNulls);
check('platform with null fields detected as identical', diffWithNulls.identicalPlatforms.has('twitter'));

// Test platform with undefined nested fields
const platformWithUndefinedNested = {
  platform: {
    id: 'twitter',
    name: 'Twitter',
    category: undefined,
    weight: undefined
  },
  grade: 'A',
  score: 85,
  issues: [],
  fixes: []
};

const responseWithUndefinedNested = mockResponse({ twitter: platformWithUndefinedNested });
const diffUndefinedNested = computeCompareDiff(responseWithUndefinedNested, responseWithUndefinedNested);
check('platform with undefined nested fields handled', diffUndefinedNested !== null);

// ============================================================================
// Test 3: Empty or malformed tag arrays
// ============================================================================
console.log('\nTest 3: Empty or malformed tag arrays');

// Test empty issues/fixes arrays
const platformWithEmptyArrays = mockPlatformScore('twitter', {
  issues: [],
  fixes: []
});

const responseEmptyArrays = mockResponse({ twitter: platformWithEmptyArrays });
const diffEmptyArrays = computeCompareDiff(responseEmptyArrays, responseEmptyArrays);
check('platform with empty arrays is identical', diffEmptyArrays.identicalPlatforms.has('twitter'));

// Test malformed issues (non-array)
const platformMalformedIssues = {
  ...mockPlatformScore('twitter'),
  issues: 'not an array',
  fixes: []
};

const responseMalformedIssues = mockResponse({ twitter: platformMalformedIssues });
const diffMalformedIssues = computeCompareDiff(responseMalformedIssues, responseMalformedIssues);
check('malformed issues (string) handled gracefully', diffMalformedIssues !== null);

// Test malformed fixes (null instead of array)
const platformMalformedFixes = {
  ...mockPlatformScore('twitter'),
  issues: [],
  fixes: null
};

const responseMalformedFixes = mockResponse({ twitter: platformMalformedFixes });
const diffMalformedFixes = computeCompareDiff(responseMalformedFixes, responseMalformedFixes);
check('malformed fixes (null) handled gracefully', diffMalformedFixes !== null);

// Test issues array with non-string elements
const platformMixedIssues = {
  ...mockPlatformScore('twitter'),
  issues: ['og:title missing', null, undefined, 123, { invalid: 'object' }],
  fixes: []
};

const responseMixedIssues = mockResponse({ twitter: platformMixedIssues });
const diffMixedIssues = computeCompareDiff(responseMixedIssues, responseMixedIssues);
check('issues array with mixed types handled gracefully', diffMixedIssues !== null);

// Test fixes array with non-string elements
const platformMixedFixes = {
  ...mockPlatformScore('twitter'),
  issues: [],
  fixes: ['Add og:title', null, undefined, 456]
};

const responseMixedFixes = mockResponse({ twitter: platformMixedFixes });
const diffMixedFixes = computeCompareDiff(responseMixedFixes, responseMixedFixes);
check('fixes array with mixed types handled gracefully', diffMixedFixes !== null);

// ============================================================================
// Test 4: Validation tests for diff output structure
// ============================================================================
console.log('\nTest 4: Validation tests for diff output structure');

// Test output structure is correct
const responseStructA = mockResponse({ twitter: platformA });
const responseStructB = mockResponse({ facebook: platformB });
const diffStruct = computeCompareDiff(responseStructA, responseStructB);

check('diff returns identicalPlatforms as Set', diffStruct.identicalPlatforms instanceof Set);
check('diff returns changedFields as Map', diffStruct.changedFields instanceof Map);
check('diff returns missingTags as Map', diffStruct.missingTags instanceof Map);

// Test identical platforms are correctly identified
const identicalPlatform1 = mockPlatformScore('twitter', { grade: 'A', score: 85 });
const identicalPlatform2 = mockPlatformScore('facebook', { grade: 'B', score: 75 });

const responseIdentical = mockResponse({
  twitter: identicalPlatform1,
  facebook: identicalPlatform2
});

const diffIdentical = computeCompareDiff(responseIdentical, responseIdentical);
check('identical platforms in identicalPlatforms Set', diffIdentical.identicalPlatforms.has('twitter'));
check('identical platforms in identicalPlatforms Set (facebook)', diffIdentical.identicalPlatforms.has('facebook'));
check('identical platforms not in changedFields', !diffIdentical.changedFields.has('twitter'));
check('identical platforms not in missingTags', !diffIdentical.missingTags.has('twitter'));

// Test changed platforms are correctly identified
const platformChangedA = mockPlatformScore('linkedin', { grade: 'C', score: 60, issues: ['og:title missing'] });
const platformChangedB = mockPlatformScore('linkedin', { grade: 'A', score: 95, issues: [] });

const responseChangedA = mockResponse({ linkedin: platformChangedA });
const responseChangedB = mockResponse({ linkedin: platformChangedB });

const diffChanged = computeCompareDiff(responseChangedA, responseChangedB);
check('changed platform not in identicalPlatforms', !diffChanged.identicalPlatforms.has('linkedin'));
check('changed platform in changedFields', diffChanged.changedFields.has('linkedin'));

// ============================================================================
// Test 5: Complex multi-platform scenarios
// ============================================================================
console.log('\nTest 5: Complex multi-platform scenarios');

// Test multiple platforms with mixed changes
const multiPlatformA = mockResponse({
  twitter: mockPlatformScore('twitter', { grade: 'A', score: 90 }),
  facebook: mockPlatformScore('facebook', { grade: 'B', score: 70, issues: ['og:image missing'] }),
  linkedin: mockPlatformScore('linkedin', { grade: 'A+', score: 98 })
});

const multiPlatformB = mockResponse({
  twitter: mockPlatformScore('twitter', { grade: 'A', score: 90 }), // Identical
  facebook: mockPlatformScore('facebook', { grade: 'A', score: 85 }), // Changed
  instagram: mockPlatformScore('instagram', { grade: 'B', score: 75 }) // Added
});

const diffMulti = computeCompareDiff(multiPlatformA, multiPlatformB);

check('twitter (identical) in identicalPlatforms', diffMulti.identicalPlatforms.has('twitter'));
check('facebook (changed) not in identicalPlatforms', !diffMulti.identicalPlatforms.has('facebook'));
check('facebook in changedFields', diffMulti.changedFields.has('facebook'));
check('linkedin (removed) in changedFields', diffMulti.changedFields.has('linkedin'));
check('instagram (added) in changedFields', diffMulti.changedFields.has('instagram'));

// ============================================================================
// Test 6: Edge cases with error responses
// ============================================================================
console.log('\nTest 6: Edge cases with error responses');

// Test error response structure
const errorResponse = { error: 'Failed to fetch', url: 'https://example.com' };
const normalResponse = mockResponse({ twitter: platformA });

const diffErrorA = computeCompareDiff(errorResponse, normalResponse);
check('error response as first param handled gracefully', diffErrorA !== null);
check('error response results in empty identicalPlatforms', diffErrorA.identicalPlatforms.size === 0);

const diffErrorB = computeCompareDiff(normalResponse, errorResponse);
check('error response as second param handled gracefully', diffErrorB !== null);
check('error response results in empty identicalPlatforms', diffErrorB.identicalPlatforms.size === 0);

const diffBothError = computeCompareDiff(errorResponse, errorResponse);
check('both error responses return empty identicalPlatforms', diffBothError.identicalPlatforms.size === 0);

// ============================================================================
// Test 7: Platform metadata transformation edge cases
// ============================================================================
console.log('\nTest 7: Platform metadata transformation edge cases');

// Test toPlatformMetadata with null input
check('toPlatformMetadata with null returns null', toPlatformMetadata(null) === null);
check('toPlatformMetadata with undefined returns null', toPlatformMetadata(undefined) === null);

// Test toPlatformMetadata with missing platform field
const invalidPlatform = { grade: 'A', score: 85 }; // Missing 'platform' field
check('toPlatformMetadata with missing platform field returns null', toPlatformMetadata(invalidPlatform) === null);

// Test toPlatformMetadata with malformed platform object
const malformedPlatform = { platform: 'not an object' };
check('toPlatformMetadata with malformed platform returns null', toPlatformMetadata(malformedPlatform) === null);

// Test toPlatformMetadata with valid input
const validPlatform = mockPlatformScore('test');
const metadata = toPlatformMetadata(validPlatform);
check('toPlatformMetadata with valid input returns object', metadata !== null);
check('toPlatformMetadata preserves platformId', metadata.platformId === 'test');
check('toPlatformMetadata preserves grade', metadata.grade === 'A');
check('toPlatformMetadata preserves score', metadata.score === 85);
check('toPlatformMetadata defaults issues to empty array', Array.isArray(metadata.issues) && metadata.issues.length === 0);
check('toPlatformMetadata defaults fixes to empty array', Array.isArray(metadata.fixes) && metadata.fixes.length === 0);

// ============================================================================
// Test 8: extractPlatformScores edge cases
// ============================================================================
console.log('\nTest 8: extractPlatformScores edge cases');

// Test extractPlatformScores with null
const scoresNull = extractPlatformScores(null);
check('extractPlatformScores with null returns empty object', Object.keys(scoresNull).length === 0);

// Test extractPlatformScores with undefined
const scoresUndefined = extractPlatformScores(undefined);
check('extractPlatformScores with undefined returns empty object', Object.keys(scoresUndefined).length === 0);

// Test extractPlatformScores with error response
const scoresError = extractPlatformScores({ error: 'test error', url: 'https://test.com' });
check('extractPlatformScores with error response returns empty object', Object.keys(scoresError).length === 0);

// Test extractPlatformScores with response missing scoring field
const scoresNoScoring = extractPlatformScores({ someOtherField: 'value' });
check('extractPlatformScores with missing scoring returns empty object', Object.keys(scoresNoScoring).length === 0);

// Test extractPlatformScores with valid response
const validScores = { twitter: platformA, facebook: platformB };
const responseWithScores = mockResponse(validScores);
const extractedScores = extractPlatformScores(responseWithScores);
check('extractPlatformScores with valid response returns scores', Object.keys(extractedScores).length === 2);
check('extractPlatformScores preserves twitter platform', extractedScores.twitter === platformA);
check('extractPlatformScores preserves facebook platform', extractedScores.facebook === platformB);

// ============================================================================
// Test 9: Large-scale performance test
// ============================================================================
console.log('\nTest 9: Large-scale performance test (100 platforms)');

const largeScoresA = {};
const largeScoresB = {};

for (let i = 0; i < 100; i++) {
  const platformId = `platform-${i}`;
  largeScoresA[platformId] = mockPlatformScore(platformId, { score: 50 + i });
  largeScoresB[platformId] = mockPlatformScore(platformId, { score: 60 + i });
}

const largeResponseA = mockResponse(largeScoresA);
const largeResponseB = mockResponse(largeScoresB);

const startTime = Date.now();
const largeDiff = computeCompareDiff(largeResponseA, largeResponseB);
const endTime = Date.now();
const duration = endTime - startTime;

check('large-scale comparison completes', largeDiff !== null);
check('large-scale comparison handles 100 platforms', largeDiff.changedFields.size === 100);
check('large-scale comparison completes in reasonable time (<100ms)', duration < 100);

// ============================================================================
// Test 10: Diff output content validation
// ============================================================================
console.log('\nTest 10: Diff output content validation');

// Test that changed fields are correctly recorded
const platformBefore = mockPlatformScore('twitter', {
  grade: 'C',
  score: 60,
  issues: ['og:title missing', 'og:description missing'],
  fixes: ['Add og:title', 'Add og:description']
});

const platformAfter = mockPlatformScore('twitter', {
  grade: 'A',
  score: 95,
  issues: [],
  fixes: []
});

const diffValidation = computeCompareDiff(
  mockResponse({ twitter: platformBefore }),
  mockResponse({ twitter: platformAfter })
);

check('changed platform in changedFields map', diffValidation.changedFields.has('twitter'));
const changedFieldList = diffValidation.changedFields.get('twitter');
check('changed fields includes grade', changedFieldList && changedFieldList.includes('grade'));
check('changed fields includes score', changedFieldList && changedFieldList.includes('score'));
check('changed fields includes issues', changedFieldList && changedFieldList.includes('issues'));
check('changed fields includes fixes', changedFieldList && changedFieldList.includes('fixes'));

// Test that missing tags are correctly recorded
check('missing tags recorded for changed platform', diffValidation.missingTags.has('twitter'));
const missingTagList = diffValidation.missingTags.get('twitter');
check('missing tags includes og:description', missingTagList && missingTagList.includes('og:description'));
check('missing tags includes og:title', missingTagList && missingTagList.includes('og:title'));

// ============================================================================
// Summary
// ============================================================================
console.log('\n=== Test Results ===');
if (failed === 0) {
  console.log('✅ All edge case tests passed!');
  process.exit(0);
} else {
  console.log('❌ ' + failed + ' test(s) failed.');
  process.exit(1);
}
