# VISTA — Visual Inspector of Social Tags & Attributes

## Overview

VISTA is a stateless web application that fetches any URL, extracts its metadata, and renders accurate visual previews of how that link will appear when shared across major platforms.

**Architecture**: Single Docker container (Node.js) serving both the API and static frontend. Stateless — no database, no sessions, no persistent storage. Deployed to apexalgo-iad via ArgoCD.

---

## Platform Specifications

### 1. Google Search

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

### 2. Facebook / Meta

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

### 3. X (Twitter)

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

### 4. LinkedIn

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

### 5. Slack

**Tags used:**
1. `og:title`
2. `og:description`
3. `og:image` → `twitter:image`
4. `og:site_name`
5. `twitter:label1` / `twitter:data1` (up to 2 extra fields)

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

### 6. Discord

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

### 7. WhatsApp

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

### 8. iMessage

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

### 9. Telegram

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

## Quick Reference

| Platform | Image Size | Title Chars | Desc Chars | Special |
|----------|-----------|-------------|------------|---------|
| Google | N/A | 50–60 | 120–158 | Pixel-based, no image |
| Facebook | 1200×630 | 40–60 | 140–160 | Max 8 MB |
| X (Twitter) | 1200×675 | 70 | 200 | Two card types |
| LinkedIn | 1200×627 | 40–60 | 120–160 | < 401px = thumbnail |
| Slack | 1140×600 | 40–80 | 100–150 | 32 KB HTML limit |
| Discord | 1200×630 | 256 | 4096 | theme-color accent |
| WhatsApp | 1200×630 | — | — | HTTPS only, no GIF |
| iMessage | 1200×630 | — | None | No description shown |
| Telegram | 1200×630 | 1023 | 170 | Long caching |

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

Single-page app. User enters a URL, hits "Inspect", and sees a grid of 9 platform preview cards rendered with the extracted metadata.

Each card component:
1. Applies the platform's tag fallback logic (e.g., Twitter falls back from `twitter:title` → `og:title` → `<title>`)
2. Truncates text at the platform's character/pixel limits
3. Renders the card in a mock frame styled to match the platform's actual appearance
4. Shows a warning icon if required tags are missing or image doesn't meet minimum size

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
- Express server with `/api/preview` endpoint
- HTML fetcher with meta tag parser (cheerio)
- Static frontend with URL input
- Google, Facebook, X card renderers
- Dockerfile

### Phase 2: Full Platform Coverage
- LinkedIn, Slack, Discord, WhatsApp, iMessage, Telegram card renderers
- Image dimension probing (HTTP HEAD / partial download)
- Missing-tag warnings per platform

### Phase 3: Polish
- Copy-to-clipboard for individual card screenshots
- Tag completeness scorecard (% of platforms fully covered)
- Suggested fixes (e.g. "Add og:image for Facebook previews")
- Dark mode variants for platforms that support it (Discord, Slack)
