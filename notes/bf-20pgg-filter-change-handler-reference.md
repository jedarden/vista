# Filter Change Handler Reference - VISTA app.js

**Bead:** bf-20pgg  
**Date:** 2026-07-24  
**Purpose:** Comprehensive reference for all filter change handlers in VISTA's app.js  
**Source Files:** /home/coding/vista/src/public/app.js (9,998 lines)

---

## Overview

This document consolidates findings from multiple filter handler analysis beads into a single reference. Filter change handlers are functions that respond to user input events (input, change, click) to filter, sort, or modify data display in the VISTA application.

### Handler Categories

1. **Data Filters** - Filter tables, lists, and command palettes
2. **UI Toggles** - Platform/group visibility toggles in cropper
3. **Mode Switches** - What If mode, favorites, hidden platforms
4. **Generator Controls** - OG generator and badge styling
5. **Filter Guards** - Smart ordering protection and operation queuing

---

## Summary Table: All Filter Change Handlers

| Handler | Lines | DOM Element | Event | Resets Order? | Category |
|---------|-------|-------------|-------|---------------|----------|
| `filterCommands()` | 9177 | `#commandInput` | input | ❌ NO | Data Filter |
| `handleHeatmapSort()` | 6101 | `#heatmapSort` | change | ❌ NO | Data Filter |
| `renderMetadataTable()` | 3991 | `#metadataFilterInput` | input | ❌ NO | Data Filter |
| `updateEnabledPlatforms()` | 3551 | (called by toggles) | — | ❌ NO | UI Toggle |
| `toggleFavorite()` | 7867 | `.platform-item-remove` | click | ❌ NO | Mode Switch |
| `toggleHidden()` | 7984 | `.platform-item-remove` | click | ✅ YES | Mode Switch |
| `importPreferences()` | 8082 | `#importPrefsInput` | change | ✅ YES | Mode Switch |
| `toggleWhatIfMode()` | 8146 | `#whatIfToggleBtn` | click | ✅ YES | Mode Switch |
| `applyWhatIfChanges()` | 8254 | `#whatIfApply` | click | ✅ YES | Mode Switch |
| `shouldDeferFilterOperation()` | 7891 | (guard function) | — | — | Filter Guard |
| `queueFilterOperation()` | 7942 | (guard function) | — | — | Filter Guard |
| `processPendingFilterOperations()` | 7952 | (guard function) | — | — | Filter Guard |
| Group toggle handler | 3481 | `.cropper-group-toggle` | change | ❌ NO | UI Toggle |
| Platform toggle handler | 3497 | `.cropper-platform-toggle input` | change | ❌ NO | UI Toggle |
| What-if tag toggle | 8207 | `.what-if-toggle input` | change | ✅ YES | Mode Switch |
| `handleBgTypeChange()` | 5106 | `#oggenBgType` | change | ❌ NO | Generator |
| `handleLogoPosChange()` | 5133 | `#oggenLogoPos` | change | ❌ NO | Generator |
| `handleBgImageUpload()` | 5117 | `#oggenBgImageInput` | change | ❌ NO | Generator |
| `handleLogoUpload()` | 5140 | `#oggenLogoInput` | change | ❌ NO | Generator |
| `updateOggenCanvas()` | — | Multiple OG controls | input/change | ❌ NO | Generator |
| `updateBadgePreview()` | — | `#badgeStyleSelect` | change | ❌ NO | Generator |
| `handleEditorInput()` | — | `.editor-input` etc. | input | ❌ NO | Editor |
| `generateCodeSnippet()` | — | `#snippetFramework` | change | ❌ NO | Customization |

**Total Count:** 24 handler functions + 5 inline handlers = **29 total**

---

## Category 1: Data Filters

### 1.1 Command Palette Filter

**Function:** `filterCommands(e)`  
**Lines:** 9177-9191  
**DOM Attachment:** Line 9085  
**Element:** `#commandInput`  
**Event:** `input`  
**Context:** Filters command palette options based on search query

```javascript
// Attachment (line 9085)
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);

// Handler (lines 9177-9191)
function filterCommands(e) {
  const query = e.target.value.toLowerCase();
  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    (cmd.keywords && cmd.keywords.some(k => k.toLowerCase().includes(query)))
  );
  renderCommands(filtered);
}
```

**Purpose:** Real-time filtering of command palette results as user types

---

### 1.2 Heatmap Sort

**Function:** `handleHeatmapSort()`  
**Lines:** 6101-6123  
**DOM Attachment:** Line 332  
**Element:** `#heatmapSort`  
**Event:** `change`  
**Context:** Sorts sitemap heatmap by different criteria

```javascript
// Attachment (line 332)
heatmapSort?.addEventListener('change', handleHeatmapSort);

// Handler (lines 6101-6123)
function handleHeatmapSort() {
  const sortBy = document.getElementById('heatmapSort')?.value;
  // ... sorting logic
}
```

**Purpose:** Changes sort order of platform coverage heatmap (no card order impact)

---

### 1.3 Metadata Table Filter

**Handler:** Inline anonymous function  
**Lines:** 3991-3993  
**DOM Attachment:** Line 3991  
**Element:** `#metadataFilterInput`  
**Event:** `input`  
**Context:** Filters raw metadata tags table

```javascript
// Attachment (lines 3989-3993)
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}

// Handler (lines 3941-3970)
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders filtered table with count
}
```

**Purpose:** Filters metadata table by tag name/value, shows "X of Y tags" count

---

## Category 2: UI Toggles (Cropper)

### 2.1 Group Header Toggles

**Handler:** Inline anonymous function  
**Lines:** 3481-3492  
**DOM Attachment:** Line 3480  
**Element:** `.cropper-group-toggle` (multiple)  
**Event:** `change`  
**Context:** Toggles all platforms in a group

```javascript
// Attachment (lines 3480-3491)
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

**Purpose:** Select/deselect all platforms in a group, updates overlay

---

### 2.2 Individual Platform Toggles

**Handler:** Inline anonymous function  
**Lines:** 3497-3502  
**DOM Attachment:** Line 3496  
**Element:** `.cropper-platform-toggle input` (multiple)  
**Event:** `change`  
**Context:** Toggle individual platform visibility

```javascript
// Attachment (lines 3496-3501)
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Purpose:** Enable/disable individual platform overlays in cropper

---

### 2.3 Select All / Clear All Buttons

**Handlers:** Inline functions  
**Lines:** 3504-3516  
**DOM Attachments:** Lines 3504, 3511  
**Elements:** `#selectAllPlatforms`, `#clearAllPlatforms`  
**Event:** `click`

```javascript
// Select All (lines 3504-3508)
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});

// Clear All (lines 3511-3515)
document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Purpose:** Bulk platform selection controls for cropper overlay

---

### 2.4 updateEnabledPlatforms()

**Function:** `updateEnabledPlatforms()`  
**Lines:** 3551+  
**Called by:** All platform toggle handlers  
**Purpose:** Updates internal list of enabled platforms after toggle changes

---

## Category 3: Mode Switches

### 3.1 Toggle Favorite (No Order Reset)

**Function:** `toggleFavorite(pid)`  
**Lines:** 7867-7890  
**DOM Attachment:** Line 8008  
**Element:** `.platform-item-remove` (within `#favoritesList`)  
**Event:** `click`  
**Resets Order:** ❌ NO

```javascript
// Attachment (lines 8007-8009)
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});

// Handler (lines 7867-7890)
function toggleFavorite(pid) {
  const index = favorites.indexOf(pid);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(pid);
  }
  updateFavoritesList();
}
```

**Purpose:** Add/remove platform from favorites list, does NOT reset card order

---

### 3.2 Toggle Hidden (Resets Order)

**Function:** `toggleHidden(pid)`  
**Lines:** 7984-8013  
**DOM Attachment:** Line 8030  
**Element:** `.platform-item-remove` (within `#hiddenPlatformsList`)  
**Event:** `click`  
**Resets Order:** ✅ YES

```javascript
// Attachment (lines 8029-8031)
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});

// Handler (lines 7984-8013)
function toggleHidden(pid) {
  const index = hiddenPlatforms.indexOf(pid);
  if (index > -1) {
    hiddenPlatforms.splice(index, 1);
  } else {
    hiddenPlatforms.push(pid);
  }
  updateHiddenList();
  renderPreviews(currentData); // Triggers re-render (resets order)
}
```

**Purpose:** Add/remove platform from hidden list, DOES reset card order

---

### 3.3 Import Preferences (Resets Order)

**Function:** `importPreferences(e)`  
**Lines:** 8082-8140  
**DOM Attachment:** Line 6831  
**Element:** `#importPrefsInput`  
**Event:** `change`  
**Resets Order:** ✅ YES

```javascript
// Attachment (line 6831)
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);

// Handler (lines 8082-8140) - Uses filter guard pattern
function importPreferences(e) {
  if (isSmartOrdering()) {
    queueFilterOperation(() => importPreferences(e), 'importPreferences');
    return;
  }
  isFilterOperation = true;
  // ... import logic
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Purpose:** Import saved preferences from JSON file, resets card order

---

### 3.4 Toggle What If Mode (Resets Order)

**Function:** `toggleWhatIfMode()`  
**Lines:** 8146-8187  
**DOM Attachment:** Line 8334  
**Element:** `#whatIfToggleBtn`  
**Event:** `click`  
**Resets Order:** ✅ YES

```javascript
// Attachment (line 8334)
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);

// Handler (lines 8146-8187) - Uses filter guard pattern
function toggleWhatIfMode() {
  if (isSmartOrdering()) {
    queueFilterOperation(toggleWhatIfMode, 'toggleWhatIfMode');
    return;
  }
  isFilterOperation = true;
  whatIfMode = !whatIfMode;
  // ... toggle logic
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Purpose:** Toggle "What If" mode for simulating missing metadata tags

---

### 3.5 What If Tag Toggles (Resets Order)

**Handler:** Inline anonymous function  
**Lines:** 8207-8216  
**DOM Attachment:** Line 8206  
**Element:** `.what-if-toggle input` (multiple)  
**Event:** `change`  
**Resets Order:** ✅ YES

```javascript
// Attachment (lines 8206-8216)
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    updateHash(); // Persists to URL
  });
});
```

**Purpose:** Enable/disable specific meta tags in What If simulation, persists to hash

---

### 3.6 Apply What If Changes (Resets Order)

**Function:** `applyWhatIfChanges()`  
**Lines:** 8254-8305  
**DOM Attachment:** Line 8220  
**Element:** `#whatIfApply`  
**Event:** `click`  
**Resets Order:** ✅ YES

```javascript
// Attachment (line 8220)
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);

// Handler (lines 8254-8305) - Uses filter guard pattern
function applyWhatIfChanges() {
  if (isSmartOrdering()) {
    queueFilterOperation(applyWhatIfChanges, 'applyWhatIfChanges');
    return;
  }
  isFilterOperation = true;
  // ... apply changes logic
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Purpose:** Apply selected tag exclusions in What If panel

---

## Category 4: Generator Controls

### 4.1 OG Generator Controls

Multiple handlers for OG image generator:

| Function | Lines | Element | Event | Purpose |
|----------|-------|---------|-------|---------|
| `handleBgTypeChange()` | 5106 | `#oggenBgType` | change | Background type selection |
| `handleLogoPosChange()` | 5133 | `#oggenLogoPos` | change | Logo position |
| `handleBgImageUpload()` | 5117 | `#oggenBgImageInput` | change | Background image upload |
| `handleLogoUpload()` | 5140 | `#oggenLogoInput` | change | Logo upload |
| `updateOggenCanvas()` | — | Multiple controls | input/change | Real-time canvas preview |

**DOM Attachments:** Lines 310-326 (batch attachment)

```javascript
// OG Generator event listeners (lines 310-326)
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenGradientStart?.addEventListener('input', updateOggenCanvas);
oggenGradientEnd?.addEventListener('input', updateOggenCanvas);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
oggenTitle?.addEventListener('input', updateOggenCanvas);
oggenSubtitle?.addEventListener('input', updateOggenCanvas);
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenTextColor?.addEventListener('input', updateOggenCanvas);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
oggenLogoInput?.addEventListener('change', handleLogoUpload);
oggenLogoSize?.addEventListener('input', updateOggenCanvas);
oggenDownloadBtn?.addEventListener('click', downloadOggenImage);
oggenResetBtn?.addEventListener('click', resetOggen);
oggenUseInEditorBtn?.addEventListener('click', useOggenInEditor);
```

**Purpose:** OG image preview and generation (no card order impact)

---

### 4.2 Badge Style Preview

**Function:** `updateBadgePreview()`  
**DOM Attachment:** Line 296  
**Element:** `#badgeStyleSelect`  
**Event:** `change`

```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

**Purpose:** Update badge preview in modal based on style selection

---

### 4.3 Code Snippet Framework

**Function:** `generateCodeSnippet()`  
**DOM Attachment:** Line 6813  
**Element:** `#snippetFramework`  
**Event:** `change`

**Purpose:** Generate embed code snippet for selected framework

---

### 4.4 Editor Input Handler

**Function:** `handleEditorInput`  
**DOM Attachment:** Lines 6799-6801  
**Elements:** `.editor-input, .editor-textarea, .editor-select` (multiple)  
**Event:** `input`

```javascript
const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
editorInputs.forEach(input => {
  input.addEventListener('input', handleEditorInput);
});
```

**Purpose:** Update meta tag editor previews and impact indicators

---

## Category 5: Filter Guards (Smart Ordering Protection)

### Guard System Overview

**Purpose:** Prevent race conditions between filter changes and smart ordering operations

**Guard Flags:**
```javascript
let isFilterOperation = false;        // Line 6279
let isSmartOrderingActive = false;    // Line 6280
let pendingFilterOperations = [];     // Line 6281
```

---

### 5.1 shouldDeferFilterOperation()

**Function:** `shouldDeferFilterOperation()`  
**Lines:** 7891-7893  
**Purpose:** Check if filter operation should be deferred

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

---

### 5.2 queueFilterOperation()

**Function:** `queueFilterOperation(operation, description)`  
**Lines:** 7942-7947  
**Purpose:** Queue a filter operation to run after smart ordering completes

```javascript
function queueFilterOperation(operation, description) {
  pendingFilterOperations.push({ operation, description });
}
```

---

### 5.3 processPendingFilterOperations()

**Function:** `processPendingFilterOperations()`  
**Lines:** 7952-7975  
**Purpose:** Execute all queued filter operations

```javascript
function processPendingFilterOperations() {
  const operations = [...pendingFilterOperations];
  pendingFilterOperations = [];
  operations.forEach(({ operation, description }) => {
    try {
      operation();
    } catch (error) {
      console.error(`Error processing queued filter operation (${description}):`, error);
    }
  });
}
```

---

### 5.4 isSmartOrdering()

**Function:** `isSmartOrdering()`  
**Lines:** 7933-7935  
**Purpose:** Check if smart ordering is both enabled AND active

```javascript
function isSmartOrdering() {
  return smartOrder && isSmartOrderingActive;
}
```

---

## Filter Guard Usage Pattern

**Standard pattern for handlers that reset order:**

```javascript
function filterHandler() {
  // 1. Check if smart ordering is active
  if (isSmartOrdering()) {
    queueFilterOperation(filterHandler, 'filterHandler');
    return;
  }
  
  // 2. Set guard flag
  isFilterOperation = true;
  
  // 3. Perform filter operation
  // ... operation logic here
  renderPreviews(currentData);
  
  // 4. Reset guard flag
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Used in:**
- `importPreferences()` (lines 8095-8099)
- `toggleWhatIfMode()` (lines 8144-8159)
- `applyWhatIfChanges()` (lines 8263-8265)

---

## Event Attachment Patterns

### Static Event Listeners (DOM Ready)

- Attached once when page loads
- Use `document.getElementById()` with optional chaining `?.`
- Found in initialization section (lines 229-6850)

```javascript
// Pattern
element?.addEventListener('event', handler);
```

**Examples:**
- Heatmap sort (line 332)
- Badge style (line 296)
- What If toggle (line 8334)
- Import preferences (line 6831)
- All OG generator controls (lines 310-326)

---

### Dynamic Event Listeners (Runtime)

- Re-attached each time parent container is re-rendered
- Use `querySelectorAll()` with `forEach()` to attach to multiple elements
- Found in update/render functions

```javascript
// Pattern
container.querySelectorAll('.selector').forEach(el => {
  el.addEventListener('event', handler);
});
```

**Examples:**
- Favorites list (lines 8007-8009)
- Hidden platforms list (lines 8029-8031)
- Metadata filter (lines 3989-3993)
- Command palette (line 9085)
- Cropper controls (lines 3480-3515)

**Why Dynamic?**
- Parent lists are completely re-rendered with `innerHTML`
- Event listeners on child elements are lost when DOM is replaced
- Re-attachment ensures handlers remain functional

---

## Event Type Choices

| Event Type | Use Case | Behavior |
|------------|----------|----------|
| `input` | Text fields | Fires immediately on each keystroke |
| `change` | Selects, checkboxes, file inputs | Fires after value change commits |
| `click` | Buttons, interactive elements | Fires on user interaction |

---

## Order Reset Behavior

### Handlers That Reset Card Order

These trigger `renderPreviews(currentData)` and reset card order:

1. ✅ `toggleHidden()` - Directly calls `renderPreviews()`
2. ✅ `importPreferences()` - Uses filter guard, calls `renderPreviews()`
3. ✅ `toggleWhatIfMode()` - Uses filter guard, calls `renderPreviews()`
4. ✅ `applyWhatIfChanges()` - Uses filter guard, calls `renderPreviews()`
5. ✅ What If tag toggles - Update hash, trigger re-render

### Handlers That DO NOT Reset Card Order

These only modify UI state or filter local views:

1. ❌ `toggleFavorite()` - Only updates favorites list UI
2. ❌ `filterCommands()` - Only filters command palette
3. ❌ `handleHeatmapSort()` - Only sorts heatmap
4. ❌ `renderMetadataTable()` - Only filters metadata table
5. ❌ All cropper toggles - Only modify overlay visibility
6. ❌ All OG generator controls - Only update canvas preview

---

## DOM Element References

### Core Filter Elements

| Element ID | Purpose | Handler |
|-------------|---------|---------|
| `#commandInput` | Command palette search | `filterCommands()` |
| `#heatmapSort` | Heatmap sort dropdown | `handleHeatmapSort()` |
| `#metadataFilterInput` | Metadata table filter | Inline handler |
| `#whatIfToggleBtn` | What If mode toggle | `toggleWhatIfMode()` |
| `#whatIfApply` | Apply What If changes | `applyWhatIfChanges()` |
| `#importPrefsInput` | Import preferences file | `importPreferences()` |

### Class-Based Selectors

| Class Selector | Purpose | Attachment Context |
|----------------|---------|-------------------|
| `.platform-item-remove` | Remove buttons (favorites/hidden) | Dynamic (list re-render) |
| `.cropper-group-toggle` | Group checkboxes | Dynamic (update controls) |
| `.cropper-platform-toggle input` | Platform checkboxes | Dynamic (update controls) |
| `.what-if-toggle input` | What If tag toggles | Dynamic (panel render) |

---

## Implementation Notes

### Dynamic Re-attachment Pattern

Handlers like `toggleFavorite()` and `toggleHidden()` use dynamic re-attachment because:
1. Parent lists are completely re-rendered with `innerHTML`
2. Event listeners on child elements are lost when DOM is replaced
3. Re-attachment ensures handlers remain functional after list updates

### Optional Chaining Pattern

Most static event listeners use optional chaining `?.addEventListener()`:
```javascript
document.getElementById('elementId')?.addEventListener('event', handler);
```
This prevents errors if elements don't exist (e.g., in different page modes).

### Hash State Integration

Filter state persists to URL hash for shareability:
- What If disabled tags: `#whatif-disabled=og:title,twitter:card`
- Automatically parsed on page load
- Updated dynamically when toggles change

### Screen Reader Support

Filter operations include `announce()` calls for accessibility:
```javascript
announce(`What If mode ${whatIfMode ? 'enabled' : 'disabled'}`);
```

---

## Related Documentation

This reference consolidates findings from:
- `bf-41x7c-filter-change-handlers.md` - Handler function identification
- `bf-4gu1l-filter-handler-dom-mapping.md` - DOM element mapping
- `bf-4gu1l-filter-handler-mapping.md` - Event attachment patterns
- `bf-1ohg7-appjs-structure-analysis.md` - Overall app.js structure

---

## Quick Reference

### To Find a Handler:
1. Look up by function name in Summary Table
2. Jump to category section for details
3. Check code snippets for attachment and implementation

### To Add a New Handler:
1. Determine if it resets order (needs filter guard)
2. Choose appropriate event type (input/change/click)
3. Use static attachment for permanent elements
4. Use dynamic attachment for re-rendered containers
5. Update this document with new handler details

### Debugging Filter Issues:
1. Check if handler uses filter guard pattern
2. Verify event listener attachment (static vs dynamic)
3. Check DOM element selector is correct
4. Verify event type matches user interaction
5. Check for conflicts with smart ordering

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-24  
**Status:** Complete - All filter change handlers documented