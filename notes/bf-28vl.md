# bf-28vl — Verify redirectChain per-hop meta tag extraction

## Outcome

**VERIFIED.** All acceptance criteria pass. The implementation in
`src/fetcher.js` (`fetchUrl`) already captures HTML and parsed meta tags at
every redirect hop; this bead confirms it with a new deterministic test plus
the existing live-network tests.

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `fetchUrl` captures response HTML at each redirect hop | ✅ |
| 2 | Meta tags parsed and stored in the `redirectChain` array | ✅ |
| 3 | Hop structure includes `url, status, headers, html, metaTags` | ✅ |
| 4 | Verified by logging `redirectChain` after a 3-4 hop redirect | ✅ |

### Note on the "status" field

Criterion 3 says `status`. The canonical `RedirectHop` contract
(`src/types/compare.ts:91`) and all 50+ consumers use **`statusCode`**. The
implementation stores the HTTP status under `hop.statusCode`; renaming it
would break the type contract and every downstream consumer, so this is
treated as the "status" field. The new test asserts `statusCode` explicitly.

## Where the work lives in `src/fetcher.js`

- HTML + meta capture in the redirect loop: lines 85-122 (primary hook reads
  the body once via `readBodyLimited`, parses `parseMetaTags`, stores
  `hop.html` and `hop.metaTags`).
- Redirect hops store HTML at line 172 (`hop.html = hopHtml`) before pushing.
- Final hop stores HTML at line 185 and back-fills meta at lines 203-225.
- `metaTags` is guaranteed to be an array on every hop (lines 117, 121, 224).

## Tests run (all green)

```
node test-redirect-chain-metaverify.js   # NEW — deterministic, 57/57 checks
node test-redirect-chain-html.js          # live — html field on all hops
node test-meta-tags-redirect.js           # live — meta parsing, 6/6
node test-multi-hop-redirect.js           # live — multi-hop structure
```

## What this bead adds

`test-redirect-chain-metaverify.js` — a self-contained, deterministic test
that stubs `node-fetch` to replay a fixed 4-hop chain
(`301 → 302 → 301 → 200`, including an HTTP→HTTPS upgrade) with known HTML
and distinct meta tags at every hop. It then **logs the full redirectChain**
and asserts the required fields (`url, statusCode, headers, html, metaTags`)
exist on every hop, plus per-hop meta-tag extraction (name/content and
property/content pairs), absolute URL resolution for `og:image`, and the
`isFinal` flag on the terminal 200 hop.

The sibling live tests depend on the exact redirect behaviour of github.com /
example.com, which can drift; this one is stable and reproducible offline
(it needs DNS only for the SSRF guard's `example.com` lookup — no real HTTP).

## Files

- **added:** `test-redirect-chain-metaverify.js` — deterministic 4-hop verification
- **unchanged:** `src/fetcher.js` (implementation was already correct; no changes needed)
