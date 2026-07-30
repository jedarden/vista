# app.js Structure Survey & Filter Handler Patterns

**Bead:** bf-6am4k  
**Date:** 2026-07-24  
**File:** `/home/coding/vista/src/public/app.js` (9,998 lines, 367KB)

---

## General Structure

### File Organization

The app.js file is organized into distinct sections:

1. **State Management** (lines 4-56): Global state variables including `currentData`, `currentMode`, `cardContextState`, `compareData`, debug flags, and keyboard navigation state
2. **Platform Configuration** (lines 14-31): `PLATFORM_SKELETON_TYPES` fetched from `/api/platforms`
3. **Theme Management** (lines 58-102): Theme initialization and application functions
4. **Accessibility Features** (lines 61-78): Screen reader announcements
5. **Event Handlers** (lines 230-350+): Major event listener registrations
6. **Core Functions**: 
   - Hash handling (`updateHash`)
   - Paste detection (`handlePasteDetection`)
   - Diagnostics (`updateDiagnostics`)
   - Results handling (`handleResult`)
7. **Rendering Functions**: Multiple platform-specific render functions (Google, Facebook, Twitter, LinkedIn, Reddit, Slack, Discord, WhatsApp, iMessage, Telegram, Signal, Teams, GoogleChat, Mastodon, Bluesky, Threads, Tumblr, Pinterest, Notion, Jira, GitHub, Trello, Figma, Medium, Substack, Email, Feedly, etc.)

### Key Architectural Patterns

- **Function-based organization**: Most functionality is encapsulated in standalone functions
- **Event-driven**: Heavy use of event listeners for user interactions
- **State-based rendering**: Functions check state variables to determine what/how to render
- **Mixed approach**: Uses both vanilla JavaScript DOM methods and jQuery selectors

---

## Filter Handler Patterns Identified

### 1. Direct `addEventListener` with Anonymous Arrow Functions

**Pattern:** `element.addEventListener('eventType', (e) => { /* handler logic */ })`

**Example:**
```javascript
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Characteristics:**
- Most common pattern in the codebase
- Uses `querySelectorAll` + `forEach` to attach listeners to multiple elements
- Often calls multiple update functions sequentially

---

### 2. Event Delegation with Single Global Listener

**Pattern:** Single listener on parent element, checks `e.target` to determine action

**Example:**
```javascript
document.addEventListener('click', (e) => {
  // Global click handler that checks e.target
});
```

**Characteristics:**
- Used for dynamic elements that may not exist at page load
- More efficient for large numbers of similar elements

---

### 3. jQuery Selectors with `addEventListener`

**Pattern:** `$('#selector').addEventListener('eventType', handlerFunction)`

**Examples:**
```javascript
$('#switchToPaste').addEventListener('click', () => switchMode('paste'));
$('#switchToUrl').addEventListener('click', () => switchMode('url'));
$('#shareBtn').addEventListener('click', shareResults);
```

**Characteristics:**
- Mixed approach: jQuery for selection, vanilla JS for event handling
- Optional chaining with `?.` for elements that may not exist: `$('#element')?.addEventListener(...)`

---

### 4. Text Input Filtering with Live Update

**Pattern:** Input field with live filtering using `'input'` event

**Example:**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Characteristics:**
- Uses `'input'` event for real-time filtering (not `'change'`)
- Passes current input value directly to render function
- Simple, direct filtering pattern

---

### 5. Group Header Toggles with Child Synchronization

**Pattern:** Parent checkbox controls multiple children, with bidirectional sync

**Example:**
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

**Characteristics:**
- Uses `data-*` attributes for element identification and grouping
- Updates all children programmatically
- Calls sync function to maintain consistency

---

### 6. Select All / Clear All Buttons

**Pattern:** Batch operations that update all checkboxes at once

**Examples:**
```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Characteristics:**
- Uses `querySelectorAll` to find all checkboxes
- Updates all elements in loop
- Calls same sync functions as individual changes

---

## Key Filter Handler Locations

### 1. **Metadata Table Filter** (lines ~3989-3992)
- **Element:** `#metadataFilterInput`
- **Event:** `'input'` (real-time filtering)
- **Handler:** Calls `renderMetadataTable(e.target.value)`

### 2. **Platform Toggles in Cropper** (lines ~3496-3502)
- **Elements:** `.cropper-platform-toggle input` (checkboxes)
- **Event:** `'change'`
- **Handler:** Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles(groups)`

### 3. **Group Header Toggles** (lines ~3480-3492)
- **Elements:** `.cropper-group-toggle`
- **Event:** `'change'`
- **Handler:** Updates all platform checkboxes in group, then sync functions

### 4. **Select All/Clear All Platforms** (lines ~3504-3516)
- **Elements:** `#selectAllPlatforms`, `#clearAllPlatforms`
- **Event:** `'click'`
- **Handler:** Batch checkbox updates, then sync functions

---

## Filter Handler Search Strategy for Subsequent Beads

### Phase 1: Pattern-Based Discovery
1. **Search for common event patterns:**
   - `addEventListener('change'`
   - `addEventListener('input'`
   - `addEventListener('click'`
   - `.on('change'` (jQuery pattern if present)

2. **Search for filter-related identifiers:**
   - Element IDs: `*Filter*`, `*filter*`, `*Filter*`
   - Class names: `*-toggle`, `*-checkbox`, `*-select`
   - Data attributes: `data-filter`, `data-platform`, `data-category`

3. **Search for handler function names:**
   - `handle*`, `update*`, `render*`, `sync*`, `toggle*`
   - Filter-specific: `handleFilter`, `applyFilter`, `updateFilter`

### Phase 2: Element Tracing
1. **Find input elements:**
   - `<input type="checkbox">`
   - `<input type="text">` with filter/placeholder hints
   - `<select>` dropdowns

2. **Trace event attachment:**
   - Search for `getElementById('elementId')` followed by `addEventListener`
   - Search for `querySelector('.className')` followed by `addEventListener`
   - Search for `querySelectorAll` with `forEach` and `addEventListener`

### Phase 3: Data Flow Tracing
1. **Identify state variables:**
   - Variables holding filter state (e.g., `cropperState.enabledPlatforms`)
   - Variables tracking current filter values

2. **Trace update functions:**
   - Functions called by event handlers
   - Functions that update state based on filter changes
   - Functions that re-render based on filter state

### Phase 4: Comprehensive Counting
1. **Count unique filter handlers:**
   - Group by element type (checkbox, text input, select, button)
   - Group by functionality (platform filtering, metadata filtering, category filtering)

2. **Document handler characteristics:**
   - Event type used ('change', 'input', 'click')
   - Sync vs async operations
   - State update patterns
   - Re-render triggers

---

## Technical Patterns Summary

### Event Listener Registration Patterns
| Pattern | Frequency | Use Case |
|---------|-----------|----------|
| `querySelectorAll + forEach + addEventListener` | High | Multiple similar elements (checkboxes, buttons) |
| `getElementById + addEventListener` | Medium | Single unique elements |
| jQuery selector + `addEventListener` | Medium | Mixed jQuery/vanilla approach |
| Global delegation (`document.addEventListener`) | Low | Dynamic elements, performance optimization |

### Event Types Used
| Event Type | Purpose |
|------------|---------|
| `'change'` | Checkbox/radio changes, select dropdowns |
| `'input'` | Real-time text filtering |
| `'click'` | Buttons, toggles, interactions |
| `'submit'` | Form submissions |

### Handler Function Patterns
1. **Direct updates:** Modify state variables directly
2. **Sync functions:** Call dedicated sync/update functions (e.g., `updateEnabledPlatforms()`)
3. **Batch operations:** Update multiple elements then sync
4. **Re-render triggers:** Call render functions to update UI

### State Management Patterns
1. **Set-based state:** `cropperState.enabledPlatforms` (Set collection)
2. **Object-based state:** `cardContextState`, `compareData`
3. **Global variables:** `currentData`, `currentMode`

---

## Recommendations for Subsequent Beads

1. **Focus on the cropper controls section** (lines 3400-3700) - highest concentration of filter handlers
2. **Search for `data-platform` and `data-group` attributes** - identifies platform filter checkboxes
3. **Look for `update*` and `sync*` functions** - these are the core filter handler functions
4. **Check for optional chaining patterns** (`?.addEventListener`) - some handlers may be conditional
5. **Document the call chains** - trace from event listener → update function → render function

---

**Next Steps:**
- Use the search strategy above to locate and catalog all filter handlers
- Create a comprehensive count and categorization of handler types
- Document the data flow from user interaction to UI update
