# Filter Change Handlers Catalog

**Source File:** `src/public/app.js` (367.1KB, 36,000+ lines)  
**Generated:** 2026-07-24  
**Task:** bf-2oss6  
**Last Updated:** 2026-08-26

## Overview

This catalog provides a comprehensive reference for all filter change handlers in the VISTA application. Filter change handlers are functions that modify display filters, sorting, or visibility states and trigger UI updates.

**Total Handlers:** 18  
- **Primary Handlers:** 13 (core filtering operations)
- **Auxiliary Handlers:** 5 (OG generator and cropper operations)

## Complete Handler Registry

### 1. Order-Reset Handlers

These handlers modify the filter state in ways that require re-rendering the entire preview list. They set the `isFilterOperation` guard flag and call `renderPreviews()`.

| # | Handler Name | Line | Purpose | Sets Guard Flag | Calls renderPreviews |
|---|-------------|------|---------|-----------------|---------------------|
| 1 | `toggleHidden(pid)` | 7977 | Toggle visibility of hidden items | ✅ Yes | ✅ Yes |
| 2 | `importPreferences(e)` | 8057 | Load user preferences from file | ✅ Yes | ✅ Yes |
| 3 | `toggleWhatIfMode()` | 8121 | Toggle "what-if" analysis mode | ✅ Yes | ✅ Yes |
| 4 | `applyWhatIfChanges()` | 8241 | Apply staged what-if changes | ✅ Yes | ✅ Yes |

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
| 5 | `toggleFavorite(pid)` | 7867 | Toggle favorite status on items | ❌ No | ❌ No |
| 6 | `renderMetadataTable(filter = '')` | 3941 | Render metadata table with optional filter | ❌ No | ❌ No |
| 7 | `filterCommands(e)` | 9177 | Filter command palette items | ❌ No | ❌ No |
| 8 | `handleHeatmapSort()` | 6101 | Sort heatmap by column | ❌ No | ❌ No |
| 9 | `updateBadgePreview()` | 4765 | Update badge preview display | ❌ No | ❌ No |

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
| 10 | `shouldDeferFilterOperation()` | 7891 | Check if filter operation should be deferred | Boolean |
| 11 | `isSmartOrdering()` | 7933 | Check if smart ordering is enabled | Boolean |
| 12 | `queueFilterOperation(operation, description)` | 7942 | Add operation to pending queue | Void |
| 13 | `processPendingFilterOperations()` | 7952 | Execute queued filter operations | Void |

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
| 14 | `handleBgTypeChange()` | 5106 | Handle OG background type selection | OG Generator |
| 15 | `handleLogoPosChange()` | 5133 | Handle OG logo position selection | OG Generator |
| 16 | `updateOggenCanvas()` | 5156 | Update OG generator canvas | OG Generator |
| 17 | `updateEnabledPlatforms()` | 3551 | Toggle platform visibility in cropper | Cropper |
| 18 | `updateCropperOverlay()` | 3600 | Update cropper overlay display | Cropper |

**Component Isolation:**
- **OG Generator Functions:** Handle OG image generation settings (bg type, logo position)
- **Cropper Functions:** Handle image cropping interface (platform visibility, overlay)

## Handler Interaction Matrix

### Call Relationships

```
toggleHidden (7977)
    ├── Sets: isFilterOperation = true
    ├── Calls: renderPreviews()
    └── Clears: isFilterOperation = false

importPreferences (8057)
    ├── Reads: User preference file
    ├── Sets: isFilterOperation = true
    └── Calls: renderPreviews()

toggleWhatIfMode (8121)
    ├── Sets: isFilterOperation = true
    ├── Calls: renderPreviews()
    └── Updates: What-if mode state

applyWhatIfChanges (8241)
    ├── Reads: Staged what-if changes
    ├── Sets: isFilterOperation = true
    └── Calls: renderPreviews()
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

2. **For order-reset handlers:**
   ```javascript
   function myNewFilterHandler() {
       isFilterOperation = true;
       // ... perform filter changes ...
       renderPreviews();
       isFilterOperation = false;
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
4. Commit with message: `docs: update filter handler catalog line numbers`

## Verification Status

✅ **COMPLETE** - All 18 filter change handlers verified  
✅ **Line Numbers Accurate** - Verified against source code  
✅ **Behavior Patterns Documented** - Each handler's interaction pattern documented  
✅ **No Handlers Missed** - Comprehensive scan of entire app.js file

## Related Documentation

- **Source Code:** `src/public/app.js` (lines 7867-9177 for primary handlers)
- **Extraction Script:** `extract-filter-handlers-bf-3qy9w.js`
- **Original Extraction:** `temp-filter-change-handlers-list.md` (2026-07-24)

## Changelog

### 2026-08-26
- Restructured into comprehensive catalog format
- Added handler interaction matrix
- Added quick reference by use case
- Added maintenance guidelines
- Added behavior patterns and code examples

### 2026-07-24
- Initial extraction and cataloging (task bf-2oss6)
- 18 handlers identified and categorized
- Line numbers verified
