# Filter-Related Patterns in app.js

## Summary
This document catalogs filter-related patterns found in `/home/coding/vista/src/public/app.js`. **Note: This is vanilla JavaScript, not React, so there are no `useEffect` hooks.** Instead, the application uses event listeners, state management, and guard flags for filter operations.

## Key Filter-Related Patterns

### 1. Metadata Filter with Live Updates (Lines 3941-3995)

**Pattern:** Input event listener with immediate re-render

```javascript
// Function definition (line 3941)
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... render filtered rows
}

// Event listener attachment (lines 3989-3994)
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Dependencies:** `allMetadataRows` (global state), `metadataFilterInput` DOM element
**Trigger:** User input on metadata filter field
**Action:** Re-renders metadata table with filtered results

---

### 2. Command Palette Filter (Lines 9085, 9177-9187)

**Pattern:** Input event listener with real-time command filtering

```javascript
// Event listener setup (line 9085)
input.addEventListener('input', filterCommands);

// Filter implementation (lines 9177-9187)
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

**Dependencies:** `COMMANDS` constant, `commandPaletteSelectedIndex` state
**Trigger:** User input in command palette
**Action:** Filters and re-renders command list

---

### 3. Smart Ordering Filter Guard System (Lines 6279-6281, 7887-7975)

**Pattern:** Guard flags and operation queue to prevent conflicts between smart ordering and filter operations

**State Variables:**
```javascript
let isFilterOperation = false; // Line 6279
let isSmartOrderingActive = false; // Line 6280
let pendingFilterOperations = []; // Line 6281
```

**Guard Functions:**
```javascript
// Check if operation should be deferred (lines 7933-7935)
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}

// Queue filter operation during smart ordering (lines 7942-7947)
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

// Process queued operations after smart ordering completes (lines 7952-7975)
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];

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

**Usage in toggleWhatIfMode (lines 8142-8159):**
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

isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### 4. Toggle Operations with Filter Guards (Lines 7867-7988)

**Pattern:** Toggle functions that modify filter state with smart ordering guards

**toggleFavorite (lines 7867-7883):**
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

    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

**toggleHidden (lines 7977-7988):**
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
    renderPreviews(currentData);
  });
}
```

**Dependencies:** `platformPrefs.favorites`, `platformPrefs.hidden`, `currentData`
**Trigger:** User clicks on favorite/remove buttons
**Action:** Updates platform visibility preferences and re-renders

---

### 5. Import Preferences with Filter Guard (Lines 8075-8106)

**Pattern:** File import operation with deferred execution during smart ordering

```javascript
if (isSmartOrdering()) {
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
  return;
}

isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Dependencies:** `currentData`, platform preferences
**Trigger:** File upload via import button
**Action:** Imports and applies user preferences, queued if smart ordering is active

---

### 6. Event Listener Setup for Filter Controls (Lines 8008-8031, 8334)

**Pattern:** Event delegation for dynamic filter controls

**Favorites list (lines 8008-8009):**
```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```

**Hidden platforms list (lines 8029-8031):**
```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

**What If toggle button (line 8334):**
```javascript
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

---

## Initialization Patterns

### Global Initialization (Lines 491-507)

```javascript
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadRecents();
  initOgGenerator();
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    urlInput.value = urlParam;
    inspectUrl(urlParam);
  }
  if (params.has('feedback')) {
    initFeedbackWidget();
  }
  restoreHashState();
});
```

**Timing:** Executes once on page load
**Actions:** Sets up theme, loads recent data, parses URL parameters, restores state

---

## Filter State Management Architecture

### State Variables
- `isFilterOperation`: Boolean flag preventing smart order resets during filter changes
- `isSmartOrderingActive`: Boolean flag tracking active smart ordering operations
- `pendingFilterOperations`: Array of queued filter operations to execute after smart ordering
- `platformPrefs.hidden`: Set of hidden platform IDs
- `platformPrefs.favorites`: Set of favorite platform IDs
- `whatIfMode`: Boolean flag for "What If" mode
- `disabledTags`: Set of disabled tags for "What If" mode

### Key Design Patterns

1. **Guard Flag Pattern**: `isFilterOperation` prevents unwanted side effects during filter operations
2. **Queue Pattern**: `pendingFilterOperations` queues filter operations during conflicts
3. **Debounce Pattern**: `setTimeout(() => { isFilterOperation = false; }, 0)` defers flag reset
4. **Event Delegation**: Dynamic attachment of event listeners to filter controls
5. **State-Render Separation**: Filter state changes trigger re-renders via `renderPreviews(currentData)`

---

## Comparison with Previously Documented Categories

These patterns don't directly match standard React `useEffect` categories because this is vanilla JavaScript. However, they parallel these useEffect patterns:

1. **Props/state-derived filtering** → `renderMetadataTable(filter)` and `filterCommands()`
2. **Event listener setup** → DOMContentLoaded listener and dynamic event delegation
3. **State synchronization** → Smart ordering guard flags and pending operations queue
4. **Cleanup/teardown** → `setTimeout` flag reset pattern (deferred cleanup)

The key difference is that instead of declarative `useEffect` hooks with dependency arrays, this codebase uses:
- Imperative event listener setup
- Manual guard flags and state management
- Queued operations for conflict resolution
- Deferred cleanup via `setTimeout`

---

## Next Steps for Compilation

For comprehensive filter-pattern documentation, the next bead should:

1. **Cross-reference with existing documentation**: Compare these findings against previously documented hook categories
2. **Map patterns to functionality**: Identify which UI features use which filter patterns
3. **Document interaction flows**: Trace how filter operations interact with smart ordering
4. **Create pattern catalog**: Build a reference for future filter-related development
5. **Identify optimization opportunities**: Look for redundant filter operations or potential race conditions

---

**Generated for bead bf-gewzn**
**Date:** 2026-07-24
**File:** /home/coding/vista/src/public/app.js (367KB vanilla JavaScript)