/**
 * Gmail Platform Frame Component
 *
 * Email platform frame for Gmail with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Gmail brand colors
 */
const GMAIL_COLORS: PlatformBrandColors = {
  primary: '#EA4335',
  secondary: '#FBBC05',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  textMuted: '#9AA0A6',
  border: '#E0E0E0',
  link: '#185ABC',
  accent: '#1A73E8',
  success: '#1E8E3E',
  error: '#D93025',
};

/**
 * Gmail dark theme colors
 */
const GMAIL_DARK_COLORS: PlatformBrandColors = {
  primary: '#E8EAED',
  secondary: '#F4F4F5',
  background: '#1F1F1F',
  surface: '#2D2E2F',
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  textMuted: '#5F6368',
  border: '#3C3C3C',
  link: '#8AB4F8',
  accent: '#8AB4F8',
  success: '#81C995',
  error: '#F28B82',
};

/**
 * Gmail layout pattern
 */
const GMAIL_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'gmail-email-card',
    styles: {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E0E0E0',
    },
  },
  header: {
    className: 'gmail-email-header',
    hasAvatar: false,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'gmail-email-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'gmail-email-footer',
    actions: [
      { icon: '↩️', label: 'Reply', type: 'reply' },
      { icon: '⭐', label: 'Star', type: 'star' },
      { icon: '📧', label: 'Archive', type: 'archive' },
    ],
  },
};

/**
 * Gmail platform frame component
 */
export class GmailFrame implements BasePlatformFrame {
  readonly platformId = 'gmail';
  readonly platformName = 'Gmail';
  readonly frameType = 'email' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = GMAIL_COLORS;
  readonly layoutPattern = GMAIL_LAYOUT;

  /**
   * Render Gmail email frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? GMAIL_DARK_COLORS : GMAIL_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="gmail-context ${themeClass} platform-frame">
        <div class="gmail-email-card">
          <!-- Email Header -->
          <div class="gmail-email-header frame-post-meta">
            <div class="gmail-avatar frame-avatar">
              <div class="frame-avatar-placeholder">${(content.author || 'User')[0]}</div>
            </div>
            <div class="gmail-email-meta frame-user-details">
              <div class="gmail-sender-line">
                <span class="gmail-sender-name frame-username">${content.author || 'Sender Name'}</span>
                <span class="gmail-email-address frame-userhandle">&lt;${content.email || 'sender@example.com'}&gt;</span>
              </div>
              <div class="gmail-subject-line">
                <span class="gmail-subject frame-title">${content.subject || 'Email Subject'}</span>
              </div>
              <div class="gmail-email-time frame-timestamp">${content.timeAgo || '10:30 AM'}</div>
            </div>
          </div>

          <!-- Email Content -->
          <div class="gmail-email-content frame-post-content">
            <div class="gmail-body frame-post-text">
              ${content.description || 'Email body content goes here...'}
            </div>

            <!-- Link Preview -->
            ${this.renderLinkPreview(content, theme)}
          </div>

          <!-- Email Actions -->
          <div class="gmail-email-actions frame-post-stats">
            <button class="gmail-action-btn frame-stat-item" title="Reply">
              <span class="gmail-action-icon">↩️</span>
            </button>
            <button class="gmail-action-btn frame-stat-item" title="Star">
              <span class="gmail-action-icon">⭐</span>
            </button>
            <button class="gmail-action-btn frame-stat-item" title="Archive">
              <span class="gmail-action-icon">📧</span>
            </button>
            <div class="gmail-action-spacer"></div>
            <span class="gmail-label frame-user-badge">${content.label || 'Inbox'}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Gmail chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="gmail-context ${themeClass} platform-frame">
        <div class="gmail-email-card">
          <div class="gmail-email-header frame-post-meta">
            <div class="gmail-avatar frame-avatar">
              <div class="frame-avatar-placeholder">S</div>
            </div>
            <div class="gmail-email-meta frame-user-details">
              <div class="gmail-sender-line">
                <span class="gmail-sender-name frame-username">Sender Name</span>
                <span class="gmail-email-address frame-userhandle">&lt;sender@example.com&gt;</span>
              </div>
              <div class="gmail-subject-line">
                <span class="gmail-subject frame-title">Email Subject</span>
              </div>
              <div class="gmail-email-time frame-timestamp">10:30 AM</div>
            </div>
          </div>
          <div class="gmail-email-content frame-post-content">
            <div class="gmail-body frame-post-text">
              Email body content goes here...
            </div>
          </div>
          <div class="gmail-email-actions frame-post-stats">
            <button class="gmail-action-btn frame-stat-item" title="Reply">
              <span class="gmail-action-icon">↩️</span>
            </button>
            <button class="gmail-action-btn frame-stat-item" title="Star">
              <span class="gmail-action-icon">⭐</span>
            </button>
            <button class="gmail-action-btn frame-stat-item" title="Archive">
              <span class="gmail-action-icon">📧</span>
            </button>
            <div class="gmail-action-spacer"></div>
            <span class="gmail-label frame-user-badge">Inbox</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Gmail
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? GMAIL_DARK_COLORS : GMAIL_COLORS;
    return {
      '--gmail-bg': colors.background,
      '--gmail-surface': colors.surface,
      '--gmail-text-primary': colors.textPrimary,
      '--gmail-text-secondary': colors.textSecondary,
      '--gmail-border': colors.border,
      '--gmail-accent': colors.accent,
      '--gmail-link': colors.link,
    };
  }

  /**
   * Validate content for Gmail frame
   */
  validateContent(content: FrameContentData): boolean {
    // Gmail requires at least a subject or body
    return !!(content.subject || content.description || content.title);
  }

  /**
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <div class="gmail-link-preview frame-content-card">
        ${content.image ? `<div class="gmail-link-image frame-placeholder-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="gmail-link-content frame-neutral-content">
          <div class="gmail-link-title frame-username">${content.title || 'Link Title'}</div>
          ${content.description ? `<div class="gmail-link-description frame-post-text-compact">${content.description}</div>` : ''}
          <div class="gmail-link-url frame-userhandle">${content.domain || content.url || 'example.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const gmailFrame = new GmailFrame();

/**
 * Export factory function for consistency
 */
export function createGmailFrame(): BasePlatformFrame {
  return gmailFrame;
}
