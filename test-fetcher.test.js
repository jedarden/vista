'use strict';

const { parseMetaTags } = require('./src/fetcher');

/**
 * Unit test for parseMetaTags() rawTags functionality
 *
 * Tests that parseMetaTags() returns both:
 * - tags: structured metadata for DOM use
 * - rawTags: raw HTML strings for comparison
 */

function testParseMetaTagsRawTags() {
  console.log('Testing parseMetaTags() rawTags functionality...\n');

  // Test HTML with various meta tags
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="This is a test description">
      <meta name="theme-color" content="#ffffff">
      <meta property="og:title" content="Test OG Title">
      <meta property="og:description" content="Test OG Description">
      <meta property="og:image" content="https://example.com/image.jpg">
      <meta property="og:type" content="website">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Test Twitter Title">
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body>
      <h1>Test Content</h1>
    </body>
    </html>
  `;

  const baseUrl = 'https://example.com/test-page';
  const result = parseMetaTags(testHtml, baseUrl);

  // Verify the function returns the expected structure
  console.log('✓ Function returns expected structure');
  console.log('  - title:', result.title);
  console.log('  - description:', result.description);
  console.log('  - rawTags.length:', result.rawTags.length);

  // Verify rawTags array exists
  if (!Array.isArray(result.rawTags)) {
    console.error('✗ FAILED: rawTags is not an array');
    process.exit(1);
  }
  console.log('✓ rawTags is an array');

  // Verify rawTags is populated (not empty)
  if (result.rawTags.length === 0) {
    console.error('✗ FAILED: rawTags array is empty');
    process.exit(1);
  }
  console.log('✓ rawTags array is populated (', result.rawTags.length, 'tags)');

  // Verify each tag has rawHtml field
  const tagsWithoutRawHtml = result.rawTags.filter(tag => !tag.rawHtml);
  if (tagsWithoutRawHtml.length > 0) {
    console.error('✗ FAILED: Some tags missing rawHtml field:', tagsWithoutRawHtml);
    process.exit(1);
  }
  console.log('✓ All tags have rawHtml field');

  // Verify rawHtml is a string and contains expected meta tag structure
  const sampleTag = result.rawTags[0];
  if (typeof sampleTag.rawHtml !== 'string') {
    console.error('✗ FAILED: rawHtml is not a string for tag:', sampleTag);
    process.exit(1);
  }
  console.log('✓ rawHtml is a string');
  console.log('  Sample tag rawHtml:', sampleTag.rawHtml);

  // Verify rawHtml contains '<meta'
  if (!sampleTag.rawHtml.includes('<meta')) {
    console.error('✗ FAILED: rawHtml does not contain "<meta"');
    process.exit(1);
  }
  console.log('✓ rawHtml contains "<meta" tag markup');

  // Verify we can find specific tags by rawHtml
  const descriptionTag = result.rawTags.find(tag =>
    tag.rawHtml.includes('name="description"')
  );
  if (!descriptionTag) {
    console.error('✗ FAILED: Could not find description tag in rawTags');
    process.exit(1);
  }
  console.log('✓ Can find specific tags by searching rawHtml');
  console.log('  Description tag rawHtml:', descriptionTag.rawHtml);

  // Verify rawHtml contains the content attribute
  if (!descriptionTag.rawHtml.includes('This is a test description')) {
    console.error('✗ FAILED: rawHtml does not contain expected content');
    process.exit(1);
  }
  console.log('✓ rawHtml contains expected content attribute');

  // Verify backward compatibility - check all expected fields exist
  const expectedFields = ['title', 'description', 'og', 'twitter', 'jsonLd', 'favicon', 'themeColor', 'robots', 'rawTags'];
  const missingFields = expectedFields.filter(field => !(field in result));
  if (missingFields.length > 0) {
    console.error('✗ FAILED: Missing backward compatibility fields:', missingFields);
    process.exit(1);
  }
  console.log('✓ All expected fields present (backward compatibility maintained)');

  // Print some examples
  console.log('\n--- Sample rawTags ---');
  result.rawTags.slice(0, 3).forEach((tag, i) => {
    console.log(`[${i}] rawHtml: ${tag.rawHtml}`);
  });

  console.log('\n✅ All tests passed!\n');
}

// Run the test
testParseMetaTagsRawTags();
