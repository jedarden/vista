#!/usr/bin/env node
'use strict';

/**
 * Skeleton Type Verification Script
 *
 * Tests the getSkeletonType function and platform mappings
 */

const { getSkeletonType, SKELETON_TYPES, getPlatformsBySkeletonType } = require('./skeleton-types');
const { PLATFORMS } = require('./scorer');

console.log('=== Skeleton Type Verification ===\n');

let passedTests = 0;
let failedTests = 0;

function test(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passedTests++;
  } else {
    console.log(`❌ ${description}`);
    failedTests++;
  }
}

// Test 1: All platforms have a skeleton type mapping
console.log('Testing platform coverage...');
try {
  let allPlatformsMapped = true;
  for (const platform of PLATFORMS) {
    try {
      getSkeletonType(platform.id);
    } catch (e) {
      console.error(`Missing mapping for platform: ${platform.id}`);
      allPlatformsMapped = false;
    }
  }
  test(`All ${PLATFORMS.length} platforms have skeleton type mapping`, allPlatformsMapped);
} catch (e) {
  test('All platforms have skeleton type mapping', false);
  console.error('Error:', e.message);
}

// Test 2: Correct skeleton type for specific platforms
console.log('\nTesting specific platform skeleton types...');

test('Google is text-only', getSkeletonType('google') === SKELETON_TYPES.TEXT_ONLY);
test('Facebook is tall', getSkeletonType('facebook') === SKELETON_TYPES.TALL);
test('Twitter is tall', getSkeletonType('twitter') === SKELETON_TYPES.TALL);
test('LinkedIn is tall', getSkeletonType('linkedin') === SKELETON_TYPES.TALL);
test('Reddit is tall', getSkeletonType('reddit') === SKELETON_TYPES.TALL);
test('WhatsApp is short', getSkeletonType('whatsapp') === SKELETON_TYPES.SHORT);
test('Slack is short', getSkeletonType('slack') === SKELETON_TYPES.SHORT);
test('Discord is short', getSkeletonType('discord') === SKELETON_TYPES.SHORT);
test('Notion is short', getSkeletonType('notion') === SKELETON_TYPES.SHORT);
test('iMessage is short', getSkeletonType('imessage') === SKELETON_TYPES.SHORT);

// Test 3: Platform counts by skeleton type
console.log('\nTesting platform distribution...');

const tallPlatforms = getPlatformsBySkeletonType(SKELETON_TYPES.TALL);
const shortPlatforms = getPlatformsBySkeletonType(SKELETON_TYPES.SHORT);
const textOnlyPlatforms = getPlatformsBySkeletonType(SKELETON_TYPES.TEXT_ONLY);

test(`Tall platforms count: ${tallPlatforms.length} (expected 17)`, tallPlatforms.length === 17);
test(`Short platforms count: ${shortPlatforms.length} (expected 25)`, shortPlatforms.length === 25);
test(`Text-only platforms count: ${textOnlyPlatforms.length} (expected 1)`, textOnlyPlatforms.length === 1);
test(`Total platforms: ${tallPlatforms.length + shortPlatforms.length + textOnlyPlatforms.length} (expected 43)`,
  (tallPlatforms.length + shortPlatforms.length + textOnlyPlatforms.length) === 43);

// Test 4: Verify key platforms in each category
console.log('\nVerifying platform categories...');

test('Tall includes Facebook', tallPlatforms.includes('facebook'));
test('Tall includes Twitter', tallPlatforms.includes('twitter'));
test('Tall includes LinkedIn', tallPlatforms.includes('linkedin'));
test('Tall includes Reddit', tallPlatforms.includes('reddit'));
test('Tall includes Medium', tallPlatforms.includes('medium'));
test('Tall includes Substack', tallPlatforms.includes('substack'));

test('Short includes WhatsApp', shortPlatforms.includes('whatsapp'));
test('Short includes Slack', shortPlatforms.includes('slack'));
test('Short includes Discord', shortPlatforms.includes('discord'));
test('Short includes Notion', shortPlatforms.includes('notion'));
test('Short includes GitHub', shortPlatforms.includes('github'));
test('Short includes iMessage', shortPlatforms.includes('imessage'));
test('Short includes Gmail', shortPlatforms.includes('gmail'));
test('Short includes Outlook', shortPlatforms.includes('outlook'));

test('Text-only includes Google', textOnlyPlatforms.includes('google'));

// Test 5: Invalid platform throws error
console.log('\nTesting error handling...');
try {
  getSkeletonType('invalid_platform');
  test('Invalid platform throws error', false);
} catch (e) {
  test('Invalid platform throws error', true);
}

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
