# redirectChain Implementation Documentation

## Overview

The `redirectChain` implementation in `src/fetcher.js` is **already fully functional** and captures both HTML content and meta tags for each redirect hop. The implementation is more sophisticated than initially assumed.

## Current Structure

### Per-Hop Data Captured

Each entry in the `redirectChain` array contains:

```javascript
{
  url: string,           // Current URL being fetched
  statusCode: number,    // HTTP status (301, 302, 200, etc.)
  headers: object,       // Response headers as key-value pairs
  redirectsTo?: string,  // For redirect hops, the next URL
  isFinal?: true,        // True for the final hop in the chain
  warning?: string,      // Warnings about redirects (HTTP→HTTPS, 302, deep chains)
  
  // Meta tags (if HTML response with 200 status)
  meta?: {
    title: string | null,
    description: string | null,
    ogTitle: string | null,
    ogDescription: string | null,
    ogImage: string | null,
    ogType: string | null,
    ogUrl: string | null,
    twitterCard: string | null,
    twitterTitle: string | null,
    twitterDescription: string | null,
    twitterImage: string | null,
    canonical: string | null,
  },
  
  // Diff from previous hop's meta tags
  metaDiff?: {
    changed: Array<{field, from, to}>,
    added: Array<{field, value}>,
    removed: Array<{field, value}>,
    hasImageChange?: boolean,  // True if ogImage or twitterImage changed
  },
  
  metaError?: string,   // Error message if meta parsing failed
}
```

### Redirect Handler

**Function:** `fetchUrl(url)` (lines 19-138)

The redirect loop:
1. Uses `redirect: 'manual'` to handle redirects manually
2. Follows up to `MAX_REDIRECTS` (10) hops
3. For each hop:
   - Captures URL, status, headers
   - Reads HTML body if `content-type` includes `text/html` and status is 200
   - Parses meta tags from HTML
   - Calculates diff from previous hop
   - Checks for redirect patterns (HTTP→HTTPS upgrades, 302 temps, deep chains)

### HTML Capture Locations

**Already implemented in two places:**

1. **Redirect hops with HTML (lines 54-70):**
   ```javascript
   if (isHtml && response.status === 200) {
     const buffer = await readBodyLimited(response, MAX_BODY_BYTES);
     hopHtml = buffer.toString('utf8');
     hopMeta = parseMetaTags(hopHtml, currentUrl);
     hop.meta = extractCriticalMetaTags(hopMeta);
   }
   ```

2. **Final response (lines 111-117):**
   ```javascript
   // Use already-read body if available, otherwise read now
   let html;
   if (hopHtml !== null) {
     html = hopHtml;
   } else {
     const buffer = await readBodyLimited(response, MAX_BODY_BYTES);
     html = buffer.toString('utf8');
   }
   ```

**Key function:** `readBodyLimited(response, maxBytes)` (lines 204-213)
- Reads body up to `MAX_BODY_BYTES` (1 MB)
- Returns Buffer for UTF-8 conversion

### Meta Tag Parsing

**Function:** `parseMetaTags(html, baseUrl)` (lines 219-316)

**Captures:**
- `<title>` text content
- `<meta name="description">`
- `<meta name="robots">`
- `<meta name="theme-color">`
- Favicon (from `<link rel="icon">` or `<link rel="shortcut icon">`)
- **Open Graph tags:** `og:title`, `og:description`, `og:image`, `og:type`, `og:url`, etc.
- **Twitter Card tags:** `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **JSON-LD structured data:** All `<script type="application/ld+json">` blocks
- **Raw meta tag list:** Full diagnostic dump with raw HTML for each tag

**Special handling:**
- Resolves relative URLs to absolute (og:image, twitter:image, favicon)
- Stores duplicate OG tags in `_all_{key}` arrays
- Tracks last `twitter:image` (X uses the last one)
- Stores raw HTML for comparison with rendered DOM

### Critical Meta Extraction

**Function:** `extractCriticalMetaTags(meta)` (lines 144-159)

Reduces full meta object to **12 critical fields** for diff analysis:
- title, description
- ogTitle, ogDescription, ogImage, ogType, ogUrl
- twitterCard, twitterTitle, twitterDescription, twitterImage
- canonical

### Meta Diff Calculation

**Function:** `calculateMetaDiff(prevMeta, currentMeta)` (lines 165-199)

Computes three arrays:
- `changed`: Fields that exist in both but have different values
- `added`: Fields new in current hop
- `removed`: Fields that existed in previous hop but are now missing

**Special flag:** `hasImageChange` is set to `true` if ogImage or twitterImage changed.

### Rendered Meta Tags

**Function:** `fetchRenderedMetaTags(url, options)` (lines 395-492)

Uses **Playwright** to:
1. Launch headless Chromium
2. Navigate to URL with `domcontentloaded` wait
3. Wait additional 1 second for dynamic content
4. Extract meta tags from rendered DOM (after JS execution)

Returns same structure as `parseMetaTags()` for comparison.

**Purpose:** Detect client-side meta tag injection (e.g., SPAs that set OG tags via JavaScript).

## Hooks Already Present

The implementation already has hooks for:

1. **HTML capture:** Lines 54-70 (redirects) and 111-117 (final)
2. **Meta parsing:** Line 58 calls `parseMetaTags()`
3. **Meta extraction:** Line 59 calls `extractCriticalMetaTags()`
4. **Meta diffing:** Lines 63 and 124 call `calculateMetaDiff()`
5. **Error handling:** Lines 66-69 capture parse errors without breaking the chain

### Inline Hook Point Comments in Code

The code has explicit "HOOK POINT" comments marking extension opportunities:

- **Line 56:** `// HOOK POINT: HTML capture for redirect hop`
- **Line 60:** `// HOOK POINT: Meta tag parsing for redirect hop`
- **Line 63:** `// HOOK POINT: Critical meta extraction for diff`
- **Line 68:** `// HOOK POINT: Meta diff calculation`
- **Line 117:** `// HOOK POINT: Final HTML capture (if not already read for meta parsing above)`
- **Line 128:** `// HOOK POINT: Final meta tag parsing (for hops that weren't redirects)`
- **Line 131:** `// HOOK POINT: Meta diff calculation (final hop vs previous hop)`
- **Line 137:** `// HOOK POINT: Post-processing of complete redirect chain`

These comments serve as clear markers for where custom logic could be injected without disrupting the existing flow.

## Potential Enhancements (Not Currently Implemented)

While the core redirectChain functionality is complete, potential enhancements include:

1. **Screenshot capture per hop** - Add visual diff analysis with headless browser screenshots
2. **Timing metrics per hop** - Track DNS resolution, TCP connection, TTFB, download time
3. **Response size tracking** - Capture actual bytes read vs. Content-Length header
4. **Security headers analysis** - Parse CSP, HSTS, X-Frame-Options, X-Content-Type-Options
5. **Resource discovery** - Extract links, scripts, stylesheets per hop for dependency analysis
6. **Rendered vs. source meta comparison** - Use `fetchRenderedMetaTags()` to detect client-side meta injection
7. **Body hash per hop** - SHA-256 hash of HTML body for content integrity checking
8. **Redirect loop detection** - Detect circular redirect patterns before hitting MAX_REDIRECTS
9. **Certificate information** - Capture TLS certificate details for HTTPS hops
10. **DNS resolution tracking** - Record DNS queries and resolution per hop

### Implementation Priority

If adding these enhancements, recommended order:
1. **Timing metrics** - Low overhead, high value for performance analysis
2. **Rendered vs. source meta** - Already have `fetchRenderedMetaTags()`, just need to call it
3. **Screenshot capture** - High value for debugging, but requires headless browser overhead
4. **Security headers** - Simple parsing, valuable for security analysis
5. **Resource discovery** - More complex, but valuable for SEO and dependency analysis

## Example Chain Structure

```javascript
[
  {
    url: 'https://example.com/short',
    statusCode: 301,
    headers: { /* ... */ },
    redirectsTo: 'https://example.com/full',
    warning: '301 (permanent) redirect — platforms may cache the redirect URL'
  },
  {
    url: 'https://example.com/full',
    statusCode: 200,
    headers: { /* ... */ },
    isFinal: true,
    meta: {
      title: 'Example Page',
      description: 'A great example',
      ogImage: 'https://example.com/image.jpg',
      // ...
    }
  }
]
```

## Related Functions

- `resolveUrl(href, baseUrl)`: Resolves relative URLs to absolute
- `probeImage(imageUrl)`: Probes image dimensions via HEAD + partial GET
- `fetchRenderedMetaTags(url)`: Gets meta tags after JS execution

## Architectural Decisions

### Manual Redirect Handling
The code uses `redirect: 'manual'` instead of letting node-fetch auto-follow redirects. This is crucial because:
- Allows capturing data for each intermediate hop
- Enables meta tag diff analysis across the chain
- Provides visibility into redirect patterns (HTTP→HTTPS, 302 vs 301, etc.)
- Prevents opaque redirect chains that hide intermediate URLs

### Body Size Limiting
`MAX_BODY_BYTES` (1 MB) prevents memory issues when:
- Fetching large HTML pages
- Following long redirect chains
- Processing many requests in parallel

### Meta Tag Extraction Strategy
Two-level meta tag extraction:
1. **Full parsing:** `parseMetaTags()` captures everything (raw tags, JSON-LD, duplicates)
2. **Critical reduction:** `extractCriticalMetaTags()` reduces to 12 fields for diffing

This separation allows:
- Comprehensive diagnostics when needed (raw tags, duplicates)
- Efficient comparison for common use cases (12 critical fields)
- Future extensibility (add more critical fields without changing diff logic)

### Error Resilience
Meta parsing failures don't break the chain:
- `metaError` field captures parse errors
- Chain continues even if HTML parsing fails
- Final result still includes URL and headers

### Memory Efficiency
The code reuses HTML content:
- `hopHtml` variable stores HTML read for meta parsing
- Final hop checks `hopHtml !== null` before re-reading
- Prevents duplicate body reads for the same response

## Conclusion

**No additional implementation needed.** The redirectChain already captures HTML and meta tags per hop, calculates diffs, and even supports rendered DOM comparison. The code is production-ready for meta tag diff analysis across redirect chains.
