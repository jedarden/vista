/**
 * Verification script for no-meta-tags detection feature
 * Tests the detection logic with various scenarios
 */

// Test data simulating different page states
const testCases = [
  {
    name: 'No meta tags at all',
    meta: {
      title: null,
      description: null,
      og: { title: null, description: null, image: null },
      twitter: { title: null, description: null, image: null, card: null }
    },
    expected: true // Should show suggestion
  },
  {
    name: 'Has title but no OG/Twitter tags',
    meta: {
      title: 'My Page',
      description: null,
      og: { title: null, description: null, image: null },
      twitter: { title: null, description: null, image: null, card: null }
    },
    expected: true // Should show suggestion
  },
  {
    name: 'Has OG title only',
    meta: {
      title: 'My Page',
      description: null,
      og: { title: 'OG Title', description: null, image: null },
      twitter: { title: null, description: null, image: null, card: null }
    },
    expected: false // Should NOT show suggestion
  },
  {
    name: 'Has Twitter card only',
    meta: {
      title: 'My Page',
      description: null,
      og: { title: null, description: null, image: null },
      twitter: { title: null, description: null, image: null, card: 'summary' }
    },
    expected: false // Should NOT show suggestion
  },
  {
    name: 'Has both OG and Twitter tags',
    meta: {
      title: 'My Page',
      description: 'A description',
      og: { title: 'OG Title', description: 'OG Description', image: 'https://example.com/image.jpg' },
      twitter: { title: 'Twitter Title', description: 'Twitter Description', image: 'https://example.com/image.jpg', card: 'summary_large_image' }
    },
    expected: false // Should NOT show suggestion
  }
];

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

console.log('Testing no-meta-tags detection logic...\n');

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, i) => {
  const result = checkForNoMetaTags({ meta: testCase.meta });
  const passed = result === testCase.expected;
  const status = passed ? '✅ PASS' : '❌ FAIL';

  if (passed) {
    passCount++;
  } else {
    failCount++;
  }

  console.log(`${status} - Test ${i + 1}: ${testCase.name}`);
  console.log(`  Expected: ${testCase.expected ? 'Show suggestion' : 'No suggestion'}`);
  console.log(`  Got: ${result ? 'Show suggestion' : 'No suggestion'}`);
  console.log(`  hasOgTags: ${!!(testCase.meta.og && (testCase.meta.og.title || testCase.meta.og.description || testCase.meta.og.image))}`);
  console.log(`  hasTwitterTags: ${!!(testCase.meta.twitter && (testCase.meta.twitter.title || testCase.meta.twitter.description || testCase.meta.twitter.image || testCase.meta.twitter.card))}`);
  console.log();
});

console.log(`\nResults: ${passCount} passed, ${failCount} failed out of ${testCases.length} tests`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
}
