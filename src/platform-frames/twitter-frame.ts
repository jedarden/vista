/**
 * Twitter/X Platform Frame Component
 *
 * Stub implementation for Twitter/X social feed frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Twitter/X brand colors
 */
const TWITTER_COLORS: PlatformBrandColors = {
  primary: '#000000',
  background: '#000000',
  surface: '#16181C',
  textPrimary: '#E7E9EA',
  textSecondary: '#71767B',
  textMuted: '#71767B',
  border: '#2F3336',
  link: '#1D9BF0',
  accent: '#1D9BF0',
  success: '#00BA7C',
  error: '#F4212E',
};

/**
 * Twitter/X layout pattern
 */
const TWITTER_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: true,
  aspectRatio: '1.91:1',
  usesCardLayout: true,
  container: {
    className: 'tw-post-card',
    styles: {
      borderBottom: '1px solid #2F3336',
      backgroundColor: '#000000',
    },
  },
  header: {
    className: 'tw-post-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'tw-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'tw-post-actions',
    actions: [
      { icon: '💬', label: 'Reply', type: 'comment' },
      { icon: '🔁', label: 'Retweet', type: 'other' },
      { icon: '❤️', label: 'Like', type: 'like' },
      { icon: '👁️', label: 'Views', type: 'other' },
    ],
  },
};

/**
 * Twitter/X platform frame component
 */
export class TwitterFrame implements BasePlatformFrame {
  readonly platformId = 'twitter';
  readonly platformName = 'X (Twitter)';
  readonly frameType = 'social-feed' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '1.91:1' as const;
  readonly brandColors = TWITTER_COLORS;
  readonly layoutPattern = TWITTER_LAYOUT;

  /**
   * Render Twitter/X post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'dark'): string {
    return `
      <div class="tw-frame tw-frame-${theme}" style="${this.getFrameStyles(theme)}">
        <div class="tw-post-card">
          <!-- Post Header -->
          <div class="tw-post-header">
            <div class="tw-avatar"></div>
            <div class="tw-post-meta">
              <span class="tw-author-name">${content.author || 'User Name'}</span>
              <span class="tw-verified">✓</span>
              <span class="tw-author-handle">@${content.handle || 'username'}</span>
              <span class="tw-post-time">· ${content.timeAgo || '2h'}</span>
            </div>
          </div>

          <!-- Post Content -->
          <div class="tw-post-content">
            <p class="tw-message">${content.description || 'Check this out!'}</p>
          </div>

          <!-- Link Card -->
          ${this.renderLinkCard(content, theme)}

          <!-- Post Actions -->
          <div class="tw-post-actions">
            <div class="tw-post-action-item">
              <span class="tw-action-icon">💬</span>
              <span class="tw-action-count">${content.commentCount || '12'}</span>
            </div>
            <div class="tw-post-action-item">
              <span class="tw-action-icon">🔁</span>
              <span class="tw-action-count">${content.retweetCount || '5'}</span>
            </div>
            <div class="tw-post-action-item">
              <span class="tw-action-icon">❤️</span>
              <span class="tw-action-count">${content.likeCount || '42'}</span>
            </div>
            <div class="tw-post-action-item">
              <span class="tw-action-icon">👁️</span>
              <span class="tw-action-count">${content.viewCount || '1.2K'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Twitter/X chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'dark'): string {
    return `
      <div class="tw-frame tw-frame-${theme}">
        <div class="tw-post-card">
          <div class="tw-post-header">
            <div class="tw-avatar"></div>
            <div class="tw-post-meta">
              <span class="tw-author-name">User Name</span>
              <span class="tw-verified">✓</span>
              <span class="tw-author-handle">@username</span>
              <span class="tw-post-time">· 2h</span>
            </div>
          </div>
          <div class="tw-post-content">
            <p class="tw-message">Post content goes here...</p>
          </div>
          <div class="tw-post-actions">
            <div class="tw-post-action-item">
              <span class="tw-action-icon">💬</span>
              <span class="tw-action-count">--</span>
            </div>
            <div class="tw-post-action-item">
              <span class="tw-action-icon">🔁</span>
              <span class="tw-action-count">--</span>
            </div>
            <div class="tw-post-action-item">
              <span class="tw-action-icon">❤️</span>
              <span class="tw-action-count">--</span>
            </div>
            <div class="tw-post-action-item">
              <span class="tw-action-icon">👁️</span>
              <span class="tw-action-count">--</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Twitter/X
   */
  getThemeVars(theme: ThemeMode = 'dark'): Record<string, string> {
    const isDark = theme === 'dark';

    return {
      '--tw-bg': '#000000',
      '--tw-surface': isDark ? '#16181C' : '#F7F9F9',
      '--tw-border': '#2F3336',
      '--tw-text-primary': '#E7E9EA',
      '--tw-text-secondary': '#71767B',
      '--tw-text-muted': '#71767B',
      '--tw-primary': '#1D9BF0',
      '--tw-accent': '#1D9BF0',
      '--tw-success': '#00BA7C',
      '--tw-error': '#F4212E',
    };
  }

  /**
   * Validate content for Twitter/X frame
   */
  validateContent(content: FrameContentData): boolean {
    // Twitter requires at least a message or link
    return !!(content.description || content.title || content.image);
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
   * Render link card
   */
  private renderLinkCard(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <div class="tw-link-card">
        ${content.image ? `<div class="tw-context-placeholder" style="background-image: url('${content.image}')"></div>` : '<div class="tw-context-placeholder"></div>'}
        <div class="tw-context-meta">
          <div class="tw-context-title">${content.title || 'Link Title'}</div>
          <div class="tw-context-domain">${content.domain || 'example.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const twitterFrame = new TwitterFrame();

/**
 * Export factory function for consistency
 */
export function createTwitterFrame(): BasePlatformFrame {
  return twitterFrame;
}
