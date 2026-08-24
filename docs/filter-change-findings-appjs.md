# Filter-Change Hook Patterns in app.js

**Generated:** 2026-08-24  
**File:** `/home/coding/vista/src/public/app.js`  
**Scope:** Raw findings of filter-change hook patterns and callback registrations

---

## Summary

This report documents all filter-change hook patterns and callback registration patterns found in `app.js`. The application implements a sophisticated guard system to prevent conflicts between filter operations and smart ordering functionality.

---

## 1. Guard State Variables (Lines 6761-6763)

### Location: Lines 6761-6763

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Purpose:** These three global variables form the core guard system for filter-change operations.

---

## 2. Global API Exports (Lines 5468-5482)

### Location: Lines 5472-5482

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
```

**Purpose:** Exposes filter operation guards and queue functions to global scope for external debugging/control.

---

## 3. Centralized Guard Functions (Lines 8367-8457)

### Section Header: Line 8367

```javascript
// ── Centralized guard functions for filter operations during smart ordering ──
```

### Function: `shouldDeferFilterOperation()` (Lines 8373-8375)

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Check if filter operation should be deferred due to active smart ordering.

### Function: `isSmartOrdering()` (Lines 8415-8417)

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Primary guard function checking BOTH user preference and runtime state.

**Documentation (Lines 8378-8413):**
```javascript
/**
 * Check if smart ordering is currently active
 *
 * Centralized guard function that checks BOTH the user preference and runtime state
 * to determine if smart ordering is currently active. This is the primary guard to
 * use before any operation that might interfere with smart ordering.
 *
 * **Checks two conditions:**
 * 1. User preference: `platformPrefs.smartOrdering` (is smart ordering enabled?)
 * 2. Runtime state: `isSmartOrderingActive` (is smart ordering currently in progress?)
 *
 * **Usage in filter handlers:**
 * ```javascript
 * function myFilterHandler() {
 *   if (isSmartOrdering()) {
 *     queueFilterOperation(myFilterHandler, 'myFilterHandler');
 *     return;
 *   }
 *   // Proceed with filter operation
 * }
 * ```
 */
```

### Function: `queueFilterOperation()` (Lines 8424-8429)

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Queue a filter operation to be processed after smart ordering completes.

### Function: `processPendingFilterOperations()` (Lines 8434-8457)

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

**Purpose:** Process pending filter operations after smart ordering completes.

---

## 4. Filter Operation Usage Patterns

### Pattern A: Smart Ordering Check with Queue (Lines 8558-8574)

**Context:** `importPreferences` function

```javascript
// Check if smart ordering is active - defer operation if so
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

**Locations using this pattern:**
- Lines 8558-8574: `importPreferences`
- Lines 8623-8634: `toggleWhatIfMode`

### Pattern B: Direct Filter Operation with Guard Flag (Lines 8577-8581)

**Context:** `importPreferences` function (non-queued path)

```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Locations using this pattern:**
- Lines 8577-8581: `importPreferences`
- Lines 8637-8641: `toggleWhatIfMode`
- Lines 8745-8747: `applyWhatIfChanges` (What If tag application)

### Pattern C: Card Order Clearing Guard (Lines 9272-9280)

**Context:** `applySmartOrdering` function

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
} else {
  // Clear cardOrder for groups that weren't manually modified by user
  // ... cardOrder clearing logic ...
}
```

**Purpose:** Prevents smart order resets during filter operations.

---

## 5. Event Listener Callback Registrations

### Metadata Filter Input Listener (Lines 4417-4422)

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context:** `renderMetadataTable()` function - re-renders metadata table on filter input.

### Command Palette Filter Listener (Line 9567)

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Context:** Command palette initialization - filters command list on input.

### Command Filter Function (Lines 9659-9674)

```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

**Purpose:** Filters command palette options based on query.

---

## 6. Related State Variables (Lines 6755-6768)

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

**Purpose:** Comprehensive guard and queue system for coordinating renders and filter operations.

---

## 7. Filter-Related Data Processing Patterns

### Array Filter Operations (Various Locations)

The codebase uses JavaScript's `Array.filter()` method extensively for data filtering:

**Lines 553, 712, 1387-1388:** General data filtering
```javascript
const tags = state.without.split(',').filter(t => t);
const urls = trimmed.split(/[\r\n]+/).map(u => u.trim()).filter(u => u);
const errCount = (data.diagnostics || []).filter(d => d.severity === 'error').length;
const warnCount = (data.diagnostics || []).filter(d => d.severity === 'warning').length;
```

**Lines 1718-1720, 2037-2038:** Platform ordering
```javascript
const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
```

**Lines 4370-4375:** Metadata table filtering
```javascript
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```

---

## 8. Key Observations

1. **Guard Pattern Consistency:** All filter operations that might conflict with smart ordering follow the same pattern:
   - Check `isSmartOrdering()`
   - If true, queue the operation via `queueFilterOperation()`
   - If false, proceed with `isFilterOperation = true` guard flag

2. **setTimeout Flag Reset:** The `isFilterOperation` flag is always reset using `setTimeout(() => { isFilterOperation = false; }, 0)` to ensure it clears after the render completes.

3. **Dual-Strategy Card Order Protection:** The card order clearing logic checks BOTH `isFilterOperation` and `isSmartOrdering()` before clearing state.

4. **External API Access:** Filter operation guards are exposed to `window` object, allowing external debugging and manual control.

5. **Operation Queue Pattern:** Deferred operations are stored with both the function and a description string for debugging.

---

## Conclusion

The filter-change hook patterns in `app.js` implement a sophisticated coordination system between filter operations and smart ordering functionality. The core patterns are:

1. **Guard flags** (`isFilterOperation`, `isSmartOrderingActive`)
2. **Operation queue** (`pendingFilterOperations`)
3. **Centralized guard functions** (`isSmartOrdering()`, `queueFilterOperation()`, `processPendingFilterOperations()`)
4. **Consistent usage patterns** across all filter-related operations

These patterns prevent race conditions and state conflicts when users perform filtering operations while smart ordering is active.
