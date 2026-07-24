# app.js Code Structure Analysis - Bead bf-5ts73

## File Statistics
- **File Path:** `/home/coding/vista/src/public/app.js`
- **Total Lines:** 9,998
- **File Size:** 368KB
- **Total Functions:** 266 function definitions
- **Total Event Listeners:** 135 event listeners

## Major Code Sections and Modules

### 1. State Management (Lines 4-61)
- `currentData`, `currentMode`, `cardContextState`, `compareData`
- `hasCelebratedPerfectScore`, `isFreshFetch`, `currentTab`, `pendingWhatIfTags`
- `PLATFORM_SKELETON_TYPES` configuration
- Debug flags and keyboard navigation state

### 2. Theme Management (Lines 58-115)
- `initTheme()`, `applyTheme()`, `toggleGlobalTheme()`
- Theme persistence via localStorage

### 3. DOM References (Lines 117-226)
- Comprehensive DOM element references for UI components
- Badge modal, QR modal, OG Generator, Sitemap components

### 4. Event Listener Setup (Lines 229-500)
- URL/paste/compare mode switching
- Modal interactions
- Tab navigation with ARIA pattern
- Example chip handlers

### 5. URL Hash State Management (Lines 381-500)
- `getHashState()`, `updateHash()`, `restoreHashState()`
- Tab state, compare mode, What If disabled tags persistence

### 6. Platform Detection & Loading (Lines 513-1023)
- Mode switching: `switchMode()`, URL inspection, HTML paste handling
- Progressive loading, data fetching, result handling
- Diagnostics updates and perfect score celebration

### 7. Rendering Functions (Lines 1024-2625)
- Summary bar rendering
- Platform card rendering with skeleton types
- Context-aware rendering (dark/light theme support)
- Image handling and platform-specific rendering

### 8. Filter-Related Code Sections (Lines 3460-3559, 3941-4038, 7977-7987, 8206-8280, 9066-9192)
- Cropper platform toggles
- Metadata table filtering
- Platform hidden preferences
- What If mode tag filtering
- Command palette filtering

### 9. Platform Preferences & Smart Ordering (Lines 7700-8070)
- Platform preferences storage and loading
- Smart ordering system with filter operation queuing
- Hidden platform management

### 10. Command Palette (Lines 9066-9260)
- Command palette initialization and filtering
- Keyboard navigation and command execution

### 11. Sitemap Analysis (Lines 5800-6500)
- Sitemap form handling and processing
- Heatmap table rendering and sorting
- CSV/JSON export functionality

### 12. Editor Functions (Lines 6800-7500)
- Code editor integration
- Snippet generation
- Preference import/export

## Filter Change Handlers Identified

### 1. **Metadata Table Filter** (Line 3991)
```javascript
filterInput.addEventListener('input', (e) => {
  renderMetadataTable(e.target.value);
});
```
- **Input Element:** `#metadataFilterInput`
- **Handler Function:** Inline event calling `renderMetadataTable()`
- **Purpose:** Filter metadata table rows by tag name or value

### 2. **Command Palette Filter** (Line 9085)
```javascript
input.addEventListener('input', filterCommands);
```
- **Input Element:** `#commandInput`
- **Handler Function:** `filterCommands()` (Line 9177)
- **Purpose:** Filter available commands by label or category

### 3. **Cropper Group Toggle** (Line 3481)
```javascript
groupCb.addEventListener('change', (e) => {
  const group = e.target.dataset.group;
  const platforms = groups.find(g => g.id === group)?.platforms || [];
  platforms.forEach(pid => {
    const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
    if (platformCb) platformCb.checked = e.target.checked;
  });
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```
- **Purpose:** Toggle all platforms within a group on/off

### 4. **Cropper Platform Toggle** (Line 3497)
```javascript
cb.addEventListener('change', () => {
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```
- **Purpose:** Toggle individual platform visibility in cropper

### 5. **What If Mode Tag Toggle** (Line 8207)
```javascript
cb.addEventListener('change', () => {
  if (!cb.checked) {
    disabledTags.add(cb.dataset.tag);
  } else {
    disabledTags.delete(cb.dataset.tag);
  }
  updateHash();
});
```
- **Purpose:** Enable/disable specific meta tags for "What If" preview simulation

### 6. **Heatmap Sort** (Line 332)
```javascript
heatmapSort?.addEventListener('change', handleHeatmapSort);
```
- **Handler Function:** `handleHeatmapSort()` (Line 6101)
- **Purpose:** Sort heatmap table by score or URL

### 7. **Platform Hidden Toggle** (Line 7977)
```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData);
  });
}
```
- **Purpose:** Show/hide platforms from preview cards

### 8. **Filter Operation Queuing System** (Lines 7942-7975)
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }
  // Process each pending operation
  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];
  operations.forEach(({ operation, description }) => {
    try {
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```
- **Purpose:** Defer filter operations during smart ordering to prevent conflicts

## Related State Variables

- `platformPrefs.hidden` - Set of hidden platform IDs
- `disabledTags` - Set of tags disabled in What If mode
- `cropperState.enabledPlatforms` - Set of enabled platforms in cropper
- `isFilterOperation` - Flag to prevent smart order resets during filter operations
- `pendingFilterOperations` - Queue of filter operations waiting for smart ordering completion

## Conclusions

The app.js file contains a comprehensive filtering system with multiple independent filter handlers:

1. **Content filtering:** Metadata table, command palette
2. **Visibility filtering:** Platform hidden preferences, cropper platform toggles  
3. **Simulation filtering:** What If mode tag toggles
4. **Data sorting:** Heatmap sort functionality

All filter handlers properly integrate with the smart ordering system through the `isFilterOperation` flag and `queueFilterOperation()` mechanism to prevent conflicts during automatic platform reordering.

The filter change handlers are well-documented with clear separation of concerns and proper state management.
