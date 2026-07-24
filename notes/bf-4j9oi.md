# Filter Change Handler Patterns in app.js

## Task Summary
Located and analyzed filter change handler patterns in `/home/coding/vista/src/public/app.js` (9,998 lines).

## File Location
**File:** `/home/coding/vista/src/public/app.js`
**Total Lines:** 9,998
**Analysis Date:** 2026-07-24

---

## Common Filter Change Handler Patterns

### 1. Standard `addEventListener('change', handler)` Pattern
**Pattern:** Element selection with optional chaining + event listener
**Approximate Count:** 25+ instances

**Examples:**
- Line 296: `badgeStyleSelect?.addEventListener('change', updateBadgePreview);`
- Line 310: `oggenBgType?.addEventListener('change', handleBgTypeChange);`
- Line 332: `heatmapSort?.addEventListener('change', handleHeatmapSort);`
- Line 6813: `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);`
- Line 6831: `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);`

**Characteristics:**
- Uses optional chaining (`?.`) to safely handle null elements
- Named handler functions for better organization
- Direct DOM element selection methods

---

### 2. Real-time `addEventListener('input', handler)` Pattern
**Pattern:** Input event listeners for real-time filtering (vs. change events)
**Approximate Count:** 15+ instances

**Examples:**
- Line 311: `oggenBgColor?.addEventListener('input', updateOggenCanvas);`
- Line 317: `oggenTitle?.addEventListener('input', updateOggenCanvas);`
- Line 3991: `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); });`
- Line 6801: `input.addEventListener('input', handleEditorInput);`
- Line 9085: `input.addEventListener('input', filterCommands);`

**Characteristics:**
- Triggers immediately on each keystroke/change
- Often used for search/filter text inputs
- Better for real-time UI updates than 'change' events

---

### 3. Named Handler Functions Pattern
**Pattern:** Dedicated handler functions with descriptive names
**Naming Convention:** `handle[Context][Action]` or `handle[Element][Change]`

**Examples Found:**
- `handleHeatmapSort()` - Line 6101
- `handleBgTypeChange()` - Line 5106
- `handleBgImageUpload(e)` - Line 5117
- `handleLogoPosChange()` - Line 5133
- `handleLogoUpload(e)` - Line 5140

**Handler Function Structure:**
```javascript
function handleHeatmapSort() {
  if (!heatmapSort || !sitemapResults.length) return;
  
  const sortBy = heatmapSort.value;
  let sorted = [...sitemapResults];
  
  switch (sortBy) {
    case 'score-asc':
      sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      break;
    // ... more cases
  }
  
  renderHeatmapTable(sorted);
}
```

**Characteristics:**
- Guard clauses for null/empty checks
- Value extraction from DOM elements
- Switch statements for multi-option handlers
- Re-render calls after state changes

---

### 4. Inline Anonymous Handler Pattern
**Pattern:** Inline arrow functions for immediate execution
**Approximate Count:** 10+ instances

**Examples:**
- Line 3481: `groupCb.addEventListener('change', (e) => { const group = e.target.dataset.group; ... });`
- Line 3497: `cb.addEventListener('change', () => { updateEnabledPlatforms(); ... });`
- Line 3991: `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); });`
- Line 8207: `cb.addEventListener('change', () => { ... });`

**Characteristics:**
- Used for simple, context-specific logic
- Often combined with group event listeners (forEach)
- Direct access to closure variables

---

### 5. Guarded Filter Operation Pattern
**Pattern:** Smart ordering guard system for deferred filter operations
**Location:** Lines 7885-7952

**Key Functions:**
- `isSmartOrdering()` - Line 7891
- `shouldDeferFilterOperation()` - Line 7894
- `queueFilterOperation(operation, description)` - Line 7942
- `processPendingFilterOperations()` - Line 7952

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

**Characteristics:**
- Prevents race conditions during smart ordering
- Queues operations for deferred execution
- Centralized guard logic for filter operations

---

### 6. Filter Function Pattern (render + filter)
**Pattern:** Functions that accept filter parameters and re-render content

**Examples:**
- `renderMetadataTable(filter = '')` - Line 3941
- `filterCommands(e)` - Line 9177
- `updateOggenCanvas()` - Multiple lines (canvas update on changes)

**renderMetadataTable Example:**
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  
  // ... generate HTML with filtered results
  
  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

**Characteristics:**
- Functions accept filter parameter (often with default '')
- Self-referential pattern (function re-attaches its own listener)
- Filter logic with case-insensitive matching
- Re-render on filter changes

---

### 7. Group Checkbox Handler Pattern
**Pattern:** Complex handlers for grouped checkbox selections
**Location:** Lines 3475-3510

**Example Structure:**
```javascript
// Group header toggle
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    const group = e.target.dataset.group;
    const platforms = groups.find(g => g.id === group)?.platforms || [];
    platforms.forEach(pid => {
      const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
      if (platformCb) platformCb.checked = e.target.checked;
    });
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});

// Individual platform toggle
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Characteristics:**
- Synchronized state between parent and child checkboxes
- Batch operations on groups of elements
- Multiple UI update calls after state changes
- Uses forEach for attaching listeners to multiple elements

---

## Handler Registration by Line Ranges

| Line Range | Handler Type | Context |
|------------|--------------|---------|
| 296-332 | Element change/input | OG generator controls |
| 3475-3510 | Group checkbox | Platform cropper |
| 3481-3497 | Individual checkbox | Platform selection |
| 3989-3991 | Text input filter | Metadata viewer |
| 6801 | Editor input | Code editor |
| 6813 | Framework select | Code snippet generator |
| 6831 | Import input | Preferences import |
| 8207 | Checkbox | General purpose |
| 9085 | Command input | Command palette |

---

## Handler Function Definitions by Line Numbers

| Function | Line | Purpose |
|----------|------|---------|
| handleBgTypeChange | 5106 | OG generator background type |
| handleBgImageUpload | 5117 | OG generator background image |
| handleLogoPosChange | 5133 | OG generator logo position |
| handleLogoUpload | 5140 | OG generator logo upload |
| handleHeatmapSort | 6101 | Sitemap heatmap sorting |
| filterCommands | 9177 | Command palette filtering |
| renderMetadataTable | 3941 | Metadata table filtering |

---

## Key Insights

1. **Consistent Naming Convention:** Most handlers follow `handle[Context][Action]` pattern
2. **Guard Patterns:** Smart ordering system uses centralized guards for filter operations
3. **Real-time vs. Change:** `input` events preferred for text filters, `change` for selects/checkboxes
4. **Self-referential Pattern:** Filter functions often re-attach their own listeners after rendering
5. **Batch Operations:** Group handlers use forEach loops for multiple element registration
6. **Optional Chaining:** Safe DOM access with `?.` operator throughout

---

## Total Event Listener Count
- **Total addEventListener calls:** 91+
- **Change events:** ~25
- **Input events:** ~15
- **Other events:** ~50+ (click, keydown, etc.)

---

## Next Steps for Further Analysis
1. Examine specific handler functions in detail (lines 5106-6150 range)
2. Analyze smart ordering guard system (lines 7885-7952)
3. Review group checkbox synchronization logic (lines 3475-3510)
4. Study filter function patterns (renderMetadataTable, filterCommands)
