# Bead bf-2rx21: Filter Hook Patterns in app.js

## Task
Search app.js for useState and useCallback hook patterns related to filters.

## Findings

### No React Hooks Found
**CRITICAL**: Vista is a **vanilla JavaScript application**, not React. No `useState` or `useCallback` hooks exist in the codebase.

### Actual Filter Patterns (Vanilla JS)

#### 1. Filter State Variables (Lines 6279-6281)
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```
**Pattern**: Global mutable state variables acting as filter guards and operation queues.

#### 2. Filter Function: `renderMetadataTable` (Line 3941)
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
```
**Pattern**: Pure function with filter parameter, uses `.filter()` array method.

#### 3. Filter Function: `filterCommands` (Line 9177)
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );
  renderCommands(filtered);
}
```
**Pattern**: Event handler function that filters command list based on user input.

#### 4. Filter Operation Guard Functions (Lines 7885-7972)
- `shouldDeferFilterOperation()` - Checks if filter should be deferred during smart ordering
- `queueFilterOperation(operation, description)` - Queues filter operations
- `processPendingFilterOperations()` - Processes queued operations after smart ordering completes

**Pattern**: Async queue pattern for deferring filter operations during smart ordering.

#### 5. Filter Guard Flag Usage Pattern (Lines 8080, 8096, 8144, 8156, 8263)
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```
**Pattern**: Boolean guard flag with setTimeout cleanup pattern.

#### 6. Filter Input Event Listener (Lines 3989-3992)
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```
**Pattern**: Direct DOM event listener binding with inline handler.

## Summary

**No React hooks found** - Vista uses vanilla JavaScript with these filter patterns:
1. Global mutable state variables (`isFilterOperation`, `pendingFilterOperations`)
2. Pure functions with filter parameters
3. Event handler functions
4. Async queue pattern for deferring operations
5. Boolean guard flags with setTimeout cleanup
6. Direct DOM event listeners

All filter patterns use vanilla JS constructs:
- Array `.filter()` method
- Global variables for state
- Event listeners on DOM elements
- Pure function composition

## Next Steps
The bead task asked for useState and useCallback hooks that don't exist in this vanilla JS codebase.
