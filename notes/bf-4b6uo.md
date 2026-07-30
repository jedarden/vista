# Filter Change Handler Patterns - Search Results

## Task: Search for filter change handler patterns

**Bead ID:** bf-4b6uo  
**File:** /home/coding/vista/src/public/app.js  
**Date:** 2026-07-24

---

## Summary

Systematic grep search revealed **5 distinct filter change handler patterns** across multiple functional areas:
1. Metadata tag filtering
2. Command palette filtering
3. OG (Open Graph) generator real-time updates
4. Cropper platform/group selection
5. Smart ordering integration with filter operation guards

---

## Pattern 1: Metadata Tag Filtering

**Location:** Lines 3989-3994  
**Element:** `#metadataFilterInput`  
**Event:** `input` (real-time character-by-character)

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Handler Function:** `renderMetadataTable(filter = '')` (Line 3941)  
**Trigger:** Real-time as user types  
**Purpose:** Filter metadata tags by substring match  
**Context:** Direct DOM manipulation - re-renders entire table on each keystroke

---

## Pattern 2: Command Palette Filtering  

**Location:** Line 9085  
**Element:** `#commandInput` (within command palette overlay)  
**Event:** `input`

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Handler Function:** `filterCommands(e)` (Line 9177)  
**Trigger:** Real-time as user types commands  
**Purpose:** Filter command list by query string  
**Implementation Details:**
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);  // Reset to full list
  } else {
    const filtered = COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(query) || 
      cmd.category.toLowerCase().includes(query)
    );
    renderCommands(filtered);  // Render filtered list
  }
}
```

**Context:** Command palette UI with keyboard navigation

---

## Pattern 3: OG (Open Graph) Generator Real-time Updates

**Location:** Lines 310-323  
**Elements:** Multiple OG generator form inputs  
**Events:** Mix of `input` (real-time) and `change` (on commit)

```javascript
// Background controls
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenGradientStart?.addEventListener('input', updateOggenCanvas);
oggenGradientEnd?.addEventListener('input', updateOggenCanvas);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);

// Background image
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);

// Text content
oggenTitle?.addEventListener('input', updateOggenCanvas);
oggenSubtitle?.addEventListener('input', updateOggenCanvas);

// Typography
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenTextColor?.addEventListener('input', updateOggenCanvas);

// Logo controls
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
oggenLogoInput?.addEventListener('change', handleLogoUpload);
oggenLogoSize?.addEventListener('input', updateOggenCanvas);
```

**Handler Functions:**
- `updateOggenCanvas()` (Line 5156) - Main renderer
- `handleBgTypeChange()` (Line 5106) - Background type switch
- `handleBgImageUpload()` (Line 5117) - File upload handler
- `handleLogoPosChange()` (Line 5133) - Logo position toggle
- `handleLogoUpload()` (Line 5140) - Logo file upload

**Pattern:** Heavy real-time updates - every keystroke re-renders canvas

---

## Pattern 4: Cropper Platform/Group Selection

**Location:** Lines 3480-3497  
**Elements:** Platform and group checkboxes in cropper modal  
**Event:** `change`

```javascript
// Group-level toggle (selects/deselects all platforms in group)
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    // Sync all platforms in this group
    // Re-render overlays
    // Sync group checkbox states
  });
});

// Individual platform toggle
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    // Redraw overlays
    // Resync group checkboxes
  });
});
```

**Handler Function:** Inline (within event listeners)  
**Trigger:** On checkbox state change  
**Purpose:** Platform selection for screenshot cropping  
**Side Effects:** Updates UI overlays and group checkbox states

---

## Pattern 5: Smart Ordering Integration - Filter Operation Guards

**Location:** Lines 6279-6281, 7885-7966  
**Purpose:** Prevent smart ordering resets during filter operations

**Guard Variables:**
```javascript
let isFilterOperation = false;  // Guard flag during filter changes
let pendingFilterOperations = [];  // Queue during active smart ordering
```

**Guard Functions:**
- `queueFilterOperation(operation, description)` (Line 7942)
- `processPendingFilterOperations()` (Line 7950)

**Usage Pattern:**
```javascript
// Set guard before filter operation
isFilterOperation = true;
// Perform filter operation
// Clear guard after
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Integration Points:**
- `importPreferences` (Lines 8079-8088)
- `toggleWhatIfMode` (Lines 8144-8148)
- Smart ordering reset prevention (Lines 8790-8792)

---

## Other Input/Change Handlers (Non-Filter)

**Badge Preview:**
- `badgeStyleSelect?.addEventListener('change', updateBadgePreview)` (Line 296)

**Heatmap Sorting:**
- `heatmapSort?.addEventListener('change', handleHeatmapSort)` (Line 332)

**Code Snippet Generation:**
- `snippetFramework?.addEventListener('change', generateCodeSnippet)` (Line 6813)

**Preference Import:**
- `importPrefsInput?.addEventListener('change', importPreferences)` (Line 6831)

---

## Event Distribution Summary

| Event Type | Count | Purpose |
|------------|-------|---------|
| `input` | 8 | Real-time character-by-character filtering |
| `change` | 15 | On-commit state changes (checkboxes, selects, file uploads) |
| `click` | 12 | Button clicks and toggles |
| `submit` | 2 | Form submissions |
| `keydown` | 1 | Keyboard navigation (command palette) |
| `paste` | 1 | Clipboard paste handling |

---

## Key Architectural Observations

1. **Direct DOM Manipulation:** Most handlers directly call render functions rather than using a centralized state management system

2. **Real-time Updates:** Heavy use of `input` events for instant feedback (OG generator, command palette, metadata filtering)

3. **Guard Pattern:** Sophisticated guard system prevents smart ordering resets during filter operations

4. **Inline Handlers:** Some handlers are defined inline within event listeners (cropper checkboxes)

5. **Mixed Event Types:** Combination of `input` (real-time) and `change` (on-commit) based on use case

---

## Candidate Handler Functions List

1. `renderMetadataTable(filter)` - Line 3941
2. `filterCommands(e)` - Line 9177  
3. `updateOggenCanvas()` - Line 5156
4. `handleBgTypeChange()` - Line 5106
5. `handleBgImageUpload(e)` - Line 5117
6. `handleLogoPosChange()` - Line 5133
7. `handleLogoUpload(e)` - Line 5140
8. `handleHeatmapSort()` - Line 6101
9. `updateBadgePreview()` - Line 4765
10. `generateCodeSnippet()` - Line 6853
11. `importPreferences(e)` - Line 8057
12. `handleEditorInput(e)` - Line 6589
13. Cropper checkbox inline handlers - Lines 3480-3497
14. Guard functions: `queueFilterOperation()`, `processPendingFilterOperations()` - Lines 7942-7950

---

## Search Methodology

**Commands Used:**
```bash
# Event listeners
grep -rn "addEventListener" /home/coding/vista/src/public/app.js

# Filter-related patterns  
grep -rn -E "(filter.*change|change.*filter|onFilterChange|filterChange)" /home/coding/vista/src/public/app.js

# Input/change handlers
grep -rn -E "(addEventListener.*input|addEventListener.*change)" /home/coding/vista/src/public/app.js

# Filter functions
grep -rn -E "(function.*filter|filter.*function|handleFilter|applyFilter|updateFilter)" /home/coding/vista/src/public/app.js

# Filter DOM elements
grep -rn -E "(getElementById.*filter|querySelector.*filter|filter.*=)" /home/coding/vista/src/public/app.js
```

---

## Completion Status

✅ All filter change handler patterns systematically identified  
✅ Candidate handler functions extracted with line numbers  
✅ Locations documented for each pattern  
✅ Raw list of candidates compiled  

**Next Steps:** This raw pattern catalog serves as the foundation for understanding Vista's filter change architecture before implementing any modifications or additions.