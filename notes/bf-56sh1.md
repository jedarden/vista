# Twitter/X CSS Variables Audit

## Summary

This audit documents all existing CSS variables currently defined for Twitter/X dark and light frame themes in the Vista codebase.

## File Locations

Twitter/X CSS variables are defined in multiple files:

1. **`src/public/style.css`** (lines 1504-1532) - X brand-specific variables (`--x-*`)
2. **`src/public/platform-frames-base.css`** (lines 671-688) - Generic frame variables scoped to `.twitter-context`
3. **`src/public/frames-theme.css`** (lines 546-559) - Variable references that fall back to globals

---

## Dark Theme Variables

### X Brand Variables (`--x-*`)

**Location:** `src/public/style.css` (lines 1504-1517)  
**Scope:** `.twitter-context.dark-theme`

| Variable | Value | Usage | X Brand Color |
|----------|-------|-------|---------------|
| `--x-bg-primary` | `#000000` | Main background | ✅ Yes (pure black) |
| `--x-bg-secondary` | `#16181c` | Surface/elevated backgrounds | ✅ Yes |
| `--x-bg-tertiary` | `#2f3336` | Hover states, borders | ✅ Yes |
| `--x-border-color` | `#2f3336` | Borders/dividers | ✅ Yes |
| `--x-text-primary` | `#e7e9ea` | Primary text | ✅ Yes |
| `--x-text-secondary` | `#71767b` | Secondary text | ✅ Yes |
| `--x-accent-blue` | `#1d9bf0` | Links, accent UI | ✅ Yes (X brand blue) |
| `--x-accent-blue-hover` | `#1a8cd8` | Hover states | ✅ Yes |
| `--x-like-color` | `#f91880` | Like action | ✅ Yes (pink) |
| `--x-retweet-color` | `#00ba7c` | Retweet action | ✅ Yes (green) |
| `--x-reply-color` | `#71767b` | Reply action | ⚠️ Matches secondary |
| `--x-view-color` | `#71767b` | View action | ⚠️ Matches secondary |

### Generic Frame Variables (Twitter Context)

**Location:** `src/public/platform-frames-base.css` (lines 671-679)  
**Scope:** `.twitter-context`

| Variable | Value | Usage | X Brand Color |
|----------|-------|-------|---------------|
| `--frame-bg` | `#000000` | Frame background | ✅ Yes |
| `--frame-surface` | `#16181c` | Card/element backgrounds | ✅ Yes |
| `--frame-border` | `#2f3336` | Borders | ✅ Yes |
| `--frame-text-primary` | `#e7e9ea` | Primary text | ✅ Yes |
| `--frame-text-secondary` | `#71767b` | Secondary text | ✅ Yes |
| `--frame-accent` | `#1d9bf0` | Accent color | ✅ Yes |
| `--frame-link-color` | `#1d9bf0` | Link color | ✅ Yes |

---

## Light Theme Variables

### X Brand Variables (`--x-*`)

**Location:** `src/public/style.css` (lines 1519-1532)  
**Scope:** `.twitter-context.light-theme`

| Variable | Value | Usage | X Brand Color |
|----------|-------|-------|---------------|
| `--x-bg-primary` | `#ffffff` | Main background | ✅ Yes |
| `--x-bg-secondary` | `#f7f9f9` | Surface/elevated backgrounds | ✅ Yes |
| `--x-bg-tertiary` | `#eff3f4` | Hover states, borders | ✅ Yes |
| `--x-border-color` | `#eff3f4` | Borders/dividers | ✅ Yes |
| `--x-text-primary` | `#0f1419` | Primary text | ✅ Yes |
| `--x-text-secondary` | `#536471` | Secondary text | ✅ Yes |
| `--x-accent-blue` | `#1d9bf0` | Links, accent UI | ✅ Yes |
| `--x-accent-blue-hover` | `#1a8cd8` | Hover states | ✅ Yes |
| `--x-like-color` | `#f91880` | Like action | ✅ Yes |
| `--x-retweet-color` | `#00ba7c` | Retweet action | ✅ Yes |
| `--x-reply-color` | `#536471` | Reply action | ⚠️ Matches secondary |
| `--x-view-color` | `#536471` | View action | ⚠️ Matches secondary |

### Generic Frame Variables (Twitter Context)

**Location:** `src/public/platform-frames-base.css` (lines 681-688)  
**Scope:** `.twitter-context.light-theme` and `.twitter-context[data-theme='light']`

| Variable | Value | Usage | X Brand Color |
|----------|-------|-------|---------------|
| `--frame-bg` | `#ffffff` | Frame background | ✅ Yes |
| `--frame-surface` | `#f7f9f9` | Card/element backgrounds | ✅ Yes |
| `--frame-border` | `#eff3f4` | Borders | ✅ Yes |
| `--frame-text-primary` | `#0f1419` | Primary text | ✅ Yes |
| `--frame-text-secondary` | `#536471` | Secondary text | ✅ Yes |

---

## Frame Elements with Theme Variables

The following Twitter/X frame elements currently use theme variables:

### Post Structure
- **`.tw-post-header`** (lines 1477, 1679) - Uses `--x-bg-secondary` on hover
- **`.tw-avatar`** (lines 1478, 1657) - Avatar container
- **`.tw-post-meta`** (line 1479) - Post metadata
- **`.tw-author-name`** (lines 1480, 1578) - Uses `--frame-text-primary`
- **`.tw-author-handle`** (lines 1481, 1585) - Uses `--frame-text-secondary`
- **`.tw-post-time`** (line 1482) - Uses `--frame-text-secondary`
- **`.tw-verified`** (lines 1483, 1535) - Uses `--x-accent-blue`
- **`.tw-post-content`** (lines 1484, 1591) - Uses `--frame-text-primary`

### Link Cards
- **`.tw-link-card`** (lines 1485, 1601) - Uses `--frame-border`, `--frame-surface`, `--x-bg-tertiary` on hover
- **`.tw-context-placeholder`** (lines 1487, 1615) - Uses `--frame-border`, `--frame-surface`
- **`.tw-context-meta`** (lines 1488, 1635) - Uses `--x-bg-secondary`
- **`.tw-context-title`** (lines 1489, 1640) - Uses `--frame-text-primary`
- **`.tw-context-domain`** (lines 1490, 1649) - Uses `--frame-text-secondary`

### Post Actions
- **`.tw-post-actions`** (lines 1491, 1692) - Uses `--frame-text-secondary`
- **`.tw-post-action-item`** (lines 1492, 1702) - Uses `--x-bg-tertiary` on hover
- **`.tw-action-icon`** (lines 1493, 1717) - Icon colors

### Action-Specific Colors
- **Reply** (line 1552) - Uses `--x-reply-color` on hover
- **Retweet** (line 1556) - Uses `--x-retweet-color` on hover
- **Like** (line 1560) - Uses `--x-like-color` on hover
- **View** (line 1564) - Uses `--x-view-color` on hover

---

## Color Branding Analysis

### ✅ Proper X Brand Colors

All core X brand colors are correctly implemented:

1. **Backgrounds**: Pure black (`#000000`) for dark, white (`#ffffff`) for light
2. **Surfaces**: `#16181c` (dark), `#f7f9f9` (light) - authentic X dark/light grays
3. **Accents**: `#1d9bf0` - X's signature blue (used across both themes)
4. **Action Colors**: 
   - Like: `#f91880` (X pink)
   - Retweet: `#00ba7c` (X green)

### ⚠️ Legacy/Inconsistent Patterns

1. **Reply/View Colors**: These reuse secondary text colors instead of having distinct action colors
2. **Dual Variable System**: Both `--x-*` and `--frame-*` variables exist in parallel, creating inconsistency

---

## Variable System Architecture

### Three-Tier Fallback System

```
twitter-context {
  --frame-bg: <direct value>
  --x-bg-primary: <direct value>
}
```

Usage follows this pattern:
```css
.twitter-context {
  --frame-bg: var(--twitter-bg, var(--frame-bg-global));
}
```

However, the actual implementation in `platform-frames-base.css` bypasses the `--twitter-*` variables entirely and sets `--frame-*` directly within `.twitter-context`.

### Gaps in Implementation

1. **`--twitter-*` variables are referenced but never defined** - They exist in `frames-theme.css` (lines 547-558) as fallbacks but have no actual definitions
2. **`--x-*` variables are only defined in `style.css`** - Not in the theme system
3. **Missing variables**: The theme system references these but they don't exist:
   - `--twitter-bg`
   - `--twitter-surface`
   - `--twitter-border`
   - `--twitter-text-primary`
   - `--twitter-text-secondary`
   - `--twitter-text-muted`
   - `--twitter-accent`
   - `--twitter-accent-bg`
   - `--twitter-link-color`
   - `--twitter-divider`
   - `--twitter-input-bg`
   - `--twitter-overlay`

---

## Recommendations

1. **Consolidate variable systems** - Either use `--x-*` everywhere or `--twitter-*` consistently
2. **Define missing `--twitter-*` variables** if maintaining the fallback pattern
3. **Consider adding distinct colors for reply/view actions** instead of reusing secondary text colors
4. **Document variable naming convention** (`--x-*` vs `--twitter-*` vs `--frame-*`)

---

**Audit completed:** 2026-07-25  
**Bead ID:** bf-56sh1