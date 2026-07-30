# Filter Change Event Bindings Analysis - bf-5ye27

## Task Description
Systematically search app.js for all filter change event bindings (jQuery .change(), .on('change'), addEventListener, etc.) and document the binding patterns.

## Search Methodology
Searched `/home/coding/vista/src/public/app.js` for:
- `.change()` calls on filter-related elements
- `.on('change')` calls on filter-related elements
- `addEventListener('change')` on filter-related elements
- Filter-related data attributes and element selectors

## Findings Summary

### 1. jQuery `.change()` Pattern
**Result: NOT FOUND**
- No instances of `.change()` method calls found in app.js

### 2. jQuery `.on('change')` Pattern  
**Result: NOT FOUND**
- No instances of `.on('change')` method calls found in app.js

### 3. `addEventListener('change')` Pattern
**Result: FOUND - Multiple instances**

#### Non-Filter Related Change Events:
1. **Line 296**: `badgeStyleSelect?.addEventListener('change', updateBadgePreview)`
2. **Line 310**: `oggenBgType?.addEventListener('change', handleBgTypeChange)`
3. **Line 314**: `oggenGradientDir?.addEventListener('change', updateOggenCanvas)`
4. **Line 315**: `oggenBgImageInput?.addEventListener('change', handleBgImageUpload)`
5. **Line 316**: `oggenBgImageSize?.addEventListener('change', updateOggenCanvas)`
6. **Line 319**: `oggenFont?.addEventListener('change', updateOggenCanvas)`
7. **Line 321**: `oggenLogoPos?.addEventListener('change', handleLogoPosChange)`
8. **Line 322**: `oggenLogoInput?.addEventListener('change', handleLogoUpload)`
9. **Line 332**: `heatmapSort?.addEventListener('change', handleHeatmapSort)`
10. **Line 6813**: `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet)`
11. **Line 6831**: `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)`

#### Filter/Platform Related Change Events:

**A. Platform Filter Checkboxes (Lines 3481, 3497)**
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

**B. What-If Mode Toggle Checkboxes (Line 8207)**
```javascript
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

### 4. Input Event Pattern (Alternative to Change)
**Line 3991**: Filter input uses `'input'` event instead of `'change'`
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

## Binding Patterns Documented

### Pattern 1: Batch Checkbox Selection with Data Attributes
**Usage**: Platform toggles and group filters
- **Selector**: `document.querySelectorAll('.cropper-group-toggle')` or `document.querySelectorAll('.cropper-platform-toggle input')`
- **Event**: `'change'`
- **Data Attributes**: `data-group`, `data-platform`
- **Handler Functions**: `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

### Pattern 2: Tag-Based Filtering with Checkboxes
**Usage**: What-If mode panel
- **Selector**: `panel.querySelectorAll('.what-if-toggle input')`
- **Event**: `'change'`
- **Data Attributes**: `data-tag`
- **Handler Logic**: Directly manipulates `disabledTags` Set and calls `updateHash()`

### Pattern 3: Input Event for Real-Time Filtering
**Usage**: Metadata tag filtering
- **Selector**: `document.getElementById('metadataFilterInput')`
- **Event**: `'input'` (not `'change'`)
- **Handler Function**: `renderMetadataTable()`

## Raw List of Bound Filter Elements

### Platform/Group Filters:
1. `.cropper-group-toggle` - Group header checkboxes (multiple)
2. `.cropper-platform-toggle input` - Individual platform checkboxes (multiple)
3. Input elements with `data-platform` attribute
4. Input elements with `data-group` attribute

### Tag Filters:
1. `.what-if-toggle input` - What-If mode tag checkboxes (multiple)
2. Input elements with `data-tag` attribute

### Text Filter:
1. `#metadataFilterInput` - Metadata filter text input (uses 'input' event)

### Select Elements (Non-Filter):
1. `#snippetFramework` - Code snippet framework selector
2. Various OG generator controls (bgType, gradientDir, font, etc.)
3. Heatmap sort selector

## Filter Operation References

**Line 6279**: `let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes`

**Line 8790**: `// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active`

## Key Observations

1. **No jQuery patterns**: The app uses native DOM methods exclusively
2. **Change events preferred for checkboxes**: Platform and tag filters use `'change'` events
3. **Input events for text filtering**: Text filter uses `'input'` event for real-time filtering
4. **Data attribute pattern**: Consistent use of `data-*` attributes for element identification
5. **Batch operations**: Multiple elements bound using `querySelectorAll().forEach()`
6. **Guard flags**: Filter operations have special handling to prevent UI conflicts

## Files Analyzed
- `/home/coding/vista/src/public/app.js` (367.1KB)

## Completion Date
2026-07-24
