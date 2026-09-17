# Platform Context Frames Architecture

## Overview

The platform context frames architecture provides a standardized data structure for generating UI chrome and neutral placeholder content around link previews in VISTA. This module centralizes all platform-specific rendering logic, making it easier to maintain, extend, and support dark/light theme switching.

## Inventory scope

The canonical product inventory is the 43 platform IDs documented in
[`PLATFORM_INVENTORY.md`](PLATFORM_INVENTORY.md) and defined in
`src/scorer.js`. Do not use a frame-template count as the product platform
count.

The runtime frame registry in `src/public/platform-frames.js` currently has 46
concrete templates: the 43 canonical IDs plus the frame-only IDs `matrix`,
`sms`, and `twitch`. Its `generic` entry is a fallback template, not a
platform. The centralized routing metadata in
`src/platform-frames.config.ts` (mirrored by
`src/public/platform-frames-config.js`) currently covers 23 migrated routes;
other canonical platforms use the legacy renderer until migrated.

## Architecture

### Module Location

- **Frame templates and runtime tokens:** `src/public/platform-frames.js`
- **Routing metadata:** `src/platform-frames.config.ts` and its browser mirror
  `src/public/platform-frames-config.js`
- **Global and platform theme aliases:** `src/public/frames-theme.css`
- **Platform chrome/link-card rules:** `src/public/social-platforms-frames.css`
- **Application and legacy frame rules:** `src/public/style.css`

### Core Components

#### 1. Data Structure (`PLATFORM_FRAMES`)

Each platform frame is defined with the following properties:

```javascript
{
  name: string,              // Display name (e.g., 'X (Twitter)')
  category: string,          // Platform category (social, messaging, collaboration, content, email, rss)
  hasThemeSupport: boolean,  // Whether dark/light mode is supported
  aspectRatio: string,       // Card aspect ratio (e.g., '1.91:1', 'variable')
  chrome: string,            // HTML template for UI chrome with {{placeholders}}
  neutralContent: string,    // HTML template for neutral placeholder content
  themeVars: {               // CSS custom properties for theming
    dark: { object },        // Dark mode CSS variables
    light: { object }        // Light mode CSS variables
  }
}
```

#### 2. Template Placeholders

Chrome templates use `{{placeholder}}` syntax for dynamic content:

- `{{mainResult}}` - Main content section
- `{{userMessage}}` - User's message in messaging platforms
- `{{linkPreview}}` - Link preview card
- `{{linkCard}}` - Alternative link preview (for Twitter)
- `{{cardContent}}` - Raw card HTML (for generic platforms)
- `{{title}}` - OG title
- `{{description}}` - OG description
- `{{image}}` - OG image URL
- `{{domain}}` - URL domain
- `{{site}}` - OG site name
- `{{themeColor}}` - Platform accent color

#### 3. Theme Variables

CSS custom properties for consistent theming:

```css
--frame-bg              /* Frame background color */
--frame-surface         /* Surface/card background color */
--frame-border          /* Border color */
--frame-text-primary    /* Primary text color */
--frame-text-secondary  /* Secondary text color */
--frame-text-muted      /* Muted/disabled text color */
--frame-accent          /* Accent/brand color */
--frame-accent-bg       /* Accent background color */
--frame-link-color      /* Link color */
--frame-divider         /* Divider line color */
--frame-input-bg        /* Input background color */
--frame-overlay         /* Overlay/shadow color */
```

## Usage

### In app.js

The `renderPlatformWithContext()` function uses the new architecture:

```javascript
function renderPlatformWithContext(pid, meta, imageProbe, baseUrl, theme, dominantColor) {
  const contentData = {
    title: meta.og.title || meta.title,
    description: meta.og.description || meta.description,
    image: meta.og.image || meta.twitter.image,
    domain: getDomain(baseUrl),
    site: meta.og.site_name,
    dominantColor: dominantColor,
    themeColor: meta.themeColor || '#5865f2',
  };

  // Use structured frame generation for supported platforms
  if (typeof buildContextFrame === 'function') {
    return buildContextFrame(pid, contentData, theme);
  }

  // Fallback to legacy renderer
  return renderPlatformWithContextLegacy(...);
}
```

### Checking Theme Support

```javascript
// Check if a platform supports theme toggle
if (hasThemeSupport('twitter')) {
  // Platform has dark/light mode
}

// Get the themed frame IDs from the runtime registry
const themedPlatforms = getPlatformsWithThemeSupport();
```

### Applying Theme Variables

```javascript
// Apply theme to DOM element
applyThemeToElement(element, 'slack', 'dark');

// Generate CSS for a platform
const css = generateAllThemeCSS('discord');

// Get inline style string
const inlineStyles = getInlineThemeStyles('twitter', 'light');
```

## Adding a New Platform Frame

### Step 1: Add to PLATFORM_FRAMES

In `src/public/platform-frames.js`, add your platform entry:

```javascript
const PLATFORM_FRAMES = {
  // ... existing platforms

  newsplatform: {
    name: 'News Platform',
    category: 'content',
    hasThemeSupport: false,  // Set to true if dark/light mode is supported
    aspectRatio: '1.91:1',
    chrome: `
      <div class="newsplatform-header">
        <span class="newsplatform-logo">NP</span>
        <span class="newsplatform-title">Latest News</span>
      </div>
      {{mainResult}}
      <div class="newsplatform-footer">More stories →</div>
    `,
    neutralContent: `
      <div class="newsplatform-article">
        <div class="newsplatform-domain">{{domain}}</div>
        <div class="newsplatform-title">{{title}}</div>
        <div class="newsplatform-desc">{{description}}</div>
        {{imageSection}}
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        // ... define all theme variables
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f5f5f5',
        // ... define all theme variables
      },
    },
  },
};
```

### Step 2: Add CSS Classes to the appropriate stylesheet

Add platform-specific chrome rules to `src/public/social-platforms-frames.css`
and platform theme aliases to `src/public/frames-theme.css`. Use
`src/public/style.css` only when the rule is part of the application's legacy
card renderer:

```css
/* News Platform Context */
.newsplatform-context { max-width: 500px; }
.newsplatform-header { display: flex; gap: 10px; padding: 12px; background: var(--frame-bg); }
.newsplatform-logo { width: 32px; height: 32px; background: var(--frame-accent); border-radius: 50%; }
.newsplatform-title { font-weight: 600; color: var(--frame-text-primary); }
/* ... add more CSS rules */

/* Theme Variables */
.newsplatform-context {
  --frame-bg: #ffffff;
  --frame-surface: #f5f5f5;
  /* ... default theme variables */
}
```

### Step 3: Update app.js

Add your platform to the renderPlatformWithContext switch:

```javascript
switch (pid) {
  // ... existing cases
  case 'newsplatform':
    return buildContextFrame('newsplatform', contentData, theme);
}
```

### Step 4: Add to the frame configuration (if the route is migrated)

Add the platform to `src/platform-frames.config.ts` and keep
`src/public/platform-frames-config.js` synchronized. Theme support is then
read from the configuration; do not maintain a second hand-written platform
list in `PLATFORMS_WITH_THEME`.

### Step 5: Test

1. Load VISTA with a URL
2. Click the context toggle on your platform's card
3. Verify the frame renders correctly
4. If `hasThemeSupport: true`, test theme toggle

## Platform Migration Status

### ✅ Fully Migrated (Using New Architecture)
- Twitter/X
- Slack
- Discord

### 🔄 Partially Migrated (Legacy Renderer with Theme Variables)
- Google
- Facebook
- LinkedIn
- Reddit
- WhatsApp
- iMessage
- Telegram
- Signal
- Teams
- Google Chat
- Mastodon
- Bluesky
- Threads
- Tumblr
- Pinterest
- Notion
- Jira
- GitHub
- Trello
- Figma
- Medium
- Substack
- Outlook
- Gmail
- Feedly
- Zoom
- Line
- KakaoTalk

### ❌ Not Started
- (All platforms have at least basic context rendering)

## Helper Functions Reference

### `getPlatformFrame(platformId)`
Returns the platform frame definition or generic fallback.

### `hasThemeSupport(platformId)`
Returns `true` if the platform supports dark/light mode toggle.

### `getThemeVars(platformId, theme)`
Returns CSS custom properties object for the specified theme.

### `getPlatformsWithThemeSupport()`
Returns array of platform IDs that support theme toggle.

### `generateThemeCSS(platformId, theme)`
Generates CSS style string for a platform's theme.

### `generateAllThemeCSS(platformId)`
Generates complete CSS with both dark and light theme classes.

### `applyThemeToElement(element, platformId, theme)`
Applies theme CSS variables directly to a DOM element.

### `buildContextFrame(platformId, content, theme)`
Builds complete context frame HTML with chrome and content.

### `buildLinkPreviewHTML(platformId, content, theme)`
Builds platform-specific link preview HTML.

### `interpolateTemplate(template, vars)`
Replaces `{{placeholders}}` in template with values.

## Best Practices

1. **Use Semantic Placeholders:** Stick to the defined placeholder names (`{{title}}`, `{{description}}`, etc.) for consistency.

2. **Define Both Themes:** Even if `hasThemeSupport` is `false`, define both dark and light theme variables for future compatibility.

3. **Keep Chrome Minimal:** Chrome should be minimal UI elements only. Heavy content goes in `neutralContent`.

4. **Neutral Content:** Use generic, non-specific placeholder content (e.g., "Jane Smith", "2h ago") rather than real user data.

5. **CSS Variables:** Frame templates use the generic `--frame-*` runtime
   tokens. Stylesheet chrome may use a platform alias such as
   `--youtube-bg`, with a `--frame-*-global` fallback where appropriate. Keep
   those token layers distinct.

6. **Test Both Modes:** For platforms with `hasThemeSupport: true`, visually inspect both dark and light themes.

## Examples

See the existing implementations for reference:
- **Twitter** (`twitter`) - Simple social media post frame with theme support
- **Slack** (`slack`) - Messaging platform with sidebar and main content
- **Discord** (`discord`) - Similar to Slack but with different layout and theming

## Troubleshooting

### Frame Not Rendering
1. Check that the platform ID matches the key in `PLATFORM_FRAMES`
2. Verify `platform-frames.js` is loaded before `app.js`
3. Check browser console for template interpolation errors

### Theme Not Applying
1. Verify `hasThemeSupport` is `true` for the platform
2. Check that frame tokens are defined in `platform-frames.js` and stylesheet
   aliases are defined in `frames-theme.css`
3. Ensure the correct theme class (`dark-theme` or `light-theme`) is applied to the context frame element

### Images Not Loading
1. Verify the `{{imageSection}}` placeholder is in the correct location
2. Check that `imageProbe` or `dominantColor` is passed correctly
3. Ensure image URLs are absolute (not relative)
