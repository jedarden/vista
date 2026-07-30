# addEventListener Filter Patterns in app.js

Search completed: 2024-07-24

## Summary

Found **25 addEventListener calls** in `src/public/app.js` that reference `filter`, `change`, or `input` events. Below are the documented patterns with line numbers and code snippets.

## Direct Filter Patterns

### 1. Metadata Filter Input (Line 3991)
**Location:** `renderMetadataPanel()` function  
**Event:** `input`  
**Pattern:** Direct event binding with inline handler

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Purpose:** Filters metadata table based on user input  
**Handler:** Inline arrow function calling `renderMetadataTable()` with filter value

---

### 2. Command Palette Filter (Line 9085)
**Location:** `initCommandPalette()` function  
**Event:** `input`  
**Pattern:** Named function reference

```javascript
// Add event listeners
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

**Purpose:** Filters command palette results based on search input  
**Handler:** Named function `filterCommands` (defined elsewhere)

---

## Change Event Patterns

### 3. Badge Style Selector (Line 296)
**Event:** `change`
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

### 4. Heatmap Sort (Line 332)
**Event:** `change`
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### 5. Code Snippet Framework (Line 6813)
**Event:** `change`
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

### 6. Import Preferences (Line 6831)
**Event:** `change`
```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

---

## OG Generator Event Listeners (Lines 310-323)
**Location:** OG (Open Graph) image generator setup  
**Pattern:** Optional chaining with named handlers

```javascript
// OG Generator event listeners
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

**Pattern Analysis:**
- Mix of `change` and `input` events
- `change` for discrete selections (type, direction, font)
- `input` for continuous updates (colors, text, sizes)
- All use optional chaining (`?.`) to handle missing elements
- Named handler functions for maintainability

---

## Checkbox Group Patterns (Lines 3481-3497)
**Location:** Platform cropper controls  
**Pattern:** querySelectorAll with forEach + inline handlers

### Group Header Toggles (Line 3481)
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

**Pattern Analysis:**
- Group checkboxes control all child checkboxes
- Individual checkboxes trigger re-sync of group state
- Three-step update: platforms, overlay, group headers

---

## Editor Input Patterns (Line 6801)
**Location:** DOMContentLoaded handler  
**Pattern:** querySelectorAll + forEach + named handler

```javascript
// Editor event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Editor input listeners
  const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
  editorInputs.forEach(input => {
    input.addEventListener('input', handleEditorInput);
  });
  // ... other listeners
});
```

**Purpose:** Bind `input` event to all editor form fields  
**Handler:** Named function `handleEditorInput`

---

## What-If Panel Toggle (Line 8207)
**Location:** `openWhatIfPanel()` function  
**Pattern:** Inline handler with state tracking

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

**Purpose:** Toggle metadata tags in what-if analysis  
**Pattern:** Checkbox inverse logic (unchecked = disabled)

---

## Key Patterns Summary

### Unique addEventListener Patterns Not Covered by .on() or onChange:

1. **Inline arrow function with direct value pass**
   - Line 3991: `filterInput.addEventListener('input', (e) => renderMetadataTable(e.target.value))`
   - Immediately passes `e.target.value` to handler function

2. **querySelectorAll + forEach batch binding**
   - Lines 3481, 3497, 6801, 8207
   - Binds listeners to multiple elements at once
   - Useful for dynamic lists of checkboxes/inputs

3. **Optional chaining with conditional binding**
   - Lines 296, 310-332
   - Uses `?.addEventListener()` pattern
   - Gracefully handles missing DOM elements

4. **Event handler chaining**
   - Line 9085-9086: Same element, multiple events
   - `input` for filtering, `keydown` for keyboard navigation

5. **Inverse checkbox logic**
   - Line 8207: Unchecked = disabled (non-standard pattern)
   - Most implementations use checked = enabled

6. **Cascading checkbox state**
   - Lines 3481-3497: Group checkbox controls children
   - Individual change triggers group state re-sync

### Event Type Distribution:
- **`input` events**: 10 occurrences (continuous value changes)
- **`change` events**: 14 occurrences (discrete state changes)
- **`keydown` events**: 1 occurrence (keyboard navigation)

### Handler Binding Patterns:
1. Named function reference: 15 occurrences
2. Inline arrow function: 8 occurrences
3. Multi-element batch binding: 4 occurrences

---

## Recommendations

1. **Consistency:** Consider using named functions for all handlers (better for debugging and testing)
2. **Delegation:** For dynamically added elements, consider event delegation patterns
3. **Cleanup:** No removeEventListener patterns found - potential memory leaks in SPA context
4. **Documentation:** Add JSDoc comments for complex inline handlers (lines 3481, 3497)
