# Filter-Change Hook Patterns and Custom Event Emitters in app.js

## Overview

This document catalogs all filter-change hook patterns, callback registrations, custom event emitters, and bus patterns related to filters found in `/home/coding/vista/src/public/app.js`.

**Search Date:** 2026-08-24
**File Analyzed:** `src/public/app.js` (392KB)
**Related Files:** `src/public/filter-guard-wrapper.js`, `src/public/guard-utils.js`

---

## Summary of Findings

The application uses a centralized guard-based pattern for filter-change operations rather than traditional event emitters or publish/subscribe patterns. The filter-change system is designed to prevent conflicts between user filter operations and an automated "smart ordering" feature.

### Key Patterns Found:
1. **Guard Flag Pattern** - `isFilterOperation` boolean flag
2. **Guard Wrapper Pattern** - `guardWrapper()` and `guardWrapperWithRender()` functions
3. **Operation Queue Pattern** - `pendingFilterOperations` array
4. **Direct Event Listener Pattern** - Simple addEventListener for input filtering
5. **Debugging Hook Pattern** - Window object property exposure

---

## Pattern 1: Guard Flag Pattern

### Location
- **Line 6761:** `isFilterOperation` variable declaration

### Code Snippet
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### Purpose
Prevents smart ordering logic from resetting card order during user-initiated filter operations.

### Usage Pattern
```javascript
// Set guard before filter operation
isFilterOperation = true;
renderPreviews(currentData);

// Clear guard after operation (async with setTimeout(0))
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Usage Locations
| Line | Context | Description |
|------|---------|-------------|
| 8562 | `importPreferences` | Guards render during preference import |
| 8578 | `importPreferences` | Alternative guard set location |
| 8626 | Unknown | Guard set for filter operation |
| 8638 | Unknown | Guard set for filter operation |
| 8745 | Unknown | Guard set for filter operation |

### Guard Check Pattern
**Line 9274:** Conditional check that respects the guard
```javascript
if (isFilterOperation || isSmartOrdering()) {
    // Skip cardOrder clearing
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    // ... skip logic
}
```

---

## Pattern 2: Guard Wrapper Pattern

### Module Location
- **File:** `src/public/filter-guard-wrapper.js`
- **Status:** **NOT loaded in index.html** - appears to be missing from script tags

### Functions Defined

#### `guardWrapper(handlerName, handlerFunction)`
**Location:** filter-guard-wrapper.js, lines 47-62

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

**Purpose:** Wraps filter change handlers to automatically defer execution when smart ordering is active.

#### `guardWrapperWithRender(handlerName, handlerFunction)`
**Location:** filter-guard-wrapper.js, lines 88-107

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

**Purpose:** Variant that automatically sets `isFilterOperation` guard for handlers that trigger `renderPreviews()`.

### Usage in app.js

**Line 8350:** Usage in `toggleFavorite()`
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

**Line 8460:** Usage in `toggleHidden()`
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

---

## Pattern 3: Operation Queue Pattern

### State Variables
**Lines 6763, 6764:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Queue Functions

#### `queueFilterOperation(operation, description)`
**Location:** app.js, lines 8424-8429

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

#### `processPendingFilterOperations()`
**Location:** app.js, lines 8434-8457

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

### Usage Example
**Lines 8562-8570:** Queuing in `importPreferences()`
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

---

## Pattern 4: Direct Event Listener Pattern

### Filter Input Event Listener
**Lines 4417-4422:** Direct addEventListener for metadata filter input

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Purpose:** Filters the metadata table based on user input without any guard logic - this is a simple UI filter that doesn't affect card ordering.

---

### Command Palette Filter
**Line 9567:** Event listener for command palette filtering

```javascript
input.addEventListener('input', filterCommands);
```

**Line 9659:** Filter handler function

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

**Purpose:** Filters command palette options based on search query - independent of card ordering system.

---

## Pattern 5: Window Object Exposure (Debugging Hooks)

### Location
**Lines 5472-5479:** Property definitions on window object

```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Purpose:** Exposes internal state to window object for debugging and testing.

### Additional Exposed Functions
**Lines 5481-5482:**
```javascript
window.isSmartOrdering = isSmartOrdering;
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

---

## Related State Variables

### Smart Ordering State
**Lines 6755-6763:**
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

---

## Architecture Notes

### No Traditional Event Bus Found
The application does **NOT** use traditional event bus or publish/subscribe patterns for filter changes. Instead, it uses:

1. **Guard flags** to prevent operation conflicts
2. **Queue pattern** to defer operations during smart ordering
3. **Direct function calls** wrapped in guard logic
4. **Boolean state variables** to track operation phases

### Smart Ordering System
The entire filter-change guard system exists to support a "smart ordering" feature that automatically reorders platform cards based on page type detection. The guard system prevents:
- User filter operations from conflicting with automated reordering
- Concurrent render operations
- Stale card order data

### Missing Script Tag Issue
**⚠️ POTENTIAL BUG:** The `filter-guard-wrapper.js` file exists in `src/public/` but is **NOT included** in `index.html` script tags. The `guardWrapper` and `guardWrapperWithRender` functions are used in `app.js` but should fail to execute if the module isn't loaded.

**Current script load order in index.html:**
```html
<script src="guard-utils.js"></script>
<script src="app.js"></script>
```

**Possible explanations:**
1. The functions are inlined into app.js during build (not observed in source)
2. The script tag is missing and the code fails silently
3. The functions are defined elsewhere and not yet discovered in this search

---

## Filter-Change Hook Inventory

| Hook Pattern | Line(s) | Function | Handler | Guard Type |
|--------------|---------|----------|---------|------------|
| addEventListener | 4419 | anonymous | renderMetadataTable | None (simple UI filter) |
| addEventListener | 9567 | filterCommands | command palette filter | None (independent filter) |
| guardWrapper | 8350 | toggleFavorite | favorites toggle | isSmartOrdering() check |
| guardWrapperWithRender | 8460 | toggleHidden | hidden platforms toggle | isFilterOperation + isSmartOrderingActive |
| isFilterOperation set | 8562, 8578, 8626, 8638, 8745 | Various | filter operations | Boolean guard flag |
| queueFilterOperation | 8570, others | Various | deferred operations | Queue pattern |

---

## Event Flow Diagram

```
User Action (e.g., toggleHidden)
         │
         ▼
guardWrapperWithRender('toggleHidden', handler)
         │
         ├──▶ isSmartOrdering() active?
         │         │
         │         ├── Yes ──▶ queueFilterOperation(handler, 'toggleHidden')
         │         │               │
         │         │               └──▶ Add to pendingFilterOperations[]
         │         │
         │         └── No ──▶ Execute handler immediately
         │                       │
         │                       ├──▶ Update platformPrefs.hidden
         │                       ├──▶ savePlatformPrefs()
         │                       ├──▶ updateHiddenList()
         │                       └──▶ renderPreviews(currentData)
         │
         └──▶ Set isFilterOperation = true
              │
              └──▶ setTimeout(() => isFilterOperation = false, 0)
                   │
                   └──▶ Clear isSmartOrderingActive = false
```

---

## Recommendations

1. **Add filter-guard-wrapper.js to index.html** - The file exists but isn't loaded, which could cause runtime errors when `guardWrapper` or `guardWrapperWithRender` are called.

2. **Consider consolidating guard utilities** - Both `guard-utils.js` and `filter-guard-wrapper.js` handle similar guard logic. They could be merged into a single module.

3. **Document the smart ordering system** - The relationship between filter operations and smart ordering is complex and would benefit from dedicated documentation.

4. **Add integration tests** - The guard wrapper queue system has complex timing dependencies that should be tested.

---

**Document Generated:** 2026-08-24
**Search Scope:** app.js filter-change hooks and custom patterns
**Related Files:** filter-guard-wrapper.js, guard-utils.js, index.html
