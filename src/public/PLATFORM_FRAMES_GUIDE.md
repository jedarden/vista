# Platform Context Frames Guide

Complete guide for implementing and using platform context frames in Vista.

## Overview

Platform context frames provide realistic platform-specific chrome (UI frames) that surround link previews, making it easy to understand how content will appear when shared on different platforms.

## Architecture

### Data Structure

Each platform frame is defined with:

```typescript
interface PlatformFrame {
  name: string;              // Display name
  category: PlatformCategory; // Platform category
  hasThemeSupport: boolean;   // Dark/light mode toggle support
  aspectRatio: AspectRatio;   // Preferred frame dimensions
  chrome: string;             // HTML template for UI chrome
  neutralContent: string;     // HTML template for user content
  themeVars: PlatformThemeVars; // CSS variables for theming
}
```

### Module Structure

The platform frames system consists of:

1. **platform-frames.js** - Core data definitions and helper functions
2. **platform-frames-renderer.js** - Enhanced rendering engine with caching, validation, and responsive design
3. **platform-frames-enhanced.css** - Complete CSS variable system and responsive styles
4. **types/platform-frames.d.ts** - TypeScript type definitions

## Usage

### Basic Frame Rendering

```javascript
// Simple frame rendering
const frameHTML = buildContextFrame('twitter', {
  title: 'Amazing Article',
  description: 'Check out this great content',
  image: 'https://example.com/image.jpg',
  domain: 'example.com'
}, 'dark');

// Insert into DOM
document.getElementById('frame-container').innerHTML = frameHTML;
```

### Enhanced Rendering with Options

```javascript
// Enhanced rendering with validation, caching, and accessibility
const result = PlatformFramesRenderer.buildEnhancedFrame(
  'facebook',
  {
    title: 'Great Post',
    description: 'You should read this',
    image: 'https://example.com/image.jpg',
    domain: 'example.com'
  },
  'light',
  {
    useCache: true,
    validate: true,
    accessibility: true,
    responsive: true
  }
);

// Render into container with full enhancements
PlatformFramesRenderer.renderFrame(
  document.getElementById('frame-container'),
  'linkedin',
  {
    title: 'Professional Article',
    description: 'Industry insights',
    image: 'https://example.com/image.jpg',
    domain: 'linkedin.com'
  },
  'dark'
);
```

### Theme Management

```javascript
// Check if platform supports theme toggle
if (hasThemeSupport('twitter')) {
  // Get theme variables
  const darkVars = getThemeVars('twitter', 'dark');
  const lightVars = getThemeVars('twitter', 'light');
  
  // Apply theme to element
  applyThemeToElement(element, 'twitter', 'light');
}

// Get all platforms with theme support
const themePlatforms = getPlatformsWithThemeSupport();
console.log('Platforms with theme support:', themePlatforms);

// Generate theme CSS
const themeCSS = generateAllThemeCSS('twitter');
console.log(themeCSS);
```

### Category-Based Operations

```javascript
// Get platforms by category
const socialPlatforms = PlatformFramesRenderer.getPlatformsByCategory('social');
console.log('Social platforms:', socialPlatforms);

// Get all categories
const categories = PlatformFramesRenderer.getAllCategories();
console.log('All categories:', categories);

// Get platform category info
const info = PlatformFramesRenderer.getPlatformCategoryInfo('slack');
console.log('Slack category info:', info);
```

## Adding New Platforms

### Step 1: Define Platform Frame

Add your platform to the `PLATFORM_FRAMES` object in `platform-frames.js`:

```javascript
const PLATFORM_FRAMES = {
  // ... existing platforms
  
  newsite: {
    name: 'New Site',
    category: 'social', // or messaging, collaboration, content, email, rss, other
    hasThemeSupport: true,
    aspectRatio: '1.91:1', // or 1:1, 16:9, 9:16, 2:3, variable
    chrome: `
      <div class="ns-post-header">
        <div class="ns-avatar"></div>
        <div class="ns-post-meta">
          <span class="ns-author-name">{{author}}</span>
          <span class="ns-post-time">{{timeAgo}}</span>
        </div>
      </div>
      <div class="ns-post-content">Check this out!</div>
      {{linkPreview}}
      <div class="ns-post-stats">❤️ {{likes}} · 💬 {{comments}}</div>
    `,
    neutralContent: `
      <div class="ns-comment">
        <div class="ns-comment-avatar"></div>
        <div class="ns-comment-content">
          <span class="ns-comment-author">You</span>
          <span class="ns-comment-time">Just now</span>
          <div class="ns-comment-body">{{comment}}</div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a1a',
        '--frame-surface': '#2a2a2a',
        '--frame-border': '#3a3a3a',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#a0a0a0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#0066cc',
        '--frame-accent-bg': '#0066cc',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#3a3a3a',
        '--frame-input-bg': '#2a2a2a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#0066cc',
        '--frame-accent-bg': '#e6f2ff',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};
```

### Step 2: Add Platform-Specific Link Preview

If your platform needs a custom link preview format, add it to the `buildLinkPreviewHTML` function:

```javascript
function buildLinkPreviewHTML(platformId, content, theme = 'dark') {
  // ... existing cases
  
  switch (platformId) {
    // ... existing cases
    
    case 'newsite':
      return `
        <div class="ns-link-preview">
          ${image ? `<div class="ns-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="ns-context-placeholder"></div>'}
          <div class="ns-context-meta">
            <div class="ns-context-title">${esc(trunc(title, 60))}</div>
            <div class="ns-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;
    
    // ... default case
  }
}
```

### Step 3: Add CSS Styles

Add platform-specific CSS to `style.css` or create a new stylesheet:

```css
/* New Site context frame */
.newsite-context {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.newsite-context .ns-post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--frame-divider);
}

.newsite-context .ns-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--frame-surface);
}

.newsite-context .ns-author-name {
  font-weight: 600;
  color: var(--frame-text-primary);
}

.newsite-context .ns-post-time {
  font-size: 12px;
  color: var(--frame-text-secondary);
}

/* Add responsive styles */
@media (max-width: 479px) {
  .newsite-context .ns-avatar {
    width: 32px;
    height: 32px;
  }
}
```

### Step 4: Update Category Templates (Optional)

If your platform belongs to a new category or has unique responsive needs, update the category templates in `platform-frames-renderer.js`:

```javascript
const CATEGORY_TEMPLATES = {
  // ... existing categories
  
  // New category
  news: {
    commonLayout: 'article',
    responsiveBreakpoints: {
      mobile: 350,
      tablet: 600,
      desktop: 800
    },
    defaultAspectRatio: '1.91:1'
  }
};
```

## Template System

### Placeholder Variables

The chrome and neutralContent templates support dynamic content insertion using `{{placeholder}}` syntax:

#### Common Variables

- `{{title}}` - Page title
- `{{description}}` - Page description
- `{{image}}` - Image URL
- `{{domain}}` - Domain/hostname
- `{{site}}` - Site name
- `{{author}}` - Author name
- `{{timeAgo}}` - Time ago string (e.g., "2h")
- `{{themeColor}}` - Theme accent color

#### Platform-Specific Variables

Different platforms support additional variables:

- **Social**: `{{likes}}`, `{{comments}}`, `{{shares}}`
- **Messaging**: `{{message}}`, `{{sender}}`, `{{recipient}}`
- **Developer**: `{{issueNumber}}`, `{{pullRequest}}`, `{{commit}}`
- **Email**: `{{subject}}`, `{{from}}`, `{{to}}`, `{{date}}`

#### Composite Sections

- `{{linkPreview}}` - Complete link preview card
- `{{linkCard}}` - Link card format
- `{{cardContent}}` - Custom card HTML
- `{{userMessage}}` - User's message content
- `{{userComment}}` - User's comment content

### Template Best Practices

1. **Use neutral placeholder content** - Generic names, timestamps, and stats
2. **Keep templates simple** - Focus on essential UI elements
3. **Ensure responsive design** - Use percentage widths and flexbox
4. **Include loading states** - Add placeholders for images
5. **Support accessibility** - Use semantic HTML and ARIA labels

## Theme System

### CSS Variable Structure

Each platform theme defines a complete set of CSS variables:

```css
--frame-bg:              /* Background color */
--frame-surface:         /* Surface/card background */
--frame-border:          /* Border color */
--frame-text-primary:    /* Primary text color */
--frame-text-secondary:  /* Secondary text color */
--frame-text-muted:      /* Muted/disabled text */
--frame-accent:          /* Accent/brand color */
--frame-accent-bg:       /* Accent background */
--frame-link-color:      /* Link color */
--frame-divider:         /* Divider line color */
--frame-input-bg:        /* Input background */
--frame-overlay:         /* Overlay/shadow color */
```

### Theme Guidelines

1. **Maintain contrast** - Ensure WCAG AA compliance (4.5:1 for text)
2. **Use platform-specific colors** - Match actual platform branding
3. **Support both modes** - Provide both dark and light themes
4. **Consistent semantics** - Use variables for their intended purpose

## Performance Optimization

### Caching

Frames are automatically cached to prevent re-rendering:

```javascript
// Cache is automatically used
const result1 = PlatformFramesRenderer.buildEnhancedFrame('twitter', content, 'dark');
const result2 = PlatformFramesRenderer.buildEnhancedFrame('twitter', content, 'dark');
// result2.html comes from cache
```

### Lazy Loading

Images use lazy loading by default:

```javascript
// Setup lazy loading for a frame
PlatformFramesRenderer.setupLazyLoading(frameElement);
```

### Debounced Rendering

Prevent excessive updates during rapid changes:

```javascript
// Debounce render function
const debouncedRender = PlatformFramesRenderer.debounceRender(renderFn, 100);
```

## Validation

### Content Validation

Validate content before rendering:

```javascript
const validation = PlatformFramesRenderer.validateContent({
  title: 'My Title',
  image: 'https://example.com/image.jpg'
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}
```

## Statistics and Analysis

### Get Platform Statistics

```javascript
const stats = PlatformFramesRenderer.getPlatformStats();
console.log('Total platforms:', stats.totalPlatforms);
console.log('With theme support:', stats.platformsWithThemeSupport);
console.log('By category:', stats.byCategory);
```

### Performance Measurement

```javascript
const result = PlatformFramesRenderer.measurePerformance(() => {
  return buildContextFrame('twitter', content, 'dark');
});
console.log('Render time:', result.duration, 'ms');
```

## Browser Compatibility

- **Modern browsers**: Full support
- **IE11**: Basic support (no CSS variables, limited JavaScript)
- **Mobile browsers**: Full support with responsive design

## Examples

### Complete Integration Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vista Platform Frames</title>
  
  <!-- Load enhanced CSS -->
  <link rel="stylesheet" href="platform-frames-enhanced.css">
  
  <!-- Load platform frames modules -->
  <script src="platform-frames.js"></script>
  <script src="platform-frames-renderer.js"></script>
</head>
<body>
  <div id="frame-container"></div>
  
  <script>
    // Render Twitter frame
    PlatformFramesRenderer.renderFrame(
      document.getElementById('frame-container'),
      'twitter',
      {
        title: 'Amazing Article',
        description: 'Check out this great content about web development',
        image: 'https://example.com/image.jpg',
        domain: 'example.com',
        author: 'Developer',
        timeAgo: '2h'
      },
      'dark',
      {
        responsive: true,
        accessibility: true,
        lazyLoad: true
      }
    );
  </script>
</body>
</html>
```

## Troubleshooting

### Frame Not Rendering

1. Check browser console for errors
2. Verify platform ID exists in `PLATFORM_FRAMES`
3. Ensure content data is valid
4. Check CSS is loaded

### Theme Not Applying

1. Verify theme CSS is loaded
2. Check element has correct class names
3. Ensure CSS variables are defined
4. Validate theme mode ('dark' or 'light')

### Responsive Issues

1. Check viewport meta tag
2. Verify responsive CSS is loaded
3. Test at different viewport sizes
4. Check container element constraints

## Resources

- **TypeScript Definitions**: `types/platform-frames.d.ts`
- **Core Module**: `src/public/platform-frames.js`
- **Renderer**: `src/public/platform-frames-renderer.js`
- **Enhanced CSS**: `src/public/platform-frames-enhanced.css`
- **Example Frames**: `test-*-frame.html` files

## Contributing

When adding new platforms:

1. Follow the existing structure and naming conventions
2. Provide both dark and light themes
3. Include responsive CSS
4. Add platform-specific link preview if needed
5. Update this documentation with examples

## License

Part of the Vista project. See project LICENSE for details.
