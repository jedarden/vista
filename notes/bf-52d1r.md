# Filter Change Handlers Extraction from app.js

This document lists all filter change handlers found in `/home/coding/vista/src/public/app.js`.

## Summary of Filter Change Handlers

### 1. Metadata Filter Input Handler
- **DOM Element**: `#metadataFilterInput` (text input)
- **Event Type**: `input` (not change - real-time filtering)
- **Handler**: Inline function `renderMetadataTable(e.target.value)`
- **Line**: 3991
- **Context**: Used in `renderMetadataTable()` function to filter tags
- **Code**:
  ```javascript
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
  ```

### 2. Command Palette Filter Handler
- **DOM Element**: `#commandInput` (text input in command palette)
- **Event Type**: `input`
- **Handler Function**: `filterCommands`
- **Line**: 9085
- **Function Definition**: Line 9177
- **Context**: Filters command palette options based on user input
- **Code**:
  ```javascript
  input.addEventListener('input', filterCommands);
  
  function filterCommands(e) {
    const query = e.target.value.toLowerCase().trim();
    commandPaletteSelectedIndex = 0;
    // ... filtering logic
  }
  ```

### 3. Badge Style Selector Handler
- **DOM Element**: `#badgeStyleSelect` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `updateBadgePreview`
- **Line**: 296
- **Function Definition**: Line 4765
- **Context**: Updates QR code badge preview when style is changed
- **Code**:
  ```javascript
  badgeStyleSelect?.addEventListener('change', updateBadgePreview);
  ```

### 4. OG Generator Background Type Handler
- **DOM Element**: `#oggenBgType` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `handleBgTypeChange`
- **Line**: 310
- **Function Definition**: Line 5106
- **Context**: Switches between gradient, solid color, and image background types in OG generator
- **Code**:
  ```javascript
  oggenBgType?.addEventListener('change', handleBgTypeChange);
  ```

### 5. OG Generator Gradient Direction Handler
- **DOM Element**: `#oggenGradientDir` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `updateOggenCanvas`
- **Line**: 314
- **Function Definition**: Line 5156
- **Context**: Updates OG canvas when gradient direction changes
- **Code**:
  ```javascript
  oggenGradientDir?.addEventListener('change', updateOggenCanvas);
  ```

### 6. OG Generator Background Image Upload Handler
- **DOM Element**: `#oggenBgImageInput` (file input)
- **Event Type**: `change`
- **Handler Function**: `handleBgImageUpload`
- **Line**: 315
- **Function Definition**: Line 5117
- **Context**: Handles background image upload for OG generator
- **Code**:
  ```javascript
  oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
  ```

### 7. OG Generator Background Image Size Handler
- **DOM Element**: `#oggenBgImageSize` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `updateOggenCanvas`
- **Line**: 316
- **Function Definition**: Line 5156
- **Context**: Updates OG canvas when background image size changes
- **Code**:
  ```javascript
  oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
  ```

### 8. OG Generator Font Selector Handler
- **DOM Element**: `#oggenFont` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `updateOggenCanvas`
- **Line**: 319
- **Function Definition**: Line 5156
- **Context**: Updates OG canvas when font is changed
- **Code**:
  ```javascript
  oggenFont?.addEventListener('change', updateOggenCanvas);
  ```

### 9. OG Generator Logo Position Handler
- **DOM Element**: `#oggenLogoPos` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `handleLogoPosChange`
- **Line**: 321
- **Function Definition**: Line 5133
- **Context**: Handles logo position changes in OG generator
- **Code**:
  ```javascript
  oggenLogoPos?.addEventListener('change', handleLogoPosChange);
  ```

### 10. OG Generator Logo Upload Handler
- **DOM Element**: `#oggenLogoInput` (file input)
- **Event Type**: `change`
- **Handler Function**: `handleLogoUpload`
- **Line**: 322
- **Function Definition**: Line 5140
- **Context**: Handles logo upload for OG generator
- **Code**:
  ```javascript
  oggenLogoInput?.addEventListener('change', handleLogoUpload);
  ```

### 11. Heatmap Sort Handler
- **DOM Element**: `#heatmapSort` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `handleHeatmapSort`
- **Line**: 332
- **Function Definition**: Line 6101
- **Context**: Handles heatmap sorting when sort option changes
- **Code**:
  ```javascript
  heatmapSort?.addEventListener('change', handleHeatmapSort);
  ```

### 12. Code Snippet Framework Selector Handler
- **DOM Element**: `#snippetFramework` (select dropdown)
- **Event Type**: `change`
- **Handler Function**: `generateCodeSnippet`
- **Line**: 6813
- **Function Definition**: Line 6853
- **Context**: Generates code snippet when framework is selected
- **Code**:
  ```javascript
  document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
  ```

### 13. Import Preferences Handler
- **DOM Element**: `#importPrefsInput` (file input)
- **Event Type**: `change`
- **Handler Function**: `importPreferences`
- **Line**: 6831
- **Function Definition**: Line 8057
- **Context**: Handles importing user preferences from JSON file
- **Code**:
  ```javascript
  document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
  ```

### 14. Cropper Group Toggle Handler
- **DOM Element**: `.cropper-group-toggle` (checkbox inputs)
- **Event Type**: `change`
- **Handler**: Inline function (toggles all platforms in group)
- **Line**: 3481
- **Context**: Platform cropper modal - toggles entire platform groups
- **Code**:
  ```javascript
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
  ```

### 15. Cropper Platform Toggle Handler
- **DOM Element**: `.cropper-platform-toggle input` (checkbox inputs)
- **Event Type**: `change`
- **Handler**: Inline function (updates cropper overlay)
- **Line**: 3497
- **Context**: Platform cropper modal - toggles individual platforms
- **Code**:
  ```javascript
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
  ```

### 16. What-If Tag Toggle Handler
- **DOM Element**: `.what-if-toggle input` (checkbox inputs)
- **Event Type**: `change`
- **Handler**: Inline function (manages disabled tags set)
- **Line**: 8207
- **Context**: What-if mode panel - enables/disables tags for analysis
- **Code**:
  ```javascript
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
  ```

## Filter Operation Queue Functions

### Centralized Guard Functions

The app.js includes centralized guard functions for managing filter operations during smart ordering:

1. **shouldDeferFilterOperation()** (Line 7891)
   - Determines if a filter operation should be deferred

2. **queueFilterOperation(operation, description)** (Line 7942)
   - Queues filter operations to prevent conflicts with smart ordering
   - Exported to window: Line 5055

3. **processPendingFilterOperations()** (Line 7952)
   - Processes queued filter operations
   - Exported to window: Line 5056

These functions help prevent race conditions between filter changes and smart ordering operations.

## Notes

- All optional chaining (`?.`) is used for DOM elements that may not exist in all contexts
- The `input` event type provides real-time filtering (vs `change` which only fires on blur)
- Several OG generator controls share the same `updateOggenCanvas` handler
- Platform cropper and what-if mode use inline handlers for complex checkbox group logic
- Filter operation queue prevents conflicts with smart ordering system

## DOM Element References

All DOM element references are established early in the file (lines 169-218):
- `badgeStyleSelect`: Line 169
- `oggenBgType`: Line 186
- `oggenGradientDir`: Line 191
- `oggenBgImageInput`: Line 193
- `oggenBgImageSize`: Line 194
- `oggenFont`: Line 198
- `oggenLogoPos`: Line 200
- `oggenLogoInput`: Line 201
- `heatmapSort`: Line 218

Generated for bead bf-52d1r
