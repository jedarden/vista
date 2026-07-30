# Filter-Related Hooks Only (bf-1ndzl)

## Overview
This document contains **only filter-related hooks** extracted from the comprehensive hook categorization (bf-20jtd). All non-filter hooks have been excluded to provide a focused view of filter functionality patterns.

---

## Filter-Related Hook Patterns

### 1. Filter Guard Flags (State Hooks)
**Pattern:** Boolean guard flags prevent race conditions between concurrent operations.

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

---

### 2. Filter Operation Queue Hooks
**Pattern:** Operation queues defer filter operations until smart ordering completes.

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

---

### 3. Filter Toggle Hooks
**Pattern:** User-facing filter state management with manual override handling.

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

---

### 4. Data Filtering Hooks
**Pattern:** Client-side filtering of display data.

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

### 5. Filter State Management Hooks
**Pattern:** Property exports to window object for debugging and testing.

**Location:** Lines 5042-5058

**Purpose:** Expose internal filter state and functions globally

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
| Filter Guard Flags | 3 | isFilterOperation, isSmartOrderingActive, isApplyingSmartOrder |
| Filter Queue Hooks | 3 | pendingFilterOperations, queueFilterOperation(), processPendingFilterOperations() |
| Filter Toggle Hooks | 2 | toggleFavorite(), toggleHidden() |
| Data Filtering Hooks | 2 | renderMetadataTable(), filterCommands() |
| Filter State Management | 8 | Window property exports |

### By Functional Purpose

| Purpose | Count | Hook Names |
|---------|-------|------------|
| Smart Ordering Integration | 6 | isSmartOrderingActive, isApplyingSmartOrder, pendingFilterOperations, queueFilterOperation(), processPendingFilterOperations(), handleResult hook |
| Filter Operation Management | 9 | isFilterOperation, toggleFavorite(), toggleHidden(), renderMetadataTable(), filterCommands(), plus 8 state exports |
| Data Display Filtering | 2 | renderMetadataTable(), filterCommands() |

### By Integration Pattern

| Pattern | Count | Description |
|---------|-------|-------------|
| Guard Flag Pattern | 3 | Boolean flags prevent race conditions |
| Queue Pattern | 2 | Defer operations during concurrent activity |
| State Toggle Pattern | 2 | User-facing filter state changes |
| Self-Attaching Pattern | 1 | Function creates and attaches its own event listener |
| Global Export Pattern | 8 | Expose internals via window object |

---

## Key Architectural Patterns

### 1. **Filter vs. Smart Ordering Coordination**
The filter hook ecosystem coordinates filter operations with smart ordering:
- **Guard flags** prevent concurrent conflicts
- **Queue system** defers filters during smart ordering
- **Manual override** clears smart ordering flag on user interaction

### 2. **Guard Flag Pattern**
Simple boolean flags that prevent race conditions:
- Lightweight conflict prevention
- Async reset via `setTimeout(..., 0)` pattern
- Covers entire render cycle with minimal overhead

### 3. **Queue-Based Deferment**
Heavyweight conflict prevention during active smart ordering:
- FIFO execution order
- Error isolation between operations
- Conditional enqueuing based on `isSmartOrdering()` check

### 4. **Self-Attaching Event Listeners**
Functions that create and attach their own event listeners:
- `renderMetadataTable()` creates filter input and attaches listener on each render
- Automatic cleanup on re-render
- No separate setup/teardown logic needed

---

## Excluded Hooks and Rationale

The following hooks from the comprehensive categorization were **excluded** from this filter-focused list:

### 1. Diagnostic Tracking Hook
**Excluded:** `renderDiagnostics` hook (Lines 8950-8955)
**Reason:** Not filter-related - adds diagnostic tracking after diagnostics render

### 2. Smart Ordering Integration Hook
**Excluded:** `handleResult` hook (Lines 8957-8982) 
**Reason:** Primarily for smart ordering, not filter functionality (though it coordinates with filters)

### 3. Keyboard Navigation Hook
**Excluded:** `switchTab` hook (Lines 9421-9425)
**Reason:** UX enhancement for keyboard navigation, not filter-related

### 4. Lifecycle Hooks
**Excluded:** All DOMContentLoaded hooks (Lines 491, 6797, 8946)
**Reason:** General initialization logic, not filter-specific

---

## Filter Hook Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│                 Filter Operation Triggered               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │ Is smart ordering active?  │
         └─────────────┬──────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
          YES                      NO
           │                       │
           ▼                       ▼
    ┌──────────────┐      ┌──────────────────┐
    │ Use Queue:   │      │ Use Guard Flag:  │
    │ queueFilter  │      │ isFilterOperation │
    │ Operation()  │      │ Execute now      │
    └──────┬───────┘      └──────────────────┘
           │
           │ (wait for smart ordering)
           │
           ▼
    ┌──────────────────┐
    │ Smart ordering  │
    │ completes       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Process queue:   │
    │ processPending   │
    │ FilterOperations()│
    └──────────────────┘
```

---

## Total Count

**Filter-Related Hooks: 18 total**
- Guard Flags: 3
- Queue Operations: 3 
- Toggle Functions: 2
- Data Filtering: 2
- State Exports: 8

---

## Generated
- **Date:** 2026-07-24
- **Bead:** bf-1ndzl
- **Source:** /home/coding/vista/src/public/app.js
- **Based on:** bf-20jtd (comprehensive categorization), bf-3uncb, bf-41ipv
- **Filter hooks extracted:** 18
- **Non-filter hooks excluded:** 7
