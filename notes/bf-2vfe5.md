# Theme Subscription Integration - Bead bf-2vfe5

## Summary

Integrated theme subscription into the first batch of platform frames (twitter, facebook, linkedin).

## Changes Made

### 1. platform-frames.js
- Added `frameIdCounter` to generate unique IDs for each frame instance
- Modified `buildContextFrame()` to assign unique IDs to frame elements (format: `frame-{platform}-{counter}`)
- Frames now have IDs like `frame-twitter-1`, `frame-facebook-2`, etc.

### 2. app.js
- Added `subscribeFrameToTheme(platformId)` helper function that:
  - Finds the most recently inserted frame for a platform
  - Subscribes it to theme changes using `ThemeSubscription.subscribePlatformFrame()`
  - Handles errors gracefully with console warnings

- Integrated subscription calls in three places:
  1. Initial card rendering (line ~2141)
  2. Context toggle in `toggleCardContext()` (line ~2241)
  3. Theme toggle in `toggleCardTheme()` (line ~2271)

### 3. test-theme-integration.html
- Created comprehensive test suite to verify integration
- Tests include:
  - ThemeSubscription API availability
  - PLATFORM_FRAMES availability
  - Unique frame ID generation
  - Subscriber count increases
  - Theme propagation to frames

## Platforms Integrated

First batch (3 platforms):
1. **twitter** - X/Twitter context frames
2. **facebook** - Facebook context frames
3. **linkedin** - LinkedIn context frames

## How It Works

1. When a frame is created via `buildContextFrame()`, it gets a unique ID
2. After the frame HTML is inserted into DOM via `innerHTML`, `subscribeFrameToTheme()` is called
3. The helper finds the frame by its `data-platform` attribute and subscribes it
4. When the global theme changes, the ThemeSubscription API calls the frame's callback
5. The callback applies the new theme to the frame without page reload

## Testing

To test the integration:
1. Open `test-theme-integration.html` in a browser
2. Click "Run Automated Tests" to verify all functionality
3. Manually toggle theme to verify frames update in real-time
4. Check browser console for any errors

## Acceptance Criteria Met

- ✅ 3-4 platform frame components integrated (integrated 3: twitter, facebook, linkedin)
- ✅ Each frame re-renders when theme changes without page reload
- ✅ Theme value is accessible in each integrated frame via callback
- ⏳ No console errors during theme toggle (needs manual verification)

## Next Steps

For future beads, integrate more platforms by adding them to the platform check arrays:
```javascript
if (['twitter', 'facebook', 'linkedin', 'slack', 'discord'].includes(pid)) {
  subscribeFrameToTheme(pid);
}
```
