# Comprehensive Queue Push Operations Documentation

**Task:** bf-2oqu7 - Create structured documentation of all queue push operations  
**File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24  
**Scope:** All queue push operations across Vista codebase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Queue Declarations](#queue-declarations)
3. [Direct Push Operations](#direct-push-operations)
4. [Indirect Queue Addition Methods](#indirect-queue-addition-methods)
5. [Queue Processing Operations](#queue-processing-operations)
6. [Guard Flags and State Management](#guard-flags-and-state-management)
7. [Complete Queue Operation Reference](#complete-queue-operation-reference)

---

## Executive Summary

This document provides a comprehensive analysis of all queue push operations in the Vista codebase. The research identified **3 primary queue systems** with **5 total push operations** (2 direct, 3 indirect) that coordinate filter operations, rendering, and smart ordering functionality.

### Key Statistics

- **Total Queue Arrays:** 1 (`pendingFilterOperations`)
- **Total Single-Slot Queues:** 2 (`pendingRenderData`, `pendingRenderAfterCurrent`)
- **Direct push() Operations:** 1 (line 7946)
- **Indirect Queue Additions:** 4 (via function wrappers and spread operators)
- **Queue Processing Functions:** 2 (`queueFilterOperation`, `processPendingFilterOperations`)

### Queue System Architecture

```
┌─ Filter Operation Queue ─────────────────┐
│ pendingFilterOperations[]                 │
│ ├── Type: Array                           │
│ ├── Purpose: Defer filter ops during     │
│ │            smart ordering              │
│ ├── Enqueue: queueFilterOperation()       │
│ └── Dequeue: processPendingFilterOps()   │
└──────────────────────────────────────────┘

┌─ Render Queue (Smart Ordering) ──────────┐
│ pendingRenderData                         │
│ ├── Type: Single-slot (object|null)       │
│ ├── Purpose: Queue renders during         │
│ │            smart ordering               │
│ ├── Enqueue: Direct assignment (line 1602)│
│ └── Dequeue: applySmartOrderingSafe()     │
└──────────────────────────────────────────┘

┌─ Render Queue (Concurrent) ───────────────┐
│ pendingRenderAfterCurrent                │
│ ├── Type: Single-slot (object|null)       │
│ ├── Purpose: Queue renders during        │
│ │            active render                │
│ ├── Enqueue: Direct assignment (line 1592)│
│ └── Dequeue: renderPreviews() end        │
└──────────────────────────────────────────┘
```

---

## Queue Declarations

### 1. `pendingFilterOperations` (Line 6281)

**Type:** Array  
**Purpose:** Queue filter operations during smart ordering  
**Declaration:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Queue Structure:**
- Each entry: `{ operation: Function, description: String }`
- `operation`: The filter operation to execute
- `description`: Debug description for logging

**Global Export:** Line 5050
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Related Functions:**
- `queueFilterOperation(operation, description)` (Line 7942) - Enqueue operations
- `processPendingFilterOperations()` (Line 7952) - Dequeue and execute

---

### 2. `pendingRenderData` (Line 6275)

**Type:** Single-slot queue (Object or null)  
**Purpose:** Queue renderPreviews calls during smart ordering  
**Declaration:**
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Pattern:** Stores latest render data, overwriting previous entries (single-slot queue)

**Processing:** Lines 9037-9043 in `applySmartOrderingSafe()`

---

### 3. `pendingRenderAfterCurrent` (Line 6277)

**Type:** Single-slot queue (Object or null)  
**Purpose:** Queue renders during active render  
**Declaration:**
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Pattern:** Stores latest render data, overwriting previous entries (single-slot queue)

**Processing:** Lines 1716-1721 at end of `renderPreviews()`

---

## Direct Push Operations

### 1. `pendingFilterOperations.push()` - Line 7946

**Method:** Direct array push  
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
**Data Source:** Object containing:
- `operation` (function) - The filter operation to execute
- `description` (string) - Debug description

**Characteristics:**
- This is the **ONLY** direct `push()` call to `pendingFilterOperations` in the codebase
- All other queue additions go through this wrapper function
- Provides debug logging via `DEBUG_SMART_ORDERING` flag

**Global Export:** Line 5055
```javascript
window.queueFilterOperation = queueFilterOperation;
```

---

## Indirect Queue Addition Methods

### 2. Function Wrapper: `queueFilterOperation()` - Line 8088

**Method:** Indirect push via function wrapper  
**Location:** `importPreferences()` function (lines 8077-8092)

```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;              // Line 8080 - MODIFIES isFilterOperation
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0); // Line 8082
    isSmartOrderingActive = false;        // Line 8083 - MODIFIES isSmartOrderingActive
    if (DEBUG_SMART_ORDERING) {
      console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
    }
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences'); // Line 8088
  if (DEBUG_SMART_ORDERING) {
    console.log('[importPreferences] Smart ordering active - operation queued');
  }
  return;
}
```

**Queue Target:** `pendingFilterOperations` (via `queueFilterOperation`)  
**Source Data:**
- Function: `applyImportedPrefs` (inline arrow function)
- Description: `'importPreferences'`
- Trigger: User imports platform preferences while smart ordering is active

**Guard Flags Modified:**
- `isFilterOperation` (lines 8080, 8082) - Set to true, then cleared via setTimeout
- `isSmartOrderingActive` (line 8083) - Set to false (user override)

**Count:** 1 push operation

---

### 3. Function Wrapper: `queueFilterOperation()` - Line 8148

**Method:** Indirect push via function wrapper  
**Location:** `toggleWhatIfMode()` function (lines 8142-8153)

```javascript
if (currentData) {
  // Check if smart ordering is active - defer operation if so
  if (isSmartOrdering()) {
    const applyWhatIfReset = () => {
      isFilterOperation = true;              // Line 8144 - MODIFIES isFilterOperation
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0); // Line 8146
    };
    queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode'); // Line 8148
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
    }
    return;
  }
}
```

**Queue Target:** `pendingFilterOperations` (via `queueFilterOperation`)  
**Source Data:**
- Function: `applyWhatIfReset` (inline arrow function)
- Description: `'toggleWhatIfMode'`
- Trigger: User toggles What-If mode while smart ordering is active

**Guard Flags Modified:**
- `isFilterOperation` (lines 8144, 8146) - Set to true, then cleared via setTimeout

**Count:** 1 push operation

---

### 4. Direct Assignment: `pendingRenderData = data` - Line 1602

**Method:** Direct assignment (single-slot queue)  
**Location:** `renderPreviews()` function (lines 1597-1604)

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

**Guard Flags:**
- `isApplyingSmartOrder` (line 1603) - Checked to determine queuing

**Count:** 1 assignment operation (single-slot queue)

**Processing:** Lines 9037-9043 in `applySmartOrderingSafe()`
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

---

### 5. Direct Assignment: `pendingRenderAfterCurrent = data` - Line 1592

**Method:** Direct assignment (single-slot queue)  
**Location:** `renderPreviews()` function (lines 1587-1594)

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

**Guard Flags:**
- `isRendering` (line 1592) - Checked to determine queuing

**Count:** 1 assignment operation (single-slot queue)

**Processing:** Lines 1716-1721 at end of `renderPreviews()`
```javascript
if (pendingRenderAfterCurrent) {
  const dataToRender = pendingRenderAfterCurrent;
  pendingRenderAfterCurrent = null;
  setTimeout(() => renderPreviews(dataToRender), 0);
}
```

---

## Queue Processing Operations

### `processPendingFilterOperations()` - Lines 7952-7975

**Purpose:** Dequeue and execute queued filter operations

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

**Processing Pattern:**
1. Check if queue is empty (return if true)
2. Create copy of operations array to safely iterate
3. Clear `pendingFilterOperations` array
4. Execute each operation with error handling

**Global Export:** Line 5056
```javascript
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Note:** This function is **defined but never directly called** in the codebase. It appears to be exposed for debugging/manual use.

---

### Render Queue Processing

**`pendingRenderData` Processing - Lines 9037-9043**
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

**`pendingRenderAfterCurrent` Processing - Lines 1716-1721**
```javascript
if (pendingRenderAfterCurrent) {
  const dataToRender = pendingRenderAfterCurrent;
  pendingRenderAfterCurrent = null;
  setTimeout(() => renderPreviews(dataToRender), 0);
}
```

---

## Guard Flags and State Management

### Guard Flags Used in Queue Operations

| Guard Flag | Line Declared | Purpose | Queue Interaction |
|------------|---------------|---------|-------------------|
| `isApplyingSmartOrder` | 6273 | Prevents concurrent smart ordering | Controls `pendingRenderData` queuing (line 1603) |
| `isRendering` | 6276 | Prevents concurrent renders | Controls `pendingRenderAfterCurrent` queuing (line 1592) |
| `isFilterOperation` | 6279 | Prevents smart order resets during filter changes | Set/cleared by queued operations (lines 8080, 8082, 8144, 8146) |
| `isSmartOrderingActive` | 6280 | Tracks when smart ordering is in progress | Controls queue routing (lines 8077, 8142) |

### Guard Flag Hierarchy

```
Priority 1: isApplyingSmartOrder
├── Prevents: renderPreviews execution
├── Triggers: pendingRenderData queuing
└── Checked by: renderPreviews() line 1603

Priority 2: isRendering
├── Prevents: concurrent renderPreviews calls
├── Triggers: pendingRenderAfterCurrent queuing
└── Checked by: renderPreviews() line 1592

Priority 3: isFilterOperation
├── Prevents: smart order resets
├── Allows: renderPreviews during filter changes
└── Checked by: applySmartOrderingSafe() line 8792
```

---

## Complete Queue Operation Reference

### Summary Table

| Queue Operation | Line | Target Queue | Data Source | Push Method | Count |
|----------------|------|--------------|-------------|--------------|-------|
| `pendingFilterOperations.push()` | 7946 | `pendingFilterOperations` | `{ operation, description }` | Direct push() | 1 |
| `queueFilterOperation(applyImportedPrefs)` | 8088 | `pendingFilterOperations` | Inline function wrapper | Indirect function wrapper | 1 |
| `queueFilterOperation(applyWhatIfReset)` | 8148 | `pendingFilterOperations` | Inline function wrapper | Indirect function wrapper | 1 |
| `pendingRenderData = data` | 1602 | `pendingRenderData` | Function parameter `data` | Direct assignment | 1 |
| `pendingRenderAfterCurrent = data` | 1592 | `pendingRenderAfterCurrent` | Function parameter `data` | Direct assignment | 1 |

### Queue Usage Patterns

**Pattern 1: Filter Operation During Smart Ordering**
```
User Action (e.g., importPreferences)
        ↓
Check: isSmartOrdering()?
        ↓
      YES → Create operation wrapper with isFilterOperation guard
        ↓  
      queueFilterOperation(wrapper, 'description')
        ↓
      pendingFilterOperations.push({operation, description})
        ↓
    Return (defer execution)
```

**Pattern 2: Render Operation During Smart Ordering**
```
renderPreviews(data) called
        ↓
Check: isApplyingSmartOrder?
        ↓
      YES → pendingRenderData = data
        ↓
    Return (skip render)
```

**Pattern 3: Concurrent Render Prevention**
```
renderPreviews(data) called
        ↓
Check: isRendering?
        ↓
      YES → pendingRenderAfterCurrent = data
        ↓
    Return (skip render)
```

---

## Key Insights

1. **Two-Level Queue System**: Separate queues for filter operations (`pendingFilterOperations`) and render operations (`pendingRenderData`, `pendingRenderAfterCurrent`) prevent conflicts

2. **Only One Direct push()**: Despite multiple queue additions, only ONE direct `push()` call exists (line 7946); all others go through function wrappers

3. **Guard Flag Chain**: Protection priority: `isApplyingSmartOrder` → `isRendering` → `isFilterOperation`

4. **Smart Ordering Priority**: Smart ordering has highest priority - filter operations check for active smart ordering and defer/queue accordingly

5. **User Override Pattern**: User manual changes clear `isSmartOrderingActive` flag to interrupt smart ordering

6. **Single-Slot Queues**: Render queues are single-slot (not arrays) - latest data overwrites previous entries

7. **State Persistence**: Filter state (`platformPrefs`) is saved and restored, while queue state is ephemeral

8. **Cross-Module Access**: Key variables exported to `window` object for cross-module access (`isFilterOperation`, `isSmartOrderingActive`, `pendingFilterOperations`)

---

## Related Documentation

- **bf-2fsji:** Filter queue array declarations
- **bf-2zl6e:** Filter queue declarations in app.js  
- **bf-35p6x:** Direct push operations to filter queues
- **bf-xfsvq:** Indirect queue addition methods
- **bf-6aylr:** Queue operations associated with filter state variables
- **bf-ivgk8:** Comprehensive filter state variable documentation

---

## Verification Checklist

✅ **Compiled findings from all previous children**  
✅ **Listed all queue push operations with line numbers**  
✅ **Identified target queue names for each operation**  
✅ **Documented data sources for each push operation**  
✅ **Distinguished push methods (direct/indirect)**  
✅ **Ensured all original bead acceptance criteria are met**  
✅ **Formatted output as clear, structured documentation**

---

**Documentation completed:** 2026-07-24  
**Bead ID:** bf-2oqu7  
**File:** `/home/coding/vista/src/public/app.js`  
**Status:** COMPLETE
