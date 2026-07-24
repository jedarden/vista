# Hook Patterns Catalog - app.js

## Task: bf-56np0
**Date:** 2026-07-24
**File:** `/home/coding/vista/src/public/app.js`

---

## Hook Patterns Found

### 1. Function Wrapping Hooks (Monkey-patching)

#### Pattern: Original Function Storage and Replacement

| Hook Name | Line Numbers | Type | Context |
|-----------|--------------|------|---------|
| `renderDiagnostics` hook | 8950-8955 | Diagnostic tracking | Wraps `renderDiagnostics` to call `initDiagnosticTracking` after 100ms delay |
| `handleResult` hook | 8957-8990 | Smart ordering integration | Wraps `handleResult` to apply smart ordering before rendering, fixing race condition |
| `switchTab` hook | 9421-9425 | Tab switching | Wraps `switchTab` to unfocus cards when switching tabs |

**Pattern Structure:**
```javascript
// Store original function
const original<FunctionName> = <functionName>;

// Replace with wrapper
<functionName> = function(<args>) {
  // Pre-processing
  original<FunctionName>(<args>);
  // Post-processing
};
```

---

### 2. Lifecycle Event Hooks

#### Pattern: DOMContentLoaded Initialization

| Hook Location | Line Numbers | Type | Context |
|---------------|--------------|------|---------|
| Global initialization | 491-508 | Window load | `initTheme()`, `loadRecents()`, `initOgGenerator()`, URL param handling, hash state restoration |
| Editor initialization | 6797-6828 | Document load | Editor input listeners, reset button, code snippet framework selector, column layout selector |
| Inline editing initialization | 8946-8949 | Document load | `initInlineEditing()` |

**Pattern Structure:**
```javascript
window.addEventListener('DOMContentLoaded', () => {
  // Initialization code
});

document.addEventListener('DOMContentLoaded', () => {
  // Initialization code
});
```

---

### 3. Hook Summary

**Total Hook Patterns Found:** 6
- **Function Wrapping Hooks:** 3 (renderDiagnostics, handleResult, switchTab)
- **Lifecycle Event Hooks:** 3 (window DOMContentLoaded ×1, document DOMContentLoaded ×2)

---

## Hook Pattern Details

### renderDiagnostics Hook (Lines 8950-8955)
```javascript
// ── Hook into renderDiagnostics for tracking ──
const originalRenderDiagnostics = renderDiagnostics;
renderDiagnostics = function(diagnostics) {
  originalRenderDiagnostics(diagnostics);
  setTimeout(initDiagnosticTracking, 100);
};
```
- **Purpose:** Adds diagnostic tracking after diagnostics are rendered
- **Timing:** 100ms delay after original render
- **Type:** Post-render hook

### handleResult Hook (Lines 8957-8990)
```javascript
// ── Hook into handleResult for smart ordering ──
const originalHandleResult2 = handleResult;
handleResult = async function(data) {
  const originalData = data;
  currentData = data;  // P0 - Timing fix
  console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);
  if (platformPrefs.smartOrdering) {
    console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');
    applySmartOrderingSafe();  // P0 - Race condition fix
  } else {
    console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');
  }
  // ... continues with original logic
};
```
- **Purpose:** Integrates smart ordering before rendering to fix race conditions
- **Type:** Pre-render hook with critical timing fixes
- **Priority:** P0 (fixes race condition between applySmartOrdering and renderPreviews)

### switchTab Hook (Lines 9421-9425)
```javascript
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
  originalSwitchTab(tabId);
  unfocusAllCards();
};
```
- **Purpose:** Ensures cards are unfocused when switching tabs
- **Type:** Post-action hook

### Global Initialization Hook (Lines 491-508)
```javascript
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadRecents();
  initOgGenerator();
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    urlInput.value = urlParam;
    inspectUrl(urlParam);
  }
  if (params.has('feedback')) {
    initFeedbackWidget();
  }
  restoreHashState();
});
```
- **Purpose:** Main application initialization
- **Type:** Application lifecycle hook

### Editor Initialization Hook (Lines 6797-6828)
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const editorInputs = document.querySelectorAll('.editor-input, .editor-textarea, .editor-select');
  editorInputs.forEach(input => {
    input.addEventListener('input', handleEditorInput);
  });
  document.getElementById('editorResetBtn')?.addEventListener('click', resetEditor);
  // ... more editor setup
});
```
- **Purpose:** Editor feature initialization
- **Type:** Feature initialization hook

### Inline Editing Initialization Hook (Lines 8946-8949)
```javascript
document.addEventListener('DOMContentLoaded', () => {
  initInlineEditing();
});
```
- **Purpose:** Inline editing feature initialization
- **Type:** Feature initialization hook

---

## Notes

- All function wrapping hooks use the pattern of storing the original function, then replacing it with a wrapper
- The `handleResult` hook is the most complex, incorporating smart ordering logic and race condition fixes
- Multiple `DOMContentLoaded` listeners are used (one on `window`, two on `document`)
- Hook patterns are primarily used for:
  1. Adding tracking/analytics
  2. Fixing timing issues and race conditions
  3. UI state management (unfocusing cards)
  4. Feature initialization

---

## Search Methodology

- Searched for: `addHook`, `onBefore`, `onAfter`, `onReady`, `onLoad`, `onInit`, `onError` patterns
- Found function wrapping pattern: `original<FunctionName>` storage and replacement
- Identified lifecycle event patterns: `DOMContentLoaded` event listeners
- Searched for callback patterns (minimal findings)

---

**Summary:** The app.js file uses two primary hook patterns: function wrapping (monkey-patching) for intercepting and augmenting existing functions, and DOMContentLoaded event listeners for application initialization. All hooks serve clear purposes: tracking, race condition fixes, UI state management, and feature initialization.
