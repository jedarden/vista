/**
 * Test reorderPlatformCards() implementation
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Testing reorderPlatformCards() Implementation ===\n');

// Extract the function
const reorderMatch = /function reorderPlatformCards\(\)[\s\S]*?^}/m.exec(appJs);
if (reorderMatch) {
  const reorderCode = reorderMatch[0];
  console.log('✅ Found reorderPlatformCards() function\n');
  console.log('--- Function Code ---');
  console.log(reorderCode);
  console.log('--- End Code ---\n');

  // Check for key operations
  const checks = [
    { name: 'Checks isApplyingSmartOrder guard', regex: /if \(!isApplyingSmartOrder/, critical: false },
    { name: 'Iterates over PLATFORM_GROUPS', regex: /PLATFORM_GROUPS\.forEach/, critical: true },
    { name: 'Checks for cardOrder[group.id]', regex: /platformPrefs\.cardOrder\[group\.id\]/, critical: true },
    { name: 'Gets group element by ID', regex: /document\.getElementById\('group-'/, critical: true },
    { name: 'Finds cards-row element', regex: /querySelector\('\.cards-row'\)/, critical: true },
    { name: 'Gets targetOrder from cardOrder', regex: /const targetOrder = platformPrefs\.cardOrder\[group\.id\]/, critical: true },
    { name: 'Creates cardsByPid map', regex: /cardsByPid\.set\(pid, card\)/, critical: true },
    { name: 'Moves cards with appendChild', regex: /row\.appendChild\(card\)/, critical: true },
    { name: 'Updates animation delays', regex: /\.setProperty\('--stagger-delay'/, critical: false }
  ];

  console.log('--- Implementation Checks ---');
  let criticalFailures = 0;
  checks.forEach(({ name, regex, critical }) => {
    const passed = regex.test(reorderCode);
    console.log(`${passed ? '✅' : '❌'} ${name}${critical ? ' (CRITICAL)' : ''}`);
    if (!passed && critical) criticalFailures++;
  });

  if (criticalFailures === 0) {
    console.log('\n✅ All critical checks passed');
  } else {
    console.log(`\n❌ ${criticalFailures} critical failure(s) found`);
  }

} else {
  console.log('❌ Could not find reorderPlatformCards() function');
  process.exit(1);
}

// Now let's analyze the actual bug
console.log('\n=== Analyzing the Bug ===');
console.log('The function looks correct, BUT let me check the guard flag logic...\n');

// Check if isApplyingSmartOrder is checked properly
const guardCheck = /if\s*\(\s*!isApplyingSmartOrder\s*&&\s*DEBUG_SMART_ORDERING/.test(appJs);
if (guardCheck) {
  console.log('⚠️ ISSUE FOUND: isApplyingSmartOrder guard only logs a warning');
  console.log('   The function continues even when isApplyingSmartOrder is false!');
  console.log('   This could cause issues if reorderPlatformCards() is called at the wrong time.\n');
}

// Check the actual flow
console.log('=== Expected Behavior ===');
console.log('applySmartOrdering() sets isApplyingSmartOrder = true');
console.log('applySmartOrdering() calls reorderPlatformCards()');
console.log('reorderPlatformCards() should find isApplyingSmartOrder = true');
console.log('reorderPlatformCards() should move DOM elements to match cardOrder');

console.log('\n=== ACTUAL Behavior ===');
console.log('applySmartOrdering() sets isApplyingSmartOrder = true (via applySmartOrderingSafe)');
console.log('applySmartOrdering() calls reorderPlatformCards()');
console.log('reorderPlatformCards() checks isApplyingSmartOrder');
console.log('If false: logs warning (but continues)');
console.log('If true: no warning (continues)');
console.log('reorderPlatformCards() moves DOM elements');

console.log('\n=== The Real Bug ===');
console.log('Looking at the code flow:');
console.log('1. renderPreviews() is called FIRST with isApplyingSmartOrder = false');
console.log('2. renderPreviews() creates DOM elements in order of group.platforms');
console.log('3. BUT: renderPreviews() checks if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder)');
console.log('4. If cardOrder exists, it REORDERS the platforms array BEFORE creating DOM');
console.log('5. So the DOM SHOULD be created in the correct order from the start!');

console.log('\n=== Hypothesis ===');
console.log('The bug might be that:');
console.log('- renderPreviews() ALREADY uses cardOrder to create DOM in correct order');
console.log('- reorderPlatformCards() is then called and moves them AGAIN');
console.log('- This is redundant but should work...');
console.log('');
console.log('OR:');
console.log('- There is a race condition where cardOrder is not set yet');
console.log('- renderPreviews() uses default order');
console.log('- Then reorderPlatformCards() moves them to cardOrder');
console.log('- This should also work...');

console.log('\n=== Need to Check ===');
console.log('1. Is platformPrefs.cardOrder initialized before first render?');
console.log('2. Are there any timing issues with localStorage loading?');
console.log('3. Does drag-and-drop break the ordering?');

process.exit(0);
