# Filter-Change Patterns in Other Files (Beyond app.js)

## Overview
This document extends the filter-change patterns search beyond app.js to other relevant JavaScript files in the vista workspace.

## Files Analyzed

### 1. `/home/coding/vista/src/public/filter-guard-wrapper.js`

**Purpose**: Provides reusable wrapper utilities for filter change handlers that prevent conflicts with smart ordering.

#### Pattern 1: Basic Guard Wrapper (lines 47-62)
```javascript
function guardWrapper(handlerName, handlerFunction) {
  // Check if smart ordering is active
  if (typeof isSmartOrdering === 'function' && isSmartOrdering()) {
    // Queue the operation for later execution
    if (typeof queueFilterOperation === 'function') {
      queueFilterOperation(handlerFunction, handlerName);
      if (typeof DEBUG_SMART_ORDERING !== 'undefined' && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active - operation queued`);
      }
    }
    return;
  }

  // Execute the handler logic immediately
  handlerFunction();
}
```

**Usage Example** (lines 35-45):
```javascript
function toggleHidden(pid) {
  guardWrapper('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
  });
}
```

#### Pattern 2: Guard Wrapper with Render (lines 88-107)
```javascript
function guardWrapperWithRender(handlerName, handlerFunction) {
  return guardWrapper(handlerName, () => {
    handlerFunction();

    // Set filter guard and clear it after render
    if ('isFilterOperation' in globalThis || typeof isFilterOperation !== 'undefined') {
      isFilterOperation = true;
      setTimeout(() => { isFilterOperation = false; }, 0);
    }

    // Clear smart ordering active flag
    if ('isSmartOrderingActive' in globalThis || typeof isSmartOrderingActive !== 'undefined') {
      isSmartOrderingActive = false;
      if ('DEBUG_SMART_ORDERING' in globalThis && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active flag CLEARED (user manual override)`);
      }
    }
  });
}
```

**Usage Example** (lines 75-86):
```javascript
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

### 2. `/home/coding/vista/src/public/guard-utils.js`

**Purpose**: Centralized guard functions that check various application states for cross-module usage.

#### Pattern 1: isSmartOrdering Guard (lines 39-46)
```javascript
function isSmartOrdering() {
  const prefs = window.platformPrefs || {};
  const userPreference = prefs.smartOrdering !== false; // Default is true
  const runtimeState = window.isSmartOrderingActive || false;

  return userPreference && runtimeState;
}
```

**Usage Example** (lines 30-35):
```javascript
if (window.isSmartOrdering()) {
  // Skip operation or handle differently during smart ordering
  return;
}
```

#### Pattern 2: isFilterOperationInProgress Guard (lines 78-80)
```javascript
function isFilterOperationInProgress() {
  return window.isFilterOperation || false;
}
```

#### Pattern 3: Global Exposure (lines 82-85)
```javascript
window.isSmartOrdering = isSmartOrdering;
window.isSmartOrderingEnabled = isSmartOrderingEnabled;
window.isFilterOperationInProgress = isFilterOperationInProgress;
```

### 3. `/home/coding/vista/src/public/app-features.js`

**Purpose**: Core application features including platform preference management.

#### Pattern 1: Platform Prefs Access (lines 34-35)
```javascript
function getPlatformPrefs() {
  return window.platformPrefs || { favorites: new Set(), hidden: new Set(), columnCount: 3 };
}
```

#### Pattern 2: Context Menu Handler (lines 440-451)
```javascript
case 'hide':
  hidePlatform(pid);
  break;
```

#### Pattern 3: hidePlatform Function (lines 471-486)
```javascript
function hidePlatform(pid) {
  const prefs = getPlatformPrefs();
  if (prefs.hidden.has(pid)) {
    prefs.hidden.delete(pid);
    showToast(`Showing ${PLATFORM_NAMES?.[pid] || pid} again`, 2000);
  } else {
    prefs.hidden.add(pid);
    showToast(`Hid ${PLATFORM_NAMES?.[pid] || pid}`, 2000);
  }
  savePlatformPrefs();
  // Re-render to apply changes
  const currentData = getCurrentData();
  if (currentData && typeof window.renderPreviewsInternal === 'function') {
    window.renderPreviewsInternal(currentData);
  }
}
```

### 4. `/home/coding/vista/src/public/app.js` (Extended Documentation)

**Purpose**: Main application logic with multiple filter-change patterns.

#### Pattern 1: toggleHidden with Guard Wrapper (lines 7977-7988)
```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData); // Re-render to apply hiding
  });
}
```

#### Pattern 2: Metadata Filter Input (lines 3989-3994)
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

#### Pattern 3: Command Palette Filter (lines 9177-9192)
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
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

#### Pattern 4: Command Palette Input Listener (line 9085)
```javascript
input.addEventListener('input', filterCommands);
```

#### Pattern 5: Various Change Event Listeners
- Line 296: `badgeStyleSelect?.addEventListener('change', updateBadgePreview)`
- Line 332: `heatmapSort?.addEventListener('change', handleHeatmapSort)`
- Line 3481: `groupCb.addEventListener('change', (e) => { ... })`
- Line 3497: `cb.addEventListener('change', () => { ... })`
- Line 6813: `snippetFramework?.addEventListener('change', generateCodeSnippet)`
- Line 6831: `importPrefsInput?.addEventListener('change', importPreferences)`
- Line 8207: `cb.addEventListener('change', () => { ... })`

### 5. `/home/coding/vista/src/public/platform-frames.js`

**Purpose**: Platform frame management and filtering operations.

#### Pattern 1: Array Filter Operations (line 3160)
```javascript
.filter(([_, frame]) => frame.hasThemeSupport)
```

#### Pattern 2: Platform ID Filtering (line 3515)
```javascript
return Object.keys(PLATFORM_FRAMES).filter(id => id !== 'generic');
```

## Summary

### Filter-Change Handler Categories

1. **Guard Wrappers** - Protective wrappers that prevent conflicts during smart ordering
2. **Input Listeners** - Event listeners for text input filtering
3. **Change Listeners** - Event listeners for select/checkbox change events
4. **Platform Visibility** - Functions that manage platform show/hide state
5. **Array Filtering** - Standard JavaScript array filter operations

### Key Integration Points

1. **guard-utils.js** exposes global functions via `window` object
2. **filter-guard-wrapper.js** provides reusable wrappers imported by other modules
3. **app-features.js** manages platform preferences and context menus
4. **app.js** contains the main filter implementation with guard wrappers
5. **platform-frames.js** performs array filtering operations

### Architecture Pattern

```
filter-guard-wrapper.js (guard wrappers)
       ↓
app.js (toggleHidden, metadataFilter)
       ↓
guard-utils.js (global guards)
       ↓
app-features.js (hidePlatform, context menu)
```

## Files NOT Containing Filter-Change Patterns

The following files were searched but contained no filter-change patterns:
- `/home/coding/vista/src/public/client-side-diff.js`
- `/home/coding/vista/src/public/platform-diff.js`
- `/home/coding/vista/src/public/frame-renderer.js`

## Related Documentation

- **bead bf-35h7f**: Comprehensive addEventListener filter patterns in app.js
- **bead bf-d9reu**: Filter-change hook patterns in app.js
- **bead bf-3lc34**: Comprehensive addEventListener filter patterns and custom patterns search results
