# Queue Processing Loops and Iteration Patterns - app.js

## Overview
This document maps all queue processing loops and iteration patterns in `/home/coding/vista/src/public/app.js` that process filter queues and iterate over queue items.

## Queue Processing Loops

### 1. Filter Operation Queue (`pendingFilterOperations`)

**Location:** Lines 7952-7975
**Queue:** `pendingFilterOperations[]`
**Pattern:** `forEach` iteration on copied array

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  // Copy array to avoid modification during iteration
  const operations = pendingFilterOperations.slice();
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

**Iteration Pattern:** Forward iteration, executes filter operations sequentially
**Queue Population:** Via `queueFilterOperation()` (line 7946)

---

### 2. Smart Order Render Queue (`pendingRenderData`)

**Location:** Lines 9037-9043 (in `applySmartOrderingSafe()`)
**Queue:** `pendingRenderData` (single-item queue, holds latest data)
**Pattern:** Direct invocation after queue check

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

**Iteration Pattern:** Single-item processing (not a loop, but queue consumption)
**Queue Population:** Line 1602 in `renderPreviews()`

---

### 3. Render-During-Render Queue (`pendingRenderAfterCurrent`)

**Location:** Lines 1712-1720 (in `renderPreviews()`)
**Queue:** `pendingRenderAfterCurrent` (single-item queue)
**Pattern:** `setTimeout` recursion to avoid call stack

```javascript
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

**Iteration Pattern:** Single-item processing via deferred execution
**Queue Population:** Lines 1589-1593 in `renderPreviews()`

---

## Platform Group Processing Loops

### 4. Skeleton Rendering - Platform Groups

**Location:** Lines 1524-1554
**Target:** `PLATFORM_GROUPS` array
**Pattern:** `PLATFORM_GROUPS.forEach((group) => { ... })`

```javascript
PLATFORM_GROUPS.forEach((group) => {
  const groupEl = document.createElement('div');
  // ... group setup ...

  let platforms = group.platforms;
  if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder) {
    const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
    const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
    platforms = [...customOrder, ...newPlatforms];
  }

  platforms.forEach((pid, i) => {
    const card = document.createElement('div');
    // ... card creation ...
  });
});
```

**Iteration Pattern:** Forward iteration over groups, then nested forward iteration over platforms
**Purpose:** Render skeleton loading cards

---

### 5. Preview Rendering - Platform Groups

**Location:** Lines 1612-1708
**Target:** `PLATFORM_GROUPS` array
**Pattern:** `PLATFORM_GROUPS.forEach((group, gi) => { ... })`

**Inner Loop:** Lines 1690-1708 - `platforms.forEach((pid, i) => { ... })`

```javascript
PLATFORM_GROUPS.forEach((group, gi) => {
  // Group-level processing
  const groupScores = group.platforms.map(pid => data.scoring.scores[pid]).filter(Boolean);
  // ... group header setup ...

  // Platform order merge logic (lines 1658-1680)
  while (cardOrderIdx < existingInCardOrder.length || groupIdx < group.platforms.length) {
    // Merge cardOrder with group.platforms
  }

  platforms.forEach((pid, i) => {
    const scoreData = data.scoring.scores[pid];
    if (!scoreData) return;
    const card = buildCard(pid, scoreData, data, animDelay, group.id);
    row.appendChild(card);
    globalIndex++;
  });
});
```

**Iteration Pattern:** Forward iteration with staggered animation delays
**Purpose:** Render full platform cards with scores

---

### 6. Progressive Image Loading - Platform Groups

**Location:** Lines 1735-1800
**Target:** `PLATFORM_GROUPS` array
**Pattern:** `PLATFORM_GROUPS.forEach((group, gi) => { ... })`

**Inner Loop:** Lines 1803-1812 - `platforms.forEach((pid, i) => { ... })`

```javascript
PLATFORM_GROUPS.forEach((group, gi) => {
  let groupEl = document.getElementById('group-' + group.id);
  // ... update existing group ...

  platforms.forEach((pid, i) => {
    const scoreData = data.scoring.scores[pid];
    if (!scoreData) return;
    // ... update card with image data ...
  });
});
```

**Iteration Pattern:** Forward iteration over existing DOM elements
**Purpose:** Crossfade from text-only to image-loaded cards

---

### 7. Image Update - Platform Groups

**Location:** Lines 1935-1955
**Target:** `PLATFORM_GROUPS` array
**Pattern:** `PLATFORM_GROUPS.forEach((group) => { ... })`

**Inner Loop:** Lines 1936-1955 - `group.platforms.forEach((pid) => { ... })`

```javascript
PLATFORM_GROUPS.forEach((group) => {
  group.platforms.forEach((pid) => {
    const existingCard = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!existingCard) return;

    // Remove loading state
    delete existingCard.dataset.loadingImages;
    // ... update card with final image data ...
  });
});
```

**Iteration Pattern:** Nested forward iteration
**Purpose:** Final image update after progressive loading

---

### 8. Character Limit Counting - Platform Groups

**Location:** Lines 6439-6450
**Target:** `PLATFORM_GROUPS` array
**Pattern:** `PLATFORM_GROUPS.forEach(group => { ... })`

**Inner Loop:** Lines 6440-6450 - `group.platforms.forEach(pid => { ... })`

```javascript
PLATFORM_GROUPS.forEach(group => {
  group.platforms.forEach(pid => {
    const limits = PLATFORM_CHAR_LIMITS[pid];
    if (!limits) return;
    totalCount++;
    const limit = limits[fieldKey];
    if (textLen <= limit * 0.8) okCount++;
    // ... count warnings/overages ...
  });
});
```

**Iteration Pattern:** Forward iteration with aggregation
**Purpose:** Count OK/warning/over limit character counts

---

### 9. Platform Card Reordering - Platform Groups

**Location:** Lines 8693-8743
**Target:** `PLATFORM_GROUPS` array
**Pattern:** `PLATFORM_GROUPS.forEach((group) => { ... })`

**Inner Loop:** Line 8715 - `row.querySelectorAll('.platform-card').forEach(card => { ... })`

```javascript
PLATFORM_GROUPS.forEach((group) => {
  // ... DOM manipulation to reorder cards ...
  row.querySelectorAll('.platform-card').forEach(card => {
    // Move card to correct position
  });
});
```

**Iteration Pattern:** Forward iteration over DOM elements
**Purpose:** Reorder cards after smart ordering

---

## Special Iteration Patterns

### 10. CardOrder/Group Platforms Merge (While Loop)

**Location:** Lines 1658-1680
**Target:** Merging `existingInCardOrder` array with `group.platforms` array
**Pattern:** `while` loop with dual index advancement

```javascript
while (cardOrderIdx < existingInCardOrder.length || groupIdx < group.platforms.length) {
  const cardOrderNext = existingInCardOrder[cardOrderIdx];
  const groupNext = group.platforms[groupIdx];

  if (cardOrderNext && cardOrderNext === groupNext) {
    // Platform exists in both - use cardOrder position
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
    groupIdx++;
  } else if (missingFromCardOrder.includes(groupNext)) {
    // Platform is in group but missing from cardOrder - insert here
    platformsWithProperPosition.push(groupNext);
    groupIdx++;
  } else if (cardOrderNext) {
    // Platform is in cardOrder but we've passed it in group - add from cardOrder
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
  } else {
    groupIdx++;
  }
}
```

**Iteration Pattern:** Dual-index merge (like merge sort merge phase)
**Purpose:** Merge custom card order with group platform order, inserting missing platforms at correct positions

---

### 11. Text Width Calculation (While Loop)

**Location:** Lines 5276-5280
**Target:** String reduction loop
**Pattern:** `while` loop reducing font size

```javascript
while (textWidth > width - padding * 2 && fontSize > minFontSize) {
  fontSize--;
  // Recalculate textWidth
}
```

**Iteration Pattern:** Conditional reduction loop
**Purpose:** Calculate maximum font size that fits text within width

---

### 12. Binary Search (While Loop)

**Location:** Lines 5312-5330
**Target:** Array search
**Pattern:** `while` loop with left/right pointers

```javascript
while (left < right) {
  const mid = Math.floor((left + right) / 2);
  // ... binary search logic ...
}
```

**Iteration Pattern:** Binary search (log n iterations)
**Purpose:** Find insertion point in sorted array

---

## Cropper Processing Loops

### 13. Cropper Group Toggles

**Location:** Lines 3480-3530
**Target:** `groups` array
**Pattern:** `groups.forEach(group => { ... })`

**Inner Loop:** Line 3484 - `platforms.forEach(pid => { ... })`

```javascript
groups.forEach(group => {
  // ... group toggle setup ...
  platforms.forEach(pid => {
    // ... platform checkbox setup ...
  });
});
```

**Iteration Pattern:** Nested forward iteration
**Purpose:** Setup cropper UI controls

---

### 14. Cropper Platform Checkboxes

**Location:** Lines 3496-3512
**Target:** DOM element list
**Pattern:** `document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => { ... })`

```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
```

**Iteration Pattern:** Forward iteration over DOM NodeList
**Purpose:** Select/deselect all platform checkboxes

---

## What-If Tag Processing

### 15. Pending What-If Tags

**Location:** Line 8299
**Target:** `pendingWhatIfTags` array
**Pattern:** `pendingWhatIfTags.forEach(tag => { ... })`

```javascript
pendingWhatIfTags.forEach(tag => {
  // ... process tag ...
});
```

**Iteration Pattern:** Forward iteration
**Purpose:** Apply queued what-if tag changes

---

## Command Palette Processing

### 16. Command Filtering

**Location:** Lines 9186-9192
**Target:** `COMMANDS` array
**Pattern:** `COMMANDS.filter(cmd => { ... }).forEach(...)`

```javascript
const filtered = COMMANDS.filter(cmd =>
  cmd.title.toLowerCase().includes(query) ||
  cmd.category.toLowerCase().includes(query)
);
renderCommands(filtered);
```

**Iteration Pattern:** Filter then render (no explicit forEach, implicit in renderCommands)
**Purpose:** Filter commands by search query

---

### 17. Command Category Grouping

**Location:** Lines 9140-9161
**Target:** Grouped commands object
**Pattern:** `Object.entries(grouped).forEach(([category, cmds]) => { ... })`

**Inner Loop:** Line 9142 - `cmds.forEach(cmd => { ... })`

```javascript
Object.entries(grouped).forEach(([category, cmds]) => {
  // ... render category header ...
  cmds.forEach(cmd => {
    // ... render command item ...
  });
});
```

**Iteration Pattern:** Forward iteration over categories, then commands
**Purpose:** Render grouped command palette items

---

## Summary Statistics

- **Total queue processing loops:** 3 (pendingFilterOperations, pendingRenderData, pendingRenderAfterCurrent)
- **Total PLATFORM_GROUPS forEach loops:** 8+
- **Total nested platform iteration loops:** 8+
- **While loop patterns:** 3 (merge, font size reduction, binary search)
- **Other forEach patterns:** 10+ (DOM manipulation, array processing, etc.)

## Queue Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Queue Population                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  queueFilterOperation() → pendingFilterOperations[]        │
│  renderPreviews() → pendingRenderData / pendingRender...   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Queue Processing                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  operations.forEach() → processPendingFilterOperations()   │
│  direct invocation → pendingRenderData                    │
│  setTimeout recursion → pendingRenderAfterCurrent         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Related Documentation

- **Queue Push Operations:** See bead bf-69cnu for where queues are populated
- **Smart Ordering:** See lines 8976-9046 for applySmartOrderingSafe()
- **Platform Group Structure:** PLATFORM_GROUPS defined in frames-config.js

## Notes

- All queue processing uses guard flags (`isApplyingSmartOrder`, `isRendering`, `isFilterOperation`) to prevent race conditions
- The `operations.slice()` pattern (line 7962) is critical to avoid modifying array during iteration
- Platform group iteration is the most common pattern, used for rendering, updating, and reordering cards
