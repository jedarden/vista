# Filter Change Handlers Catalog - app.js

## Overview
This document catalogs all filter change event listeners in `src/public/app.js` that interact with the order-reset logic via the `isFilterOperation` guard flag.

---

## Guard Flag System

### isFilterOperation
- **Line:** 6279
- **Purpose:** Prevents smart order resets during filter operations
- **Global window property:** Lines 5046-5048 (exposes as `window.isFilterOperation`)

### How the Guard Works
When set to `true`, the guard prevents `applySmartOrdering()` from clearing `cardOrder` during page type changes (lines 8815-8820).

**Pattern used in all filter handlers:**
```javascript
isFilterOperation = true;
renderPreviews(currentData); // or modifiedData
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

## Filter Change Handlers That Reset Order

### 1. toggleHidden(pid)
**Lines:** 7984-8017  
**Trigger:** User clicks visibility toggle button on a platform card  
**Event Listener:** Line 8055 `btn.addEventListener('click', () => toggleHidden(btn.dataset.pid))`  
**Order Reset Logic:**
- Lines 8003-8006: Sets `isFilterOperation = true`, calls `renderPreviews(currentData)`, clears flag after render
- Also clears `isSmartOrderingActive = false` (user manual override)
- **Direct call:** Line 9822 (from context menu)

### 2. importPreferences(e)
**Lines:** 8082-8132  
**Trigger:** User imports preferences via file input  
**Event Listener:** Line 6831 `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)`  
**Order Reset Logic:**
- Lines 8105-8107 (or 8121-8124): Sets `isFilterOperation = true`, calls `renderPreviews(currentData)`, clears flag
- Has smart ordering check - queues operation via `queueFilterOperation` if smart ordering active (lines 8113-8115)
- Also clears `isSmartOrderingActive = false` (user manual override)

### 3. toggleWhatIfMode()
**Lines:** 8146-8187  
**Trigger:** User clicks "What If" toggle button  
**Event Listener:** Line 8359 `document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode)`  
**Order Reset Logic:**
- Lines 8169-8171 (or 8181-8184): Sets `isFilterOperation = true`, calls `renderPreviews(currentData)`, clears flag
- Has smart ordering check - queues operation via `queueFilterOperation` if active (lines 8173-8175)
- **Purpose:** Enters/exits What If mode for previewing tag fallback behavior

### 4. applyWhatIfChanges()
**Lines:** ~8230-8305 (function body)  
**Trigger:** User clicks "Apply" button in What If panel after toggling tags  
**Event Listener:** Line 8245 `document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges)`  
**Order Reset Logic:**
- Lines 8288-8290: Sets `isFilterOperation = true`, calls `renderPreviews(modifiedData)`, clears flag
- **Purpose:** Re-renders previews with specific tags disabled to show fallback behavior
- Creates `modifiedData` with disabled tags removed from metadata

### 5. toggleFavorite(pid)
**Lines:** 7867-7890  
**Trigger:** User clicks favorite star on a platform card  
**Event Listener:** Line 8033 `btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid))`  
**Order Reset Logic:**
- Does NOT use `isFilterOperation` guard
- Does NOT call `renderPreviews()` directly
- Only updates favorites list and saves preferences
- **Does NOT trigger order reset** (favorites are display-only, not a filter)

---

## Filter Change Handlers That Do NOT Reset Order

### 6. Metadata Filter Input
**Lines:** 3991-3993  
**Trigger:** User types in metadata filter input  
**Event Listener:** Line 3991 `filterInput.addEventListener('input', (e) => renderMetadataTable(e.target.value))`  
**Order Reset Logic:**
- Calls `renderMetadataTable()` - NOT `renderPreviews()`
- Filters metadata table rows only - no card order impact
- **Does NOT trigger order reset**

### 7. Heatmap Sort Dropdown
**Lines:** 6101-6123 (handleHeatmapSort function)  
**Trigger:** User changes sort order in sitemap heatmap  
**Event Listener:** Line 332 `heatmapSort?.addEventListener('change', handleHeatmapSort)`  
**Order Reset Logic:**
- Calls `renderHeatmapTable(sorted)` - NOT `renderPreviews()`
- Sorts sitemap results only - no card order impact
- **Does NOT trigger order reset**

### 8. Cropper Platform/Group Toggles
**Lines:** 3481-3516  
**Triggers:** 
- Group header toggle (line 3481)
- Individual platform toggle (line 3497)
- Select All / Clear All buttons (lines 3504, 3511)

**Order Reset Logic:**
- Call `updateEnabledPlatforms()` and `updateCropperOverlay()`
- Cropper-specific - affects which platform overlays are shown
- **Does NOT trigger order reset** (cropper is separate from preview cards)

### 9. Badge Style Select
**Lines:** 4765-4788 (updateBadgePreview function)  
**Trigger:** User changes badge style  
**Event Listener:** Line 296 `badgeStyleSelect?.addEventListener('change', updateBadgePreview)`  
**Order Reset Logic:**
- Updates badge preview in modal
- **Does NOT trigger order reset**

### 10. OG Generator Controls
**Lines:** Multiple (310-326)  
**Triggers:** Various OG generator setting changes  
**Event Listeners:** Background type, colors, font, logo, etc.  
**Order Reset Logic:**
- Call `updateOggenCanvas()` or specific handlers
- OG generator only - no card order impact
- **Does NOT trigger order reset**

---

## Order Reset Protection Logic

### Where Guard is Checked
**Lines:** 8815-8820 (in `applySmartOrdering()` function)

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
  return;
}
```

### What Gets Protected
- **`cardOrder`** object (line 6268): Maps groupId → array of platform IDs in custom order
- **`cardOrderMetadata`** object (line 6269): Tracks user modifications, timestamps, etc.
- Without the guard, page type changes would clear these, losing user's custom order

### Smart Ordering Queue System
**Lines:** 7949-7982 (queueFilterOperation function)

When smart ordering is active, filter operations are queued and executed after smart ordering completes:
- **toggleFavorite** - queued (line 7870)
- **toggleHidden** - queued (line 7987)
- **importPreferences** - queued (line 8113)
- **toggleWhatIfMode** - queued (line 8173)

---

## Summary

### Handlers that USE order-reset guard (4 total):
1. **toggleHidden** - visibility toggles
2. **importPreferences** - preference import
3. **toggleWhatIfMode** - What If mode toggle
4. **applyWhatIfChanges** - What If tag changes

### Handlers that DO NOT use order-reset guard (6+):
1. **toggleFavorite** - favorites only
2. **Metadata filter** - table filtering only
3. **Heatmap sort** - sitemap sorting only
4. **Cropper toggles** - overlay visibility only
5. **Badge/OG controls** - separate features

### Key Pattern
All order-reset-protected handlers follow the same three-step pattern:
1. Set `isFilterOperation = true`
2. Call `renderPreviews()` with data
3. Clear flag with `setTimeout(() => { isFilterOperation = false; }, 0)`

This ensures the guard is active during the render call but cleared immediately after, preventing interference with subsequent operations.
