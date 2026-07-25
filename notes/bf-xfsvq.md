# Indirect Queue Addition Methods - Vista Codebase

## Overview
This document catalogs all indirect queue addition methods found in the Vista codebase, excluding direct `push()` operations which are documented separately.

## 1. Spread Operator Array Building

### Method: Spread operators merging arrays
Pattern: `targetArray = [...array1, ...array2]`

#### 1.1 Diagnostics Merging (Client-Side Findings)

**Location:** `src/public/app.js:808`
```javascript
completeData.diagnostics = [...(completeData.diagnostics || []), ...clientFindings];
```
- **Target Queue:** `completeData.diagnostics`
- **Data Source:** `clientFindings` from `verifyClientSideTags(completeData.html, completeData.meta)`
- **Context:** Client-side DOM verification for JS-injected tags in paste mode
- **Pattern:** Creates new array by spreading existing diagnostics and merging with client-side findings

**Location:** `src/public/app.js:1050`
```javascript
data.diagnostics = [...(data.diagnostics || []), ...clientFindings];
```
- **Target Queue:** `data.diagnostics`
- **Data Source:** `clientFindings` from `verifyClientSideTags(data.html, data.meta)`
- **Context:** Client-side DOM verification for JS-injected tags in URL mode
- **Pattern:** Creates new array by spreading existing diagnostics and merging with client-side findings

#### 1.2 Platform Reordering (Custom Card Order)

**Location:** `src/public/app.js:1550` (in `renderSkeletons`)
```javascript
platforms = [...customOrder, ...newPlatforms];
```
- **Target Queue:** `platforms` (local variable)
- **Data Source:** 
  - `customOrder`: Filtered from `platformPrefs.cardOrder[group.id]`
  - `newPlatforms`: Remaining platforms not in custom order
- **Context:** Skeleton rendering with custom card order applied
- **Pattern:** Creates new array by spreading custom order first, then remaining platforms

**Location:** `src/public/app.js:1793` (in `renderPreviews`)
```javascript
platforms = [...customOrder, ...newPlatforms];
```
- **Target Queue:** `platforms` (local variable)
- **Data Source:** 
  - `customOrder`: Filtered from `platformPrefs.cardOrder[group.id]`
  - `newPlatforms`: Remaining platforms not in custom order
- **Context:** Preview rendering with custom card order applied
- **Pattern:** Creates new array by spreading custom order first, then remaining platforms

---

## 2. Complex Array Building with Loop + Assignment

### Method: Empty array + loop push + assignment
Pattern: `const newArray = []; while(...) newArray.push(item); target = newArray;`

**Location:** `src/public/app.js:1654-1680` (in `renderPreviews`)
```javascript
const platformsWithProperPosition = [];
let cardOrderIdx = 0;
let groupIdx = 0;

while (cardOrderIdx < existingInCardOrder.length || groupIdx < group.platforms.length) {
  const cardOrderNext = existingInCardOrder[cardOrderIdx];
  const groupNext = group.platforms[groupIdx];

  if (cardOrderNext && cardOrderNext === groupNext) {
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
    groupIdx++;
  } else if (missingFromCardOrder.includes(groupNext)) {
    platformsWithProperPosition.push(groupNext);
    groupIdx++;
  } else if (cardOrderNext) {
    platformsWithProperPosition.push(cardOrderNext);
    cardOrderIdx++;
  } else {
    groupIdx++;
  }
}

platforms = platformsWithProperPosition;
```
- **Target Queue:** `platforms` (local variable)
- **Data Source:** Complex merge of `cardOrderForGroup` and `group.platforms` with position preservation
- **Context:** Advanced card order merging that preserves original group positions for missing platforms
- **Pattern:** 
  1. Creates empty array
  2. Iterates with two indices (cardOrderIdx, groupIdx)
  3. Uses `push()` to build array in loop
  4. Assigns completed array to target

---

## 3. Function Call Wrappers

### Method: Wrapper functions that queue operations
Pattern: `wrapperFunction(() => { operation })` → internally calls `queueFilterOperation()`

#### 3.1 Direct Filter Operation Queuing

**Location:** `src/public/app.js:7942`
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```
- **Target Queue:** `pendingFilterOperations`
- **Data Source:** Arbitrary filter operation functions passed as parameters
- **Context:** Generic queue wrapper for any filter operation
- **Pattern:** Indirectly adds operations to queue via function call wrapper

**Called from:**
- `src/public/app.js:8088` - Queues `applyImportedPrefs` operation
- `src/public/app.js:8148` - Queues `applyWhatIfReset` operation

#### 3.2 Guard Wrapper with Smart Ordering Check

**Location:** `src/public/filter-guard-wrapper.js:47`
```javascript
function guardWrapper(handlerName, handlerFunction) {
  if (typeof isSmartOrdering === 'function' && isSmartOrdering()) {
    if (typeof queueFilterOperation === 'function') {
      queueFilterOperation(handlerFunction, handlerName);
      if (typeof DEBUG_SMART_ORDERING !== 'undefined' && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active - operation queued`);
      }
    }
    return;
  }
  handlerFunction();
}
```
- **Target Queue:** `pendingFilterOperations` (via `queueFilterOperation`)
- **Data Source:** Filter operation functions passed as `handlerFunction` parameter
- **Context:** Filter change handlers that need to defer during smart ordering
- **Pattern:** 
  1. Checks if smart ordering is active
  2. If active: queues operation via `queueFilterOperation`
  3. If inactive: executes operation immediately

**Used throughout app.js for:**
- Filter change handlers
- Platform preference modifications
- Any operation that might conflict with smart ordering

#### 3.3 Guard Wrapper with Render

**Location:** `src/public/filter-guard-wrapper.js:88`
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
      if ('DEBUG_SMART_ORDERING' in globalThis && DEBUG_SMART_ORDERING) {
        console.log(`[${handlerName}] Smart ordering active flag CLEARED (user manual override)`);
      }
    }
  });
}
```
- **Target Queue:** `pendingFilterOperations` (via `guardWrapper` → `queueFilterOperation`)
- **Data Source:** Filter operation functions that trigger `renderPreviews`
- **Context:** Operations that render and need to prevent order resets
- **Pattern:** Wraps handler with filter operation guards before queuing

**Example usage:**
- `src/public/app.js:7978` - `toggleHidden` uses `guardWrapperWithRender`

---

## 4. Set Collection Operations (Not Arrays, Noteworthy)

### Method: Set.add() and Set.delete()
Pattern: `collection.add(item)` or `collection.delete(item)`

**Locations in `src/public/app.js`:**
- **Line 7870:** `platformPrefs.favorites.delete(pid)`
- **Line 7872:** `platformPrefs.favorites.add(pid)`
- **Line 7980:** `platformPrefs.hidden.delete(pid)`
- **Line 7982:** `platformPrefs.hidden.add(pid)`

**Target Collections:**
- `platformPrefs.favorites` (Set of favorite platform IDs)
- `platformPrefs.hidden` (Set of hidden platform IDs)

**Data Source:** Platform IDs (pid) from user interactions

**Context:** User preference management for favorites and hidden platforms

**Pattern:** Direct Set operations (not arrays, but relevant to filter state management)

---

## Summary Table

| Pattern | Line(s) | Target Queue | Data Source | Context |
|---------|---------|--------------|-------------|---------|
| Spread array merge | 808 | `completeData.diagnostics` | `clientFindings` | Client-side tag verification |
| Spread array merge | 1050 | `data.diagnostics` | `clientFindings` | Client-side tag verification |
| Spread array merge | 1550 | `platforms` (local) | `customOrder`, `newPlatforms` | Skeleton rendering with card order |
| Spread array merge | 1793 | `platforms` (local) | `customOrder`, `newPlatforms` | Preview rendering with card order |
| Loop + push + assign | 1654-1680 | `platforms` (local) | Complex merge logic | Advanced card order merging |
| Function wrapper | 7942 | `pendingFilterOperations` | Arbitrary operations | Generic filter operation queuing |
| Smart ordering guard | filter-guard-wrapper:47 | `pendingFilterOperations` | Filter handler functions | Defer operations during smart ordering |
| Guard with render | filter-guard-wrapper:88 | `pendingFilterOperations` | Render-triggering handlers | Prevent order resets during render |

---

## Key Distinctions from Direct push()

1. **Spread operators** create new arrays rather than mutating in-place
2. **Function wrappers** abstract the queuing logic behind conditional checks
3. **Complex array building** uses intermediate arrays and loop-based construction
4. **Assignment operations** replace entire arrays rather than appending

All of these patterns ultimately add data to filter queues or filter-related data structures, but they do so through indirection, abstraction, or non-push operations.
