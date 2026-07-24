# Filter State Variables Documentation - app.js

## Overview
This document catalogs all state variables in `/home/coding/vista/src/public/app.js` that track filter state, including their line numbers, initialization patterns, and queue operations.

## Primary Filter State Variables

### 1. `isFilterOperation` (Line 6279)
**Location:** `/home/coding/vista/src/public/app.js:6279`

**Declaration:**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Purpose:** Guard flag to prevent smart order resets during filter changes

**Usage Pattern:**
```javascript
// Set guard flag before filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after operation
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Used with Queue Operations:** Yes - Checked in smart ordering logic to prevent race conditions

**Also exposed as global property:**
```javascript
// Lines 5046-5048
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

---

### 2. `pendingFilterOperations` (Line 6281)
**Location:** `/home/coding/vista/src/public/app.js:6281`

**Declaration:**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Purpose:** Queue filter operations during smart ordering

**Queue Operations:**
```javascript
// Add to queue (Line 7946)
pendingFilterOperations.push({ operation, description });

// Process queue (Lines 7962-7963)
const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
pendingFilterOperations = []; // Clear queue
```

**Used with Queue Functions:**
- `queueFilterOperation(operation, description)` - Lines 7942-7947
- `processPendingFilterOperations()` - Lines 7952-7975

**Also exposed as global property:**
```javascript
// Lines 5050-5052
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

---

### 3. `pendingWhatIfTags` (Line 12)
**Location:** `/home/coding/vista/src/public/app.js:12`

**Declaration:**
```javascript
let pendingWhatIfTags = null; // Store pending What If tags from hash before data loads
```

**Purpose:** Store pending What If tags from hash before data loads

**Usage Pattern:**
```javascript
// Store tags from hash when data not yet available (Line 484)
pendingWhatIfTags = tags;

// Apply when data becomes available (Lines 8286-8311)
function applyPendingWhatIfTags() {
  if (!pendingWhatIfTags || !currentData) return;
  // ... applies pending What If tags
  pendingWhatIfTags = null; // Clear after application
}
```

---

### 4. `whatIfMode` (Line 8118)
**Location:** `/home/coding/vista/src/public/app.js:8118`

**Declaration:**
```javascript
let whatIfMode = false;
```

**Purpose:** Track whether What If mode is currently active

**Usage Pattern:**
```javascript
// Toggle What If mode (Line 8122)
whatIfMode = !whatIfMode;

// Check in hash state restoration (Line 463)
if (state.without) {
  whatIfMode = true;
  // ... enable What If mode
}
```

---

### 5. `disabledTags` (Line 8119)
**Location:** `/home/coding/vista/src/public/app.js:8119`

**Declaration:**
```javascript
let disabledTags = new Set();
```

**Purpose:** Set of tags disabled in What If mode

**Usage Patterns:**
```javascript
// Add disabled tag (Line 8209)
disabledTags.add(cb.dataset.tag);

// Remove tag (Line 8211)
disabledTags.delete(cb.dataset.tag);

// Clear all (Line 8237)
disabledTags.clear();

// Iterate for applying changes (Lines 8247-8259)
disabledTags.forEach(tag => {
  // ... modify meta by removing disabled tags
});

// Convert to comma-separated string for hash (Line 423)
const without = Array.from(disabledTags).join(',');
```

---

## Queue-Related State Variables (Used with Filter Operations)

### 6. `pendingApplySmartOrder` (Line 6274)
**Location:** `/home/coding/vista/src/public/app.js:6274`

**Declaration:**
```javascript
let pendingApplySmartOrder = false;
```

**Purpose:** Track pending smart order application

**Context:** Part of guard flags system to prevent race conditions

---

### 7. `pendingRenderData` (Line 6275)
**Location:** `/home/coding/vista/src/public/app.js:6275`

**Declaration:**
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Purpose:** Queue renderPreviews calls during smart ordering

**Used with Queue Operations:** Yes - stores render data to be processed after smart ordering completes

---

### 8. `pendingRenderAfterCurrent` (Line 6277)
**Location:** `/home/coding/vista/src/public/app.js:6277`

**Declaration:**
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Purpose:** Queue renders during active render

**Used with Queue Operations:** Yes - prevents concurrent renders

---

## Guard Flags Related to Filter Operations

### 9. `isSmartOrderingActive` (Line 6280)
**Location:** `/home/coding/vista/src/public/app.js:6280`

**Declaration:**
```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```

**Purpose:** Track when smart ordering is currently active

**Used in Filter Logic:** 
- Checked in `isSmartOrdering()` function (Line 7934)
- Used to determine if filter operations should be queued (Lines 8077, 8142)

---

### 10. `isApplyingSmartOrder` (Line 6273)
**Location:** `/home/coding/vista/src/public/app.js:6273`

**Declaration:**
```javascript
let isApplyingSmartOrder = false;
```

**Purpose:** Prevents concurrent renders during smart ordering

**Related to Filter Operations:** Part of the race condition prevention system that filter operations interact with

---

## Hash State Filter Variables

### 11. `state.without` (Derived from hash)
**Location:** Parsing at lines 436-459

**Pattern:**
```javascript
// Parse from hash (Lines 436-459)
const state = getHashState();
if (state.without) {
  const tags = state.without.split(',').filter(t => t);
  // ... applies What If filtering
}
```

**Purpose:** Hash-encoded filter state for disabled tags

---

## Key Functions Using Filter State Variables

### Queue Management Functions

#### `queueFilterOperation(operation, description)` (Lines 7942-7947)
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

#### `processPendingFilterOperations()` (Lines 7952-7975)
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }
  
  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }
  
  // Process each pending operation
  const operations = pendingFilterOperations.slice(); // Copy array
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

### Filter Operation Examples with State Variables

#### Import Preferences Filter Operation (Lines 8077-8092)
```javascript
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
```

#### What If Mode Filter Operation (Lines 8142-8152)
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
```

---

## Summary

**Total Filter State Variables Found:** 11
- **Primary filter state:** 5 variables
- **Queue-related state:** 3 variables  
- **Guard flags:** 3 variables
- **Hash-derived state:** 1 variable

**All filter state variables use queue operations:** Yes, the primary filter operations (`isFilterOperation` + `pendingFilterOperations`) implement a queue pattern to prevent race conditions with smart ordering.

**Key Pattern:** Filter operations check `isSmartOrdering()`, and if active, queue the operation for later execution rather than executing immediately. This prevents filter operations from interfering with smart ordering reordering logic.
