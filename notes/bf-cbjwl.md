# Queue Processing Loops in app.js

## Task: Find all for and while loops that process queues

### Summary
This document catalogs all for and while loops in `src/public/app.js` that iterate over queue-like structures, including platform arrays, pending operations, and ordered collections.

---

## For Loops Processing Queues

### 1. Line 7747 - `for (const groupId in platformPrefs.cardOrder)`
- **Queue Variable:** `platformPrefs.cardOrder`
- **Context:** `cleanupStaleCardOrderEntries()` function
- **Purpose:** Iterates over cardOrder group IDs to remove stale entries
- **Loop Type:** `for...in` loop over object keys

```javascript
for (const groupId in platformPrefs.cardOrder) {
  if (!validGroupIds.has(groupId)) {
    console.log(`[cleanupStaleCardOrderEntries] Removing dangling entry for group: ${groupId}`);
    delete platformPrefs.cardOrder[groupId];
    // ... cleanup metadata
  }
}
```

---

## For-Of Loops Processing Queue Arrays

### 2. Line 4136 - `for (const issue of analysis.issues)`
- **Queue Variable:** `analysis.issues`
- **Context:** Analysis rendering
- **Purpose:** Process analysis issues queue

### 3. Line 4146 - `for (const rec of analysis.recommendations)`
- **Queue Variable:** `analysis.recommendations`
- **Context:** Analysis rendering
- **Purpose:** Process recommendations queue

### 4. Line 4345 - `for (const field of fields)`
- **Queue Variable:** `fields`
- **Context:** Field processing
- **Purpose:** Iterate over field queue

### 5. Line 4541 - `for (const [change, platforms] of Object.entries(gradeChanges))`
- **Queue Variable:** `gradeChanges`
- **Context:** Grade change processing
- **Purpose:** Process grade changes for platforms

### 6. Line 5841 - `for (const [key, value] of Object.entries(meta))`
- **Queue Variable:** `meta`
- **Context:** Metadata processing
- **Purpose:** Process metadata key-value pairs

### 7. Line 5859 - `for (const part of parts)`
- **Queue Variable:** `parts`
- **Context:** Part processing
- **Purpose:** Iterate over parts queue

### 8. Line 5947 - `for (const candidate of candidates)`
- **Queue Variable:** `candidates`
- **Context:** Candidate processing
- **Purpose:** Process candidates queue

### 9. Line 6333 - `for (const [labelId, platformIds] of Object.entries(fieldPlatformMap))`
- **Queue Variable:** `fieldPlatformMap`
- **Context:** Field-platform mapping
- **Purpose:** Process platform ID queues by label

### 10. Line 6341 - `for (const pid of platformIds)`
- **Queue Variable:** `platformIds`
- **Context:** Platform ID processing
- **Purpose:** Process individual platform ID queue

---

## While Loops Processing Queues

### 11. Line 1658 - `while (cardOrderIdx < existingInCardOrder.length || groupIdx < group.platforms.length)`
- **Queue Variables:** 
  - `existingInCardOrder` (array)
  - `group.platforms` (array)
- **Context:** `renderPreviews()` function, custom cardOrder processing
- **Purpose:** Merge two platform queues (cardOrder and group.platforms) while maintaining proper positioning
- **Loop Type:** Indexed while loop with dual pointer advancement

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

### 12. Line 7768 - `while (attempt < MAX_RETRIES)`
- **Queue Variable:** Retry counter (not a data queue)
- **Context:** `savePlatformPrefs()` function
- **Purpose:** Retry loop for localStorage write operations with version checking
- **Loop Type:** Counter-based while loop

**Note:** This is a retry mechanism, not a queue processing loop.

---

## forEach Loops Processing Queue Arrays

### 13. Line 1558 - `platforms.forEach((pid, i) => { ... })`
- **Queue Variable:** `platforms` (array)
- **Context:** `renderSkeletons()` function
- **Purpose:** Process platform queue to render skeleton cards
- **Line:** 1558

### 14. Line 1690 - `platforms.forEach((pid, i) => { ... })`
- **Queue Variable:** `platforms` (array)
- **Context:** `renderPreviews()` function, initial card rendering
- **Purpose:** Process platform queue to build and render cards
- **Line:** 1690

### 15. Line 1803 - `platforms.forEach((pid, i) => { ... })`
- **Queue Variable:** `platforms` (array)
- **Context:** `renderPreviews()` function, crossfade to text-only cards
- **Purpose:** Process platform queue for crossfade animation
- **Line:** 1803

### 16. Line 1936 - `group.platforms.forEach((pid) => { ... })`
- **Queue Variable:** `group.platforms` (array)
- **Context:** Image update rendering
- **Purpose:** Process platform queue to update card images
- **Line:** 1936

### 17. Line 3460 - `group.platforms.forEach(pid => { ... })`
- **Queue Variable:** `group.platforms` (array)
- **Context:** Cropper platform toggles
- **Purpose:** Process platform queue to render cropper checkboxes
- **Line:** 3460

### 18. Line 3484 - `platforms.forEach(pid => { ... })`
- **Queue Variable:** `platforms` (array)
- **Context:** Group checkbox change handler
- **Purpose:** Process platform queue to toggle checkboxes
- **Line:** 3484

### 19. Line 6440 - `group.platforms.forEach(pid => { ... })`
- **Queue Variable:** `group.platforms` (array)
- **Context:** Character limit gauge calculation
- **Purpose:** Process platform queue to count status
- **Line:** 6440

### 20. Line 6474 - `group.platforms.forEach(pid => { ... })`
- **Queue Variable:** `group.platforms` (array)
- **Context:** Character limit gauge (group counting)
- **Purpose:** Process platform queue for group statistics
- **Line:** 6474

### 21. Line 6489 - `group.platforms.forEach(pid => { ... })`
- **Queue Variable:** `group.platforms` (array)
- **Context:** Character limit gauge (rendering)
- **Purpose:** Process platform queue to render gauge grid
- **Line:** 6489

### 22. Line 7965 - `operations.forEach(({ operation, description }) => { ... })`
- **Queue Variable:** `operations` (copied from `pendingFilterOperations`)
- **Context:** `processPendingFilterOperations()` function
- **Purpose:** Process queued filter operations
- **Line:** 7965
- **Note:** This processes the `pendingFilterOperations` queue after copying it

```javascript
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
```

### 23. Line 8299 - `pendingWhatIfTags.forEach(tag => { ... })`
- **Queue Variable:** `pendingWhatIfTags` (array)
- **Context:** What-if mode toggle
- **Purpose:** Process queued what-if tags to update disabled tags
- **Line:** 8299

### 24. Line 8724 - `targetOrder.forEach(pid => { ... })`
- **Queue Variable:** `targetOrder` (array)
- **Context:** `reorderPlatformCards()` function
- **Purpose:** Process platform queue to reorder DOM elements
- **Line:** 8724

```javascript
targetOrder.forEach(pid => {
  const card = cardsByPid.get(pid);
  if (card) {
    row.appendChild(card);  // appendChild on existing element moves it
  }
});
```

### 25. Line 8834 - `group.platforms.forEach(pid => { ... })`
- **Queue Variable:** `group.platforms` (array)
- **Context:** `applySmartOrdering()` logging
- **Purpose:** Process platform queue for debug logging
- **Line:** 8834

---

## Non-Queue While Loops (Excluded)

The following while loops were found but do **not** process queues:

1. **Line 5276** - `while (textWidth > width - padding * 2 && fontSize > minFontSize)`
   - Purpose: Auto-sizing text font
   - Not queue processing

2. **Line 5312** - `while (left < right)`
   - Purpose: Binary search for text truncation
   - Not queue processing

---

## Queue Variables Summary

### Primary Queue Variables:
1. `platforms` - Platform ID arrays (most common queue)
2. `group.platforms` - Platform arrays within groups
3. `pendingFilterOperations` - Queued filter operations
4. `pendingRenderData` - Queued render data
5. `pendingRenderAfterCurrent` - Queued render after current render
6. `pendingWhatIfTags` - Queued what-if mode tags
7. `targetOrder` - Reordered platform sequence
8. `cardOrder` - Custom platform ordering per group
9. `existingInCardOrder` - Filtered platform queue from cardOrder
10. `operations` - Copied operations queue for safe iteration

---

## Statistics

- **Total for/for-of loops processing queues:** 10
- **Total while loops processing queues:** 1 (line 1658)
- **Total forEach loops processing queues:** 13
- **Most common queue variable:** `platforms` / `group.platforms` (appear in 11+ loops)
- **Most complex queue processing:** Line 1658 (dual-queue merge algorithm)

---

## Notes

- **Traditional for loops** (e.g., `for (let i = 0; i < arr.length; i++)`) are **not used** in app.js for queue processing
- **forEach** is the most common pattern for queue iteration
- **while** loops are primarily used for complex merge algorithms or retry logic
- **Queue safety pattern:** Line 7962-7963 shows the pattern of copying a queue before iteration to avoid modification during iteration
