# Queue Push Operations in app.js - Complete Mapping

**Task:** bf-69cnu  
**File:** `/home/coding/vista/src/public/app.js`  
**Date:** 2026-07-24  
**Purpose:** Locate all code paths that push items onto filter queues

---

## Summary of Queue Push Operations

Found **3 queue enqueue patterns** in app.js:

1. **Array-based queue push**: `pendingFilterOperations.push()` - Line 7946
2. **Single-value queue assignment**: `pendingRenderData = data` - Line 1602  
3. **Single-value queue assignment**: `pendingRenderAfterCurrent = data` - Line 1592

---

## 1. Filter Operations Queue (Array-based)

### Queue Declaration
**Line:** 6281
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Push Operation Location
**Line:** 7946
**Function:** `queueFilterOperation(operation, description)`

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

### Queue Target
- **Queue:** `pendingFilterOperations`
- **Type:** Array (accumulates multiple items)

### Data Source
**Pushed Item Structure:**
```javascript
{
  operation: Function,    // The filter operation to execute
  description: String    // Description for debugging
}
```

### All Push Callers (Where items enter the queue)

#### Caller 1: importPreferences operation
**Line:** 8088
**Context:** Importing user preferences while smart ordering is active

```javascript
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false; // User manual override
    if (DEBUG_SMART_ORDERING) {
      console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
    }
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}
```

**Operation Being Queued:**
- Sets `isFilterOperation` guard flag
- Calls `renderPreviews(currentData)` with current data
- Clears `isFilterOperation` after render
- Clears `isSmartOrderingActive` flag (user override)

**Data Source:** `currentData` (module-level variable with current preview data)

#### Caller 2: toggleWhatIfMode operation
**Line:** 8148
**Context:** Disabling What-If mode while smart ordering is active

```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  return;
}
```

**Operation Being Queued:**
- Sets `isFilterOperation` guard flag
- Calls `renderPreviews(currentData)` with current data
- Clears `isFilterOperation` after render

**Data Source:** `currentData` (module-level variable with current preview data)

### Dequeue Operation
**Lines:** 7952-7975
**Function:** `processPendingFilterOperations()`

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  // Copy array to avoid modification during iteration
  const operations = pendingFilterOperations.slice();
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

**Note:** This function is defined but **never directly called** in the codebase - exposed for debugging/manual use only.

---

## 2. Render Queue During Smart Ordering (Single-value)

### Queue Declaration
**Line:** 6275
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

### Push Operation Location
**Line:** 1602
**Function:** `renderPreviews(data)`

```javascript
// P0 - Race condition fix: Queue render if smart ordering is in progress
if (isApplyingSmartOrder) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
  }
  // Store the latest data to render after smart ordering completes
  pendingRenderData = data;
  return; // Skip rendering during smart ordering to prevent race conditions
}
```

### Queue Target
- **Queue:** `pendingRenderData` 
- **Type:** Single-value (overwrites previous value, not array accumulation)

### Data Source
**Parameter:** `data` from `renderPreviews(data)` function call

**Data Structure:** 
- Type: Object
- Contains preview data including `meta` array with platform metadata
- Example structure: `{ meta: [...], url: "...", ... }`

### All Push Callers
Any code that calls `renderPreviews(data)` while `isApplyingSmartOrder` is true will trigger this queue operation.

**Common callers:**
- Filter change handlers
- `importPreferences()` 
- `toggleWhatIfMode()`
- `applyWhatIfChanges()`
- Any code path that calls `renderPreviews()` during smart ordering

### Dequeue Operation
**Lines:** 9037-9043
**Context:** End of `applySmartOrderingSafe()` function

```javascript
if (pendingRenderData) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrderingSafe] Processing queued render with updated cardOrder (flag now false)');
  }
  const dataToRender = pendingRenderData;
  pendingRenderData = null; // Clear before rendering to prevent re-queue
  renderPreviews(dataToRender);
}
```

**Dequeue Trigger:** After smart ordering completes (in finally block of `applySmartOrderingSafe()`)

---

## 3. Render Queue During Active Render (Single-value)

### Queue Declaration
**Line:** 6277
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

### Push Operation Location
**Line:** 1592
**Function:** `renderPreviews(data)`

```javascript
// P1 - Concurrent Render Race fix: Prevent multiple simultaneous renders
if (isRendering) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Already rendering - queueing with latest data');
  }
  // Store the latest data to render after current render completes
  pendingRenderAfterCurrent = data;
  return;
}
```

### Queue Target
- **Queue:** `pendingRenderAfterCurrent`
- **Type:** Single-value (overwrites previous value, not array accumulation)

### Data Source
**Parameter:** `data` from `renderPreviews(data)` function call

**Data Structure:** 
- Type: Object
- Contains preview data including `meta` array with platform metadata
- Same structure as `pendingRenderData`

### All Push Callers
Any code that calls `renderPreviews(data)` while `isRendering` is true will trigger this queue operation.

**Common callers:**
- Rapid successive filter changes
- Multiple quick user interactions
- Code that triggers `renderPreviews()` during an active render

### Dequeue Operation
**Lines:** 1712-1720
**Context:** End of `renderPreviews()` function

```javascript
// Process any pending render that was queued while this render was in progress
if (pendingRenderAfterCurrent) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Processing queued render after completion');
  }
  const dataToRender = pendingRenderAfterCurrent;
  pendingRenderAfterCurrent = null;
  // Use setTimeout to avoid recursive call stack
  setTimeout(() => renderPreviews(dataToRender), 0);
}
```

**Dequeue Trigger:** After current render completes (at end of `renderPreviews()`)

---

## Queue Priority System

The three queues operate in a priority hierarchy:

```
Priority 1 (Highest): pendingFilterOperations
├── Checks: isSmartOrdering() 
├── Purpose: Defer filter operations during smart ordering
└── Processed: Manually via processPendingFilterOperations()

Priority 2 (Medium): pendingRenderData  
├── Checks: isApplyingSmartOrder
├── Purpose: Defer renders during smart ordering
└── Processed: Automatically after applySmartOrderingSafe() completes

Priority 3 (Lowest): pendingRenderAfterCurrent
├── Checks: isRendering
├── Purpose: Defer renders during active render
└── Processed: Automatically after renderPreviews() completes
```

---

## Key Insights

1. **Only one true array push operation**: Line 7946 (`pendingFilterOperations.push()`)
   - This is the only operation that adds to an array without overwriting

2. **Two single-value queues**: `pendingRenderData` and `pendingRenderAfterCurrent`
   - These overwrite previous values (keep latest data only)
   - No accumulation, just "store latest" pattern

3. **Data flow pattern**:
   - All queue operations ultimately source data from `currentData` or the `data` parameter
   - Filter operations queue function wrappers that will call `renderPreviews()` later
   - Render operations queue the data object directly

4. **Guard coordination**:
   - `isSmartOrdering()` controls filter operation queuing
   - `isApplyingSmartOrder` controls smart ordering render queuing  
   - `isRendering` controls concurrent render queuing

5. **No accumulation in single-value queues**:
   - If multiple items arrive while queued, only the **latest** is kept
   - Previous queued data is overwritten by new data
   - This ensures users always see the most recent state

---

## Complete Line Number Reference

| Queue Type | Operation | Line | Function |
|------------|-----------|------|----------|
| Filter Queue | Declaration | 6281 | Module scope |
| Filter Queue | Push | 7946 | queueFilterOperation() |
| Filter Queue | Caller 1 | 8088 | importPreferences() |
| Filter Queue | Caller 2 | 8148 | toggleWhatIfMode() |
| Filter Queue | Dequeue | 7952-7975 | processPendingFilterOperations() |
| Render Queue (Smart Order) | Declaration | 6275 | Module scope |
| Render Queue (Smart Order) | Push | 1602 | renderPreviews() |
| Render Queue (Smart Order) | Dequeue | 9037-9043 | applySmartOrderingSafe() |
| Render Queue (Concurrent) | Declaration | 6277 | Module scope |
| Render Queue (Concurrent) | Push | 1592 | renderPreviews() |
| Render Queue (Concurrent) | Dequeue | 1712-1720 | renderPreviews() |

---

**Status:** COMPLETE - All queue push operations mapped and documented  
**Total Queue Enqueue Points:** 3 locations (1 array push, 2 single-value assignments)
