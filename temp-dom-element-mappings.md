# Filter Change Handler to DOM Element Mappings

**Generated:** 2026-07-24  
**Purpose:** Complete handler-to-element mapping reference for Vista filter change handlers  
**Source:** Consolidated from bf-vx29t (DOM tracing) and bf-40knx (selector mapping)

## Overview

This document provides a comprehensive mapping of each filter change handler to its corresponding DOM element(s), including selector types, attachment locations, and relevant context.

## Handlers with Order Reset Impact

### 1. toggleHidden(pid)
- **Function:** Toggles platform visibility (hide/show)
- **Event:** click
- **DOM Elements:** 
  - `.platform-item-remove` buttons within `#hiddenPlatformsList`
  - `[data-action="toggle-hidden"]` in `#cardContextMenu`
- **Selector Types:** querySelectorAll (dynamic), attribute selector
- **Attachment Lines:** 8029-8031 (hidden list), 9689-9692 (context menu)
- **Guard:** `guardWrapperWithRender` (includes re-render)
- **Dynamic Creation:** Buttons created in `updateHiddenList()` (lines 8021-8027)

### 2. toggleFavorite(pid)
- **Function:** Toggles platform favorite status
- **Event:** click
- **DOM Elements:**
  - `.platform-item-remove` buttons within `#favoritesList`
  - `[data-action="toggle-favorite"]` in `#cardContextMenu`
- **Selector Types:** querySelectorAll (dynamic), attribute selector
- **Attachment Lines:** 8007-8009 (favorites), 9693-9696 (context menu)
- **Guard:** `guardWrapper` (basic protection)
- **Dynamic Creation:** Buttons created in `updateFavoritesList()` (lines 7999-8005)

### 3. toggleWhatIfMode()
- **Function:** Toggles "What If" mode for simulating missing metadata tags
- **Event:** click
- **DOM Element:** `#whatIfToggleBtn`
- **Selector Type:** getElementById
- **Attachment Line:** 8334
- **Element Definition Line:** 464
- **Guard:** `isSmartOrdering()` check + `queueFilterOperation()`

### 4. applyWhatIfChanges()
- **Function:** Applies What If mode changes (disables selected metadata tags)
- **Event:** click
- **DOM Element:** `#whatIfApply`
- **Selector Type:** getElementById
- **Attachment Line:** 8220

### 5. importPreferences(e)
- **Function:** Imports user preferences from JSON file
- **Event:** change
- **DOM Element:** `#importPrefsInput` (dynamically created)
- **Selector Type:** getElementById
- **Attachment Line:** 6831
- **Trigger Element:** `#importPrefsBtn` (line 6827-6828)

## Handlers Without Order Reset Impact

### 6. Metadata Filter Handler
- **Function:** Filters metadata tags table
- **Event:** input
- **DOM Element:** `#metadataFilterInput`
- **Selector Type:** getElementById
- **Attachment Line:** 3991
- **Element Definition Line:** 3989
- **Handler:** Anonymous inline function calling `renderMetadataTable()`

### 7. Command Palette Filter Handler
- **Function:** Filters command palette options
- **Event:** input
- **DOM Element:** `#commandInput`
- **Selector Type:** getElementById
- **Attachment Line:** 9085
- **Element Definition Line:** 9084
- **Handler:** `filterCommands(e)`

### 8. Heatmap Sort Dropdown Handler
- **Function:** Sorts sitemap heatmap results
- **Event:** change
- **DOM Element:** `#heatmapSort`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 332
- **Element Definition Line:** 218
- **Handler:** `handleHeatmapSort()`

### 9. Badge Style Select Handler
- **Function:** Updates badge preview in modal
- **Event:** change
- **DOM Element:** `#badgeStyleSelect`
- **Selector Type:** getElementById (via `$` helper)
- **Attachment Line:** 296
- **Element Definition Line:** 169
- **Handler:** `updateBadgePreview()`

## OG Generator Filter-Related Handlers

### 10-23. OG Generator Controls
Multiple handlers for OG generator canvas updates:

| # | Handler Function | DOM Element | Event | Selector Type | Attachment Line | Element Def Line |
|---|------------------|-------------|-------|---------------|-----------------|-----------------|
| 10 | `handleBgTypeChange()` | `#oggenBgType` | change | getElementId ($) | 310 | 186 |
| 11 | `updateOggenCanvas()` | `#oggenBgColor` | input | getElementId ($) | 311 | 187 |
| 12 | `updateOggenCanvas()` | `#oggenGradientStart` | input | getElementId ($) | 312 | 189 |
| 13 | `updateOggenCanvas()` | `#oggenGradientEnd` | input | getElementId ($) | 313 | 190 |
| 14 | `updateOggenCanvas()` | `#oggenGradientDir` | change | getElementId ($) | 314 | 191 |
| 15 | `handleBgImageUpload()` | `#oggenBgImageInput` | change | getElementId ($) | 315 | 193 |
| 16 | `updateOggenCanvas()` | `#oggenBgImageSize` | change | getElementId ($) | 316 | 194 |
| 17 | `updateOggenCanvas()` | `#oggenTitle` | input | getElementId ($) | 317 | 196 |
| 18 | `updateOggenCanvas()` | `#oggenSubtitle` | input | getElementId ($) | 318 | 197 |
| 19 | `updateOggenCanvas()` | `#oggenFont` | change | getElementId ($) | 319 | 198 |
| 20 | `updateOggenCanvas()` | `#oggenTextColor` | input | getElementId ($) | 320 | 199 |
| 21 | `handleLogoPosChange()` | `#oggenLogoPos` | change | getElementId ($) | 321 | 200 |
| 22 | `handleLogoUpload()` | `#oggenLogoInput` | change | getElementId ($) | 322 | 201 |
| 23 | `updateOggenCanvas()` | `#oggenLogoSize` | input | getElementId ($) | 323 | 202 |

## Cropper Toggle Handlers

### 24. Cropper Group Toggle Handler
- **Function:** Updates which platform group overlays are visible in cropper
- **Event:** change
- **DOM Element:** `.cropper-group-toggle` (checkboxes)
- **Selector Type:** querySelectorAll (dynamic)
- **Attachment Line:** 3480
- **Dynamic Creation:** Checkboxes created dynamically in cropper rendering
- **Handler Logic:** Updates child platform checkboxes, then calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

### 25. Cropper Platform Toggle Handler
- **Function:** Updates which individual platform overlays are visible in cropper
- **Event:** change
- **DOM Element:** `.cropper-platform-toggle input` (checkboxes)
- **Selector Type:** querySelectorAll (dynamic)
- **Attachment Line:** 3496
- **Dynamic Creation:** Checkboxes created dynamically in cropper rendering
- **Handler Logic:** Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`

## Helper Functions

### $() Helper Function
```javascript
function $(id) {
  return document.getElementById(id);
}
```
Used as a shortcut for `getElementById` throughout the codebase.

### Guard Wrappers
- **`guardWrapper`**: Basic guard for operations that don't need immediate re-rendering
- **`guardWrapperWithRender`**: Extended guard that triggers re-render after operation completes
- **`isSmartOrdering()`**: Direct check before executing operations
- **`queueFilterOperation()`**: Queue operations for deferred execution during smart ordering

## Event Type Distribution

**Click Events (4):**
- toggleHidden: `.platform-item-remove` (line 8029)
- toggleFavorite: `.platform-item-remove` (line 8007)
- toggleWhatIfMode: `#whatIfToggleBtn` (line 8334)
- applyWhatIfChanges: `#whatIfApply` (line 8220)

**Change Events (11):**
- importPreferences: `#importPrefsInput` (line 6831)
- handleHeatmapSort: `#heatmapSort` (line 332)
- updateBadgePreview: `#badgeStyleSelect` (line 296)
- handleBgTypeChange: `#oggenBgType` (line 310)
- updateOggenCanvas: `#oggenGradientDir` (line 314)
- handleBgImageUpload: `#oggenBgImageInput` (line 315)
- updateOggenCanvas: `#oggenBgImageSize` (line 316)
- updateOggenCanvas: `#oggenFont` (line 319)
- handleLogoPosChange: `#oggenLogoPos` (line 321)
- handleLogoUpload: `#oggenLogoInput` (line 322)
- Cropper group toggle: `.cropper-group-toggle` (line 3480)
- Cropper platform toggle: `.cropper-platform-toggle input` (line 3496)

**Input Events (9):**
- Metadata filter: `#metadataFilterInput` (line 3991)
- Command palette filter: `#commandInput` (line 9085)
- updateOggenCanvas: `#oggenBgColor` (line 311)
- updateOggenCanvas: `#oggenGradientStart` (line 312)
- updateOggenCanvas: `#oggenGradientEnd` (line 313)
- updateOggenCanvas: `#oggenTitle` (line 317)
- updateOggenCanvas: `#oggenSubtitle` (line 318)
- updateOggenCanvas: `#oggenTextColor` (line 320)
- updateOggenCanvas: `#oggenLogoSize` (line 323)

## Static vs Dynamic Elements

**Static Elements (defined at file initialization):**
- All `#` prefixed IDs using `getElementById` or `$` helper
- Attached once at initialization
- Persistent throughout application lifecycle
- Examples: `#whatIfToggleBtn`, `#commandInput`, `#metadataFilterInput`

**Dynamic Elements (created during runtime):**
- `.platform-item-remove` (favorites and hidden lists)
- `.cropper-group-toggle` and `.cropper-platform-toggle input`
- Re-attached whenever parent container is re-rendered
- Created in: `updateFavoritesList()`, `updateHiddenList()`, cropper rendering functions

## DOM Data Attributes

The application uses consistent data attributes for DOM element identification:
- **`data-pid`**: Platform identifier (used on cards, buttons, and list items)
- **`data-platform`**: Platform identifier on cropper checkboxes
- **`data-group`**: Group identifier on cropper group toggles
- **`data-action`**: Action identifier for context menu items

## Files Referenced

- `/home/coding/vista/src/public/app.js` - Main application logic and event attachments
- `/home/coding/vista/src/public/index.html` - HTML structure and element definitions
- `/home/coding/vista/src/public/filter-guard-wrapper.js` - Guard wrapper implementations
- `/home/coding/vista/src/public/guard-utils.js` - Guard utility functions

## Related Documentation

- `docs/bf-vx29t-filter-change-handler-dom-tracing.md` - Detailed tracing with HTML structure
- `docs/bf-40knx-filter-change-handler-dom-selectors.md` - Precise selector mappings with line numbers
- `notes/bf-ff3bk-filter-change-handlers.md` - Complete list of identified filter change handlers

---
**Total Handlers Mapped:** 25  
**Total DOM Elements:** 30+ (including OG generator controls)  
**Status:** Complete and verified