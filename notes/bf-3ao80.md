# Event Listener Patterns for Filter Changes in Vista app.js

## Summary
Search conducted for all addEventListener calls related to filter changes in `/home/coding/vista/src/public/app.js`.

## Findings

### 1. Metadata Filter Input (Line 3991)

**Location:** Line 3991
**Element:** `#metadataFilterInput`
**Event Type:** `'input'`
**Handler Function:** Inline arrow function

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Handler Function Details:**
- **Function:** `renderMetadataTable(filter = '')` (defined at line 3941)
- **Purpose:** Filters metadata table rows by tag name or value
- **Pattern:** Direct filtering of `allMetadataRows` array based on tag/value text match

### 2. Command Palette Filter Input (Line 9085)

**Location:** Line 9085
**Element:** `#commandInput`
**Event Type:** `'input'`
**Handler Function:** `filterCommands`

```javascript
// Add event listeners
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
input.addEventListener('keydown', handleCommandKeydown);
```

**Handler Function Details:**
- **Function:** `filterCommands(e)` (defined at line 9177)
- **Purpose:** Filters command palette commands by label or category
- **Pattern:** Filters `COMMANDS` array based on query match

## Non-Filter Input Event Listeners

The following addEventListener('input', ...) calls were found but are **NOT filter-related**:

- Line 311: `oggenBgColor?.addEventListener('input', updateOggenCanvas)` - OG generator color picker
- Line 312: `oggenGradientStart?.addEventListener('input', updateOggenCanvas)` - OG generator gradient
- Line 313: `oggenGradientEnd?.addEventListener('input', updateOggenCanvas)` - OG generator gradient
- Line 317: `oggenTitle?.addEventListener('input', updateOggenCanvas)` - OG generator title
- Line 318: `oggenSubtitle?.addEventListener('input', updateOggenCanvas)` - OG generator subtitle
- Line 320: `oggenTextColor?.addEventListener('input', updateOggenCanvas)` - OG generator text color
- Line 323: `oggenLogoSize?.addEventListener('input', updateOggenCanvas)` - OG generator logo size
- Line 6801: `input.addEventListener('input', handleEditorInput)` - Editor input handler

## Additional Search Results

### No Custom Filter Events Found
- No `dispatchEvent` calls related to filters found
- No custom event names like 'filter-change' or 'filterChange' found
- No `onfilter` or `onFilter` callback patterns found
- No inline event handlers (`oninput`, `onchange`) with filter functionality found

## Conclusions

1. **Total filter-related event listeners found:** 2
2. **Event types used:** Only `'input'` events (no `'change'` events for filters)
3. **Pattern:** Both filters use real-time input event filtering (not wait-for-enter pattern)
4. **No custom filter event infrastructure:** No custom filter-change events or callback hooks found
5. **Both filters are self-contained:** Each filter listener calls its handler directly without dispatching custom events

## Code Snippets

### Filter 1: Metadata Table Filter
```javascript
// Lines 3988-3994
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}

// Lines 3941-3947 (handler function)
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... rest of function
}
```

### Filter 2: Command Palette Filter
```javascript
// Lines 9084-9085
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);

// Lines 9177-9192 (handler function)
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

**Search Date:** 2026-07-24  
**File:** `/home/coding/vista/src/public/app.js`  
**Total Lines:** ~12,000  
**Filter-related Listeners:** 2
