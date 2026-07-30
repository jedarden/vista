# Filter Change Handler Reference
**Comprehensive reference for all change event handlers in app.js**

Generated: 2026-07-24
Source: /home/coding/vista/src/public/app.js

---

## Overview

This document combines three separate analyses:
- **Change listener locations** - where `addEventListener('change', ...)` calls are made
- **Handler function definitions** - where the handler functions are defined
- **DOM element references** - which DOM elements the handlers are attached to

Total handlers documented: **14**
- Named function handlers: 9
- Inline arrow function handlers: 3
- Dynamic handlers (attached to multiple elements): 3

---

## Named Function Handlers

### updateBadgePreview
- **Listener Line:** 296
- **Function Definition:** Line 4765
- **DOM Element:** `#badgeStyleSelect` (getElementById)
- **Element Variable:** `badgeStyleSelect` (defined at line 169)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  badgeStyleSelect?.addEventListener('change', updateBadgePreview);
  ```

### handleBgTypeChange
- **Listener Line:** 310
- **Function Definition:** Line 5106
- **DOM Element:** `#oggenBgType` (getElementById)
- **Element Variable:** `oggenBgType` (defined at line 186)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  oggenBgType?.addEventListener('change', handleBgTypeChange);
  ```

### updateOggenCanvas (Multiple Attachments)
- **Listener Lines:** 314, 316, 319 (change events), plus 311-313, 317-318, 320, 323 (input events)
- **Function Definition:** Line 5156
- **Event Types:** 'input' and 'change'
- **DOM Elements:**
  1. `#oggenGradientDir` (line 314, change event)
  2. `#oggenBgImageSize` (line 316, change event)
  3. `#oggenFont` (line 319, change event)
  4. Plus 7 more elements with 'input' events: `#oggenBgColor`, `#oggenGradientStart`, `#oggenGradientEnd`, `#oggenTitle`, `#oggenSubtitle`, `#oggenTextColor`, `#oggenLogoSize`
- **Code:**
  ```javascript
  oggenGradientDir?.addEventListener('change', updateOggenCanvas);
  oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
  oggenFont?.addEventListener('change', updateOggenCanvas);
  // ... plus 7 input event listeners
  ```

### handleBgImageUpload
- **Listener Line:** 315
- **Function Definition:** Line 5117
- **DOM Element:** `#oggenBgImageInput` (getElementById)
- **Element Variable:** `oggenBgImageInput` (defined at line 193)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
  ```

### handleLogoPosChange
- **Listener Line:** 321
- **Function Definition:** Line 5133
- **DOM Element:** `#oggenLogoPos` (getElementById)
- **Element Variable:** `oggenLogoPos` (defined at line 200)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  oggenLogoPos?.addEventListener('change', handleLogoPosChange);
  ```

### handleLogoUpload
- **Listener Line:** 322
- **Function Definition:** Line 5140
- **DOM Element:** `#oggenLogoInput` (getElementById)
- **Element Variable:** `oggenLogoInput` (defined at line 201)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  oggenLogoInput?.addEventListener('change', handleLogoUpload);
  ```

### handleHeatmapSort
- **Listener Line:** 332
- **Function Definition:** Line 6101
- **DOM Element:** `#heatmapSort` (getElementById)
- **Element Variable:** `heatmapSort` (defined at line 218)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  heatmapSort?.addEventListener('change', handleHeatmapSort);
  ```

### generateCodeSnippet
- **Listener Line:** 6813
- **Function Definition:** Line 6853
- **DOM Element:** `#snippetFramework` (getElementById)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
  ```

### importPreferences
- **Listener Line:** 6831
- **Function Definition:** Line 8057
- **DOM Element:** `#importPrefsInput` (getElementById)
- **Event Type:** 'change'
- **Code:**
  ```javascript
  document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
  ```

---

## Inline Arrow Function Handlers

### .cropper-group-toggle handler
- **Listener Line:** 3481 (inline definition)
- **Function Definition:** Line 3481 (inline arrow function)
- **DOM Elements:** `.cropper-group-toggle` (querySelectorAll - multiple elements)
- **Element Source:** Dynamically generated HTML at line 3454
- **HTML Pattern:**
  ```html
  <input type="checkbox" class="cropper-group-toggle" data-group="${group.id}" />
  ```
- **Event Type:** 'change'
- **Full Code:**
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

### .cropper-platform-toggle handler
- **Listener Line:** 3497 (inline definition)
- **Function Definition:** Line 3497 (inline arrow function)
- **DOM Elements:** `.cropper-platform-toggle input` (querySelectorAll - multiple elements)
- **Element Source:** Dynamically generated HTML at line 3464
- **HTML Pattern:**
  ```html
  <label class="cropper-platform-toggle">
    <input type="checkbox" data-platform="${pid}" />
  </label>
  ```
- **Event Type:** 'change'
- **Full Code:**
  ```javascript
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
    cb.addEventListener('change', () => {
      updateEnabledPlatforms();
      updateCropperOverlay();
      syncGroupToggles(groups);
    });
  });
  ```

### .what-if-toggle handler
- **Listener Line:** 8207 (inline definition)
- **Function Definition:** Line 8207 (inline arrow function)
- **DOM Elements:** `.what-if-toggle input` within `#whatIfPanel` (querySelectorAll - multiple elements)
- **Element Source:** Dynamically generated HTML at lines 8178-8194
- **HTML Pattern:**
  ```html
  <label class="what-if-toggle">
    <input type="checkbox" data-tag="og.title" checked /> og:title
  </label>
  ```
- **Event Type:** 'change'
- **Full Code:**
  ```javascript
  panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) {
        disabledTags.add(cb.dataset.tag);
      } else {
        disabledTags.delete(cb.dataset.tag);
      }
      // Update hash to reflect disabled tags
      updateHash();
    });
  });
  ```

---

## Quick Reference Table

| Handler Name | Listener Line | Function Line | DOM Element | Event Type |
|--------------|---------------|---------------|-------------|------------|
| updateBadgePreview | 296 | 4765 | #badgeStyleSelect | change |
| handleBgTypeChange | 310 | 5106 | #oggenBgType | change |
| updateOggenCanvas | 311-323 | 5156 | Multiple (10 elements) | input/change |
| handleBgImageUpload | 315 | 5117 | #oggenBgImageInput | change |
| handleLogoPosChange | 321 | 5133 | #oggenLogoPos | change |
| handleLogoUpload | 322 | 5140 | #oggenLogoInput | change |
| handleHeatmapSort | 332 | 6101 | #heatmapSort | change |
| generateCodeSnippet | 6813 | 6853 | #snippetFramework | change |
| importPreferences | 6831 | 8057 | #importPrefsInput | change |
| .cropper-group-toggle | 3481 | 3481 (inline) | .cropper-group-toggle | change |
| .cropper-platform-toggle | 3497 | 3497 (inline) | .cropper-platform-toggle input | change |
| .what-if-toggle | 8207 | 8207 (inline) | .what-if-toggle input | change |

---

## DOM Element Selection Patterns

### 1. $() helper pattern (Lines 127+)
```javascript
const $ = (sel) => document.querySelector(sel);
```
- Usage: `$('#badgeStyleSelect')` → `document.querySelector('#badgeStyleSelect')`
- Equivalent to `getElementById()` for ID-only selectors
- Used for static DOM elements defined at startup

### 2. document.getElementById() pattern
- Direct ID lookup for elements not pre-cached with $ helper
- More explicit about ID-only selection
- Example: `document.getElementById('snippetFramework')`

### 3. document.querySelectorAll() pattern
- Used for dynamically generated elements
- Attach handlers to all matching elements via forEach loop
- Example: `document.querySelectorAll('.cropper-group-toggle')`

### 4. Optional chaining pattern
- `element?.addEventListener()` gracefully handles missing elements
- No error if element doesn't exist in DOM

---

## Handler Function Definitions

All named functions use traditional function declarations (not const/let/var assignments):

```javascript
function updateBadgePreview() { ... }          // Line 4765
function handleBgTypeChange() { ... }           // Line 5106
function updateOggenCanvas() { ... }            // Line 5156
function handleBgImageUpload(e) { ... }         // Line 5117
function handleLogoPosChange() { ... }          // Line 5133
function handleLogoUpload(e) { ... }            // Line 5140
function handleHeatmapSort() { ... }            // Line 6101
function generateCodeSnippet() { ... }          // Line 6853
function importPreferences(e) { ... }           // Line 8057
```

---

## Dynamic Handlers

Three handlers use `querySelectorAll` with `forEach` to attach to multiple dynamically generated elements:

1. **.cropper-group-toggle** (line 3481) - Platform group checkboxes
2. **.cropper-platform-toggle** (line 3497) - Individual platform checkboxes  
3. **.what-if-toggle** (line 8207) - "What if" analysis tag toggles

These handlers are defined inline as arrow functions and operate on `e.target.dataset` attributes.

---

## Summary Statistics

- **Total handlers:** 14
- **Named function handlers:** 9
- **Inline arrow function handlers:** 3
- **Handlers using $() helper:** 7
- **Handlers using document.getElementById():** 2
- **Handlers using document.querySelectorAll():** 3
- **Dynamic handlers (attached to multiple elements):** 3
- **Static handlers (attached to single element):** 9

---

**End of Filter Change Handler Reference**