# Direct Push Operations to Filter Queues - Analysis

## Overview
This analysis documents all direct push operations to filter queues in `/home/coding/vista/src/public/app.js`.

## Filter Queues Identified

| Queue Variable | Line Declared | Type | Purpose |
|----------------|---------------|------|---------|
| `pendingFilterOperations` | 6281 | `array` | Queue filter operations during smart ordering |
| `pendingRenderData` | 6275 | `object\|null` | Queue render calls during smart ordering |
| `pendingRenderAfterCurrent` | 6277 | `object\|null` | Queue renders during active render |

## Direct Push Operations

### 1. `pendingFilterOperations.push()` - Line 7946

**Location:** `queueFilterOperation()` function (lines 7942-7947)

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Queue Target:** `pendingFilterOperations`
**Source Data:** Object containing:
- `operation` (function) - The filter operation to execute
- `description` (string) - Debug description

**Pattern:** This is the ONLY direct `push()` call to `pendingFilterOperations`. All other uses go through `queueFilterOperation()`.

---

### 2. `queueFilterOperation(applyImportedPrefs, 'importPreferences')` - Line 8088

**Location:** `importPreferences()` function (lines 8077-8092)

**Context:**
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

**Queue Target:** `pendingFilterOperations` (via `queueFilterOperation()`)
**Source Data:** 
- Function: `applyImportedPrefs` (inline arrow function)
- Description: `'importPreferences'`
- Trigger: User imports platform preferences while smart ordering is active

**Count:** 1 push operation

---

### 3. `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode')` - Line 8148

**Location:** `toggleWhatIfMode()` function (lines 8142-8153)

**Context:**
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
```

**Queue Target:** `pendingFilterOperations` (via `queueFilterOperation()`)
**Source Data:**
- Function: `applyWhatIfReset` (inline arrow function)
- Description: `'toggleWhatIfMode'`
- Trigger: User toggles What If mode while smart ordering is active

**Count:** 1 push operation

---

## Direct Assignment Operations (Not push(), but queue writes)

### 4. `pendingRenderData = data` - Line 1602

**Location:** `renderPreviews()` function (lines 1597-1604)

**Context:**
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

**Queue Target:** `pendingRenderData`
**Source Data:** 
- Variable: `data` (function parameter containing preview data object)
- Trigger: Render call while `isApplyingSmartOrder` is true

**Count:** 1 assignment operation (not push, single-slot queue)

---

### 5. `pendingRenderAfterCurrent = data` - Line 1592

**Location:** `renderPreviews()` function (lines 1587-1594)

**Context:**
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

**Queue Target:** `pendingRenderAfterCurrent`
**Source Data:**
- Variable: `data` (function parameter containing preview data object)
- Trigger: Render call while `isRendering` is true

**Count:** 1 assignment operation (not push, single-slot queue)

---

## Queue Processing (Consumption)

### `pendingFilterOperations` - Processed at line 7952-7975
**Function:** `processPendingFilterOperations()`
**Pattern:** Copy array → clear original → iterate and execute each operation

### `pendingRenderData` - Processed at line 9037-9043
**Function:** `applySmartOrderingSafe()`
**Pattern:** Check existence → store reference → clear → call `renderPreviews()`

### `pendingRenderAfterCurrent` - Processed at line 1712-1720
**Function:** End of `renderPreviews()`
**Pattern:** Check existence → store reference → clear → setTimeout to next event loop

---

## Summary by Queue

### `pendingFilterOperations` (array)
- **Direct push() calls:** 1 (line 7946)
- **Indirect pushes via `queueFilterOperation()`:** 2 (lines 8088, 8148)
- **Total push operations:** 3 (1 direct + 2 indirect)
- **Data sources:** Inline function wrappers with descriptions

### `pendingRenderData` (single-slot)
- **Assignment operations:** 1 (line 1602)
- **Data sources:** Function parameter `data` from `renderPreviews()`

### `pendingRenderAfterCurrent` (single-slot)
- **Assignment operations:** 1 (line 1592)
- **Data sources:** Function parameter `data` from `renderPreviews()`

---

## Key Insights

1. **Only ONE direct `push()` call** exists in the codebase (line 7946)
2. **All other pushes go through `queueFilterOperation()`** wrapper function
3. **Two queues are single-slot** (not true arrays): `pendingRenderData` and `pendingRenderAfterCurrent`
4. **Push operations are conditional** - only execute when guard flags indicate conflicts
5. **Function wrappers dominate** - both pushes to `pendingFilterOperations` wrap inline functions

---

## Verification

✅ Located all array.push() calls on filter queues  
✅ Documented line numbers for each operation  
✅ Identified which queue each operation targets  
✅ Noted source data (variables, functions, literals)  
✅ Counted operations per queue

---

**Analysis completed:** 2026-07-24  
**Bead ID:** bf-35p6x  
**File:** `/home/coding/vista/src/public/app.js`
