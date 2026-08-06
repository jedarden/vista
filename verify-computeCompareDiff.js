/**
 * Verification test for computeCompareDiff function
 * Tests all acceptance criteria for bf-3kwc
 */

const { computeCompareDiff } = require('./src/comparators');

// Mock /api/compare response objects
function createMockResponse(platformScores) {
  return {
    scoring: {
      scores: platformScores
    }
  };
}

// Test data
const responseA = createMockResponse({
  'twitter': {
    grade: 'A',
    score: 95,
    issues: [],
    fixes: [],
    platform: { id: 'twitter', name: 'X (Twitter)', category: 'Social & Microblogging', weight: 10 }
  },
  'facebook': {
    grade: 'B',
    score: 85,
    issues: ['og:image missing'],
    fixes: ['Add og:image meta tag'],
    platform: { id: 'facebook', name: 'Facebook', category: 'Social & Microblogging', weight: 10 }
  },
  'linkedin': {
    grade: 'A',
    score: 90,
    issues: [],
    fixes: [],
    platform: { id: 'linkedin', name: 'LinkedIn', category: 'Social & Microblogging', weight: 9 }
  }
});

const responseB = createMockResponse({
  'twitter': {
    grade: 'A',
    score: 95,
    issues: [],
    fixes: [],
    platform: { id: 'twitter', name: 'X (Twitter)', category: 'Social & Microblogging', weight: 10 }
  },
  'facebook': {
    grade: 'A',
    score: 92,
    issues: [],
    fixes: [],
    platform: { id: 'facebook', name: 'Facebook', category: 'Social & Microblogging', weight: 10 }
  },
  'instagram': {
    grade: 'C',
    score: 75,
    issues: ['og:title missing', 'no twitter:card'],
    fixes: [],
    platform: { id: 'instagram', name: 'Instagram', category: 'Social & Microblogging', weight: 7 }
  }
});

console.log('Testing computeCompareDiff function...\n');

// Run the diff computation
const result = computeCompareDiff(responseA, responseB);

console.log('Result structure:');
console.log('- identicalPlatforms type:', result.identicalPlatforms.constructor.name);
console.log('- changedFields type:', result.changedFields.constructor.name);
console.log('- missingTags type:', result.missingTags.constructor.name);
console.log();

console.log('Identical platforms:');
console.log('  twitter:', result.identicalPlatforms.has('twitter') ? '✓' : '✗');
console.log();

console.log('Changed platforms:');
console.log('  facebook:', result.changedFields.has('facebook') ? '✓' : '✗');
console.log('    Changed fields:', result.changedFields.get('facebook'));
console.log();

console.log('New platform in B:');
console.log('  instagram in changedFields:', result.changedFields.has('instagram') ? '✓' : '✗');
console.log('  instagram in missingTags:', result.missingTags.has('instagram') ? '✓' : '✗');
console.log();

console.log('Missing tags for facebook (og:image fixed in B):');
console.log('  facebook missing tags:', result.missingTags.get('facebook') || []);
console.log();

// Verify acceptance criteria
const acceptanceChecks = {
  'Acceptance Criterion 1: Function accepts two /api/compare response objects':
    typeof computeCompareDiff === 'function' && computeCompareDiff.length === 2,

  'Acceptance Criterion 2: Iterates through all platforms':
    result.identicalPlatforms.has('twitter') &&
    result.changedFields.has('facebook') &&
    result.changedFields.has('instagram'),

  'Acceptance Criterion 3a: Returns Set of identical platforms':
    result.identicalPlatforms instanceof Set && result.identicalPlatforms.has('twitter'),

  'Acceptance Criterion 3b: Returns Map of platform -> changed fields':
    result.changedFields instanceof Map && result.changedFields.has('facebook'),

  'Acceptance Criterion 3c: Returns Map of platform -> missing tags':
    result.missingTags instanceof Map
};

console.log('='.repeat(60));
console.log('ACCEPTANCE CRITERIA VERIFICATION');
console.log('='.repeat(60));

let allPassed = true;
for (const [criterion, passed] of Object.entries(acceptanceChecks)) {
  console.log(`${passed ? '✓' : '✗'} ${criterion}`);
  if (!passed) allPassed = false;
}

console.log('='.repeat(60));
console.log(allPassed ? '✓ ALL ACCEPTANCE CRITERIA MET' : '✗ SOME CRITERIA FAILED');
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
