/**
 * Detailed test of renderPreviews() and platformPrefs.cardOrder interaction
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Testing renderPreviews() cardOrder Integration ===\n');

// Extract the renderPreviews function
const renderPreviewsMatch = appJs.match(/function renderPreviews\(data\)[\s\S]*?^(?=\n|[\/\s]*function|[\/\s]*const)/m);

if (!renderPreviewsMatch) {
  console.log('❌ Could not find renderPreviews function');
  process.exit(1);
}

const renderPreviewsCode = renderPreviewsMatch[0];
console.log('Found renderPreviews function');

// Test 1: Does renderPreviews check for cardOrder?
console.log('\n--- Test 1: Checking for cardOrder presence check ---');
const hasCardOrderCheck = renderPreviewsCode.includes('platformPrefs.cardOrder');
console.log(`References platformPrefs.cardOrder: ${hasCardOrderCheck ? '✅' : '❌'}`);

// Test 2: Find the exact logic for using cardOrder
console.log('\n--- Test 2: Finding cardOrder logic ---');
const cardOrderLogicMatch = renderPreviewsCode.match(/if\s*\([^)]*platformPrefs\.cardOrder[^)]*\)[\s\S]*?platforms\s*=/);
if (cardOrderLogicMatch) {
  console.log('Found cardOrder logic:');
  console.log(cardOrderLogicMatch[0]);
} else {
  console.log('❌ Could not find cardOrder logic block');
}

// Test 3: Check what platform list is used in forEach
console.log('\n--- Test 3: Checking forEach platform list ---');
const forEachMatch = renderPreviewsCode.match(/platforms\.forEach\(([^)]+)\)/);
if (forEachMatch) {
  console.log(`✅ Uses platforms array in forEach: ${forEachMatch[1]}`);
} else {
  console.log('❌ Could not find platforms.forEach');
}

// Test 4: Verify platforms variable assignment
console.log('\n--- Test 4: Checking platforms variable assignment ---');
const platformsAssignment = renderPreviewsCode.match(/let platforms\s*=\s*[^;]+;/);
if (platformsAssignment) {
  console.log('Platforms initialization:', platformsAssignment[0]);
} else {
  console.log('❌ Could not find platforms initialization');
}

// Test 5: Check if platforms is reassigned based on cardOrder
console.log('\n--- Test 5: Checking for platforms reassignment ---');
const reassignmentMatches = renderPreviewsCode.match(/platforms\s*=\s*\[[^\]]+\]/g);
if (reassignmentMatches) {
  console.log('Found platforms reassignments:');
  reassignmentMatches.forEach(match => console.log(`  - ${match}`));
} else {
  console.log('❌ No platforms reassignments found');
}

// Test 6: Full integration test
console.log('\n--- Test 6: Full Integration Check ---');

const checks = {
  'Checks cardOrder[group.id]': /if\s*\(\s*platformPrefs\.cardOrder\[group\.id\]\s*\)/.test(renderPreviewsCode),
  'Filters custom order to existing platforms': /customOrder.*filter.*group\.platforms\.includes/.test(renderPreviewsCode),
  'Adds new platforms not in custom order': /newPlatforms.*filter.*!customOrder\.includes/.test(renderPreviewsCode),
  'Combines custom + new platforms': /platforms\s*=\s*\[\.\.\.customOrder,\s*\.\.\.newPlatforms\]/.test(renderPreviewsCode),
  'Uses platforms in forEach': /platforms\.forEach/.test(renderPreviewsCode)
};

Object.entries(checks).forEach(([name, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${name}`);
});

const allPassed = Object.values(checks).every(v => v);
console.log(`\n${allPassed ? '✅ All checks passed' : '❌ Some checks failed'}`);

// Test 7: Analyze the exact code path
console.log('\n--- Test 7: Exact Code Path Analysis ---');

// Find the platforms initialization and modification code
const platformCodeMatch = renderPreviewsCode.match(/\/\/ Use custom order[^}]*platforms\.forEach/s);
if (platformCodeMatch) {
  console.log('Found custom order code block:');
  console.log(platformCodeMatch[0]);
}

console.log('\n=== Conclusion ===');
console.log('If all tests pass, renderPreviews() should correctly use platformPrefs.cardOrder.');
console.log('The issue may be:');
console.log('1. platformPrefs.cardOrder not being set before renderPreviews is called');
console.log('2. The hook timing (200ms delay) causing visible reordering');
console.log('3. Another code path calling renderPreviews and resetting the order');
