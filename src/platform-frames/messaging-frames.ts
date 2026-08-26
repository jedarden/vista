/**
 * Messaging Platform Frame Components Collection
 *
 * Simplified frame implementations for messaging platforms that primarily
 * delegate to their respective HTML files for rendering.
 */

import type { BasePlatformFrame, LayoutPattern, PlatformBrandColors } from './base-frame';
import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Base messaging frame with common implementation
 */
abstract class BaseMessagingFrame implements BasePlatformFrame {
  abstract readonly platformId: string;
  abstract readonly platformName: string;
  readonly frameType: BasePlatformFrame['frameType'] = 'messaging';
  readonly hasThemeSupport = true;
  readonly aspectRatio: BasePlatformFrame['aspectRatio'] = 'variable';
  readonly layoutPattern: LayoutPattern = {
    chrome: 'variable',
    panels: ['sidebar', 'message-area'],
    aspectRatio: 'variable',
  };

  abstract readonly brandColors: PlatformBrandColors;

  render(content: FrameContentData, theme: ThemeMode = 'dark'): string {
    const htmlPath = this.getHTMLPath();
    return `<!-- Render ${this.platformName} frame from ${htmlPath} -->\n` +
           `<iframe src="${htmlPath}?theme=${theme}" ` +
           `data-platform="${this.platformId}" ` +
           `data-theme="${theme}" ` +
           `title="${this.platformName} Context Frame" ` +
           `style="width: 100%; height: 600px; border: none; border-radius: 8px;">` +
           `</iframe>`;
  }

  renderChrome(theme: ThemeMode = 'dark'): string {
    return this.render({}, theme);
  }

  getThemeVars(theme: ThemeMode = 'dark'): Record<string, string> {
    return {
      '--msg-bg': theme === 'dark' ? '#1a1a1e' : '#ffffff',
      '--msg-surface': theme === 'dark' ? '#25252a' : '#f5f5f5',
      '--msg-text': theme === 'dark' ? '#e4e4e7' : '#1a1a1a',
      '--msg-accent': this.brandColors.primary,
    };
  }

  validateContent(content: FrameContentData): boolean {
    return !!content && typeof content === 'object';
  }

  protected abstract getHTMLPath(): string;
}

/**
 * iMessage Frame Component
 */
export class IMessageFrame extends BaseMessagingFrame {
  readonly platformId = 'imessage';
  readonly platformName = 'iMessage';
  readonly brandColors: PlatformBrandColors = {
    primary: '#007AFF',
    secondary: '#34C759',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
  };

  protected getHTMLPath(): string {
    return 'messaging-imessage.html';
  }
}

/**
 * WhatsApp Frame Component
 */
export class WhatsAppFrame extends BaseMessagingFrame {
  readonly platformId = 'whatsapp';
  readonly platformName = 'WhatsApp';
  readonly brandColors: PlatformBrandColors = {
    primary: '#25D366',
    secondary: '#128C7E',
    background: '#0B141A',
    surface: '#202C33',
    text: '#E9EDEF',
  };

  protected getHTMLPath(): string {
    return 'messaging-whatsapp.html';
  }
}

/**
 * Telegram Frame Component
 */
export class TelegramFrame extends BaseMessagingFrame {
  readonly platformId = 'telegram';
  readonly platformName = 'Telegram';
  readonly brandColors: PlatformBrandColors = {
    primary: '#0088CC',
    secondary: '#3390EC',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
  };

  protected getHTMLPath(): string {
    return 'messaging-telegram.html';
  }
}

/**
 * Signal Frame Component
 */
export class SignalFrame extends BaseMessagingFrame {
  readonly platformId = 'signal';
  readonly platformName = 'Signal';
  readonly brandColors: PlatformBrandColors = {
    primary: '#3A76F0',
    secondary: '#4CA2FF',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
  };

  protected getHTMLPath(): string {
    return 'messaging-signal.html';
  }
}

/**
 * Microsoft Teams Frame Component
 */
export class TeamsFrame extends BaseMessagingFrame {
  readonly platformId = 'teams';
  readonly platformName = 'Microsoft Teams';
  readonly brandColors: PlatformBrandColors = {
    primary: '#6264A7',
    secondary: '#464775',
    background: '#1F1F1F',
    surface: '#2B2B2B',
    text: '#FFFFFF',
  };

  protected getHTMLPath(): string {
    return 'messaging-teams.html';
  }
}

/**
 * Matrix Frame Component
 */
export class MatrixFrame extends BaseMessagingFrame {
  readonly platformId = 'matrix';
  readonly platformName = 'Matrix';
  readonly brandColors: PlatformBrandColors = {
    primary: '#0DBD8B',
    secondary: '#089675',
    background: '#101213',
    surface: '#1A1A1B',
    text: '#FFFFFF',
  };

  protected getHTMLPath(): string {
    return 'messaging-matrix.html';
  }
}

// Export individual frames
export {
  IMessageFrame,
  WhatsAppFrame,
  TelegramFrame,
  SignalFrame,
  TeamsFrame,
  MatrixFrame,
};

// Default export all frames as an object
export default {
  imessage: IMessageFrame,
  whatsapp: WhatsAppFrame,
  telegram: TelegramFrame,
  signal: SignalFrame,
  teams: TeamsFrame,
  matrix: MatrixFrame,
};
