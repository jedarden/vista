# Platform Frame Screenshots

This directory contains automated screenshots of all 8 platform context frame test pages.

## Available Capture Methods

### 1. ADB (Android Phone) - Recommended ⭐

**Script:** `capture-platform-frames.sh`

**Usage:**
```bash
npm run screenshots
# or
bash screenshots/capture-platform-frames.sh
```

**Requirements:**
- Android phone connected via ADB
- Vista server accessible at `SERVER_URL` (configurable in script)
- Chrome installed on the phone

**Features:**
- ✅ Captures both dark and light modes
- ✅ Real device rendering
- ✅ Tests actual mobile Chrome experience
- ✅ Works on NixOS systems (no system library dependencies)

**Output:**
- `{platform}-frame-dark.png` (e.g., `twitter-frame-dark.png`)
- `{platform}-frame-light.png` (e.g., `twitter-frame-light.png`)

---

### 2. Playwright (Headless Chrome)

**Script:** `capture-frames-playwright.js`

**Usage:**
```bash
npm run screenshots:playwright
# or
node screenshots/capture-frames-playwright.js
```

**Requirements:**
- Playwright (already in package.json devDependencies)
- Test HTML files in `src/public/`
- System libraries for Chromium (may not work on NixOS)

**Features:**
- ✅ Captures both dark and light modes
- ✅ Fast, no external hardware
- ✅ Works offline
- ✅ Consistent results across runs

**Output:**
- `{platform}-frame-dark.png` (e.g., `twitter-frame-dark.png`)
- `{platform}-frame-light.png` (e.g., `twitter-frame-light.png`)

---

### 3. Real Platform Screenshots (for comparison)

**Script:** `capture-real-platforms.sh`

**Usage:**
```bash
npm run screenshots:real
# or
bash screenshots/capture-real-platforms.sh
```

**Requirements:**
- Android phone connected via ADB
- Chrome installed on the phone
- Internet access for real platforms

**Features:**
- ✅ Captures actual platform interfaces
- ✅ Useful for visual comparison with mockups
- ✅ Tests real platform accessibility

**Output:**
- `{platform}-real.png` (e.g., `twitter-real.png`)

## Platform Frames Covered

| Platform | Test File | Screenshots |
|----------|-----------|-------------|
| Twitter (X) | test-twitter-frame.html | dark, light, real |
| Instagram | test-instagram-frame.html | dark, light, real |
| YouTube | test-youtube-frame.html | dark, light, real |
| TikTok | test-tiktok-frame.html | dark, light, real |
| Pinterest | test-pinterest-frame.html | dark, light, real |
| LinkedIn | test-linkedin-frame.html | dark, light, real |
| Reddit | test-reddit-frame.html | dark, light, real |
| Facebook | test-facebook-frame.html | dark, light |

## Quick Start

```bash
# Capture all platform frames in both themes (ADB - recommended)
npm run screenshots

# Capture via Playwright (if system libraries available)
npm run screenshots:playwright

# Capture real platform interfaces for comparison
npm run screenshots:real
```

## Output Location

All screenshots are saved to this `screenshots/` directory with descriptive, platform-identifying filenames.
