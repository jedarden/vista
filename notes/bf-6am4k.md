# app.js Structure Survey and Filter Handler Pattern Analysis

**Bead:** bf-6am4k  
**Date:** 2026-07-24  
**Purpose:** Establish foundation for systematic filter handler discovery

## File Overview

- **Location:** `/home/coding/vista/src/public/app.js`
- **Size:** 9,998 lines (~367KB)
- **Scope:** Frontend application logic for VISTA preview tool

## General Structure

The app.js file is organized into distinct sections:

### 1. State Management (Lines 1-100)
```javascript
// Global state variables
let currentData = null;
let currentMode = 'url';
let cardContextState = {};
let compareData = { before: null, after: null, swapped: false };
let hasCelebratedPerfectScore = false;
let isFreshFetch = true;
let currentTab = 'previews';
let pendingWhatIfTags = null;
```

### 2. Platform Configuration (Lines 14-31)
- Platform config fetching from `/api/platforms`
- Skeleton type mapping

### 3. Theme State & Initialization (Lines 58-100)
- `initTheme()` function
- `applyTheme()` function
- Theme toggle functionality

### 4. Main Render Functions (Lines 1216-2885)
- `renderSummaryBar()`
- `renderPreviews()`
- `renderPlatformCard()`
- Platform-specific render functions (Google, Facebook, Twitter, LinkedIn, etc.)

### 5. Event Handlers & UI Logic (Lines 230-6850)
- Mode switching
- Form submission
- What If panel
- Platform cropper
- Editor functionality

### 6. Mobile & Touch Support (Lines 9807-9998)
- Long press handling
- Swipe gestures
- Touch navigation

## Common Filter Change Handler Patterns

### Pattern 1: `addEventListener` with `'change'` event
```javascript
// Lines 296-322
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### Pattern 2: `addEventListener` with `'input'` event (real-time filtering)
```javascript
// Lines 311-320, 3991-3993
oggenBgColor?.addEventListener('input', updateOggenCanvas);
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

### Pattern 3: Checkbox toggles with `forEach` iteration
```javascript
// Lines 3480-3497
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    const groupId = e.target.dataset.group;
    const shouldBeChecked = e.target.checked;
    // ... handler logic
  });
});
```

### Pattern 4: Event delegation on dynamically created elements
```javascript
// Lines 8206-8216
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    updateHash();
  });
});
```

### Pattern 5: Direct onclick handlers in HTML strings
```javascript
// Lines 3446-3518
html += '<button class="action-btn" id="selectAllPlatforms">Select All</button>';
// Later attached via:
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
});
```

## Key Filter Handler Locations

### 1. **Metadata Table Filter** (Lines 3941-3995)
- **Function:** `renderMetadataTable(filter = '')`
- **Filter Element:** `#metadataFilterInput`
- **Pattern:** Input event listener with real-time filtering
- **Search Strategy:** Look for `filterInput.addEventListener('input', ...)` pattern

### 2. **Platform Cropper Modal** (Lines 3440-3520)
- **Filter Elements:** `.cropper-group-toggle`, `.cropper-platform-toggle input`
- **Pattern:** Checkbox change events with group/platform filtering
- **Search Strategy:** Look for `cropper-group-toggle` and `cropper-platform-toggle` selectors

### 3. **What If Panel Toggles** (Lines 8200-8300)
- **Filter Elements:** `.what-if-toggle input[data-tag="..."]`
- **Pattern:** Change events maintaining `disabledTags` Set
- **Search Strategy:** Look for `what-if-toggle` and `disabledTags` references

### 4. **Editor Input Changes** (Lines 6797-6850)
- **Filter Elements:** `.editor-input`, `.editor-textarea`, `.editor-select`
- **Pattern:** Input events calling `handleEditorInput()`
- **Search Strategy:** Look for `editor-input` and `handleEditorInput` calls

### 5. **Heatmap Sorting** (Line 332)
- **Filter Element:** `#heatmapSort`
- **Pattern:** Change event calling `handleHeatmapSort()`
- **Search Strategy:** Look for `heatmapSort` and `handleHeatmapSort` function

## Search Strategy for Subsequent Beads

### Phase 1: Comprehensive Handler Discovery
1. **Search for change event listeners:**
   ```bash
   grep -n "addEventListener.*change" app.js
   ```

2. **Search for input event listeners:**
   ```bash
   grep -n "addEventListener.*input" app.js
   ```

3. **Search for checkbox-related patterns:**
   ```bash
   grep -n "checkbox\|\.toggle" app.js
   ```

4. **Search for filter-related function names:**
   ```bash
   grep -n "function.*filter\|function.*handle" app.js
   ```

### Phase 2: Pattern Validation & Classification
1. **Categorize handlers by type:**
   - Checkbox toggles (group/platform filtering)
   - Text input filters (metadata search)
   - Select dropdowns (sorting options)
   - Range sliders (numeric filters)

2. **Identify handler characteristics:**
   - Event type (change vs input)
   - Debouncing/throttling
   - State persistence
   - DOM manipulation patterns

### Phase 3: Handler Verification
1. **For each discovered handler:**
   - Trace the execution flow from event to state change
   - Identify which UI components are affected
   - Verify the handler is properly attached after dynamic rendering
   - Check for memory leaks or duplicate listeners

2. **Document handler lifecycle:**
   - When handlers are attached
   - When handlers are removed
   - State persistence mechanisms
   - Interaction with other handlers

## Key Findings for Handler Count Verification

### Potential Handler Locations by Count:
1. **Metadata filter:** 1 handler (input event)
2. **Platform cropper:** ~15-20 handlers (group toggles + platform toggles)
3. **What If toggles:** Variable count (depends on metadata tags available)
4. **Editor inputs:** ~8-10 handlers (various editor fields)
5. **Theme/context toggles:** ~20-30 handlers (card-level controls)
6. **OG generator controls:** ~8-10 handlers
7. **Heatmap controls:** ~5-8 handlers

**Estimated total filter change handlers:** 50-100 handlers across all features

## Architecture Observations

### Handler Attachment Patterns:
- **Static handlers:** Attached once during DOMContentLoaded
- **Dynamic handlers:** Re-attached on each render (e.g., card theme toggles)
- **Delegated handlers:** Attached to parent containers for dynamically created elements

### State Management:
- Global state variables track filter conditions
- `disabledTags` Set for What If functionality
- `editorState` object for editor changes
- `platformPrefs` for platform preferences

### Memory Considerations:
- Risk of duplicate event listeners on dynamic elements
- Event delegation used in some areas (mobile touch support)
- Cleanup patterns needed for dynamic content

## Recommendations for Next Beads

1. **Focus on the major filter systems first:**
   - Platform cropper (high handler count)
   - What If toggles (dynamic handler count)
   - Metadata filter (single but complex handler)

2. **Verify handler count by:**
   - Searching for each selector pattern
   - Counting actual listener attachments
   - Checking for dynamic handler generation

3. **Document edge cases:**
   - Handlers that are added/removed dynamically
   - Handlers that depend on data availability
   - Handlers with conditional logic

## Conclusion

This survey provides a comprehensive foundation for systematic filter handler discovery. The app.js file uses consistent patterns that can be reliably searched and categorized. The next beads should focus on verifying the actual count of handlers by examining each identified system and tracing handler attachment through the rendering lifecycle.