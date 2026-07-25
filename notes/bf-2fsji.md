# Filter Queue Array Declarations in app.js

## Primary Filter Queue Array

### `pendingFilterOperations`
- **Line:** 6281
- **Declaration:** `let pendingFilterOperations = [];`
- **Purpose:** Queue filter operations during smart ordering
- **Context:** Located in the guard flags section for preventing race conditions during smart ordering
- **Accessibility:** Global scope, accessible throughout the app
- **Exposed via:** `Object.defineProperty(window, 'pendingFilterOperations', {...})` at line 5050

## Related Queue Variables (Non-Array)

### `pendingRenderData`
- **Line:** 6275
- **Declaration:** `let pendingRenderData = null;`
- **Purpose:** Queue renderPreviews calls during smart ordering
- **Type:** Object/Any (stores render data, not an array)

### `pendingRenderAfterCurrent`
- **Line:** 6277
- **Declaration:** `let pendingRenderAfterCurrent = null;`
- **Purpose:** Queue renders during active render
- **Type:** Object/Any (stores render data, not an array)

### `pendingApplySmartOrder`
- **Line:** 6274
- **Declaration:** `let pendingApplySmartOrder = false;`
- **Purpose:** Guard flag for pending smart order operations
- **Type:** Boolean (not an array)

## Related Guard Flags (Context)

All located in the smart ordering race condition guard section (lines 6272-6282):

- `isApplyingSmartOrder` (line 6273): Guard flag to prevent race conditions
- `isRendering` (line 6276): Guard flag to prevent concurrent renders
- `isFilterOperation` (line 6279): Guard flag to prevent smart order resets during filter changes
- `isSmartOrderingActive` (line 6280): Track when smart ordering is currently active
- `currentPageType` (line 6278): Track current page type for stale cardOrder detection

## Queue Functions

### `queueFilterOperation(operation, description)`
- **Line:** 7942
- **Purpose:** Queue a filter operation to be processed after smart ordering completes
- **Usage:** `pendingFilterOperations.push({ operation, description });`
- **Exposed globally:** `window.queueFilterOperation` (line 5055)

### `processPendingFilterOperations()`
- **Line:** 7952
- **Purpose:** Process pending filter operations after smart ordering completes
- **Operations:** 
  1. Checks if queue is empty (returns if true)
  2. Creates a copy of the operations array to avoid modification during iteration
  3. Clears the queue: `pendingFilterOperations = [];`
  4. Iterates and executes each operation
- **Exposed globally:** `window.processPendingFilterOperations` (line 5056)

## Usage Pattern

The filter queue pattern works as follows:
1. When a filter operation needs to be executed during smart ordering, it's queued via `queueFilterOperation()`
2. Operations are stored as objects with `operation` (function) and `description` (string) properties
3. Once smart ordering completes, `processPendingFilterOperations()` executes all queued operations
4. The queue is cleared before execution to prevent re-processing

## Scope Summary

- **Primary Queue Array:** `pendingFilterOperations` (line 6281)
- **Related Queues:** 2 additional queue variables (pendingRenderData, pendingRenderAfterCurrent)
- **Global Access:** All exposed via window object for debugging
- **Functions:** 2 main functions for managing the queue
- **File:** `/home/coding/vista/src/public/app.js`
- **Total Lines:** 367.1KB (large file, queued operations in smart ordering system)
