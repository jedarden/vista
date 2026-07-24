/**
 * Test renderPreviews() behavior with platformPrefs.cardOrder
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Analyzing renderPreviews() Smart Ordering Behavior ===\n');

// Extract the renderPreviews function
const renderPreviewsMatch = /function renderPreviews\(data\)[\s\S]*?^}/m.exec(appJs);
if (renderPreviewsMatch) {
  const renderPreviewsCode = renderPreviewsMatch[0];
  console.log('✅ Found renderPreviews() function');

  // Check for cardOrder reading
  const cardOrderCheck = /platformPrefs\.cardOrder\[group\.id\]/.test(renderPreviewsCode);
  console.log(`${cardOrderCheck ? '✅' : '❌'} Checks platformPrefs.cardOrder[group.id]`);

  // Check for isApplyingSmartOrder guard
  const guardCheck = /!isApplyingSmartOrder/.test(renderPreviewsCode);
  console.log(`${guardCheck ? '✅' : '❌'} Has isApplyingSmartOrder guard`);

  // Check for custom order filtering
  const customOrderCheck = /customOrder.*filter.*group\.platforms\.includes/.test(renderPreviewsCode);
  console.log(`${customOrderCheck ? '✅' : '❌'} Filters custom order to existing platforms`);

  // Check for new platforms handling
  const newPlatformsCheck = /newPlatforms.*group\.platforms\.filter.*!customOrder\.includes/.test(renderPreviewsCode);
  console.log(`${newPlatformsCheck ? '✅' : '❌'} Adds new platforms after custom order`);

  // Check for final platforms array usage
  const platformsUsageCheck = /platforms\.forEach\(/.test(renderPreviewsCode);
  console.log(`${platformsUsageCheck ? '✅' : '❌'} Iterates over reordered platforms array`);
} else {
  console.log('❌ Could not find renderPreviews() function');
}

// Check the hook implementation
console.log('\n=== Analyzing Hook Implementation ===');

const hookMatch = /\/\/ ── Hook into handleResult for smart ordering ──([\s\S]*?)^\/\*\*/m.exec(appJs);
if (hookMatch) {
  const hookCode = hookMatch[1];
  console.log('✅ Found handleResult hook');

  const originalHandleResultCheck = /const originalHandleResult2 = handleResult;/.test(hookCode);
  console.log(`${originalHandleResultCheck ? '✅' : '❌'} Saves original handleResult`);

  const handleResultRedefinition = /handleResult = async function\(data\)/.test(hookCode);
  console.log(`${handleResultRedefinition ? '✅' : '❌'} Redefines handleResult`);

  const callsOriginal = /await originalHandleResult2\(data\)/.test(hookCode);
  console.log(`${callsOriginal ? '✅' : '❌'} Calls original handleResult`);

  const callsSmartOrdering = /applySmartOrdering/.test(hookCode);
  console.log(`${callsSmartOrdering ? '✅' : '❌'} Calls applySmartOrdering`);

  // Check if it uses setTimeout or immediate call
  const usesTimeout = /setTimeout\(applySmartOrdering/.test(hookCode);
  const usesImmediateCall = /applySmartOrderingSafe\(\)/.test(hookCode);
  console.log(`${usesTimeout ? '⏱️' : usesImmediateCall ? '⚡' : '❌'} Timing: ${usesTimeout ? 'setTimeout' : usesImmediateCall ? 'immediate' : 'none'}`);
} else {
  console.log('❌ Could not find hook implementation');
}

// Check applySmartOrdering implementation
console.log('\n=== Analyzing applySmartOrdering() ===');

const applySmartOrderingMatch = /function applySmartOrdering\(\)[\s\S]*?^}/m.exec(appJs);
if (applySmartOrderingMatch) {
  const applySmartOrderingCode = applySmartOrderingMatch[0];
  console.log('✅ Found applySmartOrdering() function');

  const updatesCardOrder = /platformPrefs\.cardOrder\[group\.id\] = \[\.\.\.group\.platforms\]/.test(applySmartOrderingCode);
  console.log(`${updatesCardOrder ? '✅' : '❌'} Updates platformPrefs.cardOrder[group.id]`);

  const savesToLocalStorage = /localStorage\.setItem\('vista-platform-prefs'/.test(applySmartOrderingCode);
  console.log(`${savesToLocalStorage ? '✅' : '❌'} Saves to localStorage`);

  const callsReorderCards = /reorderPlatformCards\(\)/.test(applySmartOrderingCode);
  console.log(`${callsReorderCards ? '✅' : '❌'} Calls reorderPlatformCards()`);

  const callsRenderPreviews = /renderPreviews\(currentData\)/.test(applySmartOrderingCode);
  console.log(`${callsRenderPreviews ? '✅' : '❌'} Calls renderPreviews(currentData)`);
} else {
  console.log('❌ Could not find applySmartOrdering() function');
}

// Check for potential reset points
console.log('\n=== Checking for cardOrder Reset Points ===');

const resetMatches = [
  { regex: /platformPrefs\.cardOrder\s*=\s*parsed\.cardOrder/, line: 'Load from localStorage', safe: true },
  { regex: /platformPrefs\.cardOrder\s*=\s*{\s*}/, line: 'Reset to empty object', safe: false },
  { regex: /delete\s+platformPrefs\.cardOrder/, line: 'Delete cardOrder', safe: false },
  { regex: /platformPrefs\s*=\s*{[^}]*cardOrder:[^}]*}/, line: 'Reassign platformPrefs', safe: false }
];

resetMatches.forEach(({ regex, line, safe }) => {
  const matches = regex.test(appJs);
  if (matches) {
    console.log(`${safe ? '✅' : '⚠️'} ${line}: ${safe ? 'safe' : 'POTENTIAL ISSUE'}`);
  }
});

// Analyze the flow
console.log('\n=== Expected Flow ===');
console.log('1. handleResult(data) called');
console.log('2. Hook: await originalHandleResult2(data)');
console.log('3.   → renderPreviews(data) called');
console.log('4.   → isApplyingSmartOrder = false, so it READS cardOrder if available');
console.log('5. Hook: applySmartOrderingSafe()');
console.log('6.   → isApplyingSmartOrder = true');
console.log('7.   → applySmartOrdering()');
console.log('8.     → Reorders PLATFORM_GROUPS');
console.log('9.     → Updates platformPrefs.cardOrder');
console.log('10.    → Saves to localStorage');
console.log('11.    → reorderPlatformCards()');
console.log('12.      → Moves DOM elements to match new order');
console.log('13.   → isApplyingSmartOrder = false');

console.log('\n=== Potential Issues ===');
console.log('❌ If step 4 uses STALE cardOrder (before smart ordering)');
console.log('❌ If step 12 does not correctly move DOM elements');
console.log('❌ If another renderPreviews() call happens AFTER step 13 but BEFORE cardOrder is updated');

console.log('\n=== Verification Needed ===');
console.log('1. Does renderPreviews() use the updated cardOrder after applySmartOrdering?');
console.log('2. Does reorderPlatformCards() correctly move DOM elements?');
console.log('3. Are there any code paths that reset cardOrder after smart ordering?');

process.exit(0);
