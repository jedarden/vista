# Filter Change Handlers Analysis - bf-4u0an

## Task Summary
Located and parsed all filter change handlers in `/home/coding/vista/src/public/app.js`.

## File Structure Overview

**Location:** `/home/coding/vista/src/public/app.js` (367.1KB, ~11,000+ lines)

**Main sections:**
1. State declarations (lines 1-100)
2. Theme and accessibility utilities (lines 100-500)
3. Core application logic and initialization (lines 500-1500)
4. Platform rendering and card management (lines 1500-2500)
5. Editor functionality (lines 6200-7000)
6. **Platform customization and filter handlers (lines 7600-8100)**
7. What If mode and tag filtering (lines 8100-8300)
8. Various utilities and helpers (throughout)

## Filter Change Handler Locations

### Primary Filter Handlers (in app.js)

1. **toggleFavorite(pid)** - Line 7867
   - Uses `guardWrapper('toggleFavorite', ...)` 
   - Toggles platform in favorites Set
   - Calls: `savePlatformPrefs()`, `updateFavoritesList()`
   - Clears `isSmartOrderingActive` flag

2. **toggleHidden(pid)** - Line 7977
   - Uses `guardWrapperWithRender('toggleHidden', ...)`
   - Toggles platform in hidden Set
   - Calls: `savePlatformPrefs()`, `updateHiddenList()`, `renderPreviews()`
   - Sets `isFilterOperation` flag to prevent smart order resets

3. **toggleWhatIfMode()** - Line 8121
   - Manually checks `isSmartOrdering()` and queues operation if active
   - Toggles What If mode on/off
   - When clearing What If: calls `renderPreviews(currentData)` with guard flags
   - Direct implementation (no guard wrapper)

4. **Platform Cropper Group Toggles** - Lines 3481-3491
   - Event listeners on `.cropper-group-toggle` checkboxes
   - Change handlers check/uncheck all platforms in a group
   - Calls: `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

5. **Platform Cropper Individual Platform Toggles** - Lines 3496-3501
   - Event listeners on `.cropper-platform-toggle input` checkboxes
   - Change handlers update enabled platforms and overlays
   - Calls: `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

6. **What If Panel Tag Toggles** - Lines 8206-8215
   - Event listeners on `.what-if-toggle input` checkboxes
   - Change handlers add/remove tags from `disabledTags` Set
   - Calls: `updateHash()`

7. **Select/Clear All Platforms** - Lines 3504-3516
   - Event listeners on buttons
   - Bulk check/uncheck all platform toggles
   - Calls: `syncGroupToggles()`, `updateEnabledPlatforms()`, `updateCropperOverlay()`

### Related Helper Functions

- **savePlatformPrefs()** - Line 7763
  - Atomic read-modify-write with version checking (localStorage desync fix)
  - Persists favorites, hidden, columnCount, smartOrdering, cardOrder, cardOrderMetadata

- **updateFavoritesList()** - Line 7990
  - Rebuilds favorites list UI from `platformPrefs.favorites` Set
  - Attaches click listeners calling `toggleFavorite(btn.dataset.pid)` - Line 8008

- **updateHiddenList()** - Line 8012
  - Rebuilds hidden list UI from `platformPrefs.hidden` Set
  - Attaches click listeners calling `toggleHidden(btn.dataset.pid)` - Line 8030

- **renderPreviews()** - Line 1583
  - Main rendering function that applies filter state
  - Respects `isFilterOperation` guard flag to prevent order resets

### Guard Wrapper Utility (separate module)

**File:** `/home/coding/vista/src/public/filter-guard-wrapper.js`

**Functions:**
1. **guardWrapper(handlerName, handlerFunction)**
   - Checks `isSmartOrdering()` before executing
   - Queues operation if smart ordering is active
   - Used by: `toggleFavorite`

2. **guardWrapperWithRender(handlerName, handlerFunction)**
   - Extends guardWrapper with additional guard flags
   - Sets `isFilterOperation = true` during execution
   - Clears `isSmartOrderingActive` after execution
   - Used by: `toggleHidden`

## Handler Organization Pattern

Filter handlers in app.js follow this general structure:

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
- `isFilterOperation` - Guard flag preventing smart order resets during filters
- `isSmartOrderingActive` - Runtime flag tracking smart ordering progress
- `disabledTags` - Set of tags disabled in What If mode

## Integration Points

1. **Exposed to window** (lines 5057-5058):
   - `window.toggleHidden`
   - `window.toggleFavorite`

2. **Internal event listeners** (throughout):
   - Favorites list items → `toggleFavorite`
   - Hidden list items → `toggleHidden`
   - Platform cropper toggles → custom handlers
   - What If panel → tag toggles

3. **Cross-module dependencies**:
   - `filter-guard-wrapper.js` provides guard utilities
   - Guard functions check `isSmartOrdering()` from app.js
   - Guard functions use `queueFilterOperation()` from app.js
