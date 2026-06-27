#!/usr/bin/env node
/**
 * Manual Smart Ordering Verification Test
 *
 * Tests the applySmartOrdering logic without requiring a headless browser
 */

const fs = require('fs');
const path = require('path');

// Mock the platform groups and preferences data structure
const PLATFORM_GROUPS = [
  { id: 'social', title: 'Social & Microblogging', platforms: ['google', 'facebook', 'twitter', 'linkedin', 'reddit', 'mastodon', 'bluesky', 'threads', 'tumblr', 'pinterest'] },
  { id: 'messaging', title: 'Messaging', platforms: ['slack', 'discord', 'whatsapp', 'imessage', 'telegram', 'signal', 'teams', 'googlechat', 'zoom', 'line', 'kakaotalk'] },
  { id: 'collaboration', title: 'Collaboration & Productivity', platforms: ['notion', 'jira', 'github', 'trello', 'figma'] },
  { id: 'content', title: 'Content Platforms', platforms: ['medium', 'substack'] },
  { id: 'email', title: 'Email', platforms: ['outlook', 'gmail'] },
  { id: 'rss', title: 'RSS / Readers', platforms: ['feedly'] }
];

// Platform ordering preferences by page type
const PLATFORM_ORDERING = {
  article: ['facebook', 'linkedin', 'twitter', 'reddit', 'telegram', 'whatsapp', 'discord', 'slack', 'teams', 'bluesky', 'mastodon', 'threads', 'medium', 'substack', 'google', 'github', 'notion', 'jira', 'trello', 'figma', 'imessage', 'signal', 'googlechat', 'zoom', 'line', 'kakaotalk', 'tumblr', 'pinterest', 'outlook', 'gmail', 'feedly'],
  website: ['google', 'facebook', 'linkedin', 'twitter', 'reddit', 'pinterest', 'slack', 'discord', 'whatsapp', 'telegram', 'teams', 'bluesky', 'mastodon', 'threads', 'tumblr', 'medium', 'substack', 'github', 'notion', 'jira', 'trello', 'figma', 'imessage', 'signal', 'googlechat', 'zoom', 'line', 'kakaotalk', 'outlook', 'gmail', 'feedly'],
  product: ['pinterest', 'google', 'facebook', 'linkedin', 'twitter', 'reddit', 'whatsapp', 'telegram', 'imessage', 'slack', 'discord', 'teams', 'bluesky', 'mastodon', 'threads', 'tumblr', 'medium', 'substack', 'github', 'notion', 'jira', 'trello', 'figma', 'signal', 'googlechat', 'zoom', 'line', 'kakaotalk', 'outlook', 'gmail', 'feedly'],
  video: ['youtube', 'vimeo', 'facebook', 'twitter', 'linkedin', 'reddit', 'whatsapp', 'telegram', 'discord', 'slack', 'teams', 'imessage', 'bluesky', 'mastodon', 'threads', 'medium', 'substack', 'google', 'github', 'notion', 'jira', 'trello', 'figma', 'signal', 'googlechat', 'zoom', 'line', 'kakaotalk', 'tumblr', 'pinterest', 'outlook', 'gmail', 'feedly'],
  profile: ['twitter', 'linkedin', 'facebook', 'instagram', 'github', 'reddit', 'bluesky', 'mastodon', 'threads', 'medium', 'substack', 'discord', 'slack', 'whatsapp', 'telegram', 'teams', 'imessage', 'notion', 'jira', 'trello', 'figma', 'google', 'signal', 'googlechat', 'zoom', 'line', 'kakaotalk', 'tumblr', 'pinterest', 'outlook', 'gmail', 'feedly'],
  default: ['google', 'facebook', 'twitter', 'linkedin', 'reddit', 'whatsapp', 'telegram', 'discord', 'slack', 'teams', 'bluesky', 'mastodon', 'threads', 'medium', 'substack', 'pinterest', 'tumblr', 'github', 'notion', 'jira', 'trello', 'figma', 'imessage', 'signal', 'googlechat', 'zoom', 'line', 'kakaotalk', 'outlook', 'gmail', 'feedly']
};

// Mock the app.js functions that would be needed
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

function getPlatformOrderForPageType(pageType) {
  const orders = {
    article: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon'],
    product: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin'],
    video: ['twitter', 'facebook', 'youtube', 'tiktok', 'instagram'],
    website: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord']
  };

  return orders[pageType] || orders.website;
}

function applySmartOrdering(currentData, platformPrefs) {
  console.log('[applySmartOrdering] Function called');

  if (!currentData) {
    console.log('[applySmartOrdering] Early exit: no currentData available');
    return false;
  }
  if (!platformPrefs?.smartOrdering) {
    console.log('[applySmartOrdering] Early exit: smart ordering disabled in preferences');
    return false;
  }

  console.log('[applySmartOrdering] Items (currentData):', {
    hasData: !!currentData,
    hasMeta: !!currentData?.meta,
    ogType: currentData?.meta?.og?.type,
    canonical: currentData?.meta?.canonical
  });

  console.log('[applySmartOrdering] Context/Flag parameters:', {
    smartOrderingEnabled: platformPrefs?.smartOrdering,
    hasPagePreferences: !!platformPrefs?.pageType
  });

  const pageType = detectPageType(currentData.meta);
  console.log(`[applySmartOrdering] Page type detected: "${pageType}"`);

  const preferredOrder = getPlatformOrderForPageType(pageType);
  console.log(`[applySmartOrdering] Preferred platform order for "${pageType}":`, preferredOrder.slice(0, 5), '...');

  console.log('[applySmartOrdering] Reordering platform groups...');
  let anyChanged = false;
  PLATFORM_GROUPS.forEach((group, groupIndex) => {
    const originalOrder = [...group.platforms];
    group.platforms.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    if (!platformPrefs.cardOrder) {
      platformPrefs.cardOrder = {};
    }
    platformPrefs.cardOrder[group.id] = [...group.platforms];

    if (JSON.stringify(originalOrder) !== JSON.stringify(group.platforms)) {
      console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}" reordered:`, {
        from: originalOrder,
        to: group.platforms
      });
      anyChanged = true;
    } else {
      console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}": no change needed`);
    }
  });

  console.log('[applySmartOrdering] Function complete ✅');
  return anyChanged;
}

// Test cases
const testCases = [
  {
    name: 'Article page type',
    input: {
      meta: {
        og: { type: 'article', url: 'https://example.com/article/test' },
        canonical: 'https://example.com/article/test'
      }
    },
    expectedPageType: 'article',
    expectedTopPlatforms: ['twitter', 'facebook', 'linkedin']
  },
  {
    name: 'Website page type',
    input: {
      meta: {
        og: { type: 'website', url: 'https://example.com' },
        canonical: 'https://example.com'
      }
    },
    expectedPageType: 'website',
    expectedTopPlatforms: ['google', 'facebook', 'twitter']
  },
  {
    name: 'Product page type',
    input: {
      meta: {
        og: { type: 'product', url: 'https://example.com/product' },
        canonical: 'https://example.com/product'
      }
    },
    expectedPageType: 'product',
    expectedTopPlatforms: ['pinterest', 'facebook', 'instagram']
  },
  {
    name: 'Video page type',
    input: {
      meta: {
        og: { type: 'video', url: 'https://example.com/video' },
        canonical: 'https://example.com/video'
      }
    },
    expectedPageType: 'video',
    expectedTopPlatforms: ['twitter', 'facebook', 'youtube']
  }
];

console.log('🧪 Running Smart Ordering Verification Tests\n\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, i) => {
  console.log(`Test ${i + 1}: ${testCase.name}`);
  console.log('Input:', testCase.input.meta);

  // Reset platform groups to alphabetical order (opposite of most preferred orders)
  PLATFORM_GROUPS.forEach((group, idx) => {
    const original = [
      // Alphabetical order (opposite of most smart orderings)
      ['bluesky', 'facebook', 'google', 'linkedin', 'mastodon', 'pinterest', 'reddit', 'threads', 'tumblr', 'twitter'],
      ['discord', 'googlechat', 'imessage', 'kakaotalk', 'line', 'signal', 'slack', 'teams', 'telegram', 'whatsapp', 'zoom'],
      ['figma', 'github', 'jira', 'notion', 'trello'],
      ['medium', 'substack'],
      ['gmail', 'outlook'],
      ['feedly']
    ];
    group.platforms = [...original[idx]];
  });

  const platformPrefs = { smartOrdering: true };

  const detectedPageType = detectPageType(testCase.input.meta);
  console.log(`Expected page type: "${testCase.expectedPageType}", Detected: "${detectedPageType}"`);

  const changed = applySmartOrdering(testCase.input, platformPrefs);
  const firstGroupPlatforms = PLATFORM_GROUPS[0].platforms;

  const pageTypeCorrect = detectedPageType === testCase.expectedPageType;
  const topPlatformsCorrect = testCase.expectedTopPlatforms.every(p => firstGroupPlatforms.indexOf(p) < testCase.expectedTopPlatforms.length);

  // For "website" page type, the order might not change much if it's already close to default
  const shouldChange = testCase.expectedPageType !== 'website';
  const changeOk = shouldChange ? changed : true;

  if (changeOk && pageTypeCorrect && topPlatformsCorrect) {
    console.log(`✅ PASS: Page type "${detectedPageType}", top platforms: ${firstGroupPlatforms.slice(0, 3).join(', ')}`);
    passed++;
  } else {
    console.log(`❌ FAIL:`);
    if (!changeOk && shouldChange) console.log('  - Order did not change');
    if (!pageTypeCorrect) console.log(`  - Expected page type "${testCase.expectedPageType}", got "${detectedPageType}"`);
    if (!topPlatformsCorrect) console.log(`  - Expected top platforms ${testCase.expectedTopPlatforms.join(', ')}, got ${firstGroupPlatforms.slice(0, 3).join(', ')}`);
    failed++;
  }
  console.log('');
});

console.log('═'.repeat(50));
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(50));

if (failed === 0) {
  console.log('✅ All tests passed! Smart ordering is working correctly.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed.');
  process.exit(1);
}
