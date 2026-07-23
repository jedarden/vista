# Manual Theme Switching and Edge Cases Test Guide

**Task:** bf-3jwfo - Test theme switching and edge cases  
**Date:** 2026-07-23  
**Test Harness:** `http://127.0.0.1:8080/src/public/test-platform-frames-harness.html`

## Automated Test Status

⚠️ **Browser automation unavailable** - Missing system libraries for headless browser automation.  
✅ **Manual testing recommended** - Use this guide for comprehensive manual verification.

## Quick Start Manual Test

1. **Open test harness:**
   ```bash
   xdg-open http://127.0.0.1:8080/src/public/test-platform-frames-harness.html
   ```

2. **For each platform:**
   - Find the platform card
   - Click the toggle button to enter 'in context' mode
   - Click the theme toggle button (☀️/🌙)
   - Verify smooth theme transition
   - Check both card and context frame update
   - Switch back and forth multiple times

## Platform List (32 platforms)

### Social Media (7)
- [ ] **google** - Google Search
- [ ] **facebook** - Facebook
- [ ] **twitter** - X (Twitter)
- [ ] **linkedin** - LinkedIn
- [ ] **instagram** - Instagram
- [ ] **youtube** - YouTube
- [ ] **tiktok** - TikTok

### Messaging (11)
- [ ] **slack** - Slack
- [ ] **discord** - Discord
- [ ] **imessage** - iMessage
- [ ] **whatsapp** - WhatsApp
- [ ] **telegram** - Telegram
- [ ] **signal** - Signal
- [ ] **teams** - Microsoft Teams
- [ ] **googlechat** - Google Chat
- [ ] **zoom** - Zoom Chat
- [ ] **line** - Line
- [ ] **kakaotalk** - KakaoTalk

### Content Platforms (8)
- [ ] **pinterest** - Pinterest
- [ ] **bluesky** - Bluesky
- [ ] **mastodon** - Mastodon
- [ ] **threads** - Threads
- [ ] **tumblr** - Tumblr
- [ ] **reddit** - Reddit
- [ ] **medium** - Medium
- [ ] **devto** - Dev.to

### Developer Tools (5)
- [ ] **github** - GitHub
- [ ] **gitlab** - GitLab
- [ ] **stackoverflow** - Stack Overflow
- [ ] **hackernews** - Hacker News
- [ ] **producthunt** - Product Hunt

### Email (1)
- [ ] **gmail** - Gmail

## Detailed Test Checklist Per Platform

For each platform above, perform these tests:

### 1. Initial Card-Only State
- [ ] Platform card renders without layout breaks
- [ ] Platform logo/icon is visible
- [ ] Platform name is displayed
- [ ] Current theme (light/dark) is applied consistently
- [ ] No console errors (check DevTools)

### 2. Toggle to In-Context Mode
- [ ] Click toggle button
- [ ] Context frame appears smoothly
- [ ] No visual glitches or flicker
- [ ] Platform chrome renders correctly
- [ ] Theme is consistent between card and frame

### 3. Dark Mode Test
- [ ] Click theme toggle to switch to dark mode
- [ ] Card updates to dark theme immediately
- [ ] Context frame updates to dark theme (if visible)
- [ ] All text remains readable
- [ ] No color conflicts between card and frame
- [ ] Platform-specific dark chrome is correct

### 4. Light Mode Test
- [ ] Click theme toggle to switch to light mode
- [ ] Card updates to light theme immediately
- [ ] Context frame updates to light theme (if visible)
- [ ] All text remains readable
- [ ] No color conflicts between card and frame
- [ ] Platform-specific light chrome is correct

### 5. Rapid Theme Switching Stress Test
- [ ] Perform 10 rapid theme toggle clicks
- [ ] Each toggle responds within 100ms
- [ ] No UI freezes or delays
- [ ] No visual artifacts during rapid switching
- [ ] Final theme matches toggle button state
- [ ] No console errors during rapid switching

## Edge Cases Testing

### Long Content Platforms
Test these platforms with potentially long content:
- [ ] **medium** - Long-form articles
- [ ] **devto** - Technical articles
- [ ] **notion** - Rich content (if available)
- [ ] **substack** - Newsletter content (if available)

**Specific checks:**
- [ ] Content doesn't overflow during theme switch
- [ ] Scroll position maintained during theme change
- [ ] No horizontal scrolling appears
- [ ] Context frame handles long content gracefully

### Minimal Theme Support Platforms
Test platforms with minimal or no theme support:
- [ ] **google** - Minimal/no theme
- [ ] **hackernews** - Minimal theme
- [ ] **stackoverflow** - Limited theme

**Specific checks:**
- [ ] Graceful degradation when theme not fully supported
- [ ] No layout breaks in minimal theme mode
- [ ] Card remains readable
- [ ] Fallback to default styling is clean

### Complex Context Frame Platforms
Test platforms with complex UI chrome:
- [ ] **slack** - Complex sidebar/header
- [ ] **discord** - Multi-pane layout
- [ ] **github** - Rich UI chrome
- [ ] **figma** - Complex UI (if available)

**Specific checks:**
- [ ] Complex chrome renders in both themes
- [ ] Theme colors apply to all frame elements
- [ ] No orphaned light/dark elements
- [ ] Interactive elements in frame work correctly

## Screenshot Documentation

Capture screenshots for these 10+ representative platforms in BOTH themes:

1. **google** - Search engine, minimal theme
2. **facebook** - Social media
3. **twitter** - Social media, good theme support
4. **slack** - Complex messaging UI
5. **discord** - Complex messaging, dark-first platform
6. **github** - Developer tools
7. **reddit** - Content platform
8. **instagram** - Visual-heavy platform
9. **linkedin** - Professional network
10. **medium** - Long-form content
11. **youtube** - Video platform
12. **telegram** - Messaging with good theme support

**Screenshot naming convention:**
- `{platform}-dark.png` - Platform in dark mode (in context)
- `{platform}-light.png` - Platform in light mode (in context)

**Screenshot process:**
1. Toggle platform to 'in context' mode
2. Switch to dark mode
3. Take screenshot (save to `screenshots/theme-test/`)
4. Switch to light mode
5. Take screenshot (save to `screenshots/theme-test/`)

## Expected Results

### Theme-Supporting Platforms
These platforms should have both dark and light mode context frames:
- discord
- slack
- twitter
- telegram
- github
- gitlab
- mastodon
- threads
- bluesky
- medium
- hackernews
- devto

### Fixed-Theme Platforms
These platforms may have a single theme or minimal theme variation:
- google (minimal/no theme toggle)
- facebook (fixed styling)
- linkedin (fixed styling)
- instagram (fixed styling)
- youtube (some theme support)
- tiktok (fixed styling)

## Known Issues to Watch For

### Color Conflicts
- Card and context frame have different background colors
- Text readability issues in one theme
- Orphaned elements that don't update to new theme

### Visual Artifacts
- Flicker during theme transitions
- Flash of unstyled content (FOUC)
- Layout shifts during theme change

### Edge Cases
- Long content overflow during theme switch
- Scroll position jumping
- Context frame rendering incorrectly after theme change

## Acceptance Criteria Verification

After testing, update this section:

- [ ] **All 31+ platforms support dark/light mode switching** - ___/___ platforms passed
- [ ] **No color conflicts or visual artifacts during theme changes** - ___ issues found
- [ ] **Edge cases handled without layout breaks** - ___ edge cases tested, ___ passed
- [ ] **10+ platforms documented with screenshots in both modes** - ___ platforms screenshots taken
- [ ] **Full test report generated** - Report saved to notes/bf-3jwfo-theme-test-report.md

## Test Results Template

After testing, update this section with your findings:

### Overall Summary
- **Total Platforms Tested:** ___/32
- **Theme Switching Passed:** ___
- **No Color Conflicts:** ___
- **Edge Cases Passed:** ___
- **Test Date:** _____

### Platforms with Issues

List any platforms that failed specific tests:

#### Platform Name
- [ ] Failed test: ___
- [ ] Issue: ___
- [ ] Screenshot/notes: ___

### Color Conflicts Detected

List any platforms with color conflicts:
- **platform:** conflict description
- **platform:** conflict description

### Edge Case Results

#### Long Content Platforms
- **medium:** ___
- **devto:** ___

#### Minimal Theme Platforms
- **google:** ___
- **hackernews:** ___

#### Complex Frame Platforms
- **slack:** ___
- **discord:** ___

### Screenshots Taken

List all screenshots captured:
- [ ] google-dark.png
- [ ] google-light.png
- [ ] facebook-dark.png
- [ ] facebook-light.png
- [ ] ... etc

## Test Completion Notes

Any additional observations or notes:
___
