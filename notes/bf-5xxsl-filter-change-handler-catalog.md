# Filter Change Handler Catalog - app.js

## Task
Extract all filter change handler function names with exact line numbers from `/home/coding/vista/src/public/app.js`.

## Raw Handler List by Pattern

### `handle*` Pattern Functions
Direct event handlers that respond to user interactions:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `handleBgTypeChange()` | 5106 | Handles OG Generator background type changes |
| `handleBgImageUpload(e)` | 5117 | Handles background image uploads |
| `handleLogoPosChange()` | 5133 | Handles logo position changes |
| `handleLogoUpload(e)` | 5140 | Handles logo uploads |
| `handleSwapUrls()` | 5499 | Handles URL swapping in compare mode |
| `handleHeatmapSort()` | 6101 | Handles heatmap sorting changes |
| `handleEditorInput(e)` | 6589 | Handles editor input changes |
| `handleCommandKeydown(e)` | 9194 | Handles command palette keyboard navigation |
| `handleDragStart(e)` | 9532 | Drag and drop start handler |
| `handleDragEnd(e)` | 9540 | Drag and drop end handler |
| `handleDragOver(e)` | 9547 | Drag and drop over handler |
| `handleDragEnter(e)` | 9555 | Drag and drop enter handler |
| `handleDragLeave(e)` | 9561 | Drag and drop leave handler |
| `handleDrop(e)` | 9565 | Drag and drop drop handler |
| `handleContextMenuAction(e)` | 9771 | Context menu action handler |
| `handleTouchStart(e)` | 9828 | Touch event start handler |
| `handleTouchEnd(e)` | 9853 | Touch event end handler |
| `handleTouchMove(e)` | 9888 | Touch event move handler |
| `handleHorizontalSwipe(deltaX, card)` | 9908 | Horizontal swipe handler |
| `handleVerticalSwipe(deltaY, card)` | 9969 | Vertical swipe handler |

**Total handle* handlers: 20**

### `toggle*` Pattern Functions
Functions that toggle binary states:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `toggleGlobalTheme()` | 108 | Toggles light/dark theme |
| `toggleCardContext(pid, data)` | 2162 | Toggles platform card context mode |
| `toggleCardTheme(pid, data)` | 2175 | Toggles card theme (light/dark) |
| `toggleCharGaugeGroup(groupId)` | 6529 | Toggles character gauge group visibility |
| `toggleAllCharGauges(fieldId)` | 6549 | Toggles all character gauges for a field |
| `toggleFavorite(pid)` | 7867 | Toggles platform favorite status |
| `toggleHidden(pid)` | 7977 | Toggles platform hidden status |
| `toggleWhatIfMode()` | 8121 | Toggles What If mode |
| `toggleCommandPalette()` | 9105 | Toggles command palette visibility |

**Total toggle* handlers: 9**

### `update*` Pattern Functions
Functions that update state or UI in response to changes:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `updateHash(options = {})` | 404 | Updates URL hash state |
| `updateDiagnostics(data)` | 900 | Updates diagnostic display |
| `updatePreviewsWithImages(data)` | 1930 | Updates previews with image data |
| `updateCardHeader(pid)` | 2186 | Updates platform card header |
| `updateEnabledPlatforms()` | 3551 | Updates enabled platforms in cropper |
| `updateCropperOverlay()` | 3600 | Updates cropper visual overlays |
| `updateBadgePreview()` | 4765 | Updates badge preview |
| `updateOggenCanvas()` | 5156 | Updates OG Generator canvas |
| `updateEditorFieldImpactLabels(data)` | 6322 | Updates editor impact labels |
| `updateEditorCharCounts()` | 6382 | Updates character counts in editor |
| `updateEditedCardsInPlace(data)` | 6708 | Updates cards with edits |
| `updatePreviewsWithEdits()` | 6737 | Updates previews after edits |
| `updateColumnLayoutUI()` | 7859 | Updates column layout UI |
| `updateFavoritesList()` | 7990 | Updates favorites list |
| `updateHiddenList()` | 8012 | Updates hidden platforms list |
| `updateCommandActiveDescendant()` | 9170 | Updates command palette active item |
| `updateDiagnosticProgress()` | 8610 | Updates diagnostic progress |

**Total update* handlers: 17**

### `sync*` Pattern Functions
Functions that synchronize state across components:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `syncGroupToggles(groups)` | 3530 | Syncs group checkbox states with platform toggles |
| `syncInlineEditToEditor(tag, value)` | 8385 | Syncs inline edits to editor form |

**Total sync* handlers: 2**

### `apply*` Pattern Functions
Functions that apply changes or transformations:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `applyTheme(theme)` | 94 | Applies theme to document |
| `applyRescore()` | 6669 | Applies re-scoring to all platforms |
| `applyTemplate(templateId)` | 7634 | Applies meta tag template |
| `applyWhatIfChanges()` | 8241 | Applies What If tag exclusions |
| `applyPendingWhatIfTags()` | 8286 | Applies pending What If tag changes |
| `applyDiagnosticFix(index)` | 8478 | Applies diagnostic fix |
| `applySmartOrdering()` | 8744 | Applies smart platform ordering |
| `applySmartOrderingSafe()` | 8988 | Safe version of smart ordering |

**Total apply* handlers: 8**

### `filter*` Pattern Functions
Specialized filtering functions:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `renderMetadataTable(filter = '')` | 3941 | Renders metadata table with optional filter |
| `filterCommands(e)` | 9177 | Filters command palette items based on search input |

**Total filter* handlers: 2**

### Filter Operation Management Functions
Centralized guard functions for filter operations during smart ordering:

| Handler Name | Line Number | Description |
|-------------|-------------|-------------|
| `shouldDeferFilterOperation()` | 7891 | Checks if filter operation should be deferred |
| `isSmartOrdering()` | 7933 | Checks if smart ordering is active |
| `queueFilterOperation(operation, description)` | 7942 | Queues filter operations during smart ordering |
| `processPendingFilterOperations()` | 7952 | Processes queued filter operations after smart ordering completes |

**Total filter management handlers: 4**

## Summary Statistics

- **Total filter change handlers: 62**
- **handle* pattern: 20** (32%)
- **update* pattern: 17** (27%)
- **toggle* pattern: 9** (15%)
- **apply* pattern: 8** (13%)
- **sync* pattern: 2** (3%)
- **filter* pattern: 2** (3%)
- **filter management: 4** (6%)

## Source File
`/home/coding/vista/src/public/app.js` (367KB)

## Pattern Reference
Based on pattern identification from bead bf-654ze-filter-change-handler-patterns.md
