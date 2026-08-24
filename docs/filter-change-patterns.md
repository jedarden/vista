# Vista Filter-Change Pattern Documentation

This document compiles all filter-change event listener patterns found in Vista's `app.js`, organized by pattern type with line numbers, code snippets, and implementation context.

## Table of Contents

1. [Overview](#overview)
2. [Pattern Type 1: Direct Event Listener Registration](#pattern-type-1-direct-event-listener-registration)
3. [Pattern Type 2: Filter Operation Guard System](#pattern-type-2-filter-operation-guard-system)
4. [Pattern Type 3: Smart Ordering Integration](#pattern-type-3-smart-ordering-integration)
5. [Pattern Type 4: Queued Filter Operations](#pattern-type-4-queued-filter-operations)
6. [Complete Reference Summary](#complete-reference-summary)

---

## Overview

Vista implements a sophisticated filter-change system with multiple patterns:

- **Direct input event listeners** for real-time filtering (metadata table, command palette)
- **Guard flags** to prevent conflicts during smart ordering operations
- **Queue system** for deferring filter operations during active smart ordering
- **Global state exposure** for testing and debugging

All patterns work together to ensure filter changes don't interfere with smart ordering while maintaining responsive UI updates.

---

## Pattern Type 1: Direct Event Listener Registration

### Pattern: `addEventListener('input', handler)`

Direct attachment of filter handlers to input elements for real-time filtering.

#### Implementation 1: Metadata Table Filter

**Location:** Lines 4416-4422

**Code:**
```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context:**
- Attached after rendering the metadata table (line 4369-4423)
- Filters metadata tags by name or value
- Shows filtered count: `${filteredRows.length} of ${allMetadataRows.length} tags`
- Re-renders table on each input event

**Handler Function:**
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders table with filteredRows
}
```

**Lines:** 4369-4423

---

#### Implementation 2: Command Palette Filter

**Location:** Lines 9567

**Code:**
```javascript
input.addEventListener('input', filterCommands);
```

**Context:**
- Attached in command palette initialization (line 9547-9585)
- Filters command list by label or category
- Updates selected index on filter

**Handler Function:**
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

**Lines:** 9659-9674

---

## Pattern Type 2: Filter Operation Guard System

### Pattern: Global Guard Flags

Global boolean flags to prevent smart order resets during filter operations.

#### Guard Flag Declarations

**Location:** Lines 6761-6763

**Code:**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

#### Global Exposure (for Testing)

**Location:** Lines 5472-5482

**Code:**
```javascript
// Expose guard functions and state for integration testing
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

**Purpose:** Allows integration tests to read and manipulate guard state

---

### Guard Flag Usage Pattern

**Standard Pattern:**
```javascript
// Set guard before filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear guard after operation (async)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Locations Using This Pattern:**
- Line 8578-8581: Import preferences filter operation
- Line 8638-8641: What If mode reset filter operation
- Line 8562-8564: Import preferences with smart ordering defer

---

## Pattern Type 3: Smart Ordering Integration

### Pattern: Smart Ordering Check Before Filter

Check if smart ordering is active before executing filter operations.

#### Smart Ordering Guard Function

**Location:** Lines 8415-8417

**Code:**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Documentation (Lines 8378-8414):**
```javascript
/**
 * Check if smart ordering is currently active
 *
 * Centralized guard function that checks BOTH the user preference and runtime state
 * to determine if smart ordering is currently active. This is the primary guard to
 * use before any operation that might interfere with smart ordering.
 *
 * **Checks two conditions:**
 * 1. User preference: `platformPrefs.smartOrdering` (is smart ordering enabled?)
 * 2. Runtime state: `isSmartOrderingActive` (is smart ordering currently in progress?)
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
```

---

#### Smart Ordering Defer Pattern

**Location:** Lines 8558-8574

**Code:**
```javascript
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
```

**Context:** Import preferences handler - defers filter if smart ordering is active

**Similar Pattern at Lines 8623-8634:**
```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  // ... logging
  return;
}
```

---

### Card Order Clear Guard

**Location:** Lines 9272-9277

**Code:**
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[renderPreviews] Skipping cardOrder clear: ${isFilterOperation ? 'filter operation in progress' : 'smart ordering is active'}`);
  }
  return;
}
```

**Context:** Prevents card order clearing during filter operations or smart ordering

---

## Pattern Type 4: Queued Filter Operations

### Pattern: Filter Operation Queue System

Queue system for deferring filter operations during active smart ordering.

#### Queue Function

**Location:** Lines 8424-8429

**Code:**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Adds filter operation to queue with description for debugging

---

#### Process Queue Function

**Location:** Lines 8434-8457

**Code:**
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

**Purpose:** Executes all queued filter operations after smart ordering completes

---

#### Global Exposure

**Location:** Lines 5481-5482

**Code:**
```javascript
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Purpose:** Exposes queue functions for testing and debugging

---

## Complete Reference Summary

### All Filter-Change Patterns by Type

| Pattern Type | Count | Locations |
|--------------|-------|------------|
| Direct Event Listeners | 2 | Lines 4419, 9567 |
| Guard Flag Declarations | 3 | Lines 6761-6763, 5472-5482 |
| Smart Ordering Checks | 3 | Lines 8415-8417, 8558-8574, 8623-8634 |
| Queue Operations | 4 | Lines 8424-8429, 8434-8457, 5481-5482 |
| Card Order Guards | 1 | Lines 9272-9277 |

### Filter Handler Functions

| Function | Line Range | Purpose |
|----------|-----------|---------|
| `renderMetadataTable(filter)` | 4369-4423 | Filters and renders metadata table |
| `filterCommands(e)` | 9659-9674 | Filters command palette items |
| `isSmartOrdering()` | 8415-8417 | Checks if smart ordering is active |
| `queueFilterOperation(op, desc)` | 8424-8429 | Queues filter operation |
| `processPendingFilterOperations()` | 8434-8457 | Processes queued operations |

### Global State Variables

| Variable | Line | Purpose |
|----------|------|---------|
| `isFilterOperation` | 6761 | Guard flag for filter operations |
| `pendingFilterOperations` | 6763 | Queue for deferred operations |
| `isSmartOrderingActive` | (global) | Runtime flag for smart ordering |

### Event Listener Registrations

| Element | Event | Handler | Line |
|---------|-------|---------|------|
| `#metadataFilterInput` | input | `renderMetadataTable(e.target.value)` | 4419 |
| `#commandInput` | input | `filterCommands` | 9567 |

### Key Integration Points

1. **Import Preferences** (Lines 8558-8588)
   - Checks `isSmartOrdering()` before applying
   - Queues operation if smart ordering active
   - Sets `isFilterOperation = true` guard

2. **What If Mode Toggle** (Lines 8603-8644)
   - Checks `isSmartOrdering()` before resetting
   - Queues operation if smart ordering active
   - Sets `isFilterOperation = true` guard

3. **Render Previews** (Lines 9272-9277)
   - Skips card order clear if `isFilterOperation` is true
   - Skips card order clear if `isSmartOrdering()` is true

---

## Usage Guidelines

### When to Use Each Pattern

1. **Direct Event Listeners** - Use for simple, real-time filtering (UI-only, no state conflicts)
2. **Guard Flags** - Use when filter operation affects global state (platform ordering, card layout)
3. **Smart Ordering Check** - Use before operations that might conflict with active smart ordering
4. **Queue System** - Use when operation must be deferred during active smart ordering

### Best Practices

1. **Always set guard flag** before filter operations that modify state
2. **Check smart ordering** before operations that might conflict
3. **Queue operations** that can wait for smart ordering to complete
4. **Clear guard asynchronously** using `setTimeout(() => { isFilterOperation = false; }, 0)`
5. **Provide descriptions** for queued operations for debugging

### Debugging

Enable `DEBUG_SMART_ORDERING` flag to see filter operation flow:
- Queue operations: `[queueFilterOperation] Queuing: {description}`
- Process operations: `[processPendingFilterOperations] Processing {count} pending operations`
- Smart ordering checks: `[functionName] Smart ordering active - operation queued`

---

## Related Documentation

- Smart Ordering System: See Vista architecture documentation
- Platform Preferences: See `platformPrefs` object documentation
- Card Ordering: See card ordering implementation docs

---

*Document compiled from Vista app.js filter-change pattern analysis*
*Generated: 2026-08-24*
