/**
 * Threads Platform Frame Component
 *
 * Instagram's text-based conversation platform frame with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Threads brand colors (light theme)
 */
const THREADS_COLORS: PlatformBrandColors = {
  primary: '#000000',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  link: '#0095F6',
  accent: '#000000',
  success: '#0095F6',
  error: '#ED4956',
};

/**
 * Threads dark theme colors
 */
const THREADS_DARK_COLORS: PlatformBrandColors = {
  primary: '#FFFFFF',
  background: '#000000',
  surface: '#1A1A1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  border: '#2D2D2D',
  link: '#0095F6',
  accent: '#FFFFFF',
  success: '#0095F6',
  error: '#FF6B6B',
};

/**
 * Threads layout pattern
 */
const THREADS_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'threads-post-card',
    styles: {
      borderRadius: '12px',
      backgroundColor: '#FFFFFF',
      border: 'none',
    },
  },
  header: {
    className: 'threads-post-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'threads-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'threads-post-footer',
    actions: [
      { icon: '💬', label: 'Reply', type: 'reply' },
      { icon: '❤️', label: 'Like', type: 'like' },
      { icon: '♻️', label: 'Repost', type: 'repost' },
      { icon: '✉️', label: 'Share', type: 'share' },
    ],
  },
};

/**
 * Threads platform frame component
 */
export class ThreadsFrame implements BasePlatformFrame {
  readonly platformId = 'threads';
  readonly platformName = 'Threads';
  readonly frameType = 'social-feed' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = THREADS_COLORS;
  readonly layoutPattern = THREADS_LAYOUT;

  /**
   * Render Threads post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? THREADS_DARK_COLORS : THREADS_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="threads-context ${themeClass} platform-frame">
        <div class="threads-post-card">
          <!-- Post Header -->
          <div class="threads-post-header frame-post-meta">
            <div class="threads-avatar frame-avatar">
              <div class="frame-avatar-placeholder">${(content.author || 'User')[0]}</div>
            </div>
            <div class="threads-post-meta frame-user-details">
              <div class="threads-author-line">
                <span class="threads-author-name frame-username">${content.author || 'username'}</span>
                ${content.verified ? '<span class="threads-verified-badge">✓</span>' : ''}
              </div>
              <div class="threads-handle frame-userhandle">@${content.handle || 'username'}</div>
            </div>
            <div class="threads-time frame-timestamp">${content.timeAgo || '2h'}</div>
          </div>

          <!-- Post Content -->
          <div class="threads-post-content frame-post-content">
            <div class="threads-text frame-post-text">
              ${content.description || 'Thread content goes here...'}
            </div>

            <!-- Link Preview -->
            ${this.renderLinkPreview(content, theme)}

            <!-- Media -->
            ${content.image ? `<div class="threads-media"><img src="${content.image}" alt="Thread media" class="frame-placeholder-image" /></div>` : ''}
          </div>

          <!-- Post Actions -->
          <div class="threads-post-actions frame-post-stats">
            <button class="threads-action-btn frame-stat-item" title="Reply">
              <span class="threads-action-icon">💬</span>
              <span class="threads-action-count">${content.replyCount || '23'}</span>
            </button>
            <button class="threads-action-btn frame-stat-item" title="Like">
              <span class="threads-action-icon">❤️</span>
              <span class="threads-action-count">${content.likeCount || '156'}</span>
            </button>
            <button class="threads-action-btn frame-stat-item" title="Repost">
              <span class="threads-action-icon">♻️</span>
              <span class="threads-action-count">${content.repostCount || '12'}</span>
            </button>
            <button class="threads-action-btn frame-stat-item" title="Share">
              <span class="threads-action-icon">✉️</span>
            </button>
          </div>

          <!-- Thread Line -->
          ${content.isThread ? '<div class="threads-thread-line"></div>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render Threads chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="threads-context ${themeClass} platform-frame">
        <div class="threads-post-card">
          <div class="threads-post-header frame-post-meta">
            <div class="threads-avatar frame-avatar">
              <div class="frame-avatar-placeholder">U</div>
            </div>
            <div class="threads-post-meta frame-user-details">
              <div class="threads-author-line">
                <span class="threads-author-name frame-username">username</span>
              </div>
              <div class="threads-handle frame-userhandle">@username</div>
            </div>
            <div class="threads-time frame-timestamp">2h</div>
          </div>
          <div class="threads-post-content frame-post-content">
            <div class="threads-text frame-post-text">
              Thread content goes here...
            </div>
          </div>
          <div class="threads-post-actions frame-post-stats">
            <button class="threads-action-btn frame-stat-item" title="Reply">
              <span class="threads-action-icon">💬</span>
              <span class="threads-action-count">23</span>
            </button>
            <button class="threads-action-btn frame-stat-item" title="Like">
              <span class="threads-action-icon">❤️</span>
              <span class="threads-action-count">156</span>
            </button>
            <button class="threads-action-btn frame-stat-item" title="Repost">
              <span class="threads-action-icon">♻️</span>
              <span class="threads-action-count">12</span>
            </button>
            <button class="threads-action-btn frame-stat-item" title="Share">
              <span class="threads-action-icon">✉️</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Threads
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? THREADS_DARK_COLORS : THREADS_COLORS;
    return {
      '--threads-bg': colors.background,
      '--threads-surface': colors.surface,
      '--threads-text-primary': colors.textPrimary,
      '--threads-text-secondary': colors.textSecondary,
      '--threads-border': colors.border,
      '--threads-accent': colors.accent,
      '--threads-link': colors.link,
    };
  }

  /**
   * Validate content for Threads frame
   */
  validateContent(content: FrameContentData): boolean {
    // Threads requires at least some text content
    return !!(content.description || content.title);
  }

  /**
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <div class="threads-link-preview frame-content-card">
        ${content.image ? `<div class="threads-link-image frame-placeholder-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="threads-link-content frame-neutral-content">
          <div class="threads-link-title frame-username">${content.title || 'Link Title'}</div>
          ${content.description ? `<div class="threads-link-description frame-post-text-compact">${content.description}</div>` : ''}
          <div class="threads-link-url frame-userhandle">${content.domain || content.url || 'example.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const threadsFrame = new ThreadsFrame();

/**
 * Export factory function for consistency
 */
export function createThreadsFrame(): BasePlatformFrame {
  return threadsFrame;
}
