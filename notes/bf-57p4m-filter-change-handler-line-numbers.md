# Filter Change Handler Functions - Line Number Reference

Compiled on: 2026-07-24  
Bead: bf-57p4m

## Core Filter/Sort Functions

1. **filterCommands(e)** - Line 9177
   - Filters command palette based on user input query
   - Event listener attached at line 9085
   - Element: `commandInput` 'input' event

2. **renderMetadataTable(filter)** - Line 3941
   - Renders metadata table with optional filter parameter
   - Event listener attached at line 3991 (anonymous handler)
   - Element: `metadataFilterInput` 'input' event

3. **handleHeatmapSort()** - Line 6101
   - Handles heatmap sorting/filtering dropdown
   - Event listener attached at line 332
   - Element: `heatmapSort` 'change' event

## Filter Operation Management (Smart Ordering Guard)

4. **shouldDeferFilterOperation()** - Line 7891
   - Checks if filter operations should be deferred during smart ordering
   - Guard function for filter operation queuing

5. **queueFilterOperation(operation, description)** - Line 7942
   - Queues filter operations during smart ordering
   - Defers filter changes when smart ordering is active

6. **processPendingFilterOperations()** - Line 7952
   - Processes pending filter operations after smart ordering completes
   - Executes queued filter operations

## UI Element Change Handlers (OG Generator)

7. **handleBgTypeChange()** - Line 5106
   - Handles background type change (solid/gradient/image)
   - Event listener attached at line 310
   - Element: `oggenBgType` 'change' event

8. **handleBgImageUpload(e)** - Line 5117
   - Handles background image file upload
   - Event listener attached at line 315
   - Element: `oggenBgImageInput` 'change' event

9. **handleLogoPosChange()** - Line 5133
   - Handles logo position dropdown change
   - Event listener attached at line 321
   - Element: `oggenLogoPos` 'change' event

10. **handleLogoUpload(e)** - Line 5140
    - Handles logo image file upload
    - Event listener attached at line 322
    - Element: `oggenLogoInput` 'change' event

11. **updateOggenCanvas()** - Line 5156
    - Updates OG generator canvas
    - Attached to multiple 'input'/'change' events (lines 311-323)
    - Purpose: Redraws canvas when any OG generator setting changes

## Other UI Change Handlers

12. **updateBadgePreview()** - Line 4765
    - Updates badge preview display
    - Event listener attached at line 296
    - Element: `badgeStyleSelect` 'change' event

13. **handleEditorInput(e)** - Line 6589
    - Handles metadata editor input changes
    - Event listener attached at line 6801
    - Element: Editor input fields 'input' event
    - Purpose: Updates edited state and triggers preview update

14. **generateCodeSnippet()** - Line 6853
    - Generates code snippet based on framework selection
    - Event listener attached at line 6813
    - Element: `snippetFramework` 'change' event

15. **importPreferences(e)** - Line 8057
    - Handles preferences JSON file import
    - Event listener attached at line 6831
    - Element: `importPrefsInput` 'change' event
    - Calls: `queueFilterOperation(applyImportedPrefs, ...)`

## Platform/Group Selection Handlers

16. **updateEnabledPlatforms()** - Line 3551
    - Updates enabled platforms list from checkboxes
    - Called by: Group and platform toggle handlers
    - Purpose: Rebuilds enabled set from checkbox states

17. **updateCropperOverlay()** - Line 3600
    - Updates cropper overlay when platforms change
    - Called by: Group and platform toggle handlers

18. **syncGroupToggles(groups)** - Line 3530
    - Syncs group header toggles with platform checkbox states
    - Called by: Platform toggle handlers
    - Purpose: Updates group headers to reflect child states (all on/off/mixed)

## What-If Mode Handlers

19. **applyWhatIfChanges()** - Line 8241
    - Applies What-If mode changes to actual metadata
    - Event listener attached at line 8220
    - Element: `whatIfApply` 'click' event

20. **resetWhatIfToggles()** - Line 8233
    - Resets What-If toggle states
    - Event listener attached at line 8219
    - Element: `whatIfReset` 'click' event

## Anonymous/Inline Handlers

21. **Metadata filter input handler** - Line 3991
    - Anonymous function: `(e) => { renderMetadataTable(e.target.value); }`
    - Element: `metadataFilterInput` 'input' event

22. **Group toggle change handler** - Line 3481
    - Anonymous function handling group header checkbox changes
    - Element: `.cropper-group-toggle` 'change' events
    - Actions: Toggles all platforms in group, then calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

23. **Platform toggle change handler** - Line 3497
    - Anonymous function handling individual platform checkbox changes
    - Element: `.cropper-platform-toggle input` 'change' events
    - Actions: Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

24. **What-If toggle change handler** - Line 8207
    - Anonymous function handling What-If tag toggles
    - Element: `.what-if-toggle input` 'change' events
    - Actions: Updates `disabledTags` set and calls `updateHash()`

25. **Command input filter handler** - Line 9085
    - Event listener attachment: `input.addEventListener('input', filterCommands)`
    - Element: `commandInput` 'input' event
    - References named function `filterCommands` (line 9177)

## Summary Statistics

- **Named handler functions**: 20
- **Anonymous/inline handlers**: 5
- **Total distinct change event points**: 25

## Event Listener Attachment Points

| Handler | Listener Line | Function Line | Event Type | Element |
|---------|--------------|---------------|------------|---------|
| filterCommands | 9085 | 9177 | input | commandInput |
| renderMetadataTable | 3991 | 3941 | input | metadataFilterInput |
| handleHeatmapSort | 332 | 6101 | change | heatmapSort |
| handleBgTypeChange | 310 | 5106 | change | oggenBgType |
| handleBgImageUpload | 315 | 5117 | change | oggenBgImageInput |
| handleLogoPosChange | 321 | 5133 | change | oggenLogoPos |
| handleLogoUpload | 322 | 5140 | change | oggenLogoInput |
| updateBadgePreview | 296 | 4765 | change | badgeStyleSelect |
| generateCodeSnippet | 6813 | 6853 | change | snippetFramework |
| importPreferences | 6831 | 8057 | change | importPrefsInput |
| applyWhatIfChanges | 8220 | 8241 | click | whatIfApply |
| resetWhatIfToggles | 8219 | 8233 | click | whatIfReset |
| Group toggle | 3481 | - | change | .cropper-group-toggle |
| Platform toggle | 3497 | - | change | .cropper-platform-toggle input |
| What-If toggle | 8207 | - | change | .what-if-toggle input |

## Key Patterns Observed

1. **Smart ordering protection**: Filter operations use a queue system during smart ordering to prevent state conflicts
2. **Cascading updates**: Platform/group changes trigger multiple update functions (`updateEnabledPlatforms` → `updateCropperOverlay` → `syncGroupToggles`)
3. **Debounced updates**: Editor input uses 300ms timeout for preview updates
4. **Real-time filtering**: Command palette and metadata table use immediate 'input' event filtering
5. **Anonymous vs Named**: Most handlers use named functions for reusability, but some inline handlers use anonymous functions for simple one-liners
