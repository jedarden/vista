/**
 * Platform Frames Configuration Validator
 *
 * This module provides type-safe validation and helper functions for platform
 * frame configurations, ensuring data integrity and consistency.
 */

import type {
  PlatformFrameConfig,
  PlatformFrameType,
  PlatformSourceCategory,
  ValidationResult,
  ConfigStats,
} from '../types/platform-frames-config';
import { PLATFORM_FRAMES_CONFIG } from '../platform-frames.config';

/**
 * Valid platform frame types
 */
export const VALID_FRAME_TYPES: PlatformFrameType[] = [
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

/**
 * Valid source categories (from scorer.js)
 */
export const VALID_SOURCE_CATEGORIES: PlatformSourceCategory[] = [
  'Social & Microblogging',
  'Messaging',
  'Collaboration & Productivity',
  'Content Platforms',
  'Email',
  'RSS / Readers',
  'Developer Tools',
];

/**
 * Valid aspect ratios
 */
export const VALID_ASPECT_RATIOS = ['1:1', '1.91:1', '16:9', '9:16', '2:3', 'variable'];

/**
 * Required fields for PlatformFrameConfig
 */
export const REQUIRED_FIELDS: (keyof PlatformFrameConfig)[] = [
  'id',
  'name',
  'sourceCategory',
  'frameType',
  'hasThemeSupport',
  'aspectRatio',
  'structure',
];

/**
 * Validate a single platform frame configuration
 */
export function validatePlatformConfig(config: PlatformFrameConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate frame type
  if (config.frameType && !VALID_FRAME_TYPES.includes(config.frameType)) {
    errors.push(`Invalid frameType: ${config.frameType}. Must be one of: ${VALID_FRAME_TYPES.join(', ')}`);
  }

  // Validate source category
  if (config.sourceCategory && !VALID_SOURCE_CATEGORIES.includes(config.sourceCategory)) {
    errors.push(`Invalid sourceCategory: ${config.sourceCategory}. Must be one of: ${VALID_SOURCE_CATEGORIES.join(', ')}`);
  }

  // Validate aspect ratio
  if (config.aspectRatio && !VALID_ASPECT_RATIOS.includes(config.aspectRatio)) {
    errors.push(`Invalid aspectRatio: ${config.aspectRatio}. Must be one of: ${VALID_ASPECT_RATIOS.join(', ')}`);
  }

  // Validate hasThemeSupport is boolean
  if (typeof config.hasThemeSupport !== 'boolean') {
    errors.push(`hasThemeSupport must be a boolean, got: ${typeof config.hasThemeSupport}`);
  }

  // Validate structure object
  if (!config.structure) {
    errors.push('Missing structure field');
  } else {
    const requiredStructureFields = ['requiresChrome', 'requiresNeutralContent', 'supportsThemes', 'hasFixedAspectRatio', 'usesCardLayout'];
    for (const field of requiredStructureFields) {
      if (!(field in config.structure)) {
        errors.push(`Missing structure.${field} field`);
      } else if (typeof config.structure[field] !== 'boolean') {
        errors.push(`structure.${field} must be a boolean`);
      }
    }
  }

  // Check placeholder frame
  if (config.placeholderFrame) {
    if (typeof config.placeholderFrame.isStub !== 'boolean') {
      errors.push('placeholderFrame.isStub must be a boolean');
    }
    if (config.placeholderFrame.isStub === false && (!config.placeholderFrame.chrome || !config.placeholderFrame.neutralContent)) {
      warnings.push('Non-stub frame should have chrome and neutralContent templates');
    }
  }

  // Warnings for common issues
  if (!config.placeholderFrame) {
    warnings.push('No placeholderFrame defined - consider adding a stub for development');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all platform configurations
 */
export function validateAllConfigs(): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const [platformId, config] of Object.entries(PLATFORM_FRAMES_CONFIG)) {
    const result = validatePlatformConfig(config);

    if (result.errors.length > 0) {
      allErrors.push(`[${platformId}] ${result.errors.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      allWarnings.push(`[${platformId}] ${result.warnings.join(', ')}`);
    }

    // Check if ID matches config.id
    if (config.id !== platformId) {
      allErrors.push(`[${platformId}] Config ID mismatch: key is "${platformId}" but config.id is "${config.id}"`);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Get configuration statistics
 */
export function getConfigStats(): ConfigStats {
  const platformIds = Object.keys(PLATFORM_FRAMES_CONFIG);
  const totalPlatforms = platformIds.length;

  let platformsWithThemeSupport = 0;
  let implementedFrames = 0;
  let stubFrames = 0;

  const byFrameType: Record<PlatformFrameType, number> = {
    'social-feed': 0,
    'messaging': 0,
    'email': 0,
    'collaboration': 0,
    'content-feed': 0,
    'video-platform': 0,
    'image-focused': 0,
    'rss-reader': 0,
    'search-results': 0,
    'qa-forum': 0,
    'link-aggregator': 0,
  };

  const bySourceCategory: Record<PlatformSourceCategory, number> = {
    'Social & Microblogging': 0,
    'Messaging': 0,
    'Collaboration & Productivity': 0,
    'Content Platforms': 0,
    'Email': 0,
    'RSS / Readers': 0,
    'Developer Tools': 0,
  };

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

  return {
    totalPlatforms,
    platformsWithThemeSupport,
    byFrameType,
    bySourceCategory,
    implementedFrames,
    stubFrames,
  };
}

/**
 * Check if a platform ID exists in the configuration
 */
export function platformExists(platformId: string): boolean {
  return platformId in PLATFORM_FRAMES_CONFIG;
}

/**
 * Get all platforms missing from configuration that exist in scorer.js
 *
 * This helps identify gaps when new platforms are added to the scoring system
 * but not yet configured for frames.
 */
export function getMissingPlatformConfigs(expectedPlatformIds: string[]): string[] {
  return expectedPlatformIds.filter(id => !platformExists(id));
}

/**
 * Type guard to check if a value is a valid PlatformFrameType
 */
export function isValidFrameType(value: string): value is PlatformFrameType {
  return VALID_FRAME_TYPES.includes(value as PlatformFrameType);
}

/**
 * Type guard to check if a value is a valid PlatformSourceCategory
 */
export function isValidSourceCategory(value: string): value is PlatformSourceCategory {
  return VALID_SOURCE_CATEGORIES.includes(value as PlatformSourceCategory);
}

/**
 * Assert that a platform ID exists (throws if not)
 *
 * Useful for runtime validation in functions that require a valid platform ID.
 */
export function assertPlatformExists(platformId: string): void {
  if (!platformExists(platformId)) {
    throw new Error(`Invalid platform ID: ${platformId}. Valid platforms: ${Object.keys(PLATFORM_FRAMES_CONFIG).join(', ')}`);
  }
}

/**
 * Assert that a frame type is valid (throws if not)
 */
export function assertValidFrameType(frameType: string): asserts frameType is PlatformFrameType {
  if (!isValidFrameType(frameType)) {
    throw new Error(`Invalid frame type: ${frameType}. Valid types: ${VALID_FRAME_TYPES.join(', ')}`);
  }
}

/**
 * Assert that a source category is valid (throws if not)
 */
export function assertValidSourceCategory(category: string): asserts category is PlatformSourceCategory {
  if (!isValidSourceCategory(category)) {
    throw new Error(`Invalid source category: ${category}. Valid categories: ${VALID_SOURCE_CATEGORIES.join(', ')}`);
  }
}

/**
 * Runtime validation of the entire configuration module
 *
 * Call this at startup to ensure the configuration is valid.
 */
export function validateConfigurationModule(): ValidationResult {
  return validateAllConfigs();
}
