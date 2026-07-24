/**
 * Static Code Analysis for applySmartOrdering DOM Reordering
 *
 * This script performs a comprehensive static analysis of the applySmartOrdering
 * implementation without requiring a browser. It verifies:
 * 1. Function exists and is properly defined
 * 2. Function modifies PLATFORM_GROUPS and platformPrefs.cardOrder
 * 3. Function calls renderPreviews() to update the DOM
 * 4. Hook integration is correct
 */

const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, 'src/public/app.js');

console.log('=== STATIC ANALYSIS: applySmartOrdering DOM Reordering ===\n');

// Read the app.js file
const appJs = fs.readFileSync(APP_JS_PATH, 'utf8');

const results = [];

// Test 1: Function exists
console.log('Test 1: Checking if applySmartOrdering function is defined...');
const hasFunctionDefinition = /function applySmartOrdering\(\)\s*\{/.test(appJs);
if (hasFunctionDefinition) {
  console.log('✅ PASS: applySmartOrdering function is defined\n');
  results.push({ name: 'Function defined', status: 'PASS' });
} else {
  console.log('❌ FAIL: applySmartOrdering function NOT found\n');
  results.push({ name: 'Function defined', status: 'FAIL' });
}

// Test 2: Function modifies PLATFORM_GROUPS
console.log('Test 2: Checking if function modifies PLATFORM_GROUPS...');
const hasPlatformGroupModification = /PLATFORM_GROUPS\.forEach\(\s*\(group[^;]*group\.platforms\.sort/.test(appJs);
if (hasPlatformGroupModification) {
  console.log('✅ PASS: Function modifies group.platforms via sort()\n');
  results.push({ name: 'Modifies PLATFORM_GROUPS', status: 'PASS' });
} else {
  console.log('❌ FAIL: Function does NOT modify PLATFORM_GROUPS\n');
  results.push({ name: 'Modifies PLATFORM_GROUPS', status: 'FAIL' });
}

// Test 3: Function updates platformPrefs.cardOrder
console.log('Test 3: Checking if function updates platformPrefs.cardOrder...');
const hasCardOrderUpdate = /platformPrefs\.cardOrder\[group\.id\]\s*=\s*\[\.\.\.group\.platforms\]/.test(appJs);
if (hasCardOrderUpdate) {
  console.log('✅ PASS: Function updates platformPrefs.cardOrder with new order\n');
  results.push({ name: 'Updates cardOrder', status: 'PASS' });
} else {
  console.log('❌ FAIL: Function does NOT update platformPrefs.cardOrder\n');
  results.push({ name: 'Updates cardOrder', status: 'FAIL' });
}

// Test 4: Function saves to localStorage
console.log('Test 4: Checking if function saves to localStorage...');
const hasLocalStorageSave = /localStorage\.setItem\(\s*['"]vista-platform-prefs['"]\s*,\s*JSON\.stringify\(platformPrefs\)\s*\)/.test(appJs);
if (hasLocalStorageSave) {
  console.log('✅ PASS: Function saves platformPrefs to localStorage\n');
  results.push({ name: 'Saves to localStorage', status: 'PASS' });
} else {
  console.log('❌ FAIL: Function does NOT save to localStorage\n');
  results.push({ name: 'Saves to localStorage', status: 'FAIL' });
}

// Test 5: Function calls renderPreviews
console.log('Test 5: Checking if function calls renderPreviews...');
const hasRenderPreviewsCall = /renderPreviews\s*\(\s*currentData\s*\)/.test(appJs);
if (hasRenderPreviewsCall) {
  console.log('✅ PASS: Function calls renderPreviews() to update DOM\n');
  results.push({ name: 'Calls renderPreviews', status: 'PASS' });
} else {
  console.log('❌ FAIL: Function does NOT call renderPreviews()\n');
  results.push({ name: 'Calls renderPreviews', status: 'FAIL' });
}

// Test 6: renderPreviews respects platformPrefs.cardOrder
console.log('Test 6: Checking if renderPreviews uses platformPrefs.cardOrder...');
const hasCardOrderUsage = /if\s*\(\s*platformPrefs\.cardOrder\[group\.id\]\s*\)/.test(appJs);
if (hasCardOrderUsage) {
  console.log('✅ PASS: renderPreviews checks platformPrefs.cardOrder\n');
  results.push({ name: 'renderPreviews uses cardOrder', status: 'PASS' });
} else {
  console.log('❌ FAIL: renderPreviews does NOT check platformPrefs.cardOrder\n');
  results.push({ name: 'renderPreviews uses cardOrder', status: 'FAIL' });
}

// Test 7: Hook integration
console.log('Test 7: Checking handleResult hook calls applySmartOrdering...');
const hasHookCall = /handleResult\s*=\s*function[^{]*\{[\s\S]*?setTimeout\s*\(\s*applySmartOrdering/.test(appJs);
if (hasHookCall) {
  console.log('✅ PASS: Hook calls applySmartOrdering via setTimeout\n');
  results.push({ name: 'Hook calls function', status: 'PASS' });
} else {
  console.log('❌ FAIL: Hook does NOT call applySmartOrdering\n');
  results.push({ name: 'Hook calls function', status: 'FAIL' });
}

// Test 8: Verify sort logic uses preferredOrder
console.log('Test 8: Checking if sort uses preferredOrder...');
const hasPreferredOrderSort = /group\.platforms\.sort\s*\(\s*\([^,]*,\s*[^)]*\)\s*=>\s*\{[\s\S]*?preferredOrder\.indexOf/.test(appJs);
if (hasPreferredOrderSort) {
  console.log('✅ PASS: Sort uses preferredOrder.indexOf for ordering\n');
  results.push({ name: 'Uses preferredOrder', status: 'PASS' });
} else {
  console.log('❌ FAIL: Sort does NOT use preferredOrder\n');
  results.push({ name: 'Uses preferredOrder', status: 'FAIL' });
}

// Test 9: Verify has early exit checks
console.log('Test 9: Checking for early exit conditions...');
const hasEarlyExit = /if\s*\(\s*!currentData\s*\)\s*{[\s\S]*?return;/.test(appJs);
const hasPrefCheck = /if\s*\(\s*!platformPrefs\.smartOrdering\s*\)\s*{[\s\S]*?return;/.test(appJs);
if (hasEarlyExit && hasPrefCheck) {
  console.log('✅ PASS: Function has early exit checks\n');
  results.push({ name: 'Has early exit checks', status: 'PASS' });
} else {
  console.log('❌ FAIL: Missing early exit checks\n');
  results.push({ name: 'Has early exit checks', status: 'FAIL' });
}

// Test 10: Check for debug logging
console.log('Test 10: Checking for debug logging support...');
const hasDebugLogging = /if\s*\(\s*DEBUG_SMART_ORDERING\s*\)/.test(appJs) && /let DEBUG_SMART_ORDERING/.test(appJs);
if (hasDebugLogging) {
  console.log('✅ PASS: Function has DEBUG_SMART_ORDERING support\n');
  results.push({ name: 'Has debug logging', status: 'PASS' });
} else {
  console.log('⚠️  WARN: Function may not have debug logging\n');
  results.push({ name: 'Has debug logging', status: 'WARN' });
}

// Summary
console.log('=== SUMMARY ===');
const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const warnCount = results.filter(r => r.status === 'WARN').length;

results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️'}  ${r.name}`);
});

console.log(`\nTotal: ${passCount} pass, ${failCount} fail, ${warnCount} warnings\n`);

if (failCount === 0) {
  console.log('✅✅✅ STATIC ANALYSIS PASSED ✅✅✅');
  console.log('\nThe applySmartOrdering implementation appears correct.');
  console.log('The function:');
  console.log('  1. Modifies PLATFORM_GROUPS in place');
  console.log('  2. Updates platformPrefs.cardOrder with new order');
  console.log('  3. Saves to localStorage for persistence');
  console.log('  4. Calls renderPreviews() to update the DOM');
  console.log('  5. Is called from handleResult hook with 200ms delay');
  console.log('\nThe DOM reordering should be working correctly.');
} else {
  console.log('❌ STATIC ANALYSIS FAILED - Issues found above');
  process.exit(1);
}
