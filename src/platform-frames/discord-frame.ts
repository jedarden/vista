/**
 * Discord Platform Frame Component
 *
 * Implements Discord-specific rendering logic for chat thread context frames.
 * Discord features include blurple color scheme, server/channel sidebars,
 * message threads with reactions, and rich link cards.
 */

import type { BasePlatformFrame, LayoutPattern, PlatformBrandColors } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Discord-specific layout pattern
 */
const DISCORD_LAYOUT: LayoutPattern = {
  chrome: 'three-panel',
  panels: ['server-sidebar', 'channel-sidebar', 'message-area'],
  aspectRatio: 'variable',
};

/**
 * Discord brand colors
 */
const DISCORD_BRAND_COLORS: PlatformBrandColors = {
  primary: '#5865F2',
  secondary: '#EB459E',
  background: '#313338',
  surface: '#2B2D31',
  text: '#E0E0E0',
};

/**
 * Discord frame component implementation
 */
export class DiscordFrame implements BasePlatformFrame {
  readonly platformId = 'discord';
  readonly platformName = 'Discord';
  readonly frameType: BasePlatformFrame['frameType'] = 'messaging';
  readonly hasThemeSupport = true;
  readonly aspectRatio: BasePlatformFrame['aspectRatio'] = 'variable';
  readonly brandColors = DISCORD_BRAND_COLORS;
  readonly layoutPattern = DISCORD_LAYOUT;

  /**
   * Render complete Discord context frame with content
   */
  render(content: FrameContentData, theme: ThemeMode = 'dark'): string {
    const themeVars = this.getThemeVars(theme);
    return `
<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord Context Frame</title>
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

  /**
   * Render Discord chrome without content
   */
  renderChrome(theme: ThemeMode = 'dark'): string {
    return this.render({}, theme);
  }

  /**
   * Get CSS variables for Discord theme
   */
  getThemeVars(theme: ThemeMode = 'dark'): Record<string, string> {
    if (theme === 'light') {
      return {
        '--dc-bg': '#FFFFFF',
        '--dc-surface': '#F2F3F5',
        '--dc-text': '#060607',
        '--dc-text-secondary': '#4F5660',
        '--dc-accent': '#5865F2',
        '--dc-brand': '#5865F2',
      };
    }
    return {
      '--dc-bg': '#313338',
      '--dc-surface': '#2B2D31',
      '--dc-text': '#E0E0E0',
      '--dc-text-secondary': '#B5BAC1',
      '--dc-accent': '#5865F2',
      '--dc-brand': '#5865F2',
    };
  }

  /**
   * Validate content data for Discord frame
   */
  validateContent(content: FrameContentData): boolean {
    if (!content || typeof content !== 'object') {
      return false;
    }
    return true;
  }

  /**
   * Get frame-specific CSS styles
   */
  private getFrameCSS(theme: ThemeMode): string {
    const themeVars = this.getThemeVars(theme);
    return `
      :root {
        ${Object.entries(themeVars).map(([key, value]) => `${key}: ${value};`).join('\n        ')}
      }

      body {
        margin: 0;
        padding: 20px;
        font-family: 'gg sans', 'Noto Sans', Helvetica, Arial, sans-serif;
        background: ${themeVars['--dc-bg']};
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .discord-context {
        width: 100%;
        max-width: 900px;
        height: 600px;
        background: ${themeVars['--dc-bg']};
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: flex;
      }

      /* Server Sidebar */
      .dc-server-sidebar {
        width: 72px;
        background: ${theme === 'dark' ? '#1E1F22' : '#E3E5E8'};
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
        gap: 8px;
        overflow-y: auto;
      }

      .dc-server-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: ${themeVars['--dc-surface']};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: ${themeVars['--dc-text']};
        cursor: pointer;
        transition: border-radius 0.2s ease, background-color 0.2s ease;
      }

      .dc-server-icon:hover {
        border-radius: 16px;
        background: ${themeVars['--dc-accent']};
      }

      .dc-server-icon.active {
        border-radius: 16px;
        background: ${themeVars['--dc-accent']};
      }

      /* Channel Sidebar */
      .dc-channel-sidebar {
        width: 240px;
        background: ${theme === 'dark' ? '#2B2D31' : '#F2F3F5'};
        display: flex;
        flex-direction: column;
      }

      .dc-server-header {
        height: 48px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 14px;
        color: ${themeVars['--dc-text']};
        border-bottom: ${theme === 'dark' ? '2px solid #1E1F22' : '2px solid #E3E5E8'};
      }

      /* Message Area */
      .dc-message-area {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .dc-messages-header {
        height: 48px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        border-bottom: ${theme === 'dark' ? '1px solid #1E1F22' : '1px solid #E3E5E8'};
        color: ${themeVars['--dc-text']};
        font-weight: 600;
      }

      .dc-messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }

      .dc-message {
        display: flex;
        margin-bottom: 16px;
      }

      .dc-message-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${themeVars['--dc-accent']};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: #FFFFFF;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .dc-message-content {
        flex: 1;
      }

      .dc-message-header {
        display: flex;
        align-items: baseline;
        margin-bottom: 4px;
      }

      .dc-message-sender {
        font-weight: 600;
        font-size: 14px;
        color: ${themeVars['--dc-text']};
      }

      .dc-message-time {
        font-size: 11px;
        color: ${themeVars['--dc-text-secondary']};
        margin-left: 8px;
      }

      .dc-message-text {
        font-size: 14px;
        color: ${theme === 'dark' ? '#DCDDDE' : '#060607'};
        line-height: 1.4;
      }

      /* Link Card */
      .dc-link-card {
        margin-top: 8px;
        background: ${theme === 'dark' ? '#2B2D31' : '#F2F3F5'};
        border: 1px solid ${theme === 'dark' ? '#1E1F22' : '#E3E5E8'};
        border-radius: 8px;
        overflow: hidden;
        max-width: 420px;
      }

      .dc-link-card-image {
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, ${themeVars['--dc-accent']} 0%, #EB459E 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dc-link-card-content {
        padding: 12px;
      }

      .dc-link-card-title {
        font-size: 14px;
        font-weight: 600;
        color: ${themeVars['--dc-text']};
        margin-bottom: 4px;
      }

      .dc-link-card-desc {
        font-size: 12px;
        color: ${themeVars['--dc-text-secondary']};
        line-height: 1.4;
        margin-bottom: 8px;
      }

      .dc-link-card-domain {
        font-size: 11px;
        color: ${themeVars['--dc-text-secondary']};
      }

      /* Input Area */
      .dc-input-area {
        padding: 0 16px 16px 16px;
      }

      .dc-input-container {
        background: ${theme === 'dark' ? '#383A40' : '#E3E5E8'};
        border-radius: 8px;
        padding: 0 16px;
        display: flex;
        align-items: center;
      }

      .dc-input {
        flex: 1;
        background: transparent;
        border: none;
        color: ${themeVars['--dc-text']};
        font-size: 14px;
        padding: 10px 0;
        outline: none;
      }

      .dc-input::placeholder {
        color: ${themeVars['--dc-text-secondary']};
      }
    `;
  }

  /**
   * Render frame HTML structure
   */
  private renderFrameHTML(content: FrameContentData, theme: ThemeMode): string {
    const cardTitle = content.title || 'Example Page Title';
    const cardDesc = content.description || 'This is a sample description that would appear when sharing a link in Discord...';
    const cardDomain = content.domain || 'https://example.com';

    return `
  <div class="discord-context">
    <!-- Server Sidebar -->
    <div class="dc-server-sidebar">
      <div class="dc-server-icon active">DV</div>
      <div class="dc-server-icon">⚙️</div>
    </div>

    <!-- Channel Sidebar -->
    <div class="dc-channel-sidebar">
      <div class="dc-server-header">
        Development Server
      </div>
      <div class="dc-channel-list">
        <div class="dc-channel-item">
          <span style="font-size: 18px; margin-right: 8px;">#</span>
          <span>general</span>
        </div>
        <div class="dc-channel-item active">
          <span style="font-size: 18px; margin-right: 8px;">#</span>
          <span>announcements</span>
        </div>
      </div>
    </div>

    <!-- Message Area -->
    <div class="dc-message-area">
      <div class="dc-messages-header">
        # announcements
      </div>
      <div class="dc-messages-container">
        <!-- Placeholder message -->
        <div class="dc-message">
          <div class="dc-message-avatar">SM</div>
          <div class="dc-message-content">
            <div class="dc-message-header">
              <span class="dc-message-sender">Sarah Mitchell</span>
              <span class="dc-message-time">Today at 10:23 AM</span>
            </div>
            <div class="dc-message-text">
              Hey team! Check out this new resource I found.
            </div>
          </div>
        </div>

        <!-- Card Message -->
        <div class="dc-message">
          <div class="dc-message-avatar" style="background: #EB459E;">JW</div>
          <div class="dc-message-content">
            <div class="dc-message-header">
              <span class="dc-message-sender">Jessica Wang</span>
              <span class="dc-message-time">Today at 10:35 AM</span>
            </div>
            <div class="dc-message-text">
              Here's the link I mentioned:
            </div>
            <div class="dc-link-card">
              <div class="dc-link-card-image">
                <span style="font-size: 48px; color: rgba(255,255,255,0.8);">🔗</span>
              </div>
              <div class="dc-link-card-content">
                <div class="dc-link-card-title">${cardTitle}</div>
                <div class="dc-link-card-desc">${cardDesc}</div>
                <div class="dc-link-card-domain">${cardDomain}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="dc-input-area">
        <div class="dc-input-container">
          <input type="text" class="dc-input" placeholder="Message #announcements">
        </div>
      </div>
    </div>
  </div>
    `.trim();
  }
}

export default DiscordFrame;
