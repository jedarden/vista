# Filter-Change Hooks and Custom Patterns in app.js

## Overview
This document documents all filter-change hooks, callback registrations, and custom event patterns found in `/home/coding/vista/src/public/app.js` and related modules.

## Filter Operation Queue System

### Global State Variables (Lines 6279-6281)
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Global Exports (Lines 5046-5056)
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
window.isSmartOrdering = isSmartOrdering;
```

### Queue Functions (Lines 7942-7975)
```javascript
/**
 * Queue a filter operation to be processed after smart ordering completes
 * @param {Function} operation - The filter operation function to execute later
 * @param {string} description - Description of the operation for debugging
 */
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

/**
 * Process pending filter operations after smart ordering completes
 */
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  // Process each pending operation
  const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
  pendingFilterOperations = []; // Clear queue

  operations.forEach(({ operation, description }) => {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```

### Smart Ordering Check Function (Lines 7933-7940)
```javascript
/**
 * Check if smart ordering is both enabled and currently active
 * @returns {boolean} True if smart ordering is BOTH enabled AND currently active
 */
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

## Filter Guard Wrapper System

### Module: `/home/coding/vista/src/public/filter-guard-wrapper.js`

This module provides reusable wrappers for filter change handlers to prevent conflicts with smart ordering.

#### guardWrapper Function (Lines 47-62)
```javascript
/**
 * Guard wrapper for filter handlers that may conflict with smart ordering.
 *
 * This wrapper:
 * 1. Checks if smart ordering is currently active via isSmartOrdering()
 * 2. If active, queues the operation for later execution and returns early
 * 3. If not active, executes the wrapped logic immediately
 * 4. Preserves all existing handler behavior and context
 *
 * @param {string} handlerName - Name of the handler for debugging/logging
 * @param {Function} handlerFunction - The filter operation function to execute
 */
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

#### guardWrapperWithRender Function (Lines 88-107)
```javascript
/**
 * Variant of guardWrapper specifically for handlers that trigger renderPreviews.
 *
 * This version automatically wraps the handler with filter operation guards
 * to prevent order resets during the render.
 */
function guardWrapperWithRender(handlerName, handlerFunction) {
  return guardWrapper(handlerName, () => {
    handlerFunction();

    // Set filter guard and clear it after render
    // Use 'in' check to handle both defined and undefined cases
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

## Filter Handler Functions

### toggleHidden Function (Lines 7977-7988)
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

**Usage in UI:**
```javascript
// Line 8030
btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));

// Line 9797
toggleHidden(pid);
```

### toggleFavorite Function (Lines 7867-7881)
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
    renderPreviews(currentData); // Re-render to apply favoriting

    // Clear smart ordering active flag on manual user action
    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

**Usage in UI:**
```javascript
// Line 8008
btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));

// Line 9800
toggleFavorite(pid);
```

### updateHiddenList Function (Lines 8012-8040)
```javascript
function updateHiddenList() {
  const list = document.getElementById('hiddenPlatformsList');
  if (!list) return;

  if (platformPrefs.hidden.size === 0) {
    list.innerHTML = '<p class="empty-state">No hidden platforms</p>';
    return;
  }

  list.innerHTML = Array.from(platformPrefs.hidden).map(pid => `
    <div class="platform-item">
      <span class="platform-item-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
      <span class="platform-item-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
      <button class="platform-item-remove" data-pid="${pid}" aria-label="Remove ${escHtml(PLATFORM_NAMES[pid] || pid)}">&times;</button>
    </div>
  `).join('');

  // Attach click handlers to remove buttons
  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
  });
}
```

### updateFavoritesList Function (Lines 7990-8010)
```javascript
function updateFavoritesList() {
  const list = document.getElementById('favoritesList');
  if (!list) return;

  if (platformPrefs.favorites.size === 0) {
    list.innerHTML = '<p class="empty-state">No favorites yet</p>';
    return;
  }

  list.innerHTML = Array.from(platformPrefs.favorites).map(pid => `
    <div class="platform-item">
      <span class="platform-item-icon">${PLATFORM_ICONS[pid] || '🌐'}</span>
      <span class="platform-item-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>
      <button class="platform-item-remove" data-pid="${pid}" aria-label="Remove ${escHtml(PLATFORM_NAMES[pid] || pid)}">&times;</button>
    </div>
  `).join('');

  // Attach click handlers to remove buttons
  list.querySelectorAll('.platform-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
  });
}
```

## Metadata Table Filter Pattern

### renderMetadataTable Function (Lines 3941-3991)
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  // ... HTML rendering code ...

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

**Pattern:**
- Function takes a filter parameter
- Filters rows based on tag/value matching
- Re-renders table with filtered results
- Attaches input event listener for live filtering
- No guard wrapper needed (doesn't affect card ordering)

## Smart Ordering Integration

### applySmartOrdering Function (Lines 8744-8850)
```javascript
function applySmartOrdering() {
  // Early exit conditions
  if (!currentData || !platformPrefs.smartOrdering) {
    return;
  }

  // ... page type detection logic ...

  // P2 - Filter operation guard: Skip cardOrder clearing during filter changes
  if (isFilterOperation || isSmartOrdering()) {
    if (DEBUG_SMART_ORDERING) {
      const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
      console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
    }
  } else {
    // Clear cardOrder for groups that weren't manually modified by user
    PLATFORM_GROUPS.forEach((group) => {
      const metadata = platformPrefs.cardOrderMetadata?.[group.id];
      if (!metadata || !metadata.userModified || metadata.modifiedBy !== 'user-drag') {
        delete platformPrefs.cardOrder[group.id];
        // ... metadata cleanup ...
      }
    });
  }

  // ... smart ordering logic ...
}
```

### renderPreviews Function (Lines 1583-1720)
```javascript
function renderPreviews(data) {
  console.log('[renderPreviews] Called with cardOrder available:', platformPrefs.cardOrder);

  // Guard against concurrent renders
  if (isApplyingSmartOrder) {
    console.log('[renderPreviews] Already rendering - queueing with latest data');
    pendingRenderData = data;
    return;
  }

  // ... rendering logic ...

  // P2 - Filter Orphan Bug fix: Properly handle platforms that exist in group.platforms
  // but not in cardOrder (missing platforms get appended in original group order)
}
```

## Change Event Listeners (UI Controls)

### Settings Change Events (Lines 296-332)
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
oggenLogoInput?.addEventListener('change', handleLogoUpload);
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### Import/Export Change Events (Lines 6813-6831)
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

### Checkbox Change Events (Lines 3481-3497, 8207)
```javascript
// Platform group checkboxes
groupCb.addEventListener('change', (e) => {
  // ... handler logic ...
});

// Individual platform checkboxes
cb.addEventListener('change', () => {
  // ... handler logic ...
});
```

## Key Patterns Summary

### 1. Filter Operation Queue Pattern
- **Purpose**: Defer filter operations during smart ordering to prevent race conditions
- **Components**: `queueFilterOperation()`, `processPendingFilterOperations()`, `pendingFilterOperations[]`
- **Usage**: Wrap filter operations that modify card order or visibility

### 2. Guard Wrapper Pattern
- **Purpose**: Automatically check smart ordering state before executing filter logic
- **Components**: `guardWrapper()`, `guardWrapperWithRender()`
- **Usage**: Wrap all filter handlers that may conflict with smart ordering

### 3. Filter Flag Pattern
- **Purpose**: Temporarily prevent smart ordering resets during filter operations
- **Components**: `isFilterOperation`, `isSmartOrderingActive`, `isApplyingSmartOrder`
- **Usage**: Set flags before filter operations, clear after completion

### 4. Event Listener Attachment Pattern
- **Purpose**: Dynamically attach event handlers after DOM updates
- **Components**: `addEventListener('click')`, `addEventListener('change')`, `addEventListener('input')`
- **Usage**: Re-attach handlers after list updates (favorites, hidden platforms)

### 5. Smart Ordering Integration Pattern
- **Purpose**: Prevent filter operations from resetting smart-ordered card order
- **Components**: `isSmartOrdering()`, `applySmartOrdering()`, `renderPreviews()`
- **Usage**: Check smart ordering state before clearing/setting cardOrder

## Related Documentation
- Bead bf-3tke4: onChange callback patterns for filters
- Bead bf-35h7f: addEventListener filter patterns
- Module: `/home/coding/vista/src/public/filter-guard-wrapper.js`
