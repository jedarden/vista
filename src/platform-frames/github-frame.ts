/**
 * GitHub Platform Frame Component
 *
 * Developer platform frame for GitHub issues and PRs with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * GitHub brand colors (light theme)
 */
const GITHUB_COLORS: PlatformBrandColors = {
  primary: '#0969DA',
  background: '#FFFFFF',
  surface: '#F6F8FC',
  textPrimary: '#24292F',
  textSecondary: '#57606A',
  textMuted: '#8B949E',
  border: '#D0D7DE',
  link: '#0969DA',
  accent: '#0969DA',
  success: '#1A7F37',
  error: '#CF222E',
};

/**
 * GitHub dark theme colors
 */
const GITHUB_DARK_COLORS: PlatformBrandColors = {
  primary: '#58A6FF',
  background: '#0D1117',
  surface: '#161B22',
  textPrimary: '#C9D1D9',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  border: '#30363D',
  link: '#58A6FF',
  accent: '#58A6FF',
  success: '#3FB950',
  error: '#F85149',
};

/**
 * GitHub layout pattern
 */
const GITHUB_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'github-issue-card',
    styles: {
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #D0D7DE',
    },
  },
  header: {
    className: 'github-issue-header',
    hasAvatar: true,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'github-issue-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'github-issue-footer',
    actions: [
      { icon: '👍', label: 'React', type: 'react' },
      { icon: '💬', label: 'Comment', type: 'comment' },
      { icon: '📋', label: 'Copy', type: 'copy' },
    ],
  },
};

/**
 * GitHub platform frame component
 */
export class GitHubFrame implements BasePlatformFrame {
  readonly platformId = 'github';
  readonly platformName = 'GitHub';
  readonly frameType = 'collaboration' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = GITHUB_COLORS;
  readonly layoutPattern = GITHUB_LAYOUT;

  /**
   * Render GitHub issue frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? GITHUB_DARK_COLORS : GITHUB_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    const issueNumber = content.issueNumber || '#123';
    const statusIcon = content.status === 'closed' ? '✓' : '○';
    const statusClass = content.status === 'closed' ? 'closed' : 'open';

    return `
      <div class="github-context ${themeClass} platform-frame">
        <div class="github-issue-card">
          <!-- Issue Header -->
          <div class="github-issue-header frame-post-meta">
            <div class="github-issue-icon">
              <span class="github-status-icon ${statusClass}">${statusIcon}</span>
            </div>
            <div class="github-issue-meta frame-user-details">
              <div class="github-title-line">
                <span class="github-issue-number frame-title">${issueNumber}</span>
                <span class="github-issue-title frame-username">${content.title || 'Issue title goes here'}</span>
              </div>
              <div class="github-meta-line">
                <span class="github-repo frame-userhandle">${content.repo || 'user/repo'}</span>
                <span class="github-separator">·</span>
                <span class="github-author frame-username">${content.author || 'username'}</span>
                <span class="github-separator">·</span>
                <span class="github-time frame-timestamp">${content.timeAgo || 'opened 2 hours ago'}</span>
              </div>
            </div>
          </div>

          <!-- Issue Content -->
          <div class="github-issue-content frame-post-content">
            <div class="github-body frame-post-text">
              ${content.description || 'Issue description goes here...'}
            </div>

            <!-- Code Block (if present) -->
            ${content.code ? `
              <div class="github-code-block">
                <pre><code>${content.code}</code></pre>
              </div>
            ` : ''}

            <!-- Link Preview -->
            ${this.renderLinkPreview(content, theme)}
          </div>

          <!-- Issue Footer -->
          <div class="github-issue-footer frame-post-stats">
            <div class="github-reactions">
              <button class="github-reaction-btn frame-stat-item" title="👍 Thumbs up">
                <span class="github-reaction-icon">👍</span>
                <span class="github-reaction-count frame-stat-count">${content.reactionCount || '3'}</span>
              </button>
              <button class="github-reaction-btn frame-stat-item" title="🎉 Celebrate">
                <span class="github-reaction-icon">🎉</span>
                <span class="github-reaction-count frame-stat-count">${content.celebrateCount || '1'}</span>
              </button>
            </div>
            <div class="github-comments">
              <span class="github-comment-icon frame-stat-icon">💬</span>
              <span class="github-comment-count frame-stat-count">${content.commentCount || '5'}</span>
            </div>
            <div class="github-labels">
              ${content.labels ? content.labels.split(',').map(label =>
                `<span class="github-label frame-user-badge">${label.trim()}</span>`
              ).join('') : '<span class="github-label frame-user-badge">enhancement</span>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render GitHub chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="github-context ${themeClass} platform-frame">
        <div class="github-issue-card">
          <div class="github-issue-header frame-post-meta">
            <div class="github-issue-icon">
              <span class="github-status-icon open">○</span>
            </div>
            <div class="github-issue-meta frame-user-details">
              <div class="github-title-line">
                <span class="github-issue-number frame-title">#123</span>
                <span class="github-issue-title frame-username">Issue title goes here</span>
              </div>
              <div class="github-meta-line">
                <span class="github-repo frame-userhandle">user/repo</span>
                <span class="github-separator">·</span>
                <span class="github-author frame-username">username</span>
                <span class="github-separator">·</span>
                <span class="github-time frame-timestamp">opened 2 hours ago</span>
              </div>
            </div>
          </div>
          <div class="github-issue-content frame-post-content">
            <div class="github-body frame-post-text">
              Issue description goes here...
            </div>
          </div>
          <div class="github-issue-footer frame-post-stats">
            <div class="github-reactions">
              <button class="github-reaction-btn frame-stat-item" title="👍 Thumbs up">
                <span class="github-reaction-icon">👍</span>
                <span class="github-reaction-count frame-stat-count">3</span>
              </button>
              <button class="github-reaction-btn frame-stat-item" title="🎉 Celebrate">
                <span class="github-reaction-icon">🎉</span>
                <span class="github-reaction-count frame-stat-count">1</span>
              </button>
            </div>
            <div class="github-comments">
              <span class="github-comment-icon frame-stat-icon">💬</span>
              <span class="github-comment-count frame-stat-count">5</span>
            </div>
            <div class="github-labels">
              <span class="github-label frame-user-badge">enhancement</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for GitHub
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? GITHUB_DARK_COLORS : GITHUB_COLORS;
    return {
      '--github-bg': colors.background,
      '--github-surface': colors.surface,
      '--github-text-primary': colors.textPrimary,
      '--github-text-secondary': colors.textSecondary,
      '--github-border': colors.border,
      '--github-accent': colors.accent,
      '--github-link': colors.link,
      '--github-success': colors.success,
      '--github-error': colors.error,
    };
  }

  /**
   * Validate content for GitHub frame
   */
  validateContent(content: FrameContentData): boolean {
    // GitHub requires at least a title
    return !!(content.title || content.issueNumber);
  }

  /**
   * Render link preview card
   */
  private renderLinkPreview(content: FrameContentData, theme: ThemeMode): string {
    if (!content.title && !content.image) {
      return '';
    }

    return `
      <div class="github-link-preview frame-content-card">
        <div class="github-link-content frame-neutral-content">
          <div class="github-link-title frame-username">${content.title || 'Link Title'}</div>
          ${content.description ? `<div class="github-link-description frame-post-text-compact">${content.description}</div>` : ''}
          <div class="github-link-url frame-userhandle">${content.domain || content.url || 'github.com'}</div>
        </div>
      </div>
    `;
  }
}

/**
 * Export singleton instance
 */
export const githubFrame = new GitHubFrame();

/**
 * Export factory function for consistency
 */
export function createGitHubFrame(): BasePlatformFrame {
  return githubFrame;
}
