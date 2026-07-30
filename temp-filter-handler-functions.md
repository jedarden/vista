# Filter Change Handler Functions in app.js

## Task: bf-1mztb - Identify filter change handler function signatures

**File:** `/home/coding/vista/src/public/app.js`

---

## Named Filter Handler Functions

| Line | Function Name | Signature | Purpose |
|------|---------------|-----------|---------|
| 3941 | `renderMetadataTable` | `function renderMetadataTable(filter = '')` | Renders metadata table with optional filter string |
| 5106 | `handleBgTypeChange` | `function handleBgTypeChange()` | Handles background type change in OG generator |
| 5117 | `handleBgImageUpload` | `function handleBgImageUpload(e)` | Handles background image upload |
| 5133 | `handleLogoPosChange` | `function handleLogoPosChange()` | Handles logo position change |
| 5140 | `handleLogoUpload` | `function handleLogoUpload(e)` | Handles logo upload |
| 6101 | `handleHeatmapSort` | `function handleHeatmapSort()` | Handles heatmap sorting changes |
| 6589 | `handleEditorInput` | `function handleEditorInput(e)` | Handles editor input changes |
| 6853 | `generateCodeSnippet` | `function generateCodeSnippet()` | Generates code snippet (triggered by change event) |
| 7867 | `toggleFavorite` | `function toggleFavorite(pid)` | Toggles favorite status for a platform |
| 7891 | `shouldDeferFilterOperation` | `function shouldDeferFilterOperation()` | Checks if filter operation should be deferred during smart ordering |
| 7942 | `queueFilterOperation` | `function queueFilterOperation(operation, description)` | Queues a filter operation to process after smart ordering completes |
| 7952 | `processPendingFilterOperations` | `function processPendingFilterOperations()` | Processes pending filter operations after smart ordering completes |
| 7977 | `toggleHidden` | `function toggleHidden(pid)` | Toggles hidden status for a platform |
| 7990 | `updateFavoritesList` | `function updateFavoritesList()` | Updates the favorites list UI |
| 8012 | `updateHiddenList` | `function updateHiddenList()` | Updates the hidden list UI |
| 8057 | `importPreferences` | `function importPreferences(e)` | Imports preferences (triggered by file input change) |
| 9177 | `filterCommands` | `function filterCommands(e)` | Filters command palette commands |

---

## Inline/Anonymous Filter Event Handlers

| Line | Element | Event | Handler Action |
|------|---------|-------|----------------|
| 3991 | `filterInput` (metadataFilterInput) | `input` | Calls `renderMetadataTable(e.target.value)` |
| 9085 | `input` (command palette) | `input` | Calls `filterCommands` |
| 3481 | `.cropper-group-toggle` | `change` | Updates platform checkboxes and calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()` |
| 3497 | `.cropper-platform-toggle input` | `change` | Calls `updateEnabledPlatforms()`, `updateCropperOverlay()`, `syncGroupToggles()` |

---

## Related Filter UI Update Functions

| Line | Function Name | Signature | Purpose |
|------|---------------|-----------|---------|
| 404 | `updateHash` | `function updateHash(options = {})` | Updates URL hash |
| 900 | `updateDiagnostics` | `function updateDiagnostics(data)` | Updates diagnostic display |
| 1930 | `updatePreviewsWithImages` | `function updatePreviewsWithImages(data)` | Updates platform card previews with images |
| 2186 | `updateCardHeader` | `function updateCardHeader(pid)` | Updates a single platform card header |
| 3551 | `updateEnabledPlatforms` | `function updateEnabledPlatforms()` | Updates enabled platforms set |
| 3600 | `updateCropperOverlay` | `function updateCropperOverlay()` | Updates cropper overlay display |
| 4765 | `updateBadgePreview` | `function updateBadgePreview()` | Updates badge preview |
| 5156 | `updateOggenCanvas` | `function updateOggenCanvas()` | Updates OG generator canvas |
| 6322 | `updateEditorFieldImpactLabels` | `function updateEditorFieldImpactLabels(data)` | Updates editor field impact labels |
| 6382 | `updateEditorCharCounts` | `function updateEditorCharCounts()` | Updates editor character counts |
| 6708 | `updateEditedCardsInPlace` | `function updateEditedCardsInPlace(data)` | Updates edited cards in-place |
| 6737 | `updatePreviewsWithEdits` | `function updatePreviewsWithEdits()` | Updates previews with edits applied |
| 7859 | `updateColumnLayoutUI` | `function updateColumnLayoutUI()` | Updates column layout UI |
| 8610 | `updateDiagnosticProgress` | `function updateDiagnosticProgress()` | Updates diagnostic progress display |
| 9170 | `updateCommandActiveDescendant` | `function updateCommandActiveDescendant()` | Updates command active descendant for ARIA |

---

## Other Event Listeners Related to Filtering

| Line | Element | Event | Handler Function |
|------|---------|-------|------------------|
| 296 | `badgeStyleSelect` | `change` | `updateBadgePreview` |
| 310 | `oggenBgType` | `change` | `handleBgTypeChange` |
| 311 | `oggenBgColor` | `input` | `updateOggenCanvas` |
| 312 | `oggenGradientStart` | `input` | `updateOggenCanvas` |
| 313 | `oggenGradientEnd` | `input` | `updateOggenCanvas` |
| 314 | `oggenGradientDir` | `change` | `updateOggenCanvas` |
| 315 | `oggenBgImageInput` | `change` | `handleBgImageUpload` |
| 316 | `oggenBgImageSize` | `change` | `updateOggenCanvas` |
| 317 | `oggenTitle` | `input` | `updateOggenCanvas` |
| 318 | `oggenSubtitle` | `input` | `updateOggenCanvas` |
| 319 | `oggenFont` | `change` | `updateOggenCanvas` |
| 320 | `oggenTextColor` | `input` | `updateOggenCanvas` |
| 321 | `oggenLogoPos` | `change` | `handleLogoPosChange` |
| 322 | `oggenLogoInput` | `change` | `handleLogoUpload` |
| 323 | `oggenLogoSize` | `input` | `updateOggenCanvas` |
| 332 | `heatmapSort` | `change` | `handleHeatmapSort` |
| 6801 | Editor input | `input` | `handleEditorInput` |
| 6813 | `snippetFramework` | `change` | `generateCodeSnippet` |
| 6831 | `importPrefsInput` | `change` | `importPreferences` |
| 8207 | Checkbox (unspecified) | `change` | Inline handler |

---

## Summary

**Total named filter-related handler functions found: 17**
**Total inline/anonymous filter event handlers: 4**
**Total related update functions: 17**
**Total event listeners attached to filter-related elements: 20**

The filter handlers fall into these categories:
1. **Metadata filtering** - `renderMetadataTable`, `filterCommands`
2. **Platform visibility filtering** - `toggleFavorite`, `toggleHidden`, `updateFavoritesList`, `updateHiddenList`
3. **Smart ordering coordination** - `shouldDeferFilterOperation`, `queueFilterOperation`, `processPendingFilterOperations`
4. **OG generator controls** - `handleBgTypeChange`, `handleLogoPosChange`, `handleBgImageUpload`, `handleLogoUpload`, `updateOggenCanvas`
5. **Editor filtering** - `handleEditorInput`, `generateCodeSnippet`
6. **UI update functions** - Various `update*` functions that refresh the UI after filter changes

**Generated:** 2026-07-24
