#!/usr/bin/env node

/**
 * Verification script for applySmartOrdering execution flow
 */

const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, 'src/public/app.js');

console.log('🔍 Verifying applySmartOrdering execution flow...\n');

// Read app.js
const appJs = fs.readFileSync(APP_JS_PATH, 'utf8');

// Check 1: Function exists
const functionExists = /function applySmartOrdering\(\) \{/.test(appJs);
console.log(`${functionExists ? '✅' : '❌'} applySmartOrdering function defined`);

// Check 2: Function is called from handleResult hook
const hookExists = /handleResult = function\(data\)/.test(appJs) &&
                   /originalHandleResult2\(data\)/.test(appJs) &&
                   /if \(platformPrefs\.smartOrdering\) \{[\s\S]*?setTimeout\(applySmartOrdering/.test(appJs);
console.log(`${hookExists ? '✅' : '❌'} Hooked into handleResult`);

// Check 3: Logging is in place
const logs = [
  'Function called',
  'Early exit: no currentData',
  'Early exit: smart ordering disabled',
  'Input parameters',
  'Page type detected',
  'Preferred platform order',
  'Reordering platform groups',
  'Re-rendering previews',
  'Function complete'
];

const missingLogs = [];
logs.forEach(log => {
  const hasLog = appJs.includes(`[applySmartOrdering] ${log}`);
  console.log(`${hasLog ? '✅' : '❌'} Log: "${log}"`);
  if (!hasLog) missingLogs.push(log);
});

// Check 4: Function structure
const checks = [
  { name: 'Checks for currentData', pattern: /if \(!currentData/ },
  { name: 'Checks smartOrdering preference', pattern: /if \(!platformPrefs\.smartOrdering\)/ },
  { name: 'Detects page type', pattern: /const pageType = detectPageType/ },
  { name: 'Gets preferred order', pattern: /const preferredOrder = getPreferredPlatformOrder/ },
  { name: 'Reorders groups', pattern: /forEach\(\(group, groupIndex\)/ },
  { name: 'Re-renders previews', pattern: /renderPlatformPreviews/ }
];

console.log('\n📋 Function structure checks:');
checks.forEach(check => {
  const passed = check.pattern.test(appJs);
  console.log(`${passed ? '✅' : '❌'} ${check.name}`);
});

// Summary
console.log('\n📊 Summary:');
console.log(`- Function exists: ${functionExists ? 'YES' : 'NO'}`);
console.log(`- Properly hooked: ${hookExists ? 'YES' : 'NO'}`);
console.log(`- Missing logs: ${missingLogs.length}`);

if (functionExists && hookExists && missingLogs.length === 0) {
  console.log('\n✅ All code checks passed!');
  console.log('\n🧪 Manual Testing Instructions:');
  console.log('1. Open http://localhost:8000 in your browser');
  console.log('2. Open Developer Console (F12)');
  console.log('3. Search for something (e.g., "test")');
  console.log('4. Check console for [applySmartOrdering] logs');
  console.log('5. Verify the logs show:');
  console.log('   - "Function called"');
  console.log('   - "Input parameters" with actual data');
  console.log('   - "Page type detected"');
  console.log('   - "Function complete ✅"');
  console.log('\n💡 To disable smart ordering, run in console:');
  console.log('   localStorage.setItem("vista-platform-prefs", JSON.stringify({smartOrdering: false}));');
  console.log('   Then refresh and search again - you should see "Early exit: smart ordering disabled"');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed!');
  if (missingLogs.length > 0) {
    console.log('Missing logs:', missingLogs);
  }
  process.exit(1);
}
