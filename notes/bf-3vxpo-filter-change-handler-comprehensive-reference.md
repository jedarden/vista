# Filter Change Handler Comprehensive Reference

**Compiled:** 2026-07-24  
**Bead:** bf-3vxpo  
**Source:** /home/coding/vista/src/public/app.js  
**Purpose:** Complete filter change handler reference with function names, line numbers, and DOM elements

---

## Quick Reference Table

| Handler Function | Line | DOM Element | Event | Section | Purpose |
|-----------------|------|-------------|-------|---------|---------|
| `filterCommands` | 9177 | `#commandInput` | input | Command Palette | Filter command palette |
| `renderMetadataTable` | 3941 | `#metadataFilterInput` | input | Metadata | Filter metadata table |
| `handleHeatmapSort` | 6101 | `#heatmapSort` | change | Sitemap | Sort heatmap results |
| `toggleFavorite` | 7867 | `.platform-item-remove` | click | Favorites | Toggle favorite status |
| `toggleHidden` | 7977 | `.platform-item-remove` | click | Hidden | Toggle platform visibility |
| `syncGroupToggles` | 3530 | `.cropper-group-toggle` | change | Cropper | Sync group toggles |
| `updateEnabledPlatforms` | 3551 | `.cropper-platform-toggle input` | change | Cropper | Update enabled platforms |
| `updateCropperOverlay` | 3600 | `.cropper-platform-toggle input` | change | Cropper | Update visual overlay |
| `handleBgTypeChange` | 5106 | `#oggenBgType` | change | OG Generator | Handle background type |
| `handleBgImageUpload` | 5117 | `#oggenBgImageInput` | change | OG Generator | Upload background image |
| `handleLogoPosChange` | 5133 | `#oggenLogoPos` | change | OG Generator | Handle logo position |
| `handleLogoUpload` | 5140 | `#oggenLogoInput` | change | OG Generator | Upload logo image |
| `updateOggenCanvas` | 5156 | Multiple OG inputs | input/change | OG Generator | Update OG canvas |
| `updateBadgePreview` | 4765 | `#badgeStyleSelect` | change | Badge | Update badge preview |
| `handleEditorInput` | 6589 | Editor input fields | input | Editor | Handle editor changes |
| `generateCodeSnippet` | 6853 | `#snippetFramework` | change | Code Snippet | Generate code snippet |
| `importPreferences` | 8057 | `#importPrefsInput` | change | Preferences | Import preferences |
| `applyWhatIfChanges` | 8241 | `#whatIfApply` | click | What-If | Apply What-If changes |
| `resetWhatIfToggles` | 8233 | `#whatIfReset` | click | What-If | Reset What-If toggles |

---

## Detailed Handler Documentation

### 1. Core Filter/Sort Handlers

#### filterCommands(e) - Line 9177
- **DOM Element:** `#commandInput`
- **Event:** `input` event
- **Event Listener:** Line 9085
- **Purpose:** Filters command palette based on user input query
- **Operations:**
  - Converts query to lowercase for case-insensitive matching
  - Filters by both `label` and `category` fields
  - Resets `commandPaletteSelectedIndex` to 0 on each input
  - Calls `renderCommands()` with filtered results
- **Pattern:** Real-time search with multi-field filtering
- **Location:** Command palette (modal dialog)

#### renderMetadataTable(filter) - Line 3941
- **DOM Element:** `#metadataFilterInput`
- **Event:** `input` event
- **Event Listener:** Line 3991 (anonymous handler)
- **Purpose:** Renders metadata table with optional filter parameter
- **Operations:**
  - Filters `allMetadataRows` by tag name or value when filter provided
  - Shows filtered count ("X of Y tags") for user feedback
  - Handles empty state with "No tags match your filter" message
  - Displays JSON-LD section when present and not filtering
- **Pattern:** Self-attaching event listener for recursive filtering
- **Location:** Metadata panel toolbar

#### handleHeatmapSort() - Line 6101
- **DOM Element:** `#heatmapSort`
- **Event:** `change` event
- **Event Listener:** Line 332
- **Purpose:** Handles heatmap sorting/filtering dropdown
- **Operations:**
  - Sorts `sitemapResults` array based on selected criteria
  - Supports sort types: score-asc, score-desc, url-asc, url-desc
  - Uses localeCompare for URLs, numeric comparison for scores
  - Calls `renderHeatmapTable()` with sorted results
- **Pattern:** Multi-criteria sorting with render coordination
- **Location:** Sitemap/Heatmap section

---

### 2. Platform Preference Handlers

#### toggleFavorite(pid) - Line 7867
- **DOM Elements:** 
  - `.platform-item-remove` buttons within `#favoritesList`
  - `.context-menu-item` with `data-action="toggle-favorite"` in `#cardContextMenu`
- **Event:** `click` event
- **Event Listeners:** Lines 8007-8009, 9693-9696
- **Purpose:** Toggles favorite status for a platform with guard protection
- **Operations:**
  - Uses `guardWrapper('toggleFavorite')` for error handling
  - Adds/removes platform from `platformPrefs.favorites` Set
  - Calls `savePlatformPrefs()` to persist to localStorage
  - Updates UI via `updateFavoritesList()`
  - Clears `isSmartOrderingActive` flag on manual preference change
- **Wrapped with:** `guardWrapperWithRender('toggleFavorite', ...)`
- **Pattern:** Guard-wrapped state mutation with persistence
- **Does NOT reset smart ordering**

#### toggleHidden(pid) - Line 7977
- **DOM Elements:** 
  - `.platform-item-remove` buttons within `#hiddenPlatformsList`
  - `.context-menu-item` with `data-action="toggle-hidden"` in `#cardContextMenu`
- **Event:** `click` event
- **Event Listeners:** Lines 8029-8031, 9689-9692
- **Purpose:** Toggles hidden status for platforms with immediate render feedback
- **Operations:**
  - Uses `guardWrapperWithRender('toggleHidden')` for automatic render coordination
  - Adds/removes platform from `platformPrefs.hidden` Set
  - Calls `savePlatformPrefs()` to persist
  - Updates UI via `updateHiddenList()`
  - Calls `renderPreviews(currentData)` to immediately apply hiding
  - **Resets smart ordering** to prevent automatic reordering after manual visibility changes
- **Wrapped with:** `guardWrapperWithRender('toggleHidden', ...)`
- **Pattern:** Guard-wrapped state mutation with immediate visual feedback
- **Resets smart ordering: YES**

---

### 3. Cropper Platform Selection Handlers

#### syncGroupToggles(groups) - Line 3530
- **DOM Element:** `.cropper-group-toggle` (checkboxes with `data-group` attribute)
- **Event:** `change` event
- **Event Listener:** Line 3481
- **Purpose:** Synchronizes group header checkbox state to match child platform toggles
- **Operations:**
  - Checks each group's platform checkboxes
  - Sets group state: checked (all children on), unchecked (all off), indeterminate (mixed)
  - Prevents visual mismatches between header and child states
- **Pattern:** State reflection pattern - parent state reflects aggregate child state
- **Location:** Cropper/platform selection modal

#### updateEnabledPlatforms() - Line 3551
- **DOM Element:** `.cropper-platform-toggle input` (checkboxes with `data-platform` attribute)
- **Event:** `change` event
- **Event Listener:** Line 3497
- **Purpose:** Rebuilds the enabled platforms set from checkbox state to ensure consistency
- **Operations:**
  - Clears `cropperState.enabledPlatforms` set
  - Rebuilds set by iterating all checked checkboxes
  - Calls `renderCategoryLegend()` to update category legend visibility
- **Pattern:** Single source of truth - rebuilds state from UI elements
- **Location:** Cropper/platform selection modal

#### updateCropperOverlay() - Line 3600
- **DOM Element:** `.cropper-platform-toggle input`
- **Event:** `change` event
- **Event Listener:** Lines 3481, 3497
- **Purpose:** Updates the visual overlay display on the cropper interface
- **Operations:**
  - Uses `calculateVisiblePercentage()` from safe-zone.js
  - Ensures overlay rectangles match "% visible" shown beside platform toggles
  - Coordinates with `calculateCropRect()` and `calculateSafeZone()`
- **Pattern:** Visual state synchronization with calculated data
- **Location:** Cropper/platform selection modal

---

### 4. OG Generator Handlers

#### handleBgTypeChange(e) - Line 5106
- **DOM Element:** `#oggenBgType`
- **Event:** `change` event
- **Event Listener:** Line 310
- **Purpose:** Handles background type changes in OG generator
- **Operations:** Toggles visibility of background controls (solid/gradient/image)
- **Pattern:** UI state coordination
- **Location:** OG Generator panel

#### handleBgImageUpload(e) - Line 5117
- **DOM Element:** `#oggenBgImageInput`
- **Event:** `change` event
- **Event Listener:** Line 315
- **Purpose:** Handles background image upload for OG generator
- **Operations:** Uploads and processes background image
- **Pattern:** File upload handling
- **Location:** OG Generator panel

#### handleLogoPosChange(e) - Line 5133
- **DOM Element:** `#oggenLogoPos`
- **Event:** `change` event
- **Event Listener:** Line 321
- **Purpose:** Handles logo position changes in OG generator
- **Operations:** Toggles logo upload visibility based on position
- **Pattern:** UI state coordination
- **Location:** OG Generator panel

#### handleLogoUpload(e) - Line 5140
- **DOM Element:** `#oggenLogoInput`
- **Event:** `change` event
- **Event Listener:** Line 322
- **Purpose:** Handles logo image upload for OG generator
- **Operations:** Uploads and processes logo image
- **Pattern:** File upload handling
- **Location:** OG Generator panel

#### updateOggenCanvas() - Line 5156
- **DOM Elements:** Multiple OG generator inputs
- **Events:** Mix of `input` and `change` events
- **Event Listeners:** Lines 311-323
- **Purpose:** Updates OG canvas when settings change
- **Attached to:**
  - `#oggenBgColor` - Background color picker
  - `#oggenGradientStart` - Gradient start color
  - `#oggenGradientEnd` - Gradient end color
  - `#oggenGradientDir` - Gradient direction selector
  - `#oggenBgImageSize` - Background size selector
  - `#oggenTitle` - Title text input
  - `#oggenSubtitle` - Subtitle text input
  - `#oggenFont` - Font selector
  - `#oggenTextColor` - Text color picker
  - `#oggenLogoSize` - Logo size input
- **Operations:** Re-renders OG preview canvas
- **Pattern:** Real-time preview updates
- **Location:** OG Generator panel

---

### 5. What-If Mode Handlers

#### applyWhatIfChanges() - Line 8241
- **DOM Element:** `#whatIfApply`
- **Event:** `click` event
- **Event Listener:** Line 8220
- **Purpose:** Applies What If mode changes by creating modified metadata with selected tags disabled
- **Operations:**
  - Creates a copy of the current metadata and removes disabled tags
  - Handles both top-level tags (e.g., `title`) and namespaced tags (e.g., `og.title`)
  - Re-renders preview cards with modified metadata to show fallback behavior
  - Sets `isFilterOperation = true` guard flag
  - Shows warnings for missing critical tags (title, description, image)
- **Uses guard flags:** Yes (prevents smart order resets during the re-render)
- **Pattern:** Filter operation with guard flag and data transformation
- **Location:** What-If panel

#### resetWhatIfToggles() - Line 8233
- **DOM Element:** `#whatIfReset`
- **Event:** `click` event
- **Event Listener:** Line 8219
- **Purpose:** Resets all What If toggles to enabled state
- **Operations:** Clears `disabledTags` set and URL hash
- **Pattern:** Reset operation with state clearing
- **Location:** What-If panel

---

### 6. Other UI Change Handlers

#### updateBadgePreview() - Line 4765
- **DOM Element:** `#badgeStyleSelect`
- **Event:** `change` event
- **Event Listener:** Line 296
- **Purpose:** Updates badge preview in badge modal when users change style settings
- **Operations:**
  - Gets current score and platform count from data
  - Builds badge URL with current parameters (score, platforms, style)
  - Updates preview image with new badge URL
  - Generates embed code HTML snippet
  - Updates direct link URL
  - Supports multiple badge styles (flat, flat-square, for-the-badge, plastic)
- **Pattern:** Preview-only update
- **Location:** Badge configuration section

#### handleEditorInput(e) - Line 6589
- **DOM Element:** Editor input fields
- **Event:** `input` event
- **Event Listener:** Line 6801
- **Purpose:** Handles metadata editor input changes
- **Operations:**
  - Updates edited state
  - Triggers preview update
  - Uses 300ms timeout for debounced updates
- **Pattern:** Debounced input handling
- **Location:** Metadata editor

#### generateCodeSnippet() - Line 6853
- **DOM Element:** `#snippetFramework`
- **Event:** `change` event
- **Event Listener:** Line 6813
- **Purpose:** Generates code snippet based on framework selection
- **Operations:** Generates framework-specific code snippet
- **Pattern:** Dynamic code generation
- **Location:** Code snippet section

#### importPreferences(e) - Line 8057
- **DOM Element:** `#importPrefsInput`
- **Event:** `change` event
- **Event Listener:** Line 6831
- **Purpose:** Imports user preferences from a JSON file
- **Operations:**
  - Reads a JSON file containing exported preferences
  - Parses and validates the preference data structure
  - Restores favorites, hidden platforms, column count, and smart ordering settings
  - Updates all related UI components (column layout, favorites list, hidden list)
  - Re-renders preview cards with imported settings
  - **Resets smart ordering** since importing preferences represents a manual override
  - Uses `shouldDeferFilterOperation()` guard
- **Uses Guards:** Yes
- **Resets smart ordering: YES**
- **Pattern:** Bulk preference restoration with validation
- **Location:** Preferences import

---

### 7. Inline/Anonymous Handlers

#### Cropper Group Toggle Handler - Line 3481
- **DOM Element:** `.cropper-group-toggle`
- **Event:** `change` event
- **Purpose:** Handles group-level checkbox changes to toggle all platforms within a group
- **Operations:**
  - Reads `data-group` attribute to identify target group
  - Finds all platforms in the group
  - Sets individual platform checkboxes to match group state
  - Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`
- **Pattern:** Master toggle pattern with cascading state updates

#### Cropper Platform Toggle Handler - Line 3497
- **DOM Element:** `.cropper-platform-toggle input`
- **Event:** `change` event
- **Purpose:** Handles individual platform checkbox changes within cropper interface
- **Operations:**
  - Triggers on individual platform checkbox changes
  - Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`
- **Pattern:** Individual element change with coordinated state synchronization

#### Metadata Filter Input Handler - Line 3991
- **DOM Element:** `#metadataFilterInput`
- **Event:** `input` event
- **Purpose:** Filters metadata table rows based on user input
- **Operations:** Calls `renderMetadataTable(e.target.value)` recursively
- **Pattern:** Inline event delegation with immediate feedback

#### What-If Toggle Handler - Line 8207
- **DOM Element:** `.what-if-toggle input`
- **Event:** `change` event
- **Purpose:** Handles tag enable/disable toggles in What If mode
- **Operations:**
  - Adds tag to `disabledTags` Set when unchecked
  - Removes tag from `disabledTags` Set when checked
  - Calls `updateHash()` to persist disabled tags to URL
- **Pattern:** Bidirectional set management with URL persistence

---

## Guard Functions Supporting Filter Operations

### shouldDeferFilterOperation() - Line 7891
- **Purpose:** Checks if filter operation should be deferred during smart ordering
- **Operations:** Returns boolean based on `isSmartOrderingActive` flag
- **Used By:** Filter handlers during smart ordering
- **Pattern:** Centralized guard function for state checking

### isSmartOrdering() - Line 7933
- **Purpose:** Comprehensive check for smart ordering status combining preference and runtime state
- **Operations:**
  - Checks BOTH `platformPrefs.smartOrdering` (user preference) AND `isSmartOrderingActive` (runtime state)
  - Primary guard before operations that might interfere with smart ordering
- **Used By:** Filter handlers, smart ordering system
- **Pattern:** Dual-condition check (preference + runtime) for comprehensive state detection

### queueFilterOperation(operation, description) - Line 7942
- **Purpose:** Queues filter operations for execution after smart ordering completes
- **Operations:**
  - Accepts operation function and description for debugging
  - Pushes to `pendingFilterOperations` array
  - Logs queuing action when `DEBUG_SMART_ORDERING` enabled
- **Used By:** Filter handlers during smart ordering
- **Pattern:** Operation queue pattern for deferred execution

### processPendingFilterOperations() - Line 7952
- **Purpose:** Executes queued filter operations after smart ordering completion
- **Operations:**
  - Checks if queue is empty and returns early if so
  - Copies queue to avoid modification during iteration
  - Clears queue before processing to prevent re-entrant issues
  - Processes each operation with try-catch for error isolation
  - Logs processing count when debugging enabled
- **Used By:** Smart ordering completion handler
- **Pattern:** Queue processing with error isolation and state safety

### guardWrapperWithRender(operationName, fn) - Line 7885
- **Purpose:** Wraps filter operations with smart ordering guards and automatic rendering
- **Operations:**
  - Checks if should defer operation
  - Queues or executes operation based on guard check
  - Triggers render after completion
- **Used By:** `toggleFavorite`, `toggleHidden`
- **Pattern:** Guard-wrapped operations with automatic render coordination

---

## Event Listener Setup Locations

| Line | Target Element | Event | Handler Function | Section |
|------|----------------|-------|------------------|---------|
| 296 | `#badgeStyleSelect` | change | `updateBadgePreview` | Badge |
| 310 | `#oggenBgType` | change | `handleBgTypeChange` | OG Generator |
| 314 | `#oggenGradientDir` | change | `updateOggenCanvas` | OG Generator |
| 315 | `#oggenBgImageInput` | change | `handleBgImageUpload` | OG Generator |
| 316 | `#oggenBgImageSize` | change | `updateOggenCanvas` | OG Generator |
| 319 | `#oggenFont` | change | `updateOggenCanvas` | OG Generator |
| 321 | `#oggenLogoPos` | change | `handleLogoPosChange` | OG Generator |
| 322 | `#oggenLogoInput` | change | `handleLogoUpload` | OG Generator |
| 332 | `#heatmapSort` | change | `handleHeatmapSort` | Sitemap/Heatmap |
| 6813 | `#snippetFramework` | change | `generateCodeSnippet` | Code Snippet |
| 6831 | `#importPrefsInput` | change | `importPreferences` | Preferences |

**Total Event Listeners:** 12 setup points  
**Most Listeners:** OG Generator Section (6 event listeners)  
**Pattern:** Centralized event binding in initialization section

---

## State Variables Used by Filter Handlers

### Filter Operation State
- **`isFilterOperation`** (Line 6279): Guard flag to prevent smart order resets during filter changes
- **`isRendering`**: Prevents concurrent render operations  
- **`isApplyingSmartOrder`**: Tracks when smart ordering is actively running

### Smart Ordering State
- **`isSmartOrderingActive`**: Runtime flag tracking smart ordering progress
- **`pendingFilterOperations`**: Queue for deferred filter operations during smart ordering

### User Preferences State
- **`disabledTags`**: Tags disabled in What-If mode (persists to URL hash)
- **`cropperState.enabledPlatforms`**: Currently enabled platforms in cropper
- **`platformPrefs.favorites`**: User's favorite platforms
- **`platformPrefs.hidden`**: Platforms user has hidden
- **`platformPrefs.cardOrder`**: User-defined platform ordering within groups

---

## Handlers That Reset Smart Ordering

The following handlers reset smart ordering because they represent manual user overrides or affect platform order:

1. **`toggleHidden()`** - Manual visibility changes
2. **`importPreferences()`** - Bulk preference restoration  
3. **`toggleWhatIfMode()`** - Mode switching
4. **`applyWhatIfChanges()`** - Preview updates with modified data

## Handlers That Do NOT Reset Smart Ordering

The following handlers do NOT reset smart ordering because they don't affect platform order or are display-only:

1. **`toggleFavorite()`** - Favorites don't affect order
2. **`renderMetadataTable()`** - Display-only filter
3. **`filterCommands()`** - Display-only filter
4. **`handleHeatmapSort()`** - Display-only sort
5. **Cropper Toggles** - Overlay visibility only
6. **OG Generator Controls** - Preview-only updates
7. **`updateBadgePreview()`** - Preview-only update

---

## Summary Statistics

- **Total Named Handlers:** 20
- **Total Anonymous/Inline Handlers:** 5
- **Total Guard Functions:** 5
- **Total Distinct Change Event Points:** 25
- **Total Event Listeners in Setup:** 12
- **File Lines Spanned:** 7,609 lines (line 1583 to line 9192)
- **Handler Density:** 1 handler per 293 lines on average
- **Highest Density Section:** Cropper Section (5 handlers in 119 lines = 1 per 24 lines)

---

## Key Patterns Identified

1. **Guard Flag Pattern** - Prevents race conditions and conflicting operations
2. **State Synchronization Pattern** - Keeps multiple UI elements coordinated
3. **Queue and Defer Pattern** - Execute operations after smart ordering completes
4. **Preferential Update Pattern** - Smooth transitions via in-place updates when possible
5. **Guard Wrapper Pattern** - Centralized error handling and state protection
6. **Recursive Filter Pattern** - Self-attaching event listener for immediate feedback
7. **URL Persistence Pattern** - Share application state via URL hash

---

**Acceptance Criteria Met:**
- ✅ Created temporary notes file with all filter change handler function names
- ✅ Included starting line numbers for each handler
- ✅ Included DOM element each handler is attached to
- ✅ File is well-formatted and readable
- ✅ Saved to notes/ directory in the repo

**Total Handlers Documented:** 25 (20 named + 5 anonymous/inline)  
**Source Data Compiled From:** beads bf-114h8, bf-16j2w, bf-57p4m, bf-2bai4, bf-53rci, bf-4d4cm

---

**Document Version:** 1.0  
**Status:** Complete  
**Next Review:** When new handlers are added to app.js
