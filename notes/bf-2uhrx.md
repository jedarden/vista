# Platform Frame Components & Theme Integration Audit

**Task:** bf-2uhrx - Audit platform frame components and theme integration points
**Date:** 2026-07-25

## Summary

Identified and documented all 7 platform frame components and their current theme state handling. The theme infrastructure is complete and ready for integration.

## 7 Platform Frame Components

Located in `/home/coding/vista/src/platform-frames/`:

1. **facebook-frame.ts** - Social feed frames (aspect ratio: 1.91:1)
2. **instagram-frame.ts** - Image-focused frames (aspect ratio: 1:1)
3. **linkedin-frame.ts** - Social feed frames (aspect ratio: 1.91:1)
4. **reddit-frame.ts** - Link aggregator frames (aspect ratio: variable)
5. **tiktok-frame.ts** - Video platform frames (aspect ratio: 9:16)
6. **twitter-frame.ts** - Social feed frames (aspect ratio: 1.91:1)
7. **youtube-frame.ts** - Video platform frames (aspect ratio: 16:9)

## Theme Architecture Files

| File | Purpose |
|------|---------|
| `src/public/frames-theme.js` | Centralized theme management system |
| `src/public/platform-frames.js` | PLATFORM_FRAMES data (43 platforms with theme vars) |
| `src/platform-frames.config.ts` | Platform-to-frame-type configuration |
| `src/types/platform-frames.d.ts` | TypeScript type definitions |

## Current Theme State Handling

### Theme Storage
- **Global Theme:** `globalTheme` variable (defaults to 'dark')
- **Per-Frame Themes:** `frameThemes` Map (frameId → theme)
- **DOM Attributes:** CSS classes + `data-frame-theme` attributes

### Theme Management Functions
```javascript
initFrameThemeSystem(currentTheme)        // Initialize & watch global theme
setFrameTheme(frameId, theme)              // Set theme for specific frame
applyFrameTheme(frame, theme)              // Apply theme to DOM element
updateAllInheritingFrames()                // Update all 'auto' frames
updateFramePlatformVars(frame, theme)      // Update CSS variables
updateAllPlatformFrames(theme)            // Bulk update all frames
```

### Theme Types
- `'dark'` - Dark mode
- `'light'` - Light mode  
- `'auto'` - Inherits from global theme

## Integration Points

### 1. CSS Variable System
Each platform defines 12 theme variables for both dark/light modes:
- Background: `--frame-bg`, `--frame-surface`
- Borders: `--frame-border`, `--frame-divider`
- Text: `--frame-text-primary`, `--frame-text-secondary`, `--frame-text-muted`
- Accents: `--frame-accent`, `--frame-accent-bg`, `--frame-link-color`
- Interactive: `--frame-input-bg`, `--frame-overlay`

### 2. Global Theme Sync
MutationObserver watches `document.documentElement[data-theme]` and propagates changes to all frames with `'auto'` theme.

### 3. Per-Platform Theme Data
`PLATFORM_FRAMES` object in `platform-frames.js` contains:
```javascript
{
  [platformId]: {
    themeVars: {
      dark: { '--frame-bg': '#...', ... },
      light: { '--frame-bg': '#...', ... }
    }
  }
}
```

### 4. Frame Application Pattern
```javascript
const frame = document.getElementById(frameId);
frame.classList.add(`${theme}-theme`);
frame.setAttribute('data-theme', theme);
frame.style.setProperty('--frame-bg', themeValue);
// ... applies all 12 CSS variables
```

## Common Patterns Across Frames

### DOM Structure
- Base class: `.frame-base`
- Platform context: `{platform}-context`
- Theme class: `{theme}-theme`

### Chrome Template Syntax
```html
{{linkPreview}}           <!-- Link preview card -->
{{userMessage}}           <!-- User's message -->
{{userComment}}           <!-- User's comment -->
{{title}}, {{description}}, {{domain}}
{{author}}, {{timeAgo}}
{{subreddit}}, {{upvotes}} <!-- Platform-specific -->
```

### Frame Type Categories
- `social-feed` - Facebook, Twitter, LinkedIn
- `messaging` - (various chat apps)
- `video-platform` - YouTube, TikTok
- `link-aggregator` - Reddit
- `image-focused` - Instagram

## Theme State Connection Status

### ✅ Complete Infrastructure
- Theme CSS variables defined for all 43 platforms
- Global theme change detection implemented
- Per-frame theme tracking via Map storage
- Theme application functions available

### ⚠️ Integration Points
1. **Frame Components** - Import `frames-theme.js` functions
2. **Base Frame** - `base-frame.ts` integrates theme application
3. **Configuration** - `platform-frames.config.ts` maps theme support
4. **Event Listeners** - Global changes propagate to 'auto' frames
5. **Initialization** - `initFrameThemeSystem()` called on page load

## Rendering Architecture

**Legacy Layer (JavaScript):**
- `platform-frames.js` - Platform data & theme variables
- `frames-theme.js` - Theme management functions

**TypeScript Layer:**
- `platform-frames.config.ts` - Configuration & mapping
- `platform-frames/*.ts` - Component implementations
- `types/platform-frames.d.ts` - Type definitions

## Key Findings

1. **Complete Theme System** - All 43 platforms have full dark/light theme definitions
2. **Auto-Inheritance** - Frames can set theme to `'auto'` to follow global theme
3. **Consistent Variables** - 12 standard CSS variables across all platforms
4. **Ready for Integration** - Theme functions available, need component adoption
5. **Dual Architecture** - Legacy JS implementation + TypeScript type layer

## Next Steps for Theme Integration

1. Ensure `initFrameThemeSystem()` is called on app initialization
2. Frame components should call `setFrameTheme()` or set `data-frame-theme` attribute
3. Use `updateAllPlatformFrames()` when globally switching themes
4. Verify frame components apply CSS classes and variables correctly
