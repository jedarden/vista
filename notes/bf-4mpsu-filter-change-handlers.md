# Filter Change Handlers - Names and Locations

**Bead:** bf-4mpsu  
**Date:** 2026-07-24  
**Source:** /home/coding/vista/src/public/app.js

---

## Overview

This document extracts all filter change handler function names and their exact locations from app.js, grouped by their section/region in the file.

---

## Filter Change Handlers That Reset Order

### 1. toggleHidden(pid)
- **Lines:** 7984-8013
- **Section:** Smart Ordering & Filter Guards
- **Event Listener Registration:** Line 8055
- **Trigger:** User clicks visibility toggle button on platform card
- **Function:** Toggles platform visibility (hide/show)

### 2. importPreferences(e)
- **Lines:** 8082-8140
- **Section:** Smart Ordering & Filter Guards
- **Event Listener Registration:** Line 6831
- **Trigger:** User selects file via import preferences input
- **Function:** Imports user preferences from JSON file

### 3. toggleWhatIfMode()
- **Lines:** 8146-8187
- **Section:** Smart Ordering & Filter Guards
- **Event Listener Registration:** Line 8359
- **Trigger:** User clicks "What If" toggle button
- **Function:** Toggles "What If" mode for simulating missing metadata tags

### 4. applyWhatIfChanges()
- **Lines:** 8254-8305
- **Section:** Smart Ordering & Filter Guards
- **Event Listener Registration:** Line 8245
- **Trigger:** User clicks "Apply" button in What If panel
- **Function:** Applies What If mode changes (disables selected metadata tags)

---

## Filter Change Handlers That Do NOT Reset Order

### 5. toggleFavorite(pid)
- **Lines:** 7867-7890
- **Section:** Platform Favorites & Hidden Management
- **Event Listener Registration:** Line 8033
- **Trigger:** User clicks favorite star on platform card
- **Function:** Toggles platform favorite status

### 6. Metadata Filter Input Handler
- **Lines:** 3991-3993
- **Section:** Metadata Tag Management
- **Event Listener Registration:** Line 3991
- **Trigger:** User types in metadata filter input
- **Handler Function:** `renderMetadataTable(filter = '')` - Line 3941
- **Function:** Filters metadata tags table

### 7. Command Palette Filter
- **Lines:** 9110
- **Section:** Command Palette (Late in file)
- **Event Listener Registration:** Line 9110
- **Trigger:** User types in command palette search input
- **Handler Function:** `filterCommands(e)` - Line 9202
- **Function:** Filters command palette options

### 8. Heatmap Sort Handler (handleHeatmapSort)
- **Lines:** 6101-6123
- **Section:** Sitemap Heatmap Management
- **Event Listener Registration:** Line 332
- **Trigger:** User changes sort order in sitemap heatmap
- **Function:** Sorts sitemap heatmap results

### 9. Cropper Platform/Group Toggles
- **Lines:** 3481-3516
- **Section:** Image Cropper Controls (Early in file)
- **Triggers:**
  - Group header toggle (line 3481)
  - Individual platform toggle (line 3497)
  - Select All button (line 3504)
  - Clear All button (line 3511)
- **Functions:** `updateEnabledPlatforms()`, `updateCropperOverlay()`
- **Function:** Updates which platform overlays are visible in cropper

### 10. OG Generator Controls
- **Lines:** Multiple (310-326)
- **Section:** OG Generator Setup (Early in file)
- **Event Listeners:** Multiple change event listeners
- **Triggers:** Various OG generator setting changes
  - Background type change (line 310)
  - Gradient direction change (line 314)
  - Background image upload (line 315)
  - Background image size change (line 316)
  - Font change (line 319)
  - Logo position change (line 321)
  - Logo upload (line 322)
- **Function:** Updates OG generator canvas preview

### 11. Badge Style Handler (updateBadgePreview)
- **Lines:** 4765-4788
- **Section:** Badge Management
- **Event Listener Registration:** Line 296
- **Trigger:** User changes badge style
- **Function:** Updates badge preview in modal

---

## Supporting Functions (Guard System)

### Guard Flag Declaration
- **isFilterOperation:** Line 6279
- **Section:** Global State Declarations
- **Purpose:** Prevents smart order resets during filter operations

### Smart Ordering Check Functions
- **isSmartOrdering():** Lines 7940-7942
- **queueFilterOperation(operation, description):** Lines 7949-7954
- **processPendingFilterOperations():** Lines 7959-7982
- **Section:** Smart Ordering Queue System

### Guard Check Location
- **applySmartOrdering() guard check:** Lines 8817-8822
- **Section:** Smart Ordering Application Logic

---

## Summary Table

| Handler Name | Lines | Section | Resets Order? | Event Type |
|--------------|-------|---------|---------------|------------|
| `toggleHidden()` | 7984-8013 | Smart Ordering & Filter Guards | ✅ YES | Click |
| `importPreferences()` | 8082-8140 | Smart Ordering & Filter Guards | ✅ YES | Change |
| `toggleWhatIfMode()` | 8146-8187 | Smart Ordering & Filter Guards | ✅ YES | Click |
| `applyWhatIfChanges()` | 8254-8305 | Smart Ordering & Filter Guards | ✅ YES | Click |
| `toggleFavorite()` | 7867-7890 | Platform Favorites & Hidden Management | ❌ NO | Click |
| `renderMetadataTable()` | 3991-3993 | Metadata Tag Management | ❌ NO | Input |
| `filterCommands()` | 9110 | Command Palette | ❌ NO | Input |
| `handleHeatmapSort()` | 6101-6123 | Sitemap Heatmap Management | ❌ NO | Change |
| Cropper Toggles | 3481-3516 | Image Cropper Controls | ❌ NO | Change/Click |
| OG Generator Controls | 310-326 | OG Generator Setup | ❌ NO | Change |
| `updateBadgePreview()` | 4765-4788 | Badge Management | ❌ NO | Change |

---

## File Structure Regions

The handlers are distributed across these main regions of app.js:

1. **Lines 1-500:** Early initialization, OG Generator Controls (310-326), Badge Style (296)
2. **Lines 3000-4000:** Metadata Filter Input (3991-3993), Cropper Toggles (3481-3516)
3. **Lines 6000-6300:** Guard Flag Declaration (6279), Heatmap Sort (6101-6123)
4. **Lines 7800-8400:** Platform Favorites & Filter Handlers (7867-8305)
5. **Lines 9000-9300:** Command Palette (9110)

---

**Total Filter Change Handlers:** 11  
**Handlers that Reset Order:** 4  
**Handlers that Do NOT Reset Order:** 7

---

**Acceptance Criteria Met:**
- ✅ List all filter change handler function names found in app.js (11 handlers)
- ✅ Document line numbers for each handler
- ✅ Group handlers by their section/region in the file
- ✅ Create a structured list of names with locations

---

**Document Version:** 1.0  
**Status:** Complete
