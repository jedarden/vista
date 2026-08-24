# Queue Processing Triggers and Conditions - Vista MTA My Way

**Analysis Date:** 2026-08-24  
**File:** `/home/coding/vista/src/public/app.js`  
**Purpose:** Document all queue processing triggers, conditions, and dependencies

---

## Overview

Vista implements a sophisticated queue processing system to handle concurrent operations and prevent race conditions, particularly around:
- Smart ordering (automatic platform card reordering)
- Rendering operations
- Filter operations (hide/show platforms, favorites, what-if mode)

The system uses multiple guard flags and queue variables to serialize operations and prevent state corruption.

---

## Queue State Variables

| Variable | Line | Type | Purpose |
|----------|------|------|---------|
| `isRendering` | 6758 | boolean | Prevents concurrent renderPreviews executions |
| `isApplyingSmartOrder` | 6755 | boolean | Prevents renders during smart ordering DOM manipulation |
| `isSmartOrderingActive` | 6762 | boolean | Tracks when smart ordering is currently in progress |
| `isFilterOperation` | 6761 | boolean | Prevents smart order resets during filter changes |
| `pendingRenderData` | 6757 | object | Queues renderPreviews calls during smart ordering |
| `pendingRenderAfterCurrent` | 6759 | object | Queues renderPreviews during concurrent render attempts |
| `pendingFilterOperations` | 6763 | array | Queue filter operations during smart ordering |
| `pendingApplySmartOrder` | 6756 | boolean | Signals need for another smart ordering pass |

---

## Primary Queue Processing Triggers

### 1. **renderPreviews() - Main Rendering Queue Check**
**Line:** 1753-1891

**Triggers (Conditions that queue processing):**
- **Line 1757-1763:** `if (isRendering)` - Already rendering
  - **Action:** Stores data in `pendingRenderAfterCurrent`
  - **Type:** Immediate queue
  - **Processing:** Line 1882-1889 after current render completes
  - **Description:** Prevents concurrent renders by queuing latest data

- **Line 1767-1774:** `if (isApplyingSmartOrder)` - Smart ordering in progress
  - **Action:** Stores data in `pendingRenderData`
  - **Type:** Deferred queue
  - **Processing:** After `applySmartOrderingSafe()` completes (line 9519-9525)
  - **Description:** Prevents race conditions with DOM reordering

**Queue Processing:**
- **Line 1882-1889:** Processes `pendingRenderAfterCurrent` after render completes
  ```javascript
  if (pendingRenderAfterCurrent) {
    const dataToRender = pendingRenderAfterCurrent;
    pendingRenderAfterCurrent = null;
    setTimeout(() => renderPreviews(dataToRender), 0);
  }
  ```

### 2. **applySmartOrderingSafe() - Smart Ordering Queue System**
**Line:** 9470-9528

**Triggers (Conditions that queue processing):**
- **Line 9472-9476:** `if (isApplyingSmartOrder)` - Already applying smart ordering
  - **Action:** Sets `pendingApplySmartOrder = true`
  - **Type:** Deferred queue
  - **Processing:** Line 9504-9507 after current smart ordering completes
  - **Description:** Prevents concurrent smart ordering operations

**Queue Processing Sequence:**
1. **Line 9478-9479:** Set `isApplyingSmartOrder = true` guard flag
2. **Line 9488:** Execute `applySmartOrdering()` to compute new order
3. **Line 9491:** Set `isSmartOrderingActive = true`
4. **Line 9501:** Execute `reorderPlatformCards()` to update DOM
5. **Line 9504-9507:** Process queued smart ordering if needed
   ```javascript
   if (pendingApplySmartOrder) {
     setTimeout(applySmartOrderingSafe, 0);
   }
   ```
6. **Line 9510:** `finally` block clears `isApplyingSmartOrder = false`
7. **Line 9519-9525:** Process queued render with updated cardOrder
   ```javascript
   if (pendingRenderData) {
     const dataToRender = pendingRenderData;
     pendingRenderData = null;
     renderPreviews(dataToRender);
   }
   ```

### 3. **queueFilterOperation() - Filter Operation Queue**
**Line:** 8424-8429

**Purpose:** Queue filter operations (hide/show, favorites, what-if) during smart ordering

**Trigger Pattern:**
```javascript
if (isSmartOrdering()) {
  queueFilterOperation(operation, description);
  return;
}
```

**Where it's called:**
- **Line 8570:** During preferences import (`applyImportedPrefs`)
- **Line 8630:** During what-if mode toggle (`applyWhatIfReset`)

**Type:** Conditional queue
**Processing:** Function `processPendingFilterOperations()` (line 8434-8457) processes queue
**NOTE:** This function is defined but appears to have no automatic trigger - operations may remain queued indefinitely

---

## Guard Flag Triggers and Dependencies

### isRendering Flag
**Set:** Line 1777 (at start of renderPreviews)
**Cleared:** Line 1879 (after DOM complete)
**Dependency:** Prevents concurrent renderPreviews calls
**Queue Trigger:** Lines 1757-1763

### isApplyingSmartOrder Flag
**Set:** Line 9479 (before smart ordering operations)
**Cleared:** Line 9510 (in finally block after all operations)
**Dependency:** Blocks renderPreviews (line 1767) and prevents concurrent smart ordering (line 9472)
**Queue Triggers:**
- renderPreviews → pendingRenderData (line 1772)
- applySmartOrderingSafe → pendingApplySmartOrder (line 9474)

### isSmartOrderingActive Flag
**Set:** Line 9491 (after smart ordering applied)
**Cleared:** Manual operations (user overrides) at lines:
- 8565 (importPreferences)
- 8584 (importPreferences)
- 8665 (toggleFavorite)
**Dependency:** Checked by `isSmartOrdering()` function (line 8415)
**Queue Trigger:** Lines 8559, 8624 - queues filter operations

### isFilterOperation Flag
**Set:** Multiple locations before filter operations:
- Line 8562 (importPreferences - queued)
- Line 8578 (importPreferences - immediate)
- Line 8626 (toggleWhatIfMode - queued)
- Line 8638 (toggleWhatIfMode - immediate)
- Line 8745 (resetSmartOrdering)
**Cleared:** setTimeout(async, 0) at lines:
- 8564, 8581, 8628, 8641, 8747
**Dependency:** Prevents cardOrder clearing (line 9274) during filter changes
**Processing:** No queue - uses timeout-based guard pattern

---

## Event Handler Triggers

### 1. Preferences Import (Line 8560-8597)
**Trigger:** File input change event
**Queue Condition:** `if (isSmartOrdering())` at line 8559
**Queued Operation:** `applyImportedPrefs` wrapper (line 8561-8568)
**Processing:** Queued via `queueFilterOperation` (line 8570)
**Action:** Clears smart ordering active flag, re-renders

### 2. What-If Mode Toggle (Line 8603-8644)
**Trigger:** Button click / mode toggle
**Queue Condition:** `if (isSmartOrdering())` at line 8624
**Queued Operation:** `applyWhatIfReset` wrapper (line 8625-8629)
**Processing:** Queued via `queueFilterOperation` (line 8630)
**Action:** Resets what-if state, re-renders

### 3. Smart Ordering Apply (Line 9450-9463)
**Trigger:** `handleResult` hook after data processing
**Processing:** Calls `applySmartOrderingSafe()` (line 9456)
**Dependency:** Runs before `await originalHandleResult2(data)` (line 9463)
**Description:** Ensures cards are in correct order before rendering

---

## Direct renderPreviews Call Points (Non-Queued)

These locations call renderPreviews directly, bypassing queue checks:

| Line | Context | Trigger Type |
|------|---------|--------------|
| 155 | Data processing callback | Immediate |
| 627 | Another data callback | Immediate |
| 1228 | Initial data load | Immediate |
| 7239 | After filter modification | Immediate |
| 7266 | After data update | Immediate |
| 8468 | After toggleHidden | Immediate |
| 8563 | Inside queued importPreferences | Queued wrapper |
| 8579 | ImportPreferences immediate path | Immediate |
| 8627 | Inside queued what-if reset | Queued wrapper |
| 8639 | What-if mode immediate path | Immediate |
| 8746 | ResetSmartOrdering | Immediate |
| 9062 | After smart ordering apply | Immediate |
| 9525 | Processing queued render after smart ordering | Deferred |
| 10165 | Post-processing hook | Immediate |

---

## Queue Processing Dependencies

### Dependency Chain 1: Smart Ordering → Render
```
applySmartOrderingSafe()
  ├─ Sets isApplyingSmartOrder = true (blocks renders)
  ├─ applySmartOrdering() (computes order)
  ├─ Sets isSmartOrderingActive = true
  ├─ reorderPlatformCards() (updates DOM)
  ├─ Finally: isApplyingSmartOrder = false (unblocks renders)
  └─ Processes pendingRenderData (if any)
      └─ renderPreviews(queuedData)
```

### Dependency Chain 2: Concurrent Render Prevention
```
renderPreviews()
  ├─ Check: isRendering? → Queue to pendingRenderAfterCurrent
  ├─ Check: isApplyingSmartOrder? → Queue to pendingRenderData
  ├─ Set: isRendering = true (blocks new renders)
  ├─ Build DOM
  ├─ Clear: isRendering = false (unblocks renders)
  └─ Process: pendingRenderAfterCurrent (if any)
      └─ renderPreviews(queuedData)
```

### Dependency Chain 3: Filter Operations During Smart Ordering
```
Filter Operation (hide/show/favorites/what-if)
  ├─ Check: isSmartOrdering()?
  ├─ If true: queueFilterOperation() → pendingFilterOperations array
  └─ If false: Execute immediately with isFilterOperation guard
      ├─ Set: isFilterOperation = true
      ├─ Execute operation
      ├─ renderPreviews()
      └─ Clear: isFilterOperation = false (via setTimeout)
```

---

## Critical Design Patterns

### 1. Guard-Flag-Based Queuing
- Uses boolean flags to detect concurrent operations
- Stores latest data in queue variables
- Processes queued operations after guard flag clears
- Prevents race conditions and state corruption

### 2. Dual-Queue System
- `pendingRenderAfterCurrent`: Handles concurrent render attempts
- `pendingRenderData`: Handles renders during smart ordering
- Both queues hold only the latest data (overwrite pattern)

### 3. Filter Operation Queue (Unprocessed)
- `pendingFilterOperations` array stores multiple operations
- `processPendingFilterOperations()` function exists but has no trigger
- Operations may remain queued indefinitely (potential bug)

### 4. setTimeout-Based Pattern
- Used for `isFilterOperation` flag clearing
- Used for recursive queue processing (lines 1889, 9506)
- Prevents recursive call stack issues

---

## Potential Issues and Observations

### 1. Missing Queue Processing Trigger
**Issue:** `processPendingFilterOperations()` is defined (line 8434) and exported to window (line 5482), but there is no code that automatically calls it to process `pendingFilterOperations`.

**Impact:** Filter operations queued during smart ordering may never execute.

**Evidence:** No grep results found for calls to `processPendingFilterOperations()` other than its definition and export.

### 2. guardWrapper and guardWrapperWithRender Functions
**Issue:** Functions `guardWrapper` and `guardWrapperWithRender` are called (lines 8350, 8460) but have no visible definition in app.js.

**Impact:** These may be injected from outside or defined in a way not captured by standard search patterns.

### 3. Multiple Queue Overwrite Pattern
**Pattern:** All render queues use overwrite semantics (only store latest data)
**Rationale:** Latest data supersedes previous queued renders
**Risk:** Intermediate states are lost (intentional design)

---

## Summary of Queue Processing Triggers

| Trigger | Line | Condition | Queue Variable | Processing Location | Type |
|---------|------|-----------|-----------------|---------------------|------|
| Concurrent render | 1757 | `isRendering` | `pendingRenderAfterCurrent` | 1882-1889 | Immediate |
| Smart ordering active | 1767 | `isApplyingSmartOrder` | `pendingRenderData` | 9519-9525 | Deferred |
| Concurrent smart ordering | 9472 | `isApplyingSmartOrder` | `pendingApplySmartOrder` | 9504-9507 | Deferred |
| Filter operation | 8559 | `isSmartOrdering()` | `pendingFilterOperations` | **NO TRIGGER FOUND** | Conditional |
| Filter operation | 8624 | `isSmartOrdering()` | `pendingFilterOperations` | **NO TRIGGER FOUND** | Conditional |

---

## Key Takeaways

1. **Primary queue mechanism** revolves around smart ordering operations blocking renders
2. **Two-tier guard system:** `isApplyingSmartOrder` (DOM manipulation) and `isRendering` (render execution)
3. **Filter operations** use a separate queue that appears to lack automatic processing
4. **All queues use overwrite semantics** - only the latest operation/data is preserved
5. **setTimeout pattern** prevents recursive call stack issues while maintaining queue order
6. **State flags are cleared in specific order** to prevent race conditions
