# Filter Change Handlers Summary - Vista Codebase

**Total Count:** 35+ filter change handlers identified across the codebase

**Generated:** 2026-08-26  
**Workspace:** `/home/coding/vista`

---

## Overview

This document provides a comprehensive inventory of all filter change handlers in the Vista codebase. All handlers are categorized by functionality and include precise file locations and line numbers for easy reference.

**Key Finding:** All primary filter handlers implement the `guardWrapper` pattern to prevent conflicts with smart ordering functionality, ensuring safe concurrent operations and proper state management.

---

## Category 1: Primary Platform Filter Handlers (4 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `toggleHidden` | `src/public/app.js` | 8459 | Primary handler for toggling platform visibility. Uses guardWrapperWithRender to prevent conflicts with smart ordering. Manages the platformPrefs.hidden Set, saves preferences, updates UI, and re-renders previews. |
| `toggleFavorite` | `src/public/app.js` | 8349 | Primary handler for toggling platform favorite status. Uses guardWrapper to prevent smart ordering conflicts. Manages platformPrefs.favorites Set, saves preferences, updates UI, and clears smart ordering flag. |
| `toggleFavorite` | `src/public/app-features.js` | 456 | Alternative implementation of favorite toggle in app-features module with toast notifications. |
| `hidePlatform` | `src/public/app-features.js` | 471 | Platform visibility toggle handler with toast feedback and re-render functionality. |

---

## Category 2: Guard Functions and Wrappers (4 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `guardWrapper` | `src/public/filter-guard-wrapper.js` | 47 | Core guard wrapper that checks if smart ordering is active. If active, queues the operation for later execution; otherwise executes immediately. |
| `guardWrapperWithRender` | `src/public/filter-guard-wrapper.js` | 88 | Extended guard wrapper specifically for handlers that trigger renderPreviews. Sets isFilterOperation flag and clears smart ordering active flag after execution. |
| `queueFilterOperation` | `src/public/app.js` | 8424 | Queues filter operations to be processed after smart ordering completes. |
| `processPendingFilterOperations` | `src/public/app.js` | 8434 | Processes all pending filter operations after smart ordering completes. |

---

## Category 3: UI Update Functions (4 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `updateFavoritesList` | `src/public/app.js` | 8472 | Updates the favorites list UI based on platformPrefs.favorites Set state. Handles empty state display and creates remove button event listeners. |
| `updateHiddenList` | `src/public/app.js` | 8494 | Updates the hidden platforms list UI based on platformPrefs.hidden Set state. Similar to updateFavoritesList but for hidden platforms. |
| `updateColumnLayoutUI` | `src/public/app.js` | 8341 | Updates column layout UI to reflect platformPrefs.columnCount changes. |
| `renderMetadataTable` | `src/public/app.js` | 4369 | Renders metadata table with filtering capability. Filters rows based on tag name and value matching. |

---

## Category 4: What If Mode Handlers (6 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `toggleWhatIfMode` | `src/public/app.js` | 8603 | Toggles What If mode on/off. Shows/hides panel, manages disabledTags Set, and handles smart ordering conflicts via queuing. |
| `applyWhatIfChanges` | `src/public/app.js` | 8723 | Applies What If mode changes by modifying metadata to remove disabled tags, sets isFilterOperation guard, and re-renders previews. |
| `applyPendingWhatIfTags` | `src/public/app.js` | 8768 | Applies pending What If tags from hash state after data loads. Handles URL state restoration for disabled tags. |
| `resetWhatIfToggles` | `src/public/app.js` | 8715 | Resets all What If toggle checkboxes to checked state and clears disabledTags Set. |
| `showWhatIfPanel` | `src/public/app.js` | 8646 | Creates and displays the What If mode panel with tag toggle checkboxes. |
| `closeWhatIfPanel` | `src/public/app.js` | 8705 | Closes the What If mode panel and cleans up UI. |

---

## Category 5: Import/Export Preferences Handlers (3 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `importPreferences` | `src/public/app.js` | 8539 | Imports platform preferences from JSON file. Handles smart ordering conflicts via queueFilterOperation, updates platformPrefs, saves, and re-renders. |
| `exportPreferences` | `src/public/app.js` | 8516 | Exports current platform preferences to JSON file including favorites, hidden platforms, column count, and smart ordering settings. |
| `savePlatformPrefs` | `src/public/app.js` | 8245 | Saves platform preferences to localStorage including favorites, hidden platforms, column layout, and card ordering. |

---

## Category 6: OG Image Generator Handlers (5 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `handleBgTypeChange` | `src/public/app.js` | 5532 | Handles OG image generator background type changes (solid/gradient/image). Toggles control visibility and updates canvas. |
| `handleLogoPosChange` | `src/public/app.js` | 5559 | Handles logo position changes in OG generator. Shows/hides logo upload controls and updates canvas. |
| `handleBgImageUpload` | `src/public/app.js` | 5543 | Handles background image upload for OG generator. Reads file, creates image object, and updates canvas. |
| `handleLogoUpload` | `src/public/app.js` | 5566 | Handles logo image upload for OG generator. Similar to handleBgImageUpload but for logo. |
| `updateOggenCanvas` | `src/public/app.js` | 5582 | Updates OG image generator canvas based on current state settings (background, colors, text, logo). |

---

## Category 7: Theme and Context Handlers (3 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `toggleGlobalTheme` | `src/public/app.js` | 159 | Toggles global dark/light theme and updates UI accordingly. |
| `toggleCardContext` | `src/public/app.js` | 2378 | Toggles between context view and standard preview view for individual platform cards. |
| `toggleCardTheme` | `src/public/app.js` | 2400 | Toggles individual card theme between dark and light modes with state validation and error handling. |

---

## Category 8: Other Change/Input Handlers (6 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `handleHeatmapSort` | `src/public/app.js` | 6583 | Handles heatmap sorting dropdown changes. Sorts sitemap results by score or URL in ascending/descending order. |
| `handleEditorInput` | `src/public/app.js` | 7071 | Handles real-time editor input changes with debouncing for character counting and validation. |
| `filterCommands` | `src/public/app.js` | 9659 | Filters command palette commands based on user input. |
| `updateBadgePreview` | `src/public/app.js` | 5193 | Updates badge preview when badge style settings change. |
| `generateCodeSnippet` | `src/public/app.js` | 7335 | Generates code snippets based on selected framework and current data. |

---

## Category 9: Mode Switching Handlers (2 handlers)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `switchMode` | `src/public/app.js` | 640 | Handles mode switching between URL inspection, paste mode, compare mode, and sitemap crawling. |
| `handleSwapUrls` | `src/public/app.js` | 5925 | Swaps URLs in compare mode and re-triggers analysis. |

---

## Category 10: Event Listener Bindings (20+ bindings)

The following event listeners connect UI elements to the handlers above:

### Filter Input Event Listeners
| Location | Line | Event |
|----------|------|-------|
| `src/public/app.js` | 4419 | `filterInput.addEventListener('input', (e) => { renderMetadataTable(e.target.value); })` - Metadata table filter input handler |

### Toggle Button Event Listeners
| Location | Line | Event |
|----------|------|-------|
| `src/public/app.js` | 8490 | `btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid))` - Favorite button click handlers |
| `src/public/app.js` | 8512 | `btn.addEventListener('click', () => toggleHidden(btn.dataset.pid))` - Hidden platform button click handlers |

### What If Event Listeners
| Location | Line | Event |
|----------|------|-------|
| `src/public/app.js` | 8701 | `document.getElementById('whatIfReset')?.addEventListener('click', resetWhatIfToggles)` |
| `src/public/app.js` | 8702 | `document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges)` |
| `src/public/app.js` | 8816 | `document.getElementById('whatIfToggleBtn')?.addEventListener('click', toggleWhatIfMode)` |

### OG Generator Event Listeners
| Location | Lines | Event |
|----------|-------|-------|
| `src/public/app.js` | 396-409 | Multiple addEventListener calls for OG generator controls (background type, logo position, image uploads, color inputs, text inputs) |

### Import/Export Event Listeners
| Location | Line | Event |
|----------|------|-------|
| `src/public/app.js` | 7306 | `document.getElementById('exportPrefsBtn')?.addEventListener('click', exportPreferences)` |
| `src/public/app.js` | 7313 | `document.getElementById('importPrefsInput')?.addEventListener('change', importPreferences)` |

---

## Category 11: Guard Utilities (3 utilities)

| Handler Name | File | Line | Description |
|-------------|------|------|-------------|
| `isSmartOrdering` | `src/public/app.js` | 8415 | Centralized guard that checks if smart ordering is both enabled in preferences and currently active. |
| `isSmartOrdering` | `src/public/guard-utils.js` | 39 | Alternative implementation exposed via window object for cross-module usage. |
| `isFilterOperationInProgress` | `src/public/guard-utils.js` | 78 | Checks if a filter operation is currently in progress to prevent race conditions. |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Primary Platform Filter Handlers | 4 |
| Guard Functions and Wrappers | 4 |
| UI Update Functions | 4 |
| What If Mode Handlers | 6 |
| Import/Export Handlers | 3 |
| OG Image Generator Handlers | 5 |
| Theme/Context Handlers | 3 |
| Other Change/Input Handlers | 5 |
| Mode Switching Handlers | 2 |
| Event Listener Bindings | 20+ |
| Guard Utilities | 3 |
| **TOTAL** | **35+** |

---

## Key Implementation Patterns

### 1. GuardWrapper Pattern
All primary filter handlers use the `guardWrapper` or `guardWrapperWithRender` pattern to prevent conflicts with smart ordering:
- Checks if smart ordering is active before executing
- Queues operations when smart ordering is running
- Sets `isFilterOperation` flag to prevent race conditions
- Ensures proper state management across concurrent operations

### 2. State Management
- Platform preferences stored in `platformPrefs` object
- Uses Sets for favorites and hidden platforms
- LocalStorage persistence via `savePlatformPrefs()`
- Hash-based URL state for What If tags

### 3. UI Reactivity
- Filter changes trigger `renderPreviews()` to update display
- Dedicated UI update functions for each filter type
- Toast notifications for user feedback
- Empty state handling for filtered lists

### 4. Event Delegation
- Dynamic button creation with dataset attributes
- Event listeners bound after DOM updates
- Centralized event listener setup in initialization code

---

## Files Containing Filter Change Handlers

| File | Handler Count |
|------|---------------|
| `src/public/app.js` | 30+ |
| `src/public/app-features.js` | 2 |
| `src/public/filter-guard-wrapper.js` | 2 |
| `src/public/guard-utils.js` | 2 |

---

## Verification Notes

This summary was compiled using an exhaustive search of the vista codebase on 2026-08-26. All handlers were verified to exist at the specified file locations and line numbers.

**Search Methodology:**
- Comprehensive file pattern matching for filter-related keywords
- Line number verification for each identified handler
- Cross-referenced with guard utilities and event listener bindings
- Categorized by functionality for easy reference

---

## Related Documentation

- Filter Guard Wrapper: `src/public/filter-guard-wrapper.js`
- Guard Utilities: `src/public/guard-utils.js`
- Platform Preferences: `src/public/app.js` (lines 8245+)

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-26  
**Bead ID:** vista-7701641a
