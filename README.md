# VISTA

**V**isual **I**nspector of **S**ocial **T**ags & **A**ttributes

A lightweight web tool that previews how any URL will appear when shared across platforms — Google Search, Facebook, X (Twitter), Slack, WhatsApp, LinkedIn, and Discord.

## How it works

1. Enter a URL
2. VISTA fetches the page and extracts metadata (`<title>`, `meta description`, Open Graph, Twitter Cards, JSON-LD)
3. See side-by-side mock previews styled to match each platform's card layout

## Architecture

- **Frontend**: Static HTML/CSS/JS — renders platform-accurate preview cards
- **Backend**: Node.js/Express — proxies URL fetches (bypasses CORS) and extracts meta tags

## Score Badge API

VISTA provides an embeddable SVG badge API for displaying platform scores on your website, README, or documentation.

### Endpoint

```
GET /api/badge
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | No* | URL to score (fetches and scores dynamically with 1-hour cache) |
| `score` | integer | No* | Manual score (0-100) - required if `url` not provided |
| `platforms` | integer | No* | Manual platform count - required if `url` not provided |
| `style` | string | No | Badge style: `flat`, `flat-square`, `plastic`, or `for-the-badge` (default: `flat`) |
| `label` | string | No | Label mode: `score` (shows N/100) or `grade` (shows A+/A/B/C/D/F) (default: `score`) |

*Either `url` OR both `score` and `platforms` must be provided.

### Usage Examples

#### Dynamic URL-based badge (recommended)

```html
<!-- Shows numeric score -->
<a href="https://vista.jedarden.com/?url=https://example.com">
  <img src="https://vista.jedarden.com/api/badge?url=https://example.com" alt="VISTA Platform Score" />
</a>

<!-- Shows letter grade -->
<a href="https://vista.jedarden.com/?url=https://example.com">
  <img src="https://vista.jedarden.com/api/badge?url=https://example.com&label=grade" alt="VISTA Platform Grade" />
</a>

<!-- With specific style -->
<a href="https://vista.jedarden.com/?url=https://example.com">
  <img src="https://vista.jedarden.com/api/badge?url=https://example.com&style=flat-square&label=grade" alt="VISTA Platform Grade" />
</a>
```

#### Manual score badge (legacy)

```html
<!-- Direct score and platform values -->
<img src="https://vista.jedarden.com/api/badge?score=85&platforms=25" alt="Platform Score: 85/100" />

<!-- With letter grade display -->
<img src="https://vista.jedarden.com/api/badge?score=85&platforms=25&label=grade" alt="Platform Grade: B" />
```

### Badge Styles

VISTA supports 4 badge styles compatible with Shields.io:

#### 1. Flat (default)

```html
<img src="https://vista.jedarden.com/api/badge?url=https://example.com&style=flat" alt="Platform Score" />
```
![Flat style](https://vista.jedarden.com/api/badge?score=85&platforms=25&style=flat)

#### 2. Flat Square

```html
<img src="https://vista.jedarden.com/api/badge?url=https://example.com&style=flat-square" alt="Platform Score" />
```
![Flat Square style](https://vista.jedarden.com/api/badge?score=85&platforms=25&style=flat-square)

#### 3. Plastic

```html
<img src="https://vista.jedarden.com/api/badge?url=https://example.com&style=plastic" alt="Platform Score" />
```
![Plastic style](https://vista.jedarden.com/api/badge?score=85&platforms=25&style=plastic)

#### 4. For The Badge

```html
<img src="https://vista.jedarden.com/api/badge?url=https://example.com&style=for-the-badge" alt="Platform Score" />
```
![For The Badge style](https://vista.jedarden.com/api/badge?score=85&platforms=25&style=for-the-badge)

### Grade Colors

Badges use semantic colors based on score/grade:

| Grade | Score Range | Color | Hex |
|-------|-------------|-------|-----|
| A+ | 97-100 | Bright green | `#4c1` |
| A | 93-96 | Bright green | `#4c1` |
| A- | 90-92 | Bright green | `#4c1` |
| B+ | 87-89 | Green | `#97ca00` |
| B | 83-86 | Green | `#97ca00` |
| B- | 80-82 | Green | `#97ca00` |
| C+ | 77-79 | Yellow | `#dfb317` |
| C | 73-76 | Yellow | `#dfb317` |
| C- | 70-72 | Yellow | `#dfb317` |
| D+ | 67-69 | Orange | `#fe7d37` |
| D | 63-66 | Orange | `#fe7d37` |
| D- | 60-62 | Orange | `#fe7d37` |
| F | 0-59 | Red | `#e05d44` |

### Caching

URL-based badges are cached for 1 hour on the server. Subsequent requests for the same URL will return cached results, improving performance and reducing load on target servers.

- **Cache TTL**: 1 hour (3600 seconds)
- **Cache headers**: `Cache-Control: public, max-age=3600, immutable`
- **Cache size**: Up to 1000 URLs (LRU eviction)

### Response Format

**Content-Type**: `image/svg+xml; charset=utf-8`

The badge is returned as an inline SVG image that can be embedded directly in HTML, Markdown, or any format that supports images.

### Clickable Badges

Make badges clickable by wrapping them in an anchor tag:

```html
<a href="https://vista.jedarden.com/?url=https://example.com">
  <img src="https://vista.jedarden.com/api/badge?url=https://example.com" alt="VISTA Platform Score" />
</a>
```

This allows users to click the badge to view the full VISTA analysis for your URL.

### Badge in Markdown

```markdown
[![VISTA Score](https://vista.jedarden.com/api/badge?url=https://example.com)](https://vista.jedarden.com/?url=https://example.com)
```

### Development

Coming soon.

## License

MIT
