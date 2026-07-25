/**
 * Base Platform Frame Component Interface
 *
 * Defines the common structure and interface that all platform frame components
 * must implement for consistent rendering across Vista's context frame system.
 */

import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Base platform frame component interface
 *
 * All platform frame components must implement this interface to ensure
 * consistent rendering behavior and API compatibility.
 */
export interface BasePlatformFrame {
  /**
   * Platform identifier (matches scorer.js platform ID)
   */
  readonly platformId: string;

  /**
   * Platform display name
   */
  readonly platformName: string;

  /**
   * Frame component type identifier
   */
  readonly frameType: 'social-feed' | 'messaging' | 'video-platform' |
                    'image-focused' | 'link-aggregator' | 'content-feed' |
                    'collaboration' | 'email' | 'rss-reader' | 'qa-forum';

  /**
   * Whether the platform supports theme switching (dark/light mode)
   */
  readonly hasThemeSupport: boolean;

  /**
   * Preferred aspect ratio for frame rendering
   */
  readonly aspectRatio: '1:1' | '1.91:1' | '16:9' | '9:16' | '2:3' | 'variable';

  /**
   * Platform-specific brand colors and styling
   */
  readonly brandColors: PlatformBrandColors;

  /**
   * Layout pattern and structure information
   */
  readonly layoutPattern: LayoutPattern;

  /**
   * Render the complete context frame HTML
   *
   * @param content - Content data to render in the frame
   * @param theme - Theme mode (dark or light)
   * @returns Complete HTML string for the rendered frame
   */
  render(content: FrameContentData, theme?: ThemeMode): string;

  /**
   * Render just the chrome (platform UI frame) without content
   *
   * @param theme - Theme mode (dark or light)
   * @returns HTML string for the chrome frame
   */
  renderChrome(theme?: ThemeMode): string;

  /**
   * Get CSS variables for the specified theme
   *
   * @param theme - Theme mode (dark or light)
   * @returns Object containing CSS custom properties for the theme
   */
  getThemeVars(theme?: ThemeMode): Record<string, string>;

  /**
   * Validate content data before rendering
   *
   * @param content - Content data to validate
   * @returns Whether the content is valid for this platform frame
   */
  validateContent(content: FrameContentData): boolean;
}

/**
 * Platform brand colors interface
 *
 * Defines the brand-specific colors used for platform frame rendering.
 */
export interface PlatformBrandColors {
  /** Primary brand color (main brand identity) */
  primary: string;

  /** Secondary brand color (accents and highlights) */
  secondary?: string;

  /** Background color */
  background: string;

  /** Surface/background for cards and content areas */
  surface: string;

  /** Text color for primary content */
  textPrimary: string;

  /** Text color for secondary content */
  textSecondary: string;

  /** Text color for muted/disabled content */
  textMuted: string;

  /** Border color */
  border: string;

  /** Link color */
  link?: string;

  /** Accent color for actions and highlights */
  accent?: string;

  /** Error/warning color */
  error?: string;

  /** Success color */
  success?: string;
}

/**
 * Layout pattern interface
 *
 * Defines the structural layout patterns for platform frames.
 */
export interface LayoutPattern {
  /** Layout type identifier */
  type: 'card' | 'feed' | 'chat' | 'video' | 'image' | 'list' | 'grid';

  /** Whether the layout has a fixed aspect ratio */
  hasFixedAspectRatio: boolean;

  /** Preferred aspect ratio (if fixed) */
  aspectRatio?: string;

  /** Whether the layout uses a card-based design */
  usesCardLayout: boolean;

  /** Main container structure */
  container: {
    /** Container class name */
    className: string;
    /** Container CSS properties */
    styles?: Record<string, string>;
  };

  /** Header structure (if applicable) */
  header?: {
    /** Header class name */
    className: string;
    /** Whether header includes avatar */
    hasAvatar: boolean;
    /** Whether header includes user info */
    hasUserInfo: boolean;
    /** Whether header includes timestamp */
    hasTimestamp: boolean;
    /** Whether header includes action menu */
    hasActionMenu: boolean;
  };

  /** Content area structure */
  content: {
    /** Content class name */
    className: string;
    /** Maximum content width */
    maxWidth?: string;
  };

  /** Footer/actions structure (if applicable) */
  footer?: {
    /** Footer class name */
    className: string;
    /** Action buttons structure */
    actions?: Array<{
      /** Action icon/emoji */
      icon: string;
      /** Action label */
      label: string;
      /** Action type */
      type: 'like' | 'comment' | 'share' | 'save' | 'follow' | 'other';
    }>;
  };
}

/**
 * Default brand colors by platform
 *
 * Provides standard brand colors for major social media platforms.
 */
export const DEFAULT_BRAND_COLORS: Record<string, PlatformBrandColors> = {
  facebook: {
    primary: '#1877F2',
    background: '#FFFFFF',
    surface: '#F0F2F5',
    textPrimary: '#050505',
    textSecondary: '#65676B',
    textMuted: '#B7B8B9',
    border: '#CED0D4',
    link: '#1877F2',
  },
  twitter: {
    primary: '#000000',
    background: '#000000',
    surface: '#16181C',
    textPrimary: '#E7E9EA',
    textSecondary: '#71767B',
    textMuted: '#71767B',
    border: '#2F3336',
    accent: '#1D9BF0',
    link: '#1D9BF0',
  },
  linkedin: {
    primary: '#0A66C2',
    background: '#FFFFFF',
    surface: '#F3F2EF',
    textPrimary: '#191919',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#E0E0E0',
    link: '#0A66C2',
  },
  reddit: {
    primary: '#FF4500',
    background: '#FFFFFF',
    surface: '#DAE0E6',
    textPrimary: '#1C1C1C',
    textSecondary: '#7C7C7C',
    textMuted: '#878A8C',
    border: '#CCCCCC',
    link: '#0079D3',
    accent: '#FF4500',
  },
  youtube: {
    primary: '#FF0000',
    background: '#0F0F0F',
    surface: '#1F1F1F',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#606060',
    border: '#303030',
    link: '#3EA6FF',
    accent: '#FF0000',
  },
  instagram: {
    primary: '#E4405F',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    textPrimary: '#262626',
    textSecondary: '#8E8E8E',
    textMuted: '#C7C7C7',
    border: '#DBDBDB',
    link: '#00376B',
  },
  tiktok: {
    primary: '#000000',
    background: '#000000',
    surface: '#121212',
    textPrimary: '#FFFFFF',
    textSecondary: '#A8A8A8',
    textMuted: '#6A6A6A',
    border: '#2A2A2A',
    accent: '#FE2C55',
    link: '#FFFFFF',
  },
};

/**
 * Get default brand colors for a platform
 *
 * @param platformId - Platform identifier
 * @returns Default brand colors for the platform
 */
export function getDefaultBrandColors(platformId: string): PlatformBrandColors {
  return DEFAULT_BRAND_COLORS[platformId] || DEFAULT_BRAND_COLORS.facebook;
}

/**
 * Create a basic platform frame stub
 *
 * Creates a minimal stub implementation of a platform frame component
 * for testing and development purposes.
 *
 * @param config - Platform frame configuration
 * @returns Stub platform frame component
 */
export function createPlatformFrameStub(config: {
  platformId: string;
  platformName: string;
  frameType: BasePlatformFrame['frameType'];
  hasThemeSupport: boolean;
  aspectRatio: BasePlatformFrame['aspectRatio'];
}): BasePlatformFrame {
  const brandColors = getDefaultBrandColors(config.platformId);

  return {
    platformId: config.platformId,
    platformName: config.platformName,
    frameType: config.frameType,
    hasThemeSupport: config.hasThemeSupport,
    aspectRatio: config.aspectRatio,
    brandColors,
    layoutPattern: {
      type: 'card',
      hasFixedAspectRatio: config.aspectRatio !== 'variable',
      aspectRatio: config.aspectRatio !== 'variable' ? config.aspectRatio : undefined,
      usesCardLayout: true,
      container: {
        className: `${config.platformId}-frame`,
      },
      content: {
        className: `${config.platformId}-content`,
      },
    },
    render(content: FrameContentData, theme?: ThemeMode): string {
      return `<div class="${config.platformId}-frame ${config.platformId}-frame-${theme || 'dark'}">
        <div class="platform-stub">
          <h3>${config.platformName} Frame</h3>
          <p>Platform frame component for ${config.platformId}</p>
          <div class="stub-content">
            ${content.title ? `<h4>${content.title}</h4>` : ''}
            ${content.description ? `<p>${content.description}</p>` : ''}
          </div>
        </div>
      </div>`;
    },
    renderChrome(theme?: ThemeMode): string {
      return `<div class="${config.platformId}-chrome ${config.platformId}-chrome-${theme || 'dark'}">
        <div class="platform-stub-chrome">
          <span>${config.platformName} Chrome</span>
        </div>
      </div>`;
    },
    getThemeVars(theme?: ThemeMode): Record<string, string> {
      const isDark = theme === 'dark' || !theme;
      return {
        '--frame-bg': isDark ? brandColors.background : brandColors.surface,
        '--frame-surface': brandColors.surface,
        '--frame-text-primary': brandColors.textPrimary,
        '--frame-text-secondary': brandColors.textSecondary,
        '--frame-border': brandColors.border,
        '--frame-primary': brandColors.primary,
      };
    },
    validateContent(content: FrameContentData): boolean {
      // Basic validation - content should have at least a title
      return !!(content.title || content.description || content.image);
    },
  };
}
