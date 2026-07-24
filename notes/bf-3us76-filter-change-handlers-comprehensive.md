# Filter Change Handler Functions - Comprehensive Analysis

## Overview

This document catalogs all filter change handler functions found in the Vista application, building on the filter change event bindings analysis from bead `bf-5ye27`. All handlers are located in `/home/coding/vista/src/public/app.js`.

## Handler Classification

### 1. Named Handler Functions

#### 1.1 handleHeatmapSort
- **Location:** Line 6101
- **Binding Location:** Line 332 (`heatmapSort?.addEventListener('change', handleHeatmapSort)`)
- **Type:** Named function declaration
- **Scope:** Global scope (module-level function)
- **Event Type:** `change`
- **Target Element:** `#heatmapSort` dropdown

**Handler Code:**
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
    case 'url-asc':
      sorted.sort((a, b) => a.url.localeCompare(b.url));
      break;
    case 'url-desc':
      sorted.sort((a, b) => b.url.localeCompare(a.url));
      break;
  }

  renderHeatmapTable(sorted);
}
```

**Purpose:** Sorts heatmap results by score or URL in ascending/descending order and re-renders the heatmap table.

**Dependencies:**
- `heatmapSort` - global variable referencing the sort dropdown element
- `sitemapResults` - global array of sitemap data
- `renderHeatmapTable()` - function at line 6015

---

#### 1.2 filterCommands
- **Location:** Line 9177
- **Binding Location:** Line 9085 (`input.addEventListener('input', filterCommands)`)
- **Type:** Named function declaration
- **Scope:** Global scope (module-level function)
- **Event Type:** `input` (real-time text filtering)
- **Target Element:** Command palette text input

**Handler Code:**
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

**Purpose:** Filters command palette commands by label or category based on user input and updates the rendered command list.

**Dependencies:**
- `commandPaletteSelectedIndex` - global variable tracking selection
- `COMMANDS` - global array of command definitions
- `renderCommands()` - function at line 9127

---

### 2. Anonymous Inline Handler Functions

#### 2.1 Metadata Filter Input Handler
- **Location:** Line 3991
- **Binding Location:** Line 3991 (`filterInput.addEventListener('input', (e) => {...})`)
- **Type:** Anonymous arrow function
- **Scope:** Local scope (within `renderMetadataTable` function closure)
- **Event Type:** `input` (real-time text filtering)
- **Target Element:** `#metadataFilterInput`

**Handler Code:**
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

**Purpose:** Re-renders the metadata table with the current filter text input value, enabling real-time filtering of metadata tags.

**Dependencies:**
- `renderMetadataTable()` - function at line 3941

**Closures/Context:**
- Defined within `renderMetadataTable()` function
- Has access to function's local scope

---

#### 2.2 Cropper Group Toggle Handler
- **Location:** Line 3481
- **Binding Location:** Line 3480-3492 (forEach loop over `.cropper-group-toggle` elements)
- **Type:** Anonymous arrow function
- **Scope:** Local scope (within `renderCropperControls` function closure)
- **Event Type:** `change`
- **Target Element:** `.cropper-group-toggle` checkboxes

**Handler Code:**
```javascript
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
```

**Purpose:** Handles group-level checkbox changes by checking/unchecking all platforms in the group, then updating the enabled platforms set, redrawing overlays, and syncing group toggle states.

**Dependencies:**
- `groups` - parameter from containing function `renderCropperControls()`
- `updateEnabledPlatforms()` - function at line 3551
- `updateCropperOverlay()` - function at line 3600
- `syncGroupToggles()` - function at line 3530

**Closures/Context:**
- Defined within `renderCropperControls()` function
- Has access to `groups` parameter from parent scope

---

#### 2.3 Cropper Platform Toggle Handler
- **Location:** Line 3497
- **Binding Location:** Line 3496-3502 (forEach loop over `.cropper-platform-toggle input` elements)
- **Type:** Anonymous arrow function
- **Scope:** Local scope (within `renderCropperControls` function closure)
- **Event Type:** `change`
- **Target Element:** `.cropper-platform-toggle input` checkboxes

**Handler Code:**
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Purpose:** Handles individual platform checkbox changes by updating the enabled platforms set, redrawing overlays, and syncing group toggle states to reflect the new selection.

**Dependencies:**
- `groups` - parameter from containing function `renderCropperControls()`
- `updateEnabledPlatforms()` - function at line 3551
- `updateCropperOverlay()` - function at line 3600
- `syncGroupToggles()` - function at line 3530

**Closures/Context:**
- Defined within `renderCropperControls()` function
- Has access to `groups` parameter from parent scope

---

#### 2.4 What-If Toggle Handler
- **Location:** Line 8207
- **Binding Location:** Line 8206-8216 (forEach loop over `.what-if-toggle input` elements)
- **Type:** Anonymous arrow function
- **Scope:** Local scope (within `showWhatIfPanel` function closure)
- **Event Type:** `change`
- **Target Element:** `.what-if-toggle input` checkboxes

**Handler Code:**
```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
});
```

**Purpose:** Tracks which metadata tags are disabled in what-if mode by adding/removing them from the `disabledTags` Set, then updates the URL hash to persist the state.

**Dependencies:**
- `disabledTags` - global Set storing disabled tag names
- `updateHash()` - function at line 404

**Closures/Context:**
- Defined within `showWhatIfPanel()` function
- Has access to `panel` local variable from parent scope

---

## Related Helper Functions

### renderMetadataTable
- **Location:** Line 3941
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Renders the metadata table with optional filtering; called by metadata filter input handler

### renderHeatmapTable
- **Location:** Line 6015
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Renders the heatmap table with sorted results; called by `handleHeatmapSort`

### renderCommands
- **Location:** Line 9127
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Renders filtered command palette results; called by `filterCommands`

### updateEnabledPlatforms
- **Location:** Line 3551
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Updates the set of enabled platforms from checkbox states; called by cropper toggle handlers

### updateCropperOverlay
- **Location:** Line 3600
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Redraws platform crop overlays on the image; called by cropper toggle handlers

### syncGroupToggles
- **Location:** Line 3530
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Syncs group checkbox states (checked/unchecked/indeterminate) based on their child platform states; called by cropper toggle handlers

### updateHash
- **Location:** Line 404
- **Type:** Named function declaration
- **Scope:** Global scope
- **Purpose:** Updates URL hash with current application state; called by what-if toggle handler

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total handler functions** | 6 |
| **Named handlers** | 2 |
| **Anonymous inline handlers** | 4 |
| **Global scope handlers** | 2 |
| **Local scope handlers** | 4 |
| **change event handlers** | 4 |
| **input event handlers** | 2 |
| **Related helper functions** | 7 |

## Key Observations

1. **Split between named and anonymous handlers:** The codebase uses both patterns strategically:
   - Named handlers for reusable, complex operations (heatmap sorting, command filtering)
   - Anonymous inline handlers for simple, localized operations (checkbox toggles)

2. **Closure-based state management:** All anonymous handlers are defined within function closures, giving them access to parent-scope variables without needing global state.

3. **Chain reaction pattern in cropper handlers:** Both cropper toggle handlers follow the same three-step pattern:
   - `updateEnabledPlatforms()` - update state
   - `updateCropperOverlay()` - update visual overlay
   - `syncGroupToggles(groups)` - sync UI controls

4. **Real-time vs. deferred filtering:**
   - Text-based filters use `input` events for real-time filtering (metadata, commands)
   - Select/checkbox filters use `change` events that fire after value commits (heatmap, cropper, what-if)

5. **Separation of concerns:** Handlers are thin - they delegate complex logic to dedicated helper functions, keeping the event handlers focused on event processing.

## Acceptance Criteria Met

✅ **Located all anonymous functions passed to filter change bindings**
- Metadata filter input handler (line 3991)
- Cropper group toggle handler (line 3481)
- Cropper platform toggle handler (line 3497)
- What-if toggle handler (line 8207)

✅ **Located all named functions referenced as filter change handlers**
- `handleHeatmapSort` (line 6101)
- `filterCommands` (line 9177)

✅ **Documented the location and name of each handler function**
- All handlers documented with precise line numbers

✅ **Identified the scope/context of each handler**
- Named handlers: Global scope
- Anonymous handlers: Local scope within parent function closures

✅ **Created a list of handler function names and locations**
- Comprehensive catalog with code examples, dependencies, and purposes

---

**Generated:** 2026-07-24
**Source:** `/home/coding/vista/src/public/app.js`
**Bead:** bf-3us76
**Previous Analysis:** bf-5ye27 (filter change event bindings)
