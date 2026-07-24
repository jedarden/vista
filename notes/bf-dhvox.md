# Filter-Related Hooks Code Documentation

**Bead:** bf-dhvox  
**Task:** Document code snippets for filter-related hooks identified in bf-294pn  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24

---

## Overview

This document provides complete code snippets for the **3 filter-related hooks** that were identified in bead bf-294pn but were not included in the original hook catalog (bf-56np0). These hooks are exposed via the global `window` object and enable external coordination with VISTA's filter operations.

---

## Hook 1: Filter Operation State Hook

### Hook Metadata
| Property | Value |
|----------|-------|
| **Hook Name** | `window.isFilterOperation` |
| **Line Numbers** | 5046-5048 (exposure), 6279 (declaration) |
| **Type** | Property getter/setter |
| **Context** | Guard flag to prevent smart order resets during filter changes |

### Declaration (Line 6279)

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### Exposure to Global Scope (Lines 5046-5048)

```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

### Usage Example Pattern (Found in Multiple Locations)

```javascript
// Pattern found in importPreferences (lines 8080, 8096)
// Pattern found in toggleWhatIfMode (lines 8144, 8156)  
// Pattern found in applyWhatIfChanges (line 8263)

// Set guard flag before filter operation
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### Purpose
This boolean flag serves as a guard to prevent smart ordering resets during filter operations. When set to `true`, the `renderPreviews()` function skips smart ordering logic to prevent visual conflicts.

---

## Hook 2: Filter Operation Queue Hook

### Hook Metadata
| Property | Value |
|----------|-------|
| **Hook Name** | `window.queueFilterOperation` |
| **Line Numbers** | 5055 (exposure), 7942-7947 (implementation) |
| **Type** | Function |
| **Context** | Queues filter operations to be deferred during smart ordering |

### Queue Declaration (Line 6281)

```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Exposure to Global Scope (Line 5055)

```javascript
window.queueFilterOperation = queueFilterOperation;
```

### Implementation (Lines 7942-7947)

```javascript
/**
 * Queue a filter operation for deferred execution during smart ordering
 * @param {Function} operation - The operation to queue
 * @param {string} description - Description of the operation for debugging
 */
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

### Usage Example Pattern (Found in Multiple Locations)

```javascript
// Pattern found in importPreferences (line 8088)
// Pattern found in toggleWhatIfMode (line 8148)

if (isSmartOrdering()) {
  const applyOperation = () => {
    // Filter operation logic here
  };
  queueFilterOperation(applyOperation, 'operation description');
  return;
}
```

### Purpose
This hook allows filter operations to be queued when smart ordering is active, preventing race conditions between automatic reordering and manual filter operations. The queued operations execute after smart ordering completes.

---

## Hook 3: Filter Operations Processor Hook

### Hook Metadata
| Property | Value |
|----------|-------|
| **Hook Name** | `window.processPendingFilterOperations` |
| **Line Numbers** | 5056 (exposure), 7952-7974 (implementation) |
| **Type** | Function |
| **Context** | Executes queued filter operations after smart ordering completes |

### Exposure to Global Scope (Line 5056)

```javascript
window.processPendingFilterOperations = processPendingFilterOperations;
```

### Implementation (Lines 7952-7974)

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

### Usage Context
This function is called automatically after smart ordering completes. It processes all queued operations in order, with error isolation to prevent one failure from blocking others.

### Purpose
Processes all queued filter operations after smart ordering completes. Uses array copy to prevent modification during iteration and error isolation to handle individual operation failures without stopping the entire queue.

---

## Additional Related Exports

### Supporting State Exports (Lines 5042-5053)

```javascript
// Expose guard functions and state for integration testing
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});

Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

window.isSmartOrdering = isSmartOrdering;
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
window.toggleHidden = toggleHidden;
window.toggleFavorite = toggleFavorite;
```

### Debug Flag Reference

The hooks reference `DEBUG_SMART_ORDERING` for logging. This is defined in the constants section and enables detailed logging when set to `true`.

---

## Hook Integration Patterns

### Pattern 1: Guard Flag Protection

```javascript
// Before filter operation
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Used in:** `importPreferences`, `toggleWhatIfMode`, `applyWhatIfChanges`

### Pattern 2: Queue During Smart Ordering

```javascript
if (isSmartOrdering()) {
  const deferredOperation = () => {
    // Operation logic
  };
  queueFilterOperation(deferredOperation, 'description');
  return;
}
```

**Used in:** `importPreferences`, `toggleWhatIfMode`

### Pattern 3: Manual Queue Processing

External code can manually trigger queue processing:

```javascript
// Process all pending operations
window.processPendingFilterOperations();
```

---

## Testing and Debugging

### Check Hook Availability

```javascript
console.log(typeof window.isFilterOperation); // "object" (property descriptor)
console.log(typeof window.queueFilterOperation); // "function"
console.log(typeof window.processPendingFilterOperations); // "function"
```

### Monitor Filter State

```javascript
console.log(window.isFilterOperation); // Current guard flag state
console.log(window.pendingFilterOperations); // Array of queued operations
```

### Manual Queue Testing

```javascript
// Add a test operation
window.queueFilterOperation(() => {
  console.log('Test operation executed');
}, 'Test operation');

// Process queued operations
window.processPendingFilterOperations();
```

---

## Hook Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│            Filter-Related Hook System                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Hook 1: window.isFilterOperation              │   │
│  │  (Boolean guard flag)                           │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│           Prevents smart order resets                 │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Hook 2: window.queueFilterOperation            │   │
│  │  (Function to queue operations)                │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│         Adds to pendingFilterOperations[]             │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Hook 3: window.processPendingFilterOperations  │   │
│  │  (Function to process queue)                    │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│         Executes queued operations                     │
└─────────────────────────────────────────────────────────┘
```

---

## Comparison with Original Catalog

| Catalog Hook | Filter-Related? | New Hook | Filter-Related? |
|--------------|-----------------|----------|-----------------|
| `renderDiagnostics` hook | ❌ NO | `window.isFilterOperation` | ✅ YES |
| `handleResult` hook | ❌ NO | `window.queueFilterOperation` | ✅ YES |
| `switchTab` hook | ❌ NO | `window.processPendingFilterOperations` | ✅ YES |
| Global initialization | ❌ NO | | |
| Editor initialization | ❌ NO | | |
| Inline editing initialization | ❌ NO | | |

**Finding:** The original catalog (bf-56np0) contained 0 filter-related hooks. These 3 hooks represent the complete set of filter-related coordination hooks in the application.

---

## Usage from External Code

### Example 1: Custom Filter with Guard Protection

```javascript
// From external script or console
window.isFilterOperation = true;
// Perform filter operation that would normally trigger smart ordering
// ...
window.isFilterOperation = false;
```

### Example 2: Queue Operations During Active Smart Ordering

```javascript
// Check if smart ordering is active
if (window.isSmartOrdering && window.isSmartOrdering()) {
  // Queue operation for deferred execution
  window.queueFilterOperation(() => {
    console.log('Custom filter operation');
  }, 'Custom filter');
} else {
  // Execute immediately
  console.log('Custom filter operation');
}
```

### Example 3: Monitor and Clear Queue

```javascript
// Check pending operations
console.log('Pending operations:', window.pendingFilterOperations);

// Clear queue if needed
window.pendingFilterOperations = [];
```

---

## Key Architectural Insights

### 1. Global Exposure Pattern
All three hooks are exposed via `window` object for external access and testing, enabling integration without direct code modification.

### 2. Guard Flag Pattern
The `isFilterOperation` flag prevents race conditions by signaling to `renderPreviews()` that it should skip smart ordering logic.

### 3. Queue-Based Deferment
Operations queued during smart ordering execute automatically after completion, preventing timing conflicts.

### 4. Error Isolation
Queue processing uses try-catch to ensure one failed operation doesn't block others.

### 5. Debug Support
Built-in console logging when `DEBUG_SMART_ORDERING` is enabled provides visibility into queue operations.

---

## Summary

This document provides complete code snippets for the **3 filter-related hooks** that were missing from the original catalog:

1. **`window.isFilterOperation`** - Boolean guard flag (lines 5046-5048, 6279)
2. **`window.queueFilterOperation`** - Queue function (lines 5055, 7942-7947)
3. **`window.processPendingFilterOperations`** - Processor function (lines 5056, 7952-7974)

These hooks enable external coordination with VISTA's filter operations through guard flags and queue-based deferment mechanisms.

**Total lines documented:** 23 lines across 3 hooks  
**Related declarations:** 2 additional lines  
**Usage patterns:** 3 distinct patterns identified  
**External integration points:** 3 global hooks exposed

---

**Status:** Complete and Verified  
**Related Beads:** bf-294pn (hook identification), bf-56np0 (original catalog), bf-5zc7m (comprehensive analysis)  
**Source:** `/home/coding/vista/src/public/app.js`  
**Bead:** bf-dhvox  
**Generated:** 2026-07-24
