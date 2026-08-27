'use strict';

/**
 * Platform Frames Configuration — Browser Runtime Mirror
 *
 * This file is a hand-maintained 1:1 JavaScript mirror of the TypeScript source
 * of truth at `src/platform-frames.config.ts`. It exposes the SAME configuration
 * data and the SAME helper API to the browser, where `app.js` consumes it.
 *
 * Source of truth: src/platform-frames.config.ts
 *                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
 * If you add/remove/edit a platform here, make the identical change in the .ts
 * file (and vice versa). The two files MUST stay synchronized.
 *
 * Why a mirror? The browser cannot `import` a `.ts` file (this project ships no
 * TypeScript build step), so the TypeScript config is mirrored into a global
 * runtime module — the same pattern used by `platform-frames.js`, which mirrors
 * the richer per-platform chrome data. This mirror provides the platform-level
 * metadata (id, name, frameType, hasThemeSupport, aspectRatio) and is the single
 * source of truth for *which platforms are wired* into the context-frame system.
 *
 * Exposed as window globals (consumed by app.js's renderPlatformWithContext):
 *   - PLATFORM_FRAMES_CONFIG   : PlatformFrameConfig[]
 *   - getPlatformFrameConfig(id): PlatformFrameConfig | undefined
 *   - getAllPlatformIds()       : string[]
 *   - getAllPlatformFrameConfigs(): PlatformFrameConfig[]
 *   - getPlatformIdsByFrameType(type): string[]
 *   - getThemeablePlatformIds() : string[]
 *   - platformHasThemeSupport(id): boolean
 *   - getPlatformFrameType(id)  : frameType | undefined
 *   - PLATFORM_FRAMES_STATS     : aggregate statistics
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
//
// Mirror of PLATFORM_FRAMES_CONFIG in src/platform-frames.config.ts.
// Order matches the TypeScript source.
//
const PLATFORM_FRAMES_CONFIG = [
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
  {
    id: 'pinterest',
    name: 'Pinterest',
    frameType: 'image-focused',
    hasThemeSupport: true,
    aspectRatio: '2:3',
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'threads',
    name: 'Threads',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'discord',
    name: 'Discord',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'slack',
    name: 'Slack',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'imessage',
    name: 'iMessage',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'signal',
    name: 'Signal',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    frameType: 'email',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    frameType: 'email',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'github',
    name: 'GitHub',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    frameType: 'qa-forum',
    hasThemeSupport: true,
    aspectRatio: 'variable',
  },
];

// ============================================================================
// HELPERS — mirror of the src/platform-frames.config.ts API
// ============================================================================

/**
 * Get platform frame configuration by ID.
 * @param {string} platformId - Platform identifier (e.g., 'facebook', 'twitter')
 * @returns {object|undefined} Platform frame configuration or undefined if not found
 */
function getPlatformFrameConfig(platformId) {
  return PLATFORM_FRAMES_CONFIG.find(config => config.id === platformId);
}

/**
 * Get all platform frame configurations.
 * @returns {object[]} Array of all platform frame configurations (defensive copy)
 */
function getAllPlatformFrameConfigs() {
  return [...PLATFORM_FRAMES_CONFIG];
}

/**
 * Get platform IDs by frame type (chrome type).
 * @param {string} frameType - Frame type to filter by
 * @returns {string[]} Array of platform IDs that match the frame type
 */
function getPlatformIdsByFrameType(frameType) {
  return PLATFORM_FRAMES_CONFIG
    .filter(config => config.frameType === frameType)
    .map(config => config.id);
}

/**
 * Get platform IDs that support theme switching.
 * @returns {string[]} Array of platform IDs with theme support
 */
function getThemeablePlatformIds() {
  return PLATFORM_FRAMES_CONFIG
    .filter(config => config.hasThemeSupport)
    .map(config => config.id);
}

/**
 * Check if platform has theme support.
 * @param {string} platformId - Platform identifier
 * @returns {boolean} True if platform supports theme switching
 */
function platformHasThemeSupport(platformId) {
  const config = getPlatformFrameConfig(platformId);
  return config ? Boolean(config.hasThemeSupport) : false;
}

/**
 * Get platform frame type by ID.
 * @param {string} platformId - Platform identifier
 * @returns {string|undefined} Frame type (chrome type) or undefined if not found
 */
function getPlatformFrameType(platformId) {
  const config = getPlatformFrameConfig(platformId);
  return config ? config.frameType : undefined;
}

/**
 * Get all platform IDs.
 *
 * This is the canonical list of platforms wired into the context-frame system.
 * renderPlatformWithContext treats any platform NOT in this list as "not wired"
 * and falls back to the legacy/safe renderer.
 *
 * @returns {string[]} Array of all platform IDs
 */
function getAllPlatformIds() {
  return PLATFORM_FRAMES_CONFIG.map(config => config.id);
}

// ============================================================================
// STATISTICS — mirror of PLATFORM_FRAMES_STATS in the TypeScript source
// ============================================================================
const PLATFORM_FRAMES_STATS = {
  totalPlatforms: PLATFORM_FRAMES_CONFIG.length,
  platformsWithThemeSupport: PLATFORM_FRAMES_CONFIG.filter(c => c.hasThemeSupport).length,
  platformsByFrameType: PLATFORM_FRAMES_CONFIG.reduce((acc, config) => {
    acc[config.frameType] = (acc[config.frameType] || 0) + 1;
    return acc;
  }, {}),
};

// ============================================================================
// GLOBAL EXPORT
// ============================================================================
// Expose the configuration + API on `window` so app.js (and other runtime
// modules) can resolve platform frame metadata from the centralized config.
if (typeof window !== 'undefined') {
  window.PLATFORM_FRAMES_CONFIG = PLATFORM_FRAMES_CONFIG;
  window.getPlatformFrameConfig = getPlatformFrameConfig;
  window.getAllPlatformFrameConfigs = getAllPlatformFrameConfigs;
  window.getPlatformIdsByFrameType = getPlatformIdsByFrameType;
  window.getThemeablePlatformIds = getThemeablePlatformIds;
  window.platformHasThemeSupport = platformHasThemeSupport;
  window.getPlatformFrameType = getPlatformFrameType;
  window.getAllPlatformIds = getAllPlatformIds;
  window.PLATFORM_FRAMES_STATS = PLATFORM_FRAMES_STATS;
}
