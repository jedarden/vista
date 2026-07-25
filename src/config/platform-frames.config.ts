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
export const PLATFORM_FRAMES_CONFIG: PlatformFramesConfig = {
  // ========== Social & Microblogging ==========
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    sourceCategory: 'Social & Microblogging',
    frameType: 'link-aggregator',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['link-aggregator'],
    chrome: `<div class="rd-subreddit-header">
        <div class="rd-subreddit-banner"></div>
        <div class="rd-subreddit-info">
          <div class="rd-subreddit-icon">r/</div>
          <div class="rd-subreddit-details">
            <div class="rd-subreddit-name">r/{{subreddit}}</div>
            <div class="rd-subreddit-meta">{{memberCount}} members · {{onlineCount}} online</div>
          </div>
          <button class="rd-join-btn">Join</button>
        </div>
      </div>
      <div class="rd-main-post">
        <div class="rd-upvote-section">
          <div class="rd-upvote-arrow">▲</div>
          <div class="rd-vote-count">{{upvotes}}</div>
          <div class="rd-downvote-arrow">▼</div>
        </div>
        <div class="rd-post-main">
          <div class="rd-post-meta">
            <span class="rd-subreddit-link">r/{{subreddit}}</span>
            <span class="rd-post-author">• Posted by u/{{author}}</span>
            <span class="rd-post-time">• {{timeAgo}}</span>
          </div>
          <div class="rd-post-title">{{title}}</div>
          {{linkPreview}}
          <div class="rd-post-actions">
            <span>💬 {{commentCount}} comments</span>
            <span>🔗 Share</span>
            <span>💾 Save</span>
          </div>
        </div>
      </div>
      <div class="rd-comments-section">
        <div class="rd-comments-header">Comments</div>
        <div class="rd-comment rd-comment-dim">
          <div class="rd-comment-avatar"></div>
          <div class="rd-comment-content">
            <div class="rd-comment-meta">
              <span class="rd-comment-author">Redditor</span>
              <span class="rd-comment-time">{{timeAgo}}</span>
            </div>
            <div class="rd-comment-body">Great discussion topic! Thanks for posting.</div>
          </div>
        </div>
        {{userComment}}
      </div>`,
    neutralContent: `<div class="rd-comment">
        <div class="rd-comment-avatar"></div>
        <div class="rd-comment-content">
          <div class="rd-comment-meta">
            <span class="rd-comment-author">You</span>
            <span class="rd-comment-time">Just now</span>
          </div>
          <div class="rd-comment-body">{{comment}}</div>
        </div>
      </div>`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - subreddit header, banner, upvote/downvote arrows, vote counts, comments, link preview',
    },
  },

  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    chrome: `<div class="tw-post-header">
        <div class="tw-avatar"></div>
        <div class="tw-post-meta">
          <span class="tw-author-name">{{author}}</span>
          <span class="tw-verified">✓</span>
          <span class="tw-author-handle">@{{handle}}</span>
          <span class="tw-post-time">· {{timeAgo}}</span>
        </div>
      </div>
      <div class="tw-post-content">{{userMessage}}</div>
      <div class="tw-link-card">
        <div class="tw-context-placeholder"></div>
        <div class="tw-context-meta">
          <div class="tw-context-title">{{title}}</div>
          <div class="tw-context-domain">{{domain}}</div>
        </div>
      </div>
      <div class="tw-post-actions">
        <div class="tw-post-action-item"><span class="tw-action-icon">💬</span> <span class="tw-action-count">{{replyCount}}</span></div>
        <div class="tw-post-action-item"><span class="tw-action-icon">🔁</span> <span class="tw-action-count">{{retweetCount}}</span></div>
        <div class="tw-post-action-item"><span class="tw-action-icon">❤️</span> <span class="tw-action-count">{{likeCount}}</span></div>
        <div class="tw-post-action-item"><span class="tw-action-icon">👁️</span> <span class="tw-action-count">{{viewCount}}</span></div>
      </div>`,
    neutralContent: `Check this out!`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - avatar, name, handle, verified badge, timestamp, content, link preview card, reply/retweet/like actions',
    },
  },
};

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
