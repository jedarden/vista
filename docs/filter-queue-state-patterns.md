# Filter Queue and State Patterns in app.js

## Overview
This document captures all queue patterns, state variables, and processing logic related to filter operations in `/home/coding/vista/src/public/app.js`.

## State Variables (Lines 6754-6763)

### Primary State Variables

| Line | Variable | Type | Purpose |
|------|----------|------|---------|
| 6763 | `pendingFilterOperations` | `Array` | Queue filter operations during smart ordering |
| 6761 | `isFilterOperation` | `boolean` | Guard flag to prevent smart order resets during filter changes |
| 6762 | `isSmartOrderingActive` | `boolean` | Track when smart ordering is currently active |
| 6755 | `isApplyingSmartOrder` | `boolean` | Prevents concurrent renders during smart ordering |
| 6756 | `pendingApplySmartOrder` | `boolean` | Queue flag for pending smart order application |
| 6757 | `pendingRenderData` | `any` | Queue renderPreviews calls during smart ordering |
| 6759 | `isRendering` | `boolean` | Guard flag to prevent concurrent renders |
| 6760 | `pendingRenderAfterCurrent` | `Function` | Queue renders during active render |
| 6760 | `currentPageType` | `string` | Track current page type for stale cardOrder detection |

### Debug Flag
| Line | Variable | Type | Purpose |
|------|----------|------|---------|
| 74 | `DEBUG_SMART_ORDERING` | `boolean` | Enable detailed logging for smart ordering functionality |

## Queue Pattern: `pendingFilterOperations`

### Initialization (Line 6763)
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Adding to Queue (Lines 8420-8429)
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
```

### Processing Queue (Lines 8434-8457)
```javascript
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

## Guard Functions

### `shouldDeferFilterOperation()` (Lines 8373-8375)
```javascript
/**
 * Check if filter operation should be deferred due to active smart ordering
 * @returns {boolean} True if smart ordering is active and operation should be deferred
 */
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

### `isSmartOrdering()` (Lines 8415-8417)
```javascript
/**
 * Check if smart ordering is currently active
 *
 * Centralized guard function that checks BOTH the user preference and runtime state
 * to determine if smart ordering is currently active.
 *
 * **Checks two conditions:**
 * 1. User preference: `platformPrefs.smartOrdering` (is smart ordering enabled?)
 * 2. Runtime state: `isSmartOrderingActive` (is smart ordering currently in progress?)
 *
 * @returns {boolean} True if smart ordering is BOTH enabled AND currently active
 */
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

## Usage Patterns

### Pattern 1: Import Preferences with Smart Ordering Guard (Lines 8557-8574)
```javascript
if (currentData) {
  // Check if smart ordering is active - defer operation if so
  if (isSmartOrdering()) {
    // Create a wrapper function that doesn't depend on the event
    const applyImportedPrefs = () => {
      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
      isSmartOrderingActive = false;
      if (DEBUG_SMART_ORDERING) {
        console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
      }
    };
    queueFilterOperation(applyImportedPrefs, 'importPreferences');
    if (DEBUG_SMART_ORDERING) {
      console.log('[importPreferences] Smart ordering active - operation queued');
    }
    return;
  }

  // Set guard flag to prevent smart order resets during filter operation
  isFilterOperation = true;
  renderPreviews(currentData);
  // Clear flag after render (renderPreviews will handle timing)
  setTimeout(() => { isFilterOperation = false; }, 0);

  // Clear smart ordering active flag since user manually imported preferences
  isSmartOrderingActive = false;
}
```

### Pattern 2: What If Mode Reset with Guard (Lines 8623-8630)
```javascript
if (currentData) {
  // Check if smart ordering is active - defer operation if so
  if (isSmartOrdering()) {
    const applyWhatIfReset = () => {
      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
    };
    queueFilterOperation(applyWhatIfReset, 'resetWhatIfMode');
    if (DEBUG_SMART_ORDERING) {
      console.log('[resetWhatIfMode] Smart ordering active - operation queued');
    }
    return;
  }
  // ... proceed with normal operation
}
```

### Pattern 3: Page Type Change Filter Guard (Lines 9272-9278)
```javascript
if (previousPageType && previousPageType !== pageType) {
  // P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
  // This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
  if (isFilterOperation || isSmartOrdering()) {
    if (DEBUG_SMART_ORDERING) {
      const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
      console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
    }
  } else {
    // ... clear cardOrder
  }
}
```

## Window Exports (Lines 5472-5482)

For debugging and external access, these are exposed to the window object:
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
window.isSmartOrdering = isSmartOrdering;
```

## Key Design Patterns

### 1. Queue-and-Process Pattern
- Items added to `pendingFilterOperations` array
- Processing copies array to avoid modification during iteration
- Queue cleared after copying
- Each operation wrapped in try-catch for error isolation

### 2. Double-Guard Pattern
- `isFilterOperation`: Set during filter operations to prevent smart order resets
- `isSmartOrderingActive`: Runtime flag tracking smart ordering progress
- Both checked together for comprehensive state protection

### 3. Async Flag Reset Pattern
```javascript
isFilterOperation = true;
// ... perform operation
setTimeout(() => { isFilterOperation = false; }, 0);
```
Uses `setTimeout(..., 0)` to clear flag after current event loop completes

### 4. Wrapper Function Pattern
Operations queued during smart ordering are wrapped in functions that:
- Set `isFilterOperation` guard
- Perform the render/operation
- Clear `isFilterOperation` via setTimeout
- Optionally clear `isSmartOrderingActive` for user overrides

## Related Flags (from documentation)

- `isApplyingSmartOrder`: Prevents concurrent renders during smart ordering
- `platformPrefs.smartOrdering`: User preference for smart ordering (default: true)

## Notes

- No debounce/throttle patterns were found specifically for filter operations
- The queue pattern IS the throttle mechanism - operations are deferred until smart ordering completes
- Debug logging can be enabled via `window.DEBUG_SMART_ORDERING = true`
- All filter operations check `isSmartOrdering()` before proceeding
- Operations check both preference (`platformPrefs.smartOrdering`) AND runtime state (`isSmartOrderingActive`)
