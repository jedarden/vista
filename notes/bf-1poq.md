# Bead bf-1poq: Compute Diff Data Structure from /api/compare Responses

## Summary

Implemented the `computeCompareDiff` function that computes differences between platform metadata from two `/api/compare` API response objects.

## Implementation

The function is located in `/home/coding/vista/src/comparators/computeCompareDiff.js` and provides:

### Function Signature
```javascript
computeCompareDiff(responseA, responseB) -> CompareDiffResult
```

### Return Structure
```javascript
{
  identicalPlatforms: Set<string>,    // Platform IDs with no changes
  changedFields: Map<string, string[]>,   // Platform ID -> array of changed field paths
  missingTags: Map<string, string[]>      // Platform ID -> array of missing tag names
}
```

## Features

1. **Platform extraction**: Safely extracts platform scores from both responses, handling error cases
2. **Per-platform comparison**: For each unique platform across both responses:
   - Checks if platforms are identical using `isIdentical()`
   - Computes changed fields using `changedFields()`
   - Computes missing tags using `missingTags()`
3. **Edge case handling**: Handles null/undefined responses, missing platforms, malformed data
4. **Performance**: Efficiently handles large-scale comparisons (100+ platforms in <100ms)

## Dependencies

The implementation depends on three helper functions:
- `isIdentical()` - Deep equality check for platform metadata
- `changedFields()` - Extracts changed field paths between two platforms
- `missingTags()` - Finds tags present in one platform but missing from another

## Testing

Comprehensive test suite in `/home/coding/vista/test/unit/computeCompareDiff.test.js` covering:
- Platforms present in A but missing in B (and vice versa)
- Null/undefined metadata fields
- Empty or malformed tag arrays
- Diff output structure validation
- Complex multi-platform scenarios
- Error responses
- Large-scale performance (100 platforms)

All tests pass ✅

## Usage Example

```javascript
const { computeCompareDiff } = require('./src/comparators');

// From /api/compare endpoint
const responseA = { scoring: { scores: { twitter: {...}, facebook: {...} } } };
const responseB = { scoring: { scores: { twitter: {...}, linkedin: {...} } } };

const diff = computeCompareDiff(responseA, responseB);

// Results:
// - identicalPlatforms: Set containing 'twitter' (if unchanged)
// - changedFields: Map with 'facebook' and 'linkedin' entries
// - missingTags: Map with per-platform missing tag arrays
```

## Acceptance Criteria Met

✅ Function that takes two API response objects
✅ Returns structured diff with per-platform diff info
✅ Tracks changed fields per platform
✅ Tracks missing tags per platform  
✅ Tracks identical status per platform
