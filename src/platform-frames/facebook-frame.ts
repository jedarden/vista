/**
 * Facebook Platform Frame Component
 *
 * Stub implementation for Facebook social feed frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';
import { createPlatformFrameStub } from './base-frame';

/**
 * Facebook brand colors
 */
const FACEBOOK_COLORS: PlatformBrandColors = {
  primary: '#1877F2',
  background: '#FFFFFF',
  surface: '#F0F2F5',
  textPrimary: '#050505',
  textSecondary: '#65676B',
  textMuted: '#B7B8B9',
  border: '#CED0D4',
  link: '#1877F2',
  accent: '#1877F2',
  success: '#31A24C',
  error: '#DC3545',
};

/**
 * Facebook layout pattern
 */
const FACEBOOK_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: true,
  aspectRatio: '1.91:1',
  usesCardLayout: true,
  container: {
    className: 'fb-post-card',
    styles: {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #CED0D4',
    },
  },
  header: {
    className: 'fb-post-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: true,
  },
  content: {
    className: 'fb-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'fb-post-footer',
    actions: [
      { icon: '👍', label: 'Like', type: 'like' },
      { icon: '💬', label: 'Comment', type: 'comment' },
      { icon: '🔗', label: 'Share', type: 'share' },
    ],
  },
};

/**
 * Facebook platform frame component
 */
export class FacebookFrame implements BasePlatformFrame {
  readonly platformId = 'facebook';
  readonly platformName = 'Facebook';
  readonly frameType = 'social-feed' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '1.91:1' as const;
  readonly brandColors = FACEBOOK_COLORS;
  readonly layoutPattern = FACEBOOK_LAYOUT;

  /**
   * Render Facebook post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="facebook-context ${themeClass} platform-frame">
        <div class="fb-post-card">
          <!-- Post Header -->
          <div class="fb-post-header frame-post-meta">
            <div class="fb-avatar frame-avatar">
              <div class="frame-avatar-placeholder">?</div>
            </div>
            <div class="fb-post-meta frame-user-details">
              <span class="fb-author-name frame-username">${content.author || 'User Name'}</span>
              <span class="fb-post-time frame-timestamp"><span class="frame-timestamp-dot"></span>${content.timeAgo || '2h'} · 🌍</span>
            </div>
            <span class="fb-menu frame-user-badge">•••</span>
          </div>

          <!-- Post Content -->
          <div class="fb-post-content frame-post-content">
            <p class="fb-message frame-post-text">${content.description || 'Check out this interesting article!'}</p>
          </div>

          <!-- Link Preview -->
          ${this.renderLinkPreview(content, theme)}

          <!-- Post Stats -->
          <div class="fb-post-stats frame-post-stats">
            <span class="frame-stat-item">👍 <span class="frame-stat-count">${content.likeCount || '12'}</span></span>
            <span class="frame-stat-item">💬 <span class="frame-stat-count">${content.commentCount || '5'}</span></span>
            <span class="frame-stat-item">🔗 <span class="frame-stat-count">${content.shareCount || '3'}</span></span>
          </div>

          <!-- Post Actions -->
          <div class="fb-post-actions frame-post-stats">
            <button class="fb-action-btn frame-stat-item">
              <span class="fb-action-icon frame-stat-icon">👍</span>
              <span class="fb-action-label">Like</span>
            </button>
            <button class="fb-action-btn frame-stat-item">
              <span class="fb-action-icon frame-stat-icon">💬</span>
              <span class="fb-action-label">Comment</span>
            </button>
            <button class="fb-action-btn frame-stat-item">
              <span class="fb-action-icon frame-stat-icon">🔗</span>
              <span class="fb-action-label">Share</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Facebook chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="facebook-context ${themeClass} platform-frame">
        <div class="fb-post-card">
          <div class="fb-post-header frame-post-meta">
            <div class="fb-avatar frame-avatar">
              <div class="frame-avatar-placeholder">?</div>
            </div>
            <div class="fb-post-meta frame-user-details">
              <span class="fb-author-name frame-username">User Name</span>
              <span class="fb-post-time frame-timestamp"><span class="frame-timestamp-dot"></span>2h · 🌍</span>
            </div>
            <span class="fb-menu frame-user-badge">•••</span>
          </div>
          <div class="fb-post-content frame-post-content">
            <p class="fb-message frame-post-text">Post content goes here...</p>
          </div>
          <div class="fb-post-stats frame-post-stats">
            <span class="frame-stat-item">👍 <span class="frame-stat-count">--</span></span>
            <span class="frame-stat-item">💬 <span class="frame-stat-count">--</span></span>
            <span class="frame-stat-item">🔗 <span class="frame-stat-count">--</span></span>
          </div>
          <div class="fb-post-actions frame-post-stats">
            <button class="fb-action-btn frame-stat-item">
              <span class="fb-action-icon frame-stat-icon">👍</span>
              <span class="fb-action-label">Like</span>
            </button>
            <button class="fb-action-btn frame-stat-item">
              <span class="fb-action-icon frame-stat-icon">💬</span>
              <span class="fb-action-label">Comment</span>
            </button>
            <button class="fb-action-btn frame-stat-item">
              <span class="fb-action-icon frame-stat-icon">🔗</span>
              <span class="fb-action-label">Share</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Facebook
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    // Facebook now uses CSS context classes, so this returns empty
    // The theme variables are applied via .facebook-context and theme classes
    return {};
  }

  /**
   * Validate content for Facebook frame
   */
  validateContent(content: FrameContentData): boolean {
    // Facebook requires at least a message or link preview
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
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <a href="#" class="fb-link-preview frame-content-card">
        ${content.image ? `<div class="fb-link-image frame-placeholder-image" style="background-image: url('${content.image}')"></div>` : '<div class="fb-link-image frame-placeholder-image"></div>'}
        <div class="fb-link-content frame-neutral-content">
          <div class="fb-link-domain frame-userhandle">${content.domain || 'example.com'}</div>
          <div class="fb-link-title frame-username">${content.title || 'Link Title'}</div>
          <div class="fb-link-description frame-post-text-compact">${content.description || 'Link description...'}</div>
        </div>
      </a>
    `;
  }
}

/**
 * Export singleton instance
 */
export const facebookFrame = new FacebookFrame();

/**
 * Export factory function for consistency
 */
export function createFacebookFrame(): BasePlatformFrame {
  return facebookFrame;
}
