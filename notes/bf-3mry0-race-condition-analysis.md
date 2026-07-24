# Race Condition Analysis for Card Ordering (bf-3mry0)

## Critical Race Condition: The handleResult → applySmartOrdering Gap

### Timeline:
1. **T+0ms**: `handleResult(data)` called
2. **T+0ms**: `handleResult` calls `renderPreviews(data)` at line 1072
3. **T+0ms**: `handleResult` completes, hook wrapper runs
4. **T+200ms**: `setTimeout(applySmartOrdering, 200)` fires (line 8516)
5. **T+200ms**: `applySmartOrdering()` runs, updates `platformPrefs.cardOrder` and calls `reorderPlatformCards()`

### The Problem:
During the 200ms gap (steps 2-5), if ANY other code calls `renderPreviews()`, it will:
- Read `platformPrefs.cardOrder` (which still has the OLD order at this point)
- Render cards using that old order
- Create DOM elements in old order
- Then when `applySmartOrdering()` finally runs and calls `reorderPlatformCards()`, it will move those DOM elements

But if another `renderPreviews()` happens during or after the `reorderPlatformCards()` call, it will completely rebuild the DOM using the order that was in `platformPrefs.cardOrder` at that moment.

## All renderPreviews() Call Sites (Potential Race Points):

1. **Line 113** - `toggleGlobalTheme()` - User action
2. **Line 1072** - `handleResult()` - Initial data load
3. **Line 6630** - `handleEditorChange()` - Editor modifications
4. **Line 7736** - Preferences import - User action
5. **Line 7772** - What If mode toggle - User action
6. **Line 7876** - What If panel apply - User action
7. **Line 8191** - Rescore after fixing diagnostics - User action

## The Core Issue:

**renderPreviews() ALWAYS respects platformPrefs.cardOrder:**

```javascript
// Lines 1609-1615 in renderPreviews()
let platforms = group.platforms;
if (platformPrefs.cardOrder[group.id]) {
  // Filter to only include platforms that still exist in the group
  const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
  // Add any new platforms that aren't in the custom order yet
  const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
  platforms = [...customOrder, ...newPlatforms];
}
```

This means:
- If `platformPrefs.cardOrder` exists, `renderPreviews()` uses it
- `applySmartOrdering()` updates `platformPrefs.cardOrder` at line 8442
- But there's no lock to prevent `renderPreviews()` from running with stale order

## Additional Issue: PLATFORM_GROUPS Mutation

`applySmartOrdering()` mutates the global `PLATFORM_GROUPS` array:

```javascript
// Lines 8427-8435 in applySmartOrdering()
PLATFORM_GROUPS.forEach((group, groupIndex) => {
  const originalOrder = [...group.platforms];
  group.platforms.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
```

This means:
- The in-memory `PLATFORM_GROUPS` gets reordered
- `platformPrefs.cardOrder` gets updated to match
- `renderPreviews()` reads from `platformPrefs.cardOrder`, not `PLATFORM_GROUPS.platforms`

So the mutation of `PLATFORM_GROUPS` is actually NOT the problem - the problem is the timing of when `platformPrefs.cardOrder` gets updated vs when `renderPreviews()` runs.

## Safeguard Strategy:

1. **Add a guard flag**: `isApplyingSmartOrder` - prevents re-renders during the critical window
2. **Make applySmartOrdering synchronous**: Remove the setTimeout and call it immediately
3. **Add state to renderPreviews**: Check if smart ordering is in progress and skip the cardOrder logic temporarily
4. **Use a mutex or queue**: Ensure only one ordering operation happens at a time
