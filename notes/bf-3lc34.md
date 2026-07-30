# Filter-Change Hooks and Custom Event Patterns in app.js

**Task:** bf-3lc34 - Search filter-change hooks and custom patterns  
**File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24

---

## Executive Summary

Found **4 distinct hook patterns** and **1 custom event bus/emitter pattern** related to filter changes in app.js. The patterns primarily coordinate between filter operations and smart ordering to prevent race conditions.

---

## Hook Patterns

### 1. handleResult Hook (Lines 8957-8982)

**Pattern Type:** Function wrapping/replacement hook

**Code:**
```javascript
// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  // Store reference for use in hook
  const originalData = data;

  // P0 - Timing fix: Set currentData BEFORE applySmartOrderingSafe() call
  currentData = data;

  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');
    // P0 - Race condition fix: Use applySmartOrderingSafe() instead of applySmartOrdering()
    applySmartOrderingSafe();
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }

  // Now render with cards already in correct order (no post-render reordering needed)
  await originalHandleResult2(data);
};
```

**Purpose:** Injects smart ordering logic before the original handleResult renders, preventing race conditions.

---

### 2. renderDiagnostics Hook (Lines 8950-8955)

**Pattern Type:** Function wrapping hook

**Code:**
```javascript
// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```

**Purpose:** Initializes diagnostic tracking after diagnostics render.

---

## Guard Flag Patterns

### 3. Filter Operation Guard Flags (Lines 6279-6281)

**Pattern Type:** Boolean guard flags

**Code:**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Purpose:** Runtime state flags to coordinate filter operations with smart ordering.

---

### 4. Filter Operation Guard Usage Pattern

**Pattern Type:** Set-guard-flag, render, then clear pattern

**Locations:**
- Line 8080-8082 (importPreferences)
- Line 8096-8099 (importPreferences)
- Line 8144-8146 (toggleWhatIfMode)
- Line 8156-8159 (toggleWhatIfMode)
- Line 8263-8265 (unnamed function)

**Code Pattern:**
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Prevents smart order resets during filter changes by temporarily setting a guard flag.

---

## Custom Event Emitter/Bus Patterns

### 5. Filter Operation Queue Pattern (Lines 7942-7975)

**Pattern Type:** Custom event queue/bus

**Code:**
```javascript
/**
 * Queue a filter operation to be processed after smart ordering completes
 * @param {Function} operation - The filter operation function to execute later
 * @param {string} description - Description of the operation for debugging
 */
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

/**
 * Process pending filter operations after smart ordering completes
 */
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

**Purpose:** Custom event bus that queues filter operations during smart ordering and processes them after completion. This is a **deferred execution pattern** for filter operations.

---

## Exposed API Patterns

### 6. Exposed Window API (Lines 5046-5056)

**Pattern Type:** Object.defineProperty + window.function exports

**Code:**
```javascript
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

**Purpose:** Exposes internal filter-operation state and queue functions to global window object for debugging/testing.

---

## Centralized Guard Functions

### 7. Smart Ordering Guard Function (Lines 7933-7935)

**Pattern Type:** Centralized guard check

**Code:**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Centralized guard function that checks BOTH user preference and runtime state.

---

### 8. Should Defer Filter Operation Check (Lines 7891-7893)

**Pattern Type:** Centralized defer check

**Code:**
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Centralized check for whether filter operations should be deferred.

---

## Filter Input Event Patterns

### 9. Filter Input Event Listener (Lines 3991-3993)

**Pattern Type:** Standard addEventListener with inline handler

**Code:**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Purpose:** Direct filter input handler for metadata table.

---

### 10. Command Palette Filter (Lines 9085, 9177-9180)

**Pattern Type:** Named filter function

**Code:**
```javascript
input.addEventListener('input', filterCommands);

function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;
  // ... filtering logic
}
```

**Purpose:** Command palette search filter.

---

## Related Patterns

### 11. Smart Ordering Safe Wrapper (Lines 8984-8964)

**Pattern Type:** Thread-safe wrapper function

**Code:**
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
    // Step 1: Update platformPrefs.cardOrder with smart ordering
    applySmartOrdering();

    // Set smart ordering active flag after successful application
    isSmartOrderingActive = true;

    // Step 2: Reorder DOM elements to match the new smart order
    reorderPlatformCards();

    // Step 3: If another operation was queued, process it
    if (pendingApplySmartOrder) {
      console.log('[applySmartOrderingSafe] Processing queued operation');
      setTimeout(applySmartOrderingSafe, 0);
    }
  } finally {
    // Always clear guard flag AFTER all operations complete
    isApplyingSmartOrder = false;
  }
}
```

**Purpose:** Thread-safe wrapper that prevents concurrent smart ordering operations.

---

## Summary

| Pattern Type | Count | Lines |
|--------------|-------|-------|
| Function wrapping hooks | 2 | 8950-8982 |
| Guard flag patterns | 4 | 6279-6281, 8080-8099, 8144-8146, 8156-8159, 8263-8265 |
| Custom event queue/bus | 1 | 7942-7975 |
| Exposed window API | 1 | 5046-5056 |
| Centralized guard functions | 2 | 7891-7893, 7933-7935 |
| Filter input listeners | 2 | 3991-3993, 9085, 9177-9180 |
| Thread-safe wrappers | 1 | 8984-8964 |

**Total distinct patterns found: 13**

---

## Key Insights

1. **Primary coordination pattern**: Filter operations use guard flags (`isFilterOperation`, `isSmartOrderingActive`) to prevent race conditions with smart ordering.

2. **Custom event bus**: The `queueFilterOperation` / `processPendingFilterOperations` pattern implements a deferred execution queue for filter operations during smart ordering.

3. **Hook pattern**: Function wrapping is used to inject logic into `handleResult` and `renderDiagnostics`.

4. **Exposed API**: Internal state and functions are exposed to `window` object for debugging/testing via `Object.defineProperty` and direct function exports.

5. **Thread-safety pattern**: `applySmartOrderingSafe()` implements a try/finally pattern with guard flags to prevent concurrent execution.
