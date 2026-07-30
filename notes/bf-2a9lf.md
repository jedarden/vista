# Event Listener Patterns in app.js - Filter-Related Listeners

## Task: Search app.js for all event listener patterns and identify filter-change related listeners

### Summary

This document catalogs all event listener patterns in `/home/coding/vista/src/public/app.js`, with a focus on filter-change related listeners. The app.js file (367.1KB) contains numerous event listeners; 5 are directly related to filter operations.

---

## All Event Listener Patterns Found

### Basic addEventListener Patterns (non-filter)
- **Line 230**: `urlForm.addEventListener('submit', ...)`
- **Line 231**: `pasteForm.addEventListener('submit', ...)`
- **Line 234**: `urlInput.addEventListener('paste', ...)`
- **Line 243**: `document.addEventListener('click', ...)`
- **Lines 270-289**: Various UI control event listeners (mode switching, modals, etc.)
- **Lines 310-326**: OG generator input/change listeners
- **Lines 329-333**: Sitemap and heatmap listeners
- **Lines 338-352**: Chip clicks and tab navigation
- **Lines 374, 347-352**: Platform selector chips and tabs
- **Line 491**: `window.addEventListener('DOMContentLoaded', ...)`
- **Line 510**: Global theme toggle
- **Lines 1202, 1514, 1988, 1995, 2001, 2005**: Card interaction listeners
- **Lines 2089-2100**: Additional card event listeners
- **Lines 3481, 3497, 3504, 3511**: Checkbox change listeners
- **Lines 4754, 4866**: Modal focus trap keydown listeners
- **Lines 4926, 5965, 5975**: Scroll and dismiss button listeners
- **Line 6579**: Global keyboard shortcuts
- **Lines 6797-6834**: Editor input, reset, apply, framework, export/import listeners
- **Lines 7630, 8008, 8030, 8207**: Template application, favorite, hidden, checkbox listeners
- **Lines 8218-8220**: What-if panel controls
- **Line 8334**: What-if toggle button
- **Lines 8339, 8353, 8371**: Document-level click, blur, keydown listeners
- **Line 8425**: Diagnostic fix buttons
- **Line 8946**: Command palette initialization
- **Lines 9085-9086**: **Command filter input and keydown** (filter-related)
- **Line 9086**: Command palette keydown navigation

---

## Filter-Change Related Event Listeners

### 1. Metadata Filter Input Listener
**Location**: Lines 3988-3994
```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context**: Part of the metadata viewer component
**Purpose**: Filters metadata table rows by tag name or value in real-time as user types
**Handler**: `renderMetadataTable(filter)` (defined at line 3941)

**Handler Logic**:
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders table with filtered rows
}
```

**Type**: `input` event (real-time filtering)

---

### 2. Command Palette Filter Input Listener
**Location**: Line 9085
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Context**: Command palette component initialization (line 8946-9086)
**Purpose**: Filters command list by label or category in real-time
**Handler**: `filterCommands(e)` (defined at line 9177)

**Handler Logic**:
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

**Type**: `input` event (real-time filtering)

---

### 3. Heatmap Sort Filter Listener
**Location**: Line 332
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Context**: Sitemap/heatmap viewer component
**Purpose**: Sorts heatmap data by different criteria (score ascending/descending, URL, etc.)
**Handler**: `handleHeatmapSort()` (defined at line 6101)

**Handler Logic**:
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
      // ... more sort options
  }
  // ... re-renders heatmap with sorted data
}
```

**Type**: `change` event (fires after select dropdown value changes)

---

## Filter Operation Guard Infrastructure

### Global State Variables
**Lines 6279-6281**:
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Public API (Lines 5055-5056)
```javascript
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Purpose**: These guard functions prevent race conditions between filter operations and smart ordering operations in the platform card ordering system.

**Usage Pattern** (from documentation at lines 7908-7915):
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

## Additional Filter-Related Patterns

### No onFilterChange Callbacks Found
Search patterns checked:
- `onFilterChange`
- `onfilter`
- `filter-change`
- `filterChange`

**Result**: No `onFilterChange` or similar callback patterns found in app.js. All filter operations use direct `addEventListener` with `input` or `change` events.

### No Custom Filter Events
Search patterns checked:
- `dispatchEvent.*filter`
- `CustomEvent.*filter`

**Result**: No custom filter events dispatched. All filter communication uses direct function calls.

---

## Event Listener Type Summary

| Event Type | Count | Purpose |
|------------|-------|---------|
| `input` | 2 | Real-time filter text input |
| `change` | 1 | Dropdown selection change (heatmap sort) |
| `click` | ~45 | Button/element interactions |
| `submit` | 2 | Form submissions |
| `keydown` | 4 | Keyboard navigation |
| `scroll` | 2 | Scroll handling |
| `paste` | 1 | Paste events |
| `blur` | 1 | Focus loss handling |
| `DOMContentLoaded` | 2 | Initialization |

---

## Key Findings

1. **Two real-time text filters** using `input` event:
   - Metadata table filter (line 3991)
   - Command palette filter (line 9085)

2. **One dropdown sort filter** using `change` event:
   - Heatmap sort (line 332)

3. **No callback-based filter patterns** (`onFilterChange`) - all use direct event listeners

4. **Filter operation guard infrastructure** exists to prevent race conditions with smart ordering operations (lines 6279-6281, 5055-5056, 7942-7967)

5. **All filter handlers perform case-insensitive matching** on the input query

---

## Search Methodology

1. Searched for `addEventListener` patterns
2. Searched for `on*` event patterns
3. Searched for filter-related function names
4. Searched for custom event dispatching
5. Examined context around each match to determine purpose

---

## Related Documentation

From workspace memory:
- **bf-4bo1**: Resizable split pane patterns using flexbox and localStorage
- **bf-5125**: Client-side simulation patterns (scoring-simulator.js mirrors server logic)
