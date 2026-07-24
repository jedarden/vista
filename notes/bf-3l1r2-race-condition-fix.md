# Race Condition Fix for Card Order Reset (bf-3l1r2)

## Problem
The race condition occurred because `PLATFORM_GROUPS` (a global array) was mutated BEFORE `cardOrder` was updated. This created a window where:

1. `applySmartOrdering()` mutates `PLATFORM_GROUPS[groupIndex].platforms.sort(...)`
2. Concurrent code reads the mutated `group.platforms`
3. But `cardOrder` hasn't been updated yet
4. Result: cards render in new order without `cardOrder` being set
5. On next render, `cardOrder` is missing, so order resets to default

## Root Cause
From `/home/coding/vista/notes/race-condition-root-cause.md`:

> The race condition occurs because `PLATFORM_GROUPS` (a global array) is mutated BEFORE we finish applying smart ordering, allowing concurrent `renderPreviews()` calls to see inconsistent state.

The issue was that `renderPreviews()` checked `isApplyingSmartOrder` to decide whether to use `cardOrder`, but it ALWAYS used `group.platforms` (the global state). When `applySmartOrdering()` mutates the global state, ANY concurrent or immediately-following `renderPreviews()` will see the mutated state.

## Solution
**Do not mutate `PLATFORM_GROUPS` during smart ordering.**

### Changes Made

1. **No Global Mutation** (line 8466):
   - Before: `group.platforms.sort(...)` - mutated global `PLATFORM_GROUPS`
   - After: `const smartOrder = [...group.platforms].sort(...)` - works on local copy

2. **Update cardOrder Only** (line 8480):
   - Before: `platformPrefs.cardOrder[group.id] = [...group.platforms]` - from mutated global
   - After: `platformPrefs.cardOrder[group.id] = [...smartOrder]` - from local copy

3. **Remove DOM Mutation** (removed line 8523):
   - Before: `reorderPlatformCards()` - mutated DOM during smart ordering
   - After: Removed - DOM updates happen via queued `renderPreviews()` instead

4. **Updated Logging** (line 8499):
   - Before: Logged "Platform order AFTER" showing mutated global state
   - After: Logs both default order (unchanged) and smart order (in cardOrder)

## How It Works Now

### Smart Ordering Flow:
1. `applySmartOrderingSafe()` sets `isApplyingSmartOrder = true`
2. `applySmartOrdering()` creates local copies and computes smart order
3. Updates ONLY `cardOrder` (does NOT touch `PLATFORM_GROUPS`)
4. Saves to localStorage
5. `finally` block sets `isApplyingSmartOrder = false`
6. Processes queued `renderPreviews()` with updated `cardOrder`

### Render Flow:
1. `renderPreviews()` checks if `isApplyingSmartOrder` is true
2. If true: stores data in `pendingRenderData` and returns (queues render)
3. If false: proceeds to render
4. For each group, checks if `cardOrder` exists
5. If `cardOrder` exists: uses that order (includes smart order)
6. If `cardOrder` missing: uses default `PLATFORM_GROUPS` order

### Race Condition Prevention:
- **No global mutation**: `PLATFORM_GROUPS` stays constant
- **Guard flag**: `isApplyingSmartOrder` prevents concurrent renders
- **Queued render**: Ensures render happens after smart ordering completes
- **Single source of truth**: `cardOrder` holds all custom/smart ordering

## Verification

Run `/home/coding/vista/verify-race-condition-final.js`:

```bash
node verify-race-condition-final.js
```

All tests pass:
- ✅ PLATFORM_GROUPS is NOT mutated
- ✅ cardOrder is updated with local smart order
- ✅ No DOM mutation during applySmartOrdering
- ✅ All guard flags in place
- ✅ Queued render processing in finally block
- ✅ Code documents the fix

## Acceptance Criteria Met

✅ **No code path resets cardOrder after reordering**
- `cardOrder` is only updated intentionally in `applySmartOrdering()` and drag-drop handlers
- No code path clears or resets `cardOrder`

✅ **Platform order persists across renderPreviews() calls**
- `cardOrder` is saved to localStorage and loaded on page refresh
- Each `renderPreviews()` call checks and uses `cardOrder` if available
- Smart ordering updates `cardOrder` without mutating global state

✅ **Race condition window is eliminated**
- No global state mutation during smart ordering
- Guard flag prevents concurrent renders
- Queued render ensures proper sequencing

✅ **Order remains stable after page interactions**
- Theme toggle: uses existing data, doesn't change order
- What If mode: clones data, doesn't modify `cardOrder`
- Page refresh: loads `cardOrder` from localStorage
- Drag-drop: updates `cardOrder` intentionally

## Files Modified

- `/home/coding/vista/src/public/app.js`:
  - Lines 8459-8492: Changed to use local copy instead of mutating global
  - Lines 8494-8517: Updated logging and removed DOM mutation
