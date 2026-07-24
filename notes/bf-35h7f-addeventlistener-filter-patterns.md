# addEventListener Filter Patterns in app.js

## Overview

This document catalogs all `addEventListener` patterns in `src/public/app.js` that reference filter, change, or input events. Each pattern includes line numbers, code snippets, and analysis of unique patterns not covered by `.on()` or `onChange` handlers.

## Summary Statistics

- **Total addEventListener calls**: 124
- **Filter/change/input related calls**: 24
- **Unique filter patterns**: 3 primary patterns identified

## Primary Filter Patterns

### 1. Metadata Filter Input (Line 3991)

**Location**: `renderMetadataTable()` function
**Pattern**: Text input filtering with immediate re-render

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Handler Function**: `renderMetadataTable(filter = '')`
- Filters `allMetadataRows` by tag name or value (case-insensitive)
- Re-renders entire table with filtered results
- Shows count: "X of Y tags"
- Includes "No tags match your filter" empty state

**Unique Characteristics**:
- Self-attaching pattern: function creates its own input element and listener
- Uses `input` event for real-time filtering (vs `change` for blur/commit)
- Passes filter value recursively to same function
- Not covered by `.on()` or `onChange` patterns in codebase

---

### 2. Command Palette Filter (Line 9085)

**Location**: `openCommandPalette()` function
**Pattern**: Command search with keyboard navigation

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

**Handler Function**: `filterCommands(e)`
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

**Unique Characteristics**:
- Dual event binding: `input` for filtering + `keydown` for navigation
- Resets selection index on each input (commandPaletteSelectedIndex = 0)
- Searches both command labels and categories
- Case-insensitive substring matching
- Not covered by `.on()` or `onChange` patterns

---

### 3. Editor Input Handling (Line 6801)

**Location**: `DOMContentLoaded` event handler
**Pattern**: Batched input listeners for multiple editor fields

```javascript
const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
editorInputs.forEach(input => {
  input.addEventListener('input', handleEditorInput);
});
```

**Handler Function**: `handleEditorInput(e)`
```javascript
function handleEditorInput(e) {
  const el = e.target;
  const tag = el.dataset.tag;
  if (!tag) return;

  editorState.edited[tag] = el.value;
  editorState.dirty = true;

  // Mark as modified
  if (el.value !== editorState.original[tag]) {
    el.classList.add('modified');
  } else {
    el.classList.remove('modified');
  }

  updateEditorCharCounts();

  // Debounced preview update
  clearTimeout(editorState.previewTimeout);
  editorState.previewTimeout = setTimeout(() => {
    updatePreviewsWithEdits();
  }, 300);
}
```

**Unique Characteristics**:
- Uses `data-tag` attribute to identify field
- Tracks dirty state and original values
- CSS class toggling for visual feedback
- **Debounced preview update (300ms)** to avoid excessive re-renders
- Not covered by `.on()` or `onChange` patterns

---

## Change Event Listeners (Non-Filter UI Controls)

### OG Generator Controls (Lines 310-323)

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

**Pattern**: Mix of `change` (commit on blur) and `input` (real-time) events
**Purpose**: Real-time preview updates for OG image generator

---

### Badge Style Selector (Line 296)

```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

**Purpose**: Update badge preview when style changes

---

### Heatmap Sort (Line 332)

```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Purpose**: Sort heatmap data by different criteria

---

### Framework/Import Selectors (Lines 6813, 6831)

```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

**Purpose**: Generate code snippets or import preferences on file selection

---

## Toggle Change Handlers (Group/Platform Selection)

### Cropper Group Toggles (Line 3481)

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

**Pattern**: Parent toggle synchronizes all child checkboxes
**Cascades**: Group toggle → individual platforms → overlay updates → group re-sync

---

### Individual Platform Toggles (Line 3497)

```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Pattern**: Child toggle updates parent group state (indeterminate/mixed)

---

### What-If Toggles (Line 8207)

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

**Pattern**: Toggle tags in/out of disabled Set, persist to URL hash

---

## Form Submit Handlers

### URL/Paste Forms (Lines 230-231, 334)

```javascript
urlForm.addEventListener('submit', (e) => { e.preventDefault(); inspectUrl(urlInput.value.trim()); });
pasteForm.addEventListener('submit', (e) => { e.preventDefault(); inspectHtml(htmlInput.value.trim(), baseUrlInput.value.trim()); });
sitemapForm?.addEventListener('submit', (e) => { e.preventDefault(); handleSitemapSubmit(); });
```

**Pattern**: Prevent default submission, trigger inspection functions

---

### Paste Detection (Line 234)

```javascript
urlInput.addEventListener('paste', async (e) => {
  const paste = (e.clipboardData || window.clipboardData).getData('text');
  // ... auto-inspect on paste
```

**Unique**: Triggers inspection on paste event (not submit)

---

## Unique Patterns Not Covered by `.on()` or `onChange`

### 1. **Self-Attaching Filter Pattern**
The metadata filter creates its own input and attaches its own listener within the render function. This is NOT covered by `.on()` or `onChange` patterns elsewhere.

### 2. **Debounced Editor Input**
The editor uses a 300ms debounce timer to prevent excessive re-renders. This pattern is unique to the `handleEditorInput` function and not replicated in `.on()` handlers.

### 3. **Command Palette Dual-Event Binding**
The command input binds both `input` and `keydown` events simultaneously. This dual-binding pattern for keyboard navigation + filtering is not found in other parts of the codebase.

### 4. **Cascading Toggle Synchronization**
The cropper platform toggles use a two-way synchronization pattern:
- Parent group toggle → all children
- Child toggle → parent group state (indeterminate)
This bidirectional sync pattern is unique to the cropper UI.

### 5. **DisabledTags Set with Hash Persistence**
The what-if toggles maintain a `disabledTags` Set that persists to URL hash on every change. This pattern combines in-memory state with URL fragment persistence.

### 6. **Recursive Filter Function**
`renderMetadataTable(filter)` calls itself with the new filter value. This recursive pattern where a function attaches a listener to itself is not seen elsewhere.

---

## Event Type Distribution

| Event Type | Count | Usage Pattern |
|------------|-------|---------------|
| `input` | 8 | Real-time filtering, live previews |
| `change` | 12 | Commit on blur, select changes, toggles |
| `submit` | 3 | Form submissions |
| `paste` | 1 | Paste detection |
| `keydown` | 1 | Keyboard navigation |

---

## Recommendations

1. **Consider consolidating filter patterns**: The metadata filter and command palette filter use similar logic but are implemented separately.

2. **Extract debounce utility**: The 300ms debounce in `handleEditorInput` could be extracted to a reusable utility function.

3. **Document toggle sync patterns**: The cropper toggle synchronization is complex and could benefit from inline documentation.

4. **Consider event delegation**: Batch selectors like `.cropper-platform-toggle input` could use event delegation on a parent container instead of individual listeners.

---

## Appendix: Complete Line Reference

All addEventListener calls related to filters/inputs:
- Line 230: urlForm submit
- Line 231: pasteForm submit  
- Line 234: urlInput paste
- Line 296: badgeStyleSelect change
- Lines 310-323: OG generator controls (13 listeners)
- Line 332: heatmapSort change
- Line 3481: cropper group toggle change
- Line 3497: cropper platform toggle change
- Line 3991: metadataFilterInput input
- Line 6801: editor inputs input (batch)
- Line 6813: snippetFramework change
- Line 6831: importPrefsInput change
- Line 8207: what-if toggles change
- Line 8220: whatIfApply click
- Line 9085: commandInput input
- Line 9086: commandInput keydown

---

**Generated**: 2026-07-24  
**Bead**: bf-35h7f  
**File**: src/public/app.js (367KB, ~12400 lines)
