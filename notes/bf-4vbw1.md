# Other Filter-Change Event Listener Patterns in app.js

## Task
Search for other filter-change event listener patterns that don't fit the addHook or onFilterChange categories.

## Patterns Found

### 1. Metadata Filter Input Event Listener (Lines 3988-3992)

**Context:** Metadata table filtering functionality  
**Purpose:** Real-time filtering of metadata rows based on user input

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern:** Standard `input` event listener that triggers a re-render with the filter value.

---

### 2. Filter Operation Guard Flag Pattern (Lines 6279, 5046-5048, 8080-8082, 8096-8099, 8144-8146, 8156-8159, 8263-8265)

**Context:** Smart ordering integration to prevent conflicts  
**Purpose:** Guard flag to prevent smart order resets during filter operations

```javascript
// Declaration (line 6279)
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

// Exposure (lines 5046-5048)
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

// Usage pattern (multiple locations)
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Pattern:** Boolean flag set before filter operations, checked in renderPreviews to skip smart ordering resets.

---

### 3. Queue Filter Operation Pattern (Lines 6281, 5050-5052, 5055-5056, 7942-7973)

**Context:** Smart ordering integration to defer operations  
**Purpose:** Queue filter operations during active smart ordering to prevent conflicts

```javascript
// Declaration (line 6281)
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Exposure (lines 5050-5052, 5055-5056)
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;

// Queue function (lines 7942-7946)
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

// Process function (lines 7952-7973)
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

**Pattern:** Queue-based deferment pattern for filter operations during smart ordering.

---

### 4. Toggle Hidden with Guard Wrapper (Lines 7977-8013)

**Context:** Platform hiding/showing functionality  
**Purpose:** Toggle platform visibility with guard wrapper

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

**Pattern:** Filter operation wrapped in guardWrapperWithRender for consistency and safety.

---

### 5. Toggle Favorite with Guard Wrapper (Lines 7867-7882)

**Context:** Platform favoriting functionality  
**Purpose:** Toggle platform favorites with guard wrapper

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
    // Note: Does NOT re-render previews - favorites-only mode is handled separately
  });
}
```

**Pattern:** Filter operation wrapped in guardWrapper (no re-render needed).

---

### 6. Card Context Toggle Event Listeners (Lines 1995, 2092, 2162-2174)

**Context:** Platform card rendering mode switching  
**Purpose:** Toggle between card-only and in-context rendering

```javascript
// Event listener attachment (lines 1995, 2092)
contextToggle.addEventListener('click', () => toggleCardContext(pid, data));

// Implementation (lines 2162-2174)
function toggleCardContext(pid, data) {
  cardContextState[pid].context = !cardContextState[pid].context;
  const body = document.getElementById(`card-body-${pid}`);
  if (body) {
    if (cardContextState[pid].context) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme, data.dominantColor);
    } else {
      body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl, data.dominantColor);
    }
  }
  updateCardHeader(pid);
}
```

**Pattern:** Direct DOM manipulation toggling between two rendering modes.

---

### 7. Card Theme Toggle Event Listeners (Lines 2001, 2096, 2175-2184)

**Context:** Platform card theme switching  
**Purpose:** Toggle between dark and light theme for cards

```javascript
// Event listener attachment (lines 2001, 2096)
themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));

// Implementation (lines 2175-2184)
function toggleCardTheme(pid, data) {
  cardContextState[pid].theme = cardContextState[pid].theme === 'dark' ? 'light' : 'dark';
  if (cardContextState[pid].context) {
    const body = document.getElementById(`card-body-${pid}`);
    if (body) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme);
    }
  }
  updateCardHeader(pid);
}
```

**Pattern:** Direct DOM manipulation toggling theme mode.

---

### 8. Platform Selection Checkbox Event Listeners (Lines 3481-3517)

**Context:** Platform cropper dialog functionality  
**Purpose:** Enable/disable platforms for screenshot cropping

```javascript
// Group header toggle (lines 3481-3492)
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

// Individual platform toggle (lines 3497-3502)
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});

// Select all platforms (lines 3504-3509)
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});

// Clear all platforms (lines 3511-3516)
document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Pattern:** Checkbox change events triggering state updates and UI refreshes.

---

### 9. Card Context Menu Event Listener (Lines 2005, 2100, 9721-9980)

**Context:** Right-click context menu for platform cards  
**Purpose:** Show context menu with additional options

```javascript
// Event listener attachment (lines 2005, 2100)
existingCard.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, group.id, data));
card.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, groupId, data));

// Implementation (line 9721)
function showCardContextMenu(e, pid, groupId, data) {
  // Shows context menu with options like:
  // - Toggle visibility (toggleHidden)
  // - Toggle favorite (toggleFavorite)
  // - Toggle context mode (toggleCardContext)
  // - Toggle theme (toggleCardTheme)
  // - Open in new tab
  // - Copy URL
  // - Screenshot
}
```

**Pattern:** Contextmenu event showing a popup menu with filter-related options.

---

### 10. Suggestion Chip Event Listeners (Lines 337-340, 373-377)

**Context:** URL suggestion chips for quick mode switching  
**Purpose:** Click handlers for suggestion chips

```javascript
// Sitemap chips (lines 337-340)
document.querySelectorAll('.chip[data-sitemap]').forEach(chip => {
  chip.addEventListener('click', () => {
    sitemapInput.value = chip.dataset.sitemap;
    // ... handle sitemap submission
  });
});

// URL example chips (lines 373-377)
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    urlInput.value = chip.dataset.url;
    // ... handle URL inspection
    inspectUrl(chip.dataset.url);
  });
});
```

**Pattern:** Click handlers on suggestion chips for quick input.

---

## Summary

Found **10 distinct filter-change event listener patterns** in app.js:

1. **Metadata filter input** - Real-time filtering (input event)
2. **Filter operation guard flag** - Prevents smart ordering conflicts
3. **Queue filter operation** - Defers operations during smart ordering
4. **Toggle hidden** - Platform visibility with guard wrapper
5. **Toggle favorite** - Platform favoriting with guard wrapper
6. **Card context toggle** - Rendering mode switching (click event)
7. **Card theme toggle** - Theme switching (click event)
8. **Platform selection checkboxes** - Enable/disable platforms (change event)
9. **Card context menu** - Right-click menu with filter options (contextmenu event)
10. **Suggestion chips** - Quick input suggestions (click event)

All patterns use standard DOM event listeners (addEventListener) with various event types:
- `input` - Real-time filtering
- `click` - Toggle operations
- `change` - Checkbox state changes
- `contextmenu` - Right-click menus

The patterns integrate with smart ordering through guard flags and operation queuing to prevent conflicts during async operations.
