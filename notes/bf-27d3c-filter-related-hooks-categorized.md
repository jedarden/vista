# Filter-Related Hooks - Categorized Analysis

**Task:** bf-27d3c  
**Source:** Comprehensive Filter-Change Hook Patterns Documentation  
**Date:** 2026-07-24  
**Source File:** `/home/coding/vista/src/public/app.js`

## Summary

From the comprehensive analysis of 43 distinct handlers and 17 architectural patterns, this document filters and categorizes only the **directly filter-related hooks**. Filter-related hooks are defined as those that either:

1. Perform actual filtering operations (filter data based on criteria)
2. Modify filterable state (which platforms/items are shown or hidden)
3. Manage filter system coordination (guard flags, queues)

## Category 1: Pure Filter Functions

### 1.1 `renderMetadataTable(filter = '')`

**Line Number:** 3941-3995  
**Type:** PURE filter function  
**Event Attachment:** Line 3991-3992  

```javascript
// Function signature (line 3941)
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders filtered rows
}

// Event listener (lines 3991-3992)
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

**Purpose:** Real-time filtering of metadata table rows by tag name or value  
**Filter Type:** Text-based substring matching  
**Context:** Local filtering only, no global state impact

---

### 1.2 `filterCommands(e)`

**Line Number:** 9177-9192  
**Type:** PURE filter function  
**Event Attachment:** Line 9085  

```javascript
// Function signature (lines 9177-9192)
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

// Event listener (line 9085)
input.addEventListener('input', filterCommands);
```

**Purpose:** Real-time filtering of command palette commands by label or category  
**Filter Type:** Multi-field text search  
**Context:** Local filtering only, resets selection index on filter change

---

## Category 2: Platform State Filter Operations

### 2.1 `toggleFavorite(pid)`

**Line Number:** 7867-7882  
**Type:** Platform visibility state modifier  
**Event Attachment:** Line 8008  
**Guard Pattern:** `guardWrapper()` - does NOT reset order  

```javascript
// Function signature (line 7867)
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();
    isSmartOrderingActive = false;
  });
}

// Event listener (line 8008)
btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
```

**Purpose:** Toggles platform favorite status - affects which platforms appear in favorites list  
**Filter Type:** Binary inclusion/exclusion from favorites set  
**State Impact:** Modifies `platformPrefs.favorites` Set

---

### 2.2 `toggleHidden(pid)`

**Line Number:** 7977-7986  
**Type:** Platform visibility state modifier  
**Event Attachment:** Line 8030  
**Guard Pattern:** `guardWrapperWithRender()` - DOES reset order  

```javascript
// Function signature (line 7977)
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
  });
}

// Event listener (line 8030)
btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
```

**Purpose:** Toggles platform hidden status - directly affects platform visibility in main view  
**Filter Type:** Binary inclusion/exclusion from results  
**State Impact:** Modifies `platformPrefs.hidden` Set, triggers full re-render

---

## Category 3: Meta-Tag Filter Operations

### 3.1 `toggleWhatIfMode()`

**Line Number:** 8121-8160  
**Type:** Meta-tag filter toggle  
**Event Attachment:** Line 8334  
**Guard Pattern:** Full guard with queue - DOES reset order  

```javascript
// Function signature (line 8121)
function toggleWhatIfMode() {
  // Guard pattern usage (lines 8142-8152)
  if (isSmartOrdering()) {
    const applyWhatIfReset = () => {
      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
      isSmartOrderingActive = false;
    };
    queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
    return;
  }

  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}

// Event listener (line 8334)
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

**Purpose:** Toggles What-If mode for testing platform behavior with specific meta tags disabled  
**Filter Type:** Meta-tag inclusion/exclusion filter  
**State Variables:** `whatIfMode` (line 8118), `disabledTags` Set (line 8119)

---

### 3.2 What-If Tag Toggle Handlers

**Line Numbers:** 8206-8215  
**Type:** Individual meta-tag filter toggles  
**Event Type:** `change`  
**Attachment Method:** Dynamic  

```javascript
// Dynamic attachment (lines 8206-8215)
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    updateHash();
  });
});
```

**Purpose:** Toggles individual meta tags on/off in What-If mode  
**Filter Type:** Per-tag binary filter  
**State Impact:** Modifies `disabledTags` Set, affects which meta tags are applied

---

### 3.3 `applyWhatIfChanges()`

**Line Number:** 8241-8265  
**Type:** Meta-tag filter application  
**Event Attachment:** Line 8220  
**Guard Pattern:** Full guard - DOES reset order  

```javascript
// Function signature (line 8241)
function applyWhatIfChanges() {
  // ... creates modifiedData with tags disabled
  
  // Guard pattern usage (lines 8263-8265)
  isFilterOperation = true;
  renderPreviews(modifiedData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}

// Event listener (line 8220)
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
```

**Purpose:** Applies What-If mode changes by re-rendering with modified data  
**Filter Type:** Conditional meta-tag application  
**Operation:** Creates `modifiedData` copy, filters out disabled tags, re-renders

---

## Category 4: Platform Selection Filter Handlers

### 4.1 Cropper Platform Toggle Handler

**Line Numbers:** 3497-3501  
**Type:** Multi-platform selection filter  
**Event Type:** `change`  
**DOM Element:** `.cropper-platform-toggle input`  

```javascript
// Event listener attachment (lines 3497-3501)
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Purpose:** Handles platform checkbox changes - filters which platforms are enabled for cropper  
**Filter Type:** Multi-select platform filter  
**State Impact:** Updates enabled platforms set

---

### 4.2 Cropper Group Toggle Handler

**Line Numbers:** 3481-3491  
**Type:** Group-based platform filter  
**Event Type:** `change`  
**DOM Element:** `.cropper-group-toggle`  

```javascript
// Event listener attachment (lines 3481-3491)
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

**Purpose:** Handles group checkbox changes - bulk toggles all platforms in a group  
**Filter Type:** Group-based bulk filter  
**Operation:** Selects/deselects all platforms in a group

---

## Category 5: Filter System Coordination

### 5.1 Guard Flag: `isFilterOperation`

**Line Numbers:** 6279 (declaration), 5046-5049 (window export)  
**Type:** Filter operation coordination flag  

```javascript
// Declaration (line 6279)
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

// Window export (lines 5046-5049)
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

**Purpose:** Coordinates filter operations to prevent race conditions with smart ordering  
**Usage Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Usage Locations:** Lines 8080, 8096, 8144, 8156, 8263  
**Check Locations:** Lines 8792, 8794 (applySmartOrdering)

---

### 5.2 Filter Operation Queue: `pendingFilterOperations`

**Line Numbers:** 6281 (declaration), 5050-5053 (window export)  
**Type:** Filter operation queue  

```javascript
// Declaration (line 6281)
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Window export (lines 5050-5053)
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Purpose:** Queues filter operations during smart ordering to prevent conflicts

---

### 5.3 `queueFilterOperation(operation, description)`

**Line Numbers:** 7942-7947 (function), 5055 (window export)  
**Type:** Filter operation queuing function  

```javascript
// Function definition (lines 7942-7947)
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

// Window export (line 5055)
window.queueFilterOperation = queueFilterOperation;
```

**Purpose:** Adds filter operations to the queue  
**Usage Examples:** Lines 8087 (importPreferences), 8148 (toggleWhatIfMode)

---

### 5.4 `processPendingFilterOperations()`

**Line Numbers:** 7952-7975 (function), 5056 (window export)  
**Type:** Filter operation queue processor  

```javascript
// Function definition (lines 7952-7975)
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];

  operations.forEach(({ operation, description }) => {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}

// Window export (line 5056)
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Purpose:** Executes queued filter operations after smart ordering completes

---

### 5.5 `shouldDeferFilterOperation()`

**Line Numbers:** 7891-7893  
**Type:** Filter operation deferment check  

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Checks if filter operation should be deferred (queued) vs executed immediately

---

### 5.6 `isSmartOrdering()`

**Line Numbers:** 7933-7935  
**Type:** Smart ordering status check  

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Determines if smart ordering is active (used in filter operation routing)  
**Usage Locations:** Lines 7888 (toggleFavorite), 7978 (toggleHidden), 8087 (importPreferences), 8142 (toggleWhatIfMode)

---

## Category 6: Preference Import Filter Operation

### 6.1 `importPreferences(e)`

**Line Number:** 8057-8099  
**Type:** Batch filter state import  
**Event Attachment:** Line 6831  
**Guard Pattern:** Full guard with queue - DOES reset order  

```javascript
// Guard pattern usage (lines 8087-8090)
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}

// Direct execution path (lines 8096-8099)
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Imports platform preferences (favorites, hidden, card order) from JSON file  
**Filter Type:** Batch filter state application  
**State Impact:** Replaces `platformPrefs.favorites`, `platformPrefs.hidden`, `platformPrefs.cardOrder`

---

## Summary Statistics

### Filter-Related Hook Count by Category

| Category | Count | Percentage |
|----------|-------|------------|
| Pure Filter Functions | 2 | 18% |
| Platform State Filter Operations | 2 | 18% |
| Meta-Tag Filter Operations | 3 | 27% |
| Platform Selection Filter Handlers | 2 | 18% |
| Filter System Coordination | 6 | 35% |
| **TOTAL** | **15** | **100%** |

### Filter-Related Hook Types

| Hook Type | Count | Examples |
|-----------|-------|----------|
| Direct filter functions | 2 | `renderMetadataTable()`, `filterCommands()` |
| State modification handlers | 4 | `toggleFavorite()`, `toggleHidden()`, tag toggles, `applyWhatIfChanges()` |
| System coordination functions | 6 | Guard flags, queue functions, status checks |
| Selection handlers | 2 | Platform toggles, group toggles |
| Import operations | 1 | `importPreferences()` |

### Line Number Reference

| Hook | Lines | Type |
|------|-------|------|
| `renderMetadataTable` | 3941-3995 | Pure filter |
| `filterCommands` | 9177-9192 | Pure filter |
| `toggleFavorite` | 7867-7882 | Platform state |
| `toggleHidden` | 7977-7986 | Platform state |
| `toggleWhatIfMode` | 8121-8160 | Meta-tag filter |
| What-If tag toggles | 8206-8215 | Meta-tag filter |
| `applyWhatIfChanges` | 8241-8265 | Meta-tag filter |
| Platform toggle handlers | 3497-3501 | Platform selection |
| Group toggle handlers | 3481-3491 | Platform selection |
| `isFilterOperation` | 6279, 5046-5049 | System coordination |
| `pendingFilterOperations` | 6281, 5050-5053 | System coordination |
| `queueFilterOperation` | 7942-7947, 5055 | System coordination |
| `processPendingFilterOperations` | 7952-7975, 5056 | System coordination |
| `shouldDeferFilterOperation` | 7891-7893 | System coordination |
| `isSmartOrdering` | 7933-7935 | System coordination |
| `importPreferences` | 8057-8099 | Batch import |

## Excluded Hooks (Non-Filter)

The following handlers from the comprehensive analysis were **excluded** as they don't perform filter operations:

- `handleHeatmapSort()` - sorting, not filtering
- `updateBadgePreview()` - visual preview update
- `handleBgTypeChange()` - OG generator styling
- `handleBgImageUpload()` - image upload handling
- `handleLogoPosChange()` - logo positioning
- `handleLogoUpload()` - logo upload handling
- `updateOggenCanvas()` - canvas rendering
- `handleEditorInput()` - editor input handling
- `generateCodeSnippet()` - code generation
- `updateFavoritesList()` - UI update (not filter decision)
- `updateHiddenList()` - UI update (not filter decision)
- Display mode toggles (context, theme) - rendering mode changes
- Context menu handlers - action routing, not filtering

---

**Generated for bead bf-27d3c: Filter-related hooks categorization**  
**Date:** 2026-07-24  
**Status:** COMPLETE
