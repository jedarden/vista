# Smart Ordering Flow Analysis

## Current Flow

1. Page loads
2. loadPlatformPrefs() loads `platformPrefs.cardOrder` from localStorage
3. User navigates to a URL
4. handleResult(data) is called
5. Hook calls await originalHandleResult2(data)
6. Inside originalHandleResult2: renderPreviews(data) is called
7. renderPreviews checks `platformPrefs.cardOrder[group.id]` for each group
8. If cardOrder exists, uses it; otherwise uses default order
9. Hook calls setTimeout(applySmartOrdering, 200)
10. 200ms later: applySmartOrdering() is called
11. applySmartOrdering reorders PLATFORM_GROUPS and sets cardOrder
12. applySmartOrdering calls renderPreviews(currentData)

## Potential Issues

### Issue 1: Old cardOrder used on first render
If platformPrefs.cardOrder has an order from a previous page load, renderPreviews uses it. But that order might not match the current page type's smart order.

### Issue 2: Timing problem
The first render (step 8) uses old or no cardOrder. The second render (step 12) should use the updated cardOrder. But there's a 200ms delay where the user sees the wrong order.

### Issue 3: DOM rebuild
renderPreviews clears previewGrid.innerHTML and rebuilds. This should work, but we need to verify the order is actually being applied.

## Questions to Debug

1. Is platformPrefs.cardOrder actually being updated by applySmartOrdering?
2. Is renderPreviews actually reading the updated cardOrder?
3. Is the DOM being rebuilt in the correct order?
4. Is there another call to renderPreviews that's resetting the order?

## Next Steps

Let me trace through the actual execution by adding some console logs and checking if there are other renderPreviews calls that might be interfering.
