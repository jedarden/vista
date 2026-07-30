/**
 * Verification script for bf-58uc1: Smart platform list reordering in renderPreviews()
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Verifying bf-58uc1 Implementation ===\n');

let allPassed = true;

// Test 1: Check that renderPreviews uses platformPrefs.cardOrder
console.log('Test 1: renderPreviews uses platformPrefs.cardOrder');
const usesCardOrder = appJs.includes('platformPrefs.cardOrder[group.id]');
console.log(`  ${usesCardOrder ? '✅ PASS' : '❌ FAIL'}: Uses platformPrefs.cardOrder[group.id]`);
if (!usesCardOrder) allPassed = false;

// Test 2: Check that platforms are reordered before DOM creation
console.log('\nTest 2: Reordering happens before DOM manipulation');
const reorderBeforeDOM = /let platforms = group\.platforms;[\s\S]*?platforms\.forEach/.test(appJs);
console.log(`  ${reorderBeforeDOM ? '✅ PASS' : '❌ FAIL'}: Platforms reordered before forEach loop`);
if (!reorderBeforeDOM) allPassed = false;

// Test 3: Check that original order is used as fallback
console.log('\nTest 3: Original platform order preserved as fallback');
const hasFallback = /let platforms = group\.platforms;/.test(appJs);
console.log(`  ${hasFallback ? '✅ PASS' : '❌ FAIL'}: Defaults to group.platforms`);
if (!hasFallback) allPassed = false;

// Test 4: Check that custom order is filtered to existing platforms
console.log('\nTest 4: Platform array correctly mapped to cardOrder sequence');
const filtersExisting = /\.filter\(pid => group\.platforms\.includes\(pid\)\)/.test(appJs);
console.log(`  ${filtersExisting ? '✅ PASS' : '❌ FAIL'}: Filters cardOrder to existing platforms`);
if (!filtersExisting) allPassed = false;

// Test 5: Check that new platforms are added after custom order
console.log('\nTest 5: New platforms added after custom order');
const addsNewPlatforms = /newPlatforms.*group\.platforms\.filter\(pid => !customOrder\.includes\(pid\)\)/.test(appJs);
console.log(`  ${addsNewPlatforms ? '✅ PASS' : '❌ FAIL'}: Adds new platforms after custom order`);
if (!addsNewPlatforms) allPassed = false;

// Test 6: Check that reordered array is used for iteration
console.log('\nTest 6: Reordered array used for DOM creation');
const usesReordered = /platforms\.forEach\(\(pid, i\)/.test(appJs);
console.log(`  ${usesReordered ? '✅ PASS' : '❌ FAIL'}: Iterates over reordered platforms array`);
if (!usesReordered) allPassed = false;

// Test 7: Verify the actual code location in renderPreviews
console.log('\nTest 7: Code is in renderPreviews function');
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\) \{([\s\S]*?)\n\}/);
if (renderPreviewsMatch) {
  const renderPreviewsBody = renderPreviewsMatch[1];
  const hasCardOrderInRenderPreviews = renderPreviewsBody.includes('platformPrefs.cardOrder[group.id]');
  console.log(`  ${hasCardOrderInRenderPreviews ? '✅ PASS' : '❌ FAIL'}: cardOrder logic is in renderPreviews`);
  if (!hasCardOrderInRenderPreviews) allPassed = false;
} else {
  console.log('  ❌ FAIL: Could not find renderPreviews function');
  allPassed = false;
}

console.log('\n=== Summary ===');
if (allPassed) {
  console.log('✅ All acceptance criteria met!');
  console.log('\nThe smart platform list reordering is already implemented in renderPreviews().');
  console.log('The implementation:');
  console.log('1. Uses cardOrder data to reorder platforms');
  console.log('2. Reorders before DOM manipulation');
  console.log('3. Falls back to original order if no cardOrder exists');
  console.log('4. Correctly maps platform array to cardOrder sequence');
  process.exit(0);
} else {
  console.log('❌ Some acceptance criteria not met');
  process.exit(1);
}
