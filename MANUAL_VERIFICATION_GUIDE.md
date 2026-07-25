# Manual Verification Guide for Four Social Platform Frames

## Overview
This guide provides step-by-step instructions to manually verify all four social platform frames (Reddit, Twitter/X, YouTube, TikTok) in both dark and light themes.

## Prerequisites
- A web browser (Chrome, Firefox, Safari, or Edge)
- Local web server or ability to open HTML files directly

## Verification Steps

### Step 1: Launch the Test Page

1. **Start a local server** (if not already running):
   ```bash
   # Option 1: Using Python
   python3 -m http.server 8765
   
   # Option 2: Using Node.js http-server
   npx http-server -p 8765
   
   # Option 3: Open HTML files directly in browser
   ```

2. **Navigate to test pages**:
   - All four platforms: `http://localhost:8765/test-all-four-social-platforms.html`
   - Individual platforms:
     - Reddit: `http://localhost:8765/src/public/reddit-frame.html`
     - Twitter/X: `http://localhost:8765/src/public/twitter-frame.html`
     - YouTube: `http://localhost:8765/src/public/youtube-frame.html`
     - TikTok: `http://localhost:8765/src/public/tiktok-frame.html`

### Step 2: Screenshot Procedure

For each platform, capture screenshots in BOTH themes:

1. **Load the page** (defaults to dark theme)
2. **Take Dark Mode Screenshot**:
   - Press `Cmd+Shift+4` (Mac) or `PrintScreen` (Windows)
   - Or use browser DevTools: `F12` → `Ctrl+Shift+P` → "Capture screenshot"
3. **Click the "🌓 Toggle Theme" button** (top-right corner)
4. **Wait for transition** (1-2 seconds)
5. **Take Light Mode Screenshot**
6. **Name screenshots clearly**:
   - `reddit-dark.png`, `reddit-light.png`
   - `twitter-dark.png`, `twitter-light.png`
   - `youtube-dark.png`, `youtube-light.png`
   - `tiktok-dark.png`, `tiktok-light.png`

### Step 3: Verification Checklist

#### Reddit Frame Verification ✓

**Chrome Elements:**
- [ ] Header with logo (🤖) and search bar
- [ ] User profile card with avatar (JD) and username
- [ ] Post content with subreddit link (r/webdev)
- [ ] Upvote/downvote buttons with count (24.5K)
- [ ] Post title in proper Reddit format
- [ ] Comment section with avatars and timestamps
- [ ] Action buttons (💬 Comments, ↗️ Share, 💾 Save, ⭐ Award)

**Theme Switching:**
- [ ] Dark mode: Dark gray background, proper contrast
- [ ] Light mode: White/light background, text readable
- [ ] Toggle button works smoothly
- [ ] Theme preference saved to localStorage

**Platform-Specific Styling:**
- [ ] Reddit orange accent color (#FF4500)
- [ ] Proper border colors for theme
- [ ] Hover effects on interactive elements
- [ ] Responsive layout (max-width: 680px)

---

#### Twitter/X Frame Verification ✓

**Chrome Elements:**
- [ ] Header with logo and navigation tabs (For you/Following)
- [ ] User avatar with initials (JD, TC, PS, DW)
- [ ] Display name with verified badge (✓)
- [ ] Username handle (@janedev, @techcreator, etc.)
- [ ] Timestamp (· 2h, · 5h, etc.)
- [ ] Tweet content with hashtag highlighting
- [ ] Action buttons (💬 Reply, 🔁 Repost, ❤️ Like, 👁️ Views)
- [ ] Tweet stats (Reposts, Quotes, Likes, Views counts)

**Theme Switching:**
- [ ] Dark mode: Black (#000000) background
- [ ] Light mode: White background, proper contrast
- [ ] Toggle button works smoothly
- [ ] Verified badge stays blue in both themes

**Platform-Specific Styling:**
- [ ] Twitter/X blue accent color (#1DA1F2)
- [ ] Proper tweet borders and spacing
- [ ] Hover effects on actions (color changes)
- [ ] Link cards with proper styling
- [ ] Poll UI with progress bars
- [ ] Quoted tweet styling

---

#### YouTube Frame Verification ✓

**Chrome Elements:**
- [ ] Video player with play button and thumbnail
- [ ] Video duration badge (10:35)
- [ ] Video controls (play, volume, settings, fullscreen)
- [ ] Progress bar with red accent
- [ ] Video title and metadata (1.2M views, 3 days ago)
- [ ] Channel avatar (TC) and name (TechCode Academy)
- [ ] Subscriber count (2.4M subscribers)
- [ ] Subscribe button
- [ ] Action buttons (👍 Like, 👎 Dislike, ↗️ Share, ⬇️ Download, ✂️ Clip, 💾 Save)
- [ ] Description section with embedded link previews
- [ ] Comments section with avatars and timestamps

**Theme Switching:**
- [ ] Dark mode: Dark background (#0F0F0F)
- [ ] Light mode: Light background, proper contrast
- [ ] Toggle button works smoothly
- [ ] Video player maintains proper styling

**Platform-Specific Styling:**
- [ ] YouTube red accent color (#FF0000)
- [ ] Proper video player controls styling
- [ ] Link preview cards with thumbnails
- [ ] Comment section with proper spacing
- [ ] Channel section with avatar and subscribe button

---

#### TikTok Frame Verification ✓

**Chrome Elements:**
- [ ] Video container (9:16 aspect ratio)
- [ ] Play button overlay with proper styling
- [ ] Progress bar at bottom
- [ ] Right sidebar actions:
  - [ ] Like button (♡) with count (24.5K)
  - [ ] Comment button (💬) with count (1.2K)
  - [ ] Share button (↗) with count (856)
  - [ ] Save button (💾)
- [ ] Bottom overlay with user info
- [ ] User avatar (TC) and username (@tiktokcreator)
- [ ] Verified badge (✓) in cyan
- [ ] Follower count (2.4M followers)
- [ ] Caption with hashtags
- [ ] Embedded link card
- [ ] Music info (🎵 Original Sound)
- [ ] Comments section with avatars and timestamps

**Theme Switching:**
- [ ] Dark mode: Black background, white text
- [ ] Light mode: Light background, dark text
- [ ] Toggle button works smoothly
- [ ] Sidebar actions maintain proper visibility

**Platform-Specific Styling:**
- [ ] TikTok pink (#FF0050) and cyan (#00F2EA) gradient
- [ ] Proper video container styling
- [ ] Sidebar action buttons with drop shadows
- [ ] Bottom overlay with gradient
- [ ] Music icon and text styling
- [ ] Comment section proper spacing

---

### Step 4: Interactive Elements Test

**Theme Toggle Functionality:**
- [ ] Click toggle button → Theme switches immediately
- [ ] Theme preference persists on page reload
- [ ] All four platforms respond to theme changes
- [ ] Smooth transition (no flickering or broken elements)

**Interactive Elements:**
- [ ] Reddit: Upvote/downvote buttons clickable
- [ ] Twitter/X: Like button toggles (❤️ ↔ 🤍)
- [ ] Twitter/X: Navigation tabs switch properly
- [ ] YouTube: Video controls appear functional
- [ ] TikTok: Like button toggles (♡ ↔ ♥)
- [ ] TikTok: Other actions highlight on hover

**Responsive Behavior:**
- [ ] All frames center properly on page
- [ ] Max-width constraints work correctly
- [ ] No horizontal scrolling at standard widths
- [ ] Mobile viewport works (optional test)

---

### Step 5: Cross-Theme Consistency

**Text Readability:**
- [ ] All text is readable in both dark and light modes
- [ ] Contrast ratios are acceptable (WCAG AA minimum)
- [ ] No text is invisible or blends into background

**Accent Colors:**
- [ ] Reddit orange (#FF4500) visible in both themes
- [ ] Twitter/X blue (#1DA1F2) visible in both themes
- [ ] YouTube red (#FF0000) visible in both themes
- [ ] TikTok pink/cyan gradient visible in both themes

**Borders and Dividers:**
- [ ] Borders are visible but not overpowering
- [ ] Divider lines render correctly in both themes
- [ ] Card backgrounds have proper contrast

---

### Step 6: Screenshot Organization

Create organized folders for your screenshots:

```
screenshots/
├── reddit/
│   ├── reddit-dark.png
│   └── reddit-light.png
├── twitter/
│   ├── twitter-dark.png
│   └── twitter-light.png
├── youtube/
│   ├── youtube-dark.png
│   └── youtube-light.png
├── tiktok/
│   ├── tiktok-dark.png
│   └── tiktok-light.png
└── combined/
    ├── four-platforms-dark.png
    └── four-platforms-light.png
```

---

## Expected Results Summary

### All Platforms Should Have:
- ✓ Realistic platform chrome (header, navigation, branding)
- ✓ Proper user interface elements (avatars, buttons, timestamps)
- ✓ Platform-specific accent colors
- ✓ Interactive elements (hover states, click handlers)
- ✓ Comments section with user avatars
- ✓ Action buttons with proper styling
- ✓ Dark/light theme toggle working
- ✓ Smooth theme transitions
- ✓ localStorage persistence for theme preference

### Theme-Specific Results:

**Dark Mode (Default):**
- Dark gray/black backgrounds
- Light text for readability
- Accent colors pop against dark backgrounds
- Borders and dividers visible but subtle

**Light Mode:**
- White/light backgrounds
- Dark text for readability
- Accent colors maintain visibility
- Borders and dividers properly contrasted

---

## Troubleshooting

**Theme Toggle Not Working:**
1. Check browser console for JavaScript errors
2. Verify localStorage is enabled
3. Ensure CSS files are loaded (`frames-theme.css`, `social-platforms-frames.css`)

**Styling Issues:**
1. Clear browser cache and reload
2. Check that CSS files are in the correct directory
3. Verify CSS variable definitions in `frames-theme.css`

**Screenshots Not Clear:**
1. Use browser zoom to 100% before capturing
2. Ensure page has fully loaded (wait 1-2 seconds after theme switch)
3. Use high-resolution display if possible

---

## Completion Checklist

When verification is complete, you should have:
- [ ] 8 total screenshots (4 platforms × 2 themes)
- [ ] All chrome elements verified for each platform
- [ ] Theme switching tested and working
- [ ] Interactive elements tested
- [ ] Cross-theme consistency verified
- [ ] Screenshot folder organized
- [ ] Any issues documented

## Notes

- The verification page (`test-all-four-social-platforms.html`) shows all platforms in one view
- Individual platform frame files allow focused testing of each platform
- Theme preference persists across sessions via localStorage
- All platforms use centralized CSS for consistency
- Platform-specific chrome elements match real platform UI patterns

---

**Last Updated:** 2025-07-25  
**Test Files:** `test-all-four-social-platforms.html`, individual platform frames  
**CSS Files:** `frames-theme.css`, `social-platforms-frames.css`
