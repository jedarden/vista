# VISTA — Visual Inspector of Social Tags & Attributes

## Overview

VISTA is a stateless web application that fetches any URL, extracts its metadata, and renders accurate visual previews of how that link will appear when shared across major platforms.

**Architecture**: Single Docker container (Node.js) serving both the API and static frontend. Stateless — no database, no sessions, no persistent storage. Deployed to apexalgo-iad via ArgoCD.

---

## Platform Specifications

### Social & Microblogging

#### 1. Google Search

**Tags used (fallback order):**
1. `<title>`
2. `<meta name="description">`

**Rendering rules:**
- Title: 50–60 characters (measured in pixels — 580px desktop, 920px mobile)
- Description: 120–158 characters (680px mobile, 920px desktop)
- Truncated to nearest whole word with ellipsis (`…`)
- No image — text only with favicon and domain breadcrumb
- Wider characters (W, M) consume more budget than narrow ones (i, l)

**Mock layout:**
```
favicon  domain.com › path
Title text here (blue, clickable)
Description text here truncated at the pixel boundary… (gray)
```

---

#### 2. Facebook / Meta

**Tags used (fallback order):**
1. `og:title` → `<title>`
2. `og:description` → page content
3. `og:image` → first extracted image
4. `og:url`
5. `og:site_name`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- Minimum: 200×200px
- Max file size: 8 MB
- Formats: JPG, PNG

**Rendering rules:**
- Title: 40–60 characters before truncation
- Description: 140–160 characters before truncation
- Large card: image on top, title + description + domain below
- Small card: image < 600×315px renders as thumbnail on left

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ DOMAIN.COM                  │
│ Title text here             │
│ Description text truncated… │
└─────────────────────────────┘
```

---

#### 3. X (Twitter)

**Tags used (fallback order):**
1. `twitter:card` (required — `summary` or `summary_large_image`)
2. `twitter:title` → `og:title` → `<title>`
3. `twitter:description` → `og:description`
4. `twitter:image` → `og:image`
5. `twitter:site` (@ handle)

**Image requirements:**
- `summary`: 144×144px min, displayed as square thumbnail
- `summary_large_image`: 300×157px min, recommended 1200×675px (roughly 2:1)
- Max file size: 5 MB
- Formats: JPG, PNG, WEBP, GIF (first frame only)

**Rendering rules:**
- Title: ~70 characters
- Description: ~200 characters
- `summary`: small square image on left, text on right
- `summary_large_image`: full-width image on top, text below
- X picks up the LAST `twitter:image` tag if multiple exist

**Mock layout (summary_large_image):**
```
┌─────────────────────────────┐
│         [image ~2:1]        │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
│ domain.com                  │
└─────────────────────────────┘
```

**Mock layout (summary):**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│ [sq] │ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

#### 4. LinkedIn

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:url`

**Image requirements:**
- Recommended: 1200×627px (1.91:1 ratio)
- Minimum width: 200px (< 401px renders as small thumbnail on left)
- Max file size: 2 MB
- Formats: JPEG, PNG
- Images taller than 1200px cropped to square

**Rendering rules:**
- Title: 40–60 characters
- Description: 120–160 characters
- Center-crop for responsive display

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 5. Reddit

**Tags used:**
1. `og:title` → `<title>`
2. `og:description` → `<meta name="description">`
3. `og:image`
4. `og:url`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- Minimum: 200×200px (smaller images don't display)

**Rendering rules:**
- Title: 60–90 characters
- Description: 160–200 characters
- Standard OG card rendering

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 6. Mastodon / Fediverse

**Tags used (fallback order):**
1. OEmbed (preferred)
2. JSON-LD structured data
3. `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `og:image:alt`
4. HTML `<title>` and page content (last resort)

**Image requirements:**
- Max file size: 2 MB
- Aspect ratio: ~2:1 for full-width display
- No explicit minimum pixel dimensions

**Rendering rules:**
- Full-width image display preferred; text below
- Respects `twitter:card` settings for layout variant

**Mock layout:**
```
┌─────────────────────────────┐
│         [image ~2:1]        │
├─────────────────────────────┤
│ Title text here (bold)      │
│ Description text…           │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 7. Bluesky

**Tags used:**
1. `og:title` → `<title>`
2. `og:description` → `<meta name="description">`
3. `og:image`

**Image requirements:**
- Standard OG image sizes (1200×630px recommended)
- Must be fetchable and valid

**Rendering rules:**
- Title: recommended under 160 characters
- Description: recommended under 160 characters
- Vertical card with title, description, optional image, and URL
- Honors robots meta tags

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 8. Threads (Meta)

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`

**Image requirements:**
- Recommended: 1200×630px
- Uses same rendering engine as Facebook

**Rendering rules:**
- Same as Facebook — standard rectangular preview card
- Can use Facebook Sharing Debugger to verify

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ DOMAIN.COM                  │
│ Title text here             │
│ Description text truncated… │
└─────────────────────────────┘
```

---

#### 9. Tumblr

**Tags used:**
1. `og:title` → `<title>`
2. `og:description`
3. `og:image`

**Image requirements:**
- Link post thumbnail: 130×130px (JPG, PNG, GIF, BMP)
- Dashboard width: 540px
- For OG card: 1200×630px recommended

**Rendering rules:**
- Small thumbnail (130×130) with link info
- Auto-generates OG/Twitter markup but stops if custom OG tags are present

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[130] │ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

#### 10. Pinterest (Rich Pins)

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:type` (must be `article` for article Rich Pins)
5. `og:site_name`
6. Also supports Schema.org, hRecipe, oEmbed

**Image requirements:**
- Recommended: 1000×1500px (2:3 ratio — vertical, unlike other platforms)
- Article Rich Pins: 1200×630px minimum
- No explicit max file size documented

**Rendering rules:**
- Rich pin with title, description, price (if product)
- Requires Rich Pin Validator approval — not automatic
- Vertical images preferred (opposite of most platforms)

**Mock layout:**
```
┌───────────────────┐
│                   │
│  [image 2:3       │
│   vertical]       │
│                   │
├───────────────────┤
│ Title text here   │
│ Description…      │
│ domain.com        │
└───────────────────┘
```

---

### Messaging

#### 11. Slack

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image` → `twitter:image`
4. `og:site_name`
5. `twitter:label1` / `twitter:data1` (up to 2 extra metadata fields)

**Image requirements:**
- Recommended: 1140×600px
- Minimum: 300×157px
- Display width: ~400–500px in unfurl

**Rendering rules:**
- Title: ~40–80 characters (not officially documented)
- Description: ~100–150 characters
- Meta tags must be in first 32 KB of HTML response
- Colored left border accent from site favicon

**Mock layout:**
```
│ site_name
│ Title text here (bold, blue)
│ Description text truncated…
│ ┌─────────────────┐
│ │  [image thumb]   │
│ └─────────────────┘
```

---

#### 12. Discord

**Tags used:**
1. `og:title` (max 256 chars)
2. `og:description` (max 4096 chars)
3. `og:image`
4. `og:url`
5. `og:site_name`
6. `<meta name="theme-color">` — sets left sidebar accent color

**Image requirements:**
- Recommended: 1200×630px
- HTTPS only
- Formats: JPG, PNG, WEBP

**Rendering rules:**
- Title: 256 characters max
- Description: 4096 characters max (but visually truncated much sooner)
- Left border colored by `theme-color` meta tag
- Caches aggressively (24+ hours)

**Mock layout:**
```
┃ site_name
┃ Title text here (blue, bold)
┃ Description text here…
┃ ┌─────────────────┐
┃ │     [image]      │
┃ └─────────────────┘
```
(left border colored by theme-color)

---

#### 13. WhatsApp

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image` (HTTPS only)
4. `og:url`

**Image requirements:**
- Recommended: 1200×630px (1.91:1)
- Minimum: 300×200px (100×100 absolute minimum)
- Max file size: 300–600 KB
- Formats: JPG, PNG, WebP (no GIF, no SVG)
- HTTPS only — ignores http:// image URLs

**Rendering rules:**
- Compact card with image thumbnail
- Title and description shown but lengths not officially documented
- Static images only (no animation)

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ domain.com           │
│ [sq] │ Title text here      │
│      │ Description text…    │
└──────┴──────────────────────┘
```

---

#### 14. iMessage

**Tags used:**
1. `og:title`
2. `og:image`
3. `og:url`
4. **Does NOT use `og:description`**

**Image requirements:**
- Recommended: 1200×630px or 1200×1200px
- Minimum: 150×150px
- Formats: PNG, JPG (no GIF on some devices)
- Absolute URLs only

**Rendering rules:**
- Only displays title + image (no description)
- Large hero image with title overlay at bottom
- Minimal text rendering

**Mock layout:**
```
┌─────────────────────────────┐
│                             │
│         [large image]       │
│                             │
├─────────────────────────────┤
│ Title text here             │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 15. Telegram

**Tags used (fallback order):**
1. `og:title` → `<title>`
2. `og:description` → `<meta name="description">`
3. `og:image`
4. `og:image:width` / `og:image:height`
5. Falls back to Twitter Card tags

**Image requirements:**
- Recommended: 1200×630px (1.91:1)
- Max file size: 5 MB
- Formats: JPG, PNG, WebP

**Rendering rules:**
- Title: up to 1023 characters (but truncated visually)
- Description: ~170 characters before truncation
- Aggressive caching — Webpage Bot must be used to force refresh

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here (bold)      │
│ Description text truncated… │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 16. Signal

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image` (HTTPS only)
4. `og:url`

**Image requirements:**
- Recommended: 1200×630px
- HTTPS only (non-HTTPS images won't display)

**Rendering rules:**
- Compact preview with title, description, and image
- Uses overlapping range requests for privacy (proxies image fetches to obscure URLs from Signal servers)

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│ [sq] │ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

#### 17. Microsoft Teams

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:image:width` / `og:image:height` / `og:image:type`
5. Schema.org metadata

**Image requirements:**
- Recommended: 1200×628px
- Must be publicly accessible (no auth required)
- Formats: JPEG, PNG

**Rendering rules:**
- Renders as Adaptive Card with image, title, description, action buttons
- Supports micro-capabilities on websites without app installation

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here (bold)      │
│ Description text truncated… │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 18. Google Chat

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- Minimum: 120px wide, 60px tall
- Formats: PNG, JPG, GIF
- Max file size: 5 MB
- Must use absolute URLs

**Rendering rules:**
- Meta tags must be in first 750 KB of page content
- Standard unfurled card with image and text

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 19. Zoom Chat

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:url`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- No Zoom-specific size requirements

**Rendering rules:**
- Standard OG card rendering
- Limited official documentation — follows standard OG practices

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text…           │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 20. Line

**Tags used (only 3 supported):**
1. `og:title`
2. `og:description`
3. `og:image`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- Minimum: 300×200px
- Max file size: 300 KB

**Rendering rules:**
- Only reads these 3 specific OG tags — ignores all others
- Auto-retrieves text and images even without OG tags set

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text…           │
│ domain.com                  │
└─────────────────────────────┘
```

---

#### 21. KakaoTalk

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- Max file size: 5 MB (for API messages)

**Rendering rules:**
- Standard vertical card preview with image, title, description
- Uses OG cache which may be outdated — Reset Tool available to clear cached data

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text…           │
│ domain.com                  │
└─────────────────────────────┘
```

---

### Collaboration & Productivity

#### 22. Notion

**Tags used:**
1. `og:title` → `<title>`
2. `og:description` → `<meta name="description">`
3. `og:image`
4. `og:url`
5. Favicon

**Image requirements:**
- Recommended: 1200×630px
- Fetches favicons, OG images, and cover photos automatically

**Rendering rules:**
- Visual bookmark with thumbnail, title, description, favicon
- Compact horizontal layout

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[icon]│ Description text…    │
│      │ domain.com       🌐  │
└──────┴──────────────────────┘
```

---

#### 23. Jira / Confluence (Smart Links)

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:url`
5. Uses iframely for metadata extraction

**Image requirements:**
- Recommended: 1200×630px
- HTTPS required

**Rendering rules:**
- Card view: shows metadata, project details, summary
- Inline view: compact single-line preview
- Only the URL is sent to iframely (no other data)

**Mock layout (card):**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[icon]│ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

#### 24. GitHub

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:url`
5. `twitter:image:src`

**Image requirements:**
- Recommended: 1200×630px
- Social preview image can be set in repository settings

**Rendering rules:**
- Standard card with image and text
- Issue/PR link images may require GitHub login to view (private repos)

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
│ github.com                  │
└─────────────────────────────┘
```

---

#### 25. Trello

**Tags used:**
1. `og:title` → `<title>`
2. `og:image`

**Image requirements:**
- Standard OG sizes (1200×630px recommended)
- Thumbnail display depends on website metadata

**Rendering rules:**
- Link attachment with thumbnail preview
- Card covers only available for direct image attachments, not link previews

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[img] │ domain.com           │
└──────┴──────────────────────┘
```

---

#### 26. Figma

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `twitter:card`
5. Favicon

**Image requirements:**
- Recommended: 1200×630px

**Rendering rules:**
- Static preview: title, description, URL, logo, image
- Interactive preview: full website embed (if supported by the target site)

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[icon]│ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

### Content Platforms

#### 27. Medium

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:url`
5. `og:type`

**Image requirements:**
- Recommended: 1200×630px (1.91:1)
- Max file size: 8 MB (< 1 MB recommended)
- Formats: JPG, PNG, WebP
- Must use absolute HTTPS URLs

**Rendering rules:**
- Horizontal or vertical card with image, title, description, and link

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
└─────────────────────────────┘
```

---

#### 28. Substack

**Tags used:**
1. Standard Open Graph (auto-implemented by Substack)

**Image requirements:**
- Social preview: ≥ 1200×630px (14:10 aspect ratio)
- Minimum: 420×300px
- Optimal: ≥ 1456×1048px
- Smart cropping available for faces

**Rendering rules:**
- Standard social preview card
- Default image is first image in post

**Mock layout:**
```
┌─────────────────────────────┐
│         [image 1.91:1]      │
├─────────────────────────────┤
│ Title text here             │
│ Description text truncated… │
│ substack.com                │
└─────────────────────────────┘
```

---

### Email

#### 29. Outlook

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:image:width` / `og:image:height`

**Image requirements:**
- Recommended: 1200×630px (1.91:1 ratio)
- Explicitly specify dimensions with `og:image:width` and `og:image:height`

**Rendering rules:**
- Link preview chip in email body
- Inconsistent support documented — some users report OG tags don't affect preview

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[img] │ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

#### 30. Gmail

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image`
4. `og:url`

**Image requirements:**
- Recommended: 1200×627px (1.91:1 ratio)
- Minimum: 120px wide, 60px tall
- Formats: PNG, JPG, GIF
- Max file size: 5 MB
- Must use absolute HTTPS URLs

**Rendering rules:**
- Link chip with image and text
- Meta tags must be in first 750 KB of page content
- No relative image paths supported

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[img] │ Description text…    │
│      │ domain.com           │
└──────┴──────────────────────┘
```

---

### RSS / Readers

#### 31. Feedly / RSS Readers

**Tags used:**
1. `og:image` (primary)
2. `.webfeedsFeaturedVisual` CSS class
3. Largest image found in article HTML content

**Image requirements:**
- Minimum: 600px wide
- Recommended: 1200×630px
- Uses largest image found in article

**Rendering rules:**
- Thumbnail display in feed list
- Does NOT use traditional RSS `<image>` element
- Crawls article HTML pages separately from RSS feed
- Larger images preferred for display

**Mock layout:**
```
┌──────┬──────────────────────┐
│      │ Title text here      │
│[img] │ Description text…    │
│      │ source • 2h ago      │
└──────┴──────────────────────┘
```

---

## Quick Reference

### Social & Microblogging

| # | Platform | Image Size | Title Chars | Desc Chars | Special |
|---|----------|-----------|-------------|------------|---------|
| 1 | Google Search | N/A | 50–60 | 120–158 | Pixel-based, no image |
| 2 | Facebook | 1200×630 | 40–60 | 140–160 | Max 8 MB |
| 3 | X (Twitter) | 1200×675 | 70 | 200 | Two card types |
| 4 | LinkedIn | 1200×627 | 40–60 | 120–160 | < 401px = thumbnail |
| 5 | Reddit | 1200×630 | 60–90 | 160–200 | Standard OG |
| 6 | Mastodon | ~2:1 | — | — | Prefers OEmbed |
| 7 | Bluesky | 1200×630 | 160 | 160 | Honors robots tags |
| 8 | Threads | 1200×630 | 40–60 | 140–160 | Same as Facebook |
| 9 | Tumblr | 130×130 | — | — | Small thumbnail |
| 10 | Pinterest | 1000×1500 | — | — | Vertical 2:3, needs approval |

### Messaging

| # | Platform | Image Size | Title Chars | Desc Chars | Special |
|---|----------|-----------|-------------|------------|---------|
| 11 | Slack | 1140×600 | 40–80 | 100–150 | 32 KB HTML limit |
| 12 | Discord | 1200×630 | 256 | 4096 | theme-color accent |
| 13 | WhatsApp | 1200×630 | — | — | HTTPS only, no GIF |
| 14 | iMessage | 1200×630 | — | None | No description shown |
| 15 | Telegram | 1200×630 | 1023 | 170 | Long caching |
| 16 | Signal | 1200×630 | — | — | HTTPS only, privacy proxy |
| 17 | Teams | 1200×628 | — | — | Adaptive Cards |
| 18 | Google Chat | 1200×630 | — | — | 750 KB HTML limit |
| 19 | Zoom | 1200×630 | — | — | Standard OG |
| 20 | Line | 1200×630 | — | — | Only 3 OG tags |
| 21 | KakaoTalk | 1200×630 | — | — | OG cache, reset tool |

### Collaboration & Productivity

| # | Platform | Image Size | Title Chars | Desc Chars | Special |
|---|----------|-----------|-------------|------------|---------|
| 22 | Notion | 1200×630 | — | — | Bookmark embed |
| 23 | Jira/Confluence | 1200×630 | — | — | iframely, Smart Links |
| 24 | GitHub | 1200×630 | — | — | Social preview setting |
| 25 | Trello | 1200×630 | — | — | Link attachment |
| 26 | Figma | 1200×630 | — | — | Interactive + static |

### Content & Email & RSS

| # | Platform | Image Size | Title Chars | Desc Chars | Special |
|---|----------|-----------|-------------|------------|---------|
| 27 | Medium | 1200×630 | — | — | WebP supported |
| 28 | Substack | 1200×630 | — | — | Smart cropping |
| 29 | Outlook | 1200×630 | — | — | Inconsistent support |
| 30 | Gmail | 1200×627 | — | — | 750 KB HTML limit |
| 31 | Feedly/RSS | 1200×630 | — | — | Crawls HTML, not RSS |

---

## Meta Tag Fallback Hierarchy

Most platforms follow this priority:

```
Platform-specific tags (twitter:*)
    → Open Graph tags (og:*)
        → HTML tags (<title>, <meta name="description">)
            → Page content extraction
```

**Image fallback:**
```
twitter:image → og:image → page images → [none]
```

**Universal safe defaults (covers ~95% of platforms):**
- Image: **1200×630px**, HTTPS, JPG/PNG, < 1 MB
- Title: **≤ 60 characters**
- Description: **≤ 155 characters**

---

## Power Features

### Live Meta Tag Editor

The core differentiator. An editable panel alongside the preview grid lets users modify any meta tag and see all 31 platform previews update instantly. The workflow inverts from "deploy → check → fix → redeploy" to "design → perfect → deploy once."

**Implementation:**
- Left panel: form fields for every tag group (`<title>`, `meta description`, all `og:*`, all `twitter:*`, `theme-color`, JSON-LD)
- Right panel: live-updating preview grid
- Fields pre-populated from the fetched URL (or blank in paste-HTML mode)
- Changes are client-side only — no server round-trips for re-rendering
- "Copy HTML" button generates the final `<head>` block

---

### Paste Raw HTML (Pre-Deploy Preview)

Don't require a live URL. Users can paste raw HTML or drag-drop an `.html` file and see all 31 previews before the page is live. Critical for development workflows — see the result without pushing to production.

**Implementation:**
- Tab toggle in the input area: "URL" | "Paste HTML" | "Upload File"
- Paste/upload modes send the HTML body directly to the parser (same cheerio pipeline, skip the fetch step)
- Server endpoint: `POST /api/preview` with `Content-Type: text/html` body
- Image URLs in pasted HTML are resolved relative to a user-provided base URL (optional field)

---

### Image Crop Safe Zone Visualizer

The OG image overlaid with semi-transparent colored rectangles showing exactly where each platform would crop. Pinterest crops to 2:3 vertical, Twitter to ~2:1, iMessage takes a large hero, LinkedIn center-crops — one image, 31 different crop windows.

**Implementation:**
- Fetch the OG image and display at full resolution
- Overlay `<div>` masks for each platform's crop region, color-coded by category
- Toggle individual platforms on/off
- Show percentage of image visible per platform
- Highlight "safe zone" — the intersection of all crop regions where content is guaranteed visible everywhere

---

### Platform-Contextualized Mockups

Show each card not in isolation but embedded inside a realistic platform UI frame. The link card sitting inside a tweet timeline, inside a Slack channel conversation, inside a Discord server with messages above and below, inside a Facebook feed between other posts.

**Implementation:**
- Toggle per card: "Card only" | "In context"
- Context frames are static CSS/HTML shells mimicking each platform's UI chrome (avatar, username, timestamp, surrounding messages/posts)
- Use neutral placeholder content around the card so it doesn't distract
- Dark/light mode toggle for platforms that support both (Discord, Slack, X)

---

### Sitemap Crawler with Site-Wide Report Card

Point VISTA at a `sitemap.xml` and it crawls every URL, generating a heatmap report: which pages are missing OG images, which have truncated titles, which platforms each page is optimized for. Surfaces the worst-performing pages first.

**Implementation:**
- Input: sitemap URL (auto-detected from `robots.txt` if user provides domain)
- Server fetches and parses the sitemap XML, then runs `/api/preview` for each URL (concurrency-limited, e.g. 5 at a time)
- Results aggregated into a summary table:
  - Per-page row with platform coverage score (0–31)
  - Color-coded cells: green (all tags present), yellow (partial), red (missing critical tags)
  - Sortable by worst-performing pages first
- Downloadable as CSV or JSON
- Endpoint: `GET /api/audit?sitemap=https://example.com/sitemap.xml`

---

### Auto-Fix Generator

Don't just flag problems — generate the fix. Missing `og:image`? Here's the tag to add. Title truncates on Facebook at character 47? Here's a suggested rewrite. No `twitter:card`? Here's the tag with the correct type inferred from image dimensions.

**Implementation:**
- After analysis, a "Fixes" panel shows actionable items sorted by impact
- Each fix includes:
  - What's wrong (e.g. "Missing `twitter:card` — X will use default summary type")
  - The fix (e.g. `<meta name="twitter:card" content="summary_large_image">`)
  - Which platforms benefit
- "Apply all fixes" button populates the Live Editor with the suggested values
- "Copy all fixes" button outputs a unified HTML snippet

---

### Side-by-Side URL Comparison with Diff Highlighting

Enter two URLs and see them compared across all 31 platforms with visual diff highlighting. Three use cases: compare your site vs. a competitor, compare staging vs. production, compare before vs. after a meta tag update.

**Implementation:**
- Two URL input fields, side-by-side
- Each platform card rendered twice (left/right) with diff markers:
  - Green highlight on text that differs
  - Red badge on missing tags present in the other URL
  - Image diff overlay (side-by-side or onion-skin toggle)
- Summary bar at top: "17 platforms identical, 8 differ, 6 missing tags on URL B"
- Endpoint: `GET /api/compare?a=https://...&b=https://...`

---

### Code Snippet Generator with Framework Detection

After analysis or editing, VISTA generates paste-ready code for the user's framework. One click copies framework-specific output.

**Implementation:**
- Dropdown: Plain HTML, Next.js (`<Head>`), Nuxt (`useHead()`), Remix (`meta export`), Astro (`<head>`), SvelteKit, Gatsby (`gatsby-plugin-react-helmet`), Hugo (`{{ partial "head" }}`), Jekyll (`{% seo %}`)
- Generates only the tags — not a full page template
- Syntax-highlighted code block with copy button
- Updates live as the user edits tags in the Live Editor
- Includes comments noting which platforms each tag serves

---

### Character Budget Gauges

As the user types in the Live Editor, 31 tiny horizontal gauges show the remaining character/pixel budget per platform simultaneously. Green → yellow → red as the text approaches each platform's truncation point.

**Implementation:**
- Rendered below each editable field (title, description)
- Each gauge is a thin horizontal bar labeled with the platform icon
- A vertical "cut line" marker shows exactly where truncation occurs
- Gauges grouped by category, collapsible
- Tooltip on hover shows: "Facebook: 43/60 chars used — truncates after 'infrastructure'"
- For Google (pixel-based), use a monospace approximation or character-width lookup table

---

## Application Architecture

### Container: `vista`

Single Docker container. Node.js runtime.

```
vista/
├── Dockerfile
├── package.json
├── src/
│   ├── server.js           # Express server — serves API + static files
│   ├── fetcher.js          # URL fetcher with timeout, size limits, SSRF protection
│   ├── parser.js           # HTML → structured metadata object
│   ├── image-probe.js      # Image dimension/format detection via partial download
│   └── snippet-gen.js      # Framework-specific code snippet generator
├── public/
│   ├── index.html          # Single-page app
│   ├── style.css           # Platform-accurate card styles
│   ├── app.js              # Frontend logic — renders preview cards
│   ├── editor.js           # Live meta tag editor with real-time preview
│   ├── gauges.js           # Character budget gauge rendering
│   ├── crop-visualizer.js  # Image crop safe zone overlay
│   └── platforms/          # Per-platform card renderer modules
│       ├── google.js
│       ├── facebook.js
│       └── ...
└── docs/
    └── plan.md
```

### API

Endpoints:

```
GET  /api/preview?url=https://example.com        # Fetch URL and extract metadata
POST /api/preview  (Content-Type: text/html)      # Parse raw HTML directly
GET  /api/compare?a=https://...&b=https://...     # Side-by-side comparison
GET  /api/audit?sitemap=https://example.com/sitemap.xml  # Sitemap bulk audit
GET  /api/snippet?format=nextjs                   # Generate framework code snippet
```

Response:

```json
{
  "url": "https://example.com",
  "fetchedAt": "2026-03-13T12:00:00Z",
  "meta": {
    "title": "Page Title",
    "description": "Page description text.",
    "canonical": "https://example.com",
    "themeColor": "#8B1A1A",
    "favicon": "https://example.com/favicon.ico"
  },
  "og": {
    "title": "OG Title",
    "description": "OG description.",
    "image": "https://example.com/og-image.jpg",
    "imageWidth": "1200",
    "imageHeight": "630",
    "url": "https://example.com",
    "siteName": "Example",
    "type": "website"
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "Twitter Title",
    "description": "Twitter description.",
    "image": "https://example.com/twitter-image.jpg",
    "site": "@example"
  },
  "jsonLd": {
    "@type": "Person",
    "name": "Example Name"
  },
  "image": {
    "url": "https://example.com/og-image.jpg",
    "width": 1200,
    "height": 630,
    "type": "image/jpeg",
    "size": 245000
  }
}
```

### Frontend

Single-page app with three modes:

**Inspect Mode** (default): Enter a URL (or paste HTML / upload file), hit "Inspect", and see a grid of 31 platform preview cards organized by category. Each card applies the platform's tag fallback logic, truncates text at the correct limits, and shows warning icons for missing/inadequate tags.

**Editor Mode**: Split-pane layout. Left panel: editable form fields for every meta tag, with character budget gauges below each field. Right panel: live-updating preview grid. "Copy HTML" and framework-specific "Copy Snippet" buttons at the top.

**Compare Mode**: Two URL inputs side-by-side. Each platform card rendered twice with diff highlighting showing what changed between the two pages.

**Audit Mode**: Enter a domain or sitemap URL. Table view of all pages with per-platform coverage heatmap, sortable by worst-performing.

Card categories in all modes:
- **Social & Microblogging** (10 cards)
- **Messaging** (11 cards)
- **Collaboration** (5 cards)
- **Content, Email & RSS** (5 cards)

Each card supports two display modes: "Card only" (isolated preview) and "In context" (embedded in a realistic platform UI frame).

### Stateless Design

- No database, no cache, no sessions
- Every request fetches the URL fresh
- Image dimensions probed via HTTP HEAD + streaming first bytes (for format detection)
- No user accounts, no history, no analytics

### Security

- URL validation: reject private IPs, localhost, file:// etc. (SSRF protection)
- Response size limit: read only first 512 KB of target page
- Timeout: 10-second fetch timeout per URL
- Rate limiting: basic in-memory token bucket (stateless — resets on restart, which is fine)
- No cookies, no auth required

---

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY src/ src/
COPY public/ public/
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
```

### Kubernetes (apexalgo-iad)

Deployed via ArgoCD from `ardenone-cluster/cluster-configuration/apexalgo-iad/vista/`.

Manifests needed:
- `namespace.yml`
- `deployment.yml` (1 replica, stateless)
- `service.yml` (ClusterIP, port 3000)
- `ingressroute.yml` (Traefik, e.g. `vista.ardenone.com`)

Resource requests:
- CPU: 100m / limit 500m
- Memory: 128Mi / limit 256Mi

### CI

Container builds via the existing `container-build` WorkflowTemplate in Argo Workflows. Place `Dockerfile` and `VERSION` file in `containers/vista/` within the appropriate repo, or build from this standalone repo via the same Argo Events pipeline (add `vista` to the GitHub EventSource and container-build sensor).

---

## Implementation Phases

### Phase 1: Core
- Express server with `/api/preview` endpoint (GET for URL, POST for raw HTML)
- HTML fetcher with meta tag parser (cheerio)
- Image dimension probing (HTTP HEAD + partial download)
- Static frontend with URL input + paste HTML toggle
- Card renderers: Google, Facebook, X, LinkedIn, Reddit, Slack, Discord, WhatsApp, iMessage, Telegram
- Auto-fix generator with copy-paste snippets
- Dockerfile

### Phase 2: Editor & Full Coverage
- Live Meta Tag Editor with real-time preview updates
- Character budget gauges below editable fields
- Code snippet generator (Plain HTML, Next.js, Nuxt, Remix, Astro, SvelteKit)
- Remaining 21 platform card renderers
- Missing-tag warnings per platform

### Phase 3: Advanced Features
- Image crop safe zone visualizer
- Platform-contextualized mockups (cards inside realistic UI frames)
- Side-by-side URL comparison with diff highlighting
- Sitemap crawler with site-wide report card
- Dark/light mode toggle for platforms that support both
- Raw metadata viewer (all extracted tags in a table)
