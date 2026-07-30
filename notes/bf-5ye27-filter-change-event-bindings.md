# Filter Change Event Bindings in app.js

## Search Results

This document systematically catalogs all filter change event bindings found in `src/public/app.js`.

## 1. Platform Toggle Checkboxes (Cropper)

**Location:** Lines 3481-3497
**Elements:** `.cropper-group-toggle` and `.cropper-platform-toggle input`

```javascript
// Group-level checkbox toggle
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

// Individual platform checkbox toggle
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

## 2. Metadata Filter Input

**Location:** Line 3989 (setup), Line 3999 (listener attachment)
**Element:** `#metadataFilterInput`

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern:** Uses `'input'` event (not `'change'`) for real-time filtering
**Handler:** `renderMetadataTable(filter)` - Re-renders the metadata table with filtered results

## 3. Heatmap Sort Select

**Location:** Line 332
**Element:** `#heatmapSort`

```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Handler:** `handleHeatmapSort()` - Handles heatmap sorting changes

## 4. What-If Analysis Toggles

**Location:** Lines 8207-8217
**Element:** `.what-if-toggle input` (checkboxes)

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

**Handler:** Updates `disabledTags` Set and calls `updateHash()` to reflect changes

## 5. Other Change Event Bindings (Non-Filter)

The following change event bindings were found but are not filter-related:

| Element | Handler | Purpose |
|---------|---------|---------|
| `#badgeStyleSelect` | `updateBadgePreview` | Badge style selection |
| `#oggenBgType` | `handleBgTypeChange` | OG generator background type |
| `#oggenGradientDir` | `updateOggenCanvas` | OG generator gradient direction |
| `#oggenBgImageInput` | `handleBgImageUpload` | OG generator background image |
| `#oggenBgImageSize` | `updateOggenCanvas` | OG generator background size |
| `#oggenFont` | `updateOggenCanvas` | OG generator font selection |
| `#oggenLogoPos` | `handleLogoPosChange` | OG generator logo position |
| `#oggenLogoInput` | `handleLogoUpload` | OG generator logo upload |
| `#snippetFramework` | `generateCodeSnippet` | Code snippet framework selection |
| `#importPrefsInput` | `importPreferences` | Preferences file import |

## Binding Patterns Summary

1. **addEventListener('change', ...)**
   - Primary pattern used throughout
   - Used for checkboxes (platform toggles, what-if toggles)
   - Used for select elements (heatmap sort, badge style, etc.)

2. **addEventListener('input', ...)**
   - Used for text input filtering (metadata filter)
   - Provides real-time filtering as user types

3. **jQuery .on('change', ...)**
   - NOT FOUND - No jQuery change event bindings detected

4. **jQuery .change()**
   - NOT FOUND - No jQuery .change() method calls detected

## Raw List of Bound Filter Elements

1. `.cropper-group-toggle` - Platform group checkboxes (line 3481)
2. `.cropper-platform-toggle input` - Individual platform checkboxes (line 3497)
3. `#metadataFilterInput` - Metadata filter text input (line 3999, uses 'input' event)
4. `#heatmapSort` - Heatmap sort dropdown (line 332)
5. `.what-if-toggle input` - What-if analysis tag toggles (line 8207)

## Handler Functions Called

- `updateEnabledPlatforms()` - Updates enabled platform IDs set
- `updateCropperOverlay()` - Redraws crop overlays
- `syncGroupToggles(groups)` - Syncs parent/child checkbox states
- `renderMetadataTable(filter)` - Re-renders metadata table with filter applied
- `handleHeatmapSort()` - Handles heatmap sorting
- `updateHash()` - Updates URL hash to reflect filter state

## Notes

- Platform toggle checkboxes use a hierarchical pattern where group checkboxes control individual platform checkboxes
- The metadata filter uses the 'input' event instead of 'change' for real-time filtering
- No jQuery event binding patterns were found for change events
- All change event bindings use native DOM addEventListener method
