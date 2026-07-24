# Comprehensive Hook Pattern Analysis: app.js

## Task
Search app.js for all hook patterns (function wrapping) regardless of event type. Document locations, event types, and callback functions for each hook.

## File Location
- `/home/coding/vista/src/public/app.js` (9,998 lines)

## Search Method
Used grep to find patterns of:
1. `const original<Name> = <functionName>` (saving original function)
2. `<functionName> = function(...)` or `<functionName> = async function(...)` (reassigning with wrapper)

## TOTAL HOOK PATTERNS FOUND: 3

---

## Hook 1: renderDiagnostics - Diagnostic Tracking

**Location:** Lines 8950-8955
**Event Type:** Diagnostic rendering completion
**Purpose:** Initialize diagnostic tracking after diagnostics are rendered

### Code:
```javascript
// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```

### Event Flow:
1. **Trigger:** When `renderDiagnostics()` is called to display diagnostic issues
2. **Before:** Calls original `originalRenderDiagnostics(diagnostics)` to render normally
3. **After:** Schedules `initDiagnosticTracking()` to run 100ms after render completes
4. **Purpose:** Enables click tracking and analytics on diagnostic elements after they're rendered

### Related Functions:
- `initDiagnosticTracking()` - Sets up click handlers on diagnostic items
- `renderDiagnostics()` - Original function (defined earlier in file)

---

## Hook 2: handleResult - Smart Ordering Integration

**Location:** Lines 8957-8982
**Event Type:** Result data arrival (inspection completion)
**Purpose:** Apply smart platform ordering before rendering, preventing race conditions

### Code:
```javascript
// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  // Store reference for use in hook
  const originalData = data;

  // P0 - Timing fix: Set currentData BEFORE applySmartOrderingSafe() call
  currentData = data;

  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');
    applySmartOrderingSafe();
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }

  // Now render with cards already in correct order (no post-render reordering needed)
  await originalHandleResult2(data);
};
```

### Event Flow:
1. **Trigger:** When `handleResult()` is called with inspection results
2. **Before:** Sets `currentData = data` early (needed by smart ordering logic)
3. **Before:** Checks if smart ordering is enabled in platformPrefs
4. **Before:** If enabled, calls `applySmartOrderingSafe()` to reorder platform cards
5. **After:** Calls original `originalHandleResult2(data)` to render results
6. **Purpose:** Ensures platform cards are ordered correctly BEFORE rendering, preventing visual reordering

### Related Functions:
- `applySmartOrderingSafe()` - Thread-safe smart ordering with guard flags
- `applySmartOrdering()` - Core ordering logic based on page type detection
- `reorderPlatformCards()` - DOM reordering
- `handleResult()` - Original function (defined earlier in file)

### Race Condition Prevention:
Uses `isApplyingSmartOrder` guard flag to prevent concurrent execution with `renderPreviews()`, which was causing order resets in earlier versions.

---

## Hook 3: switchTab - Card Focus Management

**Location:** Lines 9420-9425
**Event Type:** Tab switching (previews/tags/raw/share/etc.)
**Purpose:** Unfocus all platform cards when switching away from previews tab

### Code:
```javascript
// Unfocus cards when switching tabs
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
  originalSwitchTab(tabId);
  unfocusAllCards();
};
```

### Event Flow:
1. **Trigger:** When user switches between tabs (previews, tags, raw, share, etc.)
2. **Before:** Calls original `originalSwitchTab(tabId)` to perform normal tab switching
3. **After:** Calls `unfocusAllCards()` to remove focus state from any expanded platform cards
4. **Purpose:** Clean UI state when navigating away from the previews tab

### Related Functions:
- `unfocusAllCards()` - Removes focus/expansion state from all platform cards
- `switchTab()` - Original function (defined earlier in file)

---

## Pattern Analysis

### Common Hook Structure:
All three hooks follow the same pattern:
```javascript
const original<FunctionName> = <functionName>;
<functionName> = function(<args>) {
  // Pre-processing logic (optional)
  original<FunctionName>(<args>);
  // Post-processing logic (optional)
};
```

### Hook Types:
1. **Post-processing hook** (renderDiagnostics): Runs additional logic AFTER original function
2. **Pre-processing hook** (handleResult): Runs additional logic BEFORE original function
3. **Both** (switchTab): Runs logic AFTER original function to clean up state

### Guard Flags Used:
The `handleResult` hook integrates with the smart ordering guard flag system:
- `isApplyingSmartOrder` - Prevents concurrent smart ordering operations
- `isSmartOrderingActive` - Tracks when smart ordering is in effect
- `pendingFilterOperations` - Queues filter operations during smart ordering

---

## File Context

### Hook Pattern Section:
Lines 8950-8982 contain the primary hook patterns and are documented in the code as:
- "─ Hook into renderDiagnostics for tracking ──"
- "─ Hook into handleResult for smart ordering ──"

### Related Patterns:
Lines 7942-8016 contain the **Centralized Guard Functions** section that provides the guard flag infrastructure used by the `handleResult` hook.

---

## Comparison with Filter-Change Patterns

This analysis covers **ALL hook patterns** in app.js, not just filter-change events:

| Hook Pattern | Event Type | Filter-Change Related? |
|--------------|------------|------------------------|
| renderDiagnostics | Diagnostic rendering | No - UI tracking |
| handleResult | Inspection result arrival | Yes - triggers smart ordering |
| switchTab | Tab switching | No - UI cleanup |

The **handleResult hook** is the only one directly related to filter-change events, as it triggers smart ordering which interacts with filter operation guards.

---

## Summary

app.js contains exactly **3 hook patterns** (function wrapping) that extend existing functionality:

1. **renderDiagnostics** - Adds diagnostic tracking (lines 8950-8955)
2. **handleResult** - Integrates smart ordering (lines 8957-8982)
3. **switchTab** - Manages card focus state (lines 9420-9425)

All hooks use the same pattern of saving the original function, reassigning it with a wrapper, and calling the original within the wrapper. The hooks enable extending functionality without modifying the original function implementations.
