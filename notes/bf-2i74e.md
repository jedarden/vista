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

### 6. `/home/coding/vista/src/public/image-diff.js`

**Purpose**: Image comparison component with mode toggles and slider controls.

#### Pattern 1: Mode Toggle Buttons (lines 76-99)
```javascript
// Add event listeners for mode toggles
const toggles = header.querySelectorAll('.image-diff-toggle');
toggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const selectedMode = toggle.dataset.mode;

    // Update active state
    toggles.forEach(t => t.classList.remove('active'));
    toggle.classList.add('active');

    // Show/hide views
    if (selectedMode === 'side-by-side') {
      overlayView.classList.add('hidden');
      sideBySideView.classList.remove('hidden');
    } else if (selectedMode === 'slider') {
      overlayView.classList.remove('hidden');
      overlayView.classList.add('slider-mode');
      overlayView.classList.remove('overlay-mode');
    } else {
      overlayView.classList.remove('hidden');
      overlayView.classList.remove('slider-mode');
      overlayView.classList.add('overlay-mode');
    }
  });
});
```

#### Pattern 2: Slider Interaction Events (lines 157-197)
```javascript
const startDrag = (e) => {
  isDragging = true;
  e.preventDefault();
  slider.classList.add('active');
  sliderContainer.style.cursor = 'grabbing';
};

const onDrag = (e) => {
  if (!isDragging) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  updateSlider(clientX);
};

const endDrag = () => {
  isDragging = false;
  slider.classList.remove('active');
  sliderContainer.style.cursor = '';
};

// Mouse events
sliderHandle.addEventListener('mousedown', startDrag);
sliderContainer.addEventListener('mousedown', (e) => {
  if (e.target !== sliderHandle) {
    isDragging = true;
    updateSlider(e.clientX);
  }
});

// Touch events
sliderHandle.addEventListener('touchstart', startDrag);
sliderContainer.addEventListener('touchstart', (e) => {
  if (e.target !== sliderHandle) {
    isDragging = true;
    updateSlider(e.touches[0].clientX);
  }
});

document.addEventListener('mousemove', onDrag);
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchmove', onDrag, { passive: false });
document.addEventListener('touchend', endDrag);
```

### 7. `/home/coding/vista/src/public/frames-theme.js`

**Purpose**: Theme management for platform frames with toggle functionality.

#### Pattern 1: Frame Theme Toggle Function (lines 427-440)
```javascript
function toggleFrameTheme(frameId, fallbackTheme = 'dark') {
  const currentTheme = getFrameTheme(frameId);
  let newTheme;

  if (currentTheme === THEME_TYPES.AUTO) {
    newTheme = fallbackTheme;
  } else if (currentTheme === THEME_TYPES.DARK) {
    newTheme = THEME_TYPES.LIGHT;
  } else {
    newTheme = THEME_TYPES.DARK;
  }

  setFrameTheme(frameId, newTheme);
}
```

### 8. `/home/coding/vista/src/public/frame-renderer.js`

**Purpose**: Frame rendering with theme toggle integration.

#### Pattern 1: Frame Theme Toggle Integration (lines 347-349)
```javascript
function toggleFrameTheme(frameId, fallbackTheme = 'dark') {
  if (typeof FrameTheme !== 'undefined' && FrameTheme.toggleFrameTheme) {
    FrameTheme.toggleFrameTheme(frameId, fallbackTheme);
  }
}
```

### 9. `/home/coding/vista/src/public/safe-zone.js`

**Purpose**: Safe zone calculation for image cropping with visibility toggles.

#### Pattern 1: Visibility Percentage Calculation (lines 146-152)
```javascript
function calculateVisiblePercentage(crop, imgW, imgH) {
  if (!imgW || !imgH) return 100;
  const rect = calculateCropRect(crop, imgW, imgH);
  if (!rect) return 100;
  const fraction = (rect.w * rect.h) / (imgW * imgH);
  return Math.max(0, Math.min(100, Math.round(fraction * 100)));
}
```

**Note**: This is referenced as "the per-platform 'X% visible' figure shown beside each platform toggle" (line 138).

## Summary

### Files Analyzed (Total: 9)

1. `/home/coding/vista/src/public/filter-guard-wrapper.js` - Guard wrappers for filter handlers
2. `/home/coding/vista/src/public/guard-utils.js` - Centralized guard functions
3. `/home/coding/vista/src/public/app-features.js` - Platform preferences and context menus
4. `/home/coding/vista/src/public/app.js` - Main application logic (extended documentation)
5. `/home/coding/vista/src/public/platform-frames.js` - Frame management with array filtering
6. `/home/coding/vista/src/public/image-diff.js` - Image comparison with toggle modes
7. `/home/coding/vista/src/public/frames-theme.js` - Frame theme toggle functionality
8. `/home/coding/vista/src/public/frame-renderer.js` - Frame rendering with theme integration
9. `/home/coding/vista/src/public/safe-zone.js` - Safe zone calculations for visibility toggles

### Filter-Change Handler Categories

1. **Guard Wrappers** - Protective wrappers that prevent conflicts during smart ordering
2. **Input Listeners** - Event listeners for text input filtering  
3. **Change Listeners** - Event listeners for select/checkbox change events
4. **Platform Visibility** - Functions that manage platform show/hide state
5. **Array Filtering** - Standard JavaScript array filter operations
6. **Mode Toggles** - Toggle buttons for switching between display modes
7. **Theme Toggles** - Theme switching functionality for frames
8. **Slider Interactions** - Drag-based filter controls with mouse/touch events
9. **Visibility Calculations** - Percentage calculations for toggle indicators

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
       ↓
platform-frames.js (array filtering)
       ↓
image-diff.js (mode toggles, slider controls)
       ↓
frames-theme.js (theme toggles)
       ↓
frame-renderer.js (theme integration)
       ↓
safe-zone.js (visibility calculations)
```

### New Pattern Discoveries

This search revealed filter-change patterns in several files not previously documented:

1. **image-diff.js** - Complex toggle system for comparison modes (overlay, side-by-side, slider) with sophisticated mouse/touch event handling
2. **frames-theme.js** - Theme toggle functionality that switches between dark/light/auto modes
3. **frame-renderer.js** - Integration point for theme toggles in rendered frames
4. **safe-zone.js** - Supporting calculations for visibility toggle percentages

These patterns extend beyond simple input/change listeners to include:
- Multi-state toggle systems (3 modes: overlay, side-by-side, slider)
- Touch/mouse unified event handling
- Theme state management with fallback logic
- Percentage-based visibility indicators

## Files NOT Containing Filter-Change Patterns

The following files were searched but contained no filter-change patterns:
- `/home/coding/vista/src/public/client-side-diff.js`
- `/home/coding/vista/src/public/platform-diff.js`
- `/home/coding/vista/src/public/test-dark-mode.js` (test script, not runtime code)
- `/home/coding/vista/src/public/verify-card-only-browser.js` (verification script)

## Search Methodology

This analysis covered all JavaScript files in the `/home/coding/vista/src/public/` directory (excluding node_modules). Search patterns included:

1. **addEventListener patterns** - Looking for 'input', 'change', 'click' events
2. **Toggle functions** - Functions named with 'toggle', 'show', 'hide', 'filter'
3. **Guard wrappers** - Protective patterns around filter operations  
4. **Event emitters** - Custom event dispatching for filter changes
5. **State management** - Functions that modify filter/visibility state

The search revealed both documented patterns (from previous beads) and new patterns in image comparison, theme management, and frame rendering components.

## Related Documentation

- **bead bf-35h7f**: Comprehensive addEventListener filter patterns in app.js
- **bead bf-d9reu**: Filter-change hook patterns in app.js
- **bead bf-3lc34**: Comprehensive addEventListener filter patterns and custom patterns search results
