#!/usr/bin/env node
'use strict';

/**
 * Comprehensive Skeleton Type Mapping Verification
 *
 * This script systematically verifies each of the 31 platforms
 * returns the correct skeleton type from getSkeletonType().
 */

const { getSkeletonType, SKELETON_TYPES, getPlatformsBySkeletonType, PLATFORM_SKELETON_MAP } = require('./src/skeleton-types');
const { PLATFORMS } = require('./src/scorer');

console.log('=== Comprehensive Skeleton Type Mapping Verification ===\n');

// Track results
const results = {
  passed: [],
  failed: [],
  total: 0
};

function testPlatform(platformId, expectedType, platformName) {
  results.total++;
  try {
    const actualType = getSkeletonType(platformId);
    if (actualType === expectedType) {
      console.log(`✅ ${platformName} (${platformId}) → ${expectedType}`);
      results.passed.push({ platformId, platformName, type: actualType });
      return true;
    } else {
      console.log(`❌ ${platformName} (${platformId}) → Expected: ${expectedType}, Got: ${actualType}`);
      results.failed.push({ platformId, platformName, expected: expectedType, actual: actualType });
      return false;
    }
  } catch (e) {
    console.log(`❌ ${platformName} (${platformId}) → Error: ${e.message}`);
    results.failed.push({ platformId, platformName, error: e.message });
    return false;
  }
}

console.log('Testing all 31 platforms individually...\n');

// Get all platforms by type
const tallPlatforms = getPlatformsBySkeletonType(SKELETON_TYPES.TALL);
const shortPlatforms = getPlatformsBySkeletonType(SKELETON_TYPES.SHORT);
const textOnlyPlatforms = getPlatformsBySkeletonType(SKELETON_TYPES.TEXT_ONLY);

console.log('=== TALL PLATFORMS (11) ===\n');
tallPlatforms.sort().forEach(platformId => {
  const platform = PLATFORMS.find(p => p.id === platformId);
  const platformName = platform ? platform.name : platformId;
  testPlatform(platformId, SKELETON_TYPES.TALL, platformName);
});

console.log('\n=== SHORT PLATFORMS (19) ===\n');
shortPlatforms.sort().forEach(platformId => {
  const platform = PLATFORMS.find(p => p.id === platformId);
  const platformName = platform ? platform.name : platformId;
  testPlatform(platformId, SKELETON_TYPES.SHORT, platformName);
});

console.log('\n=== TEXT-ONLY PLATFORMS (1) ===\n');
textOnlyPlatforms.sort().forEach(platformId => {
  const platform = PLATFORMS.find(p => p.id === platformId);
  const platformName = platform ? platform.name : platformId;
  testPlatform(platformId, SKELETON_TYPES.TEXT_ONLY, platformName);
});

// Summary
console.log('\n=== VERIFICATION SUMMARY ===');
console.log(`Total platforms tested: ${results.total}`);
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n=== FAILED TESTS ===');
  results.failed.forEach(f => {
    if (f.error) {
      console.log(`  ${f.platformName} (${f.platformId}): ${f.error}`);
    } else {
      console.log(`  ${f.platformName} (${f.platformId}): Expected ${f.expected}, got ${f.actual}`);
    }
  });
}

console.log('\n=== PLATFORM DISTRIBUTION ===');
console.log(`Tall platforms: ${tallPlatforms.length}`);
console.log(`Short platforms: ${shortPlatforms.length}`);
console.log(`Text-only platforms: ${textOnlyPlatforms.length}`);
console.log(`Total: ${tallPlatforms.length + shortPlatforms.length + textOnlyPlatforms.length}`);

// List all platforms by type
console.log('\n=== ALL PLATFORMS BY TYPE ===\n');

console.log('TALL (11):');
tallPlatforms.sort().forEach(p => {
  const platform = PLATFORMS.find(pl => pl.id === p);
  console.log(`  - ${platform ? platform.name : p} (${p})`);
});

console.log('\nSHORT (19):');
shortPlatforms.sort().forEach(p => {
  const platform = PLATFORMS.find(pl => pl.id === p);
  console.log(`  - ${platform ? platform.name : p} (${p})`);
});

console.log('\nTEXT-ONLY (1):');
textOnlyPlatforms.sort().forEach(p => {
  const platform = PLATFORMS.find(pl => pl.id === p);
  console.log(`  - ${platform ? platform.name : p} (${p})`);
});

// Error handling test
console.log('\n=== ERROR HANDLING ===');
try {
  getSkeletonType('invalid_platform');
  console.log('❌ Invalid platform should throw error');
  results.failed.push({ error: 'Invalid platform did not throw error' });
} catch (e) {
  console.log('✅ Invalid platform correctly throws error');
  results.passed.push({ error: 'Invalid platform correctly throws' });
}

// Final result
console.log('\n=== FINAL RESULT ===');
if (results.failed.length === 0) {
  console.log('✅ ALL 31 PLATFORMS VERIFIED SUCCESSFULLY');
  process.exit(0);
} else {
  console.log('❌ VERIFICATION FAILED');
  process.exit(1);
}
