# Filter Change Handler Patterns in app.js

## Overview
This document identifies and documents the code patterns and naming conventions that constitute a filter change handler in `/home/coding/vista/src/public/app.js`.

## Main Filter Change Handler Patterns

### 1. Platform Toggle Handlers (`.cropper-platform-toggle input`)

**Location:** Lines 3496-3500

**Pattern:**
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Naming Convention:** 
- Element selector: `.cropper-platform-toggle input`
- Handler functions: `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles(groups)`

**Purpose:** Checkboxes for enabling/disabling individual platforms in the cropper view

**Functions called:**
- `updateEnabledPlatforms()` - Line 3551: Updates the `cropperState.enabledPlatforms` Set with checked platforms
- `updateCropperOverlay()` - Line 3600: Redraws the overlay based on enabled platforms
- `syncGroupToggles(groups)` - Line 3530: Updates group header checkboxes to reflect child states

---

### 2. Group Toggle Handlers (`.cropper-group-toggle`)

**Location:** Lines 3480-3490

**Pattern:**
```javascript
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    const group = e.target.dataset.group;
    const platforms = groups.find(g => g.id === group)?.platforms || [];
    platforms.forEach(pid => {
      const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
      if (platformCb) platformCb.checked = e.target.checked;
    });
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Naming Convention:** 
- Element selector: `.cropper-group-toggle`
- Uses `dataset.group` to identify the group
- Handler functions: Same as platform toggles

**Purpose:** Checkboxes for enabling/disabling entire platform groups at once

---

### 3. Select All / Clear All Buttons

**Location:** Lines 3504-3515

**Pattern:**
```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});

document.getElementById('clearAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = false);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Naming Convention:** 
- Button IDs: `selectAllPlatforms`, `clearAllPlatforms`
- Handler functions: Same sequence as individual toggles

**Purpose:** Bulk operations for platform selection

---

### 4. Metadata Filter Input Handler

**Location:** Lines 3989-3994

**Pattern:**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Naming Convention:** 
- Element ID: `metadataFilterInput`
- Event type: `input` (not `change`) - filters as user types
- Handler function: `renderMetadataTable(filter)`

**Purpose:** Text input for filtering metadata table rows by tag name or value

**Handler function signature:** `function renderMetadataTable(filter = '')` - Line 3941

---

### 5. Heatmap Sort Handler

**Location:** Line 332 (setup), Lines 6101-6123 (handler function)

**Pattern:**
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Handler function:**
```javascript
function handleHeatmapSort() {
  if (!heatmapSort || !sitemapResults.length) return;
  
  const sortBy = heatmapSort.value;
  let sorted = [...sitemapResults];
  
  switch (sortBy) {
    case 'score-asc':
      sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      break;
    case 'url-asc':
      sorted.sort((a, b) => a.url.localeCompare(b.url));
      break;
    case 'url-desc':
      sorted.sort((a, b) => b.url.localeCompare(a.url));
      break;
  }
  
  renderHeatmapTable(sorted);
}
```

**Naming Convention:** 
- Element ID: `heatmapSort`
- Handler function: `handleHeatmapSort` (uses `handle` prefix)
- Render function: `renderHeatmapTable(sorted)`

**Purpose:** Dropdown for sorting heatmap table results

---

### 6. Guard Flag Pattern (Filter Operation Protection)

**Location:** Line 6279 (declaration), Lines 8080-8265 (usage)

**Pattern:**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Usage pattern:**
```javascript
isFilterOperation = true;
// ... perform filter operations ...
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Prevents smart ordering resets during filter changes. When `isFilterOperation` is true, the smart ordering logic skips clearing cardOrder.

**Usage locations:**
- Line 8080-8082: During pending filter operations
- Line 8096-8099: During platform preference changes
- Line 8144-8146: During card order updates
- Line 8156-8159: During card clearing operations
- Line 8263-8265: During sitemap heatmap operations

**Guard check example (Line 8792):**
```javascript
if (isFilterOperation || isSmartOrdering()) {
  console.log('Skipping cardOrder clearing because', 
    isFilterOperation ? 'filter operation in progress' : 'smart ordering is active');
  return;
}
```

---

## Naming Conventions Summary

### Handler Functions
1. **`handle*` prefix** - For direct event handlers (e.g., `handleHeatmapSort`, `handleBgTypeChange`)
2. **`update*` prefix** - For updating state/UI (e.g., `updateEnabledPlatforms`, `updateCropperOverlay`)
3. **`sync*` prefix** - For synchronizing UI state (e.g., `syncGroupToggles`)
4. **`render*` prefix** - For rendering/updating views (e.g., `renderMetadataTable`, `renderHeatmapTable`)

### Element Selectors
1. **Class-based selectors** - For repeated elements (`.cropper-platform-toggle`, `.cropper-group-toggle`)
2. **ID-based selectors** - For unique elements (`#metadataFilterInput`, `#selectAllPlatforms`)
3. **Dataset attributes** - For data binding (`data-platform`, `data-group`)

### Event Types
1. **`change`** - For checkboxes, selects, radio buttons (fires after value change)
2. **`input`** - For text inputs (fires immediately during typing)

---

## Common Handler Structure Pattern

Most filter change handlers follow this sequence:

1. **Set guard flag** (if applicable): `isFilterOperation = true`
2. **Update state** (e.g., `updateEnabledPlatforms()`)
3. **Update UI** (e.g., `updateCropperOverlay()`)
4. **Synchronize related UI** (e.g., `syncGroupToggles()`)
5. **Render results** (e.g., `renderHeatmapTable()`)
6. **Clear guard flag** (if applicable): `setTimeout(() => { isFilterOperation = false; }, 0)`

---

## Edge Cases and Variations

### 1. Async Guard Flag Clearing
The guard flag is cleared asynchronously using `setTimeout(..., 0)` to ensure the flag stays true through the current event loop iteration.

### 2. Optional Chaining
Many handlers use optional chaining (`?.`) for element selection to handle cases where elements don't exist:
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### 3. Conditional Handler Attachment
Handlers check for element existence before attaching listeners:
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

### 4. Dataset-Based Selection
Platform-specific handlers use `dataset` attributes to identify which platform is being manipulated:
```javascript
cb.dataset.platform
e.target.dataset.group
```

---

## Additional Filter Handler Functions

### Background Image Upload Handler
**Location:** Line 322
```javascript
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
```
**Handler:** `handleBgImageUpload(e)` - Line 5117

### Logo Position Change Handler
**Location:** Line 321
```javascript
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
```
**Handler:** `handleLogoPosChange()` - Line 5133

### Logo Upload Handler
**Location:** Line 322
```javascript
oggenLogoInput?.addEventListener('change', handleLogoUpload);
```
**Handler:** `handleLogoUpload(e)` - Line 5140

---

## Complete List of Filter Change Handlers

1. **Platform toggles** - Lines 3496-3500
2. **Group toggles** - Lines 3480-3490
3. **Select all platforms** - Line 3504
4. **Clear all platforms** - Line 3511
5. **Metadata filter input** - Lines 3989-3994
6. **Heatmap sort** - Line 332
7. **Badge style select** - Line 296
8. **OG gen background type** - Line 310
9. **OG gen gradient direction** - Line 314
10. **OG gen background image** - Line 315
11. **OG gen background image size** - Line 316
12. **OG gen font** - Line 319
13. **OG gen logo position** - Line 321
14. **OG gen logo input** - Line 322
15. **Snippet framework** - Line 6813
16. **Import preferences** - Line 6831

---

## Summary

Filter change handlers in app.js follow consistent patterns:
- Use `change` events for form controls (checkboxes, selects)
- Use `input` events for text filters
- Follow a naming convention of `handle*`, `update*`, `sync*`, `render*`
- Employ guard flags (`isFilterOperation`) to prevent unwanted side effects
- Use optional chaining for safe element selection
- Combine state updates with UI rendering in a predictable sequence
