# Filter Change Handler DOM Element Selector Mapping

**Bead:** bf-40knx  
**Date:** 2026-07-24  
**Purpose:** Comprehensive mapping of filter change handlers to their DOM element selectors

## Overview

This document provides a precise mapping of each filter change handler to its DOM element selector and the line number where the event listener attachment occurs in `/home/coding/vista/src/public/app.js`.

---

## Filter Change Handlers with Order Reset Impact

### 1. toggleHidden(pid)
- **Function:** Toggles platform visibility (hide/show)
- **DOM Selector:** `.platform-item-remove` (within `#hiddenPlatformsList`)
- **Selector Type:** querySelectorAll (dynamic)
- **Attachment Line:** 8029-8031
- **Attachment Code:**
  ```javascript
  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
  });
  ```
- **Element Location:** Inside `#hiddenPlatformsList` container
- **Dynamic Creation:** Buttons created dynamically in `updateHiddenList()` function (lines 8021-8027)

### 2. toggleFavorite(pid)
- **Function:** Toggles platform favorite status
- **DOM Selector:** `.platform-item-remove` (within `#favoritesList`)
- **Selector Type:** querySelectorAll (dynamic)
- **Attachment Line:** 8007-8009
- **Attachment Code:**
  ```javascript
  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
  });
  ```
- **Element Location:** Inside `#favoritesList` container
- **Dynamic Creation:** Buttons created dynamically in `updateFavoritesList()` function (lines 7999-8005)

### 3. importPreferences(e)
- **Function:** Imports user preferences from JSON file
- **DOM Selector:** `#importPrefsInput`
- **Selector Type:** getElementById
- **Attachment Line:** 6831
- **Attachment Code:**
  ```javascript
  document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)
  ```
- **Element Definition Line:** Not in code (created via .click() on line 6828)
- **Trigger Element:** `#importPrefsBtn` (line 6827-6828)

### 4. toggleWhatIfMode()
- **Function:** Toggles "What If" mode for simulating missing metadata tags
- **DOM Selector:** `#whatIfToggleBtn`
- **Selector Type:** getElementById
- **Attachment Line:** 8334
- **Attachment Code:**
  ```javascript
  document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode)
  ```
- **Element Definition Line:** 464
- **Element Definition:** `const btn = document.getElementById('whatIfToggleBtn');`

### 5. applyWhatIfChanges()
- **Function:** Applies What If mode changes (disables selected metadata tags)
- **DOM Selector:** `#whatIfApply`
- **Selector Type:** getElementById
- **Attachment Line:** 8220
- **Attachment Code:**
  ```javascript
  document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges)
  ```

---

## Filter Change Handlers Without Order Reset Impact

### 6. Metadata Filter Input Handler
- **Function:** Filters metadata tags table
- **DOM Selector:** `#metadataFilterInput`
- **Selector Type:** getElementById
- **Attachment Line:** 3991
- **Attachment Code:**
  ```javascript
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
  ```
- **Element Definition Line:** 3989
- **Element Definition:** `const filterInput = document.getElementById('metadataFilterInput');`
- **Handler Function:** Anonymous inline function calling `renderMetadataTable()`

### 7. Command Palette Filter Handler
- **Function:** Filters command palette options
- **DOM Selector:** `#commandInput`
- **Selector Type:** getElementById
- **Attachment Line:** 9085
- **Attachment Code:**
  ```javascript
  input.addEventListener('input', filterCommands);
  ```
- **Element Definition Line:** 9084
- **Element Definition:** `const input = document.getElementById('commandInput');`
- **Handler Function:** `filterCommands(e)`

### 8. Heatmap Sort Dropdown Handler
- **Function:** Sorts sitemap heatmap results
- **DOM Selector:** `#heatmapSort`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 332
- **Attachment Code:**
  ```javascript
  heatmapSort?.addEventListener('change', handleHeatmapSort)
  ```
- **Element Definition Line:** 218
- **Element Definition:** `const heatmapSort = $('#heatmapSort');`
- **Handler Function:** `handleHeatmapSort()`

### 9. Badge Style Select Handler
- **Function:** Updates badge preview in modal
- **DOM Selector:** `#badgeStyleSelect`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 296
- **Attachment Code:**
  ```javascript
  badgeStyleSelect?.addEventListener('change', updateBadgePreview)
  ```
- **Element Definition Line:** 169
- **Element Definition:** `const badgeStyleSelect = $('#badgeStyleSelect');`
- **Handler Function:** `updateBadgePreview()`

---

## Additional OG Generator Filter-Related Handlers

### 10. OG Generator Background Type Handler
- **Function:** Handles OG generator background type change
- **DOM Selector:** `#oggenBgType`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 310
- **Attachment Code:**
  ```javascript
  oggenBgType?.addEventListener('change', handleBgTypeChange)
  ```
- **Element Definition Line:** 186
- **Element Definition:** `const oggenBgType = $('#oggenBgType');`
- **Handler Function:** `handleBgTypeChange()`

### 11. OG Generator Background Color Handler
- **Function:** Updates OG generator canvas with new background color
- **DOM Selector:** `#oggenBgColor`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 311
- **Attachment Code:**
  ```javascript
  oggenBgColor?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 187
- **Element Definition:** `const oggenBgColor = $('#oggenBgColor');`
- **Handler Function:** `updateOggenCanvas()`

### 12. OG Generator Gradient Start Handler
- **Function:** Updates OG generator canvas with new gradient start color
- **DOM Selector:** `#oggenGradientStart`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 312
- **Attachment Code:**
  ```javascript
  oggenGradientStart?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 189
- **Element Definition:** `const oggenGradientStart = $('#oggenGradientStart');`
- **Handler Function:** `updateOggenCanvas()`

### 13. OG Generator Gradient End Handler
- **Function:** Updates OG generator canvas with new gradient end color
- **DOM Selector:** `#oggenGradientEnd`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 313
- **Attachment Code:**
  ```javascript
  oggenGradientEnd?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 190
- **Element Definition:** `const oggenGradientEnd = $('#oggenGradientEnd');`
- **Handler Function:** `updateOggenCanvas()`

### 14. OG Generator Gradient Direction Handler
- **Function:** Updates OG generator canvas with new gradient direction
- **DOM Selector:** `#oggenGradientDir`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 314
- **Attachment Code:**
  ```javascript
  oggenGradientDir?.addEventListener('change', updateOggenCanvas)
  ```
- **Element Definition Line:** 191
- **Element Definition:** `const oggenGradientDir = $('#oggenGradientDir');`
- **Handler Function:** `updateOggenCanvas()`

### 15. OG Generator Background Image Upload Handler
- **Function:** Handles background image upload for OG generator
- **DOM Selector:** `#oggenBgImageInput`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 315
- **Attachment Code:**
  ```javascript
  oggenBgImageInput?.addEventListener('change', handleBgImageUpload)
  ```
- **Element Definition Line:** 193
- **Element Definition:** `const oggenBgImageInput = $('#oggenBgImageInput');`
- **Handler Function:** `handleBgImageUpload()`

### 16. OG Generator Background Image Size Handler
- **Function:** Updates OG generator canvas with new background image size
- **DOM Selector:** `#oggenBgImageSize`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 316
- **Attachment Code:**
  ```javascript
  oggenBgImageSize?.addEventListener('change', updateOggenCanvas)
  ```
- **Element Definition Line:** 194
- **Element Definition:** `const oggenBgImageSize = $('#oggenBgImageSize');`
- **Handler Function:** `updateOggenCanvas()`

### 17. OG Generator Title Handler
- **Function:** Updates OG generator canvas with new title text
- **DOM Selector:** `#oggenTitle`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 317
- **Attachment Code:**
  ```javascript
  oggenTitle?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 196
- **Element Definition:** `const oggenTitle = $('#oggenTitle');`
- **Handler Function:** `updateOggenCanvas()`

### 18. OG Generator Subtitle Handler
- **Function:** Updates OG generator canvas with new subtitle text
- **DOM Selector:** `#oggenSubtitle`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 318
- **Attachment Code:**
  ```javascript
  oggenSubtitle?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 197
- **Element Definition:** `const oggenSubtitle = $('#oggenSubtitle');`
- **Handler Function:** `updateOggenCanvas()`

### 19. OG Generator Font Handler
- **Function:** Updates OG generator canvas with new font selection
- **DOM Selector:** `#oggenFont`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 319
- **Attachment Code:**
  ```javascript
  oggenFont?.addEventListener('change', updateOggenCanvas)
  ```
- **Element Definition Line:** 198
- **Element Definition:** `const oggenFont = $('#oggenFont');`
- **Handler Function:** `updateOggenCanvas()`

### 20. OG Generator Text Color Handler
- **Function:** Updates OG generator canvas with new text color
- **DOM Selector:** `#oggenTextColor`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 320
- **Attachment Code:**
  ```javascript
  oggenTextColor?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 199
- **Element Definition:** `const oggenTextColor = $('#oggenTextColor');`
- **Handler Function:** `updateOggenCanvas()`

### 21. OG Generator Logo Position Handler
- **Function:** Handles OG generator logo position change
- **DOM Selector:** `#oggenLogoPos`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 321
- **Attachment Code:**
  ```javascript
  oggenLogoPos?.addEventListener('change', handleLogoPosChange)
  ```
- **Element Definition Line:** 200
- **Element Definition:** `const oggenLogoPos = $('#oggenLogoPos');`
- **Handler Function:** `handleLogoPosChange()`

### 22. OG Generator Logo Upload Handler
- **Function:** Handles logo upload for OG generator
- **DOM Selector:** `#oggenLogoInput`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 322
- **Attachment Code:**
  ```javascript
  oggenLogoInput?.addEventListener('change', handleLogoUpload)
  ```
- **Element Definition Line:** 201
- **Element Definition:** `const oggenLogoInput = $('#oggenLogoInput');`
- **Handler Function:** `handleLogoUpload()`

### 23. OG Generator Logo Size Handler
- **Function:** Updates OG generator canvas with new logo size
- **DOM Selector:** `#oggenLogoSize`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 323
- **Attachment Code:**
  ```javascript
  oggenLogoSize?.addEventListener('input', updateOggenCanvas)
  ```
- **Element Definition Line:** 202
- **Element Definition:** `const oggenLogoSize = $('#oggenLogoSize');`
- **Handler Function:** `updateOggenCanvas()`

---

## Cropper Toggle Handlers

### 24. Cropper Group Toggle Handler
- **Function:** Updates which platform group overlays are visible in cropper
- **DOM Selector:** `.cropper-group-toggle`
- **Selector Type:** querySelectorAll (dynamic)
- **Attachment Line:** 3480
- **Attachment Code:**
  ```javascript
  document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
    groupCb.addEventListener('change', (e) => {
      // ... handler logic
    });
  });
  ```
- **Dynamic Creation:** Checkboxes created dynamically in cropper rendering

### 25. Cropper Platform Toggle Handler
- **Function:** Updates which individual platform overlays are visible in cropper
- **DOM Selector:** `.cropper-platform-toggle input`
- **Selector Type:** querySelectorAll (dynamic)
- **Attachment Line:** 3496
- **Attachment Code:**
  ```javascript
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
    cb.addEventListener('change', () => {
      // ... handler logic
    });
  });
  ```
- **Dynamic Creation:** Checkboxes created dynamically in cropper rendering

---

## Helper Function ($)

The `$` function is defined as a shortcut for `getElementById`:

```javascript
function $(id) {
  return document.getElementById(id);
}
```

This is used for most static element definitions at the top of the file.

---

## Summary Table

| # | Handler Function | DOM Selector | Selector Type | Attachment Line | Element Def Line | Resets Order? |
|---|------------------|--------------|---------------|------------------|------------------|---------------|
| 1 | `toggleHidden()` | `.platform-item-remove` | querySelectorAll (dynamic) | 8029-8031 | N/A (dynamic) | ✅ YES |
| 2 | `toggleFavorite()` | `.platform-item-remove` | querySelectorAll (dynamic) | 8007-8009 | N/A (dynamic) | ❌ NO |
| 3 | `importPreferences()` | `#importPrefsInput` | getElementById | 6831 | N/A (created) | ✅ YES |
| 4 | `toggleWhatIfMode()` | `#whatIfToggleBtn` | getElementById | 8334 | 464 | ✅ YES |
| 5 | `applyWhatIfChanges()` | `#whatIfApply` | getElementById | 8220 | N/A | ✅ YES |
| 6 | Metadata filter | `#metadataFilterInput` | getElementById | 3991 | 3989 | ❌ NO |
| 7 | Command palette | `#commandInput` | getElementById | 9085 | 9084 | ❌ NO |
| 8 | `handleHeatmapSort()` | `#heatmapSort` | getElementId ($) | 332 | 218 | ❌ NO |
| 9 | `updateBadgePreview()` | `#badgeStyleSelect` | getElementId ($) | 296 | 169 | ❌ NO |
| 10 | `handleBgTypeChange()` | `#oggenBgType` | getElementId ($) | 310 | 186 | ❌ NO |
| 11 | `updateOggenCanvas()` | `#oggenBgColor` | getElementId ($) | 311 | 187 | ❌ NO |
| 12 | `updateOggenCanvas()` | `#oggenGradientStart` | getElementId ($) | 312 | 189 | ❌ NO |
| 13 | `updateOggenCanvas()` | `#oggenGradientEnd` | getElementId ($) | 313 | 190 | ❌ NO |
| 14 | `updateOggenCanvas()` | `#oggenGradientDir` | getElementId ($) | 314 | 191 | ❌ NO |
| 15 | `handleBgImageUpload()` | `#oggenBgImageInput` | getElementId ($) | 315 | 193 | ❌ NO |
| 16 | `updateOggenCanvas()` | `#oggenBgImageSize` | getElementId ($) | 316 | 194 | ❌ NO |
| 17 | `updateOggenCanvas()` | `#oggenTitle` | getElementId ($) | 317 | 196 | ❌ NO |
| 18 | `updateOggenCanvas()` | `#oggenSubtitle` | getElementId ($) | 318 | 197 | ❌ NO |
| 19 | `updateOggenCanvas()` | `#oggenFont` | getElementId ($) | 319 | 198 | ❌ NO |
| 20 | `updateOggenCanvas()` | `#oggenTextColor` | getElementId ($) | 320 | 199 | ❌ NO |
| 21 | `handleLogoPosChange()` | `#oggenLogoPos` | getElementId ($) | 321 | 200 | ❌ NO |
| 22 | `handleLogoUpload()` | `#oggenLogoInput` | getElementId ($) | 322 | 201 | ❌ NO |
| 23 | `updateOggenCanvas()` | `#oggenLogoSize` | getElementId ($) | 323 | 202 | ❌ NO |
| 24 | Cropper group toggle | `.cropper-group-toggle` | querySelectorAll (dynamic) | 3480 | N/A (dynamic) | ❌ NO |
| 25 | Cropper platform toggle | `.cropper-platform-toggle input` | querySelectorAll (dynamic) | 3496 | N/A (dynamic) | ❌ NO |

---

## Event Types Summary

**Click Events:**
- Lines 8029-8031: toggleHidden (`.platform-item-remove`)
- Lines 8007-8009: toggleFavorite (`.platform-item-remove`)
- Line 8334: toggleWhatIfMode (`#whatIfToggleBtn`)
- Line 8220: applyWhatIfChanges (`#whatIfApply`)

**Change Events:**
- Line 6831: importPreferences (`#importPrefsInput`)
- Line 332: handleHeatmapSort (`#heatmapSort`)
- Line 296: updateBadgePreview (`#badgeStyleSelect`)
- Line 310: handleBgTypeChange (`#oggenBgType`)
- Line 314: updateOggenCanvas (`#oggenGradientDir`)
- Line 315: handleBgImageUpload (`#oggenBgImageInput`)
- Line 316: updateOggenCanvas (`#oggenBgImageSize`)
- Line 319: updateOggenCanvas (`#oggenFont`)
- Line 321: handleLogoPosChange (`#oggenLogoPos`)
- Line 322: handleLogoUpload (`#oggenLogoInput`)
- Line 3480: Cropper group toggle (`.cropper-group-toggle`)
- Line 3496: Cropper platform toggle (`.cropper-platform-toggle input`)

**Input Events:**
- Line 3991: Metadata filter (`#metadataFilterInput`)
- Line 9085: Command palette filter (`#commandInput`)
- Line 311: updateOggenCanvas (`#oggenBgColor`)
- Line 312: updateOggenCanvas (`#oggenGradientStart`)
- Line 313: updateOggenCanvas (`#oggenGradientEnd`)
- Line 317: updateOggenCanvas (`#oggenTitle`)
- Line 318: updateOggenCanvas (`#oggenSubtitle`)
- Line 320: updateOggenCanvas (`#oggenTextColor`)
- Line 323: updateOggenCanvas (`#oggenLogoSize`)

---

## Dynamic vs Static Elements

**Static Elements (defined at top of file):**
- All `#` prefixed IDs (lines 169-204, 218, 464, etc.)
- Attached once at initialization
- Persistent throughout application lifecycle

**Dynamic Elements (created during runtime):**
- `.platform-item-remove` (favorites and hidden lists)
- `.cropper-group-toggle` and `.cropper-platform-toggle input`
- Re-attached whenever parent container is re-rendered
- Created in: `updateFavoritesList()`, `updateHiddenList()`, cropper rendering functions

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-24  
**Status:** Complete