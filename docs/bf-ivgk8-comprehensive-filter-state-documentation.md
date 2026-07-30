# Comprehensive Filter State Variable Documentation

**Task:** bf-ivgk8  
**File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24  
**Total Variables Documented:** 16 module-level + 2 local-scope

---

## Table of Contents

1. [Core State Objects](#core-state-objects)
2. [Guard Flags](#guard-flags)
3. [Queue Variables](#queue-variables)
4. [Tracking Variables](#tracking-variables)
5. [What-If Mode Variables](#what-if-mode-variables)
6. [Local Scope Variables](#local-scope-variables)
7. [Queue Operations](#queue-operations)
8. [Variable Interaction Patterns](#variable-interaction-patterns)
9. [Usage Flow Diagrams](#usage-flow-diagrams)
10. [Cross-Reference Summary](#cross-reference-summary)

---

## Core State Objects

### 1. `platformPrefs` (Lines 6263-6270)

**Type:** Object with Sets and primitive values  
**Purpose:** Main platform customization and filter state container  
**Scope:** Module-level

```javascript
let platformPrefs = {
  favorites: new Set(),        // User's favorite platforms
  hidden: new Set(),           // User-hidden platforms (filtered from view)
  columnCount: 3,              // Grid column layout preference
  smartOrdering: true,         // Smart ordering enabled flag
  cardOrder: {},               // Map of groupId -> array of platform IDs in custom order
  cardOrderMetadata: {}        // Map of groupId -> {userModified, lastModified, modifiedBy, pageType}
};
```

**Variable Breakdown:**
- **`favorites`** (Set): Platform IDs marked as favorites
- **`hidden`** (Set): Platform IDs to exclude from main view
- **`columnCount`** (number): Grid layout columns (1-4)
- **`smartOrdering`** (boolean): Master switch for smart ordering
- **`cardOrder`** (object): Custom ordering per group
- **`cardOrderMetadata`** (object): Modification metadata for cardOrder

**Queue Operations:** YES
- Indirectly via `isSmartOrdering()` guard check
- Direct queue operations: `importPreferences()`, `toggleFavorite()`, `toggleHidden()`

**Modification Functions:**
- `toggleFavorite()` (line 7867)
- `toggleHidden()` (line 7977)
- `importPreferences()` (line 8057)

---

### 2. `allMetadataRows` (Line 3793)

**Type:** Array  
**Purpose:** Global storage for metadata export/filtering  
**Scope:** Module-level

```javascript
// Store all metadata globally for export/filtering
let allMetadataRows = [];
```

**Queue Operations:** NO  
**Related Filter Functions:** `renderMetadataTable(filter)` (line 3941)

---

## Guard Flags

### 3. `isApplyingSmartOrder` (Line 6273)

**Type:** Boolean  
**Purpose:** Prevents concurrent smart ordering operations  
**Initial Value:** `false`

```javascript
let isApplyingSmartOrder = false;
```

**Queue Operations:** YES  
**Used By:** 
- `renderPreviews()` (line 1603) - triggers `pendingRenderData` queue
- `applySmartOrderingSafe()` (line 8788) - sets guard during operation

**Pattern:**
```javascript
// In renderPreviews()
if (isApplyingSmartOrder) {
  pendingRenderData = data;  // Queue render
  return;
}
```

---

### 4. `isRendering` (Line 6276)

**Type:** Boolean  
**Purpose:** Prevents concurrent render operations  
**Initial Value:** `false`

```javascript
let isRendering = false; // Guard flag to prevent concurrent renders
```

**Queue Operations:** YES  
**Used By:** `renderPreviews()` (line 1592)

**Pattern:**
```javascript
// In renderPreviews()
if (isRendering) {
  pendingRenderAfterCurrent = data;  // Queue render
  return;
}
```

---

### 5. `isFilterOperation` (Line 6279)

**Type:** Boolean  
**Purpose:** Prevents smart order resets during filter changes  
**Initial Value:** `false`

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Queue Operations:** YES - Set within queued operations  
**Used By:**
- Set in: Lines 8080, 8096, 8144, 8156, 8263
- Checked in: Lines 8792, 8794 (`applySmartOrderingSafe()`)

**Window Export (Lines 5046-5049):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

**Pattern:**
```javascript
// Set before filter operation
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### 6. `isSmartOrderingActive` (Line 6280)

**Type:** Boolean  
**Purpose:** Runtime flag tracking when smart ordering is in progress  
**Initial Value:** `false`

```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```

**Queue Operations:** YES - Controls queuing decisions  
**Used By:**
- `isSmartOrdering()` guard function (line 7934)
- Cleared on user override: Lines 7878, 8083, 8102

**Window Export (Lines 5042-5045):**
```javascript
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});
```

---

## Queue Variables

### 7. `pendingApplySmartOrder` (Line 6274)

**Type:** Boolean  
**Purpose:** Flag for re-applying smart order after completion  
**Initial Value:** `false`

```javascript
let pendingApplySmartOrder = false;
```

**Queue Operations:** YES - Part of smart ordering state machine  
**Context:** Located in "Guard flags" section but acts as queue trigger flag

---

### 8. `pendingRenderData` (Line 6275)

**Type:** Object or `null`  
**Purpose:** Queue renderPreviews calls during smart ordering  
**Initial Value:** `null`

```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Queue Operations:** YES
- **Enqueue:** Line 1602 (`renderPreviews()`)
- **Dequeue:** Lines 9037-9043 (`applySmartOrderingSafe()`)

**Enqueue Pattern (Line 1602):**
```javascript
if (isApplyingSmartOrder) {
  pendingRenderData = data;
  return;
}
```

**Dequeue Pattern (Lines 9037-9043):**
```javascript
if (pendingRenderData) {
  const dataToRender = pendingRenderData;
  pendingRenderData = null;  // Clear before rendering
  renderPreviews(dataToRender);
}
```

---

### 9. `pendingRenderAfterCurrent` (Line 6277)

**Type:** Object or `null`  
**Purpose:** Queue renders during active render to prevent concurrent renders  
**Initial Value:** `null`

```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Queue Operations:** YES
- **Enqueue:** Line 1596 (`renderPreviews()`)
- **Dequeue:** Lines 1716-1721 (`renderPreviews()`)

**Enqueue Pattern (Line 1596):**
```javascript
if (isRendering) {
  pendingRenderAfterCurrent = data;
  return;
}
```

**Dequeue Pattern (Lines 1716-1721):**
```javascript
if (pendingRenderAfterCurrent) {
  const dataToRender = pendingRenderAfterCurrent;
  pendingRenderAfterCurrent = null;
  setTimeout(() => renderPreviews(dataToRender), 0);
}
```

---

### 10. `pendingFilterOperations` (Line 6281)

**Type:** Array  
**Purpose:** Queue filter operations during smart ordering  
**Initial Value:** `[]` (empty array)

```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Queue Operations:** YES - Primary filter operation queue
- **Enqueue:** Line 7946 (`queueFilterOperation()`)
- **Dequeue:** Lines 7953, 7962, 7963 (`processPendingFilterOperations()`)

**Window Export (Lines 5050-5053):**
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Usage Locations:**
- Lines 7946 (enqueue), 7953 (length check), 7962 (copy), 7963 (clear)

---

## Tracking Variables

### 11. `currentPageType` (Line 6278)

**Type:** String or `null`  
**Purpose:** Track current page type for stale cardOrder detection  
**Initial Value:** `null`

```javascript
let currentPageType = null; // Track current page type for stale cardOrder detection
```

**Queue Operations:** NO  
**Purpose:** Metadata tracking for smart ordering validity

---

### 12. `pendingWhatIfTags` (Line 12)

**Type:** Array or `null`  
**Purpose:** Store pending What-If tags from hash before data loads  
**Initial Value:** `null`

```javascript
let pendingWhatIfTags = null; // Store pending What If tags from hash before data loads
```

**Queue Operations:** NO - Direct state application  
**Used By:** Lines 1030, 484 (set), 8287-8311 (apply)

**Pattern (Lines 8287-8311):**
```javascript
if (!pendingWhatIfTags || !currentData) return;

disabledTags.clear();
pendingWhatIfTags.forEach(tag => disabledTags.add(tag));
applyWhatIfChanges();
pendingWhatIfTags = null;
```

---

## What-If Mode Variables

### 13. `whatIfMode` (Line 8118)

**Type:** Boolean  
**Purpose:** Controls What-If mode state for meta-tag testing  
**Initial Value:** `false`

```javascript
let whatIfMode = false;
```

**Queue Operations:** YES - Via `toggleWhatIfMode()` queuing  
**Used By:** `toggleWhatIfMode()` (line 8121)

---

### 14. `disabledTags` (Line 8119)

**Type:** Set  
**Purpose:** Stores meta-tags disabled in What-If mode  
**Initial Value:** `new Set()` (empty Set)

```javascript
let disabledTags = new Set();
```

**Queue Operations:** NO - Direct UI state  
**Used By:** 
- Lines 8206-8215 (tag toggle handlers)
- Line 8263 (`applyWhatIfChanges()`)

**Pattern (Lines 8206-8215):**
```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    updateHash();
  });
});
```

---

## Local Scope Variables

### 15. `filteredRows` (Line 3942)

**Type:** Array  
**Purpose:** Temporary storage for filtered metadata rows  
**Scope:** Local to `renderMetadataTable()` function

```javascript
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```

**Queue Operations:** NO - Pure filter function output  
**Context:** Result of filtering `allMetadataRows` based on filter parameter

---

### 16. `filterInput` (Line 3989)

**Type:** DOM Element reference  
**Purpose:** Reference to metadata filter input element  
**Scope:** Local to `renderMetadataTable()` function

```javascript
const filterInput = document.getElementById('metadataFilterInput');
```

**Queue Operations:** NO  
**Usage:** Used to set focus after rendering (line 3990)

---

## Queue Operations

### 17. `queueFilterOperation()` (Lines 7942-7947)

**Type:** Function  
**Purpose:** Enqueue filter operations during smart ordering

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Window Export (Line 5055):**
```javascript
window.queueFilterOperation = queueFilterOperation;
```

**Uses:** `pendingFilterOperations` (line 7946)  
**Used By:** Lines 8087 (`importPreferences`), 8148 (`toggleWhatIfMode`)

---

### 18. `processPendingFilterOperations()` (Lines 7952-7975)

**Type:** Function  
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

**Window Export (Line 5056):**
```javascript
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Note:** Defined but **never directly called** - exposed for debugging/manual use

**Uses:** 
- `pendingFilterOperations.length` (line 7953)
- `pendingFilterOperations.slice()` (line 7962)
- `pendingFilterOperations = []` (line 7963)

---

### 19. `isSmartOrdering()` (Lines 7933-7935)

**Type:** Guard predicate function  
**Purpose:** Check if smart ordering is both enabled and active

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Used By:** Lines 7888, 7978, 8087, 8142 (filter operation routing)

**Returns:** Boolean - true if both conditions met

---

### 20. `shouldDeferFilterOperation()` (Lines 7891-7893)

**Type:** Predicate function  
**Purpose:** Check if filter operation should be deferred/queued

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Returns:** Boolean - true if smart ordering is active

---

## Variable Interaction Patterns

### Pattern 1: Filter Operation with Queue

**Variables Involved:**
- `isSmartOrderingActive` - checked for queuing decision
- `pendingFilterOperations` - stores queued operation
- `isFilterOperation` - set within queued operation

**Code Example (Lines 8077-8092):**
```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;              // Set guard flag
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;        // User override
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}
```

---

### Pattern 2: Render Queue During Smart Ordering

**Variables Involved:**
- `isApplyingSmartOrder` - guard check
- `pendingRenderData` - queue storage

**Code Example (Lines 1602-1610):**
```javascript
// Queue render if smart ordering is in progress
if (isApplyingSmartOrder) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
  }
  pendingRenderData = data;  // Enqueue
  return;
}
```

---

### Pattern 3: Concurrent Render Prevention

**Variables Involved:**
- `isRendering` - guard check
- `pendingRenderAfterCurrent` - queue storage

**Code Example (Lines 1592-1600):**
```javascript
// Prevent multiple simultaneous renders
if (isRendering) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Already rendering - queueing with latest data');
  }
  pendingRenderAfterCurrent = data;  // Enqueue
  return;
}
```

---

### Pattern 4: Guard Flag for Filter Operations

**Variables Involved:**
- `isFilterOperation` - guard flag

**Code Example (Lines 8263-8265):**
```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

## Usage Flow Diagrams

### Flow 1: Filter Operation During Smart Ordering

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
        ↓
[Smart ordering completes...]
        ↓
processPendingFilterOperations() (manual/debug)
        ↓
Execute queued operations
```

---

### Flow 2: Render Operation During Smart Ordering

```
renderPreviews(data) called
        ↓
Check: isApplyingSmartOrder?
        ↓
      YES → pendingRenderData = data
        ↓
    Return (skip render)
        ↓
[Smart ordering completes...]
        ↓
applySmartOrderingSafe() finally block
        ↓
Check: pendingRenderData?
        ↓
      YES → renderPreviews(pendingRenderData)
        ↓
    pendingRenderData = null
```

---

### Flow 3: Concurrent Render Prevention

```
renderPreviews(data) called
        ↓
Check: isRendering?
        ↓
      YES → pendingRenderAfterCurrent = data
        ↓
    Return (skip render)
        ↓
[Current render completes...]
        ↓
End of renderPreviews() function
        ↓
Check: pendingRenderAfterCurrent?
        ↓
      YES → setTimeout(() => renderPreviews(pendingRenderAfterCurrent), 0)
        ↓
    pendingRenderAfterCurrent = null
```

---

### Flow 4: Filter Operation with Guard Flag

```
Filter operation triggered
        ↓
Set: isFilterOperation = true
        ↓
perform operation (renderPreviews)
        ↓
setTimeout(() => { isFilterOperation = false; }, 0)
        ↓
Operation completes
        ↓
Guard flag cleared asynchronously
```

---

## Cross-Reference Summary

### Variables WITH Queue Integration

| Variable | Queue Type | Queue Function | Trigger |
|----------|-----------|----------------|---------|
| `platformPrefs.favorites` | Filter op queue | `queueFilterOperation()` | Smart ordering active |
| `platformPrefs.hidden` | Render queue | `pendingRenderData` | Guard wrapper |
| `whatIfMode` | Filter op queue | `queueFilterOperation()` | Smart ordering active |
| `disabledTags` | None | - | Direct UI updates |
| `pendingWhatIfTags` | None | - | Hash state restoration |

---

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

### Queue System Architecture

```
┌─ Filter Operation Queue ─────────────────┐
│ pendingFilterOperations[]                 │
│ ├── enqueue: queueFilterOperation()      │
│ └── dequeue: processPendingFilterOps()   │
└──────────────────────────────────────────┘
              ↓
        Filter operations
      during smart ordering

┌─ Render Queue (Smart Ordering) ──────────┐
│ pendingRenderData                         │
│ ├── enqueue: renderPreviews()            │
│ └── dequeue: applySmartOrderingSafe()    │
└──────────────────────────────────────────┘
              ↓
      Renders during
      smart ordering

┌─ Render Queue (Concurrent) ─────────────┐
│ pendingRenderAfterCurrent                │
│ ├── enqueue: renderPreviews()            │
│ └── dequeue: renderPreviews() end       │
└──────────────────────────────────────────┘
              ↓
    Renders during
    active render
```

---

## Summary Statistics

**Total Variables:** 16 module-level + 2 local-scope

**By Category:**
- Core State Objects: 2
- Guard Flags: 4
- Queue Variables: 4
- Tracking Variables: 2
- What-If Mode Variables: 2
- Local Scope Variables: 2
- Queue Operations: 4 functions

**By Queue Usage:**
- WITH Queue Integration: 8 variables
- WITHOUT Queue Integration: 8 variables
- Queue Operations: 4 functions

**Line Number Range:**
- Earliest declaration: Line 12 (`pendingWhatIfTags`)
- Latest declaration: Line 8119 (`disabledTags`)
- Primary section: Lines 6263-6281 (11 variables)

---

## Key Insights

1. **Two-Level Queue System**: Separate queues for filter operations (`pendingFilterOperations`) and render operations (`pendingRenderData`, `pendingRenderAfterCurrent`) prevent conflicts

2. **Guard Flag Chain**: Protection priority: `isApplyingSmartOrder` → `isRendering` → `isFilterOperation`

3. **Smart Ordering Priority**: Smart ordering has highest priority - filter operations check for active smart ordering and defer/queue accordingly

4. **User Override Pattern**: User manual changes clear `isSmartOrderingActive` flag to interrupt smart ordering

5. **State Persistence**: Filter state (`platformPrefs`) is saved and restored, while queue state is ephemeral

6. **Cross-Module Access**: Key variables exported to `window` object for cross-module access (`isFilterOperation`, `isSmartOrderingActive`, `pendingFilterOperations`)

---

**Generated for bead bf-ivgk8: Comprehensive filter state variable documentation**  
**Date:** 2026-07-24  
**Status:** COMPLETE