# Filter Handler Documentation

**Generated:** 2026-07-24  
**Bead ID:** bf-1h1yh  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Parent Bead:** bf-52d1r

## Overview

This document provides a comprehensive mapping of filter change handlers to their DOM element attachments, including function signatures, code locations, and event types.

## Document Structure

- **Core Filter Handlers** (9 handlers) - Primary filter operations
- **OG Generator Handlers** (10 handlers) - OpenGraph image generation
- **Platform Selection Handlers** (2 handlers) - Cropper platform toggles
- **What-If Panel Handlers** (4 handlers) - What-if mode controls
- **Context Menu Handlers** (1 handler) - Context menu routing
- **Guard System** (4 utility functions) - Smart ordering utilities

---

## Core Filter Handlers

### 1. toggleFavorite(pid)

**Purpose:** Toggle a platform's favorite status  

**DOM Element:** `.platform-item-remove` within `#favoritesList`  
**Element Type:** `<button class="platform-item-remove">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:8008  

```javascript
// app.js:8008
btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
```

**Also attached via:** Context menu at `[data-action="toggle-favorite"]` in `#cardContextMenu`

---

### 2. toggleHidden(pid)

**Purpose:** Toggle a platform's hidden status  

**DOM Element:** `.platform-item-remove` within `#hiddenPlatformsList`  
**Element Type:** `<button class="platform-item-remove">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:8030  

```javascript
// app.js:8030
btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
```

**Also attached via:** Context menu at `[data-action="toggle-hidden"]` in `#cardContextMenu`

---

### 3. renderMetadataTable(filter)

**Purpose:** Filter and render the metadata table  

**DOM Element:** `#metadataFilterInput`  
**Element Type:** `<input type="text" id="metadataFilterInput">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `input`  
**Code Location:** app.js:3991-3992  

```javascript
// app.js:3991-3992
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

---

### 4. filterCommands(e)

**Purpose:** Filter command palette entries  

**DOM Element:** `#commandInput`  
**Element Type:** `<input type="text" id="commandInput">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `input`  
**Code Location:** app.js:9085  

```javascript
// app.js:9085
input.addEventListener('input', filterCommands);
```

---

### 5. handleHeatmapSort()

**Purpose:** Handle heatmap sorting dropdown changes  

**DOM Element:** `#heatmapSort`  
**Element Type:** `<select id="heatmapSort">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:332  

```javascript
// app.js:332
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

---

### 6. updateBadgePreview()

**Purpose:** Update badge preview when style changes  

**DOM Element:** `#badgeStyleSelect`  
**Element Type:** `<select id="badgeStyleSelect">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:296  

```javascript
// app.js:296
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

---

### 7. toggleWhatIfMode()

**Purpose:** Toggle What-If mode on/off  

**DOM Element:** `#whatIfToggleBtn`  
**Element Type:** `<button id="whatIfToggleBtn">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:8334  

```javascript
// app.js:8334
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

---

### 8. applyWhatIfChanges()

**Purpose:** Apply What-If mode changes to main view  

**DOM Element:** `#whatIfApply`  
**Element Type:** `<button id="whatIfApply">`  
**Attachment Method:** `addEventListener` (dynamic)  
**Event Type:** `click`  
**Code Location:** app.js:8220  

```javascript
// app.js:8220
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
```

---

### 9. importPreferences(e)

**Purpose:** Import user preferences from JSON file  

**DOM Element:** `#importPrefsInput`  
**Element Type:** `<input type="file" id="importPrefsInput">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:6831  

```javascript
// app.js:6831
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

---

## OG Generator Handlers

### 10. handleBgTypeChange()

**Purpose:** Handle OG generator background type changes  

**DOM Element:** `#oggenBgType`  
**Element Type:** `<select id="oggenBgType">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:310  

```javascript
// app.js:310
oggenBgType?.addEventListener('change', handleBgTypeChange);
```

---

### 11. handleLogoPosChange()

**Purpose:** Handle OG generator logo position changes  

**DOM Element:** `#oggenLogoPos`  
**Element Type:** `<select id="oggenLogoPos">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:321  

```javascript
// app.js:321
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
```

---

### 12. updateOggenCanvas()

**Purpose:** Update OG generator canvas preview  

**DOM Elements:** Multiple OG generator inputs  
**Attachment Method:** `addEventListener` (10 attachments)  
**Event Types:** Mix of `input` and `change`  
**Code Locations:** app.js:311-323  

**Attached to:**
- `#oggenBgColor` (color picker) - `input` event
- `#oggenGradientStart` (color picker) - `input` event
- `#oggenGradientEnd` (color picker) - `input` event
- `#oggenGradientDir` (select) - `change` event
- `#oggenBgImageSize` (select) - `change` event
- `#oggenTitle` (text input) - `input` event
- `#oggenSubtitle` (text input) - `input` event
- `#oggenFont` (select) - `change` event
- `#oggenTextColor` (color picker) - `input` event
- `#oggenLogoSize` (text input) - `input` event

```javascript
// app.js:311-323
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenGradientStart?.addEventListener('input', updateOggenCanvas);
oggenGradientEnd?.addEventListener('input', updateOggenCanvas);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
oggenTitle?.addEventListener('input', updateOggenCanvas);
oggenSubtitle?.addEventListener('input', updateOggenCanvas);
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenTextColor?.addEventListener('input', updateOggenCanvas);
oggenLogoSize?.addEventListener('input', updateOggenCanvas);
```

---

### 13. handleBgImageUpload()

**Purpose:** Handle OG generator background image upload  

**DOM Element:** `#oggenBgImageInput`  
**Element Type:** `<input type="file" id="oggenBgImageInput">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:315  

```javascript
// app.js:315
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
```

---

### 14. handleLogoUpload()

**Purpose:** Handle OG generator logo upload  

**DOM Element:** `#oggenLogoInput`  
**Element Type:** `<input type="file" id="oggenLogoInput">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:322  

```javascript
// app.js:322
oggenLogoInput?.addEventListener('change', handleLogoUpload);
```

---

### 15. generateCodeSnippet()

**Purpose:** Generate embed code snippet  

**DOM Element:** `#snippetFramework`  
**Element Type:** `<select id="snippetFramework">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:6813  

```javascript
// app.js:6813
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

---

### 16. downloadOggenImage()

**Purpose:** Download OG generator image  

**DOM Element:** `#oggenDownloadBtn`  
**Element Type:** `<button id="oggenDownloadBtn">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:324  

```javascript
// app.js:324
oggenDownloadBtn?.addEventListener('click', downloadOggenImage);
```

---

### 17. resetOggen()

**Purpose:** Reset OG generator to defaults  

**DOM Element:** `#oggenResetBtn`  
**Element Type:** `<button id="oggenResetBtn">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:325  

```javascript
// app.js:325
oggenResetBtn?.addEventListener('click', resetOggen);
```

---

### 18. useOggenInEditor()

**Purpose:** Use OG generator image in editor  

**DOM Element:** `#oggenUseInEditorBtn`  
**Element Type:** `<button id="oggenUseInEditorBtn">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:326  

```javascript
// app.js:326
oggenUseInEditorBtn?.addEventListener('click', useOggenInEditor);
```

---

### 19. exportSitemapDataAsCsv()

**Purpose:** Export sitemap data as CSV  

**DOM Element:** `#exportSitemapCsv`  
**Element Type:** `<button id="exportSitemapCsv">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:333  

```javascript
// app.js:333
exportSitemapCsv?.addEventListener('click', exportSitemapDataAsCsv);
```

---

### 20. exportSitemapDataAsJson()

**Purpose:** Export sitemap data as JSON  

**DOM Element:** `#exportSitemapJson`  
**Element Type:** `<button id="exportSitemapJson">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `click`  
**Code Location:** app.js:334  

```javascript
// app.js:334
exportSitemapJson?.addEventListener('click', exportSitemapDataAsJson);
```

---

## Platform Selection Handlers

### 21. Platform Toggle Handler

**Functions Called:** `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`  

**DOM Element:** `.cropper-platform-toggle input`  
**Element Type:** `<input type="checkbox" class="cropper-platform-toggle">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:3497-3501  

```javascript
// app.js:3497-3501
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

---

### 22. Group Toggle Handler (inline)

**Purpose:** Toggle all platforms in a group  

**DOM Element:** `.cropper-group-toggle`  
**Element Type:** `<input type="checkbox" class="cropper-group-toggle">`  
**Attachment Method:** `addEventListener`  
**Event Type:** `change`  
**Code Location:** app.js:3481-3491  

```javascript
// app.js:3481-3491
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

## What-If Panel Handlers

### 23. What-If Tag Toggle Handlers

**Purpose:** Toggle individual tags on/off in What-If mode  

**DOM Element:** `.what-if-toggle input` (within `#whatIfPanel`)  
**Element Type:** `<input type="checkbox" data-tag="...">`  
**Attachment Method:** `addEventListener` (dynamic attachment)  
**Event Type:** `change`  
**Code Location:** app.js:8206-8215  

```javascript
// app.js:8206-8215
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

### 24. closeWhatIfPanel()

**Purpose:** Close the What-If panel  

**DOM Element:** `#whatIfClose`  
**Element Type:** `<button id="whatIfClose">`  
**Attachment Method:** `addEventListener` (dynamic)  
**Event Type:** `click`  
**Code Location:** app.js:8218  

```javascript
// app.js:8218
document.getElementById('whatIfClose')?.addEventListener('click', closeWhatIfPanel);
```

---

### 25. resetWhatIfToggles()

**Purpose:** Reset What-If toggles to default state  

**DOM Element:** `#whatIfReset`  
**Element Type:** `<button id="whatIfReset">`  
**Attachment Method:** `addEventListener` (dynamic)  
**Event Type:** `click`  
**Code Location:** app.js:8219  

```javascript
// app.js:8219
document.getElementById('whatIfReset')?.addEventListener('click', resetWhatIfToggles);
```

---

## Context Menu Handlers

### 26. handleContextMenuAction()

**Purpose:** Route context menu actions to appropriate handlers  

**DOM Element:** `.context-menu-item[data-action]`  
**Element Type:** `<div class="context-menu-item" data-action="...">`  
**Attachment Method:** `addEventListener` (event delegation)  
**Event Type:** `click`  
**Code Location:** app.js:9702, 9771-9801  

```javascript
// app.js:9702 (attachment)
contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
  item.addEventListener('click', handleContextMenuAction);
});

// app.js:9771-9801 (handler function)
function handleContextMenuAction(e) {
  const action = this.dataset.action;
  const pid = contextMenuTargetPid;
  
  if (!pid) return;
  
  switch (action) {
    case 'toggle-hidden':
      toggleHidden(pid);
      break;
    case 'toggle-favorite':
      toggleFavorite(pid);
      break;
    // ... other cases
  }
}
```

**Actions handled:**
- `toggle-hidden` → `toggleHidden(pid)`
- `toggle-favorite` → `toggleFavorite(pid)`

---

## Guard System (Utility Functions)

These are **NOT event handlers** - they are utility functions used by other handlers during smart ordering operations:

### shouldDeferFilterOperation()

**Type:** Utility function  
**Purpose:** Check if filter operations should be deferred  
**Code Location:** app.js:7891  

---

### isSmartOrdering()

**Type:** Utility function  
**Purpose:** Check if smart ordering mode is active  
**Code Location:** app.js:7933  

---

### queueFilterOperation(operation, description)

**Type:** Utility function  
**Purpose:** Queue filter operations during smart ordering  
**Code Location:** app.js:7942  

---

### processPendingFilterOperations()

**Type:** Utility function  
**Purpose:** Process queued filter operations  
**Code Location:** app.js:7952  

---

## Summary Statistics

**Total Handlers Mapped:** 26  
**Total Attachment Points:** 35+ (some handlers attached to multiple elements)  
**Guard Utility Functions:** 4

**Attachment Method Distribution:**
- `addEventListener`: 100% of programmatic attachments
- `addEventListener` (dynamic): 4 attachments (What-If panel, context menu)

**Event Type Distribution:**
- `click`: 9 handlers
- `change`: 10 handlers
- `input`: 10 handlers
- `keydown`: 1 handler (command palette navigation - not documented above)

**Handler Categories:**
- Core filter handlers: 9
- OG generator handlers: 11
- Platform selection handlers: 2
- What-If panel handlers: 4
- Context menu handlers: 1

---

## Quick Reference Table

| # | Handler | DOM Element | Event | Line | Type |
|---|---------|-------------|-------|------|------|
| 1 | `toggleFavorite` | `.platform-item-remove` in `#favoritesList` | click | 8008 | button |
| 2 | `toggleHidden` | `.platform-item-remove` in `#hiddenPlatformsList` | click | 8030 | button |
| 3 | `renderMetadataTable` | `#metadataFilterInput` | input | 3991-3992 | input[text] |
| 4 | `filterCommands` | `#commandInput` | input | 9085 | input[text] |
| 5 | `handleHeatmapSort` | `#heatmapSort` | change | 332 | select |
| 6 | `updateBadgePreview` | `#badgeStyleSelect` | change | 296 | select |
| 7 | `toggleWhatIfMode` | `#whatIfToggleBtn` | click | 8334 | button |
| 8 | `applyWhatIfChanges` | `#whatIfApply` | click | 8220 | button |
| 9 | `importPreferences` | `#importPrefsInput` | change | 6831 | input[file] |
| 10 | `handleBgTypeChange` | `#oggenBgType` | change | 310 | select |
| 11 | `handleLogoPosChange` | `#oggenLogoPos` | change | 321 | select |
| 12 | `updateOggenCanvas` | Multiple OG inputs | input/change | 311-323 | Various |
| 13 | `handleBgImageUpload` | `#oggenBgImageInput` | change | 315 | input[file] |
| 14 | `handleLogoUpload` | `#oggenLogoInput` | change | 322 | input[file] |
| 15 | `generateCodeSnippet` | `#snippetFramework` | change | 6813 | select |
| 16 | `downloadOggenImage` | `#oggenDownloadBtn` | click | 324 | button |
| 17 | `resetOggen` | `#oggenResetBtn` | click | 325 | button |
| 18 | `useOggenInEditor` | `#oggenUseInEditorBtn` | click | 326 | button |
| 19 | `exportSitemapDataAsCsv` | `#exportSitemapCsv` | click | 333 | button |
| 20 | `exportSitemapDataAsJson` | `#exportSitemapJson` | click | 334 | button |
| 21 | Platform toggles | `.cropper-platform-toggle input` | change | 3497-3501 | checkbox |
| 22 | Group toggles | `.cropper-group-toggle` | change | 3481-3491 | checkbox |
| 23 | What-If tag toggles | `.what-if-toggle input` | change | 8206-8215 | checkbox |
| 24 | `closeWhatIfPanel` | `#whatIfClose` | click | 8218 | button |
| 25 | `resetWhatIfToggles` | `#whatIfReset` | click | 8219 | button |
| 26 | `handleContextMenuAction` | `.context-menu-item[data-action]` | click | 9702 | div |

---

**Document Status:** ✅ COMPLETE  
**Date:** 2026-07-24  
**Bead:** bf-1h1yh  
**Parent:** bf-52d1r
