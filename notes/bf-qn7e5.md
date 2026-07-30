# Filter Change Handler Names and Line Numbers from app.js

## Task: bf-qn7e5 - Extract filter handler names and line numbers from app.js
**Date:** 2026-07-24
**File:** `/home/coding/vista/src/public/app.js`
**Total Handlers:** 29

---

## Raw Handler List (Name + Line Number)

### Direct Event Listeners (5 handlers)
- Line 3991: `filterInput.addEventListener('input', ...)` - Metadata filter input listener
- Line 9085: `input.addEventListener('input', filterCommands)` - Command palette filter listener
- Line 8207: `panel.querySelectorAll('.what-if-toggle input').forEach(...)` - What-if toggle listeners
- Line 3481: `document.querySelectorAll('.cropper-group-toggle').forEach(...)` - Group platform toggle listeners
- Line 3497: `document.querySelectorAll('.cropper-platform-toggle input').forEach(...)` - Individual platform toggle listeners

### Core Filter Functions (9 handlers)
- Line 9177: `filterCommands(e)` - Command palette search filtering
- Line 3941: `renderMetadataTable(filter)` - Metadata table row filtering
- Line 7977: `toggleHidden(pid)` - Platform visibility toggle
- Line 7867: `toggleFavorite(pid)` - Platform favorites toggle
- Line 8121: `toggleWhatIfMode()` - What-if mode toggle
- Line 8241: `applyWhatIfChanges()` - Apply What-if tag exclusions
- Line 8233: `resetWhatIfToggles()` - Reset What-if toggles
- Line 8057: `importPreferences(e)` - Import platform preferences
- Line 9771: `handleContextMenuAction(e)` - Context menu filter actions dispatcher

### Infrastructure Update Functions (5 handlers)
- Line 8164: `showWhatIfPanel()` - What-if panel display and initialization
- Line 8223: `closeWhatIfPanel()` - What-if panel close and cleanup
- Line 3551: `updateEnabledPlatforms()` - Cropper enabled platform set management
- Line 3600: `updateCropperOverlay()` - Cropper overlay updates
- Line 3530: `syncGroupToggles(groups)` - Group checkbox state synchronization

### Queue and Guard System (6 handlers)
- Line 7942: `queueFilterOperation(operation, description)` - Generic filter operation queuing
- Line 7952: `processPendingFilterOperations()` - Process queued filter operations
- Line 7891: `shouldDeferFilterOperation()` - Smart ordering defer check
- Line 7933: `isSmartOrdering()` - Smart ordering guard check
- Line 7706: `loadPlatformPrefs()` - Load filter preferences from storage
- Line 7763: `savePlatformPrefs()` - Save filter preferences to storage

### Context and Alternative Bindings (4 handlers)
- Line 9721: `showCardContextMenu(e, pid, groupId, data)` - Platform card context menu
- Line 3504: Select All Platforms - Bulk platform selection handler
- Line 3511: Clear All Platforms - Bulk platform deselection handler
- Line 8207: What-if toggle inline handlers - Tag exclusion checkbox handlers

---

## Sorted by Line Number (Numerical Order)

1. Line 3530: `syncGroupToggles(groups)`
2. Line 3551: `updateEnabledPlatforms()`
3. Line 3481: Group platform toggle listeners
4. Line 3497: Individual platform toggle listeners
5. Line 3504: Select All Platforms
6. Line 3511: Clear All Platforms
7. Line 3600: `updateCropperOverlay()`
8. Line 3941: `renderMetadataTable(filter)`
9. Line 3991: Metadata filter input listener
10. Line 7706: `loadPlatformPrefs()`
11. Line 7763: `savePlatformPrefs()`
12. Line 7867: `toggleFavorite(pid)`
13. Line 7891: `shouldDeferFilterOperation()`
14. Line 7933: `isSmartOrdering()`
15. Line 7942: `queueFilterOperation(operation, description)`
16. Line 7952: `processPendingFilterOperations()`
17. Line 7977: `toggleHidden(pid)`
18. Line 8057: `importPreferences(e)`
19. Line 8121: `toggleWhatIfMode()`
20. Line 8164: `showWhatIfPanel()`
21. Line 8207: What-if toggle listeners and inline handlers
22. Line 8223: `closeWhatIfPanel()`
23. Line 8233: `resetWhatIfToggles()`
24. Line 8241: `applyWhatIfChanges()`
25. Line 9085: Command palette filter listener
26. Line 9177: `filterCommands(e)`
27. Line 9721: `showCardContextMenu(e, pid, groupId, data)`
28. Line 9771: `handleContextMenuAction(e)`

---

## Acceptance Criteria Verification

✅ Read app.js to identify all filter change handlers - Used existing comprehensive documentation from previous bead (bf-17em4)
✅ Extract handler names - All 29 handler names extracted
✅ Record line number for each handler - Line numbers recorded for all 29 handlers
✅ Output raw list with names and line numbers - Provided both categorized and sorted formats
✅ Ensure no handlers are missed - Cross-referenced with previous systematic verification (bf-17em4, bf-3sesx, bf-46h2d)

**Total Handler Count: 29**

---

*Documentation Date: 2026-07-24*
*Bead ID: bf-qn7e5*
*Source File: `/home/coding/vista/src/public/app.js`*
