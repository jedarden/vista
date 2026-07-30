# Filter Queue Declarations in app.js

## Overview
This document identifies all filter queue declarations and related state variables in `/home/coding/vista/src/public/app.js`.

## Primary Filter Queue

### `pendingFilterOperations` (Line 6281)
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Purpose**: Stores filter operation objects that are queued when smart ordering is in progress.

**Declaration Pattern**: Empty array initialization with explanatory comment

**Queue Structure**: Each entry is an object with:
- `operation`: The function to execute
- `description`: String describing the operation for debugging

**Related Functions**:
- `queueFilterOperation(operation, description)` (Line 7942) - Adds operations to the queue
- `processPendingFilterOperations()` (Line 7952) - Processes queued operations after smart ordering completes

**Usage Example** (Line 7946):
```javascript
pendingFilterOperations.push({ operation, description });
```

**Clear Pattern** (Line 7963):
```javascript
pendingFilterOperations = []; // Clear queue
```

## Related Render Queues

### `pendingRenderData` (Line 6275)
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Purpose**: Queues `renderPreviews` data when smart ordering is in progress to prevent race conditions.

**Type**: Single object storage (not an array) - stores the latest render data

### `pendingRenderAfterCurrent` (Line 6277)
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Purpose**: Queues render data when another render is already in progress.

**Type**: Single object storage (not an array) - stores the latest render data

## Guard Flags and Related State

These are not filter queues themselves but control the queuing behavior:

### `pendingApplySmartOrder` (Line 6274)
```javascript
let pendingApplySmartOrder = false;
```
**Purpose**: Tracks if another smart ordering operation was requested while one is in progress.

### `isFilterOperation` (Line 6279)
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```
**Purpose**: Prevents smart ordering resets during filter changes. Set during filter operations.

### `isApplyingSmartOrder` (Line 6273)
```javascript
let isApplyingSmartOrder = false;
```
**Purpose**: Prevents race conditions during smart ordering by blocking concurrent operations.

### `isRendering` (Line 6276)
```javascript
let isRendering = false; // Guard flag to prevent concurrent renders
```
**Purpose**: Prevents concurrent render operations.

### `isSmartOrderingActive` (Line 6280)
```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```
**Purpose**: Tracks when smart ordering is currently active.

### `currentPageType` (Line 6278)
```javascript
let currentPageType = null; // Track current page type for stale cardOrder detection
```
**Purpose**: Tracks current page type to detect stale cardOrder data.

## Summary

**Filter Queue Array**: 1 total
- `pendingFilterOperations` at line 6281

**Related Queues** (non-array): 2 total
- `pendingRenderData` at line 6275
- `pendingRenderAfterCurrent` at line 6277

**Guard/State Variables**: 7 total
- `isApplyingSmartOrder` at line 6273
- `pendingApplySmartOrder` at line 6274
- `isRendering` at line 6276
- `currentPageType` at line 6278
- `isFilterOperation` at line 6279
- `isSmartOrderingActive` at line 6280

## Global Exports

These queue and state variables are exposed globally via `Object.defineProperty` at lines 5046-5053:
- `window.isFilterOperation`
- `window.pendingFilterOperations`

## Initialization Pattern

All filter queue declarations are grouped together in a dedicated section (lines 6272-6281) with the comment:
```javascript
// ── Guard flags to prevent race conditions during smart ordering ──
```

This shows intentional organization of all queue and guard flag declarations in one location for maintainability.
