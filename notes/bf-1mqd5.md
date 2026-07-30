# Filter Change Event Listener Search Results

## Task: Locate all filter change event listener lines in app.js

### Method
Searched `/home/coding/vista/src/public/app.js` for the following patterns:
- `addEventListener('change', handlerName)`
- `.onchange = handlerName`
- `onchange="handlerName()"`
- jQuery `.change(handlerName)`
- jQuery `.on('change', handlerName)`

### Results
**Total: 14 lines with change event listener patterns**

All lines use standard `addEventListener('change', ...)` pattern:

| Line | Code |
|------|------|
| 296 | `badgeStyleSelect?.addEventListener('change', updateBadgePreview);` |
| 310 | `oggenBgType?.addEventListener('change', handleBgTypeChange);` |
| 314 | `oggenGradientDir?.addEventListener('change', updateOggenCanvas);` |
| 315 | `oggenBgImageInput?.addEventListener('change', handleBgImageUpload);` |
| 316 | `oggenBgImageSize?.addEventListener('change', updateOggenCanvas);` |
| 319 | `oggenFont?.addEventListener('change', updateOggenCanvas);` |
| 321 | `oggenLogoPos?.addEventListener('change', handleLogoPosChange);` |
| 322 | `oggenLogoInput?.addEventListener('change', handleLogoUpload);` |
| 332 | `heatmapSort?.addEventListener('change', handleHeatmapSort);` |
| 3481 | `groupCb.addEventListener('change', (e) => {` |
| 3497 | `cb.addEventListener('change', () => {` |
| 6813 | `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);` |
| 6831 | `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);` |
| 8207 | `cb.addEventListener('change', () => {` |

### Raw Output
Detailed results saved to `/tmp/filter-handler-lines.txt`

### Key Findings
- **No jQuery handlers found** - all use standard DOM API
- **No inline onchange attributes** - all bound via JavaScript
- **Anonymous arrow functions**: 3 instances (lines 3481, 3497, 8207)
- **Named function handlers**: 11 instances

### Handler Categories
1. **UI preview generators**: updateBadgePreview, updateOggenCanvas, handleBgTypeChange, handleBgImageUpload, handleLogoPosChange, handleLogoUpload
2. **Sort/filter logic**: handleHeatmapSort, generateCodeSnippet
3. **Preferences/Import**: importPreferences
4. **Generic checkbox handlers**: 3 instances with inline arrow functions
