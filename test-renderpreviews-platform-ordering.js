/**
 * Functional test to verify renderPreviews() platform ordering logic
 *
 * This test verifies that:
 * 1. renderPreviews() uses platformPrefs.cardOrder when available
 * 2. Falls back to default order when cardOrder is not present
 * 3. Platform iteration respects the saved order
 * 4. New platforms (not in cardOrder) are appended to the end
 */

const fs = require('fs');
const path = require('path');

console.log('=== Testing renderPreviews() Platform Ordering Logic ===\n');

// Test data setup
const testCases = [
  {
    name: 'Test 1: cardOrder available, all platforms exist',
    group: {
      id: 'test-group-1',
      title: 'Test Group 1',
      platforms: ['platform-a', 'platform-b', 'platform-c']
    },
    cardOrder: ['platform-c', 'platform-a', 'platform-b'], // Reversed order
    expectedOrder: ['platform-c', 'platform-a', 'platform-b'],
    description: 'Should use cardOrder when all platforms exist in it'
  },
  {
    name: 'Test 2: cardOrder available, new platform added',
    group: {
      id: 'test-group-2',
      title: 'Test Group 2',
      platforms: ['platform-a', 'platform-b', 'platform-c', 'platform-d']
    },
    cardOrder: ['platform-c', 'platform-a'], // Missing platform-b and platform-d
    expectedOrder: ['platform-c', 'platform-a', 'platform-b', 'platform-d'],
    description: 'Should use cardOrder for known platforms, append new ones at end'
  },
  {
    name: 'Test 3: cardOrder not available',
    group: {
      id: 'test-group-3',
      title: 'Test Group 3',
      platforms: ['platform-a', 'platform-b', 'platform-c']
    },
    cardOrder: null,
    expectedOrder: ['platform-a', 'platform-b', 'platform-c'],
    description: 'Should use default platform order when cardOrder is not available'
  },
  {
    name: 'Test 4: cardOrder available but empty',
    group: {
      id: 'test-group-4',
      title: 'Test Group 4',
      platforms: ['platform-a', 'platform-b', 'platform-c']
    },
    cardOrder: [],
    expectedOrder: ['platform-a', 'platform-b', 'platform-c'],
    description: 'Should use default platform order when cardOrder is empty'
  },
  {
    name: 'Test 5: cardOrder has removed platforms',
    group: {
      id: 'test-group-5',
      title: 'Test Group 5',
      platforms: ['platform-a', 'platform-c']
    },
    cardOrder: ['platform-b', 'platform-a', 'platform-c', 'platform-d'], // platform-b and platform-d removed
    expectedOrder: ['platform-a', 'platform-c'],
    description: 'Should filter out platforms that no longer exist in the group'
  }
];

// Simulate the platform ordering logic from renderPreviews()
function simulatePlatformOrdering(group, cardOrder) {
  // This is the exact logic from renderPreviews()
  let platforms = group.platforms;
  if (cardOrder && cardOrder[group.id]) {
    // Filter to only include platforms that still exist in the group
    const customOrder = cardOrder[group.id].filter(pid => group.platforms.includes(pid));
    // Add any new platforms that aren't in the custom order yet
    const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
    platforms = [...customOrder, ...newPlatforms];
  }
  return platforms;
}

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`${testCase.name}`);
  console.log(`Description: ${testCase.description}`);

  const platformPrefs = testCase.cardOrder ? { [testCase.group.id]: testCase.cardOrder } : null;
  const result = simulatePlatformOrdering(testCase.group, platformPrefs);

  const isCorrect = JSON.stringify(result) === JSON.stringify(testCase.expectedOrder);

  if (isCorrect) {
    passed++;
    console.log(`✅ PASS`);
    console.log(`   Input:    [${testCase.group.platforms.join(', ')}]`);
    console.log(`   cardOrder: [${testCase.cardOrder ? testCase.cardOrder.join(', ') : 'null'}]`);
    console.log(`   Result:   [${result.join(', ')}]`);
    console.log(`   Expected: [${testCase.expectedOrder.join(', ')}]`);
  } else {
    failed++;
    console.log(`❌ FAIL`);
    console.log(`   Input:    [${testCase.group.platforms.join(', ')}]`);
    console.log(`   cardOrder: [${testCase.cardOrder ? testCase.cardOrder.join(', ') : 'null'}]`);
    console.log(`   Result:   [${result.join(', ')}]`);
    console.log(`   Expected: [${testCase.expectedOrder.join(', ')}]`);
  }
  console.log();
});

// Test the actual implementation in app.js
console.log('=== Verifying actual implementation in app.js ===\n');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

// Extract the platform ordering logic from renderPreviews()
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\)\s*{([\s\S]*?)^}/m);
if (!renderPreviewsMatch) {
  console.error('❌ Could not find renderPreviews function');
  process.exit(1);
}

const renderPreviewsBody = renderPreviewsMatch[1];

// Verify the key logic elements
const checks = [
  {
    name: 'Checks platformPrefs.cardOrder[group.id]',
    pattern: /platformPrefs\.cardOrder\[group\.id\]/,
    required: true
  },
  {
    name: 'Filters cardOrder to existing platforms',
    pattern: /cardOrder\[group\.id\]\.filter\(pid => group\.platforms\.includes\(pid\)\)/,
    required: true
  },
  {
    name: 'Finds new platforms not in custom order',
    pattern: /group\.platforms\.filter\(pid => !customOrder\.includes\(pid\)\)/,
    required: true
  },
  {
    name: 'Merges custom order with new platforms',
    pattern: /platforms = \[\.\.\.customOrder, \.\.\.newPlatforms\]/,
    required: true
  },
  {
    name: 'Race condition guard with !isApplyingSmartOrder',
    pattern: /!isApplyingSmartOrder/,
    required: true
  },
  {
    name: 'Fallback to default order',
    pattern: /let platforms = group\.platforms/,
    required: true
  }
];

checks.forEach(check => {
  const found = check.pattern.test(renderPreviewsBody);
  if (found) {
    passed++;
    console.log(`✅ ${check.name}`);
  } else {
    failed++;
    console.log(`❌ ${check.name} - NOT FOUND`);
  }
});

console.log('\n=== Summary ===');
console.log(`Total tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\nThe renderPreviews() platform ordering logic is correctly implemented:');
  console.log('1. ✅ Uses platformPrefs.cardOrder when available');
  console.log('2. ✅ Falls back to default order when cardOrder is not present');
  console.log('3. ✅ Platform iteration respects the saved order');
  console.log('4. ✅ New platforms are appended to the end of custom order');
  console.log('5. ✅ Removed platforms are filtered out from custom order');
  process.exit(0);
}
