/**
 * Platform Frames Configuration
 *
 * Configuration file for the 7 implemented platform frame components.
 * Defines metadata, chrome types, and theme support for each platform.
 *
 * This configuration is used by renderPlatformWithContext and other
 * platform frame rendering utilities.
 */

import type { BasePlatformFrame } from './platform-frames/base-frame';

/**
 * Platform frame configuration interface
 */
export interface PlatformFrameConfig {
  /** Platform identifier (matches scorer.js platform ID) */
  id: string;

  /** Platform display name */
  name: string;

  /** Frame component type identifier (chrome type) */
  frameType: 'social-feed' | 'messaging' | 'video-platform' |
                'image-focused' | 'link-aggregator' | 'content-feed' |
                'collaboration' | 'email' | 'rss-reader' | 'qa-forum';

  /** Whether the platform supports theme switching (dark/light mode) */
  hasThemeSupport: boolean;

  /** Preferred aspect ratio for frame rendering */
  aspectRatio: '1:1' | '1.91:1' | '16:9' | '9:16' | '2:3' | 'variable';
}

/**
 * Platform frames configuration array
 *
 * Contains metadata for all 7 implemented platform frame components.
 * This is the core configuration used by the platform frame rendering system.
 */
export const PLATFORM_FRAMES_CONFIG: PlatformFrameConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    frameType: 'link-aggregator',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    frameType: 'video-platform',
    hasThemeSupport: true,
    aspectRatio: '16:9',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    frameType: 'image-focused',
    hasThemeSupport: true,
    aspectRatio: '1:1',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    frameType: 'video-platform',
    hasThemeSupport: true,
    aspectRatio: '9:16',
  },
];

/**
 * Get platform frame configuration by ID
 *
 * @param platformId - Platform identifier (e.g., 'facebook', 'twitter')
 * @returns Platform frame configuration or undefined if not found
 */
export function getPlatformFrameConfig(platformId: string): PlatformFrameConfig | undefined {
  return PLATFORM_FRAMES_CONFIG.find(config => config.id === platformId);
}

/**
 * Get all platform frame configurations
 *
 * @returns Array of all platform frame configurations
 */
export function getAllPlatformFrameConfigs(): PlatformFrameConfig[] {
  return [...PLATFORM_FRAMES_CONFIG];
}

/**
 * Get platform IDs by frame type (chrome type)
 *
 * @param frameType - Frame type to filter by
 * @returns Array of platform IDs that match the frame type
 */
export function getPlatformIdsByFrameType(
  frameType: PlatformFrameConfig['frameType']
): string[] {
  return PLATFORM_FRAMES_CONFIG
    .filter(config => config.frameType === frameType)
    .map(config => config.id);
}

/**
 * Get platform IDs that support theme switching
 *
 * @returns Array of platform IDs with theme support
 */
export function getThemeablePlatformIds(): string[] {
  return PLATFORM_FRAMES_CONFIG
    .filter(config => config.hasThemeSupport)
    .map(config => config.id);
}

/**
 * Check if platform has theme support
 *
 * @param platformId - Platform identifier
 * @returns True if platform supports theme switching
 */
export function platformHasThemeSupport(platformId: string): boolean {
  const config = getPlatformFrameConfig(platformId);
  return config?.hasThemeSupport ?? false;
}

/**
 * Get platform frame type by ID
 *
 * @param platformId - Platform identifier
 * @returns Frame type (chrome type) or undefined if not found
 */
export function getPlatformFrameType(platformId: string): PlatformFrameConfig['frameType'] | undefined {
  const config = getPlatformFrameConfig(platformId);
  return config?.frameType;
}

/**
 * Get all platform IDs
 *
 * @returns Array of all platform IDs
 */
export function getAllPlatformIds(): string[] {
  return PLATFORM_FRAMES_CONFIG.map(config => config.id);
}

/**
 * Platform frame configuration statistics
 */
export const PLATFORM_FRAMES_STATS = {
  totalPlatforms: PLATFORM_FRAMES_CONFIG.length,
  platformsWithThemeSupport: PLATFORM_FRAMES_CONFIG.filter(c => c.hasThemeSupport).length,
  platformsByFrameType: PLATFORM_FRAMES_CONFIG.reduce((acc, config) => {
    acc[config.frameType] = (acc[config.frameType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
};

export default PLATFORM_FRAMES_CONFIG;
