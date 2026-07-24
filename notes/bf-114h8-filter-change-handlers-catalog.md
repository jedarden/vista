# Filter Change Handlers Catalog for app.js

This document catalogs all filter change handlers found in `/home/coding/vista/src/public/app.js`.

## Core Filter Change Handlers

### 1. `updateBadgePreview` (Line 296)
- **Event:** `change` event on `badgeStyleSelect`
- **Purpose:** Updates badge preview when badge style is changed
- **Function Definition:** Line 4765

### 2. `handleBgTypeChange` (Line 310)
- **Event:** `change` event on `oggenBgType`
- **Purpose:** Handles background type changes in OG generator (solid/gradient/image)
- **Function Definition:** Line 5106
- **Toggles visibility of background controls based on selected type

### 3. `updateOggenCanvas` (Lines 314, 316, 319)
- **Event:** `change` events on `oggenGradientDir`, `oggenBgImageSize`, `oggenFont`
- **Purpose:** Updates OG canvas when gradient direction, image size, or font changes
- **Function Definition:** Line 5156

### 4. `handleBgImageUpload` (Line 315)
- **Event:** `change` event on `oggenBgImageInput`
- **Purpose:** Handles background image upload for OG generator
- **Function Definition:** Line 5117

### 5. `handleLogoPosChange` (Line 321)
- **Event:** `change` event on `oggenLogoPos`
- **Purpose:** Handles logo position changes in OG generator
- **Function Definition:** Line 5133
- **Toggles logo upload visibility based on position

### 6. `handleLogoUpload` (Line 322)
- **Event:** `change` event on `oggenLogoInput`
- **Purpose:** Handles logo image upload for OG generator
- **Function Definition:** Line 5140

### 7. `handleHeatmapSort` (Line 332)
- **Event:** `change` event on `heatmapSort`
- **Purpose:** Sorts heatmap results by score or URL (ascending/descending)
- **Function Definition:** Line 6101
- **Re-renders heatmap table with sorted data

## Platform/Group Filter Handlers

### 8. Cropper Group Toggle Handler (Line 3481)
- **Event:** `change` event on `.cropper-group-toggle`
- **Purpose:** Toggles all platforms in a group when group header is clicked
- **Operations:**
  - Checks/unchecks all platform checkboxes in the group
  - Calls `updateEnabledPlatforms()`
  - Calls `updateCropperOverlay()`
  - Calls `syncGroupToggles()`

### 9. Cropper Platform Toggle Handler (Line 3497)
- **Event:** `change` event on `.cropper-platform-toggle input`
- **Purpose:** Handles individual platform visibility toggle in cropper
- **Operations:**
  - Calls `updateEnabledPlatforms()`
  - Calls `updateCropperOverlay()`
  - Calls `syncGroupToggles()`

## Metadata Filter Handler

### 10. Metadata Filter Input Handler (Line 3991)
- **Event:** `input` event on `metadataFilterInput`
- **Purpose:** Filters metadata table rows based on user input
- **Function Called:** `renderMetadataTable(e.target.value)`
- **Filters table rows by tag/value matching

## Code Snippet & Import Handlers

### 11. `generateCodeSnippet` (Line 6813)
- **Event:** `change` event on `snippetFramework`
- **Purpose:** Generates code snippet when framework selection changes
- **Function Definition:** Line 6853

### 12. `importPreferences` (Line 6831)
- **Event:** `change` event on `importPrefsInput`
- **Purpose:** Imports preferences from uploaded JSON file
- **Function Definition:** Line 8057
- **Uses guard functions to handle smart ordering conflicts**

## Favorite/Hidden Platform Handlers

### 13. `toggleFavorite` (Line 8008)
- **Event:** `click` event on favorite button
- **Purpose:** Toggles favorite status for a platform
- **Wrapped with:** `guardWrapperWithRender('toggleFavorite', ...)`

### 14. `toggleHidden` (Line 8030)
- **Event:** `click` event on hide button
- **Purpose:** Toggles hidden status for a platform
- **Function Definition:** Line 7977
- **Wrapped with:** `guardWrapperWithRender('toggleHidden', ...)`

## What If Mode Handlers

### 15. What If Toggle Handler (Line 8207)
- **Event:** `change` event on `.what-if-toggle input`
- **Purpose:** Handles tag enable/disable toggles in What If mode
- **Operations:**
  - Adds/removes tags from `disabledTags` set
  - Calls `updateHash()` to reflect disabled tags in URL

### 16. `resetWhatIfToggles` (Line 8219)
- **Event:** `click` event on `whatIfReset` button
- **Purpose:** Resets all What If toggles to enabled state
- **Clears:** `disabledTags` set and URL hash

### 17. `applyWhatIfChanges` (Line 8220)
- **Event:** `click` event on `whatIfApply` button
- **Purpose:** Applies What If changes and updates previews
- **Operations:**
  - Creates modified metadata with disabled tags removed
  - Sets `isFilterOperation = true` guard flag
  - Calls `renderPreviews()` with modified data
  - Shows missing tag warnings

### 18. `toggleWhatIfMode` (Line 8334)
- **Event:** `click` event on `whatIfToggleBtn`
- **Purpose:** Toggles What If mode on/off
- **Opens/closes:** What If panel

## Command Palette Filter Handler

### 19. `filterCommands` (Line 9085)
- **Event:** `input` event on command palette input
- **Purpose:** Filters command palette commands by label/category
- **Function Definition:** Line 9177
- **Filters:** `COMMANDS` array by query string
- **Calls:** `renderCommands()` with filtered results

## Centralized Guard Functions

### 20. `isSmartOrdering()` (Line 7933)
- **Purpose:** Checks if smart ordering is currently active
- **Returns:** Boolean indicating if both preference and runtime state are active
- **Used by:** Filter handlers to avoid conflicts with smart ordering

### 21. `shouldDeferFilterOperation()` (Line 7891)
- **Purpose:** Checks if filter operation should be deferred
- **Returns:** Boolean based on `isSmartOrderingActive` flag

### 22. `queueFilterOperation()` (Line 7942)
- **Purpose:** Queues filter operations to run after smart ordering completes
- **Parameters:** `operation` function, `description` string

### 23. `processPendingFilterOperations()` (Line 7952)
- **Purpose:** Processes queued filter operations after smart ordering
- **Executes:** All operations in `pendingFilterOperations` queue

## Helper Functions for Filter Operations

### 24. `syncGroupToggles(groups)` (Line 3530)
- **Purpose:** Syncs group header checkboxes with their child platform states
- **Sets:** Header to checked/unchecked/indeterminate based on children

### 25. `updateEnabledPlatforms()` (Line 3551)
- **Purpose:** Updates the set of enabled platforms from checkbox states
- **Updates:** `cropperState.enabledPlatforms` set
- **Calls:** `renderCategoryLegend()` to sync legend display

### 26. `renderCategoryLegend()` (Line 3568)
- **Purpose:** Renders the category legend showing which categories have enabled platforms
- **Dims:** Categories with no enabled platforms

## Related State Variables

- `isFilterOperation` (Line 6279): Guard flag to prevent smart order resets during filter changes
- `isSmartOrderingActive`: Runtime flag tracking smart ordering progress
- `pendingFilterOperations`: Queue for deferred filter operations
- `disabledTags`: Set of tags disabled in What If mode
- `cropperState.enabledPlatforms`: Set of currently enabled platforms in cropper

## Summary

Total cataloged handlers: **26** (23 handler functions + 3 centralized guard functions)

Filter change handlers are organized into:
- **Core UI handlers** (7 handlers): Badge, OG generator, heatmap
- **Platform/group filtering** (2 handlers): Cropper controls
- **Metadata filtering** (1 handler): Metadata table filter
- **Import/export** (2 handlers): Code snippet, preferences
- **Favorite/hidden platforms** (2 handlers): Toggle favorite/hidden
- **What If mode** (4 handlers): Tag toggles, reset, apply, toggle mode
- **Command palette** (1 handler): Command filtering
- **Guard functions** (3 handlers): Smart ordering guards
- **Helper functions** (3 handlers): Sync state, update platforms, render legend
