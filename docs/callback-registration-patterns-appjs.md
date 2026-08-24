# Callback Registration Patterns in app.js - Phase 3 Report

## Overview
This document catalogs all callback registration patterns found in `/home/coding/vista/src/public/app.js`, with specific focus on filter-related registrations.

## 1. Direct Event Listener Registrations

### 1.1 Filter Input Registration (Line 4416-4423)
```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```
**Pattern**: Direct `addEventListener` on filter input with inline callback

### 1.2 Platform Toggle Registrations (Lines 3908-3930)
```javascript
// Group header toggle
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
  });
});

// Individual platform toggle
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```
**Pattern**: QuerySelectorAll + forEach with `change` event listeners

### 1.3 Theme Toggle Registration (Line 605)
```javascript
document.getElementById('globalThemeToggle')?.addEventListener('click', toggleGlobalTheme);
```
**Pattern**: Optional chaining with direct function reference

### 1.4 Card Context Toggle Registration (Lines 2187, 2308, 2391)
```javascript
const contextToggle = header.querySelector('.card-context-toggle');
contextToggle.addEventListener('click', () => toggleCardContext(pid, data));
```
**Pattern**: Dynamic element selection + inline arrow callback

### 1.5 Card Theme Toggle Registration (Lines 2190-2192, 2311-2313)
```javascript
const themeToggle = header.querySelector('.card-theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
}
```
**Pattern**: Conditional registration with null check

## 2. Context Menu Callbacks

### 2.1 Card Context Menu Registration (Lines 2216, 2316, 2232)
```javascript
existingCard.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, group.id, data));
card.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, groupId, data));
```
**Pattern**: Direct contextmenu event binding with data closure

## 3. Drag-and-Drop Callbacks

### 3.1 Drag and Drop Initialization (Lines 10029-10038)
```javascript
function initCardDragAndDrop() {
  const cards = document.querySelectorAll('.platform-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);
  });
}
```
**Pattern**: Batch registration with named handler functions

## 4. Observer Pattern Callbacks

### 4.1 MutationObserver for Theme Changes (Lines 608-637)
```javascript
const themeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-theme') {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (globalTheme !== newTheme) {
        globalTheme = newTheme;
        Object.keys(cardContextState).forEach(pid => {
          if (cardContextState[pid] && PLATFORMS_WITH_THEME.includes(pid)) {
            cardContextState[pid].theme = newTheme;
          }
        });
      }
    }
  });
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});
```
**Pattern**: MutationObserver with callback observing attribute changes

## 5. Frame Theme Subscription Callbacks

### 5.1 Frame Theme Subscription (Lines 169-201, 2282, 2391, 2430)
```javascript
function subscribeFrameToTheme(platformId) {
  const platformFrames = document.querySelectorAll(`[data-platform="${platformId}"].context-frame`);
  if (platformFrames.length === 0) return;
  
  const latestFrame = platformFrames[platformFrames.length - 1];
  const frameId = latestFrame.id;
  
  if (typeof window.ThemeSubscription === 'undefined') return;
  
  try {
    window.ThemeSubscription.subscribePlatformFrame(platformId, frameId);
    console.log(`[subscribeFrameToTheme] Subscribed frame ${frameId} for platform ${platformId}`);
  } catch (error) {
    console.error(`[subscribeFrameToTheme] Failed to subscribe frame ${frameId}:`, error);
  }
}
```
**Pattern**: API-based subscription with external callback system

## 6. Filter Operation Guard Pattern

### 6.1 Guard Wrapper Pattern (Lines 8350, 8460 in app.js; filter-guard-wrapper.js)
```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();
    isSmartOrderingActive = false;
  });
}

function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData);
  });
}
```
**Pattern**: Higher-order function wrapper that queues operations during smart ordering

### 6.2 Filter Operation Queue Pattern (Lines 8562-8564, 8626-8628, 8745-8747)
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
**Pattern**: Guard flag pattern with async cleanup

## 7. What-If Mode Toggle Callbacks

### 7.1 What-If Mode Registration (Line 8816)
```javascript
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode);
```
**Pattern**: Optional chaining with direct function reference

### 7.2 What-If Panel Toggle Callbacks (Lines 8688-8692)
```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
  });
});
```
**Pattern**: QuerySelectorAll + forEach with change listeners

## 8. Command Palette Filter Callbacks

### 8.1 Command Palette Input Filter (Lines 9567-9568)
```javascript
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```
**Pattern**: Multiple event types on same element

### 8.2 Filter Commands Function (Lines 9659-9669)
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;
  
  if (!query) {
    renderCommands(COMMANDS);
    return;
  }
  
  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.keywords?.some(k => k.toLowerCase().includes(query))
  );
  
  renderCommands(filtered);
}
```
**Pattern**: Event handler with filter logic and re-render

## 9. Platform Preference List Callbacks

### 9.1 Favorites List Removal Callbacks (Lines 8489-8491)
```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```
**Pattern**: Dynamic button generation with inline callbacks

### 9.2 Hidden List Removal Callbacks (Lines 8511-8513)
```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```
**Pattern**: Same pattern as favorites, different handler

## 10. Editor Filter Callbacks

### 10.1 Editor Input Listeners (Lines 7281-7284)
```javascript
const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
editorInputs.forEach(input => {
  input.addEventListener('input', handleEditorInput);
});
```
**Pattern**: Batch registration with named handler

### 10.2 Code Snippet Framework Selector (Line 7295)
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```
**Pattern**: Optional chaining with direct function reference

## 11. Initialization Patterns

### 11.1 Main DOMContentLoaded Handler (Lines 585-602)
```javascript
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchPlatformConfig();
  loadRecents();
  initOgGenerator();
  // ... URL parameter handling
  restoreHashState();
});
```
**Pattern**: Single global initialization with multiple init calls

### 11.2 Editor DOMContentLoaded Handler (Lines 7279-7309)
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
  editorInputs.forEach(input => {
    input.addEventListener('input', handleEditorInput);
  });
  // ... multiple button registrations
});
```
**Pattern**: Separate DOMContentLoaded for editor-specific setup

## Summary of Filter-Related Callbacks

| Callback Type | Line Numbers | Pattern | Filter-Related |
|---|---|---|---|
| Filter input listener | 4419 | Direct addEventListener | ✅ Yes |
| Platform toggles | 3908-3930 | QuerySelectorAll + forEach | ✅ Yes |
| Theme toggle | 605 | Optional chaining + direct ref | ❌ No |
| Card context toggle | 2187, 2308, 2391 | Query selector + inline | ❌ No |
| Card theme toggle | 2190-2192, 2311-2313 | Conditional + inline | ❌ No |
| Context menu | 2216, 2316, 2232 | Direct addEventListener | ❌ No |
| Drag and drop | 10029-10038 | Batch registration | ❌ No |
| MutationObserver | 608-637 | Observer pattern | ❌ No |
| Frame theme subscription | 169-201, 2282, 2391, 2430 | API-based subscription | ❌ No |
| Guard wrapper | 8350, 8460 | Higher-order function | ✅ Yes |
| Filter operation queue | 8562-8564, 8626-8628, 8745-8747 | Guard flag pattern | ✅ Yes |
| What-If mode | 8816, 8688-8692 | Optional + batch | ✅ Yes |
| Command palette filter | 9567-9568, 9659-9669 | Input listener | ✅ Yes |
| Platform preference lists | 8489-8491, 8511-8513 | Dynamic generation | ✅ Yes |
| Editor inputs | 7281-7284, 7295 | Batch + direct | ❌ No |

## Filter-Related Callback Registration Patterns

1. **Direct Input Filter**: `addEventListener('input', callback)` on filter input elements
2. **Platform Visibility Toggles**: Batch registration with querySelectorAll + change events
3. **Guard Wrapper Pattern**: Higher-order functions that queue/filter operations
4. **Operation Queue Pattern**: Flag-based guarding with async cleanup
5. **What-If Mode**: Toggle-based filtering with tag management
6. **Command Palette**: Real-time input filtering with regex-based matching
7. **Platform Preferences**: Dynamic button generation with inline callbacks

## External Filter Guard System

The `filter-guard-wrapper.js` module provides:
- `guardWrapper(handlerName, handlerFunction)`: Basic queueing wrapper
- `guardWrapperWithRender(handlerName, handlerFunction)`: Extended wrapper with render guards

These wrappers check `isSmartOrdering()` and queue operations via `queueFilterOperation()` when smart ordering is active.
