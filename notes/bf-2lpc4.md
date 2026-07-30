# Filter-Related addEventListener Patterns in app.js

Search completed: 2026-07-24

## Summary
Found **2 filter-related addEventListener patterns** in `/home/coding/vista/src/public/app.js` out of 124 total addEventListener calls.

---

## Pattern 1: Metadata Filter Input

- **Pattern type**: addEventListener for filter change (input event)
- **Line number**: 3991
- **Element**: `filterInput` (metadataFilterInput)
- **Event**: `'input'`
- **Callback**: Inline arrow function calling `renderMetadataTable(e.target.value)`

### Code snippet:
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```

### Context (5 lines before and after):
```javascript
  html += '</div>';
  rawTagsPanel.innerHTML = html;

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}

function renderMetadataRow(row, idx) {
  const hasValue = row.value || row.value === 0;
  const valueDisplay = hasValue
    ? (row.isImage && row.value ? escHtml(row.value) + `<br><img class="tag-image-thumb" src="${escHtml(row.value)}" alt="" onerror="this.style.display='none'" loading="lazy" />` : escHtml(String(row.value)))
    : '<span class="empty-value">—</span>';
```

### Purpose:
Real-time filtering of the metadata table rows as the user types in the filter input field. The filter value is passed directly to `renderMetadataTable()` which presumably filters the displayed rows.

---

## Pattern 2: Command Palette Filter Input

- **Pattern type**: addEventListener for filter change (input event)
- **Line number**: 9085
- **Element**: `input` (commandInput)
- **Event**: `'input'`
- **Callback**: `filterCommands` function reference

### Code snippet:
```javascript
input.addEventListener('input', filterCommands);
```

### Context (5 lines before and after):
```javascript
  `;
  document.body.appendChild(overlay);

  // Add event listeners
  const input = document.getElementById('commandInput');
  input.addEventListener('input', filterCommands);
  input.addEventListener('keydown', handleCommandKeydown);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCommandPalette();
  });

  // Global keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
```

### Purpose:
Real-time filtering of command palette options as the user types. The `filterCommands` function filters the available commands based on the input text, likely for a keyboard-driven command palette interface (invoked via Ctrl+K or Cmd+K).

---

## Analysis

Both patterns use the `'input'` event for real-time filtering:
1. **Metadata filter** - Uses inline callback, direct value passing
2. **Command palette filter** - Uses named function reference, cleaner separation

Both are implementing reactive filtering that updates as the user types, providing immediate feedback without requiring form submission or explicit action.

## Search Methodology
- Searched all 124 addEventListener calls in app.js
- Filtered for patterns containing 'filter' in element names, event names, or callback functions
- Verified with multiple grep patterns to ensure comprehensive coverage
- Captured extended context (10+ lines) for each pattern to provide full understanding
