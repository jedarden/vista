# Frame Infrastructure Documentation

## Overview

The base frame component infrastructure is complete and provides:

1. **Base wrapper component with dark/light mode toggle**
2. **Platform color palette system for 3 layout types**
3. **Shared utilities for spacing and typography**
4. **Responsive container structure for different platform layouts**

## Acceptance Criteria Status

### ✅ 1. Base Wrapper Component with Dark/Light Toggle

**Files:**
- `src/public/frames-theme.js` - Core theme management system
- `src/public/frame-renderer.js` - Unified frame rendering API
- `src/public/frame-layouts.css` - Layout system for 3 platform types

**Features:**
- `FrameTheme.initFrameThemeSystem(globalTheme)` - Initializes theme system with MutationObserver
- `FrameTheme.setFrameTheme(frameId, theme)` - Set theme for individual frame
- `FrameTheme.toggleFrameTheme(frameId)` - Toggle between dark/light/auto
- `FrameTheme.generateFrameHTML(options)` - Generate complete frame structure
- Auto-sync with global theme via `data-theme` attribute observer
- Theme persistence via localStorage

**Integration Point:**
- Global theme toggle button in `index.html` (#globalThemeToggle)
- `app.js` `applyTheme()` function sets `data-theme` attribute
- `frames-theme.js` MutationObserver watches for theme changes
- All frames with `theme: 'auto'` inherit global theme automatically

### ✅ 2. Platform Color Palette System

**File:** `src/public/platform-frames.js`

**Platform Categories:**

#### Search Layout (Google)
```javascript
google: {
  themeVars: {
    dark: { --frame-bg: '#202124', --frame-accent: '#8ab4f8', ... },
    light: { --frame-bg: '#ffffff', --frame-accent: '#1a73e8', ... }
  }
}
```

#### Card Layout (Facebook, Twitter, LinkedIn)
```javascript
facebook: { themeVars: { dark: {...}, light: {...} } }
twitter: { themeVars: { dark: {...}, light: {...} } }
linkedin: { themeVars: { dark: {...}, light: {...} } }
```

#### Message Layout (Slack, Discord)
```javascript
slack: { themeVars: { dark: {...}, light: {...} } }
discord: { themeVars: { dark: {...}, light: {...} } }
```

**CSS Variable Schema:**
- `--frame-bg` - Background color
- `--frame-surface` - Surface/card background
- `--frame-border` - Border color
- `--frame-text-primary` - Primary text
- `--frame-text-secondary` - Secondary text
- `--frame-text-muted` - Muted/disabled text
- `--frame-accent` - Brand/accent color
- `--frame-accent-bg` - Accent background
- `--frame-link-color` - Link color
- `--frame-divider` - Divider line color
- `--frame-input-bg` - Input background
- `--frame-overlay` - Overlay/shadow color

### ✅ 3. Shared Utilities

**File:** `src/public/frames-theme.css`

**Typography Utilities:**
```css
.frame-text-primary     { color: var(--frame-text-primary); }
.frame-text-secondary   { color: var(--frame-text-secondary); }
.frame-text-muted       { color: var(--frame-text-muted); }
.frame-text-accent      { color: var(--frame-accent); }
```

**Size Variants:**
```css
.frame-compact   { font-size: 12px; max-width: 400px; }
.frame-standard  { font-size: 14px; max-width: 500px; }
.frame-expanded  { font-size: 15px; max-width: 600px; }
```

**Alignment Utilities:**
```css
.frame-align-left    { margin-right: auto; }
.frame-align-center  { margin-left: auto; margin-right: auto; }
.frame-align-right   { margin-left: auto; }
```

**Component Utilities:**
- `.frame-avatar` - User avatar placeholder
- `.frame-link` - Styled links
- `.frame-surface` - Surface/card elements
- `.frame-divider` - Divider lines
- `.frame-badge` - Badge/icon elements

### ✅ 4. Container Structure (3 Platform Layouts)

**File:** `src/public/frame-layouts.css`

#### Layout Types:

**CARD Layout** (Facebook, Twitter, LinkedIn, etc.)
```css
.card-frame {
  display: flex;
  flex-direction: column;
}
.card-frame .frame-link-preview-image {
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
```

**MESSAGE Layout** (Slack, Discord)
```css
.message-frame {
  display: flex;
  flex-direction: column;
  background: var(--frame-bg);
}
.frame-message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

**SEARCH Layout** (Google)
```css
.search-frame {
  display: flex;
  flex-direction: column;
}
.frame-search-result {
  padding: 12px 16px;
  border-bottom: 1px solid var(--frame-divider);
}
```

#### Responsive Container System:

**Frame Grid:**
```css
.frame-grid {
  display: grid;
  gap: 20px;
}
/* Mobile: 1 column */
@media (max-width: 767px) { .frame-grid { grid-template-columns: 1fr; } }
/* Tablet: 2 columns */
@media (min-width: 768px) and (max-width: 1023px) { .frame-grid { grid-template-columns: repeat(2, 1fr); } }
/* Desktop: 3 columns */
@media (min-width: 1024px) { .frame-grid { grid-template-columns: repeat(3, 1fr); } }
```

**Frame Row/Column:**
```css
.frame-row { display: flex; flex-direction: column; gap: 16px; }
.frame-column { display: flex; flex-direction: row; gap: 16px; flex-wrap: wrap; }
```

## API Reference

### FrameRenderer Module (`frame-renderer.js`)

```javascript
// Main rendering function
FrameRenderer.renderPlatformFrame({
  platform: 'slack',
  title: 'My Page',
  description: 'Description here',
  domain: 'example.com',
  image: 'https://example.com/image.jpg',
  siteName: 'Example',
  theme: 'auto'  // 'dark', 'light', or 'auto'
});

// Utility functions
FrameRenderer.getFrameType(platform);  // Returns 'card', 'message', or 'search'
FrameRenderer.getAllFrames();          // Get all frame elements
FrameRenderer.getFramesByPlatform('slack');
FrameRenderer.getFramesByType('card');

// Theme management
FrameRenderer.initFrameRenderer(globalTheme);
FrameRenderer.applyPlatformTheme(platform, theme);
FrameRenderer.toggleFrameTheme(frameId, fallbackTheme);
```

### FrameTheme Module (`frames-theme.js`)

```javascript
// Initialization
FrameTheme.initFrameThemeSystem('dark');

// Frame generation
FrameTheme.generateFrameHTML({
  id: 'frame-1',
  platform: 'slack',
  theme: 'auto',
  header: '<span>Header</span>',
  body: '<div>Content</div>',
  footer: '<span>Footer</span>'
});

// Component generators
FrameTheme.generateFrameHeader({ title: 'Title', icon: '📘' });
FrameTheme.generateFrameFooter({ items: ['Like', 'Comment', 'Share'] });
FrameTheme.generateAvatar({ emoji: '👤', size: 'md' });
FrameTheme.generateLinkPreview({ domain, title, description, image });

// Theme management
FrameTheme.setFrameTheme(frameId, 'dark');
FrameTheme.getFrameTheme(frameId);
FrameTheme.toggleFrameTheme(frameId, 'light');
FrameTheme.applyPlatformTheme('slack', 'dark');
```

## Usage Example

```javascript
// Render a Slack message frame with dark theme
const frameHTML = FrameRenderer.renderPlatformFrame({
  platform: 'slack',
  title: 'My Article',
  description: 'Check out this amazing article about...',
  domain: 'example.com',
  image: 'https://example.com/og-image.jpg',
  siteName: 'Example.com',
  theme: 'dark',
  frameId: 'slack-frame-1'
});

// Insert into DOM
document.getElementById('container').innerHTML = frameHTML;

// Later: toggle theme
FrameRenderer.toggleFrameTheme('slack-frame-1', 'light');
```

## Testing

A verification page is available at:
`src/public/verify-frame-infrastructure.html`

This page demonstrates:
- Theme toggle functionality
- All 6 platform color palettes (Google, Facebook, Twitter, LinkedIn, Slack, Discord)
- Typography and spacing utilities
- Responsive container structure
- All 3 layout types (Search, Card, Message)

## File Structure

```
src/public/
├── frames-theme.js          # Theme management and base structure
├── frames-theme.css          # CSS variables and base styles
├── frame-renderer.js         # Unified rendering API
├── frame-layouts.css         # Layout system for 3 platform types
├── platform-frames.js        # Platform definitions and color palettes
├── platform-frames.css       # Platform-specific styles (in main style.css)
└── verify-frame-infrastructure.html  # Test/verification page
```

## Integration Notes

1. **Global Theme Sync:** The system automatically syncs with the app's global theme via `data-theme` attribute on `document.documentElement`

2. **Platform-Specific Styles:** Each platform can have custom CSS classes that target `.platform-context` selector

3. **Accessibility:** All frames include proper ARIA attributes and support keyboard navigation, high contrast mode, and reduced motion preferences

4. **Performance:** Frames use CSS transitions for smooth theme switching without JavaScript layout thrashing

5. **Extensibility:** Adding new platforms requires:
   - Entry in `platform-frames.js` with `themeVars` for dark/light
   - Optional custom CSS in `style.css` using `.platform-context` selector
   - Frame type classification (card/message/search) for automatic layout
