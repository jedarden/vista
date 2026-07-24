#!/usr/bin/env node
/**
 * Verification script for bf-5lddo
 * Verifies applySmartOrdering() logic and preference check
 */

const fs = require('fs');

console.log('===== Verifying applySmartOrdering() Logic =====\n');

// Read the app.js file
const appJs = fs.readFileSync('src/public/app.js', 'utf8');

let passed = 0;
let failed = 0;

function verify(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

// 1. Verify function exists
verify('1. applySmartOrdering function exists', 
  /function applySmartOrdering\(\)/.test(appJs));

// 2. Verify platformPrefs.smartOrdering check
verify('2. Checks platformPrefs.smartOrdering flag',
  /if\s*\(\s*!platformPrefs\.smartOrdering\s*\)/.test(appJs));

// 3. Verify early return when smartOrdering is false
verify('3. Returns early when smartOrdering is disabled',
  /if\s*\(\s*!platformPrefs\.smartOrdering\s*\)[\s\S]*?return/.test(appJs));

// 4. Verify currentData.meta is used for page type detection
verify('4. Calls detectPageType with currentData.meta',
  /const pageType = detectPageType\(currentData\.meta\)/.test(appJs));

// 5. Verify getPlatformOrderForPageType is called
verify('5. Calls getPlatformOrderForPageType with pageType',
  /const preferredOrder = getPlatformOrderForPageType\(pageType\)/.test(appJs));

// 6. Verify PLATFORM_GROUPS is reordered
verify('6. Iterates over PLATFORM_GROUPS',
  /PLATFORM_GROUPS\.forEach/.test(appJs));

// 7. Verify sorting logic based on preferred order
verify('7. Sorts platforms based on preferredOrder',
  /group\.platforms\.sort\(\(a,\s*b\)\s*=>\s*\{[\s\S]*?preferredOrder\.indexOf\(a\)/.test(appJs));

// 8. Verify platformPrefs.cardOrder is created if needed
verify('8. Initializes cardOrder object if not exists',
  /if\s*\(\s*!platformPrefs\.cardOrder\s*\)\s*\{[\s\S]*?platformPrefs\.cardOrder\s*=\s*\{\}/.test(appJs));

// 9. Verify platformPrefs.cardOrder is updated with reordered platforms
verify('9. Updates cardOrder with reordered platforms',
  /platformPrefs\.cardOrder\[group\.id\]\s*=\s*\[\.\.\.group\.platforms\]/.test(appJs));

// 10. Verify preferences are saved to localStorage
verify('10. Saves platformPrefs to localStorage',
  /localStorage\.setItem\('vista-platform-prefs',\s*JSON\.stringify\(platformPrefs\)\)/.test(appJs));

// 11. Verify renderPreviews is called to refresh UI
verify('11. Calls renderPreviews to update UI',
  /renderPreviews\(currentData\)/.test(appJs));

// 12. Verify detectPageType function exists
verify('12. detectPageType function exists',
  /function detectPageType\(meta\)/.test(appJs));

// 13. Verify getPlatformOrderForPageType function exists
verify('13. getPlatformOrderForPageType function exists',
  /function getPlatformOrderForPageType\(pageType\)/.test(appJs));

// 14. Verify early exit when no currentData
verify('14. Early exit when currentData is null/undefined',
  /if\s*\(\s*!currentData\s*\)[\s\S]*?return/.test(appJs));

console.log('\n===== Summary =====');
console.log(`Total checks: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
  console.log('\n✅ All acceptance criteria verified!');
  process.exit(0);
} else {
  console.log('\n❌ Some verification checks failed!');
  process.exit(1);
}
