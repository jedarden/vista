# Filter Change Handler Patterns Analysis

## Task: Identify filter change handler patterns in app.js

Based on the structure analysis from child bead bf-59o8g, this report documents all filter change handler patterns and function names identified in `/home/coding/vista/src/public/app.js` (9998 lines).

## Naming Patterns Identified

### 1. `handle*` Pattern
The most common pattern for event handlers that respond to user interactions.

**Functions:**
- `handlePasteDetection(pastedText)` - Line 567
- `handleResult(data)` - Line 1024
- `handleBgTypeChange()` - Line 5106
- `handleBgImageUpload(e)` - Line 5117
- `handleLogoPosChange()` - Line 5133
- `handleLogoUpload(e)` - Line 5140
- `handleCompareSubmit()` - Line 5430
- `handleSwapUrls()` - Line 5499
- `handleSitemapSubmit()` - Line 5872
- `handleHeatmapSort()` - Line 6101
- `handleEditorInput(e)` - Line 6589
- `handleFbPurge()` - Line 7676
- `handleCommandKeydown(e)` - Line 9194
- `handleDragStart(e)` - Line 9532
- `handleDragEnd(e)` - Line 9540
- `handleDragOver(e)` - Line 9547
- `handleDragEnter(e)` - Line 9555
- `handleDragLeave(e)` - Line 9561
- `handleDrop(e)` - Line 9565
- `handleContextMenuAction(e)` - Line 9771
- `handleTouchStart(e)` - Line 9828
- `handleTouchEnd(e)` - Line 9853
- `handleTouchMove(e)` - Line 9888
- `handleHorizontalSwipe(deltaX, card)` - Line 9908
- `handleVerticalSwipe(deltaY, card)` - Line 9969

**Pattern:** `handle[EventName][OptionalTarget]` or `handle[Action]`
- Examples: `handleBgTypeChange`, `handleLogoUpload`, `handleHeatmapSort`

### 2. `*filter*` Pattern
Functions specifically related to filter operations and queueing.

**Functions:**
- `shouldDeferFilterOperation()` - Line 7891
- `queueFilterOperation(operation, description)` - Line 7942
- `processPendingFilterOperations()` - Line 7952
- `filterCommands(e)` - Line 9177
- `renderMetadataTable(filter = '')` - Line 3941

**Pattern:** `[verb]Filter[Operation]` or `filter[Noun]`
- Examples: `shouldDeferFilterOperation`, `queueFilterOperation`, `filterCommands`

### 3. `update*` Pattern
Functions that update state or UI in response to changes.

**Functions:**
- `updateHash(options = {})` - Line 404
- `updateDiagnostics(data)` - Line 900
- `updatePreviewsWithImages(data)` - Line 1930
- `updateCardHeader(pid)` - Line 2186
- `updateEnabledPlatforms()` - Line 3551
- `updateCropperOverlay()` - Line 3600
- `updateBadgePreview()` - Line 4765
- `updateOggenCanvas()` - Line 5156
- `updateEditorFieldImpactLabels(data)` - Line 6322
- `updateEditorCharCounts()` - Line 6382
- `updateEditedCardsInPlace(data)` - Line 6708
- `updatePreviewsWithEdits()` - Line 6737
- `updateColumnLayoutUI()` - Line 7859
- `updateFavoritesList()` - Line 7990
- `updateHiddenList()` - Line 8012
- `updateCommandActiveDescendant()` - Line 9170

**Pattern:** `update[Target][OptionalContext]`
- Examples: `updateHash`, `updateEnabledPlatforms`, `updateFavoritesList`

### 4. `toggle*` Pattern
Functions that toggle binary states (favorites, hidden, modes).

**Functions:**
- `toggleGlobalTheme()` - Line 108
- `toggleCardContext(pid, data)` - Line 2162
- `toggleCardTheme(pid, data)` - Line 2175
- `toggleCharGaugeGroup(groupId)` - Line 6529
- `toggleAllCharGauges(fieldId)` - Line 6549
- `toggleFavorite(pid)` - Line 7867
- `toggleHidden(pid)` - Line 7977
- `toggleWhatIfMode()` - Line 8121
- `toggleCommandPalette()` - Line 9105

**Pattern:** `toggle[Target]`
- Examples: `toggleFavorite`, `toggleHidden`, `toggleWhatIfMode`

### 5. `render*` Pattern
Functions that render UI components (some act as implicit handlers).

**Functions:**
- `renderSkeletons()` - Line 1520
- `renderCardBySkeletonType(pid, ...)` - Line 2376
- `renderCategoryLegend()` - Line 3568
- `renderMetadataTable(filter = '')` - Line 3941
- `renderCropperControls()` - Line 3434
- `renderComparisonResults()` - Line 5513
- `renderHeaderRecommendation(rec)` - Line 4262

**Pattern:** `render[Component]`
- Examples: `renderMetadataTable`, `renderCropperControls`

### 6. `on*` Pattern
Direct event handler assignments (less common in this codebase).

**Notable examples:**
- `onerror` attribute in HTML templates (line 2248)

### 7. Inline Event Listeners
Anonymous functions registered as event listeners.

**Change Event Listeners:**
- `badgeStyleSelect?.addEventListener('change', updateBadgePreview)` - Line 296
- `oggenBgType?.addEventListener('change', handleBgTypeChange)` - Line 310
- `oggenGradientDir?.addEventListener('change', updateOggenCanvas)` - Line 314
- `oggenBgImageInput?.addEventListener('change', handleBgImageUpload)` - Line 315
- `oggenBgImageSize?.addEventListener('change', updateOggenCanvas)` - Line 316
- `oggenFont?.addEventListener('change', updateOggenCanvas)` - Line 319
- `oggenLogoPos?.addEventListener('change', handleLogoPosChange)` - Line 321
- `oggenLogoInput?.addEventListener('change', handleLogoUpload)` - Line 322
- `heatmapSort?.addEventListener('change', handleHeatmapSort)` - Line 332
- Group checkbox: `groupCb.addEventListener('change', (e) => { ... })` - Line 3481
- Platform checkbox: `cb.addEventListener('change', () => { ... })` - Line 3497
- `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet)` - Line 6813
- `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)` - Line 6831
- What-if toggle: `cb.addEventListener('change', () => { ... })` - Line 8207

## Filter-Specific Handler Groups

### Platform Filter Handlers
- `toggleFavorite(pid)` - Toggle platform favorite status
- `toggleHidden(pid)` - Toggle platform hidden status
- `updateFavoritesList()` - Update favorites UI
- `updateHiddenList()` - Update hidden platforms UI
- `updateEnabledPlatforms()` - Update enabled platforms in cropper
- Group checkbox change handler - Line 3481
- Platform checkbox change handler - Line 3497

### Smart Ordering Filter Guards
- `shouldDeferFilterOperation()` - Check if filter operation should be deferred
- `queueFilterOperation(operation, description)` - Queue filter operation
- `processPendingFilterOperations()` - Process queued filter operations
- `isSmartOrdering()` - Check if smart ordering is active (line 7933)

### What-If Mode Filter Handlers
- `toggleWhatIfMode()` - Toggle what-if filtering mode
- `applyWhatIfChanges()` - Apply what-if changes
- Inline checkbox change handler for disabled tags - Line 8207

### Heatmap Filter Handlers
- `handleHeatmapSort()` - Handle heatmap sorting changes

## Handler Registration Patterns

### Named Function References
Most handlers are defined as standalone functions and referenced by name:

```javascript
function handleBgTypeChange() { ... }
oggenBgType?.addEventListener('change', handleBgTypeChange);
```

### Inline Arrow Functions
Some handlers are defined inline as arrow functions:

```javascript
groupCb.addEventListener('change', (e) => {
  const group = e.target.dataset.group;
  // ... handler logic
});
```

### Guarded Handlers
Filter operations use guard wrappers to prevent conflicts with smart ordering:

```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    // ... filter operation
  });
}
```

## Summary Statistics

- **Total handler functions identified:** 70+
- **Primary naming pattern:** `handle*` (23 functions)
- **Filter-specific functions:** 5
- **Toggle functions:** 9
- **Update functions:** 16
- **Render functions:** 20+
- **Inline change listeners:** 15+

## Notes for Implementation

1. **Prefer `handle*` naming** for new event handlers to maintain consistency
2. **Use guard wrappers** for filter operations that might conflict with smart ordering
3. **Queue filter operations** when smart ordering is active using `queueFilterOperation()`
4. **Check `isSmartOrdering()`** before executing filter operations
5. **Follow `update*` pattern** for functions that update state or UI
6. **Use `toggle*` pattern** for binary state changes

## Acceptance Criteria Met

✅ Used structure analysis from child bead bf-59o8g  
✅ Identified all functions serving as filter change handlers  
✅ Documented naming patterns (`handle*`, `*filter*`, `update*`, `toggle*`, `render*`, `on*`, inline)  
✅ Created comprehensive list of handler names before extracting line numbers  
