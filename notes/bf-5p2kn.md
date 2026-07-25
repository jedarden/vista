# forEach Queue Processing Loops in app.js

## Summary
Found 2 primary forEach loops that process queue arrays in `/home/coding/vista/src/public/app.js`.

## Queue Processing forEach Loops

### 1. Line 7965 - Operations Queue Processing
```javascript
operations.forEach(({ operation, description }) => {
  try {
    if (DEBUG_SMART_ORDERING) {
      console.log(`[processPendingFilterOperations] Executing: ${description}`);
    }
    operation();
```
- **Queue Variable**: `operations` (copy of `pendingFilterOperations` array)
- **Purpose**: Processes pending filter operations that were queued during smart ordering
- **Context**: Inside `processPendingFilterOperations` function
- **Queue Source**: `pendingFilterOperations.slice()` at line 7962
- **Items**: Each item has `{ operation, description }` structure

### 2. Line 8299 - Pending What-If Tags Processing
```javascript
pendingWhatIfTags.forEach(tag => {
  disabledTags.add(tag);
  const cb = document.querySelector(`#whatIfPanel .what-if-toggle input[data-tag="${tag}"]`);
  if (cb) {
    cb.checked = false;
  }
});
```
- **Queue Variable**: `pendingWhatIfTags`
- **Purpose**: Processes pending "What If" mode tags that were queued from URL hash before data loaded
- **Context**: Inside what-if mode initialization function
- **Queue Source**: Set from URL hash at line 484: `pendingWhatIfTags = tags`
- **Items**: String tag names

## Queue Variables Found

1. **pendingWhatIfTags** (line 12) - Stores pending What If tags from hash before data loads
2. **pendingFilterOperations** (line 6281) - Queue filter operations during smart ordering
3. **pendingRenderData** (line 6275) - Queue renderPreviews calls during smart ordering
4. **pendingRenderAfterCurrent** (line 6277) - Queue renders during active render
5. **pendingApplySmartOrder** (line 6274) - Flag for pending smart ordering operation

## Notes

- Both forEach loops follow similar pattern: iterate through queued items and process them
- The operations queue uses `.slice()` to create a copy before processing (line 7962) to avoid modification during iteration
- Both queues are cleared after processing (`pendingFilterOperations = []` at line 7963, `pendingWhatIfTags = null` at line 8311)
- These are the only two forEach loops specifically processing queue-like arrays in the codebase

## Related forEach Loops (Not Queue Processing)

Other forEach loops found that process arrays but are not queue operations:
- Line 472: `tags.forEach(tag => {` - Processes tag arrays directly (not a queued operation)
- Line 4523: `fixesWithImpact.forEach(fix => {` - Iterates over calculated fixes for display
- Line 4534: `improved.forEach(p => {` - Nested iteration over impact results
- Line 8247: `disabledTags.forEach(tag => {` - Processes disabled tags set (not a queue)

Total forEach loops in app.js: 98
Total queue-processing forEach loops: 2
