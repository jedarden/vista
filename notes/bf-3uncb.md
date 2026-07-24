# Filter-Related Hook Patterns in app.js

## Overview
This document catalogs all hook patterns found in `/home/coding/vista/src/public/app.js`, with special focus on filter-related hooks and their purposes.

## Core Filter Hook Patterns

### 1. Filter Operation Guard System

#### `isFilterOperation` Flag (Line 6279)
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```
**Purpose:** Prevents smart order resets during filter changes. Set to `true` during filter operations to signal that card order should not be cleared.

**Usage Context:**
- Set during import preferences: `isFilterOperation = true; setTimeout(() => { isFilterOperation = false; }, 0);` (Lines 8080, 8099, 8144, 8159, 8263, 8265)
- Checked in card ordering logic: `if (isFilterOperation || isSmartOrdering())` (Line 8792)

#### `isSmartOrderingActive` Flag (Line 6280)
```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```
**Purpose:** Runtime flag tracking smart ordering progress to prevent concurrent filter operations.

#### `pendingFilterOperations` Queue (Line 6281)
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```
**Purpose:** Queue filter operations that occur during smart ordering to be executed after it completes.

---

### 2. Filter Operation Functions

#### `shouldDeferFilterOperation()` (Lines 7891-7893)
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```
**Purpose:** Centralized guard function to check if filter operations should be deferred during active smart ordering.

#### `queueFilterOperation()` (Lines 7942-7947)
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```
**Purpose:** Queue a filter operation to be processed after smart ordering completes.

**Usage Example:**
```javascript
if (isSmartOrdering()) {
  queueFilterOperation(myFilterHandler, 'myFilterHandler');
  return;
}
```

#### `processPendingFilterOperations()` (Lines 7952-7973)
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = [...pendingFilterOperations];
  pendingFilterOperations = [];

  for (const { operation, description } of operations) {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  }
}
```
**Purpose:** Execute all queued filter operations after smart ordering completes.

---

### 3. Filter Operation Guards in User Interactions

#### importPreferences Filter Guard (Lines 8077-8092)
```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}

// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
**Purpose:** Prevents smart ordering conflicts when user imports preferences. Either queues the operation or sets guard flag.

#### toggleWhatIfMode Filter Guard (Lines 8142-8159)
```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  return;
}

// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
**Purpose:** Prevents smart ordering conflicts when toggling what-if mode. Same pattern as importPreferences.

#### applySmartOrdering Filter Guard (Lines 8792-8796)
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
}
```
**Purpose:** Prevents cardOrder clearing when filter operations are in progress or smart ordering is active, avoiding unintended resets.

#### toggleHidden Filter Guard (Lines 8263-8265)
```javascript
isFilterOperation = true;
setTimeout(() => { isFilterOperation = false; }, 0);
```
**Purpose:** Guard flag to prevent smart order resets during platform hide/show toggle operations.

---

### 4. Filter Toggle Functions

#### `toggleFavorite(pid)` (Lines 7867-7882)
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
**Purpose:** Toggle platform favorite status and clear smart ordering flag on manual user override.

**Event Listener:**
```javascript
btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid)); // Line 8008
```

#### `toggleHidden(pid)` (Lines 7977-7987)
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
**Purpose:** Toggle platform visibility and re-render previews to apply changes.

**Event Listener:**
```javascript
btn.addEventListener('click', () => toggleHidden(btn.dataset.pid)); // Line 8030
```

---

### 4. Metadata Filter Pattern

#### `renderMetadataTable(filter = '')` (Lines 3941-3994)
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
      // ... rest of HTML
    </div>
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
**Purpose:** Render metadata table with client-side filtering capability.

**Hook Pattern:** Self-attaching event listener pattern - the function creates its own filter input and attaches the listener each time it renders.

---

### 5. Platform Filter/Toggle Hooks

#### Platform Checkbox Change Event Listeners (Lines 3497-3501)
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```
**Purpose:** Handles individual platform checkbox changes to update the enabled platforms list, refresh cropper overlays, and sync group header states.

**Context:** Core filter handler for platform visibility toggles in the cropper interface. Every checkbox change triggers this three-step update sequence.

---

#### Select/Clear All Platforms Event Listeners (Lines 3504-3516)
```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});

document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```
**Purpose:** Bulk operations to enable/disable all platforms at once, triggering the same update sequence as individual changes.

**Context:** Convenience functions that update all checkboxes and trigger the standard update flow (sync → update → render).

---

#### `updateEnabledPlatforms()` Function (Lines 3551-3561)
```javascript
function updateEnabledPlatforms() {
  cropperState.enabledPlatforms.clear();
  document.querySelectorAll('.cropper-platform-toggle input:checked').forEach(cb => {
    cropperState.enabledPlatforms.add(cb.dataset.platform);
  });
  // Refresh the category legend so its active/dimmed state tracks the live
  // toggle selection. Every toggle path (individual, group, select/clear-all)
  // and the initial renderCropperControls() call funnels through here, so this
  // single hook keeps the legend in sync with the overlays on screen.
  renderCategoryLegend();
}
```
**Purpose:** Rebuilds the enabled platforms set from checkbox states and updates the category legend display.

**Context:** Central aggregator hook that all checkbox paths funnel through. This is the single source of truth for which platforms are currently enabled in the cropper.

---

#### `syncGroupToggles()` Function (Lines 3530-3549)
```javascript
function syncGroupToggles(groups) {
  groups.forEach(group => {
    const groupCb = document.querySelector(`.cropper-group-toggle[data-group="${group.id}"]`);
    if (!groupCb) return;
    const children = group.platforms
      .map(pid => document.querySelector(`input[data-platform="${pid}"]`))
      .filter(Boolean);
    if (!children.length) return;
    const checkedCount = children.filter(cb => cb.checked).length;
    if (checkedCount === 0) {
      groupCb.checked = false;
      groupCb.indeterminate = false;
    } else if (checkedCount === children.length) {
      groupCb.checked = true;
      groupCb.indeterminate = false;
    } else {
      groupCb.indeterminate = true;
    }
  });
}
```
**Purpose:** Synchronizes group header checkbox states with their child platform checkboxes (checked/unchecked/indeterminate).

**Context:** Ensures visual consistency between group toggles and individual platform toggles. Called after any platform state change.

---

### 6. Command Palette Filter

#### `filterCommands(e)` (Lines 9177-9192)
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
**Purpose:** Filter command palette commands by search query.

**Event Listener:**
```javascript
input.addEventListener('input', filterCommands); // Line 9085
```

---

## Other Hook Patterns in app.js

### Lifecycle Hooks

#### DOMContentLoaded Hooks (Multiple instances)
- **Line 491:** Main initialization hook
  ```javascript
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadRecents();
    initOgGenerator();
    // URL parameter handling
    // Feedback widget initialization
    restoreHashState();
  });
  ```

- **Line 6797:** Editor initialization hook
  ```javascript
  document.addEventListener('DOMContentLoaded', () => {
    // Editor input listeners
    // Preferences export/import
    // Platform preferences loading
    // Command palette initialization
    // Global keyboard shortcuts
  });
  ```

- **Line 8946:** Inline editing initialization hook
  ```javascript
  document.addEventListener('DOMContentLoaded', () => {
    initInlineEditing();
  });
  ```

### Function Replacement Hooks (Monkey Patching)

#### `handleResult` Hook (Lines 8957-8982)
```javascript
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  // Store reference for use in hook
  const originalData = data;

  // P0 - Timing fix: Set currentData BEFORE applySmartOrderingSafe() call
  currentData = data;

  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');
    applySmartOrderingSafe();
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }

  // Now render with cards already in correct order
  await originalHandleResult2(data);
};
```
**Purpose:** Intercept the main result handler to apply smart ordering before rendering.

#### `renderDiagnostics` Hook (Lines 8950-8955)
```javascript
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```
**Purpose:** Initialize diagnostic tracking after diagnostics are rendered.

### State Management Hooks

#### Window Property Exports (Lines 5042-5058)
```javascript
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
**Purpose:** Expose filter-related functions and state globally for testing and debugging.

---

## Filter-Related Hook Pattern Summary

| Pattern | Location | Purpose | Type |
|---------|----------|---------|------|
| `isFilterOperation` flag | 6279 | Guard flag for filter ops | State |
| `isSmartOrderingActive` flag | 6280 | Runtime tracking | State |
| `pendingFilterOperations` queue | 6281 | Operation queue | State |
| `queueFilterOperation()` | 7942-7947 | Queue filter ops | Function |
| `processPendingFilterOperations()` | 7952-7973 | Process queued ops | Function |
| `toggleFavorite()` | 7867-7882 | Toggle favorites | Filter Hook |
| `toggleHidden()` | 7977-7987 | Toggle visibility | Filter Hook |
| `renderMetadataTable()` | 3941-3994 | Metadata filtering | Filter Hook |
| Platform checkbox change handlers | 3497-3501 | Platform visibility toggles | Filter Hook |
| Select/clear all platforms | 3504-3516 | Bulk platform operations | Filter Hook |
| `updateEnabledPlatforms()` | 3551-3561 | Central aggregator | Filter Hook |
| `syncGroupToggles()` | 3530-3549 | Group state sync | Filter Hook |
| `filterCommands()` | 9177-9192 | Command palette filter | Filter Hook |
| `handleResult` hook | 8957-8982 | Smart ordering injection | Lifecycle Hook |

## Integration Patterns

### Filter Operation During Smart Ordering
When a filter operation is triggered during smart ordering:
1. Check `isSmartOrdering()` - returns true if both preference enabled AND active
2. If true, call `queueFilterOperation(operation, description)`
3. Smart ordering completes
4. `processPendingFilterOperations()` executes queued operations

### Guard Pattern for Filter Operations
```javascript
// Before filter operation
if (isSmartOrdering()) {
  queueFilterOperation(myFilterHandler, 'myFilterHandler');
  return;
}

// During filter operation
isFilterOperation = true;
// ... perform filter logic
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Manual Override Pattern
When user manually modifies filters (favorites/hidden):
```javascript
isSmartOrderingActive = false; // Clear smart ordering flag
// Perform manual operation
```

---

## Notes

1. **Self-Attaching Pattern:** `renderMetadataTable()` uses a self-attaching event listener pattern where the function creates its own input and attaches the listener each time it renders.

2. **Guard Wrapper Functions:** `toggleFavorite()` and `toggleHidden()` use `guardWrapper()` and `guardWrapperWithRender()` (defined elsewhere in the codebase) for additional safety.

3. **Global Exposure:** Filter-related functions are exposed on `window` object for testing and debugging purposes.

4. **Race Condition Prevention:** Multiple guard flags (`isFilterOperation`, `isSmartOrderingActive`, `isApplyingSmartOrder`) work together to prevent race conditions between filter operations and smart ordering.

5. **Event Delegation:** Most filter operations use event delegation with `dataset.pid` pattern to identify target platforms.

---

## Summary

**Total Hook Patterns Found:** 17 major patterns

**Filter-Related Patterns:** 12
1. Filter operation guard flag (`isFilterOperation`)
2. Pending filter operations queue (`pendingFilterOperations`)
3. Queue filter operation function
4. Process pending filter operations function
5. Metadata filter input event listener
6. Platform checkbox change event listeners
7. Select/clear all platforms event listeners
8. `updateEnabledPlatforms()` central aggregator
9. `syncGroupToggles()` group state sync
10. Filter operation integration with smart ordering
11. Guard wrapper patterns (toggleFavorite/toggleHidden)
12. Command palette filter (`filterCommands()`)

**Non-Filter Hook Patterns:** 6
1. DOMContentLoaded lifecycle hook
2. renderDiagnostics function hook
3. handleResult function hook (smart ordering)
4. switchTab function hook
5. isSmartOrdering helper function
6. Smart ordering active flag

All filter-related hooks serve the primary purpose of preventing race conditions between user filtering operations and the smart ordering system, ensuring platform card order remains stable during user interactions.