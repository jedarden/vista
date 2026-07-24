# Filter Change Handler Catalog - app.js

**Task:** Identify and catalog all filter change event listeners that reset order in src/public/app.js

**Date:** 2026-07-24

---

## Overview

The application uses a guard flag pattern (`isFilterOperation`) to prevent smart order resets during filter changes. This catalog documents all filter change handlers that set this flag and trigger re-renders.

**Guard Flag Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData); // or modifiedData
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

## Filter Change Handlers with Order Reset Protection

### 1. toggleHidden(pid) - Line 7984-8013

**Purpose:** Toggle platform visibility in the preview grid

**Triggers:**
- Context menu action: "Hide this platform" / "Show this platform" (line 9822)
- Hidden platforms list remove button (line 8055)

**Order Reset Logic:**
```javascript
// Line 8003-8006
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Additional Effects:**
- Clears `isSmartOrderingActive` flag (user manual override)
- Saves platform preferences

---

### 2. toggleFavorite(pid) - Line 7867-7888

**Purpose:** Toggle platform favorite/star status

**Triggers:**
- Context menu action: "Star / unstar" (line 9825)
- Favorites list remove button (line 8033)

**Order Reset Logic:**
- **NO order reset** - This handler does NOT call `renderPreviews()` or set `isFilterOperation`
- Only updates `platformPrefs.favorites` set and saves preferences

---

### 3. importPreferences(e) - Line 8082-8131

**Purpose:** Import platform preferences from a JSON file

**Triggers:**
- File input change: `#importPrefsInput` (line 6831)

**Order Reset Logic:**
Two code paths depending on smart ordering state:

**When smart ordering active (deferred):**
```javascript
// Lines 8105-8107
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**When smart ordering inactive (immediate):**
```javascript
// Lines 8121-8124
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Additional Effects:**
- Clears `isSmartOrderingActive` flag (user manual override)
- Updates UI elements (column layout, favorites list)

---

### 4. toggleWhatIfMode() - Line 8146-8187

**Purpose:** Toggle "What If" mode for tag disabling experiments

**Triggers:**
- What If toggle button: `#whatIfToggleBtn` click

**Order Reset Logic:**
When turning OFF What If mode (two code paths):

**When smart ordering active (deferred):**
```javascript
// Lines 8169-8171
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**When smart ordering inactive (immediate):**
```javascript
// Lines 8181-8184
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Additional Effects:**
- Clears `disabledTags` set
- Clears hash parameter `without`
- Removes What If panel from DOM

---

### 5. applyWhatIfChanges() - Line 8266-8297

**Purpose:** Apply tag disabling changes in What If mode

**Triggers:**
- What If panel "Apply" button: `#whatIfApply` (line 8245)

**Order Reset Logic:**
```javascript
// Lines 8288-8290
isFilterOperation = true;
renderPreviews(modifiedData); // Note: modified data, not currentData
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Special Behavior:**
- Creates modified metadata excluding disabled tags
- Renders with `modifiedData` instead of `currentData`
- Announces changes for screen readers
- Shows missing tag warnings

---

## Other Change Handlers (No Order Reset)

### handleHeatmapSort() - Line 6101-6131

**Purpose:** Sort sitemap heatmap results

**Trigger:** Heatmap sort dropdown change (line 332)

**Order Reset Logic:**
- **NO order reset** - Only sorts sitemapResults array locally
- Does NOT interact with platform card ordering

---

### filterCommands() - Line 9202-9210

**Purpose:** Filter command palette commands list

**Trigger:** Command palette input typing (line 9110)

**Order Reset Logic:**
- **NO order reset** - Only filters command palette UI
- Does NOT interact with platform cards

---

### metadataFilterInput - Line 3991-3993

**Purpose:** Filter metadata table rows in editor

**Trigger:** Metadata filter input typing (line 3991)

**Order Reset Logic:**
- **NO order reset** - Calls `renderMetadataTable()` only
- Does NOT interact with platform card ordering

---

## Supporting Infrastructure

### Guard Flag Declaration - Line 6279

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### Smart Ordering Guard Check - Line 8815-8831

Location where the guard is checked to prevent order clearing:

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
} else {
  // Clear stale cardOrder when page type changes
}
```

### Queue Filter Operation - Line 7949-7980

Centralized function for deferring filter operations during active smart ordering:

```javascript
function queueFilterOperation(operation, description) {
  pendingFilterOperations.push({ operation, description });
  scheduleFilterOperationProcessing();
}
```

Used by:
- `toggleFavorite` (line 7870)
- `toggleHidden` (line 7987)

---

## Summary

**Total filter change handlers with order reset protection: 5**

1. **toggleHidden** - Hide/show platforms
2. **importPreferences** - Import user preferences
3. **toggleWhatIfMode** - Toggle What If mode off
4. **applyWhatIfChanges** - Apply What If tag changes
5. **toggleFavorite** - Does NOT reset order (no render)

**Common pattern:** All handlers that reset order set `isFilterOperation = true`, call `renderPreviews()`, then clear the flag after 0ms timeout.

**Trigger locations:**
- Context menu actions: 2 (toggleHidden, toggleFavorite)
- Settings panel inputs: 1 (importPreferences)
- What If mode controls: 2 (toggleWhatIfMode, applyWhatIfChanges)
- List remove buttons: 2 (favorites, hidden platforms)

**No code changes made** - This is documentation only.
