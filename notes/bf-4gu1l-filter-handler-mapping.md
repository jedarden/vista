# Filter Handler to DOM Element Mapping

## Metadata Filters

### Raw Tags Table Filter
- **Handler Function**: `renderMetadataTable(filter)` (called via input event listener)
- **DOM Element**: `#metadataFilterInput`
- **Event Type**: `input`
- **Location**: Added dynamically in `renderMetadataTableSetup()` at line 3989-3994
- **Purpose**: Filters the raw metadata tags table based on tag name/value

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

---

## Command Palette Filter

### Command Palette Search
- **Handler Function**: `filterCommands(e)`
- **DOM Element**: `#commandInput`
- **Event Type**: `input`
- **Location**: Line 9085
- **Purpose**: Filters the command palette results based on command labels

```javascript
input.addEventListener('input', filterCommands);
```

---

## Sitemap Heatmap Sorting

### Heatmap Sort Selector
- **Handler Function**: `handleHeatmapSort`
- **DOM Element**: `#heatmapSort`
- **Event Type**: `change`
- **Location**: Line 332
- **Purpose**: Sorts the platform coverage heatmap by different criteria

```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

---

## Cropper Platform/Group Filters

### Platform Toggles
- **Handler Function**: Anonymous callback (line 3497-3501)
- **DOM Element**: `.cropper-platform-toggle input` (multiple elements)
- **Event Type**: `change`
- **Location**: Lines 3496-3502
- **Purpose**: Enables/disables individual platforms in the crop visualizer

```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

### Group Toggles
- **Handler Function**: Anonymous callback (line 3481-3491)
- **DOM Element**: `.cropper-group-toggle` (multiple elements, one per group)
- **Event Type**: `change`
- **Location**: Lines 3480-3492
- **Purpose**: Toggles all platforms within a group on/off

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

## What If Mode Toggles

### What If Tag Toggles
- **Handler Function**: Anonymous callback (line 8207-8216)
- **DOM Element**: `#whatIfPanel .what-if-toggle input` (multiple elements)
- **Event Type**: `change`
- **Location**: Lines 8206-8216
- **Purpose**: Enables/disables individual meta tags in What If simulation mode

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

## Editor Input Handlers

### Meta Tag Editor Fields
- **Handler Function**: `handleEditorInput`
- **DOM Element**: `.editor-input, .editor-textarea, .editor-select` (multiple elements)
- **Event Type**: `input`
- **Location**: Lines 6799-6801
- **Purpose**: Updates meta tag editor previews and impact indicators

```javascript
const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
editorInputs.forEach(input => {
  input.addEventListener('input', handleEditorInput);
});
```

---

## OG Generator Controls

### Background Type Selector
- **Handler Function**: `handleBgTypeChange`
- **DOM Element**: `#oggenBgType`
- **Event Type**: `change`
- **Location**: Line 310
- **Purpose**: Changes OG generator background type (solid/gradient/image)

### Background Color Input
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenBgColor`
- **Event Type**: `input`
- **Location**: Line 311

### Gradient Controls
- **Handler Function**: `updateOggenCanvas`
- **DOM Elements**: 
  - `#oggenGradientStart` (input event, line 312)
  - `#oggenGradientEnd` (input event, line 313)
  - `#oggenGradientDir` (change event, line 314)

### Background Image Upload
- **Handler Function**: `handleBgImageUpload`
- **DOM Element**: `#oggenBgImageInput`
- **Event Type**: `change`
- **Location**: Line 315

### Background Image Size
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenBgImageSize`
- **Event Type**: `change`
- **Location**: Line 316

### Title and Subtitle
- **Handler Function**: `updateOggenCanvas`
- **DOM Elements**:
  - `#oggenTitle` (input event, line 317)
  - `#oggenSubtitle` (input event, line 318)

### Font Selector
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenFont`
- **Event Type**: `change`
- **Location**: Line 319

### Text Color
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenTextColor`
- **Event Type**: `input`
- **Location**: Line 320

### Logo Position
- **Handler Function**: `handleLogoPosChange`
- **DOM Element**: `#oggenLogoPos`
- **Event Type**: `change`
- **Location**: Line 321

### Logo Upload
- **Handler Function**: `handleLogoUpload`
- **DOM Element**: `#oggenLogoInput`
- **Event Type**: `change`
- **Location**: Line 322

### Logo Size
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenLogoSize`
- **Event Type**: `input`
- **Location**: Line 323

---

## Customization Controls

### Badge Style Selector
- **Handler Function**: `updateBadgePreview`
- **DOM Element**: `#badgeStyleSelect`
- **Event Type**: `change`
- **Location**: Line 296

### Code Snippet Framework Selector
- **Handler Function**: `generateCodeSnippet`
- **DOM Element**: `#snippetFramework`
- **Event Type**: `change`
- **Location**: Line 6813

### Import Preferences Input
- **Handler Function**: `importPreferences`
- **DOM Element**: `#importPrefsInput`
- **Event Type**: `change`
- **Location**: Line 6831

---

## Summary Table

| Handler | Element | Event | Purpose |
|---------|---------|-------|---------|
| `renderMetadataTable` | `#metadataFilterInput` | input | Filter raw tags table |
| `filterCommands` | `#commandInput` | input | Filter command palette |
| `handleHeatmapSort` | `#heatmapSort` | change | Sort heatmap |
| anonymous | `.cropper-platform-toggle input` | change | Toggle platforms |
| anonymous | `.cropper-group-toggle` | change | Toggle groups |
| anonymous | `.what-if-toggle input` | change | What If toggles |
| `handleEditorInput` | `.editor-input, .editor-textarea, .editor-select` | input | Editor fields |
| `handleBgTypeChange` | `#oggenBgType` | change | BG type |
| `updateOggenCanvas` | Multiple OG controls | input/change | OG generator |
| `handleBgImageUpload` | `#oggenBgImageInput` | change | BG image |
| `handleLogoPosChange` | `#oggenLogoPos` | change | Logo position |
| `handleLogoUpload` | `#oggenLogoInput` | change | Logo upload |
| `updateBadgePreview` | `#badgeStyleSelect` | change | Badge style |
| `generateCodeSnippet` | `#snippetFramework` | change | Code framework |
| `importPreferences` | `#importPrefsInput` | change | Import prefs |