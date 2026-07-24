# Filter Change Handler to DOM Element Mapping

## Overview
This document maps all filter change handlers in `/home/coding/vista/src/public/app.js` to their corresponding DOM elements.

## Change Event Handlers

### 1. Badge Style Selector
- **Handler Function**: `updateBadgePreview`
- **DOM Element**: `#badgeStyleSelect`
- **Element Definition**: Line 169
- **Handler Registration**: Line 296
- **Selector**: `const badgeStyleSelect = $('#badgeStyleSelect');`
- **Event Type**: `change`

### 2. OG Generator Background Type
- **Handler Function**: `handleBgTypeChange`
- **DOM Element**: `#oggenBgType`
- **Element Definition**: Line 186
- **Handler Registration**: Line 310
- **Selector**: `const oggenBgType = $('#oggenBgType');`
- **Event Type**: `change`

### 3. OG Generator Gradient Direction
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenGradientDir`
- **Element Definition**: Line 191
- **Handler Registration**: Line 314
- **Selector**: `const oggenGradientDir = $('#oggenGradientDir');`
- **Event Type**: `change`

### 4. OG Generator Background Image Input
- **Handler Function**: `handleBgImageUpload`
- **DOM Element**: `#oggenBgImageInput`
- **Element Definition**: Line 193
- **Handler Registration**: Line 315
- **Selector**: `const oggenBgImageInput = $('#oggenBgImageInput');`
- **Event Type**: `change`

### 5. OG Generator Background Image Size
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenBgImageSize`
- **Element Definition**: Line 194
- **Handler Registration**: Line 316
- **Selector**: `const oggenBgImageSize = $('#oggenBgImageSize');`
- **Event Type**: `change`

### 6. OG Generator Font Selection
- **Handler Function**: `updateOggenCanvas`
- **DOM Element**: `#oggenFont`
- **Element Definition**: Line 198
- **Handler Registration**: Line 319
- **Selector**: `const oggenFont = $('#oggenFont');`
- **Event Type**: `change`

### 7. OG Generator Logo Position
- **Handler Function**: `handleLogoPosChange`
- **DOM Element**: `#oggenLogoPos`
- **Element Definition**: Line 200
- **Handler Registration**: Line 321
- **Selector**: `const oggenLogoPos = $('#oggenLogoPos');`
- **Event Type**: `change`

### 8. OG Generator Logo Input
- **Handler Function**: `handleLogoUpload`
- **DOM Element**: `#oggenLogoInput`
- **Element Definition**: Line 201
- **Handler Registration**: Line 322
- **Selector**: `const oggenLogoInput = $('#oggenLogoInput');`
- **Event Type**: `change`

### 9. Heatmap Sort Dropdown
- **Handler Function**: `handleHeatmapSort`
- **DOM Element**: `#heatmapSort`
- **Element Definition**: Line 218
- **Handler Registration**: Line 332
- **Selector**: `const heatmapSort = $('#heatmapSort');`
- **Event Type**: `change`

### 10. Metadata Filter Input
- **Handler Function**: `renderMetadataTable` (inline arrow function)
- **DOM Element**: `#metadataFilterInput`
- **Element Definition**: Dynamic (created at runtime, line 3952)
- **Handler Registration**: Line 3991
- **Selector**: `const filterInput = document.getElementById('metadataFilterInput');`
- **Event Type**: `input`
- **Context**: Created within `renderMetadataTable()` function

### 11. Cropper Group Toggles (Dynamic)
- **Handler Function**: Inline arrow function for group platform toggling
- **DOM Element**: `<input type="checkbox" class="cropper-group-toggle">` with `data-group` attribute
- **Element Definition**: Dynamic (created at runtime in cropper controls)
- **Handler Registration**: Line 3481
- **Selector**: `document.querySelectorAll('.cropper-group-toggle')`
- **Event Type**: `change`
- **Purpose**: Toggles all platforms within a group

### 12. Cropper Platform Toggles (Dynamic)
- **Handler Function**: Inline arrow function calling `updateEnabledPlatforms()` and `updateCropperOverlay()`
- **DOM Element**: `<input type="checkbox" data-platform="${pid}">` within `.cropper-platform-toggle`
- **Element Definition**: Dynamic (created at runtime in cropper controls)
- **Handler Registration**: Line 3497
- **Selector**: `document.querySelectorAll('.cropper-platform-toggle input')`
- **Event Type**: `change`
- **Purpose**: Toggles individual platform visibility

### 13. Code Snippet Framework Selector
- **Handler Function**: `generateCodeSnippet`
- **DOM Element**: `#snippetFramework`
- **Element Definition**: Dynamic
- **Handler Registration**: Line 6813
- **Selector**: `document.getElementById('snippetFramework')`
- **Event Type**: `change`

### 14. Import Preferences Input
- **Handler Function**: `importPreferences`
- **DOM Element**: `#importPrefsInput`
- **Element Definition**: Dynamic
- **Handler Registration**: Line 6831
- **Selector**: `document.getElementById('importPrefsInput')`
- **Event Type**: `change`
- **Purpose**: File input for importing platform preferences

### 15. Editor Inputs (Dynamic)
- **Handler Function**: `handleEditorInput`
- **DOM Elements**: Elements with `.editor-input`, `.editor-textarea`, or `.editor-select` classes
- **Element Definition**: Dynamic (created in editor modal)
- **Handler Registration**: Line 7647
- **Selector**: `document.querySelectorAll('.editor-input, .editor-textarea, .editor-select')`
- **Event Type**: `input`

### 16. What-If Panel Tag Toggles (Dynamic)
- **Handler Function**: Inline arrow function for what-if mode simulation
- **DOM Element**: `<input type="checkbox" data-tag="${tag}">` within `#whatIfPanel .what-if-toggle`
- **Element Definition**: Dynamic (created in what-if panel)
- **Handler Registration**: Line 8207
- **Selector**: `panel.querySelectorAll('.what-if-toggle input')`
- **Event Type**: `change`
- **Purpose**: Toggles Open Graph and Twitter Card tags for what-if simulations

### 17. Command Palette Filter Input (Dynamic)
- **Handler Function**: `filterCommands`
- **DOM Element**: Command palette input field
- **Element Definition**: Dynamic (created in command palette)
- **Handler Registration**: Line 9085
- **Selector**: `const input` (within command palette creation)
- **Event Type**: `input`
- **Purpose**: Filters command palette commands

## Summary Statistics

- **Total Change Handlers**: 17
- **Static Elements (defined at init)**: 9
- **Dynamic Elements (created at runtime)**: 8
- **OG Generator Controls**: 7 handlers
- **Cropper Controls**: 2 handlers
- **Editor/What-If**: 3 handlers
- **Other**: 5 handlers

## Line Number Reference

| Handler | Element Def | Handler Reg | Handler Name |
|---------|-------------|-------------|--------------|
| badgeStyleSelect | 169 | 296 | updateBadgePreview |
| oggenBgType | 186 | 310 | handleBgTypeChange |
| oggenGradientDir | 191 | 314 | updateOggenCanvas |
| oggenBgImageInput | 193 | 315 | handleBgImageUpload |
| oggenBgImageSize | 194 | 316 | updateOggenCanvas |
| oggenFont | 198 | 319 | updateOggenCanvas |
| oggenLogoPos | 200 | 321 | handleLogoPosChange |
| oggenLogoInput | 201 | 322 | handleLogoUpload |
| heatmapSort | 218 | 332 | handleHeatmapSort |
| metadataFilterInput | 3952 | 3991 | renderMetadataTable (inline) |
| cropper-group-toggle | dynamic | 3481 | group toggle (inline) |
| cropper-platform-toggle | dynamic | 3497 | platform toggle (inline) |
| snippetFramework | dynamic | 6813 | generateCodeSnippet |
| importPrefsInput | dynamic | 6831 | importPreferences |
| editor-inputs | dynamic | 7647 | handleEditorInput |
| what-if-toggle | dynamic | 8207 | what-if toggle (inline) |
| command-palette | dynamic | 9085 | filterCommands |

## Notes

1. **Dynamic Elements**: Many handlers are attached to elements created dynamically at runtime. These are typically found in modal dialogs, panels, or dynamically generated content areas.

2. **Event Types**: Most handlers use `change` events, but some (like filter inputs) use `input` events for real-time filtering.

3. **Selector Helper**: The code uses a `$()` helper function (likely `document.querySelector`) for selecting elements.

4. **Inline Functions**: Several handlers use inline arrow functions rather than named handler functions.

5. **Platform Filtering**: The cropper controls provide sophisticated filtering with both group-level and individual platform toggles.

6. **OG Generator**: Has the most filter controls with 7 separate change handlers for different aspects of Open Graph image generation.
