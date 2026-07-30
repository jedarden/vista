# BF-4LDX1: Change Event Listener Extraction

## Task
Search app.js and extract all change event listener statements with their line numbers.

## Results
Found 14 change event listeners in `/home/coding/vista/src/public/app.js`:

### Named Function Handlers (9)
1. **Line 296**: `badgeStyleSelect` → `updateBadgePreview`
2. **Line 310**: `oggenBgType` → `handleBgTypeChange`
3. **Line 314**: `oggenGradientDir` → `updateOggenCanvas`
4. **Line 315**: `oggenBgImageInput` → `handleBgImageUpload`
5. **Line 316**: `oggenBgImageSize` → `updateOggenCanvas`
6. **Line 319**: `oggenFont` → `updateOggenCanvas`
7. **Line 321**: `oggenLogoPos` → `handleLogoPosChange`
8. **Line 322**: `oggenLogoInput` → `handleLogoUpload`
9. **Line 332**: `heatmapSort` → `handleHeatmapSort`
10. **Line 6813**: `snippetFramework` → `generateCodeSnippet`
11. **Line 6831**: `importPrefsInput` → `importPreferences`

### Inline Arrow Function Handlers (3)
1. **Line 3481**: `.cropper-group-toggle` → group checkbox sync logic
2. **Line 3497**: `.cropper-platform-toggle input` → platform update logic
3. **Line 8207**: `.what-if-toggle input` → what-if panel toggle logic

## Output
Intermediate output saved to: `/tmp/change-listeners-line-numbers.txt`

## Completion
All acceptance criteria met:
- ✅ Extracted all addEventListener('change', ...) calls
- ✅ Recorded line numbers for each listener
- ✅ Identified handler function names or inline functions
- ✅ Saved intermediate output file
