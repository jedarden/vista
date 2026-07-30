# Filter Handler DOM Element Attachments

This document traces event listener registrations in `app.js` to identify which DOM elements trigger each filter change handler.

## Filter Handlers

### 1. Metadata Filter Handler
- **Handler Function:** `renderMetadataTable(filterValue)`
- **DOM Element:** `<input type="text" id="metadataFilterInput">`
- **Event:** `input`
- **Selector:** `document.getElementById('metadataFilterInput')`
- **Location:** Line 3989-3993 in app.js
- **Purpose:** Filters metadata table rows by tag name in the raw tags panel

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

### 2. Platform Group Toggles (Cropper)
- **Handler Function:** Anonymous function checking/unchecking group platforms
- **DOM Elements:** All elements with class `.cropper-group-toggle`
- **Event:** `change`
- **Selector:** `document.querySelectorAll('.cropper-group-toggle')`
- **Location:** Line 3480-3491 in app.js
- **Purpose:** Toggles all platforms within a group when group header is clicked

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

### 3. Individual Platform Toggles (Cropper)
- **Handler Function:** Anonymous function updating platform state
- **DOM Elements:** All inputs within `.cropper-platform-toggle`
- **Event:** `change`
- **Selector:** `document.querySelectorAll('.cropper-platform-toggle input')`
- **Location:** Line 3496-3501 in app.js
- **Purpose:** Toggles individual platform inclusion in cropper

```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

### 4. Select All Platforms Button
- **Handler Function:** Anonymous function checking all platform checkboxes
- **DOM Element:** `<button id="selectAllPlatforms">`
- **Event:** `click`
- **Selector:** `document.getElementById('selectAllPlatforms')`
- **Location:** Line 3504-3509 in app.js
- **Purpose:** Checks all platform checkboxes in cropper

```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

### 5. Clear All Platforms Button
- **Handler Function:** Anonymous function unchecking all platform checkboxes
- **DOM Element:** `<button id="clearAllPlatforms">`
- **Event:** `click`
- **Selector:** `document.getElementById('clearAllPlatforms')`
- **Location:** Line 3511-3516 in app.js
- **Purpose:** Unchecks all platform checkboxes in cropper

```javascript
document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

### 6. Command Palette Filter
- **Handler Function:** `filterCommands()`
- **DOM Element:** `<input id="commandInput">`
- **Event:** `input`
- **Selector:** `document.getElementById('commandInput')`
- **Location:** Line 9084-9085 in app.js
- **Purpose:** Filters available commands in command palette

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

### 7. What-If Mode Toggle Buttons
- **Handler Function:** `toggleFavorite(pid)` / `toggleHidden(pid)`
- **DOM Elements:** Buttons with class `.platform-item-remove` (in favorites/hidden panels)
- **Event:** `click`
- **Selector:** `list.querySelectorAll('.platform-item-remove')`
- **Location:** Line 8007-8009 (favorites), 8029-8031 (hidden) in app.js
- **Purpose:** Removes platforms from favorites/hidden lists

```javascript
// Favorites panel
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});

// Hidden platforms panel  
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

### 8. What-If Tag Toggles
- **Handler Function:** Anonymous function managing disabled tags set
- **DOM Elements:** Inputs with class `.what-if-toggle input`
- **Event:** `change`
- **Selector:** `panel.querySelectorAll('.what-if-toggle input')`
- **Location:** Line 8206-8216 in app.js
- **Purpose:** Enables/disables specific diagnostic tags in "What If" mode

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

### 9. What-If Reset Button
- **Handler Function:** `resetWhatIfToggles()`
- **DOM Element:** `<button id="whatIfReset">`
- **Event:** `click`
- **Selector:** `document.getElementById('whatIfReset')`
- **Location:** Line 8219 in app.js
- **Purpose:** Resets all What-If toggles to checked state

```javascript
document.getElementById('whatIfReset')?.addEventListener('click', resetWhatIfToggles);
```

### 10. What-If Apply Button
- **Handler Function:** `applyWhatIfChanges()`
- **DOM Element:** `<button id="whatIfApply">`
- **Event:** `click`
- **Selector:** `document.getElementById('whatIfApply')`
- **Location:** Line 8220 in app.js
- **Purpose:** Applies What-If changes to display

```javascript
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
```

### 11. What-If Mode Toggle Button
- **Handler Function:** `toggleWhatIfMode()`
- **DOM Element:** `<button id="whatIfToggleBtn">`
- **Event:** `click`
- **Selector:** `document.getElementById('whatIfToggleBtn')`
- **Location:** Line 8334 in app.js
- **Purpose:** Toggles What-If mode on/off

```javascript
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

### 12. Heatmap Sort Dropdown
- **Handler Function:** `handleHeatmapSort()`
- **DOM Element:** `<select id="heatmapSort">`
- **Event:** `change`
- **Selector:** Variable `heatmapSort` (retrieved earlier)
- **Location:** Line 332 in app.js
- **Purpose:** Sorts heatmap by different criteria

```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### 13. Card Context Toggle
- **Handler Function:** `toggleCardContext(pid, data)`
- **DOM Elements:** Elements with class `.card-context-toggle`
- **Event:** `click`
- **Selector:** `existingCard.querySelector('.card-context-toggle')`
- **Location:** Line 1995 (existing cards), 2092 (new cards) in app.js
- **Purpose:** Toggles card display between card-only and with-context views

```javascript
contextToggle.addEventListener('click', () => toggleCardContext(pid, data));
```

### 14. Card Theme Toggle
- **Handler Function:** `toggleCardTheme(pid, data)`
- **DOM Elements:** Elements with class `.card-theme-toggle`
- **Event:** `click`
- **Selector:** `existingCard.querySelector('.card-theme-toggle')`
- **Location:** Line 2001 (existing cards), 2096 (new cards) in app.js
- **Purpose:** Toggles card theme (light/dark mode)

```javascript
themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
```

### 15. Global Theme Toggle
- **Handler Function:** `toggleGlobalTheme()`
- **DOM Element:** `<button id="globalThemeToggle">`
- **Event:** `click`
- **Selector:** `document.getElementById('globalThemeToggle')`
- **Location:** Line 510 in app.js
- **Purpose:** Toggles global theme between light and dark modes

```javascript
document.getElementById('globalThemeToggle')?.addEventListener('click', toggleGlobalTheme);
```

## Other Filter-Related UI Handlers

### Badge Style Select
- **DOM Element:** `<select id="badgeStyleSelect">`
- **Event:** `change`
- **Location:** Line 296
- **Purpose:** Updates badge preview when style changes

```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

### Snippet Framework Select
- **DOM Element:** `<select id="snippetFramework">`
- **Event:** `change`
- **Location:** Line 6813
- **Purpose:** Regenerates code snippet when framework changes

```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

### Import Preferences Input
- **DOM Element:** `<input type="file" id="importPrefsInput">`
- **Event:** `change`
- **Location:** Line 6831
- **Purpose:** Imports user preferences from JSON file

```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

## Summary Table

| Handler | DOM Element Selector | Event | Line | Purpose |
|---------|---------------------|-------|------|---------|
| `renderMetadataTable` | `#metadataFilterInput` | input | 3991 | Filter metadata tags |
| Group toggle | `.cropper-group-toggle` | change | 3481 | Toggle group platforms |
| Platform toggle | `.cropper-platform-toggle input` | change | 3497 | Toggle individual platform |
| Select all | `#selectAllPlatforms` | click | 3504 | Check all platforms |
| Clear all | `#clearAllPlatforms` | click | 3511 | Uncheck all platforms |
| `filterCommands` | `#commandInput` | input | 9085 | Filter command palette |
| `toggleFavorite` | `.platform-item-remove` (favorites) | click | 8008 | Remove from favorites |
| `toggleHidden` | `.platform-item-remove` (hidden) | click | 8030 | Remove from hidden |
| Tag disable | `.what-if-toggle input` | change | 8207 | Toggle tag in What-If |
| `resetWhatIfToggles` | `#whatIfReset` | click | 8219 | Reset What-If toggles |
| `applyWhatIfChanges` | `#whatIfApply` | click | 8220 | Apply What-If changes |
| `toggleWhatIfMode` | `#whatIfToggleBtn` | click | 8334 | Toggle What-If mode |
| `handleHeatmapSort` | `#heatmapSort` | change | 332 | Sort heatmap |
| `toggleCardContext` | `.card-context-toggle` | click | 1995, 2092 | Toggle card context |
| `toggleCardTheme` | `.card-theme-toggle` | click | 2001, 2096 | Toggle card theme |
| `toggleGlobalTheme` | `#globalThemeToggle` | click | 510 | Toggle global theme |
| `updateBadgePreview` | `#badgeStyleSelect` | change | 296 | Update badge preview |
| `generateCodeSnippet` | `#snippetFramework` | change | 6813 | Generate code snippet |
| `importPreferences` | `#importPrefsInput` | change | 6831 | Import preferences |

## Notes

- Most filter handlers use direct element selection via `getElementById()` or `querySelector()`
- Group and platform toggles use `querySelectorAll()` with iteration to attach listeners to multiple elements
- The metadata filter is dynamically attached after panel creation (line 3989)
- Card context/theme toggles are attached during card rendering (lines 1995, 2001 for existing cards; 2092, 2096 for new cards)
- What-If mode toggles are attached when the panel is created (line 8206)
- Command palette filter is attached when the palette is opened (line 9084-9085)
