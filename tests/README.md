# Platform Frame Test Infrastructure

This directory contains the test infrastructure for all four social platform frames with theme switching support.

## Directory Structure

```
tests/
├── platforms/           # Platform-specific test pages
│   ├── index.html      # Main test page with all four platforms
│   ├── reddit.html     # Reddit-specific frame test
│   ├── twitter.html    # Twitter/X-specific frame test
│   ├── youtube.html    # YouTube-specific frame test
│   └── tiktok.html     # TikTok-specific frame test
└── shared/             # Shared JavaScript modules
    └── theme-switcher.js  # Theme switching functionality
```

## Theme Switching System

The `theme-switcher.js` module provides synchronous theme switching across all platform frames with persistent state storage.

### Features

- **Synchronous Theme Switching**: All frames update simultaneously when theme is toggled
- **Persistent State**: Theme preference is saved to localStorage
- **System Preference Detection**: Automatically detects system dark/light mode preference
- **Event-Driven**: Dispatches custom `themeChanged` events for other components to listen

### API

```javascript
// Initialize with frame IDs (auto-initialized via data attributes)
ThemeSwitcher.initialize(['reddit-frame', 'twitter-frame', 'youtube-frame', 'tiktok-frame']);

// Toggle theme
ThemeSwitcher.toggle();

// Set specific theme
ThemeSwitcher.set('dark');  // or 'light'

// Get current theme
const currentTheme = ThemeSwitcher.get();

// Clear saved preference (revert to system)
ThemeSwitcher.clear();

// Listen for theme changes
window.addEventListener('themeChanged', (e) => {
  console.log('Theme changed to:', e.detail.theme);
});
```

### HTML Data Attributes

For automatic initialization, add these attributes to your `<html>` tag:

```html
<html 
  data-theme="dark" 
  data-theme-frame-ids="reddit-frame,twitter-frame,youtube-frame,tiktok-frame"
  data-theme-auto-init="true">
```

- `data-theme`: Initial theme ('dark' or 'light')
- `data-theme-frame-ids`: Comma-separated list of frame element IDs to update
- `data-theme-auto-init`: Enable/disable auto-initialization (default: true)

## Test Pages

### Main Test Page (index.html)

The main test page (`tests/platforms/index.html`) includes all four platform frames in a grid layout:
- Reddit frame with post display
- Twitter/X frame with tweet display
- YouTube frame with video display
- TikTok frame with video display

### Platform-Specific Test Pages

Each platform has its own dedicated test page for focused testing:
- `reddit.html` - Reddit frame only
- `twitter.html` - Twitter/X frame only
- `youtube.html` - YouTube frame only
- `tiktok.html` - TikTok frame only

All pages include:
- Theme toggle button
- Platform-specific frame
- Navigation back to the main test page
- Console logging for theme changes

## Usage

1. Open any test page in a browser
2. Click the "Toggle Dark/Light Theme" button to switch themes
3. All frames on the page should update simultaneously
4. Theme preference is saved and persists across browser sessions
5. Check the browser console for theme change logs

## Acceptance Criteria

✅ **Base HTML template exists with theme toggle button** - All test pages have theme toggle buttons

✅ **Theme toggle switches all platform frames between dark and light** - The `theme-switcher.js` module updates all registered frames synchronously

✅ **Directory structure ready for platform-specific pages** - Organized structure with `tests/platforms/` and `tests/shared/`

✅ **Theme state persists during session** - Uses localStorage to save theme preference

## Technical Details

### Theme Switching Mechanism

1. User clicks toggle button → `ThemeSwitcher.toggle()` is called
2. Module updates `currentTheme` variable
3. New theme is saved to localStorage
4. `applyTheme()` function:
   - Updates `data-theme` attribute on `<html>` element
   - Adds/removes `light-theme` class on all registered frame elements
   - Dispatches `themeChanged` custom event
5. CSS responds to attribute/class changes and updates all frame styling

### CSS Integration

The frames use CSS custom properties (variables) that respond to the `data-theme` attribute and `light-theme` class:

```css
/* Dark theme (default) */
.reddit-context {
  background: var(--reddit-dark-bg, #1a1a1b);
  color: var(--reddit-dark-text-primary, #d7dadc);
}

/* Light theme */
.reddit-context.light-theme {
  background: var(--reddit-light-bg, #ffffff);
  color: var(--reddit-light-text-primary, #1c1c1c);
}
```

## Files Created

1. `tests/shared/theme-switcher.js` - Shared theme switching module
2. `tests/platforms/index.html` - Main test page with all platforms
3. `tests/platforms/reddit.html` - Reddit-specific test page
4. `tests/platforms/twitter.html` - Twitter/X-specific test page
5. `tests/platforms/youtube.html` - YouTube-specific test page
6. `tests/platforms/tiktok.html` - TikTok-specific test page
7. `tests/README.md` - This documentation file

## Verification

To verify the test infrastructure works correctly:

1. Open `tests/platforms/index.html` in a browser
2. Verify all four platform frames are displayed
3. Click the theme toggle button
4. Verify all frames switch theme simultaneously
5. Refresh the page
6. Verify theme preference persisted

All acceptance criteria have been met! ✅
