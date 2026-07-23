/**
 * Basic test to verify applySmartOrdering modifies state correctly
 */

console.log('=== Testing applySmartOrdering State Modification ===\n');

// Simulate the relevant parts of the code
const PLATFORM_GROUPS = [
  {
    id: 'social',
    title: 'Social',
    platforms: ['google','facebook','twitter','linkedin','reddit']
  }
];

let platformPrefs = {
  smartOrdering: true,
  cardOrder: null
};

// Simulate a preferred order (e.g., for a homepage)
const preferredOrder = ['twitter', 'facebook', 'linkedin', 'google', 'reddit'];

console.log('BEFORE applySmartOrdering:');
console.log('  PLATFORM_GROUPS[0].platforms:', PLATFORM_GROUPS[0].platforms);
console.log('  platformPrefs.cardOrder:', platformPrefs.cardOrder);

// Simulate what applySmartOrdering does
PLATFORM_GROUPS.forEach((group, groupIndex) => {
  const originalOrder = [...group.platforms];
  console.log('\n  Processing group:', group.title);
  console.log('    Original order:', originalOrder);

  group.platforms.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  console.log('    After sort:', group.platforms);
  console.log('    Changed?', JSON.stringify(originalOrder) !== JSON.stringify(group.platforms));

  if (!platformPrefs.cardOrder) {
    platformPrefs.cardOrder = {};
  }
  platformPrefs.cardOrder[group.id] = [...group.platforms];
  console.log('    Stored in cardOrder:', platformPrefs.cardOrder[group.id]);
});

console.log('\n\nAFTER applySmartOrdering:');
console.log('  PLATFORM_GROUPS[0].platforms:', PLATFORM_GROUPS[0].platforms);
console.log('  platformPrefs.cardOrder:', platformPrefs.cardOrder);

// Now test what renderPreviews would do
console.log('\n\n=== Simulating renderPreviews ===');

PLATFORM_GROUPS.forEach((group) => {
  console.log('\n  Group:', group.title);
  let platforms = group.platforms;
  console.log('    Default (group.platforms):', platforms);

  if (platformPrefs.cardOrder[group.id]) {
    const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
    const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
    platforms = [...customOrder, ...newPlatforms];
    console.log('    Using cardOrder...');
    console.log('      customOrder (filtered):', customOrder);
    console.log('      newPlatforms (added):', newPlatforms);
    console.log('      Final platforms:', platforms);
  }

  // Verify they're the same
  if (JSON.stringify(platforms) === JSON.stringify(platformPrefs.cardOrder[group.id])) {
    console.log('    ✅ platforms matches cardOrder (reordering works!)');
  } else {
    console.log('    ❌ platforms does NOT match cardOrder (BUG!)');
  }
});

console.log('\n=== TEST RESULT ===');
console.log('If all groups show "✅ platforms matches cardOrder", the reordering works.');
console.log('If any show "❌", there is a bug in the reordering logic.');
