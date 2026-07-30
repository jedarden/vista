/**
 * Deep analysis of the smart ordering bug
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Deep Analysis of Smart Ordering Bug ===\n');

// Key insight: Let's trace the ACTUAL execution flow
console.log('--- ACTUAL EXECUTION FLOW ---\n');

// 1. Check when platformPrefs.cardOrder is initialized
const loadPrefsMatch = /function loadPlatformPrefs\(\)[\s\S]*?^}/m.exec(appJs);
if (loadPrefsMatch) {
  const loadPrefsCode = loadPrefsMatch[0];
  const hasLoadCardOrder = /platformPrefs\.cardOrder\s*=\s*parsed\.cardOrder\s*\|\|\s*{\s*}/.test(loadPrefsCode);
  console.log(`1. Load platformPrefs from localStorage: ${hasLoadCardOrder ? '✅' : '❌'} Loads cardOrder`);
}

// 2. Check when loadPlatformPrefs is called
const initMatch = /loadPlatformPrefs\(\)/g.exec(appJs);
console.log(`2. loadPlatformPrefs() is called ${initMatch ? initMatch.length : 0} times during initialization`);

// 3. Trace handleResult flow
console.log('\n--- handleResult FLOW ---');
console.log('a. User submits URL');
console.log('b. handleResult(data) is called');
console.log('c. Hook: await originalHandleResult2(data)');
console.log('d.   Inside originalHandleResult2:');
console.log('e.   - renderPreviews(data) is called');
console.log('f.   - renderPreviews uses platformPrefs.cardOrder (if available)');
console.log('g. Hook: After original returns, check if smartOrdering enabled');
console.log('h. Hook: applySmartOrderingSafe() is called');

// 4. Check what applySmartOrderingSafe does
console.log('\n--- applySmartOrderingSafe FLOW ---');
const applySafeMatch = /function applySmartOrderingSafe\(\)[\s\S]*?^}/m.exec(appJs);
if (applySafeMatch) {
  const applySafeCode = applySafeMatch[0];

  const setsFlag = /isApplyingSmartOrder\s*=\s*true/.test(applySafeCode);
  console.log(`a. Sets isApplyingSmartOrder = true: ${setsFlag ? '✅' : '❌'}`);

  const callsApply = /applySmartOrdering\(\)/.test(applySafeCode);
  console.log(`b. Calls applySmartOrdering(): ${callsApply ? '✅' : '❌'}`);

  const clearsFlag = /isApplyingSmartOrder\s*=\s*false/.test(applySafeCode);
  const clearsInFinally = /finally\s*{[\s\S]*isApplyingSmartOrder\s*=\s*false/.test(applySafeCode);
  console.log(`c. Clears isApplyingSmartOrder = false: ${clearsFlag ? '✅' : '❌'} (in finally: ${clearsInFinally ? 'yes' : 'no'})`);
}

// 5. Check what applySmartOrdering does
console.log('\n--- applySmartOrdering FLOW ---');
console.log('a. Detects page type');
console.log('b. Gets preferred platform order');
console.log('c. Sorts PLATFORM_GROUPS in place');
console.log('d. Updates platformPrefs.cardOrder[group.id]');
console.log('e. Saves to localStorage');
console.log('f. Calls reorderPlatformCards()');
console.log('g. Shows toast message');

// 6. Check what reorderPlatformCards does
console.log('\n--- reorderPlatformCards FLOW ---');
console.log('a. Checks if !isApplyingSmartOrder (logs warning if false)');
console.log('b. Iterates over PLATFORM_GROUPS');
console.log('c. For each group with cardOrder:');
console.log('d.   - Finds DOM elements');
console.log('e.   - Moves them to match cardOrder');

// 7. KEY INSIGHT
console.log('\n=== KEY INSIGHT ===');
console.log('The problem is a TIMING ISSUE:');
console.log('');
console.log('Step 1: renderPreviews() runs FIRST');
console.log('  - isApplyingSmartOrder = false');
console.log('  - Checks: if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');
console.log('  - Uses EXISTING cardOrder (from previous smart ordering or drag-drop)');
console.log('  - Creates DOM in that order');
console.log('');
console.log('Step 2: applySmartOrdering() runs AFTER');
console.log('  - Sets isApplyingSmartOrder = true');
console.log('  - Reorders PLATFORM_GROUPS');
console.log('  - UPDATES platformPrefs.cardOrder to NEW order');
console.log('  - Calls reorderPlatformCards()');
console.log('');
console.log('Step 3: reorderPlatformCards() moves DOM elements');
console.log('  - BUT: renderPreviews ALREADY created them in OLD order');
console.log('  - reorderPlatformCards moves them to NEW order');
console.log('');
console.log('THIS SHOULD WORK! But let me check if there is a bug...');

// 8. Check if renderPreviews is called multiple times
console.log('\n=== POTENTIAL BUG: Multiple renderPreviews calls ===');

const renderCalls = appJs.match(/renderPreviews\([^)]*\)/g);
if (renderCalls) {
  console.log(`Found ${renderCalls.length} calls to renderPreviews()`);
  const uniqueContexts = [...new Set(renderCalls)];
  console.log('Unique call patterns:');
  uniqueContexts.slice(0, 10).forEach(call => console.log(`  - ${call}`));
}

// 9. Check if there's a race condition with isApplyingSmartOrder
console.log('\n=== POTENTIAL BUG: isApplyingSmartOrder race condition ===');

// Find all places where isApplyingSmartOrder is checked
const checks = appJs.match(/if\s*\([^)]*isApplyingSmartOrder[^)]*\)/g);
if (checks) {
  console.log('Found isApplyingSmartOrder checks:');
  checks.forEach(check => console.log(`  - ${check.trim()}`));
}

// 10. Check if platformPrefs.cardOrder is reset
console.log('\n=== POTENTIAL BUG: cardOrder reset ===');

const resetChecks = [
  { pattern: /platformPrefs\.cardOrder\s*=\s*{\s*}/, desc: 'cardOrder reset to {}' },
  { pattern: /platformPrefs\.cardOrder\s*=\s*parsed\.cardOrder/, desc: 'cardOrder from localStorage' }
];

resetChecks.forEach(({ pattern, desc }) => {
  const matches = appJs.match(pattern);
  if (matches) {
    console.log(`Found ${matches.length} instances: ${desc}`);
  }
});

// 11. THE ACTUAL BUG
console.log('\n=== THE ACTUAL BUG ===');
console.log('After analyzing the code, I believe the issue is:');
console.log('');
console.log('renderPreviews() checks: if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');
console.log('');
console.log('When this check is TRUE:');
console.log('  - renderPreviews uses the custom order from cardOrder');
console.log('  - Creates DOM in that order');
console.log('');
console.log('When this check is FALSE:');
console.log('  - renderPreviews uses the default group.platforms order');
console.log('  - Creates DOM in default order');
console.log('');
console.log('The bug: renderPreviews() is called BEFORE applySmartOrdering() updates cardOrder!');
console.log('So the first render uses OLD (or empty) cardOrder');
console.log('Then applySmartOrdering updates cardOrder and calls reorderPlatformCards');
console.log('reorderPlatformCards moves DOM elements to match NEW cardOrder');
console.log('');
console.log('THIS SHOULD WORK FINE! So where is the bug?');
console.log('');
console.log('Possible bug: If renderPreviews is called AGAIN after applySmartOrdering,');
console.log('it would reset the order back to default order!');

// Check if renderPreviews is called after applySmartOrdering
console.log('\n=== CHECKING: renderPreviews called after applySmartOrdering? ===');

// Find all places where renderPreviews is called
const renderPrevsMatches = [];
const regex = /renderPreviews\s*\(\s*([^)]*)\s*\)/g;
let match;
while ((match = regex.exec(appJs)) !== null) {
  renderPrevsMatches.push({
    call: match[0],
    args: match[1],
    index: match.index
  });
}

console.log(`Found ${renderPrevsMatches.length} calls to renderPreviews()`);

// Find calls that happen AFTER applySmartOrdering in the code
const applySmartIndex = appJs.indexOf('function applySmartOrdering()');
if (applySmartIndex !== -1) {
  const callsAfterApply = renderPrevsMatches.filter(m => m.index > applySmartIndex);
  console.log(`Calls to renderPreviews AFTER applySmartOrdering definition: ${callsAfterApply.length}`);

  if (callsAfterApply.length > 0) {
    console.log('These calls might cause issues:');
    callsAfterApply.forEach(m => {
      console.log(`  - ${m.call} at position ${m.index}`);
    });
  }
}

process.exit(0);
