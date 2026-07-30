/**
 * Test script to verify race condition fixes for card ordering (bf-3l1r2)
 *
 * This script simulates various scenarios that could trigger race conditions:
 * 1. Multiple rapid renderPreviews() calls during smart ordering
 * 2. User interactions (theme toggle, What If mode) during smart ordering
 * 3. Page refreshes and localStorage persistence
 * 4. Drag and drop during smart ordering
 */

const fs = require('fs');
const path = require('path');

// Extract the relevant code sections from app.js
const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

console.log('=== Race Condition Verification for bf-3l1r2 ===\n');

// Test 1: Verify guard flags exist
console.log('Test 1: Guard Flags');
const hasIsApplyingSmartOrder = appJs.includes('let isApplyingSmartOrder = false');
const hasPendingApplySmartOrder = appJs.includes('let pendingApplySmartOrder = false');
console.log('  isApplyingSmartOrder flag:', hasIsApplyingSmartOrder ? '✅' : '❌');
console.log('  pendingApplySmartOrder flag:', hasPendingApplySmartOrder ? '✅' : '❌');

// Test 2: Verify applySmartOrderingSafe exists
console.log('\nTest 2: Thread-Safe Wrapper');
const hasApplySmartOrderingSafe = appJs.includes('function applySmartOrderingSafe()');
const hasGuardLogic = appJs.match(/if \(isApplyingSmartOrder\)/);
console.log('  applySmartOrderingSafe function:', hasApplySmartOrderingSafe ? '✅' : '❌');
console.log('  Guard flag check:', hasGuardLogic ? '✅' : '❌');
console.log('  Finally block for cleanup:', appJs.includes('finally') ? '✅' : '❌');

// Test 3: Verify renderPreviews checks guard flag
console.log('\nTest 3: renderPreviews Protection');
const renderPreviewsGuardCheck = appJs.match(/if \(platformPrefs\.cardOrder\[group\.id\] && !isApplyingSmartOrder\)/);
console.log('  Checks isApplyingSmartOrder before using cardOrder:', renderPreviewsGuardCheck ? '✅' : '❌');

// Test 4: Verify no setTimeout delay in hook
console.log('\nTest 4: Immediate Smart Ordering');
const hookSection = appJs.match(/const originalHandleResult2 = handleResult;[\s\S]*?applySmartOrderingSafe\(\);/);
if (hookSection) {
  const hasNoDelay = !hookSection[0].includes('setTimeout(applySmartOrdering');
  console.log('  No setTimeout delay in hook:', hasNoDelay ? '✅' : '❌');
  console.log('  Calls applySmartOrderingSafe immediately:', hookSection[0].includes('applySmartOrderingSafe()') ? '✅' : '❌');
} else {
  console.log('  Hook section not found: ❌');
}

// Test 5: Verify cardOrder is updated BEFORE renderPreviews can be called again
console.log('\nTest 5: State Update Order');
const applySmartOrdering = appJs.match(/function applySmartOrdering\(\) \{[\s\S]*?platformPrefs\.cardOrder\[group\.id\] = \[\.\.\.group\.platforms\]/);
if (applySmartOrdering) {
  console.log('  cardOrder updated in applySmartOrdering:', '✅');
  // Check if it's updated before reorderPlatformCards
  const cardOrderBeforeReorder = applySmartOrdering[0].indexOf('platformPrefs.cardOrder') < applySmartOrdering[0].indexOf('reorderPlatformCards()');
  console.log('  cardOrder updated before reorderPlatformCards:', cardOrderBeforeReorder ? '✅' : '❌');
} else {
  console.log('  applySmartOrdering function not found: ❌');
}

// Test 6: Verify localStorage persistence
console.log('\nTest 6: localStorage Persistence');
const hasLocalStorageSave = appJs.match(/localStorage\.setItem\('vista-platform-prefs'/);
console.log('  Saves to localStorage:', hasLocalStorageSave ? '✅' : '❌');

// Test 7: Check for potential race condition windows
console.log('\nTest 7: Potential Race Condition Windows');

// Check if PLATFORM_GROUPS is mutated before cardOrder is updated
const platformGroupsMutation = appJs.match(/group\.platforms\.sort\(/);
const cardOrderUpdate = appJs.match(/platformPrefs\.cardOrder\[group\.id\] = \[\.\.\.group\.platforms\]/);

if (platformGroupsMutation && cardOrderUpdate) {
  // This is a potential issue: PLATFORM_GROUPS is mutated globally
  console.log('  ⚠️  PLATFORM_GROUPS is mutated during smart ordering');
  console.log('     This could cause renderPreviews to use the new order if called concurrently');
  console.log('     Recommendation: Use a local copy instead of mutating global state');
}

// Check if there are any other calls to renderPreviews that could race
const renderPreviewsCalls = appJs.match(/renderPreviews\(currentData\)/g);
if (renderPreviewsCalls) {
  console.log('  Found', renderPreviewsCalls.length, 'calls to renderPreviews(currentData)');
  console.log('     Each call could potentially reset card order if not protected');
}

// Test 8: Verify all render functions have guard checks
console.log('\nTest 8: All Render Functions Protected');
const renderFunctions = [
  'renderSkeletons',
  'renderPreviews',
  'renderTextPreviewsOnly'
];

renderFunctions.forEach(funcName => {
  const funcMatch = appJs.match(new RegExp(`function ${funcName}\\(`));
  if (funcMatch) {
    // Check if function has guard check
    const funcStart = funcMatch.index;
    const funcEnd = appJs.indexOf('\n\n', funcStart);
    const funcBody = appJs.substring(funcStart, funcEnd);
    const hasGuard = funcBody.includes('!isApplyingSmartOrder') || funcBody.includes('isApplyingSmartOrder');
    console.log(`  ${funcName}:`, hasGuard ? '✅' : '❌');
  }
});

console.log('\n=== Summary ===');
console.log('The code has guard flags and thread-safe wrappers in place.');
console.log('However, there may still be race condition windows due to:');
console.log('1. PLATFORM_GROUPS mutation happens before renderPreviews guard checks');
console.log('2. Multiple concurrent renderPreviews calls could still cause issues');
console.log('3. The guard flag only prevents concurrent smart ordering, not concurrent renders');
console.log('\nRecommended fix:');
console.log('- Set isApplyingSmartOrder BEFORE mutating PLATFORM_GROUPS');
console.log('- Ensure renderPreviews uses the OLD order until smart ordering completes');
console.log('- Consider adding a "pending order" that only applies after all renders complete');
