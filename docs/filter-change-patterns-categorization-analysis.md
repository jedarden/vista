# Filter-Change Patterns: Categorization Analysis

**Project:** Vista (Social Share Preview Generator)  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Documentation Date:** 2026-08-24  
**Bead:** vista-ac7fe4bf  
**Scope:** Comprehensive categorization of filter-change patterns with relationships, dependencies, and anti-patterns

---

## Executive Summary

The Vista application uses a **guard-based coordination system** for filter operations rather than traditional hook patterns, event emitters, or callback systems. This analysis categorizes all filter-change patterns into four main types, identifies their relationships and dependencies, and notes several deliberate architectural decisions that may appear as anti-patterns but serve specific purposes.

**Key Finding:** Vista does NOT use traditional hook systems (addHook), custom event emitters, or callback registration patterns. Instead, it uses a sophisticated flag-based queue system to prevent race conditions between filter operations and smart ordering.

---

## Table of Contents

1. [Pattern Type Categories](#pattern-type-categories)
2. [Pattern Relationships and Dependencies](#pattern-relationships-and-dependencies)
3. [Anti-Patterns and Unusual Implementations](#anti-patterns-and-unusual-implementations)
4. [Pattern Examples by Category](#pattern-examples-by-category)
5. [Recommendations](#recommendations)

---

## 1. Pattern Type Categories

### Category 1: Guard-Based Coordination Patterns

**Pattern Type:** State machine / Race condition prevention  
**Count:** 5 core patterns  
**Purpose:** Coordinate filter operations with smart ordering to prevent state conflicts

#### 1.1 Guard Flag Pattern

**Lines:** 6279, 5046-5049, 8080, 8096, 8144, 8156, 8263, 8792-8795

**Description:** Boolean flag that prevents smart order resets during filter operations

```javascript
// Declaration
let isFilterOperation = false; // Line 6279

// Usage pattern (repeated 5 times)
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);

// Check pattern
if (isFilterOperation || isSmartOrdering()) {
  console.warn('Skipping operation');
  return;
}
```

**Context:** This is the PRIMARY coordination mechanism. When `isFilterOperation` is `true`, operations that would clear card order (e.g., page type changes) are skipped.

**Related Files:**
- `/home/coding/vista/docs/filter-change-hooks-comprehensive.md` (Pattern 1)
- `/home/coding/vista/docs/filter-change-patterns-final-compilation.md` (Pattern 3.2)

---

#### 1.2 Queue/Defer Pattern

**Lines:** 6281, 7942-7947, 7952-7975, 5050-5056

**Description:** Filter operations are queued during smart ordering, then executed after completion

```javascript
// Declaration
let pendingFilterOperations = []; // Line 6281

// Queue function
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}

// Process function
function processPendingFilterOperations() {
  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];
  
  operations.forEach(({ operation, description }) => {
    try {
      operation();
    } catch (error) {
      console.error(`Error executing: ${description}`, error);
    }
  });
}
```

**Context:** Operations that would conflict with smart ordering are queued and executed later, preventing race conditions.

**Related Files:**
- `/home/coding/vista/docs/filter-change-hooks-comprehensive.md` (Pattern 2)
- `/home/coding/vista/docs/research/filter-change-event-emitters-report.md` (Section 2)

---

#### 1.3 setTimeout-Based Guard Clearing Pattern

**Lines:** 8082, 8099, 8146, 8159, 8265

**Description:** Guard flag is cleared asynchronously to ensure it stays true during entire render cycle

```javascript
// Pattern used in 5 locations
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Why this pattern?** The `setTimeout(..., 0)` ensures the flag stays `true` through the entire render call stack, even if `renderPreviews()` is synchronous. This prevents the guard from clearing too early.

**Context:** Critical for preventing race conditions when filter operations trigger renders.

---

#### 1.4 Guard Wrapper Pattern

**Lines:** 7867-7882, 7977-7986

**Description:** Centralized wrapper functions that automatically manage guard flags

```javascript
// guardWrapper - for operations that don't require re-rendering
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();
    isSmartOrderingActive = false;
  });
}

// guardWrapperWithRender - for operations that require re-rendering
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
  });
}
```

**Two types of wrappers:**
- `guardWrapper()` - Does NOT reset order (e.g., favorite toggles)
- `guardWrapperWithRender()` - DOES reset order (e.g., hide/show platforms)

**Context:** Provides a cleaner API than manually managing guards in each operation.

---

#### 1.5 Centralized Guard Functions Pattern

**Lines:** 7891-7893, 7933-7935, 7952-7975

**Description:** Three centralized functions provide API for filter operation lifecycle

```javascript
// Check if should defer
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}

// Check if smart ordering active
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}

// Process queued operations
function processPendingFilterOperations() {
  // ... processes pendingFilterOperations array
}
```

**Context:** These functions are called throughout the codebase to check guard state and process queued operations.

---

### Category 2: Direct Event Listener Patterns

**Pattern Type:** Standard DOM event handling  
**Count:** 35+ event listeners  
**Purpose:** Direct UI event handling without custom event system

#### 2.1 Filter Input Event Listeners

**Lines:** 3991, 9085

**Description:** Standard `addEventListener` for filter input fields

```javascript
// Metadata filter input (Line 3991)
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}

// Command palette filter (Line 9085)
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Event Types:**
- `input` - Real-time updates (text fields, color pickers)
- `change` - Discrete selections (dropdowns, checkboxes, file uploads)

**Context:** Pure filtering operations that don't affect global filter state.

---

#### 2.2 Change Event Listeners (Platform Selection)

**Lines:** 3481, 3497, 8206-8215

**Description:** Platform/group toggle checkboxes that filter visible platforms

```javascript
// Group toggle (Lines 3481-3491)
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    const group = e.target.dataset.group;
    const platforms = groups.find(g => g.id === group)?.platforms || [];
    platforms.forEach(pid => {
      const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
      if (platformCb) platformCb.checked = e.target.checked;
    });
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});

// What-If tag toggles (Lines 8206-8215)
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Check if smart ordering is active - defer operation if so
    if (isSmartOrdering()) {
      const applyWhatIfToggle = () => {
        isFilterOperation = true;
        renderPreviews(currentData);
        setTimeout(() => { isFilterOperation = false; }, 0);
      };
      queueFilterOperation(applyWhatIfToggle, 'whatIfToggle');
      return;
    }
    // Set guard flag
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  });
});
```

**Context:** These listeners integrate with the guard system to prevent smart order resets.

---

### Category 3: Hash-Based State Management Patterns

**Pattern Type:** URL state synchronization  
**Count:** 2 functions  
**Purpose:** Encode filter state in URL hash for shareable links

#### 3.1 Hash Update Pattern

**Lines:** 492-522

**Description:** Updates URL hash to reflect current filter state

```javascript
function updateHash(options = {}) {
  const parts = [];
  
  // Tab state
  const tab = options.tab !== undefined ? options.tab : currentTab;
  if (tab) {
    parts.push(`tab=${tab}`);
  }
  
  // Compare mode with second URL
  if (currentMode === 'compare' && compareData.after) {
    parts.push(`mode=compare`);
    const b = options.b !== undefined ? options.b : compareData.after.url;
    if (b) {
      parts.push(`b=${encodeURIComponent(b)}`);
    }
  }
  
  // What If disabled tags
  const without = options.without !== undefined ? options.without : Array.from(disabledTags).join(',');
  if (without) {
    parts.push(`without=${without}`);
  }
  
  const hash = parts.length > 0 ? `#${parts.join('&')}` : '';
  history.replaceState(null, null, window.location.pathname + window.location.search + hash);
}
```

**Usage locations:** Lines 686, 689, 5014, 5905, 8617, 8696, 8720, 8759

**Context:** State is encoded in URL hash, enabling shareable links that restore filter state.

---

#### 3.2 Hash Restore Pattern

**Lines:** 527-565

**Description:** Parses hash on page load and restores filter state

```javascript
function restoreHashState() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  
  const params = new URLSearchParams(hash);
  
  // Restore tab
  if (params.has('tab')) {
    const tab = params.get('tab');
    if (['previews', 'diagnostics', 'rawTags', 'cache'].includes(tab)) {
      currentTab = tab;
      switchTab(tab, false);
    }
  }
  
  // Restore compare mode
  if (params.has('mode') && params.get('mode') === 'compare' && params.has('b')) {
    const urlB = decodeURIComponent(params.get('b'));
    // ... handle compare mode restoration
  }
  
  // Restore What-If disabled tags
  if (params.has('without')) {
    const without = params.get('without');
    without.split(',').forEach(tag => disabledTags.add(tag));
    if (disabledTags.size > 0) {
      whatIfMode = true;
      updateWhatIfPanel();
    }
  }
}
```

**Context:** Called on page load to restore filter state from URL.

---

### Category 4: NOT FOUND Patterns

**Pattern Type:** Traditional hook/event systems  
**Count:** 0 (none found)  
**Purpose:** These patterns were explicitly searched but NOT found in Vista

#### 4.1 AddHook System

**Search Scope:** Full codebase  
**Result:** ❌ Not found

**Patterns searched:**
- `addHook('filter-change', ...)`
- `addHook('beforeFilterChange', ...)`
- `addHook('afterFilterChange', ...)`

**What Vista uses instead:** Guard flags + queue system

**Related Bead:** bf-58lvk

---

#### 4.2 onFilterChange Callback Pattern

**Search Scope:** Full codebase  
**Result:** ❌ Not found

**Patterns searched:**
- Functions named `onFilterChange`
- Properties/methods named `onFilterChange`
- Callbacks passed as `onFilterChange` parameters

**What Vista uses instead:** Direct event listeners + guard system

**Related Bead:** bf-2t8ew

---

#### 4.3 Custom Event Emitter System

**Search Scope:** Full codebase  
**Result:** ❌ Not found

**Patterns searched:**
- CustomEvent usage for filter changes
- EventBus class
- Publish/subscribe pattern
- Event emitter classes

**What Vista uses instead:** Guard flags + direct DOM events

**Related Bead:** bf-3a0rj

---

## 2. Pattern Relationships and Dependencies

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    FILTER OPERATION TRIGGERS                  │
│  (User clicks, imports, what-if toggles, platform changes)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   isSmartOrdering() Check      │
         │   (lines 7888, 7978, 8087,    │
         │    8142)                      │
         └───────────┬───────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐       ┌─────────────────┐
│   YES          │       │   NO             │
│ Smart ordering│       │ Smart ordering   │
│ active        │       │ not active       │
└───────┬───────┘       └────────┬─────────┘
        │                         │
        ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐
│ queueFilter     │     │ Set isFilterOperation│
│ Operation()     │     │ = true               │
│ (lines 8087,    │     │ (lines 8096, 8156,   │
│  8148)          │     │  8263)               │
└────────┬────────┘     └──────────┬──────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐
│ Return early    │     │ renderPreviews()     │
│ (operation      │     │                      │
│  queued)        │     │ ┌───────────────────┐│
└─────────────────┘     │ │   renderPreviews  ││
         │               │ │   completes       ││
         │               │ └─────────┬─────────┘│
         │               │           │            │
         │               ▼           │            │
         │    ┌──────────────────┐  │            │
         │    │ setTimeout(() =>  │  │            │
         │    │  isFilterOperation│  │            │
         │    │  = false, 0)      │  │            │
         │    └──────────────────┘  │            │
         │               │           │            │
         └───────────────┴───────────┴────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Smart ordering completes     │
         │  (line 8457)                  │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  processPendingFilter         │
         │  Operations()                │
         │  (lines 7952-7975)           │
         └───────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │  Execute queued operations    │
         │  (each sets guard, renders,   │
         │   clears guard)               │
         └───────────────────────────────┘
```

### Core Dependency Relationships

1. **Guard Flag ↔ Queue System**
   - `isFilterOperation` flag is set BEFORE queueing
   - `pendingFilterOperations` array stores operations during smart ordering
   - Both exposed to `window` for debugging (lines 5046-5058)

2. **Smart Ordering → Queue → Process**
   - Smart ordering active → queue operations → process after completion
   - Linear dependency: smart ordering must complete before queue is processed

3. **Event Listeners → Guard System**
   - Filter event listeners check `isSmartOrdering()` before proceeding
   - If smart ordering active, queue operation and return early
   - If not active, set guard and proceed immediately

4. **Hash State ↔ Filter State**
   - `updateHash()` called after filter state changes
   - `restoreHashState()` initializes filter state on page load
   - Hash format: `#tab=previews&without=og:image,twitter:card`

5. **Guard Wrappers → Guard Flags**
   - `guardWrapper()` and `guardWrapperWithRender()` encapsulate guard management
   - Provide cleaner API than manual guard flag management
   - Internally use the same guard flag pattern

---

## 3. Anti-Patterns and Unusual Implementations

### 3.1 Anti-Pattern: setTimeout-Based Guard Clearing

**Lines:** 8082, 8099, 8146, 8159, 8265

**Appearance:** Looks like an anti-pattern (using `setTimeout` with 0 delay for state management)

**Why it's deliberate:** Ensures guard flag stays `true` through the entire render call stack, even if `renderPreviews()` is synchronous. Without this pattern, the guard could clear too early, allowing race conditions.

**Alternative considered:** Using promises/async-await
**Why rejected:** Would require making entire render chain async, adding complexity to a large codebase

**Is it actually problematic?** No - it's a well-established pattern for ensuring state persists through the current event loop tick.

---

### 3.2 Anti-Pattern: Global Window Exports

**Lines:** 5046-5058

**Appearance:** Exposing internal state and functions to global `window` object

```javascript
Object.defineProperty(window, 'isFilterOperation', {
  get: () => isFilterOperation,
  set: (val) => { isFilterOperation = val; }
});

window.queueFilterOperation = queueFilterOperation;
window.processPendingFilterOperations = processPendingFilterOperations;
window.toggleHidden = toggleHidden;
window.toggleFavorite = toggleFavorite;
```

**Why it's deliberate:** Enables debugging and testing via browser console. Developers can inspect and manipulate filter state at runtime.

**Alternative considered:** Keeping everything private
**Why rejected:** Would make debugging much harder during development

**Security concern:** No - this is client-side code only. No sensitive data exposed.

**Is it actually problematic?** No - standard practice for debugging complex client-side state management.

---

### 3.3 Anti-Pattern: Dual Code Paths (Queued vs Direct)

**Lines:** 8087-8099, 8142-8159

**Appearance:** Duplicate code for queued vs direct execution paths

```javascript
// importPreferences - lines 8087-8099
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

// Direct execution path (lines 8096-8099)
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Why it's deliberate:** Smart ordering requires queueing, but normal operation should execute immediately for responsiveness. DRY principle sacrificed for clearer intent.

**Alternative considered:** Always queue operations
**Why rejected:** Would add unnecessary latency for common cases (most operations don't happen during smart ordering)

**Is it actually problematic?** Mildly - code duplication could be reduced by extracting a shared function, but the current structure makes the intent very clear.

---

### 3.4 Anti-Pattern: Synchronous renderPreviews in Async Context

**Lines:** Throughout - `renderPreviews()` is called synchronously but may trigger async operations

**Appearance:** Mixing synchronous and asynchronous patterns without clear boundaries

**Why it's deliberate:** `renderPreviews()` is designed to be synchronous for most operations (UI updates), with async image loading handled separately via promises.

**Context:** The render function updates DOM immediately (sync) while image probes happen in background (async). This keeps UI responsive.

**Is it actually problematic?** No - this is the standard pattern for progressive web apps. DOM updates are sync, resource loading is async.

---

### 3.5 Unusual Implementation: No Hook/Callback System

**Appearance:** Vista has 43 filter-related handlers but NO hook registration system

**Why it's unusual:** Most applications of this complexity use a hook system or callback registration pattern

**Why it's deliberate:** Guard flag system provides simpler coordination for the specific problem (preventing race conditions with smart ordering). A full hook system would be overkill.

**Alternative considered:** Implementing `addHook('filter-change', handler)` pattern
**Why rejected:** Would add complexity without solving the core problem (race conditions during smart ordering). Guard flags + queue is more direct.

**Is it actually problematic?** No - the guard system is actually simpler than a hook system would be for this use case.

---

### 3.6 Unusual Implementation: Direct DOM Manipulation in Event Handlers

**Lines:** Throughout - many handlers directly manipulate DOM

**Appearance:** No virtual DOM or state-based rendering system

**Why it's unusual:** Modern frameworks (React, Vue) use declarative rendering

**Why it's deliberate:** Vista is vanilla JavaScript. Direct DOM manipulation is the standard pattern.

**Context:** The application uses direct DOM updates for performance and simplicity. No framework overhead.

**Is it actually problematic?** No - vanilla JS direct DOM manipulation is a valid approach, especially for smaller applications.

---

## 4. Pattern Examples by Category

### Category 1 Examples: Guard-Based Coordination

#### Example 1.1: Platform Import with Guard

```javascript
// Lines 8087-8099
function importPreferences(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      
      // Check if smart ordering active
      if (isSmartOrdering()) {
        // Queue operation for later execution
        const applyImportedPrefs = () => {
          platformPrefs.favorites = new Set(parsed.favorites || []);
          platformPrefs.hidden = new Set(parsed.hidden || []);
          platformPrefs.cardOrder = parsed.cardOrder || {};
          
          isFilterOperation = true;
          renderPreviews(currentData);
          setTimeout(() => { isFilterOperation = false; }, 0);
          isSmartOrderingActive = false;
        };
        queueFilterOperation(applyImportedPrefs, 'importPreferences');
        return;
      }
      
      // Direct execution path
      platformPrefs.favorites = new Set(parsed.favorites || []);
      platformPrefs.hidden = new Set(parsed.hidden || []);
      platformPrefs.cardOrder = parsed.cardOrder || {};
      
      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
      
    } catch (error) {
      console.error('Error importing preferences:', error);
    }
  };
  
  reader.readAsText(file);
}
```

**Pattern elements:**
- Guard check: `isSmartOrdering()`
- Queue path: Create operation, call `queueFilterOperation()`, return early
- Direct path: Set `isFilterOperation = true`, render, clear guard with `setTimeout`
- State management: Update `platformPrefs` object
- Error handling: try-catch block

---

#### Example 1.2: What-If Mode Toggle with Guard

```javascript
// Lines 8142-8159
function toggleWhatIfMode() {
  whatIfMode = !whatIfMode;
  
  if (!whatIfMode) {
    // Clearing what-if mode
    const panel = document.getElementById('whatIfPanel');
    if (panel) panel.classList.remove('open');
    
    disabledTags.clear();
    updateHash({ without: '' });
    
    // Check if smart ordering active
    if (isSmartOrdering()) {
      // Queue operation
      const applyWhatIfReset = () => {
        isFilterOperation = true;
        renderPreviews(currentData);
        setTimeout(() => { isFilterOperation = false; }, 0);
        isSmartOrderingActive = false;
      };
      queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
      if (DEBUG_SMART_ORDERING) {
        console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
      }
      return;
    }
    
    // Direct execution
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
    return;
  }
  
  // Entering what-if mode
  const panel = document.getElementById('whatIfPanel');
  if (panel) {
    panel.classList.add('open');
    updateWhatIfPanel();
  }
}
```

**Pattern elements:**
- State toggle: `whatIfMode = !whatIfMode`
- Branching logic: Different behavior for entering vs exiting what-if mode
- Guard check and queue: Same pattern as importPreferences
- Hash update: `updateHash({ without: '' })` to clear disabled tags from URL

---

### Category 2 Examples: Direct Event Listeners

#### Example 2.1: Metadata Filter Input

```javascript
// Lines 3988-3995
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}

// Lines 3941-3975
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;
  
  // Render filtered rows
  let html = `
    <thead>
      <tr>
        <th>Tag</th>
        <th>Content</th>
        <th>Location</th>
      </tr>
    </thead>
    <tbody>
      ${filteredRows.length > 0
        ? filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('')
        : '<tr><td colspan="4" class="no-results">No tags match your filter</td></tr>'
      }
    </tbody>
  `;
  
  // Update table
  const table = document.getElementById('metadataTableBody');
  if (table) {
    table.innerHTML = html;
  }
  
  // Update count
  const countEl = document.getElementById('metadataTagCount');
  if (countEl) {
    countEl.textContent = `${filteredRows.length} of ${allMetadataRows.length} tags`;
  }
}
```

**Pattern elements:**
- Standard `addEventListener` with `input` event
- Inline arrow function handler
- Pure filtering logic (no guard flags)
- Local-only filtering (doesn't affect global state)
- User feedback: Count display and "no results" message

---

#### Example 2.2: Command Palette Filter

```javascript
// Line 9085
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);

// Lines 9177-9192
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

**Pattern elements:**
- Named function handler (`filterCommands`)
- Searches both label and category fields
- Resets selected index to 0 on each input
- Empty query shows all commands
- Non-empty query filters and renders results

---

### Category 3 Examples: Hash-Based State Management

#### Example 3.1: URL Hash Encoding

```javascript
// Lines 492-522
function updateHash(options = {}) {
  const parts = [];
  
  // Tab state
  const tab = options.tab !== undefined ? options.tab : currentTab;
  if (tab) {
    parts.push(`tab=${tab}`);
  }
  
  // Compare mode with second URL
  if (currentMode === 'compare' && compareData.after) {
    parts.push(`mode=compare`);
    const b = options.b !== undefined ? options.b : compareData.after.url;
    if (b) {
      parts.push(`b=${encodeURIComponent(b)}`);
    }
  }
  
  // What If disabled tags
  const without = options.without !== undefined ? options.without : Array.from(disabledTags).join(',');
  if (without) {
    parts.push(`without=${without}`);
  }
  
  const hash = parts.length > 0 ? `#${parts.join('&')}` : '';
  history.replaceState(null, null, window.location.pathname + window.location.search + hash);
}

// Usage example (line 8720)
updateHash({ without: Array.from(disabledTags).join(',') });
```

**Pattern elements:**
- Encodes multiple state dimensions in single hash
- Uses `history.replaceState()` (doesn't add to history stack)
- URL encoding for special characters
- Conditional inclusion (only add key if value exists)
- Join with `&` separator (querystring-like format)

**Example URLs:**
- `#tab=diagnostics`
- `#mode=compare&b=https://example.com`
- `#without=og:image,twitter:card`
- `#tab=previews&without=og:image`

---

#### Example 3.2: URL Hash Restoration

```javascript
// Lines 527-565
function restoreHashState() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  
  const params = new URLSearchParams(hash);
  
  // Restore tab
  if (params.has('tab')) {
    const tab = params.get('tab');
    if (['previews', 'diagnostics', 'rawTags', 'cache'].includes(tab)) {
      currentTab = tab;
      switchTab(tab, false);
    }
  }
  
  // Restore compare mode
  if (params.has('mode') && params.get('mode') === 'compare' && params.has('b')) {
    const urlB = decodeURIComponent(params.get('b'));
    if (urlB && isValidUrl(urlB)) {
      currentMode = 'compare';
      compareData.after = { url: urlB };
      // Update UI and fetch comparison
      document.getElementById('compareModeBtn')?.classList.add('active');
      fetchAndCompare(urlB);
    }
  }
  
  // Restore What-If disabled tags
  if (params.has('without')) {
    const without = params.get('without');
    without.split(',').forEach(tag => disabledTags.add(tag));
    if (disabledTags.size > 0) {
      whatIfMode = true;
      updateWhatIfPanel();
    }
  }
}
```

**Pattern elements:**
- Parses hash using `URLSearchParams` (handles `&` separator)
- Validation: Checks tab names, URL validity
- State restoration: Updates global state variables
- UI updates: Calls appropriate update functions
- Special handling for comma-separated values (`without` parameter)

---

## 5. Recommendations

### 5.1 Current Architecture Strengths

✅ **Simplicity:** Guard flag system is simpler than a full hook/event system  
✅ **Debuggability:** Global window exports enable runtime inspection  
✅ **Explicit coordination:** Guard flags make state coordination explicit in code  
✅ **No race conditions:** Queue system prevents filter/smart ordering conflicts  
✅ **Shareable URLs:** Hash-based state enables link sharing

### 5.2 Potential Improvements

#### Improvement 1: Reduce Code Duplication in Queued/Direct Paths

**Current:** Duplicate guard setup code in queued vs direct paths

```javascript
// Current pattern - duplicated in 4+ locations
if (isSmartOrdering()) {
  const operation = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(operation, 'description');
  return;
}
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Recommended:** Extract shared function

```javascript
function executeWithGuard(operation, description) {
  const guardedOperation = () => {
    isFilterOperation = true;
    operation();
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  
  if (isSmartOrdering()) {
    queueFilterOperation(guardedOperation, description);
    return;
  }
  
  guardedOperation();
}

// Usage:
executeWithGuard(() => renderPreviews(currentData), 'importPreferences');
```

**Benefit:** Reduces duplication from ~40 lines to ~8 lines per operation

---

#### Improvement 2: Standardize Event Listener Attachment

**Current:** Mix of cached references, direct `getElementById`, and dynamic attachment

**Recommended:** Use consistent pattern

```javascript
// Create a centralized attachment helper
function attachListener(selector, event, handler, options = {}) {
  const element = typeof selector === 'string' 
    ? document.querySelector(selector)
    : selector;
  
  if (element) {
    element.addEventListener(event, handler, options);
  } else if (options.required !== false) {
    console.warn(`Element not found: ${selector}`);
  }
}

// Usage:
attachListener('#metadataFilterInput', 'input', (e) => {
  renderMetadataTable(e.target.value);
});
attachListener('#commandInput', 'input', filterCommands);
```

**Benefit:** Consistent error handling and logging

---

#### Improvement 3: Consider Type Safety

**Current:** Plain JavaScript with no type annotations

**Recommended:** Add JSDoc type annotations

```javascript
/**
 * @typedef {Object} FilterOperation
 * @property {Function} operation - The operation to execute
 * @property {string} description - Description for debugging
 */

/**
 * Queue a filter operation to be executed after smart ordering completes
 * @param {Function} operation - The operation to queue
 * @param {string} description - Description for debugging
 * @returns {void}
 */
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Benefit:** Better IDE support and documentation

---

#### Improvement 4: Extract Magic Numbers

**Current:** Magic number `0` used throughout setTimeout calls

**Recommended:** Extract to named constant

```javascript
// Current
setTimeout(() => { isFilterOperation = false; }, 0);

// Recommended
const NEXT_TICK = 0;
setTimeout(() => { isFilterOperation = false; }, NEXT_TICK);
```

**Benefit:** Self-documenting code

---

### 5.3 Patterns to Avoid Adding

❌ **Don't add a hook system** - Current guard system is sufficient  
❌ **Don't add custom event emitters** - DOM events already handle use case  
❌ **Don't convert to async/await everywhere** - Would add complexity without benefit  
❌ **Don't remove window exports** - Critical for debugging  
❌ **Don't remove setTimeout guard clearing** - Would break race condition prevention

---

## 6. Conclusion

The Vista application uses a **guard-based coordination system** instead of traditional hook patterns, event emitters, or callback systems. This architecture is:

1. **Intentional** - Designed to prevent race conditions between filter operations and smart ordering
2. **Simpler** - More direct than a full hook system would be for this use case
3. **Effective** - Successfully prevents state conflicts
4. **Debuggable** - Global exports enable runtime inspection
5. **Shareable** - Hash-based state enables URL-based state sharing

The apparent "anti-patterns" (setTimeout-based clearing, global exports, dual code paths) are deliberate design decisions that solve specific problems more directly than traditional patterns would.

**Key Takeaway:** Vista's filter-change architecture is a **specialized coordination system** optimized for a specific problem (race condition prevention) rather than a generic hook/event system. This specialization makes it unusual but not problematic.

---

## Related Documentation

- `/home/coding/vista/docs/filter-change-patterns-final-compilation.md` - Complete pattern compilation
- `/home/coding/vista/docs/filter-change-hooks-comprehensive.md` - Handler reference (43 handlers)
- `/home/coding/vista/docs/research/filter-change-event-emitters-report.md` - Event emitter analysis
- `/home/coding/vista/notes/comprehensive-filter-change-bindings.md` - Bindings documentation
- `/home/coding/vista/notes/bf-3kpn8.md` - Event listener patterns detailed documentation

---

**Generated for bead vista-ac7fe4bf: Categorized analysis of filter-change patterns**  
**Date:** 2026-08-24  
**Status:** COMPLETE
