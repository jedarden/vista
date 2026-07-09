'use strict';

const {
  validateUrl,
  validateUrlOrThrow,
  isPrivateIP,
  isIPv6Loopback,
  isIPv6LinkLocal,
  ipInCidr,
} = require('../../src/ssrf-guard');

/**
 * Unit tests for SSRF Guard functionality
 */

function runTests() {
  console.log('Running SSRF Guard unit tests...\n');

  let passed = 0;
  let failed = 0;

  // Test helper
  function test(description, fn) {
    try {
      fn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${description}`);
      console.log(`  Error: ${err.message}`);
      failed++;
    }
  }

  // Test helper for async functions
  async function testAsync(description, fn) {
    try {
      await fn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${description}`);
      console.log(`  Error: ${err.message}`);
      failed++;
    }
  }

  // Test ipInCidr helper function
  console.log('=== Testing ipInCidr helper ===');
  test('ipInCidr: 127.0.0.1 in 127.0.0.0/8', () => {
    if (!ipInCidr('127.0.0.1', '127.0.0.0/8')) {
      throw new Error('Expected true for 127.0.0.1 in 127.0.0.0/8');
    }
  });

  test('ipInCidr: 192.168.1.1 in 192.168.0.0/16', () => {
    if (!ipInCidr('192.168.1.1', '192.168.0.0/16')) {
      throw new Error('Expected true for 192.168.1.1 in 192.168.0.0/16');
    }
  });

  test('ipInCidr: 8.8.8.8 NOT in 10.0.0.0/8', () => {
    if (ipInCidr('8.8.8.8', '10.0.0.0/8')) {
      throw new Error('Expected false for 8.8.8.8 in 10.0.0.0/8');
    }
  });

  test('ipInCidr: 172.31.255.255 in 172.16.0.0/12', () => {
    if (!ipInCidr('172.31.255.255', '172.16.0.0/12')) {
      throw new Error('Expected true for 172.31.255.255 in 172.16.0.0/12');
    }
  });

  // Test isPrivateIP function
  console.log('\n=== Testing isPrivateIP ===');
  test('isPrivateIP: rejects loopback 127.0.0.1', () => {
    if (!isPrivateIP('127.0.0.1')) {
      throw new Error('Expected true for 127.0.0.1');
    }
  });

  test('isPrivateIP: rejects loopback 127.0.0.0', () => {
    if (!isPrivateIP('127.0.0.0')) {
      throw new Error('Expected true for 127.0.0.0');
    }
  });

  test('isPrivateIP: rejects loopback 127.255.255.255', () => {
    if (!isPrivateIP('127.255.255.255')) {
      throw new Error('Expected true for 127.255.255.255');
    }
  });

  test('isPrivateIP: rejects private 10.0.0.1', () => {
    if (!isPrivateIP('10.0.0.1')) {
      throw new Error('Expected true for 10.0.0.1');
    }
  });

  test('isPrivateIP: rejects private 172.16.0.1', () => {
    if (!isPrivateIP('172.16.0.1')) {
      throw new Error('Expected true for 172.16.0.1');
    }
  });

  test('isPrivateIP: rejects private 192.168.1.1', () => {
    if (!isPrivateIP('192.168.1.1')) {
      throw new Error('Expected true for 192.168.1.1');
    }
  });

  test('isPrivateIP: rejects link-local 169.254.169.254', () => {
    if (!isPrivateIP('169.254.169.254')) {
      throw new Error('Expected true for 169.254.169.254 (metadata service)');
    }
  });

  test('isPrivateIP: rejects reserved 0.0.0.0', () => {
    if (!isPrivateIP('0.0.0.0')) {
      throw new Error('Expected true for 0.0.0.0');
    }
  });

  test('isPrivateIP: accepts public IP 8.8.8.8', () => {
    if (isPrivateIP('8.8.8.8')) {
      throw new Error('Expected false for 8.8.8.8');
    }
  });

  test('isPrivateIP: accepts public IP 1.1.1.1', () => {
    if (isPrivateIP('1.1.1.1')) {
      throw new Error('Expected false for 1.1.1.1');
    }
  });

  // Test IPv6 functions
  console.log('\n=== Testing IPv6 functions ===');
  test('isIPv6Loopback: identifies ::1 as loopback', () => {
    if (!isIPv6Loopback('::1')) {
      throw new Error('Expected true for ::1');
    }
  });

  test('isIPv6Loopback: identifies ::1/128 as loopback', () => {
    if (!isIPv6Loopback('::1/128')) {
      throw new Error('Expected true for ::1/128');
    }
  });

  test('isIPv6Loopback: rejects 2001:4860:4860::8888', () => {
    if (isIPv6Loopback('2001:4860:4860::8888')) {
      throw new Error('Expected false for 2001:4860:4860::8888');
    }
  });

  test('isIPv6LinkLocal: identifies fe80::1 as link-local', () => {
    if (!isIPv6LinkLocal('fe80::1')) {
      throw new Error('Expected true for fe80::1');
    }
  });

  test('isIPv6LinkLocal: identifies fe80:: as link-local', () => {
    if (!isIPv6LinkLocal('fe80::')) {
      throw new Error('Expected true for fe80::');
    }
  });

  test('isIPv6LinkLocal: rejects 2001:4860:4860::8888', () => {
    if (isIPv6LinkLocal('2001:4860:4860::8888')) {
      throw new Error('Expected false for 2001:4860:4860::8888');
    }
  });

  // Test validateUrl function
  console.log('\n=== Testing validateUrl (async) ===');

  (async () => {
    await testAsync('validateUrl: rejects literal "localhost"', async () => {
      const result = await validateUrl('http://localhost:8080/test');
      if (result.valid) {
        throw new Error('Expected validation to fail for localhost');
      }
      if (!result.error.includes('localhost')) {
        throw new Error('Expected error to mention localhost');
      }
    });

    await testAsync('validateUrl: rejects loopback IP 127.0.0.1', async () => {
      const result = await validateUrl('http://127.0.0.1:8080/test');
      if (result.valid) {
        throw new Error('Expected validation to fail for 127.0.0.1');
      }
      if (!result.error.includes('private/internal')) {
        throw new Error('Expected error to mention private/internal address');
      }
    });

    await testAsync('validateUrl: rejects metadata IP 169.254.169.254', async () => {
      const result = await validateUrl('http://169.254.169.254/latest/meta-data/');
      if (result.valid) {
        throw new Error('Expected validation to fail for metadata IP');
      }
      if (!result.error.includes('169.254.169.254')) {
        throw new Error('Expected error to mention the IP address');
      }
    });

    await testAsync('validateUrl: rejects private IP 10.0.0.1', async () => {
      const result = await validateUrl('http://10.0.0.1:3000/api');
      if (result.valid) {
        throw new Error('Expected validation to fail for 10.0.0.1');
      }
    });

    await testAsync('validateUrl: rejects private IP 192.168.1.1', async () => {
      const result = await validateUrl('http://192.168.1.1/test');
      if (result.valid) {
        throw new Error('Expected validation to fail for 192.168.1.1');
      }
    });

    await testAsync('validateUrl: rejects file:// protocol', async () => {
      const result = await validateUrl('file:///etc/passwd');
      if (result.valid) {
        throw new Error('Expected validation to fail for file:// protocol');
      }
      if (!result.error.includes('protocol')) {
        throw new Error('Expected error to mention protocol');
      }
    });

    await testAsync('validateUrl: rejects ftp:// protocol', async () => {
      const result = await validateUrl('ftp://example.com/file');
      if (result.valid) {
        throw new Error('Expected validation to fail for ftp:// protocol');
      }
    });

    await testAsync('validateUrl: accepts https://example.com', async () => {
      const result = await validateUrl('https://example.com/');
      if (!result.valid) {
        throw new Error('Expected validation to succeed for example.com');
      }
    });

    await testAsync('validateUrl: accepts https://www.google.com', async () => {
      const result = await validateUrl('https://www.google.com/search?q=test');
      if (!result.valid) {
        throw new Error('Expected validation to succeed for google.com');
      }
    });

    await testAsync('validateUrl: accepts http://example.com', async () => {
      const result = await validateUrl('http://example.com/');
      if (!result.valid) {
        throw new Error('Expected validation to succeed for http://example.com');
      }
    });

    // Note: The following test requires actual DNS resolution
    // In a real test environment, this would test that a hostname
    // that resolves to a private IP is rejected. For now, we skip
    // this test as it depends on external DNS.

    await testAsync('validateUrlOrThrow: throws on invalid URL', async () => {
      try {
        await validateUrlOrThrow('http://localhost:8080/');
        throw new Error('Expected validateUrlOrThrow to throw for localhost');
      } catch (err) {
        if (!err.message.includes('localhost')) {
          throw new Error('Expected error message to mention localhost');
        }
      }
    });

    await testAsync('validateUrlOrThrow: succeeds on valid URL', async () => {
      try {
        const result = await validateUrlOrThrow('https://example.com/');
        if (!result.valid) {
          throw new Error('Expected validation to succeed');
        }
      } catch (err) {
        throw new Error('Expected no error for valid URL: ' + err.message);
      }
    });

    console.log('\n=== Test Results ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  })();
}

// Run the tests
runTests();
