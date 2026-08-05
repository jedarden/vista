#!/usr/bin/env node
'use strict';

/**
 * Test script to verify redirectChain captures HTML content and meta tags per hop.
 * Tests with URLs that have 3-4 hop redirect chains.
 */

const { fetchUrl } = require('./src/fetcher');

async function testRedirectChain(url, testName) {
  console.log(`\n=== Test: ${testName} ===`);
  console.log(`URL: ${url}`);

  try {
    const result = await fetchUrl(url);

    console.log(`\n✓ Fetch successful`);
    console.log(`Final URL: ${result.finalUrl}`);
    console.log(`Status: ${result.statusCode}`);
    console.log(`Redirect hops: ${result.redirectChain.length}`);

    // Verify redirectChain structure
    console.log('\n--- Redirect Chain Analysis ---');

    let allHopsHaveStructure = true;
    let htmlCaptureCount = 0;
    let metaTagCaptureCount = 0;

    result.redirectChain.forEach((hop, index) => {
      console.log(`\nHop ${index + 1}:`);
      console.log(`  URL: ${hop.url}`);
      console.log(`  Status: ${hop.statusCode}`);

      // Check required structure elements
      const requiredFields = ['url', 'statusCode', 'headers'];
      const missingFields = requiredFields.filter(field => !(field in hop));

      if (missingFields.length > 0) {
        console.log(`  ✗ Missing fields: ${missingFields.join(', ')}`);
        allHopsHaveStructure = false;
      } else {
        console.log(`  ✓ Has required fields: url, statusCode, headers`);
      }

      // Check HTML capture
      if (hop.html !== undefined) {
        console.log(`  ✓ HTML captured: ${hop.html ? hop.html.length + ' bytes' : 'empty'}`);
        htmlCaptureCount++;
      } else {
        console.log(`  ⚠ HTML not captured (undefined)`);
      }

      // Check metaTags array
      if (hop.metaTags && Array.isArray(hop.metaTags)) {
        console.log(`  ✓ Meta tags captured: ${hop.metaTags.length} tags`);
        if (hop.metaTags.length > 0) {
          const sampleTags = hop.metaTags.slice(0, 3);
          sampleTags.forEach(tag => {
            const key = tag.name || tag.property;
            if (key) {
              console.log(`    - ${key}: ${tag.content ? '"'+tag.content+'"' : '(no content)'}`);
            }
          });
        }
        metaTagCaptureCount++;
      } else {
        console.log(`  ⚠ Meta tags not captured or not array`);
      }

      // Check meta object (only for 200 HTML responses)
      if (hop.statusCode === 200 && hop.meta) {
        console.log(`  ✓ Critical meta tags extracted:`);
        if (hop.meta.title) console.log(`    - title: "${hop.meta.title}"`);
        if (hop.meta.description) console.log(`    - description: "${hop.meta.description.substring(0, 80)}..."`);
        if (hop.meta.ogTitle) console.log(`    - og:title: "${hop.meta.ogTitle}"`);
        if (hop.meta.ogImage) console.log(`    - og:image: ${hop.meta.ogImage}`);
      }

      // Check metaDiff (for hops with previous HTML content)
      if (hop.metaDiff) {
        console.log(`  ✓ Meta diff from previous hop:`);
        if (hop.metaDiff.changed.length > 0) {
          console.log(`    Changed: ${hop.metaDiff.changed.map(c => c.field).join(', ')}`);
        }
        if (hop.metaDiff.added.length > 0) {
          console.log(`    Added: ${hop.metaDiff.added.map(a => a.field).join(', ')}`);
        }
        if (hop.metaDiff.removed.length > 0) {
          console.log(`    Removed: ${hop.metaDiff.removed.map(r => r.field).join(', ')}`);
        }
        if (hop.metaDiff.stripped) {
          console.log(`    STRIPPED: All meaningful meta tags were lost!`);
        }
        if (hop.metaDiff.noindexRemoved) {
          console.log(`    NOINDEX REMOVED: Page became indexable`);
        }
      }

      // Check for warnings
      if (hop.warning) {
        console.log(`  ⚠ Warning: ${hop.warning}`);
      }
    });

    // Summary
    console.log('\n--- Summary ---');
    console.log(`Total hops: ${result.redirectChain.length}`);
    console.log(`Hops with HTML: ${htmlCaptureCount}/${result.redirectChain.length}`);
    console.log(`Hops with metaTags: ${metaTagCaptureCount}/${result.redirectChain.length}`);

    if (allHopsHaveStructure) {
      console.log('\n✓ All hops have required structure (url, statusCode, headers)');
    } else {
      console.log('\n✗ Some hops missing required structure');
    }

    // Verify acceptance criteria
    console.log('\n--- Acceptance Criteria Verification ---');

    const criteria = {
      'Captures response HTML at each redirect hop': htmlCaptureCount > 0,
      'Meta tags parsed and stored in redirectChain array': metaTagCaptureCount > 0,
      'redirectChain structure includes url, status, headers, html, metaTags': result.redirectChain.every(hop =>
        hop.url && hop.statusCode && hop.headers && ('html' in hop) && Array.isArray(hop.metaTags)
      )
    };

    let allCriteriaMet = true;
    for (const [criterion, met] of Object.entries(criteria)) {
      const status = met ? '✓' : '✗';
      console.log(`${status} ${criterion}`);
      if (!met) allCriteriaMet = false;
    }

    if (allCriteriaMet) {
      console.log('\n✅ ALL ACCEPTANCE CRITERIA MET');
    } else {
      console.log('\n❌ SOME ACCEPTANCE CRITERIA NOT MET');
    }

    return {
      success: true,
      hops: result.redirectChain.length,
      htmlCaptured: htmlCaptureCount,
      metaTagsCaptured: metaTagCaptureCount,
      criteriaMet: allCriteriaMet
    };

  } catch (error) {
    console.error(`\n✗ Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('Testing redirectChain per-hop meta tag extraction');
  console.log('==================================================');

  // Test URLs with redirect chains
  const tests = [
    {
      // httpbin.org provides a 3-hop redirect: /redirect/3 → /redirect/2 → /redirect/1 → /get
      url: 'https://httpbin.org/redirect/3',
      name: 'httpbin 3-hop redirect'
    },
    {
      // A real-world example with redirects
      url: 'https://j.mp/3test', // Shortened URL that should redirect
      name: 'Shortened URL redirect'
    },
    {
      // Test with HTTP→HTTPS redirect
      url: 'http://example.com',
      name: 'HTTP to HTTPS upgrade'
    }
  ];

  const results = [];
  for (const test of tests) {
    try {
      const result = await testRedirectChain(test.url, test.name);
      results.push(result);
    } catch (error) {
      console.error(`Test ${test.name} threw: ${error.message}`);
      results.push({ success: false, error: error.message, name: test.name });
    }
  }

  // Final summary
  console.log('\n\n==================================================');
  console.log('FINAL TEST SUMMARY');
  console.log('==================================================');

  const passed = results.filter(r => r.success && r.criteriaMet).length;
  const failed = results.filter(r => !r.success || !r.criteriaMet).length;

  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (passed === results.length) {
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testRedirectChain };
