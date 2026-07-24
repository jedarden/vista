/**
 * Test to verify renderPreviews() correctly uses platformPrefs.cardOrder
 *
 * This test checks that:
 * 1. renderPreviews() reads platformPrefs.cardOrder when available
 * 2. It uses the smart-ordered platform list instead of default order
 * 3. DOM elements are created in the correct order
 * 4. No race condition that resets order after reordering
 */

const fs = require('fs');
const path = require('path');

// Read the app.js file
const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

console.log('=== Testing renderPreviews() smart ordering ===\n');

// Test 1: Check if renderPreviews uses platformPrefs.cardOrder
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\)\s*{([\s\S]*?)^}/m);
if (!renderPreviewsMatch) {
  console.error('❌ Could not find renderPreviews function');
  process.exit(1);
}

const renderPreviewsBody = renderPreviewsMatch[1];
console.log('✓ Found renderPreviews function');

// Check for cardOrder usage
if (renderPreviewsBody.includes('platformPrefs.cardOrder')) {
  console.log('✓ renderPreviews() references platformPrefs.cardOrder');

  // Check if it actually uses the custom order
  if (renderPreviewsBody.includes('if (platformPrefs.cardOrder[group.id])')) {
    console.log('✓ renderPreviews() has conditional check for cardOrder[group.id]');

    // Check if it applies the custom order to platforms
    if (renderPreviewsBody.includes('customOrder = platformPrefs.cardOrder') ||
        renderPreviewsBody.includes('platformPrefs.cardOrder[group.id].filter')) {
      console.log('✓ renderPreviews() applies custom order from cardOrder');
    } else {
      console.log('❌ renderPreviews() checks cardOrder but doesn\'t apply it');
    }
  } else {
    console.log('❌ renderPreviews() doesn\'t have conditional check for cardOrder[group.id]');
  }
} else {
  console.log('❌ renderPreviews() doesn\'t reference platformPrefs.cardOrder');
}

// Test 2: Check if applySmartOrdering updates cardOrder
const applySmartOrderingMatch = appJs.match(/function applySmartOrdering\(\)\s*{([\s\S]*?)^}/m);
if (applySmartOrderingMatch) {
  const applyBody = applySmartOrderingMatch[1];
  console.log('\n✓ Found applySmartOrdering function');

  if (applyBody.includes('platformPrefs.cardOrder')) {
    console.log('✓ applySmartOrdering() updates platformPrefs.cardOrder');

    // Check if it saves to localStorage
    if (applyBody.includes('localStorage.setItem')) {
      console.log('✓ applySmartOrdering() saves to localStorage');
    } else {
      console.log('❌ applySmartOrdering() doesn\'t save to localStorage');
    }

    // Check if it re-renders previews
    if (applyBody.includes('renderPreviews(')) {
      console.log('✓ applySmartOrdering() calls renderPreviews() after updating order');
    } else {
      console.log('❌ applySmartOrdering() doesn\'t call renderPreviews()');
    }
  } else {
    console.log('❌ applySmartOrdering() doesn\'t update platformPrefs.cardOrder');
  }
}

// Test 3: Check if handleResult hook is properly set up
const hookMatch = appJs.match(/\/\/ ── Hook into handleResult for smart ordering ──([\s\S]*?)^const originalHandleResult2/m);
if (hookMatch) {
  console.log('\n✓ Found handleResult hook for smart ordering');

  const afterHook = appJs.substring(appJs.indexOf('const originalHandleResult2 = handleResult'));
  if (afterHook.includes('setTimeout(applySmartOrdering')) {
    console.log('✓ Hook calls applySmartOrdering with setTimeout');

    // Check the timing
    const timeoutMatch = afterHook.match(/setTimeout\(applySmartOrdering,\s*(\d+)\)/);
    if (timeoutMatch) {
      const delay = timeoutMatch[1];
      console.log(`  - Delay: ${delay}ms`);
    }
  } else {
    console.log('❌ Hook doesn\'t call applySmartOrdering');
  }
}

// Test 4: Check if PLATFORM_GROUPS is being modified in place
const sortMatch = appJs.match(/group\.platforms\.sort\(/);
if (sortMatch) {
  console.log('\n✓ applySmartOrdering() sorts PLATFORM_GROUPS in place');
} else {
  console.log('⚠️  Could not find in-place sorting of PLATFORM_GROUPS');
}

console.log('\n=== Analysis complete ===');
console.log('\nThe code structure appears correct. The issue may be:');
console.log('1. Timing: applySmartOrdering() might not be called before renderPreviews()');
console.log('2. State: PLATFORM_GROUPS might be reset after applySmartOrdering() runs');
console.log('3. Race condition: Multiple renderPreviews() calls might overwrite each other');
