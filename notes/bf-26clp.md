# Filter State Variables Documentation (bf-26clp)

## Overview
This document tracks all filter state variables found in the VISTA codebase, including their line numbers, initialization code, variable types, and initial value structures.

## Primary Filter State Variables

### 1. `isFilterOperation`
- **Line Number:** 6279
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `false` (boolean)
- **Initialization Code:**
  ```javascript
  let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
  ```
- **Purpose:** Guard flag to prevent smart order resets during filter changes
- **Access Pattern:** Exposed via `window.isFilterOperation` for cross-module access
- **Related Guard Function:** `window.isFilterOperationInProgress()` in `guard-utils.js` (line 78-80)

### 2. `pendingFilterOperations`
- **Line Number:** 6281
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `[]` (empty array)
- **Initialization Code:**
  ```javascript
  let pendingFilterOperations = []; // Queue filter operations during smart ordering
  ```
- **Purpose:** Queue filter operations during smart ordering to prevent race conditions
- **Usage Pattern:** Operations are queued via `push()` and executed via `slice()` to avoid modification during iteration (line 7962)

## Related Queue Operation State Variables

### 3. `pendingApplySmartOrder`
- **Line Number:** 6274
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `false` (boolean)
- **Initialization Code:**
  ```javascript
  let pendingApplySmartOrder = false;
  ```
- **Purpose:** Tracks pending smart order application requests
- **Context:** Located in the "Guard flags to prevent race conditions during smart ordering" section

### 4. `pendingRenderData`
- **Line Number:** 6275
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `null`
- **Initialization Code:**
  ```javascript
  let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
  ```
- **Purpose:** Queue renderPreviews calls during smart ordering
- **Usage Pattern:** Stores render data that should be applied after current smart ordering completes

### 5. `pendingRenderAfterCurrent`
- **Line Number:** 6277
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `null`
- **Initialization Code:**
  ```javascript
  let pendingRenderAfterCurrent = null; // Queue renders during active render
  ```
- **Purpose:** Queue renders during active render to prevent concurrent renders
- **Usage Pattern:** Referenced at line 1716 as `dataToRender`

## Related Guard State Variables

### 6. `isApplyingSmartOrder`
- **Line Number:** 6273
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `false` (boolean)
- **Initialization Code:**
  ```javascript
  let isApplyingSmartOrder = false;
  ```
- **Purpose:** Prevents concurrent smart ordering operations

### 7. `isRendering`
- **Line Number:** 6276
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `false` (boolean)
- **Initialization Code:**
  ```javascript
  let isRendering = false; // Guard flag to prevent concurrent renders
  ```
- **Purpose:** Guard flag to prevent concurrent renders

### 8. `isSmartOrderingActive`
- **Line Number:** 6280
- **File:** `src/public/app.js`
- **Variable Type:** `let`
- **Initial Value:** `false` (boolean)
- **Initialization Code:**
  ```javascript
  let isSmartOrderingActive = false; // Track when smart ordering is currently active
  ```
- **Purpose:** Track when smart ordering is currently active
- **Access Pattern:** Exposed via `window.isSmartOrderingActive` for cross-module access

## Section Context
All filter state variables are located in the "Guard flags to prevent race conditions during smart ordering" section (lines 6272-6281) in `src/public/app.js`.

## Cross-Module Access
Filter state variables are accessed from `guard-utils.js` via the `window` object:
- `window.isFilterOperation` → checked by `isFilterOperationInProgress()` (line 79)
- `window.isSmartOrderingActive` → checked by `isSmartOrdering()` (line 43)

## Queue Operation Association Analysis
These filter state variables work together to manage the queue of operations during smart ordering:

1. **Operation Start:** `isFilterOperation` set to `true`
2. **Operation Queue:** Filter operations pushed to `pendingFilterOperations[]`
3. **Operation Execution:** Processed via `slice()` to avoid modification during iteration
4. **Operation Complete:** `isFilterOperation` reset to `false`

This pattern prevents race conditions and ensures that filter operations don't interfere with smart ordering processes.
