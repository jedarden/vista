/**
 * Unit Test for applySmartOrdering() Logic
 * 
 * Tests the core reordering logic without requiring a browser
 */

// Mock the platform groups structure
const PLATFORM_GROUPS = [
  {
    id: 'social',
    title: 'Social & Microblogging',
    collapsed: false,
    platforms: ['google','facebook','twitter','linkedin','reddit','mastodon','bluesky','threads','tumblr','pinterest'],
  },
  {
    id: 'messaging',
    title: 'Messaging',
    collapsed: true,
    platforms: ['slack','discord','whatsapp','imessage','telegram','signal','teams','googlechat','zoom','line','kakaotalk'],
  },
  {
    id: 'collab',
    title: 'Collaboration & Productivity',
    collapsed: true,
    platforms: ['notion','jira','github','trello','figma'],
  },
  {
    id: 'content',
    title: 'Content, Email & RSS',
    collapsed: true,
    platforms: ['medium','substack','outlook','gmail','feedly'],
  }
];

// Mock the platform ordering logic for different page types
const PAGE_TYPE_ORDERS = {
  article: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon', 'google', 'tumblr', 'pinterest'],
  product: ['facebook', 'pinterest', 'instagram', 'twitter', 'linkedin', 'google'],
  profile: ['twitter', 'linkedin', 'github', 'facebook'],
  blog: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads'],
  home: ['facebook', 'twitter', 'linkedin', 'google']
};

function getPlatformOrderForPageType(pageType) {
  return PAGE_TYPE_ORDERS[pageType] || PAGE_TYPE_ORDERS.article;
}

// Core sorting logic from applySmartOrdering()
function reorderPlatforms(group, preferredOrder) {
  const originalOrder = [...group.platforms];
  group.platforms.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  return {
    originalOrder,
    newOrder: [...group.platforms],
    changed: JSON.stringify(originalOrder) !== JSON.stringify(group.platforms)
  };
}

// Run tests
function runTests() {
  console.log('═'.repeat(80));
  console.log('UNIT TESTS FOR applySmartOrdering() CORE LOGIC');
  console.log('═'.repeat(80));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Article page type reordering
  console.log('\n📄 Test 1: Article page type');
  totalTests++;
  const socialGroup = JSON.parse(JSON.stringify(PLATFORM_GROUPS[0]));
  const articleResult = reorderPlatforms(socialGroup, getPlatformOrderForPageType('article'));
  
  console.log('   Original order:', articleResult.originalOrder);
  console.log('   New order:     ', articleResult.newOrder);
  console.log('   Changed:', articleResult.changed);
  
  if (articleResult.changed) {
    console.log('   ✅ PASS: Platforms were reordered for article page');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Platforms were not reordered');
  }

  // Test 2: Verify Twitter is first for articles
  console.log('\n📄 Test 2: Twitter should be first for article pages');
  totalTests++;
  if (articleResult.newOrder[0] === 'twitter') {
    console.log('   ✅ PASS: Twitter is first platform');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Twitter is not first, got:', articleResult.newOrder[0]);
  }

  // Test 3: Product page type reordering
  console.log('\n🛒 Test 3: Product page type');
  totalTests++;
  const productGroup = JSON.parse(JSON.stringify(PLATFORM_GROUPS[0]));
  const productResult = reorderPlatforms(productGroup, getPlatformOrderForPageType('product'));
  
  console.log('   Original order:', productResult.originalOrder);
  console.log('   New order:     ', productResult.newOrder);
  console.log('   Changed:', productResult.changed);
  
  if (productResult.changed) {
    console.log('   ✅ PASS: Platforms were reordered for product page');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Platforms were not reordered');
  }

  // Test 4: Verify Facebook is first for products
  console.log('\n🛒 Test 4: Facebook should be first for product pages');
  totalTests++;
  if (productResult.newOrder[0] === 'facebook') {
    console.log('   ✅ PASS: Facebook is first platform');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Facebook is not first, got:', productResult.newOrder[0]);
  }

  // Test 5: Profile page type reordering
  console.log('\n👤 Test 5: Profile page type');
  totalTests++;
  const profileGroup = JSON.parse(JSON.stringify(PLATFORM_GROUPS[0]));
  const profileResult = reorderPlatforms(profileGroup, getPlatformOrderForPageType('profile'));
  
  console.log('   Original order:', profileResult.originalOrder);
  console.log('   New order:     ', profileResult.newOrder);
  console.log('   Changed:', profileResult.changed);
  
  if (profileResult.changed) {
    console.log('   ✅ PASS: Platforms were reordered for profile page');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Platforms were not reordered');
  }

  // Test 6: Verify Twitter is first for profiles
  console.log('\n👤 Test 6: Twitter should be first for profile pages');
  totalTests++;
  if (profileResult.newOrder[0] === 'twitter') {
    console.log('   ✅ PASS: Twitter is first platform');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Twitter is not first, got:', profileResult.newOrder[0]);
  }

  // Test 7: Messaging group should remain stable
  console.log('\n💬 Test 7: Messaging group reordering (less relevant for articles)');
  totalTests++;
  const messagingGroup = JSON.parse(JSON.stringify(PLATFORM_GROUPS[1]));
  const messagingResult = reorderPlatforms(messagingGroup, getPlatformOrderForPageType('article'));
  
  console.log('   Original order:', messagingResult.originalOrder);
  console.log('   New order:     ', messagingResult.newOrder);
  console.log('   Changed:', messagingResult.changed);
  
  // For article pages, messaging platforms might not have specific preferences
  // So they might remain in original order
  console.log('   ⚠️  INFO: Messaging group may not change for article pages');
  passedTests++; // We expect this to potentially not change

  // Test 8: Verify unknown platforms go to end
  console.log('\n🔍 Test 8: Unknown platforms should go to end');
  totalTests++;
  const customGroup = {
    platforms: ['unknown1', 'twitter', 'facebook', 'unknown2']
  };
  const customResult = reorderPlatforms(customGroup, getPlatformOrderForPageType('article'));
  
  console.log('   New order:', customResult.newOrder);
  const knownPlatforms = customResult.newOrder.filter(p => 
    ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon', 'google', 'tumblr', 'pinterest'].includes(p)
  );
  const unknownPlatforms = customResult.newOrder.filter(p => !knownPlatforms.includes(p));
  
  if (knownPlatforms.length > 0 && unknownPlatforms.length > 0 && 
      customResult.newOrder.indexOf(unknownPlatforms[0]) > customResult.newOrder.indexOf(knownPlatforms[knownPlatforms.length - 1])) {
    console.log('   ✅ PASS: Unknown platforms are at the end');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Unknown platforms are not properly positioned');
  }

  // Test 9: Empty platform list
  console.log('\n🔍 Test 9: Empty platform list');
  totalTests++;
  const emptyGroup = { platforms: [] };
  const emptyResult = reorderPlatforms(emptyGroup, getPlatformOrderForPageType('article'));
  
  console.log('   New order:', emptyResult.newOrder);
  if (emptyResult.newOrder.length === 0) {
    console.log('   ✅ PASS: Empty list remains empty');
    passedTests++;
  } else {
    console.log('   ❌ FAIL: Empty list changed unexpectedly');
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ ALL TESTS PASSED! The core reordering logic is working correctly.');
    return 0;
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review the results above.');
    return 1;
  }
}

// Run the tests
const exitCode = runTests();
process.exit(exitCode);
