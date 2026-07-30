# Vista Filter Change Handlers - Comprehensive Catalog

**Bead ID:** bf-5r0g0  
**Date:** 2026-07-24  
**Scope:** All locations where filter changes trigger order resets in the vista codebase

## Overview

The Vista codebase uses a sophisticated system of guard flags and protection mechanisms to prevent unwanted order resets during filter operations. This document catalogues all filter change handlers and order reset locations.

## Guard Flags

| Variable | Line | Purpose |
|-----------|------|---------|
| `isFilterOperation` | 6260 | Prevents smart order resets during filter changes |
| `isSmartOrderingActive` | 6261 | Tracks when smart ordering is currently active |
| `isApplyingSmartOrder` | 6254 | Prevents concurrent smart ordering operations |
| `pendingFilterOperations` | 6262 | Queue for filter operations during smart ordering |

---

## FILTER CHANGE HANDLERS

### 1. Platform Hide/Show Filter

**File:** `src/public/app.js`  
**Function:** `toggleHidden(pid)` (Line 7914)  
**Filter Type:** Platform visibility filter

**Event Handlers:**
- Context menu action: "Hide this platform"/"Show this platform" (Line 7909)
- Hidden platforms list remove button (Line 7976)

**Reset Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData); // Re-render to apply hiding
setTimeout(() => { isFilterOperation = false; }, 0);
isSmartOrderingActive = false; // Clear smart ordering active flag
```

**Code Location:** Lines 7914-7934

---

### 2. Platform Favorites Filter

**File:** `src/public/app.js`  
**Function:** `toggleFavorite(pid)` (Line 7848)  
**Filter Type:** Platform favorites filter

**Event Handler:**
- Context menu action: "Star / unstar" (Line 9712)

**Reset Pattern:**
```javascript
isSmartOrderingActive = false; // Clear smart ordering active flag (user manual override)
```

**Code Location:** Lines 7848-7862

---

### 3. Import Preferences

**File:** `src/public/app.js`  
**Function:** `importPreferences(e)` (Line 8003)  
**Filter Type:** Bulk preference import (favorites, hidden platforms, etc.)

**Event Handler:**
- File input change listener (Line 6812)

**Reset Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
isSmartOrderingActive = false; // Clear smart ordering active flag (user manual override)
```

**Code Location:** Lines 8003-8042

---

### 4. What-If Mode Filter

**File:** `src/public/app.js`  
**Functions:** 
- `toggleWhatIfMode()` (Line 8048)
- `applyWhatIfChanges()` (Line 8154)
- `applyPendingWhatIfTags()` (Line 8199)

**Filter Type:** Meta tag filtering for "What If" scenarios

**Event Handlers:**
- What-If toggle button (Line 8048)
- What-If panel apply button (Line 8133)
- What-If panel tag checkboxes (Line 8120)

**Reset Pattern (toggleWhatIfMode when disabling):**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Reset Pattern (applyWhatIfChanges):**
```javascript
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Code Location:** Lines 8048-8199

---

### 5. Metadata Table Filter (No Order Impact)

**File:** `src/public/app.js`  
**Function:** `renderMetadataTable(filterValue)` (Line 3988)  
**Filter Type:** Metadata table search filter

**Event Handler:**
- Metadata filter input listener (Line 3991)

**Note:** This filter only affects the metadata table display and does NOT trigger any order resets.

**Code Location:** Lines 3988-3995

---

### 6. Command Palette Filter (No Order Impact)

**File:** `src/public/app.js`  
**Function:** `filterCommands(e)` (Line 9090)  
**Filter Type:** Command palette search filter

**Event Handler:**
- Command input event listener (Line 8998)

**Note:** This filter only affects the command palette and does NOT trigger any order resets.

**Code Location:** Lines 9090-9105

---

## ORDER RESET LOCATIONS

### 1. Smart Ordering Page Type Change Reset

**File:** `src/public/app.js`  
**Function:** `applySmartOrdering()` (Line 8657)  
**Location:** Lines 8702-8732  
**Trigger:** Page type change detected

**Reset Logic:**
```javascript
if (previousPageType && previousPageType !== pageType) {
  if (isFilterOperation || isSmartOrderingActive) {
    // Preserve cardOrder to prevent reset
  } else {
    // Clear cardOrder for groups that weren't manually modified by user
    PLATFORM_GROUPS.forEach((group) => {
      const metadata = platformPrefs.cardOrderMetadata?.[group.id];
      if (!metadata || !metadata.userModified || metadata.modifiedBy !== 'user-drag') {
        delete platformPrefs.cardOrder[group.id];
        delete platformPrefs.cardOrderMetadata[group.id];
      }
    });
  }
}
```

**Protection:** The `isFilterOperation` guard prevents this reset during filter operations.

---

### 2. Cleanup Stale Card Order Entries

**File:** `src/public/app.js`  
**Function:** `cleanupStaleCardOrderEntries()` (Line 7722)  
**Location:** Lines 7722-7742  
**Trigger:** Called during `loadPlatformPrefs()` (Line 7705)

**Reset Logic:**
```javascript
for (const groupId in platformPrefs.cardOrder) {
  if (!validGroupIds.has(groupId)) {
    delete platformPrefs.cardOrder[groupId];
    delete platformPrefs.cardOrderMetadata[groupId];
  }
}
```

**Purpose:** Removes stale platform group entries that no longer exist in `PLATFORM_GROUPS`.

---

### 3. Manual Drag-Drop Reordering

**File:** `src/public/app.js`  
**Function:** `handleDrop(e)` (Line 9478)  
**Location:** Lines 9537-9563  
**Trigger:** User drag-and-drop card reordering

**Reset Logic:**
```javascript
platformPrefs.cardOrder[fromGroup] = newToOrder;
platformPrefs.cardOrderMetadata[fromGroup] = {
  userModified: true,
  lastModified: now,
  modifiedBy: 'user-drag'
};
isSmartOrderingActive = false; // Clear smart ordering active flag (user manual override)
```

**Purpose:** User manually reorders cards, which overrides smart ordering.

---

## HELPER FUNCTIONS

### Filter Operation Guard Functions

**File:** `src/public/app.js`  
**Location:** Lines 7864-7909

#### `shouldDeferFilterOperation()` (Line 7870)
Checks if filter operation should be deferred due to active smart ordering.

#### `queueFilterOperation()` (Line 7879)
Queues a filter operation to be processed after smart ordering completes.

#### `processPendingFilterOperations()` (Line 7889)
Processes pending filter operations after smart ordering completes.

---

## ORDER MANAGEMENT FUNCTIONS

### `applySmartOrdering()` (Line 8657)
Main function that applies smart ordering based on page type.

### `applySmartOrderingSafe()` (Line 8901)
Thread-safe version that prevents concurrent execution using guard flags.

### `reorderPlatformCards()` (Line 8598)
Reorders DOM elements to match the new smart order (called after `applySmartOrdering()`).

---

## SUMMARY

The Vista codebase implements a robust system to prevent unwanted order resets during filter operations:

1. **Guard Flags**: Three main flags (`isFilterOperation`, `isSmartOrderingActive`, `isApplyingSmartOrder`) work together to protect against race conditions.

2. **Filter Handlers with Order Impact**: Four main filter operations (`toggleHidden`, `toggleFavorite`, `importPreferences`, `toggleWhatIfMode`) use guard flags to preserve order during rendering.

3. **Order Reset Triggers**: Three primary reset locations (`applySmartOrdering` page type changes, `cleanupStaleCardOrderEntries`, and manual drag-drop) each have specific protection mechanisms.

4. **Non-Order Filters**: Two filter operations (metadata table filter and command palette filter) do not affect card ordering at all.

The key pattern is that all filter operations that could affect card visibility or ordering use the `isFilterOperation = true` guard flag before calling `renderPreviews()`, which prevents concurrent smart ordering operations from clearing the card order.
