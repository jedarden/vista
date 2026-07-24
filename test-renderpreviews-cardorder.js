/**
 * Test to verify renderPreviews() correctly uses platformPrefs.cardOrder
 * and creates DOM elements in the smart order.
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

console.log('=== Testing renderPreviews() cardOrder usage ===\n');

// Extract renderPreviews function
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\)\s*{([\s\S]*?)^}/m);
if (!renderPreviewsMatch) {
  console.error('❌ Could not find renderPreviews function');
  process.exit(1);
}

const renderPreviewsBody = renderPreviewsMatch[1];

// Test 1: Check for platformPrefs.cardOrder usage
console.log('Test 1: Check for platformPrefs.cardOrder usage');
if (renderPreviewsBody.includes('platformPrefs.cardOrder')) {
  console.log('✅ renderPreviews() references platformPrefs.cardOrder');
} else {
  console.log('❌ renderPreviews() does NOT reference platformPrefs.cardOrder');
}

// Test 2: Check for conditional on group.id
console.log('\nTest 2: Check for conditional check on cardOrder[group.id]');
if (renderPreviewsBody.includes('platformPrefs.cardOrder[group.id]')) {
  console.log('✅ renderPreviews() checks platformPrefs.cardOrder[group.id]');
} else {
  console.log('❌ renderPreviews() does NOT check platformPrefs.cardOrder[group.id]');
}

// Test 3: Check if it applies the custom order
console.log('\nTest 3: Check if custom order is applied to platforms variable');
if (renderPreviewsBody.includes('platforms = [...customOrder') ||
    renderPreviewsBody.includes('platforms = [...customOrder, ...newPlatforms]')) {
  console.log('✅ renderPreviews() applies custom order to platforms variable');
} else {
  console.log('❌ renderPreviews() does NOT apply custom order');
}

// Test 4: Check if it destroys and recreates DOM
console.log('\nTest 4: Check DOM handling approach');
if (renderPreviewsBody.includes('previewGrid.innerHTML = \'\'')) {
  console.log('⚠️  renderPreviews() destroys and recreates all DOM elements (previewGrid.innerHTML = \'\')');
  console.log('   This means it does not move existing elements, it creates new ones');
} else {
  console.log('✅ renderPreviews() does not destroy all elements');
}

// Test 5: Check the race condition guard
console.log('\nTest 5: Check race condition guard');
if (renderPreviewsBody.includes('isApplyingSmartOrder')) {
  console.log('✅ renderPreviews() checks isApplyingSmartOrder flag');
  if (renderPreviewsBody.includes('if (isApplyingSmartOrder')) {
    console.log('✅ renderPreviews() queues render when smart ordering is in progress');
  }
  if (renderPreviewsBody.includes('!isApplyingSmartOrder')) {
    console.log('✅ renderPreviews() conditionally uses cardOrder when !isApplyingSmartOrder');
  }
} else {
  console.log('❌ renderPreviews() does NOT check isApplyingSmartOrder');
}

// Test 7: Check for logging when cardOrder is loaded
console.log('\nTest 7: Check for cardOrder loading verification');
const loadPrefsMatch = appJs.match(/function loadPlatformPrefs\(\)\s*{([\s\S]*?)^}/m);
if (loadPrefsMatch) {
  const loadPrefsBody = loadPrefsMatch[1];
  if (loadPrefsBody.includes('console.log') && loadPrefsBody.includes('cardOrder')) {
    console.log('✅ loadPlatformPrefs() logs when cardOrder is loaded');
    if (loadPrefsBody.includes('[loadPlatformPrefs]')) {
      console.log('✅ Logging uses [loadPlatformPrefs] prefix');
    }
  } else {
    console.log('❌ loadPlatformPrefs() does NOT log cardOrder loading');
  }
} else {
  console.log('❌ Could not find loadPlatformPrefs function');
}

// Test 8: Check for logging when renderPreviews uses cardOrder
console.log('\nTest 8: Check for renderPreviews cardOrder verification logging');
if (renderPreviewsBody.includes('console.log') &&
    (renderPreviewsBody.includes('[renderPreviews]') ||
     renderPreviewsBody.includes('cardOrder available'))) {
  console.log('✅ renderPreviews() logs cardOrder availability');
  if (renderPreviewsBody.includes('using cardOrder for custom order')) {
    console.log('✅ renderPreviews() logs when custom order is applied');
  }
} else {
  console.log('❌ renderPreviews() does NOT log cardOrder usage');
}

// Test 6: Check applySmartOrdering flow
console.log('\nTest 9: Check if applySmartOrdering triggers renderPreviews');
const applyMatch = appJs.match(/function applySmartOrdering\(\)\s*{([\s\S]*?)^}/m);
if (applyMatch) {
  const applyBody = applyMatch[1];
  if (applyBody.includes('renderPreviews(')) {
    console.log('✅ applySmartOrdering() calls renderPreviews()');
  } else {
    console.log('⚠️  applySmartOrdering() does NOT directly call renderPreviews()');
    console.log('   (It may be called via applySmartOrderingSafe or hook)');
  }
}

// Check the hook flow
const hookMatch = appJs.match(/handleResult = async function\(data\)\s*{([\s\S]*?)^}/m);
if (hookMatch) {
  const hookBody = hookMatch[1];
  if (hookBody.includes('applySmartOrdering')) {
    console.log('✅ handleResult hook triggers applySmartOrdering');
    if (hookBody.includes('applySmartOrderingSafe()')) {
      console.log('✅ Uses applySmartOrderingSafe wrapper with guard flags');
    }
  }
}

// Check applySmartOrderingSafe for queued render
const safeMatch = appJs.match(/function applySmartOrderingSafe\(\)\s*{([\s\S]*?)^}/m);
if (safeMatch) {
  const safeBody = safeMatch[1];
  if (safeBody.includes('pendingRenderData') && safeBody.includes('renderPreviews(dataToRender)')) {
    console.log('✅ applySmartOrderingSafe processes queued render after smart ordering completes');
    console.log('   This ensures renderPreviews uses the updated cardOrder');
  }
}

console.log('\n=== Summary ===');
console.log('\nThe code should work as follows:');
console.log('1. handleResult → applySmartOrderingSafe → applySmartOrdering');
console.log('2. applySmartOrdering updates platformPrefs.cardOrder[group.id]');
console.log('3. applySmartOrderingSafe calls renderPreviews(dataToRender) with queued data');
console.log('4. renderPreviews checks platformPrefs.cardOrder[group.id] and creates elements in that order');
console.log('\nLogging added for verification:');
console.log('- [loadPlatformPrefs] Logs when cardOrder is loaded from localStorage');
console.log('- [renderPreviews] Logs cardOrder availability and custom order usage');
console.log('\nPotential issues:');
console.log('- If renderPreviews is called from elsewhere (not the queued path), it may not use cardOrder');
console.log('- The DOM is destroyed and recreated, not moved (may cause flicker)');
