# Filter Change Handlers in app.js

**Extracted:** 2026-07-24
**File:** `src/public/app.js`

## Overview
This document catalogs all filter change handler functions and their exact locations in app.js, grouped by their functional area.

---

## 1. Metadata Filter Handlers

### renderMetadataTable with inline filter listener
- **Location:** Line 3941-3994
- **Handler:** Anonymous function attached to `input` event
- **Trigger:** Text input in metadata filter
- **Code:**
  ```javascript
  // Line 3988-3994
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
  ```

---

## 2. Platform Visibility Toggles

### toggleFavorite
- **Location:** Line 7867-7883
- **Handler:** `toggleFavorite(pid)`
- **Trigger:** Click on favorite button (line 8008)
- **Wrapped with:** `guardWrapper`
- **Actions:**
  - Adds/removes PID from `platformPrefs.favorites` set
  - Saves platform preferences
  - Updates favorites list UI
  - Clears smart ordering active flag

### toggleHidden
- **Location:** Line 7977-7988
- **Handler:** `toggleHidden(pid)`
- **Trigger:** Click on hide button (line 8030)
- **Wrapped with:** `guardWrapperWithRender`
- **Actions:**
  - Adds/removes PID from `platformPrefs.hidden` set
  - Saves platform preferences
  - Updates hidden list UI
  - Re-renders previews to apply hiding

### updateFavoritesList
- **Location:** Line 7990-8010
- **Handler:** `updateFavoritesList()`
- **Actions:** Renders favorites list and attaches click handlers to remove buttons

### updateHiddenList
- **Location:** Line 8012-8032
- **Handler:** `updateHiddenList()`
- **Actions:** Renders hidden platforms list and attaches click handlers to remove buttons

---

## 3. What-If Mode Handlers

### toggleWhatIfMode
- **Location:** Line 8121-8162
- **Handler:** `toggleWhatIfMode()`
- **Trigger:** Click on what-if toggle button (line 8334)
- **Actions:**
  - Toggles what-if mode state
  - Shows/hides what-if panel
  - Clears disabled tags when turning off
  - Queues filter operation if smart ordering is active

### What-If Panel Checkbox Handlers
- **Location:** Line 8206-8216
- **Handler:** Anonymous change listener on what-if toggles
- **Trigger:** Checkbox state change in what-if panel
- **Actions:**
  - Adds/removes tags from `disabledTags` set
  - Updates hash to reflect disabled tags

### resetWhatIfToggles
- **Location:** Line 8233-8239
- **Handler:** `resetWhatIfToggles()`
- **Trigger:** Click on reset button (line 8219)
- **Actions:** Resets all toggles and clears disabled tags

### applyWhatIfChanges
- **Location:** Line 8241-8276
- **Handler:** `applyWhatIfChanges()`
- **Trigger:** Click on apply button (line 8220)
- **Actions:** Re-renders previews with disabled tags removed

---

## 4. Cropper Platform Group Handlers

### Group Toggle Handler (Anonymous)
- **Location:** Line 3480-3492
- **Handler:** Anonymous `change` listener on `.cropper-group-toggle`
- **Trigger:** Checkbox state change on group header
- **Actions:**
  - Checks/unchecks all platform checkboxes in the group
  - Calls `updateEnabledPlatforms()`
  - Calls `updateCropperOverlay()`
  - Calls `syncGroupToggles(groups)`

### Platform Toggle Handler (Anonymous)
- **Location:** Line 3496-3502
- **Handler:** Anonymous `change` listener on `.cropper-platform-toggle input`
- **Trigger:** Checkbox state change on individual platform
- **Actions:**
  - Calls `updateEnabledPlatforms()`
  - Calls `updateCropperOverlay()`
  - Calls `syncGroupToggles(groups)`

### selectAllPlatforms Handler (Anonymous)
- **Location:** Line 3504-3509
- **Handler:** Anonymous `click` listener on select all button
- **Actions:** Selects all platforms and updates UI state

### clearAllPlatforms Handler (Anonymous)
- **Location:** Line 3511-3516
- **Handler:** Anonymous `click` listener on clear all button
- **Actions:** Deselects all platforms and updates UI state

### syncGroupToggles
- **Location:** Line 3530-3549
- **Handler:** `syncGroupToggles(groups)`
- **Actions:** Syncs group checkbox state with its children (checked/unchecked/indeterminate)

### updateEnabledPlatforms
- **Location:** Line 3551-3560
- **Handler:** `updateEnabledPlatforms()`
- **Actions:** Updates `cropperState.enabledPlatforms` set from checked checkboxes

---

## 5. Command Palette Filter

### filterCommands
- **Location:** Line 9177-9192
- **Handler:** `filterCommands(e)`
- **Trigger:** Text input in command palette (line 9085)
- **Actions:** Filters commands by query and re-renders command list

---

## 6. Heatmap Sort Handler

### handleHeatmapSort
- **Location:** Line 6101-6123
- **Handler:** `handleHeatmapSort()`
- **Trigger:** Sort dropdown change (line 332)
- **Actions:** Sorts sitemap results and re-renders heatmap table

---

## 7. Other UI Change Handlers (Not strictly filters but related)

### updateBadgePreview
- **Location:** Line 4765 (triggered at line 296)
- **Handler:** `updateBadgePreview()`
- **Trigger:** Badge style select change

### handleEditorInput
- **Location:** Line 6589 (triggered at line 6801)
- **Handler:** `handleEditorInput(e)`
- **Trigger:** Text input in editor fields
- **Actions:** Updates character counts and field impact labels

### generateCodeSnippet
- **Location:** Triggered at line 6813
- **Handler:** Code generation on framework select change

### importPreferences
- **Location:** Triggered at line 6831
- **Handler:** Imports preferences from file upload

---

## 8. Guard Functions (Used by filter handlers)

### guardWrapper
- **Location:** Line 7910-7950 (approximately, based on guardWrapper calls)
- **Usage:** Wraps `toggleFavorite` and other operations during smart ordering

### guardWrapperWithRender
- **Location:** Similar to guardWrapper but includes re-rendering
- **Usage:** Wraps `toggleHidden`

### queueFilterOperation
- **Location:** Line 7942-7951
- **Handler:** `queueFilterOperation(operation, description)`
- **Actions:** Queues filter operations when smart ordering is active

### processPendingFilterOperations
- **Location:** Line 7952-7975
- **Handler:** `processPendingFilterOperations()`
- **Actions:** Executes queued filter operations

---

## Summary Statistics

- **Total filter change handlers identified:** 24
- **Named handler functions:** 13
- **Anonymous inline handlers:** 11
- **Primary filter categories:**
  1. Metadata filtering (1 handler)
  2. Platform visibility (4 handlers)
  3. What-if mode (4 handlers)
  4. Platform grouping (4 handlers)
  5. Command palette (1 handler)
  6. Heatmap sorting (1 handler)
  7. Other UI changes (4 handlers)
  8. Guard utilities (4 handlers)

---

## Notes

- Most filter handlers use guard wrappers (`guardWrapper`, `guardWrapperWithRender`) to prevent interference with smart ordering
- Filter operations can be queued via `queueFilterOperation()` when smart ordering is active
- The `isFilterOperation` flag is used to prevent smart order resets during filter operations
- All handlers that modify platform preferences call `savePlatformPrefs()` to persist changes
