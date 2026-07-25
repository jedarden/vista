/**
 * Reddit Platform Frame Component
 *
 * Stub implementation for Reddit link aggregator frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Reddit brand colors
 */
const REDDIT_COLORS: PlatformBrandColors = {
  primary: '#FF4500',
  background: '#FFFFFF',
  surface: '#DAE0E6',
  textPrimary: '#1C1C1C',
  textSecondary: '#7C7C7C',
  textMuted: '#878A8C',
  border: '#CCCCCC',
  link: '#0079D3',
  accent: '#FF4500',
  success: '#24A0ED',
  error: '#CC3700',
};

/**
 * Reddit layout pattern
 */
const REDDIT_LAYOUT: LayoutPattern = {
  type: 'list',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'rd-post-card',
    styles: {
      borderRadius: '4px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #CCCCCC',
    },
  },
  header: {
    className: 'rd-post-header',
    hasAvatar: false,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'rd-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'rd-post-actions',
    actions: [
      { icon: '💬', label: 'Comments', type: 'comment' },
      { icon: '🔗', label: 'Share', type: 'share' },
      { icon: '💾', label: 'Save', type: 'other' },
    ],
  },
};

/**
 * Reddit platform frame component
 */
export class RedditFrame implements BasePlatformFrame {
  readonly platformId = 'reddit';
  readonly platformName = 'Reddit';
  readonly frameType = 'link-aggregator' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = REDDIT_COLORS;
  readonly layoutPattern = REDDIT_LAYOUT;

  /**
   * Render Reddit post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="reddit-context ${themeClass} platform-frame">
        <div class="rd-post-card">
          <!-- Subreddit Header -->
          <div class="rd-subreddit-header">
            <div class="rd-subreddit-icon">r/</div>
            <div class="rd-subreddit-details">
              <div class="rd-subreddit-name">r/${content.subreddit || 'programming'}</div>
              <div class="rd-subreddit-meta">${content.memberCount || '142K'} members · ${content.onlineCount || '1.2K'} online</div>
            </div>
            <button class="rd-join-btn">Join</button>
          </div>

          <!-- Main Post -->
          <div class="rd-main-post">
            <!-- Upvote Section -->
            <div class="rd-upvote-section">
              <div class="rd-upvote-arrow">▲</div>
              <div class="rd-vote-count">${content.upvotes || '2.4K'}</div>
              <div class="rd-downvote-arrow">▼</div>
            </div>

            <!-- Post Content -->
            <div class="rd-post-main">
              <div class="rd-post-meta">
                <span class="rd-subreddit-link">r/${content.subreddit || 'programming'}</span>
                <span class="rd-post-author">• Posted by u/${content.author || 'username'}</span>
                <span class="rd-post-time">• ${content.timeAgo || '3h'}</span>
              </div>
              <div class="rd-post-title">${content.title || 'Post title goes here...'}</div>

              <!-- Link Preview -->
              ${this.renderLinkPreview(content, theme)}

              <!-- Post Actions -->
              <div class="rd-post-actions">
                <span>💬 ${content.commentCount || '47'} comments</span>
                <span>🔗 Share</span>
                <span>💾 Save</span>
              </div>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="rd-comments-section">
            <div class="rd-comments-header">Comments</div>
            <div class="rd-comment rd-comment-dim">
              <div class="rd-comment-avatar"></div>
              <div class="rd-comment-content">
                <div class="rd-comment-meta">
                  <span class="rd-comment-author">Redditor</span>
                  <span class="rd-comment-time">${content.timeAgo || '2h'}</span>
                </div>
                <div class="rd-comment-body">Great discussion topic! Thanks for posting.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Reddit chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="reddit-context ${themeClass} platform-frame">
        <div class="rd-post-card">
          <div class="rd-subreddit-header">
            <div class="rd-subreddit-icon">r/</div>
            <div class="rd-subreddit-details">
              <div class="rd-subreddit-name">r/subreddit</div>
              <div class="rd-subreddit-meta">142K members · 1.2K online</div>
            </div>
            <button class="rd-join-btn">Join</button>
          </div>
          <div class="rd-main-post">
            <div class="rd-upvote-section">
              <div class="rd-upvote-arrow">▲</div>
              <div class="rd-vote-count">--</div>
              <div class="rd-downvote-arrow">▼</div>
            </div>
            <div class="rd-post-main">
              <div class="rd-post-meta">
                <span class="rd-subreddit-link">r/subreddit</span>
                <span class="rd-post-author">• Posted by u/username</span>
                <span class="rd-post-time">• 3h</span>
              </div>
              <div class="rd-post-title">Post title goes here...</div>
              <div class="rd-post-actions">
                <span>💬 -- comments</span>
                <span>🔗 Share</span>
                <span>💾 Save</span>
              </div>
            </div>
          </div>
          <div class="rd-comments-section">
            <div class="rd-comments-header">Comments</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Reddit
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    // Reddit now uses CSS context classes, so this returns empty
    // The theme variables are applied via .reddit-context and theme classes
    return {};
  }

  /**
   * Validate content for Reddit frame
   */
  validateContent(content: FrameContentData): boolean {
    // Reddit requires at least a title
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

  /**
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <a href="#" class="rd-link-preview">
        ${content.image ? `<div class="rd-link-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="rd-link-content">
          <div class="rd-link-title">${content.title || 'Link Title'}</div>
          <div class="rd-link-domain">${content.domain || 'example.com'}</div>
          <div class="rd-link-description">${content.description || 'Link description...'}</div>
        </div>
      </a>
    `;
  }
}

/**
 * Export singleton instance
 */
export const redditFrame = new RedditFrame();

/**
 * Export factory function for consistency
 */
export function createRedditFrame(): BasePlatformFrame {
  return redditFrame;
}
