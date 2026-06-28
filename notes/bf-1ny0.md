# URL Hash Parsing Implementation Notes (bf-1ny0)

## Task Status: COMPLETE

The URL hash parsing logic to restore state on page load is already fully implemented in `/home/coding/vista/src/public/app.js`.

## Implementation Details

### Core Functions

**`getHashState()` (lines 359-371)**
- Parses URL hash into state object
- Handles URL decoding for parameter values
- Returns empty object if no hash present

**`restoreHashState()` (lines 408-461)**
- Restores active tab from `#tab=` parameter
- Restores compare mode from `#mode=compare&b=` parameters
- Restores What If disabled tags from `#without=` parameter
- Handles both scenarios: data already loaded vs. data not yet loaded

### Acceptance Criteria Verification

✓ **Parse #tab= parameter and restore active tab**
- Lines 412-417: Reads `state.tab`, validates tab button exists, calls `switchTab()`

✓ **Parse #without= parameter and restore What If disabled tags**
- Lines 431-460: Parses comma-separated tags
- If data loaded: enables What If mode, shows panel, disables tags, applies changes
- If data not loaded: stores in `pendingWhatIfTags` for later application (line 457)

✓ **Parse #mode=compare&b= parameter and restore compare mode with second URL**
- Lines 420-428: Switches to compare mode, populates second URL field
- Note: Doesn't auto-trigger compare (user must click button) - design choice

✓ **Parsing handles missing/invalid parameters gracefully**
- Line 409: Returns empty object if no hash
- Line 412: Checks `if (state.tab)` before processing
- Line 413: Checks `if (tabBtn)` before switching (handles invalid tabs)
- Line 420: Checks `if (state.mode === 'compare')` specifically
- Line 432: Filters empty tags with `.filter(t => t)`

✓ **State restoration happens before initial render**
- Line 479: Called inside `DOMContentLoaded` event listener
- Occurs after URL query parameter loading (`?url=`) but before data rendering
- Async data loading via `inspectUrl()` completes after hash restoration

### Example URL Hash Formats

```
#tab=diagnostics
#without=og:image,twitter:card
#mode=compare&b=https://example.com/after
#tab=compare&mode=compare&b=https://example.com&without=og:image
```

### Timing Sequence

1. `DOMContentLoaded` fires
2. URL query parameter loading (`?url=`) → `inspectUrl()` (async)
3. `restoreHashState()` called
4. If `#without=` present and data not loaded → stores `pendingWhatIfTags`
5. When `inspectUrl()` completes → `handleResult()` → checks `pendingWhatIfTags` (line 1022-1024)
6. Pending tags applied via `applyPendingWhatIfTags()` (lines 7431-7457)

### Testing

Comprehensive test file created: `/home/coding/vista/test-hash-parsing.html`

Test coverage includes:
- All acceptance criteria scenarios
- Edge cases (empty hash, invalid tabs, malformed parameters)
- URL encoding handling
- Combined parameters
- Data loaded vs. not loaded scenarios

## Related Work

- **bf-139**: URL hash state encoding for shareability (writing hash)
- **bf-1ny0**: URL hash parsing for state restoration (reading hash)

The two beads work together to provide complete URL hash-based state management for shareable application states.
