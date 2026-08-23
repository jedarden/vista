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
GET /api/badge.svg    (recommended for embeds)
GET /api/badge        (alias, kept for embeds already in the wild)
```

Both paths serve the identical SVG from the same handler. Prefer `/api/badge.svg`
everywhere you embed a badge: because the URL path ends in `.svg`, Cloudflare's
default extension-based edge caching stores the response (respecting the
`Cache-Control: max-age=3600` the endpoint sends), so repeated views of an
embedded badge are served from the edge instead of re-fetching and re-scoring
the target site. The extension-less `/api/badge` path is not edge-cached by
default (`cf-cache-status: DYNAMIC`).

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
  <img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com" alt="VISTA Platform Score" />
</a>

<!-- Shows letter grade -->
<a href="https://vista.jedarden.com/?url=https://example.com">
  <img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com&label=grade" alt="VISTA Platform Grade" />
</a>

<!-- With specific style -->
<a href="https://vista.jedarden.com/?url=https://example.com">
  <img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com&style=flat-square&label=grade" alt="VISTA Platform Grade" />
</a>
```

#### Manual score badge (legacy)

```html
<!-- Direct score and platform values -->
<img src="https://vista.jedarden.com/api/badge.svg?score=85&platforms=25" alt="Platform Score: 85/100" />

<!-- With letter grade display -->
<img src="https://vista.jedarden.com/api/badge.svg?score=85&platforms=25&label=grade" alt="Platform Grade: B" />
```

### Badge Styles

VISTA supports 4 badge styles compatible with Shields.io:

#### 1. Flat (default)

```html
<img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com&style=flat" alt="Platform Score" />
```
![Flat style](https://vista.jedarden.com/api/badge.svg?score=85&platforms=25&style=flat)

#### 2. Flat Square

```html
<img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com&style=flat-square" alt="Platform Score" />
```
![Flat Square style](https://vista.jedarden.com/api/badge.svg?score=85&platforms=25&style=flat-square)

#### 3. Plastic

```html
<img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com&style=plastic" alt="Platform Score" />
```
![Plastic style](https://vista.jedarden.com/api/badge.svg?score=85&platforms=25&style=plastic)

#### 4. For The Badge

```html
<img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com&style=for-the-badge" alt="Platform Score" />
```
![For The Badge style](https://vista.jedarden.com/api/badge.svg?score=85&platforms=25&style=for-the-badge)

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
  <img src="https://vista.jedarden.com/api/badge.svg?url=https://example.com" alt="VISTA Platform Score" />
</a>
```

This allows users to click the badge to view the full VISTA analysis for your URL.

### Badge in Markdown

```markdown
[![VISTA Score](https://vista.jedarden.com/api/badge.svg?url=https://example.com)](https://vista.jedarden.com/?url=https://example.com)
```

### Developer Platform Context Frames

VISTA provides authentic developer platform context frames that simulate how content appears when shared on GitHub, GitLab, Stack Overflow, Hacker News, and Dev.to. These frames support both dark and light themes with platform-accurate styling.

#### Available Developer Platforms

| Platform | Frame Types | Theme Support | Location |
|----------|------------|---------------|----------|
| **GitHub** | Issue/PR discussions, README files | ✅ Dark/Light | `src/public/github-issue-frame.html`, `src/public/github-readme-frame.html` |
| **GitLab** | Merge requests, Issues | ✅ Dark/Light | `src/public/gitlab-mr-frame.html`, `src/public/gitlab-issue-frame.html` |
| **Stack Overflow** | Q&A pages with voting | ✅ Dark/Light | `src/public/stackoverflow-dark.html`, `src/public/stackoverflow-light.html` |
| **Hacker News** | Comment threads | ✅ Dark/Light | `src/public/hackernews-dark.html`, `src/public/hackernews-light.html` |
| **Dev.to** | Article comments | ✅ Dark/Light | `src/public/devto-dark.html`, `src/public/devto-light.html` |

#### Platform Features

**GitHub Context Frames**
- Authentic GitHub design patterns (issue/PR layout, README formatting)
- Code blocks with syntax highlighting
- User avatars, reactions, and comment threads
- Status badges (Open/Closed, Merged)
- Dark theme: `#0d1117` background, `#c9d1d9` text, `#58a6ff` accents
- Light theme: `#ffffff` background, `#24292f` text, `#0969da` accents

**GitLab Context Frames**
- GitLab merge request and issue UI patterns
- Purple accent color scheme (`#7b5cfd`)
- Code diff styling and participant avatars
- Discussion threads with reactions
- Dark theme: `#1f1e24` background, `#ebebeb` text
- Light theme: `#ffffff` background, `#333238` text

**Stack Overflow Context Frames**
- Authentic Q&A layout with voting system
- Tag-based categorization
- Answer acceptance checkmarks
- Code blocks with syntax highlighting
- Dark theme: `#1e1e1e` background, `#d4d4d4` text, `#4db2ff` accents
- Light theme: `#ffffff` background, `#232629` text, `#39739d` accents

**Hacker News Context Frames**
- Minimalist comment thread design
- Upvote voting system
- Domain display and point counts
- Nested comment structure
- Orange accent color (`#f48024`)
- Dark/Light theme support

**Dev.to Context Frames**
- Article header with author metadata
- Tag system and reaction counts
- Follow buttons and comment sections
- Dark/Light theme support
- Purple accent colors

#### Theme Switching

All developer platform frames support comprehensive theme switching:

- **Cross-platform synchronization**: Theme changes propagate across all frames
- **Platform-authentic colors**: Each platform uses its official color scheme
- **Proper contrast ratios**: WCAG AA compliant in both themes
- **Smooth transitions**: 0.3s transition animations for theme changes
- **Code syntax highlighting**: Adjusted colors for both dark and light backgrounds

#### Technical Implementation

**CSS Architecture**
```css
/* Platform-specific color schemes */
.github-context { --gh-bg: #0d1117; --gh-text: #c9d1d9; --gh-accent: #58a6ff; }
.gitlab-context { --gl-bg: #1f1e24; --gl-text: #ebebeb; --gl-accent: #7b5cfd; }
.stackoverflow-context { --so-bg: #1e1e1e; --so-text: #d4d4d4; --so-accent: #4db2ff; }
```

**Theme Toggle System**
```html
<html data-theme="dark|light">
<button onclick="toggleTheme()">☀️ Light Mode</button>
```

**Frame Structure**
- Semantic HTML matching platform patterns
- Responsive design for mobile devices
- Accessible contrast ratios
- Platform-specific UI elements

#### Usage Examples

**Individual Frame Testing**
```bash
# Test GitHub frames
open src/public/test-github-platform-frames.html

# Test GitLab frames  
open src/public/test-gitlab-platform-frames.html

# Test all developer platforms
open src/public/test-developer-platforms-frame.html
```

**Embedding Frames**
```html
<!-- GitHub Issue Frame -->
<iframe src="src/public/github-issue-frame.html" 
        title="GitHub Context" 
        data-theme="dark">
</iframe>

<!-- Stack Overflow Frame -->
<iframe src="src/public/stackoverflow-dark.html"
        title="Stack Overflow Context">
</iframe>
```

#### Verification and Testing

Comprehensive testing framework includes:

- **Visual verification**: Side-by-side dark/light theme comparison
- **Automated checks**: Frame loading detection and theme attribute verification
- **Platform authenticity**: Color scheme validation against official platforms
- **Accessibility testing**: Contrast ratio verification
- **Cross-browser testing**: Chrome, Firefox, Safari compatibility

**Test Coverage**: ✅ All 5 developer platforms verified with comprehensive theme switching tests

See `theme-switching-verification-report.md` for detailed test results and verification data.

#### Implementation Notes

- All frames use semantic HTML matching platform patterns
- Code blocks include syntax highlighting with proper colors for both themes
- Link cards and embedded content are styled to match each platform's design
- Interactive elements (buttons, links) maintain platform-authentic behavior
- Frames are fully responsive and work on mobile devices
- Each platform maintains its unique design language while supporting theme switching

## License

MIT
