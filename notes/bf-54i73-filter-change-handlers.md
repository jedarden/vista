# Filter Change Handler Catalog

## Filter Change Handler Functions

### 1. Anonymous Metadata Filter Handler
- **Line**: 3991-3993
- **Section**: Metadata viewer rendering (renderMetadataTable function)
- **Type**: Inline event listener callback
- **Attached to**: `#metadataFilterInput` element
- **Event**: `input`
- **Function**: Calls `renderMetadataTable(e.target.value)` to filter metadata rows

```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

### 2. filterCommands
- **Line**: 9177-9192
- **Section**: Command palette functionality
- **Type**: Named function
- **Attached to**: `#commandInput` element (line 9085)
- **Event**: `input`
- **Function**: Filters command palette commands based on query

```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

## Supporting Filter Operation Functions

### 3. shouldDeferFilterOperation
- **Line**: 7891-7893
- **Section**: Centralized guard functions for filter operations during smart ordering
- **Type**: Guard function
- **Function**: Checks if filter operation should be deferred due to active smart ordering

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

### 4. queueFilterOperation
- **Line**: 7942-7947
- **Section**: Centralized guard functions for filter operations during smart ordering
- **Type**: Queue management function
- **Function**: Queues filter operations to be processed after smart ordering completes

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

### 5. processPendingFilterOperations
- **Line**: 7952-7975
- **Section**: Centralized guard functions for filter operations during smart ordering
- **Type**: Queue processor function
- **Function**: Processes queued filter operations after smart ordering completes

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

## Related Filter Function

### renderMetadataTable
- **Line**: 3941-3995
- **Section**: Metadata viewer rendering
- **Type**: Render function with filter parameter
- **Function**: Renders metadata table with optional filter string
- **Note**: Not a direct event handler, but called by the anonymous filter handler at line 3991

## Summary

- **Direct filter change handlers**: 2 (anonymous metadata handler + filterCommands)
- **Supporting filter operations**: 3 (shouldDeferFilterOperation, queueFilterOperation, processPendingFilterOperations)
- **Related filter function**: 1 (renderMetadataTable - called by filter handler)

Total: 6 filter-related functions identified in app.js
