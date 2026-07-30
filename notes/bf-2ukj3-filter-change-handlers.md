# Filter Change Handler Functions in app.js

Compiled on: 2026-07-24

## Core Filter/Sort Functions

1. **filterCommands(e)** (Line 9177)
   - Filters command palette based on user input query
   - Attached to: command input field 'input' event (line 9085)
   - Purpose: Real-time filtering of command list

2. **renderMetadataTable(filter)** (Line 3941)
   - Renders metadata table with optional filter parameter
   - Attached to: metadataFilterInput 'input' event (line 3991)
   - Purpose: Filters metadata tags by tag name or value

3. **handleHeatmapSort()** (Line 6101)
   - Handles heatmap sorting/filtering dropdown
   - Attached to: heatmapSort 'change' event (line 332)
   - Purpose: Sorts heatmap results by score or URL

## Filter Operation Management (Smart Ordering Guard)

4. **shouldDeferFilterOperation()** (Line 7891)
   - Checks if filter operations should be deferred during smart ordering
   - Purpose: Prevents conflicts between filtering and smart ordering

5. **queueFilterOperation(operation, description)** (Line 7942)
   - Queues filter operations during smart ordering
   - Purpose: Defers filter changes when smart ordering is active

6. **processPendingFilterOperations()** (Line 7952)
   - Processes pending filter operations after smart ordering completes
   - Purpose: Executes queued filter operations

## UI Element Change Handlers (OG Generator)

7. **handleBgTypeChange()** (Line 5106)
   - Handles background type change (solid/gradient/image)
   - Attached to: oggenBgType 'change' event (line 310)

8. **handleBgImageUpload(e)** (Line 5117)
   - Handles background image file upload
   - Attached to: oggenBgImageInput 'change' event (line 315)

9. **handleLogoPosChange()** (Line 5133)
   - Handles logo position dropdown change
   - Attached to: oggenLogoPos 'change' event (line 321)

10. **handleLogoUpload(e)** (Line 5140)
    - Handles logo image file upload
    - Attached to: oggenLogoInput 'change' event (line 322)

11. **updateOggenCanvas()** (Line 5156)
    - Updates OG generator canvas
    - Attached to: Multiple 'input'/'change' events (lines 311-323)
    - Purpose: Redraws canvas when any OG generator setting changes

## Other UI Change Handlers

12. **updateBadgePreview()** (Line 4765)
    - Updates badge preview display
    - Attached to: badgeStyleSelect 'change' event (line 296)

13. **handleEditorInput(e)** (Line 6589)
    - Handles metadata editor input changes
    - Attached to: Editor input fields 'input' event (line 6801)
    - Purpose: Updates edited state and triggers preview update

14. **generateCodeSnippet()** (Line 6853)
    - Generates code snippet based on framework selection
    - Attached to: snippetFramework 'change' event (line 6813)

15. **importPreferences(e)** (Line 8057)
    - Handles preferences JSON file import
    - Attached to: importPrefsInput 'change' event (line 6831)
    - Calls: queueFilterOperation(applyImportedPrefs, ...)

## Platform/Group Selection Handlers

16. **updateEnabledPlatforms()** (Line 3551)
    - Updates enabled platforms list from checkboxes
    - Called by: Group and platform toggle handlers
    - Purpose: Rebuilds enabled set from checkbox states

17. **updateCropperOverlay()** (Line 3600)
    - Updates cropper overlay when platforms change
    - Called by: Group and platform toggle handlers

18. **syncGroupToggles(groups)** (Line 3530)
    - Syncs group header toggles with platform checkbox states
    - Called by: Platform toggle handlers
    - Purpose: Updates group headers to reflect child states (all on/off/mixed)

## What-If Mode Handlers

19. **applyWhatIfChanges()** (Line 8241)
    - Applies What-If mode changes to actual metadata
    - Attached to: whatIfApply 'click' event (line 8220)

20. **resetWhatIfToggles()** (Line 8233)
    - Resets What-If toggle states
    - Attached to: whatIfReset 'click' event (line 8219)

## Anonymous/Inline Handlers

21. **Metadata filter input handler** (Line 3991)
    - Anonymous function: `(e) => { renderMetadataTable(e.target.value); }`
    - Attached to: metadataFilterInput 'input' event

22. **Group toggle change handler** (Line 3481)
    - Anonymous function handling group header checkbox changes
    - Toggles all platforms in group and calls updateEnabledPlatforms/updateCropperOverlay/syncGroupToggles

23. **Platform toggle change handler** (Line 3497)
    - Anonymous function handling individual platform checkbox changes
    - Calls updateEnabledPlatforms/updateCropperOverlay/syncGroupToggles

24. **What-If toggle change handler** (Line 8207)
    - Anonymous function handling What-If tag toggles
    - Updates disabledTags set and calls updateHash()

## Summary Statistics

- **Named handler functions**: 20
- **Anonymous/inline handlers**: 4+
- **Total distinct change event points**: 24+

## Key Patterns Observed

1. **Smart ordering protection**: Filter operations use a queue system during smart ordering to prevent state conflicts
2. **Cascading updates**: Platform/group changes trigger multiple update functions (updateEnabledPlatforms → updateCropperOverlay → syncGroupToggles)
3. **Debounced updates**: Editor input uses 300ms timeout for preview updates
4. **Real-time filtering**: Command palette and metadata table use immediate 'input' event filtering
