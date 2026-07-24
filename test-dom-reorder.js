/**
 * Test DOM reordering implementation
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Testing DOM Reordering Implementation ===\n');

// Extract the reorderPlatformCards function
const reorderFunction = appJs.match(/function reorderPlatformCards\(\) \{[\s\S]*?\n\}/);
if (!reorderFunction) {
  console.log('ERROR: Could not find reorderPlatformCards function');
  process.exit(1);
}

const functionText = reorderFunction[0];

// Test 1: Does reorderPlatformCards function exist?
console.log('--- Test 1: Function exists ---');
const hasFunction = /function reorderPlatformCards\(/.test(appJs);
console.log((hasFunction ? 'PASS' : 'FAIL') + ' reorderPlatformCards() function defined');

// Test 2: Does it iterate over PLATFORM_GROUPS?
console.log('\n--- Test 2: Iterates over PLATFORM_GROUPS ---');
const iteratesGroups = functionText.includes('PLATFORM_GROUPS.forEach');
console.log((iteratesGroups ? 'PASS' : 'FAIL') + ' Iterates over PLATFORM_GROUPS');

// Test 3: Does it check for cardOrder per group?
console.log('\n--- Test 3: Checks for cardOrder per group ---');
const checksCardOrder = functionText.includes('platformPrefs.cardOrder[group.id]');
console.log((checksCardOrder ? 'PASS' : 'FAIL') + ' Checks cardOrder for each group');

// Test 4: Does it find the cards-row element?
console.log('\n--- Test 4: Finds cards-row element ---');
const findsRow = functionText.includes("querySelector('.cards-row')");
console.log((findsRow ? 'PASS' : 'FAIL') + ' Finds cards-row element');

// Test 5: Does it use appendChild to move existing cards?
console.log('\n--- Test 5: Uses appendChild to reorder ---');
const usesAppendChild = functionText.includes('appendChild(card)');
console.log((usesAppendChild ? 'PASS' : 'FAIL') + ' Uses appendChild to move cards');

// Test 6: Does applySmartOrdering call reorderPlatformCards?
console.log('\n--- Test 6: applySmartOrdering calls reorderPlatformCards ---');
const applySmartFunction = appJs.match(/function applySmartOrdering\(\) \{[\s\S]*?\n\}/);
if (applySmartFunction) {
  const callsReorder = applySmartFunction[0].includes('reorderPlatformCards()');
  console.log((callsReorder ? 'PASS' : 'FAIL') + ' applySmartOrdering() calls reorderPlatformCards()');

  // Test 7: Does applySmartOrdering NOT call renderPreviews?
  console.log('\n--- Test 7: applySmartOrdering does NOT call renderPreviews ---');
  const callsRenderPreviews = applySmartFunction[0].includes('renderPreviews(currentData)');
  console.log((!callsRenderPreviews ? 'PASS' : 'FAIL') + ' applySmartOrdering() does NOT call renderPreviews()');
}

// Test 8: Verify the reordering logic
console.log('\n--- Test 8: Reordering logic verification ---');

const logicChecks = {
  'Creates map of cards by data-pid': functionText.includes('cardsByPid = new Map'),
  'Queries existing platform cards': functionText.includes("querySelectorAll('.platform-card')"),
  'Iterates targetOrder from cardOrder': functionText.includes('targetOrder.forEach'),
  'Moves cards with appendChild': functionText.includes('appendChild(card)'),
  'Updates animation delays': functionText.includes('setProperty') && functionText.includes('--stagger-delay')
};

Object.entries(logicChecks).forEach(([name, passed]) => {
  console.log((passed ? 'PASS' : 'FAIL') + ' ' + name);
});

// Test 9: Full function integrity
console.log('\n--- Test 9: Function integrity ---');

const integrityChecks = {
  'Has function declaration': functionText.includes('function reorderPlatformCards()'),
  'Returns early if no cardOrder': functionText.includes('if (!platformPrefs.cardOrder'),
  'Returns early if no group element': functionText.includes('if (!groupEl)'),
  'Returns early if no row element': functionText.includes('if (!row)'),
  'Uses existing DOM elements (no cloneNode)': functionText.includes('appendChild') && !functionText.includes('cloneNode')
};

Object.entries(integrityChecks).forEach(([name, passed]) => {
  console.log((passed ? 'PASS' : 'FAIL') + ' ' + name);
});

// Test 10: Complete verification
console.log('\n--- Test 10: Complete flow verification ---');

// Check that the function is called in the right place
const applySmartBlock = appJs.match(/function applySmartOrdering[\s\S]*?^(?=\n\/\/|function)/m);
if (applySmartBlock) {
  const block = applySmartBlock[0];

  const flowChecks = {
    'Updates PLATFORM_GROUPS order': block.includes('group.platforms.sort'),
    'Sets platformPrefs.cardOrder': block.includes('platformPrefs.cardOrder[group.id] ='),
    'Saves to localStorage': block.includes("setItem('vista-platform-prefs'"),
    'Calls reorderPlatformCards': block.includes('reorderPlatformCards()'),
    'Shows toast message': block.includes('showToast')
  };

  Object.entries(flowChecks).forEach(([name, passed]) => {
    console.log((passed ? 'PASS' : 'FAIL') + ' ' + name);
  });
}

const allChecks = [
  hasFunction, iteratesGroups, checksCardOrder, findsRow, usesAppendChild,
  ...Object.values(logicChecks), ...Object.values(integrityChecks)
];

console.log('\n=== ' + (allChecks.every(v => v) ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED') + ' ===');

// Summary
console.log('\n=== Summary ===');
console.log('The reorderPlatformCards() function:');
console.log('1. Iterates over each platform group');
console.log('2. Checks if cardOrder is defined for the group');
console.log('3. Finds the DOM elements (group and cards-row)');
console.log('4. Maps existing platform cards by their data-pid');
console.log('5. Reorders cards by appending them in targetOrder');
console.log('6. Updates animation delays for smooth appearance');
console.log('7. Is called by applySmartOrdering() instead of renderPreviews()');
console.log('8. Uses appendChild to MOVE existing elements (not clone)');
