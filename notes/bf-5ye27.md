# Filter Change Event Bindings Analysis

## Search Results Summary

This document systematically reports all filter change event bindings found in `/home/coding/vista/src/public/app.js`.

## 1. addEventListener('change') Bindings

### 1.1 Badge/OG Generator Controls (Not Filter-Related)
- `badgeStyleSelect?.addEventListener('change', updateBadgePreview)` (line 296)
- `oggenBgType?.addEventListener('change', handleBgTypeChange)` (line 310)
- `oggenGradientDir?.addEventListener('change', updateOggenCanvas)` (line 314)
- `oggenBgImageInput?.addEventListener('change', handleBgImageUpload)` (line 315)
- `oggenBgImageSize?.addEventListener('change', updateOggenCanvas)` (line 316)
- `oggenFont?.addEventListener('change', updateOggenCanvas)` (line 319)
- `oggenLogoPos?.addEventListener('change', handleLogoPosChange)` (line 321)
- `oggenLogoInput?.addEventListener('change', handleLogoUpload)` (line 322)

### 1.2 Heatmap Sort Filter (Filter-Related)
- `heatmapSort?.addEventListener('change', handleHeatmapSort)` (line 332)

### 1.3 Cropper Platform/Group Toggles (Filter-Related)
- `groupCb.addEventListener('change', (e) => {...})` (line 3481) - Group checkboxes
- `cb.addEventListener('change', () => {...})` (line 3497) - Individual platform checkboxes

### 1.4 What-If Metadata Toggles (Filter-Related)
- `panel.querySelectorAll('.what-if-toggle input').forEach(cb => { cb.addEventListener('change', () => {...}) })` (line 8207)

### 1.5 Other Controls (Not Filter-Related)
- `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet)` (line 6813)
- `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)` (line 6831)

## 2. addEventListener('input') Bindings (Text Filter Patterns)

### 2.1 Metadata Filter Input (Filter-Related)
- `filterInput.addEventListener('input', (e) => {...})` (line 3991)
  - Element: `#metadataFilterInput`
  - Pattern: Uses `input` event for real-time text filtering

### 2.2 Commands Filter (Filter-Related)
- `input.addEventListener('input', filterCommands)` (line 9085)
  - Pattern: Command palette filtering with `input` event

## 3. jQuery Event Bindings

### 3.1 jQuery .change() Calls
**None found** - No jQuery `.change()` bindings detected in app.js

### 3.2 jQuery .on('change') Calls  
**None found** - No jQuery `.on('change')` bindings detected in app.js

### 3.3 Other jQuery .on() Bindings
**None found** - No jQuery `.on()` event bindings detected in app.js

## 4. Inline Event Handlers

### 4.1 onchange Attributes
**None found** - No inline `onchange=` attributes detected in app.js

## 5. Filter-Related Elements Summary

### Primary Filter Elements:
1. **heatmapSort** - Sort/filter dropdown for heatmap data (line 218, 332)
2. **metadataFilterInput** - Text input for filtering metadata tags (line 3989, 3991)
3. **cropper-group-toggle** - Checkboxes for filtering by platform groups (line 3480)
4. **cropper-platform-toggle** - Checkboxes for filtering by individual platforms (line 3496)
5. **what-if-toggle** - Checkboxes for filtering metadata tags in what-if mode (line 8206)
6. **Command palette input** - Text input for filtering commands (line 9085)

## 6. Binding Patterns Found

### Pattern 1: Direct addEventListener with Optional Chaining
```javascript
element?.addEventListener('change', handlerFunction);
```
Examples: `heatmapSort?.addEventListener('change', handleHeatmapSort)`

### Pattern 2: forEach with addEventListener  
```javascript
document.querySelectorAll(selector).forEach(element => {
  element.addEventListener('change', handlerFunction);
});
```
Examples: Group toggles, platform toggles, what-if toggles

### Pattern 3: Real-time Input Filtering
```javascript
element.addEventListener('input', handlerFunction);
```
Examples: `metadataFilterInput`, command palette input

## 7. Raw List of Bound Filter Elements

| Element | Event Type | Handler | Line | Category |
|---------|-----------|---------|------|----------|
| heatmapSort | change | handleHeatmapSort | 332 | Dropdown filter |
| metadataFilterInput | input | (inline) | 3991 | Text filter |
| .cropper-group-toggle | change | (inline) | 3481 | Group checkboxes |
| .cropper-platform-toggle | change | (inline) | 3497 | Platform checkboxes |
| .what-if-toggle input | change | (inline) | 8207 | Metadata toggles |
| Command palette input | input | filterCommands | 9085 | Command filter |

## 8. Filter Operation Guard System

The codebase includes a sophisticated guard system for managing filter operations during smart ordering:

- **isFilterOperation** flag (line 6279): Prevents smart order resets during filter changes
- **pendingFilterOperations** queue (line 6281): Defers filter operations during smart ordering
- **shouldDeferFilterOperation()** function (line 7891): Checks if filter should be deferred
- **queueFilterOperation()** function (line 7942): Queues filter operations
- **processPendingFilterOperations()** function (line 7950): Processes queued operations

## Conclusion

**Total filter change event bindings found:** 6 unique elements/patterns
**jQuery .change() bindings:** 0
**jQuery .on('change') bindings:** 0  
**addEventListener('change') bindings:** 4 filter-related
**addEventListener('input') bindings:** 2 filter-related (real-time text filters)

The application exclusively uses modern vanilla JavaScript `addEventListener` patterns for filter bindings, with no jQuery event bindings detected.