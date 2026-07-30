# Card Ordering Race Conditions - Specific Analysis

**Date:** 2026-07-23  
**Task:** Identify specific race conditions and order reset bugs  
**Bead:** bf-52nwq  
**Related:** bf-266gv (race condition investigation), bf-4qfif (comprehensive audit)

## Executive Summary

This analysis identifies **five specific race conditions** and **three order reset scenarios** in the Vista card ordering system. One critical race condition (RC-001) has been fixed; four remain open. The analysis includes reproduction steps, root causes, and a prioritized fix roadmap.

---

## Race Conditions

### RC-001: Guard Flag Cleared Too Early (FIXED)

**Status:** ✅ Fixed in commit a02ee46 (bf-2ce32)  
**Severity:** CRITICAL  
**Location:** `applySmartOrderingSafe()` / Line 8583  
**Components:** Guard flag, renderPreviews, reorderPlatformCards

#### Root Cause

The guard flag `isApplyingSmartOrder` was cleared **before** `reorderPlatformCards()` executed, creating a race window where `renderPreviews()` could execute concurrent with DOM manipulation.

#### Code Path (Before Fix)

```
applySmartOrderingSafe() [line 8583]
├─ isApplyingSmartOrder = true     [line 8592]
├─ applySmartOrdering()             [line 8599]
│  └─ Updates platformPrefs.cardOrder [line 8503]
├─ isApplyingSmartOrder = false     [line 8611] ⚠️ FLAG CLEARED TOO EARLY
└─ reorderPlatformCards()          [line 8607]
   └─ Moves DOM elements
   └─ ⚠️ RACE WINDOW: renderPreviews() can execute here!
```

#### Reproduction Steps

1. Enable smart ordering: `platformPrefs.smartOrdering = true`
2. Inspect a URL that triggers smart ordering (e.g., an article)
3. During the smart ordering operation, trigger an event that calls `renderPreviews()`:
   - Click favorite/hidden toggle
   - Paste HTML
   - Rapidly inspect another URL
4. Observe: Duplicate cards, wrong order, or cards disappearing

#### Symptoms

- Duplicate cards in the DOM
- Cards in wrong order despite correct `cardOrder`
- Cards disappearing temporarily
- Visual glitches during animations

#### Fix Applied

Moved `reorderPlatformCards()` **inside** the try block and cleared guard flag only in the finally block:

```javascript
function applySmartOrderingSafe() {
  isApplyingSmartOrder = true;
  try {
    applySmartOrdering();
    reorderPlatformCards(); // Now inside try block
  } finally {
    isApplyingSmartOrder = false; // Cleared only after all operations complete
    if (pendingRenderData) {
      renderPreviews(pendingRenderData); // Process queued render
    }
  }
}
```

---

### RC-002: Drag-and-Drop During Smart Ordering

**Status:** ❌ OPEN  
**Severity:** HIGH  
**Location:** `handleDrop()` / Line 9142  
**Components:** Drag events, renderPreviews, platformPrefs.cardOrder

#### Root Cause

`handleDrop()` directly calls `renderPreviews(currentData)` (line 9187) **without checking** the `isApplyingSmartOrder` guard flag. If a user drags a card during smart ordering, the drop handler can execute concurrent with DOM manipulation.

#### Code Path

```
applySmartOrderingSafe() starts
├─ isApplyingSmartOrder = true
├─ applySmartOrdering() → updates cardOrder
├─ reorderPlatformCards() → moving DOM elements
│  └─ ⚠️ RACE WINDOW
│     └─ User drags and drops a card
│        └─ handleDrop() executes
│           ├─ Updates platformPrefs.cardOrder
│           ├─ savePlatformPrefs()
│           └─ renderPreviews(currentData) ← NO GUARD CHECK!
└─ finally { isApplyingSmartOrder = false }
```

#### Reproduction Steps

1. Enable smart ordering
2. Inspect a URL to trigger smart ordering
3. **During** the smart ordering operation (race window), drag a card to a new position
4. Drop the card
5. Observe: `handleDrop()` calls `renderPreviews()` without checking guard flag

#### Symptoms

- Manual drag reorder gets overwritten by smart ordering
- Cards "snap back" to original position after drop
- `cardOrder` contains inconsistent state (partially smart-ordered, partially drag-ordered)
- localStorage contains corrupted order

#### Fix Required

Add guard flag check in `handleDrop()`:

```javascript
function handleDrop(e) {
  if (e.stopPropagation) e.stopPropagation();

  // Race condition fix: Queue drop operation if smart ordering in progress
  if (isApplyingSmartOrder) {
    console.warn('[handleDrop] Smart ordering in progress - deferring drop');
    // Option 1: Reject the drop with visual feedback
    e.preventDefault();
    return false;
    
    // Option 2: Queue the drop and process after smart ordering
    // pendingDropData = { draggedCard, fromGroup, toGroup, ... };
    // return false;
  }

  // ... existing drop logic
}
```

---

### RC-003: Concurrent Smart Ordering Operations

**Status:** 🔶 PARTIALLY MITIGATED  
**Severity:** MEDIUM  
**Location:** `applySmartOrderingSafe()` / Line 8573  
**Components:** pendingApplySmartOrder, handleResult hook

#### Root Cause

If `applySmartOrderingSafe()` is called twice in rapid succession (e.g., rapid URL inspections), the second call queues via `pendingApplySmartOrder` but **waits for setTimeout(..., 0)**. This can cause out-of-order execution if the first operation takes longer than expected.

#### Code Path

```
T0: applySmartOrderingSafe() #1 starts
├─ isApplyingSmartOrder = true
├─ applySmartOrdering() → detects page type "article"
└─ reorderPlatformCards() → DOM manipulation (slow operation)

T50: applySmartOrderingSafe() #2 starts (new URL inspected)
├─ isApplyingSmartOrder = true (already true)
├─ pendingApplySmartOrder = true
└─ return (queues)

T100: applySmartOrderingSafe() #1 completes
└─ finally { isApplyingSmartOrder = false }
└─ Process pendingRenderData

T101: setTimeout fires from operation #1
└─ applySmartOrderingSafe() #2 executes
   └─ ⚠️ Uses STALE page type (old URL's metadata)
```

#### Reproduction Steps

1. Enable smart ordering
2. Inspect URL A (article type)
3. **Immediately** inspect URL B (product type)
4. Observe: URL B's inspection queues, but may execute with URL A's page type

#### Symptoms

- Smart ordering applies wrong page type order
- Cards order based on previous URL's content type
- User sees cards reorder twice (confusing UX)

#### Current Mitigation

The code uses `pendingApplySmartOrder = true` to queue subsequent operations:

```javascript
if (isApplyingSmartOrder) {
  pendingApplySmartOrder = true;
  return;
}
```

However, the queued operation loses its context (page type).

#### Fix Required

Pass page type context through the queue:

```javascript
let pendingApplySmartOrder = false;
let pendingPageType = null; // Store page type

function applySmartOrderingSafe(pageType) {
  if (isApplyingSmartOrder) {
    pendingApplySmartOrder = true;
    pendingPageType = pageType; // Store context
    return;
  }
  
  isApplyingSmartOrder = true;
  pendingApplySmartOrder = false;
  const currentPageType = pageType || pendingPageType;
  pendingPageType = null; // Clear
  
  try {
    applySmartOrdering(currentPageType);
    reorderPlatformCards();
  } finally {
    isApplyingSmartOrder = false;
    if (pendingRenderData) {
      renderPreviews(pendingRenderData);
    }
    if (pendingApplySmartOrder) {
      setTimeout(applySmartOrderingSafe, 0, pendingPageType);
    }
  }
}
```

---

### RC-004: localStorage Write Race During Smart Ordering

**Status:** ❌ OPEN  
**Severity:** MEDIUM  
**Location:** `applySmartOrdering()` / Line 8522, `handleDrop()` / Line 9184  
**Components:** localStorage, platformPrefs, savePlatformPrefs

#### Root Cause

Both `applySmartOrdering()` and `handleDrop()` write to localStorage **without synchronization**. If smart ordering and drag-and-drop occur concurrently, localStorage receives writes in undefined order, potentially corrupting the saved state.

#### Code Path

```
applySmartOrdering() running
├─ Updates platformPrefs.cardOrder (smart order)
├─ localStorage.setItem() starts (write #1)
│  └─ ⚠️ ASYNC operation (not guaranteed to complete)
└─ reorderPlatformCards()

Meanwhile, handleDrop() executes
├─ Updates platformPrefs.cardOrder (drag order)
├─ localStorage.setItem() (write #2)
└─ ⚠️ May overwrite write #1 or vice versa
```

#### Reproduction Steps

1. Enable smart ordering
2. Inspect a URL to trigger smart ordering
3. **During** the smart ordering operation, drag and drop a card
4. Reload the page
5. Observe: Saved order may be either smart order or drag order (undefined)

#### Symptoms

- Order not persisted correctly after page reload
- localStorage contains order from the "wrong" operation
- User's manual drag order lost after smart ordering

#### Fix Required

Implement write serialization with a write queue:

```javascript
let writeQueue = Promise.resolve();
let pendingWriteData = null;

function savePlatformPrefsAsync() {
  const prefs = {
    favorites: Array.from(platformPrefs.favorites),
    hidden: Array.from(platformPrefs.hidden),
    columnCount: platformPrefs.columnCount,
    smartOrdering: platformPrefs.smartOrdering,
    cardOrder: platformPrefs.cardOrder
  };
  
  // Serialize writes
  writeQueue = writeQueue.then(() => {
    return new Promise((resolve) => {
      localStorage.setItem('vista-platform-prefs', JSON.stringify(prefs));
      resolve();
    });
  });
  
  return writeQueue;
}
```

---

### RC-005: Queued Render Stale Data

**Status:** 🔶 PARTIALLY MITIGATED  
**Severity:** LOW  
**Location:** `applySmartOrderingSafe()` finally block / Line 8614  
**Components:** pendingRenderData, renderPreviews

#### Root Cause

If multiple render calls occur during smart ordering, `pendingRenderData` is **overwritten** with the latest data. The earlier queued data is lost. While this is usually desirable (show latest state), it can cause issues if operations depend on seeing intermediate states.

#### Code Path

```
applySmartOrderingSafe() starts
├─ isApplyingSmartOrder = true
├─ applySmartOrdering()
└─ reorderPlatformCards()

Render #1 arrives (data A)
└─ pendingRenderData = data A

Render #2 arrives (data B)
└─ pendingRenderData = data B ← OVERWRITES data A

Render #3 arrives (data C)
└─ pendingRenderData = data C ← OVERWRITES data B

Smart ordering completes
└─ renderPreviews(data C) ← data A and B never rendered
```

#### Reproduction Steps

1. Enable smart ordering
2. Inspect URL to trigger smart ordering
3. **During** operation, rapidly trigger 3 events that call `renderPreviews()`:
   - Click favorite
   - Click hidden
   - Paste HTML
4. Observe: Only the last event's data is rendered

#### Symptoms

- Intermediate UI states not shown (usually OK)
- If intermediate states had user-visible changes, they're lost
- Inconsistent with expected progressive rendering behavior

#### Current Mitigation

The code correctly uses the **latest** data, which is usually the desired behavior. This is only an issue if intermediate states must be visible.

#### Fix Required (Optional)

Implement a render queue if intermediate states must be preserved:

```javascript
let renderQueue = [];

function renderPreviews(data) {
  if (isApplyingSmartOrder) {
    renderQueue.push(data); // Store all, not just latest
    return;
  }
  // ... render logic
}

// In applySmartOrderingSafe finally block:
finally {
  isApplyingSmartOrder = false;
  if (renderQueue.length > 0) {
    const dataToRender = renderQueue[renderQueue.length - 1]; // Latest
    renderQueue = [];
    renderPreviews(dataToRender);
  }
}
```

---

## Order Reset Scenarios

### RS-001: Smart Ordering Overwrites Manual Reorder

**Status:** ❌ OPEN  
**Severity:** HIGH  
**Location:** `applySmartOrdering()` / Line 8394  
**Components:** Smart ordering, cardOrder persistence

#### Root Cause

When smart ordering runs, it **overwrites** `platformPrefs.cardOrder` for all groups with the page-type-specific order. If the user had previously manually reordered cards (via drag-and-drop), their custom order is lost.

#### Code Path

```
User manually reorders cards via drag-and-drop
├─ handleDrop() updates platformPrefs.cardOrder
└─ savePlatformPrefs() persists custom order

User inspects a new URL (triggers smart ordering)
├─ applySmartOrdering() detects page type
├─ For each group, overwrites cardOrder with smart order
│  └─ ⚠️ USER'S CUSTOM ORDER LOST
└─ savePlatformPrefs() persists smart order
```

#### Reproduction Steps

1. Disable smart ordering temporarily
2. Drag cards to custom order
3. Re-enable smart ordering
4. Inspect a URL
5. Observe: Custom order replaced with smart order

#### Symptoms

- User's manual drag reorder disappears after URL inspection
- Cards "magically" move to different positions
- User frustration: "I just ordered these how I want them!"

#### Fix Required

Implement **merge semantics** for smart ordering:

```javascript
function applySmartOrdering() {
  // ... existing code ...
  
  PLATFORM_GROUPS.forEach((group) => {
    const preferredOrder = getPlatformOrderForPageType(pageType, group.id);
    
    // Check if user has manually customized this group's order
    const hasCustomOrder = platformPrefs.cardOrder[group.id] && 
                           !platformPrefs.cardOrder[group.id].isSmartOrdered;
    
    if (hasCustomOrder) {
      // Preserve user's custom order - don't overwrite
      console.log(`[applySmartOrdering] Preserving custom order for group ${group.id}`);
      return;
    }
    
    // Apply smart order and mark as auto-ordered
    platformPrefs.cardOrder[group.id] = preferredOrder;
    platformPrefs.cardOrder[group.id].isSmartOrdered = true;
  });
  
  localStorage.setItem('vista-platform-prefs', JSON.stringify(platformPrefs));
}
```

---

### RS-002: Multi-Tab localStorage Overwrite

**Status:** ❌ OPEN  
**Severity:** MEDIUM  
**Location:** All `localStorage.setItem()` calls  
**Components:** localStorage, storage events, cross-tab sync

#### Root Cause

No **storage event listener** is implemented. If user has two tabs open and changes card order in Tab A, Tab B doesn't know about the change and continues using stale `cardOrder`. When Tab B saves, it overwrites Tab A's changes.

#### Code Path

```
Tab A                              Tab B
────────────────────────────────────────────────
User drags card                    User has same page open
handleDrop() executes              
├─ Updates cardOrder               
└─ localStorage.setItem()          
   (writes order: [A,B,C])         
                                   No event listener
                                   Tab B unaware of change
                                   
                                   User inspects URL
                                   applySmartOrdering()
                                   └─ localStorage.setItem()
                                      (writes order: [X,Y,Z])
                                      ⚠️ OVERWRITES Tab A's order!
```

#### Reproduction Steps

1. Open Vista in two tabs
2. In Tab A, manually reorder cards
3. In Tab B, inspect a URL (triggers smart ordering)
4. Reload Tab A
5. Observe: Tab A's custom order is gone

#### Symptoms

- Changes in one tab don't appear in other tabs
- Last tab to write "wins" (race condition)
- User confusion: "I just fixed the order, why did it change?"

#### Fix Required

Implement storage event listener:

```javascript
// Initialize on page load
window.addEventListener('storage', (e) => {
  if (e.key === 'vista-platform-prefs' && e.newValue) {
    console.log('[storage event] Preferences changed in another tab');
    loadPlatformPrefs();
    renderPreviews(currentData);
  }
});
```

---

### RS-003: Rapid Render Clears Custom Order

**Status:** ⚠️ EDGE CASE  
**Severity:** LOW  
**Location:** `renderPreviews()` / Line 1628  
**Components:** cardOrder reading, platformPrefs filtering

#### Root Cause

When `renderPreviews()` reads `platformPrefs.cardOrder[group.id]`, it **filters out** platforms that no longer exist in the group (line 1630). If a platform is temporarily missing from data but should be in the order, it gets dropped from `cardOrder`.

#### Code Path

```
cardOrder = { social: ['twitter', 'facebook', 'linkedin', 'reddit'] }

renderPreviews() called with incomplete data
├─ group.platforms = ['twitter', 'linkedin'] (facebook, reddit missing)
├─ Filters cardOrder:
│  └─ customOrder = ['twitter', 'linkedin'] (filtered)
└─ Saves filtered order back to cardOrder

renderPreviews() called again with complete data
├─ group.platforms = ['twitter', 'facebook', 'linkedin', 'reddit']
├─ Reads cardOrder = ['twitter', 'linkedin']
└─ ⚠️ facebook and reddit lost from order!
```

#### Reproduction Steps

1. Set custom order for all platforms
2. Inspect URL with incomplete metadata (some platforms fail)
3. Custom order is filtered to only successful platforms
4. Inspect another URL with complete metadata
5. Observe: Previously missing platforms appear at end, not in saved position

#### Symptoms

- Platforms appear at end of list instead of saved position
- Order gradually degrades with each incomplete inspection
- User must manually reorder again

#### Current Mitigation

The code **does not save** the filtered order back to `cardOrder` in `renderPreviews()`. This is correct - the filtering only affects the current render.

#### Fix Required (Already Correct)

The current implementation is correct. The filtered order is used for rendering only, not persisted. However, if this behavior changes in the future, it would introduce this reset scenario.

---

## Fix Priority Order

### Priority 1 (CRITICAL - Fix Immediately)

1. **RC-002: Drag-and-Drop During Smart Ordering**
   - Direct call to `renderPreviews()` without guard check
   - Can cause DOM corruption
   - High user impact (common interaction pattern)

### Priority 2 (HIGH - Fix Soon)

2. **RC-003: Concurrent Smart Ordering Operations**
   - Context loss on queued operations
   - Medium user impact (rapid URL inspections)
3. **RS-001: Smart Ordering Overwrites Manual Reorder**
   - User experience issue (customization lost)
   - Medium user impact (affects users who customize order)

### Priority 3 (MEDIUM - Fix When Convenient)

4. **RC-004: localStorage Write Race**
   - Requires Promise-based serialization
   - Low user impact (only on concurrent operations)
5. **RS-002: Multi-Tab localStorage Overwrite**
   - Requires storage event listener
   - Low user impact (only multi-tab users)

### Priority 4 (LOW - Optional)

6. **RC-005: Queued Render Stale Data**
   - Current behavior (show latest) is usually correct
   - Very low user impact
7. **RS-003: Rapid Render Clears Custom Order**
   - Edge case, already mitigated
   - Very low user impact

---

## Testing Recommendations

### Unit Tests Required

1. **Drag-drop during smart ordering** (RC-002)
   - Mock `isApplyingSmartOrder = true`
   - Trigger `handleDrop()`
   - Verify operation is rejected or queued

2. **Concurrent smart ordering** (RC-003)
   - Call `applySmartOrderingSafe()` twice rapidly
   - Verify second operation preserves page type context

3. **localStorage write serialization** (RC-004)
   - Trigger concurrent writes
   - Verify all writes complete in order

### Integration Tests Required

1. **Multi-tab synchronization** (RS-002)
   - Open two browser contexts
   - Modify order in one
   - Verify other updates

2. **Smart order preservation** (RS-001)
   - Set custom order
   - Trigger smart ordering
   - Verify custom order preserved

---

## Conclusion

The Vista card ordering system has one fixed race condition (RC-001) and four remaining race conditions (RC-002 through RC-005). The highest priority is RC-002 (drag-and-drop during smart ordering) as it lacks the guard flag check that protects other code paths.

The three order reset scenarios (RS-001, RS-002, RS-003) are less critical but affect user experience. RS-001 should be addressed to preserve user customizations.

All issues are fixable with targeted code changes. The existing race condition protection pattern (guard flags + queued operations) should be extended to cover drag-and-drop events.

---

**Analysis Complete: 5 race conditions identified (1 fixed, 4 open), 3 reset scenarios documented**
