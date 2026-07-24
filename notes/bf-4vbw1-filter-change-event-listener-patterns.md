# Filter-Change Event Listener Patterns in app.js

## Overview
This document catalogs all filter-change event listener patterns found in `/home/coding/vista/src/public/app.js` that don't fit the standard `addHook` or `onFilterChange` categories.

---

## 1. Command Palette Filter (Lines 9085, 9177-9192)

### Event Listener Setup
```javascript
// Line 9085
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

### Filter Function
```javascript
// Lines 9177-9192
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

### Purpose
Filters the command palette options based on user input. Searches both command labels and categories. Resets selection to first item when filter changes.

### Context
- Part of the command palette feature (accessed via Cmd/Ctrl+K)
- Real-time filtering as user types
- No guard flags needed (doesn't affect platform ordering)

---

## 2. Metadata Table Filter (Lines 3989-3994)

### Event Listener Setup
```javascript
// Lines 3989-3994
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

### Purpose
Filters the metadata table rows based on user input. The `renderMetadataTable` function (line 3941) accepts an optional filter parameter.

### Context
- Used in the raw metadata panel
- Filters metadata tags displayed in the table
- Real-time filtering as user types
- No guard flags needed (doesn't affect platform ordering)

---

## 3. Filter Operation Guard Pattern (Lines 6279, 6281, 7885-7975)

### Guard Flag Declaration
```javascript
// Line 6279
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

// Line 6281
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Lines 5046-5049 (global access)
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

### Centralized Guard Functions

#### shouldDeferFilterOperation() (Lines 7891-7893)
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

#### isSmartOrdering() (Lines 7933-7935)
```javascript
/**
 * Centralized guard function that checks BOTH the user preference and runtime state
 * @returns {boolean} True if smart ordering is BOTH enabled AND currently active
 */
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

#### queueFilterOperation() (Lines 7942-7947)
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

#### processPendingFilterOperations() (Lines 7952-7975)
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

### Purpose
Provides a centralized guard mechanism to prevent smart order resets during filter operations. Uses a flag-based approach with queuing for operations that occur during active smart ordering.

---

## 4. Filter Operation Guard Usage Patterns

### Pattern A: Direct Guard (Line 8263)
```javascript
// Lines 8261-8265 (applyWhatIfChanges function)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Pattern B: With Smart Ordering Check (Lines 8076-8099)
```javascript
// importPreferences function
if (currentData) {
  // Check if smart ordering is active - defer operation if so
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
    if (DEBUG_SMART_ORDERING) {
      console.log('[importPreferences] Smart ordering active - operation queued');
    }
    return;
  }

  // Set guard flag to prevent smart order resets during filter operation
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

### Pattern C: Conditional Deferral (Lines 8140-8159)
```javascript
// toggleWhatIfMode function
if (currentData) {
  // Check if smart ordering is active - defer operation if so
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

  // Set guard flag to prevent smart order resets during filter operation
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

---

## 5. Guard Usage in Conditional Logic (Lines 8790-8795)

```javascript
// renderPreviews function - Platform visibility clearing logic
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[renderPreviews] Skipping platform order reset - reason: ${isFilterOperation ? 'filter operation in progress' : 'smart ordering is active'}`);
  }
  // Don't clear the cardOrder when applying filters
  return;
}
```

### Purpose
Prevents the platform order from being reset when a filter operation is in progress, preserving the user's custom ordering.

---

## Summary

### Event Listener Patterns Found
1. **Command Palette Filter** (Line 9085): Simple input event listener filtering command list
2. **Metadata Table Filter** (Lines 3989-3994): Input event listener filtering metadata rows

### Guard Mechanism Patterns
1. **Direct Guard Pattern**: Set `isFilterOperation = true`, execute operation, reset flag via `setTimeout`
2. **Smart Ordering Check Pattern**: Check `isSmartOrdering()`, queue operation if active
3. **Conditional Deferral Pattern**: Combine guard with smart ordering awareness

### Key Functions
- `isSmartOrdering()`: Centralized guard check (Lines 7933-7935)
- `queueFilterOperation()`: Queue operations during smart ordering (Lines 7942-7947)
- `processPendingFilterOperations()`: Execute queued operations (Lines 7952-7975)

### Usage Locations
- `importPreferences` (Lines 8076-8099)
- `toggleWhatIfMode` (Lines 8140-8159)
- `applyWhatIfChanges` (Lines 8261-8265)
- `renderPreviews` conditional logic (Lines 8790-8795)

### Notes
- No traditional `addHook` or `onFilterChange` patterns found in app.js
- Filter operations primarily use direct event listeners with guard flags
- Guard mechanism prevents interference with smart ordering feature
- Queuing system ensures filter operations are applied after smart ordering completes
