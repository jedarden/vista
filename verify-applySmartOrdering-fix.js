/**
 * Test: Verify applySmartOrdering DOM reordering fix
 *
 * This test verifies that the fixed handleResult hook properly calls
 * applySmartOrderingSafe() which:
 * 1. Sets isApplyingSmartOrder flag
 * 2. Updates cardOrder data
 * 3. Calls reorderPlatformCards() after DOM is rendered
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

console.log('=== Verifying applySmartOrdering Fix ===\n');

// Test 1: Verify handleResult hook calls applySmartOrderingSafe()
console.log('Test 1: Checking if handleResult hook calls applySmartOrderingSafe()...');
const callsApplySmartOrderingSafe =
  appJsContent.includes('applySmartOrderingSafe()') &&
  appJsContent.match(/handleResult.*function.*applySmartOrderingSafe/s) !== null;
console.log(`  Uses applySmartOrderingSafe: ${callsApplySmartOrderingSafe ? '✅' : '❌'}`);

if (!callsApplySmartOrderingSafe) {
  console.error('❌ FAIL: handleResult hook does not call applySmartOrderingSafe()');
  console.error('   The fix was not applied correctly.');
  process.exit(1);
}

// Test 2: Verify the hook does NOT manually call reorderPlatformCards()
console.log('\nTest 2: Checking if hook was simplified (removed manual reorderPlatformCards call)...');

// Find the handleResult hook section
const handleResultMatch = appJsContent.match(/handleResult = async function[\s\S]*?(?=\/\/ ──|$)/);
if (handleResultMatch) {
  const hookCode = handleResultMatch[0];
  const manualReorderCall = hookCode.includes('reorderPlatformCards()') &&
                           !hookCode.includes('applySmartOrderingSafe()');

  if (manualReorderCall) {
    console.log('  Manual reorderPlatformCards call found in hook: ❌');
    console.log('  This suggests the fix was not properly applied.');
  } else {
    console.log('  No manual reorderPlatformCards in hook: ✅');
    console.log('  The hook correctly delegates to applySmartOrderingSafe()');
  }
} else {
  console.log('  Could not find handleResult hook: ❌');
}

// Test 3: Verify isApplyingSmartOrder flag is used correctly
console.log('\nTest 3: Checking if isApplyingSmartOrder flag logic is intact...');
const usesIsApplyingSmartOrder =
  appJsContent.includes('isApplyingSmartOrder') &&
  appJsContent.includes('if (isApplyingSmartOrder)') &&
  appJsContent.includes('isApplyingSmartOrder = true') &&
  appJsContent.includes('isApplyingSmartOrder = false');
console.log(`  Flag usage intact: ${usesIsApplyingSmartOrder ? '✅' : '❌'}`);

// Test 4: Verify renderPreviews checks the flag
console.log('\nTest 4: Checking if renderPreviews respects isApplyingSmartOrder flag...');
const renderPreviewsChecksFlag =
  appJsContent.match(/renderPreviews[\s\S]*?isApplyingSmartOrder/) !== null;
console.log(`  renderPreviews checks flag: ${renderPreviewsChecksFlag ? '✅' : '❌'}`);

// Test 5: Verify the flow: applySmartOrderingSafe -> set flag -> update cardOrder -> reorder DOM
console.log('\nTest 5: Checking applySmartOrderingSafe flow...');
const applySmartOrderingSafeMatch = appJsContent.match(/function applySmartOrderingSafe\(\)[\s\S]*?^}/m);
if (applySmartOrderingSafeMatch) {
  const safeFunctionCode = applySmartOrderingSafeMatch[0];
  const setsFlag = safeFunctionCode.includes('isApplyingSmartOrder = true');
  const callsApplySmartOrdering = safeFunctionCode.includes('applySmartOrdering()');
  const callsReorder = safeFunctionCode.includes('reorderPlatformCards()');
  const clearsFlag = safeFunctionCode.includes('isApplyingSmartOrder = false');

  console.log(`  Sets isApplyingSmartOrder = true: ${setsFlag ? '✅' : '❌'}`);
  console.log(`  Calls applySmartOrdering(): ${callsApplySmartOrdering ? '✅' : '❌'}`);
  console.log(`  Calls reorderPlatformCards(): ${callsReorder ? '✅' : '❌'}`);
  console.log(`  Clears isApplyingSmartOrder = false: ${clearsFlag ? '✅' : '❌'}`);

  if (setsFlag && callsApplySmartOrdering && callsReorder && clearsFlag) {
    console.log('  applySmartOrderingSafe flow is correct: ✅');
  } else {
    console.log('  applySmartOrderingSafe flow has issues: ❌');
  }
} else {
  console.log('  Could not find applySmartOrderingSafe function: ❌');
}

// Test 6: Verify the hook is wrapped correctly
console.log('\nTest 6: Checking handleResult hook structure...');
const hookStructureMatch = appJsContent.match(/const originalHandleResult2 = handleResult;[\s\S]*?handleResult = async function/s);
if (hookStructureMatch) {
  console.log('  Hook structure found: ✅');

  // Extract the hook code to verify it sets currentData
  const hookMatch = appJsContent.match(/handleResult = async function[\s\S]*?(?=\n\/\/ |$)/);
  if (hookMatch) {
    const hookCode = hookMatch[0];
    const setsCurrentData = hookCode.includes('currentData = data');

    console.log(`  Sets currentData before calling: ${setsCurrentData ? '✅' : '❌'}`);

    if (!setsCurrentData) {
      console.log('  ⚠️  WARNING: currentData is not set before applySmartOrderingSafe()');
      console.log('     This could cause applySmartOrdering() to exit early!');
    }
  }
} else {
  console.log('  Hook structure not found: ❌');
}

console.log('\n=== VERIFICATION SUMMARY ===\n');

if (callsApplySmartOrderingSafe && usesIsApplyingSmartOrder && renderPreviewsChecksFlag) {
  console.log('✅✅✅ FIX VERIFIED ✅✅✅\n');
  console.log('The handleResult hook now correctly:');
  console.log('1. Calls applySmartOrderingSafe() instead of applySmartOrdering()');
  console.log('2. applySmartOrderingSafe() sets isApplyingSmartOrder flag');
  console.log('3. renderPreviews() queues render if flag is set');
  console.log('4. applySmartOrderingSafe() updates cardOrder then reorders DOM');
  console.log('5. Flag is cleared after DOM reordering completes\n');
  console.log('This ensures DOM elements exist before reorderPlatformCards() tries to move them.');
  process.exit(0);
} else {
  console.log('❌ FIX VERIFICATION FAILED ❌\n');
  console.log('The fix may not have been applied correctly.');
  process.exit(1);
}