/**
 * Instagram Platform Frame Component
 *
 * Stub implementation for Instagram image-focused frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Instagram brand colors
 */
const INSTAGRAM_COLORS: PlatformBrandColors = {
  primary: '#E4405F',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  textPrimary: '#262626',
  textSecondary: '#8E8E8E',
  textMuted: '#C7C7C7',
  border: '#DBDBDB',
  link: '#00376B',
  accent: '#E4405F',
  success: '#0095F6',
  error: '#ED4956',
};

/**
 * Instagram layout pattern
 */
const INSTAGRAM_LAYOUT: LayoutPattern = {
  type: 'image',
  hasFixedAspectRatio: true,
  aspectRatio: '1:1',
  usesCardLayout: false,
  container: {
    className: 'ig-post-card',
    styles: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #DBDBDB',
      borderRadius: '3px',
    },
  },
  header: {
    className: 'ig-post-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: true,
  },
  content: {
    className: 'ig-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'ig-post-actions',
    actions: [
      { icon: '♡', label: 'Like', type: 'like' },
      { icon: '💬', label: 'Comment', type: 'comment' },
      { icon: '🔗', label: 'Share', type: 'share' },
    ],
  },
};

/**
 * Instagram platform frame component
 */
export class InstagramFrame implements BasePlatformFrame {
  readonly platformId = 'instagram';
  readonly platformName = 'Instagram';
  readonly frameType = 'image-focused' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '1:1' as const;
  readonly brandColors = INSTAGRAM_COLORS;
  readonly layoutPattern = INSTAGRAM_LAYOUT;

  /**
   * Render Instagram post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const isLight = theme === 'light';

    return `
      <div class="ig-frame ig-frame-${theme}" style="${this.getFrameStyles(theme)}">
        <div class="ig-post-card">
          <!-- Post Header -->
          <div class="ig-post-header">
            <div class="ig-avatar"></div>
            <div class="ig-post-meta">
              <span class="ig-username">${content.username || content.author || 'username'}</span>
              <span class="ig-post-time">${content.timeAgo || '2h'}</span>
            </div>
            <span class="ig-menu">•••</span>
          </div>

          <!-- Image/Link Preview -->
          ${this.renderImagePreview(content, theme)}

          <!-- Post Content -->
          <div class="ig-post-content">
            ${content.description ? `<div class="ig-caption">${content.description}</div>` : ''}
            ${content.hashtags ? `<div class="ig-hashtags">${content.hashtags}</div>` : ''}
          </div>

          <!-- Post Actions -->
          <div class="ig-post-actions">
            <span class="ig-action">♡</span>
            <span class="ig-action-count">${content.likeCount || '1.2K'}</span>
            <span class="ig-action">💬</span>
            <span class="ig-action-count">${content.commentCount || '45'}</span>
            <span class="ig-action">🔗</span>
            <span class="ig-action-count">Share</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Instagram chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    return `
      <div class="ig-frame ig-frame-${theme}">
        <div class="ig-post-card">
          <div class="ig-post-header">
            <div class="ig-avatar"></div>
            <div class="ig-post-meta">
              <span class="ig-username">username</span>
              <span class="ig-post-time">2h</span>
            </div>
            <span class="ig-menu">•••</span>
          </div>
          <div class="ig-image-placeholder">
            <div class="ig-placeholder-content">📷</div>
          </div>
          <div class="ig-post-content">
            <div class="ig-caption">Post caption goes here...</div>
            <div class="ig-hashtags">#hashtag #example</div>
          </div>
          <div class="ig-post-actions">
            <span class="ig-action">♡</span>
            <span class="ig-action-count">--</span>
            <span class="ig-action">💬</span>
            <span class="ig-action-count">--</span>
            <span class="ig-action">🔗</span>
            <span class="ig-action-count">Share</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Instagram
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const isLight = theme === 'light';

    return {
      '--ig-bg': isLight ? '#FFFFFF' : '#000000',
      '--ig-surface': isLight ? '#FAFAFA' : '#121212',
      '--ig-border': isLight ? '#DBDBDB' : '#262626',
      '--ig-text-primary': isLight ? '#262626' : '#F5F5F5',
      '--ig-text-secondary': isLight ? '#8E8E8E' : '#A8A8A8',
      '--ig-text-muted': isLight ? '#C7C7C7' : '#8E8E8E',
      '--ig-primary': '#E4405F',
      '--ig-link': isLight ? '#00376B' : '#C7D2E4',
      '--ig-accent': '#E4405F',
      '--ig-success': '#0095F6',
      '--ig-error': '#ED4956',
    };
  }

  /**
   * Validate content for Instagram frame
   */
  validateContent(content: FrameContentData): boolean {
    // Instagram requires at least an image or description
    return !!(content.image || content.description);
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
   * Render image preview
   */
  private renderImagePreview(content: FrameContentData, theme: ThemeMode): string {
    if (content.image) {
      return `
        <div class="ig-image-preview" style="background-image: url('${content.image}')">
        </div>
      `;
    }

    // Placeholder with gradient
    return `
      <div class="ig-image-placeholder">
        <div class="ig-placeholder-content">📷</div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const instagramFrame = new InstagramFrame();

/**
 * Export factory function for consistency
 */
export function createInstagramFrame(): BasePlatformFrame {
  return instagramFrame;
}
