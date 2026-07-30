# Smart Ordering Reset Points Audit
**Bead:** bf-491cl  
**Date:** 2026-07-23  
**Workspace:** /home/coding/vista

## Overview
This audit identifies all locations in the vista codebase where smart ordering gets reset, applied, or modified. Smart ordering is the feature that automatically reorders platform cards based on the detected page type (article, product, website, etc.).

---

## Core Data Structures

### platformPrefs (Global State)
```javascript
platformPrefs = {
  smartOrdering: true,           // Master toggle for smart ordering feature
  cardOrder: {},                 // Map: groupId -> array of platform IDs in custom order
  cardOrderMetadata: {},         // Map: groupId -> {userModified, lastModified, modifiedBy, pageType}
  favorites: Set,                // Set of favorited platform IDs
  hidden: Set,                   // Set of hidden platform IDs
  columnCount: 3                 // Number of columns in layout
}
```

### Guard Flags
```javascript
isApplyingSmartOrder = false;   // Guard flag - prevents concurrent execution
pendingApplySmartOrder = false;  // Queues pending smart ordering operations
pendingRenderData = null;       // Queues renders during smart ordering
currentPageType = null;          // Tracks current page type for stale detection
```

---

## 1. PRIMARY ENTRY POINTS

### 1.1 handleResult Hook (Line 8830)
**Location:** `src/public/app.js:8830-8853`

**Trigger:** Called after URL inspection completes and data is fetched.

**What it does:**
```javascript
handleResult = async function(data) {
  currentData = data;  // Set currentData BEFORE applySmartOrderingSafe
  if (platformPrefs.smartOrdering) {
    applySmartOrderingSafe();  // Apply smart ordering BEFORE render
  }
  await originalHandleResult2(data);  // Then render
}
```

**Reset behavior:** 
- Calls `applySmartOrderingSafe()` which updates `platformPrefs.cardOrder`
- No explicit reset, but may clear stale cardOrder based on page type change

**Race condition protection:** 
- Sets `isApplyingSmartOrder = true` before DOM manipulation
- `renderPreviews()` checks this flag and queues if already applying

---

## 2. SMART ORDERING FUNCTIONS

### 2.1 applySmartOrdering() (Line 8624)
**Location:** `src/public/app.js:8624-8814`

**What it does:**
1. Detects page type from `currentData.meta` (article, product, website, etc.)
2. Gets preferred platform order for that page type
3. **Clears stale cardOrder entries** when page type changes (Line 8665-8690)
4. Updates `platformPrefs.cardOrder` with smart ordering (Line 8760)
5. Marks metadata as `modifiedBy: 'smart-ordering'` (Line 8763-8768)
6. Saves preferences via `savePlatformPrefs()` (Line 8801)

**Stale CardOrder Clear Logic (Line 8665-8690):**
```javascript
const previousPageType = currentPageType;
currentPageType = pageType;

if (previousPageType && previousPageType !== pageType) {
  // Page type changed - clear stale cardOrder
  PLATFORM_GROUPS.forEach((group) => {
    const metadata = platformPrefs.cardOrderMetadata?.[group.id];
    // ONLY clear if NOT user-modified via drag
    if (!metadata || !metadata.userModified || metadata.modifiedBy !== 'user-drag') {
      delete platformPrefs.cardOrder[group.id];
      delete platformPrefs.cardOrderMetadata[group.id];
    }
  });
}
```

**User-Modified Protection (Line 8738-8745):**
```javascript
const metadata = platformPrefs.cardOrderMetadata[group.id];
if (metadata && metadata.userModified && metadata.modifiedBy === 'user-drag') {
  return; // Skip smart ordering for user-dragged groups
}
```

**When called:**
- From `applySmartOrderingSafe()` (Line 8877)
- NOT called directly elsewhere (must use safe wrapper)

---

### 2.2 applySmartOrderingSafe() (Line 8859)
**Location:** `src/public/app.js:8859-8911`

**What it does:**
1. Thread-safe wrapper for `applySmartOrdering()`
2. Sets `isApplyingSmartOrder = true` guard flag (Line 8868)
3. Calls `applySmartOrdering()` (Line 8877)
4. Calls `reorderPlatformCards()` to reorder DOM (Line 8884)
5. Clears guard flag in `finally` block (Line 8893)
6. Processes any queued render after flag is cleared (Line 8902-8908)

**Race condition prevention:**
```javascript
if (isApplyingSmartOrder) {
  pendingApplySmartOrder = true;
  return;  // Queue instead of concurrent execution
}
```

**When called:**
- From `handleResult` hook (Line 8845)
- From `renderPreviewsSafe` when cardOrder missing (Line 1749)
- NOT called from UI event handlers (they use renderPreviewsSafe)

---

### 2.3 reorderPlatformCards() (Line 8567)
**Location:** `src/public/app.js:8567-8622`

**What it does:**
1. Reorders DOM elements to match `platformPrefs.cardOrder`
2. Uses `appendChild` to move existing card elements (Line 8607)
3. Updates animation delays for smooth staggered appearance (Line 8612-8620)

**Safeguard check (Line 8569):**
```javascript
if (!isApplyingSmartOrder && DEBUG_SMART_ORDERING) {
  console.warn('[reorderPlatformCards] WARNING: Called outside smart ordering operation');
}
```

**When called:**
- From `applySmartOrderingSafe()` (Line 8884)
- Should NOT be called elsewhere

---

## 3. CARDORDER RESET LOCATIONS

### 3.1 Page Type Change (Line 8665-8690)
**Location:** `src/public/app.js:8665-8690` (inside `applySmartOrdering`)

**What gets reset:**
- `platformPrefs.cardOrder[group.id]` - DELETED for non-user-modified groups
- `platformPrefs.cardOrderMetadata[group.id]` - DELETED for non-user-modified groups

**Protection:** User-dragged groups are preserved (Line 8676)

**Trigger:** Page type changes (e.g., article → product)

---

### 3.2 Stale Group Cleanup (Line 7758-7767)
**Location:** `src/public/app.js:7758-7767` (inside `cleanupStaleCardOrderEntries`)

**What gets reset:**
- `platformPrefs.cardOrder[groupId]` - DELETED for non-existent groups
- `platformPrefs.cardOrderMetadata[groupId]` - DELETED for non-existent groups

**When called:**
- After loading preferences (Line 7734)

**Purpose:** Prevents orphaned cardOrder entries for deleted groups

---

### 3.3 Initialization (Line 8728-8733)
**Location:** `src/public/app.js:8728-8733` (inside `applySmartOrdering`)

**What happens:**
```javascript
if (!platformPrefs.cardOrder) {
  platformPrefs.cardOrder = {};
}
if (!platformPrefs.cardOrderMetadata) {
  platformPrefs.cardOrderMetadata = {};
}
```

**Not a reset** - just ensures objects exist before use

---

## 4. UI EVENT HANDLERS (Triggers, Not Resets)

### 4.1 Drag and Drop (Line 9430-9517)
**Location:** `src/public/app.js:9430-9517` (inside `handleDrop`)

**What it does:**
- Updates `platformPrefs.cardOrder[fromGroup]` and `platformPrefs.cardOrder[toGroup]` (Line 8483, 8492, 8498)
- Sets metadata: `userModified: true`, `modifiedBy: 'user-drag'` (Line 8484-8503)
- Calls `savePlatformPrefs()` (Line 9510)
- Calls `renderPreviews(currentData)` (Line 9513) - NOT renderPreviewsSafe

**Race condition protection (Line 9436-9445):**
```javascript
if (isApplyingSmartOrder) {
  console.warn('[handleDrop] Smart ordering in progress - rejecting drop');
  return false;  // Reject drop during smart ordering
}
```

**Events:**
- `dragstart` (Line 9397)
- `dragend` (Line 9405)
- `drop` (Line 9430) - main handler

**Does NOT reset smart ordering** - modifies cardOrder instead

---

### 4.2 Toggle Hidden (Line 7888-7897)
**Location:** `src/public/app.js:7888-7897`

**What it does:**
```javascript
function toggleHidden(pid) {
  platformPrefs.hidden.add(pid);  // or delete
  savePlatformPrefs();
  updateHiddenList();
  renderPreviewsSafe(currentData, 'toggle-hidden');  // Re-render
}
```

**Does NOT reset cardOrder** - uses renderPreviewsSafe which preserves it

---

### 4.3 Toggle Favorite (Line 7878-7886)
**Location:** `src/public/appista/src/public/app.js:7878-7886`

**What it does:**
```javascript
function toggleFavorite(pid) {
  platformPrefs.favorites.add(pid);  // or delete
  savePlatformPrefs();
  updateFavoritesList();
  // NO render call - doesn't affect card order
}
```

**Does NOT trigger render** - just updates favorites list

---

### 4.4 What If Mode (Line 8123-8160)
**Location:** `src/public/app.js:8123-8160` (inside `applyWhatIfChanges`)

**What it does:**
- Creates modified metadata with disabled tags removed
- Calls `renderPreviewsSafe(modifiedData, 'applyWhatIfChanges')` (Line 8145)

**Does NOT reset cardOrder** - uses renderPreviewsSafe which preserves it

**Toggle What If Off (Line 8021-8044):**
```javascript
function toggleWhatIfMode() {
  if (!whatIfMode) {
    disabledTags.clear();
    // ...
    renderPreviewsSafe(currentData, 'toggle-what-if-off');
  }
}
```

---

### 4.5 Reset Editor (Line 6785-6796)
**Location:** `src/public/app.js:6785-6796`

**What it does:**
```javascript
function resetEditor() {
  // Clears editor state
  fixedDiagnostics.clear();
  // ...
  renderPreviewsSafe(currentData, 'resetEditor');
}
```

**Does NOT reset cardOrder** - uses renderPreviewsSafe

---

### 4.6 Recalculate Score (Line 8452-8477)
**Location:** `src/public/app.js:8452-8477`

**What it does:**
```javascript
function recalculateScore() {
  const applied = applyRescore();
  if (applied) {
    renderPreviewsSafe(applied.data, 'recalculateScore');
    renderSummaryBar(applied.data);
  }
}
```

**Does NOT reset cardOrder** - uses renderPreviewsSafe

---

### 4.7 Import Preferences (Line 7976-8015)
**Location:** `src/public/app.js:7976-8015`

**What it does:**
```javascript
function importPreferences(file) {
  const parsed = JSON.parse(content);
  platformPrefs.cardOrder = parsed.cardOrder || {};
  platformPrefs.cardOrderMetadata = parsed.cardOrderMetadata || preservedCardOrderMetadata;
  savePlatformPrefs();
  // ...
  renderPreviewsSafe(currentData, 'import-preferences');
}
```

**CAN reset cardOrder** - if imported file contains different cardOrder

---

### 4.8 Theme Toggle (Line 113)
**Location:** `src/public/app.js:113`

**What it does:**
```javascript
renderPreviewsSafe(currentData, 'theme-toggle');
```

**Does NOT reset cardOrder** - uses renderPreviewsSafe

---

### 4.9 Reset to Hero (Line 4911-4918)
**Location:** `src/public/app.js:4911-4918`

**What it does:**
```javascript
function resetToHero() {
  resultsSection.classList.add('hidden');
  currentData = null;
  history.pushState({}, '', '/');
  // NO render call
}
```

**Does NOT reset cardOrder** - just clears currentData

---

## 5. RENDER FUNCTIONS

### 5.1 renderPreviews() (Line 1583)
**Location:** `src/public/app.js:1583-1722`

**What it does:**
- Renders platform cards with ordering based on `platformPrefs.cardOrder`
- Checks `isApplyingSmartOrder` flag and queues if true (Line 1597-1603)
- Uses `cardOrder` for custom order if available (Line 1641-1687)

**CardOrder logic (Line 1641-1687):**
```javascript
if (platformPrefs.cardOrder[group.id] && !isApplyingSmartOrder) {
  // Use custom order from cardOrder
  const cardOrderForGroup = platformPrefs.cardOrder[group.id];
  // Merge cardOrder with current group platforms
  // Preserves order for platforms in cardOrder
  // Appends missing platforms to end
}
```

**When called:**
- From `handleDrop` (Line 9513) - after drag reorder
- From `applySmartOrderingSafe` queued render (Line 8908)
- From other direct calls (avoid these - use renderPreviewsSafe)

---

### 5.2 renderPreviewsSafe() (Line 1735)
**Location:** `src/public/app.js:1735-1755`

**What it does:**
- Safe wrapper for renderPreviews
- Ensures cardOrder exists before rendering (Line 1744-1749)
- Calls `applySmartOrderingSafe()` if cardOrder missing (Line 1749)
- Calls `renderPreviews(data)` (Line 1753)

**CardOrder recovery (Line 1744-1749):**
```javascript
if (platformPrefs.smartOrdering && !platformPrefs.cardOrder) {
  console.warn('Smart ordering enabled but cardOrder missing - re-applying smart order');
  applySmartOrderingSafe();
}
```

**When called:**
- From theme toggle (Line 113)
- From toggleHidden (Line 7896)
- From importPreferences (Line 8005)
- From toggleWhatIfMode (Line 8041)
- From applyWhatIfChanges (Line 8145)
- From resetEditor (Line 6795)
- From recalculateScore (Line 8460)
- From updatePreviewsWithEdits (Line 6768)

**Purpose:** Prevents accidental order resets during UI operations

---

## 6. DATA FLOW MAP

### Initial Load Flow
```
1. Page loads
   └─> loadPlatformPrefs() (Line 7717)
       ├─> Parse cardOrder from localStorage
       └─> cleanupStaleCardOrderEntries() (Line 7734)
           └─> Delete cardOrder for non-existent groups

2. User inspects URL
   └─> inspectUrl()
       └─> API fetch
           └─> handleResult(data) (Line 8830)
               ├─> currentData = data
               ├─> applySmartOrderingSafe() (Line 8845)
               │   ├─> isApplyingSmartOrder = true
               │   ├─> applySmartOrdering() (Line 8877)
               │   │   ├─> Detect page type
               │   │   ├─> Clear stale cardOrder (if page type changed)
               │   │   ├─> Update platformPrefs.cardOrder
               │   │   └─> savePlatformPrefs()
               │   ├─> reorderPlatformCards() (Line 8884)
               │   │   └─> Reorder DOM to match cardOrder
               │   ├─> isApplyingSmartOrder = false (Line 8893)
               │   └─> Process queued render (Line 8908)
               └─> originalHandleResult2(data)
                   └─> renderPreviews(data)
```

### User Drag Reorder Flow
```
1. User drags card A and drops on card B
   └─> handleDrop() (Line 9430)
       ├─> Check: isApplyingSmartOrder? (Line 9436)
       │   └─> If true: Reject drop to prevent race
       ├─> Build new order arrays
       ├─> Update platformPrefs.cardOrder[fromGroup] (Line 8483, 8492, 8498)
       ├─> Update platformPrefs.cardOrderMetadata (Line 8484-8503)
       │   └─> userModified: true, modifiedBy: 'user-drag'
       ├─> savePlatformPrefs() (Line 9510)
       └─> renderPreviews(currentData) (Line 9513)
           └─> Renders with new cardOrder
```

### UI Event Flow (Non-Resetting)
```
1. User toggles hidden platform
   └─> toggleHidden(pid) (Line 7888)
       ├─> platformPrefs.hidden.add(pid)
       ├─> savePlatformPrefs()
       └─> renderPreviewsSafe(currentData, 'toggle-hidden')
           └─> Preserves cardOrder (no reset)

2. User applies What If changes
   └─> applyWhatIfChanges() (Line 8123)
       ├─> Create modifiedData
       └─> renderPreviewsSafe(modifiedData, 'applyWhatIfChanges')
           └─> Preserves cardOrder (no reset)

3. User recalculates score
   └─> recalculateScore() (Line 8452)
       ├─> applyRescore()
       └─> renderPreviewsSafe(applied.data, 'recalculateScore')
           └─> Preserves cardOrder (no reset)
```

### Page Type Change Flow
```
1. User inspects different type of page (e.g., article → product)
   └─> handleResult(data)
       └─> applySmartOrdering()
           ├─> previousPageType = 'article'
           ├─> currentPageType = 'product'
           ├─> Page type changed!
           └─> Clear cardOrder for non-user-dragged groups (Line 8677)
               ├─> delete platformPrefs.cardOrder[group.id]
               └─> delete platformPrefs.cardOrderMetadata[group.id]
           └─> Recompute smart order for new page type
           └─> Update platformPrefs.cardOrder with new order
```

---

## 7. ALL RESET POINTS SUMMARY

| Location | Type | What Gets Reset | When | Protection |
|----------|------|-----------------|------|------------|
| Line 8665-8690 | Smart ordering | `cardOrder[group.id]`, `cardOrderMetadata[group.id]` | Page type changes | User-dragged groups preserved |
| Line 7758-7767 | Cleanup | `cardOrder[groupId]`, `cardOrderMetadata[groupId]` | After loading prefs | Only non-existent groups |
| Line 7976-8015 | Import | `cardOrder`, `cardOrderMetadata` | User imports prefs | Can preserve if not in import |
| Line 4911-4918 | Hero reset | `currentData = null` | User clicks "New Inspection" | Doesn't touch cardOrder |

---

## 8. CODE PATHS THAT MODIFY CARD ORDER

| Path | Entry Point | Function | Modifies cardOrder? | User action? |
|------|-------------|----------|---------------------|-------------|
| **Smart Ordering** | handleResult (8830) | applySmartOrdering (8624) | ✅ Yes | No (automatic) |
| **Drag Reorder** | handleDrop (9430) | handleDrop (9430) | ✅ Yes | Yes (manual) |
| **Import Prefs** | importPreferences (7976) | importPreferences (7976) | ✅ Yes | Yes (manual) |
| **Stale Cleanup** | loadPlatformPrefs (7717) | cleanupStaleCardOrderEntries (7758) | ✅ Yes | No (maintenance) |

---

## 9. GUARD FLAGS AND RACE CONDITION PREVENTION

### isApplyingSmartOrder (Line 6287)
**Purpose:** Prevents concurrent smart ordering operations

**Set to true:**
- Line 8868: applySmartOrderingSafe() starts

**Set to false:**
- Line 8893: applySmartOrderingSafe() finally block

**Checked in:**
- Line 9436: handleDrop() - rejects drop during smart ordering
- Line 1547, 1641, 1823: render functions - skips cardOrder during apply
- Line 8861: applySmartOrderingSafe() - queues if already applying
- Line 1597: renderPreviews() - queues render if applying

### pendingApplySmartOrder (Line 6289)
**Purpose:** Queues pending smart ordering operations

**Set to true:**
- Line 8863: applySmartOrderingSafe() when already applying

**Set to false:**
- Line 8869: applySmartOrderingSafe() when starting

**Processed:**
- Line 8887-8889: Queued operation processed via setTimeout

### pendingRenderData (Line 6289)
**Purpose:** Queues renders during smart ordering

**Set:**
- Line 1599-1604: renderPreviews() when isApplyingSmartOrder is true

**Cleared:**
- Line 8907: applySmartOrderingSafe() before rendering

**Processed:**
- Line 8902-8908: applySmartOrderingSafe() after flag cleared

### currentPageType (Line 6292)
**Purpose:** Tracks page type for stale cardOrder detection

**Updated:**
- Line 8667: applySmartOrdering() after detecting new page type

**Compared:**
- Line 8669: applySmartOrdering() to detect changes

---

## 10. ACCEPTANCE CRITERIA STATUS

### ✅ Document all locations where smart ordering is applied/reset
**Status:** COMPLETE

All locations documented:
1. applySmartOrdering() - Line 8624-8814
2. applySmartOrderingSafe() - Line 8859-8911
3. Page type change reset - Line 8665-8690
4. Stale group cleanup - Line 7758-7767
5. Import preferences - Line 7976-8015

### ✅ Identify which UI events trigger order resets
**Status:** COMPLETE

UI events documented:
1. **Drag and drop** - handleDrop (Line 9430) - MODIFIES cardOrder, doesn't reset
2. **Toggle hidden** - toggleHidden (Line 7888) - NO reset
3. **What If mode** - applyWhatIfChanges (Line 8123) - NO reset
4. **Reset editor** - resetEditor (Line 6785) - NO reset
5. **Recalculate score** - recalculateScore (Line 8452) - NO reset
6. **Import preferences** - importPreferences (Line 7976) - CAN reset cardOrder
7. **Theme toggle** - Line 113 - NO reset
8. **Reset to hero** - resetToHero (Line 4911) - NO reset

### ✅ Create a map of the smart ordering state lifecycle
**Status:** COMPLETE

Data flow maps created:
1. Initial Load Flow
2. User Drag Reorder Flow
3. UI Event Flow
4. Page Type Change Flow

### ✅ List all code paths that modify card order
**Status:** COMPLETE

All modifying paths documented:
1. Smart Ordering (automatic)
2. Drag Reorder (manual)
3. Import Prefs (manual)
4. Stale Cleanup (maintenance)

---

## 11. KEY FINDINGS

### Finding 1: UI Events Do NOT Reset Smart Ordering
All UI event handlers use `renderPreviewsSafe()` which preserves `cardOrder`. The only operations that modify `cardOrder` are:
1. Smart ordering (automatic, based on page type)
2. User drag reordering (manual, intentional)
3. Preference import (manual, user-initiated)

### Finding 2: Page Type Change Clears Stale CardOrder
When page type changes (e.g., article → product), `applySmartOrdering()` clears `cardOrder` for groups that weren't manually reordered by the user. This prevents stale smart-ordered platforms from persisting across page type changes.

### Finding 3: User-Dragged Groups Are Protected
Groups that the user manually reordered via drag are marked with `modifiedBy: 'user-drag'` and are preserved during page type changes. This respects user intent over automatic smart ordering.

### Finding 4: Race Condition Protection via Guard Flags
The `isApplyingSmartOrder` flag prevents concurrent execution of smart ordering and drag-drop operations. Drag drops are rejected during smart ordering, and renders are queued until smart ordering completes.

### Finding 5: renderPreviewsSafe Prevents Accidental Resets
UI event handlers use `renderPreviewsSafe()` which ensures `cardOrder` exists before rendering. If missing, it reapplies smart ordering instead of resetting to default order.

---

## 12. RECOMMENDATIONS

### Recommendation 1: No Changes Needed
The current implementation is robust. UI events properly preserve cardOrder via `renderPreviewsSafe()`, and race conditions are prevented by guard flags.

### Recommendation 2: Document renderPreviewsSafe Usage
Ensure all future UI event handlers use `renderPreviewsSafe()` instead of calling `renderPreviews()` directly to maintain cardOrder preservation.

### Recommendation 3: Consider Adding Unit Tests
The race condition protection logic (guard flags) and stale cardOrder clearing logic would benefit from unit tests to prevent regressions.

---

## APPENDIX: File Locations

| Function | Line Range | File |
|----------|-----------|------|
| handleResult | 8830-8853 | src/public/app.js |
| applySmartOrdering | 8624-8814 | src/public/app.js |
| applySmartOrderingSafe | 8859-8911 | src/public/app.js |
| reorderPlatformCards | 8567-8622 | src/public/app.js |
| renderPreviews | 1583-1722 | src/public/app.js |
| renderPreviewsSafe | 1735-1755 | src/public/app.js |
| handleDrop | 9430-9517 | src/public/app.js |
| toggleHidden | 7888-7897 | src/public/app.js |
| toggleFavorite | 7878-7886 | src/public/app.js |
| applyWhatIfChanges | 8123-8160 | src/public/app.js |
| resetEditor | 6785-6796 | src/public/app.js |
| recalculateScore | 8452-8477 | src/public/app.js |
| importPreferences | 7976-8015 | src/public/app.js |
| resetToHero | 4911-4918 | src/public/app.js |
| loadPlatformPrefs | 7717-7772 | src/public/app.js |
| savePlatformPrefs | 7774-7860 | src/public/app.js |
| cleanupStaleCardOrderEntries | 7750-7772 | src/public/app.js |

---

**End of Audit**
