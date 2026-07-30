# app.js Structure Analysis

## File Overview
- **Size:** 10,023 lines
- **Purpose:** Main client-side application logic for VISTA social card preview tool
- **Organization:** Clear section-based structure with visual separators

## Code Organization

### Top-Level State Management (Lines 4-56)
```javascript
// ── State ──
let currentData = null;
let currentMode = 'url'; // 'url' | 'paste' | 'compare'
let cardContextState = {};
let compareData = { before: null, after: null, swapped: false };
let hasCelebratedPerfectScore = false;
let isFreshFetch = true;
let currentTab = 'previews';
let pendingWhatIfTags = null;

// ── Platform Config ──
let PLATFORM_SKELETON_TYPES = null;

// ── Debug Flags ──
let DEBUG_SMART_ORDERING = true;

// ── Keyboard Navigation State ──
let focusedCardIndex = -1;
let focusedCardPids = [];
let editorUndoStack = [];
```

### DOM References Section (Lines 117-226)
Centralized DOM element caching using helper function:
```javascript
const $ = (sel) => document.querySelector(sel);
const hero = $('#hero');
const urlForm = $('#urlForm');
// ... 80+ DOM references cached
```

### Event Listeners Section (Lines 229-380)
**Total: 124 event listeners registered**

#### Registration Pattern:
1. **Direct DOM element references:**
```javascript
urlForm.addEventListener('submit', (e) => { e.preventDefault(); inspectUrl(urlInput.value.trim()); });
pasteForm.addEventListener('submit', (e) => { e.preventDefault(); inspectHtml(htmlInput.value.trim(), baseUrlInput.value.trim()); });
```

2. **Optional chaining for modals:**
```javascript
badgeBtn?.addEventListener('click', openBadgeModal);
badgeModalClose?.addEventListener('click', closeBadgeModal);
```

3. **Dynamic listeners (attached after render):**
```javascript
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

## Filter-Related Code Naming Patterns

### 1. **State Variables (Lines 6279-6281)**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### 2. **Filter Function Naming**
Pattern: `toggle*` + `target`
- `toggleHidden(pid)` - Lines 7984+
- `toggleFavorite(pid)` - Lines 7867+

### 3. **Guard Functions for Smart Ordering Coordination (Lines 7892-7982)**
```javascript
// Centralized guard to check if operation should be deferred
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}

// Main guard checking BOTH preference and runtime state
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}

// Queue operations during smart ordering
function queueFilterOperation(operation, description) {
  pendingFilterOperations.push({ operation, description });
}

// Process pending operations after smart ordering completes
function processPendingFilterOperations() {
  // Process queue...
}
```

### 4. **What If Mode Filter Implementation (Lines 8142-8289)**
```javascript
let whatIfMode = false;
let disabledTags = new Set();

function toggleWhatIfMode() { /* ... */ }
function showWhatIfPanel() { /* ... */ }
function applyWhatIfChanges() { /* ... */ }
function resetWhatIfToggles() { /* ... */ }
```

### 5. **Change Handler Pattern**
```javascript
// Platform toggle handlers (Lines 3480-3501)
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

// Metadata filter handler (Lines 3991-3993)
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

## Key Functions Involved in Filter Handling

### Core Filter Functions:
1. **`toggleHidden(pid)`** (Line 7984)
   - Adds/removes platform ID from `platformPrefs.hidden` Set
   - Triggers re-render with guard flags
   - Supports queuing during smart ordering

2. **`toggleFavorite(pid)`** (Line 7867)
   - Adds/removes platform ID from `platformPrefs.favorites` Set
   - Triggers re-render with guard flags
   - Supports queuing during smart ordering

3. **`renderMetadataTable(filter = '')`** (Line 3941)
   - Filters metadata rows based on tag/value search
   - Updates count display: "X of Y tags"

### Smart Ordering Coordination:
1. **`applySmartOrdering(data, pageType)`** - Smart ordering logic
2. **`reorderPlatformCards()`** (Line 8712) - DOM reordering without rebuild
3. **`isSmartOrdering()`** (Line 7940) - Guard check
4. **`queueFilterOperation()`** (Line 7949) - Queue management
5. **`processPendingFilterOperations()`** (Line 7959) - Queue processing

### Platform State Management:
1. **`updateEnabledPlatforms()`** - Updates which platforms are active
2. **`syncGroupToggles(groups)`** (Line 3530) - Syncs group checkboxes with platform state
3. **`savePlatformPrefs()`** - Persists preferences to localStorage

## Event Listener Registration Patterns Summary

### 1. **Static Listeners (registered on page load)**
Located in the "Event listeners" section (lines 229-380):
- Form submissions: `urlForm`, `pasteForm`, `compareForm`, `sitemapForm`
- Navigation: `navInspect`, `navPaste`, `navCompare`, `navSitemap`
- Mode switching: `$('#switchToPaste')`, `$('#switchToUrl')`
- Modal triggers: `badgeBtn`, `qrBtn`, various modal close buttons
- OG Generator controls: 15+ input/change listeners for canvas generation

### 2. **Dynamic Listeners (attached after DOM updates)**
- Platform card context toggles: `contextToggle.addEventListener('click', ...)`
- Platform theme toggles: `themeToggle.addEventListener('click', ...)`
- Card context menus: `card.addEventListener('contextmenu', ...)`
- What If panel toggles: `panel.querySelectorAll('.what-if-toggle input')`
- Platform removal buttons: `list.querySelectorAll('.platform-item-remove')`

### 3. **Delegated Listeners**
```javascript
// Global click delegation for suggestion chips (Lines 243-268)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggestion-action')) {
    const action = e.target.dataset.action;
    // Handle switch-sitemap, switch-compare, open-templates
  }
  if (e.target.classList.contains('suggestion-dismiss')) {
    // Handle chip dismissal
  }
});
```

## Section Structure

Major sections in order of appearance:
1. State declarations
2. Platform config fetching
3. Debug flags
4. Keyboard navigation state
5. Theme state
6. Accessibility (screen reader announcements)
7. DOM references
8. Event listeners (static)
9. URL Hash state management
10. Mode switching
11. Paste detection
12. Inspect (URL inspection)
13. Perfect Score Celebration
14. Summary bar
15. Preview Grid
16. Platform Skeleton Types
17. Platform Crop Specifications
18. Skeleton Rendering
19. Screenshot download
20. Platform card renderers
21. Platform Context Frame Renderers
22. Crop Visualizer
23. Diagnostics
24. Raw Tags (Metadata Viewer)
25. Redirects & Headers
26. Auto-Fixes
27. Tab switching
28. Recent inspections
29. Share
30. Badge Modal
31. QR Code Modal
32. Reset
33. Utilities
34. OG Generator
35. Compare Mode Functions
36. Sitemap Mode Functions
37. **Phase 2: Editor & Additional Features**
38. **Guard flags to prevent race conditions during smart ordering**
39. Code Snippet Generator
40. Template Library
41. Cache Hub
42. Platform Customization
43. **Centralized guard functions for filter operations during smart ordering**
44. What If Toggle
45. Inline Card Editing
46. Diagnostic Tracking
47. **Smart Platform Ordering**
48. Initialize inline editing on DOM ready
49. Hook into renderDiagnostics for tracking
50. Hook into handleResult for smart ordering
51. Command Palette
52. Global Keyboard Shortcuts
53. Feedback widget
54. Card Drag and Drop
55. Card Context Menu
56. Mobile Swipe & Long-Press Support

## Key Architectural Patterns

### 1. **Guard Flags for Race Prevention**
```javascript
let isFilterOperation = false;     // Prevents smart order resets during filter changes
let isSmartOrderingActive = false;  // Prevents concurrent renders during smart ordering
let isApplyingSmartOrder = false;   // Guards reorderPlatformCards()
```

### 2. **Operation Queuing During Smart Ordering**
```javascript
// Pattern used throughout filter handlers
function myFilterHandler() {
  if (isSmartOrdering()) {
    queueFilterOperation(myFilterHandler, 'myFilterHandler');
    return;
  }
  // Proceed with filter operation
}
```

### 3. **LocalStorage Persistence**
- Platform preferences: `platformPrefs` (favorites, hidden, cardOrder, smartOrdering)
- Theme preference: `localStorage.getItem('vista-theme')`
- Recent inspections: `localStorage.getItem('vista-recents')`

### 4. **Hash-based State Management**
- Encodes: `tab`, `mode`, `without` (disabled tags), `b` (compare URL)
- Enables shareable URLs and state restoration on page load
