# Filter Handler Order-Reset Analysis

## Overview

This document analyzes all filter event listeners in `/home/coding/vista/src/public/app.js` and their order-reset behavior. The analysis focuses on how the `isFilterOperation` guard flag is used to prevent unwanted smart order resets during filter changes.

---

## Order-Reset Guard Mechanism

### Primary Guard: `isFilterOperation`
- **Location:** Line 6279
- **Purpose:** Prevent smart order resets during filter operations
- **Pattern:**
  ```javascript
  isFilterOperation = true;
  renderPreviews(currentData);
  setTimeout(() => { isFilterOperation = false; }, 0);
  ```

### Guard Check Location
- **Lines 8817-8822:** In `applySmartOrdering()` function
  ```javascript
  if (isFilterOperation || isSmartOrdering()) {
    // Skip cardOrder clearing
    const reason = isFilterOperation ? 'filter operation in progress' : 'smart ordering is active';
    console.log(`[applySmartOrdering] Page type changed but ${reason} - preserving cardOrder to prevent reset`);
  }
  ```

---

## Filter Event Listeners

### 1. `toggleHidden(pid)` - Lines 7984-8013

**Function:** Toggles platform visibility (hide/show)

**Order-Reset Behavior:** ✅ YES - Sets guard flag

**Specific Code:**
```javascript
// Line 8002-8006
isFilterOperation = true;
renderPreviews(currentData); // Re-render to apply hiding
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Filter Changes:** Adding/removing platform from `platformPrefs.hidden` Set

**Conditional Branches:**
- Lines 7986-7992: Defers operation if smart ordering is active
  ```javascript
  if (isSmartOrdering()) {
    queueFilterOperation(() => toggleHidden(pid), 'toggleHidden');
    return;
  }
  ```

**Side Effects:**
- Line 8009: Clears `isSmartOrderingActive` flag (user manual override)
- Line 7999: Saves platform preferences
- Line 8000: Updates hidden list UI

---

### 2. `toggleFavorite(pid)` - Lines 7867-7890

**Function:** Toggles platform favorite status

**Order-Reset Behavior:** ❌ NO - Does NOT set guard flag

**Reason:** Does NOT trigger `renderPreviews()` - only updates the favorites Set and UI

**Specific Code:**
```javascript
// Lines 7877-7883
if (platformPrefs.favorites.has(pid)) {
  platformPrefs.favorites.delete(pid);
} else {
  platformPrefs.favorites.add(pid);
}
savePlatformPrefs();
updateFavoritesList();
```

**Filter Changes:** Adding/removing platform from `platformPrefs.favorites` Set

**Conditional Branches:**
- Lines 7869-7875: Defers operation if smart ordering is active
  ```javascript
  if (isSmartOrdering()) {
    queueFilterOperation(() => toggleFavorite(pid), 'toggleFavorite');
    return;
  }
  ```

**Side Effects:**
- Line 7886: Clears `isSmartOrderingActive` flag (user manual override)

---

### 3. `importPreferences(e)` - Lines 8082-8140

**Function:** Imports user preferences from JSON file

**Order-Reset Behavior:** ✅ YES - Sets guard flag

**Specific Code:**
```javascript
// Lines 8121-8124
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Filter Changes:** Imports favorites, hidden platforms, column count, and smart ordering preference

**Conditional Branches:**
- Lines 8102-1118: Smart ordering active path (queued operation)
  ```javascript
  if (isSmartOrdering()) {
    const applyImportedPrefs = () => {
      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
      // ...
    };
    queueFilterOperation(applyImportedPrefs, 'importPreferences');
    return;
  }
  ```

**Side Effects:**
- Line 8127: Clears `isSmartOrderingActive` flag (user manual override)
- Lines 8090-8093: Updates platform preferences (favorites, hidden, columnCount, smartOrdering)

---

### 4. `toggleWhatIfMode()` - Lines 8146-8187

**Function:** Toggles "What If" mode for simulating missing metadata tags

**Order-Reset Behavior:** ✅ YES - Sets guard flag (when disabling mode)

**Specific Code:**
```javascript
// Lines 8181-8184
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Filter Changes:** Clears `disabledTags` Set and updates hash

**Conditional Branches:**
- Lines 8167-8178: Smart ordering active path (queued operation)
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

**Side Effects:**
- Lines 8159-8164: Clears disabled tags and removes What If panel UI
- Line 8160: Updates URL hash to clear What If state

---

### 5. `applyWhatIfChanges()` - Lines 8254-8305

**Function:** Applies What If mode changes (disables selected metadata tags)

**Order-Reset Behavior:** ✅ YES - Sets guard flag

**Specific Code:**
```javascript
// Lines 8288-8290
isFilterOperation = true;
renderPreviews(modifiedData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Filter Changes:** Disables specific metadata tags in `disabledTags` Set

**Conditional Branches:** None - Always applies guard flag

**Side Effects:**
- Lines 8265-8283: Modifies `currentData.meta` to simulate missing tags
- Lines 8302-8303: Updates URL hash with disabled tags
- Line 8299: Closes What If panel

---

## Non-Filter Event Listeners (Do NOT Reset Order)

### 1. `setColumnLayout(count)` - Lines 7848-7857

**Function:** Changes grid column layout (1, 2, 3, or 4 columns)

**Order-Reset Behavior:** ❌ NO - Does NOT set guard flag

**Reason:** Only updates CSS grid layout, does NOT trigger `renderPreviews()`

**Specific Code:**
```javascript
previewGrid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
```

---

## Filter Operation Queuing Mechanism

### Supporting Functions

**`isSmartOrdering()` - Lines 7940-7942**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```
- Centralized guard checking both user preference AND runtime state

**`queueFilterOperation(operation, description)` - Lines 7949-7954**
```javascript
function queueFilterOperation(operation, description) {
  pendingFilterOperations.push({ operation, description });
}
```
- Queues operations to execute after smart ordering completes

**`processPendingFilterOperations()` - Lines 7959-7982**
- Executes queued operations after smart ordering finishes
- Called from within the smart ordering workflow

---

## Summary Table

| Handler | Lines | Resets Order? | Guard Flag Set? | Triggers renderPreviews? | Conditional Smart Ordering Check? |
|---------|-------|---------------|-----------------|-------------------------|-----------------------------------|
| `toggleHidden()` | 7984-8013 | ✅ YES | ✅ YES | ✅ YES | ✅ YES (queues if active) |
| `toggleFavorite()` | 7867-7890 | ❌ NO | ❌ NO | ❌ NO | ✅ YES (queues if active) |
| `importPreferences()` | 8082-8140 | ✅ YES | ✅ YES | ✅ YES | ✅ YES (queues if active) |
| `toggleWhatIfMode()` | 8146-8187 | ✅ YES | ✅ YES | ✅ YES | ✅ YES (queues if active) |
| `applyWhatIfChanges()` | 8254-8305 | ✅ YES | ✅ YES | ✅ YES | ❌ NO |
| `setColumnLayout()` | 7848-7857 | ❌ NO | ❌ NO | ❌ NO | ❌ NO |

---

## Key Patterns

### 1. Standard Guard Pattern (4 handlers use this)
```javascript
isFilterOperation = true;
renderPreviews(currentData); // or modifiedData
setTimeout(() => { isFilterOperation = false; }, 0);
```

### 2. Smart Ordering Deferral Pattern (4 handlers use this)
```javascript
if (isSmartOrdering()) {
  queueFilterOperation(() => handlerFunction(...), 'handlerName');
  return;
}
```

### 3. User Manual Override Pattern (3 handlers use this)
```javascript
isSmartOrderingActive = false;
if (DEBUG_SMART_ORDERING) {
  console.log('[handler] Smart ordering active flag CLEARED (user manual override)');
}
```

---

## Order Reset Prevention Logic

**Location:** Lines 8817-8843 in `applySmartOrdering()`

When page type changes (e.g., from 'inspect' to 'compare'), the system would normally clear `cardOrder` for non-user-modified groups. The guard prevents this during filter operations:

```javascript
if (isFilterOperation || isSmartOrdering()) {
  // Skip cardOrder clearing - preserve order
} else {
  // Clear cardOrder for groups not manually modified by user
  PLATFORM_GROUPS.forEach((group) => {
    const metadata = platformPrefs.cardOrderMetadata?.[group.id];
    if (!metadata || !metadata.userModified || metadata.modifiedBy !== 'user-drag') {
      delete platformPrefs.cardOrder[group.id];
      // ...
    }
  });
}
```

---

## Test Results Verification

All filter handlers have been identified and their order-reset behavior documented. The guard mechanism (`isFilterOperation`) is consistently applied across all handlers that trigger `renderPreviews()`, ensuring smart order is preserved during filter operations.

**Completion Status:** ✅ Complete - All acceptance criteria met:
- ✅ Each handler's order-reset behavior documented
- ✅ Specific order-reset code patterns identified
- ✅ Filter change triggers that cause order reset noted
- ✅ Conditional branches documented
