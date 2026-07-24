# Filter Change Handler Purposes Analysis

Comprehensive analysis of each filter change handler's purpose, patterns, and behaviors based on surrounding code context.

---

## Main Rendering Section Handlers

### `renderPreviews` (Line 1583)
**Purpose**: Main rendering function for preview thumbnails that orchestrates the entire preview display pipeline.

**Key Behaviors**:
- **Race condition prevention**: Uses `isRendering` guard flag to prevent concurrent renders, with a `pendingRenderAfterCurrent` queue for latest data
- **Smart ordering awareness**: Checks `isApplyingSmartOrder` to queue renders during smart ordering to prevent conflicts
- **Custom platform ordering**: Respects `platformPrefs.cardOrder` for user-defined platform arrangements within groups
- **Progressive enhancement**: Uses global index for staggered animation delays with `prefersReducedMotion()` support
- **Orphan platform handling**: Properly handles platforms that exist in `group.platforms` but not in `cardOrder` without treating them as new

**Pattern**: Core render function with comprehensive guard logic for concurrent operation prevention

---

### `renderTextPreviewsOnly` (Line 1728)
**Purpose**: Progressive rendering function that shows text content immediately (~600ms) while images load asynchronously.

**Key Behaviors**:
- Sets `window.progressiveLoading = true` flag
- Shows score badges and text content first
- Displays loading indicators for images
- Enables users to see content quickly without waiting for full image loads

**Pattern**: Progressive enhancement strategy for faster perceived performance

---

## Cropper Section Handlers

### Group Toggle Handler (Line 3481)
**Purpose**: Handles group-level checkbox changes to toggle all platforms within a group.

**Key Behaviors**:
- Reads `data-group` attribute to identify target group
- Finds all platforms in the group via `groups.find(g => g.id === group)?.platforms`
- Sets individual platform checkboxes to match group state
- Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, and `syncGroupToggles()` to synchronize all related state

**Pattern**: Master toggle pattern with cascading state updates

---

### Platform Toggle Handler (Line 3497)
**Purpose**: Handles individual platform checkbox changes within the cropper interface.

**Key Behaviors**:
- Triggers on individual platform checkbox changes
- Updates enabled platforms set via `updateEnabledPlatforms()`
- Refreshes cropper overlay via `updateCropperOverlay()`
- Syncs group header state via `syncGroupToggles()`

**Pattern**: Individual element change with coordinated state synchronization

---

### `syncGroupToggles` (Line 3530)
**Purpose**: Synchronizes group header checkbox state to match its child platform toggles.

**Key Behaviors**:
- Checks each group's platform checkboxes
- Sets group state: checked when all children on, unchecked when all off, indeterminate when mixed
- Prevents visual mismatches where group header shows "checked" but some platforms are unchecked
- Uses `checkedCount` vs `children.length` comparison for state determination

**Pattern**: State reflection pattern - parent state reflects aggregate child state

---

### `updateEnabledPlatforms` (Line 3551)
**Purpose**: Rebuilds the enabled platforms set from checkbox state to ensure consistency with UI.

**Key Behaviors**:
- Clears `cropperState.enabledPlatforms` set
- Iterates through all checked checkboxes to rebuild enabled set
- Calls `renderCategoryLegend()` to update category legend visibility
- Centralized funnel point for all toggle paths (individual, group, select/clear-all)

**Pattern**: Single source of truth pattern - rebuilds state from UI elements

---

### `updateCropperOverlay` (Line 3600)
**Purpose**: Updates the visual overlay display on the cropper interface.

**Key Behaviors**:
- Uses `calculateVisiblePercentage()` from safe-zone.js for consistent percentage calculations
- Ensures overlay rectangles match the "% visible" shown beside platform toggles
- Coordinates with `calculateCropRect()` and `calculateSafeZone()`

**Pattern**: Visual state synchronization with calculated data

---

## Metadata Section Handlers

### `renderMetadataTable` (Line 3941)
**Purpose**: Renders the metadata table with optional filtering support.

**Key Behaviors**:
- Filters `allMetadataRows` by tag name or value when filter parameter provided
- Shows filtered count ("X of Y tags") for user feedback
- Displays JSON-LD section when present and not filtering
- Attaches input event listener to filter input for recursive filtering
- Handles empty state with "No tags match your filter" message

**Pattern**: Self-attaching event listener pattern for recursive filtering

---

### Metadata Filter Input Handler (Line 3991)
**Purpose**: Inline handler that filters metadata table as user types.

**Key Behaviors**:
- Attaches to `#metadataFilterInput` element
- Calls `renderMetadataTable(e.target.value)` recursively with new filter value
- Provides real-time filtering without explicit submit action

**Pattern**: Inline event delegation with immediate feedback

---

## Sitemap/Heatmap Section Handlers

### `handleHeatmapSort` (Line 6101)
**Purpose**: Handles heatmap sorting by different criteria (score, URL, direction).

**Key Behaviors**:
- Sorts `sitemapResults` array based on selected criteria
- Supports sort types: score-asc, score-desc, url-asc, url-desc
- Uses localeCompare for URL sorting, numeric comparison for scores
- Calls `renderHeatmapTable()` with sorted results

**Pattern**: Multi-criteria sorting with render coordination

---

## Editor Section Handlers

### `updatePreviewsWithEdits` (Line 6737)
**Purpose**: Updates preview cards to reflect editor changes and re-scores all platforms.

**Key Behaviors**:
- Stores original grade for change announcement
- Calls `applyRescore()` to recalculate all 31 platform scores from edited content
- Prefers in-place card updates via `updateEditedCardsInPlace()` for smooth CSS transitions (300ms)
- Falls back to full `renderPreviews()` when grid is empty
- Updates summary bar with new overall grade and passing/warning/failing counts
- Announces grade changes for accessibility

**Pattern**: Preferential update strategy - in-place updates preferred over destructive re-renders

---

## Platform Preferences Section Handlers

### `toggleFavorite` (Line 7867)
**Purpose**: Toggles favorite status for platforms with guard wrapper protection.

**Key Behaviors**:
- Uses `guardWrapper('toggleFavorite')` for error handling and state protection
- Adds/removes platform from `platformPrefs.favorites` Set
- Calls `savePlatformPrefs()` to persist to localStorage
- Updates UI via `updateFavoritesList()`
- Clears `isSmartOrderingActive` flag since user manually modified preferences

**Pattern**: Guard-wrapped state mutation with persistence

---

### `toggleHidden` (Line 7977)
**Purpose**: Toggles hidden status for platforms with immediate render feedback.

**Key Behaviors**:
- Uses `guardWrapperWithRender('toggleHidden')` for automatic render coordination
- Adds/removes platform from `platformPrefs.hidden` Set
- Calls `savePlatformPrefs()` to persist
- Updates UI via `updateHiddenList()`
- Calls `renderPreviews(currentData)` to immediately apply hiding

**Pattern**: Guard-wrapped state mutation with immediate visual feedback

---

### `updateFavoritesList` (Line 7990)
**Purpose**: Updates the favorites list UI to match the current favorites set.

**Key Behaviors**:
- Shows empty state when no favorites: "No favorites yet"
- Renders platform items with icon, name, and remove button
- Attaches click listeners to remove buttons calling `toggleFavorite()`
- Uses `PLATFORM_ICONS` and `PLATFORM_NAMES` for display

**Pattern**: UI state synchronization with data model

---

## Smart Ordering Section Handlers

### `shouldDeferFilterOperation` (Line 7891)
**Purpose**: Centralized guard function checking if filter operations should be deferred during smart ordering.

**Key Behaviors**:
- Returns `isSmartOrderingActive` state
- Simple boolean check for quick filtering decisions
- Used in filter handlers to decide whether to queue operations

**Pattern**: Centralized guard function for state checking

---

### `isSmartOrdering` (Line 7933)
**Purpose**: Comprehensive check for smart ordering status combining user preference and runtime state.

**Key Behaviors**:
- Checks BOTH `platformPrefs.smartOrdering` (user preference) AND `isSmartOrderingActive` (runtime state)
- Primary guard function before operations that might interfere with smart ordering
- Used in filter handlers with `queueFilterOperation()` pattern
- Related to `isFilterOperation` flag and `isApplyingSmartOrder` flag

**Pattern**: Dual-condition check (preference + runtime) for comprehensive state detection

---

### `queueFilterOperation` (Line 7942)
**Purpose**: Queues filter operations for execution after smart ordering completes.

**Key Behaviors**:
- Accepts operation function and description for debugging
- Pushes to `pendingFilterOperations` array
- Logs queuing action when `DEBUG_SMART_ORDERING` enabled

**Pattern**: Operation queue pattern for deferred execution

---

### `processPendingFilterOperations` (Line 7952)
**Purpose**: Executes queued filter operations after smart ordering completion.

**Key Behaviors**:
- Checks if queue is empty and returns early if so
- Copies queue to avoid modification during iteration
- Clears queue before processing to prevent re-entrant issues
- Processes each operation with try-catch for error isolation
- Logs processing count when debugging enabled

**Pattern**: Queue processing with error isolation and state safety

---

## What-If Panel Section Handlers

### What-If Toggle Handler (Line 8207)
**Purpose**: Handles checkbox changes in what-if panel to update disabled tags set.

**Key Behaviors**:
- Adds tag to `disabledTags` Set when unchecked
- Removes tag from `disabledTags` Set when checked
- Calls `updateHash()` to persist disabled tags state to URL

**Pattern**: Bidirectional set management with URL persistence

---

## Command Palette Section Handlers

### `filterCommands` (Line 9177)
**Purpose**: Filters command palette commands based on user query input.

**Key Behaviors**:
- Converts query to lowercase and trims whitespace
- Resets `commandPaletteSelectedIndex` to 0 on each input
- Returns all commands when query is empty
- Filters by both `label` and `category` fields
- Calls `renderCommands()` with filtered results

**Pattern**: Real-time search with multi-field filtering

---

## Common Patterns Across All Handlers

### 1. Guard Flag Pattern
Multiple handlers use guard flags to prevent race conditions:
- `isRendering` - Prevents concurrent renders
- `isApplyingSmartOrder` - Defers operations during smart ordering
- `isSmartOrderingActive` - Checks active smart ordering state
- `isFilterOperation` - Prevents smart order resets during filters

### 2. State Synchronization Pattern
Handlers coordinate multiple UI elements:
- Group toggles sync with child platform checkboxes
- Enabled platforms rebuild from UI checkboxes
- Favorites list updates after Set changes
- Hidden list updates after Set changes

### 3. Queue and Defer Pattern
Smart ordering integration uses queuing:
- `shouldDeferFilterOperation()` checks if deferral needed
- `queueFilterOperation()` adds to pending queue
- `processPendingFilterOperations()` executes after completion

### 4. Preferential Update Pattern
Editor section prefers in-place updates:
- `updateEditedCardsInPlace()` for smooth CSS transitions
- Falls back to `renderPreviews()` when grid empty
- Preserves visual continuity during changes

### 5. Guard Wrapper Pattern
Platform preferences use guard wrappers:
- `guardWrapper('toggleFavorite')` for error handling
- `guardWrapperWithRender('toggleHidden')` for automatic renders
- Centralized error handling and state protection

### 6. Recursive Filter Pattern
Metadata filtering uses recursive calls:
- `renderMetadataTable(filter)` calls `renderMetadataTable(e.target.value)`
- Self-attaching event listener for immediate feedback
- Eliminates need for separate filter handler function

### 7. URL Persistence Pattern
What-if panel persists to URL hash:
- `updateHash()` called on toggle changes
- Disabled tags stored in URL for shareable what-if scenarios
- Panel can be reopened with same disabled tags

---

## Functional Categories

### Rendering Operations (5 handlers)
- `renderPreviews`, `renderTextPreviewsOnly` - Preview display
- `renderMetadataTable` - Metadata table
- `updateFavoritesList`, `updateHiddenList` - Preference UI

### Platform Management (5 handlers)
- `toggleFavorite`, `toggleHidden` - Preference state
- `syncGroupToggles`, `updateEnabledPlatforms`, `updateCropperOverlay` - Cropper state

### Filter Coordination (4 handlers)
- `shouldDeferFilterOperation`, `isSmartOrdering` - Guard checks
- `queueFilterOperation`, `processPendingFilterOperations` - Queue management

### Search and Sort (2 handlers)
- `handleHeatmapSort` - Sitemap sorting
- `filterCommands` - Command palette search

### Editor Operations (1 handler)
- `updatePreviewsWithEdits` - Editor-to-preview sync

### What-If Operations (1 handler)
- What-If toggle handler - Disabled tags management

---

## Data Flow Patterns

### 1. User Input → Guard Check → State Update → UI Sync → Persistence
Pattern: `toggleFavorite`, `toggleHidden`
```
User clicks → guardWrapper() → Set.add/delete → savePlatformPrefs() → updateUI()
```

### 2. Filter Input → Guard Check → Queue or Execute → Render
Pattern: Smart ordering integration
```
Filter operation → isSmartOrdering() check → queue or execute → render
```

### 3. Direct Input → Recursive Filter → Immediate Render
Pattern: Metadata filtering
```
Input event → renderMetadataTable(newValue) → filter → display
```

### 4. Batch Update → Prefer In-Place → Fallback Render
Pattern: Editor updates
```
Editor change → applyRescore() → updateEditedCardsInPlace() → renderPreviews() fallback
```

---

## Key Design Principles

### 1. Race Condition Prevention
Extensive use of guard flags (`isRendering`, `isApplyingSmartOrder`) to prevent concurrent operations that could corrupt state.

### 2. Single Source of Truth
Functions like `updateEnabledPlatforms()` rebuild state from UI elements rather than trusting cached state.

### 3. Progressive Enhancement
`renderTextPreviewsOnly()` provides fast feedback while images load, improving perceived performance.

### 4. State Persistence
User preferences (favorites, hidden platforms, disabled tags) persist via localStorage and URL hash.

### 5. Accessibility
Grade change announcements, `prefersReducedMotion()` support, and proper ARIA attributes.

### 6. Error Resilience
Guard wrappers (`guardWrapper`, `guardWrapperWithRender`) provide centralized error handling.

---

## Performance Considerations

### 1. Concurrent Render Prevention
- `isRendering` flag prevents multiple simultaneous renders
- `pendingRenderAfterCurrent` queues latest data for next render cycle
- `setTimeout()` avoids recursive call stack issues

### 2. Smart Ordering Coordination
- `isApplyingSmartOrder` prevents renders during ordering
- `pendingRenderData` stores data for post-ordering render
- Queue pattern prevents lost operations during smart ordering

### 3. Preferential Updates
- In-place card updates preserve CSS transitions (300ms)
- Full render only when necessary (empty grid)
- Reduces DOM manipulation for smoother animations

### 4. Lazy and Progressive Loading
- Text-only previews render immediately (~600ms)
- Images load progressively with loading indicators
- `globalIndex` for staggered animation delays

---

## Summary

Filter change handlers in vista serve a coordinated system of:

1. **Rendering Management** - Coordinated preview display with race condition prevention
2. **Platform Preferences** - User-controlled favorites, hidden platforms, and ordering
3. **Smart Ordering Integration** - Guarded operations during intelligent card reordering
4. **Filter Operations** - Real-time filtering with queue management
5. **Editor Synchronization** - In-place preview updates from editor changes
6. **What-If Scenarios** - Tag disabling for score prediction

The handlers demonstrate sophisticated patterns including guard flags, state synchronization, queue management, preferential updates, and progressive enhancement - all working together to provide a responsive, reliable user interface.