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

## Summary Table

| Handler | Event | DOM Element(s) | Element Type | Location | Guard Wrapper |
|---------|-------|----------------|--------------|----------|----------------|
| `renderMetadataTable` | input | `#metadataFilterInput` | Text input | Metadata panel | None |
| `filterCommands` | input | `#commandInput` | Text input | Command palette | None |
| `toggleFavorite` | click | `.platform-item-remove` in `#favoritesList` | Button | Favorites panel | `guardWrapper` |
| `toggleFavorite` | click | `[data-action="toggle-favorite"]` in `#cardContextMenu` | Context menu item | Card context menu | `guardWrapper` |
| `toggleHidden` | click | `.platform-item-remove` in `#hiddenPlatformsList` | Button | Hidden platforms panel | `guardWrapperWithRender` |
| `toggleHidden` | click | `[data-action="toggle-hidden"]` in `#cardContextMenu` | Context menu item | Card context menu | `guardWrapperWithRender` |

## Guard Logic Context

All filter change handlers that modify platform preferences (`toggleFavorite`, `toggleHidden`) use guard wrappers to prevent conflicts with smart ordering operations:

- **`guardWrapper`**: Basic guard for operations that don't need immediate re-rendering
- **`guardWrapperWithRender`**: Extended guard that triggers re-render after operation completes

These guards check the `isSmartOrderingActive` flag and prevent race conditions between user-initiated filter changes and automated smart ordering operations.

## Generated

*Generated for bead bf-2bai4: Filter change handler to DOM element mapping*
*Date: 2026-07-24*
