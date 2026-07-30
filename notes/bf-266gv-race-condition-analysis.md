# Card Ordering Race Condition Analysis

## Executive Summary

The race condition occurs when `renderPreviews()` is called DURING the smart ordering operation, creating a timing window where:
- `platformPrefs.cardOrder` has been updated to the new order
- `isApplingSmartOrder` guard flag has been cleared
- `reorderPlatformCards()` is still moving DOM elements
- `renderPreviews()` executes and creates NEW elements while `reorderPlatformCards()` is still trying to move OLD elements

This results in DOM chaos: duplicate cards, wrong order, or cards disappearing.

## The Bug (Before Fix)

### Code Path

```
applySmartOrderingSafe() [line 8583]
├─ isApplyingSmartOrder = true     [line 8592]
├─ applySmartOrdering()             [line 8599]
│  └─ Updates platformPrefs.cardOrder to new smart order [line 8503]
├─ isApplyingSmartOrder = false     [line 8611] ⚠️ FLAG CLEARED TOO EARLY
└─ reorderPlatformCards()          [line 8607]
   └─ Moves DOM elements to match new order [line 8389]
      └─ RACE WINDOW: renderPreviews() can execute here!
```

### Timing Window

```
Time │ Event                              │ isApplyingSmartOrder │ cardOrder          │ DOM State
─────┼────────────────────────────────────┼─────────────────────┼────────────────────┼──────────────────
 T0  │ applySmartOrderingSafe() starts   │ false → true         │ [twitter,fb,li]    │ Old order
 T1  │ applySmartOrdering() runs          │ true                 │ [li,twitter,fb]     │ Old order
 T2  │ cardOrder UPDATED                  │ true                 │ [li,twitter,fb] ✅  │ Old order
 T3  │ isApplyingSmartOrder = false       │ true → false ⚠️      │ [li,twitter,fb]     │ Old order
 T4  │ reorderPlatformCards() starts      │ false                │ [li,twitter,fb]     │ Moving...
     │ ⚠️ RACE WINDOW STARTS              │                      │                    │
     │ renderPreviews() can execute now!  │                      │                    │
     │ • Sees isApplyingSmartOrder=false │                      │                    │
     │ • Sees cardOrder=[li,twitter,fb]  │                      │                    │
     │ • Creates NEW DOM in new order     │                      │                    │
     │                                    │                      │                    │
     │ reorderPlatformCards():            │                      │                    │
     │ • Tries to move OLD elements       │                      │                    │
     │ • But they've been replaced!       │                      │                    │
     │ ⚠️ RACE WINDOW ENDS                │                      │                    │
 T5  │ reorderPlatformCards() finishes    │ false                │ [li,twitter,fb]     │ BROKEN! 😱
```

### What Goes Wrong

1. `renderPreviews()` executes at T4 during the race window
2. It sees `isApplyingSmartOrder = false`, so it doesn't queue
3. It sees `cardOrder = [li,twitter,fb]` (updated)
4. It creates brand new DOM elements in that order
5. Meanwhile, `reorderPlatformCards()` is trying to move the OLD elements
6. Result: DOM conflict - cards are duplicated, moved, or lost

### Functions Involved in the Race

| Function | Line | Role | Problem |
|----------|------|------|---------|
| `applySmartOrderingSafe()` | 8583 | Entry point for smart ordering | Clears flag before reordering |
| `applySmartOrdering()` | 8406 | Updates cardOrder | Updates order too early |
| `reorderPlatformCards()` | 8349 | Moves existing DOM elements | Runs AFTER flag is cleared |
| `renderPreviews()` | 1583 | Creates new DOM elements | Executes during race window |
| `renderTextPreviewsOnly()` | 1666 | Creates text-only cards | Also executes during race window |

## The Fix

### Code Path (After Fix)

```
applySmartOrderingSafe() [line 8583]
├─ isApplyingSmartOrder = true     [line 8592]
├─ try {                            [line 8597]
│  ├─ applySmartOrdering()           [line 8599]
│  │  └─ Updates platformPrefs.cardOrder [line 8503]
│  └─ reorderPlatformCards()         [line 8607]
│     └─ Moves DOM elements         [line 8389]
├─ } finally {                      [line 8608]
│  └─ isApplyingSmartOrder = false  [line 8611] ✅ FLAG CLEARED AFTER REORDERING
├─ Process pendingRenderData         [line 8616]
│  └─ renderPreviews(dataToRender)  [line 8622]
```

### Timing Window (Fixed)

```
Time │ Event                              │ isApplyingSmartOrder │ cardOrder          │ DOM State
─────┼────────────────────────────────────┼─────────────────────┼────────────────────┼──────────────────
 T0  │ applySmartOrderingSafe() starts   │ false → true         │ [twitter,fb,li]    │ Old order
 T1  │ applySmartOrdering() runs          │ true                 │ [li,twitter,fb]     │ Old order
 T2  │ cardOrder UPDATED                  │ true                 │ [li,twitter,fb] ✅  │ Old order
 T3  │ reorderPlatformCards() runs        │ true ✅               │ [li,twitter,fb]     │ Moving...
 T4  │ renderPreviews() called           │ true ✅               │ [li,twitter,fb]     │ Moving...
     │ • Sees isApplyingSmartOrder=true   │                      │                    │
     │ • Queues in pendingRenderData     │                      │                    │
     │ • Returns early                   │                      │                    │
 T5  │ reorderPlatformCards() finishes    │ true ✅               │ [li,twitter,fb]     │ New order ✅
 T6  │ finally { isApplyingSmartOrder=false } │ true → false ✅ │ [li,twitter,fb]     │ New order ✅
 T7  │ Process pendingRenderData          │ false                │ [li,twitter,fb]     │ New order ✅
 T8  │ renderPreviews(pendingRenderData)  │ false                │ [li,twitter,fb]     │ New order ✅
```

### What Changed

1. **Flag stays true during entire operation**: `isApplyingSmartOrder = true` is set before try block and cleared only in finally block
2. **reorderPlatformCards() inside try block**: DOM manipulation happens while flag is still true
3. **renderPreviews() checks flag**: If flag is true, it queues the render and returns early
4. **Queued render processed after flag cleared**: Ensures clean state when render finally executes

## Call Sites That Can Trigger the Race

### Direct renderPreviews() Calls

```javascript
// Line 1583 - Main render function
function renderPreviews(data) {
  if (isApplyingSmartOrder) {
    pendingRenderData = data;  // Queue it
    return;                    // Skip rendering
  }
  // ... create DOM elements
}
```

### Event Handlers That Call renderPreviews()

```javascript
// Line 8563 - handleResult hook (called after URL inspection)
handleResult = async function(data) {
  await originalHandleResult2(data);
  if (platformPrefs.smartOrdering) {
    applySmartOrderingSafe();  // Can trigger race if renderPreviews called here
  }
};
```

### Async Operations That Can Call renderPreviews()

- `progressiveLoad()` - Progressive image loading [line 4204]
- `handlePasteDetection()` - Paste event handler [line 7905]
- `inspectUrl()` - URL inspection [line 8192]
- Any setTimeout callback that triggers rendering

## Code Locations

### Variables

| Variable | Line | Purpose |
|----------|------|---------|
| `isApplyingSmartOrder` | 6200 | Guard flag to prevent concurrent smart ordering |
| `pendingRenderData` | 6201 | Queues render data during smart ordering |
| `pendingApplySmartOrder` | 6202 | Queues smart ordering requests during smart ordering |
| `platformPrefs.cardOrder` | - | Stores custom card order per group |

### Key Functions

| Function | Line | Purpose |
|----------|------|---------|
| `applySmartOrderingSafe()` | 8583 | Thread-safe entry point for smart ordering |
| `applySmartOrdering()` | 8406 | Computes and updates cardOrder based on page type |
| `reorderPlatformCards()` | 8349 | Moves existing DOM elements to match cardOrder |
| `renderPreviews()` | 1583 | Creates new DOM elements from scratch |
| `renderTextPreviewsOnly()` | 1666 | Creates text-only cards during progressive loading |

## Why This Was Hard to Reproduce

The race condition is timing-dependent and only occurs when:

1. **Smart ordering is enabled**: `platformPrefs.smartOrdering = true`
2. **A URL is inspected that triggers smart ordering**: Page type detection runs
3. **renderPreviews() is called during the narrow race window**: Between flag clearing and reordering completion
4. **The timing must be just right**: Usually requires async operations or event handlers

Typical scenarios that trigger it:
- Rapid URL inspections
- Event handlers firing during smart ordering
- Async operations (setTimeout, promises) completing during reordering
- User interactions during page load

## Related Files

- `test-reorderPlatformCards-dom.js` - Tests reorderPlatformCards() implementation
- `test-card-order-persistence.js` - Tests card order persistence across re-renders
- `test-race-condition-fix-simple.js` - Simple test for race condition fix
- `test-race-condition-fix.js` - Comprehensive race condition test

## See Also

- Bead: bf-266gv - Investigation of race condition
- Bead: bf-3l1r2 - Original race condition discovery
- Bead: bf-2bs3c - renderPreviews() cardOrder reading verification
- Bead: bf-61vsc - renderPreviews() platform ordering logic
- Bead: bf-2d8g8 - renderPreviews() smart-ordered platforms verification
