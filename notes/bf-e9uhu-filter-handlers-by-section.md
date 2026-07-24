# Filter Change Handlers Grouped by Section - app.js

## Overview
This document groups all 62 filter change handlers by their section/region in `/home/coding/vista/src/public/app.js`, based on the handler catalog from bead bf-5xxsl.

---

## 1. Theme State Section (Lines 58-116)
**Theme Management Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `toggleGlobalTheme()` | 108 | toggle* |
| `applyTheme(theme)` | 94 | apply* |

**Section Summary:** 2 handlers for theme state management

---

## 2. URL Hash State Management Section (Lines 381-511)
**Hash State Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `updateHash(options = {})` | 404 | update* |

**Section Summary:** 1 handler for URL hash management

---

## 3. Inspect Section (Lines 631-1110)
**Core Inspection Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `updateDiagnostics(data)` | 900 | update* |
| `updatePreviewsWithImages(data)` | 1930 | update* |

**Section Summary:** 2 handlers for inspection updates

---

## 4. Platform Card Renderers Section (Lines 2203-2465)
**Platform Card Display Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `toggleCardContext(pid, data)` | 2162 | toggle* |
| `toggleCardTheme(pid, data)` | 2175 | toggle* |
| `updateCardHeader(pid)` | 2186 | update* |

**Section Summary:** 3 handlers for platform card display management

---

## 5. Crop Visualizer Section (Lines 3361-3752)
**Image Cropping Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `updateEnabledPlatforms()` | 3551 | update* |
| `syncGroupToggles(groups)` | 3530 | sync* |
| `updateCropperOverlay()` | 3600 | update* |

**Section Summary:** 3 handlers for cropper UI state synchronization

---

## 6. Raw Tags (Metadata Viewer) Section (Lines 3791-4059)
**Metadata Display Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `renderMetadataTable(filter = '')` | 3941 | filter* |

**Section Summary:** 1 handler for metadata table rendering

---

## 7. Badge Modal Section (Lines 4721-4799)
**Badge Preview Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `updateBadgePreview()` | 4765 | update* |

**Section Summary:** 1 handler for badge preview updates

---

## 8. OG Generator Section (Lines 5072-5427)
**OG Content Generation Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `handleBgTypeChange()` | 5106 | handle* |
| `handleBgImageUpload(e)` | 5117 | handle* |
| `handleLogoPosChange()` | 5133 | handle* |
| `handleLogoUpload(e)` | 5140 | handle* |
| `updateOggenCanvas()` | 5156 | update* |

**Section Summary:** 5 handlers for OG generator UI (4 direct handlers, 1 update)

---

## 9. Compare Mode Functions Section (Lines 5428-5869)
**Compare Mode Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `handleSwapUrls()` | 5499 | handle* |

**Section Summary:** 1 handler for URL swapping in compare mode

---

## 10. Sitemap Mode Functions Section (Lines 5870-6208)
**Heatmap Sorting Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `handleHeatmapSort()` | 6101 | handle* |

**Section Summary:** 1 handler for heatmap sorting

---

## 11. Guard Flags for Race Conditions Section (Lines 6272-6851)
**Character Gauge Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `toggleCharGaugeGroup(groupId)` | 6529 | toggle* |
| `toggleAllCharGauges(fieldId)` | 6549 | toggle* |
| `handleEditorInput(e)` | 6589 | handle* |
| `updateEditorFieldImpactLabels(data)` | 6322 | update* |
| `updateEditorCharCounts()` | 6382 | update* |
| `updateEditedCardsInPlace(data)` | 6708 | update* |
| `updatePreviewsWithEdits()` | 6737 | update* |
| `applyRescore()` | 6669 | apply* |

**Section Summary:** 8 handlers for editor and character gauge management (2 toggles, 1 handle, 4 updates, 1 apply)

---

## 12. Template Library Section (Lines 7214-7662)
**Template Application Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `applyTemplate(templateId)` | 7634 | apply* |

**Section Summary:** 1 handler for template application

---

## 13. Platform Customization Section (Lines 7705-7884)
**Platform Display Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `updateColumnLayoutUI()` | 7859 | update* |
| `toggleFavorite(pid)` | 7867 | toggle* |
| `toggleHidden(pid)` | 7977 | toggle* |
| `updateFavoritesList()` | 7990 | update* |
| `updateHiddenList()` | 8012 | update* |

**Section Summary:** 5 handlers for platform customization UI (2 toggles, 3 updates)

---

## 14. Centralized Guard Functions for Filter Operations Section (Lines 7885-8116)
**Filter Operation Management Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `shouldDeferFilterOperation()` | 7891 | filter management |
| `isSmartOrdering()` | 7933 | filter management |
| `queueFilterOperation(operation, description)` | 7942 | filter management |
| `processPendingFilterOperations()` | 7952 | filter management |

**Section Summary:** 4 centralized guard functions for filter operations during smart ordering

---

## 15. What If Toggle Section (Lines 8117-8335)
**What If Mode Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `toggleWhatIfMode()` | 8121 | toggle* |
| `applyWhatIfChanges()` | 8241 | apply* |
| `applyPendingWhatIfTags()` | 8286 | apply* |

**Section Summary:** 3 handlers for What If mode functionality

---

## 16. Inline Card Editing Section (Lines 8336-8406)
**Inline Edit Synchronization Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `syncInlineEditToEditor(tag, value)` | 8385 | sync* |

**Section Summary:** 1 handler for inline edit synchronization

---

## 17. Diagnostic Tracking Section (Lines 8407-8642)
**Diagnostic Fix Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `applyDiagnosticFix(index)` | 8478 | apply* |
| `updateDiagnosticProgress()` | 8610 | update* |

**Section Summary:** 2 handlers for diagnostic tracking and fixes

---

## 18. Smart Platform Ordering Section (Lines 8643-8944)
**Smart Ordering Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `applySmartOrdering()` | 8744 | apply* |
| `applySmartOrderingSafe()` | 8988 | apply* |

**Section Summary:** 2 handlers for smart platform ordering

---

## 19. Command Palette Section (Lines 9048-9232)
**Command Palette Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `toggleCommandPalette()` | 9105 | toggle* |
| `updateCommandActiveDescendant()` | 9170 | update* |
| `filterCommands(e)` | 9177 | filter* |
| `handleCommandKeydown(e)` | 9194 | handle* |

**Section Summary:** 4 handlers for command palette UI and navigation

---

## 20. Global Keyboard Shortcuts Section (Lines 9233-9427)
**No dedicated filter change handlers in this section**

**Section Summary:** This section handles global keyboard shortcuts but doesn't contain filter change handlers

---

## 21. Card Drag and Drop Section (Lines 9516-9661)
**Drag and Drop Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `handleDragStart(e)` | 9532 | handle* |
| `handleDragEnd(e)` | 9540 | handle* |
| `handleDragOver(e)` | 9547 | handle* |
| `handleDragEnter(e)` | 9555 | handle* |
| `handleDragLeave(e)` | 9561 | handle* |
| `handleDrop(e)` | 9565 | handle* |

**Section Summary:** 6 handlers for card drag and drop interactions

---

## 22. Card Context Menu Section (Lines 9662-9806)
**Context Menu Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `handleContextMenuAction(e)` | 9771 | handle* |

**Section Summary:** 1 handler for context menu actions

---

## 23. Mobile Swipe & Long-Press Support Section (Lines 9807-9998)
**Touch Event Handlers**

| Handler Name | Line Number | Pattern |
|-------------|-------------|---------|
| `handleTouchStart(e)` | 9828 | handle* |
| `handleTouchEnd(e)` | 9853 | handle* |
| `handleTouchMove(e)` | 9888 | handle* |
| `handleHorizontalSwipe(deltaX, card)` | 9908 | handle* |
| `handleVerticalSwipe(deltaY, card)` | 9969 | handle* |

**Section Summary:** 5 handlers for mobile touch interactions

---

## Summary by Handler Pattern

### `handle*` Pattern (20 handlers)
- **Theme & OG Generator:** 5 handlers (lines 94, 5106, 5117, 5133, 5140)
- **Compare & Sitemap:** 2 handlers (lines 5499, 6101) 
- **Editor:** 1 handler (line 6589)
- **Command Palette:** 1 handler (line 9194)
- **Drag and Drop:** 6 handlers (lines 9532, 9540, 9547, 9555, 9561, 9565)
- **Context Menu:** 1 handler (line 9771)
- **Mobile Touch:** 5 handlers (lines 9828, 9853, 9888, 9908, 9969)

### `toggle*` Pattern (9 handlers)
- **Global State:** 1 handler (line 108)
- **Platform Cards:** 2 handlers (lines 2162, 2175)
- **Character Gauges:** 2 handlers (lines 6529, 6549)
- **Platform Customization:** 2 handlers (lines 7867, 7977)
- **Special Modes:** 2 handlers (lines 8121, 9105)

### `update*` Pattern (17 handlers)
- **Hash & Diagnostics:** 2 handlers (lines 404, 900)
- **Previews & Cards:** 4 handlers (lines 1930, 2186, 6708, 6737)
- **Cropper:** 2 handlers (lines 3551, 3600)
- **Editor:** 3 handlers (lines 6322, 6382, 7859)
- **Platform Lists:** 2 handlers (lines 7990, 8012)
- **UI Components:** 4 handlers (lines 4765, 5156, 8610, 9170)

### `apply*` Pattern (8 handlers)
- **Theme:** 1 handler (line 94)
- **Editor:** 1 handler (line 6669)
- **Templates:** 1 handler (line 7634)
- **What If Mode:** 2 handlers (lines 8241, 8286)
- **Diagnostics:** 1 handler (line 8478)
- **Smart Ordering:** 2 handlers (lines 8744, 8988)

### `sync*` Pattern (2 handlers)
- **Cropper:** 1 handler (line 3530)
- **Inline Editing:** 1 handler (line 8385)

### `filter*` Pattern (2 handlers)
- **Metadata:** 1 handler (line 3941)
- **Command Palette:** 1 handler (line 9177)

### Filter Management (4 handlers)
- **Smart Ordering Guards:** 4 handlers (lines 7891, 7933, 7942, 7952)

---

## Total Distribution by Section Type

| Section Type | Handler Count | Percentage |
|--------------|--------------|------------|
| **Theme & Appearance** | 3 | 5% |
| **Core Inspection** | 2 | 3% |
| **Platform Display** | 8 | 13% |
| **Editor & Input** | 8 | 13% |
| **Smart Ordering** | 6 | 10% |
| **Drag & Drop** | 6 | 10% |
| **Mobile Touch** | 5 | 8% |
| **Command Palette** | 4 | 6% |
| **What If Mode** | 3 | 5% |
| **Platform Customization** | 5 | 8% |
| **Diagnostics** | 4 | 6% |
| **Template System** | 1 | 2% |
| **Compare Mode** | 1 | 2% |
| **Sitemap Mode** | 1 | 2% |
| **Filter Management** | 4 | 6% |
| **OG Generator** | 5 | 8% |
| **Other** | 1 | 2% |

**Total:** 62 filter change handlers across 23 functional sections

---

## Key Insights

1. **Platform Display & Editor sections** are the most handler-dense areas (13 handlers each, 26% combined)
2. **Smart Ordering ecosystem** spans multiple sections with 6 total handlers plus 4 guard functions
3. **Touch interactions** have dedicated handlers in a single section (5 handlers)
4. **Drag and Drop** is highly compartmentalized (6 handlers in one section)
5. **Filter operation management** is centralized with dedicated guard functions

## Data Source
- Handler catalog: bead bf-5xxsl-filter-change-handler-catalog.md
- Source file: `/home/coding/vista/src/public/app.js` (9998 lines)
- Pattern reference: bead bf-654ze-filter-change-handler-patterns.md
