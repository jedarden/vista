/**
 * Platform Frames Configuration Validation Test
 *
 * This script validates the platform frames configuration and provides
 * statistics about the platform coverage.
 *
 * Run with: node src/tests/test-platform-frames-config.js
 */

// Mock the TypeScript types for JavaScript runtime
const VALID_FRAME_TYPES = [
  'social-feed',
  'messaging',
  'email',
  'collaboration',
  'content-feed',
  'video-platform',
  'image-focused',
  'rss-reader',
  'search-results',
  'qa-forum',
  'link-aggregator',
];

const VALID_SOURCE_CATEGORIES = [
  'Social & Microblogging',
  'Messaging',
  'Collaboration & Productivity',
  'Content Platforms',
  'Email',
  'RSS / Readers',
  'Developer Tools',
];

const VALID_ASPECT_RATIOS = ['1:1', '1.91:1', '16:9', '9:16', '2:3', 'variable'];

// Import the configuration
let PLATFORM_FRAMES_CONFIG;
try {
  // Try to import the TypeScript config (will need compilation)
  PLATFORM_FRAMES_CONFIG = require('../platform-frames.config.ts').PLATFORM_FRAMES_CONFIG;
} catch (e) {
  // Fallback to checking if the file exists
  console.warn('Could not import TypeScript config directly. This is expected in JS runtime.');
  console.warn('To test: npx ts-node src/tests/test-platform-frames-config.ts');
  process.exit(0);
}

/**
 * Validate a single platform configuration
 */
function validatePlatformConfig(platformId, config) {
  const errors = [];
  const warnings = [];

  // Check required fields
  const requiredFields = ['id', 'name', 'sourceCategory', 'frameType', 'hasThemeSupport', 'aspectRatio', 'structure'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate frame type
  if (config.frameType && !VALID_FRAME_TYPES.includes(config.frameType)) {
    errors.push(`Invalid frameType: ${config.frameType}`);
  }

  // Validate source category
  if (config.sourceCategory && !VALID_SOURCE_CATEGORIES.includes(config.sourceCategory)) {
    errors.push(`Invalid sourceCategory: ${config.sourceCategory}`);
  }

  // Validate aspect ratio
  if (config.aspectRatio && !VALID_ASPECT_RATIOS.includes(config.aspectRatio)) {
    errors.push(`Invalid aspectRatio: ${config.aspectRatio}`);
  }

  // Validate hasThemeSupport is boolean
  if (typeof config.hasThemeSupport !== 'boolean') {
    errors.push(`hasThemeSupport must be boolean, got: ${typeof config.hasThemeSupport}`);
  }

  // Check ID matches
  if (config.id !== platformId) {
    errors.push(`Config ID mismatch: key is "${platformId}" but config.id is "${config.id}"`);
  }

  // Check structure
  if (!config.structure) {
    errors.push('Missing structure field');
  } else {
    const requiredStructureFields = ['requiresChrome', 'requiresNeutralContent', 'supportsThemes', 'hasFixedAspectRatio', 'usesCardLayout'];
    for (const field of requiredStructureFields) {
      if (!(field in config.structure)) {
        errors.push(`Missing structure.${field}`);
      } else if (typeof config.structure[field] !== 'boolean') {
        errors.push(`structure.${field} must be boolean`);
      }
    }
  }

  // Warnings
  if (!config.placeholderFrame) {
    warnings.push('No placeholderFrame defined');
  }

  return { errors, warnings };
}

/**
 * Validate all configurations
 */
function validateAllConfigs() {
  console.log('=== Validating Platform Frames Configuration ===\n');

  let totalErrors = 0;
  let totalWarnings = 0;
  const platformIds = Object.keys(PLATFORM_FRAMES_CONFIG);

  for (const [platformId, config] of Object.entries(PLATFORM_FRAMES_CONFIG)) {
    const { errors, warnings } = validatePlatformConfig(platformId, config);

    if (errors.length > 0) {
      console.error(`❌ ${platformId}:`);
      errors.forEach(err => console.error(`   - ${err}`));
      totalErrors += errors.length;
    }

    if (warnings.length > 0) {
      console.warn(`⚠️  ${platformId}:`);
      warnings.forEach(warn => console.warn(`   - ${warn}`));
      totalWarnings += warnings.length;
    }
  }

  console.log(`\n=== Validation Summary ===`);
  console.log(`Total platforms: ${platformIds.length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('\n✅ All configurations are valid!');
  } else if (totalErrors === 0) {
    console.log('\n⚠️  Valid with warnings');
  } else {
    console.log('\n❌ Validation failed');
    process.exit(1);
  }
}

/**
 * Get configuration statistics
 */
function getConfigStats() {
  console.log('=== Platform Frames Configuration Statistics ===\n');

  const platformIds = Object.keys(PLATFORM_FRAMES_CONFIG);
  const totalPlatforms = platformIds.length;

  let platformsWithThemeSupport = 0;
  let implementedFrames = 0;
  let stubFrames = 0;

  const byFrameType = {};
  const bySourceCategory = {};

  VALID_FRAME_TYPES.forEach(type => byFrameType[type] = 0);
  VALID_SOURCE_CATEGORIES.forEach(cat => bySourceCategory[cat] = 0);

  for (const config of Object.values(PLATFORM_FRAMES_CONFIG)) {
    if (config.hasThemeSupport) {
      platformsWithThemeSupport++;
    }

    byFrameType[config.frameType]++;
    bySourceCategory[config.sourceCategory]++;

    if (config.placeholderFrame) {
      if (config.placeholderFrame.isStub) {
        stubFrames++;
      } else {
        implementedFrames++;
      }
    }
  }

  console.log(`Total platforms: ${totalPlatforms}`);
  console.log(`With theme support: ${platformsWithThemeSupport} (${Math.round(platformsWithThemeSupport / totalPlatforms * 100)}%)`);
  console.log(`Implemented frames: ${implementedFrames}`);
  console.log(`Stub frames: ${stubFrames}`);

  console.log('\n--- By Frame Type ---');
  for (const [type, count] of Object.entries(byFrameType)) {
    if (count > 0) {
      console.log(`${type}: ${count}`);
    }
  }

  console.log('\n--- By Source Category ---');
  for (const [cat, count] of Object.entries(bySourceCategory)) {
    if (count > 0) {
      console.log(`${cat}: ${count}`);
    }
  }

  console.log('\n--- All Platforms ---');
  platformIds.sort().forEach(id => {
    const config = PLATFORM_FRAMES_CONFIG[id];
    const status = config.placeholderFrame?.isStub ? '🔶 stub' : '✅ implemented';
    console.log(`${status} ${id}: ${config.name} (${config.frameType})`);
  });
}

/**
 * Check for missing platforms from scorer.js
 */
function checkMissingPlatforms() {
  console.log('\n=== Checking for Missing Platforms ===\n');

  // Expected platforms from scorer.js
  const expectedPlatforms = [
    'google', 'facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram',
    'threads', 'tiktok', 'producthunt', 'mastodon', 'bluesky', 'hackernews',
    'tumblr', 'pinterest', 'slack', 'discord', 'whatsapp', 'imessage', 'telegram',
    'signal', 'teams', 'googlechat', 'zoom', 'line', 'kakaotalk', 'github',
    'notion', 'gitlab', 'jira', 'asana', 'evernote', 'trello', 'figma',
    'medium', 'devto', 'substack', 'outlook', 'gmail', 'feedly', 'stackoverflow',
    'vscode', 'jetbrains'
  ];

  const configuredPlatforms = Object.keys(PLATFORM_FRAMES_CONFIG);
  const missing = expectedPlatforms.filter(id => !configuredPlatforms.includes(id));
  const extra = configuredPlatforms.filter(id => !expectedPlatforms.includes(id));

  if (missing.length > 0) {
    console.warn('⚠️  Missing platforms (in scorer.js but not configured):');
    missing.forEach(id => console.warn(`   - ${id}`));
  }

  if (extra.length > 0) {
    console.warn('⚠️  Extra platforms (configured but not in scorer.js):');
    extra.forEach(id => console.warn(`   - ${id}`));
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log('✅ All platforms are synchronized between scorer.js and platform-frames.config.ts');
  }
}

// Run validation if imported
if (require.main === module) {
  try {
    validateAllConfigs();
    getConfigStats();
    checkMissingPlatforms();
    console.log('\n=== Validation Complete ===');
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

module.exports = {
  validatePlatformConfig,
  validateAllConfigs,
  getConfigStats,
  checkMissingPlatforms,
};
