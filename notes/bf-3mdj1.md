# Filter State Variable Declarations in app.js

Bead: bf-3mdj1
Date: 2026-07-24

## Global Filter State Variables

### 1. `allMetadataRows` (line 3793)
```javascript
let allMetadataRows = [];
```
- **Purpose:** Stores all metadata globally for export/filtering
- **Context:** Comment explicitly states "Store all metadata globally for export/filtering"
- **Type:** Array
- **Usage:** Reset and populated by `renderRawTags()` function

### 2. `isFilterOperation` (line 6279)
```javascript
let isFilterOperation = false; // Guard flag to prevent smart order resets during filter changes
```
- **Purpose:** Guard flag to prevent smart order resets during filter changes
- **Type:** Boolean
- **Context:** Part of "Guard flags to prevent race conditions during smart ordering" section
- **Usage:** Set to `true` during filter operations to prevent concurrent smart order resets

### 3. `pendingFilterOperations` (line 6281)
```javascript
let pendingFilterOperations = []; // Queue filter operations during smart ordering
```
- **Purpose:** Queue filter operations during smart ordering
- **Type:** Array
- **Context:** Part of "Guard flags to prevent race conditions during smart ordering" section
- **Usage:** Stores filter operations that need to be processed

## Local (Function-Scope) Filter-Related Variables

### 4. `filteredRows` (line 3942)
```javascript
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```
- **Purpose:** Temporary storage for filtered metadata rows
- **Scope:** Local to `renderMetadataTable()` function
- **Type:** Array
- **Usage:** Result of filtering `allMetadataRows` based on the filter parameter

### 5. `filterInput` (line 3989)
```javascript
const filterInput = document.getElementById('metadataFilterInput');
```
- **Purpose:** Reference to the metadata filter input DOM element
- **Scope:** Local to `renderMetadataTable()` function
- **Type:** DOM Element reference
- **Usage:** Used to set focus after rendering

## Summary

**Total filter state variables found: 5**
- **3 global variables:** `allMetadataRows`, `isFilterOperation`, `pendingFilterOperations`
- **2 local variables:** `filteredRows`, `filterInput`

All variables are explicitly related to filter state tracking, with clear documentation comments for the global variables.
