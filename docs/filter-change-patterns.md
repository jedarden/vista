# Vista Filter Change Patterns - Comprehensive Documentation

**Overview:** This document compiles all filter-change patterns found in `/home/coding/vista/src/public/app.js`, organized by functional category with line numbers, code snippets, context, and interaction patterns.

**Last Updated:** 2026-08-24
**Source File:** `src/public/app.js`

---

## Pattern Categories

1. [Event Listeners](#event-listeners-child-1)
2. [Operation Guards](#operation-guards-child-2)
3. [Queue and State Management](#queue-and-state-management-child-3)
4. [Data Processing](#data-processing-child-4)
5. [Pattern Integration Summary](#pattern-integration-summary)
6. [Other Patterns](#other-patterns)

---

## 1. Event Listeners (child 1)

### Pattern 1.1: Metadata Table Filter Input Listener
**Location:** Lines 4416-4422
**Context:** Metadata viewer panel - filtering tag rows

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Purpose:** Real-time filtering of metadata tags as user types
**Interaction:** Immediate re-render on each keystroke (no debounce)
**Data Flow:** Input → `renderMetadataTable(filter)` → filtered display

---

### Pattern 1.2: Command Palette Filter Input Listener
**Location:** Line 9567
**Context:** Command palette - filtering available commands

```javascript
input.addEventListener('input', filterCommands);
```

**Purpose:** Real-time command filtering in palette
**Interaction:** Immediate filter on each keystroke (no debounce)
**Handler:** `filterCommands(e)` function

---

### Pattern 1.3: Standard DOM Event Listeners (Non-Filter)
**Locations:** Lines 122-399 (various)
**Context:** General UI event handling

```javascript
// Example: Theme preference listener
schemeMql.addEventListener('change', (e) => {
  // Handle theme change
});

// Example: Form submission listeners
urlForm.addEventListener('submit', (e) => { e.preventDefault(); inspectUrl(urlInput.value.trim()); });
pasteForm.addEventListener('submit', (e) => { e.preventDefault(); inspectHtml(htmlInput.value.trim(), baseUrlInput.value.trim()); });

// Example: Input paste listener
urlInput.addEventListener('paste', async (e) => {
  // Handle paste event
});

// Example: Modal close listeners
badgeModalClose?.addEventListener('click', closeBadgeModal);
qrModalClose?.addEventListener('click', closeQrModal);
```

**Purpose:** General UI interaction handling (not filter-specific)
**Note:** These are standard event listeners, not part of the filter-change pattern system

---

## 2. Operation Guards (child 2)

### Pattern 2.1: Filter Operation Guard Flag
**Location:** Line 6761
**Context:** Global state management

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

**Purpose:** Prevents smart ordering resets during filter operations
**Usage Pattern:**
```javascript
// Set guard before filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear guard after operation
setTimeout(() => { isFilterOperation = false; }, 0);
```

---

### Pattern 2.2: Smart Ordering Guard Check
**Location:** Lines 9272-9279
**Context:** Page type change handling in `applySmartOrdering()`

```javascript
// P2 - Filter operation guard: Skip cardOrder clearing during filter changes or when smart ordering is active
// This prevents smart order resets when users hide/show platforms or when smart ordering is currently active
if (isFilterOperation || isSmartOrdering()) {
  if (DEBUG_SMART_ORDERING) {
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
} else {
  // Clear cardOrder for groups that weren't manually modified by user
  // ...
}
```

**Purpose:** Preserves card order during filter operations to prevent unwanted resets
**Guard Conditions:** 
- `isFilterOperation` - actively processing filter change
- `isSmartOrdering()` - smart ordering in progress

---

### Pattern 2.3: Centralized Guard Function
**Location:** Lines 8415-8417
**Context:** Guard function for checking smart ordering status

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Purpose:** Centralized check for smart ordering status
**Returns:** `true` if BOTH user preference enabled AND runtime active

**Usage Documentation (Lines 8378-8413):**
```javascript
/**
 * Check if smart ordering is currently active
 *
 * Centralized guard function that checks BOTH the user preference and runtime state
 * to determine if smart ordering is currently active. This is the primary guard to
 * use before any operation that might interfere with smart ordering.
 *
 * **Checks two conditions:**
 * 1. User preference: `platformPrefs.smartOrdering` (is smart ordering enabled?)
 * 2. Runtime state: `isSmartOrderingActive` (is smart ordering currently in progress?)
 *
 * **Usage in filter handlers:**
 * function myFilterHandler() {
 *   if (isSmartOrdering()) {
 *     queueFilterOperation(myFilterHandler, 'myFilterHandler');
 *     return;
 *   }
 *   // Proceed with filter operation
 * }
 *
 * **When to check:**
 * - Before modifying platform order/visibility
 * - Before resetting card order
 * - Before any operation that might conflict with smart ordering
 * - In async callbacks that might execute during smart ordering
 *
 * **Related flags:**
 * - `isFilterOperation`: Set during filter operations to prevent smart order resets
 * - `isApplyingSmartOrder`: Prevents concurrent renders during smart ordering
 * - `isSmartOrderingActive`: Runtime flag tracking smart ordering progress
 *
 * **Related preferences:**
 * - `platformPrefs.smartOrdering`: User preference for smart ordering (default: true)
 *
 * @returns {boolean} True if smart ordering is BOTH enabled AND currently active, false otherwise
 */
```

---

### Pattern 2.4: Should Defer Filter Operation Check
**Location:** Lines 8373-8375
**Context:** Check if operation should be queued

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Purpose:** Simple check for whether to defer filter operations
**Usage:** Called before executing filter operations that might conflict

---

## 3. Queue and State Management (child 3)

### Pattern 3.1: Pending Filter Operations Queue
**Location:** Line 6763
**Context:** Global state for queuing filter operations

```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Purpose:** Stores filter operations that need to execute after smart ordering completes

---

### Pattern 3.2: Queue Filter Operation Function
**Location:** Lines 8424-8429
**Context:** Enqueue a filter operation for later execution

```javascript
/**
 * Queue a filter operation to be processed after smart ordering completes
 * @param {Function} operation - The filter operation function to execute later
 * @param {string} description - Description of the operation for debugging
 */
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Purpose:** Defers filter operations until smart ordering completes
**Parameters:**
- `operation` - Function to execute later
- `description` - Debug logging label

---

### Pattern 3.3: Process Pending Filter Operations
**Location:** Lines 8434-8457
**Context:** Execute queued operations after smart ordering

```javascript
/**
 * Process pending filter operations after smart ordering completes
 */
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

**Purpose:** Execute all queued filter operations in order
**Safety Features:**
- Empty check before processing
- Array copy to prevent modification during iteration
- Try-catch error handling per operation
- Clear queue before processing

---

### Pattern 3.4: Global Exports for Queue Operations
**Location:** Lines 5472-5482
**Context:** Expose queue operations to window object

```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

Object.defineProperty(window, 'pendingFilterOperations', {
  get: () => pendingFilterOperations,
  set: (val) => { pendingFilterOperations = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
```

**Purpose:** Expose queue operations globally for debugging and external access

---

### Pattern 3.5: Import Preferences with Queue
**Location:** Lines 8560-8574
**Context:** Import preferences during smart ordering

```javascript
// Create a wrapper function that doesn't depend on the event
const applyImportedPrefs = () => {
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  isSmartOrderingActive = false;
  if (DEBUG_SMART_ORDERING) {
    console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
  }
};
queueFilterOperation(applyImportedPrefs, 'importPreferences');
if (DEBUG_SMART_ORDERING) {
  console.log('[importPreferences] Smart ordering active - operation queued');
}
return;
```

**Purpose:** Defer preference import if smart ordering is active
**Pattern:** Create wrapper → queue → return early

---

### Pattern 3.6: What If Mode Toggle with Queue
**Location:** Lines 8623-8634
**Context:** Toggle What If mode during smart ordering

```javascript
// Check if smart ordering is active - defer operation if so
if (isSmartOrdering()) {
  const applyWhatIfReset = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
  if (DEBUG_SMART_ORDERING) {
    console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
  }
  return;
}
```

**Purpose:** Defer What If reset if smart ordering is active
**Pattern:** Same as import preferences wrapper pattern

---

### Pattern 3.7: Render Queuing During Smart Ordering
**Location:** Line 6762
**Context:** Queue render calls during smart ordering

```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

**Purpose:** Prevent concurrent renders during smart ordering

---

### Pattern 3.8: Render After Current
**Location:** Line 6759
**Context:** Queue renders during active render

```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

**Purpose:** Queue subsequent renders if one is already in progress

---

### Pattern 3.9: Pending What If Tags
**Location:** Line 35
**Context:** Store What If tags before data loads

```javascript
let pendingWhatIfTags = null; // Store pending What If tags from hash before data loads
```

**Purpose:** Hold What If filter state until data is available

**Usage (Lines 577-578, 1186):**
```javascript
// Data not loaded yet, store pending tags to apply later
pendingWhatIfTags = tags;

// Apply pending What If tags from hash state if data was just loaded
if (pendingWhatIfTags) {
  applyPendingWhatIfTags();
}
```

---

## 4. Data Processing (child 4)

### Pattern 4.1: Metadata Table Filter
**Location:** Lines 4369-4375
**Context:** Filter metadata rows by tag/value

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  // ... rest of rendering
}
```

**Purpose:** Filter metadata table rows by tag name or value
**Filter Logic:**
- Case-insensitive substring match
- Matches both tag names and values
- Empty filter returns all rows

---

### Pattern 4.2: Command Palette Filter
**Location:** Lines 9659-9674
**Context:** Filter commands by label or category

```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

**Purpose:** Filter command palette items
**Filter Logic:**
- Case-insensitive match
- Searches both label and category
- Empty query shows all commands
- Resets selected index on filter

---

### Pattern 4.3: Filter Operations with Guard Flags
**Location:** Multiple locations (8577-8581, 8637-8641, 8745-8747)
**Context:** Standard pattern for filter operations with guard flags

```javascript
// Set guard flag to prevent smart order resets during filter operation
isFilterOperation = true;
renderPreviews(currentData);
// Clear flag after render (renderPreviews will handle timing)
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Protect filter operations from smart order resets
**Pattern:** Set flag → execute → clear flag async

---

### Pattern 4.4: Array Filter Operations (Non-Event)
**Locations:** Multiple (553, 712, 1387-1388, 1718-1720, etc.)
**Context:** Various array filtering operations

```javascript
// Example 1: Filter non-empty tags (Line 553)
const tags = state.without.split(',').filter(t => t);

// Example 2: Filter non-empty URLs (Line 712)
const urls = trimmed.split(/[\r\n]+/).map(u => u.trim()).filter(u => u);

// Example 3: Filter errors by severity (Lines 1387-1388)
const errCount = (data.diagnostics || []).filter(d => d.severity === 'error').length;
const warnCount = (data.diagnostics || []).filter(d => d.severity === 'warning').length;

// Example 4: Filter custom order platforms (Lines 1718-1720)
const customOrder = platformPrefs.cardOrder[group.id].filter(pid => group.platforms.includes(pid));
const newPlatforms = group.platforms.filter(pid => !customOrder.includes(pid));
```

**Purpose:** Data filtering and transformation (not event-driven filter changes)
**Note:** These are standard JavaScript array.filter() operations, not part of the filter-change event pattern system

---

## 5. Pattern Integration Summary

### 5.1 Complete Filter Operation Flow

```
User Input (filter change)
    ↓
Event Listener (Pattern 1)
    ↓
Guard Check: isSmartOrdering()? (Pattern 2)
    ↓
    ├─ YES → Queue Operation (Pattern 3) → Return
    │
    └─ NO → Set isFilterOperation = true (Pattern 2.1)
            ↓
            Execute Filter Operation (Pattern 4)
            ↓
            Clear isFilterOperation = false (async)
            ↓
            Complete
```

### 5.2 Interaction Between Patterns

**Event Listeners (1)** trigger filter operations, which check **Operation Guards (2)** to determine if the operation should proceed immediately or be queued. If queued, **Queue Management (3)** stores the operation for later execution. The actual **Data Processing (4)** happens either immediately or when queued operations are processed.

### 5.3 Guard Flag Timeline

```
Timeline: Filter Operation During Smart Ordering

T0: Smart ordering starts (isSmartOrderingActive = true)
T1: User triggers filter change
T2: Event listener fires
T3: Guard check: isSmartOrdering() returns true
T4: Operation queued to pendingFilterOperations
T5: Return early (no immediate execution)
T6: Smart ordering completes
T7: processPendingFilterOperations() called
T8: Queued operation executes with isFilterOperation = true
T9: isFilterOperation = false (async)
```

### 5.4 State Variables Reference

| Variable | Type | Purpose | Scope |
|----------|------|---------|-------|
| `isFilterOperation` | `boolean` | Prevents smart order resets during filter ops | Global (line 6761) |
| `isSmartOrderingActive` | `boolean` | Tracks smart ordering progress | Global (line 6762) |
| `pendingFilterOperations` | `Array<{operation, description}>` | Queue of deferred filter ops | Global (line 6763) |
| `pendingRenderData` | `object` \| `null` | Queued render during smart ordering | Global (line 6757) |
| `pendingRenderAfterCurrent` | `object` \| `null` | Queued render during active render | Global (line 6759) |
| `pendingWhatIfTags` | `Array` \| `null` | What If tags before data loads | Global (line 35) |

---

## 6. Other Patterns

### Pattern 6.1: Recents List Filter
**Location:** Line 5026
**Context:** Filter out specific URL from recents

```javascript
recents = recents.filter(r => r.url !== url);
```

**Purpose:** Remove a specific URL from recent items list
**Type:** Data transformation (not event-driven filter)

---

### Pattern 6.2: Boolean Filter Pattern
**Location:** Line 3964-3966
**Context:** Count checked checkboxes

```javascript
.filter(Boolean);

const checkedCount = children.filter(cb => cb.checked).length;
```

**Purpose:** Filter out falsy values or count checked items
**Type:** Data transformation utility

---

### Pattern 6.3: Platform Crop Filter
**Locations:** Lines 4053, 4147
**Context:** Filter platform crops

```javascript
enabledPids.map(pid => PLATFORM_CROPS[pid]).filter(Boolean),
```

**Purpose:** Get valid platform crop images
**Type:** Data transformation

---

### Pattern 6.4: Diagnostic Filter
**Locations:** Lines 4207-4209, 9099
**Context:** Filter diagnostics by severity

```javascript
const errorCount = sorted.filter(d => d.severity === 'error').length;
const warningCount = sorted.filter(d => d.severity === 'warning').length;
const infoCount = sorted.filter(d => d.severity === 'info').length;

// Usage in rendering
const activeErrWarn = items.filter(el =>
```

**Purpose:** Count or filter diagnostic items by severity
**Type:** Data transformation

---

### Pattern 6.5: Platform Score Filter
**Locations:** Lines 1789-1792, 1992-1995, 2011-2014
**Context:** Filter platforms by grade

```javascript
const groupScores = group.platforms.map(pid => data.scoring.scores[pid]).filter(Boolean);
const gPassing = groupScores.filter(s => ['A+','A'].includes(s.grade)).length;
const gWarn = groupScores.filter(s => ['B','C'].includes(s.grade)).length;
const gFail = groupScores.filter(s => ['D','F'].includes(s.grade)).length;
```

**Purpose:** Categorize platforms by grade
**Type:** Data transformation for reporting

---

### Pattern 6.6: Class List Filter
**Location:** Line 7176
**Context:** Filter grade classes from element

```javascript
[...el.classList].filter((c) => c.startsWith('grade-')).forEach((c) => el.classList.remove(c));
```

**Purpose:** Remove all grade-related CSS classes
**Type:** DOM manipulation

---

### Pattern 6.7: Fixed Items Filter
**Location:** Line 9095
**Context:** Count fixed items

```javascript
const fixed = items.filter(el => el.dataset.fixed === 'true').length;
```

**Purpose:** Count items marked as fixed
**Type:** DOM query filtering

---

## Summary

The Vista filter-change system consists of **four main pattern categories**:

1. **Event Listeners (3 instances)** - Metadata filter input, command palette filter input, and general DOM event listeners
2. **Operation Guards (4 guards)** - `isFilterOperation`, `isSmartOrdering()`, `shouldDeferFilterOperation()`, and guard checks in cardOrder clearing
3. **Queue and State Management (9 state variables + 2 functions)** - Pending operations queue, render queueing, What If tags pending, and queue/process functions
4. **Data Processing (2 event-driven filters)** - Metadata table filter and command palette filter, plus numerous array.filter() utility operations

**Key Integration Points:**
- Event listeners trigger guard checks
- Guards determine immediate execution vs. queuing
- Queue stores deferred operations
- Data processing handles the actual filtering

**Non-Event Patterns:**
- Standard JavaScript `array.filter()` operations for data transformation
- Boolean filtering, severity filtering, grade filtering
- These are utility patterns, not part of the event-driven filter-change system

**Documentation References:**
- Lines 8367-8457: Centralized guard functions and queue operations with extensive JSDoc comments
- Lines 9272-9300: Filter operation guard in cardOrder clearing with detailed comments
- Lines 8378-8413: Comprehensive usage documentation for `isSmartOrdering()` guard function
