# Filter Change Event Patterns in app.js

## Task Summary

Searched `/home/coding/vista/src/public/app.js` for common filter change event patterns including:
- Event listeners with 'change' and 'filter' keywords
- addEventListener calls with filter/change keywords
- Methods named with 'change' or 'filter' patterns
- All pattern matches documented below

---

## Event Listener Patterns Found

### 1. Change Event Listeners (Direct UI Changes)

#### OG Generator Controls (Lines 296-323)
```javascript
badgeStyleSelect?.addEventListener('change', updateBadgePreview);
oggenBgType?.addEventListener('change', handleBgTypeChange);
oggenGradientDir?.addEventListener('change', updateOggenCanvas);
oggenBgImageInput?.addEventListener('change', handleBgImageUpload);
oggenBgImageSize?.addEventListener('change', updateOggenCanvas);
oggenFont?.addEventListener('change', updateOggenCanvas);
oggenLogoPos?.addEventListener('change', handleLogoPosChange);
oggenLogoInput?.addEventListener('change', handleLogoUpload);
```

#### Heatmap Sorting (Line 332)
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```

#### Checkbox Group Handlers (Lines 3481, 3497, 8207)
```javascript
groupCb.addEventListener('change', (e) => { /* ... */ });
cb.addEventListener('change', () => { /* ... */ });
```

#### Configuration Changes (Lines 6813, 6831)
```javascript
document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);
document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);
```

### 2. Input Event Listeners (Real-time Filtering)

#### OG Generator Color/Text Inputs (Lines 311-312, 317-318, 323)
```javascript
oggenBgColor?.addEventListener('input', updateOggenCanvas);
oggenGradientStart?.addEventListener('input', updateOggenCanvas);
oggenGradientEnd?.addEventListener('input', updateOggenCanvas);
oggenTitle?.addEventListener('input', updateOggenCanvas);
oggenSubtitle?.addEventListener('input', updateOggenCanvas);
oggenTextColor?.addEventListener('input', updateOggenCanvas);
ogenLogoSize?.addEventListener('input', updateOggenCanvas);
```

#### Metadata Filter Input (Line 3991)
```javascript
filterInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  // Filter logic...
});
```

#### Command Palette Filter (Line 9085)
```javascript
input.addEventListener('input', filterCommands);
```

#### Editor Input Handler (Line 6801)
```javascript
input.addEventListener('input', handleEditorInput);
```

---

## Handler Function Patterns

### Change Handler Functions

1. **handleBgTypeChange()** (Line 5106)
   - Toggles visibility of background controls based on bgType
   - Updates oggenCanvas after state change

2. **handleLogoPosChange()** (Line 5133)
   - Toggles logo upload row visibility
   - Updates oggenCanvas after state change

3. **handleHeatmapSort()** (Line 6101)
   - Sorts heatmap results based on selected criteria
   - Supports: score-asc, score-desc, name-asc, name-desc

### Filter Handler Functions

1. **filterCommands(e)** (Line 9177)
   - Filters command palette based on search query
   - Searches both command labels and shortcuts
   - Pattern:
     ```javascript
     const filtered = COMMANDS.filter(cmd =>
       cmd.label.toLowerCase().includes(query) ||
       cmd.shortcuts?.some(s => s.toLowerCase().includes(query))
     );
     ```

2. **renderMetadataTable(filter = '')** (Line 3941)
   - Renders metadata table with optional filter string
   - Uses filter parameter to show/hide rows

---

## Array Filter Operations Found

### Platform/Group Filtering (Lines 1548-1549, 1647-1650, 1791-1792)
```javascript
const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
const missingFromCardOrder = group.platforms.filter(pid => !cardOrderForGroup.includes(pid));
```

### Grade Filtering (Lines 1620-1622, 1747-1749, 1766-1768)
```javascript
const gPassing = groupScores.filter(s => ['A+','A'].includes(s.grade)).length;
const gWarn = groupScores.filter(s => ['B','C'].includes(s.grade)).length;
const gFail = groupScores.filter(s => ['D','F'].includes(s.grade)).length;
```

### Diagnostic Filtering (Lines 1231-1232, 3779-3781)
```javascript
const errCount = (data.diagnostics || []).filter(d => d.severity === 'error').length;
const warnCount = (data.diagnostics || []).filter(d => d.severity === 'warning').length;
const infoCount = sorted.filter(d => d.severity === 'info').length;
```

### Boolean/Empty Filters (Lines 459, 585, 3536)
```javascript
const tags = state.without.split(',').filter(t => t);
const urls = trimmed.split(/[\r\n]+/).map(u => u.trim()).filter(u => u);
.filter(Boolean);
```

### Checkbox State Filtering (Line 3538)
```javascript
const checkedCount = children.filter(cb => cb.checked).length;
```

### Item Filtering (Lines 8613, 8617)
```javascript
const fixed = items.filter(el => el.dataset.fixed === 'true').length;
const activeErrWarn = items.filter(el => /* condition */);
```

### Recent Commands Filtering (Lines 9186, 9225)
```javascript
const filtered = COMMANDS.filter(cmd => /* label/shortcut match */);
recentCommands = recentCommands.filter(c => c !== id);
```

---

## Summary

### Total Event Listeners Found: 24
- **'change' events**: 13 (direct UI state changes)
- **'input' events**: 11 (real-time filtering and updates)

### Handler Functions Naming Conventions:
- `handle<Feature><Action>()` - State change handlers (e.g., handleBgTypeChange, handleLogoPosChange)
- `filter<Feature>()` - Filter logic (e.g., filterCommands)
- `update<Feature>()` - Render updates (e.g., updateOggenCanvas, updateBadgePreview)

### Common Patterns:
1. **Checkbox filtering**: Array `.filter(cb => cb.checked)` to count checked items
2. **Platform filtering**: `.filter(pid => group.platforms.includes(pid))` for platform group operations
3. **Grade filtering**: `.filter(s => ['A+','A'].includes(s.grade))` for grade-based grouping
4. **Diagnostic filtering**: `.filter(d => d.severity === 'error')` for severity-based filtering
5. **Text filtering**: `.filter(t => t)` to remove empty strings from split arrays
6. **Command palette filtering**: Case-insensitive label/shortcut matching

### Key Architecture Points:
- Filter operations use native JavaScript `.filter()` extensively (40+ occurrences)
- Change events typically trigger both state updates and re-renders
- Input events provide real-time feedback (color pickers, text inputs)
- Checkbox change handlers use arrow functions for inline state management
- No custom 'onFilterChange' or 'on*Change' property patterns found - all use addEventListener
