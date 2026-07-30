# Hook Categorization by Type and Purpose

## Overview
This document categorizes all hook patterns identified in `/home/coding/vista/src/public/app.js` by their implementation type and functional purpose.

## Hook Categories

### 1. Monkey-Patching / Function Replacement Hooks
**Pattern:** Store original function reference, override with wrapper, call original with modifications.

#### 1.1 Lifecycle-Enhancement Hooks
**Purpose:** Add tracking or initialization after core lifecycle events.

| Hook Name | Location | Purpose | Trigger |
|-----------|----------|---------|---------|
| `renderDiagnostics` hook | Lines 8950-8955 | Initialize diagnostic tracking after diagnostics render | After diagnostic rendering |
| Code: | ```javascript | | | |
| | const originalRenderDiagnostics = renderDiagnostics; | | | |
| | renderDiagnostics = function(diagnostics) { | | | |
| |   originalRenderDiagnostics(diagnostics); | | | |
| |   setTimeout(initDiagnosticTracking, 100); | | | |
| | }; | | | |

#### 1.2 Pre-Processing Hooks
**Purpose:** Intercept and transform data before the original function processes it.

| Hook Name | Location | Purpose | Timing |
|-----------|----------|---------|--------|
| `handleResult` hook | Lines 8957-8982 | Apply smart ordering before rendering to fix race condition | Before original render |
| Code: | ```javascript | | | |
| | const originalHandleResult2 = handleResult; | | | |
| | handleResult = async function(data) { | | | |
| |   currentData = data; | | | |
| |   if (platformPrefs.smartOrdering) { | | | |
| |     applySmartOrderingSafe(); | | | |
| |   } | | | |
| |   await originalHandleResult2(data); | | | |
| | }; | | | |

#### 1.3 Post-Processing Hooks
**Purpose:** Add cleanup or UX enhancements after the original function completes.

| Hook Name | Location | Purpose | Timing |
|-----------|----------|---------|--------|
| `switchTab` hook | Lines 9421-9425 | Unfocus all cards after tab switch for better keyboard navigation | After original switch |
| Code: | ```javascript | | | |
| | const originalSwitchTab = switchTab; | | | |
| | switchTab = function(tabId) { | | | |
| |   originalSwitchTab(tabId); | | | |
| |   unfocusAllCards(); | | | |
| | }; | | | |

---

### 2. Filter-Related Hook Patterns
**Pattern:** Guard flags, operation queues, and state management to prevent race conditions between filter operations and smart ordering.

#### 2.1 Filter Guard Flags (State Hooks)
**Purpose:** Prevent conflicts between concurrent operations.

| Flag Name | Location | Purpose | Type |
|-----------|----------|---------|------|
| `isFilterOperation` | Line 6279 | Prevents smart order resets during filter changes | Boolean guard |
| `isSmartOrderingActive` | Line 6280 | Track when smart ordering is currently in progress | Boolean guard |
| `isApplyingSmartOrder` | (referenced) | Additional guard for smart ordering operations | Boolean guard |

**Usage Pattern:**
```javascript
// Set guard during operation
isFilterOperation = true;
// ... perform filter operation
setTimeout(() => { isFilterOperation = false; }, 0);
```

#### 2.2 Filter Operation Queue Hooks
**Purpose:** Defer filter operations until smart ordering completes.

| Hook Name | Location | Purpose | Type |
|-----------|----------|---------|------|
| `pendingFilterOperations` | Line 6281 | Queue for deferred filter operations | Array queue |
| `queueFilterOperation()` | Lines 7942-7947 | Add operation to queue | Function hook |
| `processPendingFilterOperations()` | Lines 7952-7973 | Execute queued operations | Function hook |

**Integration Pattern:**
```javascript
// Queue during smart ordering
if (isSmartOrdering()) {
  queueFilterOperation(myFilterHandler, 'myFilterHandler');
  return;
}
// Process after smart ordering completes
processPendingFilterOperations();
```

#### 2.3 Filter Toggle Hooks
**Purpose:** User-facing filter state management with manual override handling.

| Hook Name | Location | Purpose | Pattern |
|-----------|----------|---------|----------|
| `toggleFavorite()` | Lines 7867-7882 | Toggle platform favorites, clear smart ordering flag on manual override | State + render |
| `toggleHidden()` | Lines 7977-7987 | Toggle platform visibility, re-render previews | State + render |

**Manual Override Pattern:**
```javascript
function toggleFavorite(pid) {
  // User manually modified favorites - clear smart ordering
  isSmartOrderingActive = false;
  // ... perform toggle logic
}
```

#### 2.4 Data Filtering Hooks
**Purpose:** Client-side filtering of display data.

| Hook Name | Location | Purpose | Filter Type |
|-----------|----------|---------|-------------|
| `renderMetadataTable()` | Lines 3941-3994 | Filter metadata tags by tag/value | Text search |
| `filterCommands()` | Lines 9177-9192 | Filter command palette by label/category | Text search |

**Self-Attaching Pattern:**
```javascript
function renderMetadataTable(filter = '') {
  // ... create HTML with filter input
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value); // Self-attaches on each render
    });
  }
}
```

---

### 3. Lifecycle Hooks
**Pattern:** Event listeners attached to DOMContentLoaded for initialization phases.

#### 3.1 Main Initialization Hook
**Location:** Line 491

**Purpose:** Core application startup

**Operations:**
- Theme initialization
- Recent documents loading
- OG generator initialization
- URL parameter handling
- Feedback widget setup
- Hash state restoration

#### 3.2 Editor Initialization Hook
**Location:** Line 6797

**Purpose:** Editor and input system setup

**Operations:**
- Editor input listeners
- Preferences export/import
- Platform preferences loading
- Command palette initialization
- Global keyboard shortcuts

#### 3.3 Inline Editing Initialization Hook
**Location:** Line 8946

**Purpose:** Inline editing feature setup

**Operations:**
- Initialize inline editing system

**Pattern:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  initInlineEditing();
});
```

---

### 4. State Management Hooks
**Pattern:** Property exports to window object for debugging and testing.

#### 4.1 Filter State Exports
**Location:** Lines 5042-5058

**Purpose:** Expose internal state and functions globally

**Exports:**
- `isSmartOrderingActive` (getter/setter)
- `isFilterOperation` (getter/setter)
- `pendingFilterOperations` (getter/setter)
- `isSmartOrdering()` function
- `queueFilterOperation()` function
- `processPendingFilterOperations()` function
- `toggleHidden()` function
- `toggleFavorite()` function

**Pattern:**
```javascript
Object.defineProperty(window, 'isSmartOrderingActive', {
  get: () => isSmartOrderingActive,
  set: (val) => { isSmartOrderingActive = val; }
});
```

---

## Summary Table

### By Hook Type

| Type | Count | Examples |
|------|-------|----------|
| Monkey-Patching / Function Replacement | 3 | renderDiagnostics, handleResult, switchTab |
| Filter Guard Flags | 3 | isFilterOperation, isSmartOrderingActive, isApplyingSmartOrder |
| Filter Queue Hooks | 3 | pendingFilterOperations, queueFilterOperation(), processPendingFilterOperations() |
| Filter Toggle Hooks | 2 | toggleFavorite(), toggleHidden() |
| Data Filtering Hooks | 2 | renderMetadataTable(), filterCommands() |
| Lifecycle Hooks | 3 | DOMContentLoaded (main, editor, inline-edit) |
| State Management Hooks | 8 | Window property exports |

### By Functional Purpose

| Purpose | Count | Hook Names |
|---------|-------|------------|
| Smart Ordering Integration | 6 | handleResult hook, isSmartOrderingActive, isApplyingSmartOrder, pendingFilterOperations, queueFilterOperation(), processPendingFilterOperations() |
| Filter Operation Management | 5 | isFilterOperation, toggleFavorite(), toggleHidden(), renderMetadataTable(), filterCommands() |
| Diagnostic Tracking | 1 | renderDiagnostics hook |
| Keyboard Navigation UX | 1 | switchTab hook |
| Application Initialization | 3 | DOMContentLoaded hooks |
| Debugging/Testing Support | 8 | Window property exports |

### By Integration Pattern

| Pattern | Count | Description |
|---------|-------|-------------|
| Wrapper Pattern | 3 | Store original, override, call with modifications |
| Guard Flag Pattern | 3 | Boolean flags prevent race conditions |
| Queue Pattern | 2 | Defer operations during concurrent activity |
| Self-Attaching Pattern | 1 | Function creates and attaches its own event listener |
| Lifecycle Event Pattern | 3 | DOMContentLoaded initialization phases |
| Global Export Pattern | 8 | Expose internals via window object |

---

## Key Observations

### 1. **Filter vs. Smart Ordering Coordination**
The most complex hook ecosystem coordinates filter operations with smart ordering:
- **Guard flags** (`isFilterOperation`, `isSmartOrderingActive`, `isApplyingSmartOrder`) prevent concurrent conflicts
- **Queue system** (`pendingFilterOperations`, `queueFilterOperation`, `processPendingFilterOperations`) defers filters during smart ordering
- **Manual override** (`toggleFavorite`, `toggleHidden`) clears smart ordering flag on user interaction

### 2. **Monkey-Patching is Surgical**
Only 3 functions are monkey-patched, and each has a clear purpose:
- `renderDiagnostics`: Add tracking after render
- `handleResult`: Apply smart ordering before render
- `switchTab`: unfocus cards after tab switch

### 3. **All Hooks are Applied at Load Time**
Unlike runtime hook registration systems (like `addHook()`), all hooks are applied during module initialization (top-level code execution or DOMContentLoaded).

### 4. **No Hook Registration System Found**
The codebase does **not** use:
- `addHook()` style registration APIs
- Plugin/lifecycle hook systems
- Webhook patterns
- Test lifecycle hooks (`beforeAll`, `afterEach`, etc.)

### 5. **Event Listener vs. Hook Distinction**
The codebase has 2,112+ event listeners (`addEventListener`), but these are standard DOM/event handlers, not hook patterns. Only the function replacement patterns and filter coordination system qualify as "hooks" in the architectural sense.

---

## Generated
- Date: 2026-07-24
- Bead: bf-20jtd
- File: /home/coding/vista/src/public/app.js
- Total hooks categorized: 23
- Hook types identified: 7
- Functional purposes: 6
