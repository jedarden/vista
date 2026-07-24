# addEventListener('change') Filter Bindings in app.js

## Summary

**Finding:** Four (4) `addEventListener('change')` event bindings were found in `/home/coding/vista/src/public/app.js` that are filter-related. All use native DOM `addEventListener()` method.

## Search Results

### addEventListener('change') Pattern: FOUND

The following `addEventListener('change')` bindings were identified as **filter-related**:

---

## Filter-Related Change Event Bindings (Native DOM)

### 1. Heatmap Sort Filter (Line 332)

**Target Element:** `#heatmapSort`  
**Selector:** `heatmapSort` (line ~218)  
**Event:** `change` (native)  
**Handler:** `handleHeatmapSort`  
**useCapture:** Not specified (default: false)  
**Context:** Sort dropdown for sitemap heatmap visualization

```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

---

### 2. Platform Group Toggle Filters (Line 3481)

**Target Element:** `.cropper-group-toggle`  
**Selector:** `document.querySelectorAll('.cropper-group-toggle')`  
**Event:** `change` (native)  
**Handler:** Anonymous function  
**useCapture:** Not specified (default: false)  
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

**Handlers called:**
- `updateEnabledPlatforms()` - Updates the set of enabled platform IDs
- `updateCropperOverlay()` - Redraws the crop overlay for enabled platforms
- `syncGroupToggles(groups)` - Syncs group checkbox states with their children

---

### 3. Individual Platform Toggle Filters (Line 3497)

**Target Element:** `.cropper-platform-toggle input`  
**Selector:** `document.querySelectorAll('.cropper-platform-toggle input')`  
**Event:** `change` (native)  
**Handler:** Anonymous function  
**useCapture:** Not specified (default: false)  
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

**Handlers called:**
- `updateEnabledPlatforms()` - Updates the set of enabled platform IDs
- `updateCropperOverlay()` - Redraws the crop overlay for enabled platforms
- `syncGroupToggles(groups)` - Syncs group checkbox states with their children

---

### 4. What-If Mode Tag Filters (Line 8207)

**Target Element:** `.what-if-toggle input`  
**Selector:** `panel.querySelectorAll('.what-if-toggle input')`  
**Event:** `change` (native)  
**Handler:** Anonymous function  
**useCapture:** Not specified (default: false)  
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

**Handler called:**
- `updateHash()` - Updates URL hash to reflect disabled tag state

---

## Non-Filter Change Event Bindings (Native DOM)

The following `addEventListener('change', ...)` bindings were found but are **not filter-related**:

| Line | Element | Handler | Purpose |
|------|---------|---------|---------|
| 296 | `#badgeStyleSelect` | `updateBadgePreview` | Badge style selection |
| 310 | `#oggenBgType` | `handleBgTypeChange` | OG generator background type |
| 314 | `#oggenGradientDir` | `updateOggenCanvas` | OG generator gradient direction |
| 315 | `#oggenBgImageInput` | `handleBgImageUpload` | OG generator background image |
| 316 | `#oggenBgImageSize` | `updateOggenCanvas` | OG generator background size |
| 319 | `#oggenFont` | `updateOggenCanvas` | OG generator font selection |
| 321 | `#oggenLogoPos` | `handleLogoPosChange` | OG generator logo position |
| 322 | `#oggenLogoInput` | `handleLogoUpload` | OG generator logo upload |
| 6813 | `#snippetFramework` | `generateCodeSnippet` | Code snippet framework selection |
| 6831 | `#importPrefsInput` | `importPreferences` | Preferences file import |

---

## Raw List of Filter-Related Elements with Change Events

### Native `addEventListener('change', ...)` Bindings:
1. `#heatmapSort` - Heatmap sort dropdown (line 332)
2. `.cropper-group-toggle` - Platform group checkboxes (line 3481)
3. `.cropper-platform-toggle input` - Individual platform checkboxes (line 3497)
4. `.what-if-toggle input` - What-if mode tag checkboxes (line 8207)

---

## Binding Patterns Summary

1. **Native `addEventListener('change', ...)`** - PRIMARY PATTERN
   - Used for all change event bindings including filters
   - Applied via element selection with optional chaining (`?.addEventListener`)
   - Applied via `querySelectorAll` forEach loops for multiple elements
   - No `useCapture` parameter specified in any binding (default: false)

---

## Additional Notes

- All filter change event bindings use native DOM API
- Platform toggle filters (`.cropper-group-toggle` and `.cropper-platform-toggle`) use a hierarchical pattern where group checkboxes control individual platform checkboxes
- The `.what-if-toggle` controls filter which diagnostic tags are considered in "what-if" mode simulations
- The `heatmapSort` dropdown controls sorting order for heatmap visualization
- All change handlers in filter context either update UI state (`updateEnabledPlatforms`, `updateCropperOverlay`, `syncGroupToggles`, `updateHash`) or handle sorting (`handleHeatmapSort`)
- None of the bindings specify the `useCapture` parameter, meaning all use bubbling phase (default behavior)
