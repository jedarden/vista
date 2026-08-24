# Filter Change Event Emitters and Bus Patterns Report

**Project:** MTA My Way (vista)  
**File:** `/home/coding/vista/src/public/app.js`  
**Date:** 2026-08-24  
**Scope:** Custom event emitters and bus patterns for filter changes

## Executive Summary

The app.js file does **NOT** use traditional custom event emitters (CustomEvent, EventBus class, publish/subscribe patterns) for filter changes. Instead, it uses a **guard flag-based queuing system** and **hash-based state management** to coordinate filter operations.

## Key Findings

### 1. Guard Flag-Based Filter Operation System

**Location:** Lines 6761-6763, 8367-8457

The application uses a sophisticated guard flag system to prevent race conditions between filter operations and smart ordering.

#### State Variables
```javascript
// Line 6761-6763
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

#### Core Functions

**`isSmartOrdering()` - Lines 8415-8417**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```
- Checks both user preference (`platformPrefs.smartOrdering`) and runtime state (`isSmartOrderingActive`)
- Returns true only if smart ordering is BOTH enabled AND currently active

**`queueFilterOperation(operation, description)` - Lines 8424-8429**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```
- Queues filter operations to be executed after smart ordering completes
- Takes a function and description for debugging

**`processPendingFilterOperations()` - Lines 8434-8457**
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

#### Usage Pattern

The typical pattern used throughout the code:

```javascript
// Example from importPreferences - Lines 8562-8570
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

// Lines 8578-8581
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

### 2. Filter Operation Flag Usage Locations

All `isFilterOperation = true` assignments:

| Line | Context | Description |
|------|---------|-------------|
| 5474 | Window property exposure | Exposed via Object.defineProperty for testing |
| 6761 | Initial declaration | Guard flag initialization |
| 8562 | importPreferences | Preference import operation |
| 8578 | importPreferences | Direct operation (non-queued path) |
| 8626 | toggleWhatIfMode | What-if mode reset (queued) |
| 8638 | toggleWhatIfMode | What-if mode reset (direct) |
| 8745 | Metadata modification | Tag score update operation |

### 3. Queue Filter Operation Usage

All `queueFilterOperation` calls:

| Line | Operation | Description |
|------|-----------|-------------|
| 8570 | applyImportedPrefs | Import preferences during smart ordering |
| 8630 | applyWhatIfReset | Reset what-if mode during smart ordering |

### 4. Hash-Based State Management

**Function:** `updateHash(options = {})` - Lines 492-522

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

**Related function:** `restoreHashState()` - Lines 527-565
- Parses hash on page load and restores state

**Usage locations:**
| Line | Context |
|------|---------|
| 686 | Comment about automatic hash skipping |
| 689 | Direct call (mode change) |
| 5014 | Tab change |
| 5905 | Compare mode URL update |
| 8617 | Clear 'without' from hash (what-if reset) |
| 8696 | Generic update |
| 8720 | Clear disabled tags from hash |
| 8759 | Generic update |

### 5. Direct Filter Event Listeners

**Metadata Filter Input - Lines 4416-4422**
```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Command Palette Filter - Lines 9567, 9659-9674**
```javascript
input.addEventListener('input', filterCommands);

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

### 6. Theme Subscription API (External Event System)

**Function:** `subscribeFrameToTheme(platformId)` - Lines 169-196

```javascript
function subscribeFrameToTheme(platformId) {
  // Find the most recently inserted frame for this platform
  const platformFrames = document.querySelectorAll(`[data-platform="${platformId}"].context-frame`);
  if (platformFrames.length === 0) {
    console.warn(`[subscribeFrameToTheme] No frame found for platform: ${platformId}`);
    return;
  }

  const latestFrame = platformFrames[platformFrames.length - 1];
  const frameId = latestFrame.id;

  if (!frameId) {
    console.warn(`[subscribeFrameToTheme] Frame has no ID for platform: ${platformId}`);
    return;
  }

  // Check if ThemeSubscription API is available
  if (typeof window.ThemeSubscription === 'undefined') {
    console.warn('[subscribeFrameToTheme] ThemeSubscription API not available');
    return;
  }

  window.ThemeSubscription.subscribePlatformFrame(platformId, frameId);
}
```

**Usage locations:**
| Line | Context |
|------|---------|
| 2282 | Preview rendering |
| 2391 | Preview rendering |
| 2430 | Preview rendering |

## Summary Table: Event Emitter Patterns

| Pattern Type | Lines | Description |
|--------------|-------|-------------|
| **Guard Flags** | 6761-6763 | `isFilterOperation`, `isSmartOrderingActive`, `pendingFilterOperations` |
| **Queue System** | 8367-8457 | `queueFilterOperation`, `processPendingFilterOperations` |
| **Hash Management** | 492-565 | `updateHash`, `restoreHashState` |
| **Direct Listeners** | 4419, 9567 | Standard addEventListener for input events |
| **Theme Subscription** | 169-196 | External API for frame theme updates |

## Key Observations

1. **No Custom Event Emitter Classes**: The application does not implement custom event emitter classes, EventBus patterns, or publish/subscribe systems for filter changes.

2. **Flag-Based Coordination**: Instead of events, the application uses boolean flags (`isFilterOperation`, `isSmartOrderingActive`) to coordinate state.

3. **Queue-Based Deferral**: Filter operations that would conflict with smart ordering are queued and executed later via `queueFilterOperation`.

4. **Hash as State**: URL hash fragments are used to encode filter state (tab, mode, without tags).

5. **Direct DOM Listeners**: Standard `addEventListener` is used for immediate UI filtering (metadata table, command palette).

6. **External Subscription**: The `ThemeSubscription` API is an external system for frame theme updates, not a filter event system.

## Related Functions (Not Event Emitters)

These functions handle filter state but are not event emitters:

| Function | Lines | Purpose |
|----------|-------|---------|
| `toggleFavorite(pid)` | 8349-8365 | Toggle platform favorite status |
| `toggleHidden(pid)` | 8459-8470 | Toggle platform hidden status |
| `updateColumnLayoutUI()` | 8341-8347 | Update column layout button states |
| `updateFavoritesList()` | 8472-8488 | Update favorites UI list |
| `updateHiddenList()` | 8490-8506 | Update hidden platforms UI list |

## Conclusion

The application uses a **coordinated flag-based state management system** rather than traditional event emitters for filter operations. This approach prevents race conditions during smart ordering and provides clear debugging capabilities through the debug logging system.
