# Queue Processing Loop Documentation

**Generated:** 2026-08-24  
**Source:** `/home/coding/vista/src/public/app.js`  
**Total Lines:** 10,507

This document provides precise line numbers, queue targets, and loop types for all queue processing loops found in the vista codebase.

---

## Summary of Queue Processing Loops

| # | Queue Variable | Loop Type | Lines | Function | Description |
|---|---------------|-----------|-------|----------|-------------|
| 1 | `pendingFilterOperations` | forEach | 8447-8456 | `processPendingFilterOperations()` | Array queue for filter operations during smart ordering |
| 2 | `pendingRenderData` | if-check | 9519-9526 | `applySmartOrderingSafe()` | Single-value queue for renders during smart ordering |
| 3 | `pendingRenderAfterCurrent` | if-check | 1882-1890 | `renderPreviews()` | Single-value queue for renders during active render |
| 4 | `pendingWhatIfTags` | forEach | 8781-8787 | `applyWhatIfChanges()` | Array queue for What If tags |

---

## Detailed Loop Documentation

### 1. pendingFilterOperations Queue

**Queue Variable:** `pendingFilterOperations`  
**Variable Type:** Array  
**Declared Line:** 6763  
**Loop Type:** `forEach`  
**Processing Lines:** 8447-8456  
**Function:** `processPendingFilterOperations()` (lines 8434-8457)

```javascript
// Line 8434: Function definition
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

  // Line 8447: forEach loop starts
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
  // Line 8456: forEach loop ends
}
// Line 8457: Function ends
```

**Queue Target:** Each item contains `{ operation: Function, description: string }`  
**Purpose:** Processes filter operations that were queued while smart ordering was active  
**Concurrency Protection:** Uses array slice copy to avoid modification during iteration  

---

### 2. pendingRenderData Queue

**Queue Variable:** `pendingRenderData`  
**Variable Type:** Single value (null or object)  
**Declared Line:** 6757  
**Loop Type:** `if` check (not a traditional loop - single-item queue)  
**Processing Lines:** 9519-9526  
**Function:** `applySmartOrderingSafe()` (lines 9470-9528)

```javascript
function applySmartOrderingSafe() {
  // ... smart ordering logic ...
  
  // Line 9519: Queue processing starts
  if (pendingRenderData) {
    if (DEBUG_SMART_ORDERING) {
      console.log('[applySmartOrderingSafe] Processing queued render with updated cardOrder (flag now false)');
    }
    const dataToRender = pendingRenderData;
    pendingRenderData = null; // Clear before rendering to prevent re-queue
    renderPreviews(dataToRender);
  }
  // Line 9526: Queue processing ends
}
```

**Queue Target:** Object containing render data  
**Purpose:** Processes the most recent renderPreviews call that occurred during smart ordering  
**Concurrency Protection:** Flag-based guard (`isApplyingSmartOrder`)  
**Critical Detail:** Processing happens AFTER `finally` block when `isApplyingSmartOrder` flag is cleared  

---

### 3. pendingRenderAfterCurrent Queue

**Queue Variable:** `pendingRenderAfterCurrent`  
**Variable Type:** Single value (null or object)  
**Declared Line:** 6759  
**Loop Type:** `if` check (not a traditional loop - single-item queue)  
**Processing Lines:** 1882-1890  
**Function:** `renderPreviews()` (lines 1750-1891)

```javascript
function renderPreviews(data) {
  // ... rendering logic ...
  
  previewGrid.innerHTML = '';
  // ... card rendering ...
  
  // Line 1879: Clear rendering guard
  isRendering = false;

  // Line 1882: Process queued render
  if (pendingRenderAfterCurrent) {
    if (DEBUG_SMART_ORDERING) {
      console.log('[renderPreviews] Processing queued render after completion');
    }
    const dataToRender = pendingRenderAfterCurrent;
    pendingRenderAfterCurrent = null;
    // Use setTimeout to avoid recursive call stack
    setTimeout(() => renderPreviews(dataToRender), 0);
  }
  // Line 1890: Processing ends
}
```

**Queue Target:** Object containing render data  
**Purpose:** Processes renderPreviews calls that occur while another render is already in progress  
**Concurrency Protection:** Guard flag `isRendering`  
**Critical Detail:** Uses `setTimeout` to avoid recursive call stack depth  

---

### 4. pendingWhatIfTags Queue

**Queue Variable:** `pendingWhatIfTags`  
**Variable Type:** Array or null  
**Declared Line:** 35  
**Loop Type:** `forEach`  
**Processing Lines:** 8781-8787  
**Function:** `applyWhatIfChanges()` (lines 8765-8794)

```javascript
function applyWhatIfChanges() {
  // ... What If logic ...
  
  // Line 8781: forEach loop starts
  pendingWhatIfTags.forEach(tag => {
    disabledTags.add(tag);
    const cb = document.querySelector(`#whatIfPanel .what-if-toggle input[data-tag="${tag}"]`);
    if (cb) {
      cb.checked = false;
    }
  });
  // Line 8787: forEach loop ends

  // Auto-apply the changes
  applyWhatIfChanges();
  
  // Clear pending tags
  pendingWhatIfTags = null;
}
```

**Queue Target:** Array of tag names (strings)  
**Purpose:** Disables and unchecks What If tags that were specified via URL hash before data loaded  
**Concurrency Protection:** None (single-threaded UI operation)  

---

## Queue Variable Declarations

| Variable | Line | Type | Initial Value | Purpose |
|----------|------|------|---------------|---------|
| `pendingWhatIfTags` | 35 | Array/null | `null` | Store What If tags from hash before data loads |
| `pendingApplySmartOrder` | 6756 | Boolean | `false` | Prevent concurrent smart ordering operations |
| `pendingRenderData` | 6757 | Object/null | `null` | Queue renderPreviews calls during smart ordering |
| `pendingRenderAfterCurrent` | 6759 | Object/null | `null` | Queue renders during active render |
| `pendingFilterOperations` | 6763 | Array | `[]` | Queue filter operations during smart ordering |

---

## Loop Type Distribution

- **forEach loops:** 2 (pendingFilterOperations, pendingWhatIfTags)
- **if-check queues:** 2 (pendingRenderData, pendingRenderAfterCurrent)
- **for loops:** 0 (no traditional for loops processing queues)
- **while loops:** 0 (no while loops processing queues)

---

## Related Functions

| Function | Line | Purpose |
|----------|------|---------|
| `queueFilterOperation()` | 8424 | Adds operations to pendingFilterOperations queue |
| `processPendingFilterOperations()` | 8434 | Processes all queued filter operations |
| `renderPreviews()` | 1750 | Main render function with queue protection |
| `applySmartOrderingSafe()` | 9470 | Thread-safe smart ordering with queue processing |
| `applyWhatIfChanges()` | 8765 | Applies What If mode changes |

---

## Guard Flags for Concurrency Protection

| Flag | Line | Purpose |
|------|------|---------|
| `isApplyingSmartOrder` | 6755 | Prevents concurrent smart ordering operations |
| `isRendering` | 6758 | Prevents concurrent render operations |
| `isFilterOperation` | 6761 | Prevents smart order resets during filter changes |
| `isSmartOrderingActive` | 6762 | Tracks when smart ordering is currently active |

---

## Key Design Patterns

### Pattern 1: Array Queue with forEach
- **Used by:** `pendingFilterOperations`, `pendingWhatIfTags`
- **Advantages:** Clean iteration, built-in error handling with try-catch
- **Concurrency Protection:** Array.slice() copy before iteration

### Pattern 2: Single-Item Queue with if-check
- **Used by:** `pendingRenderData`, `pendingRenderAfterCurrent`
- **Advantages:** Simple, only cares about most recent operation
- **Concurrency Protection:** Guard flags prevent races

### Pattern 3: Last-Write-Wins Semantics
- **Applied to:** `pendingRenderData`, `pendingRenderAfterCurrent`
- **Behavior:** New assignment overwrites previous queued value
- **Rationale:** Only the latest render data matters for UI consistency

---

## Debug Logging

All queue operations include debug logging controlled by `DEBUG_SMART_ORDERING` flag:

- Queue add operations: `"Smart ordering in progress - queueing..."`
- Queue processing: `"Processing queued..."`  
- Queue execution: `"Executing: {description}"`

---

## Testing References

Related test files for queue processing:
- `test-queued-render-smartordering.js`
- `verify-race-condition-fix-bf-3l1r2.js`
- `test-race-condition-fix-simple.js`
- `test-renderpreviews-cardorder.js`

---

## Changes History

- **2026-08-24:** Initial documentation created based on loop discovery analysis
