# app.js Structure Map

**File:** `/home/coding/vista/src/public/app.js`  
**Total Lines:** 9,998  
**Generated:** 2026-07-24  
**Purpose:** Structural foundation for locating and categorizing filter change handlers

---

## Major Code Sections

### 1. State & Configuration (Lines 1-116)
- **State** (4-12): Global state variables (currentData, currentMode, cardContextState, etc.)
- **Platform Config** (14-31): Platform skeleton type fetching and configuration
- **Debug Flags** (33-51): DEBUG_SMART_ORDERING and other debug controls
- **Keyboard Navigation State** (53-56): Focused card tracking, undo stack
- **Theme State** (58-59): Theme variable declarations
- **Accessibility** (61-116): Screen reader announcements, theme initialization

### 2. DOM References & Initialization (Lines 117-228)
- **DOM refs** (117-228): Element selection and caching
- **Event listeners setup** (229-380): Global event listener registration

### 3. URL Hash State Management (Lines 381-511)
- Hash encoding/decoding functions
- State persistence via URL
- Hash change handlers

### 4. Mode Switching & Operations (Lines 512-630)
- **Mode switching** (512-565): URL/paste/compare mode transitions
- **Paste detection** (566-630): Clipboard handling and paste event processing

### 5. Inspect Functionality (Lines 631-1110)
- Core inspection logic
- Data fetching and processing
- Result handling

### 6. UI Components & Rendering (Lines 1111-2104)
- **Perfect Score Celebration** (1111-1214): Achievement animations
- **Summary bar** (1215-1239): Score display and metrics
- **Preview Grid** (1240-1287): Card layout and rendering
- **Platform Skeleton Types** (1288-1294): Type definitions
- **Platform Crop Specifications** (1295-1433): Crop configurations
- **Skeleton Rendering** (1434-2104): Card skeleton HTML generation

### 7. Downloads & Media (Lines 2105-2202)
- **Screenshot download** (2105-2202): Image export functionality

### 8. Card Renderers (Lines 2203-3360)
- **Platform card renderers** (2203-2465): Individual platform card generation
- **Platform Context Frame Renderers** (2466-3360): Context-aware card rendering

### 9. Diagnostic & Analysis Tools (Lines 3361-4059)
- **Crop Visualizer** (3361-3752): Image crop preview
- **Diagnostics** (3753-3790): Diagnostic panel rendering
- **Raw Tags (Metadata Viewer)** (3791-4059): **KEY FILTER AREA** - Metadata filtering and display
  - Contains `metadataFilterInput` element reference (line 3989)
  - Filter event listener: `filterInput.addEventListener('input', ...)` (line 3991)

### 10. Data Processing (Lines 4060-4481)
- **Redirects & Headers** (4060-4481): HTTP data processing

### 11. User Actions (Lines 4482-4886)
- **Auto-Fixes** (4482-4570): Automated fix application
- **Tab switching** (4571-4588): Tab navigation
- **Recent inspections** (4589-4623): History management
- **Share** (4624-4720): Share functionality
- **Badge Modal** (4721-4799): Badge display
- **QR Code Modal** (4800-4876): QR code generation
- **Reset** (4877-4886): Application reset

### 12. Utilities & Features (Lines 4887-5427)
- **Utilities** (4887-5071): Helper functions
- **OG Generator** (5072-5427): Open Graph generation

### 13. Specialized Modes (Lines 5428-6208)
- **Compare Mode Functions** (5428-5869): Before/after comparison
- **Sitemap Mode Functions** (5870-6208): Sitemap processing

### 14. Phase 2: Editor & Advanced Features (Lines 6209-7884)
- **Phase 2 Header** (6209-6271): Advanced feature initialization
- **Guard flags for smart ordering** (6272-6851): **KEY FILTER AREA** - Race condition prevention
  - `isFilterOperation` flag (line 6279)
  - `pendingFilterOperations` queue (line 6281)
  - Filter operation guards and queues
- **Code Snippet Generator** (6852-7213): Code export
- **Template Library** (7214-7662): Template management
- **Cache Hub** (7663-7704): Caching system
- **Platform Customization** (7705-7884): Platform-specific settings

### 15. Filter Operation Guards (Lines 7885-8116)
- **Centralized guard functions** (7885-8116): **KEY FILTER AREA** - Filter operation management
  - `shouldDeferFilterOperation()` (line 7891)
  - `queueFilterOperation()` (line 7942)
  - `processPendingFilterOperations()` (line 7952)

### 16. Interactive Features (Lines 8117-8335)
- **What If Toggle** (8117-8335): Scenario toggling

### 17. Editing & Tracking (Lines 8336-8642)
- **Inline Card Editing** (8336-8406): Card editing functionality
- **Diagnostic Tracking** (8407-8642): Diagnostic state tracking

### 18. Smart Ordering (Lines 8643-8956)
- **Smart Platform Ordering** (8643-8944): **KEY FILTER AREA** - Platform reordering
  - Integration with filter operations
  - Filter operation guards referenced (line 8794)
- **Initialization Hooks** (8945-8956): DOM ready hooks

### 19. Event Handler Integrations (Lines 8957-9998)
- **Handler hooks** (8957-9998): Integration points for various features
  - `renderDiagnostics` hook (line 8950)
  - `handleResult` hook for smart ordering (line 8957)
  - Additional event handlers and integrations

---

## Key Filter Handler Areas

### Primary Filter Locations:
1. **Raw Tags (Metadata Viewer)** (lines 3791-4059)
   - Element: `metadataFilterInput` (line 3989)
   - Event: `addEventListener('input', ...)` (line 3991)

2. **Filter Operation Guards** (lines 7885-8116)
   - Functions: `shouldDeferFilterOperation()`, `queueFilterOperation()`, `processPendingFilterOperations()`
   - Purpose: Prevent race conditions during smart ordering

3. **Smart Ordering Integration** (lines 8643-8944)
   - References filter operation guards
   - Coordinates filtering with platform reordering

### Secondary Filter-Related Areas:
4. **Guard Flags** (lines 6272-6851)
   - `isFilterOperation` flag
   - `pendingFilterOperations` queue

---

## Structural Patterns

### Event Listener Registration Pattern:
```javascript
// Pattern found throughout:
element.addEventListener('input', handlerFunction);
element.addEventListener('change', handlerFunction);
```

### Filter Guard Pattern:
```javascript
// Phase 2 pattern (lines 6272-6851):
if (isFilterOperation) { /* defer */ }
queueFilterOperation(operation, description);
processPendingFilterOperations();
```

---

## Next Steps for Filter Handler Analysis:

1. **Raw Tags section** (3791-4059): Extract metadata filter handlers
2. **Guard functions** (7885-8116): Document filter operation queue logic
3. **Smart ordering integration** (8643-8944): Identify filter/order coordination
4. **Event listeners section** (229-380): Check for additional filter listeners
5. **Handler integrations** (8957-9998): Find late-stage filter handlers

---

**Note:** This structural map provides the framework for systematic extraction and categorization of all filter change handlers in app.js. Each identified area should be examined for:
- Event listener registrations
- Handler function definitions
- Filter state management
- Integration with other features
