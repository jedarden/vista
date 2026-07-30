/**
 * TypeScript definitions for Platform Context Frames
 *
 * This module provides type definitions for the platform frame data structure
 * used in Vista's context frame rendering system.
 */

/**
 * Platform category types
 */
export type PlatformCategory =
  | 'social'       // Social media & microblogging
  | 'messaging'    // Messaging & chat apps
  | 'collaboration' // Developer tools & collaboration
  | 'content'      // Content platforms (blogs, media)
  | 'email'        // Email clients
  | 'rss'          // RSS readers
  | 'other';       // Other platforms

/**
 * Theme mode types
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Aspect ratio types for context frames
 */
export type AspectRatio =
  | '1:1'         // Square (Instagram)
  | '1.91:1'      // Landscape social (Twitter, Facebook, LinkedIn)
  | '16:9'        // Widescreen (YouTube)
  | '9:16'        // Portrait video (TikTok)
  | '2:3'         // Pinterest
  | 'variable';   // Flexible height

/**
 * CSS theme variables for platform frames
 */
export interface ThemeVariables {
  '--frame-bg': string;           // Frame background color
  '--frame-surface': string;      // Surface/card background color
  '--frame-border': string;       // Border color
  '--frame-text-primary': string; // Primary text color
  '--frame-text-secondary': string; // Secondary text color
  '--frame-text-muted': string;   // Muted/disabled text color
  '--frame-accent': string;       // Accent/brand color
  '--frame-accent-bg': string;    // Accent background color
  '--frame-link-color': string;   // Link color
  '--frame-divider': string;      // Divider line color
  '--frame-input-bg': string;     // Input background color
  '--frame-overlay': string;      // Overlay/shadow color
}

/**
 * Theme variables for both dark and light modes
 */
export interface PlatformThemeVars {
  dark: ThemeVariables;
  light: ThemeVariables;
}

/**
 * Content data for rendering in context frames
 */
export interface FrameContentData {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Page image URL */
  image?: string;
  /** Domain/hostname */
  domain?: string;
  /** Site name (if different from domain) */
  site?: string;
  /** Dominant color for placeholders */
  dominantColor?: string;
  /** Theme accent color */
  themeColor?: string;
  /** Author name */
  author?: string;
  /** Time ago string (e.g., "2h") */
  timeAgo?: string;
  /** Custom HTML for card content */
  cardHTML?: string;
  /** Additional platform-specific data */
  [key: string]: any;
}

/**
 * Platform frame definition
 *
 * Each platform has a complete definition for rendering context frames
 * with platform-specific chrome, neutral content, and theming.
 */
export interface PlatformFrame {
  /** Display name of the platform */
  name: string;

  /** Platform category */
  category: PlatformCategory;

  /** Whether the platform supports dark/light mode toggle */
  hasThemeSupport: boolean;

  /** Preferred aspect ratio for context frame sizing */
  aspectRatio: AspectRatio;

  /**
   * HTML template for the platform UI chrome
   *
   * This is the frame that surrounds the link preview, including
   * headers, sidebars, navigation, and surrounding content.
   *
   * Uses {{placeholder}} syntax for dynamic content insertion:
   * - {{title}}, {{description}}, {{image}}, {{domain}}, {{site}}
   * - {{author}}, {{timeAgo}}, {{themeColor}}
   * - Platform-specific: {{subreddit}}, {{upvotes}}, {{issueNumber}}, etc.
   * - Composite sections: {{linkPreview}}, {{linkCard}}, {{cardContent}}
   * - User content: {{userMessage}}, {{userComment}}, {{userCard}}, {{userArticle}}
   * - Main content: {{mainResult}}
   */
  chrome: string;

  /**
   * HTML template for neutral placeholder content
   *
   * This template defines the user's contribution within the platform context.
   * It represents what "you" would post/share in that platform.
   *
   * Uses the same {{placeholder}} syntax as chrome.
   *
   * Can be empty string for platforms where the link preview itself
   * is the main content (e.g., Instagram, Pinterest).
   */
  neutralContent: string;

  /**
   * CSS custom properties for dark and light themes
   *
   * Each theme mode defines a complete set of CSS variables for
   * consistent theming across the platform frame.
   */
  themeVars: PlatformThemeVars;
}

/**
 * Collection of all platform frame definitions
 */
export interface PlatformFramesCollection {
  [platformId: string]: PlatformFrame;
}

/**
 * Render options for building context frames
 */
export interface FrameRenderOptions {
  /** Platform ID */
  platformId: string;

  /** Content data to render */
  content: FrameContentData;

  /** Theme mode (dark/light) */
  theme?: ThemeMode;

  /** Whether to use responsive sizing */
  responsive?: boolean;

  /** Maximum width in pixels */
  maxWidth?: number;
}

/**
 * Result of building a context frame
 */
export interface FrameBuildResult {
  /** Complete HTML string */
  html: string;

  /** CSS classes to apply */
  classes: string;

  /** Inline styles */
  styles: string;

  /** Theme mode used */
  theme: ThemeMode;
}

/**
 * Platform category information
 */
export interface PlatformCategoryInfo {
  /** Category ID */
  id: PlatformCategory;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Platforms in this category */
  platforms: string[];
}

/**
 * Statistics about platform frames
 */
export interface PlatformFrameStats {
  /** Total number of platforms */
  totalPlatforms: number;

  /** Platforms with theme support */
  platformsWithThemeSupport: number;

  /** Platforms by category */
  byCategory: Record<PlatformCategory, number>;

  /** Most common aspect ratios */
  commonAspectRatios: AspectRatio[];
}

/**
 * Helper function type definitions
 */

/**
 * Get platform frame definition
 */
export type GetPlatformFrameFn = (platformId: string) => PlatformFrame;

/**
 * Check if platform supports theme toggle
 */
export type HasThemeSupportFn = (platformId: string) => boolean;

/**
 * Get theme variables for a platform
 */
export type GetThemeVarsFn = (platformId: string, theme?: ThemeMode) => ThemeVariables;

/**
 * Get platforms that support theme toggle
 */
export type GetPlatformsWithThemeSupportFn = () => string[];

/**
 * Generate CSS for theme variables
 */
export type GenerateThemeCSSFn = (platformId: string, theme?: ThemeMode) => string;

/**
 * Apply theme variables to an element
 */
export type ApplyThemeToElementFn = (
  element: HTMLElement,
  platformId: string,
  theme?: ThemeMode
) => void;

/**
 * Interpolate template variables
 */
export type InterpolateTemplateFn = (template: string, vars: Record<string, any>) => string;

/**
 * Build complete context frame HTML
 */
export type BuildContextFrameFn = (
  platformId: string,
  content: FrameContentData,
  theme?: ThemeMode
) => string;

/**
 * Build link preview HTML
 */
export type BuildLinkPreviewHTMLFn = (
  platformId: string,
  content: FrameContentData,
  theme?: ThemeMode
) => string;

/**
 * Get list of all supported platforms
 */
export type GetSupportedPlatformsFn = () => string[];

/**
 * Platform frames module API
 */
export interface PlatformFramesAPI {
  /** Collection of all platform frame definitions */
  PLATFORM_FRAMES: PlatformFramesCollection;

  /** CSS variable names that should be defined per platform/theme */
  THEME_VAR_NAMES: (keyof ThemeVariables)[];

  /** Get platform frame definition */
  getPlatformFrame: GetPlatformFrameFn;

  /** Check if platform supports theme toggle */
  hasThemeSupport: HasThemeSupportFn;

  /** Get theme variables for a platform */
  getThemeVars: GetThemeVarsFn;

  /** Get platforms that support theme toggle */
  getPlatformsWithThemeSupport: GetPlatformsWithThemeSupportFn;

  /** Generate CSS for theme variables */
  generateThemeCSS: GenerateThemeCSSFn;

  /** Generate all theme CSS for a platform */
  generateAllThemeCSS: (platformId: string) => string;

  /** Apply theme variables to an element */
  applyThemeToElement: ApplyThemeToElementFn;

  /** Interpolate template variables */
  interpolateTemplate: InterpolateTemplateFn;

  /** Build complete context frame HTML */
  buildContextFrame: BuildContextFrameFn;

  /** Build link preview HTML */
  buildLinkPreviewHTML: BuildLinkPreviewHTMLFn;

  /** Get inline theme styles as CSS string */
  getInlineThemeStyles: (platformId: string, theme?: ThemeMode) => string;

  /** Get list of all supported platforms */
  getSupportedPlatforms: GetSupportedPlatformsFn;
}

/**
 * Global declaration for browser environment
 */
declare global {
  interface Window {
    /** Platform frames module */
    PlatformFrames: PlatformFramesAPI;

    /** Individual exports for backward compatibility */
    PLATFORM_FRAMES: PlatformFramesCollection;
    getPlatformsWithThemeSupport: GetPlatformsWithThemeSupportFn;
    buildContextFrame: BuildContextFrameFn;
    buildLinkPreviewHTML: BuildLinkPreviewHTMLFn;
    getPlatformFrame: GetPlatformFrameFn;
    hasThemeSupport: HasThemeSupportFn;
    getThemeVars: GetThemeVarsFn;
  }
}

export {};
