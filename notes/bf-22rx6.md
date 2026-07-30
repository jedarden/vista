# Filter-Change Hook Patterns - Line Numbers and Code Snippets

**Task:** Document line numbers and code snippets for filter-change hooks

**Bead ID:** bf-22rx6  
**Dependency:** bf-5d2ms (completed)  
**Date:** 2026-07-24  
**File:** `/home/coding/vista/src/public/app.js`

---

## Executive Summary

**ZERO filter-change addHook patterns found in Vista app.js.**

Based on comprehensive search results from child bead bf-5d2ms, **no addHook patterns of any kind exist in Vista app.js**. This document provides the exact line numbers and complete code snippets for Vista's actual filter-change implementation patterns using direct event listeners, guard flags, and queue patterns.

---

## Pattern 1: Direct Event Listeners (`addEventListener`)

### 1.1 Metadata Table Filter (Lines 3988-3994)

**Context (3 lines before):**
```javascript
  }
  html += '</div>';
  rawTagsPanel.innerHTML = html;

  // Attach filter listener
```

**Main Code:**
```javascript
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
```

**Context (2 lines after):**
```javascript
}

function renderMetadataRow(row, idx) {
  const hasValue = row || row.value === 0;
```

---

### 1.2 Command Palette Filter (Line 9085)

**Context (3 lines before):**
```javascript
  commandPaletteSelectedIndex = 0;

  // Add event listeners
  const input = document.getElementById('commandInput');
```

**Main Code:**
```javascript
  input.addEventListener('input', filterCommands);
```

**Context (3 lines after):**
```javascript
  input.addEventListener('keydown', handleCommandKeydown);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCommandPalette();
  });
```

---

## Pattern 2: Guard Flag Declaration (Lines 6276-6281)

**Context (3 lines before):**
```javascript
let cardOrder = null; // Will be initialized when initial render completes
let currentPageIndex = 0; // Current page index
let lastRenderedPageIndex = 0; // To detect when user navigated away
```

**Main Code:**
```javascript
let isRendering = false; // Guard flag to prevent concurrent renders
let pendingRenderAfterCurrent = null; // Queue renders during active render
let currentPageType = null; // Track current page type for stale cardOrder detection
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
let isSmartOrderingActive = false; // Track when smart ordering is currently active
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

**Context (3 lines after):**
```javascript
// Command palette state
let commandPaletteOpen = false;
let commandPaletteSelectedIndex = 0;
let commandPaletteFilteredCommands = [];
```

---

## Pattern 3: Guard Flag Usage Patterns

### 3.1 Import Preferences with Smart Ordering (Lines 8080-8082)

**Context (3 lines before):**
```javascript
        if (isSmartOrdering()) {
          // Create a wrapper function that doesn't depend on the event
          const applyImportedPrefs = () => {
```

**Main Code:**
```javascript
            isFilterOperation = true;
            renderPreviews(currentData);
            setTimeout(() => { isFilterOperation = false; }, 0);
```

**Context (3 lines after):**
```javascript
            isSmartOrderingActive = false;
            if (DEBUG_SMART_ORDERING) {
              console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
            }
```

---

### 3.2 Manual Import After Smart Ordering (Lines 8096-8099)

**Context (3 lines before):**
```javascript
        }

        // Set guard flag to prevent smart order resets during filter operation
```

**Main Code:**
```javascript
        isFilterOperation = true;
        renderPreviews(currentData);
        // Clear flag after render (renderPreviews will handle timing)
        setTimeout(() => { isFilterOperation = false; }, 0);
```

**Context (3 lines after):**
```javascript

        // Clear smart ordering active flag since user manually imported preferences
        isSmartOrderingActive = false;
        if (DEBUG_SMART_ORDERING) {
```

---

### 3.3 What If Mode Toggle with Smart Ordering (Lines 8144-8146)

**Context (3 lines before):**
```javascript
      // Check if smart ordering is active - defer operation if so
      if (isSmartOrdering()) {
        const applyWhatIfReset = () => {
```

**Main Code:**
```javascript
          isFilterOperation = true;
          renderPreviews(currentData);
          setTimeout(() => { isFilterOperation = false; }, 0);
```

**Context (3 lines after):**
```javascript
        };
        queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
        if (DEBUG_SMART_ORDERING) {
          console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
```

---

### 3.4 What If Mode Toggle Direct (Lines 8156-8158)

**Context (3 lines before):**
```javascript
      }

      // Set guard flag to prevent smart order resets during filter operation
```

**Main Code:**
```javascript
      isFilterOperation = true;
      renderPreviews(currentData);
      // Clear flag after render (renderPreviews will handle timing)
      setTimeout(() => { isFilterOperation = false; }, 0);
```

**Context (3 lines after):**
```javascript
    }
  }
}
```

---

### 3.5 What If Mode with Modified Data (Lines 8263-8265)

**Context (3 lines before):**
```javascript
  }

  // Re-render with modified data (use guard flag to preserve smart ordering)
  const modifiedData = { ...currentData, meta: modifiedMeta };
```

**Main Code:**
```javascript
  isFilterOperation = true;
  renderPreviews(modifiedData);
  setTimeout(() => { isFilterOperation = false; }, 0);
```

**Context (3 lines after):**
```javascript

  // Announce score change for screen readers
  const tagCount = disabledTags.size;
  announce(`What If mode applied. ${tagCount} tag${tagCount > 1 ? 's' : ''} disabled. Preview cards updated to show fallback behavior.`);
```

---

## Pattern 4: Queue Pattern Implementation

### 4.1 Queue Filter Operation Function (Lines 7942-7947)

**Context (3 lines before):**
```javascript
/**
 * Queue a filter operation to be executed after smart ordering completes
 * @param {Function} operation - The filter operation function to execute later
 * @param {string} description - Description of the operation for debugging
 */
```

**Main Code:**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Context (3 lines after):**
```javascript

/**
 * Process pending filter operations after smart ordering completes
 */
```

---

### 4.2 Process Pending Filter Operations Function (Lines 7952-7975)

**Context (3 lines before):**
```javascript
/**
 * Process pending filter operations after smart ordering completes
 */
```

**Main Code:**
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

**Context (3 lines after):**
```javascript

function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
```

---

## Pattern 5: Change Listeners for State Tracking

### 5.1 What If Toggle Change Listeners (Lines 8207-8216)

**Context (3 lines before):**
```javascript
  // Add change listeners to update hash when checkboxes change
  const panel = document.getElementById('whatIfPanel');
  if (panel) {
    panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
```

**Main Code:**
```javascript
      cb.addEventListener('change', () => {
        const tag = cb.dataset.tag;
        if (cb.checked) {
          disabledTags.delete(tag);
        } else {
          disabledTags.add(tag);
        }
        updateWhatIfHash();
      });
```

**Context (3 lines after):**
```javascript
    });
  }

  // Set up filter listener
  const filterInput = document.getElementById('whatIfFilterInput');
  if (filterInput) {
```

---

## Architectural Analysis

### Vista vs Traditional Hook Systems

| Traditional Hook System | Vista's Approach |
|------------------------|------------------|
| `addHook('filter-change', callback)` | `element.addEventListener('input', callback)` |
| Hook registration with string event names | Direct function assignment with event objects |
| Central hook dispatcher with priority chains | Event bubbling and direct callback execution |
| Hook execution order managed by dispatcher | Guard flags prevent race conditions |
| Static hook registration | Dynamic queue pattern for deferred execution |

### Key Design Patterns

1. **Guard Flag Pattern**: `isFilterOperation` prevents smart order resets during filter operations
2. **Queue Pattern**: `pendingFilterOperations` defers filter operations during smart ordering
3. **Timeout Pattern**: `setTimeout(() => { isFilterOperation = false; }, 0)` ensures flag clearing after render
4. **Event Delegation**: Direct `addEventListener` calls on specific elements
5. **State Management**: Manual state tracking with variables like `disabledTags`

---

## Summary Statistics

| Pattern Type | Count | Line Numbers |
|--------------|-------|--------------|
| **addEventListener (filter-change)** | 2 | 3988-3994, 9085 |
| **Guard flag declaration** | 6 | 6276-6281 |
| **Guard flag usage** | 5 | 8080-8082, 8096-8099, 8144-8146, 8156-8158, 8263-8265 |
| **Queue functions** | 2 | 7942-7947, 7952-7975 |
| **Change listeners** | 1 | 8207-8216 |
| **TOTAL** | **16** | **Multiple locations** |

---

## Filter-Change addHook Pattern Count

**ZERO (0)** - No filter-change addHook patterns exist in Vista app.js

---

## Related Documentation

- **bf-5d2ms**: "identify filter-change event patterns from addHook calls" - Confirmed zero addHook patterns
- **bf-1p376**: "comprehensive addHook search results in Vista app.js" - Comprehensive search methodology
- **bf-52b8f**: "document comprehensive filter-change hook patterns" - Vista's actual patterns
- **src/public/app.js**: Source file (9,998 lines, 368KB)

---

## Verification

All line numbers and code snippets have been verified against the actual source file `/home/coding/vista/src/public/app.js`. Each snippet includes 2-3 lines of context before and after for accurate documentation.

**File verified**: 2026-07-24  
**Line count**: 9,998 lines  
**File size**: 368KB

---

## Conclusion

Vista does not use `addHook()` function calls for filter-change events. Instead, it employs a sophisticated event handling architecture based on standard DOM event listeners, guard flags to prevent race conditions, and queue patterns for deferred execution during smart ordering operations.

This document provides the exact line numbers and complete code snippets for all filter-change implementation patterns in Vista app.js, with surrounding context for accurate reference.
