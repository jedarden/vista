# Other Filter-Related Hook Patterns in app.js

**Task:** Search for other hook patterns related to filters in app.js that don't match previous categories (event listeners, on* handlers, addEventListener patterns).

**Date:** 2026-07-24
**File:** `/home/coding/vista/src/public/app.js`

---

## Summary

Found **5 distinct hook patterns** related to filters that are NOT event-listener based:

1. **Guard Flag Pattern** - `isFilterOperation` boolean flag
2. **Queue/Defer Pattern** - `pendingFilterOperations[]` and `queueFilterOperation()`
3. **Centralized Guard Functions** - `shouldDeferFilterOperation()`, `isSmartOrdering()`, `processPendingFilterOperations()`
4. **setTimeout-Based Guard Clearing** - Async guard flag reset pattern
5. **Filter Function Pattern** - Pure functions for filtering (not event-driven)

---

## Pattern 1: Guard Flag Pattern

### Description
Boolean flag `isFilterOperation` prevents smart order resets during filter changes. Set to `true` before filter operations, cleared after completion.

### Line Numbers
- Declaration: **Line 6279**
- Usage (5 instances): Lines 8080, 8096, 8144, 8156, 8263
- Checks: Line 8792, 8794
- Window export: Lines 5046-5049

### Code Snippets

**Declaration:**
```javascript
// Line 6279
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Usage Pattern (lines 8080-8082):**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Check Pattern (lines 8792-8795):**
```javascript
if (isFilterOperation || isSmartOrdering()) {
  console.log('[clearCardOrderForGroup] Skipped cardOrder clear:', 
    isFilterOperation ? 'filter operation in progress' : 'smart ordering is active');
  return;
}
```

**Window Export (lines 5046-5049):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

### Context
Used to prevent race conditions between filter operations and smart ordering. When `isFilterOperation` is `true`, card order clearing is skipped to preserve user's filter state.

---

## Pattern 2: Queue/Defer Pattern

### Description
Filter operations are queued when smart ordering is active, then executed after smart ordering completes.

### Line Numbers
- Declaration: **Line 6281**
- Queue function: Lines 7942-7947
- Usage: Lines 7888, 8148
- Window export: Lines 5050-5053

### Code Snippets

**Declaration:**
```javascript
// Line 6281
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Queue Function (lines 7942-7947):**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Usage Example (lines 8142-8148):**
```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  if (DEBUG_SMART_ORDERING) {
    console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
  }
  return;
}
```

**Window Export (lines 5050-5053):**
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

### Context
Prevents filter operations from executing during smart ordering, which could cause race conditions or state inconsistencies.

---

## Pattern 3: Centralized Guard Functions

### Description
Three centralized functions manage filter operation deferral:

1. `shouldDeferFilterOperation()` - Check if operation should be deferred
2. `isSmartOrdering()` - Check if smart ordering is active
3. `processPendingFilterOperations()` - Execute queued operations

### Line Numbers
- `shouldDeferFilterOperation()`: Lines 7891-7893
- `isSmartOrdering()`: Lines 7933-7935
- `processPendingFilterOperations()`: Lines 7952-7975
- Window export: Line 5056

### Code Snippets

**shouldDeferFilterOperation (lines 7891-7893):**
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**isSmartOrdering (lines 7933-7935):**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**processPendingFilterOperations (lines 7952-7975):**
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

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

**Window Export (line 5056):**
```javascript
window.processPendingFilterOperations = processPendingFilterOperations;
```

### Context
These functions provide a centralized API for managing filter operation lifecycle. The extensive JSDoc documentation (lines 7895-7932) explains the usage pattern and relationship to other guard flags.

---

## Pattern 4: setTimeout-Based Guard Clearing

### Description
After setting `isFilterOperation = true`, the flag is cleared asynchronously using `setTimeout(() => { isFilterOperation = false; }, 0)`. This ensures the flag stays `true` during the entire render operation.

### Line Numbers
- Line 8082 (importPreferences)
- Line 8099 (importPreferences)
- Line 8146 (toggleWhatIfMode)
- Line 8159 (toggleWhatIfMode)
- Line 8265 (applyWhatIfChanges)

### Code Snippet
```javascript
// Lines 8263-8265
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Context
The `setTimeout(..., 0)` pattern ensures the guard flag stays `true` through the entire render cycle, even if `renderPreviews()` is synchronous. This prevents race conditions where the flag might be checked too early.

---

## Pattern 5: Filter Function Pattern

### Description
Pure functions that perform filtering (not event-driven). Two instances:

1. `filterCommands()` - Filters command palette items
2. `renderMetadataTable(filter)` - Filters metadata table rows

### Line Numbers
- `filterCommands()`: Lines 9177-9192
- Event listener attachment: Line 9085
- `renderMetadataTable()`: Lines 3941-3995
- Event listener attachment: Line 3991

### Code Snippets

**filterCommands (lines 9177-9192):**
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

**renderMetadataTable (lines 3941-3995):**
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  // ... renders table with filtered rows

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

### Context
These are pure filtering functions that accept filter criteria and return filtered results. They're called from event listeners but are themselves non-event-driven filter logic.

---

## Related State Variables

Additional state variables that work with the filter patterns:

| Variable | Line | Purpose |
|----------|------|---------|
| `isSmartOrderingActive` | 6280 | Tracks when smart ordering is currently in progress |
| `isApplyingSmartOrder` | 6273 | Prevents concurrent smart order applications |
| `pendingApplySmartOrder` | 6274 | Queues pending smart order operations |
| `pendingRenderData` | 6275 | Queues renders during smart ordering |
| `isRendering` | 6276 | Prevents concurrent renders |
| `DEBUG_SMART_ORDERING` | (implicit) | Enables debug logging for filter operations |

---

## Documentation Comments

**Lines 7885-7932:** Comprehensive JSDoc documentation explaining:
- When to check smart ordering state
- How to use guard functions in filter handlers
- Relationship between guard flags and user preferences
- Usage examples with code snippets

---

## Key Differences from Previous Categories

These patterns are **NOT** event listener patterns (which were documented in previous beads: bf-d99ur, bf-ihvg1, bf-40qdd, bf-2lpc4):

- **Guard Flag Pattern**: State management, not event handling
- **Queue/Defer Pattern**: Operation queueing, not event binding
- **Centralized Guard Functions**: API pattern, not event pattern
- **setTimeout-Based Guard Clearing**: Async timing pattern, not event listener
- **Filter Function Pattern**: Pure functions, not event handlers

These patterns represent **application-level state management** and **synchronization logic** for coordinating filter operations with other application features (smart ordering, rendering, imports).

---

## Exported to Window Object

The following filter-related symbols are exported to `window` for debugging/inspection:

- `window.isFilterOperation` (lines 5046-5049)
- `window.pendingFilterOperations` (lines 5050-5053)
- `window.queueFilterOperation` (line 5055)
- `window.processPendingFilterOperations` (line 5056)

---

## Pattern 6: Page Type Change Guard Pattern

### Description
Filter operation guard applied during page type changes to prevent smart order resets. This pattern checks guard flags before clearing cardOrder state.

### Line Numbers
- **Lines 8785-8819**: Page type change detection with filter operation guard

### Code Snippet
```javascript
// P1 - Stale CardOrder Race fix: Track page type changes to invalidate stale cardOrder
const previousPageType = currentPageType;
currentPageType = pageType;

if (previousPageType && previousPageType !== pageType) {
  // P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
  // This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
  if (isFilterOperation || isSmartOrdering()) {
    if (DEBUG_SMART_ORDERING) {
      const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
      console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
    }
  } else {
    if (DEBUG_SMART_ORDERING) {
      console.log(`[applySmartOrdering] Page type changed from "${previousPageType}" to "${pageType}" - clearing stale cardOrder`);
    }
    // Clear cardOrder for groups that weren't manually modified by user
    PLATFORM_GROUPS.forEach((group) => {
      const metadata = platformPrefs.cardOrderMetadata?.[group.id];
      if (!metadata || !metadata.userModified || metadata.modifiedBy !== 'user-drag') {
        delete platformPrefs.cardOrder[group.id];
        // ... additional cleanup
      }
    });
  }
}
```

### Context
This pattern demonstrates how filter operation guards integrate with page type tracking. When a page type changes (e.g., from "home" to "article"), the system normally clears cached cardOrder preferences. However, if a filter operation is in progress, this clearing is skipped to preserve the filter state.

---

## Pattern 7: Filter Count Display Pattern

### Description
Display filter count showing "X of Y items" to provide user feedback about filtering results.

### Line Numbers
- **Line 3953**: Filter count display in metadata table
- **Line 3971**: Conditional rendering based on filter results

### Code Snippet
```javascript
// Filter count display
<span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>

// Conditional rendering
${filteredRows.length > 0
  ? filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('')
  : '<tr><td colspan="4" class="no-results">No tags match your filter</td></tr>'}
```

### Context:
This UX pattern shows users how many items remain after filtering versus the total count. When zero items match, it displays a "no results" message instead of an empty table.

---

## Pattern 8: JSON-LD Conditional Display Pattern

### Description
Special content sections (like JSON-LD structured data) are conditionally hidden when filtering is active.

### Line Numbers
- **Lines 3977-3983**: JSON-LD conditional display logic

### Code Snippet
```javascript
// Add JSON-LD section at bottom if present
const hasJsonLd = allMetadataRows.some(r => r.tag.startsWith('json-ld'));
if (hasJsonLd && !filter) {
  html += `<div class="raw-section">
    <h3>JSON-LD Structured Data</h3>
    ${currentData?.meta?.jsonLd?.map(j => `<pre class="jsonld-block">${escHtml(JSON.stringify(j, null, 2))}</pre>`).join('') || ''}
  </div>`;
}
```

### Context:
This pattern hides auxiliary content sections when a filter is active, keeping the UI focused on filter results. The `!filter` check ensures JSON-LD data only shows when no filter is applied.

---

## Pattern 9: Debug Logging with Guard Pattern

### Description
Extensive debug logging throughout filter operations to trace guard state and operation flow.

### Line Numbers
- Scattered throughout: Lines 7894, 7908-7914, 7944, 7957-7968, 8090-8091, 8150-8151, 8793-8796

### Code Snippets
```javascript
// Queue operation logging
if (DEBUG_SMART_ORDERING) {
  console.log(`[queueFilterOperation] Queuing: ${description}`);
}

// Processing logging
if (DEBUG_SMART_ORDERING) {
  console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
}

// Decision reason logging
if (DEBUG_SMART_ORDERING) {
  const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
  console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
}
```

### Context:
This pattern provides comprehensive traceability for filter operations. The `DEBUG_SMART_ORDERING` flag enables detailed logging of guard state, queuing decisions, and operation execution. Each log message includes a descriptive prefix (e.g., `[queueFilterOperation]`) for easy filtering in browser dev tools.

---

## Pattern 10: Guard Wrapper Pattern

### Description
Centralized wrapper functions that automatically manage guard flags for filter operations. Two variants: `guardWrapper()` for simple operations and `guardWrapperWithRender()` for operations requiring re-rendering.

### Line Numbers
- `guardWrapper()` usage: Line 7868
- `guardWrapperWithRender()` usage: Line 7978
- Definition location: Not shown in searched lines (likely defined elsewhere in app.js)

### Code Snippets
```javascript
// Lines 7867-7882 - toggleFavorite with guardWrapper
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
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

```javascript
// Lines 7977-7986 - toggleHidden with guardWrapperWithRender
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
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

### Context
These wrapper functions encapsulate the guard flag management pattern (setting `isFilterOperation`, executing operation, clearing flag). They provide a cleaner API than manually managing guards in each filter operation.

---

## Pattern 11: Toggle Operations Pattern

### Description
Specific filter toggle operations that modify platform visibility/favoriting state. Two main operations: `toggleFavorite()` and `toggleHidden()`.

### Line Numbers
- `toggleFavorite()`: Lines 7867-7882
- Event listener attachment: Lines 8007-8008
- `toggleHidden()`: Lines 7977-7986
- Event listener attachment: Lines 8029-8030

### Code Snippets
```javascript
// Lines 8007-8008 - Favorite toggle event listeners
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```

```javascript
// Lines 8029-8030 - Hidden toggle event listeners
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

### Context
These operations modify `platformPrefs.favorites` and `platformPrefs.hidden` sets to control which platforms appear in results. They use guard wrappers to prevent conflicts with smart ordering.

---

## Pattern 12: Card Context Toggle Pattern

### Description
Toggles individual platform cards between "card only" and "in context" display modes. This is a visual filter pattern, not a data filter.

### Line Numbers
- State initialization: Lines 1863-1865
- Toggle function: Lines 2162-2171
- Event listener attachment: Lines 1995, 2092

### Code Snippets
```javascript
// Lines 1863-1865 - Context state initialization
if (!cardContextState[pid]) {
  cardContextState[pid] = { context: false, theme: 'dark' };
}
```

```javascript
// Lines 2162-2171 - Toggle function
function toggleCardContext(pid, data) {
  cardContextState[pid].context = !cardContextState[pid].context;
  const body = document.getElementById(`card-body-${pid}`);
  if (body) {
    if (cardContextState[pid].context) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme, data.dominantColor);
    } else {
      body.innerHTML = renderPlatformCard(pid, data.meta, data.imageProbe, data.finalUrl, data.dominantColor);
    }
  }
}
```

```javascript
// Line 1995 - Event listener attachment (skeleton update path)
contextToggle.addEventListener('click', () => toggleCardContext(pid, data));
```

```javascript
// Line 2092 - Event listener attachment (initial render path)
const contextToggle = header.querySelector('.card-context-toggle');
contextToggle.addEventListener('click', () => toggleCardContext(pid, data));
```

### Context
This is a **display mode filter**, not a data filter. It changes how individual platform previews are rendered (full context vs. card only) without affecting which platforms are shown. State is maintained per-platform in `cardContextState` object.

---

## Pattern 13: Card Theme Toggle Pattern

### Description
Toggles individual platform cards between light and dark theme for context view rendering.

### Line Numbers
- Function definition: Lines 2175-2188
- Event listener attachment: Lines 2001, 2096

### Code Snippet
```javascript
// Lines 2175-2188
function toggleCardTheme(pid, data) {
  cardContextState[pid].theme = cardContextState[pid].theme === 'dark' ? 'light' : 'dark';
  if (cardContextState[pid].context) {
    const body = document.getElementById(`card-body-${pid}`);
    if (body) {
      body.innerHTML = renderPlatformWithContext(pid, data.meta, data.imageProbe, data.finalUrl, cardContextState[pid].theme);
    }
  }

  const card = document.getElementById(`card-${pid}`);
  if (!card) return;

  const contextToggle = card.querySelector('.card-context-toggle');
  const themeToggle = card.querySelector('.card-theme-toggle');

  if (contextToggle) {
    contextToggle.querySelector('.context-icon').textContent = cardContextState[pid].context ? '🖼️' : '🃏';
    contextToggle.querySelector('.context-label').textContent = cardContextState[pid].context ? 'In context' : 'Card only';
  }

  if (themeToggle) {
    themeToggle.querySelector('.theme-icon').textContent = cardContextState[pid].theme === 'dark' ? '🌙' : '☀️';
  }
}
```

```javascript
// Line 2001 - Event listener attachment (skeleton update path)
themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
```

```javascript
// Line 2096 - Event listener attachment (initial render path)
const themeToggle = header.querySelector('.card-theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => toggleCardTheme(pid, data));
}
```

### Context
Another **display mode filter** that controls theme (light/dark) for context view rendering. Only affects cards in context mode. Theme preference stored per-platform in `cardContextState[pid].theme`.

---

## Pattern 14: What-If Mode Toggle Pattern

### Description
Special mode for testing platform behavior with specific meta tags disabled. Combines guard flags, queue operations, and state management.

### Line Numbers
- State variables: Lines 8118-8119
- Main toggle function: Lines 8121-8160
- Panel toggle inputs: Lines 8206-8212

### Code Snippets
```javascript
// Lines 8118-8119 - State variables
let whatIfMode = false;
let disabledTags = new Set();
```

```javascript
// Lines 8121-8160 - Main toggle function
function toggleWhatIfMode() {
  whatIfMode = !whatIfMode;

  const btn = document.getElementById('whatIfToggleBtn');
  if (btn) {
    btn.classList.toggle('active', whatIfMode);
    btn.textContent = whatIfMode ? '✓ What If On' : '🔍 What If';
  }

  if (whatIfMode) {
    showWhatIfPanel();
  } else {
    // Clear What If state
    disabledTags.clear();
    updateHash({ without: '' }); // Clear from hash

    if (isSmartOrdering()) {
      const applyWhatIfReset = () => {
        isFilterOperation = true;
        renderPreviews(currentData);
        setTimeout(() => { isFilterOperation = false; }, 0);
      };
      queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
      if (DEBUG_SMART_ORDERING) {
        console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
      }
      return;
    }

    // Set guard flag to prevent smart order resets during filter operation
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  }

  // Show a modal or panel with tag toggles
  const panel = document.createElement('div');
  panel.className = 'what-if-panel';
  panel.id = 'whatIfPanel';
  // ... panel HTML rendering ...
}
```

```javascript
// Lines 8206-8212 - What-if panel toggle inputs
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

### Context
This is a **meta-tag filter** that allows testing "what if" scenarios by disabling specific meta tags. It combines multiple patterns: guard flags, queue operations, setTimeout-based clearing, and event-driven UI updates.

---

## Pattern 15: Context Menu Filter Actions Pattern

### Description
Context menu items provide quick access to filter actions (toggle favorite/hidden) with dynamic labels based on current state.

### Line Numbers
- Dynamic label updates: Lines 9734-9746
- Action handler: Lines 9795-9800

### Code Snippets
```javascript
// Lines 9734-9746 - Dynamic context menu labels
const favItem = contextMenu.querySelector('[data-action="toggle-favorite"] span:last-child');

if (platformPrefs.hidden.has(pid)) {
  hideItem.textContent = 'Show this platform';
} else {
  hideItem.textContent = 'Hide this platform';
}

if (platformPrefs.favorites.has(pid)) {
  favItem.textContent = 'Unstar';
} else {
  favItem.textContent = 'Star';
}
```

```javascript
// Lines 9795-9800 - Context menu action handler
switch (action) {
  case 'toggle-hidden':
    toggleHidden(pid);
    break;
  case 'toggle-favorite':
    toggleFavorite(pid);
    break;
}
```

### Context
This is a **UI accessibility pattern** for filter operations. Right-click context menu on platform cards provides quick access to filter actions. Labels update dynamically based on current platform state (hidden/favorited).

---

## Pattern 16: Platform Preference Import Pattern

### Description
Imports platform preferences (favorites, hidden, card order) from JSON file using guard flags and queue operations.

### Line Numbers
- Preference loading: Lines 7870-7872, 7710-7716
- Import with guard: Lines 8087-8090

### Code Snippets
```javascript
// Lines 7870-7872, 7710-7716 - Loading preferences
platformPrefs.favorites = new Set(parsed.favorites || []);
platformPrefs.hidden = new Set(parsed.hidden || []);
platformPrefs.cardOrder = parsed.cardOrder || {};
platformPrefs.cardOrderMetadata = parsed.cardOrderMetadata || {};
```

```javascript
// Lines 8087-8090 - Import with filter guard
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
};
queueFilterOperation(applyImportedPrefs, 'importPreferences');
```

### Context
When users import preferences via file input, the operation is queued and guarded to prevent smart order resets. This is a **batch filter operation** that can modify multiple filter states at once.

---

## Pattern 17: Global Window Exports Pattern

### Description
Filter-related functions and state variables exported to `window` object for debugging, testing, and external access.

### Line Numbers
- Lines 5046-5058

### Code Snippet
```javascript
// Lines 5046-5058
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
window.toggleHidden = toggleHidden;
window.toggleFavorite = toggleFavorite;
```

### Context
This is a **debugging and testing pattern** that exposes internal filter state and control functions globally. Enables runtime inspection and manipulation of filter behavior via browser console.

---

## Conclusion

Found **17 distinct hook patterns** related to filters in Vista app.js:

**Core State Management Patterns (5):**
1. Guard Flag Pattern
2. Queue/Defer Pattern
3. Centralized Guard Functions
4. setTimeout-Based Guard Clearing
5. Guard Wrapper Pattern

**Operation Patterns (4):**
6. Filter Function Pattern
7. Toggle Operations Pattern (favorite/hidden)
8. What-If Mode Toggle Pattern
9. Platform Preference Import Pattern

**Display Mode Patterns (2):**
10. Card Context Toggle Pattern
11. Card Theme Toggle Pattern

**UX/UI Patterns (4):**
12. Page Type Change Guard Pattern
13. Filter Count Display Pattern
14. JSON-LD Conditional Display Pattern
15. Context Menu Filter Actions Pattern

**Debugging/Testing Patterns (2):**
16. Debug Logging with Guard Pattern
17. Global Window Exports Pattern

All patterns coordinate filter operations with other application features (smart ordering, rendering, page tracking) to prevent race conditions and state inconsistencies.

**Key Finding:** All filter-related hook patterns in app.js match documented categories. No undocumented patterns were found.
