#!/usr/bin/env node

/**
 * Test script to verify applySmartOrdering() execution flow
 *
 * This script:
 * 1. Reads the app.js source code
 * 2. Verifies the function is defined
 * 3. Verifies the handleResult hook calls it
 * 4. Checks for proper console.log statements
 * 5. Verifies parameter passing
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const source = fs.readFileSync(appJsPath, 'utf8');

console.log('=== Vista applySmartOrdering Execution Flow Verification ===\n');

// Test 1: Verify applySmartOrdering function exists
console.log('✓ Test 1: Checking if applySmartOrdering function is defined...');
if (source.includes('function applySmartOrdering()')) {
  console.log('  ✅ PASS: Function is defined\n');
} else {
  console.log('  ❌ FAIL: Function not found\n');
  process.exit(1);
}

// Test 2: Verify function has entry log
console.log('✓ Test 2: Checking for entry console.log...');
if (source.includes("console.log('[applySmartOrdering] Function called')")) {
  console.log('  ✅ PASS: Entry log found\n');
} else {
  console.log('  ❌ FAIL: Entry log missing\n');
  process.exit(1);
}

// Test 3: Verify handleResult hook exists
console.log('✓ Test 3: Checking if handleResult hook is set up...');
const hookPattern = /const originalHandleResult2 = handleResult;[\s\S]*?handleResult = function\(data\)/;
if (hookPattern.test(source)) {
  console.log('  ✅ PASS: handleResult hook found\n');
} else {
  console.log('  ❌ FAIL: handleResult hook not found\n');
  process.exit(1);
}

// Test 4: Verify hook calls applySmartOrdering
console.log('✓ Test 4: Checking if hook calls applySmartOrdering...');
if (source.includes('setTimeout(applySmartOrdering, 200)')) {
  console.log('  ✅ PASS: Hook calls applySmartOrdering with 200ms delay\n');
} else {
  console.log('  ❌ FAIL: Hook does not call applySmartOrdering\n');
  process.exit(1);
}

// Test 5: Verify hook has logging
console.log('✓ Test 5: Checking for hook console.logs...');
if (source.includes("console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering)") &&
    source.includes("console.log('[handleResult hook] about to call applySmartOrdering after 200ms delay')")) {
  console.log('  ✅ PASS: Hook has proper logging\n');
} else {
  console.log('  ❌ FAIL: Hook logging missing\n');
  process.exit(1);
}

// Test 6: Verify platformPrefs.smartOrdering check
console.log('✓ Test 6: Checking for smartOrdering preference check...');
if (source.includes('if (platformPrefs.smartOrdering)')) {
  console.log('  ✅ PASS: smartOrdering preference check found\n');
} else {
  console.log('  ❌ FAIL: Preference check missing\n');
  process.exit(1);
}

// Test 7: Verify default value is true
console.log('✓ Test 7: Checking if smartOrdering defaults to true...');
if (source.includes('smartOrdering: true,')) {
  console.log('  ✅ PASS: Default value is true\n');
} else {
  console.log('  ❌ FAIL: Default value not set to true\n');
  process.exit(1);
}

// Test 8: Verify early exit conditions
console.log('✓ Test 8: Checking for early exit conditions...');
if (source.includes("if (!currentData)") &&
    source.includes("if (!platformPrefs.smartOrdering)")) {
  console.log('  ✅ PASS: Early exit conditions present\n');
} else {
  console.log('  ❌ FAIL: Early exit conditions missing\n');
  process.exit(1);
}

// Test 9: Verify platformPrefs initialization
console.log('✓ Test 9: Checking platformPrefs initialization...');
if (source.includes('let platformPrefs = {') &&
    source.includes('favorites: new Set()') &&
    source.includes('hidden: new Set()')) {
  console.log('  ✅ PASS: platformPrefs properly initialized\n');
} else {
  console.log('  ❌ FAIL: platformPrefs initialization incomplete\n');
  process.exit(1);
}

// Test 10: Verify localStorage integration
console.log('✓ Test 10: Checking localStorage integration...');
if (source.includes('platformPrefs.smartOrdering = parsed.smartOrdering !== false;')) {
  console.log('  ✅ PASS: localStorage loading found\n');
} else {
  console.log('  ❌ FAIL: localStorage loading missing\n');
  process.exit(1);
}

console.log('=== All Tests Passed! ===\n');
console.log('Summary:');
console.log('  ✅ applySmartOrdering function is defined');
console.log('  ✅ Entry logging is present');
console.log('  ✅ handleResult hook is set up');
console.log('  ✅ Hook calls applySmartOrdering with delay');
console.log('  ✅ Hook has proper logging');
console.log('  ✅ smartOrdering preference is checked');
console.log('  ✅ Default value is true (enabled by default)');
console.log('  ✅ Early exit conditions are present');
console.log('  ✅ platformPrefs is properly initialized');
console.log('  ✅ localStorage integration is present');
console.log('\n🎉 Execution flow verification complete!');
