# Comprehensive Filter Change Handler List - VISTA app.js

**Generated:** 2026-07-24  
**Bead:** bf-19a3e  
**Source File:** `/home/coding/vista/src/public/app.js` (9998 lines)  
**Purpose:** Complete raw list of all filter change handler function names with line numbers and locations

---

## Core Named Handler Functions

### Primary Filter/Sort Handlers

| Handler Name | Definition Line | Event Listener Line | DOM Element | Event | Section |
|-------------|-----------------|-------------------|-------------|-------|---------|
| `filterCommands(e)` | 9185 | 9085 | `#commandInput` | input | Command Palette |
| `renderMetadataTable(filter = '')` | 3949 | 3991 | `#metadataFilterInput` | input | Metadata |
| `handleHeatmapSort()` | 6109 | 332 | `#heatmapSort` | change | Sitemap/Heatmap |

### UI Control Change Handlers

| Handler Name | Definition Line | Event Listener Line | DOM Element | Event | Section |
|-------------|-----------------|-------------------|-------------|-------|---------|
| `updateBadgePreview()` | 4773 | 296 | `#badgeStyleSelect` | change | Badge |
| `handleBgTypeChange()` | 5114 | 310 | `#oggenBgType` | change | OG Generator |
| `handleBgImageUpload(e)` | 5125 | 315 | `#oggenBgImageInput` | change | OG Generator |
| `handleLogoPosChange(e)` | 5141 | 321 | `#oggenLogoPos` | change | OG Generator |
| `handleLogoUpload(e)` | 5148 | 322 | `#oggenLogoInput` | change | OG Generator |
| `updateOggenCanvas()` | 5164 | 311-323 | Multiple OG inputs | input/change | OG Generator |
| `handleEditorInput(e)` | 6597 | 6801 | Editor input fields | input | Editor |
| `generateCodeSnippet()` | 6861 | 6813 | `#snippetFramework` | change | Code Snippet |
| `importPreferences(e)` | 8065 | 6831 | `#importPrefsInput` | change | Preferences |

### Platform/Group Selection Handlers

| Handler Name | Definition Line | Event Listener Line | DOM Element | Event | Section |
|-------------|-----------------|-------------------|-------------|-------|---------|
| `syncGroupToggles(groups)` | 3538 | - | - | - | Cropper |
| `updateEnabledPlatforms()` | 3559 | - | - | - | Cropper |
| `updateCropperOverlay()` | 3608 | 3481, 3497 | `.cropper-platform-toggle input` | change | Cropper |
| `renderCategoryLegend()` | 3576 | - | - | - | Cropper |

### Platform Preference Handlers

| Handler Name | Definition Line | Event Listener Line | DOM Element | Event | Section |
|-------------|-----------------|-------------------|-------------|-------|---------|
| `toggleFavorite(pid)` | 7875 | 8007-8009 | `.platform-item-remove` | click | Favorites |
| `toggleHidden(pid)` | 7985 | 8029-8031 | `.platform-item-remove` | click | Hidden |
| `updateFavoritesList()` | - | - | - | - | Favorites |

### What-If Mode Handlers

| Handler Name | Definition Line | Event Listener Line | DOM Element | Event | Section |
|-------------|-----------------|-------------------|-------------|-------|---------|
| `resetWhatIfToggles()` | 8241 | 8219 | `#whatIfReset` | click | What-If |
| `applyWhatIfChanges()` | 8249 | 8220 | `#whatIfApply` | click | What-If |

---

## Guard Functions for Filter Operations

| Handler Name | Definition Line | Purpose | Used By |
|-------------|-----------------|---------|---------|
| `shouldDeferFilterOperation()` | 7899 | Checks if filter operation should be deferred during smart ordering | Filter handlers |
| `isSmartOrdering()` | 7933 | Comprehensive check for smart ordering status | Filter handlers |
| `queueFilterOperation(operation, description)` | 7942 | Queues filter operations for execution after smart ordering | Filter handlers |
| `processPendingFilterOperations()` | 7952 | Executes queued filter operations after smart ordering completion | Smart ordering system |
| `guardWrapperWithRender(name, operation, ...)` | 7885 | Wraps filter operations with smart ordering guards | toggleFavorite, toggleHidden |

---

## Render Functions Related to Filter Operations

| Handler Name | Definition Line | Purpose | Triggered By |
|-------------|-----------------|---------|--------------|
| `renderPreviews(data)` | 1583 | Main render function for platform cards | Filter changes, data updates |
| `renderTextPreviewsOnly(data)` | 1728 | Renders text-only version of platform cards | Filter changes in text mode |
| `updatePreviewsWithEdits()` | 6737 | Updates previews after editor changes | Editor save operations |
| `renderCommands()` | 9085 | Renders filtered command list | Command filter input |

---

## Anonymous/Inline Handlers

| Location | Handler Line | Target Element | Event | Purpose |
|----------|-------------|---------------|-------|---------|
| Cropper Group Toggle | 3481 | `.cropper-group-toggle` | change | Toggles all platforms in a group |
| Cropper Platform Toggle | 3497 | `.cropper-platform-toggle input` | change | Handles individual platform checkbox |
| Metadata Filter Input | 3991 | `#metadataFilterInput` | input | Filters metadata table rows |
| What-If Toggle | 8207 | `.what-if-toggle input` | change | Handles tag enable/disable toggles |
| What-If Reset | 8219 | `#whatIfReset` | click | Resets all What-If toggles |
| What-If Apply | 8220 | `#whatIfApply` | click | Applies What-If changes |
| What-If Mode Toggle | 8334 | `#whatIfToggleBtn` | click | Toggles What-If mode on/off |

---

## Complete Raw List by Category

### Named Functions (Total: 18)
```
1. filterCommands
2. renderMetadataTable  
3. handleHeatmapSort
4. updateBadgePreview
5. handleBgTypeChange
6. handleBgImageUpload
7. handleLogoPosChange
8. handleLogoUpload
9. updateOggenCanvas
10. handleEditorInput
11. generateCodeSnippet
12. importPreferences
13. syncGroupToggles
14. updateEnabledPlatforms
15. updateCropperOverlay
16. renderCategoryLegend
17. toggleFavorite
18. toggleHidden
19. resetWhatIfToggles
20. applyWhatIfChanges
```

### Guard Functions (Total: 5)
```
1. shouldDeferFilterOperation
2. isSmartOrdering
3. queueFilterOperation
4. processPendingFilterOperations
5. guardWrapperWithRender
```

### Render Functions (Total: 4)
```
1. renderPreviews
2. renderTextPreviewsOnly
3. updatePreviewsWithEdits
4. renderCommands
```

### Anonymous/Inline Handlers (Total: 7)
```
1. Cropper Group Toggle Handler (line 3481)
2. Cropper Platform Toggle Handler (line 3497)
3. Metadata Filter Input Handler (line 3991)
4. What-If Toggle Handler (line 8207)
5. What-If Reset Handler (line 8219)
6. What-If Apply Handler (line 8220)
7. What-If Mode Toggle Handler (line 8334)
```

---

## Summary Statistics

- **Total Named Handler Functions:** 20
- **Total Guard Functions:** 5  
- **Total Render Functions:** 4
- **Total Anonymous/Inline Handlers:** 7
- **Total Distinct Handlers:** 36
- **File Size:** 9998 lines
- **Handler Density:** ~1 handler per 277 lines

---

## Handler Distribution by Section

| Section | Handler Count | Handlers |
|---------|--------------|----------|
| OG Generator Section | 6 | handleBgTypeChange, handleBgImageUpload, handleLogoPosChange, handleLogoUpload, updateOggenCanvas, updateBadgePreview |
| Cropper Section | 5 | syncGroupToggles, updateEnabledPlatforms, updateCropperOverlay, renderCategoryLegend + 2 inline |
| Smart Ordering Section | 5 | 5 guard functions |
| What-If Panel Section | 4 | 4 inline handlers + resetWhatIfToggles, applyWhatIfChanges |
| Platform Preferences Section | 3 | toggleFavorite, toggleHidden, updateFavoritesList |
| Command Palette Section | 2 | filterCommands, renderCommands |
| Metadata Section | 2 | renderMetadataTable + 1 inline |
| Main Rendering Section | 2 | renderPreviews, renderTextPreviewsOnly |
| Sitemap/Heatmap Section | 1 | handleHeatmapSort |
| Editor Section | 1 | updatePreviewsWithEdits |
| Code Snippet Section | 1 | generateCodeSnippet |
| Badge Section | 1 | updateBadgePreview |
| Preferences Section | 1 | importPreferences |

---

## Data Sources

This comprehensive list was compiled from the following pattern analysis files:

- `notes/filter-handlers-final-catalog.md` - Primary handler catalog
- `notes/bf-5ggx7-final-filter-handler-catalog.md` - Structured handler catalog
- `notes/bf-114h8-filter-change-handlers-catalog.md` - Handler documentation
- `notes/bf-16j2w-filter-handler-names.md` - Handler function names
- `notes/bf-57p4m-filter-change-handler-line-numbers.md` - Line number reference
- `notes/bf-2bai4-filter-change-handler-dom-mapping.md` - DOM element mapping
- `notes/bf-53rci-filter-change-handler-purposes.md` - Handler purposes

---

**Status:** Complete  
**Total Handlers Documented:** 36 distinct filter change handlers  
**Verification:** All handlers cross-referenced across multiple catalog files  
