/**
 * Platform Frame Configuration Types
 *
 * This module defines the data structure and configuration system for platform context frames.
 * It provides type-safe interfaces for defining platform-specific frame rendering rules.
 */

/**
 * Platform frame type categories
 *
 * Each platform falls into one of these frame type categories, which determine
 * the structure and rendering approach for their context frames.
 */
export type PlatformFrameType =
  | 'social-feed'        // Social media feeds with cards (Twitter, Facebook, LinkedIn)
  | 'messaging'          // Chat/messaging interfaces (Slack, Discord, WhatsApp)
  | 'email'              // Email clients (Gmail, Outlook)
  | 'collaboration'      // Dev tools & collaboration platforms (GitHub, Notion, Jira)
  | 'content-feed'       // Content platforms with articles/posts (Medium, Dev.to)
  | 'video-platform'     // Video-focused platforms (YouTube, TikTok)
  | 'image-focused'      // Image-centric platforms (Instagram, Pinterest)
  | 'rss-reader'         // RSS readers and aggregators (Feedly)
  | 'search-results'     // Search engine results (Google)
  | 'qa-forum'           // Q&A forums (Stack Overflow)
  | 'link-aggregator';   // Link aggregators (Hacker News, Reddit)

/**
 * Platform source categories (from scorer.js)
 *
 * These are the high-level categories used by the scoring system.
 */
export type PlatformSourceCategory =
  | 'Social & Microblogging'
  | 'Messaging'
  | 'Collaboration & Productivity'
  | 'Content Platforms'
  | 'Email'
  | 'RSS / Readers'
  | 'Developer Tools';

/**
 * Frame structure requirements
 *
 * Defines which frame elements are required, optional, or not applicable
 * for a given frame type.
 */
export interface FrameStructureRequirements {
  /** Chrome HTML template is required */
  requiresChrome: boolean;

  /** Neutral content template is required */
  requiresNeutralContent: boolean;

  /** Theme support (dark/light) is available */
  supportsThemes: boolean;

  /** Aspect ratio is fixed/known */
  hasFixedAspectRatio: boolean;

  /** Platform uses cards/tiles for content */
  usesCardLayout: boolean;
}

/**
 * Platform frame configuration
 *
 * Maps each platform to its frame type category and configuration.
 */
export interface PlatformFrameConfig {
  /** Platform ID (matches scorer.js platform ID) */
  id: string;

  /** Platform display name */
  name: string;

  /** Source category (from scorer.js) */
  sourceCategory: PlatformSourceCategory;

  /** Frame type category (determines rendering approach) */
  frameType: PlatformFrameType;

  /** Whether platform supports dark/light themes */
  hasThemeSupport: boolean;

  /** Preferred aspect ratio for frames */
  aspectRatio: '1:1' | '1.91:1' | '16:9' | '9:16' | '2:3' | 'variable';

  /** Structure requirements for this platform */
  structure: FrameStructureRequirements;

  /** Placeholder frame data (used until actual frame is implemented) */
  placeholderFrame?: PlaceholderFrameData;
}

/**
 * Placeholder frame data
 *
 * Temporary frame structure used before actual implementation.
 */
export interface PlaceholderFrameData {
  /** Chrome HTML template (optional, can be empty string) */
  chrome?: string;

  /** Neutral content HTML template (optional, can be empty string) */
  neutralContent?: string;

  /** Whether this is a stub/unimplemented frame */
  isStub: boolean;

  /** Notes for implementation */
  implementationNotes?: string;
}

/**
 * Complete platform frames configuration collection
 *
 * Maps all platform IDs to their frame configurations.
 */
export type PlatformFramesConfig = Record<string, PlatformFrameConfig>;

/**
 * Frame type metadata
 *
 * Provides information about each frame type category.
 */
export interface FrameTypeInfo {
  /** Frame type identifier */
  type: PlatformFrameType;

  /** Display name */
  name: string;

  /** Description of when to use this frame type */
  description: string;

  /** Typical platforms that use this frame type */
  examplePlatforms: string[];

  /** Default structure requirements for this frame type */
  defaultRequirements: FrameStructureRequirements;
}

/**
 * Validation result for platform frame configuration
 */
export interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;

  /** Validation errors (if any) */
  errors: string[];

  /** Validation warnings (if any) */
  warnings: string[];
}

/**
 * Platform frame configuration statistics
 */
export interface ConfigStats {
  /** Total number of platforms configured */
  totalPlatforms: number;

  /** Platforms with theme support */
  platformsWithThemeSupport: number;

  /** Platforms by frame type */
  byFrameType: Record<PlatformFrameType, number>;

  /** Platforms by source category */
  bySourceCategory: Record<PlatformSourceCategory, number>;

  /** Platforms with implemented frames (non-stub) */
  implementedFrames: number;

  /** Platforms with stub/placeholder frames */
  stubFrames: number;
}
