# Filter Change Handler Extraction (bf-33i4n)

## Task
Extract all filter change handler function names from `src/public/app.js`.

## Method
Searched for `addEventListener('change', handlerName)` patterns in app.js.

## Results

### Named Handlers Found: 9
All extracted from `addEventListener('change', handlerName)` pattern:

1. `updateBadgePreview` - Badge style change handler (line 296)
2. `handleBgTypeChange` - Background type change handler (line 310)
3. `updateOggenCanvas` - OG image canvas update handler (lines 314, 316, 319)
4. `handleBgImageUpload` - Background image upload handler (line 315)
5. `handleLogoPosChange` - Logo position change handler (line 321)
6. `handleLogoUpload` - Logo upload handler (line 322)
7. `handleHeatmapSort` - Heatmap sort change handler (line 332)
8. `generateCodeSnippet` - Code snippet framework change handler (line 6813)
9. `importPreferences` - Preferences import handler (line 6831)

### Inline Arrow Function Handlers: 3
Anonymous change listeners with no extractable names:
- Line 3481: `groupCb.addEventListener('change', (e) => {...})`
- Line 3497: `cb.addEventListener('change', () => {...})`
- Line 8207: `cb.addEventListener('change', () => {...})`

### Other Patterns Checked
- `.onchange =` assignments: **0 found**
- Inline `onchange="..."` attributes: **0 found**
- jQuery `.change()`: **0 found**

## Output
- Handler names saved to: `/tmp/filter-handler-names.txt`
- Total named handlers: **9**
- Total inline handlers: **3**

## Extraction Command
```bash
grep -oP "addEventListener\(['\"]change['\"],\s*\K[a-zA-Z_][a-zA-Z0-9_]*" src/public/app.js | sort -u
```
