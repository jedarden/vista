# bf-4p8p — Client-Side-Only Tag Detection: E2E Test & Regression Anchor

## What this tests

`verifyClientSideTags()` in `src/public/app.js` detects meta tags that exist
**only after JavaScript executes** — i.e. tags a non-JS social crawler will
never see. It re-executes the fetched HTML inside a hidden same-origin
`<iframe>` (via `document.write`), waits for JS to run, then diffs the
post-JS DOM meta tags against `meta.rawTags` (the raw HTML a crawler gets)
using the counted-multiset diff in `src/public/client-side-diff.js`.

A tag whose key is **entirely absent** from the raw HTML (injected by JS)
becomes an `error`-severity diagnostic; a tag whose value/extra-copy-count
changed becomes a `warning`. This bead locks that behaviour down end-to-end.

## Test architecture

| Layer | File | Covers | Result |
|-------|------|--------|--------|
| Unit  | `test/unit/client-side-diff.test.js` | Pure helpers (`normalizeMetaTag`, `buildMetaMultiset`, `diffClientSideTags`) — no DOM, no network. The duplicate-counting bug fix from bf-4vcw. | **16/16 pass** |
| E2E A | `test/e2e/client-side-tags.e2e.js` Case A | Deterministic SPA fixture (inline JS injects `og:title` + `og:image`). **THE regression anchor.** Asserts `error`-severity `js-injected-tags` diagnostic, message names the tags, fix mentions static HTML / SSR / prerender, crawler-impact explained. | **pass** |
| E2E B | … Case B | Static fixture (all tags in raw `<head>`, no JS). Negative case — asserts **no** `js-injected-tags` diagnostic. | **pass** |
| E2E C | … Case C | Real public SPA URL via URL mode. **Non-fatal** — asserts ground truth, then honestly prints DETECTED / FALSE-NEGATIVE. | non-fatal (see below) |

### Run them

```bash
node test/unit/client-side-diff.test.js                       # 16 tests, <1s
node test/e2e/client-side-tags.e2e.js                          # Cases A + B (deterministic)
REAL_SPA_URL=https://www.khanacademy.org/ node test/e2e/client-side-tags.e2e.js   # + Case C probe
```

The e2e harness boots the real `src/server.js` and drives the UI with
Playwright. On this NixOS box it resolves chromium's shared libs from
`/nix/store` at runtime (the legacy extracted bundle under `~/scratch/libs`
is gone), so it is resilient to nix garbage-collection.

## The real-URL finding (read this before changing Case C)

**Against real public SPAs, the detector currently FALSE-NEGATIVES.** This is
an architectural limitation of the client-side iframe path, not a test bug,
and Case C is intentionally non-fatal so CI stays green while keeping the gap
visible.

Why: vista re-executes the foreign HTML in a **same-origin `localhost`
iframe**. Real SPAs inject their og/twitter tags from an **external JS bundle**,
and that bundle cannot load inside the localhost iframe:

- **Khan Academy** (`https://www.khanacademy.org/`) is the textbook injection
  case — the VISTA user-agent gets a 3 KB shell with **0** og/twitter tags,
  while a real browser DOM ends up with ~13. But the shell is a **bot
  challenge** (`<title>Client Challenge</title>`, `_fs-ch-` assets). Its inline
  loader does `loadScript('/_fs-ch-…/errors.js')` — a **relative URL** that
  404s against `localhost`, and its CSP `script-src 'self'` blocks loading it
  cross-origin even with a `<base href>`. The challenge never proceeds → 0
  tags injected in the iframe → no diagnostic. Confirmed empirically:
  `probe result: no js-injected-tags diagnostic`, with the `script.onerror`
  CSP error in the browser console.

- **Reddit** (`https://www.reddit.com/`) returns a 0-tag SPA shell (8 KB) to
  the VISTA UA — also a genuine injection case in a real browser. Same
  outcome: its React bundle won't hydrate in the localhost iframe → false
  negative. (Note Reddit additionally **SSR-renders** all 12 og/twitter tags
  for the `facebookexternalhit` crawler UA, so it is only an injection case
  for non-crawler UAs like vista's.)

The only real pages that *would* fire in the iframe are those that inject
tags via **inline JS embedded in the raw HTML** (no external bundle) — which
is exactly what the deterministic Case A fixture models. Such pages are rare
and unstable among major SPAs, so Case A — not a live URL — is the regression
anchor. Live SPA URLs drift (Reddit started/changed crawler SSR; Khan's
challenge rotates), so anchoring on them would make CI flaky for reasons
unrelated to the detector.

## Bugfix included in this bead (server-side, makes the detector reachable)

`src/server.js` `buildMetaPreviewResult()` (the progressive `/api/preview/meta`
response used by URL mode) had two gaps that made `verifyClientSideTags()`
silently unreachable:

1. **Missing `rawTags` and `html`** — the detector needs both (rawTags = the
   server-side tags to diff against; html = the page to re-render in the
   iframe). The full `/api/preview` endpoint carried them; the progressive
   `/meta` endpoint did not. Added.
2. **`platformScores` vs `scores` key mismatch** — the progressive endpoint
   emitted `scoring.platformScores`, but `app.js` reads `data.scoring.scores[pid]`
   in ~10 places and never reads `platformScores`. So `scoring.scores` was
   `undefined`, and the first `data.scoring.scores[pid]` access threw,
   aborting `progressiveLoad` before `verifyClientSideTags()` could run.
   Fixed to emit `scores: scoring.scores` (the shape the full endpoint and
   `scoreAll()` already use).

Verified: `grep platformScores src/public/app.js` → no reads; the e2e Cases
A/B pass against the fixed server.

## Bugfix included in this bead (app.js syntax — surfaces via the e2e harness)

The new Playwright e2e harness is the **first automated test that actually
loads `src/public/app.js` in a real browser**. It immediately exposed that
the committed `app.js` did not parse. `node --check src/public/app.js` on
`HEAD` (3b1d37f) failed:

```
/tmp/app.head.js:6478
  return `import React from 'react';
          ^^^^^^
SyntaxError: Unexpected token 'import'
```

Root cause (introduced in `7965f00 feat(bf-3x2): add Gatsby, Hugo, Jekyll …`):
`generateSvelteKitSnippet()` opened a template literal with `return \`…` and
never closed it. The `</svelte:head>\n}` that should have ended the function
was swallowed into the string, which then consumed `generateGatsbySnippet`,
`generateHugoSnippet`, and `generateJekyllSnippet` as literal text, until the
parser hit the next backtick inside Gatsby and desynced. A single unclosed
template literal breaks the **entire** module — so the whole frontend was
dead at `HEAD`, silently, because no prior test loaded `app.js` in a browser.

Fix: close the SvelteKit template literal correctly with the function's own
`<slot />\`;  }` (the `<slot />` is legitimate Svelte — a component slot),
and delete the orphaned `<slot />\`;  }` that had been stranded after
`generateJekyllSnippet`. `node --check src/public/app.js` now passes and the
e2e Cases A/B/C all run (the diagnostics panel renders, proving `app.js`
executes end-to-end). This fix is prerequisite to the client-side tag
detection being reachable in the browser at all.

## Recommended follow-up (out of scope here)

To close the real-URL false negative, the detector should diff `rawTags`
against a **server-side headless render** rather than a client iframe.
vista already has the primitive — `fetchRenderedMetaTags()` in
`src/fetcher.js` renders via Playwright and returns `rawTags` — so the path
is: server renders the URL headlessly, returns those rendered tags, and the
client (or server) diffs them against the static `rawTags`. That loads the
SPA's real bundle under its real origin and would catch Khan/Reddit-class
SPAs. Tracked separately; this bead is the test + the reachability fix.

## Regression checklist

- [x] `node test/unit/client-side-diff.test.js` → 16/16
- [x] `node test/e2e/client-side-tags.e2e.js` Case A → `error` diagnostic, actionable message
- [x] Case B → no false positive on a static page
- [x] Case C → non-fatal, prints DETECTED/FALSE-NEGATIVE honestly
- [x] `src/server.js` progressive `/meta` endpoint carries `rawTags`, `html`, `scores`
- [x] `node --check src/public/app.js` → VALID (unclosed SvelteKit template literal fixed)
