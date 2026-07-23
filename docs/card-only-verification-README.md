# Card-Only Rendering Verification Scripts

This directory contains automated verification scripts for testing card-only rendering across all platforms.

## Files

- `test-verify-card-only-rendering.js` - Node.js script using Puppeteer
- `src/public/verify-card-only-browser.js` - Browser console script

## Usage

### Node.js (Puppeteer)

```bash
# Make sure HTTP server is running on port 8080
python3 -m http.server 8080 &
# or
php -S 127.0.0.1:8080

# Run verification
node test-verify-card-only-rendering.js
```

The script will:
- Load the test harness at `http://127.0.0.1:8080/src/public/test-card-only-rendering.html`
- Verify all 44 platforms
- Check layout breaks, rendering completion, platform name display
- Capture console errors and warnings
- Save screenshots of failed platforms
- Generate JSON results in `test-results/card-only-verification-results.json`

### Browser Console

1. Open `http://127.0.0.1:8080/src/public/test-card-only-rendering.html` in browser
2. Open DevTools Console (F12)
3. Paste the contents of `verify-card-only-browser.js` or load it via:

```javascript
fetch('/verify-card-only-browser.js')
  .then(r => r.text())
  .then(eval)
  .then(results => console.log('Results:', results));
```

4. Results will be in `window.cardOnlyTestResults`

## Verification Criteria

Each platform is checked against:

1. **Element Exists** - Platform card element is present in DOM
2. **Rendering Complete** - Content is rendered (not loading state)
3. **No Layout Breaks** - No overflow issues (scrollWidth/Height vs clientWidth/Height)
4. **Platform Name Visible** - Platform name is displayed in header
5. **Has Card Frame** - Card frame structure exists

## Output Format

```json
{
  "timestamp": "2026-07-23T12:34:56.789Z",
  "mode": "card-only",
  "summary": {
    "total": 44,
    "passed": 42,
    "failed": 2,
    "withErrors": 0
  },
  "platforms": [
    {
      "id": "google",
      "name": "Google Search",
      "passed": true,
      "checks": {
        "elementExists": true,
        "renderingComplete": true,
        "noLayoutBreaks": true,
        "platformNameVisible": true,
        "hasCardFrame": true
      },
      "issues": [],
      "warnings": []
    }
  ],
  "consoleErrors": [],
  "consoleWarnings": []
}
```

## Requirements

- Node.js with Puppeteer: `npm install puppeteer`
- HTTP server running on port 8080
- Test harness file: `src/public/test-card-only-rendering.html`

## Troubleshooting

**Browser not found:**
```bash
# Try different browser launch methods
# Edit test-verify-card-only-rendering.js to use system chromium
```

**Port already in use:**
```bash
# Use different port or kill existing server
lsof -ti:8080 | xargs kill -9
```

**Test harness not loading:**
- Verify `src/public/test-card-only-rendering.html` exists
- Check HTTP server is serving from correct directory
- Check browser console for loading errors
