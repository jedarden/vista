# Other Filter-Change Event Listener Patterns in app.js

This document catalogues filter-change event listener patterns in `/home/coding/vista/src/public/app.js` that don't fit the `addHook` or `onFilterChange` categories.

## 1. Metadata Table Filter Pattern

**Lines:** 3988-3995
**Context:** `renderMetadataTable(filter)` function

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Purpose:** Live filtering of metadata table rows by tag name or value. Direct input event listener that re-renders the table with filtered results.

**Related code:** Lines 3941-3978 - The filter logic that checks both tag names and values against the filter query.

---

## 2. Command Palette Filter Pattern

**Lines:** 9085, 9177-9191
**Context:** Command palette UI

```javascript
// Event listener attachment (line 9085)
input.addEventListener('input', filterCommands);

// Filter function (lines 9177-9191)
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

**Purpose:** Filters command palette commands by label or category. Direct array filtering with live updates.

---

## 3. Filter Operation Guard Pattern

**Lines:** 6279-6281, 7942-7975
**Context:** Smart ordering coordination system

### State Variables

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Queue Function (lines 7942-7947)

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

### Process Function (lines 7952-7975)

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

**Purpose:** Coordinates filter operations during smart ordering to prevent race conditions. Operations are queued during smart ordering and executed after completion.

---

## 4. What-If Mode Filter Pattern

**Lines:** 8121-8275
**Context:** What-If panel for simulating tag removal

### Toggle Function (lines 8121-8162)

```javascript
function toggleWhatIfMode() {
  whatIfMode = !whatIfMode;

  const btn = document.getElementById('whatIfToggleBtn');
  if (btn) {
    btn.classList.toggle('active', whatIfMode);
    btn.textContent = whatIfMode ? '✓ What If On' : '🔍 What If';
  }

  if (whatIfMode) {
    showWhatIfPanel();
  } else {
    // Clear What If state
    disabledTags.clear();
    // ... panel removal code ...

    if (currentData) {
      // Check if smart ordering is active - defer operation if so
      if (isSmartOrdering()) {
        const applyWhatIfReset = () => {
          isFilterOperation = true;
          renderPreviews(currentData);
          setTimeout(() => { isFilterOperation = false; }, 0);
        };
        queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
        // ...
        return;
      }

      // Set guard flag to prevent smart order resets during filter operation
      isFilterOperation = true;
      renderPreviews(currentData);
      // Clear flag after render (renderPreviews will handle timing)
      setTimeout(() => { isFilterOperation = false; }, 0);
    }
  }
}
```

### Apply Changes Function (lines 8262-8265)

```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Enables users to simulate metadata tag removal. Uses filter operation guards to prevent smart ordering interference during re-render.

---

## 5. Platform Selection Checkbox Pattern

**Lines:** 3446-3516
**Context:** Image cropper controls

### Select All/Clear All (lines 3504-3516)

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

### Group Toggle Change (lines 3495-3502)

```javascript
groupCb.addEventListener('change', (e) => {
  const checked = e.target.checked;
  // Update all platforms in this group
  group.platforms.forEach(pid => {
    const cb = document.querySelector(`input[data-platform="${pid}"]`);
    if (cb) cb.checked = checked;
  });
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```

### Individual Platform Toggle (lines 3497-3501)

```javascript
cb.addEventListener('change', () => {
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```

**Purpose:** Controls which platforms are visible/enabled in the image cropper. Batch operations (select all/clear all) and individual checkbox changes.

---

## 6. Smart Ordering Filter Guards Pattern

**Lines:** 1547-1556, 1597-1604, 1641-1688
**Context:** Rendering during smart ordering operations

### Render Skeletons Guard (lines 1547-1556)

```javascript
// Use custom order if available and smart ordering is not in progress
// Otherwise use default group order to prevent race conditions
let platforms = group.platforms;
if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder) {
  const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
  const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
  platforms = [...customOrder, ...newPlatforms];
  // ... logging ...
} else if (isApplyingSmartOrder && DEBUG_SMART_ORDERING) {
  console.log(`[renderSkeletons] Group ${group.id}: skipping cardOrder during smart ordering, using default:`, platforms);
}
```

### Render Previews Guard (lines 1597-1604)

```javascript
// P0 - Race condition fix: Queue render if smart ordering is in progress
if (isApplyingSmartOrder) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
  }
  // Store the latest data to render after smart ordering completes
  pendingRenderData = data;
  return; // Skip rendering during smart ordering to prevent race conditions
}
```

**Purpose:** Prevents race conditions by queuing or skipping render operations during active smart ordering. Uses guard flags to coordinate access to shared state.

---

## 7. Drag-and-Drop Filter Pattern

**Lines:** 9520-9660
**Context:** Platform card reordering via drag and drop

### Drag Event Listeners (lines 9523-9529)

```javascript
function initCardDragAndDrop() {
  const cards = document.querySelectorAll('.platform-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);
  });
}
```

### Smart Ordering Guard in Drop Handler (lines 9570-9580)

```javascript
// RC-002 Race Condition Fix: Reject drag operations during smart ordering
if (isApplyingSmartOrder) {
  if (DEBUG_SMART_ORDERING) {
    console.warn('[handleDrop] Smart ordering in progress - rejecting drop to prevent race condition');
  }
  // Prevent the drop and return early
  if (e.preventDefault) {
    e.preventDefault();
  }
  return false;
}
```

**Purpose:** Enables manual platform reordering via drag and drop. Rejects drops during smart ordering to prevent race conditions. Clears smart ordering active flag on successful user reorder.

---

## 8. Import Preferences Filter Pattern

**Lines:** 8075-8106
**Context:** User preference import

```javascript
if (currentData) {
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
    // ...
    return;
  }

  // Set guard flag to prevent smart order resets during filter operation
  isFilterOperation = true;
  renderPreviews(currentData);
  // Clear flag after render (renderPreviews will handle timing)
  setTimeout(() => { isFilterOperation = false; }, 0);

  // Clear smart ordering active flag since user manually imported preferences
  isSmartOrderingActive = false;
  // ... logging ...
}
```

**Purpose:** Imports user platform preferences. Uses filter operation guards and queueing to coordinate with smart ordering.

---

## Summary of Filter-Change Patterns

| Pattern | Type | Lines | Purpose |
|---------|------|-------|---------|
| Metadata Table Filter | Direct input listener | 3988-3995 | Live filtering of metadata rows |
| Command Palette Filter | Direct input listener | 9085, 9177-9191 | Command filtering by label/category |
| Filter Operation Guard | Guard flags + queue | 6279-6281, 7942-7975 | Coordinates filters during smart ordering |
| What-If Mode Filter | Toggle + apply guards | 8121-8275 | Tag removal simulation |
| Platform Selection | Checkbox change listeners | 3446-3516 | Platform visibility in cropper |
| Smart Ordering Guards | Render guards | 1547-1556, 1597-1604, etc. | Prevents race conditions during smart ordering |
| Drag-and-Drop | Drag event listeners | 9520-9660 | Manual platform reordering |
| Import Preferences | File input + guards | 8075-8106 | Preference import coordination |

All patterns include coordination with the smart ordering system to prevent race conditions and ensure consistent state.
