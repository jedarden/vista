# Filter-Change Hook Patterns in app.js

## Summary

Search completed for filter-change hook patterns and callback registrations in `/home/coding/vista/src/public/app.js`.

## Patterns Found

### 1. Direct Event Listener - Text Input Filters

**Pattern:** `addEventListener('input', callback)`

**Location:** Line 3991
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Callback Function:** `renderMetadataTable(filter = '')` (Line 3941)

---

### 2. Direct Event Listener - Select/Dropdown Filters

**Pattern:** `addEventListener('change', callback)`

**Locations:**
- Line 296: `badgeStyleSelect?.addEventListener('change', updateBadgePreview)`
- Line 310: `oggenBgType?.addEventListener('change', handleBgTypeChange)`
- Line 314: `oggenGradientDir?.addEventListener('change', updateOggenCanvas)`
- Line 316: `oggenBgImageSize?.addEventListener('change', updateOggenCanvas)`
- Line 319: `oggenFont?.addEventListener('change', updateOggenCanvas)`
- Line 321: `ogenLogoPos?.addEventListener('change', handleLogoPosChange)`
- Line 332: `heatmapSort?.addEventListener('change', handleHeatmapSort)`
- Line 3481: `groupCb.addEventListener('change', (e) => { ... })` (Group header toggle)
- Line 3497: `cb.addEventListener('change', () => { ... })` (Platform toggle)
- Line 6813: `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet)`
- Line 6831: `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)`
- Line 8207: `cb.addEventListener('change', () => { ... })` (What-if toggle)

**Callback Functions:**
- `updateBadgePreview()` (referenced, not shown in search)
- `handleBgTypeChange()` (Line 5106)
- `updateOggenCanvas()` (Line 5156)
- `handleLogoPosChange()` (Line 5133)
- `handleHeatmapSort()` (referenced, not shown in search)
- `generateCodeSnippet()` (referenced, not shown in search)
- `importPreferences()` (referenced around Line 8060)
- Inline arrow functions for group/platform toggles

---

### 3. Guard Flag Pattern (isFilterOperation)

**Purpose:** Prevent smart order resets during filter changes

**Key Locations:**

**Declaration (Line 6279):**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Exposed via Object.defineProperty (Lines 5046-5049):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

**Usage Pattern (Lines 8080-8082, 8096-8099):**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### 4. Queue Pattern (queueFilterOperation)

**Purpose:** Defer filter operations during smart ordering to prevent conflicts

**Function Definition (Lines 7942-7950):**
```javascript
function queueFilterOperation(operation, description) {
  pendingFilterOperations.push({ operation, description });
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
}
```

**Exposed Globally (Line 5055):**
```javascript
window.queueFilterOperation = queueFilterOperation;
```

**Usage Example (Lines 8079-8088):**
```javascript
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  isSmartOrderingActive = false;
};
queueFilterOperation(applyImportedPrefs, 'importPreferences');
```

**Processing Function (Lines 7952-7974):**
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) return;

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  while (pendingFilterOperations.length > 0) {
    const { operation, description } = pendingFilterOperations.shift();
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  }
}
```

**Related State Variables (Lines 6280-6281):**
```javascript
let isSmartOrderingActive = false;
let pendingFilterOperations = [];
```

---

### 5. Inline Arrow Callback Pattern

**Pattern:** Direct arrow function passed to addEventListener

**Locations:**
- Line 3991: `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); })`
- Line 3481: `groupCb.addEventListener('change', (e) => { const group = e.target.dataset.group; ... })`
- Line 3497: `cb.addEventListener('change', () => { updateEnabledPlatforms(); updateCropperOverlay(); ... })`
- Line 8207: `cb.addEventListener('change', () => { if (!cb.checked) disabledTags.add(cb.dataset.tag); ... })`

---

### 6. Named Callback Functions

**Pattern:** Named function references passed to addEventListener

**Examples:**
- `handleEditorInput` (Line 6589, called at Line 6801)
- `filterCommands` (Line 9177, called at Line 9085)
- `renderMetadataTable` (Line 3941, called at Line 3992)
- `updateOggenCanvas` (Line 5156, called at Lines 311, 312, 313, 314, 316, 317, 318, 319, 320, 323)
- `handleBgTypeChange` (Line 5106, called at Line 310)
- `handleLogoPosChange` (Line 5133, called at Line 321)
- `updateEnabledPlatforms` (called at Lines 3488, 3498, 3507, 3514, 3521)
- `updateCropperOverlay` (called at Lines 3489, 3499, 3508, 3515)

---

### 7. Render/Update Function Pattern

**Pattern:** Filter changes trigger render/update functions

**Key Functions:**
- `renderPreviews(data)` (Line 1583) - Main render function for preview cards
- `renderMetadataTable(filter = '')` (Line 3941) - Filter metadata table
- `updateEnabledPlatforms()` - Update enabled platform state
- `updateCropperOverlay()` - Update cropper UI overlay
- `renderCommands()` (referenced at Line 9182) - Render command palette

---

### 8. Related State Management

**Filter-Related State Variables:**
- `isFilterOperation` (Line 6279) - Guard flag
- `isSmartOrderingActive` (Line 6280) - Smart ordering state
- `pendingFilterOperations` (Line 6281) - Queue array
- `currentData` (multiple references) - Current data being rendered
- `whatIfMode` (Line 8118) - What-if mode state
- `disabledTags` (Line 8119) - Disabled tags in what-if mode

---

## Key Observations

1. **No traditional hook naming**: No patterns like `onFilterChange`, `afterFilterChange`, or `filter:change` found
2. **Event-driven architecture**: Primarily uses `addEventListener` with `input` and `change` events
3. **Guard flag pattern**: `isFilterOperation` flag prevents race conditions during smart ordering
4. **Queue pattern**: `queueFilterOperation` defers operations during active smart ordering
5. **Direct callbacks**: Most filter operations directly call render/update functions
6. **Mix of inline and named callbacks**: Both arrow functions and named function references used

## Callback Registration Locations Summary

| Type | Line | Pattern | Callback |
|------|------|---------|----------|
| Text input | 3991 | `input` | `renderMetadataTable` |
| Select dropdown | 296, 310-325, 332, 6813, 6831 | `change` | Various named functions |
| Checkbox | 3481, 3497, 8207 | `change` | Inline/Named |
| Guard flag | 6279, 5046-5049, 8080-8099 | State flag | `isFilterOperation` |
| Queue pattern | 7942-7974, 8088 | Queue functions | `queueFilterOperation` |

## File Details

- **File**: `/home/coding/vista/src/public/app.js`
- **File Size**: 367.1 KB (too large to read in full)
- **Total Lines**: ~19,000+ (estimated based on file size)

---

*Search completed on 2026-07-24*
*Bead ID: bf-d9reu*
