/**
 * Outlook Platform Frame Component
 *
 * Email platform frame for Outlook with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Outlook brand colors
 */
const OUTLOOK_COLORS: PlatformBrandColors = {
  primary: '#0078D4',
  background: '#F3F2F1',
  surface: '#FFFFFF',
  textPrimary: '#323130',
  textSecondary: '#605E5C',
  textMuted: '#A19F9D',
  border: '#E1DFDD',
  link: '#0078D4',
  accent: '#0078D4',
  success: '#107C10',
  error: '#A80000',
};

/**
 * Outlook dark theme colors
 */
const OUTLOOK_DARK_COLORS: PlatformBrandColors = {
  primary: '#605E5C',
  background: '#1F1F1F',
  surface: '#292929',
  textPrimary: '#FFFFFF',
  textSecondary: '#A19F9D',
  textMuted: '#605E5C',
  border: '#3B3A39',
  link: '#4FADFF',
  accent: '#4FADFF',
  success: '#6CCB6F',
  error: '#F88787',
};

/**
 * Outlook layout pattern
 */
const OUTLOOK_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'outlook-email-card',
    styles: {
      borderRadius: '4px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E1DFDD',
    },
  },
  header: {
    className: 'outlook-email-header',
    hasAvatar: false,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'outlook-email-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'outlook-email-footer',
    actions: [
      { icon: '↩️', label: 'Reply', type: 'reply' },
      { icon: '↪️', label: 'Reply All', type: 'reply-all' },
      { icon: '⏏️', label: 'Forward', type: 'forward' },
    ],
  },
};

/**
 * Outlook platform frame component
 */
export class OutlookFrame implements BasePlatformFrame {
  readonly platformId = 'outlook';
  readonly platformName = 'Outlook';
  readonly frameType = 'email' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = OUTLOOK_COLORS;
  readonly layoutPattern = OUTLOOK_LAYOUT;

  /**
   * Render Outlook email frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? OUTLOOK_DARK_COLORS : OUTLOOK_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';

    return `
      <div class="outlook-context ${themeClass} platform-frame">
        <div class="outlook-email-card">
          <!-- Email Header -->
          <div class="outlook-email-header frame-post-meta">
            <div class="outlook-avatar frame-avatar">
              <div class="frame-avatar-placeholder">${(content.author || 'User')[0]}</div>
            </div>
            <div class="outlook-email-meta frame-user-details">
              <div class="outlook-from-line">
                <span class="outlook-from-label">From:</span>
                <span class="outlook-sender-name frame-username">${content.author || 'Sender Name'}</span>
                <span class="outlook-email-address frame-userhandle">&lt;${content.email || 'sender@example.com'}&gt;</span>
              </div>
              <div class="outlook-subject-line">
                <span class="outlook-subject-label">Subject:</span>
                <span class="outlook-subject frame-title">${content.subject || 'Email Subject'}</span>
              </div>
              <div class="outlook-email-time frame-timestamp">${content.timeAgo || 'Today, 10:30 AM'}</div>
            </div>
          </div>

          <!-- Email Content -->
          <div class="outlook-email-content frame-post-content">
            <div class="outlook-body frame-post-text">
              ${content.description || 'Email body content goes here...'}
            </div>

            <!-- Link Preview -->
            ${this.renderLinkPreview(content, theme)}
          </div>

          <!-- Email Actions -->
          <div class="outlook-email-actions frame-post-stats">
            <button class="outlook-action-btn frame-stat-item" title="Reply">
              <span class="outlook-action-icon">↩️</span>
              <span class="outlook-action-label">Reply</span>
            </button>
            <button class="outlook-action-btn frame-stat-item" title="Reply All">
              <span class="outlook-action-icon">↪️</span>
              <span class="outlook-action-label">Reply All</span>
            </button>
            <button class="outlook-action-btn frame-stat-item" title="Forward">
              <span class="outlook-action-icon">⏏️</span>
              <span class="outlook-action-label">Forward</span>
            </button>
            <div class="outlook-action-spacer"></div>
            <span class="outlook-folder frame-user-badge">${content.folder || 'Inbox'}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Outlook chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="outlook-context ${themeClass} platform-frame">
        <div class="outlook-email-card">
          <div class="outlook-email-header frame-post-meta">
            <div class="outlook-avatar frame-avatar">
              <div class="frame-avatar-placeholder">S</div>
            </div>
            <div class="outlook-email-meta frame-user-details">
              <div class="outlook-from-line">
                <span class="outlook-from-label">From:</span>
                <span class="outlook-sender-name frame-username">Sender Name</span>
                <span class="outlook-email-address frame-userhandle">&lt;sender@example.com&gt;</span>
              </div>
              <div class="outlook-subject-line">
                <span class="outlook-subject-label">Subject:</span>
                <span class="outlook-subject frame-title">Email Subject</span>
              </div>
              <div class="outlook-email-time frame-timestamp">Today, 10:30 AM</div>
            </div>
          </div>
          <div class="outlook-email-content frame-post-content">
            <div class="outlook-body frame-post-text">
              Email body content goes here...
            </div>
          </div>
          <div class="outlook-email-actions frame-post-stats">
            <button class="outlook-action-btn frame-stat-item" title="Reply">
              <span class="outlook-action-icon">↩️</span>
              <span class="outlook-action-label">Reply</span>
            </button>
            <button class="outlook-action-btn frame-stat-item" title="Reply All">
              <span class="outlook-action-icon">↪️</span>
              <span class="outlook-action-label">Reply All</span>
            </button>
            <button class="outlook-action-btn frame-stat-item" title="Forward">
              <span class="outlook-action-icon">⏏️</span>
              <span class="outlook-action-label">Forward</span>
            </button>
            <div class="outlook-action-spacer"></div>
            <span class="outlook-folder frame-user-badge">Inbox</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Outlook
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? OUTLOOK_DARK_COLORS : OUTLOOK_COLORS;
    return {
      '--outlook-bg': colors.background,
      '--outlook-surface': colors.surface,
      '--outlook-text-primary': colors.textPrimary,
      '--outlook-text-secondary': colors.textSecondary,
      '--outlook-border': colors.border,
      '--outlook-accent': colors.accent,
      '--outlook-link': colors.link,
    };
  }

  /**
   * Validate content for Outlook frame
   */
  validateContent(content: FrameContentData): boolean {
    // Outlook requires at least a subject or body
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
      <div class="outlook-link-preview frame-content-card">
        ${content.image ? `<div class="outlook-link-image frame-placeholder-image" style="background-image: url('${content.image}')"></div>` : ''}
        <div class="outlook-link-content frame-neutral-content">
          <div class="outlook-link-title frame-username">${content.title || 'Link Title'}</div>
          ${content.description ? `<div class="outlook-link-description frame-post-text-compact">${content.description}</div>` : ''}
          <div class="outlook-link-url frame-userhandle">${content.domain || content.url || 'example.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const outlookFrame = new OutlookFrame();

/**
 * Export factory function for consistency
 */
export function createOutlookFrame(): BasePlatformFrame {
  return outlookFrame;
}
