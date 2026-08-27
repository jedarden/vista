'use strict';

/**
 * Tests for page type detection heuristics
 */

const assert = require('assert');
const {
  detectPageType,
  detectPageTypeDetailed,
  detectFromOgType,
  detectFromJsonLd,
  detectFromUrl,
  detectFromContent,
} = require('../page-type-detector');

// Test data fixtures
const testCases = [
  // og:type tests
  {
    name: 'og:type: article',
    meta: { og: { type: 'article' } },
    url: 'https://example.com/article',
    expected: 'article',
  },
  {
    name: 'og:type: blog',
    meta: { og: { type: 'blog' } },
    url: 'https://example.com',
    expected: 'blog',
  },
  {
    name: 'og:type: product',
    meta: { og: { type: 'product' } },
    url: 'https://shop.example.com',
    expected: 'product',
  },
  {
    name: 'og:type: recipe',
    meta: { og: { type: 'recipe' } },
    url: 'https://food.example.com',
    expected: 'recipe',
  },
  {
    name: 'og:type: website',
    meta: { og: { type: 'website' } },
    url: 'https://example.com',
    expected: 'website',
  },

  // JSON-LD tests
  {
    name: 'JSON-LD: BlogPosting',
    meta: {
      jsonLd: [{ '@type': 'BlogPosting' }],
    },
    url: 'https://example.com',
    expected: 'blog',
  },
  {
    name: 'JSON-LD: Recipe',
    meta: {
      jsonLd: [{ '@type': 'Recipe' }],
    },
    url: 'https://example.com/recipe',
    expected: 'recipe',
  },
  {
    name: 'JSON-LD: SoftwareApplication',
    meta: {
      jsonLd: [{ '@type': 'SoftwareApplication' }],
    },
    url: 'https://app.example.com',
    expected: 'saas',
  },
  {
    name: 'JSON-LD: Product',
    meta: {
      jsonLd: [{ '@type': 'Product' }],
    },
    url: 'https://shop.example.com',
    expected: 'product',
  },
  {
    name: 'JSON-LD: array of types',
    meta: {
      jsonLd: [{ '@type': ['NewsArticle', 'Report'] }],
    },
    url: 'https://news.example.com',
    expected: 'article',
  },
  {
    name: 'JSON-LD: multiple objects',
    meta: {
      jsonLd: [
        { '@type': 'Organization' },
        { '@type': 'WebSite' },
      ],
    },
    url: 'https://example.com',
    expected: 'business',
  },

  // URL pattern tests
  {
    name: 'URL: GitHub',
    meta: {},
    url: 'https://github.com/user/repo',
    expected: 'opensource',
  },
  {
    name: 'URL: GitLab',
    meta: {},
    url: 'https://gitlab.com/user/project',
    expected: 'opensource',
  },
  {
    name: 'URL: Medium',
    meta: {},
    url: 'https://medium.com/@user/post',
    expected: 'blog',
  },
  {
    name: 'URL: Dev.to',
    meta: {},
    url: 'https://dev.to/user/post',
    expected: 'blog',
  },
  {
    name: 'URL: Vercel app',
    meta: {},
    url: 'https://myapp.vercel.app',
    expected: 'portfolio',
  },
  {
    name: 'URL: docs subdomain',
    meta: {},
    url: 'https://docs.example.com',
    expected: 'saas',
  },
  {
    name: 'URL: docs path',
    meta: {},
    url: 'https://example.com/docs/getting-started',
    expected: 'saas',
  },
  {
    name: 'URL: shop',
    meta: {},
    url: 'https://shop.example.com/products',
    expected: 'ecommerce',
  },
  {
    name: 'URL: AllRecipes',
    meta: {},
    url: 'https://www.allrecipes.com/recipe/chicken',
    expected: 'recipe',
  },
  {
    name: 'URL: blog path',
    meta: {},
    url: 'https://example.com/blog/my-post',
    expected: 'blog',
  },

  // Content keyword tests
  {
    name: 'Keywords: blog in title',
    meta: {
      title: 'My Blog Post About Tech',
      description: 'A tutorial on web development',
    },
    url: 'https://example.com/article',
    expected: 'blog',
  },
  {
    name: 'Keywords: SaaS terms',
    meta: {
      title: 'Cloud Analytics Platform',
      description: 'Powerful API dashboard for your business with subscription plans',
    },
    url: 'https://example.com',
    expected: 'saas',
  },
  {
    name: 'Keywords: e-commerce',
    meta: {
      title: 'Shop Now - Best Deals',
      description: 'Buy products online with free shipping',
    },
    url: 'https://example.com',
    expected: 'ecommerce',
  },
  {
    name: 'Keywords: recipe',
    meta: {
      title: 'Chocolate Cake Recipe',
      description: 'Easy baking instructions with simple ingredients',
    },
    url: 'https://example.com/recipe',
    expected: 'recipe',
  },
  {
    name: 'Keywords: open source',
    meta: {
      title: 'Introduction to Open Source Development',
      description: 'Learn how to contribute to GitHub repositories',
    },
    url: 'https://example.com',
    expected: 'opensource',
  },
  {
    name: 'Keywords: portfolio',
    meta: {
      title: 'My Portfolio - Web Developer',
      description: 'Showcase of my projects and case studies',
    },
    url: 'https://example.com',
    expected: 'portfolio',
  },

  // Priority tests - og:type should override others
  {
    name: 'Priority: og:type overrides JSON-LD',
    meta: {
      og: { type: 'article' },
      jsonLd: [{ '@type': 'Product' }],
    },
    url: 'https://shop.example.com',
    expected: 'article', // og:type wins
  },
  {
    name: 'Priority: og:type overrides URL pattern',
    meta: {
      og: { type: 'website' },
    },
    url: 'https://github.com/user/repo',
    expected: 'website', // og:type wins over opensource URL
  },
  {
    name: 'Priority: JSON-LD overrides URL pattern',
    meta: {
      jsonLd: [{ '@type': 'Recipe' }],
    },
    url: 'https://github.com/user/repo',
    expected: 'recipe', // JSON-LD wins over URL
  },
  {
    name: 'Priority: URL pattern overrides keywords',
    meta: {
      title: 'Best Chocolate Cake Recipe',
      description: 'Learn how to bake',
    },
    url: 'https://github.com/user/repo',
    expected: 'opensource', // URL wins over keywords
  },

  // Edge cases
  {
    name: 'Edge: empty meta',
    meta: {},
    url: 'https://example.com',
    expected: 'website', // default fallback
  },
  {
    name: 'Edge: unknown og:type',
    meta: {
      og: { type: 'custom.type' },
    },
    url: 'https://example.com',
    expected: 'website', // falls through to default
  },
  {
    name: 'Edge: malformed JSON-LD',
    meta: {
      jsonLd: [{ invalid: 'object' }],
    },
    url: 'https://example.com',
    expected: 'website', // falls through
  },
  {
    name: 'Edge: null meta fields',
    meta: {
      og: { type: null },
      jsonLd: null,
      title: null,
      description: null,
    },
    url: 'https://example.com',
    expected: 'website',
  },
];

function runTests() {
  console.log('Running page type detection tests...\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = detectPageType(testCase.meta, testCase.url);
      assert.strictEqual(
        result,
        testCase.expected,
        `Expected "${testCase.expected}" but got "${result}"`
      );
      console.log(`✓ ${testCase.name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${testCase.name}`);
      console.error(`  ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test detailed detection
function testDetailedDetection() {
  console.log('\n--- Testing detailed detection ---\n');

  const testCases = [
    {
      name: 'Detailed: og:type detection',
      meta: { og: { type: 'article' } },
      url: 'https://example.com',
      expectedPath: ['og:type'],
    },
    {
      name: 'Detailed: JSON-LD detection',
      meta: { jsonLd: [{ '@type': 'Recipe' }] },
      url: 'https://example.com',
      expectedPath: ['json-ld'],
    },
    {
      name: 'Detailed: URL pattern detection',
      meta: {},
      url: 'https://github.com/user/repo',
      expectedPath: ['url-pattern'],
    },
    {
      name: 'Detailed: content keyword detection',
      meta: {
        title: 'My Blog Post',
        description: 'A tutorial about web development',
      },
      url: 'https://example.com',
      expectedPath: ['content-keywords'],
    },
    {
      name: 'Detailed: default fallback',
      meta: {},
      url: 'https://example.com',
      expectedPath: ['default-fallback'],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = detectPageTypeDetailed(testCase.meta, testCase.url);
      assert.strictEqual(
        result.detectionPath[0],
        testCase.expectedPath[0],
        `Expected detection path "${testCase.expectedPath[0]}" but got "${result.detectionPath[0]}"`
      );
      console.log(`✓ ${testCase.name}`);
      console.log(`  Detected type: ${result.detectedType}`);
      console.log(`  Detection path: ${result.detectionPath.join(' → ')}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${testCase.name}`);
      console.error(`  ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test individual detection functions
function testIndividualFunctions() {
  console.log('\n--- Testing individual detection functions ---\n');

  let passed = 0;
  let failed = 0;

  // Test detectFromOgType
  try {
    assert.strictEqual(detectFromOgType({ og: { type: 'article' } }), 'article');
    assert.strictEqual(detectFromOgType({ og: { type: 'blog' } }), 'blog');
    assert.strictEqual(detectFromOgType({ og: { type: 'unknown' } }), null);
    assert.strictEqual(detectFromOgType({}), null);
    console.log('✓ detectFromOgType');
    passed++;
  } catch (err) {
    console.error(`✗ detectFromOgType: ${err.message}`);
    failed++;
  }

  // Test detectFromJsonLd
  try {
    assert.strictEqual(
      detectFromJsonLd({ jsonLd: [{ '@type': 'BlogPosting' }] }),
      'blog'
    );
    assert.strictEqual(
      detectFromJsonLd({ jsonLd: [{ '@type': 'Recipe' }] }),
      'recipe'
    );
    assert.strictEqual(detectFromJsonLd({ jsonLd: [] }), null);
    assert.strictEqual(detectFromJsonLd({}), null);
    console.log('✓ detectFromJsonLd');
    passed++;
  } catch (err) {
    console.error(`✗ detectFromJsonLd: ${err.message}`);
    failed++;
  }

  // Test detectFromUrl
  try {
    assert.strictEqual(
      detectFromUrl('https://github.com/user/repo'),
      'opensource'
    );
    assert.strictEqual(detectFromUrl('https://medium.com/@user/post'), 'blog');
    assert.strictEqual(detectFromUrl('https://example.com'), null); // no pattern match
    assert.strictEqual(detectFromUrl(''), null);
    assert.strictEqual(detectFromUrl(null), null);
    console.log('✓ detectFromUrl');
    passed++;
  } catch (err) {
    console.error(`✗ detectFromUrl: ${err.message}`);
    failed++;
  }

  // Test detectFromContent
  try {
    assert.strictEqual(
      detectFromContent({
        title: 'My Blog Post',
        description: 'A tutorial',
      }),
      'blog'
    );
    assert.strictEqual(
      detectFromContent({
        title: 'Cloud Platform',
        description: 'Software service',
      }),
      'saas'
    );
    assert.strictEqual(detectFromContent({}), null);
    console.log('✓ detectFromContent');
    passed++;
  } catch (err) {
    console.error(`✗ detectFromContent: ${err.message}`);
    failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run all tests
function main() {
  const basicTestsPassed = runTests();
  const detailedTestsPassed = testDetailedDetection();
  const individualTestsPassed = testIndividualFunctions();

  console.log('\n=== Overall Results ===');
  if (basicTestsPassed && detailedTestsPassed && individualTestsPassed) {
    console.log('✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  main();
}

module.exports = { runTests, testDetailedDetection, testIndividualFunctions };
