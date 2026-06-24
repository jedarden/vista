/**
 * TypeScript type definitions for VISTA /api/compare endpoint and diff structures
 */

// ============================================================================
// Meta Tag Types
// ============================================================================

export interface MetaTags {
  title: string | null;
  description: string | null;
  og: OpenGraphTags;
  twitter: TwitterTags;
  favicon: string | null;
  themeColor: string | null;
  rawTags?: RawMetaTag[];
}

export interface OpenGraphTags {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  type: string | null;
  site_name: string | null;
}

export interface TwitterTags {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
}

export interface RawMetaTag {
  name: string;
  property: string | null;
  content: string;
  attributes: Record<string, string>;
}

/**
 * Raw parsed meta tag from HTML
 */
export interface HopRawMetaTag {
  index: number;
  name: string | null;
  property: string | null;
  content: string | null;
  httpEquiv: string | null;
  charset: string | null;
  rawHtml: string;
}

/**
 * Critical meta tags extracted for redirect hop diff analysis
 */
export interface HopMetaTags {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonical: string | null;
}

/**
 * Meta tag diff between consecutive hops
 */
export interface MetaDiff {
  changed: Array<{ field: string; from: string | null; to: string | null }>;
  added: Array<{ field: string; value: string | null }>;
  removed: Array<{ field: string; value: string | null }>;
  hasImageChange?: boolean;
}

/**
 * Redirect hop in a chain
 */
export interface RedirectHop {
  /** The current URL for this hop */
  url: string;
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** For redirect hops, the next URL in the chain */
  redirectsTo?: string;
  /** Warning about redirect behavior */
  warning?: string;
  /** Whether this is the final hop */
  isFinal?: boolean;
  /** HTML response content (may be null or empty string for header-only redirects) */
  html?: string | null;
  /** All meta tags parsed from HTML at this hop */
  metaTags: HopRawMetaTag[];
  /** Critical meta tags (only for 200 HTML responses) */
  meta?: HopMetaTags;
  /** Diff from previous hop's meta tags */
  metaDiff?: MetaDiff;
  /** Error message if meta parsing failed */
  metaError?: string;
}

// ============================================================================
// Image Probe Types
// ============================================================================

export interface ImageProbe {
  url: string;
  width: number | null;
  height: number | null;
  format: string | null;
  size: number | null;
  cropRatios?: CropRatios;
}

export interface CropRatios {
  aspectRatio: number;
  landscape: CropRatio;
  square: CropRatio;
  portrait: CropRatio;
}

export interface CropRatio {
  ratio: string;
  recommended: { width: number; height: number };
  actual: { width: number; height: number };
  willCrop: boolean;
}

// ============================================================================
// Scoring Types
// ============================================================================

export interface ScoringResult {
  overall: OverallScore;
  summary: string;
  gradeCounts: GradeCounts;
  scores: Record<string, PlatformScore>;
}

export interface OverallScore {
  score: number;
  grade: string;
  platformCount: number;
}

export interface GradeCounts {
  'A+': number;
  A: number;
  'A-': number;
  'B+': number;
  B: number;
  'B-': number;
  'C+': number;
  C: number;
  'C-': number;
  'D+': number;
  D: number;
  'D-': number;
  F: number;
}

export interface PlatformScore {
  grade: string;
  score: number;
  issues: string[];
  fixes: string[];
  platform: {
    id: string;
    name: string;
  };
}

// ============================================================================
// Diagnostics Types
// ============================================================================

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  fix?: string;
  platforms: string;
}

// ============================================================================
// Auto Fix Types
// ============================================================================

export interface AutoFix {
  code: string;
  message: string;
  tag: string | null;
  platforms: string;
}

// ============================================================================
// Header Analysis Types
// ============================================================================

export interface ResponseHeaders {
  [key: string]: string;
}

export interface HeaderAnalysis {
  security: SecurityHeaderAnalysis;
  cors: CorsAnalysis;
  server: ServerAnalysis;
  performance: PerformanceAnalysis;
}

export interface SecurityHeaderAnalysis {
  score: number;
  grade: string;
  headers: Record<string, { present: boolean; value: string }>;
  issues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
}

export interface SecurityIssue {
  severity: 'info' | 'warning' | 'error';
  header: string;
  message: string;
  recommendation: string;
  affectedPlatforms?: string[];
}

export interface SecurityRecommendation {
  header: string;
  message: string;
  recommendation: string;
}

export interface CorsAnalysis {
  origin: string | null;
  allowHeaders: string | null;
  exposeHeaders: string | null;
  credentials: string | null;
  maxAge: string | null;
  methods: string | null;
  analysis: CorsDetailedAnalysis;
}

export interface CorsDetailedAnalysis {
  configured: boolean;
  public: boolean;
  restricted: boolean;
  issues: CorsIssue[];
  recommendations: CorsRecommendation[];
}

export interface CorsIssue {
  severity: 'warning' | 'error';
  message: string;
  detail: string;
  recommendation: string;
}

export interface CorsRecommendation {
  message: string;
  detail: string;
  recommendation: string;
}

export interface ServerAnalysis {
  software: string | null;
  version: string | null;
  framework: string | null;
  disclosureLevel: 'none' | 'medium' | 'high';
  issues: ServerIssue[];
  recommendations: ServerRecommendation[];
}

export interface ServerIssue {
  severity: 'info' | 'warning';
  message: string;
  detail: string;
  recommendation: string;
}

export interface ServerRecommendation {
  message: string;
  recommendation: string;
}

export interface PerformanceAnalysis {
  cacheControl: string | null;
  expires: string | null;
  etag: string | null;
  lastModified: string | null;
  contentEncoding: string | null;
  transferEncoding: string | null;
  assessment: PerformanceAssessment;
}

export interface PerformanceAssessment {
  caching: 'none' | 'disabled' | 'validation-required' | 'legacy' | 'very-short' | 'short' | 'good';
  compression: boolean;
  optimization: 'none' | 'partial' | 'good';
  score: number;
  recommendations: PerformanceRecommendation[];
}

export interface PerformanceRecommendation {
  header: string;
  message: string;
  detail?: string;
  recommendation: string;
}

// ============================================================================
// Preview Result Types (from /api/preview)
// ============================================================================

export interface PreviewResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  meta: MetaTags;
  imageProbe: ImageProbe | null;
  diagnostics: Diagnostic[];
  scoring: ScoringResult;
  autoFixes: AutoFix[];
  redirectChain: RedirectHop[];
  responseHeaders: ResponseHeaders;
  headerAnalysis: HeaderAnalysis;
  html: string;
  rawTags: RawMetaTag[];
}

// ============================================================================
// /api/compare Response Types
// ============================================================================

export interface CompareResponse {
  a: CompareResultData;
  b: CompareResultData;
}

export type CompareResultData = PreviewResult | CompareError;

export interface CompareError {
  error: string;
  url: string;
}

// ============================================================================
// Diff Types
// ============================================================================

/**
 * Represents a single field change in meta tags
 */
export interface FieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

/**
 * Complete diff structure for comparing two URLs
 */
export interface MetaTagDiff {
  /** Fields that were added (present in B but not A) */
  added: FieldChange[];
  /** Fields that were removed (present in A but not B) */
  removed: FieldChange[];
  /** Fields that changed values */
  changed: FieldChange[];
  /** Tags that are missing from both URLs */
  missing: string[];
}

/**
 * Platform-specific diff information
 */
export interface PlatformDiff {
  platformId: string;
  platformName: string;
  before: PlatformScoreInfo;
  after: PlatformScoreInfo;
  changeType: 'improved' | 'degraded' | 'unchanged' | 'added' | 'removed';
  gradeDelta: number;
  scoreDelta: number;
  missingTags?: string[];
}

export interface PlatformScoreInfo {
  grade: string;
  score: number;
  issues: string[];
  fixes: string[];
}

/**
 * Complete comparison result including meta tag diff and platform diff
 */
export interface CompleteDiff {
  /** Meta tag differences */
  metaDiff: MetaTagDiff;
  /** Platform-by-platform comparison */
  platformDiffs: Record<string, PlatformDiff>;
  /** Identical platforms (no change) */
  identicalPlatforms: string[];
  /** Platforms with differing text/fields */
  changedPlatforms: string[];
  /** Tags missing from both URLs */
  missingTags: string[];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Flattened meta object for comparison
 */
export interface FlattenedMeta {
  [key: string]: string | null;
}

/**
 * Platform grade order for comparison
 */
export type PlatformGrade = 'F' | 'D' | 'C' | 'B' | 'A' | 'A+';

/**
 * Diff row types for table rendering
 */
export type DiffRowType = 'added' | 'removed' | 'changed';

/**
 * Change class for CSS styling
 */
export type ChangeClass = 'added' | 'removed' | 'changed' | 'unchanged' | 'improved' | 'degraded';
