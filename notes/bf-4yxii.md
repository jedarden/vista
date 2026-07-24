# Filter Input Event Listener Patterns in app.js

## Overview
This document catalogs all `addEventListener` patterns related to filter inputs in `/home/coding/vista/src/public/app.js`.

---

## Pattern 1: Metadata Filter Input Listener

**Location:** Line 3991  
**Event Type:** `input`  
**Component:** Metadata Viewer Panel  
**Context:** Inside renderMetadataTable() function

### Code Snippet
```javascript
// Line 3989-3996
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

### HTML Element
```html
<!-- Line 3952 -->
<input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
```

### Handler Function
**Function:** `renderMetadataTable(filter = '')` (Line 3941)  
**Purpose:** Re-renders the metadata table with filtered results

**Filtering Logic:**
```javascript
// Line 3943-3948
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```

### Filtering Behavior
- **Case-insensitive** matching on both tag names and values
- **Real-time filtering** as user types (input event)
- **Search scope:** Tag names AND tag values
- **Visual feedback:** Shows filter count (e.g., "15 of 45 tags")

---

## Pattern 2: Command Palette Filter Listener

**Location:** Line 9085  
**Event Type:** `input`  
**Component:** Command Palette (Cmd+K)  
**Context:** Inside openCommandPalette() function

### Code Snippet
```javascript
// Line 9084-9086
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

### HTML Element
```html
<!-- Lines 9078-9081 -->
<input
  type="text"
  id="commandInput"
  class="command-palette-input"
  type="search"
  role="combobox"
  aria-controls="commandResults"
  aria-activedescendant=""
  aria-label="Search commands"
  placeholder="Type a command or search..."
  autocomplete="off" />
```

### Handler Function
**Function:** `filterCommands(e)` (Line 9177)  
**Purpose:** Filters and re-renders command palette items

**Filtering Logic:**
```javascript
// Line 9178-9191
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

### Filtering Behavior
- **Case-insensitive** matching on command labels and categories
- **Real-time filtering** as user types (input event)
- **Search scope:** Command labels AND command categories
- **Resets selection** when filter changes (line 9180)
- **Empty query** shows all commands

---

## Summary

| Pattern | Line | Element ID | Event | Handler | Search Scope |
|---------|------|------------|-------|---------|--------------|
| Metadata Filter | 3991 | `metadataFilterInput` | input | `renderMetadataTable()` | Tag names + values |
| Command Palette | 9085 | `commandInput` | input | `filterCommands()` | Labels + categories |

## Event Type Notes
- Both patterns use the **`input` event** (not `change`)
  - `input` fires on every keystroke/change
  - `change` fires only on blur/enter
  - This enables **real-time filtering** as users type

## Anti-Patterns Found (Not Filter-Related)
- Line 311-323: OgImage generator input listeners (update canvas on input)
- Line 6801: Editor input listeners (handle editor input changes)

## Related Functions
- `renderMetadataTable(filter)` - Line 3941
- `renderCommands(commands)` - Line 9127
- `filterCommands(e)` - Line 9177
- `handleCommandKeydown(e)` - Line 9194
- `handleEditorInput(e)` - Line 6801 (not a filter)
