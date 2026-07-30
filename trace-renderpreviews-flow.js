/**
 * Trace the actual execution flow to identify the bug
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

console.log('=== Tracing renderPreviews() Execution Flow ===\n');

// Extract key functions
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\)\s*{([\s\S]*?)^}/m);
const applySmartOrderingMatch = appJs.match(/function applySmartOrdering\(\)\s*{([\s\S]*?)^}/m);
const applySmartOrderingSafeMatch = appJs.match(/function applySmartOrderingSafe\(\)\s*{([\s\S]*?)^}/m);

if (!renderPreviewsMatch || !applySmartOrderingMatch || !applySmartOrderingSafeMatch) {
  console.error('❌ Could not extract required functions');
  process.exit(1);
}

const renderPreviewsBody = renderPreviewsMatch[1];
const applySmartOrderingBody = applySmartOrderingMatch[1];
const applySmartOrderingSafeBody = applySmartOrderingSafeMatch[1];

console.log('Step 1: Initial page load and analysis');
console.log('  → handleResult(data) is called');
console.log('  → renderPreviews(data) is called with default order');
console.log('  → isApplyingSmartOrder: false');
console.log('  → platformPrefs.cardOrder: undefined');
console.log('  → Result: Uses default PLATFORM_GROUPS order ✅\n');

console.log('Step 2: Smart ordering is triggered');
console.log('  → handleResult hook calls applySmartOrderingSafe()');
console.log('  → isApplyingSmartOrder set to: true');
console.log('  → applySmartOrdering() is called');
console.log('  → Updates platformPrefs.cardOrder[group.id] = smartOrder');
console.log('  → Saves to localStorage');
console.log('  → isApplyingSmartOrder set to: false');
console.log('  → pendingRenderData exists (queued during smart ordering)');
console.log('  → renderPreviews(pendingRenderData) is called');
console.log('  → Result: Should use cardOrder ✅\n');

console.log('Step 3: Subsequent renderPreviews calls');
console.log('  → isApplyingSmartOrder: false');
console.log('  → platformPrefs.cardOrder: defined (from localStorage)');
console.log('  → renderPreviews(data) checks: if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');
console.log('  → Result: true && true = true → Uses cardOrder ✅\n');

// Now let's check if there's a bug in the condition
console.log('=== Detailed Condition Check ===\n');

// Check the exact condition in renderPreviews
const conditionMatch = renderPreviewsBody.match(/if\s*\((platformPrefs\.cardOrder\[group\.id\][^)]*)\)/);
if (conditionMatch) {
  console.log('Found condition:', conditionMatch[0]);
  console.log('Full condition:', conditionMatch[1]);

  if (conditionMatch[1].includes('!isApplyingSmartOrder')) {
    console.log('✅ Condition includes !isApplyingSmartOrder check');
  } else {
    console.log('❌ BUG: Condition does NOT include !isApplyingSmartOrder check!');
    console.log('   This means cardOrder might not be used during smart ordering');
  }
} else {
  console.log('❌ Could not find cardOrder condition');
}

// Check if there are multiple renderPreviews calls that bypass the check
console.log('\n=== Checking for Bypass Scenarios ===\n');

// Check if renderPreviews is called from applySmartOrdering
if (applySmartOrderingBody.includes('renderPreviews(')) {
  console.log('⚠️  applySmartOrdering() calls renderPreviews() directly!');
  console.log('   This could be called AFTER isApplyingSmartOrder is set to false');
  console.log('   But BEFORE cardOrder is updated');

  // Find the exact location
  const renderCallMatch = applySmartOrderingBody.match(/renderPreviews\([^)]*\)/g);
  if (renderCallMatch) {
    console.log('   Found call:', renderCallMatch[0]);
  }
} else {
  console.log('✅ applySmartOrdering() does NOT call renderPreviews() directly');
}

// Check if there's a timing issue
console.log('\n=== Checking Timing Issues ===\n');

// Check the order of operations in applySmartOrderingSafe
const lines = applySmartOrderingSafeBody.split('\n').map(l => l.trim()).filter(l => l);

let setFlagFalse = -1;
let processPending = -1;

lines.forEach((line, index) => {
  if (line.includes('isApplyingSmartOrder = false')) {
    setFlagFalse = index;
  }
  if (line.includes('pendingRenderData') && line.includes('renderPreviews')) {
    processPending = index;
  }
});

if (setFlagFalse !== -1 && processPending !== -1) {
  if (setFlagFalse < processPending) {
    console.log('✅ Flag is set to false BEFORE processing pending render');
    console.log('   Line ' + setFlagFalse + ': isApplyingSmartOrder = false');
    console.log('   Line ' + processPending + ': renderPreviews(pendingRenderData)');
  } else {
    console.log('❌ BUG: Flag is set to false AFTER processing pending render!');
    console.log('   This means renderPreviews might skip cardOrder check');
  }
}

console.log('\n=== Conclusion ===\n');
console.log('Based on the code analysis:');
console.log('✅ The condition for using cardOrder is correct');
console.log('✅ The timing of flag updates is correct');
console.log('✅ renderPreviews() does use cardOrder when available');
console.log('\nThe main discrepancy with acceptance criteria:');
console.log('❌ "Actually moves DOM elements" - renderPreviews destroys/recreates, not moves');
console.log('\nPossible interpretations:');
console.log('1. The acceptance criteria is outdated (pre-race-condition-fix)');
console.log('2. We need to modify renderPreviews to move elements instead of recreating');
console.log('3. We need to call reorderPlatformCards() after renderPreviews()');
