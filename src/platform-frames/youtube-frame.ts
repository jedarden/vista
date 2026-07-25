/**
 * YouTube Platform Frame Component
 *
 * Stub implementation for YouTube video platform frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * YouTube brand colors
 */
const YOUTUBE_COLORS: PlatformBrandColors = {
  primary: '#FF0000',
  background: '#0F0F0F',
  surface: '#1F1F1F',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#606060',
  border: '#303030',
  link: '#3EA6FF',
  accent: '#FF0000',
  success: '#2BA640',
  error: '#FF0000',
};

/**
 * YouTube layout pattern
 */
const YOUTUBE_LAYOUT: LayoutPattern = {
  type: 'video',
  hasFixedAspectRatio: true,
  aspectRatio: '16:9',
  usesCardLayout: false,
  container: {
    className: 'yt-video-card',
    styles: {
      backgroundColor: '#0F0F0F',
      border: 'none',
    },
  },
  header: {
    className: 'yt-video-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'yt-video-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'yt-actions-bar',
    actions: [
      { icon: '👍', label: 'Like', type: 'like' },
      { icon: '👎', label: 'Dislike', type: 'other' },
      { icon: '↗️', label: 'Share', type: 'share' },
      { icon: '⬇️', label: 'Download', type: 'other' },
    ],
  },
};

/**
 * YouTube platform frame component
 */
export class YouTubeFrame implements BasePlatformFrame {
  readonly platformId = 'youtube';
  readonly platformName = 'YouTube';
  readonly frameType = 'video-platform' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '16:9' as const;
  readonly brandColors = YOUTUBE_COLORS;
  readonly layoutPattern = YOUTUBE_LAYOUT;

  /**
   * Render YouTube video frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'dark'): string {
    return `
      <div class="yt-frame yt-frame-${theme}" style="${this.getFrameStyles(theme)}">
        <div class="yt-video-card">
          <!-- Video Player -->
          <div class="yt-video-player">
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

          <!-- Video Header -->
          <div class="yt-video-header">
            <div class="yt-channel-avatar"></div>
            <div class="yt-channel-meta">
              <span class="yt-channel-name">${content.author || 'TechChannel'}</span>
              <span class="yt-subscriber-count">${content.subscriberCount || '1.2M'} subscribers</span>
            </div>
            <button class="yt-subscribe-btn">Subscribe</button>
          </div>

          <!-- Video Title and Stats -->
          <div class="yt-video-title">${content.title || 'Amazing Tutorial - Learn in 10 Minutes!'}</div>
          <div class="yt-video-stats">${content.viewCount || '234K'} views · ${content.timeAgo || '3 hours ago'}</div>

          <!-- Actions Bar -->
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

          <!-- Description Section -->
          <div class="yt-description-section">
            <div class="yt-description-text">${content.description || 'In this video, I\'ll show you how to get started with this amazing tool. Perfect for beginners! #tutorial #howto'}</div>
            <div class="yt-description-meta">
              <span>👍 ${content.likeCount || '12K'}</span>
              <span>👁️ ${content.viewCount || '234K'} views</span>
              <span>📅 ${content.timeAgo || '3 hours ago'}</span>
            </div>
          </div>

          <!-- Comments Section -->
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
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render YouTube chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'dark'): string {
    return `
      <div class="yt-frame yt-frame-${theme}">
        <div class="yt-video-card">
          <div class="yt-video-player">
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
              <span class="yt-channel-name">Channel Name</span>
              <span class="yt-subscriber-count">1.2M subscribers</span>
            </div>
            <button class="yt-subscribe-btn">Subscribe</button>
          </div>
          <div class="yt-video-title">Video Title</div>
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
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for YouTube
   */
  getThemeVars(theme: ThemeMode = 'dark'): Record<string, string> {
    return {
      '--yt-bg': '#0F0F0F',
      '--yt-surface': '#1F1F1F',
      '--yt-border': '#303030',
      '--yt-text-primary': '#FFFFFF',
      '--yt-text-secondary': '#AAAAAA',
      '--yt-text-muted': '#606060',
      '--yt-primary': '#FF0000',
      '--yt-link': '#3EA6FF',
      '--yt-accent': '#FF0000',
      '--yt-success': '#2BA640',
      '--yt-error': '#FF0000',
    };
  }

  /**
   * Validate content for YouTube frame
   */
  validateContent(content: FrameContentData): boolean {
    // YouTube requires at least a title or description
    return !!(content.title || content.description);
  }

  /**
   * Get frame CSS styles
   */
  private getFrameStyles(theme: ThemeMode): string {
    const vars = this.getThemeVars(theme);
    return Object.entries(vars)
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');
  }
}

/**
 * Export singleton instance
 */
export const youtubeFrame = new YouTubeFrame();

/**
 * Export factory function for consistency
 */
export function createYouTubeFrame(): BasePlatformFrame {
  return youtubeFrame;
}
