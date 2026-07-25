# Twitter/X CSS Variables Audit

## Overview
Complete inventory of all CSS variables currently defined for Twitter/X frame themes across the Vista project.

## File Locations
- `/src/public/frames-theme.css` (lines 121-179)
- `/src/public/platform-frames-base.css` (lines 671-724)
- `/src/public/platform-frames-enhanced.css` (lines 134-162)
- `/src/public/frame-layouts.css` (fallback values)

---

## Dark Theme Variables

### Core Frame Variables (frames-theme.css)

| Variable | Value | Description |
|----------|-------|-------------|
| `--twitter-bg` | `#000000` | Main background color |
| `--twitter-surface` | `#16181c` | Surface/card background |
| `--twitter-border` | `#2f3336` | Border color |
| `--twitter-text-primary` | `#e7e9ea` | Primary text color |
| `--twitter-text-secondary` | `#71767b` | Secondary text color |
| `--twitter-text-muted` | `#71767b` | Muted text color |
| `--twitter-accent` | `#1d9bf0` | Primary accent color |
| `--twitter-accent-bg` | `#1a8cd8` | Accent background color |
| `--twitter-link-color` | `#1d9bf0` | Link color |
| `--twitter-divider` | `#2f3336` | Divider line color |
| `--twitter-input-bg` | `#16181c` | Input field background |
| `--twitter-overlay` | `rgba(0, 0, 0, 0.8)` | Modal/overlay background |

### X-Specific Enhanced Variables (frames-theme.css & platform-frames-base.css)

| Variable | Value | Description |
|----------|-------|-------------|
| `--x-bg-primary` | `#000000` | Primary background |
| `--x-bg-secondary` | `#16181c` | Secondary background |
| `--x-bg-tertiary` | `#2f3336` | Tertiary background |
| `--x-border-color` | `#2f3336` | Border color |
| `--x-text-primary` | `#e7e9ea` | Primary text |
| `--x-text-secondary` | `#71767b` | Secondary text |
| `--x-text-muted` | `#71767b` | Muted text |
| `--x-accent-blue` | `#1d9bf0` | Blue accent (primary) |
| `--x-accent-blue-hover` | `#1a8cd8` | Blue accent (hover state) |
| `--x-like-color` | `#f91880` | Like/heart action color |
| `--x-retweet-color` | `#00ba7c` | Retweet/green action color |
| `--x-reply-color` | `#71767b` | Reply action color |
| `--x-view-color` | `#71767b` | View count color |

### Platform Frame Variables (platform-frames-base.css)

| Variable | Value | Description |
|----------|-------|-------------|
| `--frame-bg` | `#000000` | Frame background |
| `--frame-surface` | `#16181c` | Frame surface |
| `--frame-border` | `#2f3336` | Frame border |
| `--frame-text-primary` | `#e7e9ea` | Frame text primary |
| `--frame-text-secondary` | `#71767b` | Frame text secondary |
| `--frame-text-muted` | `#71767b` | Frame text muted |
| `--frame-accent` | `#1d9bf0` | Frame accent |
| `--frame-link-color` | `#1d9bf0` | Frame link color |

### Enhanced Variables with Fallbacks (platform-frames-enhanced.css)

| Variable | Fallback Chain | Description |
|----------|----------------|-------------|
| `--frame-bg` | `var(--twitter-bg, var(--frame-bg-dark, #000000))` | Background with triple fallback |
| `--frame-surface` | `var(--twitter-surface, var(--frame-surface-dark, #16181c))` | Surface with triple fallback |
| `--frame-border` | `var(--twitter-border, var(--frame-border-dark, #2f3336))` | Border with triple fallback |
| `--frame-text-primary` | `var(--twitter-text-primary, var(--frame-text-primary-dark, #e7e9ea))` | Text primary with triple fallback |
| `--frame-text-secondary` | `var(--twitter-text-secondary, var(--frame-text-secondary-dark, #71767b))` | Text secondary with triple fallback |
| `--frame-text-muted` | `var(--twitter-text-muted, var(--frame-text-muted-dark, #71767b))` | Text muted with triple fallback |
| `--frame-accent` | `var(--twitter-accent, var(--frame-accent-dark, #1d9bf0))` | Accent with triple fallback |
| `--frame-accent-bg` | `var(--twitter-accent-bg, var(--frame-accent-bg-dark, #1a8cd8))` | Accent bg with triple fallback |
| `--frame-link-color` | `var(--twitter-link-color, var(--frame-link-color-dark, #1d9bf0))` | Link with triple fallback |
| `--frame-divider` | `var(--twitter-divider, var(--frame-divider-dark, #2f3336))` | Divider with triple fallback |
| `--frame-input-bg` | `var(--twitter-input-bg, var(--frame-input-bg-dark, #16181c))` | Input bg with triple fallback |
| `--frame-overlay` | `var(--twitter-overlay, var(--frame-overlay-dark, rgba(0, 0, 0, 0.8)))` | Overlay with triple fallback |

---

## Light Theme Variables

### Core Frame Variables (frames-theme.css)

| Variable | Value | Description |
|----------|-------|-------------|
| `--twitter-bg` | `#ffffff` | Main background color |
| `--twitter-surface` | `#f7f9f9` | Surface/card background |
| `--twitter-border` | `#eff3f4` | Border color |
| `--twitter-text-primary` | `#0f1419` | Primary text color |
| `--twitter-text-secondary` | `#536471` | Secondary text color |
| `--twitter-text-muted` | `#536471` | Muted text color |
| `--twitter-accent` | `#1d9bf0` | Primary accent color |
| `--twitter-accent-bg` | `#1a8cd8` | Accent background color |
| `--twitter-link-color` | `#1d9bf0` | Link color |
| `--twitter-divider` | `#eff3f4` | Divider line color |
| `--twitter-input-bg` | `#ffffff` | Input field background |
| `--twitter-overlay` | `rgba(0, 0, 0, 0.1)` | Modal/overlay background |

### X-Specific Enhanced Variables (frames-theme.css & platform-frames-base.css)

| Variable | Value | Description |
|----------|-------|-------------|
| `--x-bg-primary` | `#ffffff` | Primary background |
| `--x-bg-secondary` | `#f7f9f9` | Secondary background |
| `--x-bg-tertiary` | `#eff3f4` | Tertiary background |
| `--x-border-color` | `#eff3f4` | Border color |
| `--x-text-primary` | `#0f1419` | Primary text |
| `--x-text-secondary` | `#536471` | Secondary text |
| `--x-text-muted` | `#536471` | Muted text |
| `--x-accent-blue` | `#1d9bf0` | Blue accent (primary) |
| `--x-accent-blue-hover` | `#1a8cd8` | Blue accent (hover state) |
| `--x-like-color` | `#f91880` | Like/heart action color |
| `--x-retweet-color` | `#00ba7c` | Retweet/green action color |
| `--x-reply-color` | `#536471` | Reply action color |
| `--x-view-color` | `#536471` | View count color |

### Platform Frame Variables (platform-frames-base.css)

| Variable | Value | Description |
|----------|-------|-------------|
| `--frame-bg` | `#ffffff` | Frame background |
| `--frame-surface` | `#f7f9f9` | Frame surface |
| `--frame-border` | `#eff3f4` | Frame border |
| `--frame-text-primary` | `#0f1419` | Frame text primary |
| `--frame-text-secondary` | `#536471` | Frame text secondary |
| `--frame-text-muted` | `#536471` | Frame text muted |
| `--frame-accent` | `#1d9bf0` | Frame accent |
| `--frame-link-color` | `#1d9bf0` | Frame link color |

### Enhanced Variables with Fallbacks (platform-frames-enhanced.css)

| Variable | Fallback Chain | Description |
|----------|----------------|-------------|
| `--frame-bg` | `var(--twitter-bg, var(--frame-bg-light, #ffffff))` | Background with triple fallback |
| `--frame-surface` | `var(--twitter-surface, var(--frame-surface-light, #f7f9f9))` | Surface with triple fallback |
| `--frame-border` | `var(--twitter-border, var(--frame-border-light, #eff3f4))` | Border with triple fallback |
| `--frame-text-primary` | `var(--twitter-text-primary, var(--frame-text-primary-light, #0f1419))` | Text primary with triple fallback |
| `--frame-text-secondary` | `var(--twitter-text-secondary, var(--frame-text-secondary-light, #536471))` | Text secondary with triple fallback |
| `--frame-text-muted` | `var(--twitter-text-muted, var(--frame-text-muted-light, #536471))` | Text muted with triple fallback |
| `--frame-accent` | `var(--twitter-accent, var(--frame-accent-light, #1d9bf0))` | Accent with triple fallback |
| `--frame-accent-bg` | `var(--twitter-accent-bg, var(--frame-accent-bg-light, #1a8cd8))` | Accent bg with triple fallback |
| `--frame-link-color` | `var(--twitter-link-color, var(--frame-link-color-light, #1d9bf0))` | Link with triple fallback |
| `--frame-divider` | `var(--twitter-divider, var(--frame-divider-light, #eff3f4))` | Divider with triple fallback |
| `--frame-input-bg` | `var(--twitter-input-bg, var(--frame-input-bg-light, #ffffff))` | Input bg with triple fallback |
| `--frame-overlay` | `var(--twitter-overlay, var(--frame-overlay-light, rgba(0, 0, 0, 0.1)))` | Overlay with triple fallback |

---

## Hardcoded Colors Found

### frame-layouts.css
The following hardcoded fallback values are present in frame-layouts.css:

```css
.twitter-context.card-frame {
  background: var(--twitter-bg, #ffffff);  /* Light theme fallback */
}

.twitter-context[data-frame-theme='dark'] {
  background: var(--twitter-bg, #000000);  /* Dark theme fallback */
}
```

### platform-frames-enhanced.css (tw-context)
The following hardcoded colors are present in the alternative `.tw-context` implementation:

```css
.tw-context {
  --frame-bg: var(--frame-bg-dark, #000000);
  --frame-surface: var(--frame-surface-dark, #16181c);
  --frame-border: var(--frame-border-dark, #2f3336);
  /* ... additional hardcoded fallbacks */
}

.tw-context.light-theme {
  --frame-bg: var(--frame-bg-light, #ffffff);
  --frame-surface: var(--frame-surface-light, #f7f9f9);
  --frame-border: var(--frame-border-light, #eff3f4);
  /* ... additional hardcoded fallbacks */
}
```

---

## Variable Duplication Analysis

### Complete Variable Inventory (27 unique variables)

**Twitter-branded variables (12):**
1. `--twitter-bg`
2. `--twitter-surface`
3. `--twitter-border`
4. `--twitter-text-primary`
5. `--twitter-text-secondary`
6. `--twitter-text-muted`
7. `--twitter-accent`
8. `--twitter-accent-bg`
9. `--twitter-link-color`
10. `--twitter-divider`
11. `--twitter-input-bg`
12. `--twitter-overlay`

**X-branded variables (13):**
1. `--x-bg-primary`
2. `--x-bg-secondary`
3. `--x-bg-tertiary`
4. `--x-border-color`
5. `--x-text-primary`
6. `--x-text-secondary`
7. `--x-text-muted`
8. `--x-accent-blue`
9. `--x-accent-blue-hover`
10. `--x-like-color`
11. `--x-retweet-color`
12. `--x-reply-color`
13. `--x-view-color`

**Generic frame variables (8):**
1. `--frame-bg`
2. `--frame-surface`
3. `--frame-border`
4. `--frame-text-primary`
5. `--frame-text-secondary`
6. `--frame-text-muted`
7. `--frame-accent`
8. `--frame-link-color`

**Additional frame variables (4):**
1. `--frame-accent-bg`
2. `--frame-divider`
3. `--frame-input-bg`
4. `--frame-overlay`

---

## Missing Variables (Potential Gaps)

Based on Twitter/X's actual UI, the following variables could be added for complete coverage:

### Action Colors (Additional)
- `--x-share-color` (for share/bookmark action)
- `--x-quote-tweet-color` (for quote tweet action)
- `--x-follow-color` (for follow button)
- `--x-following-color` (for following button state)

### Notification Colors
- `--x-notification-mention` (mention notification color)
- `--x-notification-like` (like notification color)
- `--x-notification-retweet` (retweet notification color)
- `--x-notification-follower` (new follower notification color)

### State Colors
- `--x-hover-bg` (general hover background)
- `--x-active-bg` (active/pressed state background)
- `--x-disabled-text` (disabled text color)
- `--x-error-color` (error state color)
- `--x-success-color` (success state color)

### UI Elements
- `--x-progress-bar` (loading/progress color)
- `--x-shadow-color` (shadow color)
- `--x-scrollbar-bg` (scrollbar track background)
- `--x-scrollbar-thumb` (scrollbar thumb color)

---

## Recommendations

1. **Consolidate Variable Naming**: Choose either `--twitter-*` or `--x-*` prefix consistently
2. **Add Missing Variables**: Implement the missing variables identified above for complete coverage
3. **Centralize Definitions**: Consider consolidating variable definitions in one location to avoid duplication
4. **Fallback Chain Optimization**: The current triple fallback chain (e.g., `var(--twitter-bg, var(--frame-bg-dark, #000000))`) provides robust theming but adds complexity
5. **Document Variable Usage**: Add comments indicating where each variable is used in the UI

---

## Variable Usage Context

### Dark Theme Color Palette
- Backgrounds: Pure black (#000000) and dark grays (#16181c, #2f3336)
- Text: Light grays (#e7e9ea for primary, #71767b for secondary)
- Accents: Twitter blue (#1d9bf0) with hover state (#1a8cd8)
- Actions: Pink (#f91880) for likes, green (#00ba7c) for retweets

### Light Theme Color Palette  
- Backgrounds: White (#ffffff) and light grays (#f7f9f9, #eff3f4)
- Text: Near black (#0f1419) for primary, medium gray (#536471) for secondary
- Accents: Same Twitter blue (#1d9bf0) for consistency
- Actions: Same pink and green as dark theme

### Theme-Invariant Colors
- Twitter blue (#1d9bf0) - consistent across themes
- Like pink (#f91880) - consistent across themes
- Retweet green (#00ba7c) - consistent across themes

---

## Audit Summary

- **Total unique CSS variables**: 27
- **Files containing variables**: 4
- **Dark theme variables**: 12 core + 13 X-specific = 25
- **Light theme variables**: 12 core + 13 X-specific = 25
- **Hardcoded fallback colors found**: 2 locations
- **Missing recommended variables**: ~15 potential additions
- **Variable duplication level**: Medium (some redundancy across files)

**Status**: Twitter/X theming system is well-established with comprehensive variable coverage for core UI elements. Some consolidation and expansion opportunities exist for optimal maintainability and completeness.
