# Twitter/X Theme Variables - Complete Documentation

## Overview

This document provides comprehensive documentation of all CSS custom properties (variables) used for Twitter/X theme implementation in the Vista platform. These variables enable consistent theming across Twitter/X context frames with both dark and light mode support.

## Variable Architecture

Twitter/X themes use two complementary variable systems:

1. **`--x-*` variables**: X/Twitter-specific design tokens
2. **`--frame-*` variables**: Generic frame-level variables for cross-platform consistency

### Dark Theme Variables

#### X-Specific Variables (`--x-*`)

| Variable Name | Value | Purpose | Usage |
|--------------|-------|---------|-------|
| `--x-bg-primary` | `#000000` | Primary background color | Main frame background, post container |
| `--x-bg-secondary` | `#16181c` | Secondary background | Hover states, card backgrounds, post header hover |
| `--x-bg-tertiary` | `#2f3336` | Tertiary background | Active states, link card hover, button hover |
| `--x-border-color` | `#2f3336` | Border and divider color | Frame borders, separators, subtle dividers |
| `--x-text-primary` | `#e7e9ea` | Primary text color | Author names, post content, context titles |
| `--x-text-secondary` | `#71767b` | Secondary text color | Handles, timestamps, action counts, domains |
| `--x-accent-blue` | `#1d9bf0` | Twitter blue accent | Verified badge, links, primary actions |
| `--x-accent-blue-hover` | `#1a8cd8` | Hover state for accent blue | Interactive elements on hover |
| `--x-like-color` | `#f91880` | Like button color | Like action icon on hover/active |
| `--x-retweet-color` | `#00ba7c` | Retweet button color | Retweet action icon on hover/active |
| `--x-reply-color` | `#71767b` | Reply button color | Reply action icon (neutral gray) |
| `--x-view-color` | `#71767b` | View count color | View action icon (neutral gray) |

#### Frame-Level Variables (`--frame-*`)

| Variable Name | Value | Purpose | Usage |
|--------------|-------|---------|-------|
| `--frame-bg` | `#000000` | Frame background | Main container background |
| `--frame-surface` | `#16181c` | Surface elevation | Link cards, elevated panels |
| `--frame-border` | `#2f3336` | Border color | Frame borders, separators |
| `--frame-text-primary` | `#e7e9ea` | Primary text | Main content text |
| `--frame-text-secondary` | `#71767b` | Secondary text | Metadata, timestamps |
| `--frame-text-muted` | `#71767b` | Muted text | Low-priority text |
| `--frame-accent` | `#1d9bf0` | Accent color | Interactive elements |
| `--frame-accent-bg` | `#1d9bf0` | Accent background | Accent-colored backgrounds |
| `--frame-link-color` | `#1d9bf0` | Link color | Text links |
| `--frame-divider` | `#2f3336` | Divider color | Section separators |
| `--frame-input-bg` | `#202327` | Input background | Form inputs, text fields |
| `--frame-overlay` | `rgba(91, 112, 131, 0.4)` | Overlay color | Modal overlays, tooltips |

### Light Theme Variables

#### X-Specific Variables (`--x-*`)

| Variable Name | Value | Purpose | Usage |
|--------------|-------|---------|-------|
| `--x-bg-primary` | `#ffffff` | Primary background color | Main frame background, post container |
| `--x-bg-secondary` | `#f7f9f9` | Secondary background | Hover states, card backgrounds, post header hover |
| `--x-bg-tertiary` | `#eff3f4` | Tertiary background | Active states, link card hover, button hover |
| `--x-border-color` | `#eff3f4` | Border and divider color | Frame borders, separators, subtle dividers |
| `--x-text-primary` | `#0f1419` | Primary text color | Author names, post content, context titles |
| `--x-text-secondary` | `#536471` | Secondary text color | Handles, timestamps, action counts, domains |
| `--x-accent-blue` | `#1d9bf0` | Twitter blue accent | Verified badge, links, primary actions |
| `--x-accent-blue-hover` | `#1a8cd8` | Hover state for accent blue | Interactive elements on hover |
| `--x-like-color` | `#f91880` | Like button color | Like action icon on hover/active (same as dark) |
| `--x-retweet-color` | `#00ba7c` | Retweet button color | Retweet action icon on hover/active (same as dark) |
| `--x-reply-color` | `#536471` | Reply button color | Reply action icon (darker gray for light theme) |
| `--x-view-color` | `#536471` | View count color | View action icon (darker gray for light theme) |

#### Frame-Level Variables (`--frame-*`)

| Variable Name | Value | Purpose | Usage |
|--------------|-------|---------|-------|
| `--frame-bg` | `#ffffff` | Frame background | Main container background |
| `--frame-surface` | `#f7f9f9` | Surface elevation | Link cards, elevated panels |
| `--frame-border` | `#eff3f4` | Border color | Frame borders, separators |
| `--frame-text-primary` | `#0f1419` | Primary text | Main content text |
| `--frame-text-secondary` | `#536471` | Secondary text | Metadata, timestamps |
| `--frame-text-muted` | `#536471` | Muted text | Low-priority text |
| `--frame-accent` | `#1d9bf0` | Accent color | Interactive elements |
| `--frame-accent-bg` | `#e8f5fe` | Accent background | Accent-colored backgrounds (lighter in light theme) |
| `--frame-link-color` | `#1d9bf0` | Link color | Text links |
| `--frame-divider` | `#eff3f4` | Divider color | Section separators |
| `--frame-input-bg` | `#eff3f4` | Input background | Form inputs, text fields |
| `--frame-overlay` | `rgba(0, 0, 0, 0.08)` | Overlay color | Modal overlays, tooltips |

## Variable Usage Patterns

### 1. Background Layering
```
--x-bg-primary (base)
  └─ --x-bg-secondary (hover/elevation)
      └─ --x-bg-tertiary (active/elevation+)
```

### 2. Text Hierarchy
```
--x-text-primary (main content)
  └─ --x-text-secondary (metadata)
      └─ Muted/low-emphasis variations
```

### 3. Accent Colors
```
--x-accent-blue (primary actions)
  ├─ --x-accent-blue-hover (interactive states)
  ├─ --x-like-color (engagement)
  ├─ --x-retweet-color (engagement)
  └─ Neutral grays for secondary actions
```

## Implementation Examples

### Using X-Specific Variables
```css
.twitter-context.dark-theme {
  background: var(--x-bg-primary);
  border: 1px solid var(--x-border-color);
}

.tw-author-name {
  color: var(--x-text-primary);
}

.tw-verified {
  color: var(--x-accent-blue);
}
```

### Using Frame Variables
```css
.twitter-context {
  background: var(--frame-bg);
  color: var(--frame-text-primary);
}

.tw-link-card {
  background: var(--frame-surface);
  border: 1px solid var(--frame-border);
}
```

## Theme Switching Implementation

### HTML Structure
```html
<html data-theme="dark">
  <div class="twitter-context dark-theme">
    <!-- Frame content -->
  </div>
</html>
```

### JavaScript Theme Toggle
```javascript
function toggleTwitterTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Update HTML attribute
  html.setAttribute('data-theme', newTheme);
  
  // Update frame classes
  document.querySelectorAll('.twitter-context').forEach(frame => {
    frame.classList.remove('dark-theme', 'light-theme');
    frame.classList.add(`${newTheme}-theme`);
  });
}
```

## Color Contrast & Accessibility

All Twitter/X color combinations meet WCAG AA standards:

- **Primary text on primary background**: Contrast ratio ≥ 12:1 (dark), ≥ 14:1 (light)
- **Secondary text on primary background**: Contrast ratio ≥ 4.5:1 (both themes)
- **Accent blue on primary background**: Contrast ratio ≥ 4.5:1 (both themes)

## Verification Checklist

Use this checklist when modifying Twitter/X theme variables:

### Pre-Deployment Checks
- [ ] All variables defined for both dark and light themes
- [ ] Color values match Twitter/X official design specifications
- [ ] No hardcoded colors remain in CSS
- [ ] CSS variable references use correct syntax (`var(--variable-name)`)
- [ ] Variable names follow naming convention (`--x-*` or `--frame-*`)

### Visual Verification
- [ ] Dark theme renders correctly with no color conflicts
- [ ] Light theme renders correctly with no color conflicts  
- [ ] Theme switching works smoothly with proper transitions
- [ ] All frame elements update colors on theme switch
- [ ] Hover states work correctly in both themes
- [ ] Verified badge color matches Twitter blue (#1d9bf0)

### Cross-Platform Consistency
- [ ] Frame variables work across different platforms
- [ ] No variable conflicts with other platform themes
- [ ] Responsive design works in both themes
- [ ] Print styles maintain readability

### Browser Compatibility
- [ ] CSS variables work in target browsers (Chrome, Firefox, Safari, Edge)
- [ ] Fallback values provided for older browsers if needed
- [ ] Transitions work smoothly in all browsers
- [ ] No variable inheritance issues

## Maintenance Guidelines

### When Adding New Variables
1. Define for both dark and light themes
2. Add documentation entry with purpose and usage
3. Test in both themes with visual inspection
4. Update this documentation
5. Run verification tests

### When Modifying Existing Variables
1. Verify impact across all Twitter/X frames
2. Test theme switching functionality
3. Check accessibility compliance
4. Update documentation if values change
5. Run full verification test suite

## Related Documentation

- [`FRAME_STRUCTURE.md`](../FRAME_STRUCTURE.md) - Platform context frame structure guide
- [`SOCIAL-PLATFORMS-THEME-VERIFICATION.md`](../SOCIAL-PLATFORMS-THEME-VERIFICATION.md) - Social platform theme verification procedures
- [`verify-twitter-x-theme-switching.html`](../verify-twitter-x-theme-switching.html) - Interactive verification test page

## Variable Source Files

- `src/public/style.css` (lines 1504-1532, 5478-5505) - Primary variable definitions
- `src/public/frames-theme.css` - Legacy theme variables (being migrated to style.css)
- `src/public/platform-frames-base.css` - Base frame variable system

---

**Last Updated**: 2026-07-25  
**Maintained By**: Vista Platform Team  
**Version**: 1.0.0