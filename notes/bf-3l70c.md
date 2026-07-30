# bf-3l70c — Missing Dark Theme CSS Variables (Twitter/X)

**Task**: Identify all missing CSS variables for the Twitter/X dark theme
**Date**: 2026-07-26
**Status**: ✅ COMPLETE — verified against source; **0 missing variables**

---

## TL;DR

The prior gap-analysis beads (bf-631tr, bf-6aywh) flagged **7 variables as
missing**. Direct verification of the actual CSS shows **all 7 are now
implemented** (they were added by bf-4ywtk). The current implementation defines
**20 distinct `--x-*` variables**, each in both dark and light themes.

**Result: the dark-theme variable gap is closed. There are no missing `--x-*`
variables.** Two minor non-variable residuals are noted at the end for optional
future cleanup.

---

## Method

Rather than trust the prior gap-analysis docs, I verified the live CSS:

1. Enumerated every `--x-*` *definition* across all 6 CSS files:
   `grep -rhoE -- "--x-[a-z-]+:" src/public/*.css` → 20 distinct names.
2. Parsed each CSS rule with brace-depth tracking (Python) to find any
   **hardcoded** color value (hex/rgba, outside a `var()`) inside a
   Twitter/X selector (`.tw*` / `.twitter*`).
3. Cross-referenced results against the X brand dark palette.

---

## Current dark-theme inventory (20 variables, all present)

Canonical source: `src/public/style.css` → `.twitter-context.dark-theme`
(lines 1596–1631). Mirror definitions also exist in `frames-theme.css` and
`platform-frames-base.css`.

### Background
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-bg-primary` | `#000000` | Main frame background, base layer |
| `--x-bg-secondary` | `#16181c` | Hover states, cards, elevated surfaces |
| `--x-bg-tertiary` | `#2f3336` | Active states, button backgrounds |

### Border / structure
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-border-color` | `#2f3336` | Frame borders, dividers, separators |

### Text
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-text-primary` | `#e7e9ea` | Author names, post content, titles |
| `--x-text-secondary` | `#8899a6` | Handles, timestamps, counts, domains |
| `--x-text-muted` | `var(--color-twitter-dark-text-secondary)` | Muted text alias (in frames-theme/base) |

### Accent / brand
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-accent-blue` | `#1d9bf0` | X blue — verified badge, links, actions |
| `--x-accent-blue-hover` | `#1a8cd8` | Hover state for accent elements |

### Engagement actions
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-like-color` | `#f91880` | Like button |
| `--x-retweet-color` | `#00ba7c` | Retweet button |
| `--x-reply-color` | `#8899a6` | Reply button |
| `--x-view-color` | `#8899a6` | View count |

### Avatar system *(were "missing" per prior docs)*
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-avatar-bg` | `#8899a6` | Avatar placeholder background |
| `--x-avatar-border` | `#2f3336` | Avatar border |

### Placeholder system *(were "missing" per prior docs)*
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-placeholder-bg` | `#2f3336` | Link-card / context placeholder fill |
| `--x-placeholder-gradient` | `linear-gradient(135deg, #2f3336, #3d4145)` | Placeholder visual interest |

### Hover / interaction states *(were "missing" per prior docs)*
| Variable | Dark value | Purpose |
|---|---|---|
| `--x-hover-bg` | `rgba(255,255,255,0.03)` | General hover background |
| `--x-hover-subtle` | `rgba(255,255,255,0.015)` | Extra-subtle hover |
| `--x-link-card-hover-border` | `#1d9bf0` | Link-card hover border |

> Note: `platform-frames-base.css` and `frames-theme.css` reference these via
> semantic aliases (e.g. `--x-avatar-bg: #71767b`), while the canonical
> `style.css` block uses `#8899a6`. See "Residuals" below.

---

## What was previously flagged as missing (now resolved)

All 7 variables listed in `notes/bf-631tr-twitter-x-theme-variable-gap-analysis.md`
and `notes/bf-6aywh-twitter-x-dark-theme-missing-variables.md` are present:

| Variable | Prior status | Actual status |
|---|---|---|
| `--x-avatar-bg` | ❌ missing | ✅ defined (all 3 CSS files) |
| `--x-avatar-border` | ❌ missing | ✅ defined |
| `--x-placeholder-bg` | ❌ missing | ✅ defined |
| `--x-placeholder-gradient` | ❌ enhancement | ✅ defined |
| `--x-hover-bg` | ❌ enhancement | ✅ defined |
| `--x-hover-subtle` | ❌ enhancement | ✅ defined |
| `--x-link-card-hover-border` | ❌ enhancement | ✅ defined |

The gap-analysis docs predate the bf-4ywtk implementation commit and are stale.

---

## X brand dark palette cross-reference

| X role | Token | Hex |
|---|---|---|
| Lights-out background | `--x-bg-primary` | `#000000` |
| Dim surface | `--x-bg-secondary` | `#16181c` |
| Border / tertiary | `--x-bg-tertiary`, `--x-border-color` | `#2f3336` |
| Primary text | `--x-text-primary` | `#e7e9ea` |
| Secondary text | `--x-text-secondary` | `#8899a6` / `#71767b` |
| X blue | `--x-accent-blue` | `#1d9bf0` |
| X blue hover | `--x-accent-blue-hover` | `#1a8cd8` |
| Like (pink) | `--x-like-color` | `#f91880` |
| Retweet (green) | `--x-retweet-color` | `#00ba7c` |

Every entry in the X brand dark palette that the frame uses maps to an existing
token. No palette color lacks a variable.

---

## Residuals (NOT missing variables — optional future cleanup)

1. **Hardcoded X-blue box-shadow glow** in `src/public/style.css`:
   ```css
   html[data-theme='dark']  .tw-link-card:hover { box-shadow: 0 2px 8px rgba(29,155,240,0.10); }
   html[data-theme='light'] .tw-link-card:hover { box-shadow: 0 2px 8px rgba(29,155,240,0.08); }
   ```
   `rgba(29,155,240)` = X blue `#1d9bf0`. Intended color is correct; it is a
   *shadow*, not a fill/border/text token, so it doesn't constitute a missing
   theme variable. Could optionally become `--x-accent-blue-glow` for
   consistency.

2. **Cross-file value divergence** for `--x-text-secondary` (and
   `--x-reply-color`/`--x-view-color`/`--x-avatar-bg`):
   - `style.css` canonical: `#8899a6` (darker, WCAG AA)
   - `frames-theme.css` / `platform-frames-base.css`: `#71767b`
   Both are valid X secondary-text values; the three files should agree on one.
   This is a *consolidation* task, not a missing-variable task.

---

## Acceptance-criteria check

- [x] Complete list of missing dark-theme CSS variables documented → **none missing**
- [x] Each (would-be) missing variable has a clear purpose → residuals described
- [x] Intended X brand dark-theme color identified for each → palette table
- [x] Variables organized by category → Background / Border / Text / Accent / Actions / Avatar / Placeholder / Hover

**Conclusion**: No code change required — the Twitter/X dark-theme variable set
is complete. This bead is a stale auto-split of work already finished by bf-4ywtk.
