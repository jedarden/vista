# app.js Structure Analysis (Task: bf-57g3l)

## File Overview
- **Location:** `/home/coding/vista/src/public/app.js`
- **Size:** 367.1KB, 9,998 lines
- **Architecture:** Large single-file frontend application

## Overall Structure

### 1. **State Management** (Lines 1-116)
- Global state variables (currentData, currentMode, cardContextState, etc.)
- Theme state management (initTheme, applyTheme, toggleGlobalTheme)
- Accessibility features (announce function for screen readers)

### 2. **DOM References** (Lines 117-227)
- Comprehensive DOM element caching using `$` helper function
- Grouped by feature:
  - Hero section
  - Input forms (URL, paste, compare)
  - Results display
  - Modal components (badge, QR, OG generator)
  - Sitemap components

### 3. **Event Listener Initialization** (Lines 229-510)
- Form submit handlers (URL, paste, compare)
- Navigation event listeners (mode switching, tab switching)
- Modal event listeners
- Feature-specific listeners (OG generator, sitemap, etc.)

### 4. **URL Hash State Management** (Lines 381-507)
- `getHashState()` - Parse URL hash
- `updateHash()` - Update URL hash
- `restoreHashState()` - Restore application state from hash on load

## Event Handler Naming Conventions

### Pattern 1: `switch*` Functions
- `switchMode(mode)` - Switch between URL/paste/compare/sitemap modes
- `switchTab(tabId)` - Switch between tabs (previews, templates, code, etc.)

### Pattern 2: `handle*` Functions
- `handlePasteDetection(pastedText)` - Detect and handle paste events
- `handleCompareSubmit()` - Compare form submission
- `handleSwapUrls()` - Swap compare URLs
- `handleSitemapSubmit()` - Sitemap form submission
- `handleHeatmapSort()` - Heatmap sorting
- `handleEditorInput(e)` - Editor input changes
- `handleFbPurge()` - Facebook debugging
- `handleBgTypeChange()` - OG generator background type
- `handleBgImageUpload(e)` - Background image upload
- `handleLogoPosChange()` - Logo position
- `handleLogoUpload(e)` - Logo upload

### Pattern 3: `toggle*` Functions
- `toggleGlobalTheme()` - Dark/light theme switching
- `toggleCardContext(pid, data)` - Card context mode
- `toggleCardTheme(pid, data)` - Individual card theme
- `toggleWhatIfMode()` - What-If filter mode
- `toggleCharGaugeGroup(groupId)` - Character gauge group
- `toggleAllCharGauges(fieldId)` - All gauges for field
- `toggleFavorite(pid)` - Platform favorites
- `toggleHidden(pid)` - Platform visibility
- `toggleCommandPalette()` - Command palette

### Pattern 4: `show*` / `close*` Functions
- `showWhatIfPanel()` - Display What-If panel
- `closeWhatIfPanel()` - Hide What-If panel
- Various other modal show/close functions

## Filter-Related Code Locations

### 1. **Metadata Filtering** (Lines 3941-3999)
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders table with filter UI
}
```

**Event Handler:**
- Line 3991: `filterInput.addEventListener('input', (e) => {...})`
- Input event on `#metadataFilterInput`

### 2. **What-If Filter System** (Lines 8118-8334)

**State Variables:**
- Line 8118: `let whatIfMode = false;`
- Line 8119: `let disabledTags = new Set();`

**Key Functions:**
- `toggleWhatIfMode()` (Line 8121) - Toggle What-If mode on/off
- `showWhatIfPanel()` (Line 8164) - Display filter panel with checkboxes
- `closeWhatIfPanel()` (Line 8223) - Hide panel, preserve state
- `resetWhatIfToggles()` (Line 8233) - Reset all checkboxes
- `applyWhatIfChanges()` (Line 8241) - Apply filter changes to previews
- `applyPendingWhatIfTags()` (Line 8286) - Apply tags from hash on load
- `showMissingTagWarnings(meta)` (Line 8314) - Show warnings

**Event Listeners:**
- Line 8207-8216: Checkbox change listeners for tag toggling
  ```javascript
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    updateHash();
  });
  ```
- Line 8218: `whatIfClose` click listener
- Line 8219: `whatIfReset` click listener
- Line 8220: `whatIfApply` click listener
- Line 8334: `whatIfToggleBtn` click listener

### 3. **Filter Operation Guards** (Lines 6279-6281, 7885-7974)

**Guard Flags:**
- Line 6279: `let isFilterOperation = false;`
- Line 6281: `let pendingFilterOperations = [];`

**Guard Functions:**
- `shouldDeferFilterOperation()` (Line 7891) - Check if should defer filter ops
- `queueFilterOperation(operation, description)` (Line 7938) - Queue filter op
- `processPendingFilterOperations()` (Line 7952) - Process queued ops

**Exposed Globals (Lines 5046-5056):**
```javascript
Object.defineProperty(window, 'isFilterOperation', { get: () => isFilterOperation, set: (val) => { isFilterOperation = val; }});
Object.defineProperty(window, 'pendingFilterOperations', { get: () => pendingFilterOperations, set: (val) => { pendingFilterOperations = val; }});
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

## Event Handler Organization Pattern

1. **Definition:** Handler functions are defined in feature groups
2. **Registration:** Event listeners registered at end of initialization section (lines 229-510)
3. **Delegation:** Some handlers use event delegation on parent elements
4. **Guard Pattern:** Filter operations use guard flags to prevent conflicts

## Filter Change Handler Pattern Summary

The What-If filter system follows this pattern:
1. **UI Setup:** `showWhatIfPanel()` creates checkboxes dynamically
2. **Event Binding:** Listeners attached to checkboxes and action buttons
3. **State Management:** `disabledTags` Set tracks active filters
4. **Change Application:** `applyWhatIfChanges()` modifies data and re-renders
5. **Guard Protection:** `isFilterOperation` flag prevents smart order resets
6. **Hash Persistence:** `updateHash()` saves filter state to URL

## Integration Points for New Filter Handlers

When adding new filter change handlers:

1. **Define handler function** following `handle*` or `toggle*` naming pattern
2. **Register event listener** in initialization section (lines 229-510) or within component creation
3. **Use guard flags** if filter affects smart ordering:
   ```javascript
   isFilterOperation = true;
   // ... perform filter operation
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```
4. **Queue operations** if during smart ordering:
   ```javascript
   if (shouldDeferFilterOperation()) {
     queueFilterOperation(yourHandler, 'yourHandler');
     return;
   }
   ```
5. **Update hash** if filter state should persist:
   ```javascript
   updateHash({ yourParam: value });
   ```

## Key Sections for Filter Code

- **Lines 229-510:** Main event listener initialization area
- **Lines 3941-3999:** Metadata filtering example
- **Lines 6279-6281:** Filter operation guard flags
- **Lines 7885-7974:** Filter operation guard functions
- **Lines 8118-8334:** What-If filter system implementation
- **Lines 9900-9998:** End of file (last handlers)

## Notes

- The file uses standard DOM EventTarget.addEventListener pattern
- Optional chaining (`?.`) used for safe DOM element access
- Comments and JSDoc annotations throughout
- Filter operations integrated with URL hash state management
- Smart ordering system requires special handling for filter changes
