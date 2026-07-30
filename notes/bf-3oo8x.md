# app.js Structure Analysis and Filter Change Handler Patterns

## Overview
`app.js` is a large, monolithic frontend application file (~9,998 lines, 367KB) located at `src/public/app.js`. It contains the entire VISTA frontend application logic in a single file.

## File Organization Pattern

The file uses a clear, modular structure despite being in one file. Sections are marked with visual separator comments:

```javascript
// ── Section Name ──
```

### Main Sections (in order of appearance)

1. **State** (line 4) - Global application state
2. **Platform Config** (line 14) - Server configuration fetching  
3. **Debug Flags** (line 33) - Debug configuration
4. **Keyboard Navigation State** (line 53) - Accessibility state
5. **Theme State** (line 58) - Theme management
6. **Accessibility** (line 61) - Screen reader announcements
7. **DOM refs** (line 117) - DOM element references
8. **Event listeners** (line 229) - Global event bindings
9. **URL Hash State Management** (line 381) - Hash-based navigation
10. **Mode switching** (line 512) - View mode transitions
11. **Paste detection** (line 566) - Clipboard handling
12. **Inspect** (line 631) - URL inspection logic
13. **Perfect Score Celebration** (line 1111) - Achievement animations
14. **Summary bar** (line 1215) - Results summary UI
15. **Preview Grid** (line 1240) - Platform card rendering
16. **Platform Skeleton Types** (line 1288) - Platform configurations
17. **Platform Crop Specifications** (line 1295) - Crop definitions
18. **Skeleton Rendering** (line 1434) - Preview card templates
19. **Screenshot download** (line 2105) - Export functionality
20. **Platform card renderers** (line 2203) - Card generation
21. **Platform Context Frame Renderers** (line 2466) - Iframe rendering
22. **Crop Visualizer** (line 3361) - Image cropper UI
23. **Diagnostics** (line 3753) - Error display
24. **Raw Tags (Metadata Viewer)** (line 3791) - Metadata table
25. **Redirects & Headers** (line 4060) - HTTP info display
26. **Auto-Fixes** (line 4482) - Fix suggestions
27. **Tab switching** (line 4571) - Tab management
28. **Recent inspections** (line 4589) - History
29. **Share** (line 4624) - Social sharing
30. **Badge Modal** (line 4721) - Badge generation
31. **QR Modal** (line 4800) - QR code generation
32. **OG Generator** (line 4900) - Open Graph image editor
33. **Sitemap** (line 5700) - Sitemap inspection
34. **Templates** (line 6200) - Meta tag templates
35. **Editor** (line 6400) - Meta tag editor
36. **What If** (line 6900) - Score simulation
37. **Preferences** (line 7500) - Settings UI
38. **Keyboard Navigation** (line 8100) - Keyboard handlers
39. **Command Palette** (line 8400) - Quick actions

## Filter Change Handler Locations

### Primary Pattern: Event Listeners Section (lines 229-380)

The **main event listener section** at the top of the file is where most global event handlers are registered. This is the canonical location for:

- Form submissions
- Button clicks  
- Mode switches
- Modal interactions
- **Global filter/sort controls**

**Example:**
```javascript
// Line 332
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

### Secondary Pattern: Local Registration (within component functions)

Many filter handlers are registered **dynamically within their component's render function**. This happens when:

1. A component renders its UI
2. Filter controls are created as part of the HTML
3. Event listeners are attached to the newly created DOM elements
4. The handlers are typically defined in the same section

**Example 1 - Metadata Filter (Raw Tags section, line 3988-3994):**
```javascript
// Within renderMetadataTable() function
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value); // Re-renders with filtered value
  });
}
```

**Example 2 - Crop Visualizer Platform Toggles (line 3477-3502):**
```javascript
// Within renderCropperControls() function
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

**Example 3 - OG Generator Controls (lines 310-326):**
```javascript
// Event listeners section - OG generator event listeners
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenGradientStart?.addEventListener('input', updateOggenCanvas);
oggenGradientEnd?.addEventListener('input', updateOggenCanvas);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
```

### Handler Function Locations

Filter change **handler functions** are typically located in the **same section as the component they serve**:

| Handler | Section | Line | Purpose |
|---------|---------|------|---------|
| `handleHeatmapSort()` | Sitemap | 6101 | Sort sitemap results by score/URL |
| `updateBadgePreview()` | Badge Modal | ~4800 | Update badge preview display |
| `updateOggenCanvas()` | OG Generator | ~5000 | Redraw OG image preview |
| `handleBgTypeChange()` | OG Generator | ~5020 | Switch BG type (solid/gradient/image) |
| `handleLogoPosChange()` | OG Generator | ~5040 | Change logo position |
| `syncGroupToggles()` | Crop Visualizer | 3530 | Sync group checkboxes with children |
| `updateEnabledPlatforms()` | Crop Visualizer | 3551 | Update active platform set |

## Common Filter Handler Patterns

### Pattern 1: Direct Re-render with State

```javascript
// Simple text filter - re-renders component with filter value
filterInput.addEventListener('input', (e) => {
  renderComponent(e.target.value);
});
```

### Pattern 2: Multi-step State Update

```javascript
// Complex filter - update state, then trigger visual updates
groupCb.addEventListener('change', (e) => {
  // 1. Update child checkboxes
  platforms.forEach(pid => {
    const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
    if (platformCb) platformCb.checked = e.target.checked;
  });
  
  // 2. Update internal state
  updateEnabledPlatforms();
  
  // 3. Re-render visual output
  updateCropperOverlay();
  
  // 4. Sync UI state
  syncGroupToggles(groups);
});
```

### Pattern 3: Sort-based Filtering

```javascript
// Sort dropdown - reorders data and re-renders
function handleHeatmapSort() {
  const sortBy = heatmapSort.value;
  let sorted = [...sitemapResults];
  
  switch (sortBy) {
    case 'score-asc':
      sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      break;
    // ...
  }
  
  renderHeatmapTable(sorted);
}
```

### Pattern 4: Event Delegation (Grouped Controls)

```javascript
// Select all buttons attached in Event listeners section
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

## Key Architectural Principles

1. **Section-based organization**: Each major feature has its own section with state, rendering, and handlers grouped together
2. **Local event registration**: Component-specific filters are registered within the component's render function
3. **Global event registration**: Top-level controls are registered in the Event listeners section
4. **Handler proximity**: Handler functions are defined near the component they serve
5. **Re-render pattern**: Most filters work by re-rendering the component with updated filter parameters
6. **State-first pattern**: For complex filters, state is updated first, then dependent UI is refreshed
7. **Dynamic attachment**: Event listeners are attached after DOM elements are created (not via markup attributes)

## Where to Add New Filter Handlers

When adding new filter change handlers:

1. **For global controls**: Add to the Event listeners section (line 229+)
2. **For component controls**: Add within the component's render function
3. **Define handler functions**: In the same section as the component logic
4. **Follow existing patterns**: Use the same re-render or state-update approach as similar filters

### Example: Adding a New Filter

```javascript
// 1. In Event listeners section (for global control)
newFilterSelect?.addEventListener('change', handleNewFilter);

// 2. In appropriate component section (e.g., line 3900+ for filters)
function handleNewFilter() {
  const filterValue = newFilterSelect.value;
  // Update state or re-render
  renderComponent(filterValue);
}
```

## Summary

The `app.js` file is well-organized with clear section boundaries. Filter change handlers follow two main patterns:

1. **Global filters**: Registered in Event listeners section, handlers defined in relevant feature section
2. **Component filters**: Registered within component render functions, handlers defined in same section

This organization makes it easy to locate filter logic by understanding which feature/section the filter belongs to.