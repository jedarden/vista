# Filter Hook Patterns in Vista (app.js)

**Note:** Vista is a vanilla JavaScript application, not React. There are no React hooks (`useState`, `useCallback`) in the codebase. This document captures the filter-related patterns that do exist.

## Filter State Variables

### Lines 6279-6281: Filter Operation State Flags
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Lines 5046-5056: Global Filter API
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

## Filter Functions

### Lines 3941-3995: Metadata Table Filter Function
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  let html = `<div class="metadata-viewer">
    <div class="metadata-toolbar">
      <div class="metadata-filter">
        <input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
        <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
      </div>
      <div class="metadata-actions">
        <button class="action-btn" onclick="exportMetadataAsJson()">&#128190; Export JSON</button>
        <button class="action-btn" onclick="exportMetadataAsCsv()">&#128190; Export CSV</button>
      </div>
    </div>
    <div class="metadata-table-wrapper">
      <table class="metadata-table">
        <thead>
          <tr>
            <th class="col-tag">Tag Name</th>
            <th class="col-value">Value</th>
            <th class="col-source">Source</th>
            <th class="col-copy"></th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows.length > 0 ? filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('') : '<tr><td colspan="4" class="no-results">No tags match your filter</td></tr>'}
        </tbody>
      </table>
    </div>`;

  // Add JSON-LD section at bottom if present
  const hasJsonLd = allMetadataRows.some(r => r.tag.startsWith('json-ld'));
  if (hasJsonLd && !filter) {
    html += `<div class="raw-section">
      <h3>JSON-LD Structured Data</h3>
      ${currentData?.meta?.jsonLd?.map(j => `<pre class="jsonld-block">${escHtml(JSON.stringify(j, null, 2))}</pre>`).join('') || ''}
    </div>`;
  }

  html += '</div>';
  rawTagsPanel.innerHTML = html;

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

### Lines 7891-7893: Filter Defer Check
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

### Lines 7933-7935: Smart Ordering Guard
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

### Lines 7942-7947: Queue Filter Operation
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

### Lines 7952-7975: Process Pending Filter Operations
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  // Process each pending operation
  const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
  pendingFilterOperations = []; // Clear queue

  operations.forEach(({ operation, description }) => {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```

## Filter Usage Patterns

### Line 3942-3946: Array Filter Pattern
```javascript
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```

### Line 3989-3994: Event Listener Filter Pattern
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

## Summary

Vista uses vanilla JavaScript filter patterns rather than React hooks:

1. **State Variables**: `isFilterOperation`, `pendingFilterOperations` guard flags
2. **Filter Functions**: `renderMetadataTable()`, queue/process functions for deferred operations
3. **Array Filtering**: Standard `Array.filter()` with case-insensitive matching
4. **Event Listeners**: Direct DOM event handling for filter input changes
5. **Guard Pattern**: Prevents race conditions between filtering and smart ordering operations

No React hooks (`useState`, `useCallback`, `useEffect`, etc.) are present in this codebase.
