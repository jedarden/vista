# Filter-Change Hook Patterns in Vista app.js

## Overview
This document catalogs all filter-change hook patterns found in `/home/coding/vista/src/public/app.js`.

## Pattern Categories

### 1. Direct Event Listener Patterns

#### 1.1 Metadata Table Filter (Line 3988-3994)
**Location:** Lines 3988-3994
**Pattern:** Direct `addEventListener` with input event
```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```
**Context:** Filters metadata table rows by tag name or value

#### 1.2 Command Palette Filter (Line 9085)
**Location:** Line 9085
**Pattern:** `addEventListener` with input event calling dedicated filter function
```javascript
input.addEventListener('input', filterCommands);
```
**Context:** Filters command palette items by label or category
**Function:** `filterCommands()` at lines 9177-9192
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

### 2. Guard Flag Pattern

#### 2.1 Filter Operation Guard Flag (Line 6279)
**Location:** Line 6279
**Pattern:** Global guard flag to prevent smart order resets during filter operations
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

#### 2.2 Guard Flag Usage in Smart Ordering (Lines 8790-8796)
**Location:** Lines 8790-8796
**Pattern:** Conditional check to preserve cardOrder during filter changes
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
  // ... preserve cardOrder
}
```

#### 2.3 Guard Flag with Timeout Pattern (Multiple locations)
**Pattern:** Set guard flag, render, then clear after zero timeout
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```
**Found at:**
- Line 8080-8082: Import preferences
- Line 8096-8099: Import preferences (alternative path)
- Line 8144-8146: What If toggle mode
- Line 8156-8158: What If toggle mode (alternative path)
- Line 8263-8265: Apply What If changes

### 3. Queue Pattern

#### 3.1 Pending Filter Operations Queue (Lines 6281, 7942-7975)
**Location:** Line 6281 (declaration), Lines 7942-7975 (implementation)
**Pattern:** Queue operations during smart ordering, execute after completion

**Declaration:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Queue Function (Lines 7942-7947):**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Process Function (Lines 7952-7975):**
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

#### 3.2 Queue Usage Example (Lines 8075-8092)
**Location:** Lines 8075-8092
**Pattern:** Check if smart ordering active, queue operation if so
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

### 4. What If Mode Filter Patterns

#### 4.1 What If Toggle Change Listeners (Lines 8207-8216)
**Location:** Lines 8207-8216
**Pattern:** Checkbox change listeners tracking disabled tags
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

#### 4.2 Apply What If Changes (Lines 8263-8265)
**Location:** Lines 8263-8265
**Pattern:** Filter operation guard with modified data rendering
```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### 5. Property Definition Pattern

#### 5.1 Pending Filter Operations Exposure (Lines 5050-5052)
**Location:** Lines 5050-5052
**Pattern:** Object.defineProperty for debug access
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

## Summary Statistics

- **Total patterns found:** 8 distinct pattern categories
- **Event listener patterns:** 2 (metadata filter, command palette filter)
- **Guard flag patterns:** 5 (declaration + 4 usage sites)
- **Queue patterns:** 3 (declaration, queue function, process function)
- **What If mode patterns:** 2 (toggle listeners, apply changes)

## Key Patterns

1. **Direct Event Listener** - Simple `addEventListener('input', callback)` for immediate filtering
2. **Guard Flag** - `isFilterOperation` boolean to prevent race conditions during smart ordering
3. **Queue Pattern** - `pendingFilterOperations` array to defer operations during smart ordering
4. **Timeout Pattern** - `setTimeout(() => { isFilterOperation = false; }, 0)` to clear guard after render
5. **Modified Data Rendering** - Filter operations that transform data before re-rendering

## Related Context

- These patterns interact with the smart ordering system to prevent card order resets
- All filter operations use guard flags or queueing to avoid race conditions
- The `renderPreviews()` function is the common entry point for filter-triggered updates
- Hash-based state management preserves filter state across page loads

## Search Methodology

- Searched for: `addHook`, `onFilterChange`, `filter-change`, `addEventListener.*filter`, `filter.*change`, `change.*filter`
- Found patterns through event listener searches and filter-related variable tracking
- Documented all patterns with line numbers, code snippets, and contextual usage
