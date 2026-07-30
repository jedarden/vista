# Filter Change Handler Patterns in app.js

## Search Results Summary

This document catalogs all filter change event handlers and related patterns found in `/home/coding/vista/src/public/app.js`.

## Direct Filter Change Event Handlers

### 1. Metadata Filter Input Handler (Line 3991)
```javascript
// Line 3988-3994
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern**: Direct `addEventListener` with `input` event on `metadataFilterInput`  
**Handler**: Calls `renderMetadataTable(e.target.value)` with filter value  
**Location**: Inside metadata table rendering logic  
**Line numbers**: 3988-3994

### 2. Command Palette Filter Handler (Line 9085)
```javascript
// Line 9085
input.addEventListener('input', filterCommands);
```

**Pattern**: `addEventListener` with `input` event on command palette input  
**Handler**: Calls `filterCommands(e)` function  
**Location**: Inside command palette initialization  
**Line numbers**: 9085, 9177-9192

**Handler Function Definition (Lines 9177-9192)**:
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

## Filter Operation Guard System

The app implements a comprehensive filter operation guard system to prevent smart order resets during filter changes.

### State Variables (Line 6279-6281)

```javascript
// Line 6279
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

// Line 6281
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Global Property Exports (Lines 5046-5055)

```javascript
// Lines 5046-5049: Export isFilterOperation
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

// Lines 5050-5053: Export pendingFilterOperations
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

// Line 5055: Export queueFilterOperation
window.queueFilterOperation = queueFilterOperation;
```

### Filter Operation Queue Function (Lines 7942-7947)

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

### Filter Operation Guard Usage Examples

**1. Import Preferences (Lines 8077-8099)**
```javascript
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

isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**2. Toggle What If Mode (Lines 8142-8159)**
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

**3. What If Panel Toggle (Lines 8263-8265)**
```javascript
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Guard Check in applySmartOrdering (Lines 8790-8797)

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
}
```

## Related Functions Called by Filter Handlers

### renderMetadataTable Function (Line 3941)

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders filtered metadata table
}
```

**Called by**: Line 3992 (metadata filter input handler)  
**Purpose**: Filters and renders metadata table based on search query

### renderPreviews Function (Line 1583)

```javascript
function renderPreviews(data) {
  // P1 - Concurrent Render Race fix: Prevent multiple simultaneous renders
  if (isRendering) {
    if (DEBUG_SMART_ORDERING) {
      console.log('[renderPreviews] Already rendering - queueing with latest data');
    }
    pendingRenderAfterCurrent = data;
    return;
  }
  
  // P0 - Race condition fix: Queue render if smart ordering is in progress
  if (isApplyingSmartOrder) {
    if (DEBUG_SMART_ORDERING) {
      console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
    }
    pendingRenderData = data;
    return;
  }
  // ... renders platform preview cards
}
```

**Called by**: Filter operation handlers (with `isFilterOperation` guard)  
**Purpose**: Renders platform preview cards with guard flags to prevent race conditions

## Other Event Listener Bindings (For Context)

While not directly filter-related, these patterns show similar input/change event handling:

```javascript
// Line 6801: Editor input handler
input.addEventListener('input', handleEditorInput);

// Line 6831: Import preferences handler  
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);

// Line 6813: Framework change handler
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

## Summary of Filter Change Handler Patterns

1. **Direct Input Filtering**: 2 primary filter input handlers (metadata + command palette)
2. **Guard Flag System**: `isFilterOperation` flag prevents smart order resets during filter operations
3. **Queue System**: `queueFilterOperation()` queues filter ops during smart ordering
4. **Debouncing**: Editor uses debounced preview updates (300ms timeout)
5. **Race Condition Prevention**: Multiple guard flags (`isFilterOperation`, `isRendering`, `isApplyingSmartOrder`)

## Key Lines Reference

- **3988-3994**: Metadata filter input handler
- **3941-3992**: renderMetadataTable function
- **6279**: isFilterOperation guard flag
- **6281**: pendingFilterOperations queue
- **7942-7947**: queueFilterOperation function
- **8077-8099**: Import preferences with filter guard
- **8142-8159**: Toggle What If mode with filter guard
- **8263-8265**: What If panel with filter guard
- **8790-8797**: Guard check in applySmartOrdering
- **9085**: Command palette filter input handler
- **9177-9192**: filterCommands function

Total filter-related lines in app.js: **103**
Total event listeners with input/change events: **~25**
