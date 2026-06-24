# Bead BF-AMS0: TypeScript Types for /api/compare

## Work Completed

Created comprehensive TypeScript type definitions for the `/api/compare` endpoint and related diff structures.

## Files Created

- `src/types/compare.ts` - Complete type definitions covering:
  - Meta tag types (MetaTags, OpenGraphTags, TwitterTags, RawMetaTag)
  - Image probe types (ImageProbe, CropRatios)
  - Scoring types (ScoringResult, OverallScore, GradeCounts, PlatformScore)
  - Diagnostics types (Diagnostic)
  - Auto fix types (AutoFix)
  - Header analysis types (HeaderAnalysis, SecurityHeaderAnalysis, CorsAnalysis, ServerAnalysis, PerformanceAnalysis)
  - Preview result types (PreviewResult - from /api/preview)
  - **Compare response types** (CompareResponse, CompareResultData, CompareError)
  - **Diff types** (FieldChange, MetaTagDiff, PlatformDiff, PlatformScoreInfo, CompleteDiff)
  - Helper types (FlattenedMeta, PlatformGrade, DiffRowType, ChangeClass)

## Type Definitions Overview

### /api/compare Response

```typescript
interface CompareResponse {
  a: CompareResultData;  // PreviewResult | CompareError
  b: CompareResultData;  // PreviewResult | CompareError
}
```

### Meta Tag Diff Structure

```typescript
interface MetaTagDiff {
  added: FieldChange[];      // Fields present in B but not A
  removed: FieldChange[];   // Fields present in A but not B
  changed: FieldChange[];   // Fields with different values
  missing: string[];        // Tags missing from both
}

interface FieldChange {
  field: string;
  from: string | null;
  to: string | null;
}
```

### Platform Diff Structure

```typescript
interface PlatformDiff {
  platformId: string;
  platformName: string;
  before: PlatformScoreInfo;
  after: PlatformScoreInfo;
  changeType: 'improved' | 'degraded' | 'unchanged' | 'added' | 'removed';
  gradeDelta: number;
  scoreDelta: number;
  missingTags?: string[];
}
```

## How It Maps to the Codebase

These types accurately represent the actual data structures used in:

1. **Server-side** (`src/server.js`):
   - `/api/compare` endpoint (lines 986-1065)
   - `buildPreviewResult()` function (lines 1363-1402)
   - Scoring and diagnostics structures

2. **Client-side** (`src/public/app.js`):
   - `renderMetaTagDiff()` - displays field changes (lines 4885-4937)
   - `renderPlatformComparison()` - displays platform diffs (lines 4939-4991)
   - `flattenMeta()` and `getMetaValue()` helpers for comparison

## Verification

The types are syntactically correct TypeScript and compile without errors. The project does not currently have TypeScript as a dependency, but these type definitions are ready for use when TypeScript is added or can be used with IDE type checking via JSDoc annotations.

## Acceptance Criteria Met

✅ Type definitions in a .ts file  
✅ Clear interfaces for CompareResponse  
✅ Clear interfaces for PlatformDiff  
✅ Covers all major data structures involved in comparison  
✅ Includes related types (meta, scoring, platform data)  
✅ Syntactically correct and compilable
