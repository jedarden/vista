# Filter Change Handlers in app.js

## Primary Filter Change Handlers

### `renderMetadataTable` - Line 3941
- **Purpose**: Main handler that renders/updates the metadata table based on filter input
- **Trigger**: Event listener on `#metadataFilterInput` input element (line 3991)
- **Implementation**: Inline arrow function at line 3991-3993 calls `renderMetadataTable(e.target.value)`
- **Function Signature**: `function renderMetadataTable(filter = '')`

### `filterCommands` - Line 9177
- **Purpose**: Filters command palette commands based on user input
- **Trigger**: Event listener on command input element (line 9085)
- **Function Signature**: `function filterCommands(e)`

## Supporting Filter Infrastructure

### `shouldDeferFilterOperation` - Line 7891
- **Purpose**: Guard function to check if filter operations should be deferred during smart ordering
- **Function Signature**: `function shouldDeferFilterOperation()`

### `queueFilterOperation` - Line 7942
- **Purpose**: Queues filter operations during smart ordering to prevent card order resets
- **Function Signature**: `function queueFilterOperation(operation, description)`

### `processPendingFilterOperations` - Line 7952
- **Purpose**: Processes queued filter operations after smart ordering completes
- **Function Signature**: `function processPendingFilterOperations()`

## Event Listeners

### Metadata Filter Input - Line 3991
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

### Command Filter Input - Line 9085
```javascript
input.addEventListener('input', filterCommands);
```

## Summary

The app has **2 primary filter change handlers** and **3 supporting infrastructure functions** for managing filter operations during smart ordering.

**Total filter-related functions: 5**
- 2 primary handlers: `renderMetadataTable`, `filterCommands`
- 3 infrastructure: `shouldDeferFilterOperation`, `queueFilterOperation`, `processPendingFilterOperations`
