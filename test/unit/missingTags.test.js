#!/usr/bin/env node

/**
 * Test: missingTags Function (bf-duzm)
 *
 * Verifies the missingTags function correctly detects tag differences
 * between two platform metadata objects.
 */

const { missingTags } = require('../../src/comparators/missingTags.js');

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
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

console.log('=== missingTags Function Tests (bf-duzm) ===\n');

// --- Test 1: Empty array for identical platforms --------------------------------
console.log('Test 1: Empty array for identical platforms');

const identicalPlatform = {
  platformId: 'twitter',
  platformName: 'Twitter',
  category: 'Social & Microblogging',
  weight: 1.0,
  grade: 'A+',
  score: 100,
  issues: ['og:title missing'],
  fixes: ['Add og:title meta tag']
};

check('empty array for identical platforms', arrayEquals(missingTags(identicalPlatform, identicalPlatform), []));

// --- Test 2: Empty tag arrays ---------------------------------------------------
console.log('\nTest 2: Empty tag arrays');

const emptyPlatform1 = {
  platformId: 'facebook',
  issues: [],
  fixes: []
};

const emptyPlatform2 = {
  platformId: 'facebook',
  issues: [],
  fixes: []
};

check('empty array for platforms with no tags', arrayEquals(missingTags(emptyPlatform1, emptyPlatform2), []));

// --- Test 3: Missing tags detection --------------------------------------------
console.log('\nTest 3: Missing tags detection');

const withTags = {
  platformId: 'linkedin',
  issues: ['og:title missing', 'og:description missing', 'og:image missing'],
  fixes: ['Add og:title meta tag', 'Add og:description meta tag', 'Add og:image meta tag']
};

const withFewerTags = {
  platformId: 'linkedin',
  issues: ['og:title missing'],
  fixes: ['Add og:title meta tag']
};

const expectedMissing = ['og:description', 'og:image'];
check('detects missing og:description', missingTags(withTags, withFewerTags).includes('og:description'));
check('detects missing og:image', missingTags(withTags, withFewerTags).includes('og:image'));
check('detects all missing tags', arrayEquals(missingTags(withTags, withFewerTags), expectedMissing));

// --- Test 4: No missing tags ----------------------------------------------------
console.log('\nTest 4: No missing tags (superset)');

const basePlatform = {
  platformId: 'instagram',
  issues: ['og:title missing'],
  fixes: []
};

const supersetPlatform = {
  platformId: 'instagram',
  issues: ['og:title missing', 'og:image missing'],
  fixes: ['Add og:image meta tag']
};

check('empty array when first is subset', arrayEquals(missingTags(basePlatform, supersetPlatform), []));

// --- Test 5: Null/undefined handling -------------------------------------------
console.log('\nTest 5: Null and undefined handling');

const testPlatform = {
  platformId: 'tiktok',
  issues: ['twitter:card missing'],
  fixes: []
};

check('null first returns empty array', arrayEquals(missingTags(null, testPlatform), []));
check('undefined first returns empty array', arrayEquals(missingTags(undefined, testPlatform), []));

const nullSecondMissing = missingTags(testPlatform, null);
check('null second returns all tags', arrayEquals(nullSecondMissing, ['twitter:card']));

const undefSecondMissing = missingTags(testPlatform, undefined);
check('undefined second returns all tags', arrayEquals(undefSecondMissing, ['twitter:card']));

check('both null returns empty array', arrayEquals(missingTags(null, null), []));
check('both undefined returns empty array', arrayEquals(missingTags(undefined, undefined), []));

// --- Test 6: Tag extraction patterns -------------------------------------------
console.log('\nTest 6: Various tag extraction patterns');

const variousPatterns = {
  platformId: 'pinterest',
  issues: [
    'og:title missing',
    'og:description missing',
    'no twitter:card',
    'og:image missing',
    'twitter:title missing'
  ],
  fixes: [
    'Add og:title meta tag',
    'Add og:description meta tag',
    'add twitter:card',
    'Add og:image meta tag'
  ]
};

const noPatterns = {
  platformId: 'pinterest',
  issues: ['og:title missing'],
  fixes: ['Add og:title meta tag']
};

const expectedMissingPatterns = ['og:description', 'og:image', 'twitter:card', 'twitter:title'];
check('extracts "X missing" pattern correctly', !missingTags(variousPatterns, noPatterns).includes('og:title'));
check('extracts "no X" pattern', missingTags(variousPatterns, noPatterns).includes('twitter:card'));
check('detects all pattern-based tags', arrayEquals(missingTags(variousPatterns, noPatterns), expectedMissingPatterns));

// --- Test 7: Case insensitivity ------------------------------------------------
console.log('\nTest 7: Case insensitivity');

const upperCaseTags = {
  platformId: 'reddit',
  issues: ['OG:TITLE Missing', 'OG:IMAGE missing'],
  fixes: ['Add OG:TITLE meta tag']
};

const lowerCaseTags = {
  platformId: 'reddit',
  issues: ['og:title missing', 'og:image missing'],
  fixes: ['Add og:title meta tag']
};

check('normalizes tag case', arrayEquals(missingTags(upperCaseTags, lowerCaseTags), []));

// --- Test 8: Issues vs fixes comparison ----------------------------------------
console.log('\nTest 8: Issues vs fixes comparison');

const issuesPlatform = {
  platformId: 'youtube',
  issues: ['og:title missing', 'og:description missing'],
  fixes: []
};

const fixesPlatform = {
  platformId: 'youtube',
  issues: ['og:title missing'],
  fixes: ['Add og:description meta tag']
};

check('empty when same tags in different arrays', arrayEquals(missingTags(issuesPlatform, fixesPlatform), []));

// --- Test 9: Complex real-world example ----------------------------------------
console.log('\nTest 9: Complex real-world platform comparison');

const platformBefore = {
  platformId: 'tiktok',
  platformName: 'TikTok',
  category: 'Social Video',
  weight: 0.9,
  grade: 'C',
  score: 65,
  issues: [
    'og:title missing',
    'og:description missing',
    'og:image missing',
    'twitter:card missing',
    'no twitter:title'
  ],
  fixes: [
    'Add og:title meta tag',
    'Add og:description meta tag',
    'Add og:image meta tag',
    'add twitter:card',
    'Add twitter:title'
  ]
};

const platformAfter = {
  platformId: 'tiktok',
  platformName: 'TikTok',
  category: 'Social Video',
  weight: 0.9,
  grade: 'A+',
  score: 100,
  issues: [],
  fixes: []
};

const expectedRealWorld = ['og:description', 'og:image', 'og:title', 'twitter:card', 'twitter:title'];
check('detects all missing real-world tags', arrayEquals(missingTags(platformBefore, platformAfter), expectedRealWorld));

// --- Test 10: Reverse comparison -----------------------------------------------
console.log('\nTest 10: Reverse comparison (swap platforms)');

const platformA = {
  platformId: 'test',
  issues: ['og:title missing', 'og:description missing'],
  fixes: []
};

const platformB = {
  platformId: 'test',
  issues: ['og:title missing'],
  fixes: []
};

check('A to B detects og:description', missingTags(platformA, platformB).includes('og:description'));
check('B to A returns empty', arrayEquals(missingTags(platformB, platformA), []));

// --- Test 11: Empty strings and edge cases ------------------------------------
console.log('\nTest 11: Empty strings and edge cases');

const emptyStrings = {
  platformId: 'test',
  issues: [''],
  fixes: ['']
};

const noTags = {
  platformId: 'test',
  issues: [],
  fixes: []
};

check('empty strings in issues/fixes ignored', arrayEquals(missingTags(emptyStrings, noTags), []));

// --- Test 12: Malformed tag patterns -------------------------------------------
console.log('\nTest 12: Malformed tag patterns');

const malformedPlatform = {
  platformId: 'test',
  issues: [
    'random text without tags',
    'also no pattern here',
    'og:title missing',  // Only this should be extracted
    'more gibberish'
  ],
  fixes: ['more gibberish']
};

const onlyValid = {
  platformId: 'test',
  issues: ['og:title missing'],
  fixes: []
};

check('ignores malformed patterns', arrayEquals(missingTags(malformedPlatform, onlyValid), []));

// --- Test 13: Multiple identical tags -------------------------------------------
console.log('\nTest 13: Multiple identical tag references');

const duplicatesPlatform = {
  platformId: 'test',
  issues: ['og:title missing', 'og:title missing', 'og:title missing'],
  fixes: ['Add og:title meta tag', 'Add og:title meta tag']
};

const singleReference = {
  platformId: 'test',
  issues: ['og:title missing'],
  fixes: ['Add og:title meta tag']
};

check('deduplicates identical tags', arrayEquals(missingTags(duplicatesPlatform, singleReference), []));

// --- Test 14: Sorted output -----------------------------------------------------
console.log('\nTest 14: Output is sorted alphabetically');

const unsortedInput = {
  platformId: 'test',
  issues: ['zebra:tag missing', 'alpha:tag missing', 'middle:tag missing'],
  fixes: []
};

const emptyPlatform = {
  platformId: 'test',
  issues: [],
  fixes: []
};

const sortedResult = missingTags(unsortedInput, emptyPlatform);
check('output is sorted', JSON.stringify(sortedResult) === JSON.stringify(['alpha:tag', 'middle:tag', 'zebra:tag']));

// --- Test 15: Platform without issues/fixes fields ----------------------------
console.log('\nTest 15: Platform without issues/fixes fields');

const minimalPlatform1 = { platformId: 'test', score: 100 };
const minimalPlatform2 = { platformId: 'test', score: 100 };

check('platforms without issues/fixes return empty', arrayEquals(missingTags(minimalPlatform1, minimalPlatform2), []));

console.log('');
if (failed === 0) {
  console.log('✅ All checks passed — missingTags function works correctly.');
  process.exit(0);
} else {
  console.log('❌ ' + failed + ' check(s) failed.');
  process.exit(1);
}
