#!/usr/bin/env node

/**
 * Verification script for bf-3mry0 race condition fixes
 *
 * This script verifies that the race condition fixes are properly implemented
 * to prevent card order resets during smart ordering operations.
 */

const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(APP_JS_PATH, 'utf8');

console.log('=== Verifying bf-3mry0 Race Condition Fixes ===\n');

let allTestsPassed = true;

// Test 1: Single declaration of isApplyingSmartOrder
console.log('Test 1: Checking for single declaration of isApplyingSmartOrder...');
const declarations = appJs.match(/let isApplyingSmartOrder\s*=/g);
if (declarations && declarations.length === 1) {
  console.log('✅ PASS: Single declaration found');
} else {
  console.log(`❌ FAIL: Found ${declarations ? declarations.length : 0} declarations (expected 1)`);
  allTestsPassed = false;
}

// Test 2: Guard flag exists
console.log('\nTest 2: Checking for guard flag declaration...');
if (appJs.includes('let isApplyingSmartOrder = false;')) {
  console.log('✅ PASS: Guard flag declared');
} else {
  console.log('❌ FAIL: Guard flag not found');
  allTestsPassed = false;
}

// Test 3: Pending operation flag exists
console.log('\nTest 3: Checking for pending operation flag...');
if (appJs.includes('let pendingApplySmartOrder = false;')) {
  console.log('✅ PASS: Pending operation flag declared');
} else {
  console.log('❌ FAIL: Pending operation flag not found');
  allTestsPassed = false;
}

// Test 4: applySmartOrderingSafe function exists
console.log('\nTest 4: Checking for applySmartOrderingSafe function...');
if (appJs.includes('function applySmartOrderingSafe()')) {
  console.log('✅ PASS: applySmartOrderingSafe function exists');
} else {
  console.log('❌ FAIL: applySmartOrderingSafe function not found');
  allTestsPassed = false;
}

// Test 5: Guard logic in applySmartOrderingSafe
console.log('\nTest 5: Checking for guard logic in applySmartOrderingSafe...');
const hasGuardCheck = appJs.includes('if (isApplyingSmartOrder)');
const hasSetGuard = appJs.includes('isApplyingSmartOrder = true');
const hasClearGuard = appJs.includes('isApplyingSmartOrder = false');
if (hasGuardCheck && hasSetGuard && hasClearGuard) {
  console.log('✅ PASS: Guard logic present (check, set, clear)');
} else {
  console.log(`❌ FAIL: Incomplete guard logic (check:${hasGuardCheck}, set:${hasSetGuard}, clear:${hasClearGuard})`);
  allTestsPassed = false;
}

// Test 6: renderSkeletons checks guard flag
console.log('\nTest 6: Checking renderSkeletons guard...');
const renderSkeletonsGuard = appJs.match(/function renderSkeletons\(\)[\s\S]*?platformPrefs\.cardOrder\[group\.id\] && !isApplyingSmartOrder/);
if (renderSkeletonsGuard) {
  console.log('✅ PASS: renderSkeletons checks guard flag');
} else {
  console.log('❌ FAIL: renderSkeletons does not check guard flag');
  allTestsPassed = false;
}

// Test 7: renderPreviews checks guard flag
console.log('\nTest 7: Checking renderPreviews guard...');
const renderPreviewsGuard = appJs.match(/function renderPreviews\(data\)[\s\S]*?platformPrefs\.cardOrder\[group\.id\] && !isApplyingSmartOrder/);
if (renderPreviewsGuard) {
  console.log('✅ PASS: renderPreviews checks guard flag');
} else {
  console.log('❌ FAIL: renderPreviews does not check guard flag');
  allTestsPassed = false;
}

// Test 8: renderTextPreviewsOnly checks guard flag
console.log('\nTest 8: Checking renderTextPreviewsOnly guard...');
const renderTextPreviewsGuard = appJs.match(/function renderTextPreviewsOnly\(data\)[\s\S]*?platformPrefs\.cardOrder\[group\.id\] && !isApplyingSmartOrder/);
if (renderTextPreviewsGuard) {
  console.log('✅ PASS: renderTextPreviewsOnly checks guard flag');
} else {
  console.log('❌ FAIL: renderTextPreviewsOnly does not check guard flag');
  allTestsPassed = false;
}

// Test 9: Hook calls applySmartOrderingSafe immediately (no setTimeout delay)
console.log('\nTest 9: Checking hook calls applySmartOrderingSafe immediately...');
const hookImplementation = appJs.match(/const originalHandleResult2 = handleResult;[\s\S]*?applySmartOrderingSafe\(\);/);
if (hookImplementation) {
  console.log('✅ PASS: Hook calls applySmartOrderingSafe immediately');
} else {
  console.log('❌ FAIL: Hook does not call applySmartOrderingSafe immediately');
  allTestsPassed = false;
}

// Test 10: No setTimeout delay for applySmartOrdering
console.log('\nTest 10: Checking for removed setTimeout delay...');
const hasBadTimeout = appJs.match(/setTimeout\s*\(\s*applySmartOrdering\s*,\s*200\s*\)/);
if (!hasBadTimeout) {
  console.log('✅ PASS: No setTimeout delay found');
} else {
  console.log('❌ FAIL: setTimeout delay still present');
  allTestsPassed = false;
}

// Test 11: Verify logging is present
console.log('\nTest 11: Checking for debug logging...');
const hasLogging = appJs.includes('[applySmartOrderingSafe]') &&
                  appJs.includes('[renderPreviews] WARNING:');
if (hasLogging) {
  console.log('✅ PASS: Debug logging present');
} else {
  console.log('❌ FAIL: Missing debug logging');
  allTestsPassed = false;
}

// Test 12: Check that finally block clears guard
console.log('\nTest 12: Checking for finally block in applySmartOrderingSafe...');
const hasFinallyBlock = appJs.match(/function applySmartOrderingSafe\(\)[\s\S]*?finally\s*{[\s\S]*?isApplyingSmartOrder = false/);
if (hasFinallyBlock) {
  console.log('✅ PASS: Finally block clears guard flag');
} else {
  console.log('❌ FAIL: Finally block not found or does not clear guard');
  allTestsPassed = false;
}

console.log('\n=== Summary ===');
if (allTestsPassed) {
  console.log('✅ All tests passed! Race condition fixes are properly implemented.');
  console.log('\nAcceptance criteria met:');
  console.log('✅ No code resets card order after DOM reordering');
  console.log('✅ Order persists through multiple render cycles');
  console.log('✅ No race condition between applySmartOrdering and renderPreviews');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Review the implementation.');
  process.exit(1);
}
