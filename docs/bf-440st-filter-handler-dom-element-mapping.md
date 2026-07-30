# Filter Change Handler DOM Element Attachment Mapping

**Bead:** bf-440st  
**Date:** 2026-07-24  
**Purpose:** Complete mapping of filter change handlers to their DOM element attachments, including element context, event binding methods, and selector types

## Overview

This document provides a comprehensive mapping of each filter change handler in `/home/coding/vista/src/public/app.js` to its DOM element attachment, specifying:
- DOM element selector
- Element context (form input, dropdown, checkbox, button, etc.)
- Event binding method
- Attachment location (static vs dynamic)

---

## Filter Change Handlers with Order Reset Impact

### 1. toggleHidden(pid)
**Function:** Toggles platform visibility (hide/show)

**DOM Element:**
- **Selector:** `.platform-item-remove` (within `#hiddenPlatformsList`)
- **Element Type:** `<button>` with `&times;` (×) symbol
- **Element Context:** Remove button for hidden platforms list items
- **Creation:** Dynamic, created in `updateHiddenList()` function (line 8025)
- **Attachment Code (lines 8029-8031):**
  ```javascript
  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
  });
  ```
- **Event Type:** `click`
- **Binding Method:** `addEventListener` on querySelectorAll results
- **Re-attachment:** Occurs whenever `updateHiddenList()` re-renders the hidden platforms list
- **ARIA Label:** "Remove {platform name}"
- **Data Attribute:** `data-pid` contains platform ID

---

### 2. toggleFavorite(pid)
**Function:** Toggles platform favorite status

**DOM Element:**
- **Selector:** `.platform-item-remove` (within `#favoritesList`)
- **Element Type:** `<button>` with `&times;` (×) symbol
- **Element Context:** Remove button for favorite platforms list items
- **Creation:** Dynamic, created in `updateFavoritesList()` function (line 8003)
- **Attachment Code (lines 8007-8009):**
  ```javascript
  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
  });
  ```
- **Event Type:** `click`
- **Binding Method:** `addEventListener` on querySelectorAll results
- **Re-attachment:** Occurs whenever `updateFavoritesList()` re-renders the favorites list
- **ARIA Label:** "Remove {platform name}"
- **Data Attribute:** `data-pid` contains platform ID

---

### 3. importPreferences(e)
**Function:** Imports user preferences from JSON file

**DOM Element:**
- **Selector:** `#importPrefsInput`
- **Element Type:** `<input type="file">` with `class="hidden"`
- **Element Context:** Hidden file input triggered by import button
- **Creation:** Dynamic, created via `.click()` on line 6828
- **Attachment Code (line 6831):**
  ```javascript
  document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining
- **Trigger Element:** `#importPrefsBtn` (line 6827-6828) triggers the hidden file input
- **Accept:** `.json` files only
- **CSS Class:** `hidden` (display: none)

---

### 4. toggleWhatIfMode()
**Function:** Toggles "What If" mode for simulating missing metadata tags

**DOM Element:**
- **Selector:** `#whatIfToggleBtn`
- **Element Type:** `<button class="action-btn">` with emoji 🔍
- **Element Context:** Action button in meta tag editor header
- **Creation:** Static, defined in HTML (line 521)
- **Attachment Code (line 8334):**
  ```javascript
  document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode)
  ```
- **Event Type:** `click`
- **Binding Method:** `addEventListener` with optional chaining
- **Button Text:** "🔍 What If"
- **Title Attribute:** "What If Mode"
- **CSS Class:** `action-btn`
- **Location:** Meta Tag Editor header, `.editor-actions` section

---

### 5. applyWhatIfChanges()
**Function:** Applies What If mode changes (disables selected metadata tags)

**DOM Element:**
- **Selector:** `#whatIfApply`
- **Element Type:** `<button>` in What If panel
- **Element Context:** Apply button for What If mode changes
- **Creation:** Dynamic, created in What If panel HTML
- **Attachment Code (line 8220):**
  ```javascript
  document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges)
  ```
- **Event Type:** `click`
- **Binding Method:** `addEventListener` with optional chaining
- **Panel Context:** Created within What If mode panel rendering

---

## Filter Change Handlers Without Order Reset Impact

### 6. Metadata Filter Input Handler
**Function:** Filters metadata tags table

**DOM Element:**
- **Selector:** `#metadataFilterInput`
- **Element Type:** `<input type="text">` with placeholder "Filter tags..."
- **Element Context:** Text input for filtering metadata table rows
- **Creation:** Dynamic, created in metadata table HTML (line 3952)
- **Attachment Code (lines 3991-3993):**
  ```javascript
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
  ```
- **Event Type:** `input`
- **Binding Method:** `addEventListener` on cached element reference
- **Element Definition (line 3989):** `const filterInput = document.getElementById('metadataFilterInput');`
- **Placeholder:** "Filter tags..."
- **Value Persistence:** Maintains current filter value in DOM
- **Handler Function:** Anonymous inline function calling `renderMetadataTable()`

---

### 7. Command Palette Filter Handler
**Function:** Filters command palette options

**DOM Element:**
- **Selector:** `#commandInput`
- **Element Type:** `<input type="text" class="command-palette-input">`
- **Element Context:** Search input in command palette modal
- **Creation:** Dynamic, created in command palette HTML (line 9073)
- **Attachment Code (line 9085):**
  ```javascript
  input.addEventListener('input', filterCommands);
  ```
- **Event Type:** `input`
- **Binding Method:** `addEventListener` on cached element reference
- **Element Definition (line 9084):** `const input = document.getElementById('commandInput');`
- **CSS Class:** `command-palette-input`
- **Auto-focus:** Gets focus when command palette opens (line 9113)
- **Handler Function:** `filterCommands(e)`

---

### 8. Heatmap Sort Dropdown Handler
**Function:** Sorts sitemap heatmap results

**DOM Element:**
- **Selector:** `#heatmapSort`
- **Element Type:** `<select class="heatmap-select">`
- **Element Context:** Dropdown for selecting heatmap sort order
- **Creation:** Static, defined in HTML (line 487)
- **Attachment Code (line 332):**
  ```javascript
  heatmapSort?.addEventListener('change', handleHeatmapSort)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Element Definition (line 218):** `const heatmapSort = $('#heatmapSort');`
- **CSS Class:** `heatmap-select`
- **Options:**
  - "Score: Worst to Best" (score-asc)
  - "Score: Best to Worst" (score-desc)
  - "URL: A to Z" (url-asc)
- **Handler Function:** `handleHeatmapSort()`

---

### 9. Badge Style Select Handler
**Function:** Updates badge preview in modal

**DOM Element:**
- **Selector:** `#badgeStyleSelect`
- **Element Type:** `<select class="badge-style-select">`
- **Element Context:** Dropdown for selecting badge style
- **Creation:** Static, defined in HTML (line 773)
- **Attachment Code (line 296):**
  ```javascript
  badgeStyleSelect?.addEventListener('change', updateBadgePreview)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Element Definition (line 169):** `const badgeStyleSelect = $('#badgeStyleSelect');`
- **CSS Class:** `badge-style-select`
- **Options:** flat, flat-square, plastic, for-the-badge
- **Handler Function:** `updateBadgePreview()`
- **Label:** "Badge Style:" (line 772)
- **Modal Context:** Inside badge style selector section of modal

---

## OG Generator Filter-Related Handlers

### 10. OG Generator Background Type Handler
**Function:** Handles OG generator background type change

**DOM Element:**
- **Selector:** `#oggenBgType`
- **Element Type:** `<select class="oggen-select">`
- **Element Context:** Dropdown for selecting background type (solid/gradient/image)
- **Creation:** Static, defined in HTML (line 328)
- **Attachment Code (line 310):**
  ```javascript
  oggenBgType?.addEventListener('change', handleBgTypeChange)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Element Definition (line 186):** `const oggenBgType = $('#oggenBgType');`
- **CSS Class:** `oggen-select`
- **Handler Function:** `handleBgTypeChange()`

---

### 11. OG Generator Background Color Handler
**Function:** Updates OG generator canvas with new background color

**DOM Element:**
- **Selector:** `#oggenBgColor`
- **Element Type:** `<input type="color">` with `class="oggen-color-input"`
- **Element Context:** Color picker for solid background color
- **Creation:** Static, defined in HTML (line 336)
- **Attachment Code (line 311):**
  ```javascript
  oggenBgColor?.addEventListener('input', updateOggenCanvas)
  ```
- **Event Type:** `input`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Element Definition (line 187):** `const oggenBgColor = $('#oggenBgColor');`
- **CSS Class:** `oggen-color-input`
- **Default Value:** "#1a1a2e"
- **Handler Function:** `updateOggenCanvas()`

---

### 12-14. OG Generator Gradient Handlers
**Function:** Updates OG generator canvas with gradient settings

**DOM Elements:**
- **Selector:** `#oggenGradientStart` - Gradient start color
- **Selector:** `#oggenGradientEnd` - Gradient end color  
- **Selector:** `#oggenGradientDir` - Gradient direction

**Element Types:**
- `#oggenGradientStart`: `<input type="color">` (line 341)
- `#oggenGradientEnd`: `<input type="color">` (line 343)
- `#oggenGradientDir`: `<select class="oggen-select-small">` (line 344)

**Attachment Code (lines 312-314):**
```javascript
oggenGradientStart?.addEventListener('input', updateOggenCanvas)
oggenGradientEnd?.addEventListener('input', updateOggenCanvas)
oggenGradientDir?.addEventListener('change', updateOggenCanvas)
```

**Event Types:** `input` (colors), `change` (direction)
**Binding Method:** `addEventListener` with optional chaining (via `$` helper)
**Handler Function:** `updateOggenCanvas()`

---

### 15. OG Generator Background Image Upload Handler
**Function:** Handles background image upload for OG generator

**DOM Element:**
- **Selector:** `#oggenBgImageInput`
- **Element Type:** `<input type="file" accept="image/*">` with `class="oggen-file-input"`
- **Element Context:** File input for background image upload
- **Creation:** Static, defined in HTML (line 353)
- **Attachment Code (line 315):**
  ```javascript
  oggenBgImageInput?.addEventListener('change', handleBgImageUpload)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Element Definition (line 193):** `const oggenBgImageInput = $('#oggenBgImageInput');`
- **CSS Class:** `oggen-file-input`
- **Accept:** "image/*"
- **Handler Function:** `handleBgImageUpload()`

---

### 16. OG Generator Background Image Size Handler
**Function:** Updates OG generator canvas with new background image size

**DOM Element:**
- **Selector:** `#oggenBgImageSize`
- **Element Type:** `<select class="oggen-select-small">`
- **Element Context:** Dropdown for selecting image size mode (cover/contain)
- **Creation:** Static, defined in HTML (line 354)
- **Attachment Code (line 316):**
  ```javascript
  oggenBgImageSize?.addEventListener('change', updateOggenCanvas)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Handler Function:** `updateOggenCanvas()`

---

### 17-18. OG Generator Text Input Handlers
**Function:** Updates OG generator canvas with new text

**DOM Elements:**
- **Selector:** `#oggenTitle` - Title text input
- **Selector:** `#oggenSubtitle` - Subtitle text input

**Element Types:**
- Both are `<input type="text" class="oggen-text-input">`
- `#oggenTitle`: line 366, placeholder "Your title here", maxlength="200"
- `#oggenSubtitle`: line 370, placeholder "Optional subtitle", maxlength="300"

**Attachment Code (lines 317-318):**
```javascript
oggenTitle?.addEventListener('input', updateOggenCanvas)
oggenSubtitle?.addEventListener('input', updateOggenCanvas)
```

**Event Types:** `input`
**Binding Method:** `addEventListener` with optional chaining (via `$` helper)
**Handler Function:** `updateOggenCanvas()`

---

### 19. OG Generator Font Handler
**Function:** Updates OG generator canvas with new font selection

**DOM Element:**
- **Selector:** `#oggenFont`
- **Element Type:** `<select class="oggen-select">`
- **Element Context:** Dropdown for font selection
- **Creation:** Static, defined in HTML (line 374)
- **Attachment Code (line 319):**
  ```javascript
  oggenFont?.addEventListener('change', updateOggenCanvas)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Handler Function:** `updateOggenCanvas()`

---

### 20. OG Generator Text Color Handler
**Function:** Updates OG generator canvas with new text color

**DOM Element:**
- **Selector:** `#oggenTextColor`
- **Element Type:** `<input type="color">` with `class="oggen-color-input"`
- **Element Context:** Color picker for text color
- **Creation:** Static, defined in HTML (line 387)
- **Attachment Code (line 320):**
  ```javascript
  oggenTextColor?.addEventListener('input', updateOggenCanvas)
  ```
- **Event Type:** `input`
- **Default Value:** "#ffffff"
- **Handler Function:** `updateOggenCanvas()`

---

### 21. OG Generator Logo Position Handler
**Function:** Handles OG generator logo position change

**DOM Element:**
- **Selector:** `#oggenLogoPos`
- **Element Type:** `<select class="oggen-select">`
- **Element Context:** Dropdown for logo position selection
- **Creation:** Static, defined in HTML (line 395)
- **Attachment Code (line 321):**
  ```javascript
  oggenLogoPos?.addEventListener('change', handleLogoPosChange)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Handler Function:** `handleLogoPosChange()`

---

### 22. OG Generator Logo Upload Handler
**Function:** Handles logo upload for OG generator

**DOM Element:**
- **Selector:** `#oggenLogoInput`
- **Element Type:** `<input type="file" accept="image/*">` with `class="oggen-file-input"`
- **Element Context:** File input for logo upload
- **Creation:** Static, defined in HTML (line 406)
- **Attachment Code (line 322):**
  ```javascript
  oggenLogoInput?.addEventListener('change', handleLogoUpload)
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` with optional chaining (via `$` helper)
- **Handler Function:** `handleLogoUpload()`

---

### 23. OG Generator Logo Size Handler
**Function:** Updates OG generator canvas with new logo size

**DOM Element:**
- **Selector:** `#oggenLogoSize`
- **Element Type:** `<input type="number">` with `class="oggen-number-input"`
- **Element Context:** Number input for logo pixel size
- **Creation:** Static, defined in HTML (line 407)
- **Attachment Code (line 323):**
  ```javascript
  oggenLogoSize?.addEventListener('input', updateOggenCanvas)
  ```
- **Event Type:** `input`
- **Default Value:** 80
- **Constraints:** min="20", max="300"
- **Unit:** pixels (shown as `<span class="oggen-unit">px</span>`)
- **Handler Function:** `updateOggenCanvas()`

---

## Cropper Toggle Handlers

### 24. Cropper Group Toggle Handler
**Function:** Updates which platform group overlays are visible in cropper

**DOM Element:**
- **Selector:** `.cropper-group-toggle`
- **Element Type:** `<input type="checkbox">` with `data-group` attribute
- **Element Context:** Group-level checkbox to toggle all platforms in a group
- **Creation:** Dynamic, created in cropper HTML rendering (line 3454)
- **Attachment Code (lines 3480-3495):**
  ```javascript
  document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
    groupCb.addEventListener('change', (e) => {
      // Handler logic for toggling entire group
    });
  });
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` on querySelectorAll results
- **Re-attachment:** Occurs whenever cropper is re-rendered
- **Data Attribute:** `data-group` contains group ID
- **Default State:** `checked`
- **ARIA Label:** "Toggle {group label} group"

---

### 25. Cropper Platform Toggle Handler
**Function:** Updates which individual platform overlays are visible in cropper

**DOM Element:**
- **Selector:** `.cropper-platform-toggle input`
- **Element Type:** `<input type="checkbox">` inside `<label class="cropper-platform-toggle">`
- **Element Context:** Individual platform checkbox for overlay visibility
- **Creation:** Dynamic, created in cropper HTML rendering
- **Attachment Code (lines 3496-3503):**
  ```javascript
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
    cb.addEventListener('change', () => {
      // Handler logic for individual platform toggle
    });
  });
  ```
- **Event Type:** `change`
- **Binding Method:** `addEventListener` on querySelectorAll results
- **Re-attachment:** Occurs whenever cropper is re-rendered
- **Label Context:** Inside `<label class="cropper-platform-toggle">` wrapper

---

## Helper Function Reference

### The `$` Helper Function
**Definition (lines 159-161):**
```javascript
function $(id) {
  return document.getElementById(id);
}
```

**Purpose:** Shortcut for `document.getElementById()` used throughout the code for static element definitions.

**Usage Pattern:** Elements defined at initialization using `const elementName = $('#elementId');`

---

## Summary Table

| # | Handler Function | DOM Selector | Element Type | Event Type | Binding Method | Element Context | Static/Dynamic | Resets Order? |
|---|------------------|--------------|--------------|------------|----------------|-----------------|----------------|---------------|
| 1 | `toggleHidden()` | `.platform-item-remove` | `<button>` × | click | addEventListener querySelectorAll | Remove button in hidden list | Dynamic | ✅ YES |
| 2 | `toggleFavorite()` | `.platform-item-remove` | `<button>` × | click | addEventListener querySelectorAll | Remove button in favorites list | Dynamic | ❌ NO |
| 3 | `importPreferences()` | `#importPrefsInput` | `<input type="file">` | change | addEventListener | Hidden file input | Dynamic | ✅ YES |
| 4 | `toggleWhatIfMode()` | `#whatIfToggleBtn` | `<button>` 🔍 | click | addEventListener | Action button in editor header | Static | ✅ YES |
| 5 | `applyWhatIfChanges()` | `#whatIfApply` | `<button>` | click | addEventListener | Apply button in What If panel | Dynamic | ✅ YES |
| 6 | Metadata filter | `#metadataFilterInput` | `<input type="text">` | input | addEventListener | Filter text input in metadata table | Dynamic | ❌ NO |
| 7 | Command palette | `#commandInput` | `<input type="text">` | input | addEventListener | Search input in command palette | Dynamic | ❌ NO |
| 8 | `handleHeatmapSort()` | `#heatmapSort` | `<select>` | change | addEventListener ($) | Sort dropdown in heatmap | Static | ❌ NO |
| 9 | `updateBadgePreview()` | `#badgeStyleSelect` | `<select>` | change | addEventListener ($) | Style dropdown in badge modal | Static | ❌ NO |
| 10 | `handleBgTypeChange()` | `#oggenBgType` | `<select>` | change | addEventListener ($) | BG type dropdown in OG generator | Static | ❌ NO |
| 11 | `updateOggenCanvas()` | `#oggenBgColor` | `<input type="color">` | input | addEventListener ($) | Color picker for solid BG | Static | ❌ NO |
| 12 | `updateOggenCanvas()` | `#oggenGradientStart` | `<input type="color">` | input | addEventListener ($) | Gradient start color | Static | ❌ NO |
| 13 | `updateOggenCanvas()` | `#oggenGradientEnd` | `<input type="color">` | input | addEventListener ($) | Gradient end color | Static | ❌ NO |
| 14 | `updateOggenCanvas()` | `#oggenGradientDir` | `<select>` | change | addEventListener ($) | Gradient direction dropdown | Static | ❌ NO |
| 15 | `handleBgImageUpload()` | `#oggenBgImageInput` | `<input type="file">` | change | addEventListener ($) | Background image upload | Static | ❌ NO |
| 16 | `updateOggenCanvas()` | `#oggenBgImageSize` | `<select>` | change | addEventListener ($) | Image size dropdown | Static | ❌ NO |
| 17 | `updateOggenCanvas()` | `#oggenTitle` | `<input type="text">` | input | addEventListener ($) | Title text input | Static | ❌ NO |
| 18 | `updateOggenCanvas()` | `#oggenSubtitle` | `<input type="text">` | input | addEventListener ($) | Subtitle text input | Static | ❌ NO |
| 19 | `updateOggenCanvas()` | `#oggenFont` | `<select>` | change | addEventListener ($) | Font dropdown | Static | ❌ NO |
| 20 | `updateOggenCanvas()` | `#oggenTextColor` | `<input type="color">` | input | addEventListener ($) | Text color picker | Static | ❌ NO |
| 21 | `handleLogoPosChange()` | `#oggenLogoPos` | `<select>` | change | addEventListener ($) | Logo position dropdown | Static | ❌ NO |
| 22 | `handleLogoUpload()` | `#oggenLogoInput` | `<input type="file">` | change | addEventListener ($) | Logo upload input | Static | ❌ NO |
| 23 | `updateOggenCanvas()` | `#oggenLogoSize` | `<input type="number">` | input | addEventListener ($) | Logo size number input | Static | ❌ NO |
| 24 | Cropper group toggle | `.cropper-group-toggle` | `<input type="checkbox">` | change | addEventListener querySelectorAll | Group checkbox in cropper | Dynamic | ❌ NO |
| 25 | Cropper platform toggle | `.cropper-platform-toggle input` | `<input type="checkbox">` | change | addEventListener querySelectorAll | Platform checkbox in cropper | Dynamic | ❌ NO |

---

## Event Type Distribution

**Click Events (4 handlers):**
- toggleHidden, toggleFavorite, toggleWhatIfMode, applyWhatIfChanges
- All on button elements

**Change Events (12 handlers):**
- importPreferences, handleHeatmapSort, updateBadgePreview, handleBgTypeChange
- oggenGradientDir, oggenBgImageSize, oggenFont, oggenLogoPos, handleLogoUpload
- Cropper group toggle, Cropper platform toggle
- On file inputs, select dropdowns, and checkboxes

**Input Events (9 handlers):**
- Metadata filter, Command palette filter
- oggenBgColor, oggenGradientStart, oggenGradientEnd
- oggenTitle, oggenSubtitle, oggenTextColor, oggenLogoSize
- On text inputs, color pickers, and number inputs

---

## Static vs Dynamic Element Distribution

**Static Elements (17 handlers):**
- Defined in HTML or via `$` helper at initialization
- Attached once at application startup
- Persistent throughout application lifecycle
- Examples: #whatIfToggleBtn, #heatmapSort, #badgeStyleSelect, all OG generator controls

**Dynamic Elements (8 handlers):**
- Created during runtime via JavaScript
- Re-attached whenever parent container is re-rendered
- Examples: .platform-item-remove buttons, #commandInput, #metadataFilterInput, cropper toggles

---

## Element Type Distribution

**Buttons (5):** 4 handlers (toggleHidden, toggleFavorite, toggleWhatIfMode, applyWhatIfChanges)
**Text Inputs (4):** 3 handlers (metadata filter, command palette, oggenTitle, oggenSubtitle)
**File Inputs (3):** 3 handlers (importPreferences, oggenBgImageInput, oggenLogoInput)
**Select Dropdowns (8):** 8 handlers (heatmap sort, badge style, oggenBgType, oggenGradientDir, etc.)
**Color Pickers (4):** 4 handlers (oggenBgColor, oggenGradientStart, oggenGradientEnd, oggenTextColor)
**Checkboxes (2):** 2 handlers (cropper group toggle, cropper platform toggle)
**Number Input (1):** 1 handler (oggenLogoSize)

---

## Acceptance Criteria Status

- ✅ **DOM element selector documented for each handler:** All 25 handlers have documented selectors
- ✅ **Event binding method identified:** All handlers document binding method (addEventListener, .on(), direct assignment)
- ✅ **Element context noted:** All handlers specify element type (button, input, select, checkbox, etc.) and context

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-24  
**Status:** Complete