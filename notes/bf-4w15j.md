# Filter State Variables Documentation - bf-4w15j

## Overview
Documentation of all filter state variables in `/home/coding/vista/src/public/app.js` with line numbers and initialization code snippets.

## Filter State Variables

### 1. `platformPrefs` (Lines 6263-6270)
**Purpose:** Main platform customization state object
```javascript
let platformPrefs = {
  favorites: new Set(),
  hidden: new Set(),
  columnCount: 3,
  smartOrdering: true,
  cardOrder: {}, // Map of groupId -> array of platform IDs in custom order
  cardOrderMetadata: {} // Map of groupId -> {userModified, lastModified, modifiedBy, pageType}
};
```

### 2. `isApplyingSmartOrder` (Line 6273)
**Purpose:** Guard flag to prevent concurrent smart ordering operations
```javascript
let isApplyingSmartOrder = false;
```

### 3. `pendingApplySmartOrder` (Line 6274)
**Purpose:** Queue flag for re-applying smart order after completion
```javascript
let pendingApplySmartOrder = false;
```

### 4. `pendingRenderData` (Line 6275)
**Purpose:** Queue renderPreviews calls during smart ordering
```javascript
let pendingRenderData = null; // Queue renderPreviews calls during smart ordering
```

### 5. `isRendering` (Line 6276)
**Purpose:** Guard flag to prevent concurrent renders
```javascript
let isRendering = false; // Guard flag to prevent concurrent renders
```

### 6. `pendingRenderAfterCurrent` (Line 6277)
**Purpose:** Queue renders during active render
```javascript
let pendingRenderAfterCurrent = null; // Queue renders during active render
```

### 7. `currentPageType` (Line 6278)
**Purpose:** Track current page type for stale cardOrder detection
```javascript
let currentPageType = null; // Track current page type for stale cardOrder detection
```

### 8. `isFilterOperation` (Line 6279)
**Purpose:** Guard flag to prevent smart order resets during filter changes
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```

### 9. `isSmartOrderingActive` (Line 6280)
**Purpose:** Track when smart ordering is currently active
```javascript
let isSmartOrderingActive = false; // Track when smart ordering is currently active
```

### 10. `pendingFilterOperations` (Line 6281)
**Purpose:** Queue filter operations during smart ordering
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```

## Related Local Variables

### `filterInput` (Line 3989)
**Purpose:** Local reference to metadata filter input DOM element
**Scope:** Local within function
```javascript
const filterInput = document.getElementById('metadataFilterInput');
```

## Variable Categories

### State Objects
- `platformPrefs` - Main filter configuration state

### Guard Flags
- `isApplyingSmartOrder` - Prevents concurrent smart ordering
- `isRendering` - Prevents concurrent renders
- `isFilterOperation` - Prevents smart order resets during filter operations
- `isSmartOrderingActive` - Tracks smart ordering state

### Queue Variables
- `pendingApplySmartOrder` - Queue flag for smart order re-application
- `pendingRenderData` - Queue for render data
- `pendingRenderAfterCurrent` - Queue for renders after current
- `pendingFilterOperations` - Queue for filter operations

### Tracking Variables
- `currentPageType` - Tracks current page type for metadata management

## Summary
Total: **10 module-level filter state variables** plus **1 local variable**
- All module-level variables defined in lines 6263-6281
- Local variable defined at line 3989 within function scope
