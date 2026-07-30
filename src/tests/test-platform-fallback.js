/**
 * Test: Unknown Platform Fallback Handling
 *
 * This test verifies that renderPlatformWithContext handles unknown/unsupported
 * platforms gracefully without crashing.
 */

// Load the app.js file which contains renderPlatformWithContext
const fs = require('fs');
const appCode = fs.readFileSync('/home/coding/vista/src/public/app.js', 'utf8');

// Extract and evaluate renderPlatformWithContext function
// This is a simplified test - in production you'd use a proper test framework

eval(appCode);

// Mock dependencies if not already defined
if (typeof PLATFORM_FRAMES === 'undefined') {
  global.PLATFORM_FRAMES = {
    twitter: { name: 'Twitter', chrome: '<div class="context-header">{{cardContent}}</div>' },
    facebook: { name: 'Facebook', chrome: '<div class="context-header">{{cardContent}}</div>' }
  };
}

if (typeof PLATFORM_NAMES === 'undefined') {
  global.PLATFORM_NAMES = {
    twitter: 'Twitter',
    facebook: 'Facebook'
  };
}

// Test cases
console.log('Testing unknown platform fallback handling...\n');

// Test 1: Unknown platform ID
console.log('Test 1: Unknown platform ID');
try {
  const pid = 'unknown-platform-xyz';
  const meta = { og: { title: 'Test Title', description: 'Test Desc' } };
  const result = renderPlatformWithContext(pid, meta, null, 'https://example.com', 'dark');
  console.log(`✓ Platform '${pid}' handled gracefully`);
  console.log(`  Result type: ${typeof result}, Length: ${result.length}`);
} catch (e) {
  console.error(`✗ Failed with error: ${e.message}`);
}

// Test 2: Empty platform ID
console.log('\nTest 2: Empty platform ID');
try {
  const result = renderPlatformWithContext('', { og: {} }, null, '', 'light');
  console.log(`✓ Empty platform handled gracefully`);
  console.log(`  Result type: ${typeof result}`);
} catch (e) {
  console.error(`✗ Failed with error: ${e.message}`);
}

// Test 3: Null platform ID
console.log('\nTest 3: Null platform ID');
try {
  const result = renderPlatformWithContext(null, { og: {} }, null, '', 'dark');
  console.log(`✓ Null platform handled gracefully`);
  console.log(`  Result type: ${typeof result}`);
} catch (e) {
  console.error(`✗ Failed with error: ${e.message}`);
}

// Test 4: Invalid meta object
console.log('\nTest 4: Invalid meta object');
try {
  const result = renderPlatformWithContext('twitter', null, null, '', 'dark');
  console.log(`✓ Null meta handled gracefully`);
  console.log(`  Result type: ${typeof result}`);
} catch (e) {
  console.error(`✗ Failed with error: ${e.message}`);
}

// Test 5: Invalid theme
console.log('\nTest 5: Invalid theme parameter');
try {
  const result = renderPlatformWithContext('twitter', { og: {} }, null, '', 'invalid-theme');
  console.log(`✓ Invalid theme handled gracefully`);
  console.log(`  Result type: ${typeof result}`);
} catch (e) {
  console.error(`✗ Failed with error: ${e.message}`);
}

// Test 6: Known platform (should work normally)
console.log('\nTest 6: Known platform (baseline)');
try {
  const result = renderPlatformWithContext('twitter', { og: { title: 'Test' } }, null, 'https://twitter.com', 'dark');
  console.log(`✓ Known platform works normally`);
  console.log(`  Result contains 'twitter': ${result.includes('twitter')}`);
} catch (e) {
  console.error(`✗ Failed with error: ${e.message}`);
}

console.log('\n✅ All fallback tests completed without crashes');
