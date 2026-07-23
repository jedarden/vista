'use strict';

/**
 * Unit tests for isIdentical function (src/comparators/isIdentical.ts) — bf-5a0u.
 *
 * Tests deep equality checking for platform metadata objects:
 *   - Basic equality for identical objects
 *   - Edge cases: null, undefined, empty objects
 *   - Nested array comparison (issues, fixes)
 *   - Primitive field comparison (strings, numbers)
 *   - Partial differences return false
 */

const { isIdentical } = require('../../src/comparators/isIdentical');

// --- tiny assertion helpers (mirrors platform-redirect-view.test.js) ---

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

function assertThrows(fn, msg) {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
  }
  if (!threw) {
    throw new Error(msg || 'assertThrows failed — function should have thrown');
  }
}

// --- fixtures ---

// Create a platform metadata object with all required fields
function platform(overrides) {
  return Object.assign(
    {
      platformId: 'twitter',
      platformName: 'Twitter/X',
      category: 'Social & Microblogging',
      weight: 1.0,
      grade: 'A+',
      score: 95,
      issues: [],
      fixes: [],
    },
    overrides || {}
  );
}

// --- runner ---

function runTests() {
  console.log('Running isIdentical unit tests...\n');
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

  // === basic equality ===
  console.log('=== Basic equality ===');

  test('identical objects return true', () => {
    const a = platform();
    const b = platform();
    assertEqual(isIdentical(a, b), true, 'identical platforms should be equal');
  });

  test('same reference returns true', () => {
    const a = platform();
    assertEqual(isIdentical(a, a), true, 'same reference should be equal');
  });

  test('objects with same values but different references return true', () => {
    const a = platform({
      issues: ['missing og:title', 'no twitter:card'],
      fixes: ['add og:title', 'add twitter:card'],
    });
    const b = platform({
      issues: ['missing og:title', 'no twitter:card'],
      fixes: ['add og:title', 'add twitter:card'],
    });
    assertEqual(isIdentical(a, b), true, 'different references with same values should be equal');
  });

  // === null/undefined edge cases ===
  console.log('\n=== Null/undefined edge cases ===');

  test('both null return true', () => {
    assertEqual(isIdentical(null, null), true, 'both null should be equal');
  });

  test('both undefined return true', () => {
    assertEqual(isIdentical(undefined, undefined), true, 'both undefined should be equal');
  });

  test('one null and one undefined return true', () => {
    assertEqual(isIdentical(null, undefined), true, 'null and undefined should be treated as equal');
  });

  test('one null and one object return false', () => {
    const a = platform();
    assertEqual(isIdentical(a, null), false, 'object vs null should not be equal');
  });

  test('one undefined and one object return false', () => {
    const a = platform();
    assertEqual(isIdentical(undefined, a), false, 'undefined vs object should not be equal');
  });

  // === field differences ===
  console.log('\n=== Field differences ===');

  test('different platformId returns false', () => {
    const a = platform({ platformId: 'twitter' });
    const b = platform({ platformId: 'facebook' });
    assertEqual(isIdentical(a, b), false, 'different platformId should not be equal');
  });

  test('different platformName returns false', () => {
    const a = platform({ platformName: 'Twitter/X' });
    const b = platform({ platformName: 'Twitter' });
    assertEqual(isIdentical(a, b), false, 'different platformName should not be equal');
  });

  test('different category returns false', () => {
    const a = platform({ category: 'Social & Microblogging' });
    const b = platform({ category: 'Messaging' });
    assertEqual(isIdentical(a, b), false, 'different category should not be equal');
  });

  test('different weight returns false', () => {
    const a = platform({ weight: 1.0 });
    const b = platform({ weight: 0.8 });
    assertEqual(isIdentical(a, b), false, 'different weight should not be equal');
  });

  test('different grade returns false', () => {
    const a = platform({ grade: 'A+' });
    const b = platform({ grade: 'A' });
    assertEqual(isIdentical(a, b), false, 'different grade should not be equal');
  });

  test('different score returns false', () => {
    const a = platform({ score: 95 });
    const b = platform({ score: 90 });
    assertEqual(isIdentical(a, b), false, 'different score should not be equal');
  });

  // === array comparison (issues/fixes) ===
  console.log('\n=== Array comparison (issues/fixes) ===');

  test('empty arrays are equal', () => {
    const a = platform({ issues: [], fixes: [] });
    const b = platform({ issues: [], fixes: [] });
    assertEqual(isIdentical(a, b), true, 'empty arrays should be equal');
  });

  test('identical single-element arrays return true', () => {
    const a = platform({ issues: ['missing og:title'], fixes: [] });
    const b = platform({ issues: ['missing og:title'], fixes: [] });
    assertEqual(isIdentical(a, b), true, 'identical single-element arrays should be equal');
  });

  test('identical multi-element arrays return true', () => {
    const a = platform({
      issues: ['missing og:title', 'no twitter:card', 'missing og:image'],
      fixes: ['add og:title', 'add twitter:card'],
    });
    const b = platform({
      issues: ['missing og:title', 'no twitter:card', 'missing og:image'],
      fixes: ['add og:title', 'add twitter:card'],
    });
    assertEqual(isIdentical(a, b), true, 'identical multi-element arrays should be equal');
  });

  test('different array lengths return false', () => {
    const a = platform({ issues: ['missing og:title'] });
    const b = platform({ issues: ['missing og:title', 'no twitter:card'] });
    assertEqual(isIdentical(a, b), false, 'different array lengths should not be equal');
  });

  test('different array contents return false', () => {
    const a = platform({ issues: ['missing og:title'] });
    const b = platform({ issues: ['missing og:description'] });
    assertEqual(isIdentical(a, b), false, 'different array contents should not be equal');
  });

  test('different array order returns false', () => {
    const a = platform({ issues: ['missing og:title', 'no twitter:card'] });
    const b = platform({ issues: ['no twitter:card', 'missing og:title'] });
    assertEqual(isIdentical(a, b), false, 'different array order should not be equal');
  });

  test('one empty array and one non-empty return false', () => {
    const a = platform({ issues: [] });
    const b = platform({ issues: ['missing og:title'] });
    assertEqual(isIdentical(a, b), false, 'empty vs non-empty array should not be equal');
  });

  // === complex scenarios ===
  console.log('\n=== Complex scenarios ===');

  test('objects differing only in issues array return false', () => {
    const a = platform({ issues: ['missing og:title'] });
    const b = platform({ issues: ['missing og:description'] });
    assertEqual(isIdentical(a, b), false, 'only issues differ should not be equal');
  });

  test('objects differing only in fixes array return false', () => {
    const a = platform({ fixes: ['add og:title'] });
    const b = platform({ fixes: ['add og:description'] });
    assertEqual(isIdentical(a, b), false, 'only fixes differ should not be equal');
  });

  test('complex object with all fields populated returns true when identical', () => {
    const overrides = {
      platformId: 'linkedin',
      platformName: 'LinkedIn',
      category: 'Professional & Social Network',
      weight: 0.9,
      grade: 'A',
      score: 88,
      issues: ['missing og:title', 'no linkedin:share-image', 'incomplete description'],
      fixes: ['add og:title', 'add linkedin:share-image', 'improve description'],
    };
    const a = platform(overrides);
    const b = platform(overrides);
    assertEqual(isIdentical(a, b), true, 'complex identical objects should be equal');
  });

  // === number precision ===
  console.log('\n=== Number precision ===');

  test('different weight precision is detected', () => {
    const a = platform({ weight: 1.0 });
    const b = platform({ weight: 1.0000001 });
    assertEqual(isIdentical(a, b), false, 'slight weight difference should be detected');
  });

  test('same weight value returns true', () => {
    const a = platform({ weight: 0.95 });
    const b = platform({ weight: 0.95 });
    assertEqual(isIdentical(a, b), true, 'identical weight should be equal');
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
