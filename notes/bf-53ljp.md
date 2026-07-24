# Search Results: addHook Calls in app.js

## Task
Search app.js for all addHook method calls, regardless of event type.

## File Location
- `./src/public/app.js` (9,998 lines)

## Search Patterns Attempted
- `addHook` (literal)
- `\.addHook` (with dot notation)
- `addHook\s*\(` (method call pattern)
- Case-insensitive `addhook`
- Combined patterns `add.*[Hh]ook|[Hh]ook.*add`

## Results
**TOTAL addHook CALLS FOUND: 0**

## Hook-Related Content Found (Non-addHook)
Line 3559: `// single hook keeps the legend in sync with the overlays on screen.`
Line 8950: `// ── Hook into renderDiagnostics for tracking ──`
Line 8957: `// ── Hook into handleResult for smart ordering ──`
Line 8960: `// Store reference for use in hook`
Line 8968: `console.log('[handleResult hook] smartOrdering enabled:', platformPrefs.smartOrdering);`
Line 8970: `console.log('[handleResult hook] applying smart ordering BEFORE render (fixes race condition)');`
Line 8976: `console.log('[handleResult hook] smartOrdering disabled - skipping applySmartOrdering call');`

## Codebase Context
- `addHook` method calls exist in `./node_modules/playwright/lib/transform/transform.js` and `./node_modules/playwright/lib/third_party/pirates.js`
- No `addHook` method calls found in the main application code (app.js)

## Conclusion
The app.js file does not contain any `addHook` method calls. All hook-related content is limited to comments and debugging output.
