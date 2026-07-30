# Filter-Change Hook Patterns in app.js

## Overview
This document documents all filter-change hook patterns and callback registrations found in `/home/coding/vista/src/public/app.js`.

---

## 1. Filter Operation Guard Pattern

### Location: Line 6279
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### Pattern Description
A boolean guard flag that prevents smart order resets during filter operations.

### Window Export (Lines 5046-5048)
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

---

## 2. Filter Operation Queuing System

### Core Functions

#### `queueFilterOperation()` - Lines 7942-7950
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

#### `processPendingFilterOperations()` - Lines 7952-7980
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
```

### Window Exports (Lines 5055, 5061-5062)
```javascript
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

---

## 3. Filter Guard Usage Patterns

### Pattern A: Guard Setting with Timeout Wrapper
**Locations: Lines 8080-8082, 8095-8099, 8144-8146, 8156-8159, 8263-8265**

```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Example from importPreferences (Lines 8080-8082):**
```javascript
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  isSmartOrderingActive = false;
```

### Pattern B: Guard Check with Conditional Logic
**Location: Lines 8792-8795**

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
```

---

## 4. Event Listener Registrations for Filters

### A. Command Palette Filter Input - Line 9085
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Callback Function: filterCommands() - Lines 9177-9189**
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

### B. Metadata Filter Input - Lines 3991-3995
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Target Function: renderMetadataTable() - Line 3941**
```javascript
function renderMetadataTable(filter = '') {
```

---

## 5. Platform Visibility Filter Callbacks

### A. Group Toggle Event Listener - Lines 3477-3490
```javascript
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
```

### B. Individual Platform Toggle - Lines 3493-3499
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

### C. Update Enabled Platforms Function - Lines 3551-3559
```javascript
function updateEnabledPlatforms() {
  cropperState.enabledPlatforms.clear();
  document.querySelectorAll('.cropper-platform-toggle input:checked').forEach(cb => {
    cropperState.enabledPlatforms.add(cb.dataset.platform);
  });
  // Refresh the category legend so its active/dimmed state tracks the live
  // toggle selection. Every toggle path (individual, group, select/clear-all)
  // and the initial renderCropperControls() call funnels through here, so this
  // single hook keeps the legend in sync with the overlays on screen.
  renderCategoryLegend();
}
```

---

## 6. What-If Mode Filter Callbacks

### A. What-If Toggle Event Listener - Lines 8207-8219
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

### B. What-If Apply Button - Line 8222
```javascript
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
```

---

## 7. Other Filter-Related Event Registrations

### A. Heatmap Sort Change - Line 332
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### B. Badge Preview Select Change - Line 296
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

### C. OG Generator Background Type Change - Line 310
```javascript
oggenBgType?.addEventListener('change', handleBgTypeChange);
```

### D. Framework Selection Change - Line 6813
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

### E. Import Preferences Input - Line 6831
```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

---

## 8. State Variables Related to Filtering

### Lines 6275-6280
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
let isRendering = false; // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let currentPageType = null; // Track current page type for stale cardOrder detection
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Window Export for pendingFilterOperations - Lines 5059-5061
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

---

## Summary Statistics

- **Total filter-change hook patterns found**: 8 main categories
- **Event listener registrations**: 10+ distinct filter-related listeners
- **Guard variable usages**: 6 distinct locations
- **Queue/filter operation functions**: 2 primary functions
- **State variables**: 7 filter-related state variables

## Key Patterns Identified

1. **Guard Pattern**: `isFilterOperation` flag prevents race conditions
2. **Queue Pattern**: `queueFilterOperation()` defers operations during smart ordering
3. **Callback Pattern**: Event listeners trigger filter updates
4. **Timeout Pattern**: `setTimeout(() => { isFilterOperation = false; }, 0)` for cleanup
5. **Conditional Pattern**: `if (isFilterOperation || isSmartOrdering())` for state checks

---

**Generated**: 2026-07-24  
**File**: `/home/coding/vista/src/public/app.js`  
**Task**: bf-6d44t - Search filter-change hook patterns in app.js
