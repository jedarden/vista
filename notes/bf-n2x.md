# bf-n2x — Phase 3: Redirect Chain Analyzer (visual chain diagram)

**Status:** VERIFIED COMPLETE — no source changes required.
**Result:** Implementation was already complete and fully tested; this bead was
a verification + possible-completion task. All five acceptance criteria pass
both unit/integration tests and live end-to-end checks.

## Plan spec (docs/plan.md §Redirect Chain Analyzer)

Follow all HTTP redirects, display the full chain as a visual diagram
(URL → status → URL → status → final), parse meta tags at each hop, warn when a
redirect strips or changes meta tags, show platform-specific warnings
(hop-count limits, 302 vs 301 caching), and show which meta tags each platform
would see.

## Acceptance criteria — all verified

### 1. redirectChain includes per-hop HTML/meta extraction (fetcher.js)
`fetchUrl()` (manual `redirect:'manual'` loop) builds each hop with:
`url`, `statusCode`, `headers`, `html`, `metaTags` (full raw tag list),
`meta` (critical fields on 200), `metaDiff`, `metaError`, `warning`,
`redirectsTo`, `isFinal`. Helpers `extractCriticalMetaTags`,
`countMeaningfulMetaTags`, `calculateMetaDiff` are exported.

### 2. Visual chain diagram (src/public/redirect-diagram.js)
`buildRedirectChainDiagram()` renders: numbered hop badges (1, 2, 3, …) with a
"Final" tag on the last hop, down-arrow connectors between hops, color-coded
status badges (301=s301 blue, 302=s302 yellow, 307=s307 teal, 200=s200 green,
+ range fallbacks s2xx/s3xx/s4xx/s5xx/sunk), URL truncation (head+…+tail),
warnings, redirect target, meta-detail callback, and meta-diff badges. Pure
(chain, opts) → HTML string; unit-tested in Node.

### 3. Per-hop meta tag diff detection & highlighting
`calculateMetaDiff()` flags `changed`/`added`/`removed` per critical field plus
`hasImageChange` (og:image / twitter:image), `stripped` (all meaningful tags
lost vs previous hop), and `noindexRemoved` (page became indexable). Surfaced
in the diagram by `renderMetaDiffBadges()` and in per-field detail by app.js
`renderHopMeta()` / `getFieldChangeClass()` / `renderChangeIndicator()`
(changed ↴, added +, removed − arrows).

### 4. Platform-specific redirect warnings
`renderPlatformRedirectBanner()` (platform-redirect-view.js) emits a hop-count
warning when the chain meets/exceeds `COMMON_GIVEUP_LIMIT` (5 redirects) and a
301-vs-302-vs-307-vs-308 caching chip for each distinct redirect code present
(data from platform-redirect-data.js `REDIRECT_CACHING`).
`renderHopGiveupNote()` injects an in-diagram "common platform give-up point"
marker on the exact hop a standard HTTP client stops. fetcher.js also sets the
HTTP→HTTPS and "302 temporary" warnings per hop.

### 5. Per-platform meta view based on redirect behavior
`renderPlatformView()` renders one card per crawler (Facebook/Meta, X/Twitter
incl. t.co extraRedirects, LinkedIn, iMessage, Slack, Discord) using
`getPlatformLanding()` (landingIndex / reachedFinal / atLimit from each
platform's maxRedirects + extraRedirects) and `summarizeHopMeta()` to show the
title / og:image / twitter:image / tag-count the crawler would lock onto.
Each card carries a `confidence` + `source` provenance badge.

## Verification evidence

**Unit + integration tests — all green (13/13 files, rc=0):**
- `test/unit/redirect-diagram.test.js` — 38 pass
- `test/unit/platform-redirect-view.test.js` — 32 pass
- `test/unit/fetcher-meta-diff.test.js` — 22 pass (calculateMetaDiff pure fn)
- `test/unit/ssrf-guard.test.js` — 32 pass
- `test/unit/ssrf-probe-sitemap.test.js` — 8 pass
- `test/integration/redirect-chain-protection.test.js` — 15 pass
- + applySmartOrdering / client-side-diff / safe-zone / 4 e2e overlay tests

**Root-level redirect verification scripts — all green:**
- `test-redirect-chain-metadiff.js` — stubs node-fetch, replays a 4-hop chain
  through the **real** `fetchUrl`, asserts hop2 noindexRemoved+changed,
  hop3 stripped+removed, hop4 re-added. (Proves the in-loop diff wiring end to
  end, not just the pure function.)
- `test-redirect-chain-metaverify.js` — 4-hop chain, per-hop HTML/meta captured
- `test-multi-hop-redirect.js`, `test-meta-tags-redirect.js`,
  `test-redirect-chain-html.js` — per-hop field structure

**Live end-to-end smoke test (real network):**
- `fetchUrl('http://github.com')` → 301 (HTTP→HTTPS warning surfaced) →
  `https://github.com` 200, 51 metaTags captured at the final hop, `meta` set.
- The live `redirectChain` was fed to `buildRedirectChainDiagram`,
  `renderPlatformRedirectBanner`, and `renderPlatformView`; all rendered
  correctly (diagram 2 rows, banner + platform view present).

## Wiring
`renderRedirects()` in src/public/app.js:4013 composes: export buttons →
`renderPlatformRedirectBanner(chain)` → `buildRedirectChainDiagram(chain, {
renderMeta: renderHopMeta, renderHopNote: renderHopGiveupNote })` → diff legend
→ `renderPlatformView(chain)`. The redirect tab (`redirectPanel`) is populated
on both initial render (app.js:739) and re-fetch (app.js:1044).

## Dependency
Blocked-on `bf-4kts` (platform-specific redirect warnings) — **closed**.

## Conclusion
No functional gaps found. The Redirect Chain Analyzer is feature-complete,
unit-tested, integration-tested, and verified live. Bead closed.
