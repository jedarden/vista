# Queue Manipulation and Timing Patterns in app.js

## Overview
This document documents all queue manipulation and timing control patterns found in `/home/coding/vista/src/public/app.js`. The application uses sophisticated queuing mechanisms to prevent race conditions during concurrent operations, particularly during smart ordering and rendering.

## Queue State Variables (Lines 6273-6281)

```javascript
// Guard flags to prevent race conditions during smart ordering
let isApplyingSmartOrder = false;
let pendingApplySmartOrder = false;
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
let isRendering = false; // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let currentPageType = null; // Track current page type for stale cardOrder detection
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

---

## 1. FILTER OPERATION QUEUE

### Queue Addition (Enqueue)

**Location:** Lines 7942-7947
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Usage Examples:**

- **Line 8088:** Queue import preferences operation
```javascript
queueFilterOperation(applyImportedPrefs, 'importPreferences');
```

- **Line 8148:** Queue what-if reset operation
```javascript
queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
```

### Queue Processing (Dequeue)

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

**Pattern:** The queue is processed by copying the array, clearing the original, then iterating over the copy to prevent modification during iteration.

---

## 2. RENDER QUEUE

### Render Queue During Smart Ordering

**Queue Addition:** Line 1602
```javascript
if (isApplyingSmartOrder) {
  if (DEBUG_SMART_ORDERING) {
    console.log('[renderPreviews] Smart ordering in progress - queueing render with latest data');
  }
  // Store the latest data to render after smart ordering completes
  pendingRenderData = data;
  return; // Skip rendering during smart ordering to prevent race conditions
}
```

**Queue Processing:** Lines 9037-9043
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

### Render Queue During Active Render

**Queue Addition:** Lines 1587-1593
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

**Queue Processing:** Lines 1712-1720
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

**Pattern:** Uses `setTimeout(..., 0)` to avoid recursive call stack depth.

---

## 3. SMART ORDERING QUEUE

### Smart Ordering Queue Addition

**Location:** Lines 8989-2894
```javascript
if (isApplyingSmartOrder) {
  console.log('[applySmartOrderingSafe] Already applying - queueing pending operation');
  pendingApplySmartOrder = true;
  return;
}
```

### Smart Ordering Queue Processing

**Location:** Lines 9021-9025
```javascript
// Step 3: If another operation was queued, process it
if (pendingApplySmartOrder) {
  console.log('[applySmartOrderingSafe] Processing queued operation');
  setTimeout(applySmartOrderingSafe, 0);
}
```

**Pattern:** Boolean flag used as a single-slot queue. If already processing, sets flag to true and processes after completion.

---

## 4. UNDO STACK QUEUE

### Queue Addition and Size Management

**Location:** Lines 9284-9288
```javascript
if (!editorState.dirty) return;
editorUndoStack.push({ ...editorState.edited });
// Limit stack size
if (editorUndoStack.length > 50) editorUndoStack.shift();
```

**Pattern:** Classic FIFO queue with size limit using `push()` to add and `shift()` to remove oldest entry.

---

## 5. TIMING CONTROL PATTERNS

### Zero-Delay setTimeout (Async Scheduling)

**Pattern 1:** Avoid Recursive Call Stack (Line 1719)
```javascript
setTimeout(() => renderPreviews(dataToRender), 0);
```

**Pattern 2:** Process Queued Smart Ordering (Line 9024)
```javascript
setTimeout(applySmartOrderingSafe, 0);
```

**Pattern 3:** Screen Reader Announcements (Lines 73-76)
```javascript
setTimeout(() => {
  announcer.textContent = message;
}, 50);
```

### Delayed Operations

**Pattern 1:** Wait for Paste Completion (Lines 576-579)
```javascript
setTimeout(() => {
  switchMode('paste');
  htmlInput.value = trimmed;
  showToast('Detected HTML — switched to Paste mode', 2500);
```

**Pattern 2:** URL Shortener Detection (Lines 601-603)
```javascript
setTimeout(() => {
  showToast('Shortened URL — VISTA will follow redirects', 3000);
}, 100);
```

**Pattern 3:** Wait for JavaScript Execution (Line 967)
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

**Pattern 4:** Crossfade Animation Delays (Line 1067)
```javascript
await new Promise(resolve => setTimeout(resolve, 150));
```

**Pattern 5:** Perfect Score Celebration (Lines 1181-1184)
```javascript
setTimeout(() => {
  triggerConfetti();
  showPerfectScoreToast(data);
}, 300);
```

**Pattern 6:** Auto-hide Toast (Lines 1209-1212)
```javascript
toast._timer = setTimeout(() => {
  toast.classList.add('hidden');
}, 8000);
```

**Pattern 7:** Image Loading States (Line 2642)
```javascript
onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)"
```

### Animation Frame Scheduling

**Location:** Lines 1155-1160
```javascript
if (Date.now() < end) {
  requestAnimationFrame(frame);
}
```

**Pattern:** Used for smooth animations with time-bound execution.

### Filter Operation Guard Timing

**Location:** Line 8146
```javascript
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Pattern:** Reset guard flag after current event loop tick to prevent smart order resets during filter changes.

---

## 6. QUEUE PROCESSING FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    OPERATION START                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Is operation blocked?   │
        │ (isApplyingSmartOrder   │
        │  or isRendering)        │
        └────────────┬────────────┘
                     │
            ┌────────┴────────┐
            │                 │
           Yes               No
            │                 │
            ▼                 ▼
    ┌───────────────┐   ┌─────────────┐
    │ Queue operation│   │ Execute     │
    │ (push/set flag)│   │ immediately │
    └───────┬───────┘   └──────┬──────┘
            │                   │
            │                   │
            │                   ▼
            │            ┌─────────────┐
            │            │ Set guard    │
            │            │ flags true   │
            │            └──────┬──────┘
            │                   │
            │                   ▼
            │            ┌─────────────┐
            │            │ Do work     │
            │            └──────┬──────┘
            │                   │
            │                   ▼
            │            ┌─────────────┐
            │            │ Clear flags │
            │            └──────┬──────┘
            │                   │
            │                   ▼
            │            ┌─────────────┐
            │            │ Process     │
            │            │ queued work │
            │            └──────┬──────┘
            │                   │
            └───────────────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │    COMPLETE          │
          └─────────────────────┘
```

---

## 7. KEY PATTERNS SUMMARY

### Queue Addition Patterns
1. **Array.push()** - For filter operations queue
2. **Variable assignment** - For render data queues
3. **Boolean flag** - For smart ordering queue

### Queue Removal Patterns
1. **Array copy + clear** - Filter operations (prevents iteration issues)
2. **Variable = null** - Render data queues
3. **Array.shift()** - Undo stack (FIFO with size limit)

### Timing Control Patterns
1. **setTimeout(fn, 0)** - Avoid stack overflow, defer to next event loop tick
2. **setTimeout(fn, delay)** - Intentional delays for UI/UX
3. **requestAnimationFrame()** - Smooth animations
4. **await new Promise(r => setTimeout(r, ms))** - Async delays

### Guard Flag Pattern
The application uses a sophisticated guard flag system to prevent race conditions:
- Set flag before critical section
- Check flag before queueing operations
- Clear flag in finally block
- Process queued operations after flag clears

---

## 8. NO DEBOUNCE/THROTTLE FOUND

**Important:** No traditional `debounce` or `throttle` utility functions were found in the codebase. The application uses:
- Guard flags to prevent concurrent execution
- Queue systems to defer operations
- setTimeout for timing control

This custom approach provides more granular control over race conditions during smart ordering and rendering operations.

---

## Documentation Metadata
- **File:** `/home/coding/vista/src/public/app.js`
- **Documentation Date:** 2026-07-24
- **Bead ID:** bf-4gfl8
- **Total Lines Examined:** 9000+
- **Queue Systems Documented:** 3 (filter operations, renders, smart ordering)
- **Timing Patterns Documented:** 7 different setTimeout patterns, 1 requestAnimationFrame pattern
