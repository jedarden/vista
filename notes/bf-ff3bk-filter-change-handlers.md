# Vista Filter Change Handlers

**Generated:** 2026-07-24  
**Bead ID:** bf-ff3bk

## Core Filter Change Handlers

### 1. `toggleHidden(pid)` 
- **File:** `/home/coding/vista/src/public/app.js:7977`
- **Purpose:** Hides or shows a platform in the UI
- **Uses:** `guardWrapperWithRender` to prevent conflicts with smart ordering
- **Actions:**
  - Adds/removes platform ID from `platformPrefs.hidden` set
  - Saves preferences
  - Updates hidden list UI
  - Re-renders previews with `renderPreviews(currentData)`

### 2. `toggleFavorite(pid)`
- **File:** `/home/coding/vista/src/public/app.js:7867`
- **Purpose:** Adds or removes a platform from favorites
- **Uses:** `guardWrapper` to prevent conflicts with smart ordering
- **Actions:**
  - Adds/removes platform ID from `platformPrefs.favorites` set
  - Saves preferences
  - Updates favorites list UI
  - Clears smart ordering active flag (user manual override)

### 3. `updateHiddenList()`
- **File:** `/home/coding/vista/src/public/app.js:8012`
- **Purpose:** Updates the hidden platforms list UI
- **Actions:**
  - Renders list of hidden platforms with remove buttons
  - Attaches click handlers to call `toggleHidden(pid)`

### 4. `updateFavoritesList()`
- **File:** `/home/coding/vista/src/public/app.js:7990`
- **Purpose:** Updates the favorites list UI
- **Actions:**
  - Renders list of favorite platforms with remove buttons
  - Attaches click handlers to call `toggleFavorite(pid)`

### 5. `toggleWhatIfMode()`
- **File:** `/home/coding/vista/src/public/app.js:8121`
- **Purpose:** Toggles What If analysis mode
- **Uses:** `isSmartOrdering()` guard and `queueFilterOperation` if smart ordering is active
- **Actions:**
  - Toggles `whatIfMode` flag
  - Updates button UI
  - Shows/hides What If panel
  - Re-renders previews when disabled
  - Sets `isFilterOperation` guard during render

### 6. `filterCommands(e)`
- **File:** `/home/coding/vista/src/public/app.js:9177`
- **Purpose:** Filters command palette items based on search query
- **Actions:**
  - Filters COMMANDS array by label or category
  - Renders filtered commands

### 7. `updateEnabledPlatforms()`
- **File:** `/home/coding/vista/src/public/app.js:3551`
- **Purpose:** Updates enabled platforms for cropper controls
- **Actions:**
  - Reads checked platform toggles
  - Updates `cropperState.enabledPlatforms` set
  - Refreshes category legend

## Supporting Guard Functions

### 8. `guardWrapper(handlerName, handlerFunction)`
- **File:** `/home/coding/vista/src/public/filter-guard-wrapper.js:47`
- **Purpose:** Wraps filter handlers to check `isSmartOrdering()` and queue operations if active

### 9. `guardWrapperWithRender(handlerName, handlerFunction)`
- **File:** `/home/coding/vista/src/public/filter-guard-wrapper.js:88`
- **Purpose:** Variant that automatically sets `isFilterOperation` guard during render

### 10. `queueFilterOperation(operation, description)`
- **File:** `/home/coding/vista/src/public/app.js:7942`
- **Purpose:** Queues filter operations to execute after smart ordering completes

### 11. `processPendingFilterOperations()`
- **File:** `/home/coding/vista/src/public/app.js:7952`
- **Purpose:** Processes queued filter operations after smart ordering completes

## Guard State Functions

### 12. `isSmartOrdering()`
- **File:** `/home/coding/vista/src/public/app.js:7922`
- **Purpose:** Checks if smart ordering is both enabled and currently active

### 13. `isFilterOperationInProgress()`
- **File:** `/home/coding/vista/src/public/guard-utils.js:78`
- **Purpose:** Checks if a filter operation is currently in progress

## Related State Variables

- `isFilterOperation` - Guard flag to prevent smart order resets during filter changes
- `isSmartOrderingActive` - Runtime flag tracking smart ordering progress
- `pendingFilterOperations` - Queue for filter operations during smart ordering

## Usage Pattern

All filter change handlers follow this pattern:
1. Check `isSmartOrdering()` before executing
2. If active, queue operation with `queueFilterOperation()`
3. If not active, execute immediately
4. Set `isFilterOperation` guard during renders to prevent order resets
