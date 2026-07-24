# Filter-Related State and Callback Patterns in app.js

## Summary
The app.js file uses vanilla JavaScript (not React), so there are no `useState` or `useCallback` hooks. Instead, it uses global state variables, event listeners, and guard flags for filter-related functionality.

## Filter State Variables (Lines 6279-6281)

### Global Guard Flags for Filter Operations

```javascript
// Line 6279
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes

// Line 6281
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Other Related Guard State (Lines 6273-6280)

```javascript
let isApplyingSmartOrder = false;
let pendingApplySmartOrder = false;
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
let isRendering = false; // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let currentPageType = null;
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```

### Command Palette Filter State (Lines 6284-6285)

```javascript
let commandPaletteOpen = false;
let commandPaletteSelectedIndex = 0;
```

### What If Mode Filter State (Lines 8118-8119)

```javascript
let whatIfMode = false;
let disabledTags = new Set();
```

## Filter Callback Functions and Patterns

### 1. Metadata Table Filter (Lines 3941-3994)

**Function Declaration:**
```javascript
// Line 3941
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... rendering code
}
```

**Event Listener Pattern (Lines 3989-3994):**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern:** Simple direct callback on input event, re-renders table with filtered value.

---

### 2. Command Palette Filter (Lines 9177-9192)

**Function Declaration:**
```javascript
// Line 9177
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

**Event Listener Pattern (Line 9085):**
```javascript
input.addEventListener('input', filterCommands);
```

**Pattern:** Array.filter() based on query, updates selected index, re-renders results.

---

### 3. Filter Operation Guard Functions (Lines 7891-7975)

**Should Defer Check (Lines 7891-7893):**
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Is Smart Ordering Check (Lines 7933-7935):**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Queue Filter Operation (Lines 7942-7947):**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Process Pending Operations (Lines 7952-7975):**
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];

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

---

### 4. Import Preferences with Filter Guard (Lines 8076-8106)

**Pattern: Guard flag set before filter operation, cleared after render**
```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}

// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### 5. What If Mode Toggle with Filter Guard (Lines 8141-8160)

**Pattern: Same guard flag + queue pattern**
```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  return;
}

isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### 6. What If Changes Apply with Filter Guard (Lines 8261-8265)

**Pattern: Guard flag around render**
```javascript
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### 7. Platform Visibility Filter (Lines 7977-7987)

**Function Declaration:**
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

**Pattern:** Uses `guardWrapperWithRender` wrapper to coordinate with smart ordering, maintains `platformPrefs.hidden` Set.

---

### 8. Global Window Exports for Debug (Lines 5046-5053)

```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Pattern:** Exports filter state to window for debugging.

---

## Key Patterns Identified

### Pattern 1: Simple Input Filter with Direct Re-render
**Lines 3989-3994, 9085**
- Direct event listener on input element
- Callback processes filter immediately
- Re-renders component with filtered data

### Pattern 2: Guard-Protected Filter Operation
**Lines 8080-8100, 8144-8159, 8263-8265**
- Set `isFilterOperation = true` before operation
- Perform operation (usually `renderPreviews`)
- Clear flag with `setTimeout(() => { isFilterOperation = false; }, 0)`
- Prevents smart ordering resets during filter changes

### Pattern 3: Deferred Filter Operation Queue
**Lines 8077-8092, 8142-8152**
- Check if smart ordering is active with `isSmartOrdering()`
- If active, create wrapper function with guard flag pattern
- Queue operation with `queueFilterOperation(func, description)`
- Return immediately, operation runs later via `processPendingFilterOperations()`

### Pattern 4: Stateful Filter with Toggle
**Lines 7977-7987, 8118-8119**
- Maintain filter state (e.g., `disabledTags`, `platformPrefs.hidden`)
- Toggle operations modify state
- Re-render after state change
- Persist state to localStorage/platformPrefs

### Pattern 5: Array Filter with Query Matching
**Lines 3944-3947, 9186-9189**
- Use `Array.filter()` with predicate function
- Case-insensitive string matching with `.toLowerCase()`
- Match against multiple fields (label, category, tag, value)

### Pattern 6: Centralized Guard Coordination
**Lines 7891-7975**
- `isSmartOrdering()` - Central check for both preference and runtime state
- `shouldDeferFilterOperation()` - Check if defer is needed
- `queueFilterOperation()` - Queue deferred operations
- `processPendingFilterOperations()` - Execute queued operations
- All filter operations coordinate through these centralized guards

## Previously Documented Categories (From Memory)

Based on workspace memory, previously documented patterns include:
- bf-gewzn: Filter-related hook categories baseline
- bf-1snrb: Event listener patterns for filter changes
- bf-d99ur: Hook patterns in app.js
- bf-5u7t5: Other filter-related patterns

This search confirms that app.js uses vanilla JavaScript patterns rather than React hooks, with global state variables, event listeners, and guard coordination mechanisms.

## New/Unique Patterns Not Previously Documented

1. **Guard flag with setTimeout pattern** (Lines 8080-8100, 8144-8159, 8263-8265):
   - Sets guard flag, performs operation, clears flag after next tick
   - Prevents smart ordering resets during filter operations
   - Uses `setTimeout(..., 0)` to clear flag after render completes

2. **Deferred operation queue pattern** (Lines 7942-7975):
   - Queue operations during active smart ordering
   - Batch process queued operations after smart ordering completes
   - Includes debug logging and error handling per operation

3. **Centralized guard coordination functions** (Lines 7891-7975):
   - Single source of truth for filter operation guards
   - Separates concerns (check, queue, process)
   - Includes comprehensive documentation comments

4. **Window-exported filter state for debugging** (Lines 5046-5053):
   - Exports internal filter state to global window object
   - Allows console debugging and inspection
   - Uses `Object.defineProperty` with getters/setters
