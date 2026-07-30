# Filter Change Handlers Catalog - vista/app.js

**Bead:** bf-3llbx  
**Date:** 2026-07-24  
**Purpose:** Comprehensive catalog of all filter change handlers and their order-reset behavior

---

## Overview

This document catalogs all filter change event listeners in `/home/coding/vista/src/public/app.js` that interact with the order-reset logic via the `isFilterOperation` guard flag. The catalog includes line numbers, order-reset logic, filter triggers, and implementation patterns.

---

## Guard Flag System

### isFilterOperation
- **Declaration:** Line 6279
- **Purpose:** Prevents smart order resets during filter operations
- **Global exposure:** Lines 5046-5048 (as `window.isFilterOperation`)

**Guard check location:** Lines 8817-8822 in `applySmartOrdering()` function

```javascript
if (isFilterOperation || isSmartOrdering()) {
  const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
  console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  return;
}
```

**Standard guard pattern used across all filter handlers:**
```javascript
isFilterOperation = true;
renderPreviews(currentData); // or modifiedData
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

## Filter Change Handlers That Reset Order

### 1. toggleHidden(pid)
**Lines:** 7984-8013  
**Function:** Toggles platform visibility (hide/show)  
**Trigger:** User clicks visibility toggle button on a platform card  
**Event Listener Registration:** Line 8055
```javascript
btn.addEventListener('click', () => toggleHidden(btn.dataset.pid))
```

**Order-Reset Logic:**
- **Guard set:** Lines 8002-8006
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
- **Smart ordering check:** Lines 7986-7992 (queues if active)
- **User override:** Line 8009 (clears `isSmartOrderingActive` flag)

**Filter Changes:** Adding/removing platform from `platformPrefs.hidden` Set  
**Conditional Branches:** Defers operation if smart ordering is active  
**Side Effects:** Saves platform preferences, updates hidden list UI

---

### 2. importPreferences(e)
**Lines:** 8082-8140  
**Function:** Imports user preferences from JSON file  
**Trigger:** User selects file via import preferences input  
**Event Listener Registration:** Line 6831
```javascript
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)
```

**Order-Reset Logic:**
- **Guard set:** Lines 8121-8124
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
- **Smart ordering active path:** Lines 8102-8118 (queued operation)
- **User override:** Line 8127 (clears `isSmartOrderingActive` flag)

**Filter Changes:** Imports favorites, hidden platforms, column count, and smart ordering preference  
**Conditional Branches:** Queues operation if smart ordering active  
**Side Effects:** Updates platform preferences, clears smart ordering active flag

---

### 3. toggleWhatIfMode()
**Lines:** 8146-8187  
**Function:** Toggles "What If" mode for simulating missing metadata tags  
**Trigger:** User clicks "What If" toggle button  
**Event Listener Registration:** Line 8359
```javascript
document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode)
```

**Order-Reset Logic:**
- **Guard set:** Lines 8181-8184
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
- **Smart ordering active path:** Lines 8167-8178 (queued operation)

**Filter Changes:** Clears `disabledTags` Set and updates URL hash  
**Conditional Branches:** Queues operation if smart ordering active  
**Side Effects:** Clears disabled tags, removes What If panel UI, updates URL hash

---

### 4. applyWhatIfChanges()
**Lines:** 8254-8305  
**Function:** Applies What If mode changes (disables selected metadata tags)  
**Trigger:** User clicks "Apply" button in What If panel  
**Event Listener Registration:** Line 8245
```javascript
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges)
```

**Order-Reset Logic:**
- **Guard set:** Lines 8288-8290
```javascript
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Filter Changes:** Disables specific metadata tags in `disabledTags` Set  
**Conditional Branches:** None (always applies guard flag)  
**Side Effects:** Modifies `currentData.meta` to simulate missing tags, updates URL hash, closes What If panel

---

## Filter Change Handlers That Do NOT Reset Order

### 5. toggleFavorite(pid)
**Lines:** 7867-7890  
**Function:** Toggles platform favorite status  
**Trigger:** User clicks favorite star on a platform card  
**Event Listener Registration:** Line 8033
```javascript
btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid))
```

**Order-Reset Logic:** ❌ NO - Does NOT set guard flag  
**Reason:** Does NOT trigger `renderPreviews()` - only updates favorites Set and UI

**Specific Code (Lines 7877-7883):**
```javascript
if (platformPrefs.favorites.has(pid)) {
  platformPrefs.favorites.delete(pid);
} else {
  platformPrefs.favorites.add(pid);
}
savePlatformPrefs();
updateFavoritesList();
```

**Filter Changes:** Adding/removing platform from `platformPrefs.favorites` Set  
**Conditional Branches:** Lines 7869-7875 (defers if smart ordering active)  
**Side Effects:** Saves platform preferences, updates favorites list UI

---

### 6. Metadata Filter Input
**Lines:** 3991-3993  
**Function:** Filters metadata tags table  
**Trigger:** User types in metadata filter input  
**Event Listener Registration:** Line 3991
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

**Order-Reset Logic:** ❌ NO - Calls `renderMetadataTable()`, NOT `renderPreviews()`  
**Reason:** Filters metadata table rows only - no card order impact

**Handler Function:** `renderMetadataTable(filter = '')` - Line 3941

---

### 7. Command Palette Filter
**Lines:** 9110  
**Function:** Filters command palette options  
**Trigger:** User types in command palette search input  
**Event Listener Registration:** Line 9110
```javascript
input.addEventListener('input', filterCommands);
```

**Order-Reset Logic:** ❌ NO - Separate feature, no card impact  
**Handler Function:** `filterCommands(e)` - Line 9202

---

### 8. Heatmap Sort Dropdown
**Lines:** 6101-6123  
**Function:** Sorts sitemap heatmap results  
**Trigger:** User changes sort order in sitemap heatmap  
**Event Listener Registration:** Line 332
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort)
```

**Order-Reset Logic:** ❌ NO - Calls `renderHeatmapTable()`, NOT `renderPreviews()`  
**Reason:** Sorts sitemap results only - no card order impact

---

### 9. Cropper Platform/Group Toggles
**Lines:** 3481-3516  
**Functions:** Updates which platform overlays are visible in cropper  
**Triggers:** 
- Group header toggle (line 3481)
- Individual platform toggle (line 3497)
- Select All / Clear All buttons (lines 3504, 3511)

**Order-Reset Logic:** ❌ NO - Cropper-specific, affects overlays only  
**Functions called:** `updateEnabledPlatforms()`, `updateCropperOverlay()`

---

### 10. OG Generator Controls
**Lines:** Multiple (310-326)  
**Functions:** Updates OG generator canvas preview  
**Triggers:** Various OG generator setting changes (background, colors, font, logo)  
**Event Listener Registration:** Multiple listeners in lines 310-326

**Order-Reset Logic:** ❌ NO - OG generator only, no card order impact

---

### 11. Badge Style Select
**Lines:** 4765-4788  
**Function:** Updates badge preview in modal  
**Trigger:** User changes badge style  
**Event Listener Registration:** Line 296
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview)
```

**Order-Reset Logic:** ❌ NO - Badge modal only, no card order impact

---

## Smart Ordering Queue System

### Supporting Functions

**`isSmartOrdering()` - Lines 7940-7942**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```
Centralized guard checking both user preference AND runtime state

**`queueFilterOperation(operation, description)` - Lines 7949-7954**
```javascript
function queueFilterOperation(operation, description) {
  pendingFilterOperations.push({ operation, description });
}
```
Queues operations to execute after smart ordering completes

**`processPendingFilterOperations()` - Lines 7959-7982**
Executes queued operations after smart ordering finishes

### Handlers That Queue Operations

Four filter handlers queue their operations when smart ordering is active:
1. **toggleHidden** - Line 7987
2. **toggleFavorite** - Line 7870
3. **importPreferences** - Line 8113
4. **toggleWhatIfMode** - Line 8173

---

## Summary Table

| Handler | Lines | Resets Order? | Guard Set? | Triggers renderPreviews? | Queues if Smart Ordering? |
|---------|-------|---------------|------------|-------------------------|---------------------------|
| `toggleHidden()` | 7984-8013 | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| `importPreferences()` | 8082-8140 | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| `toggleWhatIfMode()` | 8146-8187 | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| `applyWhatIfChanges()` | 8254-8305 | ✅ YES | ✅ YES | ✅ YES | ❌ NO |
| `toggleFavorite()` | 7867-7890 | ❌ NO | ❌ NO | ❌ NO | ✅ YES |
| Metadata Filter | 3991-3993 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Command Palette | 9110 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Heatmap Sort | 6101-6123 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Cropper Toggles | 3481-3516 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| OG Generator | 310-326 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Badge Style | 4765-4788 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |

---

## Key Implementation Patterns

### Pattern 1: Standard Guard Pattern (4 handlers)
```javascript
isFilterOperation = true;
renderPreviews(currentData); // or modifiedData
setTimeout(() => { isFilterOperation = false; }, 0);
```
Used by: toggleHidden, importPreferences, toggleWhatIfMode, applyWhatIfChanges

### Pattern 2: Smart Ordering Deferral Pattern (5 handlers)
```javascript
if (isSmartOrdering()) {
  queueFilterOperation(() => handlerFunction(...), 'handlerName');
  return;
}
```
Used by: toggleHidden, toggleFavorite, importPreferences, toggleWhatIfMode

### Pattern 3: User Manual Override Pattern (3 handlers)
```javascript
isSmartOrderingActive = false;
if (DEBUG_SMART_ORDERING) {
  console.log('[handler] Smart ordering active flag CLEARED (user manual override)');
}
```
Used by: toggleHidden, toggleFavorite, importPreferences

### Pattern 4: Non-Filtering Operations (6+ handlers)
Handlers that update UI or auxiliary features without triggering `renderPreviews()`:
- toggleFavorite (favorites list only)
- Metadata filter (table filtering only)
- Command palette (command search only)
- Heatmap sort (sitemap sorting only)
- Cropper toggles (overlay visibility only)
- OG Generator / Badge (separate features only)

---

## Order Reset Prevention Logic

**Location:** Lines 8817-8843 in `applySmartOrdering()` function

When page type changes (e.g., from 'inspect' to 'compare'), the system would normally clear `cardOrder` for non-user-modified groups. The guard prevents this during filter operations:

```javascript
if (isFilterOperation || isSmartOrdering()) {
  // Skip cardOrder clearing - preserve order
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
  return;
}
```

**What Gets Protected:**
- **`cardOrder`** object (line 6268): Maps groupId → array of platform IDs in custom order
- **`cardOrderMetadata`** object (line 6269): Tracks user modifications, timestamps, and modification source

---

## Event Listener Summary

### Filter-Related Event Listeners by Type

**Input Event Listeners:**
1. Line 3991: `metadataFilterInput` - Filters metadata table
2. Line 9110: `commandInput` - Filters command palette

**Click Event Listeners (Filter Operations):**
1. Line 8055: Platform visibility toggle → `toggleHidden()`
2. Line 8033: Platform favorite toggle → `toggleFavorite()`
3. Line 8359: What If mode toggle → `toggleWhatIfMode()`
4. Line 8245: What If apply button → `applyWhatIfChanges()`

**Change Event Listeners:**
1. Line 6831: Import preferences file input → `importPreferences()`
2. Line 332: Heatmap sort dropdown → `handleHeatmapSort()`
3. Line 296: Badge style select → `updateBadgePreview()`

---

## Test Results Verification

✅ **Complete** - All acceptance criteria met:
- ✅ Complete catalog of all filter change handlers (11 handlers documented)
- ✅ Line numbers documented for each handler
- ✅ Order-reset logic clearly documented
- ✅ Filter change triggers specified
- ✅ No code changes, documentation only
- ✅ Current implementation patterns observed and categorized

---

## Related Documentation

- **bf-1pwfw:** Detailed order-reset logic analysis
- **bf-pm4cl:** Filter event listener registrations
- **bf-6as3z:** app.js structure and filter code patterns
- **bf-643ro:** Filter change handlers catalog (initial)

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-24  
**Status:** Complete
