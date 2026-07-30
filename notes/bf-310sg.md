# app.js Structure Analysis and Filter Handler Patterns

**Task:** bf-310sg - Read app.js structure  
**Date:** 2026-07-24  
**File:** `/home/coding/vista/src/public/app.js` (9,998 lines, 367.1KB)

## File Organization Overview

The app.js file is organized into clearly demarcated sections using `// ──` markers. Here are the major structural sections:

### Core Sections (Lines 1-6208)
1. **State** (Line 4) - Global application state variables
2. **Platform Config** (Line 14) - Server configuration fetching
3. **Debug Flags** (Line 33) - Debug mode toggles (e.g., `DEBUG_SMART_ORDERING`)
4. **Keyboard Navigation State** (Line 53) - Accessibility state management
5. **Theme State** (Line 58) - Theme management functions
6. **Accessibility** (Line 61) - Screen reader announcements
7. **DOM refs** (Line 117) - DOM element references
8. **Event listeners** (Line 229) - Global event listener setup
9. **URL Hash State Management** (Line 381) - URL-based state persistence
10. **Mode switching** (Line 512) - View mode transitions
11. **Paste detection** (Line 566) - Auto-detect paste operations
12. **Inspect** (Line 631) - Core inspection functionality
13. **Perfect Score Celebration** (Line 1111) - Success animations
14. **Summary bar** (Line 1215) - Result summary rendering
15. **Preview Grid** (Line 1240) - Platform card display
16. **Skeleton Rendering** (Line 1434) - Loading states
17. **Screenshot download** (Line 2105) - Export functionality
18. **Platform card renderers** (Line 2203) - Individual card components
19. **Platform Context Frame Renderers** (Line 2466) - Contextual frames
20. **Crop Visualizer** (Line 3361) - Image cropping UI
21. **Diagnostics** (Line 3753) - Error display
22. **Raw Tags (Metadata Viewer)** (Line 3791) - Metadata inspection
23. **Redirects & Headers** (Line 4060) - HTTP data display
24. **Auto-Fixes** (Line 4482) - Automatic correction suggestions
25. **Tab switching** (Line 4571) - Tab navigation
26. **Recent inspections** (Line 4589) - History tracking
27. **Share** (Line 4624) - Social sharing
28. **Badge Modal** (Line 4721) - Badge generator
29. **QR Code Modal** (Line 4800) - QR code generation
30. **Reset** (Line 4877) - Application reset
31. **Utilities** (Line 4887) - Helper functions
32. **OG Generator** (Line 5072) - Open Graph image generation
33. **Compare Mode Functions** (Line 5428) - Before/after comparison
34. **Sitemap Mode Functions** (Line 5870) - Sitemap analysis

### Phase 2 Features (Lines 6209-9807)
35. **Phase 2: Editor & Additional Features** (Line 6209)
36. **Guard flags for smart ordering** (Line 6272)
37. **Code Snippet Generator** (Line 6852)
38. **Template Library** (Line 7214)
39. **Cache Hub** (Line 7663)
40. **Platform Customization** (Line 7705)
41. **Centralized guard functions for filter operations** (Line 7885) ⭐ **KEY SECTION**
42. **What If Toggle** (Line 8117)
43. **Inline Card Editing** (Line 8336)
44. **Diagnostic Tracking** (Line 8407)
45. **Smart Platform Ordering** (Line 8643)
46. **Command Palette** (Line 9048)
47. **Global Keyboard Shortcuts** (Line 9233)
48. **Feedback widget** (Line 9428)
49. **Card Drag and Drop** (Line 9516)
50. **Mobile Swipe & Long-Press Support** (Line 9807)

## Filter Handler Patterns Identified

### 1. **Centralized Guard System** (Lines 7885-7975) ⭐ PRIMARY PATTERN

**Location:** Lines 7885-7975  
**Purpose:** Prevent race conditions between filter operations and smart ordering

**Key Functions:**
- `isSmartOrdering()` - Checks if smart ordering is active (user pref + runtime state)
- `shouldDeferFilterOperation()` - Returns true if operation should be deferred
- `queueFilterOperation(operation, description)` - Queues filter operation for later execution
- `processPendingFilterOperations()` - Executes queued operations after smart ordering completes

**Usage Pattern in Filter Handlers:**
```javascript
function myFilterHandler() {
  if (isSmartOrdering()) {
    queueFilterOperation(myFilterHandler, 'myFilterHandler');
    return;
  }
  // Proceed with filter operation
}
```

**Related State Variables:**
- `isFilterOperation` (Line 6279) - Guard flag during filter changes
- `isSmartOrderingActive` - Runtime flag tracking smart ordering progress
- `pendingFilterOperations` - Queue of deferred filter operations

### 2. **Metadata Filter Pattern** (Lines 3988-3994)

**Location:** Lines 3988-3994  
**Type:** Input-based text filter with immediate rendering

**Pattern:**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Characteristics:**
- Direct `input` event listener (not `change`)
- Immediately calls render function with new filter value
- Render function accepts optional filter parameter: `renderMetadataTable(filter = '')`

### 3. **Command Palette Filter Pattern** (Lines 9085, 9177-9192)

**Location:** Lines 9085 (setup), 9177-9192 (implementation)  
**Type:** Input-based multi-field filter with array filtering

**Setup Pattern:**
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Filter Function Pattern:**
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0; // Reset selection

  if (!query) {
    renderCommands(COMMANDS); // Show all if empty
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

**Characteristics:**
- Filters array of objects
- Multi-field search (label OR category)
- Case-insensitive with `.toLowerCase()`
- Resets UI state (selected index)
- Falls back to full list on empty query

### 4. **Checkbox Group Filter Pattern** (Lines 3481-3502)

**Location:** Lines 3481-3502  
**Type:** Grouped checkbox filters with sync logic

**Group Header Pattern:**
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

**Individual Checkbox Pattern:**
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
- Uses `change` event (not `input`)
- Cascading updates: checkbox → overlay → sync
- Group header controls all children
- Individual changes re-sync group headers
- Multiple UI updates per change

### 5. **What If Toggle Pattern** (Lines 8207-8216)

**Location:** Lines 8207-8216  
**Type:** State-tracking checkbox filter with hash persistence

**Pattern:**
```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
});
```

**Characteristics:**
- Uses `change` event
- Maintains Set collection of disabled items
- Persists state via URL hash
- Direct manipulation of state collection

### 6. **Guard Wrapper Pattern** (Lines 7977-7984)

**Location:** Lines 7977-7984  
**Type:** Protected filter operation with centralized guarding

**Pattern:**
```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
  });
}
```

**Characteristics:**
- Wraps filter operation in `guardWrapperWithRender()`
- Provides operation name for debugging
- Automatic render call after operation
- Centralized guard logic in wrapper function

## Common Filter Handler Characteristics

### Event Types
- **`input`** - Real-time filtering (metadata, command palette)
- **`change`** - Commit-based filtering (checkboxes, toggles)

### State Management
- Direct collection manipulation (Sets, Arrays)
- Hash-based persistence (URL state)
- Guarded operations (smart ordering protection)

### UI Updates
- Immediate re-render
- Cascading updates (checkbox → overlay → sync)
- State reset (selected index clearing)

### Filter Logic Patterns
1. **Simple text filter:** `field.toLowerCase().includes(query)`
2. **Multi-field filter:** `field1.includes() || field2.includes()`
3. **Collection filter:** Set manipulation (add/delete)
4. **Group filter:** Header controls children, bidirectional sync

## Architectural Patterns

### Section Organization
- Clear `// ──` markers for major sections
- Logical grouping: State → UI → Features → Utilities
- Phase 2 clearly separated from core functionality

### Event Handler Setup
- Global event listeners in dedicated section (Line 229)
- Component-specific listeners attached after rendering
- QuerySelector-based element binding

### State Management
- Global state variables at top of file
- localStorage persistence
- URL hash-based state sharing
- Guard flags for race condition prevention

### Accessibility
- ARIA attributes in dynamic HTML
- Screen reader announcements (Line 67)
- Keyboard navigation support (Line 53)
- Focus management in modals/commands

## Key Locations for Filter Handlers

| Line Range | Pattern | Purpose |
|------------|---------|---------|
| 7885-7975 | Guard System | Smart ordering protection |
| 7977-7984 | Guard Wrapper | Protected filter operations |
| 3481-3502 | Checkbox Groups | Cropper platform selection |
| 3988-3994 | Input Filter | Metadata table filtering |
| 8207-8216 | Toggle Filter | What If tag toggles |
| 9085, 9177-9192 | Command Filter | Command palette search |

## Recommendations for Systematic Search

1. **Start with guard system** (Line 7885) - Understand centralized protection
2. **Search for `addEventListener`** - Find all filter event bindings
3. **Look for `filter` functions** - Find filtering logic implementations
4. **Check `change` and `input` events** - Distinguish commit vs. real-time filters
5. **Follow `render` calls** - See how filter updates propagate to UI
6. **Check for `isSmartOrdering()` guards** - Find protected filter operations

## File Statistics

- **Total Lines:** 9,998
- **File Size:** 367.1 KB
- **Major Sections:** 50
- **Filter-related Functions:** 15+
- **Guard System:** Lines 7885-7975
- **Primary Filter Patterns:** 6 identified

---

**Next Steps:**
1. Use this map to locate specific filter handler implementations
2. Analyze guard system integration points
3. Document race condition prevention strategies
4. Create catalog of all filter change handlers in the codebase
