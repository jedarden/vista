/**
 * GitLab Platform Frame Component
 *
 * Developer platform frame for GitLab merge requests and issues with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * GitLab brand colors (light theme)
 */
const GITLAB_COLORS: PlatformBrandColors = {
  primary: '#7B5CFD',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  textPrimary: '#333238',
  textSecondary: '#5E5E6E',
  textMuted: '#737278',
  border: '#EAEAEB',
  link: '#7B5CFD',
  accent: '#7B5CFD',
  success: '#1F7E34',
  error: '#D93F0B',
};

/**
 * GitLab dark theme colors
 */
const GITLAB_DARK_COLORS: PlatformBrandColors = {
  primary: '#A78DFA',
  background: '#1F1E24',
  surface: '#292730',
  textPrimary: '#EBEBEB',
  textSecondary: '#A0A0A8',
  textMuted: '#737278',
  border: '#3F3D44',
  link: '#A78DFA',
  accent: '#A78DFA',
  success: '#3FB950',
  error: '#F88787',
};

/**
 * GitLab layout pattern
 */
const GITLAB_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'gitlab-mr-card',
    styles: {
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #EAEAEB',
    },
  },
  header: {
    className: 'gitlab-mr-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'gitlab-mr-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'gitlab-mr-footer',
    actions: [
      { icon: '👍', label: 'Upvote', type: 'upvote' },
      { icon: '💬', label: 'Comment', type: 'comment' },
      { icon: '🔀', label: 'Merge', type: 'merge' },
    ],
  },
};

/**
 * GitLab platform frame component
 */
export class GitLabFrame implements BasePlatformFrame {
  readonly platformId = 'gitlab';
  readonly platformName = 'GitLab';
  readonly frameType = 'collaboration' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = GITLAB_COLORS;
  readonly layoutPattern = GITLAB_LAYOUT;

  /**
   * Render GitLab MR frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? GITLAB_DARK_COLORS : GITLAB_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    const mrNumber = content.mrNumber || '!123';
    const statusIcon = content.status === 'merged' ? 'Ⓜ️' : content.status === 'closed' ? '✕' : '○';
    const statusClass = content.status === 'merged' ? 'merged' : content.status === 'closed' ? 'closed' : 'open';

    return `
      <div class="gitlab-context ${themeClass} platform-frame">
        <div class="gitlab-mr-card">
          <!-- MR Header -->
          <div class="gitlab-mr-header frame-post-meta">
            <div class="gitlab-mr-icon">
              <span class="gitlab-status-icon ${statusClass}">${statusIcon}</span>
            </div>
            <div class="gitlab-mr-meta frame-user-details">
              <div class="gitlab-title-line">
                <span class="gitlab-mr-number frame-title">${mrNumber}</span>
                <span class="gitlab-mr-title frame-username">${content.title || 'Merge request title goes here'}</span>
              </div>
              <div class="gitlab-meta-line">
                <span class="gitlab-project frame-userhandle">${content.project || 'user/project'}</span>
                <span class="gitlab-separator">·</span>
                <span class="gitlab-author frame-username">${content.author || 'username'}</span>
                <span class="gitlab-separator">·</span>
                <span class="gitlab-time frame-timestamp">${content.timeAgo || 'opened 2 hours ago'}</span>
              </div>
            </div>
          </div>

          <!-- MR Content -->
          <div class="gitlab-mr-content frame-post-content">
            <div class="gitlab-body frame-post-text">
              ${content.description || 'Merge request description goes here...'}
            </div>

            <!-- Code Block (if present) -->
            ${content.code ? `
              <div class="gitlab-code-block">
                <pre><code>${content.code}</code></pre>
              </div>
            ` : ''}

            <!-- Link Preview -->
            ${this.renderLinkPreview(content, theme)}
          </div>

          <!-- MR Footer -->
          <div class="gitlab-mr-footer frame-post-stats">
            <div class="gitlab-reactions">
              <button class="gitlab-reaction-btn frame-stat-item" title="👍 Thumbs up">
                <span class="gitlab-reaction-icon">👍</span>
                <span class="gitlab-reaction-count frame-stat-count">${content.upvoteCount || '5'}</span>
              </button>
              <button class="gitlab-reaction-btn frame-stat-item" title="🎉 Celebrate">
                <span class="gitlab-reaction-icon">🎉</span>
                <span class="gitlab-reaction-count frame-stat-count">${content.celebrateCount || '2'}</span>
              </button>
            </div>
            <div class="gitlab-comments">
              <span class="gitlab-comment-icon frame-stat-icon">💬</span>
              <span class="gitlab-comment-count frame-stat-count">${content.commentCount || '8'}</span>
            </div>
            <div class="gitlab-labels">
              ${content.labels ? content.labels.split(',').map(label =>
                `<span class="gitlab-label frame-user-badge">${label.trim()}</span>`
              ).join('') : '<span class="gitlab-label frame-user-badge">feature</span>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render GitLab chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="gitlab-context ${themeClass} platform-frame">
        <div class="gitlab-mr-card">
          <div class="gitlab-mr-header frame-post-meta">
            <div class="gitlab-mr-icon">
              <span class="gitlab-status-icon open">○</span>
            </div>
            <div class="gitlab-mr-meta frame-user-details">
              <div class="gitlab-title-line">
                <span class="gitlab-mr-number frame-title">!123</span>
                <span class="gitlab-mr-title frame-username">Merge request title goes here</span>
              </div>
              <div class="gitlab-meta-line">
                <span class="gitlab-project frame-userhandle">user/project</span>
                <span class="gitlab-separator">·</span>
                <span class="gitlab-author frame-username">username</span>
                <span class="gitlab-separator">·</span>
                <span class="gitlab-time frame-timestamp">opened 2 hours ago</span>
              </div>
            </div>
          </div>
          <div class="gitlab-mr-content frame-post-content">
            <div class="gitlab-body frame-post-text">
              Merge request description goes here...
            </div>
          </div>
          <div class="gitlab-mr-footer frame-post-stats">
            <div class="gitlab-reactions">
              <button class="gitlab-reaction-btn frame-stat-item" title="👍 Thumbs up">
                <span class="gitlab-reaction-icon">👍</span>
                <span class="gitlab-reaction-count frame-stat-count">5</span>
              </button>
              <button class="gitlab-reaction-btn frame-stat-item" title="🎉 Celebrate">
                <span class="gitlab-reaction-icon">🎉</span>
                <span class="gitlab-reaction-count frame-stat-count">2</span>
              </button>
            </div>
            <div class="gitlab-comments">
              <span class="gitlab-comment-icon frame-stat-icon">💬</span>
              <span class="gitlab-comment-count frame-stat-count">8</span>
            </div>
            <div class="gitlab-labels">
              <span class="gitlab-label frame-user-badge">feature</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for GitLab
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? GITLAB_DARK_COLORS : GITLAB_COLORS;
    return {
      '--gitlab-bg': colors.background,
      '--gitlab-surface': colors.surface,
      '--gitlab-text-primary': colors.textPrimary,
      '--gitlab-text-secondary': colors.textSecondary,
      '--gitlab-border': colors.border,
      '--gitlab-accent': colors.accent,
      '--gitlab-link': colors.link,
      '--gitlab-success': colors.success,
      '--gitlab-error': colors.error,
    };
  }

  /**
   * Validate content for GitLab frame
   */
  validateContent(content: FrameContentData): boolean {
    // GitLab requires at least a title
    return !!(content.title || content.mrNumber);
  }

  /**
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <div class="gitlab-link-preview frame-content-card">
        <div class="gitlab-link-content frame-neutral-content">
          <div class="gitlab-link-title frame-username">${content.title || 'Link Title'}</div>
          ${content.description ? `<div class="gitlab-link-description frame-post-text-compact">${content.description}</div>` : ''}
          <div class="gitlab-link-url frame-userhandle">${content.domain || content.url || 'gitlab.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const gitlabFrame = new GitLabFrame();

/**
 * Export factory function for consistency
 */
export function createGitLabFrame(): BasePlatformFrame {
  return gitlabFrame;
}
