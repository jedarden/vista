# addHook Filter-Change Event Patterns in app.js

## Overview
This document catalogs all `addEventListener` patterns (addHook patterns) related to filter-change events in `/home/coding/vista/src/public/app.js`. These patterns handle various filtering, platform visibility, and UI filtering operations.

---

## Pattern 1: Metadata Table Filter
**Line:** 3989-3994  
**Event Type:** `input`  
**Element:** `#metadataFilterInput`  
**Trigger:** User types in metadata filter input  
**Action:** Re-renders metadata table with filtered results  

```javascript
// Attach filter listener
const filterInput = document.getElementById('metadataFilterInput');
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    renderMetadataTable(e.target.value);
  });
}
```

**Context:** This is a simple text filter for the metadata table that shows JSON-LD and other page metadata. As the user types, the table updates in real-time.

---

## Pattern 2: Group Platform Toggle (Cropper)
**Line:** 3480-3492  
**Event Type:** `change`  
**Element:** `.cropper-group-toggle` (checkboxes)  
**Trigger:** User toggles group checkbox in cropper overlay  
**Action:** Checks/unchecks all platforms in group, updates UI  

```javascript
// Group header toggle → check/uncheck every platform in that group, then
// re-sync the header (a click clears any indeterminate flag from prior edits).
document.querySelectorAll('.cropper-group-toggle').forEach(groupCb => {
  groupCb.addEventListener('change', (e) => {
    const group = e.target.dataset.group;
    const platforms = groups.find(g => g.id === group)?.platforms || [];
    platforms.forEach(pid => {
      const platformCb = document.querySelector(`input[data-platform="${pid}"]`);
      if (platformCb) platformCb.checked = e.target.checked;
    });
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Context:** This handles group-level platform toggling in the screenshot cropper overlay. When a user clicks a group checkbox (e.g., "Social Media"), it toggles all platforms within that group (Twitter, LinkedIn, etc.).

---

## Pattern 3: Individual Platform Toggle (Cropper)
**Line:** 3496-3502  
**Event Type:** `change`  
**Element:** `.cropper-platform-toggle input` (checkboxes)  
**Trigger:** User toggles individual platform checkbox  
**Action:** Updates enabled platforms, redraws overlay, syncs group toggles  

```javascript
// Individual platform toggle → redraw overlays, then re-sync every group
// header so a header always reflects its children (all on / all off / mixed).
document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    updateEnabledPlatforms();
    updateCropperOverlay();
    syncGroupToggles(groups);
  });
});
```

**Context:** Handles individual platform checkbox changes in the cropper. Updates the overlay display and ensures group header checkboxes reflect the state of their children (all checked, all unchecked, or mixed).

---

## Pattern 4: Select All Platforms
**Line:** 3504-3509  
**Event Type:** `click`  
**Element:** `#selectAllPlatforms` (button)  
**Trigger:** User clicks "Select All" button  
**Action:** Checks all platform checkboxes, updates UI  

```javascript
document.getElementById('selectAllPlatforms')?.addEventListener('click', () => {
  document.querySelectorAll('.cropper-platform-toggle input').forEach(cb => cb.checked = true);
  syncGroupToggles(groups);
  updateEnabledPlatforms();
  updateCropperOverlay();
});
```

**Context:** Bulk action to select all available platforms in the cropper overlay.

---

## Pattern 5: Hidden Platform Removal
**Line:** 8029-8031  
**Event Type:** `click`  
**Element:** `.platform-item-remove` (buttons)  
**Trigger:** User clicks remove button on hidden platform list  
**Action:** Calls `toggleHidden()` to show platform again  

```javascript
list.querySelectorAll('.platform-item-remove').forEach(btn => {
  btn.addEventListener('click', () => toggleHidden(btn.dataset.pid));
});
```

**Context:** When a platform has been hidden from the main view, it appears in a "Hidden Platforms" list. This pattern handles removing a platform from that hidden list (i.e., making it visible again).

---

## Pattern 6: What-If Tag Toggle
**Line:** 8206-8216  
**Event Type:** `change`  
**Element:** `.what-if-toggle input` (checkboxes)  
**Trigger:** User toggles tag in "What If" mode panel  
**Action:** Adds/removes tag from disabled set, updates URL hash  

```javascript
// Add event listeners
panel.querySelectorAll('.what-if-toggle input').forEach(cb => {
  cb.addEventListener('change', () => {
    if (!cb.checked) {
      disabledTags.add(cb.dataset.tag);
    } else {
      disabledTags.delete(cb.dataset.tag);
    }
    // Update hash to reflect disabled tags
    updateHash();
  });
});
```

**Context:** The "What If" mode allows users to simulate how scores would change if certain tags (e.g., "og:title", "twitter:image") were fixed. Each checkbox represents a tag; unchecked means "pretend this tag is fixed."

---

## Pattern 7: Command Palette Filter
**Line:** 9085  
**Event Type:** `input`  
**Element:** `#commandInput` (text input)  
**Trigger:** User types in command palette search  
**Action:** Calls `filterCommands()` to filter available commands  

```javascript
const input = document.getElementById('commandInput');
input.addEventListener('input', filterCommands);
```

**Context:** The command palette (Ctrl+K / Cmd+K) provides quick access to various app commands. This pattern filters the command list as the user types.

---

## Pattern 8: What-If Panel FAB Toggle
**Line:** 9465-9471  
**Event Type:** `click`  
**Element:** What-If FAB (Floating Action Button)  
**Trigger:** User clicks FAB to open/close panel  
**Action:** Opens or closes the What-If panel  

```javascript
fab.addEventListener('click', () => {
  if (panel.classList.contains('hidden')) {
    openPanel();
  } else {
    closePanel();
  }
});
```

**Context:** The FAB is the main entry point to the "What If" simulation mode panel.

---

## Pattern 9: Panel Close Buttons
**Line:** 9473-9474  
**Event Type:** `click`  
**Element:** Close and Cancel buttons in What-If panel  
**Trigger:** User clicks close or cancel  
**Action:** Closes the What-If panel  

```javascript
closeBtn.addEventListener('click', closePanel);
cancelBtn.addEventListener('click', closePanel);
```

**Context:** Provides multiple ways to dismiss the What-If panel (X button, Cancel button).

---

## Additional Related Event Listeners

### Pattern 10: What-If Panel Buttons (Lines 8218-8220)
**Event Type:** `click`  
**Elements:** `#whatIfClose`, `#whatIfReset`, `#whatIfApply`  
**Actions:** Close panel, reset all toggles, apply What-If changes

```javascript
document.getElementById('whatIfClose')?.addEventListener('click', closeWhatIfPanel);
document.getElementById('whatIfReset')?.addEventListener('click', resetWhatIfToggles);
document.getElementById('whatIfApply')?.addEventListener('click', applyWhatIfChanges);
```

---

## Summary

**Total patterns found:** 10 distinct addEventListener patterns related to filter/change operations

**Event types used:**
- `input`: 2 patterns (real-time text filtering)
- `change`: 4 patterns (checkbox state changes)
- `click`: 4 patterns (button interactions)

**Functional categories:**
1. **Text filtering:** Metadata table, command palette
2. **Platform visibility:** Group toggles, individual toggles, select all, hidden platforms list
3. **What-If mode:** Tag toggles, panel controls
4. **Panel controls:** Open/close/apply/reset actions

All patterns follow the standard DOM event listener pattern using `addEventListener()`, which appears to be the "addHook" pattern referenced in the task description.
