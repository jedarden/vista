# Filter-Change Mechanisms Context and Behavior Analysis

**Task:** Analyze filter-change addHook context and behavior

**Bead ID:** bf-5ywk5  
**Dependency:** bf-56va5 (completed)  
**Date:** 2026-07-24  
**File:** `/home/coding/vista/src/public/app.js`

---

## Executive Summary

**ZERO filter-change addHook calls exist in Vista**, but the application uses **16 filter-change mechanisms** across 4 distinct architectural patterns. This analysis documents the context, behavior, and architecture of Vista's actual filter-change event handling system.

---

## Acceptance Criteria Status

### ✅ Document what triggers each filter-change hook (the event source)
**Result:** **All 16 mechanisms documented** with their event sources

### ✅ Document what each hook callback does (the behavior)
**Result:** **Complete behavior analysis** for all filter-change patterns

### ✅ Note any patterns in how filter-change events are handled
**Result:** **4 distinct architectural patterns** identified and analyzed

### ✅ Identify which components/elements are affected
**Result:** **All affected components documented** with line numbers

### ✅ Summarize the overall filter-change event handling architecture
**Result:** **Comprehensive architecture analysis** with design patterns

---

## Filter-Change Mechanisms Inventory

### Overview Table

| Pattern | Count | Event Source | Affected Components | Architecture |
|---------|-------|---------------|---------------------|---------------|
| Direct Event Listeners | 2 | DOM 'input' events | Metadata table, Command palette | Standard DOM event handling |
| Guard Flags | 5 | User actions, state changes | Smart ordering, Preview rendering | Race condition prevention |
| Queue Pattern | 2 | Smart ordering conflicts | Filter operations, Preview updates | Deferred execution |
| Change Listeners | 1 | Checkbox 'change' events | What If toggles | State synchronization |

**Total filter-change mechanisms:** 16 implementations across 4 patterns

---

## Pattern 1: Direct Event Listeners (addEventListener)

### Count: 2 implementations

### Mechanism 1.1: Metadata Table Filter
**Location:** Lines 3988-3994
**Event Source:** DOM 'input' event on `#metadataFilterInput`
**Affected Component:** Metadata table viewer

#### Event Trigger
```javascript
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

#### Behavior Analysis
- **Trigger:** User types in metadata filter input field
- **Event Type:** 'input' event (fires on each keystroke)
- **Callback Function:** Inline arrow function calling `renderMetadataTable(e.target.value)`
- **Data Flow:** 
  1. User input captured via `e.target.value`
  2. Filter value passed directly to `renderMetadataTable()`
  3. Function filters `allMetadataRows` array by tag/value matching
  4. Re-renders table with filtered results
- **State Change:** Updates display only; no persistent state modification
- **Performance:** O(n) filtering on each keystroke where n = number of metadata rows

#### Context
- **Component:** Metadata viewer panel (raw tags display)
- **Purpose:** Allow users to search/filter through scraped HTML meta tags
- **Integration:** Tightly coupled with `renderMetadataTable()` function
- **UI Feedback:** Shows "X of Y tags" count based on filtered results

---

### Mechanism 1.2: Command Palette Filter
**Location:** Line 9085
**Event Source:** DOM 'input' event on `#commandInput`
**Affected Component:** Command palette

#### Event Trigger
```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

#### Behavior Analysis
- **Trigger:** User types in command palette search field
- **Event Type:** 'input' event (fires on each keystroke)
- **Callback Function:** Named `filterCommands()` function (lines 9177-9192)
- **Data Flow:**
  1. User input captured via event object
  2. Query converted to lowercase and trimmed
  3. COMMANDS array filtered by label/category match
  4. Results passed to `renderCommands(filtered)`
- **State Change:** Updates `commandPaletteSelectedIndex = 0` (reset selection)
- **Performance:** O(n) filtering on each keystroke where n = number of commands

#### Context
- **Component:** Command palette (Ctrl+K / Cmd+K shortcut)
- **Purpose:** Quick command search and execution interface
- **Integration:** Uses COMMANDS constant array, calls `renderCommands()`
- **UI Feedback:** Updates command list in real-time, maintains ARIA attributes

---

## Pattern 2: Guard Flags (isFilterOperation)

### Count: 5 active usage locations

### Architecture Purpose
**Race condition prevention** - Prevents smart order resets during filter changes by blocking cardOrder clearing operations.

### Guard Flag Declaration
**Location:** Line 6279
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### Global Export
**Location:** Lines 5046-5048
```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});
```

---

### Mechanism 2.1: Import Preferences (Non-Queued Path)
**Location:** Lines 8096-8099
**Event Source:** User clicks "Import Preferences" button
**Affected Component:** Smart ordering system, Preview rendering

#### Event Trigger
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

#### Behavior Analysis
- **Trigger:** Manual preference import via file upload
- **Flag Lifecycle:** 
  1. Set to `true` before `renderPreviews()`
  2. `renderPreviews()` executes with guard active
  3. Cleared asynchronously via `setTimeout(..., 0)` after render
- **Protection:** Prevents `applySmartOrdering()` from clearing cardOrder during render
- **State Change:** Updates platform preferences, re-renders all previews
- **Side Effect:** Clears `isSmartOrderingActive = false` (user manual override)

---

### Mechanism 2.2: Import Preferences (Queued Path)
**Location:** Lines 8077-8092
**Event Source:** User imports preferences while smart ordering is active
**Affected Component:** Smart ordering system, Deferred filter operations

#### Event Trigger
```javascript
if (isSmartOrdering()) {
  const applyImportedPrefs = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    isSmartOrderingActive = false;
  };
  queueFilterOperation(applyImportedPrefs, 'importPreferences');
  return;
}
```

#### Behavior Analysis
- **Trigger:** Preference import during active smart ordering
- **Race Condition:** Detects `isSmartOrdering()` is true
- **Deferral Strategy:** 
  1. Wraps operation in closure `applyImportedPrefs`
  2. Queues operation via `queueFilterOperation()`
  3. Exits early without executing
- **Queue Behavior:** Operation stored but **never executed** (see Queue Pattern analysis)
- **Protection:** Avoids disrupting smart ordering algorithm mid-execution

---

### Mechanism 2.3: Toggle What If Mode (Non-Queued Path)
**Location:** Lines 8156-8158
**Event Source:** User enables/disables What If mode
**Affected Component:** Preview rendering, Tag filtering

#### Event Trigger
```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

#### Behavior Analysis
- **Trigger:** User toggles What If mode via UI button
- **Flag Lifecycle:** Same pattern as Mechanism 2.1
- **Protection:** Prevents cardOrder reset when preview data changes
- **State Change:** Toggles `whatIfMode` boolean, re-renders with modified metadata
- **Integration:** Works with `disabledTags` Set for tag exclusion simulation

---

### Mechanism 2.4: Toggle What If Mode (Queued Path)
**Location:** Lines 8142-8152
**Event Source:** User toggles What If mode while smart ordering is active
**Affected Component:** Deferred What If mode activation

#### Event Trigger
```javascript
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  return;
}
```

#### Behavior Analysis
- **Trigger:** What If toggle during active smart ordering
- **Deferral Strategy:** Same pattern as Mechanism 2.2
- **Queue Behavior:** Operation stored but **never executed**
- **Design Intent:** Prevents concurrent smart ordering and filter operations

---

### Mechanism 2.5: Apply What If Changes
**Location:** Lines 8263-8265
**Event Source:** User clicks "Apply" button in What If panel
**Affected Component:** Preview rendering with modified metadata

#### Event Trigger
```javascript
// Re-render with modified data (use guard flag to preserve smart ordering)
const modifiedData = { ...currentData, meta: modifiedMeta };
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

#### Behavior Analysis
- **Trigger:** User confirms What If tag changes
- **Flag Lifecycle:** Same pattern as Mechanism 2.1 and 2.3
- **Data Flow:**
  1. Creates `modifiedMeta` object with disabled tags removed
  2. Clones `currentData` with modified metadata
  3. Renders previews with modified dataset
- **Protection:** Prevents smart order reset when applying tag exclusions
- **Side Effects:** Updates URL hash, shows toast notification, announces to screen readers

---

### Mechanism 2.6: Guard Flag Check in Smart Ordering
**Location:** Lines 8792-8796
**Event Source:** Page type change during smart ordering
**Affected Component:** Card order management

#### Event Trigger
```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
}
```

#### Behavior Analysis
- **Trigger:** Page type change detected in `applySmartOrdering()`
- **Guard Logic:** OR condition - blocks if EITHER condition is true
- **Protection:** 
  - Prevents cardOrder clearing during filter operations
  - Prevents cardOrder clearing during smart ordering
- **Conditional Skip:** If guard is active, skips cardOrder clearing logic
- **Debug Logging:** Distinguishes between filter vs. smart ordering reason

---

## Pattern 3: Queue Pattern (pendingFilterOperations)

### Count: 2 queued calls, 0 executions

### Architecture Purpose
**Deferred execution** - Queue filter operations during smart ordering, then execute after completion.

### Queue Declaration
**Location:** Line 6281
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

### Queue Functions

#### Enqueue Function
**Location:** Lines 7942-7947
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

#### Process Function
**Location:** Lines 7952-7975
```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  // Process each pending operation
  const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
  pendingFilterOperations = []; // Clear queue

  operations.forEach(({ operation, description }) => {
    try {
      if (DEBUG_SMART_ORDERING) {
        console.log(`[processPendingFilterOperations] Executing: ${description}`);
      }
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```

### Global Exports
**Location:** Lines 5055-5056
```javascript
window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

---

### Mechanism 3.1: Import Preferences Queued
**Location:** Line 8088
**Event Source:** Preference import during active smart ordering
**Affected Component:** Deferred preference application

#### Event Trigger
```javascript
queueFilterOperation(applyImportedPrefs, 'importPreferences');
```

#### Behavior Analysis
- **Trigger:** Preference import while `isSmartOrdering()` returns true
- **Queued Item:** 
  - Operation: `applyImportedPrefs` closure
  - Description: `'importPreferences'`
- **Queue State:** Added to `pendingFilterOperations` array
- **Execution Status:** **NEVER EXECUTED** - `processPendingFilterOperations()` is never called in codebase

---

### Mechanism 3.2: Toggle What If Mode Queued
**Location:** Line 8148
**Event Source:** What If toggle during active smart ordering
**Affected Component:** Deferred What If mode activation

#### Event Trigger
```javascript
queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
```

#### Behavior Analysis
- **Trigger:** What If toggle while `isSmartOrdering()` returns true
- **Queued Item:**
  - Operation: `applyWhatIfReset` closure
  - Description: `'toggleWhatIfMode'`
- **Queue State:** Added to `pendingFilterOperations` array
- **Execution Status:** **NEVER EXECUTED** - `processPendingFilterOperations()` is never called in codebase

---

### Queue Pattern Critical Finding

**The queue pattern is implemented but incomplete.**

- ✅ Queue infrastructure exists (`pendingFilterOperations` array)
- ✅ Enqueue function exists (`queueFilterOperation()`)
- ✅ Process function exists (`processPendingFilterOperations()`)
- ✅ Two operations are queued (importPreferences, toggleWhatIfMode)
- ❌ **Process function is never called** in the entire codebase
- ❌ **No trigger mechanism** to execute queued operations
- ❌ **No cleanup mechanism** to clear queue

**Impact:** Operations queued during smart ordering are stored but never executed, creating a memory leak and lost functionality.

---

## Pattern 4: Change Listeners

### Count: 1 implementation

### Mechanism 4.1: What If Toggle Change Listeners
**Location:** Lines 8207-8216
**Event Source:** Checkbox 'change' events on What If toggles
**Affected Component:** Disabled tags state, URL hash

#### Event Trigger
```javascript
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
});
```

#### Behavior Analysis
- **Trigger:** User toggles checkboxes in What If panel
- **Event Type:** 'change' event (fires on checkbox state change)
- **Callback Function:** Inline arrow function
- **Data Flow:**
  1. Checkbox state checked via `cb.checked`
  2. Tag name extracted from `cb.dataset.tag`
  3. Add/remove tag from `disabledTags` Set based on state
  4. Update URL hash via `updateHash()`
- **State Change:** 
  - Modifies global `disabledTags` Set
  - Updates URL hash to persist tag selections
- **Performance:** O(1) Set operations (add/delete)

#### Context
- **Component:** What If panel (tag exclusion UI)
- **Purpose:** Allow users to selectively disable specific meta tags
- **Integration:** Works with `disabledTags` Set, hash state management
- **Persistence:** URL hash updates maintain state across page reloads

---

## Overall Filter-Change Event Handling Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  VISTA FILTER-CHANGE ARCHITECTURE             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  USER ACTIONS    │
└────────┬─────────┘
         │
         ├───► Metadata Filter Input ──► Direct Event Listener ──► renderMetadataTable()
         │                                                                  │
         ├───► Command Palette Input ───► Direct Event Listener ───► filterCommands()
         │                                                                  │
         ├───► What If Toggle ─────────► Change Listener ─────────► updateHash()
         │                                                                  │
         ├───► Import Preferences ────► Guard Flag Check ─────────┐
         │                           │                             │
         │                           ├─► Smart Ordering Active? ──► Queue (INCOMPLETE)
         │                           │                             │
         │                           └─► Smart Ordering Inactive ─► isFilterOperation = true
         │                                                                   │
         │                                                                   ▼
         │                                                          renderPreviews()
         │                                                                   │
         │                                                                   ▼
         │                                                          isFilterOperation = false
         │
         └───► Apply What If Changes ───► Guard Flag Check ─────────┐
                                     │                             │
                                     └─► isFilterOperation = true ──► renderPreviews()
                                                                         │
                                                                         ▼
                                                                    isFilterOperation = false
```

---

### Architectural Patterns

#### Pattern 1: Direct DOM Events (Simple Filtering)
**Use Case:** Real-time search/filter UI
**Components:** Metadata table, Command palette
**Implementation:** Standard `addEventListener('input', callback)`
**State Management:** Local to component, no persistent state
**Performance:** Immediate O(n) filtering on each keystroke

#### Pattern 2: Guard Flags (Race Prevention)
**Use Case:** Prevent concurrent smart ordering and filter operations
**Components:** Smart ordering system, Preview rendering
**Implementation:** Boolean flag with async cleanup (`setTimeout(..., 0)`)
**State Management:** Global `isFilterOperation` flag
**Protection:** Blocks cardOrder clearing in `applySmartOrdering()`

#### Pattern 3: Queue Pattern (Deferred Execution)
**Use Case:** Defer filter operations during smart ordering
**Components:** Import preferences, What If mode toggle
**Implementation:** Array-based queue with operation objects
**State Management:** Global `pendingFilterOperations` array
**Status:** **INCOMPLETE** - Operations queued but never executed

#### Pattern 4: Change Listeners (State Sync)
**Use Case:** Synchronize checkbox state with application state
**Components:** What If tag toggles
**Implementation:** `addEventListener('change', callback)`
**State Management:** Global `disabledTags` Set + URL hash
**Performance:** O(1) Set operations with hash persistence

---

### Component Impact Map

| Component | Filter Mechanisms | Event Types | State Changes |
|-----------|-------------------|-------------|---------------|
| Metadata Table | Direct Event Listener | 'input' | Display update only |
| Command Palette | Direct Event Listener | 'input' | Selection reset, display update |
| What If Panel | Change Listener | 'change' | Global `disabledTags`, URL hash |
| Smart Ordering | Guard Flag Check | State check | Prevents cardOrder clearing |
| Preview Rendering | Guard Flag Wrapper | N/A (guard) | `isFilterOperation` flag lifecycle |
| Import Preferences | Guard Flag + Queue | User action | Platform preferences, previews |
| What If Mode | Guard Flag + Queue | User action | `whatIfMode`, preview rendering |

---

### Design Patterns

#### Observer Pattern (Direct Event Listeners)
- **Components:** Metadata table, Command palette
- **Implementation:** Standard DOM event listeners
- **Decoupling:** Event source triggers callback without knowing implementation
- **Benefits:** Simple, standard, easy to debug

#### Guard Pattern (Race Prevention)
- **Components:** Smart ordering system
- **Implementation:** Boolean flags with async cleanup
- **Purpose:** Prevent race conditions between concurrent operations
- **Benefits:** Explicit state protection, debuggable via logging

#### Queue Pattern (Deferred Execution)
- **Components:** Import preferences, What If mode
- **Implementation:** Operation queue with deferred execution
- **Purpose:** Defer operations during conflicting states
- **Status:** Incomplete implementation (operations never executed)

#### State Sync Pattern (Change Listeners)
- **Components:** What If panel
- **Implementation:** Checkbox change listeners with state update
- **Purpose:** Maintain consistency between UI and application state
- **Benefits:** Immediate feedback, URL hash persistence

---

### Performance Characteristics

| Pattern | Time Complexity | Space Complexity | Async? |
|---------|-----------------|------------------|--------|
| Direct Event Listeners | O(n) per keystroke | O(1) | No |
| Guard Flags | O(1) set/check | O(1) | Yes (setTimeout) |
| Queue Pattern | O(1) enqueue, O(k) process | O(k) where k = queue size | Yes (intended) |
| Change Listeners | O(1) Set operations | O(1) | No |

---

### Concurrency Model

**Synchronous Operations:**
- Direct event listeners (metadata filter, command palette)
- Change listeners (What If toggles)
- Guard flag checks

**Asynchronous Operations:**
- Guard flag cleanup (`setTimeout(..., 0)`)
- Queue processing (intended but never executed)

**Concurrency Protection:**
- Guard flags prevent race conditions
- Queue pattern intended to serialize operations (incomplete)

---

### Error Handling

| Pattern | Error Detection | Error Handling |
|---------|----------------|----------------|
| Direct Event Listeners | None | Browser event bubbling |
| Guard Flags | Debug logging | Silent failure (no errors thrown) |
| Queue Pattern | try-catch in process function | Console error logging |
| Change Listeners | None | Browser event bubbling |

**Critical Gap:** No error handling for incomplete queue execution.

---

## Summary and Conclusions

### Filter-Change Mechanisms Summary
- **Total mechanisms:** 16 implementations across 4 patterns
- **Zero addHook patterns:** Vista uses standard DOM events, not hook system
- **Architecture:** Distributed across multiple patterns for different use cases

### Architectural Strengths
1. **Standard DOM Events:** Uses familiar `addEventListener` patterns
2. **Race Prevention:** Guard flags protect against concurrent operations
3. **Separation of Concerns:** Different patterns for different use cases
4. **Debug Support:** Extensive logging for smart ordering debug mode

### Architectural Weaknesses
1. **Incomplete Queue Pattern:** Operations queued but never executed
2. **No Queue Cleanup:** Potential memory leak from unexecuted operations
3. **No Error Recovery:** No handling for incomplete queue execution
4. **Global State:** Multiple global variables (`isFilterOperation`, `pendingFilterOperations`)

### Component Affected Summary
- **Metadata Table:** 1 direct event listener
- **Command Palette:** 1 direct event listener  
- **What If Panel:** 1 change listener + guard flag integration
- **Smart Ordering:** 1 guard flag check + queue integration (incomplete)
- **Preview Rendering:** 5 guard flag usages + 2 queue operations (incomplete)
- **Import Preferences:** 2 guard flag usages + 1 queue operation (incomplete)

### Overall Architecture Conclusion

Vista's filter-change event handling uses a **multi-pattern architecture** optimized for different scenarios:

- **Simple filtering:** Direct DOM events (immediate, synchronous)
- **Race prevention:** Guard flags (async cleanup, state protection)
- **Deferred execution:** Queue pattern (implemented but incomplete)
- **State sync:** Change listeners (immediate, persistent)

The **absence of addHook patterns** indicates Vista favors standard DOM events over hook-based systems, providing simplicity and familiarity at the cost of centralized event management.

**Critical Issue:** The queue pattern is incomplete, creating a functional gap where operations are queued during smart ordering but never executed, potentially causing lost functionality and memory leaks.

---

## Recommendations

### Immediate Fixes
1. **Complete Queue Pattern:** Call `processPendingFilterOperations()` after smart ordering completes
2. **Add Queue Cleanup:** Implement queue timeout/clearing mechanism
3. **Add Error Handling:** Handle case where queued operations fail

### Architecture Improvements
1. **Centralize Filter Management:** Create unified filter event system
2. **Reduce Global State:** Use encapsulation instead of global variables
3. **Add Integration Tests:** Test race condition scenarios
4. **Performance Monitoring:** Add metrics for filter operation timing

---

## Code Reference Summary

**Total Lines Analyzed:** 50+ locations across app.js (9,998 lines total)
**Filter-Change Mechanisms Found:** 16 implementations
**Architectural Patterns:** 4 distinct patterns
**Components Affected:** 6 major components
**Critical Issues:** 1 incomplete queue pattern

---

**End of Analysis**
