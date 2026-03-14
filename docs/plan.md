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

### Cache Invalidation Hub

After fixing meta tags, every platform still shows the old preview because they cache aggressively. VISTA shows a "Refresh Caches" panel with one-click links to each platform's cache invalidation tool, pre-populated with the inspected URL.

**Implementation:**
- Panel appears after inspection with a button per platform
- Direct links (pre-populated with the URL):
  - Facebook: `https://developers.facebook.com/tools/debug/?q={url}`
  - X/Twitter: `https://cards-dev.twitter.com/validator` (manual paste)
  - LinkedIn: `https://www.linkedin.com/post-inspector/inspect/{url}`
  - Telegram: link to `@WebPageBot` with instructions
  - Google: `https://search.google.com/test/rich-results?url={url}`
  - Discord: note that cache expires after ~24h (no manual purge)
- For platforms with purge APIs (Facebook Graph API `?scrape=true`), offer a direct "Purge" button that hits the API server-side
- Endpoint: `POST /api/purge?url=https://...&platform=facebook`

---

### "What If" Tag Toggle

Checkboxes next to each meta tag in the analysis view. Uncheck a tag and instantly see which platforms break, which fall back gracefully, which are unaffected. Answers "which tags can I safely remove?" and "what would happen if this tag was missing?"

**Implementation:**
- Each extracted tag in the metadata panel gets a toggle checkbox (default: on)
- Unchecking a tag removes it from the data fed to the card renderers
- All 31 previews re-render instantly (pure client-side — no API call)
- Visual indicators on cards that changed: green border = unaffected, yellow = fell back to another tag, red = lost content
- "Essential tags" summary: the minimum set of tags needed for all 31 platforms to render acceptably
- Reset button to restore all toggles

---

### OG Image Generator

A simple builder for creating social card images without Figma or Photoshop. Addresses the root cause of bad social cards — most developers skip OG images because creating one feels like a design task.

**Implementation:**
- Canvas-based editor in the browser:
  - Background: solid color picker, gradient builder, or upload an image
  - Title text: font selector (system fonts), size, color, position (drag to place)
  - Subtitle text: same controls
  - Logo: upload and position (drag to place, resize handles)
- Live preview at 1200×630px (the universal safe size)
- Side panel shows how the generated image would look on each platform (using crop safe zone data)
- "Download PNG" button — renders via `<canvas>` `toBlob()`
- "Use as OG image" button — populates the Live Editor's `og:image` field with a data URL (for local preview) or uploads to a temporary endpoint
- Pre-built color themes for quick starts
- Server-side rendering not required — entirely client-side via Canvas API

---

### Common Mistakes Detector

Structural HTML analysis that catches real-world bugs beyond missing tags. These are the silent failures that cause social cards to break in production.

**Implementation:**
- Checks run automatically after fetching, results shown in a "Diagnostics" panel
- Detections:
  - **Wrong attribute**: `<meta name="og:title">` instead of `<meta property="og:title">` (platforms ignore `name` for OG tags)
  - **Relative image URLs**: `og:image="/img/hero.jpg"` — no platform resolves relative URLs
  - **HTTP image URLs**: `og:image="http://..."` — WhatsApp, Signal, and others silently ignore non-HTTPS
  - **Tags past 32KB**: Slack only reads the first 32KB of HTML — tags buried deeper are invisible
  - **Tags past 750KB**: Google Chat and Gmail stop reading after 750KB
  - **Duplicate/conflicting tags**: two `og:title` tags with different values — show which one platforms would use (first vs. last varies by platform)
  - **Client-side-only tags**: compare raw HTML source vs. parsed DOM — if meta tags only appear after JS execution, most crawlers won't see them
  - **Missing protocol**: `og:url="example.com"` without `https://`
  - **Empty tags**: `<meta property="og:image" content="">` — worse than missing (some platforms treat it as "no image" instead of falling back)
- Each diagnostic includes severity (error/warning/info) and a one-line fix

---

### Platform Score Card

A-through-F letter grade per platform with color coding. Makes optimization gamified — satisfying to take a page from C to A+.

**Implementation:**
- Scoring criteria per platform:
  - A+: All tags present, image meets recommended size, text within optimal length
  - A: All required tags present, image meets minimum size
  - B: Required tags present but image undersized or text truncated
  - C: Some required tags missing but fallbacks produce acceptable result
  - D: Critical tags missing, card renders poorly
  - F: Card essentially broken (no title, no image where required)
- Overall score: weighted average (social platforms weighted higher than niche ones)
- Summary bar at top of preview grid: "Overall: B+ (23 platforms A/B, 5 platforms C, 3 platforms D/F)"
- Each grade is clickable — expands to show exactly what's missing and the auto-fix for it
- Exportable as a badge/shield image (like CI badges): `![VISTA Score](vista.ardenone.com/api/badge?url=...)`

---

### Card Screenshot API

Render any platform's mocked card as a PNG image via API. Enables embedding previews in GitHub PRs, documentation, Slack messages, and presentations.

**Implementation:**
- Endpoint: `GET /api/screenshot?url=https://...&platform=facebook&theme=light`
- Parameters:
  - `platform`: any of the 31 supported platforms (required)
  - `theme`: `light` or `dark` (for platforms that support both)
  - `scale`: `1x` or `2x` (retina)
- Server-side rendering via SVG template → sharp PNG conversion (no headless browser needed)
  - Each platform has an SVG template with placeholder tokens for title, description, image, domain
  - Text is measured and truncated server-side using the platform's rules
  - OG image is fetched, resized, and embedded as base64 in the SVG
  - Sharp converts the composed SVG to PNG
- Response: `Content-Type: image/png` with appropriate cache headers
- "Download screenshot" button on each card in the frontend UI
- Bulk endpoint: `GET /api/screenshots?url=https://...&platforms=facebook,twitter,slack` returns a ZIP

---

### Redirect Chain Analyzer

Follow all HTTP redirects, display the full chain, parse meta tags at each hop. Warn when a redirect strips or changes meta tags.

**Implementation:**
- When fetching a URL, use `redirect: 'manual'` and follow each hop explicitly
- At each hop, record:
  - URL
  - Status code (301, 302, 307, 308)
  - Response headers (especially `Location`, `Cache-Control`)
  - Meta tags found (if the response is HTML)
- Display as a vertical chain diagram:
  ```
  https://example.com → 301 → https://www.example.com → 200 ✓
  ```
- Warnings:
  - "Redirect from HTTP to HTTPS — some platforms may not follow this"
  - "Meta tags at hop 1 differ from hop 3 — platforms may see different previews depending on how many redirects they follow"
  - "Chain is 5 hops deep — some platforms give up after 3"
  - "302 (temporary) redirect — platforms may cache the redirect URL instead of the final URL"
- Show which meta tags each platform would see based on its known redirect-following behavior

---

### Response Header Analyzer

HTTP headers silently affect social card rendering. VISTA already makes the fetch — inspect the response headers for issues.

**Implementation:**
- Checks run automatically as part of the fetch, results shown in a "Headers" tab in Diagnostics
- Header checks:
  - **`X-Frame-Options`**: if `DENY` or `SAMEORIGIN`, warn that some platforms may not render interactive previews
  - **`Content-Security-Policy`**: check `img-src` directive — if restrictive, OG images may not load on some platforms
  - **`Cache-Control`**: show TTL — explains why platforms show stale previews. Warn if `no-cache` (forces re-fetch every time, slow)
  - **`Content-Type`**: must be `text/html` — some crawlers skip non-HTML responses entirely
  - **Image URL headers**: HEAD request on `og:image` URL to check:
    - CORS headers (`Access-Control-Allow-Origin`) — some platforms require CORS
    - `Content-Type` — warn if image serves wrong MIME type
    - `Content-Length` — warn if image exceeds platform size limits (8MB Facebook, 5MB Twitter, 300KB WhatsApp)
    - Response time — warn if image takes >3s to load (some platforms time out)
- Each finding includes severity and actionable fix

---

### Template Library

One-click meta tag templates for common page types. Populates the Live Editor with best-practice defaults so users customize from a solid baseline instead of starting from scratch.

**Implementation:**
- Templates stored as JSON configs:
  ```json
  {
    "name": "Blog Post",
    "tags": {
      "og:type": "article",
      "twitter:card": "summary_large_image",
      "og:image": "[Your hero image URL]",
      ...
    },
    "notes": "Use your post's hero image as og:image. Keep title under 60 chars."
  }
  ```
- Available templates:
  - **Blog Post** — article type, summary_large_image, author tags
  - **SaaS Landing Page** — website type, product-focused description
  - **E-Commerce Product** — product type, price/availability structured data
  - **Portfolio / Personal Site** — Person schema, profile-focused
  - **Event Page** — event type, date/location structured data
  - **Recipe** — recipe schema, cooking time, ingredients preview
  - **Podcast Episode** — audio type, episode metadata
  - **Documentation / Docs Site** — minimal, text-focused
  - **Open Source Project** — GitHub-style, repo stats
  - **Newsletter / Substack** — article type, subscribe CTA
- "Start from template" button in the Live Editor opens a template picker
- Templates are additive — they don't overwrite tags the user has already set
- Community template submissions (future: allow users to share templates via GitHub PR to the repo)

---

### Shareable Results via URL

The inspection URL doubles as a shareable link. Zero storage, completely stateless.

**Implementation:**
- URL structure: `vista.ardenone.com/?url=https://example.com`
- Opening the link auto-runs the inspection and displays results
- "Copy share link" button in the UI copies the current URL with the inspected target encoded as a query parameter
- Additional state encoded in the URL hash (stateless, no server storage):
  - Mode: `#mode=compare&b=https://other.com`
  - Disabled tags (What If mode): `#without=og:image,twitter:card`
  - Active tab: `#tab=diagnostics`
- QR code generator — click to generate a QR code of the share link (useful for mobile testing: scan with phone to see how the URL previews in mobile apps)
- When shared in platforms that support OG cards (Slack, Twitter, etc.), VISTA itself renders a meta card showing the inspected URL's score — recursive social card preview

---

## User Experience

### Design Principles

1. **Start simple, reveal depth.** A first-time user should be productive in 3 seconds: paste URL, hit Enter, see results. Every advanced feature is one click away but never in the way.
2. **Answers before data.** Lead with the score card and actionable fixes. Raw metadata is available but not the default view.
3. **Respect attention.** 31 platforms is overwhelming. Show the ones that matter most by default, let users expand.
4. **No dead ends.** Every diagnostic finding links to its fix. Every fix links to its code snippet. Every snippet links to the cache invalidation for that platform.

---

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  VISTA logo          [Inspect] [Editor] [Compare] [Audit]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔗 Enter URL or paste HTML...          [Inspect ▶]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Summary Bar ─────────────────────────────────────────┐  │
│  │  Overall: B+  │  23 ✓  5 ⚠  3 ✗  │  [Fix all] [Share]│  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Tabs ────────────────────────────────────────────────┐  │
│  │  [Previews]  [Diagnostics]  [Raw Tags]  [Cache]      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Preview Grid ────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  ▼ Top Platforms (expanded by default)                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │  │ Google   │ │ Facebook │ │ X/Twitter│              │  │
│  │  │  [A+]    │ │  [B]     │ │  [A]     │              │  │
│  │  └──────────┘ └──────────┘ └──────────┘              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │  │ LinkedIn │ │ Slack    │ │ Discord  │              │  │
│  │  │  [A]     │ │  [C]     │ │  [A]     │              │  │
│  │  └──────────┘ └──────────┘ └──────────┘              │  │
│  │                                                        │  │
│  │  ▶ Messaging (collapsed — click to expand)             │  │
│  │  ▶ Collaboration (collapsed)                           │  │
│  │  ▶ Content, Email & RSS (collapsed)                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Footer ──────────────────────────────────────────────┐  │
│  │  VISTA — Visual Inspector of Social Tags & Attributes  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### Information Hierarchy

**Layer 1 — Glanceable (always visible after inspection):**
- Summary bar: overall letter grade, platform pass/warn/fail counts
- "Fix all" button (applies auto-fixes to Live Editor)
- "Share" button (copies shareable URL)

**Layer 2 — Primary (Previews tab, default view):**
- **Top Platforms** section: expanded by default, shows the 6 highest-traffic platforms (Google, Facebook, X, LinkedIn, Slack, Discord). Each card shows its letter grade badge.
- Remaining categories collapsed with a count label: "Messaging (11) — 8 passing, 2 warnings, 1 failing"

**Layer 3 — Diagnostic (Diagnostics tab):**
- Common mistakes (errors first, then warnings, then info)
- Redirect chain diagram
- Response header findings
- Each item has a "Fix" button that jumps to the relevant field in the Editor

**Layer 4 — Reference (Raw Tags tab):**
- Full table of every extracted meta tag with source line numbers
- "What If" toggles next to each tag
- JSON-LD viewer with syntax highlighting

**Layer 5 — Actions (Cache tab):**
- Cache invalidation hub with per-platform purge links
- Image crop safe zone visualizer
- Screenshot download buttons

---

### Progressive Disclosure

**Before inspection (empty state):**
- Clean hero with the URL input centered vertically
- Below: "or paste HTML | upload file" toggle links (subtle, not competing for attention)
- Below that: three example URLs as clickable chips ("Try: github.com, stripe.com, your-site.com")
- No tabs, no grid, no features visible — just the input

**After inspection (results state):**
- Input bar shrinks to a compact bar at the top (stays accessible for re-inspection)
- Summary bar appears with score and action buttons
- Tabs appear: Previews (active), Diagnostics, Raw Tags, Cache
- Preview grid loads with Top Platforms expanded, rest collapsed
- If the score is below B, the Diagnostics tab pulses briefly to draw attention

**Editor mode:**
- Split pane appears: editor form on left (40%), preview grid on right (60%)
- Character budget gauges appear below title and description fields only
- Gauges start collapsed as a single summary line ("Title: OK on 28/31 platforms") — click to expand the full gauge set
- Code snippet generator appears as a floating "Copy code" button in the top-right of the editor pane

---

### Card Component Design

Each platform preview card follows a consistent wrapper pattern:

```
┌─────────────────────────────┐
│ [icon] Platform Name  [A+]  │  ← Header: platform icon, name, letter grade
├─────────────────────────────┤
│                             │
│   [Platform-specific card   │  ← Body: styled to match the real platform
│    rendered here]           │
│                             │
├─────────────────────────────┤
│ ⚠ Image too small (800×400) │  ← Footer: warnings/diagnostics (if any)
│ 📋 Copy  📸 Screenshot      │  ← Actions: copy card HTML, download PNG
└─────────────────────────────┘
```

**Card states:**
- **Healthy** (score A/A+): subtle green left border, grade badge is green
- **Warning** (score B/C): yellow left border, grade badge is yellow, footer shows warnings
- **Failing** (score D/F): red left border, grade badge is red, footer shows errors with fix buttons
- **Loading**: skeleton card with shimmer animation matching the card's expected layout
- **Expanded**: clicking a card expands it to full-width, showing the "In context" mockup and full diagnostic details

**Card interactions:**
- **Hover**: subtle lift shadow, "Click to expand" hint on first use
- **Click**: expand to full-width detail view with contextualized mockup
- **Right-click / long-press**: context menu with "Copy screenshot", "Open in editor", "View raw tags"
- **Drag**: reorder cards (position saved to localStorage)

---

### Mode-Specific Layouts

**Inspect Mode:**
```
┌─────────────────────────────────────────┐
│ [URL input bar]                         │
│ [Summary bar: score + actions]          │
│ [Tabs: Previews | Diagnostics | ...]    │
│ [Content area: grid/list/table]         │
└─────────────────────────────────────────┘
```
Full-width. Content area changes based on active tab.

**Editor Mode:**
```
┌──────────────────┬──────────────────────┐
│ Editor Panel     │ Preview Grid         │
│                  │                      │
│ [Title ____]     │ ┌────┐ ┌────┐       │
│ [gauges]         │ │Goog│ │ FB │       │
│ [Description __] │ └────┘ └────┘       │
│ [gauges]         │ ┌────┐ ┌────┐       │
│ [og:image ____]  │ │ X  │ │Link│       │
│ [template btn]   │ └────┘ └────┘       │
│ [snippet btn]    │                      │
│                  │ [What If toggles]    │
└──────────────────┴──────────────────────┘
```
Resizable split pane (drag the divider). Editor panel scrolls independently. Preview grid updates live on every keystroke.

**Compare Mode:**
```
┌──────────────────┬──────────────────────┐
│ URL A: [____]    │ URL B: [____]        │
├──────────────────┼──────────────────────┤
│ [Summary A]      │ [Summary B]          │
├──────────────────┼──────────────────────┤
│ ┌────────────┐   │ ┌────────────┐       │
│ │ Facebook A │   │ │ Facebook B │       │
│ └────────────┘   │ └────────────┘       │
│ ┌────────────┐   │ ┌────────────┐       │
│ │ Twitter A  │   │ │ Twitter B  │       │
│ └────────────┘   │ └────────────┘       │
└──────────────────┴──────────────────────┘
```
Side-by-side scroll-locked columns. Diff highlights in green/red between the two.

**Audit Mode:**
```
┌─────────────────────────────────────────┐
│ [Sitemap URL: ____]  [Scan ▶]           │
├─────────────────────────────────────────┤
│ Progress: ████████░░ 47/62 pages        │
├──────┬──────┬──────┬──────┬──────┬──────┤
│ Page │ Score│Google│  FB  │  X   │ ...  │
├──────┼──────┼──────┼──────┼──────┼──────┤
│ /    │  A+  │  ✓   │  ✓   │  ✓   │      │
│ /blog│  C   │  ✓   │  ⚠   │  ✗   │      │
│ /about│ F   │  ✗   │  ✗   │  ✗   │      │
└──────┴──────┴──────┴──────┴──────┴──────┘
```
Sortable data table. Click any cell to jump to that page's full Inspect view.

---

### Responsive Design

**Desktop (≥ 1200px):**
- 3-column card grid (Top Platforms section)
- Full split-pane editor
- Side-by-side compare

**Tablet (768px – 1199px):**
- 2-column card grid
- Editor switches to stacked layout (editor on top, preview below) with a toggle to swap
- Compare uses tabbed view instead of side-by-side (Tab A | Tab B with a diff summary)

**Mobile (< 768px):**
- Single-column card stack
- Editor is full-screen with a "Preview" button that slides in the preview panel from the right
- Compare uses tabbed view
- Audit table becomes card list (one card per page, each showing the score and top issues)
- URL input takes full width, paste/upload modes accessible via bottom sheet

**Touch interactions:**
- Swipe left/right on cards to navigate between platforms
- Swipe down on expanded card to collapse
- Long-press for context menu (screenshot, edit, raw tags)

---

### Loading & Performance

**Inspection loading sequence (progressive rendering):**
1. **Instant** (0ms): URL accepted, input bar shows spinner, skeleton grid appears
2. **HTML fetched** (~500ms): Summary bar populates with score. Skeleton cards get titles as text is extracted first.
3. **Meta tags parsed** (~600ms): All text-based card previews render (Google, text portions of all cards)
4. **Image probed** (~1–3s): Image dimensions arrive. Cards with images fill in. Crop visualizer becomes available.
5. **Headers analyzed** (~600ms, parallel): Diagnostics tab populates with header findings
6. **Complete**: Loading spinner stops. All cards fully rendered.

Each card transitions from skeleton → content with a subtle fade (150ms). Cards that complete first render immediately — no waiting for the slowest card.

**Perceived performance optimizations:**
- Skeleton cards match the expected layout of each platform (different skeletons for image-on-top vs. thumbnail-on-left)
- Score card appears as soon as tags are parsed (before image probing completes)
- "Top Platforms" section loads first since it's visible; collapsed sections defer rendering until expanded
- Image thumbnails in cards use a blurhash placeholder while the full OG image loads

---

### Onboarding

**First visit:**
- No tutorial, no modal, no tooltip tour — just the clean input with example URLs as chips
- First inspection triggers a brief toast: "Click any card to expand. Try the Diagnostics tab for issues." (dismissible, shown once, saved to localStorage)

**Feature discovery:**
- Features are discoverable through the natural workflow:
  - Low score → "Fix all" button → Editor opens automatically
  - Editor opens → gauges appear below fields
  - Diagnostics tab shows issues → each issue has a "Fix" link → scrolls to the relevant Editor field
  - User edits a tag → "Copy code" button appears → snippet generator revealed
- Advanced features have subtle affordances: the cache tab shows a badge count if the URL has cache issues; the "What If" panel shows a toggle icon next to each tag in the Raw Tags view

**Empty state messaging:**
- No URL entered: "Paste any URL to see how it looks when shared on 31 platforms"
- URL entered but page has no meta tags: "This page has no Open Graph or Twitter Card tags. Want to create them?" → opens Editor with template picker

---

### Accessibility

- All interactive elements are keyboard-navigable (Tab, Enter, Escape)
- Card grid supports arrow key navigation
- Screen reader announcements for score changes, loading completion, and diagnostic findings
- Color is never the only indicator — letter grades, icons, and text labels accompany all color coding
- Respects `prefers-reduced-motion` — disables card transitions, skeleton shimmer, and toast animations
- Respects `prefers-color-scheme` — VISTA itself has a light/dark mode (separate from the platform dark mode toggle for card previews)
- Focus ring visible on all interactive elements
- Minimum tap target size of 44×44px on mobile

---

### Visual Design

**Color palette:**
- Neutral base: white/gray background, dark text (not competing with platform card colors)
- Accent: single brand color for VISTA UI elements (buttons, links, active tab)
- Semantic: green (pass), yellow (warning), red (fail) — used only for scores and diagnostics
- Platform cards render in their own brand colors — VISTA's chrome stays neutral to avoid visual conflict

**Typography:**
- System font stack (`-apple-system, BlinkMacSystemFont, ...`) for VISTA UI
- Platform cards use the closest available web font to each platform's actual font (e.g., `Segoe UI` for Discord, `SF Pro` for iMessage, `Roboto` for Google)

**Card rendering fidelity:**
- Cards should be visually recognizable as "that's what it looks like on Facebook" at a glance
- Rounded corners, shadows, padding, and font sizes match the real platform as closely as possible
- Platform icons (SVG) in card headers for instant recognition
- Cards don't need to be pixel-perfect — close enough to be useful for decision-making

---

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `/` | Focus URL input |
| `Enter` | Run inspection (when input focused) |
| `1` – `4` | Switch tabs (Previews, Diagnostics, Raw Tags, Cache) |
| `E` | Toggle Editor mode |
| `C` | Toggle Compare mode |
| `←` `→` | Navigate between cards (when grid focused) |
| `Enter` | Expand focused card |
| `Escape` | Collapse card / close modal / close palette |
| `Cmd+Shift+C` | Copy code snippet |
| `Cmd+Shift+S` | Copy share link |
| `Cmd+Z` | Undo last edit (in editor/inline edit) |

---

### UX Power Features

#### Inline Card Editing

Click directly on rendered text inside any platform card preview and it becomes editable in place. Type a new title inside the Facebook card and every other card's title updates in real-time. The character gauge appears below the text being edited. No separate form, no split pane — you edit the output directly.

**Implementation:**
- `contenteditable` attribute on rendered text elements (title, description) within card previews
- `input` event listener propagates changes to the shared metadata state object
- All other cards re-render reactively from the shared state (debounced at 50ms)
- A subtle blue outline and cursor change indicate editable regions on hover
- Pressing `Escape` reverts to the original value; `Tab` moves to the next editable field in the same card
- Edited values are marked with a blue dot indicator in the Raw Tags tab
- Works alongside the split-pane editor — changes in either location sync bidirectionally

---

#### Command Palette

`Cmd+K` opens a search-everything bar that makes every feature reachable from one consistent interface.

**Implementation:**
- Modal overlay with a text input and filtered results list
- Fuzzy matching against a command registry:
  - Mode switching: "inspect", "editor", "compare", "audit"
  - Actions: "screenshot facebook", "copy nextjs snippet", "share link", "export all screenshots"
  - Filters: "show broken", "show only social", "hide messaging"
  - What If: "what if no og:image", "what if no twitter:card"
  - Navigation: "go to diagnostics", "go to cache", "go to raw tags"
  - Templates: "template blog post", "template saas landing"
- Results show the action name, a brief description, and keyboard shortcut (if any)
- Arrow keys to navigate results, `Enter` to execute, `Escape` to dismiss
- Recently used commands appear first when the palette is empty
- Extensible registry — new features automatically appear in the palette

---

#### Smart Platform Ordering

Auto-detect the page type and reorder platform cards by likely relevance, so the most important cards appear first without manual configuration.

**Implementation:**
- Detection heuristics (checked in order, first match wins):
  - `og:type` value: `article` → blog ordering, `product` → e-commerce ordering
  - JSON-LD `@type`: `Recipe` → Pinterest first, `SoftwareApplication` → GitHub/Discord first
  - URL patterns: `github.com/*` → GitHub, Slack, Discord first; `*.substack.com` → Substack, X, LinkedIn first
  - Content keywords: "recipe", "ingredients" → Pinterest; "download", "pricing" → SaaS ordering
  - Fallback: default ordering (Google, Facebook, X, LinkedIn, Slack, Discord, ...)
- Predefined orderings:
  - **Blog/Article**: Google, Facebook, X, LinkedIn, Reddit, Slack, Mastodon, ...
  - **SaaS/Product**: Google, LinkedIn, X, Facebook, Slack, Product Hunt, ...
  - **Recipe**: Pinterest, Google, Facebook, WhatsApp, iMessage, ...
  - **Open Source**: GitHub, X, Slack, Discord, Reddit, Mastodon, ...
  - **Portfolio**: LinkedIn, Google, X, Facebook, GitHub, ...
  - **E-commerce**: Google, Facebook, Pinterest, Instagram, WhatsApp, ...
- Subtle label above the grid: "Ordered by relevance for: Blog post" with an "×" to revert to default
- User's favorites (starred platforms) always override smart ordering

---

#### Diagnostic Resolution Tracking

When an issue is fixed in the editor, the corresponding diagnostic visually resolves — creating a rewarding fix-and-verify loop.

**Implementation:**
- Each diagnostic item has a unique ID tied to the specific tag and check that triggered it
- After every editor change, diagnostics re-run against the current (edited) metadata state
- Resolved diagnostics:
  - Strikethrough text with a green checkmark icon
  - Fade to 50% opacity (but remain visible so the user sees progress)
  - Slide to the bottom of the diagnostics list
- Diagnostic count badge on the tab updates in real-time: "Diagnostics (5)" → "Diagnostics (3)"
- Summary bar score re-calculates and animates to the new value
- Affected card borders transition from red/yellow to green
- Progress indicator in the diagnostics tab: "Fixed 3/5 issues — score improved C → A"
- Undo support: if the user reverts an edit, the diagnostic reappears

---

#### Platform Favorites & Custom Layout

Star platforms to pin them to a "Your Platforms" section. Drag to reorder. Hide platforms you never care about. All saved to localStorage.

**Implementation:**
- Star icon (☆/★) in each card's header bar — click to toggle
- Starred platforms appear in a "Your Platforms" section at the top of the grid, above category sections
- Drag-and-drop within and between sections (HTML Drag and Drop API or a lightweight library like SortableJS)
- "Hide" option in each card's context menu (right-click or overflow menu)
- Hidden platforms collected in a collapsible "Hidden (7)" expander at the bottom
  - Hidden platforms are still analyzed and scored — hiding is display-only
  - Score summary still reflects all 31 platforms
- Settings persist in localStorage under a `vista-preferences` key:
  ```json
  {
    "favorites": ["google", "facebook", "twitter", "slack"],
    "hidden": ["kakaotalk", "tumblr", "line"],
    "order": ["google", "facebook", "twitter", "slack", "linkedin", ...]
  }
  ```
- "Reset to defaults" button in a minimal settings popover
- First-time users see the default "Top Platforms" layout; the favorites section appears only after the first star

---

#### Paste Auto-Detection

The URL input analyzes clipboard content and adapts the input mode automatically — no explicit mode toggle needed.

**Implementation:**
- `paste` event listener on the input field inspects the pasted content:
  - Starts with `http://` or `https://` → URL mode (default)
  - Starts with `<` or `<!DOCTYPE` or contains `<html` → auto-switch to HTML mode, show "Detected HTML — previewing as raw markup" toast
  - Contains `sitemap.xml` in the URL → show a suggestion chip: "This looks like a sitemap. Switch to Audit mode?"
  - Contains two or more URLs separated by newlines → show a suggestion chip: "Multiple URLs detected. Switch to Compare mode?"
  - Contains a shortened URL (`bit.ly`, `t.co`, etc.) → show a note: "Shortened URL — VISTA will follow redirects"
- Suggestion chips are dismissible and non-blocking — the user can ignore and proceed normally
- Mode auto-switch is animated: the input bar smoothly transforms (URL field → HTML textarea with syntax hints)
- `Cmd+Z` after auto-switch reverts to URL mode with the original pasted content

---

#### Score Improvement Predictions

Next to each diagnostic, show the exact quantified impact of fixing it — not just "this is broken" but "here's what fixing it gets you."

**Implementation:**
- Each diagnostic runs a simulation: temporarily apply the fix to the metadata, re-score all 31 platforms, calculate the delta
- Display format: "Add `og:image` (1200×630) → **B to A+** on Facebook, LinkedIn, Reddit, Slack, WhatsApp **(+5 platforms)**"
- Predictions sorted by impact: the fix that improves the most platforms appears first
- Color-coded impact labels:
  - High impact (5+ platforms improved): bold green
  - Medium impact (2–4 platforms): yellow
  - Low impact (1 platform): gray
- In the editor, each field shows a micro-label below it: "Editing this affects 24 platforms"
- The "Fix all" button shows a preview: "Apply 5 fixes → overall score C to A+ (estimated)"
- Impact simulation is client-side only — no additional API calls, runs the scoring function against modified metadata

---

#### Progressive Card Cascade

Cards appear with a staggered waterfall animation, with platform-specific skeleton placeholders and progressive content filling.

**Implementation:**
- Skeleton cards rendered immediately (0ms) — each skeleton matches the expected layout of its platform:
  - Facebook/LinkedIn/Reddit: tall skeleton (image-on-top region + text lines below)
  - WhatsApp/Slack/Notion: short skeleton (thumbnail-left + text lines right)
  - Google: text-only skeleton (two lines, no image region)
- Skeletons have a subtle shimmer animation (CSS `@keyframes` with `background: linear-gradient`)
- Cards stagger in with a 50ms delay between each: card 1 at 0ms, card 2 at 50ms, card 3 at 100ms, etc.
- Each card transitions from skeleton → content with a 150ms crossfade (`opacity` + `transform: translateY(4px)`)
- Content fills progressively as data arrives:
  1. Text-only cards (Google) render first (after HTML parse, ~500ms)
  2. Cards with images show a CSS `background-color` placeholder extracted from the image's dominant color (or a neutral gray)
  3. OG image loads asynchronously — when ready, crossfades in over the color placeholder
- `prefers-reduced-motion` media query disables all animations — cards appear instantly without cascade or crossfade

---

#### Cached Recent Inspections

Last 10 inspections stored in localStorage for instant recall, with change tracking between visits.

**Implementation:**
- After each successful inspection, store to localStorage:
  ```json
  {
    "url": "https://example.com",
    "timestamp": "2026-03-13T14:30:00Z",
    "score": "B+",
    "platformScores": { "google": "A+", "facebook": "B", ... },
    "metadata": { ... },
    "favicon": "https://example.com/favicon.ico"
  }
  ```
- Landing page (before inspection) shows a "Recent" strip below the URL input:
  ```
  Recent: [🌐 example.com B+ · 2h ago] [🌐 jedarden.com A+ · 1d ago] [...]
  ```
- Click a recent item → show cached results instantly (no network request)
- Prominent "Re-fetch" button at the top of cached results
- After re-fetching, if the score changed, show a change indicator:
  - "↑ Score improved: B+ → A (since 2 hours ago)"
  - "↓ Score decreased: A → C (since 1 day ago)" with a diff of what changed
  - "= No changes since last inspection"
- Max 10 entries, FIFO eviction
- "Clear history" link in the recent strip
- Total localStorage budget: ~500KB (metadata is compact; images are URLs, not stored)

---

#### Confetti on Perfect Score

When all 31 platforms score A+ — a rare achievement requiring every tag present, every image correctly sized, every description within limits — the app celebrates.

**Implementation:**
- Trigger condition: every platform's individual score === "A+"
- Animation: canvas-based confetti burst (lightweight library like `canvas-confetti`, ~6KB gzipped)
  - Duration: 2 seconds
  - Colors: VISTA's brand accent + green
  - Particle count: ~150 (performant on mobile)
- Toast notification: "Perfect score! Your page is fully optimized across all 31 platforms." with a share button
- Share button generates a shareable card: "jedarden.com scored A+ on all 31 platforms — verified by VISTA"
- Score badge in the summary bar gets a subtle golden glow for the session
- Respects `prefers-reduced-motion`: if enabled, skip confetti, show only the toast
- Does NOT trigger on cached results — only on fresh inspections (prevents repeated confetti on page reload)
- Does NOT trigger in Compare or Audit modes (only Inspect and Editor)

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
│   ├── diagnostics.js      # Common mistakes detector + response header analyzer
│   ├── scorer.js           # Platform score card (A+ through F grading)
│   ├── image-probe.js      # Image dimension/format detection via partial download
│   ├── screenshot.js       # SVG template → PNG card screenshot renderer
│   ├── snippet-gen.js      # Framework-specific code snippet generator
│   └── templates/          # Meta tag template library (JSON configs)
│       ├── blog-post.json
│       ├── saas-landing.json
│       ├── ecommerce-product.json
│       └── ...
├── public/
│   ├── index.html          # Single-page app
│   ├── style.css           # Platform-accurate card styles
│   ├── app.js              # Frontend logic — renders preview cards
│   ├── editor.js           # Live meta tag editor with real-time preview
│   ├── gauges.js           # Character budget gauge rendering
│   ├── what-if.js          # "What If" tag toggle logic
│   ├── og-image-gen.js     # Canvas-based OG image generator
│   ├── crop-visualizer.js  # Image crop safe zone overlay
│   ├── cache-hub.js        # Cache invalidation hub — platform purge links
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
POST /api/purge?url=https://...&platform=facebook # Trigger platform cache purge
GET  /api/screenshot?url=...&platform=facebook    # Render card preview as PNG
GET  /api/screenshots?url=...&platforms=facebook,twitter  # Bulk PNG (ZIP)
GET  /api/badge?url=https://example.com           # Score badge image (SVG)
GET  /api/templates                               # List available templates
GET  /api/templates/:name                         # Get a specific template
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

### Container Registry

Images published to GitHub Container Registry: `ghcr.io/jedarden/vista`

- No storage limits for public repos
- No pull rate limits (unlike Docker Hub)
- Same GitHub token handles both code and image access

### CI/CD — GitHub Actions

A single workflow at `.github/workflows/build-container.yml` handles the full build-and-release pipeline.

**Trigger:** Push to `main` that changes files in the container area (`src/`, `public/`, `Dockerfile`, `package.json`, `package-lock.json`).

**Flow:**

```
Push to main
  │
  ├─ Changed files in container area?
  │    No → skip
  │    Yes ↓
  │
  ├─ Was VERSION file changed in this commit?
  │    Yes → use that version as-is
  │    No  → auto-bump patch version (1.0.0 → 1.0.1), commit VERSION back to repo
  │          ↓
  │
  ├─ Build container image
  │    ↓
  ├─ Push to ghcr.io/jedarden/vista:<version>
  ├─ Push to ghcr.io/jedarden/vista:latest
  │    ↓
  └─ Create GitHub Release with tag v<version>
```

**Workflow:**

```yaml
name: Build & Release Container

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'public/**'
      - 'Dockerfile'
      - 'package.json'
      - 'package-lock.json'
      - 'VERSION'

permissions:
  contents: write
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Check if VERSION was changed
        id: version-check
        run: |
          if git diff --name-only HEAD~1 HEAD | grep -q '^VERSION$'; then
            echo "bumped=true" >> "$GITHUB_OUTPUT"
          else
            echo "bumped=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Auto-bump patch version
        if: steps.version-check.outputs.bumped == 'false'
        run: |
          CURRENT=$(cat VERSION | tr -d '[:space:]')
          MAJOR=$(echo "$CURRENT" | cut -d. -f1)
          MINOR=$(echo "$CURRENT" | cut -d. -f2)
          PATCH=$(echo "$CURRENT" | cut -d. -f3)
          NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
          echo "$NEW_VERSION" > VERSION
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add VERSION
          git commit -m "chore: bump version to ${NEW_VERSION}"
          git push

      - name: Read version
        id: version
        run: echo "version=$(cat VERSION | tr -d '[:space:]')" >> "$GITHUB_OUTPUT"

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/jedarden/vista:${{ steps.version.outputs.version }}
            ghcr.io/jedarden/vista:latest

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.version.outputs.version }}
          name: v${{ steps.version.outputs.version }}
          generate_release_notes: true
```

**Version file:** A `VERSION` file at the repo root (e.g. `0.1.0`). Developers can bump it manually in a commit for major/minor releases. If they don't, CI auto-bumps the patch number.

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

**Domain:** `vista.ardenone.com`

Deployed via ArgoCD from `ardenone-cluster/cluster-configuration/apexalgo-iad/vista/`.

Manifests:

**`namespace.yml`**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vista
  labels:
    app.kubernetes.io/managed-by: argocd
```

**`deployment.yml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vista
  namespace: vista
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vista
  template:
    metadata:
      labels:
        app: vista
    spec:
      containers:
        - name: vista
          image: ghcr.io/jedarden/vista:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 3
            periodSeconds: 10
```

**`service.yml`**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: vista
  namespace: vista
spec:
  selector:
    app: vista
  ports:
    - port: 3000
      targetPort: 3000
```

**`ingressroute.yml`**
```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: vista
  namespace: vista
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`vista.ardenone.com`)
      kind: Rule
      services:
        - name: vista
          port: 3000
  tls:
    certResolver: letsencrypt
```

**DNS:** Create an A/CNAME record for `vista.ardenone.com` in Cloudflare pointing to the apexalgo-iad cluster ingress IP.

**ArgoCD auto-discovery:** The `apexalgo-iad-applicationset.yml` automatically discovers new namespace directories, so adding `vista/` with these manifests is sufficient — no manual Application creation needed.

**Image update strategy:** The deployment uses `image: ghcr.io/jedarden/vista:latest`. To trigger a rollout after a new image push, either:
- Use an image updater (Argo CD Image Updater) to watch GHCR for new tags
- Or add a `deploy-sha` annotation to the pod template and update it via CI after the image push

---

## Implementation Phases

### Phase 1: Core
- Express server with `/api/preview` endpoint (GET for URL, POST for raw HTML)
- HTML fetcher with meta tag parser (cheerio), redirect chain tracking, response header capture
- Image dimension probing (HTTP HEAD + partial download)
- Static frontend with URL input, paste auto-detection (URL vs HTML vs sitemap)
- Progressive card cascade (platform-specific skeletons, staggered entrance, crossfade)
- Card renderers: Google, Facebook, X, LinkedIn, Reddit, Slack, Discord, WhatsApp, iMessage, Telegram
- Common mistakes detector (wrong attributes, relative URLs, HTTP images, tags past 32KB)
- Platform score card (A+ through F letter grades)
- Auto-fix generator with score improvement predictions
- Shareable results via URL query parameters
- Cached recent inspections (localStorage, last 10, change tracking)
- Dockerfile

### Phase 2: Editor & Full Coverage
- Live Meta Tag Editor with real-time preview updates
- Inline card editing (contenteditable on rendered text, bidirectional sync with editor)
- "What If" tag toggle (uncheck tags to see fallback behavior)
- Character budget gauges below editable fields
- Diagnostic resolution tracking (strikethrough fixes, live score updates)
- Code snippet generator (Plain HTML, Next.js, Nuxt, Remix, Astro, SvelteKit)
- Template library (blog, SaaS, e-commerce, portfolio, event, recipe, podcast, docs, OSS, newsletter)
- Cache invalidation hub (one-click links + API purge for Facebook)
- Platform favorites & custom layout (star, reorder, hide — localStorage)
- Smart platform ordering (auto-detect page type, reorder by relevance)
- Command palette (Cmd+K — search all features, actions, modes, commands)
- Remaining 21 platform card renderers
- Missing-tag warnings per platform

### Phase 3: Advanced Features
- Image crop safe zone visualizer
- OG image generator (canvas-based: background + text + logo → 1200×630 PNG)
- Platform-contextualized mockups (cards inside realistic UI frames)
- Side-by-side URL comparison with diff highlighting
- Sitemap crawler with site-wide report card
- Card screenshot API (SVG template → PNG, per-platform)
- Redirect chain analyzer (visual chain diagram with per-hop meta tag diff)
- Response header analyzer (CSP, CORS, Cache-Control, image headers)
- Dark/light mode toggle for platforms that support both
- Raw metadata viewer (all extracted tags in a table)
- Score badge API (embeddable SVG badge)
- Confetti on perfect score (all 31 platforms A+, respects prefers-reduced-motion)
