'use strict';

/**
 * Tests for platform metadata comparison helper functions.
 * Run with: node test-platform-compare.js
 */

const {
  isIdentical,
  getChangedFields,
  getMissingTags,
  comparePlatformMeta,
  formatComparisonSummary,
  CRITICAL_FIELDS,
} = require('./src/platform-compare');

// Test data fixtures
const metaComplete = {
  title: 'Test Page',
  description: 'A test description',
  ogTitle: 'OG Title',
  ogDescription: 'OG Description',
  ogImage: 'https://example.com/image.png',
  ogType: 'website',
  ogUrl: 'https://example.com/page',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Twitter Title',
  twitterDescription: 'Twitter Description',
  twitterImage: 'https://example.com/twitter.png',
  canonical: 'https://example.com/canonical',
  robots: 'index,follow',
};

const metaMinimal = {
  title: 'Test Page',
  description: 'A test description',
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

const metaDifferent = {
  title: 'Different Title',
  description: 'Different description',
  ogTitle: 'Different OG Title',
  ogDescription: 'Different OG Description',
  ogImage: 'https://example.com/different.png',
  ogType: 'article',
  ogUrl: 'https://example.com/different',
  twitterCard: 'summary',
  twitterTitle: 'Different Twitter Title',
  twitterDescription: 'Different Twitter Description',
  twitterImage: 'https://example.com/different-twitter.png',
  canonical: 'https://example.com/different-canonical',
  robots: 'noindex,nofollow',
};

const metaPartial = {
  title: 'Test Page',
  description: 'A test description',
  ogTitle: 'OG Title',
  ogDescription: null,
  ogImage: 'https://example.com/image.png',
  ogType: null,
  ogUrl: null,
  twitterCard: 'summary_large_image',
  twitterTitle: null,
  twitterDescription: null,
  twitterImage: null,
  canonical: null,
  robots: null,
};

// Test runner
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

function runTests() {
  console.log('Testing platform metadata comparison functions...\n');

  // Test 1: isIdentical with identical objects
  assert(
    isIdentical(metaComplete, metaComplete),
    'isIdentical returns true for identical objects'
  );

  // Test 2: isIdentical with completely different objects
  assert(
    !isIdentical(metaComplete, metaDifferent),
    'isIdentical returns false for different objects'
  );

  // Test 3: isIdentical treats null/empty as equivalent
  assert(
    isIdentical(metaMinimal, { title: 'Test Page', description: 'A test description' }),
    'isIdentical treats null/undefined as equivalent to empty'
  );

  // Test 4: isIdentical with partial vs complete (should be false)
  assert(
    !isIdentical(metaPartial, metaComplete),
    'isIdentical returns false when one has more fields populated'
  );

  // Test 5: getChangedFields with no changes
  const noChanges = getChangedFields(metaComplete, metaComplete);
  assert(
    noChanges.length === 0,
    'getChangedFields returns empty array for identical objects'
  );

  // Test 6: getChangedFields with some changes
  const someChanges = getChangedFields(metaComplete, metaPartial);
  assert(
    someChanges.length > 0,
    'getChangedFields returns changes for different objects'
  );
  assert(
    someChanges.some(c => c.field === 'ogDescription'),
    'getChangedFields includes ogDescription change'
  );

  // Test 7: getChangedFields with all different
  const allChanges = getChangedFields(metaComplete, metaDifferent);
  assert(
    allChanges.length === CRITICAL_FIELDS.length,
    'getChangedFields returns all fields when completely different'
  );

  // Test 8: getMissingTags - complete vs minimal
  const missingInMinimal = getMissingTags(metaComplete, metaMinimal);
  assert(
    missingInMinimal.length > 0,
    'getMissingTags detects missing tags'
  );
  assert(
    missingInMinimal.some(m => m.field === 'ogTitle'),
    'getMissingTags includes ogTitle as missing'
  );

  // Test 9: getMissingTags - minimal vs complete (reverse)
  const missingInComplete = getMissingTags(metaMinimal, metaComplete);
  assert(
    missingInComplete.length === 0,
    'getMissingTags returns empty when target has all source tags'
  );

  // Test 10: comparePlatformMeta comprehensive test
  const comparison = comparePlatformMeta(metaComplete, metaPartial);
  assert(
    !comparison.isIdentical,
    'comparePlatformMeta correctly identifies non-identical objects'
  );
  assert(
    comparison.changedFields.length > 0,
    'comparePlatformMeta includes changedFields'
  );
  assert(
    comparison.missingInB.length > 0,
    'comparePlatformMeta includes missingInB'
  );

  // Test 11: formatComparisonSummary for identical objects
  const identicalSummary = formatComparisonSummary(comparePlatformMeta(metaComplete, metaComplete));
  assert(
    identicalSummary.includes('✓ Metadata is identical'),
    'formatComparisonSummary shows identical message for identical objects'
  );

  // Test 12: formatComparisonSummary for different objects
  const diffSummary = formatComparisonSummary(comparePlatformMeta(metaComplete, metaPartial));
  assert(
    diffSummary.includes('✗ Metadata differs'),
    'formatComparisonSummary shows differs message for non-identical objects'
  );
  assert(
    diffSummary.includes('Changed fields:'),
    'formatComparisonSummary includes Changed fields section'
  );

  // Test 13: Edge case - null/undefined handling
  assert(
    isIdentical(null, null),
    'isIdentical handles null-null comparison'
  );
  assert(
    !isIdentical(metaComplete, null),
    'isIdentical returns false when one is null'
  );

  // Test 14: Whitespace trimming
  const metaWithWhitespace = {
    title: '  Test Page  ',
    description: 'A test description',
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
  assert(
    isIdentical(metaMinimal, metaWithWhitespace),
    'isIdentical trims whitespace when comparing'
  );

  console.log('\n✅ All tests passed!');
}

// Run tests
runTests();
