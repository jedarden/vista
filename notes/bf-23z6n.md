# Twitter/X Frame CSS Variables - Complete Documentation

## Overview
All Twitter/X frame CSS variables are properly defined for both dark and light themes. No hardcoded colors remain in the Twitter/X frame CSS.

## Theme Coverage

### Required Variables (Acceptance Criteria) ✓
- **frame-bg** ✓ - Main frame background
- **frame-surface** ✓ - Secondary surface (cards, headers)
- **frame-border** ✓ - Border colors
- **frame-text-primary** ✓ - Primary text content
- **frame-text-secondary** ✓ - Secondary text (handles, timestamps)
- **frame-accent** ✓ - Accent color (verified badges)

## Complete Variable Set

### Base Frame Variables

#### Backgrounds
- `--frame-bg` - Main frame background
  - Dark: `#000000` (pure black)
  - Light: `#ffffff` (pure white)
- `--frame-surface` - Secondary surface for cards and headers
  - Dark: `#16181c` (X dark gray)
  - Light: `#f7f9f9` (X light gray)
- `--frame-border` - Border colors
  - Dark: `#2f3336` (X border dark)
  - Light: `#eff3f4` (X border light)

#### Text Colors
- `--frame-text-primary` - Primary text (names, content)
  - Dark: `#e7e9ea` (X text primary dark)
  - Light: `#0f1419` (X text primary light)
- `--frame-text-secondary` - Secondary text (handles, timestamps, stats)
  - Dark: `#71767b` (X text secondary dark)
  - Light: `#536471` (X text secondary light)
- `--frame-text-muted` - Muted text (avatar placeholder background)
  - Dark: `#71767b`
  - Light: `#536471`

#### Accent Colors
- `--frame-accent` - Verified badge color
  - Dark: `#1d9bf0` (X brand blue)
  - Light: `#1d9bf0` (X brand blue)
- `--frame-accent-bg` - Accent background
  - Dark: `#1d9bf0` (solid blue)
  - Light: `#e8f5fe` (light blue background)
- `--frame-link-color` - Link color
  - Both themes: `#1d9bf0` (X brand blue)

#### UI Elements
- `--frame-divider` - Dividers and separators
  - Dark: `#2f3336`
  - Light: `#eff3f4`
- `--frame-input-bg` - Input field backgrounds
  - Dark: `#202327`
  - Light: `#eff3f4`
- `--frame-overlay` - Modal/overlay backgrounds
  - Dark: `rgba(91, 112, 131, 0.4)` (semi-transparent gray)
  - Light: `rgba(0, 0, 0, 0.08)` (semi-transparent black)

### X-Specific Variables

#### Background Hierarchy
- `--x-bg-primary` - Primary background (same as frame-bg)
- `--x-bg-secondary` - Secondary background (same as frame-surface)
- `--x-bg-tertiary` - Tertiary background (hover states, cards)
  - Dark: `#2f3336`
  - Light: `#eff3f4`

#### Border & Text
- `--x-border-color` - Border color (same as frame-border)
- `--x-text-primary` - Primary text (same as frame-text-primary)
- `--x-text-secondary` - Secondary text (same as frame-text-secondary)

#### Action Colors (X Brand)
- `--x-accent-blue` - X brand blue (primary actions, links)
  - Both themes: `#1d9bf0`
- `--x-accent-blue-hover` - Hover state for blue
  - Both themes: `#1a8cd8` (slightly darker)
- `--x-like-color` - Like action (pink)
  - Both themes: `#f91880` (X brand pink)
- `--x-retweet-color` - Retweet action (green)
  - Both themes: `#00ba7c` (X brand green)
- `--x-reply-color` - Reply action
  - Dark: `#71767b` (gray)
  - Light: `#536471` (gray)
- `--x-view-color` - View stats
  - Dark: `#71767b`
  - Light: `#536471`

## Variable Usage by Frame Element

### Avatar
- **Background**: `var(--frame-text-muted)` (gray placeholder)
- **Size**: 40px × 40px

### Author Info
- **Name**: `var(--frame-text-primary)`
- **Handle**: `var(--frame-text-secondary)`
- **Timestamp**: `var(--frame-text-secondary)`

### Verified Badge
- **Color**: `var(--x-accent-blue)` or `var(--frame-accent)`
- **Size**: 18px × 18px

### Post Content
- **Text color**: `var(--frame-text-primary)`
- **Background**: `var(--frame-bg)`

### Link Cards
- **Background**: `var(--frame-surface)`
- **Border**: `1px solid var(--frame-border)`
- **Placeholder**: `var(--frame-border)`
- **Title**: `var(--frame-text-primary)`
- **Domain**: `var(--frame-text-secondary)`

### Action Icons (Reply, Retweet, Like, View)
- **Default**: `var(--frame-text-secondary)`
- **Reply hover**: `var(--x-reply-color)`
- **Retweet hover**: `var(--x-retweet-color)`
- **Like hover**: `var(--x-like-color)`
- **View hover**: `var(--x-view-color)`

## X Brand Color Verification

All X brand colors match the official Twitter/X rebrand:

- **X Blue** (`#1d9bf0`): Primary brand color, used for links, verified badges, and primary actions
- **X Blue Hover** (`#1a8cd8`): Slightly darker for hover states
- **X Pink** (`#f91880`): Like button color
- **X Green** (`#00ba7c`): Retweet button color
- **Dark Grays** (`#000000`, `#16181c`, `#2f3336`): Dark theme backgrounds and borders
- **Light Grays** (`#ffffff`, `#f7f9f9`, `#eff3f4`): Light theme backgrounds and borders
- **Text Dark** (`#e7e9ea`): Primary text in dark theme
- **Text Light** (`#0f1419`): Primary text in light theme
- **Secondary Dark** (`#71767b`): Secondary text in dark theme
- **Secondary Light** (`#536471`): Secondary text in light theme

## Compliance with Acceptance Criteria

✅ **All frame elements (avatar, text, icons, backgrounds, borders) have theme variables defined**
✅ **Dark theme has complete variable set with proper X brand colors**
✅ **Light theme has complete variable set with proper X brand colors**
✅ **No hardcoded colors remain in Twitter/X frame CSS**
✅ **Variables cover: frame-bg, frame-surface, frame-border, frame-text-primary, frame-text-secondary, frame-accent**

## Variable Count Summary

- **Base frame variables**: 12 (both themes)
- **X-specific variables**: 12 (both themes)
- **Total unique variables**: 24 per theme
- **Elements themed**: Avatar, text (primary/secondary/muted), borders, backgrounds, icons, actions, links

## Implementation Status

All Twitter/X frame CSS variables are:
- ✅ Properly defined for both dark and light themes
- ✅ Using correct X brand colors
- ✅ Applied throughout all frame elements
- ✅ No hardcoded colors remaining
- ✅ Complete coverage of all UI elements

**Status**: COMPLETE - All acceptance criteria met.