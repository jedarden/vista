/**
 * Platform Frames Configuration
 *
 * Base configuration module for platform context frame rendering.
 * Maps platform IDs to their frame configuration metadata.
 */

import type {
  PlatformFramesConfig,
  PlatformFrameType,
  PlatformSourceCategory,
  FrameStructureRequirements,
} from '../types/platform-frames-config';

/**
 * Default structure requirements for each frame type
 */
const FRAME_TYPE_REQUIREMENTS: Record<PlatformFrameType, FrameStructureRequirements> = {
  'social-feed': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: true,
    usesCardLayout: true,
  },
  'messaging': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: false,
  },
  'email': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: true,
  },
  'collaboration': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: true,
  },
  'content-feed': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: true,
  },
  'video-platform': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: true,
    usesCardLayout: false,
  },
  'image-focused': {
    requiresChrome: true,
    requiresNeutralContent: false,
    supportsThemes: true,
    hasFixedAspectRatio: true,
    usesCardLayout: false,
  },
  'rss-reader': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: true,
  },
  'search-results': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: false,
    hasFixedAspectRatio: false,
    usesCardLayout: true,
  },
  'qa-forum': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: false,
  },
  'link-aggregator': {
    requiresChrome: true,
    requiresNeutralContent: true,
    supportsThemes: true,
    hasFixedAspectRatio: false,
    usesCardLayout: true,
  },
};

/**
 * Platform frames configuration
 *
 * Maps all platform IDs to their frame configuration data.
 * This is the base structure - platforms will be added incrementally.
 */
export const PLATFORM_FRAMES_CONFIG: PlatformFramesConfig = {};

/**
 * Get platform frame configuration by ID
 */
export function getPlatformFrameConfig(platformId: string) {
  return PLATFORM_FRAMES_CONFIG[platformId];
}

/**
 * Get all platform IDs
 */
export function getAllPlatformIds(): string[] {
  return Object.keys(PLATFORM_FRAMES_CONFIG);
}

/**
 * Get platforms by frame type
 */
export function getPlatformsByFrameType(frameType: PlatformFrameType): string[] {
  return getAllPlatformIds().filter(
    id => PLATFORM_FRAMES_CONFIG[id].frameType === frameType
  );
}

/**
 * Get platforms by source category
 */
export function getPlatformsBySourceCategory(category: PlatformSourceCategory): string[] {
  return getAllPlatformIds().filter(
    id => PLATFORM_FRAMES_CONFIG[id].sourceCategory === category
  );
}

/**
 * Check if platform has theme support
 */
export function platformHasThemeSupport(platformId: string): boolean {
  return PLATFORM_FRAMES_CONFIG[platformId]?.hasThemeSupport ?? false;
}
