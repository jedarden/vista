# on* Event Handler Patterns for Filter Changes in app.js

## Search Results

### Finding Summary
After searching through `/home/coding/vista/src/public/app.js` for on* event handler patterns related to filter changes, **no direct on* event handlers (onclick, onchange, oninput, etc.) were found for filter-related functionality**.

### Filter Implementation Pattern
The application uses **addEventListener** patterns instead of inline on* event handlers for filter functionality:

#### Primary Filter Event Handler
- **Line 3991**: `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); });`
  - **Pattern**: addEventListener with 'input' event
  - **Purpose**: Filters metadata table rows based on user input
  - **Context**: Attached to `#metadataFilterInput` element
  - **Function**: Calls `renderMetadataTable()` with the filter value

```javascript
// Lines 3989-3995
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

#### Filter Function Definition
- **Line 3941**: `function renderMetadataTable(filter = '')`
  - **Purpose**: Renders metadata table with optional filter parameter
  - **Logic**: Filters rows based on tag name or value matching the filter string

```javascript
// Lines 3941-3946
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
```

### Filter Operation Guards
The application uses guard flags and queue mechanisms for filter operations during smart ordering:

#### Guard Flags
- **Line 6279**: `let isFilterOperation = false;` - Prevents smart order resets during filter changes
- **Line 6281**: `let pendingFilterOperations = [];` - Queue for filter operations during smart ordering

#### Guard Functions
- **Line 7891**: `function shouldDeferFilterOperation()` - Check if filter operation should be deferred
- **Line 7915**: `function isSmartOrdering()` - Check if smart ordering is active
- **Line 7942**: `function queueFilterOperation(operation, description)` - Queue filter operation
- **Line 7952**: `function processPendingFilterOperations()` - Process pending operations

### Other on* Event Handlers Found
The following on* event handlers exist in the codebase but are **NOT related to filter changes**:

#### Image Loading Handlers
- Multiple `onerror` handlers for image error handling (lines 2248, 2319, 2334, 2348, 2369, 2407, 2642, 2663, 2686, 2709, 2745, 2783, 2816, 2843, 2871, 2897, 2935, 2971, 2997, 3020, 3046, 3065, 3086, 3111, 3139, 3165, 3189, 3216, 3246, 3270, 3297, 3320, 3347, 3401, 3412, 4000, 4015)
- Multiple `onload` handlers for image load handling (lines 2319, 2334, 2369, 2407, 2642, 2663, 2686, 2709, 2745, 2783, 2816, 2843, 2871, 2897, 2935, 2971, 2997, 3020, 3046, 3065, 3086, 3111, 3139, 3165, 3189, 3216, 3246, 3270, 3297, 3320, 3401, 3412, 5010, 5122, 5124, 5145, 5147)

#### Button Click Handlers
- **Line 3417**: `downloadOverlayBtn.onclick = exportCropperOverlay;`
- **Line 3956**: `<button class="action-btn" onclick="exportMetadataAsJson()">` - Export JSON button
- **Line 3957**: `<button class="action-btn" onclick="exportMetadataAsCsv()">` - Export CSV button
- **Line 4015**: `<button class="copy-btn" onclick="copyMetadataValue(...)">` - Copy button
- **Line 4066**: `<button class="action-btn" id="exportRedirectJson" onclick="exportRedirectChain()">` - Export redirect chain
- **Line 4067**: `<button class="action-btn" id="exportHeadersJson" onclick="exportHeadersAsJson()">` - Export headers
- **Line 4561**: `<button class="fix-copy-btn" onclick="copyText(...)">` - Fix copy button
- **Line 4620**: `<button class="recent-chip" onclick="inspectUrl(...)">` - Recent URL chips
- **Line 6455**: `onclick="toggleAllCharGauges(...)"` - Toggle character gauges
- **Line 6468**: `onclick="toggleCharGaugeGroup(...)"` - Toggle gauge groups

## Conclusion
The Vista application uses modern JavaScript event handling patterns with **addEventListener** rather than inline on* event handlers for filter functionality. The filter input event is handled through addEventListener at line 3991, and the application includes sophisticated guard mechanisms to handle filter operations during smart ordering processes.

**No on* event handler patterns (onclick, onchange, oninput, etc.) were found that directly relate to filter changes** - the filter functionality is implemented using addEventListener exclusively.
