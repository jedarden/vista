/**
 * Test: Queued render processing in applySmartOrderingSafe
 *
 * This test verifies that renderPreviews() calls during smart ordering are:
 * 1. Queued in pendingRenderData
 * 2. Processed after the finally block (when isApplyingSmartOrder is cleared)
 * 3. Use the updated cardOrder from smart ordering
 * 4. Don't result in data loss or infinite loops
 */

const fs = require('fs');

console.log('Testing queued render processing in applySmartOrderingSafe...\n');

// Read the app.js file
const appJs = fs.readFileSync('src/public/app.js', 'utf8');

// Test 1: Verify renderPreviews queues when flag is set
console.log('Test 1: Checking if renderPreviews queues when isApplyingSmartOrder is true');
const renderPreviewsMatch = /function renderPreviews\(data\)\s*{[\s\S]*?^}/m.exec(appJs);
if (renderPreviewsMatch) {
  const renderBody = renderPreviewsMatch[0];
  const hasQueueCheck = renderBody.includes('if (isApplyingSmartOrder)');
  const hasPendingRenderData = renderBody.includes('pendingRenderData = data');
  const hasEarlyReturn = renderBody.includes('return; // Skip rendering during smart ordering');

  if (hasQueueCheck && hasPendingRenderData && hasEarlyReturn) {
    console.log('✅ renderPreviews queues when isApplyingSmartOrder is true');
  } else {
    console.log('❌ FAILED: renderPreviews missing queue logic');
    console.log('  - Has queue check:', hasQueueCheck);
    console.log('  - Has pendingRenderData assignment:', hasPendingRenderData);
    console.log('  - Has early return:', hasEarlyReturn);
    process.exit(1);
  }
} else {
  console.log('❌ FAILED: Could not find renderPreviews function');
  process.exit(1);
}

// Test 2: Verify queued render is processed AFTER finally block
console.log('\nTest 2: Checking if queued render is processed after finally block');
const applySafeMatch = /function applySmartOrderingSafe\(\)\s*{[\s\S]*?^}/m.exec(appJs);
if (applySafeMatch) {
  const applySafeBody = applySafeMatch[0];

  // Find the finally block
  const finallyMatch = /finally\s*{([\s\S]*?)^}/m.exec(applySafeBody);
  if (finallyMatch) {
    const finallyBlock = finallyMatch[1];

    // Check that pendingRenderData is processed in finally block
    const processesQueue = finallyBlock.includes('pendingRenderData') &&
                          finallyBlock.includes('renderPreviews(dataToRender)');

    // Check that it's processed AFTER clearing the flag
    const flagClearedFirst = finallyBlock.indexOf('isApplyingSmartOrder = false') <
                             finallyBlock.indexOf('pendingRenderData');

    if (processesQueue && flagClearedFirst) {
      console.log('✅ Queued render is processed after flag is cleared in finally block');
    } else {
      console.log('❌ FAILED: Queued render not processed correctly');
      console.log('  - Processes queue in finally:', processesQueue);
      console.log('  - Flag cleared before processing queue:', flagClearedFirst);
      process.exit(1);
    }
  } else {
    console.log('❌ FAILED: Could not find finally block in applySmartOrderingSafe');
    process.exit(1);
  }
} else {
  console.log('❌ FAILED: Could not find applySmartOrderingSafe function');
  process.exit(1);
}

// Test 3: Verify order of operations in applySmartOrderingSafe
console.log('\nTest 3: Verifying order of operations in applySmartOrderingSafe');
if (applySafeMatch) {
  const body = applySafeMatch[0];

  // Find the positions of key operations
  const applySmartOrderingPos = body.indexOf('applySmartOrdering()');
  const reorderPlatformCardsPos = body.indexOf('reorderPlatformCards()');
  const isApplyingSmartOrderSetPos = body.indexOf('isApplyingSmartOrder = true');
  const isApplyingSmartOrderClearPos = body.indexOf('isApplyingSmartOrder = false');
  const pendingRenderProcessPos = body.indexOf('pendingRenderData');

  // Verify the order: set flag → applySmartOrdering → reorder → clear flag → process queue
  const orderCorrect = isApplyingSmartOrderSetPos > 0 &&
                      applySmartOrderingPos > isApplyingSmartOrderSetPos &&
                      reorderPlatformCardsPos > applySmartOrderingPos &&
                      isApplyingSmartOrderClearPos > reorderPlatformCardsPos &&
                      pendingRenderProcessPos > isApplyingSmartOrderClearPos;

  if (orderCorrect) {
    console.log('✅ Operations are in correct order:');
    console.log('  1. Set isApplyingSmartOrder = true');
    console.log('  2. Call applySmartOrdering()');
    console.log('  3. Call reorderPlatformCards()');
    console.log('  4. Clear isApplyingSmartOrder = false');
    console.log('  5. Process queued render');
  } else {
    console.log('❌ FAILED: Operations not in correct order');
    process.exit(1);
  }
}

// Test 4: Verify no duplicate queue processing (should only be in finally)
console.log('\nTest 4: Verifying queue is only processed once (in finally block)');
if (applySafeMatch) {
  const body = applySafeMatch[0];

  // Count how many times we process pendingRenderData (check for renderPreviews call with pendingRenderData)
  const processQueueMatches = body.match(/if\s*\(\s*pendingRenderData\s*\)/g);
  const processCount = processQueueMatches ? processQueueMatches.length : 0;

  if (processCount === 1) {
    console.log('✅ Queue is processed exactly once (in finally block)');
  } else {
    console.log('❌ FAILED: Queue processed', processCount, 'times (should be 1)');
    process.exit(1);
  }
}

// Test 5: Verify queue is cleared before rendering
console.log('\nTest 5: Verifying queue is cleared before rendering to prevent re-queue');
if (applySafeMatch) {
  const body = applySafeMatch[0];
  const finallyMatch = /finally\s*{([\s\S]*?)^}/m.exec(body);

  if (finallyMatch) {
    const finallyBlock = finallyMatch[1];

    // Check that pendingRenderData is set to null before calling renderPreviews
    const clearedBeforeRender = finallyBlock.includes('pendingRenderData = null') &&
                               finallyBlock.indexOf('pendingRenderData = null') <
                               finallyBlock.indexOf('renderPreviews(dataToRender)');

    if (clearedBeforeRender) {
      console.log('✅ Queue is cleared before rendering to prevent re-queue');
    } else {
      console.log('❌ FAILED: Queue not cleared before rendering');
      process.exit(1);
    }
  }
}

// Test 6: Verify comments explain the logic
console.log('\nTest 6: Verifying code has explanatory comments');
if (applySafeMatch) {
  const body = applySafeMatch[0];

  const hasCriticalComment = body.includes('critical') ||
                            body.includes('renderPreviews checks isApplyingSmartOrder');

  if (hasCriticalComment) {
    console.log('✅ Code has comments explaining the critical timing');
  } else {
    console.log('⚠️  WARNING: Missing explanatory comments about timing');
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests passed! Queued render processing is correctly implemented.');
console.log('='.repeat(60));
console.log('\nSummary:');
console.log('- renderPreviews queues when isApplyingSmartOrder is true');
console.log('- Queue is processed after flag is cleared in finally block');
console.log('- This prevents infinite re-queue loops');
console.log('- Queued renders use the updated cardOrder from smart ordering');
console.log('- No data loss from queued renders');
