#!/usr/bin/env node

/**
 * Comprehensive test suite for changedFields function (bf-263q)
 *
 * Tests edge case handling and validation for field change detection:
 * 1. Null/undefined inputs
 * 2. Empty or malformed objects
 * 3. Nested field changes
 * 4. Array and object comparison
 * 5. Edge cases with primitive types
 */

const { changedFields } = require('../../src/comparators/changedFields.js');

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

console.log('=== changedFields Edge Case Tests (bf-263q) ===\n');

// ============================================================================
// Test 1: Null/undefined inputs
// ============================================================================
console.log('Test 1: Null/undefined inputs');

check('both null returns empty array', arrayEquals(changedFields(null, null), []));
check('both undefined returns empty array', arrayEquals(changedFields(undefined, undefined), []));

// One null, one defined
const definedObj = { platformId: 'twitter', score: 85 };
const fieldsFromNull = changedFields(null, definedObj);
check('null to defined returns field list', Array.isArray(fieldsFromNull) && fieldsFromNull.length > 0);

const fieldsToNull = changedFields(definedObj, null);
check('defined to null returns field list', Array.isArray(fieldsToNull) && fieldsToNull.length > 0);

// One undefined, one defined
const fieldsFromUndefined = changedFields(undefined, definedObj);
check('undefined to defined returns field list', Array.isArray(fieldsFromUndefined) && fieldsFromUndefined.length > 0);

const fieldsToUndefined = changedFields(definedObj, undefined);
check('defined to undefined returns field list', Array.isArray(fieldsToUndefined) && fieldsToUndefined.length > 0);

// ============================================================================
// Test 2: Empty or malformed objects
// ============================================================================
console.log('\nTest 2: Empty or malformed objects');

check('both empty objects returns empty array', arrayEquals(changedFields({}, {}), []));

const emptyToObj = changedFields({}, { a: 1 });
check('empty object to defined object returns changes', Array.isArray(emptyToObj) && emptyToObj.length > 0);

const objToEmpty = changedFields({ a: 1 }, {});
check('defined object to empty returns changes', Array.isArray(objToEmpty) && objToEmpty.length > 0);

// Malformed inputs (primitives instead of objects)
check('string to string returns changes', arrayEquals(changedFields('test', 'test2'), ['']));
check('number to number returns changes', arrayEquals(changedFields(1, 2), ['']));
check('boolean to boolean returns changes', arrayEquals(changedFields(true, false), ['']));

// Mixed primitives and objects
check('object to primitive returns changes', changedFields({}, 'string').length > 0);
check('primitive to object returns changes', changedFields('string', {}).length > 0);

// ============================================================================
// Test 3: Nested field changes
// ============================================================================
console.log('\nTest 3: Nested field changes');

const nestedA = {
  platform: { id: 'twitter', name: 'Twitter' },
  meta: { og: { title: 'Test' } }
};

const nestedB = {
  platform: { id: 'twitter', name: 'Twitter' },
  meta: { og: { title: 'Changed' } }
};

const nestedChanges = changedFields(nestedA, nestedB);
check('detects nested field changes', nestedChanges.includes('meta.og.title'));

// Deep nested changes
const deepNestedA = {
  level1: { level2: { level3: { value: 'original' } } }
};

const deepNestedB = {
  level1: { level2: { level3: { value: 'changed' } } }
};

const deepChanges = changedFields(deepNestedA, deepNestedB);
check('detects deeply nested field changes', deepChanges.includes('level1.level2.level3.value'));

// Added nested field
const nestedAddedA = { platform: { id: 'twitter' } };
const nestedAddedB = { platform: { id: 'twitter', name: 'Twitter' } };

const addedNestedChanges = changedFields(nestedAddedA, nestedAddedB);
check('detects added nested field', addedNestedChanges.includes('platform.name'));

// Removed nested field
const removedNestedChanges = changedFields(nestedAddedB, nestedAddedA);
check('detects removed nested field', removedNestedChanges.includes('platform.name'));

// ============================================================================
// Test 4: Array and object comparison
// ============================================================================
console.log('\nTest 4: Array and object comparison');

// Array changes
const arrayChanges = changedFields(
  { tags: ['a', 'b', 'c'] },
  { tags: ['a', 'b', 'd'] }
);
check('detects array content changes', arrayChanges.includes('tags'));

// Array length changes
const arrayLengthChanges = changedFields(
  { items: [1, 2] },
  { items: [1, 2, 3] }
);
check('detects array length changes', arrayLengthChanges.includes('items'));

// Empty vs non-empty arrays
const emptyArrayChanges = changedFields(
  { values: [] },
  { values: [1] }
);
check('detects empty vs non-empty array', emptyArrayChanges.includes('values'));

// Array vs non-array
const arrayToObjectChanges = changedFields(
  { data: [1, 2, 3] },
  { data: 'not an array' }
);
check('detects array to non-array change', arrayToObjectChanges.includes('data'));

// Nested array changes
const nestedArrayChanges = changedFields(
  { matrix: [[1, 2], [3, 4]] },
  { matrix: [[1, 2], [3, 5]] }
);
check('detects nested array changes', nestedArrayChanges.includes('matrix'));

// ============================================================================
// Test 5: Edge cases with primitive types
// ============================================================================
console.log('\nTest 5: Edge cases with primitive types');

// String changes
check('detects string changes', arrayEquals(changedFields({ name: 'test' }, { name: 'changed' }), ['name']));
check('ignores identical strings', arrayEquals(changedFields({ name: 'test' }, { name: 'test' }), []));

// Number changes
check('detects number changes', arrayEquals(changedFields({ score: 85 }, { score: 90 }), ['score']));
check('ignores identical numbers', arrayEquals(changedFields({ score: 85 }, { score: 85 }), []));

// Boolean changes
check('detects boolean changes', arrayEquals(changedFields({ active: true }, { active: false }), ['active']));
check('ignores identical booleans', arrayEquals(changedFields({ active: true }, { active: true }), []));

// Null vs undefined vs value
const nullToValue = changedFields({ field: null }, { field: 'value' });
check('detects null to value change', nullToValue.includes('field'));

const undefinedToValue = changedFields({ field: undefined }, { field: 'value' });
check('detects undefined to value change', undefinedToValue.includes('field'));

const valueToNull = changedFields({ field: 'value' }, { field: null });
check('detects value to null change', valueToNull.includes('field'));

const nullToUndefined = changedFields({ field: null }, { field: undefined });
check('null and undefined treated as equal', arrayEquals(nullToUndefined, []));

// ============================================================================
// Test 6: Multiple field changes
// ============================================================================
console.log('\nTest 6: Multiple field changes');

// Multiple independent field changes
const multiChanges = changedFields(
  { platformId: 'twitter', score: 85, grade: 'A' },
  { platformId: 'twitter', score: 90, grade: 'B' }
);
check('detects multiple field changes', multiChanges.length === 2);
check('includes score in multiple changes', multiChanges.includes('score'));
check('includes grade in multiple changes', multiChanges.includes('grade'));

// All fields changed
const allChanges = changedFields(
  { a: 1, b: 2, c: 3, d: 4 },
  { a: 10, b: 20, c: 30, d: 40 }
);
check('detects all fields changed', allChanges.length === 4);

// Mix of changed and unchanged
const mixedChanges = changedFields(
  { platformId: 'twitter', score: 85, grade: 'A' },
  { platformId: 'twitter', score: 90, grade: 'A' }
);
check('only reports changed fields', mixedChanges.length === 1 && mixedChanges.includes('score'));

// ============================================================================
// Test 7: Special object types
// ============================================================================
console.log('\nTest 7: Special object types');

// Date objects (treated as different objects)
const dateChanges = changedFields(
  { date: new Date('2020-01-01') },
  { date: new Date('2021-01-01') }
);
check('handles Date objects', Array.isArray(dateChanges));

// RegExp objects
const regexChanges = changedFields(
  { pattern: /test/gi },
  { pattern: /test/g }
);
check('handles RegExp objects', Array.isArray(regexChanges));

// Function objects (should be treated as different)
const funcChanges = changedFields(
  { fn: () => {} },
  { fn: () => {} }
);
check('handles function objects', Array.isArray(funcChanges));

// ============================================================================
// Test 8: Empty and whitespace strings
// ============================================================================
console.log('\nTest 8: Empty and whitespace strings');

// Empty string vs non-empty
check('detects empty to non-empty string', arrayEquals(changedFields({ s: '' }, { s: 'text' }), ['s']));
check('detects non-empty to empty string', arrayEquals(changedFields({ s: 'text' }, { s: '' }), ['s']));
check('detects empty to empty string', arrayEquals(changedFields({ s: '' }, { s: '' }), []));

// Whitespace differences
check('detects whitespace differences', arrayEquals(changedFields({ s: 'test' }, { s: 'test ' }), ['s']));
check('detects different whitespace', arrayEquals(changedFields({ s: ' ' }, { s: '  ' }), ['s']));

// ============================================================================
// Test 9: Large field counts
// ============================================================================
console.log('\nTest 9: Large field counts (performance test)');

// Create objects with many fields
const largeObjA = {};
const largeObjB = {};
for (let i = 0; i < 100; i++) {
  largeObjA[`field${i}`] = i;
  largeObjB[`field${i}`] = i + 1; // All different
}

const startTime = Date.now();
const largeChanges = changedFields(largeObjA, largeObjB);
const endTime = Date.now();
const duration = endTime - startTime;

check('handles 100 field changes', largeChanges.length === 100);
check('large comparison completes in reasonable time (<50ms)', duration < 50);

// ============================================================================
// Test 10: Field path formatting
// ============================================================================
console.log('\nTest 10: Field path formatting');

// Top-level fields
const topLevelChanges = changedFields(
  { platformId: 'test' },
  { platformId: 'changed' }
);
check('top-level field has simple path', topLevelChanges.includes('platformId'));

// Nested field paths
const deeplyNested = changedFields(
  { a: { b: { c: { d: 'value' } } } },
  { a: { b: { c: { d: 'changed' } } } }
);
check('nested field uses dot notation', deeplyNested.includes('a.b.c.d'));

// Mixed nesting levels
const mixedNesting = changedFields(
  { top: { middle: 'value' }, other: 'unchanged' },
  { top: { middle: 'changed' }, other: 'unchanged' }
);
check('mixed nesting reports correct paths', mixedNesting.includes('top.middle'));
check('mixed nesting excludes unchanged fields', !mixedNesting.includes('other'));

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
