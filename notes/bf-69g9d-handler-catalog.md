# Vista Handler Catalog - Complete Reference

**Bead:** bf-69g9d  
**Date:** 2026-07-24  
**Source:** `/home/coding/vista/src/public/app.js`  
**Total Handlers Documented:** 62

---

## Overview

This catalog provides a comprehensive reference to all filter change handlers in the Vista application. Handlers are organized by naming pattern and include detailed descriptions of their purposes, functionality, locations, and behaviors.

**Handler Categories:**
- **`handle*`** - Direct event handlers responding to user interactions (20 handlers)
- **`update*`** - State/UI update functions (17 handlers)  
- **`toggle*`** - Binary state toggles (9 handlers)
- **`apply*`** - Change application functions (8 handlers)
- **`sync*`** - State synchronization functions (2 handlers)
- **`filter*`** - Specialized filtering functions (2 handlers)
- **Filter Management** - Smart ordering guard functions (4 handlers)

---

## 1. handle* Pattern Functions (20 handlers)

Direct event handlers that respond to user interactions with UI elements.

### `handleBgTypeChange()` — Line 5106
**Purpose:** Handles background type changes in the OG Generator interface.  
**Functionality:** Switches between solid color, gradient, and image background options.  
**Trigger:** User changes background type selection in OG Generator.  
**State Changes:** Updates OG generator canvas preview.

### `handleBgImageUpload(e)` — Line 5117  
**Purpose:** Handles background image uploads for the OG Generator.  
**Functionality:** Processes user-selected image files and applies them as backgrounds.  
**Trigger:** User selects an image file via file input.  
**State Changes:** Updates background image data and canvas preview.

### `handleLogoPosChange()` — Line 5133
**Purpose:** Handles logo position changes in the OG Generator.  
**Functionality:** Changes logo placement between corners (top-left, top-right, bottom-left, bottom-right).  
**Trigger:** User changes logo position dropdown.  
**State Changes:** Updates logo position state and canvas preview.

### `handleLogoUpload(e)` — Line 5140
**Purpose:** Handles logo image uploads for the OG Generator.  
**Functionality:** Processes user-selected logo files and applies them to the OG card.  
**Trigger:** User selects a logo file via file input.  
**State Changes:** Updates logo image data and canvas preview.

### `handleHeatmapSort()` — Line 6101
**Purpose:** Handles sorting changes in the sitemap heatmap display.  
**Functionality:** Sorts heatmap results by score (ascending/descending) or URL (ascending/descending).  
**Trigger:** User changes sort order dropdown in sitemap heatmap.  
**State Changes:** Display-only (no state persistence).

### `handleEditorInput(e)` — Line 6589
**Purpose:** Handles text input changes in the metadata editor.  
**Functionality:** Processes user edits to metadata fields and updates impact labels.  
**Trigger:** User types in editor text fields.  
**State Changes:** Updates editor state, character counts, and impact labels.

### `handleSwapUrls()` — Line 5499
**Purpose:** Handles URL swapping in compare mode.  
**Functionality:** Swaps the URLs being compared in side-by-side comparison view.  
**Trigger:** User clicks swap button in compare mode.  
**State Changes:** Swaps URL order in comparison state.

### `handleCommandKeydown(e)` — Line 9194
**Purpose:** Handles keyboard navigation in the command palette.  
**Functionality:** Processes arrow keys, Enter, Escape for command selection and execution.  
**Trigger:** User presses keyboard keys while command palette is open.  
**State Changes:** Updates selected command index and executes commands.

### `handleDragStart(e)` — Line 9532
**Purpose:** Handles drag and drop operation start.  
**Functionality:** Initializes drag state and sets drag data for platform card reordering.  
**Trigger:** User starts dragging a platform card.  
**State Changes:** Sets drag operation state.

### `handleDragEnd(e)` — Line 9540
**Purpose:** Handles drag and drop operation end.  
**Functionality:** Finalizes drag operation and updates platform order if reorder occurred.  
**Trigger:** User releases mouse during drag operation.  
**State Changes:** Updates platform order if applicable.

### `handleDragOver(e)` — Line 9547
**Purpose:** Handles drag over events during drag operations.  
**Functionality:** Manages drop target highlighting and prevents default drag behavior.  
**Trigger:** User drags element over drop zone.  
**State Changes:** Visual drop target indication.

### `handleDragEnter(e)` — Line 9555
**Purpose:** Handles drag enter events for drop zone detection.  
**Functionality:** Detects when draggable element enters a valid drop target.  
**Trigger:** Dragged element crosses into drop zone boundary.  
**State Changes:** Drop zone visual state.

### `handleDragLeave(e)` — Line 9561
**Purpose:** Handles drag leave events for drop zone detection.  
**Functionality:** Detects when draggable element exits a drop target.  
**Trigger:** Dragged element crosses out of drop zone boundary.  
**State Changes:** Removes drop zone highlighting.

### `handleDrop(e)` — Line 9565
**Purpose:** Handles drop events to complete drag and drop operations.  
**Functionality:** Processes dropped element and completes reordering or placement.  
**Trigger:** User releases mouse button over valid drop target.  
**State Changes:** Finalizes platform reordering.

### `handleContextMenuAction(e)` — Line 9771
**Purpose:** Handles context menu action selection.  
**Functionality:** Executes selected context menu action (copy, edit, delete, etc.).  
**Trigger:** User clicks context menu item.  
**State Changes:** Executes action-specific state changes.

### `handleTouchStart(e)` — Line 9828
**Purpose:** Handles touch event start for mobile interactions.  
**Functionality:** Records initial touch position for swipe detection.  
**Trigger:** User touches screen on touch-enabled device.  
**State Changes:** Records touch coordinates.

### `handleTouchEnd(e)` — Line 9853
**Purpose:** Handles touch event end for swipe detection.  
**Functionality:** Calculates swipe direction and distance from touch start/end coordinates.  
**Trigger:** User lifts finger from touch-enabled screen.  
**State Changes:** Triggers horizontal or vertical swipe handlers.

### `handleTouchMove(e)` — Line 9888
**Purpose:** Handles touch move events during swipe operations.  
**Functionality:** Tracks finger movement during touch for real-time feedback.  
**Trigger:** User moves finger while touching screen.  
**State Changes:** Updates touch position tracking.

### `handleHorizontalSwipe(deltaX, card)` — Line 9908
**Purpose:** Handles horizontal swipe gestures on platform cards.  
**Functionality:** Processes left/right swipes for navigation or actions.  
**Trigger:** Horizontal swipe detected via touch events.  
**State Changes:** Executes swipe-specific actions.

### `handleVerticalSwipe(deltaY, card)` — Line 9969
**Purpose:** Handles vertical swipe gestures on platform cards.  
**Functionality:** Processes up/down swipes for navigation or actions.  
**Trigger:** Vertical swipe detected via touch events.  
**State Changes:** Executes swipe-specific actions.

---

## 2. update* Pattern Functions (17 handlers)

Functions that update application state or refresh UI components.

### `updateHash(options = {})` — Line 404
**Purpose:** Updates URL hash to reflect current application state.  
**Functionality:** Serializes state to URL hash for shareable links and back button support.  
**Trigger:** Called after any state change that should be reflected in URL.  
**State Changes:** Updates browser URL hash.

### `updateDiagnostics(data)` — Line 900
**Purpose:** Updates diagnostic display with current metadata analysis results.  
**Functionality:** Refreshes diagnostic UI with latest analysis data.  
**Trigger:** After metadata analysis completes.  
**State Changes:** Updates diagnostic display UI.

### `updatePreviewsWithImages(data)` — Line 1930
**Purpose:** Updates platform preview cards with fetched image data.  
**Functionality:** Refreshes preview cards to include loaded images.  
**Trigger:** After platform images are fetched.  
**State Changes:** Updates preview card UI with images.

### `updateCardHeader(pid)` — Line 2186
**Purpose:** Updates an individual platform card's header display.  
**Functionality:** Refreshes card header with current platform data and theme.  
**Trigger:** Platform data or theme change for specific card.  
**State Changes:** Updates specific card header UI.

### `updateEnabledPlatforms()` — Line 3551
**Purpose:** Updates which platform overlays are enabled in cropper view.  
**Functionality:** Collects enabled platform states from checkboxes and updates overlay set.  
**Trigger:** User toggles platform visibility in cropper.  
**State Changes:** Updates `cropperState.enabledPlatforms` Set.

### `updateCropperOverlay()` — Line 3600
**Purpose:** Updates visual overlay rectangles in image cropper.  
**Functionality:** Redraws platform boundary rectangles based on enabled platforms.  
**Trigger:** Platform toggles or cropper state changes.  
**State Changes:** Updates cropper overlay visual elements.

### `updateBadgePreview()` — Line 4765
**Purpose:** Updates badge preview in badge generation modal.  
**Functionality:** Regenerates badge image with current score, platform count, and style.  
**Trigger:** User changes badge style dropdown.  
**State Changes:** Display-only (regenerates preview).

### `updateOggenCanvas()` — Line 5156
**Purpose:** Updates OG Generator canvas with current settings.  
**Functionality:** Regenerates OG card preview with current background, text, and logo.  
**Trigger:** Any OG Generator setting change.  
**State Changes:** Display-only (regenerates canvas).

### `updateEditorFieldImpactLabels(data)` — Line 6322
**Purpose:** Updates impact indicator labels in the metadata editor.  
**Functionality:** Shows which fields would be affected by template application.  
**Trigger:** Template selection or editor state change.  
**State Changes:** Updates impact label UI.

### `updateEditorCharCounts()` — Line 6382
**Purpose:** Updates character count displays in editor fields.  
**Functionality:** Recalculates and displays character counts for text fields.  
**Trigger:** User types in editor text fields.  
**State Changes:** Updates character count UI.

### `updateEditedCardsInPlace(data)` — Line 6708
**Purpose:** Updates preview cards in place without full re-render.  
**Functionality:** Selectively updates only edited card elements to preserve UI state.  
**Trigger:** After metadata edits are applied.  
**State Changes:** Updates edited card UI elements.

### `updatePreviewsWithEdits()` — Line 6737
**Purpose:** Updates all preview cards with current edits applied.  
**Functionality:** Full refresh of preview cards incorporating all pending edits.  
**Trigger:** User applies edits or changes editor state.  
**State Changes:** Updates all preview cards.

### `updateColumnLayoutUI()` — Line 7859
**Purpose:** Updates column count display and layout controls.  
**Functionality:** Refreshes column count UI and associated control states.  
**Trigger:** Column count preference change.  
**State Changes:** Updates column layout UI elements.

### `updateFavoritesList()` — Line 7990
**Purpose:** Updates favorites list display with current favorite platforms.  
**Functionality:** Rebuilds favorites list UI from `platformPrefs.favorites` Set.  
**Trigger:** User adds/removes favorite platform.  
**State Changes:** Updates favorites list UI.

### `updateHiddenList()` — Line 8012
**Purpose:** Updates hidden platforms list display.  
**Functionality:** Rebuilds hidden list UI from `platformPrefs.hidden` Set.  
**Trigger:** User hides/shows platform.  
**State Changes:** Updates hidden list UI.

### `updateCommandActiveDescendant()` — Line 9170
**Purpose:** Updates command palette active descendant for accessibility.  
**Functionality:** Sets ARIA active descendant for screen reader announcements.  
**Trigger:** Selected command changes in palette.  
**State Changes:** Updates accessibility attributes.

### `updateDiagnosticProgress()` — Line 8610
**Purpose:** Updates diagnostic progress indicator during analysis.  
**Functionality:** Shows progress of ongoing metadata diagnostic operations.  
**Trigger:** During diagnostic operation execution.  
**State Changes:** Updates progress UI.

---

## 3. toggle* Pattern Functions (9 handlers)

Functions that toggle binary states between on/off.

### `toggleGlobalTheme()` — Line 108
**Purpose:** Toggles application-wide light/dark theme.  
**Functionality:** Switches CSS theme classes and persists preference to localStorage.  
**Trigger:** User clicks theme toggle button.  
**State Changes:** `currentTheme`, localStorage, document classes.

### `toggleCardContext(pid, data)` — Line 2162
**Purpose:** Toggles context mode display for a platform card.  
**Functionality:** Switches card between standard and context view modes.  
**Trigger:** User clicks context toggle on card.  
**State Changes:** Card display mode state.

### `toggleCardTheme(pid, data)` — Line 2175
**Purpose:** Toggles individual card theme (light/dark).  
**Functionality:** Switches specific card between light and dark theme.  
**Trigger:** User clicks card theme toggle.  
**State Changes:** Card theme class and state.

### `toggleCharGaugeGroup(groupId)` — Line 6529
**Purpose:** Toggles visibility of character gauge groups in editor.  
**Functionality:** Shows/hides all character gauges in a metadata field group.  
**Trigger:** User clicks character gauge group header.  
**State Changes:** Group visibility state.

### `toggleAllCharGauges(fieldId)` — Line 6549
**Purpose:** Toggles all character gauges for a specific field.  
**Functionality:** Shows/hides all character count indicators for one metadata field.  
**Trigger:** User clicks field character gauge toggle.  
**State Changes:** Field character gauge visibility.

### `toggleFavorite(pid)` — Line 7867
**Purpose:** Toggles platform favorite status.  
**Functionality:** Adds/removes platform ID to/from favorites Set and updates UI.  
**Trigger:** User clicks favorite star on platform card.  
**State Changes:** `platformPrefs.favorites` Set, localStorage, favorites list UI.

### `toggleHidden(pid)` — Line 7977
**Purpose:** Toggles platform visibility (hide/show).  
**Functionality:** Adds/removes platform ID to/from hidden Set, triggers full re-render.  
**Trigger:** User clicks visibility toggle or removes from hidden list.  
**State Changes:** `platformPrefs.hidden` Set, localStorage, smart ordering active flag, preview cards.

### `toggleWhatIfMode()` — Line 8121
**Purpose:** Toggles "What If" simulation mode.  
**Functionality:** Enables/disables simulation mode for testing missing metadata tags.  
**Trigger:** User clicks "What If" mode toggle button.  
**State Changes:** `whatIfMode` boolean, `disabledTags` Set, smart ordering flag, What If panel visibility.

### `toggleCommandPalette()` — Line 9105
**Purpose:** Toggles command palette visibility.  
**Functionality:** Opens/closes the command palette modal.  
**Trigger:** User presses Cmd/Ctrl+K or clicks command palette trigger.  
**State Changes:** Command palette visibility, focus state.

---

## 4. apply* Pattern Functions (8 handlers)

Functions that apply changes, transformations, or fixes to application state.

### `applyTheme(theme)` — Line 94
**Purpose:** Applies a specific theme to the application.  
**Functionality:** Sets document CSS classes for selected theme.  
**Trigger:** Theme initialization or explicit theme change.  
**State Changes:** Document theme classes, `currentTheme` state.

### `applyRescore()` — Line 6669
**Purpose:** Re-scores all platforms with updated scoring logic.  
**Functionality:** Re-runs scoring algorithm on all platform metadata.  
**Trigger:** User clicks re-score button or scoring rules change.  
**State Changes:** All platform scores, rankings, preview card order.

### `applyTemplate(templateId)` — Line 7634
**Purpose:** Applies a metadata template to all platforms.  
**Functionality:** Populates metadata fields from selected template definition.  
**Trigger:** User selects template from template dropdown.  
**State Changes:** All platform metadata, preview cards, editor state.

### `applyWhatIfChanges()` — Line 8241
**Purpose:** Applies What If mode changes to preview cards.  
**Functionality:** Creates modified metadata with selected tags disabled and re-renders previews.  
**Trigger:** User clicks "Update Previews" in What If panel.  
**State Changes:** Temporary modified data for rendering (no permanent state change).

### `applyPendingWhatIfTags()` — Line 8286
**Purpose:** Applies pending What If tag changes to platform data.  
**Functionality:** Processes queued tag changes and updates affected platforms.  
**Trigger:** After What If tag selections change.  
**State Changes:** Platform metadata with tag modifications applied.

### `applyDiagnosticFix(index)` — Line 8478
**Purpose:** Applies a diagnostic fix to resolve detected metadata issues.  
**Functionality:** Executes the selected fix from diagnostic results.  
**Trigger:** User clicks fix button in diagnostic results.  
**State Changes:** Platform metadata affected by the fix.

### `applySmartOrdering()` — Line 8744
**Purpose:** Applies smart ordering algorithm to platform cards.  
**Functionality:** Reorders platforms based on scoring algorithm and user preferences.  
**Trigger:** Smart ordering mode activation or preference change.  
**State Changes:** Platform card order, `isSmartOrderingActive` flag.

### `applySmartOrderingSafe()` — Line 8988
**Purpose:** Safe version of smart ordering with additional error handling.  
**Functionality:** Applies smart ordering with fallback and error recovery.  
**Trigger:** Smart ordering with error resilience required.  
**State Changes:** Platform card order with error handling.

---

## 5. sync* Pattern Functions (2 handlers)

Functions that synchronize state across multiple components.

### `syncGroupToggles(groups)` — Line 3530
**Purpose:** Synchronizes group checkbox states with platform toggle states.  
**Functionality:** Updates group header checkboxes (checked/unchecked/indeterminate) based on child platform states.  
**Trigger:** Platform toggles change in cropper.  
**State Changes:** Group checkbox visual states (checked/unchecked/indeterminate).

### `syncInlineEditToEditor(tag, value)` — Line 8385
**Purpose:** Synchronizes inline edits to the editor form.  
**Functionality:** Updates editor form fields with values from inline edits.  
**Trigger:** User completes inline edit on platform card.  
**State Changes:** Editor form field values, platform metadata.

---

## 6. filter* Pattern Functions (2 handlers)

Specialized filtering functions for search and display filtering.

### `renderMetadataTable(filter = '')` — Line 3941
**Purpose:** Renders metadata table with optional filtering.  
**Functionality:** Filters metadata rows by tag name or value case-insensitively.  
**Trigger:** User types in metadata filter input field.  
**State Changes:** Display-only (filters table rows).

### `filterCommands(e)` — Line 9177
**Purpose:** Filters command palette items based on search input.  
**Functionality:** Filters available commands by label or category name.  
**Trigger:** User types in command palette search input.  
**State Changes:** `commandPaletteSelectedIndex`, displayed command list.

---

## 7. Filter Operation Management Functions (4 handlers)

Centralized guard functions for coordinating filter operations during smart ordering.

### `shouldDeferFilterOperation()` — Line 7891
**Purpose:** Checks if a filter operation should be deferred during smart ordering.  
**Functionality:** Returns true if smart ordering is active and operation should be queued.  
**Trigger:** Called by filter handlers before executing.  
**State Changes:** None (read-only check).

### `isSmartOrdering()` — Line 7933
**Purpose:** Checks if smart ordering is currently active.  
**Functionality:** Returns true only if BOTH user preference is enabled AND active flag is set.  
**Trigger:** Called by filter handlers to determine operation strategy.  
**State Changes:** None (read-only check).

### `queueFilterOperation(operation, description)` — Line 7942
**Purpose:** Queues a filter operation to execute after smart ordering completes.  
**Functionality:** Adds operation to pending operations array with debug logging.  
**Trigger:** Filter operation called during smart ordering.  
**State Changes:** `pendingFilterOperations` array.

### `processPendingFilterOperations()` — Line 7952
**Purpose:** Executes all queued filter operations after smart ordering completes.  
**Functionality:** Processes queued operations in order with error handling.  
**Trigger:** Called after smart ordering finishes.  
**State Changes:** Executes queued operations, clears `pendingFilterOperations` array.

---

## Handler Behavior Patterns

### Order-Resetting Handlers vs. Non-Resetting

**Handlers that Reset Smart Ordering:**
- `toggleHidden()` - Platform visibility changes
- `importPreferences()` - Manual preference override  
- `toggleWhatIfMode()` - Mode toggle represents manual control
- `applyWhatIfChanges()` - Preview update during What If mode

**Handlers that Do NOT Reset Smart Ordering:**
- `toggleFavorite()` - Favorites don't affect order
- `renderMetadataTable()` - Display-only filter
- `filterCommands()` - Display-only filter
- `handleHeatmapSort()` - Display-only sort
- Cropper platform toggles - Overlay visibility only
- OG Generator controls - Preview-only changes
- `updateBadgePreview()` - Preview-only update

### Guard Pattern Implementation

Handlers that interact with smart ordering use this guard pattern:

```javascript
function orderResettingHandler() {
  // Check if smart ordering is active
  if (isSmartOrdering()) {
    // Queue operation for later execution
    queueFilterOperation(() => {
      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
    }, 'handlerName');
    return;
  }

  // Set guard flag
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  
  // Clear smart ordering active flag
  isSmartOrderingActive = false;
}
```

### Manual Override Pattern

Handlers representing user manual control clear the smart ordering flag:

```javascript
isSmartOrderingActive = false;
if (DEBUG_SMART_ORDERING) {
  console.log('[handlerName] Smart ordering active flag CLEARED (user manual override)');
}
```

---

## Event Listener Patterns

### Change Events
```javascript
// Form element changes (select, checkbox, radio)
element.addEventListener('change', handlerFunction);

// Examples:
oggenBgType?.addEventListener('change', handleBgTypeChange);
heatmapSort?.addEventListener('change', handleHeatmapSort);
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

### Input Events (Real-time Filtering)
```javascript
// Text input filtering
element.addEventListener('input', handlerFunction);

// Examples:
filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); });
input.addEventListener('input', filterCommands);
```

### Group/Platform Toggle Coordination
```javascript
// Group header toggles
groupCb.addEventListener('change', (e) => {
  platforms.forEach(pid => {
    const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
    if (platformCb) platformCb.checked = e.target.checked;
  });
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```

---

## Naming Convention Reference

### Primary Handler Patterns
- **`handle*`** - Direct event handlers (`handleBgTypeChange`, `handleHeatmapSort`)
- **`update*`** - State/UI updates (`updateEnabledPlatforms`, `updateCropperOverlay`)  
- **`toggle*`** - Binary state changes (`toggleFavorite`, `toggleHidden`)
- **`sync*`** - State synchronization (`syncGroupToggles`, `syncInlineEditToEditor`)
- **`apply*`** - Change application (`applyRescore`, `applyTemplate`)
- **`filter*`** - Filtering operations (`filterCommands`, `renderMetadataTable`)

### Change Detection Patterns
- **`*Change`** suffix - Handle change events (`handleBgTypeChange`, `handleLogoPosChange`)
- **`*Input(e)`** pattern - Handle input events (`handleEditorInput`, `handleBgImageUpload`)
- **`*Upload(e)`** pattern - Handle file uploads (`handleLogoUpload`, `handleBgImageUpload`)
- **`*Sort()`** pattern - Handle sorting (`handleHeatmapSort`)

---

## Summary Statistics

- **Total Handlers:** 62
- **Line Range:** 94 - 9969 (covering entire app.js file)
- **Most Common Pattern:** `update*` (17 handlers, 27%)
- **Event Handler Pattern:** `handle*` (20 handlers, 32%)
- **State Toggles:** `toggle*` (9 handlers, 15%)
- **Change Application:** `apply*` (8 handlers, 13%)

---

## Key Architectural Insights

1. **Consistent Naming:** All handlers follow predictable naming patterns that indicate their function type
2. **Guard System:** Sophisticated queue-based system prevents race conditions during smart ordering
3. **Manual Override:** User-initiated actions clear smart ordering to signal manual control
4. **Preview-Only Operations:** Many handlers update previews without permanent state changes
5. **Coordinated Updates:** Complex handlers coordinate multiple UI updates (e.g., cropper toggles)
6. **Accessibility Support:** Handlers include accessibility considerations (`updateCommandActiveDescendant`)
7. **Touch Support:** Comprehensive touch event handling for mobile devices

---

**Document Version:** 1.0  
**Status:** Complete  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Generated By:** bead bf-69g9d
