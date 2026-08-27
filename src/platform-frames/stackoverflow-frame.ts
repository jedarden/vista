/**
 * Stack Overflow Platform Frame Component
 *
 * Q&A platform frame for Stack Overflow with dark/light theme support.
 */

import type { BasePlatformFrame, PlatformBrandColors, LayoutPattern } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Stack Overflow brand colors (light theme)
 */
const STACKOVERFLOW_COLORS: PlatformBrandColors = {
  primary: '#F48024',
  background: '#FFFFFF',
  surface: '#F8F9F9',
  textPrimary: '#232629',
  textSecondary: '#6A737C',
  textMuted: '#9199A1',
  border: '#D6D9DC',
  link: '#0077CC',
  accent: '#F48024',
  success: '#2F6F9F',
  error: '#D1383D',
};

/**
 * Stack Overflow dark theme colors
 */
const STACKOVERFLOW_DARK_COLORS: PlatformBrandColors = {
  primary: '#F48024',
  background: '#1E1E1E',
  surface: '#252526',
  textPrimary: '#D4D4D4',
  textSecondary: '#9CDCFE',
  textMuted: '#6A9955',
  border: '#3E3E42',
  link: '#4DB2FF',
  accent: '#F48024',
  success: '#4EC9B0',
  error: '#F48771',
};

/**
 * Stack Overflow layout pattern
 */
const STACKOVERFLOW_LAYOUT: LayoutPattern = {
  type: 'card',
  hasFixedAspectRatio: false,
  aspectRatio: 'variable',
  usesCardLayout: true,
  container: {
    className: 'stackoverflow-question-card',
    styles: {
      borderRadius: '3px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #D6D9DC',
    },
  },
  header: {
    className: 'stackoverflow-question-header',
    hasAvatar: false,
    hasUserInfo: true,
    hasTimestamp: true,
    hasActionMenu: false,
  },
  content: {
    className: 'stackoverflow-question-content',
    maxWidth: '100%',
  },
  footer: {
    className: 'stackoverflow-question-footer',
    actions: [
      { icon: '↑', label: 'Upvote', type: 'upvote' },
      { icon: '↓', label: 'Downvote', type: 'downvote' },
      { icon: '✓', label: 'Accept', type: 'accept' },
    ],
  },
};

/**
 * Stack Overflow platform frame component
 */
export class StackOverflowFrame implements BasePlatformFrame {
  readonly platformId = 'stackoverflow';
  readonly platformName = 'Stack Overflow';
  readonly frameType = 'qa-forum' as const;
  readonly hasThemeSupport = true;
  readonly aspectRatio = 'variable' as const;
  readonly brandColors = STACKOVERFLOW_COLORS;
  readonly layoutPattern = STACKOVERFLOW_LAYOUT;

  /**
   * Render Stack Overflow Q&A frame
   */
  render(content: FrameContentData, theme: ThemeMode = 'light'): string {
    const colors = theme === 'dark' ? STACKOVERFLOW_DARK_COLORS : STACKOVERFLOW_COLORS;
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    const isAnswer = content.isAnswer === true;
    const acceptedClass = content.accepted === true ? 'accepted' : '';

    return `
      <div class="stackoverflow-context ${themeClass} platform-frame">
        <div class="stackoverflow-question-card">
          <!-- Question Header -->
          <div class="stackoverflow-header frame-post-meta">
            <div class="stackoverflow-votes frame-stat-item">
              <div class="stackoverflow-vote-count frame-stat-count">${content.upvotes || '42'}</div>
              <div class="stackoverflow-vote-label">votes</div>
            </div>
            ${isAnswer ? `
              <div class="stackoverflow-answers frame-stat-item ${acceptedClass}">
                <div class="stackoverflow-answer-count frame-stat-count">${content.answerCount || '3'}</div>
                <div class="stackoverflow-answer-label">answers</div>
                ${content.accepted ? '<div class="stackoverflow-accepted-icon">✓</div>' : ''}
              </div>
            ` : ''}
            <div class="stackoverflow-views frame-stat-item">
              <div class="stackoverflow-view-count frame-stat-count">${content.views || '1k'}</div>
              <div class="stackoverflow-view-label">views</div>
            </div>
          </div>

          <!-- Question Title -->
          <div class="stackoverflow-title-section">
            <h3 class="stackoverflow-question-title frame-title">${content.title || 'How do I solve this programming problem?'}</h3>
          </div>

          <!-- Question Content -->
          <div class="stackoverflow-content frame-post-content">
            <div class="stackoverflow-body frame-post-text">
              ${content.description || 'Question description goes here...'}
            </div>

            <!-- Code Block (if present) -->
            ${content.code ? `
              <div class="stackoverflow-code-block">
                <pre><code>${content.code}</code></pre>
              </div>
            ` : ''}

            <!-- Tags -->
            <div class="stackoverflow-tags">
              ${content.tags ? content.tags.split(',').map(tag =>
                `<span class="stackoverflow-tag frame-user-badge">${tag.trim()}</span>`
              ).join('') : '<span class="stackoverflow-tag frame-user-badge">javascript</span><span class="stackoverflow-tag frame-user-badge">arrays</span>'}
            </div>
          </div>

          <!-- Footer -->
          <div class="stackoverflow-footer frame-post-stats">
            <div class="stackoverflow-author">
              <span class="stackoverflow-author-label">Asked by</span>
              <span class="stackoverflow-author-name frame-username">${content.author || 'developer123'}</span>
              <span class="stackoverflow-reputation frame-userhandle">${content.reputation || '1.2k'}</span>
            </div>
            <div class="stackoverflow-time frame-timestamp">${content.timeAgo || 'asked 2 hours ago'}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Stack Overflow chrome (frame without content)
   */
  renderChrome(theme: ThemeMode = 'light'): string {
    const themeClass = theme === 'light' ? 'light-theme' : 'dark-theme';
    return `
      <div class="stackoverflow-context ${themeClass} platform-frame">
        <div class="stackoverflow-question-card">
          <div class="stackoverflow-header frame-post-meta">
            <div class="stackoverflow-votes frame-stat-item">
              <div class="stackoverflow-vote-count frame-stat-count">42</div>
              <div class="stackoverflow-vote-label">votes</div>
            </div>
            <div class="stackoverflow-answers frame-stat-item">
              <div class="stackoverflow-answer-count frame-stat-count">3</div>
              <div class="stackoverflow-answer-label">answers</div>
            </div>
            <div class="stackoverflow-views frame-stat-item">
              <div class="stackoverflow-view-count frame-stat-count">1k</div>
              <div class="stackoverflow-view-label">views</div>
            </div>
          </div>
          <div class="stackoverflow-title-section">
            <h3 class="stackoverflow-question-title frame-title">How do I solve this programming problem?</h3>
          </div>
          <div class="stackoverflow-content frame-post-content">
            <div class="stackoverflow-body frame-post-text">
              Question description goes here...
            </div>
            <div class="stackoverflow-tags">
              <span class="stackoverflow-tag frame-user-badge">javascript</span>
              <span class="stackoverflow-tag frame-user-badge">arrays</span>
            </div>
          </div>
          <div class="stackoverflow-footer frame-post-stats">
            <div class="stackoverflow-author">
              <span class="stackoverflow-author-label">Asked by</span>
              <span class="stackoverflow-author-name frame-username">developer123</span>
              <span class="stackoverflow-reputation frame-user-badge">1.2k</span>
            </div>
            <div class="stackoverflow-time frame-timestamp">asked 2 hours ago</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get theme variables for Stack Overflow
   */
  getThemeVars(theme: ThemeMode = 'light'): Record<string, string> {
    const colors = theme === 'dark' ? STACKOVERFLOW_DARK_COLORS : STACKOVERFLOW_COLORS;
    return {
      '--stackoverflow-bg': colors.background,
      '--stackoverflow-surface': colors.surface,
      '--stackoverflow-text-primary': colors.textPrimary,
      '--stackoverflow-text-secondary': colors.textSecondary,
      '--stackoverflow-border': colors.border,
      '--stackoverflow-accent': colors.accent,
      '--stackoverflow-link': colors.link,
      '--stackoverflow-success': colors.success,
      '--stackoverflow-error': colors.error,
    };
  }

  /**
   * Validate content for Stack Overflow frame
   */
  validateContent(content: FrameContentData): boolean {
    // Stack Overflow requires at least a title
    return !!(content.title || content.question);
  }

  /**
   * Render tags section
   */
  private renderTags(tags: string | undefined): string {
    if (!tags) {
      return '<span class="stackoverflow-tag frame-user-badge">javascript</span>';
    }

    return tags.split(',').map(tag =>
      `<span class="stackoverflow-tag frame-user-badge">${tag.trim()}</span>`
    ).join('');
  }
}

/**
 * Export singleton instance
 */
export const stackoverflowFrame = new StackOverflowFrame();

/**
 * Export factory function for consistency
 */
export function createStackOverflowFrame(): BasePlatformFrame {
  return stackoverflowFrame;
}
