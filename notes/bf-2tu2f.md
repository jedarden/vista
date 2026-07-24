# Filter Change Handler Names Extraction (bf-2tu2f)

## Task
Extract filter change handler function names from identified lines in `/tmp/filter-handler-lines.txt`

## Results

Extracted **14 handler names** from filter change event listeners in `app.js`:

### Named Handlers (10)
1. `updateBadgePreview`
2. `handleBgTypeChange`
3. `updateOggenCanvas` (appears 3 times)
4. `handleBgImageUpload`
5. `handleLogoPosChange`
6. `handleLogoUpload`
7. `handleHeatmapSort`
8. `generateCodeSnippet`
9. `importPreferences`

### Anonymous Handlers (3)
- Lines 3481, 3497, and 8207 use arrow function handlers (`<anonymous-arrow-function>`)

### Duplicates Found
- `updateOggenCanvas` - appears 3 times (lines 314, 316, 319)
- `<anonymous-arrow-function>` - appears 3 times

## Output
Raw handler name list saved to: `/tmp/filter-handler-names-raw.txt`

## Next Steps
- Deduplicate handler names for unique function analysis
- Map handlers to their implementation locations
- Analyze handler behavior patterns
