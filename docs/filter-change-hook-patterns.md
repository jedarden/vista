# Filter-Change Hook Patterns in app.js

**Generated:** 2026-08-24  
**Bead:** vista-061ed921  
**Phase:** 2 (Documentation of filter-change patterns)

## Summary

This document catalogs all filter-change hook patterns found in `/home/coding/vista/src/public/app.js`. These patterns handle user-initiated filter operations (show/hide platforms, favorites, metadata filtering, What-If mode toggles) while coordinating with the smart-ordering system to prevent state conflicts.

---

## Pattern 1: Direct Event Listener (Simple Input Filter)

**Line:** 4419  
**Context:** Metadata table filter input

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern:** Direct `input` event listener that immediately re-renders the metadata table with the filter value.  
**Trigger:** User types in the metadata filter input field  
**Handler:** `renderMetadataTable(filter)` - filters rows and re-renders  
**Guard:** None (simple synchronous operation)

---

## Pattern 2: Guard Flag Pattern (Prevent Smart Order Resets)

**Lines:** 6761, 8562-8564, 8578-8581, 8626-8628, 8638-8641, 8745-8747  
**Context:** Preventing smart ordering from being disrupted during filter operations

### State Declaration (Line 6761)

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### Usage Pattern 1: importPreferences (Lines 8562-8564)

```javascript
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  isSmartOrderingActive = false;
  // ...
};
```

### Usage Pattern 2: Direct Import (Lines 8578-8581)

```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Usage Pattern 3: What-If Mode Toggle (Lines 8626-8628, 8638-8641)

```javascript
// When smart ordering is active - queue the operation
const applyWhatIfReset = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
};
queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');

// When smart ordering is NOT active - direct execution
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Usage Pattern 4: What-If Mode Tag Toggle (Lines 8745-8747)

```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Pattern:** Set `isFilterOperation = true` before render, then asynchronously clear it via `setTimeout(..., 0)`  
**Purpose:** Signals to `renderPreviews()` that card order should NOT be reset  
**Scope:** Flag is global module-level state  
**Clear Timing:** Next event loop tick (after render completes)

---

## Pattern 3: Queue Pattern (Defer During Active Smart Ordering)

**Lines:** 8424-8429, 8434-8457, 6763, 8570, 8630  
**Context:** Operations that must wait for smart ordering to complete

### State Declaration (Line 6763)

```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### queueFilterOperation Function (Lines 8424-8429)

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
```

### processPendingFilterOperations Function (Lines 8434-8457)

```javascript
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

### Usage Pattern 1: importPreferences (Line 8570)

```javascript
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
    // ...
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  if (DEBUG_SMART_ORDERING) {
    console.log('[importPreferences] Smart ordering active - operation queued');
  }
  return;
}
```

### Usage Pattern 2: toggleWhatIfMode (Line 8630)

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

**Pattern:** Check if smart ordering is active → if so, push operation to queue instead of executing  
**Queue Processing:** Called by smart ordering completion handler (not shown in these snippets)  
**Description Parameter:** Used for debugging/logging only  
**Error Handling:** Try/catch per operation; one failure doesn't prevent others from running

---

## Pattern 4: Smart Ordering Integration Pattern

**Lines:** 8360-8363, 8415-8417, 8420-8422  
**Context:** Coordinating filter operations with smart ordering state

### toggleFavorite Clear Flag (Lines 8360-8363)

```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();

    // Clear smart ordering active flag since user manually modified favorites
    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

### isSmartOrdering Check Function (Lines 8415-8417)

```javascript
/**
 * Check if smart ordering is currently active
 *
 * Centralized guard function that checks BOTH the user preference and runtime state
 * to determine if smart ordering is currently active.
 *
 * @returns {boolean} True if smart ordering is BOTH enabled AND currently active, false otherwise
 */
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

### shouldDeferFilterOperation Function (Lines 8420-8422)

```javascript
/**
 * Check if filter operation should be deferred due to active smart ordering
 * @returns {boolean} True if smart ordering is active and operation should be deferred
 */
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Pattern:** User-initiated filter actions clear the smart ordering flag  
**Rationale:** Manual platform reordering takes precedence over automatic smart ordering  
**Integration:** Filter operations check `isSmartOrdering()` before executing

---

## Pattern 5: Toggle Functions (Filter-like Operations)

**Lines:** 8349-8365 (toggleFavorite), 8459-8470 (toggleHidden)  
**Context:** Platform visibility and favorites manipulation

### toggleFavorite (Lines 8349-8365)

```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();

    // Clear smart ordering active flag since user manually modified favorites
    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

### toggleHidden (Lines 8459-8470)

```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData); // Re-render to apply hiding
  });
}
```

**Pattern:** Wrapper functions (`guardWrapper`, `guardWrapperWithRender`) that modify platform preferences  
**Side Effects:** Save to localStorage, update UI lists, re-render previews  
**Smart Ordering:** `toggleFavorite` clears the flag; `toggleHidden` doesn't explicitly clear it  
**Difference:** `toggleHidden` uses `guardWrapperWithRender` which includes automatic re-rendering

---

## Pattern 6: Render Metadata Pattern (Filter-Based Display)

**Lines:** 4369-4423  
**Context:** Metadata table with client-side filtering

### renderMetadataTable Function (Lines 4369-4423)

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  let html = `<div class="metadata-viewer">
    <div class="metadata-toolbar">
      <div class="metadata-filter">
        <input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
        <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
      </div>
      // ...
    </div>
    // ... render table rows ...
  </div>`;

  rawTagsPanel.innerHTML = html;

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

**Pattern:** Function accepts optional `filter` parameter, filters rows, re-attaches event listener  
**Filter Logic:** Case-insensitive substring match on tag name OR value  
**Re-entrancy:** Each call re-attaches the event listener (replaces the previous DOM element)  
**State:** No global state - filter value passed as parameter and stored in input value attribute

---

## Pattern 7: Global Exposure (Testing/Debugging)

**Lines:** 5468-5483  
**Context:** Exposing filter state and functions for integration testing

```javascript
// Expose guard functions and state for integration testing
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});
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

**Pattern:** Direct exposure of internal state and functions to `window` object  
**Purpose:** Integration testing and debugging (allows external control of filter state)  
**Access:** Getters/setters for state variables; direct function references for operations

---

## Related State Variables

| Variable | Line | Type | Purpose |
|----------|------|------|---------|
| `isFilterOperation` | 6761 | `boolean` | Guard flag to prevent smart order resets during filter changes |
| `isSmartOrderingActive` | 6762 | `boolean` | Track when smart ordering is currently active |
| `pendingFilterOperations` | 6763 | `Array` | Queue filter operations during smart ordering |

---

## Event Flow Diagram

```
User Action (e.g., toggleHidden)
    │
    ├─► Check: isSmartOrdering()?
    │         │
    │         ├─► YES: queueFilterOperation(op, desc)
    │         │         └─► Push to pendingFilterOperations[]
    │         │
    │         └─► NO: Execute directly
    │                   ├─► Set isFilterOperation = true
    │                   ├─► Call renderPreviews()
    │                   └─► setTimeout(() => isFilterOperation = false, 0)
    │
    └─► (Later) Smart ordering completes
              └─► processPendingFilterOperations()
                      └─► Execute all queued operations
```

---

## Key Design Decisions

1. **Asynchronous Flag Clearing:** `isFilterOperation` is cleared via `setTimeout(..., 0)` to ensure the flag remains true through the entire render cycle
2. **Queue Over Direct Execution:** When smart ordering is active, filter operations are queued rather than executed immediately to prevent state conflicts
3. **Manual Override Clears Flag:** User actions like `toggleFavorite` and manual preference imports clear `isSmartOrderingActive` to prevent automatic reordering from overriding user choices
4. **Debug-Mode Logging:** Extensive console logging controlled by `DEBUG_SMART_ORDERING` flag for troubleshooting filter/smart-ordering interactions
5. **Global Exposure:** Internal state exposed via `window` for integration testing, enabling external simulation of filter scenarios

---

## Usage Examples

### Adding a New Filter Operation

```javascript
function myNewFilterHandler() {
  // Check if smart ordering is active
  if (isSmartOrdering()) {
    // Queue the operation with description for debugging
    queueFilterOperation(myNewFilterHandler, 'myNewFilterHandler');
    return;
  }

  // Set guard flag to prevent smart order reset
  isFilterOperation = true;
  
  try {
    // Perform filter logic here
    // ...
    
    // Re-render previews
    renderPreviews(currentData);
  } finally {
    // Clear flag asynchronously
    setTimeout(() => { isFilterOperation = false; }, 0);
  }
}
```

### Testing Filter Behavior

```javascript
// In browser console or test suite:
window.isFilterOperation = true;    // Set guard flag
window.queueFilterOperation(() => {  // Queue operation
  console.log('Test operation');
}, 'test-operation');
window.processPendingFilterOperations(); // Process queue
```

---

## References

- **Related Files:** `public/app.js` (this file), `public/editor.js` (may contain related patterns)
- **Related Beads:** vista-061ed921 (this documentation task)
- **Documentation:** `docs/plan/plan.md` (VISTA architecture)
