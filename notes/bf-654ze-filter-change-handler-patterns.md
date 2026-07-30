# Filter Change Handler Patterns in app.js

## Analysis Overview
Based on the structure analysis from bead bf-59o8g, this document identifies all filter change handler patterns and naming conventions used in `/home/coding/vista/src/public/app.js`.

## Naming Pattern Categories

### 1. `handle*` Pattern Functions
These are explicit handler functions that respond to user interactions:

- `handleBgTypeChange()` (line 5106) - Handles OG Generator background type changes
- `handleBgImageUpload(e)` (line 5117) - Handles background image uploads
- `handleLogoPosChange()` (line 5133) - Handles logo position changes
- `handleLogoUpload(e)` (line 5140) - Handles logo uploads
- `handleHeatmapSort()` (line 6101) - Handles heatmap sorting changes
- `handleEditorInput(e)` (line 6589) - Handles editor input changes
- `handleSwapUrls()` (line 5499) - Handles URL swapping in compare mode
- `handleCommandKeydown(e)` (line 9194) - Handles command palette keyboard navigation
- `handleDragStart/End/Over/Enter/Leave/Drop(e)` (lines 9532-9565) - Drag and drop handlers
- `handleTouchStart/End/Move(e)` (lines 9828-9888) - Touch event handlers
- `handleHorizontalSwipe(deltaX, card)` (line 9908) - Horizontal swipe handler
- `handleVerticalSwipe(deltaY, card)` (line 9969) - Vertical swipe handler
- `handleContextMenuAction(e)` (line 9771) - Context menu action handler

### 2. `update*` Pattern Functions
Functions that update state or UI in response to changes:

- `updateHash(options)` (line 404) - Updates URL hash state
- `updateDiagnostics(data)` (line 900) - Updates diagnostic display
- `updatePreviewsWithImages(data)` (line 1930) - Updates previews with image data
- `updateCardHeader(pid)` (line 2186) - Updates platform card header
- `updateOggenCanvas()` (line 5156) - Updates OG Generator canvas
- `updateEditorFieldImpactLabels(data)` (line 6322) - Updates editor impact labels
- `updateEditorCharCounts()` (line 6382) - Updates character counts in editor
- `updateEditedCardsInPlace(data)` (line 6708) - Updates cards with edits
- `updatePreviewsWithEdits()` (line 6737) - Updates previews after edits
- `updateColumnLayoutUI()` (line 7859) - Updates column layout UI
- `updateBadgePreview()` (line 4765) - Updates badge preview
- `updateEnabledPlatforms()` (line 3551) - Updates enabled platforms in cropper
- `updateCropperOverlay()` (line 3600) - Updates cropper visual overlays
- `updateFavoritesList()` (line 7990) - Updates favorites list
- `updateHiddenList()` (line 8012) - Updates hidden platforms list
- `updateCommandActiveDescendant()` (line 9170) - Updates command palette active item

### 3. `toggle*` Pattern Functions
Functions that toggle binary states:

- `toggleGlobalTheme()` (line 108) - Toggles light/dark theme
- `toggleCardContext(pid, data)` (line 2162) - Toggles platform card context mode
- `toggleCardTheme(pid, data)` (line 2175) - Toggles card theme (light/dark)
- `toggleCharGaugeGroup(groupId)` (line 6529) - Toggles character gauge group visibility
- `toggleAllCharGauges(fieldId)` (line 6549) - Toggles all character gauges for a field
- `toggleFavorite(pid)` (line 7867) - Toggles platform favorite status
- `toggleHidden(pid)` (line 7977) - Toggles platform hidden status
- `toggleWhatIfMode()` (line 8121) - Toggles What If mode
- `toggleCommandPalette()` (line 9105) - Toggles command palette visibility

### 4. `sync*` Pattern Functions
Functions that synchronize state across components:

- `syncGroupToggles(groups)` (line 3530) - Syncs group checkbox states with platform toggles
- `syncInlineEditToEditor(tag, value)` (line 8385) - Syncs inline edits to editor form

### 5. `apply*` Pattern Functions
Functions that apply changes or transformations:

- `applyTheme(theme)` (line 94) - Applies theme to document
- `applyRescore()` (line 6669) - Applies re-scoring to all platforms
- `applyTemplate(templateId)` (line 7634) - Applies meta tag template
- `applyWhatIfChanges()` (line 8241) - Applies What If tag exclusions
- `applyPendingWhatIfTags()` (line 8286) - Applies pending What If tag changes
- `applyDiagnosticFix(index)` (line 8478) - Applies diagnostic fix
- `applySmartOrdering()` (line 8744) - Applies smart platform ordering
- `applySmartOrderingSafe()` (line 8988) - Safe version of smart ordering

### 6. `filter*` Pattern Functions
Specialized filtering functions:

- `filterCommands(e)` (line 9177) - Filters command palette items based on search input
- `renderMetadataTable(filter = '')` (line 3941) - Renders metadata table with optional filter
- Inline filter in metadata viewer (line 3991): `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); })`

### 7. Filter Operation Management Functions
Centralized guard functions for filter operations during smart ordering:

- `shouldDeferFilterOperation()` (line 7891) - Checks if filter operation should be deferred
- `isSmartOrdering()` (line 7933) - Checks if smart ordering is active
- `queueFilterOperation(operation, description)` (line 7942) - Queues filter operations during smart ordering
- `processPendingFilterOperations()` (line 7952) - Processes queued filter operations after smart ordering completes

## Inline Event Handler Patterns

### Change Event Listeners
Common pattern for select/radio/checkbox changes:

```javascript
// OG Generator controls
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);

// Heatmap sorting
heatmapSort?.addEventListener('change', handleHeatmapSort);

// Badge generation
badgeStyleSelect?.addEventListener('change', updateBadgePreview);

// Code snippets
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);

// Preferences import
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

### Input Event Listeners (for real-time filtering)
Pattern for text input filtering:

```javascript
// Metadata filter (line 3991)
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});

// Command palette search (line 9085)
input.addEventListener('input', filterCommands);
```

### Group/Platform Toggle Patterns
Checkbox change handlers with coordinated updates:

```javascript
// Cropper group toggles (line 3481)
groupCb.addEventListener('change', (e) => {
  // Update child checkboxes
  platforms.forEach(pid => {
    const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
    if (platformCb) platformCb.checked = e.target.checked;
  });
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});

// Individual platform toggles (line 3497)
cb.addEventListener('change', () => {
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});

// What If tag toggles (line 8207)
cb.addEventListener('change', () => {
  if (!cb.checked) {
    disabledTags.add(cb.dataset.tag);
  } else {
    disabledTags.delete(cb.dataset.tag);
  }
  updateHash();
});
```

## Filter Handler Coordination Pattern

### Smart Ordering Guard Pattern
Centralized pattern for handling filter operations during smart ordering:

```javascript
function myFilterHandler() {
  if (isSmartOrdering()) {
    queueFilterOperation(myFilterHandler, 'myFilterHandler');
    return;
  }
  // Proceed with filter operation
}
```

### Example from queueFilterOperation (line 7942):
```javascript
/**
 * Queue a filter operation to be processed after smart ordering completes
 * @param {Function} operation - The filter operation function to execute later
 * @param {string} description - Description of the operation for debugging
 */
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

## Naming Convention Summary

### Primary Handler Patterns:
1. **`handle*`** - Direct event handlers (handleBgTypeChange, handleHeatmapSort)
2. **`update*`** - State/UI updates (updateEnabledPlatforms, updateCropperOverlay)
3. **`toggle*`** - Binary state changes (toggleFavorite, toggleHidden)
4. **`sync*`** - State synchronization (syncGroupToggles, syncInlineEditToEditor)
5. **`apply*`** - Change application (applyRescore, applyTemplate)
6. **`filter*`** - Filtering operations (filterCommands, renderMetadataTable)

### Change Detection Patterns:
- **`*Change`** suffix (handleBgTypeChange, handleLogoPosChange)
- **`*Input(e)`** pattern (handleEditorInput, handleBgImageUpload)
- **`*Upload(e)`** pattern (handleLogoUpload, handleBgImageUpload)
- **`*Sort()`** pattern (handleHeatmapSort)

### Event Type Patterns:
- **`change`** events - For form elements (select, checkbox, radio)
- **`input`** events - For real-time text filtering
- **`click`** events - For button actions and toggle switches

## Line Number Reference

### Key Handler Functions by Line Number:
- 94: `applyTheme(theme)`
- 108: `toggleGlobalTheme()`
- 404: `updateHash(options)`
- 900: `updateDiagnostics(data)`
- 2162: `toggleCardContext(pid, data)`
- 2175: `toggleCardTheme(pid, data)`
- 2186: `updateCardHeader(pid)`
- 3530: `syncGroupToggles(groups)`
- 3551: `updateEnabledPlatforms()`
- 3600: `updateCropperOverlay()`
- 3941: `renderMetadataTable(filter = '')`
- 4765: `updateBadgePreview()`
- 5106: `handleBgTypeChange()`
- 5117: `handleBgImageUpload(e)`
- 5133: `handleLogoPosChange()`
- 5140: `handleLogoUpload(e)`
- 5156: `updateOggenCanvas()`
- 5499: `handleSwapUrls()`
- 6101: `handleHeatmapSort()`
- 6322: `updateEditorFieldImpactLabels(data)`
- 6382: `updateEditorCharCounts()`
- 6529: `toggleCharGaugeGroup(groupId)`
- 6549: `toggleAllCharGauges(fieldId)`
- 6589: `handleEditorInput(e)`
- 6669: `applyRescore()`
- 6708: `updateEditedCardsInPlace(data)`
- 6737: `updatePreviewsWithEdits()`
- 7634: `applyTemplate(templateId)`
- 7859: `updateColumnLayoutUI()`
- 7867: `toggleFavorite(pid)`
- 7891: `shouldDeferFilterOperation()`
- 7933: `isSmartOrdering()`
- 7942: `queueFilterOperation(operation, description)`
- 7952: `processPendingFilterOperations()`
- 7977: `toggleHidden(pid)`
- 7990: `updateFavoritesList()`
- 8012: `updateHiddenList()`
- 8121: `toggleWhatIfMode()`
- 8241: `applyWhatIfChanges()`
- 8286: `applyPendingWhatIfTags()`
- 8385: `syncInlineEditToEditor(tag, value)`
- 8478: `applyDiagnosticFix(index)`
- 8610: `updateDiagnosticProgress()`
- 8744: `applySmartOrdering()`
- 8988: `applySmartOrderingSafe()`
- 9105: `toggleCommandPalette()`
- 9170: `updateCommandActiveDescendant()`
- 9177: `filterCommands(e)`
- 9194: `handleCommandKeydown(e)`

## Conclusion

The app.js file uses consistent naming patterns for filter change handlers:
- **`handle*`** for direct event handlers
- **`update*`** for state/UI updates
- **`toggle*`** for binary state changes
- **`sync*`** for state synchronization
- **`apply*`** for applying changes
- **`filter*`** for filtering operations

The codebase also demonstrates sophisticated coordination patterns for handling filter operations during asynchronous operations (smart ordering), using a queue-based system to defer and process filter changes safely.
