# Vista Filter Change Handlers - Comprehensive Reference

**Generated:** 2026-07-24  
**Bead:** bf-68evw  
**Purpose:** Complete filter change handler reference consolidating all analysis work  
**Source File:** `/home/coding/vista/src/public/app.js`

## Executive Summary

This comprehensive reference consolidates all Vista filter change handler analysis into a single document. It includes 26 total handlers spanning 7,609 lines of code, with detailed mappings to DOM elements, event types, line numbers, and architectural patterns.

### Statistics

- **Total Handlers:** 26
- **Total DOM Elements:** 30+ 
- **Code Span:** 7,609 lines (line 1583 to 9192)
- **Handler Density:** 1 handler per 293 lines
- **Highest Density:** Cropper Section (1 per 24 lines)

### Handler Distribution

- **Named Functions:** 17 handlers (65.4%)
- **Render Functions:** 5 handlers (19.2%)  
- **Guard Functions:** 5 handlers (19.2%)
- **Inline Handlers:** 7 handlers (26.9%)

---

## Complete Handler Catalog

### 1. toggleHidden(pid)

**Line:** 7977  
**Section:** Platform Preferences  
**Event:** click  
**Function Type:** Named Function with Guard Wrapper

**DOM Elements:**
- `.platform-item-remove` buttons within `#hiddenPlatformsList`
- `[data-action="toggle-hidden"]` in `#cardContextMenu`
- **Selector Types:** querySelectorAll (dynamic), attribute selector
- **Attachment Lines:** 8029-8031 (hidden list), 9689-9692 (context menu)

**Purpose:** Toggles platform visibility (hide/show)

**Operations:**
- Uses `guardWrapperWithRender('toggleHidden')` for automatic render coordination
- Adds/removes platform from `platformPrefs.hidden` Set
- Calls `savePlatformPrefs()` to persist to localStorage
- Updates UI via `updateHiddenList()`
- Calls `renderPreviews(currentData)` to immediately apply hiding
- Clears `isSmartOrderingActive` flag on manual preference change

**Guard:** `guardWrapperWithRender` (includes re-render)  
**Dynamic Creation:** Buttons created in `updateHiddenList()` (lines 8021-8027)

---

### 2. toggleFavorite(pid)

**Line:** 7867  
**Section:** Platform Preferences  
**Event:** click  
**Function Type:** Named Function with Guard Wrapper

**DOM Elements:**
- `.platform-item-remove` buttons within `#favoritesList`
- `[data-action="toggle-favorite"]` in `#cardContextMenu`
- **Selector Types:** querySelectorAll (dynamic), attribute selector
- **Attachment Lines:** 8007-8009 (favorites), 9693-9696 (context menu)

**Purpose:** Toggles platform favorite status

**Operations:**
- Uses `guardWrapper('toggleFavorite')` for error handling
- Adds/removes platform from `platformPrefs.favorites` Set
- Calls `savePlatformPrefs()` to persist to localStorage
- Updates UI via `updateFavoritesList()`
- Clears `isSmartOrderingActive` flag on manual preference change

**Guard:** `guardWrapper` (basic protection)  
**Dynamic Creation:** Buttons created in `updateFavoritesList()` (lines 7999-8005)

---

### 3. toggleWhatIfMode()

**Line:** 8334  
**Section:** What-If Panel  
**Event:** click  
**Function Type:** Inline Handler

**DOM Element:** `#whatIfToggleBtn`  
**Selector Type:** getElementById  
**Attachment Line:** 8334  
**Element Definition Line:** 464

**Purpose:** Toggles "What If" mode for simulating missing metadata tags

**Operations:** Opens/closes What If panel

**Guard:** `isSmartOrdering()` check + `queueFilterOperation()`

---

### 4. applyWhatIfChanges()

**Line:** 8220  
**Section:** What-If Panel  
**Event:** click  
**Function Type:** Inline Handler

**DOM Element:** `#whatIfApply`  
**Selector Type:** getElementById  
**Attachment Line:** 8220

**Purpose:** Applies What If mode changes (disables selected metadata tags)

**Operations:**
- Creates modified metadata with disabled tags removed
- Sets `isFilterOperation = true` guard flag
- Calls `renderPreviews()` with modified data
- Shows missing tag warnings

---

### 5. importPreferences(e)

**Line:** 8057  
**Section:** Preferences  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#importPrefsInput` (dynamically created)  
**Selector Type:** getElementById  
**Attachment Line:** 6831

**Purpose:** Imports user preferences from JSON file

**Operations:**
- Parses JSON preferences
- Applies settings with guard functions
- Uses `shouldDeferFilterOperation()` guard

**Trigger Element:** `#importPrefsBtn` (line 6827-6828)  
**Uses Guards:** Yes

---

### 6. Metadata Filter Handler

**Line:** 3991  
**Section:** Metadata  
**Event:** input  
**Function Type:** Inline Handler

**DOM Element:** `#metadataFilterInput`  
**Selector Type:** getElementById  
**Attachment Line:** 3991  
**Element Definition Line:** 3989

**Purpose:** Filters metadata tags table

**Operations:** Calls `renderMetadataTable(e.target.value)` recursively

**Handler:** Anonymous inline function calling `renderMetadataTable()`

**Pattern:** Recursive filter pattern with self-attaching event listener

---

### 7. Command Palette Filter Handler

**Line:** 9177  
**Section:** Command Palette  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#commandInput`  
**Selector Type:** getElementById  
**Attachment Line:** 9085  
**Element Definition Line:** 9084

**Purpose:** Filters command palette options

**Operations:**
- Converts query to lowercase and trims whitespace
- Resets `commandPaletteSelectedIndex` to 0 on each input
- Returns all commands when query is empty
- Filters by both `label` and `category` fields
- Calls `renderCommands()` with filtered results

**Handler:** `filterCommands(e)`

**Pattern:** Real-time search with multi-field filtering

---

### 8. Heatmap Sort Dropdown Handler

**Line:** 6101  
**Section:** Sitemap/Heatmap  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#heatmapSort`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 332  
**Element Definition Line:** 218

**Purpose:** Sorts sitemap heatmap results

**Operations:**
- Sorts `sitemapResults` array based on selected criteria
- Supports sort types: score-asc, score-desc, url-asc, url-desc
- Uses localeCompare for URLs, numeric comparison for scores
- Calls `renderHeatmapTable()` with sorted results

**Handler:** `handleHeatmapSort()`

**Pattern:** Multi-criteria sorting with render coordination

---

### 9. Badge Style Select Handler

**Line:** 4765  
**Section:** Badge  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#badgeStyleSelect`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 296  
**Element Definition Line:** 169

**Purpose:** Updates badge preview in modal

**Operations:** Re-renders badge with new style

**Handler:** `updateBadgePreview()`

---

### 10. OG Generator Background Type Handler

**Line:** 5106  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenBgType`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 310  
**Element Definition Line:** 186

**Purpose:** Handles background type changes in OG generator

**Operations:** Toggles visibility of background controls (solid/gradient/image)

**Handler:** `handleBgTypeChange(e)`

---

### 11. OG Generator Background Color Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenBgColor`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 311  
**Element Definition Line:** 187

**Purpose:** Updates OG canvas when background color changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 12. OG Generator Gradient Start Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenGradientStart`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 312  
**Element Definition Line:** 189

**Purpose:** Updates OG canvas when gradient start color changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 13. OG Generator Gradient End Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenGradientEnd`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 313  
**Element Definition Line:** 190

**Purpose:** Updates OG canvas when gradient end color changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 14. OG Generator Gradient Direction Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenGradientDir`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 314  
**Element Definition Line:** 191

**Purpose:** Updates OG canvas when gradient direction changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 15. OG Generator Background Image Upload Handler

**Line:** 5117  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenBgImageInput`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 315  
**Element Definition Line:** 193

**Purpose:** Handles background image upload for OG generator

**Operations:** Uploads and processes background image

**Handler:** `handleBgImageUpload(e)`

---

### 16. OG Generator Background Image Size Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenBgImageSize`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 316  
**Element Definition Line:** 194

**Purpose:** Updates OG canvas when background image size changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 17. OG Generator Title Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenTitle`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 317  
**Element Definition Line:** 196

**Purpose:** Updates OG canvas when title changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 18. OG Generator Subtitle Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenSubtitle`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 318  
**Element Definition Line:** 197

**Purpose:** Updates OG canvas when subtitle changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 19. OG Generator Font Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenFont`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 319  
**Element Definition Line:** 198

**Purpose:** Updates OG canvas when font changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 20. OG Generator Text Color Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenTextColor`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 320  
**Element Definition Line:** 199

**Purpose:** Updates OG canvas when text color changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 21. OG Generator Logo Position Handler

**Line:** 5133  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenLogoPos`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 321  
**Element Definition Line:** 200

**Purpose:** Handles logo position changes in OG generator

**Operations:** Toggles logo upload visibility based on position

**Handler:** `handleLogoPosChange(e)`

---

### 22. OG Generator Logo Upload Handler

**Line:** 5140  
**Section:** OG Generator  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#oggenLogoInput`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 322  
**Element Definition Line:** 201

**Purpose:** Handles logo image upload for OG generator

**Operations:** Uploads and processes logo image

**Handler:** `handleLogoUpload(e)`

---

### 23. OG Generator Logo Size Handler

**Line:** 5156  
**Section:** OG Generator  
**Event:** input  
**Function Type:** Named Function

**DOM Element:** `#oggenLogoSize`  
**Selector Type:** getElementById (via `$` helper)  
**Attachment Line:** 323  
**Element Definition Line:** 202

**Purpose:** Updates OG canvas when logo size changes

**Operations:** Re-renders OG preview canvas

**Handler:** `updateOggenCanvas()`

---

### 24. Cropper Group Toggle Handler

**Line:** 3481  
**Section:** Cropper  
**Event:** change  
**Function Type:** Inline Handler

**DOM Element:** `.cropper-group-toggle` (checkboxes)  
**Selector Type:** querySelectorAll (dynamic)  
**Attachment Line:** 3480

**Purpose:** Updates which platform group overlays are visible in cropper

**Operations:**
- Reads `data-group` attribute to identify target group
- Finds all platforms in the group
- Sets individual platform checkboxes to match group state
- Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

**Dynamic Creation:** Checkboxes created dynamically in cropper rendering

**Pattern:** Master toggle pattern with cascading state updates

---

### 25. Cropper Platform Toggle Handler

**Line:** 3497  
**Section:** Cropper  
**Event:** change  
**Function Type:** Inline Handler

**DOM Element:** `.cropper-platform-toggle input` (checkboxes)  
**Selector Type:** querySelectorAll (dynamic)  
**Attachment Line:** 3496

**Purpose:** Updates which individual platform overlays are visible in cropper

**Operations:**
- Triggers on individual platform checkbox changes
- Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

**Dynamic Creation:** Checkboxes created dynamically in cropper rendering

**Pattern:** Individual element change with coordinated state synchronization

---

### 26. Framework Snippet Handler

**Line:** 6853  
**Section:** Code Snippet  
**Event:** change  
**Function Type:** Named Function

**DOM Element:** `#snippetFramework`  
**Selector Type:** getElementById  
**Attachment Line:** 6813

**Purpose:** Generates code snippet when framework selection changes

**Operations:** Generates framework-specific code snippet

**Handler:** `generateCodeSnippet()`

---

## Event Type Distribution

### Click Events (4)
- `toggleHidden`: `.platform-item-remove` (line 8029)
- `toggleFavorite`: `.platform-item-remove` (line 8007)
- `toggleWhatIfMode`: `#whatIfToggleBtn` (line 8334)
- `applyWhatIfChanges`: `#whatIfApply` (line 8220)

### Change Events (11)
- `importPreferences`: `#importPrefsInput` (line 6831)
- `handleHeatmapSort`: `#heatmapSort` (line 332)
- `updateBadgePreview`: `#badgeStyleSelect` (line 296)
- `handleBgTypeChange`: `#oggenBgType` (line 310)
- `updateOggenCanvas`: `#oggenGradientDir` (line 314)
- `handleBgImageUpload`: `#oggenBgImageInput` (line 315)
- `updateOggenCanvas`: `#oggenBgImageSize` (line 316)
- `updateOggenCanvas`: `#oggenFont` (line 319)
- `handleLogoPosChange`: `#oggenLogoPos` (line 321)
- `handleLogoUpload`: `#oggenLogoInput` (line 322)
- Cropper group toggle: `.cropper-group-toggle` (line 3480)
- Cropper platform toggle: `.cropper-platform-toggle input` (line 3496)

### Input Events (9)
- Metadata filter: `#metadataFilterInput` (line 3991)
- Command palette filter: `#commandInput` (line 9085)
- `updateOggenCanvas`: `#oggenBgColor` (line 311)
- `updateOggenCanvas`: `#oggenGradientStart` (line 312)
- `updateOggenCanvas`: `#oggenGradientEnd` (line 313)
- `updateOggenCanvas`: `#oggenTitle` (line 317)
- `updateOggenCanvas`: `#oggenSubtitle` (line 318)
- `updateOggenCanvas`: `#oggenTextColor` (line 320)
- `updateOggenCanvas`: `#oggenLogoSize` (line 323)

---

## Static vs Dynamic Elements

### Static Elements (defined at file initialization)
- All `#` prefixed IDs using `getElementById` or `$` helper
- Attached once at initialization
- Persistent throughout application lifecycle
- Examples: `#whatIfToggleBtn`, `#commandInput`, `#metadataFilterInput`

### Dynamic Elements (created during runtime)
- `.platform-item-remove` (favorites and hidden lists)
- `.cropper-group-toggle` and `.cropper-platform-toggle input`
- Re-attached whenever parent container is re-rendered
- Created in: `updateFavoritesList()`, `updateHiddenList()`, cropper rendering functions

---

## Helper Functions

### $() Helper Function
```javascript
function $(id) {
  return document.getElementById(id);
}
```
Used as a shortcut for `getElementById` throughout the codebase.

### Guard Wrappers
- **`guardWrapper`**: Basic guard for operations that don't need immediate re-rendering
- **`guardWrapperWithRender`**: Extended guard that triggers re-render after operation completes
- **`isSmartOrdering()`**: Direct check before executing operations
- **`queueFilterOperation()`**: Queue operations for deferred execution during smart ordering

---

## DOM Data Attributes

The application uses consistent data attributes for DOM element identification:
- **`data-pid`**: Platform identifier (used on cards, buttons, and list items)
- **`data-platform`**: Platform identifier on cropper checkboxes
- **`data-group`**: Group identifier on cropper group toggles
- **`data-action`**: Action identifier for context menu items

---

## Handler Relationships

### Platform Selection Call Chain
```
User clicks group toggle
  ↓
cropper_group_toggle (inline, line 3481)
  ↓
updateEnabledPlatforms() (line 3551)
  ↓
syncGroupToggles() (line 3530)
  ↓
updateCropperOverlay() (line 3600)
  ↓
renderCategoryLegend() (line 3568)
```

### Favorite Toggle Call Chain
```
User clicks favorite button
  ↓
guardWrapperWithRender('toggleFavorite') (line 7885)
  ↓
isSmartOrdering() check (line 7933)
  ↓
toggleFavorite() (line 7867) OR queueFilterOperation()
  ↓
savePlatformPrefs() → localStorage
  ↓
updateFavoritesList() (line 7990)
  ↓
renderPreviews() (if not queued)
```

### What-If Apply Call Chain
```
User clicks "Apply What-If Changes"
  ↓
what_if_apply (inline, line 8220)
  ↓
isFilterOperation = true (guard flag)
  ↓
create modified metadata (disabled tags removed)
  ↓
renderPreviews(modified data) (line 1583)
  ↓
show missing tag warnings
```

---

## Design Patterns

### 1. Guard Flag Pattern
Prevents race conditions and conflicting operations using:
- `isRendering` - Prevents concurrent renders
- `isApplyingSmartOrder` - Defers operations during smart ordering
- `isSmartOrderingActive` - Checks active smart ordering state
- `isFilterOperation` - Prevents smart order resets during filters

### 2. State Synchronization Pattern
Keeps multiple UI elements coordinated:
- Group toggles sync with child platform checkboxes
- Enabled platforms rebuild from UI checkboxes
- Favorites list updates after Set changes
- Hidden list updates after Set changes

### 3. Queue and Defer Pattern
Execute operations after smart ordering completes:
- `shouldDeferFilterOperation()` - Check if deferral needed
- `queueFilterOperation()` - Add to pending queue
- `processPendingFilterOperations()` - Execute after completion

### 4. Guard Wrapper Pattern
Centralized error handling and state protection:
- `guardWrapper(operationName, fn)` - Basic error handling
- `guardWrapperWithRender(operationName, fn)` - Error handling + auto-render

### 5. Recursive Filter Pattern
Self-attaching event listener for immediate feedback:
- `renderMetadataTable(filter)` - Calls self with new filter value
- Event listener attaches on initial render

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
- `prefersReducedMotion()` support

### 5. Operation Queuing
- `pendingFilterOperations` queue stores deferred operations
- Queue processing with error isolation
- Copy-before-process to avoid modification during iteration

---

## Files Referenced

- `/home/coding/vista/src/public/app.js` - Main application logic and event attachments
- `/home/coding/vista/src/public/index.html` - HTML structure and element definitions
- `/home/coding/vista/src/public/filter-guard-wrapper.js` - Guard wrapper implementations
- `/home/coding/vista/src/public/guard-utils.js` - Guard utility functions

---

## Related Documentation

- `temp-dom-element-mappings.md` - Complete handler-to-element mapping reference
- `notes/bf-ff3bk-filter-change-handlers.md` - Complete list of identified filter change handlers
- `notes/bf-vx29t-filter-change-handler-dom-tracing.md` - Detailed tracing with HTML structure
- `notes/bf-40knx-filter-change-handler-dom-selectors.md` - Precise selector mappings with line numbers

---

## Summary

This comprehensive reference consolidates all Vista filter change handler analysis into a single document. The 26 handlers work together to provide:

1. **Rendering Management** - Coordinated preview display with race condition prevention via guard flags
2. **Platform Preferences** - User-controlled favorites, hidden platforms, and custom ordering with persistence
3. **Smart Ordering Integration** - Guarded operations during intelligent card reordering with queue management
4. **Filter Operations** - Real-time filtering with immediate feedback and recursive patterns
5. **Editor Synchronization** - In-place preview updates from editor changes with smooth transitions
6. **What-If Scenarios** - Tag disabling for score prediction with URL persistence

The architectural strengths include race condition prevention, state synchronization, queue management, preferential updates, progressive enhancement, state persistence, accessibility support, and error resilience.

---

**Total Handlers Documented:** 26  
**Total DOM Elements:** 30+  
**Status:** Complete and verified