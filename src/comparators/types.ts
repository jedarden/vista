/**
 * TypeScript type definitions for platform metadata comparison functions
 * Provides types for comparing platform scoring data between two URLs/states
 */

// ============================================================================
// Platform Metadata Types
// ============================================================================

/**
 * Platform metadata represents the scoring and diagnostic data for a single platform.
 * This is the core data structure that comparison functions operate on.
 */
export interface PlatformMetadata {
  /** Platform identifier (e.g., 'twitter', 'facebook', 'linkedin') */
  platformId: string;
  /** Human-readable platform name */
  platformName: string;
  /** Platform category (e.g., 'Social & Microblogging', 'Messaging', 'Email') */
  category: string;
  /** Platform weight in overall scoring (higher = more important) */
  weight: number;
  /** Letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F) */
  grade: string;
  /** Numeric score (0-100) */
  score: number;
  /** List of issues detected for this platform */
  issues: string[];
  /** Suggested fixes to improve this platform's score */
  fixes: string[];
}

// ============================================================================
// Comparison Result Types
// ============================================================================

/**
 * Result of comparing two platform metadata objects.
 * Tracks what changed between two states (e.g., URL A vs URL B, before/after fixes).
 */
export interface ComparisonResult {
  /** True if the two platform metadata objects are identical */
  isIdentical: boolean;
  /** List of field names that changed between the two states */
  changedFields: ComparisonField[];
  /** Tags or metadata fields that are missing from both states */
  missingTags: string[];
}

/**
 * Represents a single field that changed between two platform metadata states.
 */
export interface ComparisonField {
  /** Field identifier (e.g., 'grade', 'score', 'issues') */
  field: string;
  /** Value from the first state (null if the field was added) */
  from: ComparisonValue | null;
  /** Value from the second state (null if the field was removed) */
  to: ComparisonValue | null;
}

/**
 * Union type for comparable values in platform metadata.
 * Handles primitive values, arrays, and nested objects.
 */
export type ComparisonValue = string | number | boolean | string[] | null;

// ============================================================================
// Comparison Function Signatures
// ============================================================================

/**
 * Check if two platform metadata objects are identical.
 * Performs deep equality check on all fields including nested arrays.
 *
 * @param a - First platform metadata object
 * @param b - Second platform metadata object
 * @returns true if the objects are identical, false otherwise
 */
export declare function isIdentical(
  a: PlatformMetadata | null | undefined,
  b: PlatformMetadata | null | undefined
): boolean;

/**
 * Extract the list of changed fields between two platform metadata objects.
 *
 * Returns an array of field paths (strings) that differ between the two objects.
 * Field paths use dot notation for nested properties (e.g., 'tags.count', 'meta.og.title').
 * Returns an empty array if the objects are identical.
 *
 * @param a - First platform metadata object
 * @param b - Second platform metadata object
 * @returns Array of changed field paths (empty array if identical)
 *
 * @example
 * const a = { platformId: 'twitter', score: 85, issues: ['no-title'] };
 * const b = { platformId: 'twitter', score: 92, issues: [] };
 * changedFields(a, b); // ['score', 'issues']
 *
 * @example
 * const objA = { meta: { og: { title: 'Test' } } };
 * const objB = { meta: { og: { title: 'Changed' } } };
 * changedFields(objA, objB); // ['meta.og.title']
 */
export declare function changedFields(
  a: Record<string, any> | null | undefined,
  b: Record<string, any> | null | undefined
): string[];

/**
 * Find tags present in the first platform but missing from the second.
 *
 * Returns an array of tag names (strings) that are referenced in the first
 * platform's issues/fixes but not in the second platform's issues/fixes.
 * Tag names are extracted from issue/fix strings using patterns like:
 * - "og:title missing" → "og:title"
 * - "no twitter:card" → "twitter:card"
 * - "Add og:title meta tag" → "og:title"
 *
 * @param a - First platform metadata object
 * @param b - Second platform metadata object
 * @returns Array of tag names missing from the second (empty if none)
 *
 * @example
 * const a = { platformId: 'twitter', issues: ['og:title missing'], fixes: [] };
 * const b = { platformId: 'twitter', issues: [], fixes: [] };
 * missingTags(a, b); // ['og:title']
 *
 * @example
 * const objA = { issues: ['no twitter:card', 'og:image missing'], fixes: [] };
 * const objB = { issues: ['no twitter:card'], fixes: ['Add og:title'] };
 * missingTags(objA, objB); // ['og:image']
 */
export declare function missingTags(
  a: PlatformMetadata | null | undefined,
  b: PlatformMetadata | null | undefined
): string[];

// ============================================================================
// Extended Types for Batch Comparison
// ============================================================================

/**
 * Aggregated comparison results across all platforms.
 * Provides a summary view of platform-wide changes.
 */
export interface PlatformComparisonSummary {
  /** Map of platform ID to its comparison result */
  platforms: Record<string, ComparisonResult>;
  /** Count of platforms with no changes */
  identicalCount: number;
  /** Count of platforms with changes */
  changedCount: number;
  /** List of platform IDs that had changes */
  changedPlatformIds: string[];
}

/**
 * Detailed comparison result for a single platform with before/after state.
 */
export interface DetailedComparisonResult extends ComparisonResult {
  /** Platform metadata from the first state (before) */
  before: PlatformMetadata | null;
  /** Platform metadata from the second state (after) */
  after: PlatformMetadata | null;
  /** Direction of change for this platform */
  changeDirection: 'improved' | 'degraded' | 'unchanged' | 'added' | 'removed';
  /** Numeric score delta (positive = improvement, negative = degradation) */
  scoreDelta: number;
}

// ============================================================================
// Main Diff Computation Types
// ============================================================================

/**
 * Complete comparison diff between two /api/compare response objects.
 * Provides structured diff results across all platforms.
 */
export interface CompareDiffResult {
  /** Set of platform IDs that are identical between the two responses */
  identicalPlatforms: Set<string>;
  /** Map of platform ID -> array of changed field paths */
  changedFields: Map<string, string[]>;
  /** Map of platform ID -> array of missing tag names */
  missingTags: Map<string, string[]>;
}

/**
 * Main diff computation function for platform metadata comparison.
 *
 * Takes two /api/compare API response objects as input, iterates through
 * all platforms from both responses, uses helper functions to compute
 * per-platform diffs, and returns a structured diff object.
 *
 * @param responseA - First /api/compare response object
 * @param responseB - Second /api/compare response object
 * @returns Structured diff object with identical platforms, changed fields, and missing tags
 */
export declare function computeCompareDiff(
  responseA: any,
  responseB: any
): CompareDiffResult;
