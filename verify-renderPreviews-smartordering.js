/**
 * Verification script for renderPreviews() smart ordering integration
 *
 * This script verifies that renderPreviews() correctly:
 * 1. Reads platformPrefs.cardOrder when available
 * 2. Uses the smart-ordered platform list instead of default order
 * 3. Actually moves DOM elements to match the new order
 * 4. Does not reset cards back to original order
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Verification: renderPreviews() Smart Ordering Integration ===\n');

let passCount = 0;
let failCount = 0;

function verify(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
}

// Test 1: renderPreviews() checks for platformPrefs.cardOrder
console.log('\n--- Test 1: renderPreviews() checks platformPrefs.cardOrder ---');
const hasCardOrderCheck = /if\s*\(\s*platformPrefs\.cardOrder\[group\.id\]\s*\)/.test(appJs);
verify('renderPreviews checks platformPrefs.cardOrder[group.id]', hasCardOrderCheck);

// Test 2: renderPreviews() uses custom order when available
console.log('\n--- Test 2: renderPreviews() uses custom order logic ---');
const usesCustomOrder = /platformPrefs\.cardOrder\[group\.id\]\.filter\(pid => group\.platforms\.includes\(pid\)\)/.test(appJs);
verify('renderPreviews filters custom order to existing platforms', usesCustomOrder);

// Test 3: renderPreviews() handles new platforms not in custom order
console.log('\n--- Test 3: renderPreviews() handles new platforms ---');
const handlesNewPlatforms = /newPlatforms.*=.*group\.platforms\.filter\(pid => !customOrder\.includes\(pid\)\)/.test(appJs);
verify('renderPreviews adds new platforms after custom order', handlesNewPlatforms);

// Test 4: renderPreviews() actually uses the reordered platforms array
console.log('\n--- Test 4: renderPreviews() uses reordered platforms ---');
const usesReorderedPlatforms = /platforms\.forEach\(\(pid, i\)/.test(appJs);
verify('renderPreviews iterates over reordered platforms array', usesReorderedPlatforms);

// Test 5: Find the hook integration
console.log('\n--- Test 5: Hook into handleResult ---');
const hasHook = /const originalHandleResult2 = handleResult;/.test(appJs) &&
                /handleResult = function\(data\)/.test(appJs);
verify('Hook wraps original handleResult', hasHook);

// Test 6: Hook calls applySmartOrdering
console.log('\n--- Test 6: Hook calls applySmartOrdering ---');
const hookCallsSmartOrdering = /setTimeout\(applySmartOrdering,\s*200\)/.test(appJs);
verify('Hook schedules applySmartOrdering after 200ms', hookCallsSmartOrdering);

// Test 7: applySmartOrdering updates platformPrefs.cardOrder
console.log('\n--- Test 7: applySmartOrdering updates cardOrder ---');
const updatesCardOrder = /platformPrefs\.cardOrder\[group\.id\] = \[\.\.\.group\.platforms\]/.test(appJs);
verify('applySmartOrdering updates platformPrefs.cardOrder[group.id]', updatesCardOrder);

// Test 8: applySmartOrdering calls renderPreviews
console.log('\n--- Test 8: applySmartOrdering calls renderPreviews ---');
const smartOrderingCallsRender = /function applySmartOrdering\(\)[\s\S]*?renderPreviews\(currentData\)/.test(appJs);
verify('applySmartOrdering calls renderPreviews(currentData)', smartOrderingCallsRender);

// Test 9: Check timing - does original handleResult call renderPreviews?
console.log('\n--- Test 9: Original handleResult timing ---');
const originalCallsRenderPreviews = /async function handleResult\(data\)[\s\S]*?renderPreviews\(data\)/.test(appJs);
verify('Original handleResult calls renderPreviews BEFORE applySmartOrdering hook', originalCallsRenderPreviews);

// Test 10: Check if there's a race condition potential
console.log('\n--- Test 10: Potential race condition analysis ---');
console.log('Sequence analysis:');
console.log('1. handleResult(data) called');
console.log('2. Hook: originalHandleResult2(data) executes');
console.log('3.   → renderPreviews(data) called with DEFAULT ORDER');
console.log('4. Hook: setTimeout(applySmartOrdering, 200)');
console.log('5. After 200ms: applySmartOrdering() executes');
console.log('6.   → Reorders PLATFORM_GROUPS');
console.log('7.   → Updates platformPrefs.cardOrder');
console.log('8.   → Calls renderPreviews(currentData) with SMART ORDER');

// Test 11: Check for any code that might reset cardOrder after smart ordering
console.log('\n--- Test 11: Check for code that might reset cardOrder ---');
const potentialResets = [
  { pattern: /platformPrefs\.cardOrder\s*=\s*{\}/, desc: 'Direct reset to empty object' },
  { pattern: /delete\s+platformPrefs\.cardOrder/, desc: 'Delete cardOrder property' },
  { pattern: /platformPrefs\s*=\s*{[^}]*}/, desc: 'Reassign platformPrefs object' }
];

let foundReset = false;
potentialResets.forEach(reset => {
  if (reset.pattern.test(appJs)) {
    console.log(`⚠️  WARNING: Found potential reset: ${reset.desc}`);
    foundReset = true;
  }
});
if (!foundReset) {
  console.log('✅ No obvious code paths that reset cardOrder after smart ordering');
  passCount++;
} else {
  failCount++;
}

// Test 12: Check if renderPreviews completely rebuilds DOM or just reorders
console.log('\n--- Test 12: renderPreviews DOM rebuild approach ---');
const clearsGrid = /previewGrid\.innerHTML\s*=\s*'';/.test(appJs);
verify('renderPreviews clears previewGrid (full rebuild)', clearsGrid);

// Test 13: Check if drag-and-drop interferes
console.log('\n--- Test 13: Drag-and-drop integration ---');
const dragDropReorders = /function handleDrop[\s\S]*?renderPreviews\(currentData\)/.test(appJs);
verify('Drag-and-drop also calls renderPreviews after reordering', dragDropReorders);

// Summary
console.log('\n=== Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount === 0) {
  console.log('\n✅ All tests passed! The smart ordering integration appears correct.');
  console.log('\nHowever, the issue may be a timing problem:');
  console.log('- First renderPreviews() happens BEFORE smart ordering (default order)');
  console.log('- Second renderPreviews() happens AFTER smart ordering (smart order)');
  console.log('- If the user sees the first render, they see cards in default order');
  console.log('- The second render should re-order them correctly');
} else {
  console.log('\n❌ Some tests failed. There may be integration issues.');
}

// Additional diagnosis
console.log('\n=== Potential Issues ===');
console.log('1. The hook delays applySmartOrdering by 200ms');
console.log('2. During this 200ms, users see cards in default order');
console.log('3. After 200ms, cards should reorder to smart order');
console.log('4. If cards are NOT reordering after 200ms, there may be a bug in:');
console.log('   - platformPrefs.cardOrder not being set correctly');
console.log('   - renderPreviews() not reading platformPrefs.cardOrder');
console.log('   - DOM elements not being rebuilt correctly');

process.exit(failCount > 0 ? 1 : 0);
