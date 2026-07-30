# Filter Change Handler Patterns in Vista

## Systematic Search Results

This document catalogs all filter change handler patterns discovered through systematic grep and manual inspection of the Vista codebase.

---

## Core Filter Handler Functions

### 1. `toggleFavorite(pid)` 
**Location:** `/home/coding/vista/src/public/app.js:7867`

**Pattern:** Uses `guardWrapper` to prevent conflicts during smart ordering

```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();

    // Clear smart ordering active flag since user manually modified favorites
    isSmartOrderingActive = false;
  });
}
```

**Characteristics:**
- Wraps entire operation with `guardWrapper('toggleFavorite', ...)`
- Modifies `platformPrefs.favorites` Set
- Calls `savePlatformPrefs()` to persist changes
- Calls `updateFavoritesList()` to update UI
- Clears `isSmartOrderingActive` flag

---

### 2. `toggleHidden(pid)`
**Location:** `/home/coding/vista/src/public/app.js:7977`

**Pattern:** Uses `guardWrapperWithRender` to include `renderPreviews()` call

```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData); // Re-render to apply hiding
  });
}
```

**Characteristics:**
- Uses `guardWrapperWithRender('toggleHidden', ...)` (variant that handles render guards)
- Modifies `platformPrefs.hidden` Set
- Calls `savePlatformPrefs()` to persist changes
- Calls `updateHiddenList()` to update UI
- Calls `renderPreviews(currentData)` to refresh platform cards

---

### 3. `filterCommands(e)`
**Location:** `/home/coding/vista/src/public/app.js:9177`

**Pattern:** Simple filter for command palette - NOT guarded (no smart ordering conflicts)

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

**Characteristics:**
- Event handler attached via `input.addEventListener('input', filterCommands)` (line 9085)
- Filters command palette items based on search query
- Does NOT use guard logic (command palette is separate from platform cards)

---

## Guard Infrastructure Functions

### 4. `guardWrapper(handlerName, handlerFunction)`
**Location:** `/home/coding/vista/src/public/filter-guard-wrapper.js:47`

**Pattern:** Reusable wrapper that checks `isSmartOrdering()` before executing

```javascript
function guardWrapper(handlerName, handlerFunction) {
  // Check if smart ordering is active
  if (typeof isSmartOrdering === 'function' && isSmartOrdering()) {
    // Queue the operation for later execution
    if (typeof queueFilterOperation === 'function') {
      queueFilterOperation(handlerFunction, handlerName);
    }
    return;
  }

  // Execute the handler logic immediately
  handlerFunction();
}
```

**Characteristics:**
- Checks `isSmartOrdering()` to determine if smart ordering is active
- If active: calls `queueFilterOperation(handlerFunction, handlerName)` and returns early
- If not active: executes `handlerFunction()` immediately
- Used by: `toggleFavorite`, other handlers that don't trigger renders

---

### 5. `guardWrapperWithRender(handlerName, handlerFunction)`
**Location:** `/home/coding/vista/src/public/filter-guard-wrapper.js:88`

**Pattern:** Variant that sets `isFilterOperation` guard flag during render

```javascript
function guardWrapperWithRender(handlerName, handlerFunction) {
  return guardWrapper(handlerName, () => {
    handlerFunction();

    // Set filter guard and clear it after render
    if ('isFilterOperation' in globalThis || typeof isFilterOperation !== 'undefined') {
      isFilterOperation = true;
      setTimeout(() => { isFilterOperation = false; }, 0);
    }

    // Clear smart ordering active flag
    if ('isSmartOrderingActive' in globalThis || typeof isSmartOrderingActive !== 'undefined') {
      isSmartOrderingActive = false;
    }
  });
}
```

**Characteristics:**
- Wraps the base `guardWrapper` function
- Sets `isFilterOperation = true` before render, clears after
- Clears `isSmartOrderingActive = false` 
- Used by: `toggleHidden` (handlers that trigger `renderPreviews()`)

---

### 6. `queueFilterOperation(operation, description)`
**Location:** `/home/coding/vista/src/public/app.js:7942`

**Pattern:** Queues filter operations for deferred execution during smart ordering

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Characteristics:**
- Pushes operation to `pendingFilterOperations` array
- Used by `guardWrapper` when smart ordering is active
- Processed later by `processPendingFilterOperations()`

---

### 7. `processPendingFilterOperations()`
**Location:** `/home/coding/vista/src/public/app.js:7952`

**Pattern:** Executes queued filter operations after smart ordering completes

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  pendingFilterOperations.forEach(({ operation, description }) => {
    try {
      operation();
    } catch (error) {
      console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
    }
  });
}
```

**Characteristics:**
- Called after `applySmartOrdering()` completes
- Executes each queued operation with error handling
- Clears the `pendingFilterOperations` queue

---

## Guard State Flags

### 8. Guard Flags Declaration
**Location:** `/home/coding/vista/src/public/app.js:6279`

**Pattern:** Global state variables for preventing race conditions

```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Characteristics:**
- `isFilterOperation`: Set during filter operations to prevent smart order resets
- `isSmartOrderingActive`: Runtime flag tracking smart ordering progress
- `pendingFilterOperations`: Queue for filter operations during smart ordering

---

### 9. `isSmartOrdering()` 
**Location:** `/home/coding/vista/src/public/app.js:7933`

**Pattern:** Centralized guard function to check if smart ordering is active

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Characteristics:**
- Checks BOTH user preference (`platformPrefs.smartOrdering`) AND runtime state (`isSmartOrderingActive`)
- Primary guard to use before operations that might conflict with smart ordering
- Returns `true` only if BOTH conditions are true

---

## Other Operations Using Guard Logic

### 10. `applyImportedPrefs` (inline handler)
**Location:** `/home/coding/vista/src/public/app.js:8079`

**Pattern:** Uses inline guard logic with `queueFilterOperation`

```javascript
const applyImportedPrefs = () => {
  if (isSmartOrdering()) {
    queueFilterOperation(applyImportedPrefs, 'importPreferences');
    return;
  }
  // ... import logic
};
```

---

### 11. `applyWhatIfReset` (inline handler)
**Location:** `/home/coding/vista/src/public/app.js:8143`

**Pattern:** Uses inline guard logic with `queueFilterOperation`

```javascript
const applyWhatIfReset = () => {
  if (isSmartOrdering()) {
    queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
    return;
  }
  // ... what-if reset logic
};
```

---

## Helper Functions for Filter Handlers

### 12. `savePlatformPrefs()`
**Location:** `/home/coding/vista/src/public/app.js:7763`

**Pattern:** Persists platform preferences to localStorage with retry logic

**Characteristics:**
- Called by ALL filter handlers after modifying state
- Implements retry logic for concurrent write detection
- Saves `platformPrefs` including favorites, hidden sets, cardOrder

---

### 13. `updateFavoritesList()`
**Location:** `/home/coding/vista/src/public/app.js:7990`

**Pattern:** Updates the favorites UI list

**Characteristics:**
- Renders favorites list HTML based on `platformPrefs.favorites` Set
- Attaches event listeners: `btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid))`
- Shows empty state when no favorites

---

### 14. `updateHiddenList()`
**Location:** `/home/coding/vista/src/public/app.js:8012`

**Pattern:** Updates the hidden platforms UI list

**Characteristics:**
- Renders hidden platforms list HTML based on `platformPrefs.hidden` Set
- Shows empty state when no hidden platforms

---

## Event Listener Attachments

### 15. Favorites Remove Buttons
**Location:** `/home/coding/vista/src/public/app.js:8007`

**Pattern:** Event delegation for remove buttons

```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid));
});
```

**Characteristics:**
- Attached dynamically in `updateFavoritesList()`
- Calls `toggleFavorite(pid)` with platform ID from `data-pid` attribute

---

### 16. Command Palette Filter Input
**Location:** `/home/coding/vista/src/public/app.js:9085`

**Pattern:** Direct event listener for command filtering

```javascript
input.addEventListener('input', filterCommands);
```

**Characteristics:**
- Static listener on command palette input field
- Calls `filterCommands(e)` on each input event

---

## Summary of Filter Change Handler Patterns

| Pattern | Location | Uses Guard? | Triggers Render? | Queues During Smart Ordering |
|---------|----------|-------------|-------------------|------------------------------|
| `toggleFavorite` | app.js:7867 | Yes (`guardWrapper`) | No | Yes |
| `toggleHidden` | app.js:7977 | Yes (`guardWrapperWithRender`) | Yes (`renderPreviews`) | Yes |
| `filterCommands` | app.js:9177 | No | Yes (`renderCommands`) | No (separate system) |
| `applyImportedPrefs` | app.js:8079 | Yes (inline) | Yes | Yes |
| `applyWhatIfReset` | app.js:8143 | Yes (inline) | Yes | Yes |

## Key Design Patterns

1. **Guard Wrapper Pattern**: All filter handlers use either `guardWrapper` or `guardWrapperWithRender` to check `isSmartOrdering()` before executing

2. **Queue-and-Defer Pattern**: If smart ordering is active, handlers call `queueFilterOperation()` to defer execution until smart ordering completes

3. **Filter Operation Guard**: `guardWrapperWithRender` sets `isFilterOperation = true` to prevent `cardOrder` resets during filter-triggered renders

4. **Manual Override Flag**: Filter handlers clear `isSmartOrderingActive = false` to signal manual user modification

5. **State Persistence**: All handlers call `savePlatformPrefs()` to persist changes to localStorage

6. **UI Update Pattern**: Each handler updates its corresponding UI list (`updateFavoritesList`, `updateHiddenList`)

---

## Search Methodology

This documentation was created through:

1. **Grep searches** for patterns: `filter.*change`, `onFilterChange`, `filter.*handler`
2. **Manual inspection** of function definitions and event listener assignments
3. **Cross-referencing** between guard infrastructure and actual filter handler implementations
4. **Line number documentation** for all discovered patterns

All patterns discovered are catalogued above with their exact locations in the codebase.
