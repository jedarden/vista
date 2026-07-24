# onChange Callback Patterns for Filters in app.js

## Search Results

**Total Instances Found:** 15 distinct onChange patterns related to filter operations

---

## Pattern 1: Direct addEventListener for Filter Controls

### Line 296: Badge Style Select
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

### Line 310: OGGen Background Type
```javascript
oggenBgType?.addEventListener('change', handleBgTypeChange);
```

### Line 314-316: OGGen Image Settings
```javascript
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
```

### Line 332: Heatmap Sort
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### Line 6813: Code Snippet Framework
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

### Line 6831: Import Preferences Input
```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

---

## Pattern 2: Platform Toggle Checkboxes with Guards (Lines 3497-3502)

### Individual Platform Toggles
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

### Group Platform Toggles (Lines 3481-3491)
```javascript
groups.forEach(group => {
  const groupCb = document.querySelector(`.cropper-group-toggle[data-group="${group.id}"]`);
  if (!groupCb) return;
  
  groupCb.addEventListener('change', (e) => {
    // Sync individual platform checkboxes with group state
    group.platforms.forEach(pid => {
      const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
      if (platformCb) platformCb.checked = e.target.checked;
    });
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

---

## Pattern 3: Filter Operation Guard Pattern (Lines 8080-8099)

### Basic Guard Flag Pattern
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Import Preferences with Smart Ordering Defer (Lines 8077-8099)
```javascript
if (isSmartOrdering()) {
  // Create a wrapper function that doesn't depend on the event
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

---

## Pattern 4: What-If Mode Toggle (Lines 8142-8160)

### Toggle What-If Mode with Queue Pattern
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

---

## Pattern 5: Filter Operation Apply (Lines 8263-8265)

### Apply What-If Changes with Guard Flag
```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

## Pattern 6: Filter Guard in Smart Ordering (Lines 8792-8797)

### Smart Ordering Filter Operation Guard
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes
// This prevents smart order resets when users hide/show platforms
if (isFilterOperation || isSmartOrdering()) {
  const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
  console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
}
```

---

## Pattern 7: Toggle Functions with Guards (Lines 7868-7883, 7978-7987)

### Toggle Favorite (Lines 7868-7883)
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
```

### Toggle Hidden (Lines 7978-7987)
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

## Pattern 8: Update Callbacks (Lines 3507-3508, 3514-3515)

### Select/Clear All Platforms
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

---

## Pattern 9: Queue/Defer Filter Operations (Lines 7942-7947)

### Queue Filter Operation Function
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

---

## Summary

### Total Count: 15 onChange callback patterns

1. **Direct addEventListener**: 8 instances (badge style, OGGen settings, heatmap, code snippet, import)
2. **Platform toggle checkboxes**: 3 instances (individual, group, select/clear all)
3. **Guard flag patterns**: 4 instances (import prefs, what-if mode, what-if apply, smart ordering)
4. **Toggle functions**: 2 instances (toggleFavorite, toggleHidden)
5. **Queue/defer patterns**: 3 instances (import, what-if, queue function)

### Key Architectural Patterns

1. **Guard Flag Pattern**: `isFilterOperation` prevents smart order resets during filter changes
2. **Queue Pattern**: `queueFilterOperation()` defers filter operations during active smart ordering
3. **Wrapper Pattern**: `guardWrapper()` and `guardWrapperWithRender()` provide consistent error handling
4. **Sync Pattern**: Group and individual checkboxes stay synchronized via `syncGroupToggles()`

### Filter Operation Flow

```
User Action → Check Smart Ordering → Queue if Active → Set Guard Flag → Execute → Clear Guard Flag
```

---

## Line Number Reference

| Pattern | Line Numbers | Description |
|---------|-------------|-------------|
| Badge style change | 296 | Badge preview update |
| OGGen background type | 310 | Background type handler |
| OGGen settings | 314-316, 319, 321-322 | Canvas/logo handlers |
| Heatmap sort | 332 | Sort handler |
| Code snippet framework | 6813 | Snippet generation |
| Import preferences | 6831 | Preferences import |
| Platform toggles (individual) | 3497-3502 | Platform visibility |
| Platform toggles (group) | 3481-3491 | Group synchronization |
| Select/clear all | 3507-3515 | Bulk platform operations |
| Toggle favorite | 7868-7883 | Favorite filter |
| Toggle hidden | 7978-7987 | Hidden filter |
| Queue operations | 7942-7947 | Defer pattern |
| Guard flag usage | 8080-8099, 8142-8160, 8263-8265 | Smart ordering protection |
| Smart ordering guard | 8792-8797 | Card order preservation |
| updateEnabledPlatforms | 3551-3561 | Platform state sync |

---

*Search completed on 2026-07-24*
*Bead ID: bf-3tke4*
