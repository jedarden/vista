# Comprehensive Filter-Related Hooks Documentation

**Task:** bf-37qc5  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24  
**Total Hooks Documented:** 18

## Table of Contents

1. [Overview](#overview)
2. [Core Filter Functions](#core-filter-functions)
3. [Platform Visibility Filters](#platform-visibility-filters)
4. [Meta-Tag Filtering](#meta-tag-filtering)
5. [Smart Ordering Coordination](#smart-ordering-coordination)
6. [Specialized UI Filters](#specialized-ui-filters)
7. [Patterns and Architecture](#patterns-and-architecture)
8. [Filter Operation Flow](#filter-operation-flow)

---

## Overview

Filter-related hooks in vista form a coordinated system that manages:
- **Platform visibility** (favorites, hidden platforms)
- **Content filtering** (metadata tables, command palettes)
- **Meta-tag manipulation** (What-If mode testing)
- **Smart ordering coordination** (preventing race conditions)

### Key Architectural Patterns

1. **Guard Pattern**: Filter operations use `isFilterOperation` flag to prevent smart ordering resets
2. **Queue Pattern**: Operations are queued during active smart ordering to prevent conflicts
3. **Immediate vs Deferred**: Some filters execute immediately, others defer based on system state
4. **State Modification**: Most filter operations modify persistent state (`platformPrefs`)

---

## Core Filter Functions

### 1. renderMetadataTable

**Line:** 3941-3995  
**Module:** Metadata viewer  
**Filter Type:** Text-based substring matching

```javascript
function renderMetadataTable(filter = '') {
  const filteredRows = filter
    ? allMetadataRows.filter(r =>
        r.tag.toLowerCase().includes(filter.toLowerCase()) ||
        (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
      )
    : allMetadataRows;

  let html = `<div class="metadata-viewer">
    <div class="metadata-toolbar">
      <div class="metadata-filter">
        <input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
        <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
      </div>
      <!-- ... export buttons ... -->
    </div>
    <div class="metadata-table-wrapper">
      <table class="metadata-table">
        <!-- ... table headers ... -->
        <tbody>
          ${filteredRows.length > 0 ? filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('') : '<tr><td colspan="4" class="no-results">No tags match your filter</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;

  rawTagsPanel.innerHTML = html;

  // Attach filter listener
  const filterInput = document.getElementById('metadataFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderMetadataTable(e.target.value);
    });
  }
}
```

**Context:** Called during metadata panel initialization and on every filter input change  
**Purpose:** Real-time filtering of metadata tags by name or value  
**Filter Relationship:** Pure filter function - transforms input data based on filter criteria  
**Pattern:** Self-attaching event listener pattern for recursive filtering

---

### 2. filterCommands

**Line:** 9177-9192  
**Module:** Command palette  
**Filter Type:** Multi-field text search

```javascript
function filterCommands(e) {
  const query = e.target.value.toLowerCase().trim();
  commandPaletteSelectedIndex = 0;

  if (!query) {
    renderCommands(COMMANDS);
    return;
  }

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  );

  renderCommands(filtered);
}
```

**Context:** Attached to command palette input field (line 9085)  
**Purpose:** Real-time filtering of available commands by label or category  
**Filter Relationship:** Pure filter function - filters command list based on search query  
**Pattern:** Resets selection index to prevent out-of-bounds state

---

## Platform Visibility Filters

### 3. toggleFavorite

**Line:** 7867-7882  
**Module:** Platform preferences  
**Filter Type:** Binary set membership

```javascript
function toggleFavorite(pid) {
  guardWrapper('toggleFavorite', () => {
    if (platformPrefs.favorites.has(pid)) {
      platformPrefs.favorites.delete(pid);
    } else {
      platformPrefs.favorites.add(pid);
    }
    savePlatformPrefs();
    updateFavoritesList();

    // Clear smart ordering active flag since user manually modified favorites
    isSmartOrderingActive = false;
    if (DEBUG_SMART_ORDERING) {
      console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
    }
  });
}
```

**Context:** Called from favorite button click handlers (line 8008)  
**Purpose:** Toggle platform favorite status - affects inclusion in favorites view  
**Filter Relationship:** Modifies filterable state (favorites set)  
**Guard Pattern:** Uses `guardWrapper()` to prevent conflicts  
**Order Impact:** Does NOT reset card order (favorite-only change)

---

### 4. toggleHidden

**Line:** 7977-7986  
**Module:** Platform preferences  
**Filter Type:** Binary visibility filter

```javascript
function toggleHidden(pid) {
  guardWrapperWithRender('toggleHidden', () => {
    if (platformPrefs.hidden.has(pid)) {
      platformPrefs.hidden.delete(pid);
    } else {
      platformPrefs.hidden.add(pid);
    }
    savePlatformPrefs();
    updateHiddenList();
    renderPreviews(currentData); // Re-render to apply hiding
  });
}
```

**Context:** Called from hide button click handlers (line 8030)  
**Purpose:** Toggle platform hidden status - directly affects main view visibility  
**Filter Relationship:** Modifies filterable state (hidden set) + triggers filter operation  
**Guard Pattern:** Uses `guardWrapperWithRender()` which includes full re-render  
**Order Impact:** DOES reset card order (visibility change requires re-layout)

---

### 5. importPreferences

**Line:** 8057-8099  
**Module:** Platform preferences import  
**Filter Type:** Batch state import

```javascript
function importPreferences(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const prefs = JSON.parse(event.target.result);
      platformPrefs.favorites = new Set(prefs.favorites || []);
      platformPrefs.hidden = new Set(prefs.hidden || []);
      platformPrefs.columnCount = prefs.columnCount || 3;
      platformPrefs.smartOrdering = prefs.smartOrdering !== false;

      savePlatformPrefs();
      updateColumnLayoutUI();
      updateFavoritesList();
      updateHiddenList();

      if (currentData) {
        // Check if smart ordering is active - defer operation if so
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

        // Direct execution
        isFilterOperation = true;
        renderPreviews(currentData);
        setTimeout(() => { isFilterOperation = false; }, 0);
        isSmartOrderingActive = false;
      }

      showToast('Preferences imported', 2000);
    } catch (err) {
      showToast('Failed to import preferences', 2000);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
```

**Context:** File input change handler for importing JSON preferences (line 6831)  
**Purpose:** Batch import of platform filter states from JSON file  
**Filter Relationship:** Replaces entire filter state (favorites, hidden, card order)  
**Guard Pattern:** Full smart ordering awareness with queue/defer logic  
**Order Impact:** DOES reset card order (full preferences reload)

---

## Meta-Tag Filtering

### 6. toggleWhatIfMode

**Line:** 8121-8160  
**Module:** What-If mode testing  
**Filter Type:** Mode toggle with meta-tag exclusion

```javascript
function toggleWhatIfMode() {
  whatIfMode = !whatIfMode;

  const btn = document.getElementById('whatIfToggleBtn');
  if (btn) {
    btn.classList.toggle('active', whatIfMode);
    btn.textContent = whatIfMode ? '✓ What If On' : '🔍 What If';
  }

  if (whatIfMode) {
    showWhatIfPanel();
  } else {
    // Clear What If state
    disabledTags.clear();
    updateHash({ without: '' });
    const panel = document.getElementById('whatIfPanel');
    if (panel) {
      panel.remove();
    }
    if (currentData) {
      if (isSmartOrdering()) {
        const applyWhatIfReset = () => {
          isFilterOperation = true;
          renderPreviews(currentData);
          setTimeout(() => { isFilterOperation = false; }, 0);
        };
        queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
        return;
      }

      isFilterOperation = true;
      renderPreviews(currentData);
      setTimeout(() => { isFilterOperation = false; }, 0);
    }
  }
}
```

**Context:** What-If mode toggle button handler (line 8334)  
**Purpose:** Toggle mode for testing platform behavior with specific meta tags disabled  
**Filter Relationship:** Manages meta-tag filter state (disabledTags set)  
**Guard Pattern:** Smart ordering aware - queues operations when active  
**Order Impact:** DOES reset order when disabling mode (reverts to full tag set)

---

### 7. applyWhatIfChanges

**Line:** 8241-8265  
**Module:** What-If mode application  
**Filter Type:** Conditional meta-tag filtering

```javascript
function applyWhatIfChanges() {
  if (!currentData) return;

  // Create modified meta with disabled tags removed
  const modifiedMeta = { ...currentData.meta };

  disabledTags.forEach(tag => {
    const parts = tag.split('.');
    if (parts.length === 1) {
      delete modifiedMeta[tag];
    } else {
      const [namespace, key] = parts;
      if (modifiedMeta[namespace]) {
        const temp = { ...modifiedMeta[namespace] };
        delete temp[key];
        modifiedMeta[namespace] = Object.keys(temp).length > 0 ? temp : undefined;
      }
    }
  });

  // Re-render with modified data
  const modifiedData = { ...currentData, meta: modifiedMeta };
  isFilterOperation = true;
  renderPreviews(modifiedData);
  setTimeout(() => { isFilterOperation = false; }, 0);

  // Accessibility announcement
  const tagCount = disabledTags.size;
  announce(`What If mode applied. ${tagCount} tag${tagCount > 1 ? 's' : ''} disabled. Preview cards updated to show fallback behavior.`);

  showMissingTagWarnings(modifiedMeta);
  closeWhatIfPanel();
  updateHash();

  showToast('Previews updated with What If changes', 2000);
}
```

**Context:** What-If apply button handler (line 8220)  
**Purpose:** Apply meta-tag exclusions and re-render previews with filtered data  
**Filter Relationship:** Creates filtered copy of metadata, excludes disabled tags  
**Operation:** Deep-copy modification of metadata structure  
**Order Impact:** DOES reset order (applies to modified data)

---

## Smart Ordering Coordination

### 8. shouldDeferFilterOperation

**Line:** 7891-7893  
**Module:** Guard system  
**Filter Type:** Coordination check

```javascript
function shouldDeferFilterOperation() {
  return isSmartOrderingActive;
}
```

**Context:** Called by filter operations to determine execution strategy  
**Purpose:** Check if filter operation should be deferred/queued  
**Filter Relationship:** Prevents filter operations from interrupting smart ordering  
**Pattern:** Simple state predicate

---

### 9. isSmartOrdering

**Line:** 7933-7935  
**Module:** Guard system  
**Filter Type:** State check

```javascript
function isSmartOrdering() {
  return platformPrefs.smartOrdering && isSmartOrderingActive;
}
```

**Context:** Used throughout filter operation routing logic  
**Purpose:** Check if smart ordering is both enabled and active  
**Filter Relationship:** Dual condition check (preference + runtime state)  
**Usage Lines:** 7888, 7978, 8087, 8142

---

### 10. queueFilterOperation

**Line:** 7942-7947  
**Module:** Guard system  
**Filter Type:** Operation queue manager

```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Context:** Called when filter operations need to be deferred  
**Purpose:** Queue filter operation for later execution after smart ordering completes  
**Filter Relationship:** Enables non-conflicting filter operation scheduling  
**Pattern:** Operation wrapper + debug logging

---

### 11. processPendingFilterOperations

**Line:** 7952-7975  
**Module:** Guard system  
**Filter Type:** Queue processor

```javascript
function processPendingFilterOperations() {
  if (pendingFilterOperations.length === 0) {
    return;
  }

  if (DEBUG_SMART_ORDERING) {
    console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
  }

  const operations = pendingFilterOperations.slice();
  pendingFilterOperations = [];

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

**Context:** Called after smart ordering completes (line 8794)  
**Purpose:** Execute queued filter operations in sequence  
**Filter Relationship:** Deferred execution pattern for filter operations  
**Pattern:** Copy-on-read to prevent queue modification during iteration

---

## Specialized UI Filters

### 12. updateEnabledPlatforms

**Line:** 3551-3561  
**Module:** Cropper tool  
**Filter Type:** Platform set management

```javascript
function updateEnabledPlatforms() {
  cropperState.enabledPlatforms.clear();
  document.querySelectorAll('.cropper-platform-toggle input:checked').forEach(cb => {
    cropperState.enabledPlatforms.add(cb.dataset.platform);
  });
  // Refresh category legend to track toggle selection
  renderCategoryLegend();
}
```

**Context:** Called from cropper toggle change handlers  
**Purpose:** Update set of enabled platforms for cropper overlay  
**Filter Relationship:** Manages platform filter state for cropper tool  
**Pattern:** DOM query → state update → UI refresh

---

### 13. updateCropperOverlay

**Line:** 3600-3676  
**Module:** Cropper tool  
**Filter Type:** Visual filter representation

```javascript
function updateCropperOverlay() {
  const imgW = cropperState.imageNaturalWidth;
  const imgH = cropperState.imageNaturalHeight;
  if (!imgW || !imgH) return;

  const svg = cropperOverlay;
  svg.setAttribute('viewBox', `0 0 ${imgW} ${imgH}`);
  svg.innerHTML = '';

  // Calculate crop rectangles for enabled platforms
  const crops = [];
  const enabledPids = Array.from(cropperState.enabledPlatforms);

  enabledPids.forEach(pid => {
    const crop = PLATFORM_CROPS[pid];
    if (!crop) return;

    const rect = calculateCropRect(crop, imgW, imgH);
    if (rect) {
      crops.push({ pid, rect, color: CATEGORY_COLORS[crop.category] });
    }
  });

  // Calculate safe zone (intersection)
  const safeZone = calculateSafeZone(
    enabledPids.map(pid => PLATFORM_CROPS[pid]).filter(Boolean),
    imgW,
    imgH
  );

  // Draw platform crops (semi-transparent)
  crops.forEach(({ rect, color }) => {
    const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectEl.setAttribute('x', rect.x);
    rectEl.setAttribute('y', rect.y);
    rectEl.setAttribute('width', rect.w);
    rectEl.setAttribute('height', rect.h);
    rectEl.setAttribute('fill', color);
    rectEl.setAttribute('fill-opacity', '0.15');
    rectEl.setAttribute('stroke', color);
    rectEl.setAttribute('stroke-width', '2');
    rectEl.setAttribute('stroke-dasharray', '8,4');
    svg.appendChild(rectEl);
  });

  // Draw safe zone
  if (enabledPids.length > 0 && safeZone.w > 0 && safeZone.h > 0) {
    const safeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    safeRect.setAttribute('x', safeZone.x);
    safeRect.setAttribute('y', safeZone.y);
    safeRect.setAttribute('width', safeZone.w);
    safeRect.setAttribute('height', safeZone.h);
    safeRect.setAttribute('fill', 'none');
    safeRect.setAttribute('stroke', SAFE_ZONE_COLOR);
    safeRect.setAttribute('stroke-width', '4');
    safeRect.setAttribute('stroke-dasharray', '12,6');
    safeRect.classList.add('safe-zone-rect');
    svg.appendChild(safeRect);

    const safePct = (safeZone.coverage * 100).toFixed(1);
    safeZoneInfo.innerHTML = `
      <div class="info-row"><span class="info-label">Safe Zone:</span> <span class="info-value">${Math.round(safeZone.w)} × ${Math.round(safeZone.h)} px</span></div>
      <div class="info-row"><span class="info-label">Coverage:</span> <span class="info-value">${safePct}% of image</span></div>
      <div class="info-row"><span class="info-label">Platforms:</span> <span class="info-value">${enabledPids.length} selected</span></div>
    `;
  } else {
    safeZoneInfo.innerHTML = '<div class="info-row">Select platforms to see safe zone</div>';
  }

  cropperBadge.textContent = enabledPids.length;
}
```

**Context:** Called after platform toggles change  
**Purpose:** Visual representation of filtered platform crops on cropper tool  
**Filter Relationship:** Renders visual overlay based on enabled platform filter  
**Pattern:** State → SVG rendering calculation

---

### 14. handleHeatmapSort

**Line:** 6101-6123  
**Module:** Heatmap view  
**Filter Type:** Sorting (reordering, not filtering)

```javascript
function handleHeatmapSort() {
  if (!heatmapSort || !sitemapResults.length) return;

  const sortBy = heatmapSort.value;
  let sorted = [...sitemapResults];

  switch (sortBy) {
    case 'score-asc':
      sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      break;
    case 'url-asc':
      sorted.sort((a, b) => a.url.localeCompare(b.url));
      break;
    case 'url-desc':
      sorted.sort((a, b) => b.url.localeCompare(a.url));
      break;
  }

  renderHeatmapTable(sorted);
}
```

**Context:** Heatmap sort dropdown change handler  
**Purpose:** Sort heatmap results by score or URL  
**Filter Relationship:** Reordering operation (not technically filtering)  
**Pattern:** Switch-based sort strategy

---

### 15. updateBadgePreview

**Line:** 4765-4786  
**Module:** Badge generator  
**Filter Type:** Visual update (not filtering)

```javascript
function updateBadgePreview() {
  if (!currentData) return;

  const score = currentData.scoring.overall.score;
  const platforms = Object.keys(currentData.scoring.scores).length;
  const style = badgeStyleSelect?.value || 'flat';

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const badgeUrl = `${baseUrl}/api/badge?score=${score}&platforms=${platforms}&style=${style}`;

  badgePreview.innerHTML = `<img src="${badgeUrl}" alt="Platform Score Badge" />`;

  const embedCode = `<a href="${baseUrl}/api/badge?score=${score}&platforms=${platforms}&style=${style}">
    <img src="${badgeUrl}" alt="Platform Score Badge" />
  </a>`;
  badgeEmbedCode.value = embedCode;
  badgeDirectUrl.value = badgeUrl;
}
```

**Context:** Badge style select change handler (line 296)  
**Purpose:** Update badge preview image and embed codes  
**Filter Relationship:** Not a filter - visual update based on current state  
**Pattern:** State read → URL generation → DOM update

---

### 16. handleBgTypeChange

**Line:** 5106-5115  
**Module:** OG generator  
**Filter Type:** UI state management

```javascript
function handleBgTypeChange() {
  oggenState.bgType = oggenBgType.value;

  oggenBgColorRow.classList.toggle('hidden', oggenState.bgType !== 'solid');
  oggenBgGradientRow.classList.toggle('hidden', oggenState.bgType !== 'gradient');
  oggenBgImageRow.classList.toggle('hidden', oggenState.bgType !== 'image');

  updateOggenCanvas();
}
```

**Context:** OG generator background type select handler (line 310)  
**Purpose:** Toggle background control visibility and redraw canvas  
**Filter Relationship:** Not a filter - UI mode switching  
**Pattern:** State update → conditional visibility → canvas refresh

---

### 17. handleLogoPosChange

**Line:** 5133-5138  
**Module:** OG generator  
**Filter Type:** UI state management

```javascript
function handleLogoPosChange() {
  oggenState.logoPos = oggenLogoPos.value;
  const showUpload = oggenState.logoPos !== 'none';
  oggenLogoUploadRow.classList.toggle('hidden', !showUpload);
  updateOggenCanvas();
}
```

**Context:** OG generator logo position select handler (line 321)  
**Purpose:** Toggle logo upload control visibility and redraw canvas  
**Filter Relationship:** Not a filter - UI mode switching  
**Pattern:** Conditional visibility control

---

### 18. updateOggenCanvas

**Line:** 5156-5174  
**Module:** OG generator  
**Filter Type:** Canvas rendering

```javascript
function updateOggenCanvas() {
  if (!oggenCanvas) return;

  const ctx = oggenCanvas.getContext('2d');
  const width = 1200;
  const height = 630;

  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, width, height);
  drawContent(ctx, width, height);
  drawLogo(ctx, width, height);
}
```

**Context:** Called from OG generator control change handlers  
**Purpose:** Redraw OG image canvas with current settings  
**Filter Relationship:** Not a filter - rendering operation  
**Pattern:** Layer composition rendering

---

## Patterns and Architecture

### Guard Flag Pattern

```javascript
// Set guard flag
isFilterOperation = true;
renderPreviews(currentData);
setTimeout(() => { isFilterOperation = false; }, 0);
```

**Purpose:** Prevent smart ordering from resetting during filter operations  
**Usage Lines:** 8080, 8096, 8144, 8156, 8263  
**Check Points:** Lines 8792, 8794 in `applySmartOrdering()`

---

### Queue Pattern

```javascript
if (isSmartOrdering()) {
  const operation = () => {
    isFilterOperation = true;
    renderPreviews(currentData);
    setTimeout(() => { isFilterOperation = false; }, 0);
  };
  queueFilterOperation(operation, 'description');
  return;
}
// Otherwise execute immediately
```

**Purpose:** Defer filter operations during active smart ordering  
**Used By:** `importPreferences()`, `toggleWhatIfMode()`

---

### Wrapper Functions

**guardWrapper(fn)**  
- Used for operations that don't trigger full re-render
- Example: `toggleFavorite()` - favorite-only change
- Provides smart ordering protection without layout reset

**guardWrapperWithRender(fn)**  
- Used for operations that require full re-render
- Example: `toggleHidden()` - visibility change
- Combines guard protection with automatic render call

---

### State Modification Pattern

Most filter operations follow this pattern:

```javascript
function filterOperation(...) {
  // 1. Guard wrapper (if needed)
  guardWrapper('operationName', () => {
    // 2. Modify state
    state.set.add(value);
    
    // 3. Persist state
    saveState();
    
    // 4. Update dependent UI
    updateUI();
    
    // 5. Optional: render if visibility changed
    if (needsRender) {
      renderPreviews(currentData);
    }
    
    // 6. Clear smart ordering flag (manual override)
    isSmartOrderingActive = false;
  });
}
```

---

## Filter Operation Flow

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

---

## Category Summary

| Category | Hooks | Purpose |
|----------|-------|---------|
| **Pure Filter Functions** | 2 | `renderMetadataTable()`, `filterCommands()` |
| **Platform Visibility** | 3 | `toggleFavorite()`, `toggleHidden()`, `importPreferences()` |
| **Meta-Tag Filtering** | 2 | `toggleWhatIfMode()`, `applyWhatIfChanges()` |
| **Coordination System** | 4 | Guard flags, queue functions, status checks |
| **Specialized UI** | 7 | Cropper, OG generator, heatmap, badge tools |

---

## Key Insights

1. **Filter operations are protected**: Most filter ops use guard patterns to prevent smart ordering conflicts
2. **State is persistent**: Filter state (favorites, hidden) is saved to `platformPrefs`
3. **UI updates are cascading**: Filter operations trigger dependent UI updates
4. **Smart ordering awareness**: All filter operations check smart ordering state
5. **Debug visibility**: Extensive debug logging for troubleshooting filter operations

---

*End of comprehensive filter-related hooks documentation*