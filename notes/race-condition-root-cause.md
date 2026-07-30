# Race Condition Root Cause Analysis

## The Problem

The race condition occurs because `PLATFORM_GROUPS` (a global array) is mutated BEFORE we finish applying smart ordering, allowing concurrent `renderPreviews()` calls to see inconsistent state.

## Current Flow (PROBLEMATIC)

```
1. handleResult completes
2. applySmartOrderingSafe() sets isApplyingSmartOrder = true
3. applySmartOrdering() is called:
   a. Line 8460: PLATFORM_GROUPS[groupIndex].platforms.sort(...)
   b. Line 8474: platformPrefs.cardOrder[group.id] = [...group.platforms]
   c. Line 8505: localStorage.save
   d. Line 8517: reorderPlatformCards()
4. applySmartOrderingSafe() sets isApplyingSmartOrder = false
```

If `renderPreviews()` is called during step 3a (after platforms.sort but before cardOrder update):
- `isApplyingSmartOrder` is true
- Code skips using `platformPrefs.cardOrder`
- But it STILL uses `group.platforms`, which was already mutated!
- This causes cards to be rendered in the NEW order, but without updating cardOrder

## The Root Cause

The issue is that `renderPreviews()` checks `isApplyingSmartOrder` to decide whether to use `cardOrder`, but it ALWAYS uses `group.platforms` (the global state). When `applySmartOrdering()` mutates the global state, ANY concurrent or immediately-following `renderPreviews()` will see the mutated state.

## The Fix

We need to ensure that when `isApplyingSmartOrder` is true, `renderPreviews()` doesn't use EITHER the mutated `PLATFORM_GROUPS` OR the stale `cardOrder`. Instead, it should:

1. Option A: Use a cached copy of the pre-ordering state
2. Option B: Block rendering entirely until smart ordering completes
3. Option C: Only set `isApplyingSmartOrder` AFTER all mutations are complete

Option B is the cleanest: when smart ordering is in progress, don't allow re-renders.
