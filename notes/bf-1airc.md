# onFilterChange Callback Patterns in Vista app.js

**Bead ID:** bf-1airc
**Date:** 2026-07-24
**File:** `/home/coding/vista/src/public/app.js`

## Summary

The Vista app.js file does not use a literal "onFilterChange" callback naming convention. Instead, it implements several distinct filter callback patterns:

1. **Direct event listener callbacks** - Functions attached to input events
2. **Queued filter operations** - Deferred execution during smart ordering
3. **Guard flags** - State management to prevent conflicts
4. **Integrated filter-and-render callbacks** - Combined filter + UI update functions

---

## Pattern 1: Direct Event Listener Callbacks

### 1.1 Metadata Filter Input Listener
**Location:** Lines 3989-3994

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern:** Inline arrow function callback on `input` event
**Callback target:** `renderMetadataTable(filter)` function

### 1.2 Command Palette Filter Listener
**Location:** Line 9085

```javascript
input.addEventListener('input', filterCommands);
```

**Pattern:** Direct function reference callback on `input` event
**Callback target:** `filterCommands(e)` function (defined at line 9177)

---

## Pattern 2: Filter Function Definitions

### 2.1 renderMetadataTable Function
**Location:** Lines 3941-3995

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  let html = `<div class="metadata-viewer">
    <div class="metadata-toolbar">
      <div class="metadata-filter">
        <input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
        <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
      </div>
      // ... rest of rendering
    </div>`;

  rawTagsPanel.innerHTML = html;

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

**Pattern:** Self-attaching filter function - creates input element and attaches its own listener
**Callback mechanism:** Recursive call with new filter value

### 2.2 filterCommands Function
**Location:** Lines 9177-9192

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

**Pattern:** Event handler that filters and re-renders command palette
**Callback mechanism:** Direct call to `renderCommands(filtered)`

---

## Pattern 3: Queued Filter Operations (Smart Ordering Integration)

### 3.1 Guard State Variables
**Location:** Lines 6279-6281, 5046-5055

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering

// Exposed globally
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Pattern:** Global state flags to coordinate filter operations with smart ordering

### 3.2 Queue Filter Operation Function
**Location:** Lines 7942-7947

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Pattern:** Callback queue registration - stores filter operation for deferred execution

### 3.3 Process Pending Filter Operations
**Location:** Lines 7952-7975

```javascript
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

**Pattern:** Batch callback execution - processes queued filter operations after smart ordering completes

### 3.4 Smart Ordering Guard Functions
**Location:** Lines 7887-7935

```javascript
/**
 * Check if filter operation should be deferred due to active smart ordering
 */
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}

/**
 * Check if smart ordering is currently active
 *
 * **Usage in filter handlers:**
 * ```javascript
 * function myFilterHandler() {
 *   if (isSmartOrdering()) {
 *     queueFilterOperation(myFilterHandler, 'myFilterHandler');
 *     return;
 *   }
 *   // Proceed with filter operation
 * }
 * ```
 */
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Pattern:** Guard condition pattern - defers filter callbacks during smart ordering

---

## Pattern 4: Filter Operation Guard Usage

### 4.1 Import Preferences Filter Guard
**Location:** Lines 8078-8090

```javascript
isFilterOperation = true;
try {
  // ... filter operation code
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
} finally {
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Pattern:** Scoped guard flag with automatic cleanup

### 4.2 What-If Mode Reset Guard
**Location:** Lines 8144-8150

```javascript
isFilterOperation = true;
try {
  // ... filter operation code
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
} finally {
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Pattern:** Same scoped guard pattern for different filter context

### 4.3 Platform Toggle Guard
**Location:** Lines 8263-8267

```javascript
isFilterOperation = true;
try {
  // ... filter operation code
} finally {
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

**Pattern:** Guard flag for platform visibility toggle operations

---

## Key Findings

1. **No literal "onFilterChange" callbacks exist** - The codebase uses different naming conventions
2. **Two primary filter callback mechanisms:**
   - Direct event listeners (`input` events)
   - Queued operations (deferred during smart ordering)
3. **State coordination:** Filter operations are carefully coordinated with smart ordering via guard flags
4. **Self-attaching pattern:** `renderMetadataTable` creates its own input element and listener
5. **Callback queue pattern:** `queueFilterOperation` enables deferred execution to avoid conflicts

## Callback Pattern Types Summary

| Pattern | Example | Lines |
|---------|---------|-------|
| Inline event listener | `filterInput.addEventListener('input', (e) => { ... })` | 3991 |
| Function reference | `input.addEventListener('input', filterCommands)` | 9085 |
| Queued operation | `queueFilterOperation(applyImportedPrefs, 'importPreferences')` | 8088 |
| Guard-wrapped | `isFilterOperation = true; ... setTimeout(() => { isFilterOperation = false; }, 0)` | 8080-8082 |
| Self-attaching | Function creates element and attaches its own listener | 3941-3995 |

All patterns documented. No literal `onFilterChange` function name found.
