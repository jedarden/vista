# Card Order Reset Audit - bf-4tmye

## Summary
Comprehensive audit of all locations where card order could be reset or modified in the vista codebase.

## 1. Core Card Rendering Functions

### Primary Rendering Functions

| Function | Line | Purpose | Uses cardOrder? |
|----------|------|---------|-----------------|
| `showSkeletonCards()` | 1579 | Wrapper for renderSkeletons | Yes |
| `renderSkeletons()` | ~1518 | Renders skeleton loading cards | Yes (conditionally) |
| `renderPreviews()` | 1583 | Main rendering function for platform cards | Yes (conditionally) |
| `renderPlatformCard()` | 2211 | Builds HTML for a single platform card | No |
| `buildCard()` | 2016 | Creates card DOM element with data | No |
| `renderTextPreviewsOnly()` | ~1779 | Renders text-only preview cards | Yes (conditionally) |

**Conditional cardOrder Usage Pattern:**
All rendering functions check `isApplyingSmartOrder` flag before using `cardOrder`:
- If `cardOrder[group.id]` exists AND `!isApplyingSmartOrder`: use custom order
- If `isApplyingSmartOrder === true`: use default group order (to prevent race conditions)

## 2. applySmartOrdering() Call Sites

### Function Definition
- **Line 8571**: `applySmartOrdering()` - Main smart ordering function

### Call Sites

| Location | Line | Context | Guard Flags Used |
|----------|------|---------|------------------|
| `handleResult` hook | 8787 | Called after card render completes | `applySmartOrderingSafe()` wrapper |
| `applySmartOrderingSafe()` | 8815 | Thread-safe wrapper | `isApplyingSmartOrder` |

### Thread Safety Mechanism

```javascript
// Guard flags (lines 6254-6258)
let isApplyingSmartOrder = false;        // Prevents concurrent ordering operations
let pendingRenderData = null;             // Queues renders during smart ordering
let isRendering = false;                  // Prevents concurrent renders
let pendingRenderAfterCurrent = null;     // Queues renders during active render
```

**Flow:**
1. `handleResult` → calls `applySmartOrderingSafe()`
2. `applySmartOrderingSafe()` sets `isApplyingSmartOrder = true`
3. During ordering, `renderPreviews()` checks flag and queues if set
4. After ordering completes, flag cleared and queued render runs

## 3. Event Listeners That Could Trigger Order Resets

### DOM Load Events
| Event | Line | Handler | Can Reset Order? |
|-------|------|---------|------------------|
| `DOMContentLoaded` | 491 | Initial setup | No (initial load only) |

### Drag and Drop Events (Lines 9326-9442)
| Event | Line | Handler | Can Reset Order? |
|-------|------|---------|------------------|
| `dragstart` | 9326 | `handleDragStart` | No (marks drag) |
| `dragend` | 9327 | `handleDragEnd` | No (cleanup) |
| `dragover` | 9328 | `handleDragOver` | No (UI feedback) |
| `drop` | 9329 | `handleDrop` | **YES** - updates cardOrder |
| `dragenter` | 9330 | `handleDragEnter` | No (UI feedback) |
| `dragleave` | 9331 | `handleDragLeave` | No (UI feedback) |

**Critical:** `handleDrop()` (line 9368):
- Checks `isApplyingSmartOrder` flag - rejects drop if ordering in progress
- Updates `platformPrefs.cardOrder` when user reorders cards
- Calls `savePlatformPrefs()` to persist changes

### Click/UI Events
No direct order resets from click handlers - they primarily trigger mode switches.

## 4. Locations Where Order Could Be Reset/Cleared

### Explicit Clears

| Location | Line | Condition | Effect |
|----------|------|-----------|--------|
| `applySmartOrdering()` | 8618 | Page type change | Clears stale cardOrder for non-user-modified groups |

### Implicit Resets (via Re-render)

Any function that calls `renderPreviews()` could trigger order re-evaluation:

1. **`previewGrid.innerHTML = ''`** (Lines 923, 937, 1521, 1609)
   - Clears DOM, subsequent render rebuilds cards
   - If `cardOrder` exists, uses custom order
   - If `isApplyingSmartOrder === true`, uses default order

2. **`row.appendChild(card)`** (Lines 1569, 1697, 8554)
   - Appends card to DOM
   - Line 8554 is in `reorderPlatformCards()` - called after smart ordering

## 5. DOM Manipulation Patterns

### Direct DOM clears
```javascript
previewGrid.innerHTML = '';  // Lines 923, 937, 1521, 1609
```

### Card appends (append order determines visual order)
```javascript
row.appendChild(card);  // Lines 1569, 1697, 8554
previewGrid.appendChild(groupEl);  // Lines 1574, 1702, 1784
```

### Reorder without rebuild
```javascript
// reorderPlatformCards() - Line 8514
// Uses appendChild on existing cards to move them without full rebuild
targetOrder.forEach(pid => {
  const card = cardsByPid.get(pid);
  if (card) {
    row.appendChild(card);  // Moves existing card
  }
});
```

## 6. Card Order Storage

### Location
- **localStorage key:** `'vista-platform-prefs'` (line 7776)
- **Path:** `platformPrefs.cardOrder[group.id]`

### Load
- **Line 7685:** `const saved = localStorage.getItem('vista-platform-prefs')`

### Save
- **Line 7776:** `savePlatformPrefs()` writes to localStorage
- Called after:
  - Smart ordering completes (line 8745)
  - User drags cards (line 9451)

## 7. Race Condition Protections

### Guard Flags Usage

| Flag | Purpose | Checked By |
|------|---------|------------|
| `isApplyingSmartOrder` | Prevents renders during DOM reordering | `renderSkeletons()`, `renderPreviews()`, `handleDrop()` |
| `isRendering` | Prevents concurrent renders | `renderPreviews()` |
| `pendingRenderData` | Queues render during smart ordering | `applySmartOrderingSafe()` |
| `pendingRenderAfterCurrent` | Queues render during active render | `renderPreviews()` |

### Critical Code Paths

**Path 1: Normal Render**
```
handleResult() → renderPreviews() → uses cardOrder (if exists)
```

**Path 2: Smart Ordering**
```
handleResult() → applySmartOrderingSafe() → sets isApplyingSmartOrder=true
→ applySmartOrdering() → updates cardOrder
→ reorderPlatformCards() → reorders DOM
→ clears isApplyingSmartOrder → processes pendingRenderData
```

**Path 3: User Drag (with Guard)**
```
handleDrop() → checks isApplyingSmartOrder
→ if true: rejects drop
→ if false: updates cardOrder → savePlatformPrefs()
```

## 8. Potential Order Reset Locations (Risk Assessment)

### High Risk (Explicit Order Resets)

1. **`applySmartOrdering()` - Line 8618**
   - Condition: Page type change
   - Effect: Clears `cardOrder` for non-user-modified groups
   - Risk: **Controlled** - preserves user-modified groups

### Medium Risk (Re-render without Guard)

1. **`renderPreviews()` - Line 1583**
   - Has `isRendering` guard but could be called multiple times rapidly
   - Risk: **Mitigated** - queues concurrent renders

2. **Drag and drop during smart ordering**
   - `handleDrop()` checks `isApplyingSmartOrder` but timing is critical
   - Risk: **Mitigated** - rejects drops during ordering

### Low Risk (State Changes)

1. **localStorage writes**
   - `savePlatformPrefs()` is atomic
   - No order resets

2. **Group collapse/expand**
   - Visual only, doesn't affect order

## 9. Key Files

| File | Purpose |
|------|---------|
| `src/public/app.js` | All card rendering and ordering logic (main file) |
| `src/public/app-features.js` | Additional features (42KB) |
| `src/public/atomic-storage.js` | Atomic localStorage operations (9KB) |

## 10. Recommendations for Next Phase

1. **Monitor the page type change logic** (line 8618) - ensure it correctly identifies when to preserve vs. clear order
2. **Test rapid drag operations** - verify guard flag prevents race conditions
3. **Add logging to `renderPreviews()`** - track when queued renders occur
4. **Consider adding unit tests** for the guard flag state machine

## 11. Additional Context

### Constants
- `RECENT_KEY` - localStorage key for recent searches
- `STORAGE_KEY` - localStorage key for one-time shown messages

### Helper Functions
- `getPreferredPlatformOrder(pageType)` - Line 8495
- `savePlatformPrefs()` - Line 7675
- `reorderPlatformCards()` - Line 8514

---

**Generated:** 2026-07-24
**Bead:** bf-4tmye
**Scope:** Card order reset locations audit
