# Batch Processing and Chunking Logic in app.js

## Overview
This document catalogs all batch processing and chunking patterns found in `/home/coding/vista/src/public/app.js` related to filter queues and platform processing.

---

## 1. Filter Operation Queue Pattern

**Location:** Lines 6763, 8424-8457

### Queue Implementation
```javascript
let pendingFilterOperations = []; // Line 6763
```

### Batch Enqueue Operation
**Function:** `queueFilterOperation(operation, description)` - Line 8424
```javascript
function queueFilterOperation(operation, description) {
  if (DEBUG_SMART_ORDERING) {
    console.log(`[queueFilterOperation] Queuing: ${description}`);
  }
  pendingFilterOperations.push({ operation, description });
}
```

**Usage Examples:**
- Line 8570: `queueFilterOperation(applyImportedPrefs, 'importPreferences')`
- Line 8630: `queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode')`

### Batch Dequeue and Process
**Function:** `processPendingFilterOperations()` - Lines 8434-8457
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

**Pattern:**
- **Batch size:** Variable (all queued operations processed at once)
- **Chunking method:** Array copy via `.slice()` before iteration
- **Processing method:** `.forEach()` with try-catch error handling
- **Safety:** Array copy prevents modification-during-iteration issues
- **Queue clearing:** After copy, original array is cleared to prevent re-processing

---

## 2. Hierarchical Group-Based Platform Processing

**Pattern:** Iterate over groups → Iterate over platforms within each group

### Batch Rendering - Skeletons
**Location:** Lines 1694-1728
```javascript
PLATFORM_GROUPS.forEach((group) => {
  // Create group element
  const groupEl = document.createElement('div');
  groupEl.className = 'platform-group' + (group.collapsed ? ' collapsed' : '');

  // Process all platforms in this group
  platforms.forEach((pid, i) => {
    const card = document.createElement('div');
    card.className = `platform-skeleton-card`;
    card.dataset.pid = pid;
    // ...
  });
});
```

### Batch Rendering - Content Cards
**Location:** Lines 1782-1869
```javascript
PLATFORM_GROUPS.forEach((group, gi) => {
  // Create group structure
  let platforms = group.platforms;

  // Process all platforms in this group
  platforms.forEach((pid, i) => {
    const scoreData = data.scoring.scores[pid];
    if (!scoreData) return;
    const animDelay = prefersReducedMotion() ? 0 : globalIndex * 50;
    const card = buildCard(pid, scoreData, data, animDelay, group.id);
    row.appendChild(card);
    globalIndex++;
  });
});
```

### Batch Rendering - Text-Only Crossfade
**Location:** Lines 1981-2049
```javascript
PLATFORM_GROUPS.forEach((group, gi) => {
  let platforms = group.platforms;

  platforms.forEach((pid, i) => {
    const scoreData = data.scoring.scores[pid];
    if (!scoreData) return;
    // Crossfade logic...
  });
});
```

### Batch Image Updates
**Location:** Lines 2208-2218
```javascript
PLATFORM_GROUPS.forEach((group) => {
  group.platforms.forEach((pid) => {
    const existingCard = document.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (!existingCard) return;

    applyImagesToCard(pid, data, group.id);
    existingCard.addEventListener('contextmenu', (e) => showCardContextMenu(e, pid, group.id, data));
  });
});
```

### Smart Ordering Reordering
**Location:** Lines 9175-9185
```javascript
PLATFORM_GROUPS.forEach((group) => {
  if (!platformPrefs.cardOrder[group.id]) {
    return;
  }

  const groupEl = document.getElementById('group-' + group.id);
  if (!groupEl) {
    return;
  }

  // Reorder cards within this group
  const newRow = document.createElement('div');
  newRow.className = 'cards-row';
  newRow.dataset.groupId = group.id;

  platformPrefs.cardOrder[group.id].forEach((pid, idx) => {
    const existingCard = row.querySelector(`.platform-card[data-pid="${pid}"]`);
    if (existingCard) {
      newRow.appendChild(existingCard);
    }
  });
});
```

**Pattern:**
- **Batch size:** One group at a time (hierarchical)
- **Chunking method:** Group-based (groups contain platform arrays)
- **Processing method:** Nested `.forEach()` (outer: groups, inner: platforms)
- **Global index tracking:** Some operations use `globalIndex` for staggered animations

---

## 3. Display-Limited Chunks (UI Pagination)

### Issue Display Limiting
**Locations:** Lines 2170, 2293

```javascript
// Line 2170 - renderPreviewCard
scoreData.issues.slice(0, 3).forEach(issue => {
  const div = document.createElement('div');
  div.className = 'card-issue';
  const isError = scoreData.grade === 'D' || scoreData.grade === 'F';
  div.innerHTML = `<span class="${isError ? 'issue-icon-err' : 'issue-icon-warn'}">${isError ? '✗' : '⚠'}</span><span>${escHtml(issue)}</span>`;
  footer.appendChild(div);
});

// Line 2293 - buildCard
scoreData.issues.slice(0, 3).forEach(issue => {
  // Same pattern as above
});
```

**Pattern:**
- **Batch size:** Fixed chunk of 3 items maximum
- **Chunking method:** `.slice(0, 3)` - First 3 elements only
- **Purpose:** UI display limiting (not processing limiting)
- **Use case:** Prevents overcrowded card footers with too many issues

---

## 4. Aggregate Processing (Statistics and Gauges)

### Character Limit Compliance Calculation
**Location:** Lines 6921-6931
```javascript
PLATFORM_GROUPS.forEach(group => {
  group.platforms.forEach(pid => {
    const limits = PLATFORM_CHAR_LIMITS[pid];
    if (!limits) return;
    totalCount++;
    const limit = limits[fieldKey];
    if (textLen <= limit * 0.8) okCount++;
    else if (textLen <= limit) warnCount++;
    else overCount++;
  });
});
```

### Character Gauge Group Rendering
**Location:** Lines 6948-6971
```javascript
PLATFORM_GROUPS.forEach(group => {
  html += `<div class="char-gauge-group ${group.collapsed ? 'collapsed' : ''}" data-group="${group.id}">`;

  // Calculate group statistics
  let gOk = 0, gWarn = 0, gOver = 0, gTotal = 0;
  group.platforms.forEach(pid => {
    const limits = PLATFORM_CHAR_LIMITS[pid];
    if (!limits) return;
    gTotal++;
    const limit = limits[fieldKey];
    if (textLen <= limit * 0.8) gOk++;
    else if (textLen <= limit) gWarn++;
    else gOver++;
  });

  // Render platform gauges
  group.platforms.forEach(pid => {
    const limits = PLATFORM_CHAR_LIMITS[pid];
    if (!limits) return;
    // Gauge HTML generation...
  });
});
```

**Pattern:**
- **Batch size:** All platforms across all groups
- **Chunking method:** None (processes entire dataset)
- **Processing method:** Nested `.forEach()` for aggregation
- **Purpose:** Statistics calculation and gauge rendering

---

## 5. Smart Ordering Batch Operations

### Page Type Change Detection
**Location:** Lines 9284-9294
```javascript
PLATFORM_GROUPS.forEach((group) => {
  const metadata = platformPrefs.cardOrderMetadata?.[group.id];
  if (!metadata || !metadata.userModified || metadata.modifiedBy !== 'user-drag') {
    delete platformPrefs.cardOrder[group.id];
    if (platformPrefs.cardOrderMetadata && platformPrefs.cardOrderMetadata[group.id]) {
      delete platformPrefs.cardOrderMetadata[group.id];
    }
    if (DEBUG_SMART_ORDERING) {
      console.log(`[applySmartOrdering] Cleared cardOrder for ${group.id} (not user-modified)`);
    }
  }
});
```

### Smart Ordering Computation
**Location:** Lines 9311-9391
```javascript
PLATFORM_GROUPS.forEach((group, groupIndex) => {
  console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}" [${group.id}]:`);
  console.log('[applySmartOrdering]   Platform order BEFORE:', group.platforms);

  // Log computed scores for each platform in this group
  group.platforms.forEach(pid => {
    const scoreData = currentData?.scoring?.scores?.[pid];
    if (scoreData) {
      console.log(`[applySmartOrdering]   - ${pid}:`, {
        score: scoreData.score,
        grade: scoreData.grade,
        // ...
      });
    }
  });
});
```

### Smart Ordering Application
**Location:** Lines 9346-9391
```javascript
PLATFORM_GROUPS.forEach((group, groupIndex) => {
  const originalOrder = [...group.platforms];

  // P0 - Drag Override Race fix: Skip groups that were manually reordered by user
  const metadata = platformPrefs.cardOrderMetadata[group.id];
  if (metadata && metadata.userModified && metadata.modifiedBy === 'user-drag') {
    if (DEBUG_SMART_ORDERING) {
      console.log(`[applySmartOrdering] Group ${groupIndex} "${group.title}" - skipping (user-modified via drag)`);
    }
    return; // Skip smart ordering for this group
  }

  // Apply smart ordering algorithm to platforms in this group
  // (complex sorting logic here)
});
```

**Pattern:**
- **Batch size:** All groups processed in sequence
- **Chunking method:** Group-level isolation (each group processed independently)
- **Processing method:** Nested `.forEach()` with complex conditional logic
- **Purpose:** Intelligent card reordering based on scoring and page type

---

## 6. Cropper UI Batch Processing

### Cropper Group Rendering
**Location:** Lines 3878-3898
```javascript
groups.forEach(group => {
  const color = CATEGORY_COLORS[group.id];
  html += `<div class="cropper-group" style="--group-color:${color}">`;

  // Render group header
  html += `<div class="cropper-group-header">`;
  html += `<input type="checkbox" class="cropper-group-toggle" data-group="${group.id}" />`;
  html += `<span class="cropper-group-title">${escHtml(group.label)}</span>`;
  html += `<span class="cropper-group-count">${group.platforms.length}</span>`;
  html += '</div>';

  // Render platform toggles
  html += '<div class="cropper-group-platforms">';
  group.platforms.forEach(pid => {
    const crop = PLATFORM_CROPS[pid];
    if (!crop) return;
    const pct = calculateVisiblePercentage(crop, cropperState.imageNaturalWidth, cropperState.imageNaturalHeight);
    html += `<label class="cropper-platform-toggle">`;
    html += `<input type="checkbox" data-platform="${pid}" checked />`;
    html += `<span class="platform-checkbox" style="border-color:${color}"></span>`;
    html += `<span class="platform-name">${escHtml(PLATFORM_NAMES[pid] || pid)}</span>`;
    html += `<span class="platform-pct">${pct}%</span>`;
    html += `</label>`;
  });
});
```

### Group Toggle Synchronization
**Location:** Lines 3908-3920
```javascript
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

**Pattern:**
- **Batch size:** Variable (all groups, then all platforms per group)
- **Chunking method:** Hierarchical (groups → platforms)
- **Processing method:** Nested `.forEach()` with DOM manipulation
- **Purpose:** Batch UI updates for cropper controls

---

## Summary of Batch/Chunking Patterns

| Pattern | Batch Size | Chunking Method | Processing Method | Line Numbers |
|---------|------------|-----------------|-------------------|--------------|
| Filter Operation Queue | Variable (all queued) | Array `.slice()` copy | `.forEach()` with try-catch | 8424-8457 |
| Display Issue Limiting | Fixed: 3 items | `.slice(0, 3)` | `.forEach()` | 2170, 2293 |
| Group-Based Platform Processing | 1 group at a time | Hierarchical (groups → platforms) | Nested `.forEach()` | 1694+, 1782+, 1981+, 2208+ |
| Smart Ordering | All groups in sequence | Group-level isolation | Nested `.forEach()` with conditionals | 9175+, 9284+, 9311+, 9346+ |
| Character Gauge Statistics | All platforms | No chunking (full dataset) | Nested `.forEach()` aggregation | 6921-6931, 6948-6971 |
| Cropper UI Updates | All platforms per group | Group-level batches | Nested `.forEach()` DOM manipulation | 3878-3898, 3908-3920 |

---

## Key Observations

1. **No explicit batch size configuration:** Most patterns process entire datasets without size limits
2. **Hierarchical processing is dominant:** Platform operations are almost always grouped by `PLATFORM_GROUPS`
3. **Display-only limiting:** Only one instance of chunking for display purposes (3 issues max)
4. **Queue-based batching:** Filter operations use a queue to batch operations during smart ordering
5. **Safety pattern:** Array copying via `.slice()` before iteration prevents modification-during-iteration bugs
6. **No parallel/async batching:** All processing is synchronous, no `Promise.all()` or parallel batching patterns

---

## Configuration Points

- **No global batch size configuration found**
- **Display chunk size:** Hardcoded as `3` (lines 2170, 2293)
- **Queue-based batching:** Dynamic based on number of queued operations
- **Group-based chunking:** Determined by `PLATFORM_GROUPS` structure (external configuration)

---

## Related Files

- **Source:** `/home/coding/vista/src/public/app.js`
- **Platform Groups Configuration:** Loaded from global `PLATFORM_GROUPS` object
- **Platform Character Limits:** Loaded from global `PLATFORM_CHAR_LIMITS` object
- **Debug Logging:** Controlled by `DEBUG_SMART_ORDERING` flag (line 74)

---

*Generated: 2026-08-24*
*Task: vista-21ac1e31 - Document batch processing and chunking logic*
