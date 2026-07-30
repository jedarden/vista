# Manual Context Frame Toggle Test Guide

**Task:** bf-nm996 - Test context frame and toggle functionality  
**Date:** 2026-07-23  
**Test Harness:** `http://127.0.0.1:8080/src/public/test-platform-frames-harness.html`

## Automated Test Status

⚠️ **Browser automation unavailable** - Missing system libraries for headless browser automation.  
✅ **Manual testing recommended** - Use this guide for comprehensive manual verification.

## Quick Start Manual Test

1. **Open test harness:**
   ```bash
   # Server should already be running on port 8080
   xdg-open http://127.0.0.1:8080/src/public/test-platform-frames-harness.html
   ```

2. **Test each platform:**
   - Find the platform card
   - Click the toggle button (card context icon)
   - Verify context frame appears
   - Click toggle again to return to card-only
   - Repeat 5-10 times rapidly

## Detailed Test Checklist

### Platform List (31 platforms)

#### Social Media (7)
- [ ] **google** - Google Search
- [ ] **facebook** - Facebook
- [ ] **twitter** - X (Twitter)
- [ ] **linkedin** - LinkedIn
- [ ] **instagram** - Instagram
- [ ] **youtube** - YouTube
- [ ] **tiktok** - TikTok

#### Messaging (10)
- [ ] **slack** - Slack
- [ ] **discord** - Discord
- [ ] **imessage** - iMessage
- [ ] **whatsapp** - WhatsApp
- [ ] **telegram** - Telegram
- [ ] **signal** - Signal
- [ ] **microsoft-teams** - Microsoft Teams
- [ ] **google-chat** - Google Chat
- [ ] **zoom-chat** - Zoom Chat
- [ ] **line** - Line
- [ ] **kakao** - KakaoTalk

#### Content Platforms (8)
- [ ] **pinterest** - Pinterest
- [ ] **bluesky** - Bluesky
- [ ] **mastodon** - Mastodon
- [ ] **threads** - Threads
- [ ] **tumblr** - Tumblr
- [ ] **reddit** - Reddit
- [ ] **medium** - Medium
- [ ] **devto** - Dev.to

#### Developer Tools (5)
- [ ] **github** - GitHub
- [ ] **gitlab** - GitLab
- [ ] **stackoverflow** - Stack Overflow
- [ ] **hackernews** - Hacker News
- [ ] **producthunt** - Product Hunt

#### Email (1)
- [ ] **gmail** - Gmail

### Test Steps Per Platform

For each platform above, perform these tests:

#### 1. Initial Card-Only State ✅
- [ ] Platform card renders without layout breaks
- [ ] Platform logo/icon is visible
- [ ] Platform name is displayed
- [ ] Toggle button shows "Card only" label
- [ ] No console errors (check DevTools)

#### 2. Toggle to In-Context Mode ✅
- [ ] Click toggle button
- [ ] Button label changes to "In context"
- [ ] Context frame appears smoothly
- [ ] No visual glitches or flicker
- [ ] Platform chrome renders correctly

#### 3. Context Frame Content Verification ✅
- [ ] Context frame contains platform-specific UI chrome
- [ ] Link preview card is visible
- [ ] Title and description display correctly
- [ ] Image loads (if present in metadata)
- [ ] Platform-specific styling applied

#### 4. Toggle Back to Card-Only ✅
- [ ] Click toggle button again
- [ ] Button label changes back to "Card only"
- [ ] Context frame disappears smoothly
- [ ] Original card-only view restored
- [ ] No visual glitches or flicker

#### 5. Rapid Toggle Stress Test ✅
- [ ] Perform 10 rapid toggle clicks
- [ ] Each toggle responds within 100ms
- [ ] No UI freezes or delays
- [ ] No visual artifacts during rapid switching
- [ ] Final state matches button label

#### 6. Theme Toggle (if applicable) ✅
- [ ] Click theme toggle button (if present)
- [ ] Theme switches smoothly
- [ ] Dark/light mode both work in context mode
- [ ] No color glitches or missing styles

## Expected Results

### Platforms with Context Frame Support

All 31 platforms should have context frame support through the modern `platform-frames.js` module:

- ✅ Chrome template with platform-specific UI
- ✅ Neutral content placeholder
- ✅ Link preview integration
- ✅ Theme support (where applicable)

### Platform-Specific Features

#### Theme-Supporting Platforms
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
- notion
- vscode
- jetbrains-ide
- gmail
- outlook
- feedly

#### Fixed-Theme Platforms
These platforms have a single theme:
- google (no theme toggle)
- facebook (fixed styling)
- linkedin (fixed styling)
- instagram (fixed styling)
- youtube (fixed styling)
- tiktok (fixed styling)

## Known Issues

### Medium Platform Overflow (Expected)
- **Issue:** Content overflow in card-only mode
- **Status:** Expected behavior for long-form content platform
- **Impact:** Does not affect context frame toggle functionality

### Platform ID Mappings
- Use `kakao` (not `kakaotalk`)
- Use `zoom-chat` (not `zoomchat`)
- Use `google-chat` (not `googlechat`)

## Acceptance Criteria Verification

- [ ] **All 31 platforms successfully toggle between modes**
- [ ] **Context frames render correctly when shown**
- [ ] **No rendering glitches or flicker during transitions**
- [ ] **Rapid toggle switching works smoothly**
- [ ] **Any missing/broken context frames are documented**

## Results Template

After testing, update this section:

### Overall Summary
- **Total Platforms Tested:** ___/31
- **Passed:** ___
- **Failed:** ___
- **Test Date:** _____

### Failed Platforms
List any platforms that failed specific tests:

#### Platform Name
- [ ] Failed test: ___
- [ ] Issue: ___
- [ ] Screenshot/notes: ___

### Visual Glitches Detected
List any platforms with rendering issues:

- **platform:** glitch description

### Test Completion Notes
Any additional observations or notes:
___
