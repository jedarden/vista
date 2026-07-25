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
    const isLight = theme === 'light';
    const colors = this.getThemeVars(theme);

    return `
      <div class="fb-frame fb-frame-${theme}" style="${this.getFrameStyles(theme)}">
        <div class="fb-post-card">
          <!-- Post Header -->
          <div class="fb-post-header">
            <div class="fb-avatar"></div>
            <div class="fb-post-meta">
              <span class="fb-author-name">${content.author || 'User Name'}</span>
              <span class="fb-post-time">${content.timeAgo || '2h'} · 🌍</span>
            </div>
            <span class="fb-menu">•••</span>
          </div>

          <!-- Post Content -->
          <div class="fb-post-content">
            <p class="fb-message">${content.description || 'Check out this interesting article!'}</p>
          </div>

          <!-- Link Preview -->
          ${this.renderLinkPreview(content, theme)}

          <!-- Post Stats -->
          <div class="fb-post-stats">
            <span>👍 ${content.likeCount || '12'}</span>
            <span>💬 ${content.commentCount || '5'}</span>
            <span>🔗 ${content.shareCount || '3'}</span>
          </div>

          <!-- Post Actions -->
          <div class="fb-post-actions">
            <button class="fb-action-btn">
              <span class="fb-action-icon">👍</span>
              <span class="fb-action-label">Like</span>
            </button>
            <button class="fb-action-btn">
              <span class="fb-action-icon">💬</span>
              <span class="fb-action-label">Comment</span>
            </button>
            <button class="fb-action-btn">
              <span class="fb-action-icon">🔗</span>
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
    return `
      <div class="fb-frame fb-frame-${theme}">
        <div class="fb-post-card">
          <div class="fb-post-header">
            <div class="fb-avatar"></div>
            <div class="fb-post-meta">
              <span class="fb-author-name">User Name</span>
              <span class="fb-post-time">2h · 🌍</span>
            </div>
            <span class="fb-menu">•••</span>
          </div>
          <div class="fb-post-content">
            <p class="fb-message">Post content goes here...</p>
          </div>
          <div class="fb-post-stats">
            <span>👍 --</span>
            <span>💬 --</span>
            <span>🔗 --</span>
          </div>
          <div class="fb-post-actions">
            <button class="fb-action-btn">
              <span class="fb-action-icon">👍</span>
              <span class="fb-action-label">Like</span>
            </button>
            <button class="fb-action-btn">
              <span class="fb-action-icon">💬</span>
              <span class="fb-action-label">Comment</span>
            </button>
            <button class="fb-action-btn">
              <span class="fb-action-icon">🔗</span>
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
    const isLight = theme === 'light';

    return {
      '--fb-bg': isLight ? '#FFFFFF' : '#18191A',
      '--fb-surface': isLight ? '#F0F2F5' : '#242526',
      '--fb-border': isLight ? '#CED0D4' : '#3E4042',
      '--fb-text-primary': isLight ? '#050505' : '#E4E6EB',
      '--fb-text-secondary': isLight ? '#65676B' : '#B0B3B8',
      '--fb-text-muted': isLight ? '#B7B8B9' : '#65676B',
      '--fb-primary': '#1877F2',
      '--fb-accent': '#1877F2',
    };
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
      <a href="#" class="fb-link-preview">
        ${content.image ? `<div class="fb-link-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="fb-link-content">
          <div class="fb-link-domain">${content.domain || 'example.com'}</div>
          <div class="fb-link-title">${content.title || 'Link Title'}</div>
          <div class="fb-link-description">${content.description || 'Link description...'}</div>
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
