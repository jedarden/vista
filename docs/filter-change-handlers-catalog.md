# Filter Change Handlers Catalog

**Source File:** `src/public/app.js` (10,506 lines; last modified 2026-08-24, commit `31bc458`)
**Generated:** 2026-07-24 (task bf-2oss6)
**Verified Updated:** 2026-08-26 (task vista-ad03bc5f - direct source verification)
**Last Updated:** 2026-08-26

## Overview

This catalog provides a comprehensive reference for all filter change handlers in the VISTA application. Filter change handlers are functions that modify display filters, sorting, or visibility states and trigger UI updates.

**Total Handlers:** 28
- **Primary Handlers:** 13 (core filtering operations)
- **Guard System Functions:** 4 (smart ordering coordination)
- **Component-Local Handlers:** 11 (isolated UI component filters)

## Complete Handler Registry

### 1. Order-Reset Handlers

These handlers modify the filter state in ways that require re-rendering the entire preview list. They set the `isFilterOperation` guard flag and call `renderPreviews()`.

| # | Handler Name | Line | Purpose | Sets Guard Flag | Calls renderPreviews |
|---|-------------|------|---------|-----------------|---------------------|
| 1 | `toggleHidden(pid)` | 8458 | Toggle visibility of hidden items (uses `guardWrapperWithRender`) | ✅ Yes | ✅ Yes |
| 2 | `importPreferences(e)` | 8538 | Load user preferences from file | ✅ Yes | ✅ Yes |
| 3 | `toggleWhatIfMode()` | 8602 | Toggle "what-if" analysis mode | ✅ Yes | ✅ Yes |
| 4 | `applyWhatIfChanges()` | 8722 | Apply staged what-if changes | ✅ Yes | ✅ Yes |

**Behavior Pattern:**
```javascript
// All order-reset handlers follow this pattern:
isFilterOperation = true;           // Set guard flag
// ... perform filter changes ...
renderPreviews();                   // Trigger full re-render
isFilterOperation = false;          // Clear guard flag
```

### 2. Non-Order-Reset Handlers

These handlers perform UI updates or filtering operations that don't require full preview list re-rendering. They do NOT set the guard flag and do NOT call `renderPreviews()`.

| # | Handler Name | Line | Purpose | Sets Guard Flag | Calls renderPreviews |
|---|-------------|------|---------|-----------------|---------------------|
| 5 | `toggleFavorite(pid)` | 8348 | Toggle favorite status on items (uses `guardWrapper`) | ❌ No | ❌ No |
| 6 | `renderMetadataTable(filter = '')` | 4368 | Render metadata table with optional filter | ❌ No | ❌ No |
| 7 | `filterCommands(e)` | 9658 | Filter command palette items | ❌ No | ❌ No |
| 8 | `handleHeatmapSort()` | 6582 | Sort heatmap by column | ❌ No | ❌ No |
| 9 | `updateBadgePreview()` | 5192 | Update badge preview display | ❌ No | ❌ No |

**Use Cases:**
- **toggleFavorite:** Updates UI only, doesn't change filter state
- **renderMetadataTable:** Separate UI component with its own filtering
- **filterCommands:** Command palette filtering (isolated UI component)
- **handleHeatmapSort:** Visualization-specific sorting (not preview list)
- **updateBadgePreview:** Badge display update (not filter-related)

### 3. Guard System Functions

These supporting functions implement the filter operation guard system that prevents concurrent filter operations and enables smart ordering optimization.

| # | Function Name | Line | Purpose | Return Type |
|---|-------------|------|---------|-------------|
| 10 | `shouldDeferFilterOperation()` | 8372 | Check if filter operation should be deferred | Boolean |
| 11 | `isSmartOrdering()` | 8414 | Check if smart ordering is enabled | Boolean |
| 12 | `queueFilterOperation(operation, description)` | 8423 | Add operation to pending queue | Void |
| 13 | `processPendingFilterOperations()` | 8433 | Execute queued filter operations | Void |

**Guard System Flow:**
```
1. Handler starts
   ↓
2. shouldDeferFilterOperation()?
   ├─ Yes → queueFilterOperation()
   └─ No  → Execute immediately
   ↓
3. isFilterOperation = true
   ↓
4. Perform filter changes
   ↓
5. renderPreviews()
   ↓
6. isFilterOperation = false
   ↓
7. processPendingFilterOperations()
```

### 4. Auxiliary Functions

These handlers support specialized UI components (OG generator and cropper) and operate independently of the main filter system.

| # | Handler Name | Line | Purpose | Component |
|---|-------------|------|---------|-----------|
| 14 | `handleBgTypeChange()` | 5531 | Handle OG background type selection | OG Generator |
| 15 | `handleLogoPosChange()` | 5558 | Handle OG logo position selection | OG Generator |
| 16 | `updateOggenCanvas()` | 5581 | Update OG generator canvas | OG Generator |
| 17 | `updateEnabledPlatforms()` | 3978 | Toggle platform visibility in cropper | Cropper |
| 18 | `updateCropperOverlay()` | 4027 | Update cropper overlay display | Cropper |

**Component Isolation:**
- **OG Generator Functions:** Handle OG image generation settings (bg type, logo position)
- **Cropper Functions:** Handle image cropping interface (platform visibility, overlay)

### 5. Additional Primary Handlers

These handlers support the primary filter system but perform specialized functions.

| # | Handler Name | Line | Purpose | Calls renderPreviews |
|---|-------------|------|---------|---------------------|
| 19 | `resetWhatIfToggles()` | 8714 | Reset all What If tag toggles to checked state | ❌ No |
| 20 | `updateFavoritesList()` | 8471 | Render favorites filter list with click handlers | ❌ No |
| 21 | `updateHiddenList()` | 8493 | Render hidden filter list with click handlers | ❌ No |
| 22 | `applyPendingWhatIfTags()` | 8767 | Apply URL-persisted What If tags after data load | ✅ Yes |

### 6. Extended Component-Local Handlers

Additional handlers for isolated UI components that never touch preview filter state.

| # | Handler Name | Line | Purpose | Component |
|---|-------------|------|---------|-----------|
| 23 | `handleEditorInput(e)` | 7070 | Handle editor field input with debounced preview update | Editor |
| 24 | `generateCodeSnippet()` | 7334 | Generate framework-specific meta code snippet | Code Snippet Generator |
| 25 | `handleBgImageUpload(e)` | 5542 | Handle OG background image upload | OG Generator |
| 26 | `handleLogoUpload(e)` | 5565 | Handle OG logo image upload | OG Generator |
| 27 | `syncGroupToggles(groups)` | 3957 | Sync cropper group checkbox states from children | Cropper |
| 28 | inline tag-toggle listener | 8688 | Handle What If tag checkbox changes | What If Panel |

**Inline Listeners:**
- **Cropper group-toggle** (3908): Checks/unchecks every platform checkbox in a group
- **Cropper platform-toggle** (3924): Single platform on/off toggle
- **Metadata filter input** (4418): Filters metadata table by substring
- **What If tag-toggle** (8688): Adds/removes tags from disabledTags set

## Handler Interaction Matrix

### Call Relationships

```
toggleHidden (8458)
    ├── Uses: guardWrapperWithRender from filter-guard-wrapper.js
    ├── Sets: isFilterOperation = true
    ├── Calls: renderPreviews(currentData)
    └── Clears: isFilterOperation via setTimeout(..., 0)
    └── Clears: isSmartOrderingActive (manual override)

importPreferences (8538)
    ├── Reads: User preference file (JSON)
    ├── Checks: isSmartOrdering() → queues if true
    ├── Sets: isFilterOperation = true
    ├── Calls: renderPreviews()
    └── Clears: isFilterOperation via setTimeout(..., 0)
    └── Clears: isSmartOrderingActive

toggleWhatIfMode (8602)
    ├── Enters/Exits: What If simulation mode
    ├── On exit: Clears disabledTags and ?without= hash param
    ├── When disabling during smart ordering: Queues applyWhatIfReset
    └── Updates: Panel visibility and state

applyWhatIfChanges (8722)
    ├── Reads: Staged what-if changes from disabledTags
    ├── Sets: isFilterOperation = true
    ├── Creates: Modified data copy with filtered meta
    ├── Calls: renderPreviews(modifiedData)
    ├── Announces: Via screen reader
    └── Clears: isFilterOperation via setTimeout(..., 0)
    └── Updates: Hash with ?without= parameter

toggleFavorite (8348)
    ├── Uses: guardWrapper from filter-guard-wrapper.js
    ├── Clears: isSmartOrderingActive (manual override)
    ├── Updates: platformPrefs.favorites array
    ├── Calls: savePlatformPrefs()
    └── Refreshes: Favorites list UI (no re-render)
```

## Quick Reference by Use Case

### When to Use Order-Reset Handlers

Use these handlers when you need to:
- Change which items are visible (toggleHidden)
- Load saved user state (importPreferences)
- Switch between analysis modes (toggleWhatIfMode, applyWhatIfChanges)

**Impact:** Full preview list re-render, potential scroll position reset

### When to Use Non-Order-Reset Handlers

Use these handlers when you need to:
- Update item metadata without changing visibility (toggleFavorite)
- Filter isolated UI components (renderMetadataTable, filterCommands)
- Sort visualizations independent of previews (handleHeatmapSort)
- Update badge displays (updateBadgePreview)

**Impact:** Localized UI updates only, no scroll position change

### When to Use Guard System Functions

Use these functions when you need to:
- Prevent concurrent filter operations (shouldDeferFilterOperation)
- Check smart ordering status (isSmartOrdering)
- Queue operations for deferred execution (queueFilterOperation)
- Process queued operations (processPendingFilterOperations)

**Impact:** Ensures filter operation integrity and enables performance optimization

## Maintenance Guidelines

### Adding New Filter Change Handlers

1. **Determine if handler should reset order:**
   - Does it change which items are visible? → Yes, use order-reset pattern
   - Does it only update UI locally? → No, use non-order-reset pattern

2. **For order-reset handlers (modern pattern using guardWrapper):**
   ```javascript
   // Modern approach: Use guardWrapperWithRender from filter-guard-wrapper.js
   const myHandler = guardWrapperWithRender('myHandler', () => {
       // ... perform filter changes ...
       renderPreviews(currentData);
       // isFilterOperation is managed automatically
       // Cleared via setTimeout(..., 0)
   });
   ```

   **Legacy approach (still valid):**
   ```javascript
   function myNewFilterHandler() {
       isFilterOperation = true;
       // ... perform filter changes ...
       renderPreviews();
       setTimeout(() => { isFilterOperation = false; }, 0);
   }
   ```

3. **For non-order-reset handlers:**
   ```javascript
   function myNewUiUpdateHandler() {
       // ... perform UI changes ...
       // NO renderPreviews() call
   }
   ```

4. **Update this catalog:**
   - Add handler to appropriate section
   - Update line number
   - Document purpose and behavior pattern

### Updating Handler Line Numbers

When handlers move due to refactoring:
1. Run the extraction script: `node extract-filter-handlers-bf-3qy9w.js`
2. Update line numbers in this catalog
3. Verify handler purposes haven't changed
4. Check for behavioral changes (guardWrapper adoption, setTimeout pattern)
4. Commit with message: `docs: update filter handler catalog line numbers`

## Verification Status

✅ **COMPLETE** - All 28 filter change handlers verified
✅ **Line Numbers Accurate** - Verified against source code (2026-08-26)
✅ **Behavior Patterns Documented** - Each handler's interaction pattern documented
✅ **No Handlers Missed** - Comprehensive scan of entire app.js file
✅ **Guard System Changes** - Updated to reflect guardWrapper/guardWrapperWithRender adoption
✅ **Component-Local Handlers** - Added all isolated UI component filters

## Related Documentation

- **Source Code:** `src/public/app.js` (10,506 lines; commit `31bc458`)
- **Guard Wrapper:** `src/public/filter-guard-wrapper.js` (guardWrapper, guardWrapperWithRender)
- **Guard Utilities:** `src/public/guard-utils.js` (window.isSmartOrdering, etc.)
- **Detailed Extraction:** `docs/filter-change-handler-details.md` (2026-08-26, vista-ad03bc5f)
- **Original Extraction:** `temp-filter-change-handlers-list.md` (2026-07-24, bf-2oss6)

## Changelog

### 2026-08-26
- **Line Number Verification:** Updated all line numbers from 2026-07-24 to current verified values (+427 to +481 lines drift)
- **Handler Count:** Increased from 18 to 28 handlers (added 10 component-local and auxiliary handlers)
- **Guard System Updates:** Updated to reflect guardWrapper/guardWrapperWithRender adoption
- **Behavioral Changes:** Documented setTimeout pattern for guard flag clearing
- **New Sections Added:**
  - Additional Primary Handlers (resetWhatIfToggles, updateFavoritesList, updateHiddenList, applyPendingWhatIfTags)
  - Extended Component-Local Handlers (handleEditorInput, generateCodeSnippet, upload handlers, inline listeners)
- **Enhanced Documentation:** Updated interaction matrix with modern guard patterns

### 2026-07-24
- Initial extraction and cataloging (task bf-2oss6)
- 18 handlers identified and categorized
- Line numbers verified against source code

### 2026-07-24
- Initial extraction and cataloging (task bf-2oss6)
- 18 handlers identified and categorized
- Line numbers verified
