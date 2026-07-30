# Filter Change Handler Analysis for app.js

## Overview

This document provides detailed analysis of each filter change handler's purpose, behavior, complexity, and dependencies. Based on the catalog from bf-114h8, this analysis examines what UI state each handler reads/modifies, side effects triggered, and relationships between handlers.

## Core UI Handlers (Badge, OG Generator, Heatmap)

### 1. `updateBadgePreview()` (Line 4765)
**Purpose:** Updates badge preview and embed code when badge style changes

**UI State Reads:**
- `badgeStyleSelect.value` - Selected badge style
- `currentData.scoring.overall.score` - Current score
- `currentData.scoring.scores` - Platform count

**UI State Modifies:**
- `badgePreview.innerHTML` - Badge image preview
- `badgeEmbedCode.value` - Embed code text area
- `badgeDirectUrl.value` - Direct URL text area

**Side Effects:**
- Generates dynamic badge URL with current score/platforms/style
- Updates three UI elements simultaneously
- No persistence or network calls

**Complexity:** Simple - Pure rendering function with no conditional logic

**Dependencies:** None - Self-contained

---

### 2. `handleBgTypeChange()` (Line 5106)
**Purpose:** Handles background type changes in OG generator (solid/gradient/image)

**UI State Reads:**
- `oggenBgType.value` - Selected background type
- `oggenState.bgType` - Current background type state

**UI State Modifies:**
- `oggenState.bgType` - Updates state
- `oggenBgColorRow.classList` - Toggles visibility
- `oggenBgGradientRow.classList` - Toggles visibility
- `oggenBgImageRow.classList` - Toggles visibility

**Side Effects:**
- Shows/hides three different background control rows
- Calls `updateOggenCanvas()` to regenerate preview

**Complexity:** Simple - Direct toggle logic

**Dependencies:**
- Calls `updateOggenCanvas()` - must be defined before use

---

### 3. `updateOggenCanvas()` (Line 5156)
**Purpose:** Updates OG canvas when gradient direction, image size, or font changes

**UI State Reads:**
- `oggenCanvas` - Canvas element
- `oggenState` - Complete OG generator state object

**UI State Modifies:**
- Canvas `2d` context - Clears and redraws

**Side Effects:**
- Clears entire canvas (1200x630)
- Delegates to specialized draw functions:
  - `drawBackground()` - Handles solid/gradient/image
  - `drawContent()` - Draws text content
  - `drawLogo()` - Draws logo overlay

**Complexity:** Simple - Orchestrator function

**Dependencies:**
- Requires `drawBackground()`, `drawContent()`, `drawLogo()`
- Called by: `handleBgTypeChange()`, `handleBgImageUpload()`, `handleLogoPosChange()`, `handleLogoUpload()`, `initOgGenerator()`

---

### 4. `handleBgImageUpload()` (Line 5117)
**Purpose:** Handles background image upload for OG generator

**UI State Reads:**
- `e.target.files[0]` - Uploaded file

**UI State Modifies:**
- `oggenState.bgImage` - Stores loaded Image object

**Side Effects:**
- Reads file via FileReader
- Creates Image object and waits for load
- Calls `updateOggenCanvas()` after image loads

**Complexity:** Medium - Async file loading with callback chain

**Dependencies:**
- Calls `updateOggenCanvas()` after async image load

---

### 5. `handleLogoPosChange()` (Line 5133)
**Purpose:** Handles logo position changes in OG generator

**UI State Reads:**
- `oggenLogoPos.value` - Selected logo position

**UI State Modifies:**
- `oggenState.logoPos` - Updates position state
- `oggenLogoUploadRow.classList` - Toggles upload row visibility

**Side Effects:**
- Shows/hides logo upload row (hidden when position='none')
- Calls `updateOggenCanvas()` to regenerate preview

**Complexity:** Simple - Direct update with conditional visibility

**Dependencies:**
- Calls `updateOggenCanvas()`

---

### 6. `handleLogoUpload()` (Line 5140)
**Purpose:** Handles logo image upload for OG generator

**UI State Reads:**
- `e.target.files[0]` - Uploaded file

**UI State Modifies:**
- `oggenState.logoImage` - Stores loaded Image object

**Side Effects:**
- Reads file via FileReader
- Creates Image object and waits for load
- Calls `updateOggenCanvas()` after image loads

**Complexity:** Medium - Async file loading with callback chain

**Dependencies:**
- Calls `updateOggenCanvas()` after async image load

---

### 7. `handleHeatmapSort()` (Line 6101)
**Purpose:** Sorts heatmap results by score or URL (ascending/descending)

**UI State Reads:**
- `heatmapSort.value` - Sort selection
- `sitemapResults` - Array of URL scan results

**UI State Modifies:**
- None directly (works on copy)

**Side Effects:**
- Creates copy of `sitemapResults` array
- Sorts by 4 different criteria (score-asc/desc, url-asc/desc)
- Calls `renderHeatmapTable()` with sorted data

**Complexity:** Simple - Switch statement with sorting

**Dependencies:**
- Requires `renderHeatmapTable()` function
- Requires global `sitemapResults` array

---

## Platform/Group Filter Handlers (Cropper)

### 8. Cropper Group Toggle Handler (Line 3481)
**Purpose:** Toggles all platforms in a group when group header is clicked

**UI State Reads:**
- `e.target.dataset.group` - Group ID
- `e.target.checked` - Group checkbox state
- `groups` array - Group-to-platforms mapping

**UI State Modifies:**
- Individual platform checkboxes - Sets checked state
- `cropperState.enabledPlatforms` - Via `updateEnabledPlatforms()`

**Side Effects:**
- Checks/unchecks all platform checkboxes in group
- Calls `updateEnabledPlatforms()` to update state
- Calls `updateCropperOverlay()` to redraw visual overlay
- Calls `syncGroupToggles()` to update header states

**Complexity:** Medium - Multi-step coordination

**Dependencies:**
- `updateEnabledPlatforms()` - Updates enabled platforms set
- `updateCropperOverlay()` - Redraws visual overlays on cropper
- `syncGroupToggles()` - Syncs header checkbox states

---

### 9. Cropper Platform Toggle Handler (Line 3497)
**Purpose:** Handles individual platform visibility toggle in cropper

**UI State Reads:**
- Checkbox state (implicit from event)

**UI State Modifies:**
- `cropperState.enabledPlatforms` - Via `updateEnabledPlatforms()`

**Side Effects:**
- Calls `updateEnabledPlatforms()` to update state
- Calls `updateCropperOverlay()` to redraw visual overlay
- Calls `syncGroupToggles()` to update header states (mixed/checked/unchecked)

**Complexity:** Medium - Multi-step coordination

**Dependencies:**
- `updateEnabledPlatforms()` - Updates enabled platforms set
- `updateCropperOverlay()` - Redraws visual overlays
- `syncGroupToggles()` - Syncs all group header states

**Note:** Uses same three-function pattern as group toggle

---

### 10. `syncGroupToggles(groups)` (Line 3530)
**Purpose:** Syncs group header checkboxes with their child platform states

**UI State Reads:**
- All platform checkboxes in each group
- Group structure from `groups` parameter

**UI State Modifies:**
- Group checkbox `.checked` property
- Group checkbox `.indeterminate` property

**Side Effects:**
- Sets header to checked when all children on
- Sets header to unchecked when all children off
- Sets header to indeterminate when mixed

**Complexity:** Medium - Iterates groups, counts children

**Dependencies:**
- Called by: group toggle handler, platform toggle handler, select/clear-all buttons
- Requires: `.cropper-group-toggle` and `input[data-platform]` selectors

---

### 11. `updateEnabledPlatforms()` (Line 3551)
**Purpose:** Updates the set of enabled platforms from checkbox states

**UI State Reads:**
- All `.cropper-platform-toggle input:checked` elements

**UI State Modifies:**
- `cropperState.enabledPlatforms` set - Clears and rebuilds

**Side Effects:**
- Clears existing set
- Adds all checked platform IDs
- Calls `renderCategoryLegend()` to sync legend display

**Complexity:** Simple - Query and rebuild set

**Dependencies:**
- `renderCategoryLegend()` - Updates category legend UI
- Called by: group toggle, platform toggle, select/clear-all buttons

---

### 12. `renderCategoryLegend()` (Line 3568)
**Purpose:** Renders the category legend showing which categories have enabled platforms

**UI State Reads:**
- `cropperCategoryLegend` - Legend container element
- `cropperState.enabledPlatforms` - Current enabled platforms
- Platform-to-category mapping (implicit)

**UI State Modifies:**
- `cropperCategoryLegend.innerHTML` - Rebuilds legend HTML

**Side Effects:**
- Renders colored swatches for each category
- Dims categories with no enabled platforms
- Maintains stable display order

**Complexity:** Medium - Category mapping and rendering

**Dependencies:**
- Called by: `updateEnabledPlatforms()` only
- Called after every platform visibility change

---

## Metadata Filter Handler

### 13. Metadata Filter Input Handler (Line 3991)
**Purpose:** Filters metadata table rows based on user input

**UI State Reads:**
- `e.target.value` - Filter text input
- `allMetadataRows` - Global array of all metadata

**UI State Modifies:**
- None directly (delegates to render function)

**Side Effects:**
- Calls `renderMetadataTable(e.target.value)` with filter
- Re-renders entire metadata table with filtered results

**Complexity:** Simple - Pass-through to render function

**Dependencies:**
- `renderMetadataTable()` - Handles actual filtering and rendering

---

### 14. `renderMetadataTable(filter = '')` (Line 3941)
**Purpose:** Renders metadata table with optional filter

**UI State Reads:**
- `allMetadataRows` - All metadata rows
- `filter` parameter - Filter string
- `currentData.meta.jsonLd` - JSON-LD structured data

**UI State Modifies:**
- `rawTagsPanel.innerHTML` - Rebuilds entire panel

**Side Effects:**
- Filters rows by tag/value matching (case-insensitive)
- Shows "X of Y tags" count
- Rebuilds entire table HTML
- Re-attaches filter listener (recursive pattern)
- Conditionally shows JSON-LD section when no filter

**Complexity:** Medium - Filtering, HTML generation, listener re-attachment

**Dependencies:**
- Called by: initial render, filter input handler
- Calls: `renderMetadataRow()` for each row

**Pattern:** Re-attaches its own event listener after each render

---

## Code Snippet & Import Handlers

### 15. `generateCodeSnippet()` (Line 6853)
**Purpose:** Generates code snippet when framework selection changes

**UI State Reads:**
- `snippetFramework` value - Selected framework
- `currentData.meta` - Current metadata
- `editorState.dirty` - Whether editor has unsaved changes
- `editorState.edited` - Edited metadata if dirty

**UI State Modifies:**
- `snippetCode` element - Updates generated code

**Side Effects:**
- Switches on framework type (html, nextjs, nuxt, remix, astro, sveltekit)
- Calls specialized generator for each framework
- Uses edited metadata if available, otherwise current

**Complexity:** Medium - Multiple framework generators

**Dependencies:**
- Framework-specific generators: `generateHtmlSnippet()`, `generateNextJsSnippet()`, etc.
- Triggered by: `change` event on `snippetFramework`

---

### 16. `importPreferences()` (Line 8057)
**Purpose:** Imports preferences from uploaded JSON file

**UI State Reads:**
- `e.target.files[0]` - Uploaded file

**UI State Modifies:**
- `platformPrefs.favorites` - Imports favorites set
- `platformPrefs.hidden` - Imports hidden set
- `platformPrefs.columnCount` - Imports column count
- `platformPrefs.smartOrdering` - Imports smart ordering flag

**Side Effects:**
- Parses JSON file
- Validates version field
- Merges imported prefs with existing
- Calls `savePlatformPrefs()` to persist
- Calls `loadPlatformPrefs()` to apply
- Triggers smart ordering if enabled

**Complexity:** High - JSON parsing, validation, state merging, triggers

**Dependencies:**
- `savePlatformPrefs()` - Persists to localStorage
- `loadPlatformPrefs()` - Applies and re-renders
- Smart ordering system - May trigger re-ordering

**Guard Functions:** Uses guard functions to handle smart ordering conflicts

---

## Favorite/Hidden Platform Handlers

### 17. `toggleFavorite(pid)` (Line 7867)
**Purpose:** Toggles favorite status for a platform

**UI State Reads:**
- `pid` parameter - Platform ID
- `platformPrefs.favorites` - Current favorites set

**UI State Modifies:**
- `platformPrefs.favorites` - Adds/removes platform

**Side Effects:**
- Calls `savePlatformPrefs()` to persist
- Calls `updateFavoritesList()` to update UI
- Clears `isSmartOrderingActive` flag (user manual override)

**Complexity:** Simple - Add/remove operation

**Dependencies:**
- `savePlatformPrefs()` - Persists to localStorage
- `updateFavoritesList()` - Updates favorites panel UI
- Smart ordering flag - Cleared on manual modification

**Guard Pattern:** Uses `guardWrapper('toggleFavorite', ...)`

---

### 18. `toggleHidden(pid)` (Line 7977)
**Purpose:** Toggles hidden status for a platform

**UI State Reads:**
- `pid` parameter - Platform ID
- `platformPrefs.hidden` - Current hidden set

**UI State Modifies:**
- `platformPrefs.hidden` - Adds/removes platform

**Side Effects:**
- Calls `savePlatformPrefs()` to persist
- Calls `updateHiddenList()` to update UI
- Calls `renderPreviews(currentData)` to apply hiding

**Complexity:** Medium - Includes full re-render

**Dependencies:**
- `savePlatformPrefs()` - Persists to localStorage
- `updateHiddenList()` - Updates hidden panel UI
- `renderPreviews()` - Re-renders all preview cards

**Guard Pattern:** Uses `guardWrapperWithRender('toggleHidden', ...)`

---

## What If Mode Handlers

### 19. What If Toggle Handler (Line 8207)
**Purpose:** Handles tag enable/disable toggles in What If mode

**UI State Reads:**
- `cb.dataset.tag` - Tag ID from checkbox
- `cb.checked` - Checkbox state

**UI State Modifies:**
- `disabledTags` set - Adds/removes tags

**Side Effects:**
- Adds tag to `disabledTags` when unchecked
- Removes tag from `disabledTags` when checked
- Calls `updateHash()` to reflect state in URL

**Complexity:** Simple - Set add/remove

**Dependencies:**
- `updateHash()` - Persists state to URL hash

---

### 20. `resetWhatIfToggles()` (Line 8233)
**Purpose:** Resets all What If toggles to enabled state

**UI State Reads:**
- All `.what-if-toggle input` checkboxes

**UI State Modifies:**
- All checkbox `.checked` properties - Sets to true
- `disabledTags` set - Clears all

**Side Effects:**
- Visually checks all toggles
- Clears disabled tags set
- Calls `updateHash({ without: '' })` to clear hash

**Complexity:** Simple - Clear and reset

**Dependencies:**
- `updateHash()` - Clears hash state

---

### 21. `applyWhatIfChanges()` (Line 8241)
**Purpose:** Applies What If changes and updates previews

**UI State Reads:**
- `currentData` - Current metadata
- `disabledTags` set - Tags to remove

**UI State Modifies:**
- Creates local `modifiedMeta` copy
- Sets `isFilterOperation = true` guard flag

**Side Effects:**
- Deep copies metadata object
- Removes disabled tags (supports nested `og.title` syntax)
- Sets guard flag `isFilterOperation = true`
- Calls `renderPreviews(modifiedData)` with modified data
- Resets guard flag after render (via setTimeout)
- Shows screen reader announcement
- Calls `showMissingTagWarnings()` for validation
- Calls `updateHash()` to persist state
- Shows toast notification

**Complexity:** High - Deep copy, nested deletion, guards, announcements

**Dependencies:**
- `renderPreviews()` - Re-renders with modified metadata
- `showMissingTagWarnings()` - Shows validation UI
- `updateHash()` - Persists to URL
- Guard flags - Prevents smart ordering conflicts

---

### 22. `toggleWhatIfMode()` (Line 8334)
**Purpose:** Toggles What If mode on/off

**UI State Reads:**
- `whatIfMode` - Current mode state

**UI State Modifies:**
- `whatIfMode` - Toggles true/false
- Button classList and text

**Side Effects:**
- Opens panel when enabling
- Closes panel when disabling (via `closeWhatIfPanel()`)
- Clears `disabledTags` and `whatIfMode` when disabling
- Clears hash when disabling

**Complexity:** Medium - Multi-state management

**Dependencies:**
- `showWhatIfPanel()` - Opens panel UI
- `closeWhatIfPanel()` - Closes panel UI
- `updateHash()` - Persists state

---

## Command Palette Filter Handler

### 23. `filterCommands()` (Line 9177)
**Purpose:** Filters command palette commands by label/category

**UI State Reads:**
- `e.target.value` - Filter input text
- `COMMANDS` array - All available commands

**UI State Modifies:**
- `commandPaletteSelectedIndex` - Resets to 0

**Side Effects:**
- Converts query to lowercase
- Shows all commands when query empty
- Filters by label OR category (case-insensitive)
- Calls `renderCommands()` with filtered results

**Complexity:** Simple - Array filter

**Dependencies:**
- `COMMANDS` array - Command definitions
- `renderCommands()` - Renders filtered list

---

## Centralized Guard Functions

### 24. `isSmartOrdering()` (Line 7933)
**Purpose:** Checks if smart ordering is currently active

**UI State Reads:**
- `platformPrefs.smartOrdering` - User preference
- `isSmartOrderingActive` - Runtime flag

**UI State Modifies:**
- None

**Side Effects:**
- None (read-only)

**Complexity:** Simple - Boolean AND

**Dependencies:**
- None (pure function)

**Usage:** Called by filter handlers to check if they should defer

---

### 25. `shouldDeferFilterOperation()` (Line 7891)
**Purpose:** Checks if filter operation should be deferred

**UI State Reads:**
- `isSmartOrderingActive` - Runtime flag

**UI State Modifies:**
- None

**Side Effects:**
- None (read-only)

**Complexity:** Simple - Direct return

**Dependencies:**
- None (pure function)

---

### 26. `queueFilterOperation()` (Line 7942)
**Purpose:** Queues filter operations to run after smart ordering completes

**UI State Reads:**
- None

**UI State Modifies:**
- `pendingFilterOperations` array - Pushes operation

**Side Effects:**
- Logs operation if debug mode on
- Adds to pending queue

**Complexity:** Simple - Array push

**Dependencies:**
- None

---

### 27. `processPendingFilterOperations()` (Line 7952)
**Purpose:** Processes queued filter operations after smart ordering

**UI State Reads:**
- `pendingFilterOperations` - Queue of operations

**UI State Modifies:**
- `pendingFilterOperations` - Clears after copying

**Side Effects:**
- Copies queue to avoid modification during iteration
- Clears original queue
- Executes each operation with try/catch
- Logs errors if any operation fails

**Complexity:** Medium - Queue processing with error handling

**Dependencies:**
- Called by smart ordering completion

---

## Handler Dependencies Graph

### Core Dependency Chain (Cropper)
```
Group/Platform Toggle
  → updateEnabledPlatforms()
    → renderCategoryLegend()
  → updateCropperOverlay()
  → syncGroupToggles()
```

### OG Generator Chain
```
BgType/LogoPos Change
  → updateOggenCanvas()
    → drawBackground()
    → drawContent()
    → drawLogo()

Image Upload (Bg/Logo)
  → [FileReader async]
    → [Image load async]
      → updateOggenCanvas()
```

### Smart Ordering Guard Chain
```
Filter Handler
  → isSmartOrdering() [check]
    → TRUE: queueFilterOperation()
    → FALSE: proceed
  → [Smart ordering completes]
    → processPendingFilterOperations()
```

### What If Mode Chain
```
What If Toggle
  → updateHash()

Apply Changes
  → isFilterOperation = true
  → renderPreviews()
  → showMissingTagWarnings()
  → updateHash()
  → isFilterOperation = false (async)
```

---

## Complexity Summary

### Simple Handlers (10)
Pure functions with minimal logic:
1. `updateBadgePreview()`
2. `handleBgTypeChange()`
3. `updateOggenCanvas()`
4. `handleLogoPosChange()`
5. `handleHeatmapSort()`
6. `updateEnabledPlatforms()`
7. `toggleFavorite()`
8. `isSmartOrdering()`
9. `shouldDeferFilterOperation()`
10. `queueFilterOperation()`

### Medium Complexity Handlers (9)
Multiple steps or async operations:
1. `handleBgImageUpload()` - Async file loading
2. `handleLogoUpload()` - Async file loading
3. `syncGroupToggles()` - Iteration and state
4. `renderCategoryLegend()` - Category mapping
5. `renderMetadataTable()` - Filtering + recursive listener
6. `generateCodeSnippet()` - Multiple frameworks
7. `toggleHidden()` - Includes full re-render
8. `resetWhatIfToggles()` - Multi-element update
9. `processPendingFilterOperations()` - Queue processing

### High Complexity Handlers (3)
Complex state manipulation or guards:
1. `importPreferences()` - JSON parsing, validation, merging, triggers
2. `applyWhatIfChanges()` - Deep copy, nested deletion, guards, announcements
3. Cropper handlers (group/platform) - Multi-step coordination

---

## Handler Interaction Patterns

### Pattern 1: Three-Step Update (Cropper)
Used by group and platform toggles:
1. Update state (`updateEnabledPlatforms()`)
2. Update visual (`updateCropperOverlay()`)
3. Sync controls (`syncGroupToggles()`)

### Pattern 2: Recursive Listener Re-attachment
Used by `renderMetadataTable()`:
- Function rebuilds entire HTML
- Re-attaches its own event listener to new element
- Allows single function to handle initial render + updates

### Pattern 3: Guard Flag Pattern
Used by filter operations during smart ordering:
- Set `isFilterOperation = true` before operation
- Perform operation (e.g., `renderPreviews()`)
- Reset flag asynchronously (via setTimeout)
- Prevents smart ordering from being reset

### Pattern 4: Async Image Loading
Used by `handleBgImageUpload()` and `handleLogoUpload()`:
- FileReader reads file as DataURL
- Image object loads from DataURL
- Canvas update triggered from Image.onload
- Two levels of async nesting

### Pattern 5: Guard Wrapper Pattern
Used by `toggleFavorite()` and `toggleHidden()`:
- `guardWrapper()` - Simple operation
- `guardWrapperWithRender()` - Operation + full re-render
- Wraps operation with debug logging and error handling

---

## Side Effects Summary

### UI Updates (Most Common)
- Re-rendering components (badges, canvas, metadata, previews)
- Toggling visibility (control panels, form rows)
- Updating lists (favorites, hidden)

### State Persistence
- `savePlatformPrefs()` - Saves to localStorage
- `updateHash()` - Saves to URL hash

### Visual Feedback
- Toast notifications
- Screen reader announcements
- Loading states

### Guard Flag Management
- `isFilterOperation` - Prevents smart order resets
- `isSmartOrderingActive` - Tracks smart ordering state
- Queue operations for deferred execution

---

## Memory Integration
This analysis documents the behavioral patterns of all 26 filter change handlers. The handlers show clear organization:
- Core UI handlers are self-contained
- Platform/group handlers use coordinated three-step updates
- What If mode uses guard flags to prevent conflicts
- Smart ordering system provides centralized guard functions

The complexity distribution shows most handlers are simple or medium complexity, with only 3 high-complexity handlers involving significant state manipulation or coordination.
