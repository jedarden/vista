/**
 * Mastodon Platform Frame Component
 *
 * Fediverse social platform frame for Mastodon with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Mastodon brand colors (light theme)
 */
const MASTODON_COLORS: PlatformBrandColors = {
  primary: '#6364FF',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#181818',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  border: '#E0E0E0',
  link: '#6364FF',
  accent: '#6364FF',
  success: '#3FA84A',
  error: '#D32F2F',
};

/**
 * Mastodon dark theme colors
 */
const MASTODON_DARK_COLORS: PlatformBrandColors = {
  primary: '#8A8AFF',
  background: '#191B22',
  surface: '#242630',
  textPrimary: '#DFDFE6',
  textSecondary: '#9CA2B8',
  textMuted: '#6A6B78',
  border: '#313543',
  link: '#8A8AFF',
  accent: '#8A8AFF',
  success: '#4CAF50',
  error: '#FF6B6B',
};

/**
 * Mastodon layout pattern
 */
const MASTODON_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'mastodon-post-card',
    styles: {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E0E0E0',
    },
  },
  header: {
    className: 'mastodon-post-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: true,
  },
  content: {
    className: 'mastodon-post-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'mastodon-post-footer',
    actions: [
      { icon: '↩️', label: 'Reply', type: 'reply' },
      { icon: '⚡', label: 'Boost', type: 'boost' },
      { icon: '⭐', label: 'Favorite', type: 'favorite' },
      { icon: '🔖', label: 'Bookmark', type: 'bookmark' },
    ],
  },
};

/**
 * Mastodon platform frame component
 */
export class MastodonFrame implements BasePlatformFrame {
  readonly platformId = 'mastodon';
  readonly platformName = 'Mastodon';
  readonly frameType = 'social-feed' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = MASTODON_COLORS;
  readonly layoutPattern = MASTODON_LAYOUT;

  /**
   * Render Mastodon post frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? MASTODON_DARK_COLORS : MASTODON_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    const visibilityIcon = content.visibility === 'public' ? '🌐' : content.visibility === 'unlisted' ? '🔓' : content.visibility === 'private' ? '🔒' : '✉️';

    return `
      <div class="mastodon-context ${themeClass} platform-frame">
        <div class="mastodon-post-card">
          <!-- Post Header -->
          <div class="mastodon-post-header frame-post-meta">
            <div class="mastodon-avatar frame-avatar">
              <div class="frame-avatar-placeholder">${(content.author || 'User')[0]}</div>
            </div>
            <div class="mastodon-post-meta frame-user-details">
              <div class="mastodon-display-name frame-username">${content.displayName || content.author || 'Display Name'}</div>
              <div class="mastodon-username-handle frame-userhandle">@${content.handle || 'username'}</div>
              <div class="mastodon-post-time frame-timestamp">${content.timeAgo || '2h ago'} · ${visibilityIcon}</div>
            </div>
            <button class="mastodon-menu-btn frame-user-badge">•••</button>
          </div>

          <!-- Post Content -->
          <div class="mastodon-post-content frame-post-content">
            <div class="mastodon-content-text frame-post-text">
              ${content.description || 'Post content goes here...'}
            </div>

            <!-- Content Warning (if present) -->
            ${content.contentWarning ? `
              <details class="mastodon-content-warning">
                <summary class="mastodon-cw-toggle">Content Warning: ${content.contentWarning}</summary>
              </details>
            ` : ''}

            <!-- Link Preview -->
            ${this.renderLinkPreview(content, theme)}

            <!-- Poll (if present) -->
            ${content.poll ? `
              <div class="mastodon-poll">
                ${content.poll.split('\n').map(option => `
                  <div class="mastodon-poll-option">
                    <span class="mastodon-poll-bar"></span>
                    <span class="mastodon-poll-text">${option}</span>
                    <span class="mastodon-poll-votes">${Math.floor(Math.random() * 100)}%</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Post Actions -->
          <div class="mastodon-post-actions frame-post-stats">
            <button class="mastodon-action-btn frame-stat-item" title="Reply">
              <span class="mastodon-action-icon">↩️</span>
              <span class="mastodon-action-count">${content.replyCount || '5'}</span>
            </button>
            <button class="mastodon-action-btn frame-stat-item" title="Boost">
              <span class="mastodon-action-icon">⚡</span>
              <span class="mastodon-action-count">${content.boostCount || '12'}</span>
            </button>
            <button class="mastodon-action-btn frame-stat-item" title="Favorite">
              <span class="mastodon-action-icon">⭐</span>
              <span class="mastodon-action-count">${content.favoriteCount || '42'}</span>
            </button>
            <button class="mastodon-action-btn frame-stat-item" title="Bookmark">
              <span class="mastodon-action-icon">🔖</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Mastodon chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="mastodon-context ${themeClass} platform-frame">
        <div class="mastodon-post-card">
          <div class="mastodon-post-header frame-post-meta">
            <div class="mastodon-avatar frame-avatar">
              <div class="frame-avatar-placeholder">U</div>
            </div>
            <div class="mastodon-post-meta frame-user-details">
              <div class="mastodon-display-name frame-username">Display Name</div>
              <div class="mastodon-username-handle frame-userhandle">@username</div>
              <div class="mastodon-post-time frame-timestamp">2h ago · 🌐</div>
            </div>
            <button class="mastodon-menu-btn frame-user-badge">•••</button>
          </div>
          <div class="mastodon-post-content frame-post-content">
            <div class="mastodon-content-text frame-post-text">
              Post content goes here...
            </div>
          </div>
          <div class="mastodon-post-actions frame-post-stats">
            <button class="mastodon-action-btn frame-stat-item" title="Reply">
              <span class="mastodon-action-icon">↩️</span>
              <span class="mastodon-action-count">5</span>
            </button>
            <button class="mastodon-action-btn frame-stat-item" title="Boost">
              <span class="mastodon-action-icon">⚡</span>
              <span class="mastodon-action-count">12</span>
            </button>
            <button class="mastodon-action-btn frame-stat-item" title="Favorite">
              <span class="mastodon-action-icon">⭐</span>
              <span class="mastodon-action-count">42</span>
            </button>
            <button class="mastodon-action-btn frame-stat-item" title="Bookmark">
              <span class="mastodon-action-icon">🔖</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Mastodon
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? MASTODON_DARK_COLORS : MASTODON_COLORS;
    return {
      '--mastodon-bg': colors.background,
      '--mastodon-surface': colors.surface,
      '--mastodon-text-primary': colors.textPrimary,
      '--mastodon-text-secondary': colors.textSecondary,
      '--mastodon-border': colors.border,
      '--mastodon-accent': colors.accent,
      '--mastodon-link': colors.link,
    };
  }

  /**
   * Validate content for Mastodon frame
   */
  validateContent(content: FrameContentData): boolean {
    // Mastodon requires at least some content
    return !!(content.description || content.title || content.image);
  }

  /**
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <div class="mastodon-link-preview frame-content-card">
        ${content.image ? `<div class="mastodon-link-image frame-placeholder-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="mastodon-link-content frame-neutral-content">
          <div class="mastodon-link-title frame-username">${content.title || 'Link Title'}</div>
          ${content.description ? `<div class="mastodon-link-description frame-post-text-compact">${content.description}</div>` : ''}
          <div class="mastodon-link-url frame-userhandle">${content.domain || content.url || 'example.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const mastodonFrame = new MastodonFrame();

/**
 * Export factory function for consistency
 */
export function createMastodonFrame(): BasePlatformFrame {
  return mastodonFrame;
}
