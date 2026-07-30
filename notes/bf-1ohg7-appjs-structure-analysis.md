# app.js Structure Analysis

## File Overview
- **Location:** `/home/coding/vista/src/public/app.js`
- **Size:** 9,998 lines
- **Purpose:** VISTA frontend application - main client-side application logic

## Overall Structure

### 1. State Management (Lines 1-100)
- Global state variables for modes, data, UI state
- Platform configuration
- Debug flags
- Theme state
- Keyboard navigation state

### 2. DOM References (Lines 117-227)
- Element selectors for all major UI components
- Organized by feature area:
  - Core elements (hero, forms, results)
  - Modal components (badge, QR, OG generator)
  - Sitemap components

### 3. Event Listeners (Lines 229-500)
- Form submissions
- Mode switching
- Tab navigation
- Modal interactions
- Sitemap event handlers

### 4. Hash State Management (Lines 381-500)
- URL hash parsing and restoration
- Tab state persistence
- What If mode disabled tags persistence
- Compare mode second URL storage

## Filter-Related Sections

### A. Metadata Table Filter (Lines 3941-3995)
**Function:** `renderMetadataTable(filter = '')`

**Purpose:** Filters metadata tags in the Raw Tags tab

**Key Features:**
- Text-based filter on tag names and values
- Shows count: "X of Y tags"
- Real-time filtering on input
- Exports JSON/CSV with filter applied

**Code Location:** Lines 3941-3995
```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders filtered table
}
```

### B. What If Mode Filter (Lines 8117-8289)
**Functions:**
- `toggleWhatIfMode()` (Lines 8121-8162)
- `showWhatIfPanel()` (Lines 8164-8221)
- `applyWhatIfChanges()` (Lines 8241-8280)
- `applyPendingWhatIfTags()` (Lines 8286+)

**Purpose:** Allows users to disable specific meta tags to see fallback behavior

**Key Features:**
- Toggle tags on/off via checkboxes
- Groups: Open Graph, Twitter Card, Basic tags
- Persists disabled tags to URL hash
- Re-renders previews with modified metadata
- Screen reader announcements

**State:**
- `whatIfMode`: boolean
- `disabledTags`: Set of tag names
- `pendingWhatIfTags`: stores tags from hash before data loads

### C. Filter Operation Guard System (Lines 6272-6281, 7885-7975)

**Guard Flags:**
```javascript
let isFilterOperation = false; // Line 6279
let isSmartOrderingActive = false; // Line 6280
let pendingFilterOperations = []; // Line 6281
```

**Guard Functions:**

#### `isSmartOrdering()` (Lines 7933-7935)
Checks if smart ordering is both enabled AND active

#### `shouldDeferFilterOperation()` (Lines 7891-7893)
Returns true if filter operation should be deferred

#### `queueFilterOperation()` (Lines 7942-7947)
Queues filter operations to run after smart ordering completes

#### `processPendingFilterOperations()` (Lines 7952-7975)
Executes queued filter operations

**Purpose:** Prevents race conditions between filter changes and smart ordering

### D. Command Palette Filter (Lines 9177-9191)
**Function:** `filterCommands(e)`

**Purpose:** Filters command palette options

**Code Location:** Lines 9177-9191
```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase();
  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    (cmd.keywords && cmd.keywords.some(k => k.toLowerCase().includes(query)))
  );
  renderCommands(filtered);
}
```

## Other Array.filter() Usage

The file uses `.filter()` extensively for data manipulation:

1. **URL Parsing** (Line 459): Filter split hash tags
2. **Sitemap URLs** (Line 585): Filter trimmed URLs
3. **Diagnostics** (Lines 1231-1232): Filter errors/warnings by severity
4. **Platform Groups** (Lines 1548-1549, 1647-1650): Filter platforms in custom order
5. **Scoring** (Lines 1619-1622, 1746-1749, 1765-1768): Filter scores by grade
6. **DOM Operations** (Lines 3536, 3538, 3625, 3719): Filter DOM elements
7. **Recents** (Line 4598): Filter recent items
8. **Diagnostic Sorting** (Lines 3779-3781): Filter diagnostics by severity

## Key Patterns

### Filter Handler Pattern
```javascript
function filterHandler() {
  if (isSmartOrdering()) {
    queueFilterOperation(filterHandler, 'filterHandler');
    return;
  }
  isFilterOperation = true;
  // Perform filter operation
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
}
```

### Filter with Guard Pattern
Used in:
- `importPreferences()` (Lines 8095-8099)
- `toggleWhatIfMode()` (Lines 8144-8159)
- `applyWhatIfChanges()` (Lines 8263-8265)

## Architecture Notes

1. **Centralized Guard System:** All filter operations use the same guard pattern to prevent conflicts with smart ordering

2. **Hash State Integration:** Filter state (What If disabled tags) persists to URL hash for shareability

3. **Deferred Execution:** Filter operations during smart ordering are queued and processed after completion

4. **Screen Reader Support:** Filter operations include `announce()` calls for accessibility

## Related Files (Inferred)
- `/home/coding/vista/src/public/frames-theme.js` (loaded before app.js)
- Platform configuration: `/api/platforms`
- Bead references: `bf-4bo1`, `bf-5125`
