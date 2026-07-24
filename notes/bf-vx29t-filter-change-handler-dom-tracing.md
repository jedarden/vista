# Filter Change Handler to DOM Element Tracing

**Generated:** 2026-07-24  
**Bead ID:** bf-vx29t  
**Task:** Trace each filter change handler to its DOM element

## Overview

This document traces each identified filter change handler back to its DOM element attachment point. For each handler, we identify the addEventListener call (or equivalent binding mechanism) and the DOM element selector.

## Tracing Methodology

For each handler, the tracing process involved:
1. Starting from the handler function definition
2. Finding the addEventListener call that attaches the handler to a DOM element
3. Identifying the DOM element selector (ID, class, querySelector, etc.)
4. Locating the element's HTML definition
5. Documenting the code location and line numbers

## Core Filter Change Handlers

### 1. `toggleFavorite(pid)` - Toggle Favorite Handler

**Handler Function:** `toggleFavorite(pid)`  
**Event:** `click` event  
**DOM Elements:** 
1. `.platform-item-remove` buttons within `#favoritesList`
2. `.context-menu-item` with `data-action="toggle-favorite"` in `#cardContextMenu`

#### Location 1: Favorites Panel Remove Buttons

**Tracing Path:**
1. Handler defined at: `app.js:7867`
2. UI update function `updateFavoritesList()` at: `app.js:7990`
3. Event attachment in `updateFavoritesList()` at: `app.js:8007-8009`

**Event Attachment Code:**
```javascript
// app.js:8007-8009
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```

**DOM Selector:** `.platform-item-remove` (CSS class selector)  
**Parent Container:** `#favoritesList` (ID selector)  
**Element Type:** `<button>` with `data-pid` attribute  
**Code Location:** app.js:8007-8009

**Element HTML Structure:**
```html
<button class="platform-item-remove" data-pid="${pid}" 
  aria-label="Remove ${PLATFORM_NAMES[pid]}">&times;</button>
```

**Guard Wrapper:** The handler uses `guardWrapper` for smart ordering protection:
```javascript
// app.js:7868
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    // Handler logic
  });
}
```

#### Location 2: Context Menu

**Tracing Path:**
1. Context menu creation at: `app.js:9693-9696`
2. Event delegation through `data-action` attribute
3. Handler dispatched via context menu action handler

**DOM Selector:** `[data-action="toggle-favorite"]` (attribute selector)  
**Parent Container:** `#cardContextMenu` (dynamically created)  
**Element Type:** `<div>` with `role="menuitem"`  
**Code Location:** app.js:9693-9696, 9701-9703

**Element HTML Structure:**
```html
<div class="context-menu-item" role="menuitem" tabindex="-1" data-action="toggle-favorite">
  <span class="context-menu-icon" aria-hidden="true">&#11088;</span>
  <span>Star / unstar</span>
</div>
```

---

### 2. `toggleHidden(pid)` - Toggle Hidden Handler

**Handler Function:** `toggleHidden(pid)`  
**Event:** `click` event  
**DOM Elements:**
1. `.platform-item-remove` buttons within `#hiddenPlatformsList`
2. `.context-menu-item` with `data-action="toggle-hidden"` in `#cardContextMenu`

#### Location 1: Hidden Platforms Panel Remove Buttons

**Tracing Path:**
1. Handler defined at: `app.js:7977`
2. UI update function `updateHiddenList()` at: `app.js:8012`
3. Event attachment in `updateHiddenList()` at: `app.js:8029-8031`

**Event Attachment Code:**
```javascript
// app.js:8029-8031
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

**DOM Selector:** `.platform-item-remove` (CSS class selector)  
**Parent Container:** `#hiddenPlatformsList` (ID selector)  
**Element Type:** `<button>` with `data-pid` attribute  
**Code Location:** app.js:8029-8031

**Element HTML Structure:**
```html
<button class="platform-item-remove" data-pid="${pid}" 
  aria-label="Remove ${PLATFORM_NAMES[pid]}">&times;</button>
```

**Guard Wrapper:** The handler uses `guardWrapperWithRender` for smart ordering protection:
```javascript
// app.js:7978
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    // Handler logic including renderPreviews(currentData)
  });
}
```

#### Location 2: Context Menu

**Tracing Path:**
1. Context menu creation at: `app.js:9689-9692`
2. Event delegation through `data-action` attribute
3. Handler dispatched via context menu action handler

**DOM Selector:** `[data-action="toggle-hidden"]` (attribute selector)  
**Parent Container:** `#cardContextMenu` (dynamically created)  
**Element Type:** `<div>` with `role="menuitem"`  
**Code Location:** app.js:9689-9692, 9701-9703

**Element HTML Structure:**
```html
<div class="context-menu-item" role="menuitem" tabindex="-1" data-action="toggle-hidden">
  <span class="context-menu-icon" aria-hidden="true">&#128065;</span>
  <span>Hide this platform</span>
</div>
```

---

### 3. `toggleWhatIfMode()` - What If Mode Toggle Handler

**Handler Function:** `toggleWhatIfMode()`  
**Event:** `click` event  
**DOM Element:** `#whatIfToggleBtn`

**Tracing Path:**
1. Handler defined at: `app.js:8121`
2. Direct event attachment at: `app.js:8334`

**Event Attachment Code:**
```javascript
// app.js:8334
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```

**DOM Selector:** `#whatIfToggleBtn` (ID selector)  
**Element Type:** `<button class="action-btn">`  
**Code Location:** app.js:8334

**Element HTML Structure:**
```html
<button class="action-btn" id="whatIfToggleBtn" title="What If Mode">🔍 What If</button>
```

**Location:** Action buttons section (header/toolbar area)

**Guard Logic:** The handler uses `isSmartOrdering()` guard and `queueFilterOperation`:
```javascript
// app.js:8121-8152
function toggleWhatIfMode() {
  if (isSmartOrdering()) {
    queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
    return;
  }
  // Rest of handler logic
}
```

---

### 4. `filterCommands(e)` - Command Palette Filter Handler

**Handler Function:** `filterCommands(e)`  
**Event:** `input` event  
**DOM Element:** `#commandInput`

**Tracing Path:**
1. Handler defined at: `app.js:9177`
2. Event attachment at: `app.js:9084-9085

**Event Attachment Code:**
```javascript
// app.js:9084-9085
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**DOM Selector:** `#commandInput` (ID selector)  
**Element Type:** `<input type="text">` with multiple ARIA attributes  
**Code Location:** app.js:9084-9085

**Element HTML Structure:**
```html
<input type="text" class="command-palette-input" id="commandInput"
  role="combobox" aria-expanded="true" aria-autocomplete="list"
  aria-controls="commandResults" aria-activedescendant=""
  placeholder="Type a command or search..." />
```

**Location:** Command palette (modal dialog)

---

### 5. `updateEnabledPlatforms()` - Cropper Platform Toggle Handler

**Handler Function:** `updateEnabledPlatforms()` (plus `updateCropperOverlay()`, `syncGroupToggles()`)  
**Event:** `change` event  
**DOM Element:** `.cropper-platform-toggle input` (checkboxes)

**Tracing Path:**
1. Handler defined at: `app.js:3551`
2. Event attachment at: `app.js:3496-3502`

**Event Attachment Code:**
```javascript
// app.js:3496-3502
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**DOM Selector:** `.cropper-platform-toggle input` (CSS class selector)  
**Element Type:** `<input type="checkbox">` with `data-platform` attribute  
**Code Location:** app.js:3496-3502

**Element HTML Structure:**
```html
<div class="cropper-platform-toggle">
  <input type="checkbox" data-platform="${pid}" ${enabled ? 'checked' : ''} />
  <label>${PLATFORM_NAMES[pid]}</label>
</div>
```

**Location:** Cropper/platform selection modal

---

### 6. Group Toggle Handler - Cropper Group Toggle Handler

**Handler Functions:** Updates child platform checkboxes, then calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`  
**Event:** `change` event  
**DOM Element:** `.cropper-group-toggle` (checkboxes)

**Tracing Path:**
1. Event attachment at: `app.js:3480-3492`
2. Handler logic inline in event callback

**Event Attachment Code:**
```javascript
// app.js:3480-3492
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

**DOM Selector:** `.cropper-group-toggle` (CSS class selector)  
**Element Type:** `<input type="checkbox">` with `data-group` attribute  
**Code Location:** app.js:3480-3492

**Element HTML Structure:**
```html
<input type="checkbox" class="cropper-group-toggle" data-group="${group.id}" />
<label>${group.name}</label>
```

**Location:** Cropper/platform selection modal

---

### 7. Metadata Filter Handler

**Handler Function:** `renderMetadataTable(filter)`  
**Event:** `input` event  
**DOM Element:** `#metadataFilterInput`

**Tracing Path:**
1. Event attachment at: `app.js:3989-3994`

**Event Attachment Code:**
```javascript
// app.js:3989-3994
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**DOM Selector:** `#metadataFilterInput` (ID selector)  
**Element Type:** `<input type="text">`  
**Code Location:** app.js:3989-3994

**Element HTML Structure:**
```html
<input type="text" id="metadataFilterInput" placeholder="Filter tags..." />
```

**Location:** Metadata panel toolbar

---

### 8. Badge Style Control Handler

**Handler Function:** `updateBadgePreview()`  
**Event:** `change` event  
**DOM Element:** `#badgeStyleSelect`

**Tracing Path:**
1. Event attachment at: `app.js:296`

**Event Attachment Code:**
```javascript
// app.js:296
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

**DOM Selector:** `#badgeStyleSelect` (ID selector)  
**Element Type:** `<select>` dropdown  
**Code Location:** app.js:296

**Location:** Badge configuration section

---

### 9. OG Generator Controls - Multiple Filter Handlers

**Handler Functions:** Various OG canvas update functions  
**Events:** Mix of `change` and `input` events  
**DOM Elements:** Multiple OG generator inputs

**Tracing Path:**
1. Event attachments at: `app.js:310-323`

**Event Attachment Code:**
```javascript
// app.js:310-323
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
```

**DOM Elements:**
- `#oggenBgType` - Background type selector
- `#oggenBgColor` - Background color picker
- `#oggenGradientStart` - Gradient start color
- `#oggenGradientEnd` - Gradient end color
- `#oggenGradientDir` - Gradient direction selector
- `#oggenBgImageInput` - Background image upload
- `#oggenBgImageSize` - Background size selector
- `#oggenTitle` - Title text input
- `#oggenSubtitle` - Subtitle text input
- `#oggenFont` - Font selector
- `#oggenTextColor` - Text color picker
- `#oggenLogoPos` - Logo position selector
- `#oggenLogoInput` - Logo upload
- `#oggenLogoSize` - Logo size input

**Element Types:** Mix of `<select>`, `<input type="color">`, `<input type="text">`, `<input type="file">`  
**Code Location:** app.js:310-323

**Location:** OG Generator panel

---

### 10. Select/Clear All Platforms Handlers

**Handler Functions:** Batch check/uncheck all platform toggles  
**Event:** `click` event  
**DOM Elements:** `#selectAllPlatforms`, `#clearAllPlatforms`

**Tracing Path:**
1. Event attachments at: `app.js:3504-3516`

**Event Attachment Code:**
```javascript
// app.js:3504-3516
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});

document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**DOM Selectors:** `#selectAllPlatforms`, `#clearAllPlatforms` (ID selectors)  
**Element Type:** `<button>`  
**Code Location:** app.js:3504-3516

**Location:** Cropper/platform selection modal

---

## Summary Table

| Handler | Event | DOM Element(s) | Element Type | Location | Guard Wrapper |
|---------|-------|----------------|--------------|----------|----------------|
| `toggleFavorite` | click | `.platform-item-remove` in `#favoritesList` | Button | Favorites panel | `guardWrapper` |
| `toggleFavorite` | click | `[data-action="toggle-favorite"]` in `#cardContextMenu` | Context menu item | Card context menu | `guardWrapper` |
| `toggleHidden` | click | `.platform-item-remove` in `#hiddenPlatformsList` | Button | Hidden platforms panel | `guardWrapperWithRender` |
| `toggleHidden` | click | `[data-action="toggle-hidden"]` in `#cardContextMenu` | Context menu item | Card context menu | `guardWrapperWithRender` |
| `toggleWhatIfMode` | click | `#whatIfToggleBtn` | Button | Action buttons section | `isSmartOrdering()` + `queueFilterOperation` |
| `filterCommands` | input | `#commandInput` | Text input | Command palette | None |
| `updateEnabledPlatforms` | change | `.cropper-platform-toggle input` | Checkbox | Cropper modal | None |
| Group toggle handler | change | `.cropper-group-toggle` | Checkbox | Cropper modal | None |
| `renderMetadataTable` | input | `#metadataFilterInput` | Text input | Metadata panel | None |
| `updateBadgePreview` | change | `#badgeStyleSelect` | Select | Badge config | None |
| OG canvas updates | input/change | Multiple OG generator inputs | Various inputs | OG generator panel | None |
| Select all platforms | click | `#selectAllPlatforms` | Button | Cropper modal | None |
| Clear all platforms | click | `#clearAllPlatforms` | Button | Cropper modal | None |

## Guard Logic Context

All filter change handlers that modify platform preferences (`toggleFavorite`, `toggleHidden`, `toggleWhatIfMode`) use guard wrappers or smart ordering checks to prevent conflicts with automated smart ordering operations:

- **`guardWrapper`**: Basic guard for operations that don't need immediate re-rendering
- **`guardWrapperWithRender`**: Extended guard that triggers re-render after operation completes
- **`isSmartOrdering()` check**: Direct check before executing toggleWhatIfMode
- **`queueFilterOperation()`**: Queue operations for deferred execution during smart ordering

These guards check the `isSmartOrderingActive` flag and prevent race conditions between user-initiated filter changes and automated smart ordering operations.

## DOM Data Attributes

The application uses consistent data attributes for DOM element identification:

- **`data-pid`** - Platform identifier (used on cards, buttons, and list items)
- **`data-platform`** - Platform identifier on cropper checkboxes
- **`data-group`** - Group identifier on cropper group toggles
- **`data-action`** - Action identifier for context menu items

These attributes allow reliable DOM element selection and event handling across the application.

## Files Referenced

- `/home/coding/vista/src/public/app.js` - Main application logic and event attachments
- `/home/coding/vista/src/public/index.html` - HTML structure and element definitions
- `/home/coding/vista/src/public/filter-guard-wrapper.js` - Guard wrapper implementations
- `/home/coding/vista/src/public/guard-utils.js` - Guard utility functions

## Related Documentation

- `notes/bf-ff3bk-filter-change-handlers.md` - Complete list of identified filter change handlers
- `notes/bf-2bai4-filter-change-handler-dom-mapping.md` - DOM element mappings

---

**Generated for bead bf-vx29t: Filter change handler to DOM element tracing**  
**Date: 2026-07-24**