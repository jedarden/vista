/**
 * LinkedIn Platform Frame Component
 *
 * Stub implementation for LinkedIn social feed frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * LinkedIn brand colors
 */
const LINKEDIN_COLORS: PlatformBrandColors = {
  primary: '#0A66C2',
  background: '#FFFFFF',
  surface: '#F3F2EF',
  textPrimary: '#191919',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  link: '#0A66C2',
  accent: '#0A66C2',
  success: '#057A55',
  error: '#CC1016',
};

/**
 * LinkedIn layout pattern
 */
const LINKEDIN_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: true,
  aspectRatio: '1.91:1',
  usesCardLayout: true,
  container: {
    className: 'li-post-card',
    styles: {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E0E0E0',
    },
  },
  header: {
    className: 'li-post-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'li-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'li-post-stats',
    actions: [
      { icon: '👍', label: 'Like', type: 'like' },
      { icon: '💬', label: 'Comment', type: 'comment' },
      { icon: '🔁', label: 'Repost', type: 'other' },
      { icon: '🔗', label: 'Send', type: 'other' },
    ],
  },
};

/**
 * LinkedIn platform frame component
 */
export class LinkedInFrame implements BasePlatformFrame {
  readonly platformId = 'linkedin';
  readonly platformName = 'LinkedIn';
  readonly frameType = 'social-feed' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '1.91:1' as const;
  readonly brandColors = LINKEDIN_COLORS;
  readonly layoutPattern = LINKEDIN_LAYOUT;

  /**
   * Render LinkedIn post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="linkedin-context ${themeClass} platform-frame">
        <div class="li-post-card">
          <!-- Post Header -->
          <div class="li-post-header frame-post-meta">
            <div class="li-avatar frame-avatar">
              <div class="frame-avatar-placeholder">?</div>
            </div>
            <div class="li-post-meta frame-user-details">
              <span class="li-author-name frame-username">${content.author || 'User Name'}</span>
              <span class="li-post-headline frame-userhandle">${content.headline || 'Software Engineer at Tech Company'}</span>
              <span class="li-post-time frame-timestamp"><span class="frame-timestamp-dot"></span>${content.timeAgo || '2h'} · 🌐</span>
            </div>
          </div>

          <!-- Post Content -->
          <div class="li-post-content frame-post-content">
            <p class="li-message frame-post-text">${content.description || 'Great article on industry trends!'}</p>
          </div>

          <!-- Link Preview -->
          ${this.renderLinkPreview(content, theme)}

          <!-- Post Stats -->
          <div class="li-post-stats frame-post-stats">
            <span class="frame-stat-item">👍 <span class="frame-stat-count">${content.likeCount || '24'}</span></span>
            <span class="frame-stat-item">💬 <span class="frame-stat-count">${content.commentCount || '8'}</span></span>
            <span class="frame-stat-item">🔁 <span class="frame-stat-count">${content.repostCount || '3'}</span></span>
          </div>

          <!-- Post Actions -->
          <div class="li-post-actions frame-post-stats">
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">👍</span>
              <span class="li-action-label">Like</span>
            </button>
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">💬</span>
              <span class="li-action-label">Comment</span>
            </button>
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">🔁</span>
              <span class="li-action-label">Repost</span>
            </button>
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">🔗</span>
              <span class="li-action-label">Send</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render LinkedIn chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="linkedin-context ${themeClass} platform-frame">
        <div class="li-post-card">
          <div class="li-post-header frame-post-meta">
            <div class="li-avatar frame-avatar">
              <div class="frame-avatar-placeholder">?</div>
            </div>
            <div class="li-post-meta frame-user-details">
              <span class="li-author-name frame-username">User Name</span>
              <span class="li-post-headline frame-userhandle">Software Engineer at Tech Company</span>
              <span class="li-post-time frame-timestamp"><span class="frame-timestamp-dot"></span>2h · 🌐</span>
            </div>
          </div>
          <div class="li-post-content frame-post-content">
            <p class="li-message frame-post-text">Post content goes here...</p>
          </div>
          <div class="li-post-stats frame-post-stats">
            <span class="frame-stat-item">👍 <span class="frame-stat-count">--</span></span>
            <span class="frame-stat-item">💬 <span class="frame-stat-count">--</span></span>
            <span class="frame-stat-item">🔁 <span class="frame-stat-count">--</span></span>
          </div>
          <div class="li-post-actions frame-post-stats">
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">👍</span>
              <span class="li-action-label">Like</span>
            </button>
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">💬</span>
              <span class="li-action-label">Comment</span>
            </button>
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">🔁</span>
              <span class="li-action-label">Repost</span>
            </button>
            <button class="li-action-btn frame-stat-item">
              <span class="li-action-icon frame-stat-icon">🔗</span>
              <span class="li-action-label">Send</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for LinkedIn
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    // LinkedIn now uses CSS context classes, so this returns empty
    // The theme variables are applied via .linkedin-context and theme classes
    return {};
  }

  /**
   * Validate content for LinkedIn frame
   */
  validateContent(content: FrameContentData): boolean {
    // LinkedIn requires at least a message or link preview
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
      <a href="#" class="li-link-preview frame-content-card">
        ${content.image ? `<div class="li-link-image frame-placeholder-image" style="background-image: url('${content.image}')"></div>` : '<div class="li-link-image frame-placeholder-image"></div>'}
        <div class="li-link-content frame-neutral-content">
          <div class="li-link-title frame-username">${content.title || 'Link Title'}</div>
          <div class="li-link-domain frame-userhandle">${content.domain || 'example.com'}</div>
        </div>
      </a>
    `;
  }
}

/**
 * Export singleton instance
 */
export const linkedinFrame = new LinkedInFrame();

/**
 * Export factory function for consistency
 */
export function createLinkedInFrame(): BasePlatformFrame {
  return linkedinFrame;
}
