/**
 * Test that skeleton types affect card DOM structure.
 * Verifies that renderPlatformCard() uses getSkeletonType() to determine structure.
 */

const fs = require('fs');
const path = require('path');

// Load app.js content
const appContent = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('Testing skeleton type to DOM structure mapping...\n');

// Test 1: Check that renderPlatformCard calls getSkeletonType
const test1 = appContent.includes('const skeletonType = getSkeletonType(pid)');
console.log(`✓ Test 1: renderPlatformCard() calls getSkeletonType(): ${test1 ? 'PASS' : 'FAIL'}`);

// Test 2: Check that renderCardBySkeletonType function exists
const test2 = appContent.includes('function renderCardBySkeletonType(');
console.log(`✓ Test 2: renderCardBySkeletonType() function exists: ${test2 ? 'PASS' : 'FAIL'}`);

// Test 3: Check for 'text-only' skeleton handling
const test3 = appContent.includes("skeletonType === 'text-only'");
console.log(`✓ Test 3: Handles text-only skeleton type: ${test3 ? 'PASS' : 'FAIL'}`);

// Test 4: Check for 'short' skeleton handling
const test4 = appContent.includes("skeletonType === 'short'");
console.log(`✓ Test 4: Handles short skeleton type: ${test4 ? 'PASS' : 'FAIL'}`);

// Test 5: Check for 'tall' skeleton handling
const test5 = appContent.includes("skeletonType === 'tall'");
console.log(`✓ Test 5: Handles tall skeleton type: ${test5 ? 'PASS' : 'FAIL'}`);

// Test 6: Check that the old switch statement is removed
const test6 = !appContent.includes('switch (pid) {') || appContent.indexOf('switch (pid) {') > appContent.indexOf('function renderPlatformCard(') + 5000;
console.log(`✓ Test 6: Old hardcoded switch statement removed: ${test6 ? 'PASS' : 'FAIL'}`);

// Test 7: Verify DOM structure comment mentions skeleton types
const test7 = appContent.includes('TALL: Image on top, content below') &&
             appContent.includes('SHORT: Thumbnail on left, content on right') &&
             appContent.includes('TEXT_ONLY: No image, content only');
console.log(`✓ Test 7: DOM structure documented by skeleton type: ${test7 ? 'PASS' : 'FAIL'}`);

// Test 8: Check that the function skeleton type determines structure
const test8 = appContent.includes('renderCardBySkeletonType(pid, skeletonType');
console.log(`✓ Test 8: Skeleton type passed to render function: ${test8 ? 'PASS' : 'FAIL'}`);

console.log('\n=== Summary ===');
const allPassed = test1 && test2 && test3 && test4 && test5 && test6 && test7 && test8;
console.log(`All tests: ${allPassed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test platform mapping
console.log('\n=== Platform Skeleton Type Examples ===');
const platforms = [
  { pid: 'facebook', expected: 'tall' },
  { pid: 'twitter', expected: 'tall' },
  { pid: 'linkedin', expected: 'tall' },
  { pid: 'whatsapp', expected: 'short' },
  { pid: 'slack', expected: 'short' },
  { pid: 'discord', expected: 'tall' },
  { pid: 'google', expected: 'text-only' },
];

// Extract PLATFORM_SKELETON_TYPES from app.js
const skeletonMatch = appContent.match(/const PLATFORM_SKELETON_TYPES = \{([\s\S]*?)\};/);
if (skeletonMatch) {
  const skeletonBlock = skeletonMatch[1];
  platforms.forEach(({ pid, expected }) => {
    const hasExpected = skeletonBlock.includes(`${pid}: '${expected}'`);
    console.log(`${pid}: ${expected} - ${hasExpected ? '✓' : '✗'}`);
  });
}

process.exit(allPassed ? 0 : 1);
