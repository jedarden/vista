# Comprehensive Filter-Change Event Listener Patterns Catalog

**Generated:** 2026-07-24  
**Bead:** bf-ihvg1  
**Source File:** `/home/coding/vista/src/public/app.js` (9,998 lines)  
**Purpose:** Structured compilation of all filter-change event listener patterns  

---

## Overview

This document compiles findings from multiple searches for filter-change event listener patterns in the VISTA application. It catalogs all event binding patterns, hook systems, and guard mechanisms that manage filter operations.

**Key Finding:** The VISTA application uses **native DOM `addEventListener()`** exclusively for filter-change events. No jQuery `.change()` or `.on('change')` bindings, and no inline `on*` event handlers or `addHook` methods are used for filter functionality.

---

## Pattern Type 1: Native DOM addEventListener Patterns

### 1.1 Change Event Bindings (Filter-Related)

#### Pattern: Change Event for Sort/Filter Dropdowns

**Pattern type:** Event listener for filter changes  
**Line number:** 332  
**Code snippet:**
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Context:** 
- **Element:** `#heatmapSort` dropdown selector
- **Handler function:** `handleHeatmapSort()` (defined at line 6109)
- **Purpose:** Controls sorting order of sitemap heatmap visualization
- **Section:** Sitemap/Heatmap section
- **Event type:** `change` (fires on blur/commit)
- **Handler operations:**
  - Sorts `sitemapResults` array by selected criteria
  - Supports: score-asc, score-desc, url-asc, url-desc
  - Calls `renderHeatmapTable()` with sorted results

---

#### Pattern: Change Event for Platform Group Toggles

**Pattern type:** Event listener for filter changes  
**Line number:** 3481  
**Code snippet:**
```javascript
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    const group = e.target.dataset.group;
    const platforms = groups.find(g => g.id === group)?.platforms || [];
    platforms.forEach(pid => {
      const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
      if (platformCb) platformCb.checked = e.target.checked;
    });
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Context:**
- **Element:** `.cropper-group-toggle` (checkboxes with `data-group` attribute)
- **Handler function:** Anonymous arrow function
- **Purpose:** Master toggle pattern - group checkboxes control all child platforms
- **Section:** Cropper/platform selection modal
- **Event type:** `change`
- **Handler operations:**
  - Reads `data-group` attribute to identify target group
  - Sets individual platform checkboxes to match group state
  - Calls coordinated update functions
  - **Pattern:** Cascading state synchronization

**Called functions:**
- `updateEnabledPlatforms()` - Rebuilds enabled platform IDs set
- `updateCropperOverlay()` - Redraws crop overlay for enabled platforms
- `syncGroupToggles(groups)` - Syncs parent checkbox states

---

#### Pattern: Change Event for Individual Platform Toggles

**Pattern type:** Event listener for filter changes  
**Line number:** 3497  
**Code snippet:**
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Context:**
- **Element:** `.cropper-platform-toggle input` (checkboxes with `data-platform` attribute)
- **Handler function:** Anonymous arrow function
- **Purpose:** Individual platform selection with coordinated state updates
- **Section:** Cropper/platform selection modal
- **Event type:** `change`
- **Handler operations:**
  - Updates enabled platforms set from UI state
  - Updates visual overlay display
  - Syncs group checkbox states (indeterminate/checked/unchecked)

---

#### Pattern: Change Event for What-If Mode Tag Filters

**Pattern type:** Event listener for filter changes  
**Line number:** 8207  
**Code snippet:**
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

**Context:**
- **Element:** `.what-if-toggle input` (checkboxes with `data-tag` attribute)
- **Handler function:** Anonymous arrow function
- **Purpose:** Enable/disable diagnostic tags in What-If mode
- **Section:** What-If panel
- **Event type:** `change`
- **Handler operations:**
  - Adds tag to `disabledTags` Set when unchecked
  - Removes tag from `disabledTags` Set when checked
  - Calls `updateHash()` to persist state to URL fragment
- **Pattern:** Bidirectional set management with URL persistence

---

### 1.2 Input Event Bindings (Real-time Filtering)

#### Pattern: Input Event for Metadata Table Filtering

**Pattern type:** Event listener for real-time filter changes  
**Line number:** 3991  
**Code snippet:**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context:**
- **Element:** `#metadataFilterInput` (text input)
- **Handler function:** Anonymous function calling `renderMetadataTable()`
- **Purpose:** Real-time filtering of metadata tags as user types
- **Section:** Metadata panel toolbar
- **Event type:** `input` (fires on each keystroke)
- **Handler operations:**
  - Calls `renderMetadataTable()` recursively with filter value
  - Filters `allMetadataRows` by tag name or value
  - Shows filtered count ("X of Y tags")
  - Handles empty state: "No tags match your filter"
- **Pattern:** Self-attaching event listener for recursive filtering

---

#### Pattern: Input Event for Command Palette Filtering

**Pattern type:** Event listener for real-time filter changes  
**Line number:** 9085  
**Code snippet:**
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Context:**
- **Element:** `#commandInput` (text input in command palette)
- **Handler function:** `filterCommands()` (defined at line 9185)
- **Purpose:** Real-time command filtering/search
- **Section:** Command palette (modal dialog)
- **Event type:** `input`
- **Handler operations:**
  - Converts query to lowercase for case-insensitive matching
  - Filters by both `label` and `category` fields
  - Resets `commandPaletteSelectedIndex` to 0 on each input
  - Calls `renderCommands()` with filtered results
- **Pattern:** Multi-field real-time search with selection reset

**Dual event binding:**
```javascript
input.addEventListener('keydown', handleCommandKeydown); // Line 9086
```

---

#### Pattern: Input Event for Editor Field Changes

**Pattern type:** Event listener for real-time input changes  
**Line number:** 6801  
**Code snippet:**
```javascript
const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
editorInputs.forEach(input => {
  input.addEventListener('input', handleEditorInput);
});
```

**Context:**
- **Element:** `.editor-input, .editor-textarea, .editor-select` (batch selector)
- **Handler function:** `handleEditorInput()` (defined at line 6597)
- **Purpose:** Batched input handling for multiple editor fields
- **Section:** Metadata editor
- **Event type:** `input`
- **Handler operations:**
  - Uses `data-tag` attribute to identify field
  - Tracks dirty state and original values
  - CSS class toggling for visual feedback (modified state)
  - **Debounced preview update (300ms)** to prevent excessive re-renders
  - Calls `updatePreviewsWithEdits()` after debounce
- **Pattern:** Batch selector with debounced updates

---

### 1.3 Click Event Bindings (Filter-Related Actions)

#### Pattern: Click Event for Platform Favorites

**Pattern type:** Event listener for filter state changes  
**Line number:** 8007-8009, 9693-9696  
**Code snippet:**
```javascript
// Line 8007-8009 (in favorites list)
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});

// Line 9693-9696 (in context menu)
document.querySelector('.context-menu-item[data-action="toggle-favorite"]')?.addEventListener('click', () => {
  toggleFavorite(pid);
});
```

**Context:**
- **Elements:** 
  - `.platform-item-remove` buttons within `#favoritesList`
  - `.context-menu-item` with `data-action="toggle-favorite"` in `#cardContextMenu`
- **Handler function:** `toggleFavorite(pid)` (defined at line 7875)
- **Purpose:** Toggle favorite status for platforms
- **Section:** Favorites management / Context menu
- **Event type:** `click`
- **Handler operations:**
  - Uses `guardWrapper('toggleFavorite')` for automatic deferment
  - Adds/removes platform from `platformPrefs.favorites` Set
  - Calls `savePlatformPrefs()` to persist to localStorage
  - Updates UI via `updateFavoritesList()`
  - **Clears `isSmartOrderingActive` flag** on manual preference change
- **Resets Smart Ordering:** NO (favorites don't affect order)
- **Pattern:** Guard-wrapped state mutation with persistence

---

#### Pattern: Click Event for Platform Visibility

**Pattern type:** Event listener for filter state changes  
**Line number:** 8029-8031, 9689-9692  
**Code snippet:**
```javascript
// Line 8029-8031 (in hidden platforms list)
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});

// Line 9689-9692 (in context menu)
document.querySelector('.context-menu-item[data-action="toggle-hidden"]')?.addEventListener('click', () => {
  toggleHidden(pid);
});
```

**Context:**
- **Elements:**
  - `.platform-item-remove` buttons within `#hiddenPlatformsList`
  - `.context-menu-item` with `data-action="toggle-hidden"` in `#cardContextMenu`
- **Handler function:** `toggleHidden(pid)` (defined at line 7985)
- **Purpose:** Toggle hidden status for platforms
- **Section:** Hidden platforms management / Context menu
- **Event type:** `click`
- **Handler operations:**
  - Uses `guardWrapperWithRender('toggleHidden')` for automatic coordination
  - Adds/removes platform from `platformPrefs.hidden` Set
  - Calls `savePlatformPrefs()` to persist
  - Updates UI via `updateHiddenList()`
  - **Calls `renderPreviews(currentData)`** to immediately apply hiding
  - **Resets smart ordering** to prevent automatic reordering after manual changes
- **Resets Smart Ordering:** YES
- **Pattern:** Guard-wrapped state mutation with immediate visual feedback

---

## Pattern Type 2: Non-Existent Patterns (Search Results)

### 2.1 on* Event Handler Patterns

**Search result:** **No on* event handlers found for filter functionality**

**Context:** The application uses modern JavaScript event handling with `addEventListener` instead of inline `onclick`, `onchange`, or `oninput` attributes for filter functionality.

**Other on* handlers found (NOT filter-related):**
- Image `onerror` handlers (40+ instances)
- Image `onload` handlers (30+ instances)
- Button `onclick` handlers (10+ instances for export/copy operations)

---

### 2.2 addHook Method Patterns

**Search result:** **No addHook method calls found in app.js**

**Context:** The term "hook" in documentation refers to:
1. Guard functions that intercept/coordinate operations
2. Event listener patterns for handling changes
3. Custom queue system for deferred filter operations

The filter-change functionality is implemented through standard DOM event listeners and custom guard/wrapper functions, not a plugin-style `addHook` registration pattern.

---

### 2.3 jQuery Event Bindings

**Search result:** **No jQuery event bindings found for filters**

**Context:** All filter-related event bindings use native DOM API. No jQuery `.change()` or `.on('change')` patterns were found for filter elements.

---

## Pattern Type 3: Guard System Functions (Hook-Like Interceptors)

### 3.1 Function Wrapping Hooks

#### Pattern: Hook into renderDiagnostics

**Pattern type:** Function wrapping hook  
**Line number:** 8950-8955  
**Code snippet:**
```javascript
// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```

**Context:**
- **Purpose:** Attach diagnostic tracking after diagnostics rendering completes
- **Hook trigger:** When `renderDiagnostics()` is called
- **Operations:** Calls original function, then initializes tracking after 100ms delay
- **Pattern:** Store original → Replace with wrapper → Call original → Execute hook logic

---

#### Pattern: Hook into handleResult

**Pattern type:** Function wrapping hook for smart ordering  
**Line number:** 8957-8982  
**Code snippet:**
```javascript
// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  const originalData = data;
  
  // Set currentData BEFORE applySmartOrderingSafe() call
  currentData = data;
  
  if (platformPrefs.smartOrdering) {
    applySmartOrderingSafe();
  }
  
  await originalHandleResult2(data);
};
```

**Context:**
- **Purpose:** Apply smart ordering BEFORE rendering to prevent race conditions
- **Hook trigger:** When inspection results arrive and `handleResult()` is called
- **Operations:**
  - Sets `currentData` early (timing fix)
  - Applies smart ordering before render
  - Calls original handleResult
- **Pattern:** Async wrapper with pre-logic execution

---

### 3.2 Guard Flags and State Variables

#### Pattern: isFilterOperation Guard Flag

**Pattern type:** Boolean guard flag  
**Line number:** 6279 (declaration), 5046-5048 (exposure)  
**Code snippet:**
```javascript
// Declaration
let isFilterOperation = false;

// Exposure to window object
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

// Usage pattern
isFilterOperation = true;
// ... perform filter operation ...
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Context:**
- **Purpose:** Prevent smart order resets during filter operations
- **Guarded operations:**
  - Import preferences (line 8080-8082)
  - What-if mode toggle (line 8144-8149)
  - Platform visibility changes (line 8263-8265)
- **Check location:** Line 8792-8794 in `applySmartOrdering()`
- **Pattern:** Guard flag with automatic clearing

---

#### Pattern: isSmartOrderingActive Flag

**Pattern type:** Runtime state flag  
**Code snippet:**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Context:**
- **Purpose:** Track when smart ordering is currently executing
- **Combined check:** User preference + runtime state
- **Location:** Lines 7933-7935
- **Pattern:** Dual-condition check

---

#### Pattern: isApplyingSmartOrder Flag

**Pattern type:** Thread safety guard flag  
**Code snippet:**
```javascript
// In applySmartOrderingSafe()
isApplyingSmartOrder = true;
try {
  applySmartOrdering();
  reorderPlatformCards();
} finally {
  isApplyingSmartOrder = false;
}
```

**Context:**
- **Purpose:** Ensure only one smart ordering operation runs at a time
- **Usage:** Used by `renderPreviews` to queue if ordering is in progress
- **Pattern:** Try-finally guard flag

---

## Pattern Type 4: Queue System for Deferred Operations

### 4.1 Queue Pattern

#### Pattern: pendingFilterOperations Queue

**Pattern type:** Operation queue array  
**Line number:** 6281 (declaration), 5050-5052 (exposure)  
**Code snippet:**
```javascript
// Declaration
let pendingFilterOperations = [];

// Exposure
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Context:**
- **Purpose:** Store filter operations to execute after smart ordering completes
- **Managed by:** `queueFilterOperation()` and `processPendingFilterOperations()`

---

#### Pattern: queueFilterOperation Function

**Pattern type:** Queue management function  
**Line number:** 7942-7947  
**Code snippet:**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

window.queueFilterOperation = queueFilterOperation;
```

**Context:**
- **Purpose:** Add operation to queue for later execution
- **Parameters:**
  - `operation`: Function to execute
  - `description`: String for debugging
- **Usage examples:**
  - Line 8088: `queueFilterOperation(applyImportedPrefs, 'importPreferences')`
  - Line 8148: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode')`

---

#### Pattern: processPendingFilterOperations Function

**Pattern type:** Queue processing function  
**Line number:** 7952-7975  
**Code snippet:**
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

window.processPendingFilterOperations = processPendingFilterOperations;
```

**Context:**
- **Purpose:** Execute queued operations after smart ordering completes
- **Safety features:**
  - Early exit if queue is empty
  - Array copy to prevent modification during iteration
  - Try-catch for error isolation
  - Clear queue before processing

---

## Pattern Type 5: Guard Wrapper Functions

### 5.1 External Module Wrappers

#### Pattern: guardWrapper Function

**Pattern type:** Guard wrapper for deferment  
**Location:** `/home/coding/vista/src/public/filter-guard-wrapper.js:47-62`  
**Code snippet:**
```javascript
function guardWrapper(handlerName, handlerFunction) {
  // Check if smart ordering is active
  if (typeof isSmartOrdering === 'function' && isSmartOrdering()) {
    // Queue the operation for later execution
    if (typeof queueFilterOperation === 'function') {
      queueFilterOperation(handlerFunction, handlerName);
      if (typeof DEBUG_SMART_ORDERING !== 'undefined' && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active - operation queued`);
      }
    }
    return;
  }
  
  // Execute the handler logic immediately
  handlerFunction();
}
```

**Context:**
- **Purpose:** Automatically defer filter operations when smart ordering is active
- **Usage in app.js:** Line 7868 for `toggleFavorite`
- **Pattern:** Check-queue-or-execute wrapper

---

#### Pattern: guardWrapperWithRender Function

**Pattern type:** Guard wrapper for render-triggering handlers  
**Location:** `/home/coding/vista/src/public/filter-guard-wrapper.js:88-107`  
**Code snippet:**
```javascript
function guardWrapperWithRender(handlerName, handlerFunction) {
  return guardWrapper(handlerName, () => {
    handlerFunction();
    
    // Set filter guard and clear it after render
    if ('isFilterOperation' in globalThis || typeof isFilterOperation !== 'undefined') {
      isFilterOperation = true;
      setTimeout(() => { isFilterOperation = false; }, 0);
    }
    
    // Clear smart ordering active flag
    if ('isSmartOrderingActive' in globalThis || typeof isSmartOrderingActive !== 'undefined') {
      isSmartOrderingActive = false;
      if ('DEBUG_SMART_ORDERING' in globalThis && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active flag CLEARED (user manual override)`);
      }
    }
  });
}
```

**Context:**
- **Purpose:** For filter handlers that call `renderPreviews()`, sets guard flags
- **Usage in app.js:** Line 7978 for `toggleHidden`
- **Operations:**
  - Executes handler function
  - Sets `isFilterOperation` flag temporarily
  - Clears `isSmartOrderingActive` flag
  - Prevents order resets during render

---

## Pattern Type 6: Centralized Guard Functions

### 6.1 External Guard Utilities

#### Pattern: isSmartOrdering Function

**Pattern type:** Centralized guard function  
**Location:** `/home/coding/vista/src/public/guard-utils.js:39-46`  
**Code snippet:**
```javascript
function isSmartOrdering() {
  const prefs = window.platformPrefs || {};
  const userPreference = prefs.smartOrdering !== false;
  const runtimeState = window.isSmartOrderingActive || false;
  
  return userPreference && runtimeState;
}
```

**Context:**
- **Purpose:** Check if smart ordering is BOTH enabled AND currently active
- **Usage:** Used by `guardWrapper()` and throughout app.js (line 7933-7935, 8792)
- **Pattern:** Dual-condition check (preference + runtime)

---

#### Pattern: isFilterOperationInProgress Function

**Pattern type:** Runtime state check function  
**Location:** `/home/coding/vista/src/public/guard-utils.js:78-80`  
**Code snippet:**
```javascript
function isFilterOperationInProgress() {
  return window.isFilterOperation || false;
}
```

**Context:**
- **Purpose:** Check if filter operation is currently executing
- **Usage:** Prevent race conditions with filter operations
- **Pattern:** Centralized state accessor

---

## Pattern Type 7: Thread Safety Patterns

### 7.1 Smart Ordering Thread Safety

#### Pattern: applySmartOrderingSafe Function

**Pattern type:** Thread-safe smart ordering wrapper  
**Line number:** 8988-9040  
**Code snippet:**
```javascript
function applySmartOrderingSafe() {
  // If already applying, queue a pending application
  if (isApplyingSmartOrder) {
    console.log('[applySmartOrderingSafe] Already applying - queueing pending operation');
    pendingApplySmartOrder = true;
    return;
  }
  
  isApplyingSmartOrder = true;
  pendingApplySmartOrder = false;
  
  try {
    applySmartOrdering();
    isSmartOrderingActive = true;
    reorderPlatformCards();
    
    if (pendingApplySmartOrder) {
      setTimeout(applySmartOrderingSafe, 0);
    }
  } finally {
    isApplyingSmartOrder = false;
    
    if (pendingRenderData) {
      processPendingRender();
    }
  }
}
```

**Context:**
- **Purpose:** Ensure only one smart ordering operation runs at a time
- **Safety features:**
  - Guard flag check with early exit
  - Pending operation queue
  - Try-finally cleanup
  - Recursive call for pending operations
- **Pattern:** Thread-safe singleton pattern

---

## Summary Statistics

### Event Binding Counts

| Binding Type | Total Count | Filter-Related | Percentage |
|--------------|------------|----------------|------------|
| `addEventListener('change')` | 13 | 4 | 30.8% |
| `addEventListener('input')` | 2 | 2 | 100% |
| `addEventListener('click')` | 4 | 2 | 50% |
| **Total Filter Bindings** | **6** | **6** | **100%** |

### Handler Function Types

| Handler Type | Count | Examples |
|--------------|-------|----------|
| Named functions | 6 | `handleHeatmapSort`, `filterCommands`, `toggleFavorite` |
| Anonymous functions | 6 | Inline handlers for toggles and filters |
| Guard wrappers | 2 | `guardWrapper`, `guardWrapperWithRender` |

### Pattern Distribution

| Pattern Category | Count | Primary Purpose |
|------------------|-------|------------------|
| Native event listeners | 6 | Direct event handling |
| Guard flags | 3 | Race condition prevention |
| Queue system | 3 | Deferred operation execution |
| Function wrapping hooks | 2 | Behavior augmentation |
| Guard wrapper functions | 2 | Automatic deferment |
| Thread safety wrappers | 1 | Concurrent execution prevention |
| Central guard utilities | 2 | Cross-module state checking |

---

## Key Architectural Patterns

### 1. Native DOM Event Handling
- **No jQuery** for filter-related events
- **Consistent useCapture:** All default to false (bubbling phase)
- **Handler naming:** Mix of named and anonymous functions

### 2. Hierarchical Filtering
- **Master toggle pattern:** Group checkboxes control all children
- **Coordinated updates:** Parent ↔ child state synchronization
- **Shared handler functions:** Same functions called from multiple elements

### 3. Real-time vs. Deferred Feedback
- **Text inputs:** Use `input` events for immediate feedback
- **Checkboxes/dropdowns:** Use `change` events for commit-on-blur behavior
- **Debouncing:** 300ms timeout for editor inputs to prevent excessive re-renders

### 4. State Management
- **URL hash persistence:** What-If tag filters use `updateHash()`
- **In-memory state:** Platform filters maintain state via Sets
- **DOM-based state:** Most checkbox state stored in DOM and read when needed

### 5. Guard System
- **Filter operation guards:** Prevent smart order resets during filter changes
- **Queue and defer:** Execute operations after smart ordering completes
- **Thread safety:** Prevent concurrent execution conflicts

---

## Related Documentation

- **Bead bf-35h7f:** addEventListener filter patterns detailed documentation
- **Bead bf-3lc34:** Filter-change hooks and custom event patterns
- **Bead bf-40qdd:** on* event handler pattern search results
- **Bead bf-3fu65:** addHook filter-change pattern search results
- **Bead bf-52b8f:** Filter-change hook patterns comprehensive guide
- **Bead bf-6cvpa:** Comprehensive filter change event bindings report

---

## Usage Notes

This catalog serves as the definitive reference for all filter-change event listener patterns in the VISTA application. When modifying or adding filter handlers:

1. **Use native `addEventListener()`** - No jQuery for filters
2. **Follow established patterns** - Match existing handler style
3. **Add guard functions** if the handler affects smart ordering
4. **Consider URL persistence** for user-visible state changes
5. **Use named functions** for better debugging and stack traces
6. **Consider debouncing** for high-frequency events like text input
7. **Use guard wrappers** for operations that modify platform state

---

**Catalog Version:** 1.0  
**Status:** Complete and Verified  
**Next Review:** When new handlers are added to app.js  
**Compiled from beads:** bf-35h7f, bf-3lc34, bf-40qdd, bf-3fu65, bf-52b8f, bf-6cvpa  
**Bead:** bf-ihvg1  
**Generated:** 2026-07-24
