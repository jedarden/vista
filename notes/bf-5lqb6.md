# App.js Filter-Related Sections Report

## Task: bf-5lqb6 - Locate app.js and identify filter-related sections

**Date**: 2026-07-24
**Workspace**: /home/coding/vista
**File Size**: 367.1 KB (too large to read entirely)

---

## File Path

`/home/coding/vista/src/public/app.js`

## Filter-Related Code Sections

### 1. **Metadata Table Filter** (Lines 3941-3995)
- **Function**: `renderMetadataTable(filter = '')`
- **Purpose**: Filters metadata tags/values in the raw tags panel
- **Filter Logic**: Case-insensitive search across tag names and values
- **UI Components**: 
  - Filter input field (`#metadataFilterInput`)
  - Filter count display showing "X of Y tags"
- **Event Handler**: Input listener on filter field that re-renders with new filter

### 2. **Command Palette Filter** (Lines 9177-9192)
- **Function**: `filterCommands(e)`
- **Purpose**: Filters command palette commands by label and category
- **Filter Logic**: Case-insensitive search across command labels and categories
- **Input**: Command palette search field
- **Output**: Renders filtered command list

### 3. **Filter Operation Guard Flags** (Lines 6279, 6281)
- **Variables**:
  - `isFilterOperation` (line 6279): Guard flag to prevent smart order resets during filter changes
  - `pendingFilterOperations` (line 6281): Queue filter operations during smart ordering
  - `isSmartOrderingActive` (line 6280): Track when smart ordering is currently active

### 4. **Centralized Guard Functions** (Lines 7885-7964)
- **Functions**:
  - `shouldDeferFilterOperation()` (line 7891): Check if filter should be deferred
  - `isSmartOrdering()` (line 7933): Check if smart ordering is active (user preference + runtime state)
  - `queueFilterOperation(operation, description)` (line 7942): Queue filter operation for later processing
  - `processPendingFilterOperations()` (line 7952): Process queued operations after smart ordering completes

### 5. **Filter Operation Usage Patterns**
Filter operation guard is set in multiple contexts:
- **Line 8080**: During import preferences operation
- **Line 8096**: During import preferences (non-queued path)
- **Line 8144**: During What If mode toggle
- **Line 8156**: During What If mode toggle (non-queued path)
- **Line 8263**: During What If mode application

**Pattern**: All follow the same structure:
```javascript
isFilterOperation = true;
renderPreviews(data);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### 6. **Window Exports** (Lines 5048-5056)
- **Exports**:
  - `window.queueFilterOperation`
  - `window.processPendingFilterOperations`
  - Setters for `isFilterOperation` and `pendingFilterOperations`

---

## Filter Structure Summary

The app.js file organizes filtering functionality across **three distinct contexts**:

1. **UI Component Filters**: Simple text-based filtering for metadata tables and command palettes
2. **Platform/Preview Filters**: Complex filtering system with guard flags to prevent conflicts with smart ordering during platform reordering
3. **Operation Queue System**: Deferred execution pattern that queues filter operations during active smart ordering to prevent race conditions

The filtering architecture uses a **guard flag pattern** where `isFilterOperation` prevents smart order resets during filter changes, while `isSmartOrdering()` checks both user preferences and runtime state to determine if operations should be deferred. This creates a coordinated system where filter operations and smart ordering don't interfere with each other.

---

## Dependencies

- **No external filter libraries**: All filtering is implemented with native JavaScript array methods
- **Core dependencies**: Platform preferences system, smart ordering system, render functions
- **State management**: Uses global state variables for coordination between filter and ordering systems

---

## Additional Filter-Related Lines

The grep search found 103 lines containing "filter" or "Filter", including:
- Array filtering operations for diagnostics, scores, platforms
- Grade-based filtering for platform cards
- Checkbox state filtering
- Recent commands filtering

Most of these are utility filtering using `Array.filter()` rather than UI filter functionality.
