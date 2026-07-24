# Hook Pattern Search Results for app.js

Generated: 2026-07-24

## Filter Operation Hooks

### Guard Flags
- Line 6279: `let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes`
- Line 6281: `let pendingFilterOperations = []; // Queue filter operations during smart ordering`

### Filter Hook Functions
- Line 7891: `function shouldDeferFilterOperation() {`
- Line 7946: `pendingFilterOperations.push({ operation, description });`
- Line 7952: `function processPendingFilterOperations() {`

### Filter Hook Usage Points
- Line 5046-5048: `Object.defineProperty(window, 'isFilterOperation', { get: () => isFilterOperation, set: (val) => { isFilterOperation = val; } })`
- Line 5050-5052: `Object.defineProperty(window, 'pendingFilterOperations', { get: () => pendingFilterOperations, set: (val) => { pendingFilterOperations = val; } })`
- Line 5056: `window.processPendingFilterOperations = processPendingFilterOperations;`
- Line 8080-8082: Filter operation guard set during disabled tags handling
- Line 8096-8099: Filter operation guard set during enabled tags handling
- Line 8144-8146: Filter operation guard set during clear all tags
- Line 8156-8159: Filter operation guard set during tag toggles
- Line 8263-8265: Filter operation guard set during applyWhatIfTags

## Smart Ordering Hooks

### Main Smart Ordering Function
- Line 8744: `function applySmartOrdering() {`
- Line 8985: `function applySmartOrderingSafe() {`

### Smart Ordering State Flags
- Line 8685: Comment: "* This is called after applySmartOrdering() updates the cardOrder arrays"
- Line 8941: `console.log('[applySmartOrdering] ===== FUNCTION COMPLETE =====`
- Line 8963: Comment: "// P0 - Timing fix: Set currentData BEFORE applySmartOrderingSafe() call"
- Line 8971: Comment: "// P0 - Race condition fix: Use applySmartOrderingSafe() instead of applySmartOrdering()"

### Smart Ordering Guard Flags
- Line 9001: `console.log('[applySmartOrderingSafe] Guard flag SET (true) - starting smart ordering')`
- Line 9011: `console.log('[applySmartOrderingSafe] Smart ordering active flag SET')`
- Line 9031: `console.log('[applySmartOrderingSafe] Guard flag CLEARED (false) - all operations complete')`

## Event Listener Hooks

### DOM Ready Hook
- Line 491: `window.addEventListener('DOMContentLoaded', () => {`

### Form Submit Hooks
- Line 230: `urlForm.addEventListener('submit', (e) => { e.preventDefault(); inspectUrl(urlInput.value.trim()); });`
- Line 231: `pasteForm.addEventListener('submit', (e) => { e.preventDefault(); inspectHtml(htmlInput.value.trim(), baseUrlInput.value.trim()); });`
- Line 276: `compareForm.addEventListener('submit', (e) => { e.preventDefault(); handleCompareSubmit(); });`
- Line 331: `sitemapForm?.addEventListener('submit', (e) => { e.preventDefault(); handleSitemapSubmit(); });`

### Click Event Hooks
- Line 243: `document.addEventListener('click', (e) => {`
- Line 270-275: Navigation click handlers for mode switching
- Line 277: `swapUrlsBtn.addEventListener('click', handleSwapUrls);`
- Line 279: `$('#shareBtn').addEventListener('click', shareResults);`
- Line 280: `$('#newInspectBtn').addEventListener('click', resetToHero);`
- Line 283-284: Badge modal click handlers
- Line 287-288: QR modal click handlers
- Line 297-298: Badge copy button handlers
- Line 324: `oggenDownloadBtn?.addEventListener('click', downloadOggenImage);`
- Line 325: `oggenResetBtn?.addEventListener('click', resetOggen);`
- Line 326: `oggenUseInEditorBtn?.addEventListener('click', useOggenInEditor);`
- Line 333-334: Sitemap export button handlers

### Input/Change Event Hooks
- Line 234: `urlInput.addEventListener('paste', async (e) => {`
- Line 296: `badgeStyleSelect?.addEventListener('change', updateBadgePreview);`
- Line 310-323: OG generator input/change handlers
- Line 332: `heatmapSort?.addEventListener('change', handleHeatmapSort);`

### Keyboard Event Hooks
- Line 352: `tablist.addEventListener('keydown', (e) => {`

## Comparison Data Hooks

### Before/After State Management
- Line 8: `let compareData = { before: null, after: null, swapped: false }; // Comparison state`
- Line 414-416: `if (currentMode === 'compare' && compareData.after) {`
- Line 5461-5462: Comparison data assignment in handleCompareResult
- Line 5500-5505: Comparison swap logic
- Line 5514-5517: Comparison data access in renderComparisonScreenshots
- Line 5629-5655: Before/after screenshot generation
- Line 5798-5808: Before/after card rendering with CSS classes
- Line 5812-5813: Scroll-lock synchronization between before and after cards
- Line 5818-5821: Before/after screenshot URLs usage

## Platform Filter Hooks

### Filter Array Operations
- Line 459: `const tags = state.without.split(',').filter(t => t);`
- Line 585: `const urls = trimmed.split(/[\r\n]+/).map(u => u.trim()).filter(u => u);`
- Line 1231-1232: Diagnostic error/warning filtering
- Line 1548-1549: Platform filtering for custom ordering
- Line 1619-1622: Grade-based filtering (passing/warn/fail)
- Line 1647-1650: Card order filtering operations
- Line 1746-1749: Grade filtering in text-only rendering
- Line 1791-1792: Custom order filtering in preferences

### Metadata Filter Function
- Line 3941: `function renderMetadataTable(filter = '') {`
- Line 3942-3945: Filter logic implementation
- Line 3951-3953: Filter UI elements
- Line 3971: Filtered results rendering
- Line 3988-3991: Filter event listener setup

## Lifecycle Hooks

### Initialization Hooks
- Line 12: `let pendingWhatIfTags = null; // Store pending What If tags from hash before data loads`
- Line 505: `// Restore hash state after initial load`
- Line 59: Comment about globalTheme from frames-theme.js (loaded before app.js)
- Line 3595: Comment about safe-zone.js functions (loaded before app.js)
- Line 3679: Comment about geometry functions (loaded before app.js)

### Render Hooks
- Line 786: "* Finalize progressive loading after both images and headers complete."
- Line 1708: `// P1 - Clear rendering guard flag after DOM is complete`
- Line 1714: `console.log('[renderPreviews] Processing queued render after completion');`
- Line 1724: "* Render text-only previews immediately after metadata loads."
- Line 1591: `// Store the latest data to render after current render completes`
- Line 1601: `// Store the latest data to render after smart ordering completes`

### Auto-hide Hooks
- Line 1208: `// Auto-hide after 8 seconds`
- Line 4932: `// Auto-hide after 8 seconds (longer than regular toasts)`
- Line 5903: `// Hide progress after delay`

## State Management Hooks

### Smart Ordering Active State
- Line 8792: `if (isFilterOperation || isSmartOrdering()) {`
- Line 8794-8795: Filter/Smart ordering active check with reason logging
- Line 9008: `// Set smart ordering active flag after successful application`
- Line 9036: `// By processing after finally, we ensure the flag is false`

### What-If Tags Hooks
- Line 8276: `// Update hash with current disabled tags before clearing them`
- Line 8283-8284: What-If tags pending state management comments
- Line 7900: "* use before any operation that might interfere with smart ordering."
- Line 7938: "* Queue a filter operation to be processed after smart ordering completes"
- Line 7950: "* Process pending filter operations after smart ordering completes"

## Guard Functions

### Centralized Guard Functions
- Line 7885: `// ── Centralized guard functions for filter operations during smart ordering ──`
- Line 7888: "* Check if filter operation should be deferred due to active smart ordering"
- Line 7924: "* - `isFilterOperation`: Set during filter operations to prevent smart order resets"
- Line 8098-8099: Filter operation flag clearing with setTimeout
- Line 8158-8159: Filter operation flag clearing after render
- Line 8263-8265: Filter operation flag management

## Platform Ordering Hooks

### Card Order Management
- Line 1548: Custom order filtering for platform preferences
- Line 1647-1650: Card order filtering and missing platform detection
- Line 8810: Card order clearing logic
- Line 8814: Card order preservation for user-modified groups
- Line 9042: `pendingRenderData = null; // Clear before rendering to prevent re-queue`

## Summary

Total hook pattern categories found: 10
- Filter Operation Hooks: 12 occurrences
- Smart Ordering Hooks: 15 occurrences  
- Event Listener Hooks: 30+ occurrences
- Comparison Data Hooks: 18 occurrences
- Platform Filter Hooks: 15 occurrences
- Lifecycle Hooks: 12 occurrences
- State Management Hooks: 10 occurrences
- Guard Functions: 8 occurrences
- Platform Ordering Hooks: 6 occurrences

## Key Hook Patterns Identified

1. **Guard Flag Pattern**: `isFilterOperation` flag prevents smart order resets during filter changes
2. **Deferred Execution Pattern**: `pendingFilterOperations` queue for operations during active smart ordering
3. **Thread-Safe Pattern**: `applySmartOrderingSafe()` prevents concurrent smart ordering execution
4. **Event Hook Pattern**: Extensive use of `addEventListener` for DOM events
5. **Comparison Hook Pattern**: Before/after state management for comparison mode
6. **Lifecycle Hook Pattern**: Progressive loading and render completion hooks
7. **State Guard Pattern**: Smart ordering active flag to prevent race conditions
