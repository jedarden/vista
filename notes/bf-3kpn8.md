# Filter-Change Event Listener Patterns in Vista app.js

## Overview
Search results for event listener patterns related to filter changes in `/home/coding/vista/src/public/app.js`.

---

## 1. Direct Filter Input Event Listeners

### 1.1 Metadata Filter Input (Line 3991)
**Location:** Line 3989-3993
**Context:** Metadata table filtering functionality

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**DOM Element:** `#metadataFilterInput` - text input for filtering metadata tags
**Event:** `input` event (fires on each keystroke)
**Handler:** `renderMetadataTable(e.target.value)` - filters and re-renders the metadata table

### 1.2 Command Palette Filter (Line 9085)
**Location:** Line 9083-9086
**Context:** Command palette search/filter functionality

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

**DOM Element:** `#commandInput` - command palette input field
**Event:** `input` event
**Handler:** `filterCommands` function (defined at line 9177)

**Filter Commands Handler (Line 9177-9200):**
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
    cmd.id.toLowerCase().includes(query)
  );
  renderCommands(filtered);
}
```

---

## 2. Filter Operation Guard Patterns

### 2.1 Guard Flag Declaration (Line 6279-6281)
**Location:** Lines 6279-6281
**Context:** Global guard flags for preventing smart order resets during filter operations

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### 2.2 Global Property Exports (Line 5046-5051)
**Location:** Lines 5046-5051
**Context:** Exposing guard flags to window object for debugging

```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

### 2.3 Guard Flag Usage Patterns

**Pattern A: Import Preferences (Lines 8095-8099)**
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Pattern B: What If Reset (Lines 8155-8159)**
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Pattern C: Smart Ordering Defer (Lines 8080-8082, 8144-8146)**
```javascript
if (isSmartOrdering()) {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Pattern D: Guard Check (Line 8792-8795)**
```javascript
if (isFilterOperation || isSmartOrdering()) {
  console.warn(`Skipping operation - ${reason}`);
  return;
}
```

---

## 3. Change Event Listeners (Related to Filtering)

### 3.1 Cropper Platform/Group Toggles (Lines 3481, 3497)
**Location:** Lines 3480-3502
**Context:** Platform filtering in cropper interface

```javascript
// Group header toggle → check/uncheck every platform in that group
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

// Individual platform toggle → redraw overlays
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**DOM Elements:** 
- `.cropper-group-toggle` - platform group checkboxes
- `.cropper-platform-toggle input` - individual platform checkboxes

**Events:** `change` events
**Handlers:** Anonymous functions updating enabled platforms and cropper overlay

### 3.2 What-If Tag Toggles (Line 8207)
**Location:** Lines 8206-8219
**Context:** What-If mode tag filtering

```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Check if smart ordering is active - defer operation if so
    if (isSmartOrdering()) {
      const applyWhatIfToggle = () => {
        isFilterOperation = true;
        renderPreviews(currentData);
        setTimeout(() => { isFilterOperation = false; }, 0);
      };
      queueFilterOperation(applyWhatIfToggle, 'whatIfToggle');
      if (DEBUG_SMART_ORDERING) {
        console.log('[What-If Toggle] Smart ordering active - queued operation');
      }
      return;
    }

    // Set guard flag to prevent smart order resets during filter operation
    isFilterOperation = true;
    renderPreviews(currentData);
    // Clear flag after render (renderPreviews will handle timing)
    setTimeout(() => { isFilterOperation = false; }, 0);
  });
});
```

**DOM Element:** `.what-if-toggle input` - checkbox inputs for tag filtering
**Event:** `change` event
**Handler:** Anonymous function that updates `disabledTags` set and re-renders previews with guard flag

### 3.3 Other Change/Input Event Listeners (Non-Filter)

**Heatmap Sort (Line 332):**
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Badge Style Select (Line 296):**
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

**OG Generator Controls (Lines 310-323):**
```javascript
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
```

**Editor Inputs (Line 6801):**
```javascript
const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
editorInputs.forEach(input => {
  input.addEventListener('input', handleEditorInput);
});
```

**Snippet Framework Selector (Line 6813):**
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

**Import Preferences Input (Line 6831):**
```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

---

## 4. Filter Operation Documentation Comments

### 4.1 Centralized Guard Functions (Lines 7885-7931)
**Location:** Lines 7885-7931
**Context:** Documentation of filter operation guard patterns

```javascript
// ── Centralized guard functions for filter operations during smart ordering ──

/**
 * Check if filter operation should be deferred due to active smart ordering
 *
 * **When to use:**
 * - In event handlers that trigger renders (e.g., filter changes, user interactions)
 * - In async callbacks that might execute during smart ordering
 *
 * **Related flags:**
 * - `isFilterOperation`: Set during filter operations to prevent smart order resets
 * - `isApplyingSmartOrder`: Prevents concurrent renders during smart ordering
 * - `isSmartOrderingActive`: Runtime flag tracking smart ordering progress
 *
 * **Usage pattern:**
 * ```javascript
 * if (isSmartOrdering()) {
 *   const operation = () => {
 *     isFilterOperation = true;
 *     renderPreviews(currentData);
 *     setTimeout(() => { isFilterOperation = false; }, 0);
 *   };
 *   queueFilterOperation(operation, 'context');
 *   return;
 * }
 * // ... proceed with operation
 * ```
 */
```

---

## 5. Summary

### Filter-Related Event Listeners Found:
1. **`#metadataFilterInput` input event → `renderMetadataTable()`** (Line 3991)
2. **`#commandInput` input event → `filterCommands()`** (Line 9085)
3. **`.cropper-group-toggle` change events → platform filtering** (Line 3481)
4. **`.cropper-platform-toggle input` change events → platform selection** (Line 3497)
5. **`.what-if-toggle input` change events → tag filtering with guard flags** (Line 8207)

### Key Patterns:
- **Guard flag pattern**: `isFilterOperation` flag prevents smart order resets during filter operations
- **Queue pattern**: `pendingFilterOperations` queue defers filter operations during active smart ordering
- **Event delegation**: Platform toggles use event listeners attached to dynamically created elements
- **Immediate vs deferred operations**: Filter operations check `isSmartOrdering()` to decide whether to execute immediately or queue

### No Custom Events Found:
- No `dispatchEvent` with custom 'filter-change' events
- No `new Event('filter-change')` or `new CustomEvent('filter-change')`
- Filter changes are handled via standard DOM events (`input`, `change`)
