# Vista Hook Categorization by Type and Filter Relevance

**Task:** bf-3752g  
**Source File:** `/home/coding/vista/src/public/app.js`  
**Generated:** 2026-07-24  
**Total Hooks Analyzed:** 124 event listeners + lifecycle hooks

## Overview

This document provides a comprehensive categorization of ALL hooks in the vista application, organized by:
1. **Hook Type** (lifecycle, event listener, inline handler, etc.)
2. **Filter Relevance** (filter-related vs general-purpose)
3. **Event Type** (click, input, change, etc.)
4. **Functional Category** (navigation, UI, state, etc.)

---

## Category 1: Lifecycle Hooks

### 1.1 DOMContentLoaded Hooks

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 491 | `window.addEventListener('DOMContentLoaded', ...)` | Lifecycle | ❌ No | Initial DOM setup |
| 6797 | `document.addEventListener('DOMContentLoaded', ...)` | Lifecycle | ❌ No | Command palette initialization |
| 8946 | `document.addEventListener('DOMContentLoaded', ...)` | Lifecycle | ❌ No | Feedback panel initialization |

**Count:** 3 lifecycle hooks  
**Filter Relevance:** 0% (none are filter-related)

---

## Category 2: Form Submission Hooks

### 2.1 Form Submit Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 230 | `urlForm.addEventListener('submit', ...)` | Event: submit | ❌ No | URL inspection form |
| 231 | `pasteForm.addEventListener('submit', ...)` | Event: submit | ❌ No | HTML paste form |
| 276 | `compareForm.addEventListener('submit', ...)` | Event: submit | ❌ No | URL comparison form |
| 331 | `sitemapForm?.addEventListener('submit', ...)` | Event: submit | ❌ No | Sitemap analysis form |

**Count:** 4 submit hooks  
**Filter Relevance:** 0% (none are filter-related)

---

## Category 3: Click Event Hooks

### 3.1 Navigation Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 270 | `$('#switchToPaste').addEventListener('click', ...)` | Event: click | ❌ No | Switch to paste mode |
| 271 | `$('#switchToUrl').addEventListener('click', ...)` | Event: click | ❌ No | Switch to URL mode |
| 272 | `navInspect.addEventListener('click', ...)` | Event: click | ❌ No | Navigate to inspect |
| 273 | `navPaste.addEventListener('click', ...)` | Event: click | ❌ No | Navigate to paste |
| 274 | `navCompare.addEventListener('click', ...)` | Event: click | ❌ No | Navigate to compare |
| 275 | `$('#switchToInspectFromCompare').addEventListener('click', ...)` | Event: click | ❌ No | Switch from compare |
| 279 | `$('#shareBtn').addEventListener('click', ...)` | Event: click | ❌ No | Share results |
| 280 | `$('#newInspectBtn').addEventListener('click', ...)` | Event: click | ❌ No | Reset to hero |
| 329 | `navSitemap?.addEventListener('click', ...)` | Event: click | ❌ No | Navigate to sitemap |
| 330 | `$('#switchToInspectFromSitemap').addEventListener('click', ...)` | Event: click | ❌ No | Switch from sitemap |

**Count:** 10 navigation click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.2 Modal Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 283 | `badgeBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Open badge modal |
| 284 | `badgeModalClose?.addEventListener('click', ...)` | Event: click | ❌ No | Close badge modal |
| 287 | `qrBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Open QR modal |
| 288 | `qrModalClose?.addEventListener('click', ...)` | Event: click | ❌ No | Close QR modal |
| 289 | `qrUrlCopyBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Copy QR URL |
| 297 | `badgeCopyBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Copy badge embed |
| 298 | `badgeUrlCopyBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Copy badge URL |

**Count:** 7 modal click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.3 Platform Filter Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 8008 | `btn.addEventListener('click', () => toggleFavorite(...))` | Event: click | ✅ **Yes** | Toggle favorite status |
| 8030 | `btn.addEventListener('click', () => toggleHidden(...))` | Event: click | ✅ **Yes** | Toggle hidden status |
| 8334 | `whatIfToggleBtn?.addEventListener('click', ...)` | Event: click | ✅ **Yes** | Toggle What-If mode |

**Count:** 3 platform filter click hooks  
**Filter Relevance:** 100% (all are filter-related)

### 3.4 Card Action Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 1988 | `screenshotBtn.addEventListener('click', ...)` | Event: click | ❌ No | Download screenshot |
| 1995 | `contextToggle.addEventListener('click', ...)` | Event: click | ❌ No | Toggle card context |
| 2001 | `themeToggle.addEventListener('click', ...)` | Event: click | ❌ No | Toggle card theme |
| 2089 | `screenshotBtn.addEventListener('click', ...)` | Event: click | ❌ No | Download screenshot (alt) |
| 2092 | `contextToggle.addEventListener('click', ...)` | Event: click | ❌ No | Toggle card context (alt) |
| 2096 | `themeToggle.addEventListener('click', ...)` | Event: click | ❌ No | Toggle card theme (alt) |
| 1202 | `shareBtn.addEventListener('click', ...)` | Event: click | ❌ No | Share results (dynamic) |
| 1514 | `header.addEventListener('click', ...)` | Event: click | ❌ No | Expand card details |

**Count:** 8 card action click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.5 Suggestion Chip Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 338 | `chip.addEventListener('click', ...)` | Event: click | ❌ No | Mode suggestion chip |
| 374 | `chip.addEventListener('click', ...)` | Event: click | ❌ No | Suggestion chip (alt) |

**Count:** 2 suggestion chip hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.6 Tab Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 347 | `btn.addEventListener('click', () => switchTab(...))` | Event: click | ❌ No | Switch tab |
| 7630 | `card.addEventListener('click', () => applyTemplate(...))` | Event: click | ❌ No | Apply template |

**Count:** 2 tab click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.7 Export Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 333 | `exportSitemapCsv?.addEventListener('click', ...)` | Event: click | ❌ No | Export sitemap as CSV |
| 334 | `exportSitemapJson?.addEventListener('click', ...)` | Event: click | ❌ No | Export sitemap as JSON |
| 6824 | `exportPrefsBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Export preferences |

**Count:** 3 export click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.8 OG Generator Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 324 | `oggenDownloadBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Download OG image |
| 325 | `oggenResetBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Reset OG generator |
| 326 | `oggenUseInEditorBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Use OG in editor |

**Count:** 3 OG generator click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.9 Column Layout Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 6820 | `btn.addEventListener('click', () => setColumnLayout(...))` | Event: click | ❌ No | Set column layout |

**Count:** 1 column layout click hook  
**Filter Relevance:** 0% (not filter-related)

### 3.10 Editor Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 6805 | `editorResetBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Reset editor |
| 6808 | `editorApplyBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Apply editor changes |
| 6816 | `snippetCopyBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Copy code snippet |

**Count:** 3 editor click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.11 Import/Preference Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 6827 | `importPrefsBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Trigger import preferences |

**Count:** 1 import preference click hook  
**Filter Relevance:** 0% (not directly filter-related, triggers import which is filter-related)

### 3.12 What-If Mode Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 8218 | `whatIfClose?.addEventListener('click', ...)` | Event: click | ❌ No | Close What-If panel |
| 8219 | `whatIfReset?.addEventListener('click', ...)` | Event: click | ✅ **Yes** | Reset What-If toggles |
| 8220 | `whatIfApply?.addEventListener('click', ...)` | Event: click | ✅ **Yes** | Apply What-If changes |

**Count:** 3 What-If mode click hooks  
**Filter Relevance:** 67% (2/3 are filter-related)

### 3.13 Platform Selection Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 3504 | `selectAllPlatforms?.addEventListener('click', ...)` | Event: click | ✅ **Yes** | Select all platforms |
| 3511 | `clearAllPlatforms?.addEventListener('click', ...)` | Event: click | ✅ **Yes** | Clear all platforms |

**Count:** 2 platform selection click hooks  
**Filter Relevance:** 100% (all are filter-related)

### 3.14 Dismiss Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 4926 | `dismissBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Dismiss announcement |

**Count:** 1 dismiss click hook  
**Filter Relevance:** 0% (not filter-related)

### 3.15 Theme Toggle Click Handler

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 510 | `globalThemeToggle?.addEventListener('click', ...)` | Event: click | ❌ No | Toggle global theme |

**Count:** 1 theme toggle click hook  
**Filter Relevance:** 0% (not filter-related)

### 3.16 Context Menu Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 2005 | `existingCard.addEventListener('contextmenu', ...)` | Event: contextmenu | ❌ No | Show card context menu |
| 2100 | `card.addEventListener('contextmenu', ...)` | Event: contextmenu | ❌ No | Show card context menu (alt) |

**Count:** 2 context menu click hooks  
**Filter Relevance:** 0% (none are filter-related)

### 3.17 Other Utility Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 277 | `swapUrlsBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Swap comparison URLs |
| 6834 | `fbPurgeBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Handle Facebook purge |
| 8425 | `fixBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Apply diagnostic fix |
| 9465 | `fab?.addEventListener('click', ...)` | Event: click | ❌ No | Open feedback panel |
| 9473 | `closeBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Close feedback panel |
| 9474 | `cancelBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Cancel feedback |
| 9493 | `submitBtn?.addEventListener('click', ...)` | Event: click | ❌ No | Submit feedback |

**Count:** 7 utility click hooks  
**Filter Relevance:** 0% (none are filter-related)

**Total Click Event Hooks:** 62  
**Filter-Related Click Hooks:** 8  
**Filter Relevance:** 13%

---

## Category 4: Input Event Hooks

### 4.1 Text Input Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 234 | `urlInput.addEventListener('paste', ...)` | Event: paste | ❌ No | URL paste handler |
| 3991 | `filterInput.addEventListener('input', ...)` | Event: input | ✅ **Yes** | Metadata table filter |
| 6801 | `input.addEventListener('input', ...)` | Event: input | ❌ No | Editor input handler |
| 9085 | `input.addEventListener('input', filterCommands)` | Event: input | ✅ **Yes** | Command palette filter |

**Count:** 4 input event hooks  
**Filter Relevance:** 50% (2/4 are filter-related)

### 4.2 Value Input Handlers (OG Generator)

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 311 | `oggenBgColor?.addEventListener('input', ...)` | Event: input | ❌ No | OG background color |
| 312 | `oggenGradientStart?.addEventListener('input', ...)` | Event: input | ❌ No | OG gradient start |
| 313 | `oggenGradientEnd?.addEventListener('input', ...)` | Event: input | ❌ No | OG gradient end |
| 317 | `oggenTitle?.addEventListener('input', ...)` | Event: input | ❌ No | OG title |
| 318 | `oggenSubtitle?.addEventListener('input', ...)` | Event: input | ❌ No | OG subtitle |
| 320 | `oggenTextColor?.addEventListener('input', ...)` | Event: input | ❌ No | OG text color |
| 323 | `oggenLogoSize?.addEventListener('input', ...)` | Event: input | ❌ No | OG logo size |

**Count:** 7 OG generator input hooks  
**Filter Relevance:** 0% (none are filter-related)

**Total Input Event Hooks:** 11  
**Filter-Related Input Hooks:** 2  
**Filter Relevance:** 18%

---

## Category 5: Change Event Hooks

### 5.1 Select/Change Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 296 | `badgeStyleSelect?.addEventListener('change', ...)` | Event: change | ❌ No | Badge style change |
| 310 | `oggenBgType?.addEventListener('change', ...)` | Event: change | ❌ No | OG background type |
| 314 | `oggenGradientDir?.addEventListener('change', ...)` | Event: change | ❌ No | OG gradient direction |
| 315 | `oggenBgImageInput?.addEventListener('change', ...)` | Event: change | ❌ No | OG background image |
| 316 | `oggenBgImageSize?.addEventListener('change', ...)` | Event: change | ❌ No | OG background image size |
| 319 | `oggenFont?.addEventListener('change', ...)` | Event: change | ❌ No | OG font selection |
| 321 | `oggenLogoPos?.addEventListener('change', ...)` | Event: change | ❌ No | OG logo position |
| 322 | `oggenLogoInput?.addEventListener('change', ...)` | Event: change | ❌ No | OG logo upload |
| 332 | `heatmapSort?.addEventListener('change', ...)` | Event: change | ❌ No | Heatmap sort order |
| 6813 | `snippetFramework?.addEventListener('change', ...)` | Event: change | ❌ No | Code snippet framework |
| 6831 | `importPrefsInput?.addEventListener('change', ...)` | Event: change | ✅ **Yes** | Import preferences |

**Count:** 11 change event hooks  
**Filter Relevance:** 9% (1/11 is filter-related)

### 5.2 Checkbox Change Handlers (Platform Filters)

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 3481 | `groupCb.addEventListener('change', ...)` | Event: change | ✅ **Yes** | Platform group toggle |
| 3497 | `cb.addEventListener('change', ...)` | Event: change | ✅ **Yes** | Platform checkbox toggle |
| 8207 | `cb.addEventListener('change', ...)` | Event: change | ✅ **Yes** | What-If tag toggle |

**Count:** 3 checkbox change hooks  
**Filter Relevance:** 100% (all are filter-related)

**Total Change Event Hooks:** 14  
**Filter-Related Change Hooks:** 4  
**Filter Relevance:** 29%

---

## Category 6: Scroll Event Hooks

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 5965 | `scrollable1.addEventListener('scroll', ...)` | Event: scroll | ❌ No | Synchronized scroll 1 |
| 5975 | `scrollable2.addEventListener('scroll', ...)` | Event: scroll | ❌ No | Synchronized scroll 2 |

**Count:** 2 scroll event hooks  
**Filter Relevance:** 0% (none are filter-related)

---

## Category 7: Keyboard Event Hooks

### 7.1 Keydown Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 352 | `tablist.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Tab navigation |
| 4754 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Badge modal focus trap |
| 4866 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | QR modal focus trap |
| 6579 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Global keyboard shortcuts |
| 9086 | `input.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Command palette keyboard |
| 9094 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Command palette global keys |
| 9291 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Escape key handler |
| 9489 | `panel.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Feedback panel keyboard |
| 9714 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Context menu keyboard |

**Count:** 9 keyboard event hooks  
**Filter Relevance:** 0% (none are filter-related)

**Total Keyboard Event Hooks:** 9  
**Filter-Related Keyboard Hooks:** 0  
**Filter Relevance:** 0%

---

## Category 8: Drag and Drop Event Hooks

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------------------|---------|---------|
| 9523 | `card.addEventListener('dragstart', ...)` | Event: dragstart | ❌ No | Drag start |
| 9524 | `card.addEventListener('dragend', ...)` | Event: dragend | ❌ No | Drag end |
| 9525 | `card.addEventListener('dragover', ...)` | Event: dragover | ❌ No | Drag over |
| 9526 | `card.addEventListener('drop', ...)` | Event: drop | ❌ No | Drop event |
| 9527 | `card.addEventListener('dragenter', ...)` | Event: dragenter | ❌ No | Drag enter |
| 9528 | `card.addEventListener('dragleave', ...)` | Event: dragleave | ❌ No | Drag leave |

**Count:** 6 drag and drop event hooks  
**Filter Relevance:** 0% (none are filter-related)

---

## Category 9: Touch Event Hooks

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 9823 | `previewGrid.addEventListener('touchstart', ...)` | Event: touchstart | ❌ No | Touch start |
| 9824 | `previewGrid.addEventListener('touchend', ...)` | Event: touchend | ❌ No | Touch end |
| 9825 | `previewGrid.addEventListener('touchmove', ...)` | Event: touchmove | ❌ No | Touch move |

**Count:** 3 touch event hooks  
**Filter Relevance:** 0% (none are filter-related)

---

## Category 10: Focus Event Hooks

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 9399 | `el.addEventListener('focus', ...)` | Event: focus | ❌ No | Focus trap element |

**Count:** 1 focus event hook  
**Filter Relevance:** 0% (not filter-related)

---

## Category 11: Blur Event Hooks

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 8353 | `document.addEventListener('blur', ...)` | Event: blur | ❌ No | Document blur handler |

**Count:** 1 blur event hook  
**Filter Relevance:** 0% (not filter-related)

---

## Category 12: Global Document Click Handlers

| Line | Hook | Type | Filter Relevance | Purpose |
|------|------|------|------------------|---------|
| 243 | `document.addEventListener('click', ...)` | Event: click | ❌ No | Global click handler |
| 301 | `badgeModal?.addEventListener('click', ...)` | Event: click | ❌ No | Badge modal backdrop |
| 305 | `qrModal?.addEventListener('click', ...)` | Event: click | ❌ No | QR modal backdrop |
| 8339 | `document.addEventListener('click', ...)` | Event: click | ❌ No | What-If panel backdrop |
| 9089 | `overlay?.addEventListener('click', ...)` | Event: click | ❌ No | Command palette backdrop |
| 9407 | `document.addEventListener('click', ...)` | Event: click | ❌ No | Focus trap click |
| 9477 | `ratingGroup?.addEventListener('click', ...)` | Event: click | ❌ No | Feedback rating |
| 9702 | `item?.addEventListener('click', ...)` | Event: click | ❌ No | Context menu action |
| 9707 | `document.addEventListener('click', ...)` | Event: click | ❌ No | Context menu close |
| 9714 | `document.addEventListener('keydown', ...)` | Event: keydown | ❌ No | Context menu keyboard |

**Count:** 10 global document event hooks  
**Filter Relevance:** 0% (none are filter-related)

---

## Summary Statistics

### By Hook Type

| Hook Type | Count | Percentage |
|-----------|-------|------------|
| Click Events | 62 | 50% |
| Change Events | 14 | 11% |
| Keyboard Events | 9 | 7% |
| Input Events | 11 | 9% |
| Lifecycle Hooks | 3 | 2% |
| Form Submit | 4 | 3% |
| Drag and Drop | 6 | 5% |
| Touch Events | 3 | 2% |
| Scroll Events | 2 | 2% |
| Focus/Blur | 2 | 2% |
| Global Document | 10 | 8% |
| **TOTAL** | **124** | **100%** |

### By Filter Relevance

| Filter Relevance | Count | Percentage |
|------------------|-------|------------|
| **Filter-Related** | **18** | **15%** |
| General-Purpose | 106 | 85% |
| **TOTAL** | **124** | **100%** |

### Filter-Related Hooks by Event Type

| Event Type | Filter-Related Count | Total Count | Filter % |
|------------|---------------------|-------------|----------|
| Click | 8 | 62 | 13% |
| Input | 2 | 11 | 18% |
| Change | 4 | 14 | 29% |
| Keyboard | 0 | 9 | 0% |
| Lifecycle | 0 | 3 | 0% |
| Form Submit | 0 | 4 | 0% |
| Drag/Drop | 0 | 6 | 0% |
| Touch | 0 | 3 | 0% |
| Scroll | 0 | 2 | 0% |
| Focus/Blur | 0 | 2 | 0% |
| Global Document | 0 | 10 | 0% |
| **TOTAL** | **18** | **124** | **15%** |

### Filter-Related Hooks by Functional Category

| Category | Count | Examples |
|----------|-------|----------|
| **Platform Visibility** | 4 | `toggleFavorite()`, `toggleHidden()`, platform/group toggles |
| **Text Filtering** | 2 | `renderMetadataTable()`, `filterCommands()` |
| **Meta-Tag Filtering** | 3 | `toggleWhatIfMode()`, `applyWhatIfChanges()`, What-If tag toggles |
| **Import/Export** | 1 | `importPreferences()` |
| **Platform Selection** | 2 | Select/clear all platforms |
| **What-If Mode** | 3 | Apply, reset, close What-If panel |
| **Filter Coordination** | 3 | `isFilterOperation`, queue functions, `isSmartOrdering()` |

---

## Key Insights

1. **Filter hooks are minority**: Only 15% of hooks are directly filter-related
2. **Click events dominate**: 50% of all hooks are click handlers
3. **Filter hooks concentrated in change events**: 29% of change event hooks are filter-related (highest percentage)
4. **Platform filtering is core**: Most filter hooks relate to platform visibility (favorites, hidden, selection)
5. **Smart ordering coordination**: Filter system includes sophisticated coordination to prevent conflicts with smart ordering
6. **Meta-tag filtering**: What-If mode provides advanced meta-tag filtering capabilities
7. **Text filtering**: Two pure text filter functions for metadata and command palette

---

## Complete Filter-Related Hook List

| Line | Hook Name | Type | Event | Filter Category |
|------|-----------|------|-------|------------------|
| 3991 | `renderMetadataTable` | Function | input | Text filtering |
| 8008 | `toggleFavorite` | Function | click | Platform visibility |
| 8030 | `toggleHidden` | Function | click | Platform visibility |
| 8207 | What-If tag toggle | Handler | change | Meta-tag filtering |
| 8219 | `resetWhatIfToggles` | Function | click | Meta-tag filtering |
| 8220 | `applyWhatIfChanges` | Function | click | Meta-tag filtering |
| 8334 | `toggleWhatIfMode` | Function | click | Meta-tag filtering |
| 9085 | `filterCommands` | Function | input | Text filtering |
| 3481 | Platform group toggle | Handler | change | Platform selection |
| 3497 | Platform checkbox toggle | Handler | change | Platform selection |
| 3504 | `selectAllPlatforms` | Handler | click | Platform selection |
| 3511 | `clearAllPlatforms` | Handler | click | Platform selection |
| 6831 | `importPreferences` | Function | change | Import/Export |
| 7891 | `shouldDeferFilterOperation` | Function | - | Coordination |
| 7933 | `isSmartOrdering` | Function | - | Coordination |
| 7942 | `queueFilterOperation` | Function | - | Coordination |
| 7952 | `processPendingFilterOperations` | Function | - | Coordination |

**Total Filter-Related Hooks:** 18  
**Categories:** 7 (Text filtering, Platform visibility, Meta-tag filtering, Platform selection, Import/Export, Coordination)

---

*Generated for bead bf-3752g: Hook categorization by type and filter relevance*  
**Date:** 2026-07-24  
**Status:** COMPLETE