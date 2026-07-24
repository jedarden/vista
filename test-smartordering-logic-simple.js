#!/usr/bin/env node
/**
 * Simple logic test for applySmartOrdering - no browser required
 */

// Mock PLATFORM_GROUPS
const PLATFORM_GROUPS = [
  {
    id: 'social',
    title: 'Social & Microblogging',
    platforms: ['google', 'facebook', 'twitter', 'linkedin', 'reddit']
  }
];

// Mock platformPrefs
let platformPrefs = {
  favorites: new Set(),
  hidden: new Set(),
  columnCount: 3,
  smartOrdering: true,
  cardOrder: {}
};

// Mock currentData
let currentData = {
  meta: { og: { type: 'article' } },
  scoring: { scores: {} }
};

// Extract functions from app.js
function detectPageType(meta) {
  if (!meta) return 'website';
  const ogType = meta.og?.type?.toLowerCase();
  if (ogType) {
    if (ogType.includes('article')) return 'article';
    if (ogType.includes('product')) return 'product';
    if (ogType.includes('video')) return 'video';
    if (ogType.includes('profile')) return 'profile';
  }
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

// Simplified applySmartOrdering - just the reordering logic
function applySmartOrdering() {
  console.log('[applySmartOrdering] Starting...');

  if (!currentData) {
    console.log('[applySmartOrdering] ERROR: no currentData');
    return;
  }

  if (!platformPrefs.smartOrdering) {
    console.log('[applySmartOrdering] ERROR: smartOrdering disabled');
    return;
  }

  const pageType = detectPageType(currentData.meta);
  console.log(`[applySmartOrdering] Page type: "${pageType}"`);

  const preferredOrder = getPlatformOrderForPageType(pageType);
  console.log(`[applySmartOrdering] Preferred order:`, preferredOrder);

  PLATFORM_GROUPS.forEach((group, groupIndex) => {
    const originalOrder = [...group.platforms];
    console.log(`[applySmartOrdering] Group ${group.id} BEFORE:`, group.platforms);

    group.platforms.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Update platformPrefs.cardOrder to persist the smart ordering
    if (!platformPrefs.cardOrder) {
      platformPrefs.cardOrder = {};
    }
    platformPrefs.cardOrder[group.id] = [...group.platforms];

    console.log(`[applySmartOrdering] Group ${group.id} AFTER:`, group.platforms);
    console.log(`[applySmartOrdering] cardOrder[${group.id}]:`, platformPrefs.cardOrder[group.id]);
  });

  console.log('[applySmartOrdering] Complete ✅');
}

// Run the test
console.log('=== TESTING applySmartOrdering LOGIC ===\n');
console.log('INITIAL STATE:');
console.log('  PLATFORM_GROUPS[0].platforms:', PLATFORM_GROUPS[0].platforms);
console.log('  platformPrefs.smartOrdering:', platformPrefs.smartOrdering);
console.log('  platformPrefs.cardOrder:', platformPrefs.cardOrder);
console.log('');

applySmartOrdering();

console.log('');
console.log('=== VERIFICATION ===');
const socialGroup = PLATFORM_GROUPS[0];
const expectedOrder = ['twitter', 'facebook', 'linkedin', 'reddit', 'google'];
const cardOrder = platformPrefs.cardOrder['social'];

console.log('Expected order for article type:', expectedOrder);
console.log('Actual group.platforms:', socialGroup.platforms);
console.log('cardOrder["social"]:', cardOrder);

const groupMatches = JSON.stringify(socialGroup.platforms) === JSON.stringify(expectedOrder);
const cardOrderMatches = JSON.stringify(cardOrder) === JSON.stringify(expectedOrder);

console.log('');
console.log('RESULTS:');
console.log('  group.platforms matches expected:', groupMatches ? '✅' : '❌');
console.log('  cardOrder matches expected:', cardOrderMatches ? '✅' : '❌');

if (groupMatches && cardOrderMatches) {
  console.log('');
  console.log('✅✅✅ REORDERING LOGIC IS CORRECT ✅✅✅');
  process.exit(0);
} else {
  console.log('');
  console.log('❌ REORDERING LOGIC HAS ISSUES');
  process.exit(1);
}
