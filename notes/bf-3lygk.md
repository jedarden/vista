# Filter-Related Hook Patterns in Vista app.js

**Bead:** bf-3lygk
**Date:** 2026-07-24
**Search Scope:** All filter-related hook patterns in `/home/coding/vista/src/public/app.js`

---

## Summary

This document catalogs all filter-related hook patterns found in app.js that don't fit the previously documented categories (onFilterChange, filter-init, filter-update). The patterns identified here focus on **filter operation guards**, **filter input event listeners**, and **filter operation queueing**.

---

## Pattern 1: Filter Operation Guard System

### Purpose
Prevent smart order resets during filter changes by coordinating filter operations with smart ordering.

### Core Components

#### 1. Guard Flag: `isFilterOperation`
**Lines:** 6279, 5046-5049

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

**Usage Pattern:** Set to `true` before filter-related renders, reset to `false` with `setTimeout(() => { isFilterOperation = false; }, 0)`

#### 2. Filter Operation Queue: `pendingFilterOperations`
**Lines:** 6281, 5050-5053

```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

#### 3. Queue Function: `queueFilterOperation`
**Lines:** 7942-7947

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

#### 4. Process Function: `processPendingFilterOperations`
**Lines:** 7952-7975

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice(); // Copy array
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

#### 5. Guard Check: `shouldDeferFilterOperation`
**Lines:** 7891-7893

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

#### 6. Smart Ordering Check: `isSmartOrdering`
**Lines:** 7933-7934

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

---

## Pattern 2: Filter Input Event Listeners

### 2.1 Metadata Filter Input

**Lines:** 3988-3995

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context:** This is attached after `renderMetadataTable` creates the filter input field. The filter value is passed directly to `renderMetadataTable(filter)` which filters `allMetadataRows` by tag name or value.

**Related Function:** `renderMetadataTable(filter = '')` at line 3941

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders filtered rows
}
```

### 2.2 Command Palette Filter Input

**Lines:** 9085, 9177-9192

```javascript
// In command palette setup (line 9085)
input.addEventListener('input', filterCommands);

// Filter function (lines 9177-9192)
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

**Context:** Filters command palette commands by label or category. Updates selected index to 0 on each input.

---

## Pattern 3: Filter Operation Flag Usage

All filter operations follow this pattern:

```javascript
isFilterOperation = true;
renderPreviews(currentData);  // or renderPreviews(modifiedData)
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Locations

1. **Import Preferences** (lines 8080-8082)
   ```javascript
   const applyImportedPrefs = () => {
     isFilterOperation = true;
     renderPreviews(currentData);
     setTimeout(() => { isFilterOperation = false; }, 0);
     // ... additional cleanup
   };
   ```

2. **Import Preferences Direct** (lines 8096-8099)
   ```javascript
   isFilterOperation = true;
   renderPreviews(currentData);
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```

3. **What-If Reset** (lines 8144-8146)
   ```javascript
   const applyWhatIfReset = () => {
     isFilterOperation = true;
     renderPreviews(currentData);
     setTimeout(() => { isFilterOperation = false; }, 0);
   };
   ```

4. **Toggle What-If Mode** (lines 8156-8159)
   ```javascript
   isFilterOperation = true;
   renderPreviews(currentData);
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```

5. **What-If Tag Toggle** (lines 8263-8265)
   ```javascript
   isFilterOperation = true;
   renderPreviews(modifiedData);
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```

---

## Pattern 4: Filter Operation Guard Check

**Lines:** 8790-8797

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
} else {
  // ... normal cardOrder clearing logic
}
```

**Purpose:** Prevents smart order resets when users interact with filters or when smart ordering is active.

---

## Pattern 5: Filter Operation Queueing

When smart ordering is active, filter operations are queued instead of executing immediately.

### Import Preferences Example (lines 8077-8091)

```javascript
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
    // ... debug logging
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  // ... debug logging
  return;
}
```

### What-If Reset Example (lines 8142-8152)

```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  // ... debug logging
  return;
}
```

---

## Key Observations

1. **No traditional hook system:** Unlike the previously documented `onFilterChange` callbacks, these patterns use guard flags and operation queueing instead of a publish-subscribe hook system.

2. **Centralized coordination:** All filter operations coordinate through the `isFilterOperation` flag and `queueFilterOperation` function to prevent conflicts with smart ordering.

3. **Async flag reset:** The `setTimeout(() => { isFilterOperation = false; }, 0)` pattern ensures the flag stays set during the render call stack but resets before the next event loop.

4. **Global exposure via window:** Core guard functions and state are exposed on `window` for debugging and potential external access:
   - `window.isFilterOperation`
   - `window.pendingFilterOperations`
   - `window.queueFilterOperation`
   - `window.processPendingFilterOperations`
   - `window.isSmartOrdering`

5. **Filter operations are renders:** All filter operations ultimately call `renderPreviews()` to update the UI, making the guard flag critical to preventing render conflicts.

---

## Related Memory References

- [[apexalgo-iad-argocd-sync-broken]] - ArgoCD sync issues may affect deployment
- [[vista-image-fix-in-gitops]] - Vista image configuration in GitOps
