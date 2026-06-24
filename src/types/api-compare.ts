/**
 * Type definitions for /api/compare response and diff structure
 */

/**
 * Response from the /api/compare endpoint
 * Compares two URLs by fetching both previews in parallel
 */
export interface CompareResponse {
  /** Result for URL A (either success data or error) */
  a: PreviewResult | CompareError;
  /** Result for URL B (either success data or error) */
  b: PreviewResult | CompareError;
}

/**
 * Error object when one side of the comparison fails
 */
export interface CompareError {
  error: string;
  url: string;
}

/**
 * Full preview result returned by /api/compare on success
 * Contains all metadata, diagnostics, scoring, and analysis for a URL
 */
export interface PreviewResult {
  /** The original URL requested */
  url: string;
  /** The final URL after any redirects */
  finalUrl: string;
  /** HTTP status code */
  statusCode: number;
  /** Extracted meta tags */
  meta: MetaTags;
  /** Image probing data (dimensions, format, size) */
  imageProbe: ImageProbe | null;
  /** Diagnostic issues detected */
  diagnostics: Diagnostic[];
  /** Platform scoring results */
  scoring: ScoringResult;
  /** Suggested auto-fixes for detected issues */
  autoFixes: AutoFix[];
  /** Redirect chain from request to final URL */
  redirectChain: RedirectHop[];
  /** HTTP response headers */
  responseHeaders: Record<string, string>;
  /** HTTP header security and performance analysis */
  headerAnalysis: HeaderAnalysis;
  /** Raw HTML (truncated to 500KB max) */
  html: string;
  /** Raw parsed tags for client-side verification */
  rawTags: RawTag[];
}

/**
 * Extracted meta tags from HTML
 */
export interface MetaTags {
  /** Basic HTML meta */
  title: string | null;
  description: string | null;
  /** Open Graph tags */
  og: OgTags;
  /** Twitter card tags */
  twitter: TwitterTags;
  /** Favicon URL */
  favicon: string | null;
  /** Theme color */
  themeColor: string | null;
  /** Raw tag data for client-side processing */
  rawTags: RawTag[];
}

export interface OgTags {
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

/**
 * Raw parsed tag from HTML
 */
export interface RawTag {
  name: string;
  property: string | null;
  content: string;
  attributes: Record<string, string>;
}

/**
 * Image probe results
 */
export interface ImageProbe {
  url: string;
  width: number | null;
  height: number | null;
  format: string | null;
  sizeBytes: number | null;
  /** Whether the image could be loaded/probed */
  success: boolean;
  /** Error message if probing failed */
  error?: string;
}

/**
 * Diagnostic issue detected
 */
export interface Diagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  platforms?: string[];
  fix?: string;
}

/**
 * Platform scoring results
 */
export interface ScoringResult {
  /** Overall scoring across all platforms */
  overall: OverallScore;
  /** Individual platform scores keyed by platform ID */
  scores: Record<string, PlatformScore>;
  /** Summary statistics */
  summary: ScoringSummary;
  /** Count of platforms by grade */
  gradeCounts: GradeCounts;
}

export interface OverallScore {
  score: number;
  grade: string;
  platforms: number;
  total: number;
}

export interface PlatformScore {
  grade: string;
  score: number;
  issues: string[];
  fixes: string[];
  platform: {
    id: string;
    name: string;
    category: string;
    weight: number;
  };
}

export interface ScoringSummary {
  total: number;
  aPlus: number;
  a: number;
  b: number;
  c: number;
  d: number;
  f: number;
}

export interface GradeCounts {
  'A+': number;
  'A': number;
  'A-': number;
  'B+': number;
  'B': number;
  'B-': number;
  'C+': number;
  'C': number;
  'C-': number;
  'D+': number;
  'D': number;
  'D-': number;
  'F': number;
}

/**
 * Auto-fix suggestion
 */
export interface AutoFix {
  code: string;
  message: string;
  tag: string;
  platforms: string[];
}

/**
 * Redirect hop in a chain
 */
export interface RedirectHop {
  from: string;
  to: string;
  statusCode: number;
}

/**
 * HTTP header analysis
 */
export interface HeaderAnalysis {
  security: SecurityHeaderAnalysis;
  cors: CorsAnalysis;
  server: ServerAnalysis;
  performance: PerformanceHeaderAnalysis;
}

export interface SecurityHeaderAnalysis {
  score: number;
  grade: string;
  headers: Record<string, { present: boolean; value?: string }>;
  issues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
}

export interface SecurityIssue {
  severity: 'error' | 'warning' | 'info';
  header: string;
  message: string;
  recommendation?: string;
  affectedPlatforms?: string[];
}

export interface SecurityRecommendation {
  header: string;
  message: string;
  recommendation?: string;
}

export interface CorsAnalysis {
  origin: string | null;
  allowHeaders: string | null;
  exposeHeaders: string | null;
  credentials: string | null;
  maxAge: string | null;
  methods: string | null;
  analysis: CorsAnalysisDetails;
}

export interface CorsAnalysisDetails {
  configured: boolean;
  public: boolean;
  restricted: boolean;
  issues: CorsIssue[];
  recommendations: CorsRecommendation[];
}

export interface CorsIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
  recommendation: string;
}

export interface CorsRecommendation {
  message: string;
  detail?: string;
  recommendation: string;
}

export interface ServerAnalysis {
  software: string | null;
  xPoweredBy: string | null;
  xGenerator: string | null;
  xAspNetVersion: string | null;
  xPhpVersion: string | null;
  analysis: ServerAnalysisDetails;
}

export interface ServerAnalysisDetails {
  software: string | null;
  version: string | null;
  framework: string | null;
  disclosureLevel: 'none' | 'low' | 'medium' | 'high';
  issues: ServerIssue[];
  recommendations: ServerRecommendation[];
}

export interface ServerIssue {
  severity: 'info';
  message: string;
  detail?: string;
  recommendation: string;
}

export interface ServerRecommendation {
  message: string;
  detail?: string;
  recommendation: string;
}

export interface PerformanceHeaderAnalysis {
  cacheControl: string | null;
  expires: string | null;
  etag: string | null;
  lastModified: string | null;
  contentEncoding: string | null;
  transferEncoding: string | null;
  assessment: PerformanceAssessment;
}

export interface PerformanceAssessment {
  caching: 'none' | 'disabled' | 'validation-required' | 'very-short' | 'short' | 'good' | 'legacy';
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

/**
 * Diff data structure tracking differences between two URLs
 */
export interface MetaTagDiff {
  /** Tags that are identical in both URLs */
  identical: MetaTagField[];
  /** Tags with differing text/attributes between URLs */
  changed: TagChange[];
  /** Tags present in URL B but missing in URL A */
  added: TagChange[];
  /** Tags present in URL A but missing in URL B */
  removed: TagChange[];
}

/**
 * Individual meta tag field that is identical
 */
export interface MetaTagField {
  key: string;
  value: string;
}

/**
 * Tag that changed, was added, or was removed
 */
export interface TagChange {
  /** Field identifier (e.g., 'og.title', 'twitter.card') */
  field: string;
  /** Value from URL A (null if added) */
  valueA?: string | null;
  /** Value from URL B (null if removed) */
  valueB?: string | null;
  /** Human-readable field name */
  fieldName?: string;
}

/**
 * Platform-specific diff information
 * Tracks how platform scores and grades changed between URLs
 */
export interface PlatformDiff {
  /** Platforms that scored identically */
  identical: PlatformDiffEntry[];
  /** Platforms with different scores/grades */
  changed: PlatformDiffEntry[];
  /** Platforms supported in URL B but not in URL A */
  added: PlatformDiffEntry[];
  /** Platforms supported in URL A but not in URL B */
  removed: PlatformDiffEntry[];
}

/**
 * Single platform diff entry
 */
export interface PlatformDiffEntry {
  /** Platform ID (e.g., 'twitter', 'facebook') */
  platformId: string;
  /** Platform display name */
  platformName: string;
  /** Platform category */
  category: string;
  /** Score from URL A (null if added) */
  scoreA?: number | null;
  /** Score from URL B (null if removed) */
  scoreB?: number | null;
  /** Grade from URL A (null if added) */
  gradeA?: string | null;
  /** Grade from URL B (null if removed) */
  gradeB?: string | null;
  /** Direction of change */
  changeDirection?: 'improved' | 'degraded' | 'unchanged' | 'added' | 'removed';
  /** Issues from URL A */
  issuesA?: string[];
  /** Issues from URL B */
  issuesB?: string[];
}

/**
 * Complete comparison analysis
 * Combines response data with computed diffs
 */
export interface CompareAnalysis {
  /** Raw response from API */
  response: CompareResponse;
  /** Computed meta tag diffs */
  metaDiff: MetaTagDiff | null;
  /** Computed platform diffs */
  platformDiff: PlatformDiff | null;
  /** Whether URL A succeeded */
  aSuccess: boolean;
  /** Whether URL B succeeded */
  bSuccess: boolean;
}
