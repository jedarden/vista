/**
 * Unit test for generateQRCode() function
 *
 * Tests that the generateQRCode function:
 * - Generates QR codes from valid URLs
 * - Handles empty/invalid URLs gracefully
 * - Returns data URLs in the correct format
 * - Is testable in isolation
 */

function testGenerateQRCode() {
  console.log('Testing generateQRCode() function...\n');

  // Test 1: Valid URL
  console.log('Test 1: Valid URL');
  generateQRCode('https://example.com/test')
    .then(dataUrl => {
      if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
        console.log('✓ PASS: Returns valid data URL for valid URL');
        console.log('  - Data URL length:', dataUrl.length);
      } else {
        console.error('✗ FAIL: Invalid data URL returned');
      }
    });

  // Test 2: Empty URL
  console.log('\nTest 2: Empty URL');
  generateQRCode('')
    .then(dataUrl => {
      if (dataUrl === null) {
        console.log('✓ PASS: Returns null for empty URL');
      } else {
        console.error('✗ FAIL: Should return null for empty URL');
      }
    });

  // Test 3: Invalid URL
  console.log('\nTest 3: Invalid URL');
  generateQRCode('not-a-valid-url')
    .then(dataUrl => {
      if (dataUrl === null) {
        console.log('✓ PASS: Returns null for invalid URL');
      } else {
        console.error('✗ FAIL: Should return null for invalid URL');
      }
    });

  // Test 4: Null URL
  console.log('\nTest 4: Null URL');
  generateQRCode(null)
    .then(dataUrl => {
      if (dataUrl === null) {
        console.log('✓ PASS: Returns null for null input');
      } else {
        console.error('✗ FAIL: Should return null for null input');
      }
    });

  // Test 5: URL with query parameters (like share URLs)
  console.log('\nTest 5: URL with query parameters');
  generateQRCode('https://example.com/?url=https://example.com/page')
    .then(dataUrl => {
      if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
        console.log('✓ PASS: Returns valid data URL for URL with query params');
        console.log('  - Data URL length:', dataUrl.length);
      } else {
        console.error('✗ FAIL: Invalid data URL for URL with query params');
      }
    });

  // Test 6: Custom options
  console.log('\nTest 6: Custom options (size, colors)');
  generateQRCode('https://example.com', {
    width: 150,
    height: 150,
    colorDark: '#FF0000',
    colorLight: '#FFFF00'
  })
    .then(dataUrl => {
      if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
        console.log('✓ PASS: Accepts custom options');
        console.log('  - Data URL length:', dataUrl.length);
      } else {
        console.error('✗ FAIL: Should accept custom options');
      }
    });

  console.log('\n--- All tests completed ---');
  console.log('Note: Tests run asynchronously, check results above.');
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.generateQRCode) {
  testGenerateQRCode();
} else {
  console.log('This test requires a browser environment with QRCode library loaded.');
  console.log('Include this script in a test HTML page or run via the browser console.');
}
