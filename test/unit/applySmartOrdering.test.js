#!/usr/bin/env node
/**
 * Comprehensive Unit Tests for applySmartOrdering()
 *
 * Tests the core reordering logic without browser dependencies.
 * Covers all acceptance criteria:
 * - Main reordering logic
 * - Cards sorted by preference score in descending order
 * - Empty arrays and single-item arrays
 * - Different platform preference configurations
 */

// Mock dependencies - extracted from app.js
const PLATFORM_GROUPS = [
  {
    id: 'social',
    title: 'Social & Microblogging',
    collapsed: false,
    platforms: ['google', 'facebook', 'twitter', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads', 'tumblr', 'pinterest'],
  },
  {
    id: 'messaging',
    title: 'Messaging',
    collapsed: true,
    platforms: ['slack', 'discord', 'whatsapp', 'imessage', 'telegram', 'signal', 'teams', 'googlechat', 'zoom', 'line', 'kakaotalk'],
  },
  {
    id: 'collab',
    title: 'Collaboration & Productivity',
    collapsed: true,
    platforms: ['notion', 'jira', 'github', 'trello', 'figma'],
  },
  {
    id: 'content',
    title: 'Content, Email & RSS',
    collapsed: true,
    platforms: ['medium', 'substack', 'outlook', 'gmail', 'feedly'],
  },
];

// Extracted detectPageType function
function detectPageType(meta) {
  if (!meta) return 'website';

  // Check og:type first
  const ogType = meta.og?.type?.toLowerCase();
  if (ogType) {
    if (ogType.includes('article')) return 'article';
    if (ogType.includes('product')) return 'product';
    if (ogType.includes('video')) return 'video';
    if (ogType.includes('profile')) return 'profile';
  }

  // Check schema.org
  if (meta.schema) {
    const schema = JSON.stringify(meta.schema).toLowerCase();
    if (schema.includes('article') || schema.includes('blogposting')) return 'article';
    if (schema.includes('product')) return 'product';
    if (schema.includes('video')) return 'video';
  }

  // Check URL patterns
  const url = (meta.og?.url || meta.canonical || '').toLowerCase();
  if (url.includes('/blog/') || url.includes('/article/') || url.includes('/post/')) return 'article';
  if (url.includes('/product/') || url.includes('/shop/') || url.includes('/item/')) return 'product';

  return 'website';
}

// Extracted getPlatformOrderForPageType function
function getPlatformOrderForPageType(pageType) {
  const orders = {
    article: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon'],
    product: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin'],
    video: ['twitter', 'facebook', 'youtube', 'tiktok', 'instagram'],
    website: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']
  };

  return orders[pageType] || orders.website;
}

// Core reordering logic extracted from applySmartOrdering
function applyPlatformReordering(groups, pageType) {
  const preferredOrder = getPlatformOrderForPageType(pageType);

  // Deep clone to avoid mutation
  const reorderedGroups = groups.map(group => ({
    ...group,
    platforms: [...group.platforms]
  }));

  // Reorder each group based on preferred order
  reorderedGroups.forEach((group) => {
    group.platforms.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);

      // Both not in preferred order - maintain original order
      if (aIndex === -1 && bIndex === -1) return 0;

      // a not in preferred order - push to end
      if (aIndex === -1) return 1;

      // b not in preferred order - push to end
      if (bIndex === -1) return -1;

      // Both in preferred order - sort by their position
      return aIndex - bIndex;
    });
  });

  return reorderedGroups;
}

// Test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('Running Comprehensive Unit Tests for applySmartOrdering');
    console.log('='.repeat(70) + '\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✓ ${name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log('='.repeat(70) + '\n');

    return this.failed === 0 ? 0 : 1;
  }

  assertEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Expected "${expectedStr}" but got "${actualStr}"`
      );
    }
  }

  assertTrue(value, message = '') {
    if (!value) {
      throw new Error(message || `Expected truthy value but got ${value}`);
    }
  }

  assertFalse(value, message = '') {
    if (value) {
      throw new Error(message || `Expected falsy value but got ${value}`);
    }
  }

  assertDeepEquals(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
      );
    }
  }
}

// Create test runner
const runner = new TestRunner();

// Test 1: Article page type reordering
runner.test('Article page type prioritizes Twitter, Facebook, LinkedIn', () => {
  const result = applyPlatformReordering(PLATFORM_GROUPS, 'article');

  const socialGroup = result.find(g => g.id === 'social');
  runner.assertTrue(socialGroup.platforms[0] === 'twitter', 'Twitter should be first');
  runner.assertTrue(socialGroup.platforms[1] === 'facebook', 'Facebook should be second');
  runner.assertTrue(socialGroup.platforms[2] === 'linkedin', 'LinkedIn should be third');
  runner.assertTrue(socialGroup.platforms[3] === 'reddit', 'Reddit should be fourth');
});

// Test 2: Product page type reordering
runner.test('Product page type prioritizes Pinterest, Facebook, Instagram', () => {
  const result = applyPlatformReordering(PLATFORM_GROUPS, 'product');

  const socialGroup = result.find(g => g.id === 'social');
  runner.assertTrue(socialGroup.platforms[0] === 'pinterest', 'Pinterest should be first for products');
  runner.assertTrue(socialGroup.platforms[1] === 'facebook', 'Facebook should be second');
  // Note: instagram not in social group, so skip to next in order
  runner.assertTrue(socialGroup.platforms[2] === 'twitter', 'Twitter should be third');
});

// Test 3: Video page type reordering
runner.test('Video page type prioritizes Twitter, Facebook, YouTube', () => {
  const result = applyPlatformReordering(PLATFORM_GROUPS, 'video');

  const socialGroup = result.find(g => g.id === 'social');
  runner.assertTrue(socialGroup.platforms[0] === 'twitter', 'Twitter should be first for video');
  runner.assertTrue(socialGroup.platforms[1] === 'facebook', 'Facebook should be second');
  // Note: youtube not in social group
  runner.assertTrue(socialGroup.platforms.includes('twitter'), 'Twitter should be in results');
});

// Test 4: Website page type reordering
runner.test('Website page type prioritizes Google, Facebook, Twitter', () => {
  const result = applyPlatformReordering(PLATFORM_GROUPS, 'website');

  const socialGroup = result.find(g => g.id === 'social');
  runner.assertTrue(socialGroup.platforms[0] === 'google', 'Google should be first for websites');
  runner.assertTrue(socialGroup.platforms[1] === 'facebook', 'Facebook should be second');
  runner.assertTrue(socialGroup.platforms[2] === 'twitter', 'Twitter should be third');
});

// Test 5: Empty platforms array
runner.test('Handles empty platforms array', () => {
  const emptyGroup = [{
    id: 'empty',
    title: 'Empty Group',
    platforms: []
  }];

  const result = applyPlatformReordering(emptyGroup, 'article');
  runner.assertEqual(result[0].platforms.length, 0, 'Empty array should remain empty');
});

// Test 6: Single platform
runner.test('Handles single platform array', () => {
  const singleGroup = [{
    id: 'single',
    title: 'Single Group',
    platforms: ['twitter']
  }];

  const result = applyPlatformReordering(singleGroup, 'article');
  runner.assertEqual(result[0].platforms.length, 1, 'Single platform should remain');
  runner.assertEqual(result[0].platforms[0], 'twitter', 'Twitter should be the only platform');
});

// Test 7: Platforms not in preferred order
runner.test('Platforms not in preferred order are pushed to end', () => {
  const customGroup = [{
    id: 'custom',
    title: 'Custom Group',
    platforms: ['notion', 'jira', 'twitter', 'figma']
  }];

  const result = applyPlatformReordering(customGroup, 'article');

  // Twitter should be first (in preferred order)
  runner.assertEqual(result[0].platforms[0], 'twitter', 'Preferred platform should be first');

  // Non-preferred platforms should be at the end, in their original order
  const nonPreferred = result[0].platforms.slice(1);
  runner.assertEqual(nonPreferred, ['notion', 'jira', 'figma'], 'Non-preferred platforms should maintain original order');
});

// Test 8: All platforms in preferred order
runner.test('All platforms in preferred order are sorted correctly', () => {
  const articleGroup = [{
    id: 'article',
    title: 'Article Platforms',
    platforms: ['mastodon', 'twitter', 'linkedin', 'facebook', 'reddit']
  }];

  const result = applyPlatformReordering(articleGroup, 'article');

  // Should be sorted by preferred order: twitter, facebook, linkedin, reddit, mastodon
  runner.assertEqual(result[0].platforms, ['twitter', 'facebook', 'linkedin', 'reddit', 'mastodon'], 'Platforms should match preferred order');
});

// Test 9: No mutation of original data
runner.test('Original data is not mutated', () => {
  const originalPlatforms = [...PLATFORM_GROUPS[0].platforms];

  applyPlatformReordering(PLATFORM_GROUPS, 'article');

  runner.assertEqual(PLATFORM_GROUPS[0].platforms, originalPlatforms, 'Original platforms array should not be mutated');
});

// Test 10: Multiple groups reordered independently
runner.test('Multiple groups are reordered independently', () => {
  const result = applyPlatformReordering(PLATFORM_GROUPS, 'website');

  // Social group should prioritize google, facebook, twitter
  const socialGroup = result.find(g => g.id === 'social');
  runner.assertEqual(socialGroup.platforms[0], 'google', 'Social group should prioritize Google');

  // Messaging group should prioritize slack, discord
  const messagingGroup = result.find(g => g.id === 'messaging');
  runner.assertEqual(messagingGroup.platforms[0], 'slack', 'Messaging group should prioritize Slack');
  runner.assertEqual(messagingGroup.platforms[1], 'discord', 'Messaging group have Discord second');
});

// Test 11: detectPageType with og:type article
runner.test('detectPageType detects article from og:type', () => {
  const meta = { og: { type: 'article' } };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'article', 'Should detect article type');
});

// Test 12: detectPageType with og:type product
runner.test('detectPageType detects product from og:type', () => {
  const meta = { og: { type: 'product' } };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'product', 'Should detect product type');
});

// Test 13: detectPageType with og:type video
runner.test('detectPageType detects video from og:type', () => {
  const meta = { og: { type: 'video' } };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'video', 'Should detect video type');
});

// Test 14: detectPageType with URL pattern
runner.test('detectPageType detects article from URL pattern', () => {
  const meta = { canonical: 'https://example.com/blog/my-post' };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'article', 'Should detect article from URL');
});

// Test 15: detectPageType defaults to website
runner.test('detectPageType defaults to website', () => {
  const meta = { og: { type: 'website' } };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'website', 'Should default to website');
});

// Test 16: detectPageType with null meta
runner.test('detectPageType handles null meta', () => {
  const pageType = detectPageType(null);
  runner.assertEqual(pageType, 'website', 'Should return website for null meta');
});

// Test 17: getPlatformOrderForPageType for article
runner.test('getPlatformOrderForPageType returns correct order for article', () => {
  const order = getPlatformOrderForPageType('article');
  runner.assertEqual(order[0], 'twitter', 'Article should prioritize Twitter');
  runner.assertEqual(order[1], 'facebook', 'Article should have Facebook second');
  runner.assertEqual(order.length, 7, 'Article order should have 7 platforms');
});

// Test 18: getPlatformOrderForPageType for product
runner.test('getPlatformOrderForPageType returns correct order for product', () => {
  const order = getPlatformOrderForPageType('product');
  runner.assertEqual(order[0], 'pinterest', 'Product should prioritize Pinterest');
  runner.assertEqual(order[1], 'facebook', 'Product should have Facebook second');
  runner.assertEqual(order.length, 5, 'Product order should have 5 platforms');
});

// Test 19: getPlatformOrderForPageType for unknown type
runner.test('getPlatformOrderForPageType falls back to website order for unknown type', () => {
  const order = getPlatformOrderForPageType('unknown');
  runner.assertEqual(order, getPlatformOrderForPageType('website'), 'Unknown type should fallback to website order');
});

// Test 20: Stability - platforms with same preference maintain order
runner.test('Platforms with same preference maintain relative order', () => {
  const group = [{
    id: 'test',
    title: 'Test Group',
    platforms: ['figma', 'notion', 'jira'] // All not in preferred order
  }];

  const result = applyPlatformReordering(group, 'article');

  // Should maintain original relative order
  runner.assertEqual(result[0].platforms, ['figma', 'notion', 'jira'], 'Non-preferred platforms should maintain order');
});

// Test 21: Case insensitive og:type detection
runner.test('detectPageType handles case insensitive og:type', () => {
  const meta = { og: { type: 'ARTICLE' } };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'article', 'Should handle uppercase og:type');
});

// Test 22: Schema.org type detection
runner.test('detectPageType detects article from schema.org', () => {
  const meta = {
    schema: {
      '@type': 'BlogPosting'
    }
  };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'article', 'Should detect article from schema.org');
});

// Test 23: Partial og:type match
runner.test('detectPageType handles partial og:type matches', () => {
  const meta = { og: { type: 'article.news' } };
  const pageType = detectPageType(meta);
  runner.assertEqual(pageType, 'article', 'Should detect article from partial match');
});

// Test 24: Full workflow integration
runner.test('Full workflow: detect -> get order -> reorder', () => {
  // Simulate the full workflow
  const meta = { og: { type: 'article' } };
  const pageType = detectPageType(meta);
  const preferredOrder = getPlatformOrderForPageType(pageType);
  const result = applyPlatformReordering(PLATFORM_GROUPS, pageType);

  runner.assertEqual(pageType, 'article', 'Should detect article type');
  runner.assertEqual(preferredOrder[0], 'twitter', 'Should get correct preferred order');

  const socialGroup = result.find(g => g.id === 'social');
  runner.assertEqual(socialGroup.platforms[0], 'twitter', 'Should reorder to put Twitter first');
});

// Test 25: Platforms with special characters in IDs
runner.test('Handles platform groups with various IDs', () => {
  const customGroups = [
    { id: 'group-1', title: 'Group 1', platforms: ['twitter', 'facebook'] },
    { id: 'group_2', title: 'Group 2', platforms: ['linkedin', 'reddit'] },
    { id: 'group.3', title: 'Group 3', platforms: ['google'] }
  ];

  const result = applyPlatformReordering(customGroups, 'article');

  runner.assertEqual(result[0].id, 'group-1', 'Should preserve group IDs');
  runner.assertEqual(result[1].id, 'group_2', 'Should preserve group IDs with underscores');
  runner.assertEqual(result[2].id, 'group.3', 'Should preserve group IDs with dots');
});

// Run all tests
runner.run()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
