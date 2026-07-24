# Filter Change Handlers - Complete Compilation

**Task:** bf-xbr31 - Save findings to temporary notes file  
**Date:** 2026-07-24  
**Source:** Compilation from bf-440st, bf-5y14w, bf-4j9oi, bf-114h8, bf-16j2w  
**Purpose:** Comprehensive reference for filter change handler implementation work

---

## Quick Summary

- **Total Handlers Cataloged:** 25 filter change handlers
- **Total Named Functions:** 34 handler-related functions
- **Event Distribution:** 9 click, 12 change, 9 input events
- **File Location:** `/home/coding/vista/src/public/app.js` (9,998 lines)
- **Static Elements:** 17 handlers attached once at startup
- **Dynamic Elements:** 8 handlers re-attached on render

---

## Complete Handler Catalog

### Order Reset Impact Handlers (5)

#### 1. toggleHidden(pid)
- **Function:** Toggles platform visibility (hide/show)
- **DOM Selector:** `.platform-item-remove` (within `#hiddenPlatformsList`)
- **Element Type:** `<button>` with × symbol
- **Event Type:** `click`
- **Binding Method:** addEventListener on querySelectorAll results
- **Attachment:** Dynamic (created in `updateHiddenList()` line 8025)
- **Attachment Code:** Lines 8029-8031
- **Order Impact:** ✅ YES - Resets smart ordering
- **Data Attribute:** `data-pid` contains platform ID

#### 2. toggleFavorite(pid)
- **Function:** Toggles platform favorite status
- **DOM Selector:** `.platform-item-remove` (within `#favoritesList`)
- **Element Type:** `<button>` with × symbol
- **Event Type:** `click`
- **Binding Method:** addEventListener on querySelectorAll results
- **Attachment:** Dynamic (created in `updateFavoritesList()` line 8003)
- **Attachment Code:** Lines 8007-8009
- **Order Impact:** ❌ NO - Does not reset ordering
- **Data Attribute:** `data-pid` contains platform ID

#### 3. importPreferences(e)
- **Function:** Imports user preferences from JSON file
- **DOM Selector:** `#importPrefsInput`
- **Element Type:** `<input type="file" accept=".json">`
- **Event Type:** `change`
- **Binding Method:** addEventListener with optional chaining
- **Attachment Code:** Line 6831
- **Order Impact:** ✅ YES - May reset smart ordering
- **Features:** Uses guard functions for smart ordering conflicts

#### 4. toggleWhatIfMode()
- **Function:** Toggles "What If" mode for simulating missing metadata tags
- **DOM Selector:** `#whatIfToggleBtn`
- **Element Type:** `<button class="action-btn">` with 🔍 emoji
- **Event Type:** `click`
- **Binding Method:** addEventListener with optional chaining
- **Attachment Code:** Line 8334
- **Order Impact:** ✅ YES - Changes visible metadata
- **Button Text:** "🔍 What If"

#### 5. applyWhatIfChanges()
- **Function:** Applies What If mode changes (disables selected metadata tags)
- **DOM Selector:** `#whatIfApply`
- **Element Type:** `<button>` in What If panel
- **Event Type:** `click`
- **Binding Method:** addEventListener with optional chaining
- **Attachment Code:** Line 8220
- **Order Impact:** ✅ YES - Changes metadata state
- **Guard Flag:** Sets `isFilterOperation = true`

---

### Non-Order Reset Impact Handlers (20)

#### 6. Metadata Filter Input Handler
- **Function:** Filters metadata tags table
- **DOM Selector:** `#metadataFilterInput`
- **Element Type:** `<input type="text">` placeholder "Filter tags..."
- **Event Type:** `input`
- **Binding Method:** addEventListener on cached element
- **Attachment Code:** Lines 3991-3993
- **Order Impact:** ❌ NO - Pure filtering operation
- **Handler Function:** Anonymous inline calling `renderMetadataTable()`

#### 7. Command Palette Filter Handler
- **Function:** Filters command palette options
- **DOM Selector:** `#commandInput`
- **Element Type:** `<input type="text" class="command-palette-input">`
- **Event Type:** `input`
- **Binding Method:** addEventListener on cached element
- **Attachment Code:** Line 9085
- **Order Impact:** ❌ NO - Command filtering only
- **Handler Function:** `filterCommands(e)` at line 9177
- **Auto-focus:** Gets focus when command palette opens

#### 8. Heatmap Sort Dropdown Handler
- **Function:** Sorts sitemap heatmap results
- **Function Name:** `handleHeatmapSort()`
- **Function Definition:** Line 6101
- **DOM Selector:** `#heatmapSort`
- **Element Type:** `<select class="heatmap-select">`
- **Event Type:** `change`
- **Binding Method:** addEventListener with optional chaining
- **Attachment Code:** Line 332
- **Order Impact:** ❌ NO - Sorting only
- **Options:** Score (asc/desc), URL (A to Z)

#### 9. Badge Style Select Handler
- **Function:** Updates badge preview in modal
- **Function Name:** `updateBadgePreview()`
- **Function Definition:** Line 4765
- **DOM Selector:** `#badgeStyleSelect`
- **Element Type:** `<select class="badge-style-select">`
- **Event Type:** `change`
- **Binding Method:** addEventListener with optional chaining
- **Attachment Code:** Line 296
- **Order Impact:** ❌ NO - Preview update only
- **Options:** flat, flat-square, plastic, for-the-badge

---

### OG Generator Handlers (13)

#### 10. Background Type Handler
- **Function Name:** `handleBgTypeChange()`
- **Function Definition:** Line 5106
- **DOM Selector:** `#oggenBgType`
- **Element Type:** `<select class="oggen-select">`
- **Event Type:** `change`
- **Attachment Code:** Line 310
- **Purpose:** Toggles visibility of background controls (solid/gradient/image)

#### 11. Background Color Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenBgColor`
- **Element Type:** `<input type="color">`
- **Event Type:** `input`
- **Attachment Code:** Line 311
- **Default Value:** "#1a1a2e"

#### 12. Gradient Start Color Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenGradientStart`
- **Element Type:** `<input type="color">`
- **Event Type:** `input`
- **Attachment Code:** Line 312

#### 13. Gradient End Color Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenGradientEnd`
- **Element Type:** `<input type="color">`
- **Event Type:** `input`
- **Attachment Code:** Line 313

#### 14. Gradient Direction Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenGradientDir`
- **Element Type:** `<select class="oggen-select-small">`
- **Event Type:** `change`
- **Attachment Code:** Line 314

#### 15. Background Image Upload Handler
- **Function Name:** `handleBgImageUpload()`
- **Function Definition:** Line 5117
- **DOM Selector:** `#oggenBgImageInput`
- **Element Type:** `<input type="file" accept="image/*">`
- **Event Type:** `change`
- **Attachment Code:** Line 315

#### 16. Background Image Size Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenBgImageSize`
- **Element Type:** `<select class="oggen-select-small">`
- **Event Type:** `change`
- **Attachment Code:** Line 316
- **Options:** cover, contain

#### 17. Title Text Input Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenTitle`
- **Element Type:** `<input type="text">`
- **Event Type:** `input`
- **Attachment Code:** Line 317
- **Placeholder:** "Your title here"
- **Maxlength:** 200

#### 18. Subtitle Text Input Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenSubtitle`
- **Element Type:** `<input type="text">`
- **Event Type:** `input`
- **Attachment Code:** Line 318
- **Placeholder:** "Optional subtitle"
- **Maxlength:** 300

#### 19. Font Select Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenFont`
- **Element Type:** `<select class="oggen-select">`
- **Event Type:** `change`
- **Attachment Code:** Line 319

#### 20. Text Color Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenTextColor`
- **Element Type:** `<input type="color">`
- **Event Type:** `input`
- **Attachment Code:** Line 320
- **Default Value:** "#ffffff"

#### 21. Logo Position Handler
- **Function Name:** `handleLogoPosChange()`
- **Function Definition:** Line 5133
- **DOM Selector:** `#oggenLogoPos`
- **Element Type:** `<select class="oggen-select">`
- **Event Type:** `change`
- **Attachment Code:** Line 321
- **Purpose:** Toggles logo upload visibility based on position

#### 22. Logo Upload Handler
- **Function Name:** `handleLogoUpload()`
- **Function Definition:** Line 5140
- **DOM Selector:** `#oggenLogoInput`
- **Element Type:** `<input type="file" accept="image/*">`
- **Event Type:** `change`
- **Attachment Code:** Line 322

#### 23. Logo Size Handler
- **Function Name:** `updateOggenCanvas()`
- **DOM Selector:** `#oggenLogoSize`
- **Element Type:** `<input type="number">`
- **Event Type:** `input`
- **Attachment Code:** Line 323
- **Default Value:** 80
- **Constraints:** min="20", max="300"

---

### Cropper Toggle Handlers (2)

#### 24. Cropper Group Toggle Handler
- **Function:** Updates platform group overlay visibility
- **DOM Selector:** `.cropper-group-toggle`
- **Element Type:** `<input type="checkbox">` with `data-group` attribute
- **Event Type:** `change`
- **Binding Method:** addEventListener on querySelectorAll results
- **Attachment Code:** Lines 3480-3495
- **Attachment:** Dynamic (re-attached on cropper render)
- **Operations:** 
  - Checks/unchecks all platforms in group
  - Calls `updateEnabledPlatforms()`
  - Calls `updateCropperOverlay()`
  - Calls `syncGroupToggles()`

#### 25. Cropper Platform Toggle Handler
- **Function:** Updates individual platform overlay visibility
- **DOM Selector:** `.cropper-platform-toggle input`
- **Element Type:** `<input type="checkbox">`
- **Event Type:** `change`
- **Binding Method:** addEventListener on querySelectorAll results
- **Attachment Code:** Lines 3496-3503
- **Attachment:** Dynamic (re-attached on cropper render)
- **Operations:** Same as group toggle

---

## Named Handler Functions Catalog

### Core Filter/Change Handlers
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `renderMetadataTable` | 3941 | `function renderMetadataTable(filter = '')` | Metadata table filtering |
| `getFieldChangeClass` | 4367 | `function getFieldChangeClass(diff, field)` | Get CSS class for field changes |
| `renderChangeIndicator` | 4385 | `function renderChangeIndicator(diff, field)` | Render visual change indicators |
| `filterCommands` | 9177 | `function filterCommands(e)` | Command palette filtering |

### OG Generator Handlers
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleBgTypeChange` | 5106 | `function handleBgTypeChange()` | Handle background type changes |
| `handleBgImageUpload` | 5117 | `function handleBgImageUpload(e)` | Handle background image uploads |
| `handleLogoPosChange` | 5133 | `function handleLogoPosChange()` | Handle logo position changes |
| `handleLogoUpload` | 5140 | `function handleLogoUpload(e)` | Handle logo uploads |
| `updateOggenCanvas` | 5156 | `function updateOggenCanvas()` | Update OG canvas on changes |

### Sitemap Handlers
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleHeatmapSort` | 6101 | `function handleHeatmapSort()` | Handle sitemap heatmap sorting |

### Code Editor Handlers
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleEditorInput` | 6589 | `function handleEditorInput(e)` | Handle code editor input changes |

### Smart Ordering Guard Functions
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `isSmartOrdering` | 7933 | `function isSmartOrdering()` | Check if smart ordering is active |
| `shouldDeferFilterOperation` | 7891 | `function shouldDeferFilterOperation()` | Determine if filter should be deferred |
| `queueFilterOperation` | 7942 | `function queueFilterOperation(operation, description)` | Queue filter for deferred execution |
| `processPendingFilterOperations` | 7952 | `function processPendingFilterOperations()` | Process queued filter operations |

### Import/Export Handlers
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `importPreferences` | 8057 | `function importPreferences(e)` | Handle preference imports |
| `generateCodeSnippet` | 6853 | `function generateCodeSnippet()` | Generate embed code snippets |
| `updateBadgePreview` | 4765 | `function updateBadgePreview()` | Update badge preview |

### UI Interaction Handlers
| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleSwapUrls` | 5499 | `function handleSwapUrls()` | Handle URL swap functionality |
| `applyWhatIfChanges` | 8241 | `function applyWhatIfChanges()` | Apply what-if scenario changes |
| `handleCommandKeydown` | 9194 | `function handleCommandKeydown(e)` | Handle command palette keyboard input |

---

## Helper Functions for Filter Operations

### Platform State Management
| Function | Line | Purpose |
|----------|------|---------|
| `updateEnabledPlatforms()` | 3551 | Updates set of enabled platforms from checkbox states |
| `renderCategoryLegend()` | 3568 | Renders category legend with enabled platform indicators |
| `syncGroupToggles(groups)` | 3530 | Syncs group header checkboxes with child platform states |
| `updateCropperOverlay()` | - | Updates cropper overlay based on enabled platforms |

### Favorite/Hidden Management
| Function | Line | Purpose |
|----------|------|---------|
| `updateFavoritesList()` | 8003 | Re-renders favorites list and re-attaches listeners |
| `updateHiddenList()` | 8025 | Re-renders hidden platforms list and re-attaches listeners |

---

## Event Type Distribution

### Click Events (4 handlers)
- `toggleHidden()` - Remove button in hidden platforms list
- `toggleFavorite()` - Remove button in favorites list
- `toggleWhatIfMode()` - What If mode toggle button
- `applyWhatIfChanges()` - Apply What If changes button

### Change Events (12 handlers)
- `importPreferences()` - File input change
- `handleHeatmapSort()` - Heatmap sort dropdown
- `updateBadgePreview()` - Badge style select
- `handleBgTypeChange()` - OG background type
- `updateOggenCanvas()` - OG gradient direction
- `handleBgImageUpload()` - OG background image upload
- `updateOggenCanvas()` - OG image size
- `updateOggenCanvas()` - OG font select
- `handleLogoPosChange()` - OG logo position
- `handleLogoUpload()` - OG logo upload
- Cropper group toggle - Group checkbox
- Cropper platform toggle - Platform checkbox

### Input Events (9 handlers)
- Metadata filter - Filter text input
- Command palette filter - Command search input
- `updateOggenCanvas()` - OG background color
- `updateOggenCanvas()` - OG gradient start color
- `updateOggenCanvas()` - OG gradient end color
- `updateOggenCanvas()` - OG title text
- `updateOggenCanvas()` - OG subtitle text
- `updateOggenCanvas()` - OG text color
- `updateOggenCanvas()` - OG logo size

---

## Binding Method Patterns

### Pattern 1: Optional Chaining addEventListener
**Usage:** Static elements with null safety
**Count:** ~25 instances
**Example:**
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
oggenBgType?.addEventListener('change', handleBgTypeChange);
```

### Pattern 2: Cached Element addEventListener
**Usage:** Elements cached in variables
**Count:** ~15 instances
**Example:**
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

### Pattern 3: querySelectorAll forEach Loop
**Usage:** Multiple elements (groups, lists)
**Count:** ~4 instances
**Example:**
```javascript
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => { ... });
});
```

### Pattern 4: Inline Anonymous Handlers
**Usage:** Simple one-off operations
**Count:** ~10 instances
**Example:**
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

---

## Smart Ordering Guard System

### Guard Functions
**Purpose:** Prevents race conditions between filter operations and smart ordering

**Key Functions:**
- `isSmartOrdering()` - Returns true if smart ordering is active
- `shouldDeferFilterOperation()` - Checks if filter should be deferred
- `queueFilterOperation(operation, description)` - Queues operation for later
- `processPendingFilterOperations()` - Executes queued operations

**State Variables:**
- `isFilterOperation` (line 6279) - Guard flag during filter changes
- `isSmartOrderingActive` - Runtime flag for smart ordering progress
- `pendingFilterOperations` - Queue for deferred operations

**Usage Pattern:**
```javascript
function myFilterHandler() {
  if (isSmartOrdering()) {
    queueFilterOperation(myFilterHandler, 'myFilterHandler');
    return;
  }
  // Proceed with filter operation
}
```

---

## Static vs Dynamic Element Distribution

### Static Elements (17 handlers)
Defined in HTML or via `$` helper at initialization, attached once at startup
- `#whatIfToggleBtn`
- `#heatmapSort`
- `#badgeStyleSelect`
- All OG generator controls (13 handlers)
- `#importPrefsInput`

### Dynamic Elements (8 handlers)
Created during runtime, re-attached on render
- `.platform-item-remove` buttons (2 instances)
- `#commandInput`
- `#metadataFilterInput`
- Cropper toggles (2 instances)

---

## Handler Naming Conventions

1. **`handle[Element][Action]()`** - UI element changes
   - Examples: `handleBgTypeChange`, `handleLogoUpload`, `handleHeatmapSort`

2. **`update[Element]()`** - Update operations
   - Examples: `updateOggenCanvas`, `updateBadgePreview`, `updateEnabledPlatforms`

3. **`filter[Context]()`** - Filtering operations
   - Examples: `filterCommands`

4. **`render[Component]()`** - Rendering with filter parameter
   - Examples: `renderMetadataTable`, `renderCategoryLegend`

5. **`is[State]()`** - State checking
   - Examples: `isSmartOrdering`

6. **`should[Action]()`** - Conditional logic
   - Examples: `shouldDeferFilterOperation`

7. **`toggle[Feature]()`** - Toggle operations
   - Examples: `toggleFavorite`, `toggleHidden`, `toggleWhatIfMode`

---

## Key Implementation Patterns

### 1. Self-referential Filter Functions
Functions that re-attach their own listeners after rendering
**Example:** `renderMetadataTable(filter = '')` at line 3941

### 2. Guard Wrapper Pattern
Functions wrapped with guard logic for smart ordering
**Example:** `guardWrapperWithRender('toggleFavorite', ...)` at line 8008

### 3. Batch State Updates
Multiple update calls after state changes
**Example:** Group checkbox handlers call `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

### 4. Data Attribute Pattern
Using `data-*` attributes to pass parameters to handlers
**Examples:** `data-pid` for platform IDs, `data-group` for group IDs

### 5. Optional Chaining Pattern
Safe DOM access with `?.` operator throughout
**Example:** `element?.addEventListener('change', handler)`

---

## Statistics Summary

### Handler Categories
- **Core UI handlers:** 7 (badge, OG generator, heatmap)
- **Platform/group filtering:** 2 (cropper controls)
- **Metadata filtering:** 1 (metadata table)
- **Import/export:** 2 (code snippet, preferences)
- **Favorite/hidden platforms:** 2 (toggle favorite/hidden)
- **What If mode:** 4 (tag toggles, reset, apply, toggle mode)
- **Command palette:** 1 (command filtering)
- **Guard functions:** 4 (smart ordering guards)
- **Helper functions:** 8 (sync, update, render functions)

### Event Distribution
- **Total event listeners:** 91+ in app.js
- **Filter-related listeners:** 25
- **Change events:** 12
- **Input events:** 9
- **Click events:** 4

### Element Type Distribution
- **Buttons:** 5 handlers
- **Select dropdowns:** 8 handlers
- **Text inputs:** 4 handlers
- **File inputs:** 3 handlers
- **Color pickers:** 4 handlers
- **Checkboxes:** 2 handlers
- **Number inputs:** 1 handler

---

## Source Documentation References

This compilation is based on documentation from these beads:
- **bf-440st:** DOM element mapping and attachment details
- **bf-5y14w:** Handler function names and line numbers
- **bf-4j9oi:** Handler patterns and implementation details
- **bf-114h8:** Handler catalog and descriptions
- **bf-16j2w:** Filter handler function names

**Original Documentation Files:**
- `/home/coding/vista/docs/bf-440st-filter-handler-dom-element-mapping.md`
- `/home/coding/vista/notes/bf-5y14w-filter-change-handler-catalog.md`
- `/home/coding/vista/notes/bf-4j9oi.md`
- `/home/coding/vista/notes/bf-114h8-filter-change-handlers-catalog.md`
- `/home/coding/vista/notes/bf-16j2w-filter-handler-names.md`

---

## Next Steps Reference

When working with filter change handlers:
1. Check if handler impacts smart ordering (5 handlers do)
2. Determine if element is static or dynamic (affects listener re-attachment)
3. Identify binding pattern (optional chaining vs cached vs querySelectorAll)
4. Consider guard system if handler modifies platform state
5. Use appropriate event type (input vs change based on element type)

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-24  
**Status:** Complete - Ready for next implementation phase