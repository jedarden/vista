# Filter-Change Hook Patterns in app.js

## Overview

This document catalogs all filter-change hook patterns found in `/home/coding/vista/src/public/app.js` and related modules. These patterns manage the interaction between filter operations (show/hide platforms) and smart ordering (automatic card reordering based on scores).

---

## Pattern 1: Function Wrapping Hooks

### Hook into `renderDiagnostics` (Lines 8950-8955)

**Location:** `/home/coding/vista/src/public/app.js:8950-8955`

**Pattern:** Store original function → Replace with wrapper → Call original → Execute hook logic

```javascript
// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```

**Purpose:** Attach diagnostic tracking after diagnostics rendering completes.

**Hook trigger:** When `renderDiagnostics()` is called.

**Context:** Used to initialize tracking after diagnostic elements are rendered to DOM.

---

### Hook into `handleResult` (Lines 8957-8982)

**Location:** `/home/coding/vista/src/public/app.js:8957-8982`

**Pattern:** Store original function → Replace with async wrapper → Execute pre-logic → Call original

```javascript
// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  // Store reference for use in hook
  const originalData = data;

  // P0 - Timing fix: Set currentData BEFORE applySmartOrderingSafe() call
  // applySmartOrdering() requires currentData to be set (line 8577 early exit check)
  // but originalHandleResult2 sets it at line 1025, which is too late
  currentData = data;

  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');
    // P0 - Race condition fix: Use applySmartOrderingSafe() instead of applySmartOrdering()
    // This ensures guard flags (isApplyingSmartOrder) are properly set to prevent
    // concurrent execution with renderPreviews, which was causing order resets
    applySmartOrderingSafe();
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }

  // Now render with cards already in correct order (no post-render reordering needed)
  // Note: renderPreviews will check isApplyingSmartOrder and queue if needed
  await originalHandleResult2(data);
};
```

**Purpose:** Apply smart ordering BEFORE rendering to prevent race conditions and order resets.

**Hook trigger:** When inspection results arrive and `handleResult()` is called.

**Context:** Critical hook that fixes timing issues where smart ordering was happening after render, causing visible card reordering.

---

## Pattern 2: Guard Flags and State Variables

### `isFilterOperation` Flag (Lines 5046-5048, 6279, 8080-8082, 8096-8099, 8144-8149, 8156-8159, 8263-8265)

**Location:**
- Declaration: `/home/coding/vista/src/public/app.js:6279`
- Exposure: `/home/coding/vista/src/public/app.js:5046-5048`
- Usage: Multiple locations

**Pattern:** Boolean flag that prevents smart order resets during filter operations

```javascript
// Declaration (line 6279)
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

// Exposure to window object (lines 5046-5048)
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

// Usage pattern (lines 8080-8082, 8096-8099, 8144-8149, 8156-8159, 8263-8265)
isFilterOperation = true;
// ... perform filter operation ...
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Signal that a filter operation is in progress so smart ordering logic doesn't reset card order.

**Guarded operations:**
- Import preferences (line 8080-8082)
- What-if mode toggle (line 8144-8149)
- Platform visibility changes (line 8263-8265)

**Check location:** Line 8792-8794
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
  // Skip cardOrder clearing
}
```

---

### `isSmartOrderingActive` Flag

**Location:** Referenced throughout, managed in `applySmartOrderingSafe()` and related functions

**Pattern:** Runtime flag tracking whether smart ordering is currently executing

**Purpose:** Work with `platformPrefs.smartOrdering` to determine if smart ordering is active right now.

**Related function:** `isSmartOrdering()` at line 7933-7935
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

---

### `isApplyingSmartOrder` Flag

**Location:** Managed in `applySmartOrderingSafe()` (line 8997)

**Pattern:** Guard flag preventing concurrent smart ordering operations

**Purpose:** Ensure only one smart ordering operation runs at a time. Used by `renderPreviews` to queue if ordering is in progress.

**Usage in `applySmartOrderingSafe()`:**
```javascript
isApplyingSmartOrder = true;
try {
  applySmartOrdering();
  reorderPlatformCards();
} finally {
  isApplyingSmartOrder = false;
}
```

---

## Pattern 3: Queue System for Deferred Operations

### `pendingFilterOperations` Queue (Lines 5050-5052, 6281, 7946, 7962-7963)

**Location:**
- Declaration: `/home/coding/vista/src/public/app.js:6281`
- Exposure: `/home/coding/vista/src/public/app.js:5050-5052`
- Usage: Lines 7946, 7962-7963

**Pattern:** Array that stores filter operations to execute after smart ordering completes

```javascript
// Declaration (line 6281)
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Exposure (lines 5050-5052)
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Purpose:** Defer filter operations (like hiding/showing platforms) until smart ordering completes.

---

### `queueFilterOperation()` Function (Lines 5055, 7942-7947)

**Location:** `/home/coding/vista/src/public/app.js:7942-7947`

**Pattern:** Add operation to queue for later execution

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

// Exposure (line 5055)
window.queueFilterOperation = queueFilterOperation;
```

**Usage examples:**
- Line 8088: `queueFilterOperation(applyImportedPrefs, 'importPreferences')`
- Line 8148: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode')`

**Purpose:** Queue operations that should run after smart ordering completes.

---

### `processPendingFilterOperations()` Function (Lines 5056, 7952-7975)

**Location:** `/home/coding/vista/src/public/app.js:7952-7975`

**Pattern:** Execute queued operations after smart ordering completes

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

// Exposure (line 5056)
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Purpose:** Execute all queued filter operations in order after smart ordering completes.

---

## Pattern 4: Guard Wrapper Functions (External Module)

### `guardWrapper()` Function

**Location:** `/home/coding/vista/src/public/filter-guard-wrapper.js:47-62`

**Pattern:** Wrapper that checks smart ordering before executing filter logic

```javascript
function guardWrapper(handlerName, handlerFunction) {
  // Check if smart ordering is active
  if (typeof isSmartOrdering === 'function' && isSmartOrdering()) {
    // Queue the operation for later execution
    if (typeof queueFilterOperation === 'function') {
      queueFilterOperation(handlerFunction, handlerName);
      if (typeof DEBUG_SMART_ORDERING !== 'undefined' && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active - operation queued`);
      }
    }
    return;
  }

  // Execute the handler logic immediately
  handlerFunction();
}
```

**Usage in app.js:**
- Line 7868: `guardWrapper('toggleFavorite', () => { ... })`

**Purpose:** Automatically defer filter operations when smart ordering is active.

---

### `guardWrapperWithRender()` Function

**Location:** `/home/coding/vista/src/public/filter-guard-wrapper.js:88-107`

**Pattern:** Wrapper that sets `isFilterOperation` flag for render-triggering handlers

```javascript
function guardWrapperWithRender(handlerName, handlerFunction) {
  return guardWrapper(handlerName, () => {
    handlerFunction();

    // Set filter guard and clear it after render
    // Use 'in' check to handle both defined and undefined cases
    if ('isFilterOperation' in globalThis || typeof isFilterOperation !== 'undefined') {
      isFilterOperation = true;
      setTimeout(() => { isFilterOperation = false; }, 0);
    }

    // Clear smart ordering active flag
    if ('isSmartOrderingActive' in globalThis || typeof isSmartOrderingActive !== 'undefined') {
      isSmartOrderingActive = false;
      if ('DEBUG_SMART_ORDERING' in globalThis && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active flag CLEARED (user manual override)`);
      }
    }
  });
}
```

**Usage in app.js:**
- Line 7978: `guardWrapperWithRender('toggleHidden', () => { ... })`

**Purpose:** For filter handlers that call `renderPreviews()`, sets guard flags to prevent order resets during render.

---

## Pattern 5: Centralized Guard Functions (External Module)

### `isSmartOrdering()` Function

**Location:** `/home/coding/vista/src/public/guard-utils.js:39-46`

**Pattern:** Centralized guard checking both user preference and runtime state

```javascript
function isSmartOrdering() {
  // Access state from window object for cross-module compatibility
  const prefs = window.platformPrefs || {};
  const userPreference = prefs.smartOrdering !== false; // Default is true
  const runtimeState = window.isSmartOrderingActive || false;

  return userPreference && runtimeState;
}
```

**Purpose:** Check if smart ordering is BOTH enabled AND currently active.

**Usage:** Used by `guardWrapper()` and throughout app.js (line 7933-7935, 8792).

---

### `isSmartOrderingEnabled()` Function

**Location:** `/home/coding/vista/src/public/guard-utils.js:61-64`

**Pattern:** Check only user preference, not runtime state

```javascript
function isSmartOrderingEnabled() {
  const prefs = window.platformPrefs || {};
  return prefs.smartOrdering !== false; // Default is true
}
```

**Purpose:** Check if smart ordering feature is allowed (not necessarily active).

---

### `isFilterOperationInProgress()` Function

**Location:** `/home/coding/vista/src/public/guard-utils.js:78-80`

**Pattern:** Check if filter operation is currently executing

```javascript
function isFilterOperationInProgress() {
  return window.isFilterOperation || false;
}
```

**Purpose:** Check runtime state to prevent race conditions with filter operations.

---

## Pattern 6: Smart Ordering Thread Safety

### `applySmartOrderingSafe()` Function (Lines 8988-9040)

**Location:** `/home/coding/vista/src/public/app.js:8988-9040`

**Pattern:** Thread-safe version of smart ordering with guard flags

```javascript
function applySmartOrderingSafe() {
  // If already applying, queue a pending application
  if (isApplyingSmartOrder) {
    console.log('[applySmartOrderingSafe] Already applying - queueing pending operation');
    pendingApplySmartOrder = true;
    return;
  }

  // Set guard flag BEFORE try block
  isApplyingSmartOrder = true;
  pendingApplySmartOrder = false;

  try {
    applySmartOrdering();
    isSmartOrderingActive = true;
    reorderPlatformCards();

    if (pendingApplySmartOrder) {
      setTimeout(applySmartOrderingSafe, 0);
    }
  } finally {
    // Always clear guard flag AFTER all operations complete
    isApplyingSmartOrder = false;

    if (pendingRenderData) {
      processPendingRender();
    }
  }
}
```

**Purpose:** Ensure only one smart ordering operation runs at a time, preventing concurrent execution with `renderPreviews`.

---

## Pattern 7: Deferred Execution Pattern

### `shouldDeferFilterOperation()` Function (Lines 7891-7893)

**Location:** `/home/coding/vista/src/public/app.js:7891-7893`

**Pattern:** Check if operation should be deferred

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Determine if filter operation should be queued or executed immediately.

---

### Filter Handler Usage Pattern (Lines 7906-7915, 7924)

**Location:** `/home/coding/vista/src/public/app.js:7906-7915, 7924`

**Pattern:** Documented usage pattern for filter handlers

```javascript
/**
 * **Usage in filter handlers:**
 * function myFilterHandler() {
 *   if (isSmartOrdering()) {
 *     queueFilterOperation(myFilterHandler, 'myFilterHandler');
 *     return;
 *   }
 *   // Proceed with filter operation
 * }
 */
```

**Purpose:** Standard pattern for writing filter handlers that respect smart ordering.

---

## Summary of Hook Patterns

| Pattern | Location | Purpose | Key Variables |
|---------|----------|---------|---------------|
| Function Wrapping Hook | 8950-8982 | Intercept and augment function behavior | `originalRenderDiagnostics`, `originalHandleResult2` |
| Guard Flags | 6279, 5046-5048 | Prevent order resets during operations | `isFilterOperation`, `isSmartOrderingActive`, `isApplyingSmartOrder` |
| Queue System | 6281, 5050-5052, 7942-7975 | Defer operations during smart ordering | `pendingFilterOperations`, `queueFilterOperation`, `processPendingFilterOperations` |
| Guard Wrappers | filter-guard-wrapper.js | Auto-defer for filter handlers | `guardWrapper`, `guardWrapperWithRender` |
| Central Guards | guard-utils.js | Cross-module state checks | `isSmartOrdering()`, `isFilterOperationInProgress()` |
| Thread Safety | 8988-9040 | Prevent concurrent execution | `applySmartOrderingSafe()` |

---

## Integration Points

### Script Loading Order (index.html)

```html
<script src="guard-utils.js"></script>
<!-- Other scripts... -->
<script src="app.js"></script>
```

**Note:** `filter-guard-wrapper.js` functions are defined inline in `app.js` or loaded as needed.

### Global State Exposure (Lines 5046-5056)

All key state and functions are exposed via `window` object for cross-module access:

```javascript
// Guard flags
Object.defineProperty(window, 'isFilterOperation', { get: () => isFilterOperation, set: (val) => { isFilterOperation = val; } });
Object.defineProperty(window, 'pendingFilterOperations', { get: () => pendingFilterOperations, set: (val) => { pendingFilterOperations = val; } });

// Queue functions
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

---

## Related Documentation

- **Bead bf-6d44t:** Parent documentation of filter-change hook patterns
- **Bead bf-3lc34:** Detailed filter-change hooks and custom event patterns documentation
- **Bead bf-27nlv:** Comprehensive filter-change patterns documentation

---

**Document created:** 2026-07-24
**Task:** bf-52b8f (Phase 2 split from bf-6d44t)
**Scope:** Filter-change hook patterns in vista app.js and related modules
