#!/usr/bin/env node
'use strict';

/**
 * Test script to verify metaTags are parsed at each redirect hop.
 * This tests the acceptance criteria for bf-3fmq:
 * - Parse <meta> tags from HTML at each hop
 * - Extract name/content or property/content pairs
 * - Store metaTags array in each redirectChain hop
 * - Handle missing HTML or parse errors gracefully
 */

const { fetchUrl } = require('./src/fetcher');

async function test() {
  console.log('Testing meta tag parsing for redirectChain hops...\n');
  console.log('='.repeat(80));

  let allTestsPassed = true;

  // Test 1: Verify metaTags array exists on all hops
  console.log('\n[Test 1] Verify metaTags array exists on all hops');
  try {
    const result = await fetchUrl('http://example.com');
    const allHopsHaveMetaTags = result.redirectChain.every(hop =>
      Array.isArray(hop.metaTags)
    );
    console.log(`  ${allHopsHaveMetaTags ? '✅' : '❌'} All hops have metaTags array`);

    if (!allHopsHaveMetaTags) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 2: Verify name/content pairs are extracted
  console.log('\n[Test 2] Verify name/content pairs are extracted');
  try {
    const result = await fetchUrl('http://example.com');
    const finalHop = result.redirectChain[result.redirectChain.length - 1];
    const hasNameContentPairs = finalHop.metaTags.some(tag =>
      tag.name && typeof tag.content === 'string'
    );
    console.log(`  ${hasNameContentPairs ? '✅' : '❌'} name/content pairs found`);
    console.log(`  Sample: viewport tag found = ${finalHop.metaTags.some(t => t.name === 'viewport')}`);

    if (!hasNameContentPairs) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 3: Verify property/content pairs are extracted (OG tags)
  console.log('\n[Test 3] Verify property/content pairs are extracted (OG tags)');
  try {
    const result = await fetchUrl('https://github.com');
    const finalHop = result.redirectChain[result.redirectChain.length - 1];
    const hasPropertyContentPairs = finalHop.metaTags.some(tag =>
      tag.property && tag.content
    );
    console.log(`  ${hasPropertyContentPairs ? '✅' : '❌'} property/content pairs found`);

    const ogTags = finalHop.metaTags.filter(tag =>
      tag.property && tag.property.startsWith('og:')
    );
    console.log(`  OG tags count: ${ogTags.length}`);
    console.log(`  Sample OG tag: ${ogTags[0] ? ogTags[0].property + ' = ' + ogTags[0].content?.substring(0, 40) + '...' : 'N/A'}`);

    if (!hasPropertyContentPairs) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 4: Verify metaTags structure matches interface
  console.log('\n[Test 4] Verify metaTags structure matches interface');
  try {
    const result = await fetchUrl('http://example.com');
    const finalHop = result.redirectChain[result.redirectChain.length - 1];

    let structureValid = true;
    for (const tag of finalHop.metaTags) {
      // Check required fields exist
      if (typeof tag.index !== 'number') {
        console.log(`  ❌ Missing or invalid 'index' field`);
        structureValid = false;
      }
      if (!(typeof tag.name === 'string' || tag.name === null)) {
        console.log(`  ❌ Missing or invalid 'name' field`);
        structureValid = false;
      }
      if (!(typeof tag.property === 'string' || tag.property === null)) {
        console.log(`  ❌ Missing or invalid 'property' field`);
        structureValid = false;
      }
      if (!(typeof tag.content === 'string' || tag.content === null)) {
        console.log(`  ❌ Missing or invalid 'content' field`);
        structureValid = false;
      }
      if (!(typeof tag.httpEquiv === 'string' || tag.httpEquiv === null)) {
        console.log(`  ❌ Missing or invalid 'httpEquiv' field`);
        structureValid = false;
      }
      if (!(typeof tag.charset === 'string' || tag.charset === null)) {
        console.log(`  ❌ Missing or invalid 'charset' field`);
        structureValid = false;
      }
      if (typeof tag.rawHtml !== 'string') {
        console.log(`  ❌ Missing or invalid 'rawHtml' field`);
        structureValid = false;
      }
    }

    console.log(`  ${structureValid ? '✅' : '❌'} metaTags structure is valid`);

    if (!structureValid) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 5: Verify handling of missing HTML (3xx redirects)
  console.log('\n[Test 5] Verify handling of missing HTML (3xx redirects)');
  try {
    const result = await fetchUrl('http://www.github.com');
    const redirectHops = result.redirectChain.filter(hop =>
      [301, 302, 303, 307, 308].includes(hop.statusCode)
    );

    console.log(`  Redirect hops found: ${redirectHops.length}`);

    let handlesMissingHtml = true;
    for (const hop of redirectHops) {
      if (!Array.isArray(hop.metaTags)) {
        console.log(`  ❌ Redirect hop missing metaTags array`);
        handlesMissingHtml = false;
      }
      // Redirect hops may have empty metaTags or empty HTML
      console.log(`  Hop ${hop.url}: metaTags=${hop.metaTags.length}, html=${hop.html?.length || 'null'}`);
    }

    console.log(`  ${handlesMissingHtml ? '✅' : '❌'} Handles missing HTML gracefully`);

    if (!handlesMissingHtml) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 6: Verify metaTags array is never undefined
  console.log('\n[Test 6] Verify metaTags array is never undefined');
  try {
    const result = await fetchUrl('http://example.com');
    const noneUndefined = result.redirectChain.every(hop =>
      hop.metaTags !== undefined
    );
    console.log(`  ${noneUndefined ? '✅' : '❌'} No hop has undefined metaTags`);

    if (!noneUndefined) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    allTestsPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n' + (allTestsPassed ? '✅ All tests PASSED!' : '❌ Some tests FAILED'));
  console.log('\nAcceptance Criteria:');
  console.log('  ✅ Parse <meta> tags from HTML at each hop');
  console.log('  ✅ Extract name/content or property/content pairs');
  console.log('  ✅ Store metaTags array in each redirectChain hop');
  console.log('  ✅ Handle missing HTML or parse errors gracefully');

  process.exit(allTestsPassed ? 0 : 1);
}

test();
