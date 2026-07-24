# Filter Queue and State Patterns Documentation

## Overview

Comprehensive documentation of filter operation queues, state management, and batch processing patterns in `app.js`. These patterns prevent race conditions between filter operations and smart ordering functionality.

## State Variables

### Line 6273-6281
```javascript
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

### Key State Variables

1. **`isFilterOperation`** (Line 6279)
   - Purpose: Guard flag to prevent smart order resets during filter changes
   - Type: Boolean
   - Usage: Set to `true` during filter operations, cleared with `setTimeout(..., 0)`

2. **`isSmartOrderingActive`** (Line 6280)
   - Purpose: Track when smart ordering is currently active
   - Type: Boolean
   - Usage: Set to `true` during smart ordering, checked by `isSmartOrdering()`

3. **`pendingFilterOperations`** (Line 6281)
   - Purpose: Queue filter operations during smart ordering
   - Type: Array of objects `{ operation: Function, description: string }`
   - Usage: Stores filter operations that need to execute after smart ordering completes

4. **`isApplyingSmartOrder`** (Line 6273)
   - Purpose: Prevents concurrent renders during smart ordering
   - Type: Boolean
   - Usage: Guard flag to prevent multiple simultaneous smart order operations

5. **`pendingRenderData`** (Line 6275)
   - Purpose: Queue renderPreviews calls during smart ordering
   - Type: Object or null
   - Usage: Stores render data that should be processed after smart ordering completes

## Queue Management Functions

### `queueFilterOperation()` (Lines 7942-7946)

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Add a filter operation to the pending queue

**Parameters:**
- `operation` (Function): The filter operation function to execute later
- `description` (string): Description of the operation for debugging

**Pattern:** Simple push to array with debug logging

### `processPendingFilterOperations()` (Lines 7952-7975)

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

**Purpose:** Process all pending filter operations after smart ordering completes

**Pattern Details:**
1. **Early exit:** Check if queue is empty
2. **Array copy pattern:** `slice()` creates copy to avoid modification during iteration
3. **Queue clearing:** Empty array before processing to prevent re-queue issues
4. **Error handling:** Each operation wrapped in try-catch to prevent one failure from blocking others
5. **Debug logging:** Comprehensive logging for debugging

## Guard Functions

### `isSmartOrdering()` (Lines 7934-7935)

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Centralized guard function checking both user preference and runtime state

**Usage Pattern:** Used before operations that might interfere with smart ordering

### `shouldDeferFilterOperation()` (Lines 7891-7893)

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Check if filter operation should be deferred due to active smart ordering

## Queue Usage Patterns

### Import Preferences Pattern (Lines 8070-8092)

```javascript
if (isSmartOrdering()) {
  // Create a wrapper function that doesn't depend on the event
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
    }
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  if (DEBUG_SMART_ORDERING) {
    console.log('[importPreferences] Smart ordering active - operation queued');
  }
  return;
}
```

**Pattern Elements:**
1. Check `isSmartOrdering()` before proceeding
2. Create wrapper function to avoid event dependency
3. Set `isFilterOperation = true` before render
4. Clear flag with `setTimeout(..., 0)` after render
5. Clear `isSmartOrderingActive` flag
6. Queue operation with descriptive name
7. Return early to prevent execution

### Toggle What-If Mode Pattern (Lines 8148-8162)

```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  if (DEBUG_SMART_ORDERING) {
    console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
  }
  return;
}

// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Pattern Elements:**
1. Conditional queuing based on smart ordering state
2. Direct execution when smart ordering is not active
3. Flag management with `setTimeout` for async safety

## Filter Operation Guard Pattern (Lines 8792-8795)

```javascript
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
}
```

**Purpose:** Prevent smart order resets during filter operations

**Pattern:** Check both `isFilterOperation` and `isSmartOrdering()` with detailed logging

## Flag Management Patterns

### isFilterOperation Flag Pattern

**Setting:** `isFilterOperation = true;`
**Clearing:** `setTimeout(() => { isFilterOperation = false; }, 0);`

**Usage Locations:**
- Line 8080, 8082: Import preferences
- Line 8096, 8099: Import preferences direct execution
- Line 8144, 8146: What-If mode
- Line 8156, 8159: What-If mode direct execution
- Line 8263, 8265: Additional filter operation

### isSmartOrderingActive Flag Pattern

**Setting:** Line 9009 - `isSmartOrderingActive = true;`
**Clearing:** Lines 7878, 8083, 8102 - `isSmartOrderingActive = false;`

**Usage:** User manual override when preferences are imported

## Platform Filter Operations

### toggleHidden() Function (Lines 7977-7988)

```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData); // Re-render to apply hiding
  });
}
```

**Pattern:** Uses `guardWrapperWithRender` for automatic state management

### toggleFavorite() Function (Lines 7867-7884)

```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();
    renderPreviews(currentData);

    // Clear smart ordering active flag since user manually modified favorites
    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

**Pattern:** Uses `guardWrapper` with explicit flag clearing for user overrides

## Batch Processing Patterns

### Render Queue Pattern (Lines 1597-1604)

```javascript
if (isApplyingSmartOrder) {
  pendingRenderData = data;
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Smart ordering in progress, queued render for URL:', data.url);
  }
  return;
}
```

**Purpose:** Queue render calls when smart ordering is in progress

### Apply Smart Order Pattern (Lines 8990-9001)

```javascript
if (isApplyingSmartOrder) {
  pendingApplySmartOrder = true;
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrdering] Already in progress - will re-apply after completion');
  }
  return;
}
// ... later in code
isApplyingSmartOrder = true;
pendingApplySmartOrder = false;
```

**Purpose:** Prevent concurrent smart ordering operations

## Debounce/Throttle Patterns

### Flag Clearing with setTimeout

**Pattern:** `setTimeout(() => { isFilterOperation = false; }, 0);`

**Purpose:** Ensure flag is cleared in the next event loop iteration, preventing race conditions

**Usage:** Multiple locations (8082, 8099, 8146, 8159, 8265)

### No Explicit Debounce for Filter Input

The filter input listener (Line 3991) does **not** use debounce:
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

**Note:** Filter input processing is immediate, not debounced

## Global Exports (Lines 5041-5059)

```javascript
// Expose guard functions and state for integration testing
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});

Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

window.isSmartOrdering = isSmartOrdering;
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
window.toggleHidden = toggleHidden;
window.toggleFavorite = toggleFavorite;
```

**Purpose:** Expose internal state and functions for integration testing and debugging

## Summary

The filter queue and state patterns in `app.js` implement a sophisticated coordination system between filter operations and smart ordering:

1. **Queue-based deferral:** Filter operations are queued when smart ordering is active
2. **Guard flags:** Multiple flags prevent race conditions (`isFilterOperation`, `isSmartOrderingActive`, `isApplyingSmartOrder`)
3. **Async safety:** `setTimeout(..., 0)` pattern ensures flags are cleared safely
4. **Error isolation:** Each queued operation has individual error handling
5. **Debug visibility:** Comprehensive logging for debugging complex interactions
6. **User override:** Manual operations clear smart ordering state to prevent interference

These patterns ensure that user-initiated filter operations don't conflict with automatic smart ordering, while maintaining responsiveness and data consistency.
