# Filter Change Handler Patterns in app.js

## Overview
Filter change handlers in app.js follow consistent patterns for naming, structure, and DOM attachment.

## Naming Convention
- **Handler functions**: Use `handle` prefix followed by the action (e.g., `handleHeatmapSort`, `handleBgTypeChange`, `handleLogoPosChange`)
- **Filter-specific functions**: Use descriptive names without `handle` prefix when the primary purpose is filtering (e.g., `filterCommands`)

## Event Type Patterns
- **`input` events**: Used for real-time filtering as the user types (e.g., `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); })`)
- **`change` events**: Used for select dropdowns and controls that commit on selection (e.g., `heatmapSort?.addEventListener('change', handleHeatmapSort)`)

## DOM Attachment Patterns

### Pattern 1: Direct Function Reference
```javascript
// Simple handlers that don't need custom parameters
heatmapSort?.addEventListener('change', handleHeatmapSort);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
```

### Pattern 2: Inline Arrow Function
```javascript
// Handlers that need to pass parameters or call other functions
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

### Pattern 3: Optional Chaining with Null Check
```javascript
// Safe attachment when element might not exist
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

## Handler Function Structure

### Standard Handler Pattern
```javascript
function handleHeatmapSort() {
  if (!heatmapSort || !sitemapResults.length) return;

  const sortBy = heatmapSort.value;  // Get value from DOM element
  let sorted = [...sitemapResults];   // Copy data

  switch (sortBy) {
    case 'score-asc':
      sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
      break;
    // ... other cases
  }

  renderHeatmapTable(sorted);  // Update UI
}
```

### Filter Handler Pattern
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();  // Get filter query
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);  // Show all when empty
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);  // Update UI with filtered results
}
```

## Summary

**Naming**: `handle<Action>` or descriptive filter names

**Attachment**: `element.addEventListener('input'|'change', handlerFunction)`

**Structure**: Get value → Process data → Call render function

**Events**: `input` for real-time filtering, `change` for commit-based controls