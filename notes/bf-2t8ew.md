# onFilterChange Callback Patterns Search Results

## Task
Find onFilterChange callback function patterns in `/home/coding/vista/src/public/app.js`

## Search Scope
- Functions named `onFilterChange`
- Properties or methods named `onFilterChange`
- Callback functions passed as `onFilterChange` parameters
- Variations: `on_filter_change`, `onfilterchange`, etc.

## Results

### Summary
**No explicit `onFilterChange` callback patterns were found** in the Vista app.js file. The search included:
- Exact matches: `onFilterChange`, `on_filter_change`, `onfilterchange`
- Case variations: `OnFilterChange`, `ON_FILTER_CHANGE`
- Pattern variations: `on.*filter.*change`, `filter.*change.*callback`

### Filter-Related Patterns Found

#### 1. Filter Input Event Listeners (Inline Callbacks)

**Line 3991-3993: Metadata Filter Input**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```
- **Context**: Metadata table filtering
- **Pattern**: Inline event listener callback
- **Parameters**: Event object `e` with `e.target.value` containing filter text
- **Action**: Calls `renderMetadataTable(filterValue)`

**Line 9085: Command Palette Filter**
```javascript
input.addEventListener('input', filterCommands);
```
- **Context**: Command palette filtering
- **Pattern**: Named function callback
- **Callback function**: `filterCommands(e)` (defined at line 9177)

#### 2. Filter-Related Functions

**Line 9177-9200: `filterCommands(e)` Function**
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
    cmd.key?.toLowerCase().includes(query)
  );
  renderCommands(filtered);
}
```
- **Parameters**: Event object `e`
- **Data received**: `e.target.value` (search query string)
- **Context**: Command palette search/filter functionality

**Line 7891-7893: `shouldDeferFilterOperation()` Function**
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```
- **Context**: Guard function for filter operations during smart ordering
- **Return**: Boolean indicating if filter operation should be deferred

**Line 7942-7947: `queueFilterOperation(operation, description)` Function**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```
- **Parameters**: 
  - `operation` (Function): The filter operation to queue
  - `description` (string): Debug description
- **Context**: Queue filter operations during smart ordering

**Line 7952-7973: `processPendingFilterOperations()` Function**
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];

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
- **Context**: Execute queued filter operations after smart ordering completes

#### 3. Filter Operation Guard Patterns

**Line 6279: Guard Flag**
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Line 6281: Pending Operations Queue**
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Line 8790-8794: Filter Operation Guard Check**
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
```
- **Context**: Platform filtering operations
- **Purpose**: Prevent smart order resets during filter changes

#### 4. Related Change Event Listeners

**Line 296: Badge style selector**
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
```

**Line 332: Heatmap sort selector**
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

**Line 3481: Platform toggle in cropper**
```javascript
groupCb.addEventListener('change', (e) => {
  const group = e.target.dataset.group;
  const platforms = groups.find(g => g.id === group)?.platforms || [];
  platforms.forEach(pid => {
    const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
    if (platformCb) platformCb.checked = e.target.checked;
  });
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```

**Line 3497: Individual platform toggle**
```javascript
cb.addEventListener('change', () => {
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```

**Line 6813: Code snippet framework selector**
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
```

## Conclusion

The Vista app.js file **does not use explicit `onFilterChange` callback patterns**. Instead, it uses:

1. **Direct event listeners** with inline or named function callbacks
2. **Filter operation queue system** for handling filter operations during smart ordering
3. **Guard flags** to prevent conflicts between filtering and ordering operations
4. **Named callback functions** like `filterCommands` for specific filter functionality

The application filters are primarily handled through:
- `addEventListener('input', ...)` for real-time filtering
- `addEventListener('change', ...)` for state change notifications
- A queue-based system for deferring filter operations during critical periods

## Recommendations

If implementing new filter functionality in Vista, consider following the existing patterns:

1. **Use `addEventListener('input', callback)`** for real-time filter updates
2. **Queue filter operations** if they might conflict with smart ordering:
   ```javascript
   queueFilterOperation(() => {
     // your filter logic here
   }, 'description');
   ```
3. **Set guard flags** for filter operations:
   ```javascript
   isFilterOperation = true;
   try {
     // filter logic
   } finally {
     isFilterOperation = false;
   }
   ```
