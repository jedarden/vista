# Filter Change Handler Extraction (bf-33i4n)

## Task
Extract all filter change handler function names from `src/public/app.js`.

## Results

### Handlers Found (10 unique)
Extracted from `addEventListener('change', handlerName)` patterns:

1. `filterCommands` - Commands filter input handler (line 9085)
2. `updateBadgePreview` - Badge style change handler (line 296)
3. `handleBgTypeChange` - Background type change handler (line 310)
4. `updateOggenCanvas` - OG image canvas update handler (lines 314, 316, 319)
5. `handleBgImageUpload` - Background image upload handler (line 315)
6. `handleLogoPosChange` - Logo position change handler (line 321)
7. `handleLogoUpload` - Logo upload handler (line 322)
8. `handleHeatmapSort` - Heatmap sort change handler (line 332)
9. `generateCodeSnippet` - Code snippet framework change handler (line 6813)
10. `importPreferences` - Preferences import handler (line 6831)

### Inline Handlers (anonymous)
Additional change listeners use inline arrow functions and have no names:
- Line 3481: `groupCb.addEventListener('change', (e) => {...})`
- Line 3497: `cb.addEventListener('change', () => {...})`
- Line 3991: `filterInput.addEventListener('input', (e) => {...})`
- Line 8207: `cb.addEventListener('change', () => {...})`

### Filter Infrastructure Functions
Helper functions used by filter handlers (not direct event handlers):
- `queueFilterOperation(operation, description)` - Queues filter operations
- `processPendingFilterOperations()` - Processes queued filter operations
- `shouldDeferFilterOperation()` - Checks if filter operations should be deferred

## Output
- Handler names saved to: `/tmp/filter-handler-names.txt`
- Total named handlers: 10
