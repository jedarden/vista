/**
 * Platform Frames Configuration
 *
 * This module maps all 43 platforms to their frame type categories and provides
 * configuration data for platform context frame rendering.
 *
 * Frame types determine the structure and rendering approach for each platform's
 * context frames, including chrome HTML, theme support, and layout patterns.
 */

import type {
  PlatformFramesConfig,
  PlatformFrameType,
  PlatformSourceCategory,
  FrameStructureRequirements,
} from './types/platform-frames-config';

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
    requiresNeutralContent: false, // Link preview is the main content
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
 * Map platforms from scorer.js to their frame type configurations
 *
 * This configuration maps all 43 platforms from the scoring system to their
 * appropriate frame type categories based on their UI patterns and content structure.
 */
export const PLATFORM_FRAMES_CONFIG: PlatformFramesConfig = {
  // ========== Social & Microblogging ==========
  google: {
    id: 'google',
    name: 'Google Search',
    sourceCategory: 'Social & Microblogging',
    frameType: 'search-results',
    hasThemeSupport: false, // Google SERPs don't have theme toggle
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['search-results'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'SERP layout with title, description, URL breadcrumb',
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
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - avatar, username, timestamp, reactions, link preview',
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

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with professional layout - avatar, name, headline, network indicators',
    },
  },

  reddit: {
    id: 'reddit',
    name: 'Reddit',
    sourceCategory: 'Social & Microblogging',
    frameType: 'link-aggregator',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['link-aggregator'],
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - subreddit header, banner, upvote/downvote arrows, vote counts, comments, link preview',
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
      implementationNotes: 'Complete with realistic chrome - video player with controls, channel avatar/name/subscriber count/subscribe button, video title, view count and timestamp, like/dislike/share/download/clip/save actions, description section with hashtags and metadata, comments section with user comments',
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
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with gradient styling - avatar, username, caption, hashtags, heart icon',
    },
  },

  threads: {
    id: 'threads',
    name: 'Threads',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Thread post with avatar, username, timestamp, link preview',
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
        <div class="tt-video-placeholder"></div>
        <div class="tt-right-sidebar">
          <div class="tt-action-btn">
            <span class="tt-action-icon">♡</span>
            <span class="tt-action-count">24K</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">💬</span>
            <span class="tt-action-count">1.2K</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">↗</span>
            <span class="tt-action-count">8.5K</span>
          </div>
          <div class="tt-action-btn">
            <span class="tt-action-icon">💾</span>
            <span class="tt-action-count">3.2K</span>
          </div>
        </div>
        <div class="tt-bottom-overlay">
          <div class="tt-username">@tiktok_creator</div>
          <div class="tt-caption">Check out this amazing content! 🔗 #fyp #viral #trending</div>
          <div class="tt-music">🎵 Original Sound - Artist Name</div>
          <div class="tt-video-meta">2.3M views · Posted 3 hours ago</div>
        </div>
      </div>`,
    neutralContent: '',
    placeholderFrame: {
      isStub: false,
      implementationNotes: 'Complete with realistic chrome - vertical video container, right sidebar with like/comment/share/save buttons and counts, bottom overlay with username, caption with hashtags, music info, and view count/timestamp',
    },
  },

  producthunt: {
    id: 'producthunt',
    name: 'Product Hunt',
    sourceCategory: 'Social & Microblogging',
    frameType: 'link-aggregator',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['link-aggregator'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Product card with thumbnail, title, tagline, upvotes',
    },
  },

  mastodon: {
    id: 'mastodon',
    name: 'Mastodon',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Toot with avatar, display name, handle, timestamp, link preview',
    },
  },

  bluesky: {
    id: 'bluesky',
    name: 'Bluesky',
    sourceCategory: 'Social & Microblogging',
    frameType: 'social-feed',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    structure: FRAME_TYPE_REQUIREMENTS['social-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Post with avatar, display name, handle, timestamp, link preview',
    },
  },

  hackernews: {
    id: 'hackernews',
    name: 'Hacker News',
    sourceCategory: 'Social & Microblogging',
    frameType: 'link-aggregator',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['link-aggregator'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Minimal list with upvotes, title, domain, points, comments',
    },
  },

  tumblr: {
    id: 'tumblr',
    name: 'Tumblr',
    sourceCategory: 'Social & Microblogging',
    frameType: 'content-feed',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['content-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Blog post with blog name, avatar, content, tags, notes',
    },
  },

  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    sourceCategory: 'Social & Microblogging',
    frameType: 'image-focused',
    hasThemeSupport: true,
    aspectRatio: '2:3',
    structure: FRAME_TYPE_REQUIREMENTS['image-focused'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Pin with image, title, description, saves, user',
    },
  },

  // ========== Messaging ==========
  slack: {
    id: 'slack',
    name: 'Slack',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Channel message with avatar, username, timestamp, link preview',
    },
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Server/channel message with avatar, username, timestamp, embed',
    },
  },

  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Chat bubble with phone number/contact name, timestamp, link preview',
    },
  },

  imessage: {
    id: 'imessage',
    name: 'iMessage',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Message bubble with contact name, timestamp, link preview',
    },
  },

  telegram: {
    id: 'telegram',
    name: 'Telegram',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Chat message with avatar, name, timestamp, link preview',
    },
  },

  signal: {
    id: 'signal',
    name: 'Signal',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Message with contact name, timestamp, link preview',
    },
  },

  teams: {
    id: 'teams',
    name: 'Microsoft Teams',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Channel message with avatar, name, timestamp, link preview card',
    },
  },

  googlechat: {
    id: 'googlechat',
    name: 'Google Chat',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Space message with avatar, name, timestamp, link preview',
    },
  },

  zoom: {
    id: 'zoom',
    name: 'Zoom Chat',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Chat message with avatar, name, timestamp, link preview',
    },
  },

  line: {
    id: 'line',
    name: 'Line',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Message with avatar, name, timestamp, link preview',
    },
  },

  kakaotalk: {
    id: 'kakaotalk',
    name: 'KakaoTalk',
    sourceCategory: 'Messaging',
    frameType: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['messaging'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Message with avatar, name, timestamp, link preview',
    },
  },

  // ========== Collaboration & Productivity ==========
  github: {
    id: 'github',
    name: 'GitHub',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Issue/PR/Discussion with avatar, username, repo, timestamp, link preview',
    },
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Page/database with workspace icon, page title, author, timestamp',
    },
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Issue/MR with avatar, username, project, timestamp, link preview',
    },
  },

  jira: {
    id: 'jira',
    name: 'Jira / Confluence',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Issue/Confluence page with assignee, status, priority, link preview',
    },
  },

  asana: {
    id: 'asana',
    name: 'Asana',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Task with project, assignee, due date, link preview',
    },
  },

  evernote: {
    id: 'evernote',
    name: 'Evernote',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Note with notebook, title, tags, timestamp, link preview',
    },
  },

  trello: {
    id: 'trello',
    name: 'Trello',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Card with board, list, labels, members, link preview',
    },
  },

  figma: {
    id: 'figma',
    name: 'Figma',
    sourceCategory: 'Collaboration & Productivity',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'File/comment with avatar, filename, project, timestamp',
    },
  },

  // ========== Content Platforms ==========
  medium: {
    id: 'medium',
    name: 'Medium',
    sourceCategory: 'Content Platforms',
    frameType: 'content-feed',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['content-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Article with author avatar, name, title, clap count, reading time',
    },
  },

  devto: {
    id: 'devto',
    name: 'Dev.to',
    sourceCategory: 'Content Platforms',
    frameType: 'content-feed',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['content-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Post with author avatar, name, title, tags, reactions, comments',
    },
  },

  substack: {
    id: 'substack',
    name: 'Substack',
    sourceCategory: 'Content Platforms',
    frameType: 'content-feed',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['content-feed'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Post with publication name, author, title, subtitle, like count',
    },
  },

  // ========== Email ==========
  outlook: {
    id: 'outlook',
    name: 'Outlook',
    sourceCategory: 'Email',
    frameType: 'email',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['email'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Email with sender, subject, preview, timestamp, link preview card',
    },
  },

  gmail: {
    id: 'gmail',
    name: 'Gmail',
    sourceCategory: 'Email',
    frameType: 'email',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['email'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Email with sender avatar, name, subject, snippet, timestamp, link preview',
    },
  },

  // ========== RSS / Readers ==========
  feedly: {
    id: 'feedly',
    name: 'Feedly / RSS',
    sourceCategory: 'RSS / Readers',
    frameType: 'rss-reader',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['rss-reader'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Feed item with source icon, feed name, title, summary, timestamp',
    },
  },

  // ========== Developer Tools ==========
  stackoverflow: {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    sourceCategory: 'Developer Tools',
    frameType: 'qa-forum',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['qa-forum'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Question with title, tags, votes, answer count, author, timestamp',
    },
  },

  vscode: {
    id: 'vscode',
    name: 'VS Code',
    sourceCategory: 'Developer Tools',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Code snippet with filename, language, line numbers, link preview',
    },
  },

  jetbrains: {
    id: 'jetbrains',
    name: 'JetBrains IDEs',
    sourceCategory: 'Developer Tools',
    frameType: 'collaboration',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    structure: FRAME_TYPE_REQUIREMENTS['collaboration'],
    placeholderFrame: {
      isStub: true,
      implementationNotes: 'Code snippet with IDE branding, filename, language, link preview',
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
