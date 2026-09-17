# VISTA HTTP API Reference

Canonical reference for every HTTP endpoint VISTA serves. The UI and this
document are both consumers of the same surface, so the contract described
here is what `src/server.js` implements and what
`test/unit/http-api.test.js` enforces — run `npm test` to verify it.

For badge embedding guidance (HTML/Markdown snippets, style gallery, grade
color table), see the [Score Badge API section of the README](../README.md#score-badge-api);
the parameter and error contract is restated here.

## Conventions

### Transport and content types

- All endpoints are served from the same origin as the UI
  (`https://vista.jedarden.com` in production).
- JSON responses use `application/json; charset=utf-8`.
- Badge responses use `image/svg+xml; charset=utf-8`; screenshots are
  `image/png` (default) or `image/svg+xml`; bulk screenshots are
  `application/zip`.
- **CORS is open**: every response carries `Access-Control-Allow-Origin: *`
  (methods `GET, POST, OPTIONS`, header `Content-Type`), and any `OPTIONS`
  preflight returns `200` with no body.
- Request bodies are capped at **5 MB** for both `application/json` and
  `text/html` (the two accepted POST content types).
- JSON/text responses carry an express weak `ETag`, so clients may revalidate
  with `If-None-Match` even where no `Cache-Control` is set.

### Error shape

Errors are always JSON. The one guaranteed field is `error` (a human-readable
message); parameter-validation errors usually add a `message` with the list of
accepted values, and rate-limit rejections add `retryAfter` (seconds):

```json
{ "error": "Invalid theme", "message": "Theme must be either \"light\" or \"dark\"" }
{ "error": "Rate limit exceeded", "message": "Too many requests. Please try again later.", "retryAfter": 3600 }
```

Status codes used across the API:

| Status | Meaning |
|--------|---------|
| `400`  | Missing/invalid parameter, unsupported URL scheme, SSRF rejection, bad POST body, template path traversal |
| `404`  | Unknown template name |
| `429`  | Rate-limit bucket exhausted (see [Rate limits](#rate-limits)) |
| `500`  | HTML-parse or ZIP/render failure on the server |
| `502`  | The inspected site could not be fetched (downstream failure) |

### URL parameters and URL safety

Every endpoint that accepts a URL (`url`, `base`, `a`, `b`, purge `url`) applies the
same checks, in this order:

1. The value must parse as an absolute URL — otherwise `400 Invalid URL`.
2. The scheme must be `http` or `https` — otherwise
   `400 Only http and https URLs are supported`.

Server-side request forgery (SSRF) is then blocked in `src/ssrf-guard.js`:
hostnames are DNS-resolved and rejected if they land on loopback
(`127.0.0.0/8`, `::1`), private ranges (`10/8`, `172.16/12`, `192.168/16`),
link-local (`169.254/16`, `fe80::/10`), reserved ranges, or the literal
hostname `localhost`. The guard runs on:

- the input URL of `GET /api/sitemap` (hard `400`, prefixed
  `URL blocked by SSRF protection:`),
- every robots.txt-discovered sitemap URL (`GET /api/sitemap`, hard `400`),
- every nested sitemap URL (skipped individually; the crawl continues),
- **every page fetch** inside `fetchUrl()` — so all preview/screenshot/badge
  endpoints are covered transitively; a blocked fetch surfaces as `400` via
  the error mapper below,
- **every image URL** inside `probeImage()` — og:image/twitter:image come from
  the inspected page's HTML and are attacker-controlled. `probeImage` never
  throws on rejection; it returns `{ blocked: true, error, responseTime }`.

Error mapping for fetch-backed endpoints (`isSsrfError` in `src/server.js`):
an SSRF rejection becomes `400 { error }`; any other fetch failure becomes
`502 { error: "<context>: <message>" }`.

`GET /api/templates/:name` additionally rejects path traversal — names
containing `..`, `/`, or `\` return `400 Invalid template name`.

### Downstream fetch behavior

All page fetches go through `fetchUrl()` in `src/fetcher.js`:

- 15 s timeout per hop, up to **10 redirects** (301/302/303/307/308) followed,
- response body capped at **1 MB** of HTML,
- every redirect hop is recorded in `redirectChain` (url, statusCode, headers,
  metaTags, plus per-hop meta and meta-diff data for HTML hops),
- the final hop yields `{ html, finalUrl, redirectChain, responseHeaders, statusCode }`.

`GET /api/preview` additionally attempts a rendered-JS pass
(`fetchRenderedMetaTags`, Playwright) to detect client-side-only meta tags.
This is best-effort: if no browser is available the endpoint still succeeds
and simply omits rendered-tag diagnostics.

## Rate limits

In-memory token buckets (`src/rate-limit.js`), keyed by **client IP +
namespace + hour**. Buckets are namespaced so a costly endpoint does not
consume a cheaper one's budget. The store resets on restart, and the hour key
rolls over on the hour. The limit applies per IP; there is no auth.

| Namespace | Limit | Endpoints | Billing |
|-----------|-------|-----------|---------|
| `preview`   | 30/hr | `GET`/`POST /api/preview`, `/api/preview/meta`, `/api/preview/headers`, `/api/preview/images`; `GET /api/compare`; `/api/badge` and `/api/badge.svg` in `?url=` mode | 1 token per request |
| `screenshot`| 30/hr | `GET`/`POST /api/screenshot`; `GET /api/screenshots` | 1 token per request; **bulk ZIP: 1 token per requested platform** |
| `sitemap`   | 5/hr  | `GET /api/sitemap` | 1 token per request, regardless of how many URLs the crawl fans out to |
| —           | unlimited | `/api/snippet`, `/api/platforms`, `/api/templates`, `/api/templates/:name`, `/api/health`, `/health`, `/api/purge`, `/api/badge/preview`, badge legacy mode (`?score=&platforms=`), static assets | — |

Rejections return `429` with the shape shown above and `retryAfter: 3600`.
A rejected request consumes no token. Over-budget bulk screenshot batches are
rejected mid-check with
`"Too many screenshot requests. You can generate N screenshots in this batch."`
Success responses on the screenshot endpoints (and the badge) carry an
`X-RateLimit-Remaining` header. (On the badge the value is a static `999`
placeholder — the badge is edge-cached, so the header is informational only.)

## Caching

| Endpoint(s) | Cache-Control | Notes |
|---|---|---|
| `GET /api/preview` | `public, max-age=300, stale-while-revalidate=600` | |
| `GET /api/compare` | `public, max-age=300, stale-while-revalidate=600` | |
| `GET /api/screenshot` | `public, max-age=300, stale-while-revalidate=600` | |
| `GET /api/badge` and `/api/badge.svg` | `public, max-age=3600, stale-while-revalidate=7200` | `/api/badge.svg` is also cached at the Cloudflare edge via the default extension-based cache (the recommended embed path; verify with `cf-cache-status`). The extension-less `/api/badge` is `cf-cache-status: DYNAMIC`. See plan.md ADR-001. |
| `GET /api/preview/meta`, `/headers`, `/images` | *(none set)* | Fetched live per request; express `ETag` still allows revalidation. |
| all `POST` endpoints | *(none set)* | |
| `/api/screenshots` (ZIP) | *(none set)* | Generated per request. |

There is no in-process result cache anywhere in the server; the only
server-side memoization is a single-flight map that collapses **concurrent
identical** badge `?url=` requests into one upstream fetch while an edge MISS
is being filled (plan.md ADR-001). `POST /api/purge` exists to drop the
Cloudflare edge entries for a URL's badge.

---

## Endpoints

### Preview

#### `GET /api/preview`

Full analysis of a live URL: metadata extraction, image probing, diagnostics
(including rendered-JS comparison), scoring, auto-fixes, and header analysis.

| Param | Required | Description |
|-------|----------|-------------|
| `url` | yes | Absolute `http(s)` URL to fetch and analyze |

**200 response** (main fields):

```jsonc
{
  "url": "…requested…",
  "finalUrl": "…after redirects…",
  "statusCode": 200,
  "meta": {
    "title", "description",
    "og":   { "title", "description", "image", "url", "type", "site_name", … },
    "twitter": { "card", "title", "description", "image", "site", … },
    "jsonLd", "favicon", "themeColor", "robots",
    "rawTags": [ { "index", "name", "property", "content", "httpEquiv", "charset", "rawHtml" } ]
  },
  "imageProbe": { "url", "width", "height", "contentType", "contentLength", "responseTime", "cors", "statusCode" },
  "diagnostics": [ … ],
  "scoring": {
    "scores": { "<platform-id>": { "grade", "score", "issues": [ … ], "fixes": [ … ], "platform": { … } } },
    "overall": { "grade", "score" },
    "summary": { "passing", "warning", "failing" },
    "gradeCounts": { "A+": 0, "A": 0, "B": 0, "C": 0, "D": 0, "F": 0 },
    "platforms": [ … ]
  },
  "autoFixes": [ { "code", "message", "tag", "platforms" } ],
  "redirectChain": [ … ],
  "responseHeaders": { … },
  "headerAnalysis": { … },
  "html": "…first 500 KB of the fetched HTML…"
}
```

`html` is included (capped at 500 KB) so clients can execute the page in a
sandboxed iframe and diff the post-JS DOM against `rawTags`.

**Errors:** `400` missing/invalid url, unsupported scheme, SSRF · `429` ·
`502` fetch failure. Cached 300 s / SWR 600 s.

#### `POST /api/preview`

Analyzes provided HTML instead of fetching. Query param `base` (default
`https://example.com`) is used to resolve relative URLs.

- `Content-Type: text/html` — the raw body is the HTML, or
- `Content-Type: application/json` — `{"html": "…"}`.

Any other body shape → `400 { error: "POST body must be HTML text or JSON { html: \"...\" }" }`.
No downstream fetch occurs (except image probing of absolute image URLs). The
response is the same contract as the GET, with `statusCode` fixed at `200` and
empty `redirectChain`/`responseHeaders`. Unparseable HTML → `500`. No
`Cache-Control` is set on POST responses.

### `GET|POST /api/preview/meta`

Fast text-only subset — no image probing (scoring is computed with
`imageProbe = null`, so image-dimension findings are absent). Same parameter,
body, and error contract as `/api/preview`. Response:

```jsonc
{
  "url", "finalUrl", "statusCode",
  "meta": { "title", "description", "og": {…}, "twitter": {…}, "favicon", "themeColor", "rawTags": […] },
  "scoring": { "overall", "summary", "gradeCounts", "scores" },
  "previews": {
    "google":   { "type": "google-serp",   "title", "url", "description" },
    "twitter":  { "type": "twitter-card",  "cardType", "title", "description", "image", "domain" },
    "facebook": { "type": "opengraph-card", … },
    "linkedin": { "type": "opengraph-card", … },
    "slack":    { "type": "messaging-card", … },
    "discord":  { "type": "messaging-card", … }
  },
  "redirectChain": […],
  "html": "…capped…"
}
```

Preview titles/descriptions are truncated to each platform's display budget
(e.g. Google 60/158 chars). No `Cache-Control` is set.

### `GET|POST /api/preview/headers`

HTTP response-header analysis: categorized headers, security scoring, CORS /
server / performance assessments, plus text-level diagnostics (computed with
`imageProbe = null`; the client layers image findings in from `/images`).
Same parameter/body/error contract as `/api/preview`. Response adds:

```jsonc
{
  "url", "finalUrl", "statusCode",
  "headers": { "security": […], "cors": […], "performance": […], "server": […], "content": […], "other": […] },
  "security": { "score", "grade", "headers", "issues", "recommendations" },
  "cors": { "origin", "allowHeaders", "exposeHeaders", "credentials", "maxAge", "methods", "analysis" },
  "server": { "software", "xPoweredBy", "xGenerator", "xAspNetVersion", "xPhpVersion", "analysis" },
  "performance": { "cacheControl", "expires", "etag", "lastModified", "contentEncoding", "transferEncoding", "assessment" },
  "analysis": { … },          // full header-analyzer result (same object as headerAnalysis)
  "headerAnalysis": { … },    // alias — the key the client's redirect view reads
  "responseHeaders": { … },   // raw headers from the final hop
  "diagnostics": […], "autoFixes": […], "redirectChain": […]
}
```

The security score starts at 100 and deducts for missing/misconfigured HSTS
(−20/−10) and CSP (−15, −5); grades map A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60,
else F. On POST (no upstream headers) the analysis reflects the absence.

### `GET|POST /api/preview/images`

Image probing only — og:image, twitter:image, favicon, and any `hero.png`
references found in the HTML are probed in parallel (each probe is
independent; a failed probe is skipped, not an error). Same
parameter/body/error contract as `/api/preview`. Response:

```jsonc
{
  "url", "finalUrl", "statusCode",
  "imageProbe": { … },   // the og:image probe, cropRatios stripped (mirrors /api/preview)
  "images": {
    "og":      { "url", "width", "height", "contentType", "contentLength", "responseTime", "cors", "statusCode", "cropRatios": { … } },
    "twitter": { … }, "favicon": { … },
    "hero": [ … ], "all": [ … ]
  },
  "recommendations": [ { "platform", "cardType", "issue", "message", "recommended", "current" } ],
  "diagnostics": […], "autoFixes": […], "redirectChain": […]
}
```

`cropRatios` reports aspect ratio and whether the image will crop for
landscape 16:9, square 1:1, and portrait 4:5 card slots. `recommendations`
flags aspect-ratio and minimum-size problems (e.g. below 1200×630 for Open
Graph). This is the slow endpoint (~1–3 s when images resolve). No
`Cache-Control` is set.

### `GET /api/compare`

Fetches two URLs in parallel and returns side-by-side previews.

| Param | Required | Description |
|-------|----------|-------------|
| `a`   | yes      | First `http(s)` URL |
| `b`   | yes      | Second `http(s)` URL |

**200 response:** `{ "a": <preview or {error, url}>, "b": <preview or {error, url}> }` —
each side is a full `GET /api/preview` body, or an error object if that side
alone failed. **`502`** (`{ "error": "Failed to fetch both URLs", "urlA":
{ "error" }, "urlB": { "error" } }`) only when *both* sides fail.
**Errors:** `400` missing `a`/`b` (`Missing ?a= or ?b= parameter (both URLs
are required)`), invalid URL (`Invalid URL in ?a=` / `?b=` — names the
offending parameter), scheme, SSRF · `429` · `502`.
Cached 300 s / SWR 600 s.

### `GET /api/sitemap`

Crawl-audit of a site's sitemap: per-URL meta coverage scores.

| Param | Required | Description |
|-------|----------|-------------|
| `url` | yes | A sitemap XML URL **or** a bare site origin. If the URL does not return sitemap XML, the handler falls back to `{origin}/robots.txt` and follows its `Sitemap:` directives (RFC 9309, case-insensitive, comments stripped). Sitemap indexes are expanded into up to **10** nested sitemaps. |

**200 response:**

```jsonc
{
  "sitemapUrl": "…the sitemap actually crawled…",
  "totalFound": 250,       // URLs discovered (before the 100-URL cap)
  "crawled": 100,          // successfully scored
  "errors": 3,             // failed fetches
  "results": [ {
    "url", "finalUrl", "statusCode", "title", "description", "image",
    "scores": { "<platform-id>": { "grade", "score", … } },
    "overallGrade", "overallScore", "platformCount"
  } ],
  "hasMore": true          // totalFound > 100 — only the first 100 are crawled
}
```

The crawl is capped at the first **100 URLs**, run 5 at a time; each page
fetch gets `probeImage`d and scored. Pages that fail to fetch/score are
counted in `errors` (a number — the per-URL failure detail is not exposed in
the response). The sitemap-resolution phase (input + robots.txt + nested
sitemaps) has a 30 s abort timer.

**Errors:** `400` missing/invalid url, scheme, SSRF (input and
robots-discovered URLs are hard-rejected; blocked *nested* sitemaps are
skipped), or the descriptive `No sitemap could be found: …` message ·
`429` · `502` processing failure. One `sitemap`-bucket token per request.

### Screenshots

#### `GET /api/screenshot`

Renders one platform card for a live URL.

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | yes | — | Absolute `http(s)` URL to fetch |
| `platform` | yes | — | One of the platform ids (see `/api/platforms`) |
| `theme` | no | `dark` | `light` or `dark` |
| `scale` | no | `1x` | `1x` or `2x` |
| `format` | no | `png` | `png` (primary deliverable) or `svg` |

**200 response:** binary body with
`Content-Type: image/png` (default) or `image/svg+xml`,
`Content-Disposition: attachment; filename="<platform>-card.png|.svg"`,
`Cache-Control: public, max-age=300, stale-while-revalidate=600`, and
`X-RateLimit-Remaining`.

**Errors:** `400` invalid/missing platform, theme, scale, format, url · `429`
· `400` SSRF · `502` fetch failure. Consumes one `screenshot` token (checked
before parameter validation, so even a 400 consumes a token).

#### `POST /api/screenshot`

Renders from supplied data — no page fetch needed. JSON body:

```jsonc
{
  "platform": "twitter",        // required, valid platform id
  "url": "…",                   // either fetch+parse this URL (when meta absent) …
  "meta": { … },                // … or supply parsed metadata directly
  "imageProbe": { "width": 1200, "height": 630, … },  // optional
  "withFrame": false,
  "format": "png",              // default png; "svg" opt-in
  "theme": "dark",              // default dark
  "scale": "1x"                 // default 1x
}
```

If `url` is given and `meta` is not, the page is fetched and parsed first
(with the standard URL/scheme/SSRF checks → `400`, fetch failures → `502`).
Providing neither `url` nor `meta` → `400 { error: "Missing metadata.
Provide either meta object or url." }`. Render failure → `500`. Response
headers match the GET (attachment, content type, `X-RateLimit-Remaining`); no
`Cache-Control`.

#### `GET /api/screenshots`

Bulk ZIP of platform cards for one URL.

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | yes | — | Absolute `http(s)` URL |
| `platforms` | yes | — | Comma-separated platform ids, **max 20**, each validated up-front |
| `theme` | no | `dark` | `light` or `dark` |
| `scale` | no | `1x` | `1x` or `2x` |
| `format` | no | `png` | `png` or `svg` |

**200 response:** `Content-Type: application/zip`,
`Content-Disposition: attachment; filename="screenshots-<timestamp>.zip"`,
containing `<platform>-card.<png|svg>` per platform. If any platform failed to
render, a `manifest.json` entry is appended:
`{ url, finalUrl, theme, scale, format, requestedPlatforms, successful, failed, errors[] }`.

**Errors:** `400` missing `platforms` (message shows usage), unknown platform
in the list (names them), empty list, more than 20 · `429` — the batch check
consumes **one token per platform** and rejects up-front when the remaining
budget cannot cover the whole batch (`"You can generate N screenshots in this
batch."`). Platform-list validation happens *before* any token is spent.

### Badge

#### `GET /api/badge` and `GET /api/badge.svg`

Identical handler, two paths — prefer `/api/badge.svg` for embeds (it is
Cloudflare edge-cached by extension; see the README's Score Badge section for
embed snippets and the grade/color table).

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | one of the two modes | — | Fetch + score a live URL. Rate-limited (`preview` bucket), single-flight de-duplicated. |
| `score` + `platforms` | the other mode | — | Manual values; no network I/O, **unthrottled**. Both are required together. |
| `style` | no | `flat` | `flat`, `flat-square`, `plastic`, `for-the-badge` |
| `label` | no | `score` | `score` (renders `N/100`) or `grade` (renders the letter grade) |

**200 response:** `image/svg+xml; charset=utf-8`,
`Cache-Control: public, max-age=3600, stale-while-revalidate=7200`.
Scores outside 0–100 are clamped.

**Errors:** `400` invalid style/label, missing params (message says
`Provide ?url= OR both ?score= and ?platforms=`), invalid url/scheme, SSRF ·
`429` (url mode only) · `502` fetch failure.

#### `GET /api/badge/preview`

Returns the score plus ready-to-paste embed code for a URL.

| Param | Required | Description |
|-------|----------|-------------|
| `url` | yes | Absolute `http(s)` URL to fetch and score |

**200 response:**

```jsonc
{
  "url": "…",
  "score": 87,
  "platforms": 43,           // number of scored platforms
  "grade": "B+",
  "embedCode": "<a href=\"…/?url=…\">\n  <img src=\"…/api/badge.svg?url=…\" … />\n</a>"
}
```

`embedCode` always uses the `.svg` path (edge-cacheable) and derives its base
URL from the incoming request. **Not rate-limited**, no `Cache-Control`.
**Errors:** `400` missing/invalid url, SSRF · `502`.

### Utilities

#### `GET /api/snippet`

Generates a framework code snippet for meta tags.

| Param | Required | Description |
|-------|----------|-------------|
| `format` | yes | One of: `html`, `nextjs`, `nuxt`, `remix`, `astro`, `sveltekit`, `gatsby`, `hugo`, `jekyll` |
| `url` | no | When present, the page is fetched and its meta tags fill the snippet; when absent, an empty template is returned |

**200 response:** `{ "format", "url" (null when not provided), "meta", "snippet" }`.
Unthrottled, no `Cache-Control`. **Errors:** `400` missing/unsupported format ·
`400` url scheme · `502` fetch failure · `500` generation failure.

#### `GET /api/platforms`

Supported platform catalog (drives the UI and validates `platform` params):

```jsonc
{
  "platforms": [ { "id", "name", "category", "weight" } ],   // 43 entries
  "skeletonTypes": { "TALL": "tall", "SHORT": "short", "TEXT_ONLY": "text_only" },
  "platformSkeletonMap": { "<platform-id>": "<skeleton-type>" }
}
```

#### `GET /api/templates` and `GET /api/templates/:name`

Meta-tag starter templates.

- The list returns `{ "count", "templates": [ { "id", "icon", "title", "desc", "tags": [] } ] }`
  — one entry per `src/templates/*.json` file, summaries only.
- `:name` resolves by **file name** (without `.json`) and returns the full
  template JSON. Note the distinction: the summary `id` comes from the file's
  content and can differ from its file name (e.g. `blog-post.json` carries
  `"id": "blog"`) — to fetch, use the file name as surfaced in
  `availableTemplates`.
- **Errors:** `404` unknown name (response includes `availableTemplates`:
  every valid `:name`) · `400` names containing `..`, `/`, or `\` · `500`
  unreadable directory/file.

Unthrottled, no `Cache-Control`.

#### `POST /api/purge`

Cache invalidation for a previously analyzed URL. JSON body:
`{ "url": "…", "platforms": ["facebook", …] }` (`platforms` defaults to
`["facebook"]`).

The server purges the Cloudflare edge entries for the VISTA API URLs derived
from `url` (badge + preview endpoints; requires `CLOUDFLARE_API_TOKEN` plus
zone configuration, otherwise reported under `skipped`) and asks Facebook to
re-scrape the URL (requires `FACEBOOK_APP_TOKEN`, otherwise skipped). Any
other platform name is reported as
`"<platform>-cache (not supported server-side yet)"`.

**200 response** — always JSON, even when everything was skipped:

```jsonc
{ "url": "…", "purged": [ "cloudflare-edge-cache", "facebook-cache" ], "failed": [ { "platform", "error" } ], "skipped": [ "…" ] }
```

**Errors:** `400` missing/invalid url, scheme. Unthrottled.

#### `GET /api/health` and `GET /health`

Liveness probes. `/api/health` → `{ "status": "ok", "version": "1.0.0" }`;
`/health` → `{ "ok": true }` (minimal readiness probe). Unthrottled.

### Static assets

Everything not under `/api` is served from `src/public` (the single-page UI,
platform frame HTML, and static assets) by `express.static`.

## Testing the contract

`npm test` runs every `test/unit/*.test.js` file, including
`test/unit/http-api.test.js`, which boots the real express app on an
ephemeral port and asserts the documented contract end-to-end: parameters,
status codes, error bodies, content types, `Cache-Control`, response shapes,
rate-limit values and billing, and SSRF rejection — with the downstream fetch
layer (`fetchUrl` / `probeImage` / `fetchRenderedMetaTags`) mocked, so no test
touches the network.

Two things to know when extending that file:

- The in-memory rate-limit store lives for the whole process, and the test
  deliberately exhausts the `screenshot` bucket (30/hr) and crosses the
  `sitemap` bucket (5/hr) to prove the 429 contract. Keep those tests last
  within their namespace and stay within the `preview` budget (≤ 22 of 30
  tokens are used).
- `fetchUrl`-internal SSRF enforcement is covered behaviorally by
  `test/unit/ssrf-guard.test.js` and `test/unit/ssrf-probe-sitemap.test.js`;
  the HTTP contract file covers the sitemap route's own validation, which runs
  outside the mocked layer.
