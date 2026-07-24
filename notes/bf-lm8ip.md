# Hook Patterns Found in app.js

## Summary
This document captures all hook patterns discovered in `/home/coding/vista/src/public/app.js`.

---

## 1. Function Monkey-Patching Hooks (Lines 8950-8982)

### Hook 1: renderDiagnostics Hook (Lines 8950-8955)
**Type:** Monkey-patch hook for tracking  
**Pattern:** Wraps existing function to add post-processing behavior

```javascript
// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```

### Hook 2: handleResult Hook (Lines 8957-8982)
**Type:** Monkey-patch hook for pre-processing behavior  
**Pattern:** Wraps async function to inject logic before original execution

```javascript
// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  // Store reference for use in hook
  const originalData = data;

  // P0 - Timing fix: Set currentData BEFORE applySmartOrderingSafe() call
  // applySmartOrdering() requires currentData to be set (line 8577 early exit check)
  // but originalHandleResult2 sets it at line 1025, which is too late
  currentData = data;

  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');
    // P0 - Race condition fix: Use applySmartOrderingSafe() instead of applySmartOrdering()
    // This ensures guard flags (isApplyingSmartOrder) are properly set to prevent
    // concurrent execution with renderPreviews, which was causing order resets
    applySmartOrderingSafe();
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }

  // Now render with cards already in correct order (no post-render reordering needed)
  // Note: renderPreviews will check isApplyingSmartOrder and queue if needed
  await originalHandleResult2(data);
};
```

---

## 2. Event Listener Hooks (130+ occurrences)

### Form Submission Hooks
- Line 230: `urlForm.addEventListener('submit', ...)` - URL inspection form
- Line 231: `pasteForm.addEventListener('submit', ...)` - HTML paste form
- Line 276: `compareForm.addEventListener('submit', ...)` - Compare mode form
- Line 331: `sitemapForm?.addEventListener('submit', ...)` - Sitemap form

### Navigation/Mode Switching Hooks
- Line 270: `$('#switchToPaste').addEventListener('click', ...)` 
- Line 271: `$('#switchToUrl').addEventListener('click', ...)` 
- Line 272: `navInspect.addEventListener('click', ...)` 
- Line 273: `navPaste.addEventListener('click', ...)` 
- Line 274: `navCompare.addEventListener('click', ...)` 
- Line 275: `$('#switchToInspectFromCompare').addEventListener('click', ...)` 
- Line 279: `$('#shareBtn').addEventListener('click', ...)` 
- Line 280: `$('#newInspectBtn').addEventListener('click', ...)` 
- Line 329: `navSitemap?.addEventListener('click', ...)` 
- Line 330: `$('#switchToInspectFromSitemap')?.addEventListener('click', ...)` 

### UI Component Hooks
- Line 234: `urlInput.addEventListener('paste', ...)` - Paste event handling
- Line 243: `document.addEventListener('click', ...)` - Global click delegation
- Line 510: `document.getElementById('globalThemeToggle')?.addEventListener('click', ...)` - Theme toggle

### Modal Hooks
- Lines 283-284: Badge modal open/close
- Lines 287-288: QR modal open/close
- Lines 289, 296-298: Badge modal interactions
- Lines 301, 305: Modal click-outside handlers

### OG Generator Hooks (Lines 310-326)
- Line 310: `oggenBgType?.addEventListener('change', ...)` 
- Line 311: `oggenBgColor?.addEventListener('input', ...)` 
- Line 312: `oggenGradientStart?.addEventListener('input', ...)` 
- Line 313: `oggenGradientEnd?.addEventListener('input', ...)` 
- Line 314: `oggenGradientDir?.addEventListener('change', ...)` 
- Line 315: `oggenBgImageInput?.addEventListener('change', ...)` 
- Line 316: `oggenBgImageSize?.addEventListener('change', ...)` 
- Line 317: `oggenTitle?.addEventListener('input', ...)` 
- Line 318: `oggenSubtitle?.addEventListener('input', ...)` 
- Line 319: `oggenFont?.addEventListener('change', ...)` 
- Line 320: `oggenTextColor?.addEventListener('input', ...)` 
- Line 321: `oggenLogoPos?.addEventListener('change', ...)` 
- Line 322: `oggenLogoInput?.addEventListener('change', ...)` 
- Line 323: `oggenLogoSize?.addEventListener('input', ...)` 
- Line 324: `oggenDownloadBtn?.addEventListener('click', ...)` 
- Line 325: `oggenResetBtn?.addEventListener('click', ...)` 
- Line 326: `oggenUseInEditorBtn?.addEventListener('click', ...)` 

### Card Interaction Hooks (Lines 1988-2100)
- Line 1988: `screenshotBtn.addEventListener('click', ...)` - Download screenshot
- Line 1995: `contextToggle.addEventListener('click', ...)` - Toggle card context
- Line 2001: `themeToggle.addEventListener('click', ...)` - Toggle card theme
- Line 2005: `existingCard.addEventListener('contextmenu', ...)` - Context menu
- Line 2089: `screenshotBtn.addEventListener('click', ...)` - Comparison screenshot
- Line 2092: `contextToggle.addEventListener('click', ...)` - Comparison context
- Line 2096: `themeToggle.addEventListener('click', ...)` - Comparison theme
- Line 2100: `card.addEventListener('contextmenu', ...)` - Comparison context menu

### Platform Selection Hooks (Lines 3481-3511)
- Line 3481: `groupCb.addEventListener('change', ...)` - Group checkbox
- Line 3497: `cb.addEventListener('change', ...)` - Individual checkbox
- Line 3504: `selectAllPlatforms` click handler
- Line 3511: `clearAllPlatforms` click handler

### Editor Hooks (Lines 6801-6834)
- Line 6801: `input.addEventListener('input', ...)` - Editor input
- Line 6805: `editorResetBtn` click handler
- Line 6808: `editorApplyBtn` click handler
- Line 6813: `snippetFramework` change handler
- Line 6816: `snippetCopyBtn` click handler
- Line 6820: Layout column buttons
- Line 6824: `exportPrefsBtn` click handler
- Line 6827: `importPrefsBtn` click handler
- Line 6831: `importPrefsInput` change handler
- Line 6834: `fbPurgeBtn` click handler

### Template Hooks
- Line 7630: Template card click handler

### Favorites/Hidden Hooks
- Line 8008: Favorite toggle button
- Line 8030: Hidden toggle button

### What-If Panel Hooks (Lines 8218-8239)
- Line 8218: `whatIfClose` click handler
- Line 8219: `whatIfReset` click handler
- Line 8220: `whatIfApply` click handler
- Line 8334: `whatIfToggleBtn` click handler
- Line 8339: Document click handler (auto-close)
- Line 8353: Document blur handler
- Line 8371: Document keydown handler

### Diagnostic Hooks
- Line 8425: Fix button click handler

### Command Palette Hooks (Lines 9085-9094)
- Line 9085: Input handler (filter)
- Line 9086: Input keydown handler
- Line 9089: Overlay click handler
- Line 9094: Document keydown handler
- Line 9162: Command item click handler

### Feedback Widget Hooks
- Line 9399: Focus handler
- Line 9407: Document click handler
- Line 9465: FAB click handler
- Line 9473-9474: Close/cancel buttons
- Line 9477: Rating group click handler
- Line 9489: Panel keydown handler
- Line 9493: Submit button click handler

### Drag and Drop Hooks (Lines 9523-9528)
- Line 9523: `dragstart` event
- Line 9524: `dragend` event
- Line 9525: `dragover` event
- Line 9526: `drop` event
- Line 9527: `dragenter` event
- Line 9528: `dragleave` event

### Context Menu Hooks (Lines 9702-9714)
- Line 9702: Menu item click handler
- Line 9707: Document click handler (close)
- Line 9714: Document keydown handler

### Mobile/Touch Hooks (Lines 9823-9825)
- Line 9823: `touchstart` event (passive)
- Line 9824: `touchend` event (passive)
- Line 9825: `touchmove` event (passive)

### Global Keyboard Hooks
- Line 6579: Document keydown handler
- Line 9291: Document keydown handler

### Synchronization Hooks (Lines 5965-5975)
- Line 5965: Synchronized scroll handler 1
- Line 5975: Synchronized scroll handler 2

### Suggestion Chip Hooks (Lines 338, 374)
- Line 338: Chip click handler (suggestion action)
- Line 374: Tab chip click handler

### Tab System Hooks (Lines 347, 352)
- Line 347: Tab button click handler
- Line 352: Tab list keydown handler (accessibility)

### Filter Hooks
- Line 3991: Filter input handler
- Line 9085: Command palette filter input

---

## 3. Lifecycle Initialization Hooks (init functions)

### Core Initialization
- Line 81: `initTheme()` - Theme initialization
- Line 494: `initOgGenerator()` - OG generator initialization
- Line 502: `initFeedbackWidget()` - Feedback widget initialization
- Line 821: `initEditor(completeData)` - Editor initialization
- Line 822: `initCacheHub()` - Cache hub initialization
- Line 1073: `initCropper(data)` - Cropper initialization
- Line 1080: `initEditor(data)` - Editor initialization (phase 2)
- Line 1081: `initCacheHub()` - Cache hub initialization (phase 2)
- Line 1706: `initCardDragAndDrop()` - Card drag/drop initialization
- Line 2013: `initCardDragAndDrop()` - Card drag/drop (comparison)
- Line 6837: `initTemplates()` - Template system initialization
- Line 6843: `initCommandPalette()` - Command palette initialization
- Line 6846: `initGlobalKeyboardShortcuts()` - Global keyboard shortcuts
- Line 6849: `initCacheHub()` - Cache hub (editor context)
- Line 7612: `initTemplates()` - Template initialization
- Line 7664: `initCacheHub()` - Cache hub initialization
- Line 8337: `initInlineEditing()` - Inline editing initialization
- Line 8410: `initDiagnosticTracking()` - Diagnostic tracking initialization
- Line 8947: `initInlineEditing()` - Inline editing (DOM ready)
- Line 8954: `initDiagnosticTracking()` - Diagnostic tracking (hooked)
- Line 9066: `initCommandPalette()` - Command palette function definition
- Line 9234: `initGlobalKeyboardShortcuts()` - Keyboard shortcuts function
- Line 9429: `initFeedbackWidget()` - Feedback widget function
- Line 9520: `initCardDragAndDrop()` - Card drag/drop function
- Line 9667: `initContextMenu()` - Context menu function
- Line 9726: `initContextMenu()` - Context menu call
- Line 9821: `initMobileLongPress()` - Mobile long press function
- Line 9998: `initMobileLongPress()` - Mobile touch initialization

---

## 4. DOM Ready Hooks

### DOMContentLoaded Listeners
- Line 491: `window.addEventListener('DOMContentLoaded', ...)` - Main initialization
- Line 6797: `document.addEventListener('DOMContentLoaded', ...)` - Editor initialization
- Line 8946: `document.addEventListener('DOMContentLoaded', ...)` - Inline editing initialization

---

## 5. Comment-Referenced Hooks

- Line 3559: Comment "single hook keeps the legend in sync with the overlays on screen"

---

## Pattern Analysis

### Hook Categories Found:
1. **Monkey-patch hooks** (2): Function wrapping for behavior injection
2. **Event listener hooks** (130+): DOM event-based hooks
3. **Lifecycle init hooks** (30+): Initialization functions
4. **DOM ready hooks** (3): DOMContentLoaded event listeners

### Hook Patterns:
- **Pre-processing hooks**: Execute logic before original function (handleResult hook)
- **Post-processing hooks**: Execute logic after original function (renderDiagnostics hook)
- **Event delegation hooks**: Global event listeners with dynamic target handling
- **Synchronization hooks**: Coordinating state across multiple components
- **Lifecycle hooks**: Component initialization and setup

---

## Total Count Summary
- **Monkey-patch hooks**: 2
- **Event listener hooks**: 130+
- **Lifecycle init hooks**: 30+
- **DOM ready hooks**: 3
- **Comment-referenced hooks**: 1
