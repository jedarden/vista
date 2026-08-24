# Queue Operations in app.js

## Queue Variables

### 1. `pendingFilterOperations` (Line 6763)
- **Type**: Array
- **Purpose**: Queue filter operations during smart ordering
- **Exported to window**: Yes (line 5476-5479)

### 2. `pendingRenderData` (Line 6757)
- **Type**: Single-value queue (stores latest data only)
- **Purpose**: Queue renderPreviews calls during smart ordering

### 3. `pendingRenderAfterCurrent` (Line 1762)
- **Type**: Single-value queue (stores latest data only)
- **Purpose**: Queue render calls during active rendering

---

## Push Operations (Line Numbers)

### `pendingFilterOperations.push()`
- **Line 8428**: `pendingFilterOperations.push({ operation, description });`
  - Called within `queueFilterOperation()` function
  - Queues operations when `isSmartOrdering()` is true

### `pendingRenderData` assignments
- **Line 1772**: `pendingRenderData = data;` (inside `renderPreviews`)
- **Line 9474**: `pendingApplySmartOrder = true;` (inside `applySmartOrderingSafe`)

### `pendingRenderAfterCurrent` assignment
- **Line 1762**: `pendingRenderAfterCurrent = data;` (inside `renderPreviews`)

---

## Processing Loops (Line Numbers)

### 1. `processPendingFilterOperations()` (Line 8434-8457)
- **Lines 8444-8445**: Copy array and clear queue
  ```javascript
  const operations = pendingFilterOperations.slice(); // Copy array
  pendingFilterOperations = []; // Clear queue
  ```
- **Line 8447**: `operations.forEach(({ operation, description }) => { ... })`
  - Iterates through all queued operations
  - Executes each operation with error handling (line 8451-8455)

### 2. `pendingRenderData` processing (Lines 9519-9526)
- **Line 9519**: Condition check `if (pendingRenderData)`
- **Line 9523**: Store reference `const dataToRender = pendingRenderData;`
- **Line 9524**: Clear queue `pendingRenderData = null;`
- **Line 9525**: Execute `renderPreviews(dataToRender)`

### 3. `pendingRenderAfterCurrent` processing (Lines 1882-1890)
- **Line 1882**: Condition check `if (pendingRenderAfterCurrent)`
- **Line 1886**: Store reference `const dataToRender = pendingRenderAfterCurrent;`
- **Line 1887**: Clear queue `pendingRenderAfterCurrent = null;`
- **Line 1889**: Execute `setTimeout(() => renderPreviews(dataToRender), 0)`

---

## Conditions that Trigger Queue Processing

### Guard Flags
1. **`isRendering`** (Line 1757): Checks if render is in progress
   - If true, queues to `pendingRenderAfterCurrent`

2. **`isApplyingSmartOrder`** (Line 1767): Checks if smart ordering is in progress
   - If true, queues to `pendingRenderData`

3. **`isSmartOrdering()`** (Lines 8624, 8569): Checks if smart ordering is active
   - If true, queues to `pendingFilterOperations`

### Processing Triggers
1. **Line 9510**: Guard flag cleared in `applySmartOrderingSafe` finally block
   - Triggers processing of `pendingRenderData`

2. **Line 1879**: `isRendering = false` after render completes
   - Triggers processing of `pendingRenderAfterCurrent`

3. **Line 9504-9506**: Check for `pendingApplySmartOrder` after smart ordering
   - Triggers recursive `applySmartOrderingSafe` via `setTimeout`

---

## Queue Push Call Sites

### `queueFilterOperation()` calls
1. **Line 8570**: `queueFilterOperation(applyImportedPrefs, 'importPreferences')`
2. **Line 8630**: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode')`

---

## Batch Processing / Chunking Logic

**No batch processing or chunking logic found.**

- Operations are processed **individually** in a `forEach` loop (line 8447)
- Each queued operation executes sequentially with try-catch error handling
- No grouping of operations into batches
- No chunking of data before processing

---

## Exported Functions (for external/testing access)

### Line 5481-5482
```javascript
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

These are exported to window for potential external invocation or testing.

---

## Key Patterns

1. **Single-value queues** (`pendingRenderData`, `pendingRenderAfterCurrent`) hold only the latest data, replacing previous queued items
2. **Array-based queue** (`pendingFilterOperations`) accumulates multiple operations
3. **Guard flags** prevent concurrent operations and race conditions
4. **Processing** occurs after guard flags are cleared, ensuring operations run at safe times
5. **Error isolation**: Each operation in `pendingFilterOperations` has individual try-catch (line 8451-8455)
