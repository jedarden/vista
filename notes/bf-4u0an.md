# Filter Change Handlers Analysis - bf-4u0an

## Task Summary
Located and parsed all filter change handlers in `/home/coding/vista/src/public/app.js`.

## File Structure Overview

**Location:** `/home/coding/vista/src/public/app.js` (367.1KB, 9,998 lines)

**Main filter-related sections:**
- Lines 3980-3995: Metadata filter input handler
- Lines 3481-3516: Platform cropper toggle handlers (group and individual)
- Lines 7867-7883: toggleFavorite handler
- Lines 7977-7988: toggleHidden handler
- Lines 7885-7905: Guard functions documentation
- Lines 7942-7975: Filter operation queue management
- Lines 8121+: toggleWhatIfMode and What If tag toggles
- Lines 8206-8215: What If panel tag toggles
- Line 9177+: filterCommands function

## Filter Change Handlers Catalog

### 1. **toggleFavorite(pid)** - Line 7867
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

**Pattern:** Uses `guardWrapper` to check smart ordering state before executing. Clears smart ordering active flag on user manual override.

**Attached to UI:** Line 8008 - favorites list remove buttons

**Exposed to window:** Line 5058

### 2. **toggleHidden(pid)** - Line 7977
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

**Pattern:** Uses `guardWrapperWithRender` to prevent order resets during render. Includes `renderPreviews` call to apply hiding immediately.

**Attached to UI:** Line 8030 - hidden list buttons

**Exposed to window:** Line 5057

### 3. **Metadata Filter Input** - Line 3991
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

**Pattern:** Simple event listener on input field that filters the metadata table. No guard wrapper needed as it doesn't affect smart ordering.

**Location:** Inside `renderMetadataTable` function (line 3941)

**UI Element:** `#metadataFilterInput` (line 3989)

### 4. **Platform Cropper Group Toggles** - Lines 3481-3491
```javascript
document.querySelectorAll('.cropper-group-toggle').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const groupId = e.target.dataset.groupId;
    const isChecked = e.target.checked;
    // Check/uncheck all platforms in the group
    document.querySelectorAll(`.cropper-platform-toggle input[data-group-id="${groupId}"]`)
      .forEach(input => input.checked = isChecked);
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles();
  });
});
```

**Pattern:** Event listeners on `.cropper-group-toggle` checkboxes that check/uncheck all platforms in a group.

**Calls:** `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

### 5. **Platform Cropper Individual Platform Toggles** - Lines 3496-3501
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(input => {
  input.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles();
  });
});
```

**Pattern:** Event listeners on individual platform checkboxes that update enabled platforms and overlays.

**Calls:** `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

### 6. **What If Panel Tag Toggles** - Lines 8206-8215
```javascript
document.querySelectorAll('.what-if-toggle input').forEach(input => {
  input.addEventListener('change', (e) => {
    const tag = e.target.dataset.tag;
    if (e.target.checked) {
      disabledTags.delete(tag);
    } else {
      disabledTags.add(tag);
    }
    updateHash();
  });
});
```

**Pattern:** Event listeners on `.what-if-toggle` checkboxes that add/remove tags from `disabledTags` Set.

**Calls:** `updateHash()`

### 7. **Select/Clear All Platforms** - Lines 3504-3516
```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(input => input.checked = true);
  syncGroupToggles();
  updateEnabledPlatforms();
  updateCropperOverlay();
});

document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(input => input.checked = false);
  syncGroupToggles();
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Pattern:** Event listeners on buttons that bulk check/uncheck all platform toggles.

**Calls:** `syncGroupToggles()`, `updateEnabledPlatforms()`, `updateCropperOverlay()`

### 8. **toggleWhatIfMode()** - Line 8121
```javascript
function toggleWhatIfMode() {
  // Manually checks isSmartOrdering() and queues operation if active
  // Toggles What If mode on/off
  // When clearing What If: calls renderPreviews(currentData) with guard flags
  // Direct implementation (no guard wrapper)
}
```

**Pattern:** Manually checks `isSmartOrdering()` and queues operation if active. Direct implementation without guard wrapper.

## Guard Wrapper Utility

**File:** `/home/coding/vista/src/public/filter-guard-wrapper.js`

### guardWrapper(handlerName, handlerFunction) - Line 47
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

**Purpose:** Checks if smart ordering is active via `isSmartOrdering()`. If active, queues operation for later execution. If not active, executes handler logic immediately.

**Used by:** `toggleFavorite`

### guardWrapperWithRender(handlerName, handlerFunction) - Line 88
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

**Purpose:** Variant of guardWrapper for handlers that trigger renderPreviews. Sets `isFilterOperation` flag to prevent order resets during render and clears smart ordering active flag after execution.

**Used by:** `toggleHidden`

## Queue Management Functions

### queueFilterOperation(operation, description) - Line 7942
```javascript
function queueFilterOperation(operation, description) {
  console.log(`[queueFilterOperation] Queuing: ${description}`);
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Queues filter operations when smart ordering is active.

**Exposed to window:** Line 5057

### processPendingFilterOperations() - Line 7952
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) return;
  console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);

  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];

  operations.forEach(({ operation, description }) => {
    try {
      operation();
      console.log(`[processPendingFilterOperations] Executed: ${description}`);
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```

**Purpose:** Executes queued operations after smart ordering completes.

**Exposed to window:** Line 5058

### shouldDeferFilterOperation() - Line 7891
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Check if filter operation should be deferred due to active smart ordering.

## Related Helper Functions

### savePlatformPrefs() - Line 7763
- Atomic read-modify-write with version checking (localStorage desync fix)
- Persists favorites, hidden, columnCount, smartOrdering, cardOrder, cardOrderMetadata

### updateFavoritesList() - Line 7990
- Rebuilds favorites list UI from `platformPrefs.favorites` Set
- Attaches click listeners calling `toggleFavorite(btn.dataset.pid)` - Line 8008

### updateHiddenList() - Line 8012
- Rebuilds hidden list UI from `platformPrefs.hidden` Set
- Attaches click listeners calling `toggleHidden(btn.dataset.pid)` - Line 8030

### renderPreviews() - Line 1583
- Main rendering function that applies filter state
- Respects `isFilterOperation` guard flag to prevent order resets

## Handler Organization Pattern

All filter handlers follow this structure:
1. Wrapped with guard functions to prevent smart ordering conflicts
2. Modify `platformPrefs` (favorites/hidden sets)
3. Call `savePlatformPrefs()` to persist changes
4. Update UI lists (`updateFavoritesList()`, `updateHiddenList()`)
5. Clear smart ordering active flag on user manual override
6. Optionally trigger `renderPreviews()` for immediate visual update

```javascript
function handlerName(pid) {
  guardWrapper('handlerName', () => {
    // 1. Modify state (platformPrefs.favorites/hidden/etc)
    // 2. Persist changes (savePlatformPrefs)
    // 3. Update UI (updateFavoritesList/updateHiddenList/renderPreviews)
    // 4. Clear smart ordering flags if applicable
  });
}
```

## Key State Variables

- `platformPrefs.favorites` - Set of favorited platform IDs
- `platformPrefs.hidden` - Set of hidden platform IDs
- `isFilterOperation` - Guard flag preventing smart order resets during filters (line 6279)
- `isSmartOrderingActive` - Runtime flag tracking smart ordering progress
- `disabledTags` - Set of tags disabled in What If mode
- `pendingFilterOperations` - Array of queued filter operations during smart ordering

## Complete Filter Handler Flow

```
User Action
  → Event Listener (UI element)
    → Filter Handler Function (toggleFavorite/toggleHidden/etc)
      → Guard Wrapper Check (isSmartOrdering active?)
        → If yes: Queue operation
        → If no: Execute immediately
          → Modify platformPrefs
          → Save preferences
          → Update UI lists
          → Clear smart ordering flag
          → Render if needed
```

## File Locations Summary

| Component | File | Lines |
|-----------|------|-------|
| toggleFavorite | app.js | 7867-7883 |
| toggleHidden | app.js | 7977-7988 |
| Metadata filter | app.js | 3991-3994 |
| Platform cropper group toggles | app.js | 3481-3491 |
| Platform cropper individual toggles | app.js | 3496-3501 |
| Select/clear all platforms | app.js | 3504-3516 |
| What If tag toggles | app.js | 8206-8215 |
| toggleWhatIfMode | app.js | 8121+ |
| filterCommands | app.js | 9177+ |
| Queue management | app.js | 7942-7975 |
| Guard wrappers | filter-guard-wrapper.js | 47-107 |
