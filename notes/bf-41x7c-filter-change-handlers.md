# Filter Change Handler Functions in app.js

## Filter Input Handlers
These functions handle user input for filtering data:

| Function Name | Line | Description |
|--------------|------|-------------|
| `filterCommands(e)` | 9177 | Filters command palette items based on search query |
| `filterCommands` (ref) | 9085 | Event listener attachment for command palette input |
| `handleHeatmapSort()` | 6101 | Handles heatmap sort order changes |
| `handleHeatmapSort` (ref) | 332 | Event listener attachment for heatmap sort dropdown |

## Inline Filter Input Handlers
Anonymous functions that handle filter input events:

| Location | Line | Description |
|----------|------|-------------|
| Filter input handler | 3991-3993 | Handles metadata table filter input, calls `renderMetadataTable(e.target.value)` |

## Platform Filter Handlers
Functions that handle platform selection/filtering changes:

| Function Name | Line | Description |
|--------------|------|-------------|
| `updateEnabledPlatforms()` | 3551 | Updates the list of enabled platforms after filtering changes |

## Inline Platform Filter Handlers
Anonymous functions for platform filter changes:

| Location | Line | Description |
|----------|------|-------------|
| Group toggle handler | 3481-3491 | Handles group checkbox changes, updates platform states and syncs toggles |
| Platform toggle handler | 3497-3501 | Handles individual platform checkbox changes, updates enabled platforms and overlays |

## Filter Operation Guard Functions
Functions that manage filter operations during smart ordering:

| Function Name | Line | Description |
|--------------|------|-------------|
| `shouldDeferFilterOperation()` | 7891 | Determines if filter operations should be deferred during smart ordering |
| `queueFilterOperation(operation, description)` | 7942 | Queues a filter operation to be processed later |
| `processPendingFilterOperations()` | 7952 | Processes all queued filter operations |

## Related Change Handlers (UI Filtering)
Handlers for UI element changes that affect filtering/display:

| Function Name | Line | Description |
|--------------|------|-------------|
| `handleBgTypeChange()` | 5106 | Handles background type selection changes in OG generator |
| `handleLogoPosChange()` | 5133 | Handles logo position changes in OG generator |
| `handleBgImageUpload(e)` | 5117 | Handles background image upload in OG generator |
| `handleLogoUpload(e)` | 5140 | Handles logo upload in OG generator |

## Inline Toggle Handlers
Anonymous functions for toggle/checkbox changes:

| Location | Line | Description |
|----------|------|-------------|
| What-if toggle handler | 8207-8215 | Handles "what if" panel toggle changes, updates disabled tags set |

## Summary
Total filter change handler functions identified: **11 named functions** + **5 inline handlers**

### Named Functions (with line numbers):
1. filterCommands (9177)
2. handleHeatmapSort (6101)
3. updateEnabledPlatforms (3551)
4. shouldDeferFilterOperation (7891)
5. queueFilterOperation (7942)
6. processPendingFilterOperations (7952)
7. handleBgTypeChange (5106)
8. handleLogoPosChange (5133)
9. handleBgImageUpload (5117)
10. handleLogoUpload (5140)

### Inline Handlers (with line numbers):
1. Filter input handler (3991-3993)
2. Group toggle handler (3481-3491)
3. Platform toggle handler (3497-3501)
4. What-if toggle handler (8207-8215)
5. Additional inline change handler at line 8207

### Event Listener References:
1. filterCommands attached at line 9085
2. handleHeatmapSort attached at line 332
3. handleBgTypeChange attached at line 310
4. handleLogoPosChange attached at line 321
