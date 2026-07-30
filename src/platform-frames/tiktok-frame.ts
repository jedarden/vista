/**
 * TikTok Platform Frame Component
 *
 * Stub implementation for TikTok video platform frame rendering.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * TikTok brand colors
 */
const TIKTOK_COLORS: PlatformBrandColors = {
  primary: '#000000',
  background: '#000000',
  surface: '#121212',
  textPrimary: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textMuted: '#6A6A6A',
  border: '#2A2A2A',
  link: '#FFFFFF',
  accent: '#FE2C55',
  success: '#00C853',
  error: '#FF3D00',
};

/**
 * TikTok layout pattern
 */
const TIKTOK_LAYOUT: LayoutPattern = {
  type: 'video',
  hasFixedAspectRatio: true,
  aspectRatio: '9:16',
  usesCardLayout: false,
  container: {
    className: 'tt-video-card',
    styles: {
      backgroundColor: '#000000',
      border: 'none',
      position: 'relative',
    },
  },
  header: {
    className: 'tt-right-sidebar',
    hasAvatar: false,
    hasUserInfo: false,
    hasTimestamp: false,
    hasActionMenu: false,
  },
  content: {
    className: 'tt-bottom-overlay',
    maxWidth: '100%',
  },
  footer: {
    className: 'tt-right-sidebar',
    actions: [
      { icon: '♡', label: 'Like', type: 'like' },
      { icon: '💬', label: 'Comment', type: 'comment' },
      { icon: '↗', label: 'Share', type: 'share' },
      { icon: '💾', label: 'Save', type: 'other' },
    ],
  },
};

/**
 * TikTok platform frame component
 */
export class TikTokFrame implements BasePlatformFrame {
  readonly platformId = 'tiktok';
  readonly platformName = 'TikTok';
  readonly frameType = 'video-platform' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = '9:16' as const;
  readonly brandColors = TIKTOK_COLORS;
  readonly layoutPattern = TIKTOK_LAYOUT;

  /**
   * Render TikTok video frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'dark'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="tiktok-context ${themeClass} platform-frame">
        <div class="tt-video-card">
          <!-- Video Container -->
          <div class="tt-video-container">
            ${content.image ? `<div class="tt-video-placeholder" style="background-image: url('${content.image}')"></div>` : '<div class="tt-video-placeholder"></div>'}

            <!-- Right Sidebar Actions -->
            <div class="tt-right-sidebar">
              <div class="tt-action-btn">
                <span class="tt-action-icon">♡</span>
                <span class="tt-action-count">${content.likeCount || '24K'}</span>
              </div>
              <div class="tt-action-btn">
                <span class="tt-action-icon">💬</span>
                <span class="tt-action-count">${content.commentCount || '1.2K'}</span>
              </div>
              <div class="tt-action-btn">
                <span class="tt-action-icon">↗</span>
                <span class="tt-action-count">${content.shareCount || '8.5K'}</span>
              </div>
              <div class="tt-action-btn">
                <span class="tt-action-icon">💾</span>
                <span class="tt-action-count">${content.saveCount || '3.2K'}</span>
              </div>
            </div>

            <!-- Bottom Overlay -->
            <div class="tt-bottom-overlay">
              <div class="tt-username">@${content.username || content.author || 'tiktok_creator'}</div>
              <div class="tt-caption">${content.description || 'Check out this amazing content! 🔗 #fyp #viral #trending'}</div>
              <div class="tt-music">🎵 ${content.music || 'Original Sound - Artist Name'}</div>
              <div class="tt-video-meta">${content.viewCount || '2.3M'} views · Posted ${content.timeAgo || '3 hours ago'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render TikTok chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'dark'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="tiktok-context ${themeClass} platform-frame">
        <div class="tt-video-card">
          <div class="tt-video-container">
            <div class="tt-video-placeholder"></div>
            <div class="tt-right-sidebar">
              <div class="tt-action-btn">
                <span class="tt-action-icon">♡</span>
                <span class="tt-action-count">--</span>
              </div>
              <div class="tt-action-btn">
                <span class="tt-action-icon">💬</span>
                <span class="tt-action-count">--</span>
              </div>
              <div class="tt-action-btn">
                <span class="tt-action-icon">↗</span>
                <span class="tt-action-count">--</span>
              </div>
              <div class="tt-action-btn">
                <span class="tt-action-icon">💾</span>
                <span class="tt-action-count">--</span>
              </div>
            </div>
            <div class="tt-bottom-overlay">
              <div class="tt-username">@username</div>
              <div class="tt-caption">Video caption goes here... 🔗 #fyp #viral</div>
              <div class="tt-music">🎵 Original Sound - Artist Name</div>
              <div class="tt-video-meta">2.3M views · Posted 3 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for TikTok
   */
  getThemeVars(theme: ThemeMode = 'dark'): Record<string, string> {
    // TikTok now uses CSS context classes, so this returns empty
    // The theme variables are applied via .tiktok-context and theme classes
    return {};
  }

  /**
   * Validate content for TikTok frame
   */
  validateContent(content: FrameContentData): boolean {
    // TikTok requires at least a description or video/image
    return !!(content.description || content.image || content.title);
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
}

/**
 * Export singleton instance
 */
export const tiktokFrame = new TikTokFrame();

/**
 * Export factory function for consistency
 */
export function createTikTokFrame(): BasePlatformFrame {
  return tiktokFrame;
}
