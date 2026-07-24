# Filter-Related Hooks Code Snippets

**Generated:** 2026-07-24
**Source:** src/public/app.js
**Task:** bf-1z0yu

**Total handlers extracted:** 18

## Cropper Functions

### updateEnabledPlatforms

**Line:** 3551
**Lines of code:** 11

```javascript
3551 | function updateEnabledPlatforms() {
3552 |   cropperState.enabledPlatforms.clear();
3553 |   document.querySelectorAll('.cropper-platform-toggle input:checked').forEach(cb => {
3554 |     cropperState.enabledPlatforms.add(cb.dataset.platform);
3555 |   });
3556 |   // Refresh the category legend so its active/dimmed state tracks the live
3557 |   // toggle selection. Every toggle path (individual, group, select/clear-all)
3558 |   // and the initial renderCropperControls() call funnels through here, so this
3559 |   // single hook keeps the legend in sync with the overlays on screen.
3560 |   renderCategoryLegend();
3561 | }
```

---

### updateCropperOverlay

**Line:** 3600
**Lines of code:** 77

```javascript
3600 | function updateCropperOverlay() {
3601 |   const imgW = cropperState.imageNaturalWidth;
3602 |   const imgH = cropperState.imageNaturalHeight;
3603 |   if (!imgW || !imgH) return;
3604 | 
3605 |   const svg = cropperOverlay;
3606 |   svg.setAttribute('viewBox', `0 0 ${imgW} ${imgH}`);
3607 |   svg.innerHTML = '';
3608 | 
3609 |   // Calculate all crop rectangles
3610 |   const crops = [];
3611 |   const enabledPids = Array.from(cropperState.enabledPlatforms);
3612 | 
3613 |   enabledPids.forEach(pid => {
3614 |     const crop = PLATFORM_CROPS[pid];
3615 |     if (!crop) return;
3616 | 
3617 |     const rect = calculateCropRect(crop, imgW, imgH);
3618 |     if (rect) {
3619 |       crops.push({ pid, rect, color: CATEGORY_COLORS[crop.category] });
3620 |     }
3621 |   });
3622 | 
3623 |   // Find the safe zone (intersection of all enabled crop rects).
3624 |   const safeZone = calculateSafeZone(
3625 |     enabledPids.map(pid => PLATFORM_CROPS[pid]).filter(Boolean),
3626 |     imgW,
3627 |     imgH
3628 |   );
3629 | 
3630 |   // Draw all platform crops (semi-transparent)
3631 |   crops.forEach(({ rect, color }) => {
3632 |     const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
3633 |     rectEl.setAttribute('x', rect.x);
3634 |     rectEl.setAttribute('y', rect.y);
3635 |     rectEl.setAttribute('width', rect.w);
3636 |     rectEl.setAttribute('height', rect.h);
3637 |     rectEl.setAttribute('fill', color);
3638 |     rectEl.setAttribute('fill-opacity', '0.15');
3639 |     rectEl.setAttribute('stroke', color);
3640 |     rectEl.setAttribute('stroke-width', '2');
3641 |     rectEl.setAttribute('stroke-dasharray', '8,4');
3642 |     svg.appendChild(rectEl);
3643 |   });
3644 | 
3645 |   // Draw safe zone (intersection of all) as a single distinct accent rect. The
3646 |   // color is cyan (SAFE_ZONE_COLOR) — unused by any platform category — so the
3647 |   // intersection can't be mistaken for one platform's crop. A dark drop-shadow
3648 |   // halo (set via the .safe-zone-rect CSS rule) keeps the dashed line visible on
3649 |   // both light and dark OG images without adding a second <rect>.
3650 |   if (enabledPids.length > 0 && safeZone.w > 0 && safeZone.h > 0) {
3651 |     const safeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
3652 |     safeRect.setAttribute('x', safeZone.x);
3653 |     safeRect.setAttribute('y', safeZone.y);
3654 |     safeRect.setAttribute('width', safeZone.w);
3655 |     safeRect.setAttribute('height', safeZone.h);
3656 |     safeRect.setAttribute('fill', 'none');
3657 |     safeRect.setAttribute('stroke', SAFE_ZONE_COLOR);
3658 |     safeRect.setAttribute('stroke-width', '4');
3659 |     safeRect.setAttribute('stroke-dasharray', '12,6');
3660 |     safeRect.classList.add('safe-zone-rect');
3661 |     svg.appendChild(safeRect);
3662 | 
3663 |     // Safe zone label
3664 |     const safePct = (safeZone.coverage * 100).toFixed(1);
3665 |     safeZoneInfo.innerHTML = `
3666 |       <div class="info-row"><span class="info-label">Safe Zone:</span> <span class="info-value">${Math.round(safeZone.w)} × ${Math.round(safeZone.h)} px</span></div>
3667 |       <div class="info-row"><span class="info-label">Coverage:</span> <span class="info-value">${safePct}% of image</span></div>
3668 |       <div class="info-row"><span class="info-label">Platforms:</span> <span class="info-value">${enabledPids.length} selected</span></div>
3669 |     `;
3670 |   } else {
3671 |     safeZoneInfo.innerHTML = '<div class="info-row">Select platforms to see safe zone</div>';
3672 |   }
3673 | 
3674 |   // Update cropper badge count
3675 |   cropperBadge.textContent = enabledPids.length;
3676 | }
```

---

## Guard System Functions

### shouldDeferFilterOperation

**Line:** 7891
**Lines of code:** 3

```javascript
7891 | function shouldDeferFilterOperation() {
7892 |   return isSmartOrderingActive;
7893 | }
```

---

### isSmartOrdering

**Line:** 7933
**Lines of code:** 3

```javascript
7933 | function isSmartOrdering() {
7934 |   return platformPrefs.smartOrdering && isSmartOrderingActive;
7935 | }
```

---

### queueFilterOperation

**Line:** 7942
**Lines of code:** 6

```javascript
7942 | function queueFilterOperation(operation, description) {
7943 |   if (DEBUG_SMART_ORDERING) {
7944 |     console.log(`[queueFilterOperation] Queuing: ${description}`);
7945 |   }
7946 |   pendingFilterOperations.push({ operation, description });
7947 | }
```

---

### processPendingFilterOperations

**Line:** 7952
**Lines of code:** 24

```javascript
7952 | function processPendingFilterOperations() {
7953 |   if (pendingFilterOperations.length === 0) {
7954 |     return;
7955 |   }
7956 | 
7957 |   if (DEBUG_SMART_ORDERING) {
7958 |     console.log(`[processPendingFilterOperations] Processing ${pendingFilterOperations.length} pending operations`);
7959 |   }
7960 | 
7961 |   // Process each pending operation
7962 |   const operations = pendingFilterOperations.slice(); // Copy array to avoid modification during iteration
7963 |   pendingFilterOperations = []; // Clear queue
7964 | 
7965 |   operations.forEach(({ operation, description }) => {
7966 |     try {
7967 |       if (DEBUG_SMART_ORDERING) {
7968 |         console.log(`[processPendingFilterOperations] Executing: ${description}`);
7969 |       }
7970 |       operation();
7971 |     } catch (error) {
7972 |       console.error(`[processPendingFilterOperations] Error executing: ${description}`, error);
7973 |     }
7974 |   });
7975 | }
```

---

## Non-Order-Reset Handlers

### renderMetadataTable

**Line:** 3941
**Lines of code:** 55

```javascript
3941 | function renderMetadataTable(filter = '') {
3942 |   const filteredRows = filter
3943 |     ? allMetadataRows.filter(r =>
3944 |         r.tag.toLowerCase().includes(filter.toLowerCase()) ||
3945 |         (r.value && String(r.value).toLowerCase().includes(filter.toLowerCase()))
3946 |       )
3947 |     : allMetadataRows;
3948 | 
3949 |   let html = `<div class="metadata-viewer">
3950 |     <div class="metadata-toolbar">
3951 |       <div class="metadata-filter">
3952 |         <input type="text" id="metadataFilterInput" placeholder="Filter tags..." value="${escHtml(filter)}" />
3953 |         <span class="filter-count">${filteredRows.length} of ${allMetadataRows.length} tags</span>
3954 |       </div>
3955 |       <div class="metadata-actions">
3956 |         <button class="action-btn" onclick="exportMetadataAsJson()">&#128190; Export JSON</button>
3957 |         <button class="action-btn" onclick="exportMetadataAsCsv()">&#128190; Export CSV</button>
3958 |       </div>
3959 |     </div>
3960 |     <div class="metadata-table-wrapper">
3961 |       <table class="metadata-table">
3962 |         <thead>
3963 |           <tr>
3964 |             <th class="col-tag">Tag Name</th>
3965 |             <th class="col-value">Value</th>
3966 |             <th class="col-source">Source</th>
3967 |             <th class="col-copy"></th>
3968 |           </tr>
3969 |         </thead>
3970 |         <tbody>
3971 |           ${filteredRows.length > 0 ? filteredRows.map((row, idx) => renderMetadataRow(row, idx)).join('') : '<tr><td colspan="4" class="no-results">No tags match your filter</td></tr>'}
3972 |         </tbody>
3973 |       </table>
3974 |     </div>`;
3975 | 
3976 |   // Add JSON-LD section at bottom if present
3977 |   const hasJsonLd = allMetadataRows.some(r => r.tag.startsWith('json-ld'));
3978 |   if (hasJsonLd && !filter) {
3979 |     html += `<div class="raw-section">
3980 |       <h3>JSON-LD Structured Data</h3>
3981 |       ${currentData?.meta?.jsonLd?.map(j => `<pre class="jsonld-block">${escHtml(JSON.stringify(j, null, 2))}</pre>`).join('') || ''}
3982 |     </div>`;
3983 |   }
3984 | 
3985 |   html += '</div>';
3986 |   rawTagsPanel.innerHTML = html;
3987 | 
3988 |   // Attach filter listener
3989 |   const filterInput = document.getElementById('metadataFilterInput');
3990 |   if (filterInput) {
3991 |     filterInput.addEventListener('input', (e) => {
3992 |       renderMetadataTable(e.target.value);
3993 |     });
3994 |   }
3995 | }
```

---

### updateBadgePreview

**Line:** 4765
**Lines of code:** 22

```javascript
4765 | function updateBadgePreview() {
4766 |   if (!currentData) return;
4767 | 
4768 |   const score = currentData.scoring.overall.score;
4769 |   const platforms = Object.keys(currentData.scoring.scores).length;
4770 |   const style = badgeStyleSelect?.value || 'flat';
4771 | 
4772 |   const baseUrl = `${window.location.protocol}//${window.location.host}`;
4773 |   const badgeUrl = `${baseUrl}/api/badge?score=${score}&platforms=${platforms}&style=${style}`;
4774 | 
4775 |   // Update preview
4776 |   badgePreview.innerHTML = `<img src="${badgeUrl}" alt="Platform Score Badge" />`;
4777 | 
4778 |   // Update embed code
4779 |   const embedCode = `<a href="${baseUrl}/api/badge?score=${score}&platforms=${platforms}&style=${style}">
4780 |   <img src="${badgeUrl}" alt="Platform Score Badge" />
4781 | </a>`;
4782 |   badgeEmbedCode.value = embedCode;
4783 | 
4784 |   // Update direct URL
4785 |   badgeDirectUrl.value = badgeUrl;
4786 | }
```

---

### handleHeatmapSort

**Line:** 6101
**Lines of code:** 23

```javascript
6101 | function handleHeatmapSort() {
6102 |   if (!heatmapSort || !sitemapResults.length) return;
6103 | 
6104 |   const sortBy = heatmapSort.value;
6105 |   let sorted = [...sitemapResults];
6106 | 
6107 |   switch (sortBy) {
6108 |     case 'score-asc':
6109 |       sorted.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
6110 |       break;
6111 |     case 'score-desc':
6112 |       sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
6113 |       break;
6114 |     case 'url-asc':
6115 |       sorted.sort((a, b) => a.url.localeCompare(b.url));
6116 |       break;
6117 |     case 'url-desc':
6118 |       sorted.sort((a, b) => b.url.localeCompare(a.url));
6119 |       break;
6120 |   }
6121 | 
6122 |   renderHeatmapTable(sorted);
6123 | }
```

---

### toggleFavorite

**Line:** 7867
**Lines of code:** 17

```javascript
7867 | function toggleFavorite(pid) {
7868 |   guardWrapper('toggleFavorite', () => {
7869 |     if (platformPrefs.favorites.has(pid)) {
7870 |       platformPrefs.favorites.delete(pid);
7871 |     } else {
7872 |       platformPrefs.favorites.add(pid);
7873 |     }
7874 |     savePlatformPrefs();
7875 |     updateFavoritesList();
7876 | 
7877 |     // Clear smart ordering active flag since user manually modified favorites
7878 |     isSmartOrderingActive = false;
7879 |     if (DEBUG_SMART_ORDERING) {
7880 |       console.log('[toggleFavorite] Smart ordering active flag CLEARED (user manual override)');
7881 |     }
7882 |   });
7883 | }
```

---

### filterCommands

**Line:** 9177
**Lines of code:** 16

```javascript
9177 | function filterCommands(e) {
9178 |   const query = e.target.value.toLowerCase().trim();
9179 |   commandPaletteSelectedIndex = 0;
9180 | 
9181 |   if (!query) {
9182 |     renderCommands(COMMANDS);
9183 |     return;
9184 |   }
9185 | 
9186 |   const filtered = COMMANDS.filter(cmd =>
9187 |     cmd.label.toLowerCase().includes(query) ||
9188 |     cmd.category.toLowerCase().includes(query)
9189 |   );
9190 | 
9191 |   renderCommands(filtered);
9192 | }
```

---

## OG Generator Functions

### handleBgTypeChange

**Line:** 5106
**Lines of code:** 10

```javascript
5106 | function handleBgTypeChange() {
5107 |   oggenState.bgType = oggenBgType.value;
5108 | 
5109 |   // Toggle visibility of background controls
5110 |   oggenBgColorRow.classList.toggle('hidden', oggenState.bgType !== 'solid');
5111 |   oggenBgGradientRow.classList.toggle('hidden', oggenState.bgType !== 'gradient');
5112 |   oggenBgImageRow.classList.toggle('hidden', oggenState.bgType !== 'image');
5113 | 
5114 |   updateOggenCanvas();
5115 | }
```

---

### handleLogoPosChange

**Line:** 5133
**Lines of code:** 6

```javascript
5133 | function handleLogoPosChange() {
5134 |   oggenState.logoPos = oggenLogoPos.value;
5135 |   const showUpload = oggenState.logoPos !== 'none';
5136 |   oggenLogoUploadRow.classList.toggle('hidden', !showUpload);
5137 |   updateOggenCanvas();
5138 | }
```

---

### updateOggenCanvas

**Line:** 5156
**Lines of code:** 19

```javascript
5156 | function updateOggenCanvas() {
5157 |   if (!oggenCanvas) return;
5158 | 
5159 |   const ctx = oggenCanvas.getContext('2d');
5160 |   const width = 1200;
5161 |   const height = 630;
5162 | 
5163 |   // Clear canvas
5164 |   ctx.clearRect(0, 0, width, height);
5165 | 
5166 |   // Draw background
5167 |   drawBackground(ctx, width, height);
5168 | 
5169 |   // Draw content
5170 |   drawContent(ctx, width, height);
5171 | 
5172 |   // Draw logo
5173 |   drawLogo(ctx, width, height);
5174 | }
```

---

## Order-Reset Handlers

### toggleHidden

**Line:** 7977
**Lines of code:** 12

```javascript
7977 | function toggleHidden(pid) {
7978 |   guardWrapperWithRender('toggleHidden', () => {
7979 |     if (platformPrefs.hidden.has(pid)) {
7980 |       platformPrefs.hidden.delete(pid);
7981 |     } else {
7982 |       platformPrefs.hidden.add(pid);
7983 |     }
7984 |     savePlatformPrefs();
7985 |     updateHiddenList();
7986 |     renderPreviews(currentData); // Re-render to apply hiding
7987 |   });
7988 | }
```

---

### importPreferences

**Line:** 8057
**Lines of code:** 59

```javascript
8057 | function importPreferences(e) {
8058 |   const file = e.target.files[0];
8059 |   if (!file) return;
8060 | 
8061 |   const reader = new FileReader();
8062 |   reader.onload = (event) => {
8063 |     try {
8064 |       const prefs = JSON.parse(event.target.result);
8065 |       platformPrefs.favorites = new Set(prefs.favorites || []);
8066 |       platformPrefs.hidden = new Set(prefs.hidden || []);
8067 |       platformPrefs.columnCount = prefs.columnCount || 3;
8068 |       platformPrefs.smartOrdering = prefs.smartOrdering !== false;
8069 | 
8070 |       savePlatformPrefs();
8071 |       updateColumnLayoutUI();
8072 |       updateFavoritesList();
8073 |       updateHiddenList();
8074 | 
8075 |       if (currentData) {
8076 |         // Check if smart ordering is active - defer operation if so
8077 |         if (isSmartOrdering()) {
8078 |           // Create a wrapper function that doesn't depend on the event
8079 |           const applyImportedPrefs = () => {
8080 |             isFilterOperation = true;
8081 |             renderPreviews(currentData);
8082 |             setTimeout(() => { isFilterOperation = false; }, 0);
8083 |             isSmartOrderingActive = false;
8084 |             if (DEBUG_SMART_ORDERING) {
8085 |               console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
8086 |             }
8087 |           };
8088 |           queueFilterOperation(applyImportedPrefs, 'importPreferences');
8089 |           if (DEBUG_SMART_ORDERING) {
8090 |             console.log('[importPreferences] Smart ordering active - operation queued');
8091 |           }
8092 |           return;
8093 |         }
8094 | 
8095 |         // Set guard flag to prevent smart order resets during filter operation
8096 |         isFilterOperation = true;
8097 |         renderPreviews(currentData);
8098 |         // Clear flag after render (renderPreviews will handle timing)
8099 |         setTimeout(() => { isFilterOperation = false; }, 0);
8100 | 
8101 |         // Clear smart ordering active flag since user manually imported preferences
8102 |         isSmartOrderingActive = false;
8103 |         if (DEBUG_SMART_ORDERING) {
8104 |           console.log('[importPreferences] Smart ordering active flag CLEARED (user manual override)');
8105 |         }
8106 |       }
8107 | 
8108 |       showToast('Preferences imported', 2000);
8109 |     } catch (err) {
8110 |       showToast('Failed to import preferences', 2000);
8111 |     }
8112 |   };
8113 |   reader.readAsText(file);
8114 |   e.target.value = ''; // Reset input
8115 | }
```

---

### toggleWhatIfMode

**Line:** 8121
**Lines of code:** 42

```javascript
8121 | function toggleWhatIfMode() {
8122 |   whatIfMode = !whatIfMode;
8123 | 
8124 |   const btn = document.getElementById('whatIfToggleBtn');
8125 |   if (btn) {
8126 |     btn.classList.toggle('active', whatIfMode);
8127 |     btn.textContent = whatIfMode ? '✓ What If On' : '🔍 What If';
8128 |   }
8129 | 
8130 |   if (whatIfMode) {
8131 |     showWhatIfPanel();
8132 |   } else {
8133 |     // Clear What If state
8134 |     disabledTags.clear();
8135 |     updateHash({ without: '' }); // Clear from hash
8136 |     const panel = document.getElementById('whatIfPanel');
8137 |     if (panel) {
8138 |       panel.remove();
8139 |     }
8140 |     if (currentData) {
8141 |       // Check if smart ordering is active - defer operation if so
8142 |       if (isSmartOrdering()) {
8143 |         const applyWhatIfReset = () => {
8144 |           isFilterOperation = true;
8145 |           renderPreviews(currentData);
8146 |           setTimeout(() => { isFilterOperation = false; }, 0);
8147 |         };
8148 |         queueFilterOperation(applyWhatIfReset, 'toggleWhatIfMode');
8149 |         if (DEBUG_SMART_ORDERING) {
8150 |           console.log('[toggleWhatIfMode] Smart ordering active - operation queued');
8151 |         }
8152 |         return;
8153 |       }
8154 | 
8155 |       // Set guard flag to prevent smart order resets during filter operation
8156 |       isFilterOperation = true;
8157 |       renderPreviews(currentData);
8158 |       // Clear flag after render (renderPreviews will handle timing)
8159 |       setTimeout(() => { isFilterOperation = false; }, 0);
8160 |     }
8161 |   }
8162 | }
```

---

### applyWhatIfChanges

**Line:** 8241
**Lines of code:** 40

```javascript
8241 | function applyWhatIfChanges() {
8242 |   if (!currentData) return;
8243 | 
8244 |   // Create modified meta with disabled tags removed
8245 |   const modifiedMeta = { ...currentData.meta };
8246 | 
8247 |   disabledTags.forEach(tag => {
8248 |     const parts = tag.split('.');
8249 |     if (parts.length === 1) {
8250 |       delete modifiedMeta[tag];
8251 |     } else {
8252 |       const [namespace, key] = parts;
8253 |       if (modifiedMeta[namespace]) {
8254 |         const temp = { ...modifiedMeta[namespace] };
8255 |         delete temp[key];
8256 |         modifiedMeta[namespace] = Object.keys(temp).length > 0 ? temp : undefined;
8257 |       }
8258 |     }
8259 |   });
8260 | 
8261 |   // Re-render with modified data (use guard flag to preserve smart ordering)
8262 |   const modifiedData = { ...currentData, meta: modifiedMeta };
8263 |   isFilterOperation = true;
8264 |   renderPreviews(modifiedData);
8265 |   setTimeout(() => { isFilterOperation = false; }, 0);
8266 | 
8267 |   // Announce score change for screen readers
8268 |   const tagCount = disabledTags.size;
8269 |   announce(`What If mode applied. ${tagCount} tag${tagCount > 1 ? 's' : ''} disabled. Preview cards updated to show fallback behavior.`);
8270 | 
8271 |   // Show warnings for missing tags
8272 |   showMissingTagWarnings(modifiedMeta);
8273 | 
8274 |   closeWhatIfPanel();
8275 | 
8276 |   // Update hash with current disabled tags before clearing them
8277 |   updateHash();
8278 | 
8279 |   showToast('Previews updated with What If changes', 2000);
8280 | }
```

---

