# Filter Operation Guard Patterns Documentation

## Bead: bf-6cu5f
**Task:** Search for filter operation guard patterns  
**Date:** 2026-07-24  
**Status:** COMPLETE

---

## Overview

This document catalogs all guard flag and guard function patterns in `/home/coding/vista/src/public/app.js` that prevent unintended side effects during filter operations and smart ordering.

---

## Guard Flags (Line 6273-6281)

All guard flags are declared together in a centralized section:

```javascript
// ── Guard flags to prevent race conditions during smart ordering ──
let isApplyingSmartOrder = false;           // Line 6273
let pendingApplySmartOrder = false;         // Line 6274
let pendingRenderData = null;               // Line 6275
let isRendering = false;                   // Line 6276
let pendingRenderAfterCurrent = null;       // Line 6277
let currentPageType = null;                 // Line 6278
let isFilterOperation = false;              // Line 6279 - KEY GUARD FOR FILTERS
let isSmartOrderingActive = false;          // Line 6280
let pendingFilterOperations = [];           // Line 6281
```

---

## Primary Guard: `isFilterOperation`

**Declaration:** Line 6279  
**Purpose:** Prevents smart order resets during filter changes  
**What it protects against:** Unintended clearing of `cardOrder` when users hide/show platforms

### Pattern 1: Guard Set with Render (Import Preferences)
**Lines:** 8095-8099

```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Sets guard before render, clears asynchronously after render completes  
**When used:** User imports platform preferences (triggers full re-render)

### Pattern 2: Guard Set with Deferred Execution
**Lines:** 8080-8082, 8144-8146, 8263-8265

```javascript
// Inside queued operation wrapper
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  isSmartOrderingActive = false;  // Also clears smart ordering flag
};
```

**Purpose:** Same guard pattern but wrapped for deferred execution when smart ordering is active  
**When used:** When smart ordering is active and operation needs to be queued

### Pattern 3: Guard Check in Critical Path
**Lines:** 8792-8796

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
} else {
  // Clear cardOrder for groups that weren't manually modified by user
  // ... (lines 8801-8814)
}
```

**Purpose:** CRITICAL GUARD - Prevents clearing of cardOrder during filter operations  
**Location:** Inside `applySmartOrdering()` function  
**What it protects:** User's manually set platform order from being reset when page type changes during filter operations

---

## Secondary Guard: `isApplyingSmartOrder`

**Declaration:** Line 6273  
**Purpose:** Prevents concurrent renders during smart ordering DOM manipulation  
**What it protects against:** Race conditions where renders could execute during DOM reordering

### Pattern 1: Guard Set Before DOM Manipulation
**Lines:** 8996-9002

```javascript
function applySmartOrderingSafe() {
  // If already applying, queue a pending application
  if (isApplyingSmartOrder) {
    console.log('[applySmartOrderingSafe] Already applying - queueing pending operation');
    pendingApplySmartOrder = true;
    return;
  }

  // Set guard flag BEFORE try block - this ensures no render can execute during DOM reordering
  isApplyingSmartOrder = true;
  pendingApplySmartOrder = false;

  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrderingSafe] Guard flag SET (true) - starting smart ordering');
  }

  try {
    // Step 1: Update platformPrefs.cardOrder with smart ordering
    applySmartOrdering();
    // Step 2: Reorder DOM elements
    reorderPlatformCards();
  } finally {
    // Always clear guard flag AFTER all operations complete
    isApplyingSmartOrder = false;
  }
}
```

**Purpose:** Thread-safe execution of smart ordering  
**Check pattern:** Early return if already set (line 8990)  
**Reset pattern:** Always cleared in `finally` block (line 9028)

### Pattern 2: Render Queue Check
**Lines:** 9037-9043

```javascript
// Step 4: Process any queued render AFTER the flag is cleared
if (pendingRenderData) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[applySmartOrderingSafe] Processing queued render with updated cardOrder (flag now false)');
  }
  const dataToRender = pendingRenderData;
  pendingRenderData = null; // Clear before rendering to prevent re-queue
  renderPreviews(dataToRender);
}
```

**Purpose:** Ensures renders only execute after guard is cleared  
**Location:** After `finally` block in `applySmartOrderingSafe()`

---

## Tertiary Guard: `isSmartOrderingActive`

**Declaration:** Line 6280  
**Purpose:** Runtime flag tracking when smart ordering is currently in progress  
**What it protects against:** Filter operations interfering with active smart ordering

### Pattern 1: Guard Set After Smart Ordering
**Lines:** 9008-9012

```javascript
// Set smart ordering active flag after successful application
isSmartOrderingActive = true;
if (DEBUG_SMART_ORDERING) {
  console.log('[applySmartOrderingSafe] Smart ordering active flag SET');
}
```

**Purpose:** Marks that smart ordering is now active and in effect  
**When set:** After `applySmartOrdering()` succeeds but before DOM reordering

### Pattern 2: Guard Cleared on User Manual Override
**Lines:** 8083-8086, 8102-8104

```javascript
// Clear smart ordering active flag since user manually imported preferences
isSmartOrderingActive = false;
if (DEBUG_SMART_ORDERING) {
  console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
}
```

**Purpose:** User action takes precedence over automatic smart ordering  
**When cleared:** When user manually imports preferences or toggles modes

### Pattern 3: Guard Check in Decision Logic
**Line:** 8792, 8905, 8077, 8142

```javascript
if (isFilterOperation || isSmartOrdering()) {
  // Skip cardOrder clearing
}

if (isSmartOrdering()) {
  // Queue operation for later
  const applyImportedPrefs = () => { /* ... */ };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}
```

**Purpose:** Determines if operations should be deferred or skipped  
**Usage:** Throughout filter handlers and smart ordering logic

---

## Guard Functions

### Function: `isSmartOrdering()`
**Lines:** 7933-7935

```javascript
/**
 * Centralized guard function that checks BOTH the user preference and runtime state
 * to determine if smart ordering is currently active. This is the primary guard to
 * use before any operation that might interfere with smart ordering.
 *
 * @returns {boolean} True if smart ordering is BOTH enabled AND currently active
 */
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Primary guard function - checks both preference and runtime state  
**Returns:** `true` only if user has enabled smart ordering AND it's currently active  
**Usage:** Called before operations that should defer during smart ordering

### Function: `shouldDeferFilterOperation()`
**Lines:** 7891-7893

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Simplified check for deferring filter operations  
**Returns:** `true` if smart ordering is currently active

### Function: `queueFilterOperation()`
**Lines:** 7942-7947

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Queues filter operations for later execution  
**Parameters:** 
- `operation`: Function to execute later
- `description`: Debug label for logging

### Function: `processPendingFilterOperations()`
**Lines:** 7952-7967

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice(); // Copy array
  pendingFilterOperations = []; // Clear queue

  operations.forEach(({ operation, description }) => {
    if (DEBUG_SMART_ORDERING) {
      console.log(`[processPendingFilterOperations] Executing: ${description}`);
    }
    try {
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing ${description}:`, error);
    }
  });
}
```

**Purpose:** Executes queued filter operations after smart ordering completes  
**When called:** After `applySmartOrderingSafe()` finishes

---

## Guard Wrapper Utilities

### File: `/home/coding/vista/src/public/filter-guard-wrapper.js`

#### Function: `guardWrapper(handlerName, handlerFunction)`
**Lines:** 47-62

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

**Purpose:** Wraps filter handlers to automatically defer during smart ordering  
**Usage:** 

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

#### Function: `guardWrapperWithRender(handlerName, handlerFunction)`
**Lines:** 88-107

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

**Purpose:** Extended wrapper that also handles render guards and smart ordering flag clearing  
**Additional features:** 
- Sets `isFilterOperation` guard
- Clears `isSmartOrderingActive` flag
- Handles undefined guard variables gracefully

---

### File: `/home/coding/vista/src/public/guard-utils.js`

#### Function: `isSmartOrdering()`
**Lines:** 39-46

```javascript
function isSmartOrdering() {
  const prefs = window.platformPrefs || {};
  const userPreference = prefs.smartOrdering !== false; // Default is true
  const runtimeState = window.isSmartOrderingActive || false;
  return userPreference && runtimeState;
}
```

**Purpose:** Window-exposed version of smart ordering check for cross-module usage  
**Exposed as:** `window.isSmartOrdering`

#### Function: `isSmartOrderingEnabled()`
**Lines:** 61-64

```javascript
function isSmartOrderingEnabled() {
  const prefs = window.platformPrefs || {};
  return prefs.smartOrdering !== false; // Default is true
}
```

**Purpose:** Checks only user preference, not runtime state  
**Use case:** To determine if smart ordering feature is allowed (not necessarily active)

#### Function: `isFilterOperationInProgress()`
**Lines:** 78-80

```javascript
function isFilterOperationInProgress() {
  return window.isFilterOperation || false;
}
```

**Purpose:** Checks if filter operation is currently in progress  
**Exposed as:** `window.isFilterOperationInProgress`

---

## Guard Usage Examples in app.js

### Example 1: Import Preferences Handler (Lines 8075-8104)
```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;           // SET GUARD
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);  // CLEAR GUARD
    isSmartOrderingActive = false;       // CLEAR SMART ORDERING
    if (DEBUG_SMART_ORDERING) {
      console.log('[importPreferences] Smart ordering active flag CLEARED');
    }
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}

// Immediate path when smart ordering not active
isFilterOperation = true;                // SET GUARD
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);  // CLEAR GUARD
isSmartOrderingActive = false;          // CLEAR SMART ORDERING
```

### Example 2: Toggle What-If Mode (Lines 8140-8160)
```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;           // SET GUARD
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);  // CLEAR GUARD
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  return;
}

// Immediate path
isFilterOperation = true;                // SET GUARD
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);  // CLEAR GUARD
```

### Example 3: What-If Mode Apply (Lines 8261-8265)
```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;                // SET GUARD
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);  // CLEAR GUARD
```

### Example 4: Toggle Hidden Using Guard Wrapper (Line 7978)
```javascript
guardWrapperWithRender('toggleHidden', () => {
  // Handler logic
  if (platformPrefs.hidden.has(pid)) {
    platformPrefs.hidden.delete(pid);
  } else {
    platformPrefs.hidden.add(pid);
  }
  savePlatformPrefs();
  updateHiddenList();
  // renderPreviews called automatically by wrapper
});
```

### Example 5: Toggle Favorite Using Guard Wrapper (Line 7868)
```javascript
guardWrapper('toggleFavorite', () => {
  // Handler logic
  if (platformPrefs.favorites.has(pid)) {
    platformPrefs.favorites.delete(pid);
  } else {
    platformPrefs.favorites.add(pid);
  }
  savePlatformPrefs();
  updateFavoritesList();
  renderPreviews(currentData);  // Manual render call
});
```

---

## Guard Exposure for Testing (Lines 5042-5056)

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
```

**Purpose:** Exposes internal guard state for integration testing and debugging

---

## Summary of Guard Patterns

### Guard Reset Patterns

1. **Immediate Async Clear:**
   ```javascript
   isFilterOperation = true;
   renderPreviews(data);
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```
   - Used for: Operations that trigger renders
   - Timing: Clears in next event loop after render starts

2. **Finally Block Clear:**
   ```javascript
   try {
     isApplyingSmartOrder = true;
     // DOM manipulation
   } finally {
     isApplyingSmartOrder = false;
   }
   ```
   - Used for: Critical sections that must complete
   - Timing: Clears after try/catch/finally completes

3. **Manual Clear on User Override:**
   ```javascript
   isSmartOrderingActive = false;
   console.log('User manual override');
   ```
   - Used for: User actions that take precedence
   - Timing: Immediate clear when user intervenes

### Guard Check Patterns

1. **Early Return Pattern:**
   ```javascript
   if (isSmartOrdering()) {
     queueFilterOperation(operation, 'description');
     return;
   }
   ```
   - Used for: Deferring operations during smart ordering

2. **Conditional Skip Pattern:**
   ```javascript
   if (isFilterOperation || isSmartOrdering()) {
     // Skip operation with debug log
   } else {
     // Execute operation
   }
   ```
   - Used for: Skipping order resets during critical operations

3. **Queue-Process Pattern:**
   ```javascript
   if (isApplyingSmartOrder) {
     pendingApplySmartOrder = true;
     return;
   }
   ```
   - Used for: Preventing concurrent executions

---

## Key Insights

1. **Three-Tier Guard System:**
   - `isFilterOperation`: Prevents order resets during filter changes
   - `isApplyingSmartOrder`: Prevents concurrent renders during DOM manipulation
   - `isSmartOrderingActive`: Runtime flag for active smart ordering state

2. **Guard Coordination:**
   - Guards are set in specific order (applyingSmartOrder → smartOrderingActive)
   - Guards are cleared in reverse order (smartOrderingActive → applyingSmartOrder)
   - Filter operations check multiple guards before proceeding

3. **Queue-Then-Execute Pattern:**
   - Operations check guards first
   - If guards are set, operations are queued
   - Queued operations execute after guards clear
   - Prevents race conditions while maintaining operation order

4. **User Precedence:**
   - Manual user actions clear `isSmartOrderingActive`
   - User drag operations persist through smart ordering
   - Manual overrides take automatic precedence

5. **Debug Visibility:**
   - All guard changes log when `DEBUG_SMART_ORDERING` is true
   - Guards are exposed via `window` object for testing
   - Detailed logging shows guard state transitions

---

## Files Containing Guard Patterns

1. **`/home/coding/vista/src/public/app.js`** - Main application with all guard flags and functions
2. **`/home/coding/vista/src/public/filter-guard-wrapper.js`** - Reusable guard wrapper utilities
3. **`/home/coding/vista/src/public/guard-utils.js`** - Centralized guard functions exposed to window

---

## Verification Notes

- All guard flags are declared in a centralized section (lines 6273-6281)
- Guard functions are documented with JSDoc comments explaining purpose and usage
- Guard exposure for testing is explicitly marked (lines 5041-5056)
- Guard wrapper utilities handle undefined guard variables gracefully
- Queue/process pattern ensures no operations are lost during guard periods
