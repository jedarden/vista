#!/usr/bin/env node

/**
 * Execution test for applySmartOrdering
 * Tests that the function is properly called and executes correctly
 */

const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, 'src/public/app.js');

console.log('🧪 Testing applySmartOrdering execution flow...\n');

// Read app.js
const appJs = fs.readFileSync(APP_JS_PATH, 'utf8');

// Extract the applySmartOrdering function
const funcMatch = appJs.match(/function applySmartOrdering\(\) \{[\s\S]*?\n\}/);
if (!funcMatch) {
  console.error('❌ Could not extract applySmartOrdering function');
  process.exit(1);
}

const funcCode = funcMatch[0];

// Extract the hook code
const hookMatch = appJs.match(/\/\/ ── Hook into handleResult for smart ordering ──[\s\S]*?setTimeout\(applySmartOrdering, 200\);[\s\S]*?\};/);
if (!hookMatch) {
  console.error('❌ Could not extract handleResult hook');
  process.exit(1);
}

const hookCode = hookMatch[0];

console.log('✅ Function and hook extracted successfully\n');

// Create a mock environment
global.currentData = {
  meta: {
    title: 'Test Page',
    og: { type: 'website' },
    canonical: 'https://example.com/test'
  }
};

global.platformPrefs = {
  smartOrdering: true,
  favorites: new Set(),
  hidden: new Set()
};

global.PLATFORM_GROUPS = [
  { name: 'General', platforms: ['perplexity', 'chatgpt', 'claude'] }
];

// Mock the functions that applySmartOrdering calls
global.detectPageType = function(meta) {
  if (!meta) return 'unknown';
  if (meta.og?.type === 'article') return 'article';
  if (meta.og?.type === 'video') return 'video';
  return 'website';
};

global.getPlatformOrderForPageType = function(pageType) {
  const orders = {
    'article': ['perplexity', 'claude', 'chatgpt'],
    'video': ['perplexity', 'chatgpt', 'claude'],
    'website': ['claude', 'perplexity', 'chatgpt']
  };
  return orders[pageType] || ['claude', 'perplexity', 'chatgpt'];
};

global.renderPreviews = function(data) {
  console.log('[renderPreviews] Called with data:', !!data);
};

global.showToast = function(message, duration) {
  console.log('[showToast]', message);
};

// Capture console logs
const capturedLogs = [];
const originalLog = console.log;
console.log = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  capturedLogs.push(message);
  originalLog.apply(console, args);
};

try {
  // Test 1: Function executes with smart ordering enabled
  console.log('Test 1: Execution with smart ordering enabled');
  console.log('━'.repeat(50));
  
  eval(funcCode);
  applySmartOrdering();
  
  const smartOrderingLogs = capturedLogs.filter(l => l.includes('[applySmartOrdering]'));
  
  console.log('\n📊 Test Results:');
  console.log(`- Total logs captured: ${capturedLogs.length}`);
  console.log(`- applySmartOrdering logs: ${smartOrderingLogs.length}`);
  console.log(`\n📋 Key execution points:`);
  
  const keyPoints = [
    'Function called',
    'Input parameters',
    'Page type detected',
    'Preferred platform order',
    'Reordering platform groups',
    'Re-rendering previews',
    'Function complete'
  ];
  
  keyPoints.forEach(point => {
    const found = smartOrderingLogs.some(l => l.includes(point));
    console.log(`  ${found ? '✅' : '❌'} ${point}`);
  });
  
  // Test 2: Function exits early when smart ordering disabled
  console.log('\n\nTest 2: Early exit when smart ordering disabled');
  console.log('━'.repeat(50));
  
  capturedLogs.length = 0;
  global.platformPrefs.smartOrdering = false;
  
  eval(funcCode);
  applySmartOrdering();
  
  const earlyExitLogs = capturedLogs.filter(l => l.includes('[applySmartOrdering]'));
  const hasEarlyExit = earlyExitLogs.some(l => l.includes('Early exit: smart ordering disabled'));
  
  console.log(`\n📊 Test Results:`);
  console.log(`  ${hasEarlyExit ? '✅' : '❌'} Early exit logged`);
  
  // Test 3: Function exits early when no currentData
  console.log('\n\nTest 3: Early exit when no currentData');
  console.log('━'.repeat(50));
  
  capturedLogs.length = 0;
  global.platformPrefs.smartOrdering = true;
  global.currentData = null;
  
  eval(funcCode);
  applySmartOrdering();
  
  const noDataLogs = capturedLogs.filter(l => l.includes('[applySmartOrdering]'));
  const hasNoDataExit = noDataLogs.some(l => l.includes('Early exit: no currentData'));
  
  console.log(`\n📊 Test Results:`);
  console.log(`  ${hasNoDataExit ? '✅' : '❌'} No data early exit logged`);
  
  // Verify hook structure
  console.log('\n\nTest 4: Hook structure verification');
  console.log('━'.repeat(50));
  
  const hookChecks = [
    { name: 'Saves original handleResult', pattern: /const originalHandleResult2 = handleResult/ },
    { name: 'Calls original function', pattern: /originalHandleResult2\(data\)/ },
    { name: 'Checks smartOrdering preference', pattern: /if \(platformPrefs\.smartOrdering\)/ },
    { name: 'Schedules applySmartOrdering', pattern: /setTimeout\(applySmartOrdering, 200\)/ }
  ];
  
  hookChecks.forEach(check => {
    const passed = check.pattern.test(hookCode);
    console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  });
  
  // Final summary
  console.log('\n\n' + '='.repeat(50));
  console.log('🎯 FINAL SUMMARY');
  console.log('='.repeat(50));
  
  const test1Passed = smartOrderingLogs.length >= 6;
  const test2Passed = hasEarlyExit;
  const test3Passed = hasNoDataExit;
  const hookTestsPassed = hookChecks.every(c => c.pattern.test(hookCode));
  
  console.log(`Test 1 (Normal execution): ${test1Passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Disabled early exit): ${test2Passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (No data early exit): ${test3Passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 4 (Hook structure): ${hookTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = test1Passed && test2Passed && test3Passed && hookTestsPassed;
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('\n🚀 The applySmartOrdering function is:');
    console.log('   - Properly defined ✅');
    console.log('   - Correctly hooked into handleResult ✅');
    console.log('   - Logging all execution steps ✅');
    console.log('   - Handling edge cases ✅');
    console.log('\n📝 To verify in browser:');
    console.log('   1. Open http://localhost:8000');
    console.log('   2. Open DevTools Console (F12)');
    console.log('   3. Search for any term');
    console.log('   4. Check for [applySmartOrdering] logs');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Error during execution test:', error.message);
  console.error(error.stack);
  process.exit(1);
}
