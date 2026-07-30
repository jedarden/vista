# app.js Structure Documentation

**Bead:** bf-5i01v
**File:** `/home/coding/vista/src/public/app.js`
**Total Lines:** 9,998
**Analysis Date:** 2026-07-24

## Overview

`app.js` is the main client-side JavaScript file for the VISTA social media preview tool. It handles URL inspection, HTML pasting, platform preview rendering, diagnostics, editing, and various utility features (sitemap, OG generator, QR codes, badges).

## File Structure

### 1. **State Management** (Lines 4-16)
```javascript
let currentData = null;
let currentMode = 'url'; // 'url' | 'paste' | 'compare'
let cardContextState = {}; // Track context mode per platform
let compareData = { before: null, after: null, swapped: false };
let hasCelebratedPerfectScore = false;
let isFreshFetch = true;
let currentTab = 'previews';
let pendingWhatIfTags = null;
```

- Global state variables track the current inspection data, UI mode, and various application states
- Platform configuration is fetched dynamically from `/api/platforms`

### 2. **Debug Flags** (Lines 33-51)
```javascript
let DEBUG_SMART_ORDERING = true;
```

- Console debugging can be enabled/disabled via window flags
- Smart ordering logs platform card reordering operations

### 3. **Accessibility Functions** (Lines 61-78)
```javascript
function announce(message, priority = 'polite')
```

- Screen reader announcements via aria-live regions
- Supports 'polite' and 'assertive' priorities

### 4. **Theme Management** (Lines 80-115)
```javascript
function initTheme()
function applyTheme(theme)
function toggleGlobalTheme()
```

- Manages global theme (light/dark mode)
- Reads from localStorage or system preference
- Updates theme toggle button and re-renders cards

### 5. **DOM References** (Lines 117-227)
```javascript
const $ = (sel) => document.querySelector(sel);
const hero = $('#hero');
const urlForm = $('#urlForm');
// ... many more DOM element references
```

- Centralized DOM element caching using `$` helper
- Includes references to forms, buttons, panels, modals
- Organized by feature (badge, QR, OG generator, sitemap)

### 6. **Event Listeners** (Lines 229-370)

**Primary event listener registration section:**

- **Form submissions:** `urlForm`, `pasteForm`, `compareForm`, `sitemapForm`
- **Paste detection:** Detects URL/HTML content on paste
- **Mode switching:** URL, paste, compare, sitemap modes
- **Tab navigation:** Tab switching with keyboard support (arrow keys)
- **Modal events:** Badge modal, QR modal (open/close/overlay click)
- **OG Generator:** Background type, colors, images, text inputs
- **Sitemap:** Sort, export buttons
- **Example chips:** Click handlers for URL examples

**Pattern:** Event listeners are registered immediately after DOM references, using direct addEventListener calls or helper chains (`?.` for null safety).

### 7. **URL Hash State Management** (Lines 381-488)
```javascript
function getHashState()
function updateHash(options = {})
function restoreHashState()
```

- Manages URL hash for deep linking and state persistence
- Tracks: active tab, compare mode, disabled tags (What If mode)
- Restores state on page load

### 8. **Progressive Loading** (Lines 492-843)
```javascript
window.addEventListener('DOMContentLoaded', ...)
async function progressiveLoad({ url, html, base })
function mergeData(metaData, imagesData, headersData)
function updateDiagnostics(data)
```

- Fetches metadata, images, and headers from API
- Progressive rendering shows skeleton cards immediately
- Merges data from multiple API endpoints
- Client-side DOM verification for JS-injected tags

### 9. **Platform Card Rendering** (Lines 2015-2199)
```javascript
function buildCard(pid, scoreData, data, animDelay, groupId)
function renderPreviews(data)
function toggleCardContext(pid, data)
function toggleCardTheme(pid, data)
```

- Builds platform preview cards with grades, issues, and controls
- Supports context view (card-only vs in-context)
- Theme toggle for platforms with dark/light support
- Drag and drop support for card reordering

### 10. **Screenshot Download** (Lines 2105-2155)
```javascript
async function downloadScreenshot(pid, data)
```

- Generates SVG screenshots via `/api/screenshot`
- Shows loading state during generation
- Handles download with proper blob URL cleanup

### 11. **Diagnostics & Fixes** (Lines 8500+)
```javascript
function applyDiagnosticFix(index)
function recalculateScore()
function updateDiagnosticProgress()
```

- Applies fixes from diagnostics to editor
- Re-scores after applying fixes
- Updates progress banner and tab badges

### 12. **Smart Platform Ordering** (Lines 8643-8700+)
```javascript
function detectPageType(meta)
function getPlatformOrderForPageType(pageType)
function reorderPlatformCards()
```

- Detects page type (article, product, video, website)
- Orders platform cards based on page type relevance
- Persists custom order to localStorage

### 13. **Context Menu** (Lines 9700-9805)
```javascript
function initContextMenu()
function showCardContextMenu(e, pid, groupId, data)
function handleContextMenuAction(e)
```

- Right-click context menu on platform cards
- Actions: screenshot, open editor, view raw, hide/favorite

### 14. **Mobile Touch Gestures** (Lines 9807-9998)
```javascript
function handleTouchStart(e)
function handleTouchEnd(e)
function handleTouchMove(e)
function handleHorizontalSwipe(deltaX, card)
function handleVerticalSwipe(deltaY, card)
```

- Long-press (500ms) for context menu
- Horizontal swipe for platform navigation
- Vertical swipe to collapse expanded cards
- Respects `prefers-reduced-motion` preference

### 15. **Code Snippet Generation** (Lines 7000-7198)
```javascript
function generateAstroSnippet(meta)
function generateSvelteKitSnippet(meta)
function generateGatsbySnippet(meta)
function generateHugoSnippet(meta)
function generateJekyllSnippet(meta)
```

- Generates meta tag code snippets for various frameworks
- Supported: Astro, SvelteKit, Next.js, Gatsby, Hugo, Jekyll

### 16. **Metadata & Raw Tags** (Lines 4000-4060)
```javascript
function renderRawTags(meta)
function renderMetadataRow(row)
function exportMetadataAsJson()
function exportMetadataAsCsv()
```

- Renders raw metadata table with source tracking
- Supports JSON/CSV export
- Shows hierarchy (child tags)

### 17. **Redirects & Headers** (Lines 4060-4200)
```javascript
function renderRedirects(chain, headers, headerAnalysis)
function renderHeaderAnalysis(analysis)
function renderImageHeaders(imageHeaders)
```

- Visual redirect chain diagram
- Header analysis with issues and recommendations
- Platform-specific "give-up point" indicators

### 18. **Sitemap Analysis** (Lines 6000-6200)
```javascript
function renderSitemapSummary(data)
function renderHeatmapTable(results)
function handleHeatmapSort()
function exportSitemapDataAsCsv()
function exportSitemapDataAsJson()
```

- Summary stats (total, crawled, errors)
- Heatmap table with platform grades
- Sortable by score or URL
- CSV/JSON export

## Event Listener Patterns

### Standard Pattern
```javascript
element.addEventListener('event', handler);
```

### Null-Safe Pattern
```javascript
element?.addEventListener('event', handler);
```
Used for elements that may not exist in all views.

### Inline Handlers
```javascript
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggestion-action')) {
    const action = e.target.dataset.action;
    // handle action
  }
});
```
Delegation for dynamically created elements.

### Named Function Handlers
```javascript
swapUrlsBtn.addEventListener('click', handleSwapUrls);
```
Most handlers use named functions for clarity and reusability.

## Code Organization Patterns

### Section Dividers
```javascript
// ── Section Name ──
```
Clear visual dividers between major sections.

### Helper Functions First
Each section typically defines helper functions before main functions.

### Related Functions Grouped
Functions that operate on the same data or UI elements are grouped together.

### State → DOM → Events Pattern
1. Define state variables
2. Cache DOM references
3. Register event listeners
4. Define handler functions

## Hook Patterns

### No Traditional "Hooks"
The file does **not** use a formal hook system (no `onFilterChange` or similar patterns found). Instead:

1. **Event Listeners as Hooks:** `addEventListener` calls serve as the hook mechanism
2. **Direct Function Calls:** State changes trigger direct function calls (e.g., `renderPreviews(data)`)
3. **Custom Event Dispatch:** No evidence of custom event dispatching for hook patterns

### Filter-Change Documentation
Recent commits (bf-6d44t, bf-3lc34, bf-27nlv) mention "filter-change hooks" documentation, but these patterns are **not present in app.js**. They may refer to:
- Server-side patterns
- Other modules not in app.js
- Documentation for future implementation

## Module Dependencies

### External Modules (loaded before app.js)
- `frames-theme.js` - provides `globalTheme` variable
- `platform-frames.js` - platform renderers, `PLATFORM_NAMES`, `PLATFORM_ICONS`
- `scoring-simulator.js` - `scoreAll()` for client-side scoring
- `client-side-diff.js` - `diffClientSideTags()` for JS-injection detection
- `redirect-diagram.js` - `buildRedirectChainDiagram()` for redirect visualization

### Internal Functions
Most functions are defined in app.js itself. The file is largely self-contained.

## Key Features

1. **Progressive Loading:** Shows skeleton cards immediately, then populates with real data
2. **Smart Ordering:** Reorders platform cards based on detected page type
3. **What If Mode:** Disable individual tags to see score impact
4. **Editor Integration:** Apply diagnostic fixes directly to editor
5. **Mobile Gestures:** Long-press, swipe for context menu and navigation
6. **Export:** Screenshots, metadata JSON/CSV, sitemap reports
7. **Deep Linking:** URL hash preserves state (tab, mode, disabled tags)
8. **Accessibility:** ARIA attributes, keyboard navigation, screen reader announcements

## Recommendations for Splitting

Given the 10,000-line size, consider splitting into:

1. **state.js** - State management and initialization
2. **theme.js** - Theme management
3. **dom-cache.js** - DOM element references
4. **event-listeners.js** - Event listener registration
5. **progressive-loader.js** - Data fetching and progressive loading
6. **card-renderer.js** - Platform card building and rendering
7. **diagnostics.js** - Diagnostics, fixes, and re-scoring
8. **smart-ordering.js** - Page type detection and platform ordering
9. **context-menu.js** - Context menu logic
10. **mobile-gestures.js** - Touch and swipe handling
11. **code-snippets.js** - Framework code snippet generation
12. **sitemap.js** - Sitemap analysis and export
13. **export.js** - Export functionality (screenshots, metadata, etc.)

## Notes

- **File is monolithic:** All functionality in one 10,000-line file
- **No module system:** Uses global scope, not ES modules
- **jQuery-lite:** Uses `$` helper but is vanilla JavaScript
- **Progressive enhancement:** Skeletons, async loading, graceful degradation
- **Accessibility-first:** ARIA, keyboard nav, screen readers throughout
