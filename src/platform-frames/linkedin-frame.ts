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
    const isLight = theme === 'light';

    return `
      <div class="li-frame li-frame-${theme}" style="${this.getFrameStyles(theme)}">
        <div class="li-post-card">
          <!-- Post Header -->
          <div class="li-post-header">
            <div class="li-avatar"></div>
            <div class="li-post-meta">
              <span class="li-author-name">${content.author || 'User Name'}</span>
              <span class="li-post-headline">${content.headline || 'Software Engineer at Tech Company'}</span>
              <span class="li-post-time">${content.timeAgo || '2h'} · 🌐</span>
            </div>
          </div>

          <!-- Post Content -->
          <div class="li-post-content">
            <p class="li-message">${content.description || 'Great article on industry trends!'}</p>
          </div>

          <!-- Link Preview -->
          ${this.renderLinkPreview(content, theme)}

          <!-- Post Stats -->
          <div class="li-post-stats">
            <span>👍 ${content.likeCount || '24'}</span>
            <span>💬 ${content.commentCount || '8'}</span>
            <span>🔁 ${content.repostCount || '3'}</span>
          </div>

          <!-- Post Actions -->
          <div class="li-post-actions">
            <button class="li-action-btn">
              <span class="li-action-icon">👍</span>
              <span class="li-action-label">Like</span>
            </button>
            <button class="li-action-btn">
              <span class="li-action-icon">💬</span>
              <span class="li-action-label">Comment</span>
            </button>
            <button class="li-action-btn">
              <span class="li-action-icon">🔁</span>
              <span class="li-action-label">Repost</span>
            </button>
            <button class="li-action-btn">
              <span class="li-action-icon">🔗</span>
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
    return `
      <div class="li-frame li-frame-${theme}">
        <div class="li-post-card">
          <div class="li-post-header">
            <div class="li-avatar"></div>
            <div class="li-post-meta">
              <span class="li-author-name">User Name</span>
              <span class="li-post-headline">Software Engineer at Tech Company</span>
              <span class="li-post-time">2h · 🌐</span>
            </div>
          </div>
          <div class="li-post-content">
            <p class="li-message">Post content goes here...</p>
          </div>
          <div class="li-post-stats">
            <span>👍 --</span>
            <span>💬 --</span>
            <span>🔁 --</span>
          </div>
          <div class="li-post-actions">
            <button class="li-action-btn">
              <span class="li-action-icon">👍</span>
              <span class="li-action-label">Like</span>
            </button>
            <button class="li-action-btn">
              <span class="li-action-icon">💬</span>
              <span class="li-action-label">Comment</span>
            </button>
            <button class="li-action-btn">
              <span class="li-action-icon">🔁</span>
              <span class="li-action-label">Repost</span>
            </button>
            <button class="li-action-btn">
              <span class="li-action-icon">🔗</span>
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
    const isLight = theme === 'light';

    return {
      '--li-bg': isLight ? '#FFFFFF' : '#000000',
      '--li-surface': isLight ? '#F3F2EF' : '#1A1A1A',
      '--li-border': isLight ? '#E0E0E0' : '#2D2D2D',
      '--li-text-primary': isLight ? '#191919' : '#FFFFFF',
      '--li-text-secondary': isLight ? '#666666' : '#B0B0B0',
      '--li-text-muted': isLight ? '#999999' : '#808080',
      '--li-primary': '#0A66C2',
      '--li-accent': '#0A66C2',
      '--li-success': '#057A55',
      '--li-error': '#CC1016',
    };
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
      <a href="#" class="li-link-preview">
        ${content.image ? `<div class="li-link-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="li-link-content">
          <div class="li-link-title">${content.title || 'Link Title'}</div>
          <div class="li-link-domain">${content.domain || 'example.com'}</div>
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
