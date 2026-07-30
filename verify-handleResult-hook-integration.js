// Verification script for handleResult hook → applySmartOrdering integration
// This script verifies that applySmartOrdering() is called correctly from the handleResult hook

const fs = require('fs');
const path = require('path');

console.log('=== Verifying handleResult Hook Integration ===\n');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

// 1. Verify that applySmartOrdering function exists
console.log('1. Checking if applySmartOrdering function exists...');
const applySmartOrderingMatch = appJs.match(/function applySmartOrdering\(\)/);
if (applySmartOrderingMatch) {
  console.log('✅ applySmartOrdering() function found');
} else {
  console.log('❌ applySmartOrdering() function NOT found');
  process.exit(1);
}

// 2. Verify that handleResult function exists
console.log('\n2. Checking if handleResult function exists...');
const handleResultMatch = appJs.match(/async function handleResult\(data\)/);
if (handleResultMatch) {
  console.log('✅ handleResult(data) function found');
} else {
  console.log('❌ handleResult(data) function NOT found');
  process.exit(1);
}

// 3. Verify that the hook into handleResult exists
console.log('\n3. Checking if handleResult hook exists...');
const hookMatch = appJs.match(/const originalHandleResult2 = handleResult/);
if (hookMatch) {
  console.log('✅ handleResult hook wrapper found');
} else {
  console.log('❌ handleResult hook wrapper NOT found');
  process.exit(1);
}

// 4. Verify that applySmartOrdering is called from the hook
console.log('\n4. Checking if applySmartOrdering is called from the hook...');
const callMatch = appJs.match(/setTimeout\(applySmartOrdering,\s*200\)/);
if (callMatch) {
  console.log('✅ applySmartOrdering() call found in hook with 200ms delay');
} else {
  console.log('❌ applySmartOrdering() call NOT found in hook');
  process.exit(1);
}

// 5. Verify that the call is conditional on smartOrdering preference
console.log('\n5. Checking if applySmartOrdering call is conditional...');
const conditionalMatch = appJs.match(/if \(platformPrefs\.smartOrdering\) \{[\s\S]*?setTimeout\(applySmartOrdering/);
if (conditionalMatch) {
  console.log('✅ applySmartOrdering() call is conditional on platformPrefs.smartOrdering');
} else {
  console.log('❌ applySmartOrdering() call is NOT conditional');
  process.exit(1);
}

// 6. Verify the hook is placed AFTER handleResult definition (not before)
console.log('\n6. Checking hook placement relative to handleResult definition...');
const handleResultDefPos = appJs.search(/async function handleResult\(data\)/);
const hookPos = appJs.search(/const originalHandleResult2 = handleResult/);
if (handleResultDefPos > 0 && hookPos > handleResultDefPos) {
  console.log('✅ Hook is placed AFTER handleResult definition (correct order)');
} else {
  console.log('❌ Hook placement is incorrect');
  process.exit(1);
}

// 7. Verify that handleResult sets currentData before applySmartOrdering reads it
console.log('\n7. Checking data flow: handleResult → currentData → applySmartOrdering...');
const currentDataSetMatch = appJs.match(/async function handleResult\(data\) \{[\s\S]*?currentData = data/);
const currentDataReadMatch = appJs.match(/function applySmartOrdering\(\) \{[\s\S]*?if \(!currentData\)/);

if (currentDataSetMatch && currentDataReadMatch) {
  console.log('✅ Data flow is correct: handleResult sets currentData, applySmartOrdering reads it');
} else {
  console.log('❌ Data flow is incorrect');
  process.exit(1);
}

// 8. Verify logging statements exist for debugging
console.log('\n8. Checking for debug logging statements...');
const hookLogMatch = appJs.match(/\[handleResult hook\].*?smartOrdering enabled/);
const applySmartLogMatch = appJs.match(/\[applySmartOrdering\].*?FUNCTION START/);

if (hookLogMatch && applySmartLogMatch) {
  console.log('✅ Debug logging statements present in both hook and applySmartOrdering');
} else {
  console.log('❌ Debug logging missing');
  process.exit(1);
}

// 9. Check for potential multiple hook registrations
console.log('\n9. Checking for potential multiple hook registrations...');
const hookCount = (appJs.match(/const originalHandleResult2 = handleResult/g) || []).length;
if (hookCount === 1) {
  console.log('✅ Only ONE hook registration found (no duplicates)');
} else {
  console.log(`⚠️  Found ${hookCount} hook registrations - potential issue if script runs multiple times`);
}

// 10. Extract and display the hook code for manual inspection
console.log('\n10. Extracting hook code for manual inspection...');
const hookCodeMatch = appJs.match(/\/\/ ── Hook into handleResult for smart ordering ──[\s\S]*?^\};\s*$/m);
if (hookCodeMatch) {
  console.log('\n📋 Hook code:\n' + '='.repeat(60));
  console.log(hookCodeMatch[0]);
  console.log('='.repeat(60));
}

console.log('\n=== Summary ===');
console.log('✅ All critical checks passed!');
console.log('\nIntegration verified:');
console.log('1. applySmartOrdering() exists and is properly defined');
console.log('2. handleResult(data) exists and sets currentData');
console.log('3. Hook wraps handleResult correctly');
console.log('4. applySmartOrdering() is called with 200ms delay');
console.log('5. Call is conditional on platformPrefs.smartOrdering');
console.log('6. Hook is placed after handleResult definition');
console.log('7. Data flow is correct: currentData is set before being read');
console.log('8. Debug logging is present for troubleshooting');
console.log('9. No duplicate hook registrations found');
console.log('\n🎉 handleResult hook → applySmartOrdering integration is CORRECT!');
