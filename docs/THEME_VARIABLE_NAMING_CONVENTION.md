# Vista Theme Variable Naming Convention

## Overview

Vista uses a comprehensive CSS variable system for platform-agnostic dark/light theme support. The naming convention follows a hierarchical structure that ensures consistency across all platforms and makes the theme system maintainable and extensible.

## Naming Convention Structure

### Pattern: `--{platform}-{category}-{type}`

- **platform**: Platform identifier (optional for global variables)
- **category**: Functional category (bg, surface, text, accent, etc.)
- **type**: Specific variant (primary, secondary, muted, etc.)

### Examples

- `--youtube-bg` - YouTube platform background color
- `--github-text-primary` - GitHub platform primary text color
- `--frame-border-global` - Global frame border color

## Variable Categories

### 1. Base/Background Colors
- `{platform}-bg`: Main background color
- `{platform}-surface`: Elevated surface/card background
- `{platform}-input-bg`: Input field background

### 2. Border & Divider Colors
- `{platform}-border`: Default border color
- `{platform}-divider`: Content divider lines

### 3. Text Colors
- `{platform}-text-primary`: Primary text (headings, important content)
- `{platform}-text-secondary`: Secondary text (descriptions, metadata)
- `{platform}-text-muted`: Muted text (disabled state, less important)

### 4. Accent & Interactive Colors
- `{platform}-accent`: Primary accent color (buttons, links)
- `{platform}-accent-bg`: Accent background color
- `{platform}-link-color`: Hyperlink color

### 5. Overlay & Utility Colors
- `{platform}-overlay`: Modal/overlay background
- `{platform}-shadow`: Drop shadow color

## Platform Identifiers

The 7 main platforms use these identifiers:
- `youtube`: YouTube video platform
- `twitch`: Twitch streaming platform
- `twitter` / `x`: Twitter/X social platform
- `reddit`: Reddit social platform
- `tiktok`: TikTok video platform
- `github`: GitHub development platform
- `gitlab`: GitLab development platform

## Global Variables

Global frame variables use the `frame-` prefix with `-global` suffix:
- `--frame-bg-global`: Global default background
- `--frame-text-primary-global`: Global default text
- `--frame-accent-global`: Global default accent

## Theme Mode Variables

### Dark Mode (Default)
Dark mode variables are defined in `:root`:
```css
:root {
  --youtube-bg: var(--color-youtube-dark-bg);
  --youtube-text-primary: var(--color-white);
}
```

### Light Mode
Light mode variables override in `[data-theme='light']`:
```css
[data-theme='light'] {
  --youtube-bg: var(--color-youtube-light-bg);
  --youtube-text-primary: var(--color-youtube-light-text-primary);
}
```

## Color Token Variables

Base color tokens use the `color-` prefix:
- `--color-bg-dark-primary`: Dark mode primary background
- `--color-text-light-primary`: Light mode primary text
- `--color-youtube-red`: YouTube brand color
- `--color-reddit-orange`: Reddit brand color

## Usage in Components

### Direct Platform Variables
```css
.youtube-frame {
  background: var(--youtube-bg);
  color: var(--youtube-text-primary);
  border: 1px solid var(--youtube-border);
}
```

### Fallback to Global
```css
.platform-frame {
  background: var(--youtube-bg, var(--frame-bg-global));
  color: var(--youtube-text-primary, var(--frame-text-primary-global));
}
```

### Chrome Components
```css
.youtube-chrome {
  --youtube-chrome-bg: var(--youtube-bg);
  --youtube-chrome-surface: var(--youtube-surface);
  --youtube-chrome-text: var(--youtube-text-primary);
}
```

## Adding New Platforms

When adding a new platform, follow these steps:

1. **Define Base Color Tokens**
   ```css
   /* Color Tokens */
   --color-newplatform-dark-bg: #1a1a1a;
   --color-newplatform-light-bg: #ffffff;
   ```

2. **Create Platform Theme Variables**
   ```css
   /* Dark Mode */
   :root {
     --newplatform-bg: var(--color-newplatform-dark-bg);
     --newplatform-surface: var(--color-newplatform-dark-surface);
     --newplatform-text-primary: var(--color-newplatform-dark-text-primary);
   }

   /* Light Mode */
   [data-theme='light'] {
     --newplatform-bg: var(--color-newplatform-light-bg);
     --newplatform-surface: var(--color-newplatform-light-surface);
     --newplatform-text-primary: var(--color-newplatform-light-text-primary);
   }
   ```

3. **Create Chrome Variables**
   ```css
   .newplatform-chrome {
     --newplatform-chrome-bg: var(--newplatform-bg);
     --newplatform-chrome-surface: var(--newplatform-surface);
   }
   ```

## Accessibility Guidelines

### Contrast Ratios
- **Primary text**: Must have ≥4.5:1 contrast ratio against background
- **Large text**: Must have ≥3:1 contrast ratio against background
- **Interactive elements**: Must have ≥3:1 contrast ratio

### Testing
Test contrast ratios in both themes using:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser dev tools color contrast analysis

## Theme Switching

Theme switching is handled via the `data-theme` attribute on `<html>`:
- `data-theme="dark"`: Dark mode (default)
- `data-theme="light"`: Light mode

The CSS automatically switches variables when the attribute changes:
```javascript
document.documentElement.setAttribute('data-theme', 'light');
```

## Variable Inheritance Chain

1. **Component uses**: `--youtube-text-primary`
2. **Platform defines**: `--youtube-text-primary: var(--color-youtube-dark-text-primary)`
3. **Color token defines**: `--color-youtube-dark-text-primary: #ffffff`
4. **Final value**: `#ffffff`

## Best Practices

1. **Always use CSS variables** instead of hardcoding colors
2. **Provide fallbacks** to global variables for new platforms
3. **Test both themes** when adding new variables
4. **Group related variables** together in CSS files
5. **Use semantic names** (text-primary, not text-white)
6. **Document custom variables** in component comments

## File Organization

- **frames-theme.css**: Global theme variables and platform-specific theme variables
- **platform-chrome-styles.css**: Platform-specific chrome component variables
- **Component CSS**: Use existing variables, don't define new ones unless necessary

## Migration Guide

### Hardcoded Colors to Variables

**Before:**
```css
.youtube-header {
  background: #0f0f0f;
  color: #ffffff;
}
```

**After:**
```css
.youtube-header {
  background: var(--youtube-bg);
  color: var(--youtube-text-primary);
}
```

### Platform-Specific to Generic

**Before:**
```css
.header {
  background: #0f0f0f; /* YouTube dark */
}
```

**After:**
```css
.header {
  background: var(--youtube-bg, var(--frame-bg-global));
}
```

## Debugging Theme Issues

### Check Variable Values
```css
/* Add to your CSS for debugging */
* {
  background-color: var(--youtube-bg, red) !important;
}
```

### List All Variables
```javascript
// Browser console
const root = getComputedStyle(document.documentElement);
for (let i = 0; i < root.length; i++) {
  const name = root[i];
  if (name.includes('youtube')) {
    console.log(`${name}: ${root.getPropertyValue(name)}`);
  }
}
```

## Performance Considerations

- CSS variables are efficiently cached by browsers
- Theme changes trigger reflows, but are fast on modern browsers
- Avoid excessive variable nesting (max 3 levels)
- Group variable changes together when possible

## Browser Support

CSS custom properties are supported in:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

Theme switching requires `data-theme` attribute support (universal).

---

## Summary Table

| Category | Variable Pattern | Example |
|----------|------------------|---------|
| Background | `--{platform}-bg` | `--youtube-bg` |
| Surface | `--{platform}-surface` | `--github-surface` |
| Border | `--{platform}-border` | `--reddit-border` |
| Text Primary | `--{platform}-text-primary` | `--twitch-text-primary` |
| Text Secondary | `--{platform}-text-secondary` | `--gitlab-text-secondary` |
| Accent | `--{platform}-accent` | `--twitter-accent` |
| Link Color | `--{platform}-link-color` | `--tiktok-link-color` |

This system ensures consistent, maintainable theming across all Vista platforms.
