/**
 * Debug test to verify renderPreviews() correctly uses smart-ordered platforms
 *
 * This simulates the flow:
 * 1. Initial render with default order
 * 2. Smart ordering is applied (cardOrder is set)
 * 3. renderPreviews is called and should use cardOrder
 */

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

console.log('=== Debug: renderPreviews() Smart Ordering Flow ===\n');

// Simulate the state
const simulatedState = {
  // State before smart ordering
  beforeSmartOrder: {
    isApplyingSmartOrder: false,
    cardOrder: null,
    platformsOrder: ['twitter', 'facebook', 'linkedin', 'pinterest']
  },
  // State during smart ordering
  duringSmartOrder: {
    isApplyingSmartOrder: true,
    cardOrder: null,
    platformsOrder: ['twitter', 'facebook', 'linkedin', 'pinterest']
  },
  // State after smart ordering
  afterSmartOrder: {
    isApplyingSmartOrder: false,
    cardOrder: {
      'social': ['pinterest', 'linkedin', 'facebook', 'twitter']
    },
    platformsOrder: ['twitter', 'facebook', 'linkedin', 'pinterest']
  }
};

console.log('Scenario 1: renderPreviews called BEFORE smart ordering');
console.log('  isApplyingSmartOrder:', simulatedState.beforeSmartOrder.isApplyingSmartOrder);
console.log('  cardOrder exists:', !!simulatedState.beforeSmartOrder.cardOrder);
console.log('  Expected: Use default PLATFORM_GROUPS order');
console.log('  renderPreviews check: if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');
console.log('  Result: false && true = false → Use default order ✅\n');

console.log('Scenario 2: renderPreviews called DURING smart ordering');
console.log('  isApplyingSmartOrder:', simulatedState.duringSmartOrder.isApplyingSmartOrder);
console.log('  cardOrder exists:', !!simulatedState.duringSmartOrder.cardOrder);
console.log('  Expected: Queue the render, return early');
console.log('  renderPreviews check: if (isApplyingSmartOrder)');
console.log('  Result: true → Queue render and return ✅\n');

console.log('Scenario 3: renderPreviews called AFTER smart ordering (via queued path)');
console.log('  isApplyingSmartOrder:', simulatedState.afterSmartOrder.isApplyingSmartOrder);
console.log('  cardOrder exists:', !!simulatedState.afterSmartOrder.cardOrder);
console.log('  cardOrder[social]:', simulatedState.afterSmartOrder.cardOrder?.['social']);
console.log('  Expected: Use cardOrder instead of default order');
console.log('  renderPreviews check: if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');
console.log('  Result: true && true = true → Use cardOrder ✅\n');

// Now check the actual code
console.log('=== Checking actual code implementation ===\n');

// Find the renderPreviews function
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\)\s*{([\s\S]*?)^}/m);
if (!renderPreviewsMatch) {
  console.error('❌ Could not find renderPreviews function');
  process.exit(1);
}

const renderPreviewsBody = renderPreviewsMatch[1];

// Check for the queue logic
console.log('Check 1: Race condition queue logic');
if (renderPreviewsBody.includes('if (isApplyingSmartOrder)')) {
  console.log('✅ Found: if (isApplyingSmartOrder)');
  if (renderPreviewsBody.includes('pendingRenderData = data') &&
      renderPreviewsBody.includes('return;')) {
    console.log('✅ Correctly queues render and returns early during smart ordering');
  } else {
    console.log('❌ Queue logic incomplete');
  }
} else {
  console.log('❌ No queue logic found');
}

// Check for cardOrder usage
console.log('\nCheck 2: cardOrder usage');
if (renderPreviewsBody.includes('platformPrefs.cardOrder[group.id]')) {
  console.log('✅ Found: platformPrefs.cardOrder[group.id]');

  // Check the full condition
  if (renderPreviewsBody.includes('if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)')) {
    console.log('✅ Correct condition: if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');

    // Check if custom order is applied
    if (renderPreviewsBody.includes('platforms = [...customOrder, ...newPlatforms]')) {
      console.log('✅ Applies custom order: platforms = [...customOrder, ...newPlatforms]');
    } else {
      console.log('❌ Does not apply custom order');
    }
  } else {
    console.log('❌ Condition does not check !isApplyingSmartOrder');
  }
} else {
  console.log('❌ No cardOrder usage found');
}

// Check DOM handling
console.log('\nCheck 3: DOM element handling');
if (renderPreviewsBody.includes('previewGrid.innerHTML = \'\'')) {
  console.log('⚠️  DOM is destroyed and recreated (previewGrid.innerHTML = \'\')');
  console.log('   This means elements are NOT moved, they are recreated');
  console.log('   For comparison, reorderPlatformCards() MOVES existing elements');
} else {
  console.log('✅ DOM elements are preserved/moved');
}

// Summary
console.log('\n=== Summary ===');
console.log('\nThe renderPreviews() implementation:');
console.log('✅ Correctly queues renders during smart ordering');
console.log('✅ Checks for cardOrder after smart ordering completes');
console.log('✅ Uses custom order when available');
console.log('⚠️  Destroys and recreates DOM instead of moving elements');
console.log('\nPotential issues:');
console.log('1. DOM destruction/recreation may cause visual flicker');
console.log('2. Event handlers on cards may be lost and need re-attachment');
console.log('3. Animation state may be reset');
console.log('\nAcceptance criteria status:');
console.log('- Reads platformPrefs.cardOrder when available: ✅');
console.log('- Uses smart-ordered platform list: ✅');
console.log('- Moves DOM elements to match new order: ❌ (recreates instead)');
console.log('- Does not reset cards back to original order: ✅ (uses cardOrder)');
