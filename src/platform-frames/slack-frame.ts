/**
 * Slack Platform Frame Component
 *
 * Implements Slack-specific rendering logic for chat thread context frames.
 * Slack features include purple color scheme, workspace/channel sidebars,
 * message threads with reactions, and rich link cards.
 */

import type { BasePlatformFrame, LayoutPattern, PlatformBrandColors } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Slack-specific layout pattern
 */
const SLACK_LAYOUT: LayoutPattern = {
  chrome: 'three-panel',
  panels: ['workspace-sidebar', 'channel-sidebar', 'message-area'],
  aspectRatio: 'variable',
};

/**
 * Slack brand colors
 */
const SLACK_BRAND_COLORS: PlatformBrandColors = {
  primary: '#4A154B',
  secondary: '#E01E5A',
  background: '#1A1D1D',
  surface: '#3F0E40',
  text: '#FFFFFF',
};

/**
 * Slack frame component implementation
 */
export class SlackFrame implements BasePlatformFrame {
  readonly platformId = 'slack';
  readonly platformName = 'Slack';
  readonly frameType: BasePlatformFrame['frameType'] = 'messaging';
  readonly hasThemeSupport = true;
  readonly aspectRatio: BasePlatformFrame['aspectRatio'] = 'variable';
  readonly brandColors = SLACK_BRAND_COLORS;
  readonly layoutPattern = SLACK_LAYOUT;

  render(content: FrameContentData, theme: ThemeMode = 'dark'): string {
    const themeVars = this.getThemeVars(theme);
    return `
<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slack Context Frame</title>
  <link rel="stylesheet" href="src/public/messaging-base.css">
  <style>
    ${this.getFrameCSS(theme)}
  </style>
</head>
<body>
  ${this.renderFrameHTML(content, theme)}
</body>
</html>
    `.trim();
  }

  renderChrome(theme: ThemeMode = 'dark'): string {
    return this.render({}, theme);
  }

  getThemeVars(theme: ThemeMode = 'dark'): Record<string, string> {
    if (theme === 'light') {
      return {
        '--sl-bg': '#FFFFFF',
        '--sl-surface': '#F8F8F8',
        '--sl-workspace': '#4A154B',
        '--sl-text': '#1A1A1A',
        '--sl-text-secondary': '#616061',
        '--sl-accent': '#4A154B',
      };
    }
    return {
      '--sl-bg': '#1A1D1D',
      '--sl-surface': '#3F0E40',
      '--sl-workspace': '#3F0E40',
      '--sl-text': '#FFFFFF',
      '--sl-text-secondary': 'rgba(255, 255, 255, 0.7)',
      '--sl-accent': '#E01E5A',
    };
  }

  validateContent(content: FrameContentData): boolean {
    return !!content && typeof content === 'object';
  }

  private getFrameCSS(theme: ThemeMode): string {
    const themeVars = this.getThemeVars(theme);
    return `
      :root {
        ${Object.entries(themeVars).map(([key, value]) => `${key}: ${value};`).join('\n        ')}
      }

      body {
        margin: 0;
        padding: 20px;
        font-family: 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
        background: ${themeVars['--sl-bg']};
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .slack-context {
        width: 100%;
        max-width: 900px;
        height: 600px;
        background: ${themeVars['--sl-bg']};
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: flex;
      }

      /* Workspace Sidebar */
      .sl-workspace-sidebar {
        width: 64px;
        background: ${themeVars['--sl-workspace']};
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
        gap: 8px;
      }

      .sl-workspace-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: #FFFFFF;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sl-workspace-icon:hover {
        border-color: ${themeVars['--sl-accent']};
      }

      .sl-workspace-icon.active {
        background: #FFFFFF;
        color: ${themeVars['--sl-workspace']};
      }

      /* Channel Sidebar */
      .sl-channel-sidebar {
        width: 260px;
        background: ${themeVars['--sl-surface']};
        display: flex;
        flex-direction: column;
      }

      .sl-workspace-header {
        height: 56px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        font-weight: 700;
        font-size: 14px;
      }

      .sl-channel-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .sl-channel-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        border-radius: 4px;
        color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#1A1A1A'};
        cursor: pointer;
      }

      .sl-channel-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .sl-channel-item.active {
        background: rgba(255, 255, 255, 0.15);
      }

      /* Message Area */
      .sl-message-area {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .sl-messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }

      .sl-message {
        display: flex;
        margin-bottom: 16px;
      }

      .sl-message-avatar {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        background: ${themeVars['--sl-accent']};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: #FFFFFF;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .sl-message-content {
        flex: 1;
      }

      .sl-message-header {
        display: flex;
        align-items: baseline;
        margin-bottom: 4px;
      }

      .sl-message-sender {
        font-weight: 700;
        font-size: 14px;
        color: ${theme === 'dark' ? '#FFFFFF' : '#1A1A1A'};
      }

      .sl-message-time {
        font-size: 11px;
        color: ${themeVars['--sl-text-secondary']};
        margin-left: 8px;
      }

      .sl-message-text {
        font-size: 14px;
        color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1A1A1A'};
        line-height: 1.4;
      }

      /* Link Card */
      .sl-link-card {
        margin-top: 8px;
        background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F8F8F8'};
        border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'};
        border-radius: 8px;
        overflow: hidden;
        max-width: 420px;
      }

      .sl-link-card-image {
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, ${themeVars['--sl-accent']} 0%, #4A154B 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sl-link-card-content {
        padding: 12px;
      }

      .sl-link-card-title {
        font-size: 14px;
        font-weight: 700;
        color: ${theme === 'dark' ? '#FFFFFF' : '#1A1A1A'};
        margin-bottom: 4px;
      }

      .sl-link-card-desc {
        font-size: 12px;
        color: ${themeVars['--sl-text-secondary']};
        line-height: 1.4;
        margin-bottom: 8px;
      }

      .sl-link-card-domain {
        font-size: 11px;
        color: ${themeVars['--sl-text-secondary']};
      }

      /* Input Area */
      .sl-input-area {
        padding: 0 16px 16px 16px;
      }

      .sl-input-container {
        background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F8F8F8'};
        border-radius: 8px;
        padding: 0 12px;
        display: flex;
        align-items: center;
      }

      .sl-input {
        flex: 1;
        background: transparent;
        border: none;
        color: ${theme === 'dark' ? '#FFFFFF' : '#1A1A1A'};
        font-size: 14px;
        padding: 10px 0;
        outline: none;
      }

      .sl-input::placeholder {
        color: ${themeVars['--sl-text-secondary']};
      }
    `;
  }

  private renderFrameHTML(content: FrameContentData, theme: ThemeMode): string {
    const cardTitle = content.title || 'Example Page Title';
    const cardDesc = content.description || 'This is a sample description that would appear when sharing a link in Slack...';
    const cardDomain = content.domain || 'https://example.com';

    return `
  <div class="slack-context">
    <!-- Workspace Sidebar -->
    <div class="sl-workspace-sidebar">
      <div class="sl-workspace-icon active">DV</div>
      <div class="sl-workspace-icon">AC</div>
    </div>

    <!-- Channel Sidebar -->
    <div class="sl-channel-sidebar">
      <div class="sl-workspace-header">
        Dev Team
      </div>
      <div class="sl-channel-list">
        <div class="sl-channel-item">
          <span style="font-size: 18px; margin-right: 8px;">#</span>
          <span>general</span>
        </div>
        <div class="sl-channel-item active">
          <span style="font-size: 18px; margin-right: 8px;">#</span>
          <span>announcements</span>
        </div>
        <div class="sl-channel-item">
          <span style="font-size: 18px; margin-right: 8px;">🔒</span>
          <span>engineering</span>
        </div>
      </div>
    </div>

    <!-- Message Area -->
    <div class="sl-message-area">
      <div class="sl-messages-container">
        <!-- Placeholder message -->
        <div class="sl-message">
          <div class="sl-message-avatar">SM</div>
          <div class="sl-message-content">
            <div class="sl-message-header">
              <span class="sl-message-sender">Sarah Mitchell</span>
              <span class="sl-message-time">10:23 AM</span>
            </div>
            <div class="sl-message-text">
              Hey team! Check out this new resource I found.
            </div>
          </div>
        </div>

        <!-- Card Message -->
        <div class="sl-message">
          <div class="sl-message-avatar" style="background: #E01E5A;">JW</div>
          <div class="sl-message-content">
            <div class="sl-message-header">
              <span class="sl-message-sender">Jessica Wang</span>
              <span class="sl-message-time">10:35 AM</span>
            </div>
            <div class="sl-message-text">
              Here's the link I mentioned:
            </div>
            <div class="sl-link-card">
              <div class="sl-link-card-image">
                <span style="font-size: 48px; color: rgba(255,255,255,0.8);">🔗</span>
              </div>
              <div class="sl-link-card-content">
                <div class="sl-link-card-title">${cardTitle}</div>
                <div class="sl-link-card-desc">${cardDesc}</div>
                <div class="sl-link-card-domain">${cardDomain}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="sl-input-area">
        <div class="sl-input-container">
          <input type="text" class="sl-input" placeholder="Message #announcements">
        </div>
      </div>
    </div>
  </div>
    `.trim();
  }
}

export default SlackFrame;
