# Queue Variable Declarations - Filter Operations (bf-3aki0)

## Overview
Search results from `/home/coding/vista/src/public/app.js` for all queue variable declarations related to filter operations.

## Primary Queue Variables

### 1. `pendingFilterOperations` (Line 6281)
**Purpose:** Main queue for storing filter operations during smart ordering

**Declaration:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Initialization Pattern:** Array initialized as empty `[]`

**Window Property Definition (Line 5050-5053):**
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Usage Pattern (Line 7946):**
```javascript
pendingFilterOperations.push({ operation, description });
```

**Clear Pattern (Line 7963):**
```javascript
pendingFilterOperations = []; // Clear queue
```

---

### 2. `isFilterOperation` (Line 6279)
**Purpose:** Guard flag to prevent smart order resets during filter changes

**Declaration:**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Initialization Pattern:** Boolean initialized as `false`

**Window Property Definition (Line 5046-5049):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

---

## Related Pending State Variables

### 3. `pendingRenderData` (Line 6275)
**Purpose:** Queue renderPreviews calls during smart ordering

**Declaration:**
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Initialization Pattern:** Null initialized as `null`

---

### 4. `pendingRenderAfterCurrent` (Line 6277)
**Purpose:** Queue renders during active render

**Declaration:**
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Initialization Pattern:** Null initialized as `null`

---

### 5. `pendingApplySmartOrder` (Line 6274)
**Purpose:** Flag indicating pending smart order application

**Declaration:**
```javascript
let pendingApplySmartOrder = false;
```

**Initialization Pattern:** Boolean initialized as `false`

---

### 6. `pendingWhatIfTags` (Line 12)
**Purpose:** Store pending What If tags from hash before data loads

**Declaration:**
```javascript
let pendingWhatIfTags = null; // Store pending What If tags from hash before data loads
```

**Initialization Pattern:** Null initialized as `null`

---

## Queue Management Functions

### 7. `queueFilterOperation` (Line 7942)
**Purpose:** Function to add operations to the pending filter operations queue

**Function Signature:**
```javascript
function queueFilterOperation(operation, description)
```

**Implementation:**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Window Exposure (Line 5055):**
```javascript
window.queueFilterOperation = queueFilterOperation;
```

**Known Usage Sites:**
- Line 8088: `queueFilterOperation(applyImportedPrefs, 'importPreferences')`
- Line 8148: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode')`

---

### 8. `processPendingFilterOperations` (Line 7952)
**Purpose:** Process pending filter operations after smart ordering completes

**Function Signature:**
```javascript
function processPendingFilterOperations()
```

**Implementation:**
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

**Window Exposure (Line 5056):**
```javascript
window.processPendingFilterOperations = processPendingFilterOperations;
```

---

## Summary of Queue Variable Names

| Variable Name | Line | Type | Purpose |
|--------------|------|------|---------|
| `pendingFilterOperations` | 6281 | Array | Main queue for filter operations |
| `isFilterOperation` | 6279 | Boolean | Guard flag for filter changes |
| `pendingRenderData` | 6275 | Null | Queue renderPreviews calls |
| `pendingRenderAfterCurrent` | 6277 | Null | Queue renders during active render |
| `pendingApplySmartOrder` | 6274 | Boolean | Pending smart order flag |
| `pendingWhatIfTags` | 12 | Null | Store pending What If tags |

---

## Initialization Patterns Found

1. **Array Pattern:** `let variableName = [];` (for `pendingFilterOperations`)
2. **Boolean Pattern:** `let variableName = false;` (for `isFilterOperation`, `pendingApplySmartOrder`)
3. **Null Pattern:** `let variableName = null;` (for `pendingRenderData`, `pendingRenderAfterCurrent`, `pendingWhatIfTags`)

---

## Queue Operations Pattern

The queue follows this standard pattern:
1. **Enqueue:** `queue.push({ operation, description })`
2. **Process:** Copy array, clear original, iterate over copy
3. **Execute:** Call each queued operation with error handling
4. **Clear:** Reset to empty array `[]` or `null`

---

## Context: Guard Flags Section

These variables are declared in a dedicated section (lines 6272-6281):

```javascript
// ── Guard flags to prevent race conditions during smart ordering ──
let isApplyingSmartOrder = false;
let pendingApplySmartOrder = false;
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
let isRendering = false; // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let currentPageType = null; // Track current page type for stale cardOrder detection
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

This section groups all state management variables for preventing race conditions during concurrent operations.
