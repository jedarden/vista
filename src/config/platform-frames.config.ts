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
            <div class="rd-subreddit-name">r/webdev</div>
            <div class="rd-subreddit-meta">4.2m members · 3.1k online</div>
          </div>
          <button class="rd-join-btn">Join</button>
        </div>
      </div>
      <div class="rd-main-post">
        <div class="rd-upvote-section">
          <div class="rd-upvote-arrow">▲</div>
          <div class="rd-vote-count">2.4k</div>
          <div class="rd-downvote-arrow">▼</div>
        </div>
        <div class="rd-post-main">
          <div class="rd-post-meta">
            <span class="rd-subreddit-link">r/webdev</span>
            <span class="rd-post-author">• Posted by u/dev_enthusiast</span>
            <span class="rd-post-time">• 5h ago</span>
          </div>
          <div class="rd-post-title">{{title}}</div>
          {{linkPreview}}
          <div class="rd-post-actions">
            <span>💬 387 comments</span>
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
              <span class="rd-comment-time">2h ago</span>
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

  facebook: {
    id: 'facebook',
    name: 'Facebook',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    chrome: `<div class="fb-post-header">
        <div class="fb-avatar"></div>
        <div class="fb-post-meta">
          <span class="fb-author-name">Jane Smith</span>
          <span class="fb-post-time">2h · 🌍</span>
        </div>
        <span class="fb-menu">•••</span>
      </div>
      <div class="fb-post-content">Check out this interesting article!</div>
      {{linkPreview}}
      <div class="fb-post-stats">👍 24 · 💬 8 · 🔗 5</div>`,
    neutralContent: `Check out this interesting article!`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - avatar, author name, timestamp, menu, link preview, reactions (like, comment, share)',
    },
  },

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    chrome: `<div class="li-post-header">
        <div class="li-avatar"></div>
        <div class="li-post-meta">
          <span class="li-author-name">Sarah Chen</span>
          <span class="li-post-headline">Product Manager at Tech Corp</span>
          <span class="li-post-time">2h · 🌐</span>
        </div>
      </div>
      <div class="li-post-content">Great article on industry trends!</div>
      {{linkPreview}}
      <div class="li-post-stats">👍 45 · 💬 12 · 🔁 8</div>`,
    neutralContent: `Great article on industry trends!`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - avatar, author name, headline, timestamp, link preview, reactions (like, comment, repost)',
    },
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram',
    sourceCategory: 'Social & Microblogging',
    frameType: 'image-focused',
    hasThemeSupport: true,
    aspectRatio: '1:1',
    structure: FRAME_TYPE_REQUIREMENTS['image-focused'],
    chrome: `<div class="ig-post-header">
        <div class="ig-avatar"></div>
        <div class="ig-post-meta">
          <span class="ig-username">travel_photographer</span>
          <span class="ig-post-time">2 hours ago</span>
        </div>
        <span class="ig-menu">•••</span>
      </div>
      {{linkPreview}}
      <div class="ig-post-content">
        <div class="ig-caption">Check out this amazing view! 📸</div>
        <div class="ig-hashtags">#travel #photography #adventure</div>
      </div>
      <div class="ig-post-actions">♡ 124 · 💬 18 · 🔗 Share</div>`,
    neutralContent: `Check out this amazing view! 📸`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - avatar, username, timestamp, menu, image/video preview, caption, hashtags, reactions (like, comment, share)',
    },
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube',
    sourceCategory: 'Social & Microblogging',
    frameType: 'video-platform',
    hasThemeSupport: true,
    aspectRatio: '16:9',
    structure: FRAME_TYPE_REQUIREMENTS['video-platform'],
    chrome: `<div class="yt-video-player">
        <div class="yt-video-placeholder">▶</div>
        <div class="yt-video-overlay">
          <div class="yt-progress-bar">
            <div class="yt-progress-filled" style="width: 35%;"></div>
          </div>
          <div class="yt-player-controls">
            <button class="yt-control-btn">⏮</button>
            <button class="yt-control-btn">▶️</button>
            <button class="yt-control-btn">⏭</button>
            <div class="yt-volume-control">
              <button class="yt-control-btn">🔊</button>
              <div class="yt-volume-slider">
                <div class="yt-volume-level" style="width: 70%;"></div>
              </div>
            </div>
            <div class="yt-time-display">3:45 / 10:23</div>
            <button class="yt-control-btn">⚙️</button>
            <button class="yt-control-btn yt-fullscreen-btn">⛶</button>
          </div>
        </div>
      </div>
      <div class="yt-video-header">
        <div class="yt-channel-avatar"></div>
        <div class="yt-channel-meta">
          <span class="yt-channel-name">TechChannel</span>
          <span class="yt-subscriber-count">1.2M subscribers</span>
        </div>
        <button class="yt-subscribe-btn">Subscribe</button>
      </div>
      <div class="yt-video-title">Amazing Tutorial - Learn in 10 Minutes!</div>
      <div class="yt-video-stats">234K views · 3 hours ago</div>
      <div class="yt-actions-bar">
        <button class="yt-action-btn">
          <span class="yt-action-icon">👍</span>
          <span class="yt-action-label">Like</span>
        </button>
        <button class="yt-action-btn">
          <span class="yt-action-icon">👎</span>
          <span class="yt-action-label">Dislike</span>
        </button>
        <button class="yt-action-btn">
          <span class="yt-action-icon">↗️</span>
          <span class="yt-action-label">Share</span>
        </button>
        <button class="yt-action-btn">
          <span class="yt-action-icon">⬇️</span>
          <span class="yt-action-label">Download</span>
        </button>
        <button class="yt-action-btn">
          <span class="yt-action-icon">✂️</span>
          <span class="yt-action-label">Clip</span>
        </button>
        <button class="yt-action-btn">
          <span class="yt-action-icon">💾</span>
          <span class="yt-action-label">Save</span>
        </button>
        <button class="yt-action-btn">
          <span class="yt-action-icon">•••</span>
          <span class="yt-action-label">More</span>
        </button>
      </div>
      <div class="yt-description-section">
        <div class="yt-description-text">In this video, I'll show you how to get started with this amazing tool. Perfect for beginners! #tutorial #howto</div>
        <div class="yt-description-meta">
          <span>👍 12K</span>
          <span>👁️ 234K views</span>
          <span>📅 3 hours ago</span>
        </div>
        {{linkCards}}
      </div>
      <div class="yt-comments-section">
        <div class="yt-comment-header">Comments</div>
        <div class="yt-comment yt-comment-dim">
          <div class="yt-comment-avatar"></div>
          <div class="yt-comment-meta">
            <span class="yt-comment-author">User123</span>
            <span class="yt-comment-time">2 hours ago</span>
            <div class="yt-comment-text">This was really helpful, thanks!</div>
            <div class="yt-comment-actions">👍 45 · 💬 Reply</div>
          </div>
        </div>
        {{userComment}}
      </div>`,
    neutralContent: `<div class="yt-comment">
        <div class="yt-comment-avatar"></div>
        <div class="yt-comment-meta">
          <span class="yt-comment-author">You</span>
          <span class="yt-comment-time">Just now</span>
          <div class="yt-comment-text">{{description}}</div>
          <div class="yt-comment-actions">👍 0 · 💬 Reply</div>
        </div>
      </div>`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - video player, progress bar, controls, channel info, subscribe button, title, stats, actions, description, comments section',
    },
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    sourceCategory: 'Social & Microblogging',
    frameType: 'video-platform',
    hasThemeSupport: true,
    aspectRatio: '9:16',
    structure: FRAME_TYPE_REQUIREMENTS['video-platform'],
    chrome: `<div class="tt-video-container">
        <div class="tt-video-placeholder"><span class="tt-play-overlay">▶</span></div>
        <div class="tt-right-sidebar">
          <div class="tt-action-btn">
            <span class="tt-action-icon">♡</span>
            <span class="tt-action-count">24</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">💬</span>
            <span class="tt-action-count">8</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">↗</span>
            <span class="tt-action-count">12</span>
          </div>
        </div>
        <div class="tt-bottom-overlay">
          <div class="tt-username">@tiktok_user</div>
          <div class="tt-caption">Check out this amazing content! 🔗</div>
          <div class="tt-music">🎵 Original Sound - Artist</div>
        </div>
      </div>`,
    neutralContent: `Check out this amazing content! 🔗`,
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - vertical video player, right sidebar actions (like, comment, share), bottom overlay with username, caption, music',
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
