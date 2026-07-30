# Twitter/X Frame Screenshot Capture Guide

This directory contains scripts and documentation for capturing Twitter/X frame screenshots in both light and dark themes.

## Available Scripts

### 1. `capture-twitter-screenshots.js` (Automated)

Automated screenshot capture using Puppeteer (headless Chrome).

**Requirements:**
- Node.js with `puppeteer` installed
- System libraries for Chrome: `libglib-2.0`, `libnss3`, `libatk-1.0`, etc.
- `test-twitter-frame.html` must exist in the same directory

**Usage:**
```bash
node capture-twitter-screenshots.js
```

**Output:**
- `notes/vista-twitter-x-dark-mode.png` (default dark theme)
- `notes/vista-twitter-x-light-mode.png` (light theme after toggle)

**How it works:**
1. Launches headless Chrome browser
2. Loads `test-twitter-frame.html` in a 1400x900 viewport
3. Waits for page to fully render (2 seconds)
4. Captures dark mode screenshot (default theme)
5. Finds and clicks the theme toggle button (`#themeToggle`)
6. Waits for theme transition (1 second)
7. Captures light mode screenshot
8. Closes browser and reports success

**Error Handling:**
- Validates that `test-twitter-frame.html` exists before launch
- Creates `notes/` directory if missing
- Throws descriptive errors if theme toggle button not found
- Ensures browser cleanup in `finally` block
- Exits with code 1 on any error

### 2. `test-twitter-x-manual-verification.js` (Manual Server)

Starts a local HTTP server for manual screenshot capture in a real browser.

**Requirements:**
- Node.js (no external dependencies needed)
- `test-twitter-frame.html` in the same directory

**Usage:**
```bash
node test-twitter-x-manual-verification.js
```

**Steps:**
1. Server starts at `http://localhost:3000/test`
2. Open the URL in your browser
3. Verify dark mode (default)
4. Click "☀️ Light Mode" button
5. Verify light mode
6. Take screenshots manually using browser tools or OS screenshot utilities

**Manual Verification Checklist:**
- [ ] Dark mode: black background (#000000), blue verified badge (#1d9bf0)
- [ ] Light mode: white background (#ffffff), blue verified badge (#1d9bf0)
- [ ] Link card has correct border radius (16px)
- [ ] Avatar is circular (border-radius: 50%)
- [ ] Text hierarchy correct (primary white/secondary gray in dark mode)
- [ ] Frame matches realistic X chrome layout

## Current Screenshots

The following screenshots already exist in the `notes/` directory:
- `vista-twitter-x-dark-mode.png` (58K, captured Jul 25 07:22)
- `vista-twitter-x-light-mode.png` (58K, captured Jul 25 07:22)

These were captured from the working Twitter/X frame implementation.

## Troubleshooting

### Puppeteer Chrome Launch Errors

If you see errors like "error while loading shared libraries", install the required system libraries:

**Debian/Ubuntu:**
```bash
sudo apt-get install -y \
  libglib2.0-0 \
  libnss3 \
  libxkbcommon0 \
  libatk1.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libatspi2.0-0
```

**Other systems:** Refer to [Puppeteer troubleshooting](https://pptr.dev/troubleshooting)

### Alternative: Manual Browser Method

If Chrome dependencies aren't available, use the manual server method:

1. Start the server: `node test-twitter-x-manual-verification.js`
2. Open `http://localhost:3000/test` in your browser
3. Use browser DevTools or OS screenshot tools to capture images
4. Save screenshots to `notes/` directory with descriptive names

### Screenshots Not Appearing

If screenshots don't appear in `notes/`:
1. Check that `notes/` directory exists (script creates it if missing)
2. Verify `test-twitter-frame.html` exists in the project root
3. Check browser console for JavaScript errors
4. Ensure theme toggle button has `id="themeToggle"`

## Acceptance Criteria

The screenshot capture setup meets these criteria:

✅ **Script successfully captures screenshots in both themes**
   - Automated script captures both dark and light modes
   - Manual server method enables browser-based capture

✅ **Screenshots saved with clear names**
   - `vista-twitter-x-dark-mode.png`
   - `vista-twitter-x-light-mode.png`
   - Descriptive names that indicate theme and purpose

✅ **Script handles theme switching correctly**
   - Finds `#themeToggle` button element
   - Clicks toggle to switch themes
   - Waits for CSS transition to complete (1 second)
   - Validates button presence before clicking

✅ **Script is documented with usage instructions**
   - Comprehensive README with examples
   - Error handling documented
   - Troubleshooting section included
   - Manual and automated methods explained

## Files

- `capture-twitter-screenshots.js` - Automated Puppeteer script
- `test-twitter-x-manual-verification.js` - Manual HTTP server
- `test-twitter-frame.html` - Test page with Twitter/X frame
- `notes/vista-twitter-x-dark-mode.png` - Dark mode screenshot
- `notes/vista-twitter-x-light-mode.png` - Light mode screenshot
