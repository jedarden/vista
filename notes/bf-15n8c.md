# app.js Structure Analysis

## File Overview
- **Path:** `/home/coding/vista/src/public/app.js`
- **Size:** 9,998 lines
- **Purpose:** VISTA frontend application - main client-side JavaScript

## File Organization

### 1. State & Configuration (Lines 4-51)
- **State variables:** currentData, currentMode, cardContextState, compareData, hasCelebratedPerfectScore, isFreshFetch, currentTab, pendingWhatIfTags
- **Platform Config:** PLATFORM_SKELETON_TYPES (fetched from server)
- **Debug Flags:** DEBUG_SMART_ORDERING for detailed logging
- **Keyboard Navigation State:** focusedCardIndex, focusedCardPids, editorUndoStack
- **Theme State:** globalTheme management
- **Accessibility:** Screen reader announcements via `announce()` function

### 2. DOM References (Lines 117-227)
- **Hero & Form Elements:** urlMode, pasteMode, compareMode, sitemapMode
- **Results Section:** resultsSection, previewGrid, diagPanel, rawTagsPanel
- **Modal References:** badgeModal, qrModal, cropperViewport
- **OG Generator:** Canvas and input elements
- **Sitemap:** Summary stats, heatmap table, export buttons
- **Sitemap State:** sitemapData, sitemapResults

### 3. Event Listeners (Lines 229-510)
- **Form submissions:** URL inspection, paste mode, compare mode, sitemap mode
- **Mode switching:** URL/paste/compare/sitemap navigation
- **Modal interactions:** Badge, QR, OG Generator
- **Sitemap event handlers:** Sorting, CSV/JSON export
- **Tab switching:** Keyboard navigation (ARIA tablist pattern)
- **Example chips:** Demo URLs and sitemaps

### 4. URL Hash State Management (Lines 381-488)
- **Functions:** `getHashState()`, `updateHash()`, `restoreHashState()`
- **State tracked:** tab, mode, without (What If disabled tags), b (compare URL)
- **Restoration:** Applies pending What If tags from hash

### 5. Mode Switching (Lines 512-564)
- **Function:** `switchMode(mode)`
- **Modes:** url, paste, compare, sitemap
- **UI updates:** Shows/hides relevant sections, updates navigation state

### 6. Paste Detection (Lines 566-629)
- **Functions:** `handlePasteDetection()`, `showSuggestionChip()`, `clearSuggestionChips()`
- **Detects:** HTML, multiple URLs, sitemaps, shortened URLs
- **Suggestion chips:** Context-aware mode switching recommendations

### 7. Inspect Functions (Lines 631-1109)
- **Progressive loading:** `progressiveLoad()`, `finalizeProgressiveLoad()`
- **API calls:** `fetchImagesAndHeaders()`, `fetchHeaders()`
- **Data merging:** `mergeData()`
- **Diagnostics:** `updateDiagnostics()`
- **Client-side verification:** `verifyClientSideTags()` (DOM-based JS injection detection)
- **Main entry points:** `inspectUrl()`, `inspectHtml()`, `handleResult()`

### 8. Perfect Score Celebration (Lines 1111-1213)
- **Functions:** `isPerfectScore()`, `triggerConfetti()`, `checkAndCelebrate()`, `showPerfectScoreToast()`
- **Trigger:** All 31 platforms score A+
- **Effects:** Confetti animation, golden glow, toast notification

### 9. Summary Bar (Lines 1215-1238)
- **Function:** `renderSummaryBar(data)`
- **Displays:** Overall grade, passing/warning/failing counts, URL, diagnostic badge

### 10. Preview Grid & Platform Constants (Lines 1240-1500)
- **Platform Groups:** Social & Microblogging, Messaging, Collaboration, Content, Email & RSS
- **Platform Icons:** Emoji mapping for all 31 platforms
- **Platform Names:** Display names
- **Platform Crop Specifications:** Aspect ratios, crop modes, display sizes
- **Category Colors:** Blue (social), Green (messaging), Purple (collaboration), Orange (content), Yellow (email), Pink (RSS)
- **Platform Character Limits:** Title/description truncation points per platform
- **Skeleton Rendering:** Loading state HTML generation

### 11. Platform Card Rendering (Lines 1501-2204)
- **Group management:** `setupGroupHeader()`, header collapse/expand
- **Render functions:** `renderPreviews()`, `renderTextPreviewsOnly()`, `updatePreviewsWithImages()`
- **Card builders:** `buildCard()`, `buildTextOnlyCard()`
- **Screenshot download:** `downloadScreenshot()`
- **Theme support:** Platform cards with dark/light mode toggle
- **Platform-specific renderers:** Per-platform card templates

### 12. Cropper & Image Analysis (Lines 2205-4000)
- **Cropper state:** enabledPlatforms, image dimensions, aspect ratio
- **Platform toggles:** Group-level and individual platform controls
- **Overlay rendering:** Safe zone visualization, crop rectangles
- **Event handlers:** Toggle changes, select/clear-all buttons
- **Export functions:** Metadata as JSON/CSV

### 13. Metadata Filter & Table (Lines 3920-4058)
- **Filter function:** `renderMetadataTable(filter = '')`
- **Filter UI:** Text input with live filtering, tag/value search
- **Filter listener:** `addEventListener('input', (e) => renderMetadataTable(e.target.value))`
- **Display:** Tag name, value, source (HTML/parsed/default), copy button
- **Export:** JSON and CSV export functionality

### 14. Redirects & Headers (Lines 4060-4500)
- **Functions:** `renderRedirects()`, `renderFixes()`
- **Display:** HTTP redirect chain, response headers, auto-fix suggestions
- **Export:** JSON export for redirects and headers

### 15. Compare Mode (Lines 4500-5700)
- **Functions:** `handleCompareSubmit()`, `handleSwapUrls()`, `renderComparisonResults()`
- **Comparison:** Score comparison, meta tag diff, platform screenshot comparison
- **Data URL generation:** HTML-to-image for comparison views

### 16. Sitemap Mode (Lines 5700-6208)
- **Functions:** `handleSitemapSubmit()`, `renderSitemapResults()`, `renderHeatmapTable()`
- **Scroll lock:** `setupScrollLock()` for dual-pane scrolling
- **Sorting:** `handleHeatmapSort()` by different metrics
- **Export:** `exportSitemapDataAsCsv()`, `exportSitemapDataAsJson()`

### 17. Editor & Scoring (Lines 6209-6850)
- **Editor state:** field values, edited metadata, edited scoring
- **Platform preferences:** Favorites, hidden platforms, column layout, smart ordering
- **Guard flags:** isApplyingSmartOrder, pendingApplySmartOrder, isRendering, isFilterOperation, isSmartOrderingActive
- **Functions:** `initEditor()`, `populateEditorForm()`, `handleEditorInput()`, `rescoreAllPlatforms()`
- **Character gauges:** Visual feedback for title/description length limits
- **Live updates:** `updateEditedCardsInPlace()`, `updatePreviewsWithEdits()`

### 18. Code Snippet Generator (Lines 6852-7212)
- **Frameworks:** HTML, Next.js, Nuxt, Remix, Astro, SvelteKit, Gatsby, Hugo, Jekyll
- **Functions:** `generateCodeSnippet()`, framework-specific generators
- **Copy functionality:** `copyCodeSnippet()`

### 19. Template Library (Lines 7214-7662)
- **Templates:** Pre-built meta tag configurations (blog, product, event, etc.)
- **Functions:** `initTemplates()`, `applyTemplate()`
- **TEMPLATES constant:** Array of template definitions

### 20. Cache Hub (Lines 7664-7703)
- **Functions:** `initCacheHub()`, `handleFbPurge()`
- **Cache clearing:** Facebook/Instagram sharing cache

### 21. Platform Customization & Filter Guards (Lines 7705-8032)
- **Preferences:** `loadPlatformPrefs()`, `savePlatformPrefs()`, `exportPreferences()`, `importPreferences()`
- **Column layout:** `setColumnLayout()`, `updateColumnLayoutUI()`
- **Filter operations:** `toggleFavorite()`, `toggleHidden()`
- **List updates:** `updateFavoritesList()`, `updateHiddenList()`

### 22. **Centralized Guard Functions for Filter Operations** (Lines 7885-7975)
This section contains critical filter operation management:

- **`shouldDeferFilterOperation()`** - Checks if filter should be deferred due to smart ordering
- **`isSmartOrdering()`** - Centralized guard checking BOTH user preference AND runtime state
- **`queueFilterOperation()`** - Queues filter ops to execute after smart ordering completes
- **`processPendingFilterOperations()`** - Executes queued filter operations

**Usage Pattern in Filter Handlers:**
```javascript
function myFilterHandler() {
  if (isSmartOrdering()) {
    queueFilterOperation(myFilterHandler, 'myFilterHandler');
    return;
  }
  // Proceed with filter operation
}
```

**Related Flags:**
- `isFilterOperation` - Set during filter ops to prevent smart order resets
- `isSmartOrderingActive` - Runtime flag tracking smart ordering progress
- `pendingFilterOperations` - Queue array for deferred operations

### 23. What If Mode (Lines 8117-8334)
- **State:** whatIfMode, disabledTags Set
- **Functions:** `toggleWhatIfMode()`, `showWhatIfPanel()`, `applyWhatIfChanges()`
- **Hash restoration:** `applyPendingWhatIfTags()` restores disabled tags from URL hash
- **Warnings:** `showMissingTagWarnings()` for critical missing tags

### 24. Inline Card Editing (Lines 8336-8405)
- **Functions:** `initInlineEditing()`, `syncInlineEditToEditor()`
- **Direct manipulation:** Click-to-edit on preview cards

### 25. Diagnostic Tracking (Lines 8407-8641)
- **State:** fixedDiagnostics Set
- **Functions:** `initDiagnosticTracking()`, `applyDiagnosticFix()`, `recalculateScore()`
- **Reordering:** `flipReorderDiagnostics()` with mutation support
- **Progress tracking:** `updateDiagnosticProgress()`

### 26. Smart Platform Ordering (Lines 8643-8982)
- **Page type detection:** `detectPageType()` - analyzes meta tags to determine content type
- **Order lookup:** `getPlatformOrderForPageType()` - returns optimal platform ordering
- **Reordering:** `reorderPlatformCards()` - applies smart ordering with animation
- **Safe application:** `applySmartOrderingSafe()` - prevents race conditions
- **Hook integration:** Intercepts `handleResult()` and `renderDiagnostics()`

### 27. Command Palette (Lines 9048-9231)
- **Commands:** Keyboard shortcut reference, platform visibility toggles
- **Functions:** `initCommandPalette()`, `toggleCommandPalette()`, `executeCommand()`
- **Filtering:** `filterCommands()` - live search in command palette
- **Navigation:** `handleCommandKeydown()` - arrow key navigation

### 28. Global Keyboard Shortcuts (Lines 9233-9426)
- **Function:** `initGlobalKeyboardShortcuts()`
- **Shortcuts:** Ctrl+K (command palette), Ctrl+H (toggle hidden), platform-specific toggles

### 29. Feedback Widget (Lines 9428-9514)
- **Function:** `initFeedbackWidget()`
- **Integration:** Third-party feedback form

### 30. Card Drag and Drop (Lines 9516-9660)
- **State:** draggedCard, draggedFromGroup
- **Functions:** `initCardDragAndDrop()`, drag event handlers
- **Reordering:** Visual drag feedback with drop targets

### 31. Card Context Menu (Lines 9662-9805)
- **State:** contextMenu, contextMenuTargetPid, contextMenuTargetGroupId
- **Functions:** `initContextMenu()`, `showCardContextMenu()`, `handleContextMenuAction()`
- **Actions:** Toggle favorite/hidden, copy link, view screenshot

### 32. Mobile Swipe & Long-Press (Lines 9807-9998)
- **State:** longPressTimer, longPressCard, touchStart positions
- **Functions:** `initMobileLongPress()`, touch event handlers
- **Gestures:** Horizontal swipe (favorite), vertical swipe (hide)
- **Long-press:** Context menu trigger on mobile

## Filter-Related Code Summary

### Metadata Filter (Lines 3920-4058)
- **Input:** `#metadataFilterInput` text field
- **Event:** `addEventListener('input', ...)` triggers `renderMetadataTable(e.target.value)`
- **Filter logic:** Searches tag names and values (case-insensitive)
- **UI:** Shows "X of Y tags" count

### Platform Filter Guards (Lines 7885-7975)
- **Purpose:** Prevent race conditions between filter ops and smart ordering
- **Key functions:**
  - `isSmartOrdering()` - Check if smart ordering is active
  - `queueFilterOperation()` - Defer filter op if smart ordering in progress
  - `processPendingFilterOperations()` - Execute queued ops after ordering

### Platform Visibility Filters
- **toggleFavorite(pid)** - Add/remove from favorites (Lines 7867-7883)
- **toggleHidden(pid)** - Add/remove from hidden (Lines 7977-7988)
- **updateFavoritesList()** - Render favorites panel (Lines 7990-8010)
- **updateHiddenList()** - Render hidden platforms panel (Lines 8012-8032)

### Cropper Platform Filter (Lines 3551-3570)
- **State:** `cropperState.enabledPlatforms` Set
- **Function:** `updateEnabledPlatforms()` - Reads checkboxes, updates Set
- **UI:** Group-level and individual platform toggles

## Key Architectural Patterns

1. **Guard flags** prevent race conditions during async operations
2. **Queue-based deferral** for operations during smart ordering
3. **Progressive loading** - metadata first, then images/headers in parallel
4. **State-driven rendering** - single source of truth, re-render on changes
5. **Event listener attachment** - both static (DOMContentLoaded) and dynamic (inline)
6. **LocalStorage persistence** - theme, platform prefs, recents, editor state
7. **URL hash state** - shareable links with tab/mode/filter state
8. **Screen reader announcements** - aria-live regions for accessibility
9. **Skeleton loading** - instant visual feedback before data arrives
10. **Smart ordering** - automatic platform reordering based on page type detection

## Notable Code Organization

- **Section headers** marked with `// ── Section Name ──`
- **JSDoc comments** for complex functions
- **DEBUG_SMART_ORDERING flag** for detailed logging
- **Guard wrappers** (`guardWrapper`, `guardWrapperWithRender`) for state management
- **Centralized filter guard functions** to prevent smart ordering conflicts
- **Modular rendering** - separate functions for each UI component
- **Event delegation** for dynamic elements (platform cards, menu items)
