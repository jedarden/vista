#!/usr/bin/env node

/**
 * Test: changedFields Function (bf-3bbj)
 *
 * Verifies the changedFields function correctly identifies differences
 * between two platform metadata objects.
 */

const { changedFields } = require('./src/comparators/changedFields.js');

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

console.log('=== changedFields Function Tests (bf-3bbj) ===\n');

// --- Test 1: Empty array for identical objects --------------------------------
console.log('Test 1: Empty array for identical objects');

const identicalObj = {
  platformId: 'twitter',
  platformName: 'Twitter',
  category: 'Social & Microblogging',
  weight: 1.0,
  grade: 'A+',
  score: 100,
  issues: [],
  fixes: []
};

check('empty array for identical objects', arrayEquals(changedFields(identicalObj, identicalObj), []));

// --- Test 2: Empty array for equal primitives ----------------------------------
console.log('\nTest 2: Empty array for equal primitive values');

check('empty array for equal strings', arrayEquals(changedFields('hello', 'hello'), []));
check('empty array for equal numbers', arrayEquals(changedFields(42, 42), []));
check('empty array for equal booleans', arrayEquals(changedFields(true, true), []));
check('empty array for equal nulls', arrayEquals(changedFields(null, null), []));

// --- Test 3: Nested field paths (dot notation) --------------------------------
console.log('\nTest 3: Nested field paths with dot notation');

const objA = {
  platformId: 'linkedin',
  tags: { count: 5, verified: true },
  meta: { og: { title: 'Test' }, lastSeen: 1234567890 }
};

const objB = {
  platformId: 'linkedin',
  tags: { count: 10, verified: true },
  meta: { og: { title: 'Changed' }, lastSeen: 1234567890 }
};

const expectedChanges = ['tags.count', 'meta.og.title'];
check('detects nested field changes', arrayEquals(changedFields(objA, objB), expectedChanges));

// --- Test 4: Partial changes --------------------------------------------------
console.log('\nTest 4: Partial changes (some fields differ)');

const platformA = {
  platformId: 'facebook',
  platformName: 'Facebook',
  category: 'Social Network',
  weight: 1.0,
  grade: 'B+',
  score: 85,
  issues: ['og:image missing'],
  fixes: ['Add og:image tag']
};

const platformB = {
  platformId: 'facebook',
  platformName: 'Facebook',
  category: 'Social Network',
  weight: 1.0,
  grade: 'A',
  score: 92,
  issues: ['og:image missing'],
  fixes: ['Add og:image tag']
};

const expectedPartialChanges = ['grade', 'score'];
check('detects partial field changes', arrayEquals(changedFields(platformA, platformB), expectedPartialChanges));

// --- Test 5: Array field changes -----------------------------------------------
console.log('\nTest 5: Array field changes');

const objArraysA = {
  platformId: 'instagram',
  issues: ['no title', 'no description'],
  fixes: ['add title']
};

const objArraysB = {
  platformId: 'instagram',
  issues: ['no title', 'no description', 'no image'],
  fixes: ['add title', 'add description']
};

const arrayChanges = changedFields(objArraysA, objArraysB);
check('detects issues array change', arrayChanges.includes('issues'));
check('detects fixes array change', arrayChanges.includes('fixes'));
check('detects both array changes', arrayChanges.length === 2);

// --- Test 6: No changes returns empty ------------------------------------------
console.log('\nTest 6: No changes returns empty array');

const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };
check('no changes returns empty array', arrayEquals(changedFields(obj1, obj2), []));

// --- Test 7: All fields changed ------------------------------------------------
console.log('\nTest 7: All fields changed');

const simpleA = { x: 1, y: 'hello' };
const simpleB = { x: 2, y: 'world' };
const allChanges = changedFields(simpleA, simpleB);
check('detects all primitive field changes', arrayEquals(allChanges, ['x', 'y']));

// --- Test 8: Added/removed fields ---------------------------------------------
console.log('\nTest 8: Added or removed fields');

const objWithLess = { a: 1, b: 2 };
const objWithMore = { a: 1, b: 2, c: 3 };

const addedFields = changedFields(objWithLess, objWithMore);
check('detects added field', addedFields.includes('c'));

const removedFields = changedFields(objWithMore, objWithLess);
check('detects removed field', removedFields.includes('c'));

// --- Test 9: Nested object addition/removal -----------------------------------
console.log('\nTest 9: Nested object addition/removal');

const objWithoutMeta = {
  platformId: 'pinterest',
  platformName: 'Pinterest'
};

const objWithMeta = {
  platformId: 'pinterest',
  platformName: 'Pinterest',
  meta: {
    tags: { count: 3 },
    lastSeen: 999999
  }
};

const metaChanges = changedFields(objWithoutMeta, objWithMeta);
check('detects added nested object', metaChanges.includes('meta'));

const metaRemovals = changedFields(objWithMeta, objWithoutMeta);
check('detects removed nested object', metaRemovals.includes('meta'));

// --- Test 10: Null/undefined handling -----------------------------------------
console.log('\nTest 10: Null and undefined handling');

check('null vs null returns empty', arrayEquals(changedFields(null, null), []));
check('undefined vs undefined returns empty', arrayEquals(changedFields(undefined, undefined), []));

const nullChanges = changedFields(null, { a: 1 });
check('null vs object detects all fields', nullChanges.includes('a'));

const undefChanges = changedFields(undefined, { a: 1 });
check('undefined vs object detects all fields', undefChanges.includes('a'));

const objToNull = changedFields({ a: 1, b: 2 }, null);
check('object vs null detects all fields', arrayEquals(objToNull, ['a', 'b']));

// --- Test 11: Complex nested paths --------------------------------------------
console.log('\nTest 11: Complex nested field paths');

const deepA = {
  level1: {
    level2: {
      level3: {
        value: 'original'
      }
    }
  },
  data: {
    nested: {
      count: 5,
      enabled: true
    }
  }
};

const deepB = {
  level1: {
    level2: {
      level3: {
        value: 'changed'
      }
    }
  },
  data: {
    nested: {
      count: 10,
      enabled: true
    }
  }
};

const deepChanges = changedFields(deepA, deepB);
check('detects deep nested changes', arrayEquals(deepChanges, ['level1.level2.level3.value', 'data.nested.count']));

// --- Test 12: Mixed array and object -------------------------------------------
console.log('\nTest 12: Mixed arrays and objects');

const mixedA = {
  items: [{ id: 1, name: 'first' }],
  config: { threshold: 0.5 }
};

const mixedB = {
  items: [{ id: 1, name: 'changed' }],
  config: { threshold: 0.9 }
};

const mixedChanges = changedFields(mixedA, mixedB);
check('detects array change', mixedChanges.includes('items'));
check('detects nested object change', mixedChanges.includes('config.threshold'));

// --- Test 13: Platform metadata real-world example ----------------------------
console.log('\nTest 13: Platform metadata real-world example');

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
    'og:image missing'
  ],
  fixes: [
    'Add og:title meta tag',
    'Add og:description meta tag',
    'Add og:image meta tag'
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

const platformChanges = changedFields(platformBefore, platformAfter);
check('detects grade change', platformChanges.includes('grade'));
check('detects score change', platformChanges.includes('score'));
check('detects issues array change', platformChanges.includes('issues'));
check('detects fixes array change', platformChanges.includes('fixes'));
check('detects all platform changes', platformChanges.length === 4);

// --- Test 14: Empty vs non-empty arrays ----------------------------------------
console.log('\nTest 14: Empty vs non-empty arrays');

const emptyIssues = { platformId: 'test', issues: [] };
const withIssues = { platformId: 'test', issues: ['error1'] };

check('detects empty to non-empty array change', changedFields(emptyIssues, withIssues).includes('issues'));
check('detects non-empty to empty array change', changedFields(withIssues, emptyIssues).includes('issues'));

// --- Test 15: Zero values ------------------------------------------------------
console.log('\nTest 15: Zero and false value handling');

const objWithZeros = { count: 0, score: 0.0, enabled: false, empty: '' };
const objNonZero = { count: 10, score: 85.5, enabled: true, empty: 'value' };

const zeroChanges = changedFields(objWithZeros, objNonZero);
check('detects all zero value changes', arrayEquals(zeroChanges, ['count', 'score', 'enabled', 'empty']));

console.log('');
if (failed === 0) {
  console.log('✅ All checks passed — changedFields function works correctly.');
  process.exit(0);
} else {
  console.log('❌ ' + failed + ' check(s) failed.');
  process.exit(1);
}
