# Filter Queue and State Patterns Documentation

## Overview
Comprehensive documentation of filter operation queues, state management, and batch processing patterns found in `/home/coding/vista/src/public/app.js`.

---

## Queue Patterns

### 1. Filter Operations Queue (`pendingFilterOperations`)

**Declaration (Line 6281):**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Window Property Exposure (Lines 5050-5053):**
```javascript
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Queue Function (Lines 7942-7947):**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Processing Function (Lines 7952-7975):**
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

**Usage Examples:**
- Line 8088: `queueFilterOperation(applyImportedPrefs, 'importPreferences');`
- Line 8148: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');`

**Key Pattern:**
- Queue stores objects with `operation` (function) and `description` (string)
- Operations are queued when smart ordering is active
- Batch processing with error handling per operation
- Queue is cleared after copying to prevent concurrent modifications

---

### 2. Render Queue During Smart Ordering (`pendingRenderData`)

**Declaration (Line 6275):**
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Queue Check (Lines 1597-1604):**
```javascript
// P0 - Race condition fix: Queue render if smart ordering is in progress
if (isApplyingSmartOrder) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
  }
  // Store the latest data to render after smart ordering completes
  pendingRenderData = data;
  return; // Skip rendering during smart ordering to prevent race conditions
}
```

**Processing (Lines 9037-9044):**
```javascript
if (pendingRenderData) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrderingSafe] Processing queued render with updated cardOrder (flag now false)');
  }
  const dataToRender = pendingRenderData;
  pendingRenderData = null; // Clear before rendering to prevent re-queue
  renderPreviews(dataToRender);
}
```

**Key Pattern:**
- Single-slot queue (stores only the latest render data)
- Prevents rendering during DOM manipulation
- Cleared before rendering to prevent re-queue cycles

---

### 3. Render Queue During Active Render (`pendingRenderAfterCurrent`)

**Declaration (Line 6277):**
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Queue Check (Lines 1587-1594):**
```javascript
if (isRendering) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Already rendering - queueing with latest data');
  }
  // Store the latest data to render after current render completes
  pendingRenderAfterCurrent = data;
  return;
}
```

**Processing (Lines 1712-1720):**
```javascript
// Process any pending render that was queued while this render was in progress
if (pendingRenderAfterCurrent) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Processing queued render after completion');
  }
  const dataToRender = pendingRenderAfterCurrent;
  pendingRenderAfterCurrent = null;
  // Use setTimeout to avoid recursive call stack
  setTimeout(() => renderPreviews(dataToRender), 0);
}
```

**Key Pattern:**
- Single-slot queue for render data
- Prevents concurrent renders
- Uses setTimeout(0) to avoid recursive call stack

---

### 4. Smart Order Application Queue (`pendingApplySmartOrder`)

**Declaration (Line 6274):**
```javascript
let pendingApplySmartOrder = false;
```

**Queue Logic (Lines 8989-8994):**
```javascript
function applySmartOrderingSafe() {
  // If already applying, queue a pending application
  if (isApplyingSmartOrder) {
    console.log('[applySmartOrderingSafe] Already applying - queueing pending operation');
    pendingApplySmartOrder = true;
    return;
  }
```

**Processing (Lines 9021-9025):**
```javascript
// Step 3: If another operation was queued, process it
if (pendingApplySmartOrder) {
  console.log('[applySmartOrderingSafe] Processing queued operation');
  setTimeout(applySmartOrderingSafe, 0);
}
```

**Key Pattern:**
- Boolean flag queue (only tracks if a re-application is needed)
- Recursive scheduling with setTimeout(0)
- Flag cleared before processing (Line 8998)

---

## State Variables (Guard Flags)

### 1. Filter Operation Guard (`isFilterOperation`)

**Declaration (Line 6279):**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Window Property Exposure (Lines 5046-5049):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

**Usage Pattern (Lines 8080-8082):**
```javascript
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
```

**Key Pattern:**
- Prevents smart order resets during filter operations
- Set to true before operation, cleared asynchronously with setTimeout(0)
- Used in renderPreviews to check if cardOrder should be updated

---

### 2. Smart Ordering Active Flag (`isSmartOrderingActive`)

**Declaration (Line 6280):**
```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```

**Window Property Exposure (Lines 5042-5045):**
```javascript
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});
```

**Usage Pattern (Lines 7875-7882):**
```javascript
// Clear smart ordering active flag since user manually modified favorites
isSmartOrderingActive = false;
if (DEBUG_SMART_ORDERING) {
  console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
}
```

**Key Pattern:**
- Tracks when smart ordering mode is active
- Cleared on user manual overrides (drag-drop, favorites toggle)
- Prevents automatic smart order re-application after user edits

---

### 3. Smart Ordering Application Flag (`isApplyingSmartOrder`)

**Declaration (Line 6273):**
```javascript
let isApplyingSmartOrder = false;
```

**Guard Pattern (Lines 8996-9002):**
```javascript
// Set guard flag BEFORE try block - this ensures no render can execute during DOM reordering
isApplyingSmartOrder = true;
pendingApplySmartOrder = false;

if (DEBUG_SMART_ORDERING) {
  console.log('[applySmartOrderingSafe] Guard flag SET (true) - starting smart ordering');
}
```

**Clear Pattern (Lines 9026-9032):**
```javascript
} finally {
  // Always clear guard flag AFTER all operations complete, even if applySmartOrdering throws
  isApplyingSmartOrder = false;

  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrderingSafe] Guard flag CLEARED (false) - all operations complete');
  }
}
```

**Key Pattern:**
- Prevents concurrent smart ordering operations
- Set in finally block to ensure cleanup even on errors
- Blocks renderPreviews execution during DOM manipulation

---

### 4. Rendering Guard Flag (`isRendering`)

**Declaration (Line 6276):**
```javascript
let isRendering = false; // Guard flag to prevent concurrent renders
```

**Set Pattern (Line 1607):**
```javascript
// P1 - Set rendering guard flag
isRendering = true;
```

**Clear Pattern (Line 1709):**
```javascript
// P1 - Clear rendering guard flag after DOM is complete
isRendering = false;
```

**Key Pattern:**
- Prevents concurrent render operations
- Set at start of renderPreviews, cleared after DOM updates complete
- Used to queue renders that arrive during active rendering

---

## Filter Input Event Listeners

### Metadata Filter Input (Lines 3989-3994)
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Pattern:**
- Direct call on input event (no debounce)
- Immediately re-renders metadata table with filter value

---

## Filter Operation Integration

### Smart Ordering Check (Lines 8141-8150)
```javascript
// Check if smart ordering is active - defer operation if so
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

**Pattern:**
- Wrap operation in function that sets guard flags
- Queue the wrapped function
- Return early to prevent immediate execution

---

## Debounce/Throttle Patterns

### No Traditional Debounce for Filter Operations
The filter operations do **NOT** use traditional debounce/throttle patterns. Instead, they use:

1. **Queue-based batching**: Operations are queued during smart ordering and executed in batch after completion
2. **Guard flags**: Prevent concurrent execution and race conditions
3. **setTimeout(0) for async clearing**: Guard flags are cleared asynchronously to allow the operation to complete

### Traditional Debounce Found (Non-Filter Context)
**Toast Debounce (Lines 1209-1210):**
```javascript
toast._timer = setTimeout(() => toast.classList.add('hidden'), duration || 3000);
```

**Editor Preview Debounce (Lines 6607-6608):**
```javascript
clearTimeout(editorState.previewTimeout);
editorState.previewTimeout = setTimeout(() => {
```

---

## Summary of Queue Processing Flow

### Filter Operations Queue:
1. **Adding Items**: `queueFilterOperation(operation, description)` pushes to array
2. **Processing**: `processPendingFilterOperations()` copies array, clears queue, executes each operation
3. **Error Handling**: Try-catch per operation prevents one failure from blocking others

### Render Queues:
1. **Single-slot pattern**: Only store the latest data (overwrites previous)
2. **Guard-protected**: Check flags before queueing
3. **Async processing**: Use setTimeout(0) to avoid recursive call stack

### Smart Order Application Queue:
1. **Boolean flag**: Only tracks if re-application is needed
2. **Recursive scheduling**: setTimeout(0, applySmartOrderingSafe)
3. **Flag cleared before processing**: Prevents infinite loops

---

## Line Number Reference

| Pattern | Line Numbers |
|---------|-------------|
| `pendingFilterOperations` declaration | 6281 |
| `pendingFilterOperations` window property | 5050-5053 |
| `queueFilterOperation` function | 7942-7947 |
| `processPendingFilterOperations` function | 7952-7975 |
| `pendingRenderData` declaration | 6275 |
| `pendingRenderData` queue check | 1597-1604 |
| `pendingRenderData` processing | 9037-9044 |
| `pendingRenderAfterCurrent` declaration | 6277 |
| `pendingRenderAfterCurrent` queue check | 1587-1594 |
| `pendingRenderAfterCurrent` processing | 1712-1720 |
| `pendingApplySmartOrder` declaration | 6274 |
| `pendingApplySmartOrder` queue logic | 8989-8994 |
| `pendingApplySmartOrder` processing | 9021-9025 |
| `isFilterOperation` declaration | 6279 |
| `isFilterOperation` window property | 5046-5049 |
| `isFilterOperation` usage example | 8080-8082 |
| `isSmartOrderingActive` declaration | 6280 |
| `isSmartOrderingActive` window property | 5042-5045 |
| `isSmartOrderingActive` usage | 7875-7882 |
| `isApplyingSmartOrder` declaration | 6273 |
| `isApplyingSmartOrder` guard pattern | 8996-9002, 9026-9032 |
| `isRendering` declaration | 6276 |
| `isRendering` set/clear | 1607, 1709 |
| Filter input event listener | 3989-3994 |
| Smart ordering check integration | 8141-8150, 8077-8088 |

---

## Key Findings

1. **No Traditional Debounce**: Filter operations use queue-based batching instead of debounce/throttle
2. **Multiple Queue Types**: 4 distinct queue patterns for different purposes
3. **Guard Flag Pattern**: Extensive use of boolean flags to prevent race conditions
4. **Error Isolation**: Filter operations processed with individual error handling
5. **Single-Slot Queues**: Render queues only store latest data (overwrite pattern)
6. **Async Clearing**: Guard flags cleared with setTimeout(0) to ensure operation completion
7. **Window Exposure**: Key state variables exposed via Object.defineProperty for debugging/integration testing
