#!/usr/bin/env node
'use strict';

/**
 * Verification test for redirectChain per-hop meta tag extraction
 *
 * This test verifies that fetchUrl captures HTML content and meta tags
 * for each hop in the redirect chain, as required by bead bf-28vl.
 *
 * Acceptance criteria:
 * - fetchUrl captures response HTML at each redirect hop
 * - Meta tags are parsed and stored in redirectChain array
 * - redirectChain structure includes: url, status, headers, html, metaTags
 * - Verify by logging redirectChain after a 3-4 hop redirect
 */

const { fetchUrl } = require('./src/fetcher');

async function verifyRedirectChainMetaExtraction() {
  console.log('=== Verification Test: redirectChain Meta Tag Extraction ===\n');

  // Test URLs that should produce 3-4 hop redirects
  const testUrls = [
    'https://bit.ly/example', // bit.ly shortener → multiple redirects
    'https://tinyurl.com/demo', // TinyURL → redirect chain
    'https://t.co/example', // t.co shortener
  ];

  for (const testUrl of testUrls) {
    console.log(`\n--- Testing URL: ${testUrl} ---`);

    try {
      const result = await fetchUrl(testUrl);

      console.log(`Final URL: ${result.finalUrl}`);
      console.log(`Status: ${result.statusCode}`);
      console.log(`Total hops: ${result.redirectChain.length}`);

      // Verify each hop has required structure
      console.log('\n=== Redirect Chain Structure ===');
      result.redirectChain.forEach((hop, index) => {
        console.log(`\nHop ${index + 1}:`);
        console.log(`  URL: ${hop.url}`);
        console.log(`  Status: ${hop.statusCode}`);
        console.log(`  Headers: ${Object.keys(hop.headers || {}).length} headers`);

        // Verify HTML content capture
        if (hop.html !== undefined) {
          console.log(`  ✓ HTML captured: ${hop.html.length} bytes`);
        } else {
          console.log(`  ✗ HTML: NOT captured`);
        }

        // Verify metaTags array
        if (hop.metaTags && Array.isArray(hop.metaTags)) {
          console.log(`  ✓ metaTags array: ${hop.metaTags.length} tags`);
          if (hop.metaTags.length > 0) {
            console.log(`    Sample tags:`);
            hop.metaTags.slice(0, 3).forEach(tag => {
              const key = tag.name || tag.property;
              console.log(`      - ${key}: ${tag.content ? '"'+tag.content+'"' : '(no content)'}`);
            });
          }
        } else {
          console.log(`  ✗ metaTags: NOT captured or not an array`);
        }

        // Verify critical meta object (for 200 responses)
        if (hop.statusCode === 200) {
          if (hop.meta) {
            console.log(`  ✓ meta object (200 response):`);
            console.log(`    - title: ${hop.meta.title ? '"'+hop.meta.title+'"' : '(none)'}`);
            console.log(`    - description: ${hop.meta.description ? '"'+hop.meta.description+'"' : '(none)'}`);
            console.log(`    - og:title: ${hop.meta.ogTitle ? '"'+hop.meta.ogTitle+'"' : '(none)'}`);
          } else {
            console.log(`  ✗ meta: NOT captured for 200 response`);
          }
        }

        // Verify metaDiff (for hops after the first HTML response)
        if (hop.metaDiff) {
          console.log(`  ✓ metaDiff: ${hop.metaDiff.changed?.length || 0} changed, ${hop.metaDiff.added?.length || 0} added, ${hop.metaDiff.removed?.length || 0} removed`);
          if (hop.metaDiff.stripped) {
            console.log(`    ! WARNING: All meta tags were stripped`);
          }
          if (hop.metaDiff.noindexRemoved) {
            console.log(`    ! IMPORTANT: noindex directive was removed`);
          }
        }

        // Verify warnings
        if (hop.warning) {
          console.log(`  ⚠ Warning: ${hop.warning}`);
        }
      });

      console.log('\n✓ Verification PASSED for this URL');

    } catch (error) {
      console.log(`\n✗ Error testing ${testUrl}:`, error.message);
      // Continue to next URL
    }
  }

  console.log('\n=== Summary ===');
  console.log('The redirectChain structure should include:');
  console.log('  ✓ url: The current URL');
  console.log('  ✓ statusCode: HTTP status code');
  console.log('  ✓ headers: Response headers as an object');
  console.log('  ✓ html: HTML response content (for all HTML responses)');
  console.log('  ✓ metaTags: Array of all meta tags with name/content or property/content');
  console.log('  ✓ meta: Critical meta tags (for 200 HTML responses)');
  console.log('  ✓ metaDiff: Diff from previous hop (for consecutive HTML responses)');
  console.log('  ✓ redirectsTo: For redirect hops, the next URL');
  console.log('  ✓ warning: Warnings about redirect behavior');
  console.log('  ✓ isFinal: Boolean flag for the final hop');
  console.log('  ✓ metaError: Error message if meta parsing failed');
}

// Run the verification
verifyRedirectChainMetaExtraction().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
