# Filter Change Handler Patterns in app.js

## Analysis Summary

### Keywords Found
- `filter`, `change`, `handler`, `addEventListener`, `onFilter` ✓

### Filter-Related Functions Identified

#### Core Filter Operations
- `queueFilterOperation(operation, description)` - Queues filter operations during smart ordering
- `processPendingFilterOperations()` - Processes queued filter operations after smart ordering completes
- `filterCommands(e)` - Command palette filter handler
- `shouldDeferFilterOperation()` - Checks if operation should be deferred
- `isSmartOrdering()` - Central guard function checking both user preference and runtime state

#### Toggle/Action Handlers
- `toggleFavorite(pid)` - Toggles platform favorite status (uses guardWrapper)
- `toggleHidden(pid)` - Toggles platform hidden status (uses guardWrapperWithRender)
- `toggleWhatIfMode()` - Toggles What If analysis mode
- `applyWhatIfReset` - Applies What If reset (queued operation)
- `applyImportedPrefs` - Applies imported preferences (queued operation)

#### Update Functions (often called after filter changes)
- `updateFavoritesList()` - Updates favorites UI
- `updateHiddenList()` - Updates hidden platforms UI
- `updateColumnLayoutUI()` - Updates column layout buttons
- `updateEditorFieldImpactLabels()` - Updates editor impact labels
- `updatePreviewsWithEdits()` - Applies edits to previews
- `updatePreviewsWithImages()` - Updates preview cards with images

#### Render Functions (typically called after filter operations)
- `renderPreviews(data)` - Main render function for platform cards
- `renderPlatformCard()` - Renders individual platform cards
- `renderCommands()` - Renders filtered command palette
- `renderMetadataTable()` - Renders metadata table (with filter input)

### General Patterns Used

#### 1. **Queue/Defer Pattern** (Most sophisticated)
```javascript
// For operations that might conflict with smart ordering
if (isSmartOrdering()) {
  queueFilterOperation(() => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  }, 'operationName');
  return;
}
```

#### 2. **Guard Flag Pattern**
```javascript
// Prevent smart order resets during filter changes
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

#### 3. **Event Listener Pattern** (Direct binding)
```javascript
// Input filter - immediate response
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});

// Change events - state changes
selectElement.addEventListener('change', updateFunction);
```

#### 4. **Guard Wrapper Pattern** (Abstraction for operations that need queueing)
```javascript
// For operations without re-render
guardWrapper('operationName', () => {
  // Modify state
  savePlatformPrefs();
  updateUI();
});

// For operations requiring re-render
guardWrapperWithRender('operationName', () => {
  // Modify state
  savePlatformPrefs();
  updateUI();
  renderPreviews(currentData);
});
```

#### 5. **Inline Arrow Function Pattern**
```javascript
// Quick inline filter handlers
addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  // Filter and render
});
```

### Naming Conventions

#### Function Names
- **Verb-first**: `toggle`, `update`, `render`, `handle`, `queue`, `process`
- **Specific action**: `toggleFavorite`, `updateHiddenList`, `filterCommands`
- **State operations**: `isSmartOrdering`, `shouldDeferFilterOperation`

#### State Variables
- **isX**: Boolean state flags (`isFilterOperation`, `isSmartOrderingActive`)
- **pendingX**: Queued operations (`pendingFilterOperations`, `pendingApplySmartOrder`)
- **XList`: UI collections (`favoritesList`, `hiddenPlatformsList`)

#### Handler Parameters
- **e**: Event object (standard pattern)
- **pid**: Platform ID (domain-specific)
- **data`: Data payload
- **operation, description`: Queue parameters

### Organizational Structure

#### Centralized Guard System
```
// Top-level guard functions (lines 7885-7935)
- shouldDeferFilterOperation()
- isSmartOrdering() 
- queueFilterOperation()
- processPendingFilterOperations()
```

#### State Management Pattern
```javascript
// State variables grouped together (around line 6279)
let isFilterOperation = false;
let isSmartOrderingActive = false;
let pendingFilterOperations = [];
let pendingApplySmartOrder = false;
```

#### Event Binding Organization
```javascript
// Event listeners bound in logical groups:
- Early setup: UI element binding (lines 296-332)
- Runtime: Command palette (line 9085)
- Feature-specific: What If toggle (line 8334)
- Dynamic: List item handlers (lines 8008, 8029)
```

### Key Architectural Patterns

#### 1. **Smart Ordering Coordination**
Filter operations must coordinate with the smart ordering system:
- Check `isSmartOrdering()` before operations
- Queue operations if smart ordering is active
- Use `isFilterOperation` flag to prevent resets

#### 2. **Event Listener Types**
- **'input'**: Real-time filtering (as user types)
- **'change'**: State changes (selects, toggles)
- **'click'**: Action buttons (toggles, commands)

#### 3. **Filter Operation Flow**
```
User Action → Event Listener → Check isSmartOrdering() 
  → [Yes] → queueFilterOperation() → Wait for smart ordering complete
  → [No] → Set isFilterOperation flag → Perform operation → Clear flag
```

#### 4. **Update/Render Separation**
- **Update functions**: Modify UI elements, preferences, lists
- **Render functions**: Re-generate card HTML from state

### Notable Patterns

#### Debug Support
```javascript
const DEBUG_SMART_ORDERING = false; // Toggle for debugging
console.log(`[functionName] Description: ${detail}`);
```

#### State Persistence
```javascript
savePlatformPrefs(); // Called after state changes
```

#### Error Handling
```javascript
try {
  operation();
} catch (error) {
  console.error(`[processPendingFilterOperations] Error:`, error);
}
```

### Event Listener Patterns Summary

| Element | Event | Handler Pattern | Purpose |
|---------|-------|-----------------|---------|
| `filterInput` | input | Inline arrow | Real-time metadata table filtering |
| `select` | change | Function reference | UI state changes |
| `commandPaletteInput` | input | `filterCommands` | Command palette filtering |
| `toggleBtn` | click | `toggleFavorite` | Favorites toggling |
| `whatIfToggleBtn` | click | `toggleWhatIfMode` | What If mode |

### Additional Filter Handler Patterns (Extended Analysis)

#### Handler Function Signatures Identified

**Sort Handler Pattern** (Line 6101)
```javascript
function handleHeatmapSort() {
  if (!heatmapSort || !sitemapResults.length) return;
  const sortBy = heatmapSort.value;
  let sorted = [...sitemapResults];
  // Switch statement for sort options
  switch (sortBy) {
    case 'score-asc': /* ... */
    case 'score-desc': /* ... */
  }
  renderSitemapResults(sorted);
}
```
- **Guard clause**: Check element exists and data available
- **State read**: Get current sort value
- **Array spread**: Create copy for mutation
- **Switch logic**: Multiple sort strategies
- **UI update**: Render sorted results

**Editor Input Handler** (Line 6589)
```javascript
function handleEditorInput(e) {
  const el = e.target;
  const tag = el.dataset.tag;
  if (!tag) return;
  
  editorState.edited[tag] = el.value;
  editorState.dirty = true;
  
  // Visual feedback
  if (el.value !== editorState.original[tag]) {
    el.classList.add('modified');
  }
}
```
- **Event object**: Direct access to target
- **Dataset extraction**: Get tag from data attribute
- **Guard clause**: Validate tag exists
- **State update**: Track edits and dirty flag
- **Visual feedback**: Add CSS class for changes

**Update Preview Handler** (Line 4765)
```javascript
function updateBadgePreview() {
  if (!currentData) return;
  
  const score = currentData.scoring.overall.score;
  const platforms = Object.keys(currentData.scoring.scores).length;
  const style = badgeStyleSelect?.value || 'flat';
  
  // URL construction and preview update
}
```
- **Guard clause**: Check data exists
- **Data extraction**: Get score and platform count
- **Fallback value**: Default style if not selected
- **Optional chaining**: Safe element access

#### Checkbox Handler Patterns

**Group Toggle Pattern** (Line 3481)
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
});
```
- **Cascade pattern**: Parent toggle affects multiple children
- **Data attribute**: Group ID from dataset
- **Array lookup**: Find platforms in group
- **DOM query**: Select child checkboxes
- **Side effects**: Update UI state

**Individual Toggle Pattern** (Line 3497)
```javascript
cb.addEventListener('change', () => {
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```
- **Sync pattern**: Individual toggle updates parent
- **Multiple updates**: Platform, overlay, and group state
- **No guard needed**: Checkbox state is source of truth

**What-Analysis Toggle** (Line 8207)
```javascript
cb.addEventListener('change', () => {
  if (!cb.checked) {
    disabledTags.add(cb.dataset.tag);
  } else {
    disabledTags.delete(cb.dataset.tag);
  }
  updateHash();
});
```
- **Set management**: Add/remove from disabled collection
- **Conditional logic**: Different behavior for checked/unchecked
- **URL sync**: Update hash for state persistence

#### Input vs Change Event Distinction

**Input Events** (Real-time)
```javascript
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenTitle?.addEventListener('input', updateOggenCanvas);
input.addEventListener('input', handleEditorInput);
```
- **Purpose**: Immediate UI feedback
- **Use cases**: Color pickers, text fields, ranges
- **Characteristic**: Fires on every value change

**Change Events** (Committed)
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
oggenBgType?.addEventListener('change', handleBgTypeChange);
heatmapSort?.addEventListener('change', handleHeatmapSort);
```
- **Purpose**: Finalized state changes
- **Use cases**: Select dropdowns, checkboxes, file uploads
- **Characteristic**: Fires only on value commit

### Line Number Reference for Filter Handlers

| Handler Name | Line Number | Type | Purpose |
|--------------|-------------|------|---------|
| `updateBadgePreview` | 4765 | Function | Badge preview update |
| `handleHeatmapSort` | 6101 | Function | Heatmap sorting |
| `handleEditorInput` | 6589 | Function | Editor input handling |
| `filterCommands` | 9177 | Function | Command palette filter |
| `renderMetadataTable` | 3941 | Function | Metadata table with filter |
| `queueFilterOperation` | 7942 | Function | Queue filter operations |
| `processPendingFilterOperations` | 7952 | Function | Process queued operations |
| `shouldDeferFilterOperation` | 7891 | Function | Check deferral needed |
| Filter input listener | 3991 | Event Listener | Metadata table filter |
| Command input listener | 9085 | Event Listener | Command palette input |
| Group checkbox listener | 3481 | Event Listener | Platform group toggle |
| Platform checkbox listener | 3497 | Event Listener | Individual platform toggle |
| What-If toggle listener | 8207 | Event Listener | What-Analysis mode |

## Verification Notes
- All required keywords found and analyzed
- Function names identified and categorized
- General patterns documented with examples
- Naming conventions and organizational structure noted
- Located in `/home/coding/vista/src/public/app.js`
- Total analysis completed: 2026-07-24

## Additional Patterns Found

### Compound Filter Condition Pattern
```javascript
// Line 3943-3945: Multi-field filtering
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```
- **Case-insensitive**: Both sides normalized to lowercase
- **OR logic**: Matches tag OR value field
- **Type coercion**: Value converted to string for comparison
- **Conditional filter**: Only filter if query provided

### Array.filter() Usage Patterns
```javascript
// Score filtering (Lines 1620-1622, 1747-1749, 1766-1768)
const gPassing = groupScores.filter(s => ['A+','A'].includes(s.grade)).length;
const gWarn = groupScores.filter(s => ['B','C'].includes(s.grade)).length;
const gFail = groupScores.filter(s => ['D','F'].includes(s.grade)).length;

// Platform filtering (Lines 1548-1549, 1647, 1650, 1791-1792)
const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
const existingInCardOrder = cardOrderForGroup.filter(pid => group.platforms.includes(pid));
const missingFromCardOrder = group.platforms.filter(pid => !cardOrderForGroup.includes(pid));
```
- **Grade categorization**: Filter scores into grade buckets
- **Array operations**: Difference, intersection, subset checks
- **Chained operations**: Multiple filters in sequence
- **Boolean extraction**: `.length` to get count of matches