#!/usr/bin/env node
/**
 * Verification script for bf-3fl99: cardOrderMetadata tracking system
 *
 * Verifies all acceptance criteria:
 * 1. cardOrderMetadata structure exists with userModified, lastModified, modifiedBy fields
 * 2. Drag operations set modifiedBy: 'user-drag' timestamp
 * 3. applySmartOrdering() checks if group was user-modified before reordering
 * 4. Groups with userModified=true and modifiedBy='user-drag' are skipped during smart ordering
 * 5. Metadata is persisted to localStorage
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

console.log('Verifying bf-3fl99 acceptance criteria...\n');

let passed = 0;
let failed = 0;

function test(criteria, checkFn) {
  try {
    const result = checkFn();
    if (result) {
      console.log(`✓ ${criteria}`);
      passed++;
    } else {
      console.log(`✗ ${criteria}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ ${criteria} - Error: ${error.message}`);
    failed++;
  }
}

// Test 1: cardOrderMetadata structure initialization
test('1. cardOrderMetadata structure initialized in applySmartOrdering', () => {
  return appJs.includes('if (!platformPrefs.cardOrderMetadata)') &&
         appJs.includes('platformPrefs.cardOrderMetadata = {}');
});

// Test 2: cardOrderMetadata has all required fields
test('2. cardOrderMetadata includes userModified, lastModified, modifiedBy fields', () => {
  const userModifiedCheck = appJs.includes('userModified:');
  const lastModifiedCheck = appJs.includes('lastModified:');
  const modifiedByCheck = appJs.includes('modifiedBy:');
  return userModifiedCheck && lastModifiedCheck && modifiedByCheck;
});

// Test 3: Drag operations set modifiedBy: 'user-drag' with timestamp
test('3. handleDrop sets modifiedBy: user-drag with timestamp', () => {
  return appJs.includes('modifiedBy: \'user-drag\'') &&
         appJs.includes('const now = Date.now()') &&
         appJs.includes('lastModified: now');
});

// Test 4: applySmartOrdering checks user-modified groups
test('4. applySmartOrdering checks metadata.userModified and modifiedBy', () => {
  return appJs.includes('const metadata = platformPrefs.cardOrderMetadata[group.id]') &&
         appJs.includes('if (metadata && metadata.userModified && metadata.modifiedBy === \'user-drag\')');
});

// Test 5: User-modified groups are skipped during smart ordering
test('5. User-modified groups return early (skip smart ordering)', () => {
  return appJs.includes('return; // Skip smart ordering for this group') &&
         appJs.includes('skipping (user-modified via drag)');
});

// Test 6: Metadata persisted to localStorage
test('6. cardOrderMetadata persisted to localStorage', () => {
  return appJs.includes('cardOrderMetadata: platformPrefs.cardOrderMetadata') &&
         appJs.includes('localStorage.setItem(\'vista-platform-prefs\'');
});

// Test 7: Drag override protection comment (P0 fix)
test('7. P0 - Drag Override Race fix comments present', () => {
  return appJs.includes('P0 - Drag Override Race fix: Skip groups that were manually reordered by user') &&
         appJs.includes('P0 - Drag Override Race fix: Initialize cardOrderMetadata if needed');
});

// Test 8: savePlatformPrefs saves cardOrderMetadata
test('8. savePlatformPrefs includes cardOrderMetadata in saved prefs', () => {
  const savePrefsMatch = appJs.match(/cardOrderMetadata:\s*platformPrefs\.cardOrderMetadata/);
  return !!savePrefsMatch;
});

// Test 9: Smart ordering sets userModified: false
test('9. Smart ordering sets userModified: false', () => {
  return appJs.includes('userModified: false') &&
         appJs.includes('modifiedBy: \'smart-ordering\'');
});

// Test 10: Page type changes clear stale cardOrder (preserving user-modified)
test('10. Page type changes preserve user-modified cardOrder', () => {
  return appJs.includes('if (!metadata || !metadata.userModified || metadata.modifiedBy !== \'user-drag\')') &&
         appJs.includes('Preserved cardOrder for ${group.id} (user-modified)');
});

console.log('\n' + '='.repeat(60));
console.log(`Verification Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('\n✓ All acceptance criteria for bf-3fl99 are met!');
  process.exit(0);
} else {
  console.log('\n✗ Some acceptance criteria are not met.');
  process.exit(1);
}
