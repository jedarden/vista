# Debounce and Throttle Patterns in app.js

This document catalogs all timing patterns that control filter operation execution and other debounced/throttled behaviors in `/home/coding/vista/src/public/app.js`.

## Overview

The application uses several timing mechanisms to optimize performance and prevent race conditions:
- **Debounce patterns** for editor updates and preview rendering
- **Throttle patterns** for scroll synchronization
- **Guard flags** with zero-delay timeouts for filter operations
- **Queue systems** for pending operations during smart ordering
- **Stagger delays** for animations

---

## 1. Editor Preview Debounce

**Location:** Lines 7088-7092

**Pattern:**
```javascript
// Debounced preview update
clearTimeout(editorState.previewTimeout);
editorState.previewTimeout = setTimeout(() => {
  updatePreviewsWithEdits();
}, 300);
```

**Mechanism:**
- **Delay:** 300ms
- **Pattern:** Classic debounce - clears previous timeout before setting new one
- **Trigger:** Called from editor input event handlers (line 7076: `handleEditorInput`)
- **Purpose:** Prevents excessive re-renders while user is typing in editor fields

**State Object:**
```javascript
// Line ~6770
const editorState = {
  edited: {},
  original: {},
  dirty: false,
  previewTimeout: null  // Stores the debounce timer
};
```

**Invocation Points:**
- Line 7076: `handleEditorInput()` - called on editor field changes
- Line 8137: Template application
- Line 9006: Diagnostic fixes

---

## 2. Filter Operation Guard Flags

**Locations:** Lines 8562-8581, 8626-8641, 8745

**Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Mechanism:**
- **Delay:** 0ms (defers to next event loop tick)
- **Purpose:** Prevents smart order resets during filter changes
- **Guard Flag:** `isFilterOperation` (line 6761)

**Related State Variables (lines 6761-6763):**
```javascript
let isFilterOperation = false;           // Guard during filter changes
let isSmartOrderingActive = false;       // Track smart ordering progress
let pendingFilterOperations = [];        // Queue operations during smart ordering
```

**Usage Locations:**
1. **Import Preferences** (lines 8578-8581)
   ```javascript
   isFilterOperation = true;
   renderPreviews(currentData);
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```

2. **What-If Mode Toggle** (lines 8638-8641)
   ```javascript
   isFilterOperation = true;
   renderPreviews(currentData);
   setTimeout(() => { isFilterOperation = false; }, 0);
   ```

3. **What-If Panel** (line 8745)
   ```javascript
   isFilterOperation = true;
   ```

**Exposed for Testing (lines 5472-5478):**
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});
```

---

## 3. Toast Notification Timer

**Locations:** Lines 5325-5330, 5362-5363

**Implementation:**
```javascript
function showToast(msg, duration) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), duration || 3000);
}
```

**Mechanism:**
- **Default Duration:** 3000ms (3 seconds)
- **Pattern:** Clears previous toast timer before setting new one
- **Timer Storage:** `toast._timer` property on DOM element

**Custom Durations Used:**
- 1500ms: "URL copied!" (line 379)
- 2000ms: "Please paste some HTML first." (line 1086)
- 2000ms: Template application notifications (line 8139)
- 2500ms: "Detected HTML — switched to Paste mode" (line 706)
- 3000ms: Error messages (lines 1080, 1094)
- 3000ms: "Shortened URL — VISTA will follow redirects" (line 729)

---

## 4. Scroll Synchronization Throttle

**Locations:** Lines 6428-6469

**Implementation:**
```javascript
let isScrolling1 = false;
let isScrolling2 = false;

// Synchronize scroll from element 1 to element 2
scrollable1.addEventListener('scroll', () => {
  if (!isScrolling2) {
    isScrolling1 = true;
    const scrollRatio = scrollable1.scrollTop / (scrollable1.scrollHeight - scrollable1.clientHeight);
    scrollable2.scrollTop = scrollRatio * (scrollable2.scrollHeight - scrollable2.clientHeight);
    setTimeout(() => { isScrolling1 = false; }, 50);
  }
});

// Synchronize scroll from element 2 to element 1
scrollable2.addEventListener('scroll', () => {
  if (!isScrolling1) {
    isScrolling2 = true;
    const scrollRatio = scrollable2.scrollTop / (scrollable2.scrollHeight - scrollable2.clientHeight);
    scrollable1.scrollTop = scrollRatio * (scrollable1.scrollHeight - scrollable1.clientHeight);
    setTimeout(() => { isScrolling2 = false; }, 50);
  }
});
```

**Mechanism:**
- **Throttle Delay:** 50ms
- **Pattern:** Mutual exclusion with guard flags
- **Purpose:** Prevents infinite scroll loops when synchronizing two scrollable elements
- **Used in:** `setupScrollLock()` function for side-by-side card comparison

---

## 5. Image Loading Transition Delays

**Locations:** Lines 3070, 3091, 3114, 3137, 3173, 3211, 3271, 3299, 3363, 3399, 3425, 3448, 3474, 3493, 3514, 3539, 3567, 3593, 3617, 3644, 3674, 3698

**Pattern:**
```javascript
setTimeout(() => this.parentElement.classList.remove('img-loading-container'), 300)
```

**Mechanism:**
- **Delay:** 300ms
- **Purpose:** Removes loading state after image loads
- **Applied to:** Multiple platform card context images (Facebook, Twitter, LinkedIn, Reddit, Slack, Discord, etc.)

**Example Usage:**
```javascript
<img src="${image}" alt="" loading="lazy" 
  onload="this.classList.add('loaded');setTimeout(()=>this.parentElement.classList.remove('img-loading-container'),300)" />
```

---

## 6. Stagger Animation Delays

**Locations:** Lines 1735, 1865, 2054, 9218

**Pattern:**
```javascript
const animDelay = !prefersReducedMotion() ? globalIndex * 50 : 0;
card.style.setProperty('--stagger-delay', animDelay + 'ms');
```

**Mechanism:**
- **Delay Per Card:** 50ms × globalIndex
- **Purpose:** Creates cascading animation effect
- **Accessibility:** Respects `prefersReducedMotion()` - sets delay to 0ms when user prefers reduced motion
- **Global Counter:** `globalIndex` increments per card across all groups (line 1780, 1740)

**Usage Locations:**
1. **Skeleton Rendering** (line 1735)
   ```javascript
   // Stagger animation: 50ms delay per card (unless reduced motion preferred)
   const animDelay = !prefersReducedMotion() ? globalIndex * 50 : 0;
   ```

2. **Preview Rendering** (line 1865)
   ```javascript
   // Respect prefers-reduced-motion for staggered animation delay
   // 50ms delay per card using global index (not per-group index)
   const animDelay = prefersReducedMotion() ? 0 : globalIndex * 50;
   ```

3. **Text-Only Card Crossfade** (line 2054)
   ```javascript
   const animDelay = reducedMotion ? 0 : globalIndex * 50; // 50ms stagger for crossfade
   ```

4. **Dynamic Delay Updates** (line 9218)
   ```javascript
   card.style.setProperty('--stagger-delay', (index * 50) + 'ms');
   ```

---

## 7. Render Queue System

**Locations:** Lines 1757-1777, 1879-1889

**State Variables (lines 6757-6759):**
```javascript
let isRendering = false;              // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let pendingRenderData = null;         // Queue renderPreviews calls during smart ordering
```

**Pattern:**
```javascript
function renderPreviews(data) {
  // Prevent multiple simultaneous renders
  if (isRendering) {
    pendingRenderAfterCurrent = data;
    return;
  }

  // Queue render if smart ordering is in progress
  if (isApplyingSmartOrder) {
    pendingRenderData = data;
    return;
  }

  isRendering = true;
  // ... render logic ...

  isRendering = false;

  // Process any pending render that was queued
  if (pendingRenderAfterCurrent) {
    const dataToRender = pendingRenderAfterCurrent;
    pendingRenderAfterCurrent = null;
    // Use setTimeout to avoid recursive call stack
    setTimeout(() => renderPreviews(dataToRender), 0);
  }
}
```

**Mechanism:**
- **Queue Strategy:** Store latest data, discard intermediate renders
- **Zero-Delay Timeout:** Defers next render to avoid call stack overflow
- **Purpose:** Prevents concurrent render race conditions

---

## 8. Filter Operation Queue

**Locations:** Lines 8424-8454

**Implementation:**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  const operations = pendingFilterOperations.slice(); // Copy array
  pendingFilterOperations = []; // Clear queue

  operations.forEach(({ operation, description }) => {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing ${description}:`, error);
    }
  });
}
```

**Mechanism:**
- **Queue:** `pendingFilterOperations` array
- **Pattern:** Store operations during smart ordering, execute sequentially after completion
- **Usage:** Called from `importPreferences` (line 8570), `toggleWhatIfMode` (line 8630)

---

## 9. RequestAnimationFrame Loop

**Location:** Line 1314

**Pattern:**
```javascript
if (Date.now() < end) {
  requestAnimationFrame(frame);
}
```

**Purpose:** Smooth animation timing for celebration effects
**Context:** Used in checkAndCelebrate function for score celebration animations

---

## 10. Async Delay Patterns

**Locations:** Lines 1123, 1223

**Pattern:**
```javascript
await new Promise(resolve => setTimeout(resolve, 500));  // Line 1123
await new Promise(resolve => setTimeout(resolve, 150));  // Line 1223
```

**Purpose:** Adds intentional delays in async operations (typically for UI feedback or timing coordination)

---

## Summary of Timing Values

| Pattern | Delay | Purpose | Location |
|---------|-------|---------|----------|
| Editor debounce | 300ms | Prevent excessive re-renders | 7088-7092 |
| Filter guard flag | 0ms | Defer flag clearing | 8562-8581, 8626-8641 |
| Toast default | 3000ms | Auto-hide notifications | 5329 |
| Toast custom | 1500-3000ms | Variable notification duration | 379, 1086, 706, 8139 |
| Scroll throttle | 50ms | Prevent scroll loops | 6457, 6467 |
| Image loading | 300ms | Remove loading state | 3070, 3091, 3114, etc. |
| Stagger animation | 50ms per card | Cascading effect | 1735, 1865, 2054 |
| Render queue | 0ms | Avoid stack overflow | 1889 |
| Async delays | 150-500ms | UI timing | 1123, 1223 |

---

## Related Documentation

- [Batch Processing and Chunking Logic](./batch-processing-logic.md) - Information about render batching
- [Filter State Variables](./filter-state-variables.md) - Guard flags and state management
- [Queue Push and Processing](./queue-push-processing.md) - Operation queue details
