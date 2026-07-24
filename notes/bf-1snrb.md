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

## Conclusion

Found **5 distinct hook patterns** related to filters that are **not event-listener based**. These patterns focus on:

1. **State management** (guard flags)
2. **Operation queuing** (defer until safe)
3. **Centralized API** (guard functions)
4. **Async timing** (setTimeout guards)
5. **Pure filtering** (function-based filters)

Additionally documented **4 supplementary patterns**:
6. **Page type change guard** - Integrating filter guards with page state transitions
7. **Filter count display** - UX feedback pattern for filter results
8. **Conditional content hiding** - Hiding auxiliary sections during filtering
9. **Debug logging** - Comprehensive traceability for guard state

These patterns coordinate filter operations with other application features (smart ordering, rendering, page tracking) to prevent race conditions and state inconsistencies.
