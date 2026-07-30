# Filter Change Handler to DOM Element Mapping

## Overview
This document maps each filter change handler in the Vista application to its corresponding DOM element(s).

## Filter Change Handlers

### 1. Metadata Filter Handler

**Handler Function:** `renderMetadataTable(filter)`
**Event:** `input` event
**DOM Element:** `#metadataFilterInput`
**Location:** Metadata panel toolbar
**Code Location:** app.js:3989-3994

```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Element HTML:**
```html
<input type="text" id="metadataFilterInput" placeholder="Filter tags..." />
```

---

### 2. Command Palette Filter Handler

**Handler Function:** `filterCommands(e)`
**Event:** `input` event
**DOM Element:** `#commandInput`
**Location:** Command palette (modal dialog)
**Code Location:** app.js:9084-9085

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Element HTML:**
```html
<input type="text" class="command-palette-input" id="commandInput"
  role="combobox" aria-expanded="true" aria-autocomplete="list"
  aria-controls="commandResults" aria-activedescendant=""
  placeholder="Type a command or search..." />
```

---

### 3. Toggle Favorite Handler

**Handler Function:** `toggleFavorite(pid)`
**Event:** `click` event
**DOM Elements:** 
1. `.platform-item-remove` buttons within `#favoritesList`
2. `.context-menu-item` with `data-action="toggle-favorite"` in `#cardContextMenu`

#### Location 1: Favorites Panel Remove Buttons
**Parent Element:** `#favoritesList`
**Code Location:** app.js:8007-8009

```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```

**Element HTML:**
```html
<button class="platform-item-remove" data-pid="${pid}" 
  aria-label="Remove ${PLATFORM_NAMES[pid]}">&times;</button>
```

#### Location 2: Context Menu
**Parent Element:** `#cardContextMenu` (dynamically created)
**Code Location:** app.js:9693-9696, 9701-9703

```javascript
<div class="context-menu-item" role="menuitem" tabindex="-1" data-action="toggle-favorite">
  <span class="context-menu-icon" aria-hidden="true">&#11088;</span>
  <span>Star / unstar</span>
</div>
```

**Guard Wrapper:** app.js:7868
```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    // Handler logic
  });
}
```

---

### 4. Toggle Hidden Handler

**Handler Function:** `toggleHidden(pid)`
**Event:** `click` event
**DOM Elements:**
1. `.platform-item-remove` buttons within `#hiddenPlatformsList`
2. `.context-menu-item` with `data-action="toggle-hidden"` in `#cardContextMenu`

#### Location 1: Hidden Platforms Panel Remove Buttons
**Parent Element:** `#hiddenPlatformsList`
**Code Location:** app.js:8029-8031

```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

**Element HTML:**
```html
<button class="platform-item-remove" data-pid="${pid}" 
  aria-label="Remove ${PLATFORM_NAMES[pid]}">&times;</button>
```

#### Location 2: Context Menu
**Parent Element:** `#cardContextMenu` (dynamically created)
**Code Location:** app.js:9689-9692, 9701-9703

```javascript
<div class="context-menu-item" role="menuitem" tabindex="-1" data-action="toggle-hidden">
  <span class="context-menu-icon" aria-hidden="true">&#128065;</span>
  <span>Hide this platform</span>
</div>
```

**Guard Wrapper:** app.js:7978
```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    // Handler logic
  });
}
```

---

---

### 5. Cropper Platform Toggle Handler

**Handler Functions:** `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`
**Event:** `change` event
**DOM Elements:** `.cropper-platform-toggle input` (checkboxes with `data-platform` attribute)
**Location:** Cropper/platform selection modal
**Code Location:** app.js:3496-3502

```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Element HTML:**
```html
<div class="cropper-platform-toggle">
  <input type="checkbox" data-platform="${pid}" ${enabled ? 'checked' : ''} />
  <label>${PLATFORM_NAMES[pid]}</label>
</div>
```

---

### 6. Cropper Group Toggle Handler

**Handler Functions:** Updates child platform checkboxes, then calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()`
**Event:** `change` event
**DOM Elements:** `.cropper-group-toggle` (checkboxes with `data-group` attribute)
**Location:** Cropper/platform selection modal
**Code Location:** app.js:3480-3492

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

**Element HTML:**
```html
<input type="checkbox" class="cropper-group-toggle" data-group="${group.id}" />
<label>${group.name}</label>
```

---

### 7. Select/Clear All Platforms Handlers

**Handler Functions:** Batch check/uncheck all platform toggles
**Event:** `click` event
**DOM Elements:** `#selectAllPlatforms`, `#clearAllPlatforms`
**Location:** Cropper/platform selection modal
**Code Location:** app.js:3504-3516

```javascript
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

---

### 8. Badge Style Control Handler

**Handler Function:** `updateBadgePreview()`
**Event:** `change` event
**DOM Element:** `#badgeStyleSelect`
**Location:** Badge configuration section
**Code Location:** app.js:296

```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

---

### 9. OG Generator Controls

**Handler Functions:** Various OG canvas update functions
**Events:** Mix of `change` and `input` events
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

**Location:** OG Generator panel
**Code Location:** app.js:310-323

```javascript
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

---

## Summary Table

| Handler | Event | DOM Element(s) | Element Type | Location | Guard Wrapper |
|---------|-------|----------------|--------------|----------|----------------|
| `renderMetadataTable` | input | `#metadataFilterInput` | Text input | Metadata panel | None |
| `filterCommands` | input | `#commandInput` | Text input | Command palette | None |
| `toggleFavorite` | click | `.platform-item-remove` in `#favoritesList` | Button | Favorites panel | `guardWrapper` |
| `toggleFavorite` | click | `[data-action="toggle-favorite"]` in `#cardContextMenu` | Context menu item | Card context menu | `guardWrapper` |
| `toggleHidden` | click | `.platform-item-remove` in `#hiddenPlatformsList` | Button | Hidden platforms panel | `guardWrapperWithRender` |
| `toggleHidden` | click | `[data-action="toggle-hidden"]` in `#cardContextMenu` | Context menu item | Card context menu | `guardWrapperWithRender` |
| `updateEnabledPlatforms` | change | `.cropper-platform-toggle input` | Checkbox | Cropper modal | None |
| Group toggle handler | change | `.cropper-group-toggle` | Checkbox | Cropper modal | None |
| Select all platforms | click | `#selectAllPlatforms` | Button | Cropper modal | None |
| Clear all platforms | click | `#clearAllPlatforms` | Button | Cropper modal | None |
| `updateBadgePreview` | change | `#badgeStyleSelect` | Select | Badge config | None |
| OG canvas updates | input/change | Multiple OG generator inputs | Various inputs | OG generator panel | None |

## Guard Logic Context

All filter change handlers that modify platform preferences (`toggleFavorite`, `toggleHidden`) use guard wrappers to prevent conflicts with smart ordering operations:

- **`guardWrapper`**: Basic guard for operations that don't need immediate re-rendering
- **`guardWrapperWithRender`**: Extended guard that triggers re-render after operation completes

These guards check the `isSmartOrderingActive` flag and prevent race conditions between user-initiated filter changes and automated smart ordering operations.

## Filter State Management

The application uses global state variables to coordinate filter operations:

```javascript
// Global state variables (app.js)
let isFilterOperation = false;           // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false;       // Track when smart ordering is currently active
let pendingFilterOperations = [];        // Queue for filter operations during smart ordering
```

**Key Functions:**
- `queueFilterOperation(operation, description)` - Queue filter operations during smart ordering
- `processPendingFilterOperations()` - Process queued operations after smart ordering completes
- `isSmartOrdering()` - Check if smart ordering is active

**Related Files:**
- `/home/coding/vista/src/public/filter-guard-wrapper.js` - Guard wrapper implementations
- `/home/coding/vista/src/public/guard-utils.js` - Guard utility functions

## DOM Data Attributes

The application uses consistent data attributes for DOM element identification:

- **`data-pid`** - Platform identifier (used on cards, buttons, and list items)
- **`data-platform`** - Platform identifier on cropper checkboxes
- **`data-group`** - Group identifier on cropper group toggles
- **`data-action`** - Action identifier for context menu items

These attributes allow reliable DOM element selection and event handling across the application.

## Generated

*Generated for bead bf-2bai4: Filter change handler to DOM element mapping*
*Date: 2026-07-24*
