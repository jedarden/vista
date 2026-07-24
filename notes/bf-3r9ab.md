# Filter State Variables Documentation (bf-3r9ab)

## Overview
Search results for all state variables in `src/public/app.js` that track filter state and their relationship to queue operations.

## Primary Filter State Variables

### 1. `isFilterOperation` (Line 6279)
**Declaration:**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Purpose:** Boolean guard flag that prevents smart order resets during filter operations.

**Usage Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Global Export (Lines 5046-5049):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

**Related Usage (Lines 8792-8796):**
```javascript
if (isFilterOperation || isSmartOrdering()) {
  const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
  console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
}
```

### 2. `pendingFilterOperations` (Line 6281)
**Declaration:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Purpose:** Array-based queue that stores filter operations to be executed after smart ordering completes.

**Usage Pattern (Lines 7942-7947):**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Processing Pattern (Lines 7952-7975):**
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }
  
  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }
  
  // Process each pending operation
  const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
  pendingFilterOperations = []; // Clear queue
  
  operations.forEach(({ operation, description }) => {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```

**Global Export (Lines 5050-5053):**
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Queue Operation Examples:**
- Line 8088: `queueFilterOperation(applyImportedPrefs, 'importPreferences');`
- Line 8148: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');`

## Related State Variables (Context)

### `isSmartOrderingActive` (Line 6280)
**Declaration:**
```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```

**Purpose:** Runtime flag tracking smart ordering progress, used in conjunction with filter operations.

### `pendingApplySmartOrder` (Line 6274)
**Declaration:**
```javascript
let pendingApplySmartOrder = false;
```

**Purpose:** Pending state for smart ordering operations.

## State Variable Initialization Context (Lines 6274-6286)

```javascript
let pendingApplySmartOrder = false;
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
let isRendering = false; // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let currentPageType = null; // Track current page type for stale cardOrder detection
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Command palette state
let commandPaletteOpen = false;
let commandPaletteSelectedIndex = 0;
let recentCommands = [];
```

## Queue Operations Integration

**Exported Functions (Lines 5055-5056):**
```javascript
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Common Pattern:**
```javascript
// When smart ordering is active, queue filter operations instead of executing immediately
if (isSmartOrdering()) {
  queueFilterOperation(applyFilterHandler, 'filterOperationDescription');
} else {
  // Set guard flag to prevent smart order resets during filter operation
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

## Summary

| Variable | Line | Type | Purpose | Queue Operations |
|----------|------|------|---------|------------------|
| `isFilterOperation` | 6279 | Boolean | Guard flag preventing smart order resets during filter changes | Used as guard flag, not a queue itself |
| `pendingFilterOperations` | 6281 | Array | Queue storing filter operations to execute after smart ordering completes | **Primary queue** for filter operations |

**Key Finding:** The filter state uses a **guard flag pattern** (`isFilterOperation`) combined with a **queue array pattern** (`pendingFilterOperations`) to coordinate filter operations with smart ordering, preventing race conditions and state resets.
