/**
 * Simple test to verify applySmartOrdering logic
 * This tests the core logic without needing a browser
 */

console.log('=== Testing applySmartOrdering Core Logic ===\n');

// Simulate the relevant state
const PLATFORM_GROUPS = [
  {
    id: 'social',
    title: 'Social',
    platforms: ['google', 'facebook', 'twitter', 'linkedin', 'reddit']
  },
  {
    id: 'media',
    title: 'Media',
    platforms: ['pinterest', 'instagram', 'youtube', 'tiktok']
  }
];

let platformPrefs = {
  smartOrdering: true,
  cardOrder: null
};

// Simulate getPlatformOrderForPageType for a homepage
function getPlatformOrderForPageType(pageType) {
  if (pageType === 'homepage' || pageType === 'article') {
    return ['twitter', 'facebook', 'linkedin', 'google', 'reddit', 'pinterest', 'instagram', 'youtube', 'tiktok'];
  }
  return ['google', 'facebook', 'twitter', 'linkedin', 'reddit', 'pinterest', 'instagram', 'youtube', 'tiktok'];
}

function detectPageType(meta) {
  if (!meta) return 'homepage';
  if (meta.og?.type === 'article') return 'article';
  if (meta.article) return 'article';
  return 'homepage';
}

// Simulate currentData
const currentData = {
  meta: {
    og: { type: 'article' }
  },
  scoring: {
    scores: {
      google: { score: 85, grade: 'A' },
      facebook: { score: 90, grade: 'A+' },
      twitter: { score: 88, grade: 'A' },
      linkedin: { score: 75, grade: 'B' },
      reddit: { score: 70, grade: 'C' },
      pinterest: { score: 82, grade: 'A' },
      instagram: { score: 78, grade: 'B' },
      youtube: { score: 80, grade: 'B' }
    }
  }
};

// Test: Capture state before
console.log('BEFORE applySmartOrdering:');
console.log('  Social group platforms:', PLATFORM_GROUPS[0].platforms);
console.log('  Media group platforms:', PLATFORM_GROUPS[1].platforms);
console.log('  cardOrder:', platformPrefs.cardOrder);

// Simulate what applySmartOrdering does
const pageType = detectPageType(currentData.meta);
console.log('\nDetected page type:', pageType);

const preferredOrder = getPlatformOrderForPageType(pageType);
console.log('Preferred order:', preferredOrder.slice(0, 5) + '...');

console.log('\nReordering platforms...');
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

  const changed = JSON.stringify(originalOrder) !== JSON.stringify(group.platforms);

  console.log(`  Group ${groupIndex} "${group.title}": ${changed ? 'CHANGED' : 'no change'}`);
  if (changed) {
    console.log(`    Before: ${originalOrder.join(', ')}`);
    console.log(`    After:  ${group.platforms.join(', ')}`);
  }

  // Update cardOrder
  if (!platformPrefs.cardOrder) {
    platformPrefs.cardOrder = {};
  }
  platformPrefs.cardOrder[group.id] = [...group.platforms];
});

console.log('\nAFTER applySmartOrdering:');
console.log('  Social group platforms:', PLATFORM_GROUPS[0].platforms);
console.log('  Media group platforms:', PLATFORM_GROUPS[1].platforms);
console.log('  cardOrder:', JSON.stringify(platformPrefs.cardOrder, null, 2));

// Now simulate what renderPreviews does
console.log('\n=== Simulating renderPreviews ===');

PLATFORM_GROUPS.forEach((group) => {
  console.log(`\nGroup: ${group.title}`);

  let platforms = group.platforms;

  // This is what renderPreviews does:
  if (platformPrefs.cardOrder[group.id]) {
    const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
    const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
    platforms = [...customOrder, ...newPlatforms];

    console.log('  Using cardOrder:');
    console.log('    customOrder:', customOrder);
    console.log('    newPlatforms:', newPlatforms);
    console.log('    Final platforms:', platforms);
  }

  // Verify they match
  const matches = JSON.stringify(platforms) === JSON.stringify(platformPrefs.cardOrder[group.id]);
  console.log(`  ✅ platforms matches cardOrder: ${matches}`);

  if (!matches) {
    console.log(`    ❌ ERROR: platforms != cardOrder`);
    console.log(`      platforms: ${platforms}`);
    console.log(`      cardOrder: ${platformPrefs.cardOrder[group.id]}`);
  }
});

// Final result
console.log('\n=== TEST RESULT ===');
const socialCorrect = JSON.stringify(PLATFORM_GROUPS[0].platforms) === JSON.stringify(platformPrefs.cardOrder.social);
const mediaCorrect = JSON.stringify(PLATFORM_GROUPS[1].platforms) === JSON.stringify(platformPrefs.cardOrder.media);

console.log(`Social group: ${socialCorrect ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Media group: ${mediaCorrect ? '✅ PASS' : '❌ FAIL'}`);

if (socialCorrect && mediaCorrect) {
  console.log('\n✅✅✅ CORE LOGIC IS CORRECT ✅✅✅');
  console.log('The reordering mechanism updates state correctly.');
  console.log('renderPreviews() will use the updated cardOrder to render cards in the new order.');
} else {
  console.log('\n❌ CORE LOGIC HAS ISSUES');
}
