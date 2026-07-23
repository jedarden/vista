# bf-1f5t6: smartOrdering URL Parameter Verification

## Task
Verify vista application code supports smartOrdering=true URL parameter.

## Review Date
2026-07-23

## Findings

### ❌ URL Parameter Parsing Missing
The application does NOT parse the `smartOrdering` parameter from URL parameters.

**Current URL Parameter Handling (lines 495-503):**
```javascript
const params = new URLSearchParams(window.location.search);
const urlParam = params.get('url');
if (urlParam) {
  urlInput.value = urlParam;
  inspectUrl(urlParam);
}
if (params.has('feedback')) {
  initFeedbackWidget();
}
```

Only two URL parameters are currently parsed:
1. `url` - URL to inspect
2. `feedback` - whether to show feedback widget

### ✅ smartOrdering Feature Exists
The smartOrdering feature is fully implemented in the application code:

- **Default value:** `true` (line 6151)
- **LocalStorage persistence:** Loaded/saved via `savePlatformPrefs()` (lines 7603, 7586)
- **Usage:** Used throughout the code for platform ordering logic (lines 8305, 8324, 8456-8461)

## Issue

The application cannot be controlled via the `?smartOrdering=true` URL parameter because the parameter is never extracted from `window.location.search`.

## Recommendation

To support the smartOrdering URL parameter, add this to the URL parameter parsing section (around line 503):

```javascript
// Handle smartOrdering parameter
if (params.has('smartOrdering')) {
  const smartOrderingValue = params.get('smartOrdering').toLowerCase();
  platformPrefs.smartOrdering = smartOrderingValue !== 'false' && smartOrderingValue !== '0';
  savePlatformPrefs(); // Persist to localStorage
}
```

## Conclusion

**Status:** NOT READY for smartOrdering URL parameter testing

The smartOrdering feature works via localStorage but does not currently respond to URL parameters.
