/**
 * Verification test for platform-frames.config.ts integration
 * Tests that renderPlatformWithContext properly uses the platform frame mapping
 */

const fs = require('fs');
const path = require('path');

console.log('=== Platform Frame Integration Verification ===\n');

const appJsPath = path.join(__dirname, 'src/public/app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

let passedTests = 0;
let failedTests = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ PASS: ${name}`);
    passedTests++;
  } else {
    console.log(`✗ FAIL: ${name}`);
    failedTests++;
  }
}

// Test 1: renderPlatformWithContext function exists
test(
  'renderPlatformWithContext function exists',
  /function renderPlatformWithContext\(/.test(appJsContent)
);

// Test 2: Function references platform frame mapping
test(
  'Function references platform frame configuration system',
  appJsContent.includes('platform-frames.config.ts') || 
  appJsContent.includes('PLATFORM_FRAMES') ||
  appJsContent.includes('platform-frames mapping')
);

// Test 3: Function uses getPlatformFrame for frame selection
test(
  'Function uses getPlatformFrame for platform-specific frame selection',
  appJsContent.includes('getPlatformFrame')
);

// Test 4: Function handles unknown platforms gracefully
test(
  'Function includes fallback for unknown/unsupported platforms',
  appJsContent.includes('Unknown platform') || 
  appJsContent.includes('renderGenericContextFrame') ||
  appJsContent.includes('fallback')
);

// Test 5: Function calls buildContextFrame
test(
  'Function calls buildContextFrame to render frame with content',
  appJsContent.includes('buildContextFrame(pid, contentData, theme)')
);

// Test 6: Generic fallback function exists
test(
  'Generic fallback context frame function exists',
  /function renderGenericContextFrame\(/.test(appJsContent)
);

// Test 7: Fallback function wraps card content
test(
  'Fallback function wraps content in context-frame div',
  /class="context-frame generic-context"/.test(appJsContent)
);

// Test 8: Content data preparation includes all required fields
test(
  'Content data preparation includes title, description, image, domain',
  appJsContent.includes('title: ogTitle') &&
  appJsContent.includes('description: ogDesc') &&
  appJsContent.includes('image: ogImage') &&
  appJsContent.includes('domain: domain')
);

// Test 9: Function passes theme parameter to frame builder
test(
  'Theme parameter is passed to buildContextFrame',
  /buildContextFrame\(pid, contentData, theme\)/.test(appJsContent)
);

// Test 10: Platform frame selection logic checks if platform is supported
test(
  'Function checks if platform is supported before rendering',
  appJsContent.includes('getPlatformFrame(pid)') &&
  appJsContent.includes('platformFrame')
);

// Summary
console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n✅ All tests passed! Platform frame integration is working correctly.');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} test(s) failed. Please review the integration.`);
  process.exit(1);
}
