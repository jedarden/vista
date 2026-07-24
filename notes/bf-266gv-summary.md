# Race Condition Investigation Summary (bf-266gv)

## Task Completed ✅

Investigated and documented the race condition in card ordering that occurs when `renderPreviews()` is called during smart ordering operations.

## What Was Found

### The Race Condition

The race condition occurred due to a timing window where:

1. `applySmartOrdering()` updated `platformPrefs.cardOrder` to the new smart order
2. `isApplyingSmartOrder` guard flag was cleared **before** `reorderPlatformCards()` completed
3. If `renderPreviews()` was called during this window (by event handlers, async operations, or user interactions):
   - It saw `isApplyingSmartOrder = false` (flag already cleared)
   - It saw `cardOrder` already updated to new order
   - It created NEW DOM elements while `reorderPlatformCards()` was still moving OLD elements
   - Result: DOM chaos (duplicate cards, wrong order, missing cards)

### The Fix

The fix ensures proper sequencing using try/finally:

1. `isApplyingSmartOrder = true` set before try block
2. `applySmartOrdering()` updates cardOrder inside try block
3. `reorderPlatformCards()` moves DOM elements inside try block (flag still true)
4. `finally { isApplyingSmartOrder = false }` clears flag AFTER reordering
5. If `renderPreviews()` is called during operation:
   - Sees flag = true
   - Queues in `pendingRenderData`
   - Returns early (no DOM mutation)
6. Queued render processed after flag cleared

## Files Created

### Documentation

1. **notes/bf-266gv-race-condition-analysis.md** (7.4 KB)
   - Executive summary of the race condition
   - Detailed code paths (before and after fix)
   - Timing windows showing exactly when race occurs
   - Functions involved in the race
   - Code locations and variables
   - Why it was hard to reproduce

2. **notes/bf-266gv-timing-diagram.md** (8.2 KB)
   - Visual ASCII diagrams of buggy vs fixed code paths
   - Detailed call stack traces
   - State transitions showing flag/cardOrder/DOM states
   - Key insight about WHEN flag is cleared

### Test/Reproduction

3. **test-race-condition-minimal-reproduction.js** (5.8 KB)
   - Simulates both buggy and fixed versions
   - Shows timing-dependent race condition
   - Verifies actual implementation has all fixes
   - Runnable demonstration

## Test Results

All existing tests pass ✅:

```bash
$ node test-race-condition-fix-simple.js
✅ All 4 tests passed

$ node test-card-order-persistence.js
✅ All 9 checks passed
```

## Code Locations

### Variables (Line 6200-6202)
- `isApplyingSmartOrder` - Guard flag
- `pendingRenderData` - Queues render data
- `pendingApplySmartOrder` - Queues smart ordering requests

### Key Functions
- `applySmartOrderingSafe()` - Line 8583 (thread-safe entry point)
- `applySmartOrdering()` - Line 8406 (updates cardOrder)
- `reorderPlatformCards()` - Line 8349 (moves DOM elements)
- `renderPreviews()` - Line 1583 (creates DOM elements)
- `renderTextPreviewsOnly()` - Line 1666 (progressive loading)

## Acceptance Criteria Met

✅ **Document the exact code path where race condition occurs**
   - Buggy code path: `applySmartOrderingSafe()` → flag cleared → `reorderPlatformCards()`
   - Fixed code path: try/finally ensures flag stays true during reordering

✅ **Show timing window when cards get reset**
   - Detailed timing diagrams in analysis.md and timing-diagram.md
   - Window: Between flag clearing and reorderPlatformCards() completion (~10-50ms)

✅ **Create minimal reproduction case**
   - test-race-condition-minimal-reproduction.js demonstrates both buggy and fixed behavior
   - Simulates the timing window and shows DOM chaos vs stable ordering

✅ **Identify which functions are involved in the race**
   - 4 main functions: `applySmartOrderingSafe()`, `applySmartOrdering()`, `reorderPlatformCards()`, `renderPreviews()`
   - 2 additional functions: `renderTextPreviewsOnly()`, `handleResult()`
   - Event handlers and async operations that can trigger renders

## Key Insight

The critical difference is **WHEN the guard flag is cleared**:

- **Before fix**: Flag cleared **before** `reorderPlatformCards()` → Race window exists
- **After fix**: Flag cleared **after** `reorderPlatformCards()` (in finally block) → No race window

The `try/finally` block ensures that even if errors occur, the flag is always cleared, preventing the system from getting stuck.

## Related Work

This investigation builds on previous beads:
- **bf-3l1r2** - Original race condition discovery
- **bf-2bs3c** - renderPreviews() cardOrder reading verification
- **bf-61vsc** - renderPreviews() platform ordering logic
- **bf-2d8g8** - renderPreviews() smart-ordered platforms verification
- **bf-55h73** - reorderPlatformCards() DOM reordering verification
- **bf-4bo1** - Resizable split panes implementation
- **bf-5125** - Scoring simulator pattern

## Conclusion

The race condition has been properly fixed in the codebase. All tests pass, and the implementation correctly uses guard flags and queue mechanisms to prevent concurrent execution issues during smart ordering operations.
