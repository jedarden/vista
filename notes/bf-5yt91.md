# Filter-Related `.change()` Event Bindings in app.js

## Summary

This document lists all filter-related change event bindings found in `/home/coding/vista/src/public/app.js`. Note that some filter inputs use `input` events instead of `change` events for real-time filtering.

## Filter Elements with `change` Event Bindings

### 1. Heatmap Sort Filter (Line 332)

**Target Element:** `heatmapSort`  
**Selector:** `$('#heatmapSort')` (line 218)  
**Event:** `change`  
**Handler:** `handleHeatmapSort`  
**Context:** Sort dropdown for sitemap heatmap visualization

```javascript
const heatmapSort = $('#heatmapSort');
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

---

### 2. Platform Group Toggle Filters (Line 3481)

**Target Element:** `.cropper-group-toggle`  
**Selector:** `document.querySelectorAll('.cropper-group-toggle')`  
**Event:** `change`  
**Handler:** Anonymous function  
**Context:** Checkboxes to toggle all platforms within a group

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

---

### 3. Individual Platform Toggle Filters (Line 3497)

**Target Element:** `.cropper-platform-toggle input`  
**Selector:** `document.querySelectorAll('.cropper-platform-toggle input')`  
**Event:** `change`  
**Handler:** Anonymous function  
**Context:** Individual checkboxes for enabling/disabling specific platforms

```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

---

### 4. What-If Mode Tag Filters (Line 8207)

**Target Element:** `.what-if-toggle input`  
**Selector:** `panel.querySelectorAll('.what-if-toggle input')`  
**Event:** `change`  
**Handler:** Anonymous function  
**Context:** Checkboxes to enable/disable specific diagnostic tags in what-if mode

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

---

## Filter Elements with `input` Event Bindings (Not `change`)

The following filter elements use `input` events instead of `change` events. This provides real-time filtering as the user types:

### 5. Metadata Filter Input (Line 3991)

**Target Element:** `metadataFilterInput`  
**Selector:** `document.getElementById('metadataFilterInput')`  
**Event:** `input`  
**Handler:** Anonymous function that calls `renderMetadataTable()`  
**Context:** Text input to filter metadata tags by name/value

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

---

### 6. Command Palette Filter (Line 9085)

**Target Element:** `commandInput`  
**Selector:** `document.getElementById('commandInput')`  
**Event:** `input`  
**Handler:** `filterCommands`  
**Context:** Text input to filter/search available commands in the command palette

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

---

## Raw List of Filter-Related Elements

### Elements with `.change()` Event Bindings:

1. `#heatmapSort` - Heatmap sort dropdown (line 332)
2. `.cropper-group-toggle` - Platform group checkboxes (line 3481)
3. `.cropper-platform-toggle input` - Individual platform checkboxes (line 3497)
4. `.what-if-toggle input` - What-if mode tag checkboxes (line 8207)

### Elements with `.input()` Event Bindings (Real-time Filtering):

5. `#metadataFilterInput` - Metadata tag filter text input (line 3991)
6. `#commandInput` - Command palette search input (line 9085)

---

## Additional Notes

- The `.cropper-group-toggle` and `.cropper-platform-toggle` controls are platform selection filters that control which platforms are displayed/processed
- The `.what-if-toggle` controls filter which diagnostic tags are considered in "what-if" mode simulations
- The `heatmapSort` dropdown controls sorting order for heatmap visualization
- Filter elements using `input` events provide immediate feedback as the user types
- Filter elements using `change` events wait for the user to complete their interaction (e.g., select a dropdown option or click a checkbox)
