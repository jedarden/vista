# Filter Data Processing Patterns in app.js

## Overview

This document catalogs all functions and patterns that process, transform, or filter data in response to filter changes in the MTA My Way application.

---

## Primary Filter Functions

### 1. `renderMetadataTable(filter = '')` - Line 4369

**Purpose:** Renders a filterable metadata table with real-time search filtering

**Location:** Lines 4369-4423

**Pattern:**
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  
  // Render filtered rows with count display
  <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
  
  // Attach event listener for real-time filtering
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Key Features:**
- Case-insensitive filtering on both `tag` and `value` fields
- Shows "X of Y tags" count display
- Re-renders table on input change (real-time filtering)
- Hides JSON-LD section when filter is active
- Displays "No tags match your filter" message when empty

**Data Source:** `allMetadataRows` (global array, line 4221)

**Event Binding:** Line 4417-4422 - Input event listener on `#metadataFilterInput`

---

### 2. `filterCommands(e)` - Line 9659

**Purpose:** Filters command palette items by label or category

**Location:** Lines 9659-9674

**Pattern:**
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  
  if (!query) {
    renderCommands(COMMANDS); // Show all when empty
    return;
  }
  
  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );
  
  renderCommands(filtered);
}
```

**Key Features:**
- Case-insensitive search across command labels and categories
- Trims whitespace before filtering
- Shows all commands when query is empty
- Updates command palette display dynamically

**Event Binding:** Line 9567 - `input.addEventListener('input', filterCommands)`

**Data Source:** `COMMANDS` (global constant array)

---

## Filter Operation Guard System

### Guard Flags and State Variables

**Location:** Lines 6761-6763

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Guard Functions

#### 1. `shouldDeferFilterOperation()` - Line 8373

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Check if filter operation should be deferred due to active smart ordering

#### 2. `isSmartOrdering()` - Line 8415

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Centralized guard checking both user preference and runtime state

**Usage Pattern:**
```javascript
if (isSmartOrdering()) {
  queueFilterOperation(myFilterHandler, 'myFilterHandler');
  return;
}
// Proceed with filter operation
```

#### 3. `queueFilterOperation(operation, description)` - Line 8424

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Queue filter operations to execute after smart ordering completes

#### 4. `processPendingFilterOperations()` - Line 8434

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) return;
  
  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];
  
  operations.forEach(({ operation, description }) => {
    try {
      operation();
    } catch (error) {
      console.error(`Error executing: ${description}`, error);
    }
  });
}
```

**Purpose:** Execute queued filter operations after smart ordering completes

---

## Filter Operation Usage Patterns

### Pattern 1: Filter Operation with Guard

**Locations:** Lines 8562, 8578, 8626, 8638, 8745

```javascript
// Check if smart ordering is active - defer if so
if (isSmartOrdering()) {
  const applyOperation = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyOperation, 'description');
  return;
}

// Set guard flag to prevent smart order resets
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Usage Locations:**
- `importPreferences()` - Line 8562
- `toggleWhatIfMode()` - Line 8578, 8626
- Other render preview triggers - Line 8638, 8745

### Pattern 2: Smart Ordering Check with Reason

**Location:** Line 9274

```javascript
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`Operation skipped: ${reason}`);
  }
  return;
}
```

---

## Data Filter Operations by Category

### 1. Metadata Filtering (Primary Filter)

**Line:** 4370-4374
```javascript
allMetadataRows.filter(r =>
  r.tag.toLowerCase().includes(filter.toLowerCase()) ||
  (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
)
```

### 2. Command Palette Filtering

**Line:** 9668-9671
```javascript
COMMANDS.filter(cmd =>
  cmd.label.toLowerCase().includes(query) ||
  cmd.category.toLowerCase().includes(query)
)
```

### 3. Diagnostic Severity Filtering

**Lines:** 1387-1388, 4207-4209
```javascript
// Count errors
(data.diagnostics || []).filter(d => d.severity === 'error').length

// Count warnings
(data.diagnostics || []).filter(d => d.severity === 'warning').length

// Count info
sorted.filter(d => d.severity === 'info').length
```

### 4. Platform/Score Filtering

**Lines:** 1789-1792, 1992-1995, 2011-2014
```javascript
// Filter valid scores
group.platforms.map(pid => data.scoring.scores[pid]).filter(Boolean)

// Filter by grade
groupScores.filter(s => ['A+','A'].includes(s.grade)).length
groupScores.filter(s => ['B','C'].includes(s.grade)).length
groupScores.filter(s => ['D','F'].includes(s.grade)).length
```

### 5. Platform Card Order Filtering

**Lines:** 1718-1719, 1817-1820, 2037-2038
```javascript
// Custom order filtering
platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid))

// Missing platforms filtering
group.platforms.filter(pid => !customOrder.includes(pid))
```

### 6. UI Element Filtering

**Lines:** 3966, 4053, 4147, 7176, 9095, 9099, 9841
```javascript
// Checkbox state
children.filter(cb => cb.checked).length

// Platform crops filtering
enabledPids.map(pid => PLATFORM_CROPS[pid]).filter(Boolean)

// CSS class filtering
[...el.classList].filter((c) => c.startsWith('grade-'))

// Fixed items
items.filter(el => el.dataset.fixed === 'true').length

// Visible cards
allCards.filter(c => c.offsetParent !== null)
```

### 7. Array/Collection Filtering

**Lines:** 553, 712, 5026, 9707, 10110
```javascript
// Tag filtering
state.without.split(',').filter(t => t)

// URL filtering
trimmed.split(/[\r\n]+/).map(u => u.trim()).filter(u => u)

// Recents filtering
recents.filter(r => r.url !== url)

// Commands filtering
recentCommands.filter(c => c !== id)

// Platform order filtering
fromOrder.filter(pid => pid !== draggedPid)
```

---

## Data Stores and State

### `allMetadataRows` - Line 4221

**Purpose:** Global array storing all parsed metadata rows

**Structure:**
```javascript
let allMetadataRows = [];
```

**Population:** Lines 4224-4357 - Populated from `currentData.meta` with various metadata categories

**Categories:**
- Basic metadata (title, description)
- OpenGraph tags
- Twitter Card tags
- JSON-LD structured data
- Custom HTML meta tags

**Usage in Filtering:**
- Primary data source for `renderMetadataTable()`
- Exported as JSON/CSV
- Filtered by tag name or value

---

## Event Listener Bindings

### 1. Metadata Filter Input

**Location:** Line 4417-4422
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Trigger:** User types in `#metadataFilterInput`

**Response:** Re-renders metadata table with filtered results

### 2. Command Palette Input

**Location:** Line 9567
```javascript
input.addEventListener('input', filterCommands);
```

**Trigger:** User types in command palette search input

**Response:** Filters and re-renders command list

---

## Helper/Utility Functions

### `renderMetadataRow(row, idx)` - Line 4425

**Purpose:** Renders a single metadata table row

**Called by:** `renderMetadataTable()` via map over filtered rows

**Pattern:**
```javascript
filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('')
```

### `renderCommands(commands)` - Line 9609

**Purpose:** Renders command palette list

**Called by:** `filterCommands()` with filtered commands

**Pattern:**
```javascript
renderCommands(filtered); // where filtered = COMMANDS.filter(...)
```

---

## Filter Interaction Flow

### Metadata Filter Flow:
1. User types in `#metadataFilterInput`
2. Input event fires → calls `renderMetadataTable(e.target.value)`
3. Filter applied to `allMetadataRows` array
4. `filteredRows` computed using case-insensitive search
5. Table re-rendered with `filteredRows`
6. Count display updated: "X of Y tags"

### Command Palette Flow:
1. User opens command palette (Cmd/Ctrl+K)
2. User types in search input
3. Input event fires → calls `filterCommands(e)`
4. Query trimmed and lowercased
5. `COMMANDS` array filtered by label/category
6. `renderCommands(filtered)` updates display
7. Empty query shows all commands

### Smart Ordering Guard Flow:
1. Filter operation triggered (e.g., user changes preferences)
2. Check `isSmartOrdering()` - returns true if smart ordering active
3. If true:
   - Create wrapper function with `isFilterOperation = true`
   - Queue via `queueFilterOperation()`
   - Return early
4. If false:
   - Set `isFilterOperation = true`
   - Execute operation (e.g., `renderPreviews()`)
   - Clear flag after render: `setTimeout(() => { isFilterOperation = false; }, 0)`

---

## Summary Statistics

- **Total `.filter()` operations:** 38 instances
- **Primary filter functions:** 2 (`renderMetadataTable`, `filterCommands`)
- **Guard functions:** 4 (`shouldDeferFilterOperation`, `isSmartOrdering`, `queueFilterOperation`, `processPendingFilterOperations`)
- **Filter state variables:** 3 (`isFilterOperation`, `isSmartOrderingActive`, `pendingFilterOperations`)
- **Event listeners for filtering:** 2 (metadata input, command palette input)
- **Data stores used for filtering:** 2 (`allMetadataRows`, `COMMANDS`)

---

## Code Snippet Index

| Pattern | Lines | Description |
|---------|-------|-------------|
| `renderMetadataTable(filter = '')` | 4369-4423 | Main metadata filter function |
| `filterCommands(e)` | 9659-9674 | Command palette filter function |
| Guard flags declaration | 6761-6763 | State variables for filter coordination |
| `isSmartOrdering()` | 8415-8417 | Smart ordering guard check |
| `queueFilterOperation()` | 8424-8429 | Queue filter operation during smart ordering |
| `processPendingFilterOperations()` | 8434-8457 | Execute queued filter operations |
| Metadata filter binding | 4417-4422 | Input event listener for metadata table |
| Command filter binding | 9567 | Input event listener for command palette |
| Filter operation with guard pattern | 8562, 8578, 8626, 8638, 8745 | Filter operation coordination pattern |
| Smart ordering check with reason | 9274-9276 | Debug logging for skipped operations |

---

## Relationships and Dependencies

```
renderMetadataTable()
    ↓ uses
allMetadataRows (global state)
    ↓ populated from
currentData.meta
    ↓ filtered by
.filter() method (line 4370-4374)
    ↓ rendered via
renderMetadataRow() (line 4425)

filterCommands()
    ↓ uses
COMMANDS (global constant)
    ↓ filtered by
.filter() method (line 9668-9671)
    ↓ rendered via
renderCommands() (line 9609)

isSmartOrdering()
    ↓ checks
platformPrefs.smartOrdering && isSmartOrderingActive
    ↓ guards
filter operations (lines 8562, 8578, 8626, 8638, 8745)
    ↓ coordinates with
queueFilterOperation() → processPendingFilterOperations()
```

---

## Notes

- All filter operations use case-insensitive matching (`.toLowerCase()`)
- Real-time filtering uses `input` event (fires on every keystroke)
- Smart ordering guard system prevents race conditions during platform reordering
- Filter operations are queued when smart ordering is active to prevent conflicts
- Empty filter strings show all items (no filtering applied)
- Metadata filter hides JSON-LD section when active (line 4406)
