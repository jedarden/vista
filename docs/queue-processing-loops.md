# Queue Processing Loops and Iteration Patterns

## Overview

This document maps all loops in `src/public/app.js` that process filter queues and iterate over queue items. This is a companion analysis to the queue population study (bead bf-69cnu).

---

## Queue Processing Loops

### 1. Pending Filter Operations Queue
**Target Queue:** `pendingFilterOperations`  
**Processing Function:** `processPendingFilterOperations()`  
**Line Numbers:** 8434-8457  
**Iteration Pattern:** Forward iteration with array copy

```javascript
// Line 8447
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
```

**Queue Population:**  
- Operations are queued via `queueFilterOperation()` (line 8424)
- Cleared after processing (line 8445)

**Guard Pattern:**  
- Uses `slice()` to copy array before iteration (line 8444)
- Prevents modification during iteration

---

### 2. Pending What-If Tags Queue
**Target Queue:** `pendingWhatIfTags`  
**Processing Context:** What-if mode toggle  
**Line Numbers:** 8781-8787  
**Iteration Pattern:** Forward iteration

```javascript
// Line 8781
pendingWhatIfTags.forEach(tag => {
  disabledTags.add(tag);
  const cb = document.querySelector(`#whatIfPanel .what-if-toggle input[data-tag="${tag}"]`);
  if (cb) {
    cb.checked = false;
  }
});
```

**Purpose:**  
- Disables tags when "What If" mode is activated
- Updates UI checkboxes to reflect disabled state

---

### 3. Disabled Tags Processing
**Target Queue:** `disabledTags` (Set)  
**Processing Context:** Apply what-if changes  
**Line Numbers:** 8729-8740  
**Iteration Pattern:** Forward iteration over Set

```javascript
// Line 8729
disabledTags.forEach(tag => {
  const parts = tag.split('.');
  if (parts.length === 1) {
    delete modifiedMeta[tag];
  } else {
    const [namespace, key] = parts;
    delete modifiedMeta[namespace][key];
  }
});
```

**Purpose:**  
- Removes disabled tags from metadata
- Handles both top-level and nested tag namespaces

---

### 4. Platform Card Reordering (Smart Ordering)
**Target Queue:** `targetOrder` (from `platformPrefs.cardOrder[group.id]`)  
**Processing Function:** `reorderPlatformCards()`  
**Line Numbers:** 9206-9211  
**Iteration Pattern:** Forward iteration over ordered array

```javascript
// Line 9206
targetOrder.forEach(pid => {
  const card = cardsByPid.get(pid);
  if (card) {
    row.appendChild(card);
  }
});
```

**Queue Preparation:**  
- `cardsByPid` Map built at lines 9197-9202 using querySelectorAll.forEach
- Queue is cleared after processing (implicit via reordering)

**Guard Pattern:**  
- Runs inside `isApplyingSmartOrder` guard (line 9171)
- Only processes cards present in both DOM and targetOrder

---

### 5. Platform Rendering (Skeleton Cards)
**Target Queue:** `platforms` (group.platforms or custom order)  
**Processing Function:** `renderSkeletons()`  
**Line Numbers:** 1728-1741  
**Iteration Pattern:** Forward iteration with index

```javascript
// Line 1728
platforms.forEach((pid, i) => {
  const card = document.createElement('div');
  card.className = `platform-skeleton-card`;
  card.dataset.pid = pid;
  card.dataset.groupId = group.id;

  // Stagger animation: 50ms delay per card (unless reduced motion preferred)
  const animDelay = !prefersReducedMotion() ? globalIndex * 50 : 0;
  card.style.setProperty('--stagger-delay', animDelay + 'ms');

  card.innerHTML = getSkeletonHtml(pid);
  row.appendChild(card);
  globalIndex++;
});
```

**Queue Source:**  
- Uses `platformPrefs.cardOrder[group.id]` if available (line 1720)
- Falls back to `group.platforms` default order

**Guard Pattern:**  
- Skips cardOrder during smart ordering to prevent race conditions (line 1724-1725)

---

### 6. Platform Rendering (Full Cards)
**Target Queue:** `platforms` (same as skeleton cards)  
**Processing Function:** `renderPreviews()`  
**Line Numbers:** 1860-1869  
**Iteration Pattern:** Forward iteration with index

```javascript
// Line 1860
platforms.forEach((pid, i) => {
  const scoreData = data.scoring.scores[pid];
  if (!scoreData) return;
  // Respect prefers-reduced-motion for staggered animation delay
  // 50ms delay per card using global index (not per-group index)
  const animDelay = prefersReducedMotion() ? 0 : globalIndex * 50;
  const card = buildCard(pid, scoreData, data, animDelay, group.id);
  row.appendChild(card);
  globalIndex++;
});
```

**Guard Pattern:**  
- Checks `isApplyingSmartOrder` and queues render if true (lines 1767-1773)
- Sets `isRendering` guard to prevent concurrent renders (lines 1757-1764)

---

### 7. Platform Text-Only Rendering
**Target Queue:** `platforms` (same as above)  
**Processing Function:** `renderTextPreviewsOnly()`  
**Line Numbers:** 2049-2067  
**Iteration Pattern:** Forward iteration with crossfade

```javascript
// Line 2049
platforms.forEach((pid, i) => {
  const scoreData = data.scoring.scores[pid];
  if (!scoreData) return;

  const existingSkeleton = row.querySelector(`.platform-skeleton-card[data-pid="${pid}"]`);
  const animDelay = reducedMotion ? 0 : globalIndex * 50; // 50ms stagger for crossfade

  // Crossfade timing and card building...
});
```

**Purpose:**  
- Replaces skeleton cards with text-only cards
- Implements staggered crossfade animation

---

### 8. Image Upgrade Pass
**Target Queue:** `group.platforms` (nested iteration)  
**Processing Function:** `updatePreviewsWithImages()`  
**Line Numbers:** 2209-2214  
**Iteration Pattern:** Nested forEach over groups and platforms

```javascript
// Line 2208-2209
PLATFORM_GROUPS.forEach((group) => {
  group.platforms.forEach((pid) => {
    const existingCard = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!existingCard) return;

    applyImagesToCard(pid, data, group.id);
    // ...
  });
});
```

**Purpose:**  
- Upgrades text-only cards to include images
- Preserves card state and context frames

---

### 9. Character Limit Validation (Platform Groups)
**Target Queue:** `group.platforms`  
**Processing Context:** Character limit diagnostics  
**Line Numbers:** 6922-6928 (first pass), 6956-6962 (group counting), 6971-6990 (rendering)  
**Iteration Pattern:** Forward iteration with early continue

```javascript
// Line 6922
group.platforms.forEach(pid => {
  const limits = PLATFORM_CHAR_LIMITS[pid];
  if (!limits) return;
  totalCount++;
  const limit = limits[fieldKey];
  if (textLen <= limit * 0.8) okCount++;
  else if (textLen <= limit) warnCount++;
  else overCount++;
});
```

**Purpose:**  
- Counts platform statuses against character limits
- Generates diagnostic UI with per-platform gauges

---

### 10. Cropper Platform Toggles
**Target Queue:** `group.platforms`  
**Processing Context:** Image cropper UI  
**Line Numbers:** 3888-3895 (rendering), 3912-3915 (event handling)  
**Iteration Pattern:** Forward iteration

```javascript
// Line 3888
group.platforms.forEach(pid => {
  const crop = PLATFORM_CROPS[pid];
  if (!crop) return;
  const pct = calculateVisiblePercentage(crop, cropperState.imageNaturalWidth, cropperState.imageNaturalHeight);
  html += `<label class="cropper-platform-toggle">`;
  html += `<input type="checkbox" data-platform="${pid}" checked />`;
  // ...
});
```

---

### 11. Command Palette Rendering
**Target Queue:** `commands` array  
**Processing Function:** `renderCommands()`  
**Line Numbers:** 9614-9617 (grouping), 9622-9637 (rendering)  
**Iteration Pattern:** Two-phase: grouping then rendering

```javascript
// Line 9614
commands.forEach(cmd => {
  if (!grouped[cmd.category]) grouped[cmd.category] = [];
  grouped[cmd.category].push(cmd);
});

// Line 9622
Object.entries(grouped).forEach(([category, cmds]) => {
  html += `<div class="command-palette-category">${escHtml(category)}</div>`;
  cmds.forEach(cmd => {
    // render command item
  });
});
```

---

### 12. Animation Delay Update
**Target Queue:** `cards` (from querySelectorAll)  
**Processing Context:** Post-reorder animation  
**Line Numbers:** 9216-9222  
**Iteration Pattern:** Forward iteration with index

```javascript
// Line 9216
cards.forEach((card, index) => {
  if (!reducedMotion) {
    card.style.setProperty('--stagger-delay', (index * 50) + 'ms');
  } else {
    card.style.setProperty('--stagger-delay', '0ms');
  }
});
```

**Purpose:**  
- Updates animation delays after card reordering
- Maintains smooth staggered appearance

---

## Queue Processing Patterns Summary

### Guard Patterns

1. **Array Copy Before Iteration** (line 8444)
   - `pendingFilterOperations.slice()` prevents modification during iteration

2. **Boolean Flags** 
   - `isRendering` (line 1777) - prevents concurrent renders
   - `isApplyingSmartOrder` (line 9479) - prevents concurrent smart ordering

3. **Queue-and-Defer**
   - `pendingRenderData` (line 1772) - queues render during smart ordering
   - `pendingRenderAfterCurrent` (line 1762) - queues render during active render
   - `pendingApplySmartOrder` (line 9474) - queues smart ordering during active application

### Iteration Patterns

| Pattern | Usage | Lines |
|---------|-------|-------|
| Forward forEach | Most queue processing | Various |
| Forward with index | Animation delay calculation | 1728, 1860, 2049 |
| Nested forEach | Group → platform iteration | 2208-2209 |
| Two-phase (group → render) | Command palette | 9614-9637 |
| Array copy + forEach | Filter operations | 8444-8456 |

### Queue Types

| Queue | Type | Processing | Line Range |
|-------|------|------------|------------|
| `pendingFilterOperations` | Array | `processPendingFilterOperations()` | 8434-8457 |
| `pendingWhatIfTags` | Array | Inline forEach in toggle function | 8781-8787 |
| `disabledTags` | Set | Inline forEach in applyWhatIfChanges | 8729-8740 |
| `targetOrder` | Array | `reorderPlatformCards()` | 9206-9211 |
| `platforms` | Array | Multiple render functions | 1728+, 1860+, 2049+ |
| `group.platforms` | Array | Diagnostics, cropper, image upgrade | 6922+, 3888+, 2209+ |

---

## Related Documentation

- **Queue Population Study:** See bead `bf-69cnu` for how queues are populated
- **Smart Ordering Architecture:** See lines 9166-9528 for guard flag implementation
- **Render Pipeline:** See `renderPreviews()`, `renderSkeletons()`, `renderTextPreviewsOnly()`

---

## Notes

- All queue processing uses forward iteration (no reverse loops found)
- Queue clearing happens **before** iteration only for `pendingFilterOperations` (line 8445)
- Other queues are either Sets (no clearing needed) or processed in-place
- The `platforms` queue is not a true queue - it's the source array reordered based on `cardOrder`
