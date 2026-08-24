# Filter-Change Event Listener Patterns in app.js

## Overview

This document describes filter-change event listener patterns found in `src/public/app.js` that don't fit the `addHook` or `onFilterChange` categories. These patterns represent alternative approaches to handling filter changes and user interactions.

## Patterns Found

### 1. Direct addEventListener for Filter Input

**Location:** Lines 4417-4422
**Pattern:** Inline event listener attached to filter input element

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context:** Used for the metadata table filter in the JSON-LD viewer. The filter allows users to search through metadata tags by name or value.

**Purpose:** Real-time filtering of metadata rows as the user types.

---

### 2. Command Palette Filter Input

**Location:** Line 9567
**Pattern:** Event listener for command palette command filtering

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Handler:** Lines 9659-9674
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

**Context:** Part of the command palette UI (triggered by Cmd/Ctrl+K). Allows users to search through available commands.

**Purpose:** Filters command list based on query text matching command labels or categories.

---

### 3. Toggle Event Listeners (Platform Filtering)

**Locations:**
- `toggleFavorite` click handlers: Line 8490
- `toggleHidden` click handlers: Line 8512

**Pattern:** Click event listeners attached to platform toggle buttons

```javascript
// Update favorites list
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});

// Update hidden platforms list
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

**Context:** Used in the platform preferences UI for managing favorite and hidden platforms.

**Purpose:** Allows users to add/remove platforms from favorites or hidden lists by clicking remove buttons.

---

### 4. What If Mode Checkbox Change Listeners

**Location:** Lines 8688-8698
**Pattern:** Checkbox change event listeners for tag toggling

```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
});
```

**Context:** Part of the "What If Mode" feature that allows users to disable specific Open Graph tags to see fallback behavior.

**Purpose:** Tracks which tags are disabled for what-if analysis and updates the URL hash accordingly.

---

### 5. Guard Wrapper Pattern

**Locations:**
- `guardWrapper` usage: Line 8350 (in `toggleFavorite`)
- `guardWrapperWithRender` usage: Line 8460 (in `toggleHidden`)

**Pattern:** Wrapper functions that protect filter operations during smart ordering

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
  });
}

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

**Module:** `src/public/filter-guard-wrapper.js`

**Context:** These wrappers prevent conflicts between filter operations and the smart ordering feature by checking if smart ordering is active and queuing operations if necessary.

**Purpose:**
- `guardWrapper`: Defers filter operations when smart ordering is active
- `guardWrapperWithRender`: Same as `guardWrapper` but also sets the `isFilterOperation` guard flag during renders

---

### 6. Global Guard Flags and Queue System

**Locations:**
- Flag definitions: Lines 6761-6763
- Window exports: Lines 5472-5482
- Queue function: Line 8424
- Process queue function: Line 8434

**Pattern:** Global state management for filter operation queuing

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Exported to window for cross-module access
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Context:** Part of the smart ordering conflict prevention system. When smart ordering is active, filter operations are queued and executed after the ordering completes.

**Purpose:** Coordinates filter operations with smart ordering to prevent race conditions and state inconsistencies.

---

### 7. What If Toggle Button

**Location:** Line 8816
**Pattern:** Click handler for What If mode toggle button

```javascript
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

**Context:** Toggles the What If mode feature that allows users to simulate scenarios with specific Open Graph tags disabled.

**Purpose:** Enables/disables What If mode and updates the UI accordingly.

---

## Summary

The filter-change event listener patterns in app.js can be categorized as follows:

1. **Direct Event Listeners:** Inline `addEventListener` calls for input/change events on filter controls
2. **Toggle Handlers:** Click listeners on buttons that modify platform visibility/favorites
3. **Guard Wrappers:** Wrapper functions that protect filter operations during smart ordering
4. **Queue System:** Global state management for deferring filter operations during smart ordering
5. **What If Mode:** Checkbox change listeners and toggle button for tag simulation

These patterns work together to provide a robust filtering system that handles user interactions while preventing conflicts with other features like smart ordering.
