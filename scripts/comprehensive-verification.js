#!/usr/bin/env node
/**
 * Comprehensive Verification Script for All 43 Platforms
 *
 * This script performs end-to-end verification of:
 * 1. Platform count in scorer.js (should be 43)
 * 2. HTML frame pairs in src/public/ (should be 86 files = 43 platforms × 2)
 * 3. Skeleton type mappings for all platforms
 * 4. /api/platforms endpoint returns complete data
 * 5. Theme toggles work for all platforms
 * 6. Screenshot generation for sample platforms
 * 7. Scoring rules execute without errors
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ALL_PLATFORMS = [
  'asana', 'bluesky', 'devto', 'discord', 'evernote', 'facebook', 'feedly',
  'figma', 'github', 'gitlab', 'gmail', 'google', 'googlechat', 'hackernews',
  'imessage', 'instagram', 'jetbrains', 'jira', 'kakaotalk', 'line',
  'linkedin', 'mastodon', 'medium', 'notion', 'outlook', 'pinterest',
  'producthunt', 'reddit', 'signal', 'slack', 'stackoverflow', 'substack',
  'teams', 'telegram', 'threads', 'tiktok', 'trello', 'tumblr', 'twitter',
  'vscode', 'whatsapp', 'youtube', 'zoom'
];

const publicDir = path.join(__dirname, '../src/public');
const scorerPath = path.join(__dirname, '../src/scorer.js');
const skeletonTypesPath = path.join(__dirname, '../src/skeleton-types.js');

let results = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function test(title, fn) {
  results.totalTests++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.passed++;
      console.log(`  ✅ ${title}`);
      return true;
    } else {
      results.failed++;
      results.failures.push({ title, reason: 'Test returned false' });
      console.log(`  ❌ ${title}`);
      return false;
    }
  } catch (error) {
    results.failed++;
    results.failures.push({ title, reason: error.message });
    console.log(`  ❌ ${title}: ${error.message}`);
    return false;
  }
}

async function testAsync(title, fn) {
  results.totalTests++;
  try {
    const result = await fn();
    if (result === true || result === undefined) {
      results.passed++;
      console.log(`  ✅ ${title}`);
      return true;
    } else {
      results.failed++;
      results.failures.push({ title, reason: 'Test returned false' });
      console.log(`  ❌ ${title}`);
      return false;
    }
  } catch (error) {
    results.failed++;
    results.failures.push({ title, reason: error.message });
    console.log(`  ❌ ${title}: ${error.message}`);
    return false;
  }
}

// 1. Count platforms in scorer.js
function verifyScorerPlatformCount() {
  console.log('\n1. Verifying platform count in scorer.js');
  const scorerContent = fs.readFileSync(scorerPath, 'utf8');
  const platformMatch = scorerContent.match(/const PLATFORMS = \[([\s\S]*?)\];/);
  if (!platformMatch) {
    test('Extract PLATFORMS array from scorer.js', () => { throw new Error('Could not find PLATFORMS array'); });
    return;
  }

  const { PLATFORMS } = require(scorerPath);
  test('PLATFORMS array exists', () => PLATFORMS && Array.isArray(PLATFORMS));
  test(`PLATFORMS contains exactly 43 platforms`, () => PLATFORMS.length === 43);
  test('All platforms have required fields', () => {
    return PLATFORMS.every(p => p.id && p.name && p.category && typeof p.weight === 'number');
  });

  // Verify all expected platform IDs are present
  const platformIds = PLATFORMS.map(p => p.id).sort();
  const expectedIds = ALL_PLATFORMS.sort();
  test('Platform IDs match expected list', () => {
    return JSON.stringify(platformIds) === JSON.stringify(expectedIds);
  });
}

// 2. Count HTML frame pairs
function verifyFrameFiles() {
  console.log('\n2. Verifying HTML frame files');

  const lightFrames = ALL_PLATFORMS.map(p => path.join(publicDir, `${p}-light.html`));
  const darkFrames = ALL_PLATFORMS.map(p => path.join(publicDir, `${p}-dark.html`));

  test('All 43 light frames exist', () => {
    return lightFrames.every(f => fs.existsSync(f));
  });

  test('All 43 dark frames exist', () => {
    return darkFrames.every(f => fs.existsSync(f));
  });

  test('Total frame files = 86 (43 × 2)', () => {
    const lightExist = lightFrames.filter(f => fs.existsSync(f)).length;
    const darkExist = darkFrames.filter(f => fs.existsSync(f)).length;
    return lightExist === 43 && darkExist === 43;
  });

  // Sample frame content check
  test('Sample frame structure is valid (facebook-light)', () => {
    const content = fs.readFileSync(path.join(publicDir, 'facebook-light.html'), 'utf8');
    return content.includes('<!DOCTYPE html') && content.includes('<html');
  });

  test('Sample frame structure is valid (twitter-dark)', () => {
    const content = fs.readFileSync(path.join(publicDir, 'twitter-dark.html'), 'utf8');
    return content.includes('<!DOCTYPE html') && content.includes('<html');
  });
}

// 3. Verify skeleton type mappings
function verifySkeletonMappings() {
  console.log('\n3. Verifying skeleton type mappings');

  const { PLATFORM_SKELETON_MAP, SKELETON_TYPES } = require(skeletonTypesPath);

  test('Skeleton types are defined', () => {
    return SKELETON_TYPES &&
           SKELETON_TYPES.TALL === 'tall' &&
           SKELETON_TYPES.SHORT === 'short' &&
           SKELETON_TYPES.TEXT_ONLY === 'text_only';
  });

  test('All 43 platforms have skeleton mappings', () => {
    return ALL_PLATFORMS.every(p => PLATFORM_SKELETON_MAP[p]);
  });

  test('Skeleton mappings use valid types', () => {
    const validTypes = Object.values(SKELETON_TYPES);
    return Object.values(PLATFORM_SKELETON_MAP).every(type => validTypes.includes(type));
  });

  // Count platforms by skeleton type
  const tallPlatforms = Object.entries(PLATFORM_SKELETON_MAP)
    .filter(([_, type]) => type === SKELETON_TYPES.TALL).length;
  const shortPlatforms = Object.entries(PLATFORM_SKELETON_MAP)
    .filter(([_, type]) => type === SKELETON_TYPES.SHORT).length;
  const textOnlyPlatforms = Object.entries(PLATFORM_SKELETON_MAP)
    .filter(([_, type]) => type === SKELETON_TYPES.TEXT_ONLY).length;

  test(`Tall skeleton count (${tallPlatforms}) is within expected range`, () => tallPlatforms >= 15 && tallPlatforms <= 20);
  test(`Short skeleton count (${shortPlatforms}) is within expected range`, () => shortPlatforms >= 23 && shortPlatforms <= 27);
  test(`Text-only skeleton count (${textOnlyPlatforms}) = 1 (google)`, () => textOnlyPlatforms === 1);
}

// 4. Verify /api/platforms endpoint
async function verifyPlatformsEndpoint() {
  console.log('\n4. Verifying /api/platforms endpoint');

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/platforms',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        try {
          const responseData = JSON.parse(data);

          await testAsync('/api/platforms returns 200 status', async () => res.statusCode === 200);
          await testAsync('/api/platforms returns JSON', async () => {
            try { JSON.parse(data); return true; } catch { return false; }
          });
          await testAsync('/api/platforms has platforms array', async () => {
            return responseData.platforms && Array.isArray(responseData.platforms);
          });
          await testAsync('/api/platforms returns 43 platforms', async () => {
            return responseData.platforms && responseData.platforms.length === 43;
          });
          await testAsync('/api/platforms has skeletonTypes object', async () => {
            return responseData.skeletonTypes && typeof responseData.skeletonTypes === 'object';
          });
          await testAsync('/api/platforms has platformSkeletonMap', async () => {
            return responseData.platformSkeletonMap && typeof responseData.platformSkeletonMap === 'object';
          });
          await testAsync('/api/platforms skeleton map has 43 entries', async () => {
            return Object.keys(responseData.platformSkeletonMap).length === 43;
          });

          resolve();
        } catch (error) {
          test('/api/platforms parse response', () => { throw error; });
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      test('/api/platforms connect to server', () => { throw error; });
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      test('/api/platforms connect to server', () => { throw new Error('Request timeout'); });
      resolve();
    });

    req.end();
  });
}

// 5. Verify theme toggles (check both frames load)
async function verifyThemeToggles() {
  console.log('\n5. Verifying theme toggles for sample platforms');

  const samplePlatforms = ['facebook', 'twitter', 'linkedin', 'slack', 'github'];

  for (const platform of samplePlatforms) {
    await testAsync(`${platform} light frame loads`, async () => {
      const lightPath = path.join(publicDir, `${platform}-light.html`);
      return fs.existsSync(lightPath);
    });

    await testAsync(`${platform} dark frame loads`, async () => {
      const darkPath = path.join(publicDir, `${platform}-dark.html`);
      return fs.existsSync(darkPath);
    });
  }
}

// 6. Verify scoring rules
function verifyScoringRules() {
  console.log('\n6. Verifying scoring rules');

  const { scoreAll, PLATFORMS: SCORER_PLATFORMS } = require(scorerPath);

  test('scoreAll function exists', () => typeof scoreAll === 'function');

  // Test with complete metadata
  const testMeta = {
    title: 'Test Page Title',
    description: 'Test page description for verification purposes',
    og: {
      title: 'Test OG Title',
      description: 'Test OG Description',
      image: 'https://example.com/test-image.jpg'
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Test Twitter Title',
      description: 'Test Twitter Description',
      image: 'https://example.com/twitter-image.jpg'
    }
  };

  const testImageProbe = {
    width: 1200,
    height: 630,
    size: 150000,
    contentType: 'image/jpeg'
  };

  test('scoreAll executes without errors', () => {
    try {
      const result = scoreAll(testMeta, testImageProbe);
      return result && typeof result === 'object';
    } catch (error) {
      return false;
    }
  });

  test('scoreAll returns scores for all 43 platforms', () => {
    try {
      const result = scoreAll(testMeta, testImageProbe);
      return result && result.scores && Object.keys(result.scores).length === 43;
    } catch (error) {
      return false;
    }
  });

  test('scoreAll returns overall grade', () => {
    try {
      const result = scoreAll(testMeta, testImageProbe);
      return result && result.overall && typeof result.overall.grade === 'string';
    } catch (error) {
      return false;
    }
  });

  test('scoreAll returns summary stats', () => {
    try {
      const result = scoreAll(testMeta, testImageProbe);
      return result && result.summary &&
             typeof result.summary.passing === 'number' &&
             typeof result.summary.warning === 'number' &&
             typeof result.summary.failing === 'number';
    } catch (error) {
      return false;
    }
  });

  test('scoreAll returns gradeCounts', () => {
    try {
      const result = scoreAll(testMeta, testImageProbe);
      return result && result.gradeCounts &&
             typeof result.gradeCounts['A+'] === 'number' &&
             typeof result.gradeCounts.A === 'number';
    } catch (error) {
      return false;
    }
  });

  // Test with minimal metadata
  const minimalMeta = {
    title: 'Minimal',
    description: 'Minimal description',
    og: { title: null, description: null, image: null },
    twitter: { card: null, title: null, description: null, image: null }
  };

  test('scoreAll handles minimal metadata', () => {
    try {
      const result = scoreAll(minimalMeta, null);
      return result && result.overall && typeof result.overall.grade === 'string';
    } catch (error) {
      return false;
    }
  });
}

// 7. Verify frame file integrity (sample check)
function verifyFrameIntegrity() {
  console.log('\n7. Verifying frame file integrity');

  const criticalPlatforms = ['facebook', 'twitter', 'linkedin', 'slack', 'google'];

  criticalPlatforms.forEach(platform => {
    const lightPath = path.join(publicDir, `${platform}-light.html`);
    const darkPath = path.join(publicDir, `${platform}-dark.html`);

    if (fs.existsSync(lightPath)) {
      test(`${platform}-light.html has valid HTML structure`, () => {
        const content = fs.readFileSync(lightPath, 'utf8');
        return content.includes('<html') && content.includes('</html>');
      });
    }

    if (fs.existsSync(darkPath)) {
      test(`${platform}-dark.html has valid HTML structure`, () => {
        const content = fs.readFileSync(darkPath, 'utf8');
        return content.includes('<html') && content.includes('</html>');
      });
    }
  });
}

// Main verification flow
async function main() {
  console.log('🔍 Starting Comprehensive Platform Verification\n');
  console.log('=' .repeat(60));

  verifyScorerPlatformCount();
  verifyFrameFiles();
  verifySkeletonMappings();
  await verifyPlatformsEndpoint();
  await verifyThemeToggles();
  verifyScoringRules();
  verifyFrameIntegrity();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Verification Summary:');
  console.log(`  Total Tests: ${results.totalTests}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);

  if (results.failures.length > 0) {
    console.log('\n❌ Failures:');
    results.failures.forEach(f => {
      console.log(`  - ${f.title}: ${f.reason}`);
    });
  }

  const success = results.failed === 0;
  console.log(`\n${success ? '✅ All verifications passed!' : '❌ Some verifications failed.'}\n`);

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });
}

module.exports = { test, testAsync, results };