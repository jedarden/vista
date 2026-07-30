# renderPreviews() Current Behavior Audit

## Date: 2026-07-23

## Overview

This audit documents the current behavior of `renderPreviews()` in `/home/coding/vista/src/public/app.js` with respect to platform ordering, specifically focusing on how it reads and applies `platformPrefs.cardOrder`.

## Current renderPreviews() Implementation

### Location
Lines 1577-1634 in `src/public/app.js`

### Does renderPreviews() read platformPrefs.cardOrder?
**YES** - At lines 1609-1615:

```javascript
// Use custom order if available, otherwise use default group order
let platforms = group.platforms;
if (platformPrefs.cardOrder[group.id]) {
  // Filter to only include platforms that still exist in the group
  const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
  // Add any new platforms that aren't in the custom order yet
  const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
  platforms = [...customOrder, ...newPlatforms];
}
```

### Current Platform Ordering Logic

The function follows this ordering logic:

1. **Start with default group order**: `platforms = group.platforms`
2. **Check for custom order**: If `platformPrefs.cardOrder[group.id]` exists:
   - Filter the stored custom order to only include platforms still in the group
   - Append any new platforms that aren't in the custom order yet (preserves new platforms at the end)
3. **Render cards in the final order**: Iterate over the computed `platforms` array

### DOM Element Ordering Location

The actual DOM elements are created and ordered at lines 1617-1626:

```javascript
platforms.forEach((pid, i) => {
  const scoreData = data.scoring.scores[pid];
  if (!scoreData) return;
  // Respect prefers-reduced-motion for staggered animation delay
  const animDelay = prefersReducedMotion() ? 0 : globalIndex * 50;
  const card = buildCard(pid, scoreData, data, animDelay, group.id);
  row.appendChild(card);  // <-- DOM ordering happens here
  globalIndex++;
});
```

Cards are appended to the row (`row.appendChild(card)`) in the order determined by the `platforms` array computed earlier.

## Smart Ordering Integration

### The applySmartOrdering() Function
Lines 8294-8439

This function implements the smart ordering feature:

1. **Early exit checks**:
   - Returns if no `currentData` is available
   - Returns if `platformPrefs.smartOrdering` is `false`

2. **Detects page type**: Uses `detectPageType(currentData.meta)` to determine content type

3. **Gets preferred order**: Calls `getPlatformOrderForPageType(pageType)` to get platform-specific ordering preferences

4. **MODIFIES PLATFORM_GROUPS ARRAY** (Line 1372):
```javascript
PLATFORM_GROUPS.forEach((group, groupIndex) => {
  const originalOrder = [...group.platforms];
  group.platforms.sort((a, b) => {  // <-- MUTATES the global PLATFORM_GROUPS array
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
```

5. **Persists to platformPrefs.cardOrder** (Line 1386):
```javascript
platformPrefs.cardOrder[group.id] = [...group.platforms];
```

6. **Saves to localStorage** (Line 1417):
```javascript
localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
```

7. **Triggers re-render** (Line 1429):
```javascript
renderPreviews(currentData);
```

### Integration with handleResult Hook
Lines 8454-8464

```javascript
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  await originalHandleResult2(data);
  if (platformPrefs.smartOrdering) {
    setTimeout(applySmartOrdering, 200);
  }
};
```

This ensures that after every URL analysis completes, `applySmartOrdering()` is called (if enabled) to reorder platforms based on the detected page type.

## Platform Preferences Structure

### Initialization (Lines 6148-6154)
```javascript
let platformPrefs = {
  favorites: new Set(),
  hidden: new Set(),
  columnCount: 3,
  smartOrdering: true,
  cardOrder: {} // Map of groupId -> array of platform IDs in custom order
};
```

### Loading from localStorage (Lines 7584-7588)
```javascript
platformPrefs.favorites = new Set(parsed.favorites || []);
platformPrefs.hidden = new Set(parsed.hidden || []);
platformPrefs.columnCount = parsed.columnCount || 3;
platformPrefs.smartOrdering = parsed.smartOrdering !== false;
platformPrefs.cardOrder = parsed.cardOrder || {};
```

## Additional renderTextPreviewsOnly() Function

Lines 1641-1724

This is a progressive loading version that also respects `platformPrefs.cardOrder` (lines 1702-1706):

```javascript
// Use custom order if available
let platforms = group.platforms;
if (platformPrefs.cardOrder[group.id]) {
  const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
  const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
  platforms = [...customOrder, ...newPlatforms];
}
```

## Summary: The Current Ordering Flow

1. **Initial render**: When `renderPreviews()` is called, it reads `platformPrefs.cardOrder` (if it exists) to determine the order of cards within each group.

2. **Smart ordering trigger**: After `handleResult()` completes, if `platformPrefs.smartOrdering` is `true`, `applySmartOrdering()` is called after a 200ms delay.

3. **Smart ordering mutation**: `applySmartOrdering()`:
   - Detects page type from metadata
   - Gets preferred platform order for that page type
   - **MUTATES the global `PLATFORM_GROUPS` array** by sorting `group.platforms`
   - Stores the new order in `platformPrefs.cardOrder[group.id]`
   - Saves to localStorage
   - Calls `renderPreviews(currentData)` to apply changes

4. **Re-render**: `renderPreviews()` reads the updated `platformPrefs.cardOrder` and renders cards in the new order.

## Key Findings

### ✅ Correct Implementation
- `renderPreviews()` DOES read `platformPrefs.cardOrder` (not missing)
- Custom order is correctly applied when available
- New platforms not in the custom order are appended at the end (preserves new platforms)
- Smart ordering correctly persists to `platformPrefs.cardOrder` and triggers re-render

### ⚠️ Potential Concerns
1. **Global mutation**: `applySmartOrdering()` mutates the global `PLATFORM_GROUPS` array, which could cause issues if the array is referenced elsewhere
2. **No explicit ordering validation**: There's no check that the reordered platform IDs actually exist in the current data
3. **Hardcoded 200ms delay**: The smart ordering trigger uses a fixed delay; if `renderPreviews()` takes longer, there could be a visual "jump" as cards are reordered

### Architecture Pattern
The current implementation uses a **two-source-of-truth pattern**:
1. `PLATFORM_GROUPS[].platforms` - mutable, modified by smart ordering
2. `platformPrefs.cardOrder` - persistent storage, loaded from localStorage

`renderPreviews()` prioritizes `platformPrefs.cardOrder` over the default `PLATFORM_GROUPS[].platforms` order.
