# Filter Handler to DOM Element Mapping - vista/app.js

**Bead:** bf-4gu1l  
**Date:** 2026-07-24  
**Purpose:** Map each filter change handler to its DOM element, selector, and event type

---

## Filter Change Handlers That Reset Order

### 1. toggleHidden(pid)
**Handler Lines:** 7984-8013  
**DOM Attachment:** Line 8030  
**Element Selector:** `.platform-item-remove` (within `#hiddenPlatformsList`)  
**Event Type:** `click`  
**Registration Pattern:** Dynamic event listener attached during `updateHiddenList()` function

```javascript
// Line 8029-8031
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

**Element Structure:**
- Container: `<div id="hiddenPlatformsList">`
- Target buttons: `<button class="platform-item-remove" data-pid="${pid}">&times;</button>`
- Attachment context: Inside `updateHiddenList()` function, re-attached each time the hidden list is re-rendered

---

### 2. importPreferences(e)
**Handler Lines:** 8082-8140  
**DOM Attachment:** Line 6831  
**Element Selector:** `#importPrefsInput`  
**Event Type:** `change`  
**Registration Pattern:** Static event listener attached during DOM ready

```javascript
// Line 6831
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

**Element Structure:**
- Hidden file input: `<input type="file" id="importPrefsInput">`
- Triggered via button: `<button id="importPrefsBtn">` (line 6827-6829)
- User flow: Button click → hidden input click → file selection → change event fires

---

### 3. toggleWhatIfMode()
**Handler Lines:** 8146-8187  
**DOM Attachment:** Line 8334  
**Element Selector:** `#whatIfToggleBtn`  
**Event Type:** `click`  
**Registration Pattern:** Static event listener attached during DOM ready

```javascript
// Line 8334
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

**Element Structure:**
- Toggle button: `<button id="whatIfToggleBtn">`
- Purpose: Toggles "What If" mode for simulating missing metadata tags

---

### 4. applyWhatIfChanges()
**Handler Lines:** 8254-8305  
**DOM Attachment:** Line 8220  
**Element Selector:** `#whatIfApply`  
**Event Type:** `click`  
**Registration Pattern:** Static event listener attached during DOM ready

```javascript
// Line 8220
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
```

**Element Structure:**
- Apply button: `<button id="whatIfApply">`
- Context: Inside What If panel, applies selected tag exclusions

---

## Filter Change Handlers That Do NOT Reset Order

### 5. toggleFavorite(pid)
**Handler Lines:** 7867-7890  
**DOM Attachment:** Line 8008  
**Element Selector:** `.platform-item-remove` (within `#favoritesList`)  
**Event Type:** `click`  
**Registration Pattern:** Dynamic event listener attached during `updateFavoritesList()` function

```javascript
// Line 8007-8009
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```

**Element Structure:**
- Container: `<div id="favoritesList">`
- Target buttons: `<button class="platform-item-remove" data-pid="${pid}">&times;</button>`
- Attachment context: Inside `updateFavoritesList()` function, re-attached each time the favorites list is re-rendered

---

### 6. Metadata Filter Input
**Handler Lines:** 3991-3993  
**DOM Attachment:** Line 3991  
**Element Selector:** `#metadataFilterInput`  
**Event Type:** `input`  
**Registration Pattern:** Dynamic event listener attached during `renderRawTagsPanel()` function

```javascript
// Line 3989-3993
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Element Structure:**
- Input field: `<input type="text" id="metadataFilterInput">`
- Context: Filters metadata table rows only (no card order impact)

---

### 7. Command Palette Filter
**Handler Lines:** 9110  
**DOM Attachment:** Line 9085  
**Element Selector:** `#commandInput`  
**Event Type:** `input`  
**Registration Pattern:** Dynamic event listener attached during `initCommandPalette()` function

```javascript
// Line 9084-9085
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Element Structure:**
- Input field: `<input id="commandInput">`
- Context: Filters command palette options (separate feature, no card impact)

---

### 8. Heatmap Sort Dropdown
**Handler Lines:** 6101-6123  
**DOM Attachment:** Line 332  
**Element Selector:** `#heatmapSort`  
**Event Type:** `change`  
**Registration Pattern:** Static event listener attached during DOM ready

```javascript
// Line 332
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Element Structure:**
- Select dropdown: `<select id="heatmapSort">`
- Context: Sorts sitemap heatmap results (no card order impact)

---

### 9. Badge Style Select
**Handler Lines:** 4765-4788  
**DOM Attachment:** Line 296  
**Element Selector:** `#badgeStyleSelect`  
**Event Type:** `change`  
**Registration Pattern:** Static event listener attached during DOM ready

```javascript
// Line 296
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

**Element Structure:**
- Select dropdown: `<select id="badgeStyleSelect">`
- Context: Updates badge preview in modal (no card order impact)

---

## Cropper Platform/Group Toggles

### 10. Cropper Group Header Toggles
**Handler Lines:** 3481-3492  
**DOM Attachment:** Line 3480  
**Element Selector:** `.cropper-group-toggle`  
**Event Type:** `change`  
**Registration Pattern:** Dynamic event listener attached during `updateCropperControls()` function

```javascript
// Line 3480-3491
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

**Element Structure:**
- Checkboxes: `<input type="checkbox" class="cropper-group-toggle" data-group="${groupId}">`
- Context: Controls platform overlay visibility in cropper (no card order impact)

---

### 11. Cropper Individual Platform Toggles
**Handler Lines:** 3497-3502  
**DOM Attachment:** Line 3496  
**Element Selector:** `.cropper-platform-toggle input`  
**Event Type:** `change`  
**Registration Pattern:** Dynamic event listener attached during `updateCropperControls()` function

```javascript
// Line 3496-3501
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Element Structure:**
- Checkboxes: `<input type="checkbox" class="cropper-platform-toggle" data-platform="${pid}">`
- Context: Individual platform overlay visibility in cropper (no card order impact)

---

### 12. Cropper "Select All" Button
**Handler Lines:** 3504-3509  
**DOM Attachment:** Line 3504  
**Element Selector:** `#selectAllPlatforms`  
**Event Type:** `click`  
**Registration Pattern:** Static event listener attached during `updateCropperControls()` function

```javascript
// Line 3504-3508
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Element Structure:**
- Button: `<button id="selectAllPlatforms">`
- Context: Selects all platforms in cropper (no card order impact)

---

### 13. Cropper "Clear All" Button
**Handler Lines:** 3511-3516  
**DOM Attachment:** Line 3511  
**Element Selector:** `#clearAllPlatforms`  
**Event Type:** `click`  
**Registration Pattern:** Static event listener attached during `updateCropperControls()` function

```javascript
// Line 3511-3515
document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Element Structure:**
- Button: `<button id="clearAllPlatforms">`
- Context: Deselects all platforms in cropper (no card order impact)

---

## OG Generator Controls

### 14-25. OG Generator Event Listeners
**Handler Lines:** 310-326  
**DOM Attachments:** Multiple event listeners for OG generator controls

**Event Listeners:**
```javascript
// Line 310-326
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

**Element Selectors:**
- `#oggenBgType` - Background type selection
- `#oggenBgColor` - Background color input
- `#oggenGradientStart` - Gradient start color
- `#oggenGradientEnd` - Gradient end color
- `#oggenGradientDir` - Gradient direction
- `#oggenBgImageInput` - Background image upload
- `#oggenBgImageSize` - Background image size
- `#oggenTitle` - OG title text
- `#oggenSubtitle` - OG subtitle text
- `#oggenFont` - Font selection
- `#oggenTextColor` - Text color
- `#oggenLogoPos` - Logo position
- `#oggenLogoInput` - Logo upload
- `#oggenLogoSize` - Logo size
- `#oggenDownloadBtn` - Download button
- `#oggenResetBtn` - Reset button
- `#oggenUseInEditorBtn` - Use in editor button

**Context:** All OG generator controls (no card order impact)

---

## Summary Table

| Handler | DOM Attachment Line | Element Selector | Event Type | Parent Context | Resets Order? |
|---------|-------------------|------------------|------------|----------------|---------------|
| `toggleHidden()` | 8030 | `.platform-item-remove` | `click` | `#hiddenPlatformsList` | ✅ YES |
| `toggleFavorite()` | 8008 | `.platform-item-remove` | `click` | `#favoritesList` | ❌ NO |
| `importPreferences()` | 6831 | `#importPrefsInput` | `change` | DOM ready | ✅ YES |
| `toggleWhatIfMode()` | 8334 | `#whatIfToggleBtn` | `click` | DOM ready | ✅ YES |
| `applyWhatIfChanges()` | 8220 | `#whatIfApply` | `click` | DOM ready | ✅ YES |
| `Metadata Filter` | 3991 | `#metadataFilterInput` | `input` | `renderRawTagsPanel()` | ❌ NO |
| `Command Palette` | 9085 | `#commandInput` | `input` | `initCommandPalette()` | ❌ NO |
| `Heatmap Sort` | 332 | `#heatmapSort` | `change` | DOM ready | ❌ NO |
| `Badge Style` | 296 | `#badgeStyleSelect` | `change` | DOM ready | ❌ NO |
| `Cropper Group Toggle` | 3480 | `.cropper-group-toggle` | `change` | `updateCropperControls()` | ❌ NO |
| `Cropper Platform Toggle` | 3496 | `.cropper-platform-toggle input` | `change` | `updateCropperControls()` | ❌ NO |
| `Select All Platforms` | 3504 | `#selectAllPlatforms` | `click` | `updateCropperControls()` | ❌ NO |
| `Clear All Platforms` | 3511 | `#clearAllPlatforms` | `click` | `updateCropperControls()` | ❌ NO |
| `OG Generator (17 controls)` | 310-326 | Multiple `#oggen*` | `input`/`change`/`click` | DOM ready | ❌ NO |

---

## Event Attachment Patterns

### Static Event Listeners (attached during DOM ready)
- Attached once when page loads
- Use `document.getElementById()` with optional chaining `?.`
- Found in initialization section (lines 229-6850)

### Dynamic Event Listeners (attached during function execution)
- Re-attached each time parent container is re-rendered
- Use `querySelectorAll()` with `forEach()` to attach to multiple elements
- Found in update/render functions:
  - `updateFavoritesList()` (line 8007-8009)
  - `updateHiddenList()` (line 8029-8031)
  - `renderRawTagsPanel()` (line 3989-3993)
  - `initCommandPalette()` (line 9084-9085)
  - `updateCropperControls()` (lines 3480-3515)

---

## Key Implementation Details

### Dynamic Re-attachment Pattern
Handlers like `toggleFavorite()` and `toggleHidden()` use dynamic re-attachment because:
1. Parent lists (`#favoritesList`, `#hiddenPlatformsList`) are completely re-rendered
2. Event listeners on child elements are lost when innerHTML is replaced
3. Re-attachment ensures handlers remain functional after list updates

### Optional Chaining Pattern
Most static event listeners use optional chaining `?.addEventListener()`:
```javascript
document.getElementById('elementId')?.addEventListener('event', handler);
```
This prevents errors if elements don't exist (e.g., in different page modes).

### Event Type Choices
- `change`: Used for form inputs (selects, file inputs, checkboxes) - fires after value change commits
- `input`: Used for text inputs - fires immediately on each keystroke
- `click`: Used for buttons and interactive elements - fires on user interaction

---

## Verification Status

✅ **Complete** - All acceptance criteria met:
- ✅ Each handler function mapped to its DOM element
- ✅ Element selectors documented for all handlers
- ✅ Event types specified (click, change, input)
- ✅ Parent contexts identified
- ✅ Static vs dynamic attachment patterns distinguished
- ✅ Order-reset behavior noted for each handler
- ✅ DOM attachment lines documented

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-24  
**Status:** Complete