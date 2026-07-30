# Queue Push Operations in app.js

## Task: Map all queue push operations in app.js (bf-69cnu)

---

## Summary

After a comprehensive search of `/home/coding/vista/src/public/app.js`, **one primary filter queue mechanism** was identified that uses array push operations.

---

## Primary Filter Queue: `pendingFilterOperations`

### Queue Declaration
**Line 6281:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Push Operation
**Line 7946** - Inside `queueFilterOperation()` function:
```javascript
pendingFilterOperations.push({ operation, description });
```

**Source of data being pushed:**
- `operation`: A function callback to be executed later
- `description`: A string describing the operation for debugging

### Where Items Are Added to the Queue

#### 1. Line 8088 - Import Preferences Operation
```javascript
queueFilterOperation(applyImportedPrefs, 'importPreferences');
```
- **Context**: Inside `importPreferences()` function
- **Source**: User imports preferences via file or clipboard
- **Condition**: Queued only when `isSmartOrdering()` returns true
- **Operation**: `applyImportedPrefs` - function that calls `renderPreviews()` with imported data and clears smart ordering flag

#### 2. Line 8148 - Toggle What-If Mode Operation
```javascript
queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
```
- **Context**: Inside `toggleWhatIfMode()` function
- **Source**: User toggles what-if mode (shows/hides specific tags)
- **Condition**: Queued only when `isSmartOrdering()` returns true
- **Operation**: `applyWhatIfReset` - function that calls `renderPreviews()` with current data

---

## Queue Processing

### Processing Function: `processPendingFilterOperations()`
**Line 7952-7975:**

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

**Processing behavior:**
- Copies queue to avoid modification during iteration
- Clears original queue (`pendingFilterOperations = []`)
- Executes each operation with try-catch error handling
- Logs each operation execution when `DEBUG_SMART_ORDERING` is enabled

---

## Other Queue-Related Mechanisms (Non-Push)

### 1. `pendingRenderData` - Single-Slot Render Queue
**Line 6275:**
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Set at line 1602:**
```javascript
pendingRenderData = data;
```

**Purpose:** Stores the latest data to render after smart ordering completes (overwrites previous value, not a push-based queue)

### 2. `pendingRenderAfterCurrent` - Single-Slot Render Queue
**Line 6277:**
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Set at line 1592:**
```javascript
pendingRenderAfterCurrent = data;
```

**Purpose:** Stores the latest data to render after current render completes (overwrites previous value, not a push-based queue)

---

## API Exports

**Lines 5050-5056:**
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

---

## Summary Statistics

- **Total filter queues with push operations**: 1 (`pendingFilterOperations`)
- **Total push operations**: 1 location (line 7946)
- **Total queue entry points**: 2 locations (lines 8088, 8148)
- **Additional single-slot queues**: 2 (`pendingRenderData`, `pendingRenderAfterCurrent`)

---

## Architecture Notes

The `pendingFilterOperations` queue is part of a **smart ordering guard system** that prevents race conditions during platform reordering operations:

1. **Smart ordering phase**: When smart ordering is active, filter operations are queued instead of executed immediately
2. **Queue execution**: After smart ordering completes, `processPendingFilterOperations()` is called to execute all queued operations
3. **Concurrency protection**: The queue ensures that user-triggered filter operations don't interfere with the smart ordering animation

This pattern ensures smooth UX where manual actions are deferred during automated animations, then applied in order once the animation completes.

---

**Date**: 2026-07-24
**Bead ID**: bf-69cnu
**File**: `/home/coding/vista/src/public/app.js`
