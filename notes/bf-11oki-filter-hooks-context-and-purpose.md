# Filter Hooks: Context and Purpose Documentation

**Task:** bf-11oki  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24  
**Purpose:** Document the context and purpose of each filter-related hook

## Executive Summary

Vista's filter system consists of **18 filter-related hooks** organized into **6 categories**. These hooks manage platform visibility, content filtering, meta-tag manipulation, and system coordination to prevent conflicts with smart ordering. Filter hooks represent **15% of all hooks** in the application, reflecting their specialized role within the broader UI interaction system.

---

## Category 1: Pure Text Filter Functions (2 hooks)

### renderMetadataTable()
**Line:** 3941-3995  
**Event Attachment:** Line 3991 (`filterInput.addEventListener('input', ...)`)

**Context:**
- Part of the metadata viewer panel that displays Open Graph and meta tags from analyzed URLs
- Called during initial metadata panel rendering and on every keystroke in the filter input field
- Operates on `allMetadataRows` array containing parsed meta tags

**Purpose:**
- Provides real-time text filtering of metadata table rows by tag name or value
- Enables users to quickly find specific meta tags within large sets (e.g., finding all `og:` tags or filtering by specific values)
- Pure filter function - transforms input data based on filter criteria without side effects

**Filter Operation:**
```javascript
const filteredRows = filter
  ? allMetadataRows.filter(r =>
      r.tag.toLowerCase().includes(filter.toLowerCase()) ||
      (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
    )
  : allMetadataRows;
```

**Pattern:** Self-attaching event listener - recreates the entire metadata table HTML including the input field itself, then re-attaches the listener to the new input element.

---

### filterCommands()
**Line:** 9177-9192  
**Event Attachment:** Line 9085 (`input.addEventListener('input', filterCommands)`)

**Context:**
- Part of the command palette system (launched via keyboard shortcut)
- Attached to the command palette's text input field
- Operates on the `COMMANDS` array containing available application commands

**Purpose:**
- Provides real-time filtering of command palette commands as the user types
- Enables keyboard-first workflow for power users to quickly access application features
- Searches across both command labels and categories for flexible matching

**Filter Operation:**
```javascript
const filtered = COMMANDS.filter(cmd =>
  cmd.label.toLowerCase().includes(query) ||
  cmd.category.toLowerCase().includes(query)
);
```

**Special Behavior:** Resets the command palette selection index to 0 on each filter change to prevent out-of-bounds selections when the filtered list shrinks.

---

## Category 2: Platform Visibility Filters (3 hooks)

### toggleFavorite(pid)
**Line:** 7867-7882  
**Event Attachment:** Line 8008 (`btn.addEventListener('click', () => toggleFavorite(btn.dataset.pid))`)

**Context:**
- Called from favorite button click handlers on platform preview cards
- Part of the platform preferences system that persists user preferences
- Operates on the `platformPrefs.favorites` Set

**Purpose:**
- Toggles a platform's favorite status - affects whether it appears in the favorites view
- Allows users to curate a subset of platforms for quick access
- Does **NOT** affect platform visibility in the main view - only favorites grouping

**Guard Pattern:** Uses `guardWrapper('toggleFavorite', ...)` which provides smart ordering protection but does NOT trigger a full re-render since favorite-only changes don't affect layout.

**State Impact:** 
- Modifies `platformPrefs.favorites` Set (add/remove platform ID)
- Persists changes via `savePlatformPrefs()`
- Updates favorites list UI
- **Clears** `isSmartOrderingActive` flag to signal manual user override

**Why Not Reset Order:** Favorite changes are cosmetic groupings that don't affect which cards are visible or their spatial relationship, so the existing card order can be preserved.

---

### toggleHidden(pid)
**Line:** 7977-7986  
**Event Attachment:** Line 8030 (`btn.addEventListener('click', () => toggleHidden(btn.dataset.pid))`)

**Context:**
- Called from hide button click handlers on platform preview cards
- Part of the platform preferences system that controls main view visibility
- Operates on the `platformPrefs.hidden` Set

**Purpose:**
- Toggles a platform's hidden status - directly affects whether the platform appears in the main view
- Allows users to permanently hide platforms they don't care about
- This is a **true filter operation** - it removes items from the displayed set

**Guard Pattern:** Uses `guardWrapperWithRender('toggleHidden', ...)` which includes full re-render because hiding a platform changes the layout.

**State Impact:**
- Modifies `platformPrefs.hidden` Set (add/remove platform ID)
- Persists changes via `savePlatformPrefs()`
- Updates hidden list UI
- **Triggers** `renderPreviews(currentData)` to apply the visibility change

**Why Reset Order:** Hiding a platform changes the spatial layout of remaining cards, requiring a recalculation of optimal positioning.

---

### importPreferences(e)
**Line:** 8057-8099  
**Event Attachment:** Line 6831 (`importPrefsInput?.addEventListener('change', importPreferences)`)

**Context:**
- Triggered by file input when user selects a JSON preferences file to import
- Part of the preferences backup/restore system
- Batch operation that replaces entire platform preference state

**Purpose:**
- Imports platform preferences (favorites, hidden, card order) from a JSON file
- Enables users to transfer preferences between devices or restore backups
- This is a **batch filter operation** - replaces entire filter state at once

**Guard Pattern:** Full smart ordering awareness with queue/defer logic:
```javascript
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
```

**State Impact:**
- Replaces `platformPrefs.favorites` Set entirely
- Replaces `platformPrefs.hidden` Set entirely
- Replaces `platformPrefs.cardOrder` array entirely
- Updates column count and smart ordering preference
- **Triggers** full re-render with `isFilterOperation = true` guard

**Why Reset Order:** Importing preferences can change which platforms are visible, their hidden/favorite status, and explicitly override card order - requires complete layout recalculation.

---

## Category 3: Meta-Tag Filtering Operations (3 hooks)

### toggleWhatIfMode()
**Line:** 8121-8160  
**Event Attachment:** Line 8334 (`whatIfToggleBtn?.addEventListener('click', toggleWhatIfMode)`)

**Context:**
- Triggered by the "What If" toggle button in the main toolbar
- Part of the meta-tag testing system for previewing fallback behavior
- Toggles the global `whatIfMode` boolean flag

**Purpose:**
- Enables "What If" mode for testing platform behavior with specific meta tags disabled
- Allows content creators to preview how platforms will handle missing or broken meta tags
- When enabling: opens the What-If panel for tag selection
- When disabling: clears disabled tag set and reverts to full tag rendering

**Guard Pattern:** Smart ordering aware - queues operations when active to prevent race conditions:
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

**State Impact:**
- Toggles `whatIfMode` boolean
- Manages `disabledTags` Set (clears on mode disable)
- Updates UI button state and panel visibility
- **Triggers** re-render when disabling mode to restore full tag set

**Why Reset Order:** Disabling What-If mode reverts to the full metadata set, which may affect card positioning based on tag-dependent calculations.

---

### What-If Tag Toggle Handlers
**Line:** 8206-8215  
**Event Attachment:** Dynamic attachment via `querySelectorAll('.what-if-toggle input')`

**Context:**
- Dynamically attached to checkbox inputs in the What-If panel
- Each checkbox represents a meta tag or tag namespace that can be disabled
- Operates on the `disabledTags` Set

**Purpose:**
- Toggles individual meta tags on/off in What-If mode
- Allows fine-grained testing of fallback behavior for specific missing tags
- Examples: disable `og:title` to see title fallback, disable `og:image` to see image fallback

**Filter Operation:**
```javascript
if (!cb.checked) {
  disabledTags.add(cb.dataset.tag);
} else {
  disabledTags.delete(cb.dataset.tag);
}
```

**State Impact:**
- Modifies `disabledTags` Set based on checkbox state
- Updates URL hash to persist What-If state
- Does NOT trigger re-render - waits for explicit "Apply" action

**Why No Reset Order:** Tag toggles only modify the disabled tag set - they don't immediately affect rendering. The user must click "Apply" to see changes, which prevents janky UI during checkbox clicking.

---

### applyWhatIfChanges()
**Line:** 8241-8265  
**Event Attachment:** Line 8220 (`whatIfApply?.addEventListener('click', applyWhatIfChanges)`)

**Context:**
- Triggered by the "Apply" button in the What-If panel
- Part of the meta-tag testing system
- Operates on the `disabledTags` Set to create filtered metadata

**Purpose:**
- Applies What-If mode changes by creating a modified copy of metadata with disabled tags removed
- Shows users the actual fallback behavior by filtering out selected meta tags
- Enables A/B testing of meta tag completeness and fallback handling

**Filter Operation:**
- Creates deep copy of `currentData.meta`
- Deletes any tags in `disabledTags` Set (supports both namespaced and top-level tags)
- Re-renders previews with `modifiedData` instead of `currentData`

**State Impact:**
- Does NOT modify `currentData` - creates temporary `modifiedData` copy
- Sets `isFilterOperation = true` guard flag
- **Triggers** `renderPreviews(modifiedData)` with filtered metadata
- Announces changes via accessibility API
- Shows missing tag warnings if platforms depend on disabled tags

**Why Reset Order:** Applying What-If changes can affect platform scores and rankings based on the presence/absence of specific meta tags, potentially affecting card positioning.

---

## Category 4: Platform Selection Filter Handlers (2 hooks)

### Cropper Platform Toggle Handler
**Line:** 3497-3501  
**Event Attachment:** Dynamic (`document.querySelectorAll('.cropper-platform-toggle input')`)

**Context:**
- Part of the cropper tool for designing Open Graph images
- Attached to checkbox inputs that enable/disable platforms for safe zone calculation
- Operates on the `cropperState.enabledPlatforms` Set

**Purpose:**
- Handles individual platform checkbox changes in the cropper tool
- Filters which platforms are included in the safe zone intersection calculation
- Enables designers to see which areas of an OG image are safe for specific platform combinations

**Filter Operation:**
```javascript
cb.addEventListener('change', () => {
  updateEnabledPlatforms();
  updateCropperOverlay();
  syncGroupToggles(groups);
});
```

**State Impact:**
- Updates `cropperState.enabledPlatforms` Set via `updateEnabledPlatforms()`
- Triggers visual overlay update via `updateCropperOverlay()`
- Syncs group checkbox states

**Why No Guard Pattern:** Cropper tool is isolated from the main preview system and doesn't interact with smart ordering, so no guard protection is needed.

---

### Cropper Group Toggle Handler
**Line:** 3481-3491  
**Event Attachment:** Dynamic (`document.querySelectorAll('.cropper-group-toggle')`)

**Context:**
- Part of the cropper tool for bulk platform selection
- Attached to category-level checkboxes (social, messaging, collaboration, etc.)
- Operates on groups of platforms by category

**Purpose:**
- Handles group checkbox changes for bulk platform selection/deselection
- Enables designers to quickly enable/disable all platforms in a category (e.g., all social platforms)
- Reduces clicking when designing for broad or narrow platform sets

**Filter Operation:**
```javascript
platforms.forEach(pid => {
  const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
  if (platformCb) platformCb.checked = e.target.checked;
});
updateEnabledPlatforms();
updateCropperOverlay();
syncGroupToggles(groups);
```

**State Impact:**
- Updates all individual platform checkboxes in the group
- Updates `cropperState.enabledPlatforms` Set
- Triggers visual overlay update
- Syncs group checkbox states

**Why No Guard Pattern:** Like individual platform toggles, group toggles are isolated to the cropper tool and don't interact with smart ordering.

---

## Category 5: Filter System Coordination (6 hooks)

### isFilterOperation (Guard Flag)
**Line:** 6279 (declaration), 5046-5049 (window export)  
**Type:** Global boolean flag

**Context:**
- Declared at module level as `let isFilterOperation = false`
- Exported to window object for external access
- Checked in smart ordering logic to prevent race conditions

**Purpose:**
- Coordinates filter operations to prevent smart ordering from resetting during filter changes
- Acts as a mutex/lock that signals "a filter operation is in progress, don't reset order"
- Set to `true` before filter operations, reset to `false` after completion

**Usage Pattern:**
```javascript
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Check Points:** Lines 8792, 8794 in `applySmartOrdering()` function

**Why This Pattern:** The setTimeout ensures the flag is reset after the current event loop tick, allowing the render to complete while preventing smart ordering from mid-render resets.

---

### pendingFilterOperations (Queue Array)
**Line:** 6281 (declaration), 5050-5053 (window export)  
**Type:** Global array

**Context:**
- Declared at module level as `let pendingFilterOperations = []`
- Exported to window object for external access
- Populated when filter operations need to be deferred

**Purpose:**
- Queues filter operations that occur during active smart ordering
- Prevents conflicts by deferring operations until smart ordering completes
- Enables sequential processing of multiple queued operations

**Usage Pattern:**
```javascript
pendingFilterOperations.push({ operation, description });
```

**Why This Pattern:** Smart ordering is a complex animation/transition process. Queueing filter operations prevents them from interrupting the animation and causing visual glitches.

---

### queueFilterOperation(operation, description)
**Line:** 7942-7947 (function), 5055 (window export)  
**Type:** Queue management function

**Context:**
- Called by filter operations that need to be deferred
- Wraps the actual filter operation in an object with description
- Adds to the `pendingFilterOperations` array

**Purpose:**
- Adds filter operations to the queue for later execution
- Provides debug logging for troubleshooting filter operation scheduling
- Includes operation description for debugging

**Operation:**
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Usage Examples:** Lines 8087 (importPreferences), 8148 (toggleWhatIfMode)

**Why Description Parameter:** The description enables debug logging to track which operations are queued and in what order, essential for troubleshooting complex filter operation sequences.

---

### processPendingFilterOperations()
**Line:** 7952-7975 (function), 5056 (window export)  
**Type:** Queue processor function

**Context:**
- Called after smart ordering completes (line 8794 in applySmartOrdering)
- Executes all queued filter operations in sequence
- Clears the queue after execution

**Purpose:**
- Executes queued filter operations after smart ordering completes
- Ensures deferred operations are eventually applied
- Provides error handling for individual operation failures

**Operation:**
```javascript
const operations = pendingFilterOperations.slice();
pendingFilterOperations = [];

operations.forEach(({ operation, description }) => {
  try {
    operation();
  } catch (error) {
    console.error(`Error executing: ${description}`, error);
  }
});
```

**Why Copy-On-Read:** Creates a copy of the queue before processing to prevent issues if an operation tries to queue additional operations during iteration.

---

### shouldDeferFilterOperation()
**Line:** 7891-7893  
**Type:** Boolean predicate function

**Context:**
- Called by filter operations to determine execution strategy
- Simple check of smart ordering state

**Purpose:**
- Determines if a filter operation should be deferred (queued) vs executed immediately
- Provides a clean semantic check vs. raw state inspection

**Operation:**
```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Why This Function:** Provides semantic clarity - code reads better as `if (shouldDeferFilterOperation())` vs `if (isSmartOrderingActive)` and makes the intent explicit.

---

### isSmartOrdering()
**Line:** 7933-7935  
**Type:** Boolean predicate function

**Context:**
- Used throughout filter operation routing logic
- Dual condition check for smart ordering state

**Purpose:**
- Determines if smart ordering is both enabled (preference) AND active (runtime state)
- Provides combined check vs. checking two conditions separately

**Operation:**
```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Usage Lines:** 7888 (toggleFavorite), 7978 (toggleHidden), 8087 (importPreferences), 8142 (toggleWhatIfMode)

**Why This Function:** Smart ordering can be enabled but not currently active. This function checks both conditions, ensuring filter operations only defer when smart ordering is actually in progress.

---

## Category 6: Specialized UI Filters (2 hooks)

### updateEnabledPlatforms()
**Line:** 3551-3561  
**Module:** Cropper tool

**Context:**
- Called from cropper toggle change handlers (both individual and group)
- Updates the cropper's enabled platforms set based on checkbox states

**Purpose:**
- Synchronizes the cropper's enabled platforms set with the UI checkbox states
- Enables the cropper overlay to reflect current platform selection
- Triggers category legend update to show which categories have enabled platforms

**Operation:**
```javascript
cropperState.enabledPlatforms.clear();
document.querySelectorAll('.cropper-platform-toggle input:checked').forEach(cb => {
  cropperState.enabledPlatforms.add(cb.dataset.platform);
});
renderCategoryLegend();
```

**Why DOM Query:** Uses `querySelectorAll` to read current checkbox states rather than maintaining separate state, ensuring the enabled set always matches the visible UI.

---

### updateCropperOverlay()
**Line:** 3600-3676  
**Module:** Cropper tool

**Context:**
- Called after platform toggles change in the cropper tool
- Renders the visual safe zone overlay on the OG image

**Purpose:**
- Visual representation of filtered platform crops on the cropper tool
- Calculates and displays the safe zone (intersection of all enabled platform crops)
- Shows percentage coverage and platform count

**Operation:**
- Calculates crop rectangles for all enabled platforms
- Calculates safe zone as intersection of all crop rectangles
- Draws semi-transparent crop rectangles for each platform
- Draws distinct safe zone rectangle with cyan accent
- Updates info panel with dimensions and coverage percentage

**Why SVG Rendering:** Uses SVG for precise, scalable rectangles that align perfectly with the underlying OG image regardless of zoom level.

---

## Filter Operation Flow Patterns

### Immediate Execution Flow
```
User Action → Filter Function
                ↓
          Check: isSmartOrdering()?
                ↓
           NO → Execute Immediately
                ↓
          Set isFilterOperation = true
                ↓
          renderPreviews(currentData)
                ↓
          Set isFilterOperation = false
```

**Used By:** Most filter operations when smart ordering is not active

### Deferred Execution Flow
```
User Action → Filter Function
                ↓
          Check: isSmartOrdering()?
                ↓
           YES → Create operation wrapper
                ↓
          queueFilterOperation(op, description)
                ↓
          Return (don't execute yet)
                ↓
          [Smart ordering completes...]
                ↓
          processPendingFilterOperations()
                ↓
          Execute each queued operation
```

**Used By:** `importPreferences()`, `toggleWhatIfMode()` when smart ordering is active

### Guard Wrapper Pattern
```javascript
guardWrapper('operationName', () => {
  // Operation logic
  // No automatic render
});
```

**Used By:** Operations that don't require full re-render (e.g., `toggleFavorite()`)

### Guard Wrapper With Render Pattern
```javascript
guardWrapperWithRender('operationName', () => {
  // Operation logic
  // Automatic renderPreviews(currentData) call
});
```

**Used By:** Operations that require full re-render (e.g., `toggleHidden()`)

---

## Key Architectural Insights

### 1. Filter Operations are Protected
Most filter operations use guard patterns to prevent conflicts with smart ordering. The `isFilterOperation` flag acts as a mutex that prevents smart ordering from resetting card positions during filter changes.

### 2. State is Persistent
Filter state (`platformPrefs.favorites`, `platformPrefs.hidden`) is saved to localStorage via `savePlatformPrefs()`. This ensures user preferences persist across sessions.

### 3. UI Updates are Cascading
Filter operations trigger dependent UI updates:
- `toggleFavorite()` → `updateFavoritesList()` 
- `toggleHidden()` → `updateHiddenList()` + `renderPreviews()`
- Platform toggles → `updateEnabledPlatforms()` → `updateCropperOverlay()`

### 4. Smart Ordering Awareness
All filter operations check smart ordering state before executing:
- If smart ordering is active → queue the operation
- If smart ordering is inactive → execute immediately

### 5. Debug Visibility
Extensive debug logging (`DEBUG_SMART_ORDERING` flag) enables troubleshooting of complex filter operation sequences and queue behavior.

### 6. Filter Operations are Minority
Filter-related hooks represent only 15% of all hooks in the application (18 out of 124 total hooks). The application is primarily driven by general-purpose UI interactions (clicks, navigation, modals) rather than filter operations.

---

## Summary Table

| Hook | Context | Purpose | Filter Type | Order Impact |
|------|---------|---------|-------------|--------------|
| `renderMetadataTable()` | Metadata viewer | Filter meta tags by text | Text substring | No (local only) |
| `filterCommands()` | Command palette | Filter commands by search | Multi-field text | No (local only) |
| `toggleFavorite()` | Platform cards | Toggle favorite status | Binary set membership | No |
| `toggleHidden()` | Platform cards | Toggle visibility | Binary visibility filter | Yes (re-render) |
| `importPreferences()` | Preferences import | Batch filter state import | Batch state replace | Yes (re-render) |
| `toggleWhatIfMode()` | What-If panel | Toggle meta-tag testing mode | Mode toggle | Yes (on disable) |
| What-If tag toggles | What-If panel | Toggle individual meta tags | Per-tag binary filter | No (deferred) |
| `applyWhatIfChanges()` | What-If panel | Apply meta-tag exclusions | Conditional meta-tag filter | Yes (re-render) |
| Platform toggles | Cropper tool | Select platforms for safe zone | Multi-select platform filter | No (isolated) |
| Group toggles | Cropper tool | Bulk platform selection | Group-based filter | No (isolated) |
| `isFilterOperation` | Global | Guard flag for coordination | System coordination | N/A |
| `pendingFilterOperations` | Global | Queue for deferred ops | System coordination | N/A |
| `queueFilterOperation()` | Global | Add operation to queue | System coordination | N/A |
| `processPendingFilterOperations()` | Global | Execute queued operations | System coordination | N/A |
| `shouldDeferFilterOperation()` | Global | Check if should defer | System coordination | N/A |
| `isSmartOrdering()` | Global | Check smart ordering state | System coordination | N/A |
| `updateEnabledPlatforms()` | Cropper tool | Sync enabled platforms set | Platform set management | No (isolated) |
| `updateCropperOverlay()` | Cropper tool | Render safe zone overlay | Visual filter representation | No (isolated) |

---

**End of Filter Hooks Context and Purpose Documentation**  
**Status:** COMPLETE  
**Next Steps:** Use this documentation as a reference for understanding filter operation behavior, debugging filter-related issues, and implementing new filter features.