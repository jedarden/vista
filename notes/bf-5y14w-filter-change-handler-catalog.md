# Filter Change Handler Functions in app.js

**Task:** Extract filter change handler function names and line numbers  
**Bead ID:** bf-5y14w  
**File:** `/home/coding/vista/src/public/app.js`  
**Date:** 2026-07-24

---

## Named Filter Change Handler Functions

### Core Filter/Change Handlers

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `renderMetadataTable` | 3941 | `function renderMetadataTable(filter = '') {` | Metadata table filtering with parameter |
| `getFieldChangeClass` | 4367 | `function getFieldChangeClass(diff, field) {` | Get CSS class for field changes |
| `renderChangeIndicator` | 4385 | `function renderChangeIndicator(diff, field) {` | Render visual change indicators |
| `filterCommands` | 9177 | `function filterCommands(e) {` | Command palette filtering |

### OG Generator Handlers (Open Graph Image Generator)

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleBgTypeChange` | 5106 | `function handleBgTypeChange() {` | Handle background type changes |
| `handleBgImageUpload` | 5117 | `function handleBgImageUpload(e) {` | Handle background image uploads |
| `handleLogoPosChange` | 5133 | `function handleLogoPosChange() {` | Handle logo position changes |
| `handleLogoUpload` | 5140 | `function handleLogoUpload(e) {` | Handle logo uploads |
| `updateOggenCanvas` | 5156 | `function updateOggenCanvas() {` | Update OG generator canvas on changes |

### Sitemap Handlers

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleHeatmapSort` | 6101 | `function handleHeatmapSort() {` | Handle sitemap heatmap sorting changes |

### Code Editor Handlers

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleEditorInput` | 6589 | `function handleEditorInput(e) {` | Handle code editor input changes |

### Smart Ordering Guard Functions

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `isSmartOrdering` | 7933 | `function isSmartOrdering() {` | Check if smart ordering mode is active |
| `shouldDeferFilterOperation` | 7891 | `function shouldDeferFilterOperation() {` | Determine if filter operation should be deferred |
| `queueFilterOperation` | 7942 | `function queueFilterOperation(operation, description) {` | Queue a filter operation for deferred execution |
| `processPendingFilterOperations` | 7952 | `function processPendingFilterOperations() {` | Process queued filter operations |

### Import/Export Handlers

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `importPreferences` | 8057 | `function importPreferences(e) {` | Handle preference imports |
| `generateCodeSnippet` | 6853 | `function generateCodeSnippet() {` | Generate embed code snippets |
| `updateBadgePreview` | 4765 | `function updateBadgePreview() {` | Update badge preview on style changes |

### UI Interaction Handlers

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleSwapUrls` | 5499 | `function handleSwapUrls() {` | Handle URL swap functionality |
| `applyWhatIfChanges` | 8241 | `function applyWhatIfChanges() {` | Apply what-if scenario changes |
| `handleCommandKeydown` | 9194 | `function handleCommandKeydown(e) {` | Handle command palette keyboard input |

### Touch/Drag Handlers (Mobile Interactions)

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `handleDragStart` | 9532 | `function handleDragStart(e) {` | Handle drag start events |
| `handleDragEnd` | 9540 | `function handleDragEnd(e) {` | Handle drag end events |
| `handleDragOver` | 9547 | `function handleDragOver(e) {` | Handle drag over events |
| `handleDragEnter` | 9555 | `function handleDragEnter(e) {` | Handle drag enter events |
| `handleDragLeave` | 9561 | `function handleDragLeave(e) {` | Handle drag leave events |
| `handleDrop` | 9565 | `function handleDrop(e) {` | Handle drop events |
| `handleContextMenuAction` | 9771 | `function handleContextMenuAction(e) {` | Handle context menu actions |
| `handleTouchStart` | 9828 | `function handleTouchStart(e) {` | Handle touch start events |
| `handleTouchEnd` | 9853 | `function handleTouchEnd(e) {` | Handle touch end events |
| `handleTouchMove` | 9888 | `function handleTouchMove(e) {` | Handle touch move events |
| `handleHorizontalSwipe` | 9908 | `function handleHorizontalSwipe(deltaX, card) {` | Handle horizontal swipe gestures |
| `handleVerticalSwipe` | 9969 | `function handleVerticalSwipe(deltaY, card) {` | Handle vertical swipe gestures |

---

## Related Utility Functions

| Function | Line | Signature | Purpose |
|----------|------|-----------|---------|
| `updateEnabledPlatforms` | 3551 | `function updateEnabledPlatforms() {` | Update enabled platform selections |

---

## Event Listener Registrations (Change/Input Events)

### OG Generator Control Listeners (Lines 296-332)

| Line | Registration | Handler |
|------|--------------|---------|
| 296 | `badgeStyleSelect?.addEventListener('change', updateBadgePreview);` | `updateBadgePreview` |
| 310 | `oggenBgType?.addEventListener('change', handleBgTypeChange);` | `handleBgTypeChange` |
| 311 | `oggenBgColor?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 312 | `oggenGradientStart?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 313 | `oggenGradientEnd?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 314 | `oggenGradientDir?.addEventListener('change', updateOggenCanvas);` | `updateOggenCanvas` |
| 315 | `oggenBgImageInput?.addEventListener('change', handleBgImageUpload);` | `handleBgImageUpload` |
| 316 | `oggenBgImageSize?.addEventListener('change', updateOggenCanvas);` | `updateOggenCanvas` |
| 317 | `oggenTitle?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 318 | `oggenSubtitle?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 319 | `oggenFont?.addEventListener('change', updateOggenCanvas);` | `updateOggenCanvas` |
| 320 | `oggenTextColor?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 321 | `oggenLogoPos?.addEventListener('change', handleLogoPosChange);` | `handleLogoPosChange` |
| 322 | `oggenLogoInput?.addEventListener('change', handleLogoUpload);` | `handleLogoUpload` |
| 323 | `oggenLogoSize?.addEventListener('input', updateOggenCanvas);` | `updateOggenCanvas` |
| 332 | `heatmapSort?.addEventListener('change', handleHeatmapSort);` | `handleHeatmapSort` |

### Platform Cropper Checkbox Listeners (Lines 3475-3510)

| Line | Registration | Handler |
|------|--------------|---------|
| 3481 | `groupCb.addEventListener('change', (e) => { ... });` | Inline handler (group toggle) |
| 3497 | `cb.addEventListener('change', () => { ... });` | Inline handler (individual platform) |

### Metadata Filter Listeners (Lines 3989-3991)

| Line | Registration | Handler |
|------|--------------|---------|
| 3991 | `filterInput.addEventListener('input', (e) => { ... });` | Inline handler (metadata filter) |

### Code Editor Listeners

| Line | Registration | Handler |
|------|--------------|---------|
| 6801 | `input.addEventListener('input', handleEditorInput);` | `handleEditorInput` |
| 6813 | `document.getElementById('snippetFramework')?.addEventListener('change', generateCodeSnippet);` | `generateCodeSnippet` |
| 6831 | `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences);` | `importPreferences` |

### Command Palette Listeners

| Line | Registration | Handler |
|------|--------------|---------|
| 9085 | `input.addEventListener('input', filterCommands);` | `filterCommands` |

### Other Change Listeners

| Line | Registration | Handler |
|------|--------------|---------|
| 8207 | `cb.addEventListener('change', () => { ... });` | Inline handler |

---

## Summary Statistics

- **Total Named Filter/Change Handler Functions:** 34
- **Total Event Listener Registrations (change/input):** 27
- **Primary Handler Types:**
  - OG Generator: 5 handlers
  - Sitemap: 1 handler
  - Code Editor: 1 handler
  - Smart Ordering: 4 handlers
  - Import/Export: 2 handlers
  - Touch/Drag: 12 handlers
  - Utility: 9 handlers

---

## Handler Naming Conventions

1. **`handle[Element][Action]()`** - For UI element changes (e.g., `handleBgTypeChange`, `handleLogoUpload`)
2. **`update[Element]()`** - For update operations (e.g., `updateOggenCanvas`, `updateBadgePreview`)
3. **`filter[Context]()`** - For filtering operations (e.g., `filterCommands`)
4. **`render[Component]()`** - For rendering with filter parameter (e.g., `renderMetadataTable`)
5. **`is[State]()`** - For state checking (e.g., `isSmartOrdering`)
6. **`should[Action]()`** - For conditional logic (e.g., `shouldDeferFilterOperation`)

---

## Key Patterns Identified

1. **Optional Chaining:** Most event listeners use `?.addEventListener()` for safe null handling
2. **Input vs. Change Events:** Text inputs use `'input'` for real-time updates, selects/checkboxes use `'change'`
3. **Inline vs. Named Handlers:** Simple operations use inline arrow functions, complex logic uses named functions
4. **Smart Ordering Guard System:** Centralized defer/queue mechanism for filter operations during smart ordering
5. **Self-referential Pattern:** Filter functions like `renderMetadataTable` re-attach their own listeners after rendering