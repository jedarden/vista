/**
 * Test script for no-meta-tags detection
 * This verifies the checkForNoMetaTags function works correctly
 */

// Mock the function logic (extracted from app.js)
function checkForNoMetaTags(metaData) {
  if (!metaData || !metaData.meta) return false;

  const meta = metaData.meta;
  const hasOgTags = !!(meta.og &&
    (meta.og.title || meta.og.description || meta.og.image));
  const hasTwitterTags = !!(meta.twitter &&
    (meta.twitter.title || meta.twitter.description || meta.twitter.image || meta.twitter.card));

  // Only show suggestion if page has no OG or Twitter Card tags
  return !hasOgTags && !hasTwitterTags;
}

// Test cases
const tests = [
  {
    name: 'No meta tags at all',
    data: { meta: {} },
    expected: true
  },
  {
    name: 'OG tags present',
    data: { meta: { og: { title: 'Test' } } },
    expected: false
  },
  {
    name: 'Twitter tags present',
    data: { meta: { twitter: { card: 'summary' } } },
    expected: false
  },
  {
    name: 'Both OG and Twitter present',
    data: { meta: { og: { title: 'Test' }, twitter: { card: 'summary' } } },
    expected: false
  },
  {
    name: 'OG object exists but all fields empty',
    data: { meta: { og: { title: '', description: '', image: '' } } },
    expected: true
  },
  {
    name: 'Twitter object exists but all fields empty',
    data: { meta: { twitter: { title: '', description: '', image: '', card: '' } } },
    expected: true
  },
  {
    name: 'OG has empty object, Twitter has empty object',
    data: { meta: { og: {}, twitter: {} } },
    expected: true
  },
  {
    name: 'OG has one truthy field',
    data: { meta: { og: { title: 'My Title' } } },
    expected: false
  },
  {
    name: 'Twitter has one truthy field',
    data: { meta: { twitter: { card: 'summary_large_image' } } },
    expected: false
  },
  {
    name: 'No OG, Twitter has all empty strings',
    data: { meta: { og: null, twitter: { title: '', description: '', image: '', card: '' } } },
    expected: true
  },
  {
    name: 'Missing metaData.meta',
    data: { },
    expected: false
  },
  {
    name: 'null metaData',
    data: null,
    expected: false
  }
];

// Run tests
console.log('Running checkForNoMetaTags tests...\n');
let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = checkForNoMetaTags(test.data);
  const status = result === test.expected ? '✓ PASS' : '✗ FAIL';

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
    console.error(`${status}: ${test.name}`);
    console.error(`  Expected: ${test.expected}, Got: ${result}`);
    console.error(`  Data:`, JSON.stringify(test.data, null, 2));
  }
});

console.log(`\n${passed}/${tests.length} tests passed`);
if (failed > 0) {
  console.error(`${failed} tests failed!`);
  process.exit(1);
} else {
  console.log('All tests passed!');
}
