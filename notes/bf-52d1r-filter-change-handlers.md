# Filter Change Handlers in app.js

## Summary

All filter change handler functions identified in `/home/coding/vista/src/public/app.js` with their line numbers and DOM element attachments.

## Primary Filter Handlers

### 1. Metadata Filter Handler
- **Function:** `renderMetadataTable(filter = '')`
- **Line:** 3941
- **DOM Element:** `metadataFilterInput` (line 3989)
- **Event Type:** `input`
- **Attachment Code:**
  ```javascript
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
  ```
- **Lines:** 3989-3993

### 2. Command Palette Filter Handler
- **Function:** `filterCommands(e)`
- **Line:** 9177
- **DOM Element:** `commandInput` (line 9084)
- **Event Type:** `input`
- **Attachment Code:**
  ```javascript
  input.addEventListener('input', filterCommands);
  ```
- **Lines:** 9084-9085

## Sort/Order Change Handlers

### 3. Heatmap Sort Handler
- **Function:** `handleHeatmapSort()`
- **Line:** 6101
- **DOM Element:** `heatmapSort` (line 218)
- **Event Type:** `change`
- **Attachment Code:**
  ```javascript
  heatmapSort?.addEventListener('change', handleHeatmapSort);
  ```
- **Lines:** 218, 332

## UI Component Change Handlers

### 4. Badge Style Handler
- **Function:** `updateBadgePreview()`
- **Line:** 4765
- **DOM Element:** `badgeStyleSelect` (line 169)
- **Event Type:** `change`
- **Attachment Code:**
  ```javascript
  badgeStyleSelect?.addEventListener('change', updateBadgePreview);
  ```
- **Lines:** 169, 296

## OpenGraph Generator Handlers

### 5. Background Type Handler
- **Function:** `handleBgTypeChange()`
- **Line:** 5106
- **DOM Element:** `oggenBgType` (line 186)
- **Event Type:** `change`
- **Attachment:** Line 310

### 6. Background Image Upload Handler
- **Function:** `handleBgImageUpload(e)`
- **Line:** 5117
- **DOM Element:** `oggenBgImageInput` (line 193)
- **Event Type:** `change`
- **Attachment:** Line 315

### 7. Logo Position Handler
- **Function:** `handleLogoPosChange()`
- **Line:** 5133
- **DOM Element:** `oggenLogoPos` (line 200)
- **Event Type:** `change`
- **Attachment:** Line 321

### 8. Logo Upload Handler
- **Function:** `handleLogoUpload(e)`
- **Line:** 5140
- **DOM Element:** `oggenLogoInput` (line 201)
- **Event Type:** `change`
- **Attachment:** Line 322

### 9. Canvas Update Handler
- **Function:** `updateOggenCanvas()`
- **Line:** 5156
- **DOM Elements:**
  - `oggenBgColor` (line 187) - `input` event (line 311)
  - `oggenGradientStart` (line 189) - `input` event (line 312)
  - `oggenGradientEnd` (line 190) - `input` event (line 313)
  - `oggenGradientDir` (line 191) - `change` event (line 314)
  - `oggenBgImageSize` (line 194) - `change` event (line 316)
  - `oggenTitle` (line 196) - `input` event (line 317)
  - `oggenSubtitle` (line 197) - `input` event (line 318)
  - `oggenFont` (line 198) - `change` event (line 319)
  - `oggenTextColor` (line 199) - `input` event (line 320)
  - `oggenLogoSize` (line 202) - `input` event (line 323)

## Toggle Handlers (Filter-Related)

### 10. Global Theme Toggle
- **Function:** `toggleGlobalTheme()`
- **Line:** 108
- **DOM Element:** `globalThemeToggle`
- **Event Type:** `click`
- **Attachment:** Line 510

### 11. Card Context Toggle
- **Function:** `toggleCardContext(pid, data)`
- **Line:** 2162
- **DOM Elements:** Dynamic `contextToggle` buttons
- **Event Type:** `click`
- **Attachments:** Lines 1995, 2092

### 12. Card Theme Toggle
- **Function:** `toggleCardTheme(pid, data)`
- **Line:** 2175
- **DOM Elements:** Dynamic `themeToggle` buttons
- **Event Type:** `click`
- **Attachments:** Lines 2001, 2096

### 13. Favorite Toggle
- **Function:** `toggleFavorite(pid)`
- **Line:** 7867
- **DOM Elements:** Dynamic favorite buttons
- **Event Type:** `click`
- **Attachment:** Line 8008

### 14. What-If Mode Toggle
- **Function:** `toggleWhatIfMode()`
- **Line:** 8121
- **DOM Element:** `whatIfToggleBtn`
- **Event Type:** `click`
- **Attachment:** Line 8334

### 15. Character Gauge Group Toggle
- **Function:** `toggleCharGaugeGroup(groupId)`
- **Line:** 6529
- **DOM Elements:** Dynamic gauge group headers
- **Event Type:** `click` (via onclick attribute)
- **Usage:** Line 6468

### 16. All Character Gauges Toggle
- **Function:** `toggleAllCharGauges(fieldId)`
- **Line:** 6549
- **DOM Elements:** Dynamic gauge summary elements
- **Event Type:** `click` (via onclick attribute)
- **Usage:** Line 6455

## Form Submission Handlers (Filter-Related)

### 17. URL Inspection
- **Function:** `inspectUrl(url)`
- **Line:** 911
- **DOM Element:** `urlForm`
- **Event Type:** `submit`
- **Attachment:** Line 230

### 18. HTML Paste Inspection
- **Function:** `inspectHtml(html, base)`
- **Line:** 929
- **DOM Element:** `pasteForm`
- **Event Type:** `submit`
- **Attachment:** Line 231

### 19. Compare Submit
- **Function:** `handleCompareSubmit()`
- **Line:** 5430
- **DOM Element:** `compareForm`
- **Event Type:** `submit`
- **Attachment:** Line 276

### 20. Sitemap Submit
- **Function:** `handleSitemapSubmit()`
- **Line:** 5872
- **DOM Element:** `sitemapForm`
- **Event Type:** `submit`
- **Attachment:** Line 331

## Mode/Tab Switch Handlers

### 21. Mode Switch
- **Function:** `switchMode(mode)`
- **Line:** 513
- **DOM Elements:**
  - `switchToPaste` (line 270)
  - `switchToUrl` (line 271)
  - `navInspect` (line 272)
  - `navPaste` (line 273)
  - `navCompare` (line 274)
  - `switchToInspectFromCompare` (line 275)
  - `navSitemap` (line 329)
  - `switchToInspectFromSitemap` (line 330)
- **Event Type:** `click`

### 22. Tab Switch
- **Function:** `switchTab(tabId)`
- **Line:** 4572
- **DOM Elements:** Dynamic tab buttons
- **Event Type:** `click`
- **Attachments:** Lines 347, 9421-9422

## Import/Export Handlers

### 23. Code Snippet Generation
- **Function:** `generateCodeSnippet()`
- **Line:** 6853
- **DOM Element:** `snippetFramework`
- **Event Type:** `change`
- **Attachment:** Line 6813

### 24. Preferences Import
- **Function:** `importPreferences(e)`
- **Line:** 8057
- **DOM Element:** `importPrefsInput`
- **Event Type:** `change`
- **Attachment:** Line 6831

### 25. Metadata Export (JSON)
- **Function:** `exportMetadataAsJson()`
- **Line:** 4025
- **DOM Element:** Dynamic button via onclick
- **Usage:** Line 3993

### 26. Metadata Export (CSV)
- **Function:** `exportMetadataAsCsv()`
- **Line:** 4044
- **DOM Element:** Dynamic button via onclick
- **Usage:** Line 3994

### 27. Sitemap Export (CSV)
- **Function:** `exportSitemapDataAsCsv()`
- **Line:** 6125
- **DOM Element:** `exportSitemapCsv`
- **Event Type:** `click`
- **Attachment:** Line 333

### 28. Sitemap Export (JSON)
- **Function:** `exportSitemapDataAsJson()`
- **Line:** 6174
- **DOM Element:** `exportSitemapJson`
- **Event Type:** `click`
- **Attachment:** Line 334

## Filter Operation Guard Functions

These are utility functions that manage filter operation queuing and prevent conflicts:

### 29. Filter Operation Guard
- **Function:** `shouldDeferFilterOperation()`
- **Line:** 7891
- **Purpose:** Determines if filter operations should be deferred

### 30. Queue Filter Operation
- **Function:** `queueFilterOperation(operation, description)`
- **Line:** 7942
- **Purpose:** Queues filter operations for deferred execution

### 31. Process Pending Filter Operations
- **Function:** `processPendingFilterOperations()`
- **Line:** 7952
- **Purpose:** Executes queued filter operations

### 32. Filter Operation Flag
- **Variable:** `isFilterOperation`
- **Line:** 6279
- **Purpose:** Global flag to prevent smart order resets during filter changes
- **Exposed as:** Window property (lines 5046-5048)

## Context Menu Handlers

### 33. Show Card Context Menu
- **Function:** `showCardContextMenu(e, pid, groupId, data)`
- **Line:** 9721
- **DOM Elements:** Dynamic card elements
- **Event Type:** `contextmenu`
- **Attachments:** Lines 2005, 2100

### 34. Handle Context Menu Action
- **Function:** `handleContextMenuAction(e)`
- **Line:** 9771
- **DOM Elements:** Dynamic menu items
- **Event Type:** `click`
- **Attachment:** Line 9702

## Summary Statistics

- **Total filter-related handlers identified:** 34
- **Primary filter input handlers:** 2 (metadata, command palette)
- **Sort/order handlers:** 1 (heatmap)
- **Toggle handlers:** 7 (theme, context, favorite, what-if, gauges)
- **Form submission handlers:** 5 (URL, HTML, compare, sitemap)
- **Mode/tab handlers:** 2 (mode switch, tab switch)
- **Import/export handlers:** 6 (snippet, prefs, metadata, sitemap)
- **OpenGraph generator handlers:** 5 (background, logo, canvas)
- **Guard/utility functions:** 4 (defer, queue, process, flag)
- **Context menu handlers:** 2 (show menu, handle action)

## Notes

1. Most handlers use optional chaining (`?.addEventListener`) to handle cases where elements might not exist
2. Many handlers are attached to dynamically created elements within rendering functions
3. Filter operation guards (lines 7885-7972) provide a centralized system for managing filter state changes
4. Some handlers use inline onclick attributes rather than addEventListener for dynamically generated elements
