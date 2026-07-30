# Bead bf-3nco0: renderPlatformWithContext Location

## Task Completed

Located the `renderPlatformWithContext` function in the vista codebase.

## File Location

**File:** `/home/coding/vista/src/public/app.js`

**Line:** 2530

## Function Signature

```javascript
function renderPlatformWithContext(pid, meta, imageProbe, baseUrl, theme = 'dark', dominantColor)
```

## Parameters

- `pid` (string): Platform ID (e.g., 'twitter', 'facebook', 'instagram', etc.)
- `meta` (object): Metadata object containing OG tags and page metadata
  - `meta.og.title`, `meta.title` - Page title
  - `meta.og.description`, `meta.description` - Page description
  - `meta.og.image`, `meta.twitter.image` - Open Graph image URL
  - `meta.og.site_name` - Site name
  - `meta.themeColor` - Theme color
- `imageProbe` (object): Image probe data
- `baseUrl` (string): Base URL of the page
- `theme` (string, optional): Theme setting ('dark' or 'light'), defaults to 'dark'
- `dominantColor` (string): Dominant color extracted from the page

## Purpose

This function renders a platform-specific context frame with embedded content. It:
1. Extracts Open Graph and metadata from the `meta` object
2. Prepares content data for the platform frame
3. Uses the platform-frames configuration system (via `getPlatformFrame()` and `buildContextFrame()`)
4. Falls back to legacy renderer if the platform-frames module isn't loaded
5. Handles unknown/unsupported platforms with a generic fallback frame

## Related Files

The function is also called from several test files:
- `/home/coding/vista/verify-7-platforms-complete.js`
- `/home/coding/vista/verify-twitter-theme-toggle.js`
- `/home/coding/vista/test-social-platforms-complete.js`
- `/home/coding/vista/verify-platform-frame-integration.js`
- `/home/coding/vista/test-context-frame-toggle-comprehensive.js`
- `/home/coding/vista/verify-theme-toggle-visual.js`
- `/home/coding/vista/verify-twitter-theme-toggle-implementation.js`
- `/home/coding/vista/test-toggle-logic.js`
- `/home/coding/vista/src/tests/test-theme-toggle-functionality.js`

## Notes for Next Steps

- The main implementation is in `/home/coding/vista/src/public/app.js` at line 2530
- The function integrates with the platform-frames.config.ts system via the JavaScript `PLATFORM_FRAMES` object
- A legacy version exists at line 2596 for platforms not yet migrated
