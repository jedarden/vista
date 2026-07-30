# Task bf-251td: Handler Function Location Analysis

## Summary
Successfully located all 14 change event listener handler functions in app.js and recorded their starting line numbers.

## Findings

### Named Functions (9)
All named functions are traditional function declarations:

1. **updateBadgePreview** - Line 4765
2. **handleBgTypeChange** - Line 5106  
3. **updateOggenCanvas** - Line 5156 (used at 3 locations)
4. **handleBgImageUpload** - Line 5117
5. **handleLogoPosChange** - Line 5133
6. **handleLogoUpload** - Line 5140
7. **handleHeatmapSort** - Line 6101
8. **generateCodeSnippet** - Line 6853
9. **importPreferences** - Line 8057

### Inline Arrow Functions (3)
These are defined inline at the addEventListener call site:

1. **.cropper-group-toggle handler** - Line 3481
2. **.cropper-platform-toggle handler** - Line 3497  
3. **.what-if-toggle handler** - Line 8207

## Output
Results saved to: `/tmp/handler-function-locations.txt`

## Pattern Observations
- All named handlers use traditional function declaration syntax (`function name()`)
- All inline handlers use arrow function syntax (`(e) => { ... }`)
- Named functions are defined later in the file (lines 4765-8057) compared to where they're registered as listeners (lines 296-6831)
