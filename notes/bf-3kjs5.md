# Filter Change Handler Patterns in app.js

## Overview
Comprehensive search results for all filter change event handlers and related patterns found in `/home/coding/vista/src/public/app.js`.

## Core Filter Operation Infrastructure

### 1. Filter Operation Guard Flag (Line 6279)
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```
- **Purpose**: Prevents smart order resets during filter operations
- **Used by**: Multiple filter handlers to guard against cardOrder clearing

### 2. Pending Filter Operations Queue (Line 6281)
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```
- **Purpose**: Queues filter operations when smart ordering is active
- **Used by**: `queueFilterOperation()` function

### 3. Global Object Property Exports (Lines 5046-5052)
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
window.queueFilterOperation = queueFilterOperation;
```
- **Purpose**: Exposes filter operation state to global scope for debugging

### 4. queueFilterOperation Function (Line 7942)
```javascript
function queueFilterOperation(operation, description) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```
- **Purpose**: Centralized function to queue filter operations during smart ordering
- **Called by**: `importPreferences()`, `toggleWhatIfMode()`

### 5. processPendingFilterOperations Function (Line 7953)
```javascript
if (pendingFilterOperations.length === 0) {
  return;
}
console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
pendingFilterOperations = []; // Clear queue
```
- **Purpose**: Executes queued filter operations after smart ordering completes

## Filter Change Event Handlers

### 6. Metadata Table Filter Input (Lines 3989-3992)
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```
- **Event**: `input`
- **Purpose**: Filters metadata table rows by tag/value
- **Handler**: `renderMetadataTable(filter)`

### 7. Command Palette Filter (Line 9085)
```javascript
input.addEventListener('input', filterCommands);
```
- **Event**: `input`
- **Purpose**: Filters command palette items
- **Handler**: `filterCommands(e)` (Line 9177)

### 8. filterCommands Function (Line 9177)
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
- **Purpose**: Filters command list by label/category
- **Triggers**: Re-renders command palette with filtered results

## Platform/Group Filter Handlers

### 9. Group Checkbox Toggle Handler (Lines 3480-3490)
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
- **Event**: `change`
- **Purpose**: Toggles all platforms in a group
- **Chain**: updateEnabledPlatforms() → updateCropperOverlay() → syncGroupToggles()

### 10. Individual Platform Toggle Handler (Lines 3497-3500)
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```
- **Event**: `change`
- **Purpose**: Toggles individual platform visibility
- **Chain**: updateEnabledPlatforms() → updateCropperOverlay() → syncGroupToggles()

### 11. Select All Platforms Handler (Lines 3514-3521)
```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```
- **Event**: `click`
- **Purpose**: Enables all platform checkboxes
- **Chain**: syncGroupToggles() → updateEnabledPlatforms() → updateCropperOverlay()

## Helper Functions for Filter Handlers

### 12. updateEnabledPlatforms Function (Line 3551)
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
- **Purpose**: Updates `cropperState.enabledPlatforms` Set based on checked checkboxes
- **Side effect**: Calls `renderCategoryLegend()` to update UI

### 13. syncGroupToggles Function (Line 3530)
```javascript
function syncGroupToggles(groups) {
  groups.forEach(group => {
    const groupCb = document.querySelector(`.cropper-group-toggle[data-group="${group.id}"]`);
    if (!groupCb) return;
    const children = group.platforms
      .map(pid => document.querySelector(`input[data-platform="${pid}"]`))
      .filter(Boolean);
    if (!children.length) return;
    const checkedCount = children.filter(cb => cb.checked).length;
    if (checkedCount === 0) {
      groupCb.checked = false;
      groupCb.indeterminate = false;
    } else if (checkedCount === children.length) {
      groupCb.checked = true;
      groupCb.indeterminate = false;
    } else {
      groupCb.indeterminate = true;
    }
  });
}
```
- **Purpose**: Syncs group checkbox state (checked/unchecked/indeterminate) with child platform checkboxes

### 14. renderCategoryLegend Function (Line 3568)
```javascript
function renderCategoryLegend() {
  if (!cropperCategoryLegend) return;
  // ... (renders category legend with active/dimmed states)
}
```
- **Purpose**: Renders platform category legend, dimming categories with no enabled platforms

### 15. updateCropperOverlay Function (Line 3600)
```javascript
function updateCropperOverlay() {
  // ... (updates crop overlay rectangles based on enabled platforms)
}
```
- **Purpose**: Updates the visual crop overlay on the image

## Filter Operation Guard Usage

### 16. importPreferences Function (Lines 8057-8088)
```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);

function importPreferences(e) {
  // ... (file reading logic)
  
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    setTimeout(() => { isFilterOperation = false; }, 0);
    // ... (apply prefs)
  };
  
  if (isSmartOrdering()) {
    queueFilterOperation(applyImportedPrefs, 'importPreferences');
  } else {
    applyImportedPrefs();
  }
}
```
- **Event**: `change` (file input)
- **Purpose**: Imports platform preferences from JSON
- **Guard**: Sets `isFilterOperation = true` during apply

### 17. toggleWhatIfMode Function (Lines 8121-8148)
```javascript
function toggleWhatIfMode() {
  // ... (mode toggle logic)
  
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    setTimeout(() => { isFilterOperation = false; }, 0);
    // ... (reset croppers)
  };
  
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  // ... (rest of toggle logic)
}

document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```
- **Event**: `click`
- **Purpose**: Toggles what-if mode and resets croppers
- **Guard**: Sets `isFilterOperation = true` during apply

### 18. Smart Order Clear Protection (Lines 8792-8794)
```javascript
if (isFilterOperation || isSmartOrdering()) {
  return; // Skip clearing
  const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
}
```
- **Purpose**: Prevents cardOrder clearing during filter operations

## Additional Input/Change Event Listeners (Non-Filter)

### 19. Other Change/Input Handlers (for context)
- Line 296: `badgeStyleSelect?.addEventListener('change', updateBadgePreview)`
- Line 310: `oggenBgType?.addEventListener('change', handleBgTypeChange)`
- Lines 311-323: Multiple OG generator input/change handlers
- Line 332: `heatmapSort?.addEventListener('change', handleHeatmapSort)`
- Line 6801: `input.addEventListener('input', handleEditorInput)`
- Line 6813: `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet)`
- Line 8207: `cb.addEventListener('change', ...)` (cropper-related)

## Summary

All identified filter change handler patterns:

1. **Direct filter input handlers**: 
   - Metadata table filter (line 3991)
   - Command palette filter (line 9085)

2. **Platform/group filter handlers**:
   - Group checkbox toggle (line 3481)
   - Individual platform toggle (line 3497)
   - Select all platforms (line 3514)

3. **Filter operation infrastructure**:
   - `isFilterOperation` guard flag (line 6279)
   - `pendingFilterOperations` queue (line 6281)
   - `queueFilterOperation()` function (line 7942)
   - `processPendingFilterOperations()` function (line 7953)

4. **Helper functions**:
   - `updateEnabledPlatforms()` (line 3551)
   - `syncGroupToggles()` (line 3530)
   - `renderCategoryLegend()` (line 3568)
   - `updateCropperOverlay()` (line 3600)

5. **Guarded operations**:
   - `importPreferences()` (line 8057)
   - `toggleWhatIfMode()` (line 8121)
   - Smart order clear protection (line 8792)
