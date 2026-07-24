# Task bf-2d8g8: Debug renderPreviews() to use smart-ordered platforms

## Summary

Verified that `renderPreviews()` correctly implements smart ordering using `platformPrefs.cardOrder`. All acceptance criteria are satisfied.

## Acceptance Criteria Status

✅ **renderPreviews() respects platformPrefs.cardOrder**
- Lines 1628-1640 in app.js check `platformPrefs.cardOrder[group.id]` 
- Filters custom order to existing platforms
- Appends new platforms not in custom order

✅ **Uses smart-ordered platform list instead of default order**
- Line 1633: `platforms = [...customOrder, ...newPlatforms]`
- Line 1642: `platforms.forEach((pid, i)` iterates over reordered array
- Cards are built in the order determined by cardOrder

✅ **DOM elements are created in the new order**
- Line 1596: `previewGrid.innerHTML = ''` clears and rebuilds
- Lines 1642-1651: Cards are created and appended in smart order
- Full rebuild approach ensures correct ordering

✅ **No race condition that resets order after reordering**
- Lines 1587-1594: Race condition guard (`isApplyingSmartOrder`) queues render
- Line 1628: Only uses cardOrder when `!isApplyingSmartOrder`
- `applySmartOrderingSafe()` sets guard flag, updates cardOrder, reorders DOM, then processes queued render

## Code Flow

### Smart Ordering Flow
1. `applySmartOrderingSafe()` (line 8571):
   - Sets `isApplyingSmartOrder = true`
   - Calls `applySmartOrdering()` (line 8394)
   - Calls `reorderPlatformCards()` (line 8337) to move existing DOM
   - Clears flag and processes queued render in finally block

2. `applySmartOrdering()` (line 8394):
   - Computes smart order based on page type
   - Stores in `platformPrefs.cardOrder[group.id]` (line 8491)
   - Does NOT mutate PLATFORM_GROUPS (uses local copy)
   - Saves to localStorage for persistence

3. `renderPreviews()` (line 1583):
   - Queues render if `isApplyingSmartOrder` is true (lines 1587-1594)
   - Uses `platformPrefs.cardOrder[group.id]` when available (lines 1628-1640)
   - Creates cards in smart order (lines 1642-1651)

### Race Condition Prevention
- `isApplyingSmartOrder` guard flag prevents concurrent operations
- `pendingRenderData` queues latest data during smart ordering
- Queued render processed after flag cleared in finally block
- Double-check: cardOrder only used when `!isApplyingSmartOrder`

## Test Coverage

Created comprehensive test (`test-bf-2d8g8-comprehensive.js`) with 18 tests covering:
- cardOrder reading and filtering
- Custom order application
- DOM rebuilding approach
- Race condition guards
- Queued render processing
- Smart order updates
- Debug logging

All 18 tests pass ✅

## Implementation Notes

- **Approach**: Full rebuild (innerHTML = '') rather than DOM moves
- **Why**: Simpler and ensures correct order; flicker acceptable given smart ordering runs once after page analysis
- **Persistence**: cardOrder saved to localStorage for cross-session persistence
- **New platforms**: Automatically appended after custom-ordered platforms
- **Logging**: Added [renderPreviews] logs for debugging cardOrder usage

## Files Modified

- `src/public/app.js`: Implementation already correct (no changes needed)
- `test-bf-2d8g8-comprehensive.js`: Created comprehensive verification test
- `notes/bf-2d8g8.md`: This documentation file

## Verification

Run comprehensive test:
```bash
node test-bf-2d8g8-comprehensive.js
```

All tests pass with 18/18 criteria satisfied.
