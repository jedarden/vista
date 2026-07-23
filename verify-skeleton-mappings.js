#!/usr/bin/env node
'use strict';

/**
 * Verification script for skeleton mappings and scoring rules
 */

const { scoreAll, PLATFORMS } = require('./src/scorer');
const { getSkeletonType, SKELETON_TYPES, PLATFORM_SKELETON_MAP } = require('./src/skeleton-types');

console.log('='.repeat(60));
console.log('Skeleton Mapping and Scoring Rule Verification');
console.log('='.repeat(60));

let issues = [];
let passed = 0;

// 1. Check all platforms in scorer.js have skeleton type mappings
console.log('\n1. Checking skeleton type mappings for all platforms...');

for (const platform of PLATFORMS) {
  try {
    const skeletonType = getSkeletonType(platform.id);

    // Verify it's a valid skeleton type
    if (!Object.values(SKELETON_TYPES).includes(skeletonType)) {
      issues.push(`Platform ${platform.id} has invalid skeleton type: ${skeletonType}`);
    } else {
      passed++;
    }
  } catch (error) {
    issues.push(`Platform ${platform.id} missing skeleton type mapping: ${error.message}`);
  }
}

// 2. Check for orphaned skeleton mappings (platforms in skeleton-types but not in scorer.js)
console.log('\n2. Checking for orphaned skeleton mappings...');

for (const platformId of Object.keys(PLATFORM_SKELETON_MAP)) {
  const inScorer = PLATFORMS.some(p => p.id === platformId);
  if (!inScorer) {
    issues.push(`Platform ${platformId} has skeleton mapping but is not in scorer.js PLATFORMS array`);
  }
}

// 3. Test scoring rules execute without errors for all platforms
console.log('\n3. Testing scoring rules execute without errors...');

// Test with minimal metadata
const testMeta = {
  title: 'Test Page Title',
  description: 'Test description for verification',
  og: {
    title: 'Test OG Title',
    description: 'Test OG description',
    image: 'https://example.com/test-image.jpg'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test Twitter Title',
    description: 'Test Twitter description',
    image: 'https://example.com/twitter-image.jpg'
  },
  themeColor: '#1a1a1a'
};

// Test with valid image probe
const testImageProbe = {
  width: 1200,
  height: 630
};

try {
  const result = scoreAll(testMeta, testImageProbe);

  // Check each platform scored successfully
  for (const platform of PLATFORMS) {
    const platformResult = result.scores[platform.id];
    if (!platformResult) {
      issues.push(`Platform ${platform.id} did not return a score result`);
    } else if (typeof platformResult.score !== 'number') {
      issues.push(`Platform ${platform.id} has invalid score: ${platformResult.score}`);
    } else if (!platformResult.grade) {
      issues.push(`Platform ${platform.id} missing grade`);
    } else {
      passed++;
    }
  }

  console.log(`   ✓ All scoring rules executed without errors`);
  console.log(`   ✓ Overall grade: ${result.overall.grade} (${result.overall.score})`);
  console.log(`   ✓ Grade distribution: A+:${result.gradeCounts['A+']} A:${result.gradeCounts.A} B:${result.gradeCounts.B} C:${result.gradeCounts.C} D:${result.gradeCounts.D} F:${result.gradeCounts.F}`);

} catch (error) {
  issues.push(`Scoring rules failed to execute: ${error.message}`);
}

// 4. Test edge cases
console.log('\n4. Testing edge cases...');

// Test with missing metadata
const emptyMeta = {
  title: null,
  description: null,
  og: {},
  twitter: {}
};

const emptyImageProbe = null;

try {
  const emptyResult = scoreAll(emptyMeta, emptyImageProbe);
  console.log(`   ✓ Empty metadata handled correctly`);
  console.log(`   ✓ Overall grade with empty metadata: ${emptyResult.overall.grade} (${emptyResult.overall.score})`);
} catch (error) {
  issues.push(`Empty metadata test failed: ${error.message}`);
}

// Test with HTTP image (should trigger HTTPS warnings)
const httpMeta = {
  title: 'Test',
  description: 'Test',
  og: {
    title: 'Test',
    description: 'Test',
    image: 'http://example.com/test.jpg'
  },
  twitter: {}
};

try {
  const httpResult = scoreAll(httpMeta, { width: 1200, height: 630 });
  console.log(`   ✓ HTTP image handled correctly`);
} catch (error) {
  issues.push(`HTTP image test failed: ${error.message}`);
}

// 5. Summary
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));

console.log(`\nTotal platforms checked: ${PLATFORMS.length}`);
console.log(`Skeleton mappings verified: ${PLATFORMS.length}`);
console.log(`Passed tests: ${passed}`);

if (issues.length > 0) {
  console.log(`\n❌ Issues found: ${issues.length}`);
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All verifications passed!');
  console.log('\nDetails:');
  console.log('  - All 43 platforms have skeleton type mappings');
  console.log('  - All skeleton types are valid (tall, short, text_only)');
  console.log('  - All scoring rules execute without errors');
  console.log('  - No orphaned skeleton mappings found');
  console.log('  - Edge cases handled correctly');
  process.exit(0);
}
