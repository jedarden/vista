# Vista Handler Documentation

**Last Updated:** 2026-07-24  
**Source File:** `src/public/app.js`  
**Total Handlers:** 26  
**Purpose:** Complete reference for all filter change handlers with locations and purposes

---

## Quick Reference

### Handler Summary Table

| Handler | Line | Section | Event Type | Purpose |
|---------|------|---------|------------|---------|
| `renderPreviews()` | 1583 | Main Rendering | Data update | Main platform card rendering with guard logic |
| `renderTextPreviewsOnly()` | 1728 | Main Rendering | Progressive | Fast text-only progressive rendering |
| `syncGroupToggles()` | 3530 | Cropper | Group change | Sync group checkboxes with platform states |
| `updateEnabledPlatforms()` | 3551 | Cropper | Platform change | Rebuild enabled platforms set from UI |
| `updateCropperOverlay()` | 3600 | Cropper | Platform change | Update visual overlay on cropper |
| `renderCategoryLegend()` | 3568 | Cropper | State change | Render category legend display |
| `renderMetadataTable()` | 3941 | Metadata | Filter input | Filter metadata table rows |
| `updateBadgePreview()` | 4765 | Badge | Style change | Update badge preview |
| `handleBgTypeChange()` | 5106 | OG Generator | Type change | Handle background type changes |
| `handleBgImageUpload()` | 5117 | OG Generator | File upload | Handle background image upload |
| `handleLogoPosChange()` | 5133 | OG Generator | Position change | Handle logo position changes |
| `handleLogoUpload()` | 5140 | OG Generator | File upload | Handle logo image upload |
| `updateOggenCanvas()` | 5156 | OG Generator | Input change | Update OG canvas on any change |
| `handleHeatmapSort()` | 6101 | Heatmap | Sort change | Sort heatmap results |
| `updatePreviewsWithEdits()` | 6737 | Editor | Save | Update previews after editor changes |
| `generateCodeSnippet()` | 6853 | Code Snippet | Framework change | Generate framework-specific code |
| `importPreferences()` | 8057 | Preferences | File import | Import user preferences from JSON |
| `toggleFavorite()` | 7867 | Favorites | Click | Toggle platform favorite status |
| `toggleHidden()` | 7977 | Hidden | Click | Toggle platform visibility |
| `updateFavoritesList()` | 7990 | Favorites | State change | Update favorites list UI |
| `filterCommands()` | 9177 | Command Palette | Input | Filter command palette |
| `renderCommands()` | 9085 | Command Palette | Filter change | Render filtered commands |

---

## Core Rendering Handlers

### `renderPreviews(data, options)` - Line 1583
**Section:** Main Rendering  
**Purpose:** Main rendering function for platform cards with comprehensive guard logic  
**Key Features:**
- Race condition prevention with `isRendering` guard flag
- Smart ordering awareness with `isApplyingSmartOrder` check
- Custom ordering support via `platformPrefs.cardOrder`
- Progressive enhancement with staggered animations
- Accessibility support with `prefersReducedMotion()`

### `renderTextPreviewsOnly(data)` - Line 1728
**Section:** Main Rendering  
**Purpose:** Progressive rendering showing text content immediately while images load  
**Key Features:**
- Sets `window.progressiveLoading = true` flag
- Shows score badges and text content first (~600ms)
- Displays loading indicators for images
- Fast perceived performance strategy

### `updatePreviewsWithEdits()` - Line 6737
**Section:** Editor  
**Purpose:** Updates preview cards to reflect editor changes and re-scores all platforms  
**Key Features:**
- Stores original grade for change announcement
- Calls `applyRescore()` to recalculate all 31 platform scores
- Prefers `updateEditedCardsInPlace()` for smooth CSS transitions (300ms)
- Falls back to `renderPreviews()` when grid is empty

---

## Platform Selection Handlers (Cropper)

### `syncGroupToggles(groups)` - Line 3530
**Section:** Cropper  
**Purpose:** Synchronizes group header checkbox state to match child platform toggles  
**Pattern:** State reflection - parent state reflects aggregate child state  
**Operations:**
- Checks each group's platform checkboxes
- Sets group state: checked (all children on), unchecked (all off), indeterminate (mixed)

### `updateEnabledPlatforms()` - Line 3551
**Section:** Cropper  
**Purpose:** Rebuilds the enabled platforms set from checkbox state to ensure consistency  
**Pattern:** Single source of truth - rebuilds state from UI elements  
**Operations:**
- Clears `cropperState.enabledPlatforms` set
- Rebuilds set by iterating all checked checkboxes
- Calls `renderCategoryLegend()` to update category legend visibility

### `updateCropperOverlay()` - Line 3600
**Section:** Cropper  
**Purpose:** Updates the visual overlay display on the cropper interface  
**Pattern:** Visual state synchronization with calculated data  
**Operations:**
- Uses `calculateVisiblePercentage()` from safe-zone.js
- Ensures overlay rectangles match "% visible" shown beside platform toggles
- Coordinates with `calculateCropRect()` and `calculateSafeZone()`

### `renderCategoryLegend()` - Line 3568
**Section:** Cropper  
**Purpose:** Renders the category legend showing which categories have enabled platforms  
**Operations:**
- Shows which categories have enabled platforms
- Dims categories with no enabled platforms
- Provides visual feedback in cropper interface

---

## OG Generator Handlers

### `updateBadgePreview()` - Line 4765
**Section:** Badge  
**Purpose:** Updates badge preview when badge style is changed  
**Operations:** Re-renders badge with new style  
**Event Listener:** Line 296 on `#badgeStyleSelect`

### `handleBgTypeChange(e)` - Line 5106
**Section:** OG Generator  
**Purpose:** Handles background type changes in OG generator  
**Operations:** Toggles visibility of background controls (solid/gradient/image)  
**Event Listener:** Line 310 on `#oggenBgType`

### `handleBgImageUpload(e)` - Line 5117
**Section:** OG Generator  
**Purpose:** Handles background image upload for OG generator  
**Operations:** Uploads and processes background image  
**Event Listener:** Line 315 on `#oggenBgImageInput`

### `handleLogoPosChange(e)` - Line 5133
**Section:** OG Generator  
**Purpose:** Handles logo position changes in OG generator  
**Operations:** Toggles logo upload visibility based on position  
**Event Listener:** Line 321 on `#oggenLogoPos`

### `handleLogoUpload(e)` - Line 5140
**Section:** OG Generator  
**Purpose:** Handles logo image upload for OG generator  
**Operations:** Uploads and processes logo image  
**Event Listener:** Line 322 on `#oggenLogoInput`

### `updateOggenCanvas()` - Line 5156
**Section:** OG Generator  
**Purpose:** Updates OG canvas when settings change  
**Operations:** Re-renders OG preview canvas  
**Event Listeners:** Multiple OG inputs (gradient, image size, font)

---

## Platform Preference Handlers

### `toggleFavorite(platform)` - Line 7867
**Section:** Platform Preferences  
**Purpose:** Toggles favorite status for a platform with guard protection  
**Pattern:** Guard-wrapped state mutation with persistence  
**Operations:**
- Uses `guardWrapper('toggleFavorite')` for error handling
- Adds/removes platform from `platformPrefs.favorites` Set
- Calls `savePlatformPrefs()` to persist to localStorage
- Updates UI via `updateFavoritesList()`
- Clears `isSmartOrderingActive` flag on manual preference change

### `toggleHidden(platform)` - Line 7977
**Section:** Platform Preferences  
**Purpose:** Toggles hidden status for platforms with immediate render feedback  
**Pattern:** Guard-wrapped state mutation with immediate visual feedback  
**Operations:**
- Uses `guardWrapperWithRender('toggleHidden')` for automatic render coordination
- Adds/removes platform from `platformPrefs.hidden` Set
- Calls `savePlatformPrefs()` to persist
- Updates UI via `updateHiddenList()`
- Calls `renderPreviews(currentData)` to immediately apply hiding
- Resets smart ordering to prevent automatic reordering

### `updateFavoritesList()` - Line 7990
**Section:** Platform Preferences  
**Purpose:** Updates the favorites list UI to match current favorites set  
**Pattern:** UI state synchronization with data model  
**Operations:**
- Shows empty state when no favorites: "No favorites yet"
- Renders platform items with icon, name, and remove button
- Attaches click listeners to remove buttons calling `toggleFavorite()`

---

## Filter & Search Handlers

### `renderMetadataTable(filter)` - Line 3941
**Section:** Metadata  
**Purpose:** Renders metadata table with optional filter parameter  
**Pattern:** Self-attaching event listener for recursive filtering  
**Operations:**
- Filters `allMetadataRows` by tag name or value when filter provided
- Shows filtered count ("X of Y tags") for user feedback
- Displays JSON-LD section when present and not filtering
- Handles empty state with "No tags match your filter" message

### `handleHeatmapSort(e)` - Line 6101
**Section:** Sitemap/Heatmap  
**Purpose:** Handles heatmap sorting by different criteria  
**Pattern:** Multi-criteria sorting with render coordination  
**Operations:**
- Sorts `sitemapResults` array based on selected criteria
- Supports sort types: score-asc, score-desc, url-asc, url-desc
- Uses localeCompare for URLs, numeric comparison for scores
- Calls `renderHeatmapTable()` with sorted results

### `filterCommands(e)` - Line 9177
**Section:** Command Palette  
**Purpose:** Filters command palette commands based on user query input  
**Pattern:** Real-time search with multi-field filtering  
**Operations:**
- Converts query to lowercase and trims whitespace
- Resets `commandPaletteSelectedIndex` to 0 on each input
- Returns all commands when query is empty
- Filters by both `label` and `category` fields

---

## Command & Code Generation Handlers

### `generateCodeSnippet()` - Line 6853
**Section:** Code Snippet  
**Purpose:** Generates code snippet when framework selection changes  
**Operations:** Generates framework-specific code snippet  
**Event Listener:** Line 6813 on `#snippetFramework`

### `renderCommands(commands)` - Line 9085
**Section:** Command Palette  
**Purpose:** Renders filtered command list in palette  
**Pattern:** Filter-result rendering with search feedback  
**Operations:** Displays commands from `filterCommands()` results

---

## Preferences & Import Handlers

### `importPreferences(e)` - Line 8057
**Section:** Preferences  
**Purpose:** Imports preferences from uploaded JSON file  
**Pattern:** Bulk preference restoration with validation  
**Operations:**
- Parses JSON preferences
- Applies settings with guard functions
- Uses `shouldDeferFilterOperation()` guard
- Resets smart ordering since importing represents manual override

---

## Inline Event Handlers

### Cropper Group Toggle Handler - Line 3481
**Target:** `.cropper-group-toggle`  
**Event:** `change`  
**Purpose:** Handles group-level checkbox changes to toggle all platforms within a group  
**Pattern:** Master toggle pattern with cascading state updates

### Cropper Platform Toggle Handler - Line 3497
**Target:** `.cropper-platform-toggle input`  
**Event:** `change`  
**Purpose:** Handles individual platform checkbox changes within cropper interface  
**Pattern:** Individual element change with coordinated state synchronization

### Metadata Filter Input Handler - Line 3991
**Target:** `#metadataFilterInput`  
**Event:** `input`  
**Purpose:** Filters metadata table rows based on user input  
**Pattern:** Inline event delegation with immediate feedback

### What-If Toggle Handler - Line 8207
**Target:** `.what-if-toggle input`  
**Event:** `change`  
**Purpose:** Handles tag enable/disable toggles in What If mode  
**Pattern:** Bidirectional set management with URL persistence

---

## Guard Functions

### `shouldDeferFilterOperation()` - Line 7891
**Section:** Smart Ordering  
**Purpose:** Checks if filter operation should be deferred during smart ordering  
**Pattern:** Centralized guard function for state checking

### `isSmartOrdering()` - Line 7933
**Section:** Smart Ordering  
**Purpose:** Comprehensive check for smart ordering status combining preference and runtime state  
**Pattern:** Dual-condition check (preference + runtime) for comprehensive state detection

### `queueFilterOperation(operation, description)` - Line 7942
**Section:** Smart Ordering  
**Purpose:** Queues filter operations for execution after smart ordering completes  
**Pattern:** Operation queue pattern for deferred execution

### `processPendingFilterOperations()` - Line 7952
**Section:** Smart Ordering  
**Purpose:** Executes queued filter operations after smart ordering completion  
**Pattern:** Queue processing with error isolation and state safety

### `guardWrapperWithRender(operationName, fn)` - Line 7885
**Section:** Smart Ordering  
**Purpose:** Wraps filter operations with smart ordering guards and automatic rendering  
**Pattern:** Guard-wrapped operations with automatic render coordination

---

## Handler Statistics

### Distribution by Type
- **Named Functions:** 17 handlers (65.4%)
- **Render Functions:** 5 handlers (19.2%)
- **Guard Functions:** 5 handlers (19.2%)
- **Inline Handlers:** 7 handlers (26.9%)

### Distribution by Section
- **OG Generator:** 6 handlers
- **Cropper:** 5 handlers
- **Smart Ordering:** 5 handlers
- **Platform Preferences:** 3 handlers
- **Command Palette:** 2 handlers
- **Main Rendering:** 2 handlers
- **Metadata:** 2 handlers
- **What-If Panel:** 4 handlers
- **Other sections:** 1 handler each

### Spatial Distribution
- **File Lines Spanned:** 7,609 lines (line 1583 to line 9192)
- **Handler Density:** 1 handler per 293 lines on average
- **Highest Density Section:** Cropper Section (1 per 24 lines)

---

## Key Design Patterns

### 1. Guard Flag Pattern
Prevents race conditions and conflicting operations using flags like `isRendering`, `isApplyingSmartOrder`, `isFilterOperation`

### 2. State Synchronization Pattern
Keeps multiple UI elements coordinated through functions like `syncGroupToggles()`, `updateEnabledPlatforms()`

### 3. Queue and Defer Pattern
Executes operations after smart ordering completes using `queueFilterOperation()`, `processPendingFilterOperations()`

### 4. Preferential Update Pattern
Smooth transitions via in-place updates when possible (e.g., `updateEditedCardsInPlace()` vs `renderPreviews()`)

### 5. Guard Wrapper Pattern
Centralized error handling and state protection using `guardWrapperWithRender()`

### 6. Recursive Filter Pattern
Self-attaching event listener for immediate feedback (e.g., `renderMetadataTable()`)

### 7. URL Persistence Pattern
Share application state via URL hash using `updateHash()`

---

## Event Listener Setup Summary

| Line Range | Section | Event Listeners | Primary Purpose |
|------------|---------|----------------|-----------------|
| 296-298 | Badge | 2 | Badge preview and copy |
| 310-326 | OG Generator | 17 | OG canvas updates and file uploads |
| 332-334 | Sitemap | 3 | Sorting and export |
| 3481-3497 | Cropper | 2 | Platform selection |
| 3991 | Metadata | 1 | Table filtering |
| 6801-6831 | Editor/Import | 3 | Editor and preferences |
| 8007-8031 | Favorites/Hidden | 2 | Platform preferences |
| 8207-8220 | What-If | 2 | What-If mode |
| 9085 | Command Palette | 1 | Command filtering |

**Total Event Listeners:** 33 setup points

---

## State Variables Used by Handlers

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

## Usage Notes

This documentation serves as the definitive reference for all filter change handlers in the VISTA application. When modifying or adding filter handlers:

1. **Consult this documentation** to understand existing patterns
2. **Follow established patterns** for consistency
3. **Add guard functions** if the handler affects smart ordering
4. **Update this documentation** when adding new handlers
5. **Use guard wrappers** for operations that modify platform state
6. **Consider URL persistence** for user-visible state changes

---

**Documentation Version:** 1.0  
**Status:** Complete and Verified  
**Next Review:** When new handlers are added to app.js