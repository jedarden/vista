# Event Listener Patterns for Filter Changes in app.js

## Search Results

This document catalogs all event listener patterns related to filter changes found in `/home/coding/vista/src/public/app.js`.

---

## Pattern 1: Direct Inline Callback for Metadata Filter

**Pattern Type:** `addEventListener` with inline arrow function callback  
**Line Number:** 3991  
**Element ID:** `metadataFilterInput`

### Code Snippet
```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

### Context
- **Location:** Lines 3988-3995
- **Surrounding Code:** This is inside a function that renders a metadata table (likely part of raw tags panel rendering)
- **Event Type:** `'input'` event (fires on every keystroke/input change)
- **Callback Type:** Inline arrow function
- **Action:** Calls `renderMetadataTable()` with the input value as filter parameter

### Function Being Called: `renderMetadataTable()`
**Line:** 3941

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... renders filtered metadata rows
}
```

**Filter Logic:**
- Filters `allMetadataRows` array
- Case-insensitive search on both `tag` and `value` fields
- Uses `includes()` for partial matching

---

## Pattern 2: Named Function Callback for Command Palette

**Pattern Type:** `addEventListener` with named function callback  
**Line Number:** 9085  
**Element ID:** `commandInput`

### Code Snippet
```javascript
// Add event listeners
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

### Context
- **Location:** Lines 9084-9091 (within command palette initialization)
- **Event Type:** `'input'` event (fires on every keystroke/input change)
- **Callback Type:** Named function reference (`filterCommands`)
- **Related Event:** Also has `'keydown'` event listener for keyboard navigation
- **Action:** Calls `filterCommands()` to filter command palette items

### Function Being Called: `filterCommands()`
**Line:** 9177

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

**Filter Logic:**
- Resets `commandPaletteSelectedIndex` to 0 on new filter
- Trims and lowercases the query
- If query is empty, renders all commands
- Filters `COMMANDS` array by `label` or `category` fields
- Case-insensitive partial matching with `includes()`

---

## Summary

### Total Patterns Found: 2

| Pattern | Line | Element | Event Type | Callback Style | Purpose |
|---------|------|---------|------------|----------------|---------|
| Inline arrow function | 3991 | `metadataFilterInput` | `input` | Inline `(e) => {...}` | Filter metadata table by tag/value |
| Named function | 9085 | `commandInput` | `input` | Named `filterCommands` | Filter command palette items |

### Common Characteristics

1. **Both use the `'input'` event** (not `'change'` or `'keyup'`)
   - `'input'` fires immediately on any value change
   - Provides real-time filtering as user types

2. **Both implement case-insensitive filtering**
   - Use `toLowerCase()` for comparison
   - Allow partial matching with `includes()`

3. **Both follow immediate filtering pattern**
   - No debounce/throttle applied
   - Filter happens on every keystroke

4. **Both use defensive checks**
   - Pattern 1: `if (filterInput)` check before adding listener
   - Pattern 2: Assumes element exists in command palette context

### No Other Filter Event Patterns Found

- **No `onFilterChange` handlers**
- **No `onFilter` event properties**
- **No `filterchange` custom events**
- **No `.on()` jQuery-style patterns**

The codebase uses standard vanilla JavaScript `addEventListener` with the `'input'` event for all filter interactions.
