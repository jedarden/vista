#!/usr/bin/env node
'use strict';

/**
 * Test script to verify HTML is captured at each redirect hop.
 * This test uses known redirect URLs and logs the redirectChain to verify
 * that the 'html' field exists for each hop.
 */

const { fetchUrl } = require('./src/fetcher');

async function test() {
  console.log('Testing HTML capture at redirect hops...\n');

  // Test with URLs that have known redirects
  const testUrls = [
    'http://www.github.com', // github.com redirects to github.com
    'http://example.com', // Single 200 response (no redirect)
  ];

  for (const testUrl of testUrls) {
    console.log(`\nTesting URL: ${testUrl}`);
    console.log('='.repeat(80));

    try {
      const result = await fetchUrl(testUrl);

      console.log('Final URL:', result.finalUrl);
      console.log('Status:', result.statusCode);
      console.log('\nRedirect Chain:');

      result.redirectChain.forEach((hop, index) => {
        console.log(`\nHop ${index + 1}:`);
        console.log(`  URL: ${hop.url}`);
        console.log(`  Status: ${hop.statusCode}`);
        console.log(`  Has HTML field: ${hop.hasOwnProperty('html')}`);
        console.log(`  HTML length: ${hop.html ? hop.html.length : 'N/A'} bytes`);

        if (hop.html && hop.html.length > 0) {
          console.log(`  HTML preview (first 100 chars): ${hop.html.substring(0, 100)}...`);
        }

        if (hop.redirectsTo) {
          console.log(`  Redirects to: ${hop.redirectsTo}`);
        }

        if (hop.isFinal) {
          console.log('  (Final hop)');
        }

        if (hop.meta) {
          console.log(`  Meta title: ${hop.meta.title || 'N/A'}`);
        }

        if (hop.warning) {
          console.log(`  Warning: ${hop.warning}`);
        }
      });

      console.log('\n' + '='.repeat(80));

      // Verify all hops have HTML field
      const allHopsHaveHtml = result.redirectChain.every(hop => hop.hasOwnProperty('html'));
      console.log(`All hops have 'html' field: ${allHopsHaveHtml}`);

      // Count hops with actual HTML content
      const hopsWithHtmlContent = result.redirectChain.filter(hop => hop.html && hop.html.length > 0);
      console.log(`Hops with HTML content: ${hopsWithHtmlContent.length}/${result.redirectChain.length}`);

    } catch (error) {
      console.error('Error during test:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verification complete!');
}

test();
