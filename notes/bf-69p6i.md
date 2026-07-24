# Filter Change Handler Catalog (bf-69p6i)

## Overview
This document catalogs all filter change handlers in `/home/coding/vista/src/public/app.js` and identifies which ones perform order reset operations.

## Filter Change Handlers Found

### 1. `toggleFavorite(pid)` - Line 7867
**Status:** ✅ ALREADY WRAPPED with `guardWrapper('toggleFavorite', ...)`
**Performs order reset:** YES (clears `isSmartOrderingActive` flag)
**Current behavior:**
- Adds/removes platform from favorites set
- Saves platform preferences
- Updates favorites list UI
- Clears smart ordering active flag (user manual override)

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

---

### 2. `toggleHidden(pid)` - Line 7977
**Status:** ✅ ALREADY WRAPPED with `guardWrapperWithRender('toggleHidden', ...)`
**Performs order reset:** YES (calls `renderPreviews()`)
**Current behavior:**
- Adds/removes platform from hidden set
- Saves platform preferences
- Updates hidden list UI
- Re-renders previews with hiding applied

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

### 3. `toggleWhatIfMode()` - Line 8121
**Status:** ❌ NOT WRAPPED (manually manages `isFilterOperation` flag)
**Performs order reset:** YES (calls `renderPreviews()`)
**Current behavior:**
- Toggles What If mode on/off
- Shows/hides What If panel
- When turning OFF: manually sets `isFilterOperation = true` and calls `renderPreviews()`
- Has logic to queue operation when smart ordering is active (but doesn't use `queueFilterOperation` properly)
- Manually clears `isFilterOperation` flag via `setTimeout(..., 0)`

**Current code (lines 8155-8159):**
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Issues:**
- Manual flag management instead of using `guardWrapper` utility
- Has queue logic but inconsistent implementation
- Duplicates pattern that `guardWrapper` abstracts

---

### 4. `applyWhatIfChanges()` - Line 8241
**Status:** ❌ NOT WRAPPED (manually manages `isFilterOperation` flag)
**Performs order reset:** YES (calls `renderPreviews()`)
**Current behavior:**
- Creates modified metadata with disabled tags removed
- Re-renders previews with modified data
- Manually sets `isFilterOperation = true`
- Shows missing tag warnings
- Closes What If panel
- Shows toast notification

**Current code (lines 8263-8265):**
```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Issues:**
- Manual flag management instead of using `guardWrapperWithRender` utility
- Duplicates pattern that `guardWrapperWithRender` abstracts

---

### 5. `applyWhatIfChanges()` via `applyPendingWhatIfTags()` - Line 8286
**Status:** ❌ NOT WRAPPED (called from unwrapped function)
**Performs order reset:** YES (calls `applyWhatIfChanges()` which calls `renderPreviews()`)

---

### 6. `resetWhatIfToggles()` - Line 8233
**Status:** ❌ NOT WRAPPED (does NOT perform order reset)
**Performs order reset:** NO (only updates DOM and calls `updateHash()`)
**Current behavior:**
- Resets all checkbox states to checked
- Clears disabled tags set
- Updates hash to clear disabled tags

**Note:** This handler does NOT call `renderPreviews()`, so it doesn't need the guard wrapper.

---

## Guard Wrapper Utilities Available

### `guardWrapper(name, operation)`
- For operations that modify filter state but don't need to render
- Handles smart ordering deferral automatically
- Uses `queueFilterOperation()` when smart ordering is active

### `guardWrapperWithRender(name, operation)`
- For operations that modify filter state AND call `renderPreviews()`
- Handles smart ordering deferral automatically
- Sets `isFilterOperation = true` before calling render
- Uses `queueFilterOperation()` when smart ordering is active

---

## Recommendation: First Handler to Wrap

**Target:** `toggleWhatIfMode()` (Line 8121)

**Rationale:**
1. First unwrapped handler (in source order) that performs order reset
2. Good proof of concept - demonstrates both queue logic and render guard pattern
3. Clear manual flag management pattern to replace with utility
4. Smaller scope than `applyWhatIfChanges()` (which has more side effects)

**Current Issues:**
- Manual `isFilterOperation` flag management (lines 8156-8159)
- Manual `setTimeout` for clearing flag
- Has partial queue logic but incomplete implementation

**Proposed Fix:**
Replace manual flag management with `guardWrapperWithRender('toggleWhatIfMode', ...)` for the OFF path render call.

---

## Handlers Already Wrapped (✅ Complete)
- `toggleFavorite` → uses `guardWrapper`
- `toggleHidden` → uses `guardWrapperWithRender`

## Handlers Still Needing Wrap (❌ TODO)
- `toggleWhatIfMode` → should use `guardWrapperWithRender` (PRIORITY)
- `applyWhatIfChanges` → should use `guardWrapperWithRender` (SECONDARY)
- `resetWhatIfToggles` → NO WRAP NEEDED (no order reset)

## Event Listener Attachments
- `toggleFavorite`: Line 8008 (favorites list remove button)
- `toggleHidden`: Line 8030 (hidden list remove button)  
- `toggleWhatIfMode`: Line 8334 (What If toggle button)
- `applyWhatIfChanges`: Line 8220 (What If panel "Update Previews" button)
- `resetWhatIfToggles`: Line 8219 (What If panel "Reset All" button)

---

## Notes
- All filter change handlers that call `renderPreviews()` should use `guardWrapperWithRender`
- Handlers that only modify state but don't render should use `guardWrapper`
- The guard utilities automatically manage `isFilterOperation` flag and handle queueing during smart ordering
