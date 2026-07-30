# Filter Change Handlers Grouped by app.js Section

Structured organization of all filter change handlers by their logical location in `/home/coding/vista/src/public/app.js`

---

## Main Rendering Section
**Lines: 1583-1728**

### Primary Handler Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `renderPreviews` | 1583 | render_function | Main rendering function for preview thumbnails |
| `renderTextPreviewsOnly` | 1728 | render_function | Renders text-only preview variants |

**Section Summary**: Core rendering functions that generate filtered preview displays

---

## Cropper Section  
**Lines: 3481-3600**

### Inline Handler Functions
| Handler | Line | Target Element | Event | Action |
|---------|------|----------------|-------|--------|
| Cropper group toggle | 3481 | `.cropper-group-toggle` | change | Toggles all platforms in group |
| Cropper platform toggle | 3497 | `.cropper-platform-toggle input` | change | Updates enabled platforms |

### Named Handler Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `syncGroupToggles` | 3530 | named_function | Syncs group toggle state with platform states |
| `updateEnabledPlatforms` | 3551 | named_function | Updates the set of enabled platforms |
| `updateCropperOverlay` | 3600 | named_function | Updates cropper overlay display |

**Section Summary**: Platform selection and cropper UI state management (5 handlers total)

---

## Metadata Section
**Lines: 3941-3993**

### Primary Handler Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `renderMetadataTable` | 3941 | render_function | Renders metadata table with optional filter parameter |

### Inline Handler Functions
| Handler | Line | Target Element | Event | Action |
|---------|------|----------------|-------|--------|
| Metadata filter input | 3991 | `#metadataFilterInput` | input | Calls `renderMetadataTable(e.target.value)` to filter rows |

**Section Summary**: Metadata table rendering and filtering (2 handlers total)

---

## Sitemap/Heatmap Section
**Lines: 6101**

### Primary Handler Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `handleHeatmapSort` | 6101 | named_function | Handles heatmap sorting interactions |

**Section Summary**: Heatmap sorting controls (1 handler)

---

## Editor Section
**Lines: 6737**

### Render Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `updatePreviewsWithEdits` | 6737 | render_function | Updates previews to reflect editor changes |

**Section Summary**: Editor-to-preview synchronization (1 handler)

---

## Smart Ordering Section
**Lines: 7891-7952**

### Guard Functions for Filter Operations
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `shouldDeferFilterOperation` | 7891 | guard_function | Checks if filter should be deferred during smart ordering |
| `isSmartOrdering` | 7933 | guard_function | Checks if smart ordering is active |
| `queueFilterOperation` | 7942 | guard_function | Queues filter operations for later processing |
| `processPendingFilterOperations` | 7952 | guard_function | Processes queued filter operations after smart ordering completes |

**Section Summary**: Centralized guard and queue management for filter operations during smart ordering (4 handlers total)

---

## Platform Preferences Section
**Lines: 7867-7990**

### Primary Handler Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `toggleFavorite` | 7867 | named_function | Toggles favorite status for platforms |
| `toggleHidden` | 7977 | named_function | Toggles hidden status for platforms |
| `updateFavoritesList` | 7990 | named_function | Updates the favorites list display |

**Section Summary**: User preference management for platforms (3 handlers total)

---

## What-If Panel Section
**Lines: 8207**

### Inline Handler Functions
| Handler | Line | Target Element | Event | Action |
|---------|------|----------------|-------|--------|
| What-if toggle | 8207 | `.what-if-toggle input` | change | Updates disabled tags set for what-if mode |

**Section Summary**: What-if scenario controls (1 handler)

---

## Command Palette Section
**Lines: 9177-9192**

### Primary Handler Functions
| Handler | Line | Type | Description |
|---------|------|------|-------------|
| `filterCommands` | 9177 | named_function | Filters command palette commands based on query input |

```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

**Section Summary**: Command search functionality (1 handler)

---

## Summary Statistics

**Total Filter Change Handlers: 17**

### By Handler Type:
- **Named functions**: 10 primary handlers
- **Render functions**: 3 
- **Guard functions**: 4
- **Inline handlers**: 4 event listener callbacks

### By Spatial Distribution:
- **Cropper Section**: 5 handlers (lines 3481-3600)
- **Smart Ordering Section**: 4 handlers (lines 7891-7952)
- **Platform Preferences Section**: 3 handlers (lines 7867-7990)
- **Metadata Section**: 2 handlers (lines 3941-3993)
- **Main Rendering Section**: 2 handlers (lines 1583-1728)
- **Command Palette Section**: 1 handler (line 9177)
- **Sitemap/Heatmap Section**: 1 handler (line 6101)
- **Editor Section**: 1 handler (line 6737)
- **What-If Panel Section**: 1 handler (line 8207)

### By Functional Category:
- **UI Rendering**: 5 handlers (preview/text rendering, metadata table, cropper overlay)
- **Platform Management**: 5 handlers (favorites, hidden state, enabled platforms)
- **Filter Operations**: 4 handlers (guard functions for smart ordering)
- **Event Handling**: 4 inline handlers (group/platform toggles, metadata input, what-if toggle)
- **Search/Sort**: 2 handlers (command palette filter, heatmap sort)
- **Editor Sync**: 1 handler (preview updates from editor)

---

## Line Number Range Summary

Filter change handlers span **lines 1583-9192** in app.js, representing **7,609 lines of code** between the first and last handler.

- **Earliest handler**: `renderPreviews` at line 1583
- **Latest handler**: `filterCommands` at line 9192
- **Most dense section**: Cropper Section (5 handlers in 119 lines)
- **Most distributed**: Smart Ordering and Platform Preferences (adjacent sections with 7 total handlers)