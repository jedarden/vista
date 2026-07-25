/**
 * Simple verification script for platform frames configuration
 *
 * This script performs basic structural checks on the configuration files
 * without requiring TypeScript compilation.
 */

const fs = require('fs');
const path = require('path');

function verifyConfigStructure() {
  console.log('=== Verifying Platform Frames Configuration Structure ===\n');

  const errors = [];
  const warnings = [];

  // Check that required files exist
  const requiredFiles = [
    'src/platform-frames.config.ts',
    'src/types/platform-frames-config.ts',
    'src/utils/platform-frames-validator.ts',
    'FRAME_STRUCTURE.md',
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      errors.push(`Missing required file: ${file}`);
    } else {
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (${stats.size} bytes, ${Math.round(stats.size / 1024)}KB)`);
    }
  }

  // Check configuration file structure
  const configPath = 'src/platform-frames.config.ts';
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Check for required exports
    const requiredExports = ['PLATFORM_FRAMES_CONFIG', 'getPlatformFrameConfig', 'getAllPlatformIds'];
    for (const exportName of requiredExports) {
      if (!configContent.includes(exportName)) {
        errors.push(`Missing export in config: ${exportName}`);
      }
    }

    // Check for platform count
    const platformMatches = configContent.match(/id:\s*['"](\w+)['"]/g);
    if (platformMatches) {
      const platformCount = platformMatches.length;
      console.log(`\n✅ Found ${platformCount} platform configurations`);

      if (platformCount < 40) {
        warnings.push(`Expected at least 43 platforms, found ${platformCount}`);
      }
    }

    // Check for frame types
    const frameTypes = ['social-feed', 'messaging', 'email', 'collaboration', 'content-feed', 'video-platform', 'image-focused', 'rss-reader', 'search-results', 'qa-forum', 'link-aggregator'];
    for (const frameType of frameTypes) {
      if (!configContent.includes(`frameType: '${frameType}'`)) {
        warnings.push(`No platform found with frameType: ${frameType}`);
      }
    }
  }

  // Check types file structure
  const typesPath = 'src/types/platform-frames-config.ts';
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');

    // Check for required type definitions
    const requiredTypes = ['PlatformFrameType', 'PlatformSourceCategory', 'PlatformFrameConfig', 'FrameStructureRequirements'];
    for (const typeName of requiredTypes) {
      if (!typesContent.includes(typeName)) {
        errors.push(`Missing type definition: ${typeName}`);
      }
    }

    console.log(`\n✅ Types file structure verified`);
  }

  // Check validator file structure
  const validatorPath = 'src/utils/platform-frames-validator.ts';
  if (fs.existsSync(validatorPath)) {
    const validatorContent = fs.readFileSync(validatorPath, 'utf8');

    // Check for required functions
    const requiredFunctions = ['validatePlatformConfig', 'validateAllConfigs', 'getConfigStats', 'platformExists'];
    for (const funcName of requiredFunctions) {
      if (!validatorContent.includes(funcName)) {
        errors.push(`Missing validator function: ${funcName}`);
      }
    }

    console.log(`\n✅ Validator file structure verified`);
  }

  // Check documentation
  const docsPath = 'FRAME_STRUCTURE.md';
  if (fs.existsSync(docsPath)) {
    const docsContent = fs.readFileSync(docsPath, 'utf8');

    // Check for required sections
    const requiredSections = ['Frame Type Categories', 'Configuration Structure', 'Template Syntax', 'Theme Variables'];
    for (const section of requiredSections) {
      if (!docsContent.includes(section)) {
        warnings.push(`Missing documentation section: ${section}`);
      }
    }

    console.log(`\n✅ Documentation structure verified`);
  }

  // Summary
  console.log('\n=== Verification Summary ===');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(err => console.error(`   - ${err}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warn => console.warn(`   - ${warn}`));
  }

  if (errors.length === 0) {
    console.log('\n✅ Platform frames configuration structure is valid!');
    return 0;
  } else {
    console.log('\n❌ Verification failed with errors');
    return 1;
  }
}

// Run verification
if (require.main === module) {
  const exitCode = verifyConfigStructure();
  process.exit(exitCode);
}

module.exports = { verifyConfigStructure };
