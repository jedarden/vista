/**
 * Pinterest Platform Frame Component
 *
 * Image-focused platform frame for Pinterest with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Pinterest brand colors (light theme)
 */
const PINTEREST_COLORS: PlatformBrandColors = {
  primary: '#E60023',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#111111',
  textSecondary: '#767676',
  textMuted: '#A8A8A8',
  border: '#E1E1E1',
  link: '#111111',
  accent: '#E60023',
  success: '#1F7E34',
  error: '#D1383D',
};

/**
 * Pinterest dark theme colors
 */
const PINTEREST_DARK_COLORS: PlatformBrandColors = {
  primary: '#E60023',
  background: '#121212',
  surface: '#1E1E1E',
  textPrimary: '#E0E0E0',
  textSecondary: '#A0A0A0',
  textMuted: '#6A6A6A',
  border: '#2D2D2D',
  link: '#E0E0E0',
  accent: '#E60023',
  success: '#4CAF50',
  error: '#F44336',
};

/**
 * Pinterest layout pattern
 */
const PINTEREST_LAYOUT: LayoutPattern = {
  type: 'image',
  hasFixedAspectRatio: true,
  aspectRatio: '2:3',
  usesCardLayout: true,
  container: {
    className: 'pinterest-pin-card',
    styles: {
      borderRadius: '16px',
      backgroundColor: '#FFFFFF',
      border: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  header: {
    className: 'pinterest-pin-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: false,
    hasActionMenu: true,
  },
  content: {
    className: 'pinterest-pin-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'pinterest-pin-footer',
    actions: [
      { icon: '📌', label: 'Save', type: 'save' },
      { icon: '↗️', label: 'Share', type: 'share' },
      { icon: '⋯', label: 'More', type: 'more' },
    ],
  },
};

/**
 * Pinterest platform frame component
 */
export class PinterestFrame implements BasePlatformFrame {
  readonly platformId = 'pinterest';
  readonly platformName = 'Pinterest';
  readonly frameType = 'image-focused' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '2:3' as const;
  readonly brandColors = PINTEREST_COLORS;
  readonly layoutPattern = PINTEREST_LAYOUT;

  /**
   * Render Pinterest pin frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? PINTEREST_DARK_COLORS : PINTEREST_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="pinterest-context ${themeClass} platform-frame">
        <div class="pinterest-pin-card">
          <!-- Pin Image -->
          <div class="pinterest-pin-image">
            ${content.image ? `<img src="${content.image}" alt="${content.title || 'Pin'}" class="frame-placeholder-image" />` : '<div class="frame-placeholder-image"></div>'}
            <div class="pinterest-save-overlay">
              <button class="pinterest-save-btn">Save</button>
            </div>
          </div>

          <!-- Pin Content -->
          <div class="pinterest-pin-content frame-post-content">
            <h3 class="pinterest-pin-title frame-title">${content.title || 'Amazing Pin Title'}</h3>
            <p class="pinterest-pin-description frame-post-text-compact">${content.description || 'Pin description goes here...'}</p>

            <!-- Pin Footer -->
            <div class="pinterest-pin-footer frame-post-stats">
              <div class="pinterest-author">
                <div class="pinterest-avatar frame-avatar">
                  <div class="frame-avatar-placeholder">${(content.author || 'User')[0]}</div>
                </div>
                <div class="pinterest-author-info">
                  <span class="pinterest-author-name frame-username">${content.author || 'username'}</span>
                  <span class="pinterest-board-name frame-userhandle">${content.board || 'board-name'}</span>
                </div>
              </div>

              <div class="pinterest-stats">
                <span class="pinterest-stat-item frame-stat-item">
                  <span class="pinterest-stat-icon">📌</span>
                  <span class="pinterest-stat-count frame-stat-count">${content.saveCount || '234'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Pinterest chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="pinterest-context ${themeClass} platform-frame">
        <div class="pinterest-pin-card">
          <div class="pinterest-pin-image">
            <div class="frame-placeholder-image"></div>
            <div class="pinterest-save-overlay">
              <button class="pinterest-save-btn">Save</button>
            </div>
          </div>
          <div class="pinterest-pin-content frame-post-content">
            <h3 class="pinterest-pin-title frame-title">Amazing Pin Title</h3>
            <p class="pinterest-pin-description frame-post-text-compact">Pin description goes here...</p>
            <div class="pinterest-pin-footer frame-post-stats">
              <div class="pinterest-author">
                <div class="pinterest-avatar frame-avatar">
                  <div class="frame-avatar-placeholder">U</div>
                </div>
                <div class="pinterest-author-info">
                  <span class="pinterest-author-name frame-username">username</span>
                  <span class="pinterest-board-name frame-userhandle">board-name</span>
                </div>
              </div>
              <div class="pinterest-stats">
                <span class="pinterest-stat-item frame-stat-item">
                  <span class="pinterest-stat-icon">📌</span>
                  <span class="pinterest-stat-count frame-stat-count">234</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Pinterest
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? PINTEREST_DARK_COLORS : PINTEREST_COLORS;
    return {
      '--pinterest-bg': colors.background,
      '--pinterest-surface': colors.surface,
      '--pinterest-text-primary': colors.textPrimary,
      '--pinterest-text-secondary': colors.textSecondary,
      '--pinterest-border': colors.border,
      '--pinterest-accent': colors.accent,
      '--pinterest-link': colors.link,
    };
  }

  /**
   * Validate content for Pinterest frame
   */
  validateContent(content: FrameContentData): boolean {
    // Pinterest requires at least a title or image
    return !!(content.title || content.image);
  }
}

/**
 * Export singleton instance
 */
export const pinterestFrame = new PinterestFrame();

/**
 * Export factory function for consistency
 */
export function createPinterestFrame(): BasePlatformFrame {
  return pinterestFrame;
}
