# Filter Event Listeners in app.js

## Summary
Two filter-related event listeners were identified in the app.js file.

---

## Filter 1: Metadata Tags Filter

**Location:** Line 3991

**DOM Element:** 
- Element ID: `metadataFilterInput`
- Element Type: Text input field
- Retrieved via: `document.getElementById('metadataFilterInput')`

**Event Type:** `'input'`

**Handler Implementation:**
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

**Handler Details:**
- Type: Inline arrow function
- Function called: `renderMetadataTable(e.target.value)`
- Purpose: Real-time filtering of metadata tags table

**Context (lines 3989-3994):**
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Handler Function:** `renderMetadataTable(filter = '')` - defined at line 3941
- Filters metadata rows based on the input value
- Re-renders the table with filtered results
- Updates filter count display

---

## Filter 2: Command Palette Filter

**Location:** Line 9110

**DOM Element:**
- Element ID: `commandInput`
- Element Type: Text input field
- Retrieved via: `document.getElementById('commandInput')`

**Event Type:** `'input'`

**Handler Implementation:**
```javascript
input.addEventListener('input', filterCommands);
```

**Handler Details:**
- Type: Named function reference
- Function name: `filterCommands`
- Purpose: Real-time filtering of command palette options

**Context (lines 9109-9111):**
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

**Handler Function:** `filterCommands(e)` - defined at line 9202
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

---

## Additional Notes

### Related DOM Elements
- `metadataFilterInput`: Text input with placeholder "Filter tags..."
- `commandInput`: Text input for command palette search

### Related Functions
- `renderMetadataTable(filter)`: Renders filtered metadata table (line 3941)
- `filterCommands(e)`: Filters and renders command options (line 9202)
- `renderCommands(commands)`: Renders command list (used by filterCommands)

### Event Types
Both filters use the `'input'` event, which triggers on every keystroke for real-time filtering.

---

## Search Methodology

This analysis was conducted by:
1. Searching for `addEventListener` calls with "filter" in context
2. Searching for filter-related DOM elements (IDs, classes, placeholders)
3. Examining handler function definitions
4. Checking for related patterns like change events on filter UI elements

The two event listeners identified above represent the complete set of filter-related event listeners in the app.js file.
