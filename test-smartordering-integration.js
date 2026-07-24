/**
 * Comprehensive test for smart ordering integration
 * Tests the full flow from handleResult to renderPreviews
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Comprehensive Smart Ordering Integration Test ===\n');

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
}

// Test 1: Verify hook setup
console.log('\n--- Test 1: Hook Setup ---');
test('Hook is defined after handleResult', /const originalHandleResult2 = handleResult/.test(appJs));
test('Hook wraps handleResult correctly', /handleResult = async function\(data\)/.test(appJs));
test('Hook awaits original function', /await originalHandleResult2\(data\)/.test(appJs));

// Test 2: Verify hook logic
console.log('\n--- Test 2: Hook Logic ---');
test('Hook checks smartOrdering preference', /if\s*\(platformPrefs\.smartOrdering\)/.test(appJs));
test('Hook calls applySmartOrdering with setTimeout', /setTimeout\(applySmartOrdering,\s*200\)/.test(appJs));
test('Hook has console logging for debugging', /\[handleResult hook\]/.test(appJs));

// Test 3: Verify applySmartOrdering
console.log('\n--- Test 3: applySmartOrdering Implementation ---');
test('applySmartOrdering is a function', /function applySmartOrdering\(\)/.test(appJs));
test('Checks for currentData', /if\s*\(!currentData\)/.test(appJs));
test('Checks smartOrdering preference', /if\s*\(!platformPrefs\.smartOrdering\)/.test(appJs));

// Test 4: Verify platform detection
console.log('\n--- Test 4: Page Type Detection ---');
test('Detects page type', /const pageType = detectPageType\(currentData\.meta\)/.test(appJs));
test('Gets platform order for page type', /const preferredOrder = getPlatformOrderForPageType\(pageType\)/.test(appJs));

// Test 5: Verify reordering logic
console.log('\n--- Test 5: Platform Reordering ---');
test('Iterates over PLATFORM_GROUPS', /PLATFORM_GROUPS\.forEach\(\(group, groupIndex\)/.test(appJs));
test('Sorts platforms within groups', /group\.platforms\.sort\(\(a, b\)/.test(appJs));

// Test 6: Verify cardOrder update
console.log('\n--- Test 6: cardOrder Update ---');
test('Initializes cardOrder if needed', /if\s*\(!platformPrefs\.cardOrder\)\s*{[\s\S]*platformPrefs\.cardOrder = {}/.test(appJs));
test('Updates cardOrder for each group', /platformPrefs\.cardOrder\[group\.id\] = \[\.\.\.group\.platforms\]/.test(appJs));

// Test 7: Verify localStorage persistence
console.log('\n--- Test 7: Persistence ---');
test('Saves to localStorage', /localStorage\.setItem\('vista-platform-prefs',\s*JSON\.stringify\(platformPrefs\)\)/.test(appJs));

// Test 8: Verify re-render
console.log('\n--- Test 8: Re-render After Reordering ---');
test('Calls renderPreviews after reordering', /renderPreviews\(currentData\)/.test(appJs));

// Test 9: Verify renderPreviews reads cardOrder
console.log('\n--- Test 9: renderPreviews Reads cardOrder ---');
test('Checks for cardOrder existence', /if\s*\(platformPrefs\.cardOrder\[group\.id\]\)/.test(appJs));
test('Uses custom order when available', /const customOrder = platformPrefs\.cardOrder\[group\.id\]\.filter/.test(appJs));
test('Adds new platforms not in custom order', /const newPlatforms = group\.platforms\.filter\(pid => !customOrder\.includes\(pid\)\)/.test(appJs));
test('Uses reordered platforms array', /platforms\.forEach\(\(pid, i\)/.test(appJs));

// Test 10: Verify DOM rebuild
console.log('\n--- Test 10: DOM Rebuild ---');
test('Clears previewGrid', /previewGrid\.innerHTML\s*=\s*''/.test(appJs));
test('Rebuilds cards in new order', /row\.appendChild\(card\)/.test(appJs));

// Test 11: Check for race conditions
console.log('\n--- Test 11: Race Condition Analysis ---');
const hasRaceCondition = false; // We'll analyze this manually
console.log('Manual analysis needed for race conditions');

// Test 12: Verify initialization
console.log('\n--- Test 12: Initialization ---');
test('platformPrefs initialized with smartOrdering: true', /smartOrdering:\s*true/.test(appJs));
test('platformPrefs initialized with cardOrder: {}', /cardOrder:\s*{}/.test(appJs));
test('loadPlatformPrefs function exists', /function loadPlatformPrefs\(\)/.test(appJs));
test('Loads cardOrder from localStorage', /platformPrefs\.cardOrder = parsed\.cardOrder/.test(appJs));

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount === 0) {
  console.log('\n✅ All automated tests passed!');
  console.log('\nThe integration appears correct based on code analysis.');
  console.log('To verify it actually works in the browser, manual testing is needed.');
} else {
  console.log('\n❌ Some tests failed. Review the implementation.');
}

console.log('\n--- Manual Testing Checklist ---');
console.log('1. Load a page in the browser');
console.log('2. Open browser console');
console.log('3. Check for [handleResult hook] messages');
console.log('4. Check for [applySmartOrdering] messages (if DEBUG_SMART_ORDERING is enabled)');
console.log('5. Verify cards reorder after ~200ms');
console.log('6. Check localStorage for updated vista-platform-prefs');

process.exit(failCount > 0 ? 1 : 0);
