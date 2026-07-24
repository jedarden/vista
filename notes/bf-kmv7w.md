# Queue Processing Loops and Patterns in app.js

## Overview
This document catalogs all queue processing loops and patterns found in `/home/coding/vista/src/public/app.js`, including line numbers, code snippets, and processing characteristics.

---

## 1. Filter Operation Queue Processing

### Pattern: Array Queue with forEach Iterator

**Location:** Lines 7950-7974

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

**Queue Variable:** `pendingFilterOperations` (line 6281)
- Type: Array of objects `{ operation: Function, description: string }`
- Declaration: `let pendingFilterOperations = [];`

**Enqueue Pattern:** Lines 7942-7949
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Processing Characteristics:**
- **Pattern:** Snapshot iteration - copies queue before processing
- **Extraction:** Array.slice() creates shallow copy
- **Clear:** Original queue cleared after snapshot (`pendingFilterOperations = []`)
- **Iteration:** forEach with destructuring
- **Error Handling:** Try-catch per operation (continues on error)
- **Batch Size:** Processes entire queue at once

---

## 2. Platform Ordering Merge Algorithm (While Loop)

### Pattern: Dual-Index Merge Queue Processing

**Location:** Lines 1658-1690

```javascript
const platformsWithProperPosition = [];
let cardOrderIdx = 0;
let groupIdx = 0;

while (cardOrderIdx < existingInCardOrder.length || groupIdx < group.platforms.length) {
  const cardOrderNext = existingInCardOrder[cardOrderIdx];
  const groupNext = group.platforms[groupIdx];

  if (cardOrderNext && cardOrderNext === groupNext) {
    // Platform exists in both - use cardOrder position
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
    groupIdx++;
  } else if (missingFromCardOrder.includes(groupNext)) {
    // Platform is in group but missing from cardOrder - insert here
    platformsWithProperPosition.push(groupNext);
    groupIdx++;
  } else if (cardOrderNext) {
    // Platform is in cardOrder but we've passed it in group - add from cardOrder
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
  } else {
    groupIdx++;
  }
}

platforms = platformsWithProperPosition;
```

**Processing Characteristics:**
- **Pattern:** Dual-index merge algorithm
- **Queue Sources:** Two arrays - `existingInCardOrder` and `group.platforms`
- **Extraction:** Direct indexing with manual increment
- **Termination:** Both indices exhausted
- **Output:** New merged array
- **Batch Size:** Processes entire merge at once

---

## 3. PLATFORM_GROUPS forEach Iterations (Multiple Patterns)

### Pattern 1: Group Platform Rendering

**Location:** Line 1524
```javascript
PLATFORM_GROUPS.forEach((group) => {
  const groupEl = document.createElement('div');
  // ... create group UI ...
});
```

### Pattern 2: Group Platform Processing with forEach Nesting

**Location:** Lines 1935-1936
```javascript
PLATFORM_GROUPS.forEach((group) => {
  group.platforms.forEach((pid) => {
    const existingCard = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!existingCard) return;
    // ... process each platform card ...
  });
});
```

**Processing Characteristics:**
- **Pattern:** Nested forEach loops (group → platforms)
- **Iteration:** forEach with callback
- **Extraction:** Direct access via current item
- **Batch Size:** Processes entire structure

---

## 4. for...of Loop Patterns

### Pattern 1: Analysis Issues Processing

**Location:** Line 4136
```javascript
for (const issue of analysis.issues) {
  html += renderHeaderIssue(issue);
}
```

### Pattern 2: Analysis Recommendations Processing

**Location:** Line 4146
```javascript
for (const rec of analysis.recommendations) {
  html += renderHeaderRecommendation(rec);
}
```

### Pattern 3: Field Processing

**Location:** Line 4345
```javascript
for (const field of fields) {
  const value = meta[field.key];
  if (!value) continue;
  // ... process field ...
}
```

### Pattern 4: Object.entries Processing

**Location:** Line 4541
```javascript
for (const [change, platforms] of Object.entries(gradeChanges)) {
  if (platforms.length <= 3) {
    changeParts.push(`${change} on ${platforms.join(', ')}`);
  } else {
    changeParts.push(`${change} on ${platforms.length} platforms`);
  }
}
```

### Pattern 5: Metadata Flattening

**Location:** Line 5841
```javascript
for (const [key, value] of Object.entries(meta)) {
  const fullKey = prefix ? `${prefix}.${key}` : key;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    Object.assign(result, flattenMeta(value, fullKey));
  } else if (value !== null && value !== undefined && value !== '') {
    result[fullKey] = value;
  }
}
```

**Processing Characteristics:**
- **Pattern:** for...of iteration
- **Extraction:** Direct value access
- **Termination:** Automatic (end of iterable)
- **Batch Size:** Processes entire iterable

---

## 5. Slice-Based Batch Processing

### Pattern 1: Limit Items for Display

**Location:** Line 989
```javascript
const tagList = clientOnlyTags.slice(0, 5).map(t => t.key).join(', ');
```

### Pattern 2: Issue Display Limit

**Location:** Line 1913
```javascript
scoreData.issues.slice(0, 3).forEach(issue => {
  const div = document.createElement('div');
  div.className = 'card-issue';
  // ... create issue display ...
});
```

**Processing Characteristics:**
- **Pattern:** Array.slice() for batch size limiting
- **Batch Size:** Fixed limit (5 for tags, 3 for issues)
- **Processing:** Often chained with forEach or map
- **Extraction:** First N items from array

---

## 6. Stack Operations (Undo/Redo)

### Pattern: Stack with Size Limit

**Location:** Lines 9285-9287
```javascript
editorUndoStack.push({ ...editorState.edited });
// Limit stack size
if (editorUndoStack.length > 50) editorUndoStack.shift();
```

### Pattern: Stack Pop for Undo

**Location:** Lines 9383-9385
```javascript
if (editorUndoStack.length > 0) {
  const previousState = editorUndoStack.pop();
  editorState.edited = previousState;
  // ... apply undo ...
}
```

**Processing Characteristics:**
- **Pattern:** Stack (LIFO) with size limit
- **Enqueue:** push()
- **Dequeue:** pop() for undo, shift() for size maintenance
- **Size Limit:** 50 items max

---

## Summary of Queue Processing Patterns

| Pattern | Queue Type | Extraction | Clear | Batch Size | Lines |
|---------|-----------|-----------|-------|-----------|-------|
| Snapshot forEach | Array | slice() + forEach | Yes | All | 7950-7974 |
| Dual-index merge | Two arrays | Indexing | N/A | All | 1658-1690 |
| Nested forEach | Array tree | forEach | No | All | 1935-1936 |
| for...of | Iterable | Direct access | No | All | 4136, 4146, 4345 |
| Slice batch | Array | slice() | No | Fixed N | 989, 1913 |
| Stack LIFO | Array | pop()/shift() | No | 1 | 9285-9385 |

---

## Queue Variable Declarations

| Variable | Line | Type | Purpose |
|----------|------|------|---------|
| `pendingFilterOperations` | 6281 | Array | Queued filter ops during smart ordering |
| `pendingRenderData` | 6275 | Object | Queued render data during smart ordering |
| `pendingRenderAfterCurrent` | 6277 | Object | Queued render during active render |
| `editorUndoStack` | ~9285 | Array | Undo state history |

---

## Related Guard Flags

| Flag | Line | Purpose |
|------|------|---------|
| `isRendering` | 6276 | Prevent concurrent renders |
| `isApplyingSmartOrder` | - | Queue renders during smart ordering |
| `isFilterOperation` | 6279 | Prevent smart order resets during filters |

---

## Usage Notes

- **Race Condition Prevention:** Multiple guard flags prevent concurrent queue processing
- **Error Recovery:** Filter operations have per-item try-catch
- **Memory Management:** Undo stack has 50-item limit
- **Display Optimization:** Slice-based batching limits UI items to first N
- **Merge Safety:** Dual-index algorithm handles missing elements safely

---

*Documented as part of bead bf-kmv7w - Queue processing loops and patterns analysis*
