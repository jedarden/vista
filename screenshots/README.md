# Platform Frame Screenshots

This directory contains automated screenshots of all 7 platform context frame test pages.

## Available Capture Methods

### 1. Puppeteer (Headless Chrome) - Recommended ⭐

**Script:** `capture-frames.js`

**Usage:**
```bash
npm run screenshots
# or
node screenshots/capture-frames.js
```

**Requirements:**
- Puppeteer (already in package.json dependencies)
- Test HTML files in `src/public/`

**Features:**
- ✅ Captures both dark and light modes
- ✅ Fast, no external dependencies
- ✅ Works offline
- ✅ Consistent results across runs

**Output:**
- `{platform}-dark.png` (e.g., `twitter-dark.png`)
- `{platform}-light.png` (e.g., `twitter-light.png`)

---

### 2. ADB (Android Phone)

**Script:** `capture-platform-frames.sh`

**Usage:**
```bash
npm run screenshots:adb
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

## Quick Start

```bash
# Capture all platform frames in both themes (fastest, recommended)
npm run screenshots

# Capture via ADB phone (includes theme toggle)
npm run screenshots:adb

# Capture real platform interfaces for comparison
npm run screenshots:real
```

## Output Location

All screenshots are saved to this `screenshots/` directory with descriptive, platform-identifying filenames.
