/**
 * Platform Frames Component Library
 *
 * Main export file for all platform frame components.
 * Provides a unified interface for importing and using platform frames.
 *
 * @example
 * import { facebookFrame, twitterFrame, renderPlatformFrame } from './platform-frames';
 *
 * const html = renderPlatformFrame('facebook', { title: 'Hello' }, 'light');
 */

// Export base interfaces and utilities
export {
  BasePlatformFrame,
  PlatformBrandColors,
  LayoutPattern,
  DEFAULT_BRAND_COLORS,
  getDefaultBrandColors,
  createPlatformFrameStub,
} from './base-frame';

// Export individual platform frame components - Social
export { FacebookFrame, facebookFrame, createFacebookFrame } from './facebook-frame';
export { TwitterFrame, twitterFrame, createTwitterFrame } from './twitter-frame';
export { LinkedInFrame, linkedinFrame, createLinkedInFrame } from './linkedin-frame';
export { RedditFrame, redditFrame, createRedditFrame } from './reddit-frame';
export { YouTubeFrame, youtubeFrame, createYouTubeFrame } from './youtube-frame';
export { InstagramFrame, instagramFrame, createInstagramFrame } from './instagram-frame';
export { TikTokFrame, tiktokFrame, createTikTokFrame } from './tiktok-frame';

// Export individual platform frame components - Messaging
export { DiscordFrame, discordFrame } from './discord-frame';
export { SlackFrame, slackFrame } from './slack-frame';
export {
  IMessageFrame,
  WhatsAppFrame,
  TelegramFrame,
  SignalFrame,
  TeamsFrame,
  MatrixFrame,
} from './messaging-frames';

// Import messaging platform frames
import { DiscordFrame, discordFrame } from './discord-frame';
import { SlackFrame, slackFrame } from './slack-frame';
import {
  IMessageFrame,
  WhatsAppFrame,
  TelegramFrame,
  SignalFrame,
  TeamsFrame,
  MatrixFrame,
} from './messaging-frames';

// Create singleton instances for messaging frames
const imessageFrame = new IMessageFrame();
const whatsappFrame = new WhatsAppFrame();
const telegramFrame = new TelegramFrame();
const signalFrame = new SignalFrame();
const teamsFrame = new TeamsFrame();
const matrixFrame = new MatrixFrame();

// Import type definitions
import type { BasePlatformFrame } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Registry of all available platform frame components
 */
const PLATFORM_FRAME_REGISTRY: Record<string, BasePlatformFrame> = {
  // Social platforms
  facebook: facebookFrame,
  twitter: twitterFrame,
  linkedin: linkedinFrame,
  reddit: redditFrame,
  youtube: youtubeFrame,
  instagram: instagramFrame,
  tiktok: tiktokFrame,
  // Messaging platforms
  discord: discordFrame,
  slack: slackFrame,
  imessage: imessageFrame,
  whatsapp: whatsappFrame,
  telegram: telegramFrame,
  signal: signalFrame,
  teams: teamsFrame,
  matrix: matrixFrame,
};

/**
 * Get a platform frame component by ID
 *
 * @param platformId - Platform identifier (e.g., 'facebook', 'twitter')
 * @returns Platform frame component or undefined if not found
 */
export function getPlatformFrame(platformId: string): BasePlatformFrame | undefined {
  return PLATFORM_FRAME_REGISTRY[platformId];
}

/**
 * Get all available platform frame components
 *
 * @returns Array of all platform frame components
 */
export function getAllPlatformFrames(): BasePlatformFrame[] {
  return Object.values(PLATFORM_FRAME_REGISTRY);
}

/**
 * Get all available platform IDs
 *
 * @returns Array of platform IDs
 */
export function getAllPlatformIds(): string[] {
  return Object.keys(PLATFORM_FRAME_REGISTRY);
}

/**
 * Check if a platform frame is available
 *
 * @param platformId - Platform identifier
 * @returns True if platform frame is available
 */
export function hasPlatformFrame(platformId: string): boolean {
  return platformId in PLATFORM_FRAME_REGISTRY;
}

/**
 * Render a platform frame with content
 *
 * @param platformId - Platform identifier
 * @param content - Content data to render
 * @param theme - Theme mode (dark or light)
 * @returns HTML string of rendered frame or error message
 */
export function renderPlatformFrame(
  platformId: string,
  content: FrameContentData,
  theme: ThemeMode = 'dark'
): string {
  const frame = getPlatformFrame(platformId);

  if (!frame) {
    return `<div class="platform-frame-error">
      <p>Platform frame not found: ${platformId}</p>
      <p>Available platforms: ${getAllPlatformIds().join(', ')}</p>
    </div>`;
  }

  if (!frame.validateContent(content)) {
    return `<div class="platform-frame-error">
      <p>Invalid content for platform: ${platformId}</p>
      <p>Please provide valid content data.</p>
    </div>`;
  }

  return frame.render(content, theme);
}

/**
 * Render platform frame chrome only (without content)
 *
 * @param platformId - Platform identifier
 * @param theme - Theme mode (dark or light)
 * @returns HTML string of rendered chrome or error message
 */
export function renderPlatformChrome(
  platformId: string,
  theme: ThemeMode = 'dark'
): string {
  const frame = getPlatformFrame(platformId);

  if (!frame) {
    return `<div class="platform-frame-error">
      <p>Platform frame not found: ${platformId}</p>
    </div>`;
  }

  return frame.renderChrome(theme);
}

/**
 * Get theme variables for a platform
 *
 * @param platformId - Platform identifier
 * @param theme - Theme mode (dark or light)
 * @returns CSS variables object or empty object if platform not found
 */
export function getPlatformThemeVars(
  platformId: string,
  theme: ThemeMode = 'dark'
): Record<string, string> {
  const frame = getPlatformFrame(platformId);
  return frame ? frame.getThemeVars(theme) : {};
}

/**
 * Check if platform supports theme switching
 *
 * @param platformId - Platform identifier
 * @returns True if platform supports theme switching
 */
export function platformSupportsThemes(platformId: string): boolean {
  const frame = getPlatformFrame(platformId);
  return frame ? frame.hasThemeSupport : false;
}

/**
 * Get platform frame metadata
 *
 * @param platformId - Platform identifier
 * @returns Platform metadata or undefined if not found
 */
export function getPlatformMetadata(platformId: string) {
  const frame = getPlatformFrame(platformId);

  if (!frame) {
    return undefined;
  }

  return {
    id: frame.platformId,
    name: frame.platformName,
    frameType: frame.frameType,
    hasThemeSupport: frame.hasThemeSupport,
    aspectRatio: frame.aspectRatio,
    brandColors: frame.brandColors,
    layoutPattern: frame.layoutPattern,
  };
}

/**
 * Get all platforms by frame type
 *
 * @param frameType - Frame type to filter by
 * @returns Array of platform frame components matching the frame type
 */
export function getPlatformsByFrameType(
  frameType: BasePlatformFrame['frameType']
): BasePlatformFrame[] {
  return getAllPlatformFrames().filter(frame => frame.frameType === frameType);
}

/**
 * Get platforms that support theme switching
 *
 * @returns Array of platform IDs that support theme switching
 */
export function getPlatformsWithThemeSupport(): string[] {
  return getAllPlatformFrames()
    .filter(frame => frame.hasThemeSupport)
    .map(frame => frame.platformId);
}

/**
 * Platform Frames API
 *
 * Main interface for the platform frames component library.
 */
export const PlatformFramesAPI = {
  // Registry access
  get: getPlatformFrame,
  getAll: getAllPlatformFrames,
  getIds: getAllPlatformIds,
  has: hasPlatformFrame,

  // Rendering
  render: renderPlatformFrame,
  renderChrome: renderPlatformChrome,

  // Theme support
  getThemeVars: getPlatformThemeVars,
  supportsThemes: platformSupportsThemes,
  getWithThemeSupport: getPlatformsWithThemeSupport,

  // Metadata
  getMetadata: getPlatformMetadata,
  getByFrameType: getPlatformsByFrameType,

  // Direct component access
  components: PLATFORM_FRAME_REGISTRY,
};

export default PlatformFramesAPI;
