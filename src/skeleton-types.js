'use strict';

/**
 * Platform Skeleton Types
 *
 * Defines the three skeleton types for platform cards:
 * - TALL: Image-on-top layout (Facebook, Twitter, LinkedIn, Reddit, etc.)
 * - SHORT: Thumbnail-left layout (WhatsApp, Slack, Discord, iMessage, etc.)
 * - TEXT_ONLY: No image region (Google)
 */

const SKELETON_TYPES = {
  TALL: 'tall',
  SHORT: 'short',
  TEXT_ONLY: 'text_only'
};

/**
 * Platform to skeleton type mapping
 * Maps each of the 31 platforms to its appropriate skeleton type
 */
const PLATFORM_SKELETON_MAP = {
  // Social & Microblogging
  'google': SKELETON_TYPES.TEXT_ONLY,
  'facebook': SKELETON_TYPES.TALL,
  'twitter': SKELETON_TYPES.TALL,
  'linkedin': SKELETON_TYPES.TALL,
  'reddit': SKELETON_TYPES.TALL,
  'mastodon': SKELETON_TYPES.TALL,
  'bluesky': SKELETON_TYPES.TALL,
  'threads': SKELETON_TYPES.TALL,
  'tumblr': SKELETON_TYPES.TALL,
  'pinterest': SKELETON_TYPES.TALL,

  // Messaging - thumbnail-left for compact messaging apps
  'slack': SKELETON_TYPES.SHORT,
  'discord': SKELETON_TYPES.SHORT,
  'whatsapp': SKELETON_TYPES.SHORT,
  'imessage': SKELETON_TYPES.SHORT,
  'telegram': SKELETON_TYPES.SHORT,
  'signal': SKELETON_TYPES.SHORT,
  'teams': SKELETON_TYPES.SHORT,
  'googlechat': SKELETON_TYPES.SHORT,
  'zoom': SKELETON_TYPES.SHORT,
  'line': SKELETON_TYPES.SHORT,
  'kakaotalk': SKELETON_TYPES.SHORT,

  // Collaboration - thumbnail-left for productivity tools
  'notion': SKELETON_TYPES.SHORT,
  'jira': SKELETON_TYPES.SHORT,
  'github': SKELETON_TYPES.SHORT,
  'trello': SKELETON_TYPES.SHORT,
  'figma': SKELETON_TYPES.SHORT,

  // Content Platforms - tall for content sharing
  'medium': SKELETON_TYPES.TALL,
  'substack': SKELETON_TYPES.TALL,

  // Email - thumbnail-left for email previews
  'outlook': SKELETON_TYPES.SHORT,
  'gmail': SKELETON_TYPES.SHORT,

  // RSS - thumbnail-left for feed readers
  'feedly': SKELETON_TYPES.SHORT,

  // Productivity & Project Management - thumbnail-left
  'asana': SKELETON_TYPES.SHORT,
  'evernote': SKELETON_TYPES.SHORT,

  // Content Platforms - tall for article/blog content
  'devto': SKELETON_TYPES.TALL,

  // Code Repositories - thumbnail-left
  'gitlab': SKELETON_TYPES.SHORT,

  // Social & Discussion - tall for content-heavy feeds
  'hackernews': SKELETON_TYPES.TALL,

  // Image & Video Platforms - tall for media content
  'instagram': SKELETON_TYPES.TALL,
  'tiktok': SKELETON_TYPES.TALL,
  'youtube': SKELETON_TYPES.TALL,

  // Development Tools - thumbnail-left
  'jetbrains': SKELETON_TYPES.SHORT,
  'vscode': SKELETON_TYPES.SHORT,

  // Product Discovery - tall for product cards
  'producthunt': SKELETON_TYPES.TALL,

  // Q&A - thumbnail-left for text-focused content
  'stackoverflow': SKELETON_TYPES.SHORT,
};

/**
 * Get the skeleton type for a given platform
 *
 * @param {string} platformId - The platform ID (e.g., 'facebook', 'twitter')
 * @returns {string} The skeleton type (SKELETON_TYPES.TALL, SHORT, or TEXT_ONLY)
 * @throws {Error} If the platform ID is not recognized
 */
function getSkeletonType(platformId) {
  const skeletonType = PLATFORM_SKELETON_MAP[platformId];

  if (!skeletonType) {
    throw new Error(`Unknown platform ID: ${platformId}`);
  }

  return skeletonType;
}

/**
 * Get all platforms for a given skeleton type
 *
 * @param {string} skeletonType - The skeleton type to filter by
 * @returns {string[]} Array of platform IDs that match the skeleton type
 */
function getPlatformsBySkeletonType(skeletonType) {
  return Object.entries(PLATFORM_SKELETON_MAP)
    .filter(([_, type]) => type === skeletonType)
    .map(([platformId, _]) => platformId);
}

/**
 * Check if a platform uses a tall skeleton type
 *
 * @param {string} platformId - The platform ID
 * @returns {boolean} True if the platform uses tall skeleton type
 */
function isTallSkeleton(platformId) {
  return getSkeletonType(platformId) === SKELETON_TYPES.TALL;
}

/**
 * Check if a platform uses a short skeleton type
 *
 * @param {string} platformId - The platform ID
 * @returns {boolean} True if the platform uses short skeleton type
 */
function isShortSkeleton(platformId) {
  return getSkeletonType(platformId) === SKELETON_TYPES.SHORT;
}

/**
 * Check if a platform uses a text-only skeleton type
 *
 * @param {string} platformId - The platform ID
 * @returns {boolean} True if the platform uses text-only skeleton type
 */
function isTextOnlySkeleton(platformId) {
  return getSkeletonType(platformId) === SKELETON_TYPES.TEXT_ONLY;
}

module.exports = {
  SKELETON_TYPES,
  PLATFORM_SKELETON_MAP,
  getSkeletonType,
  getPlatformsBySkeletonType,
  isTallSkeleton,
  isShortSkeleton,
  isTextOnlySkeleton,
};
