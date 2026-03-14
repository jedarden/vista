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

## Application Architecture

### Container: `vista`

Single Docker container. Node.js runtime.

```
vista/
├── Dockerfile
├── package.json
├── src/
│   ├── server.js           # Express server — serves API + static files
│   ├── fetcher.js          # URL fetcher with meta tag extraction
│   └── parser.js           # HTML → structured metadata object
├── public/
│   ├── index.html          # Single-page app
│   ├── style.css           # Platform-accurate card styles
│   └── app.js              # Frontend logic — renders preview cards
└── docs/
    └── plan.md
```

### API

Single endpoint:

```
GET /api/preview?url=https://example.com
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

Single-page app. User enters a URL, hits "Inspect", and sees a grid of 31 platform preview cards organized by category.

Each card component:
1. Applies the platform's tag fallback logic (e.g., Twitter falls back from `twitter:title` → `og:title` → `<title>`)
2. Truncates text at the platform's character/pixel limits
3. Renders the card in a mock frame styled to match the platform's actual appearance
4. Shows a warning icon if required tags are missing or image doesn't meet minimum size

Card categories in the UI:
- **Social & Microblogging** (10 cards)
- **Messaging** (11 cards)
- **Collaboration** (5 cards)
- **Content, Email & RSS** (5 cards)

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

### Phase 1: Core (10 platforms)
- Express server with `/api/preview` endpoint
- HTML fetcher with meta tag parser (cheerio)
- Static frontend with URL input
- Card renderers: Google, Facebook, X, LinkedIn, Reddit, Slack, Discord, WhatsApp, iMessage, Telegram
- Dockerfile

### Phase 2: Full Platform Coverage (+21 platforms)
- Mastodon, Bluesky, Threads, Tumblr, Pinterest
- Signal, Teams, Google Chat, Zoom, Line, KakaoTalk
- Notion, Jira/Confluence, GitHub, Trello, Figma
- Medium, Substack, Outlook, Gmail, Feedly/RSS
- Image dimension probing (HTTP HEAD / partial download)
- Missing-tag warnings per platform

### Phase 3: Polish
- Copy-to-clipboard for individual card screenshots
- Tag completeness scorecard (% of platforms fully covered)
- Suggested fixes (e.g. "Add og:image for Facebook previews")
- Dark mode variants for platforms that support it (Discord, Slack)
- Raw metadata viewer (show all extracted tags in a table)
