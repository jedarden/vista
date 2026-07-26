# bf-3jn: Empty State & First-Visit Onboarding

Verified against current source (`src/public/`) on 2026-07-26. All five
requirements are present and correct; one latent bug in the chip handler was
fixed in this pass.

## Requirements

### 1. Example URL chips — ✅
- `index.html:100-104` — three chips inside `.example-chips`:
  `github.com`, `stripe.com`, `your-site.com` (each `data-url`).
- Handler: `app.js` — `document.querySelectorAll('.chip[data-url]')` populates
  `#urlInput`, switches to URL mode, and calls `inspectUrl()`.
- CSS: `style.css` `.example-chips`, `.chip`, hidden in compact mode
  (`.hero.compact .example-chips { display: none }`).

### 2. No-meta-tags detection — ✅
- `checkForNoMetaTags(metaData)` in `app.js`, called at `app.js:798` inside
  `progressiveLoad()` after metadata arrives.
- Detects absence of OG tags (`og.title/description/image`) **and** Twitter
  Card tags (`twitter.title/description/image/card`); only when both are
  missing does it render a `.suggestion-chips` element with the message
  **"This page has no Open Graph or Twitter Card tags. Want to create them?"**
  and an "Open Templates" button.
- "Open Templates" (`data-action="open-templates"`, delegated at `app.js:339`)
  switches to the Templates tab. Picking a template runs `applyTemplate()` →
  `switchTab('editor')`, i.e. opens the **Editor with the template applied** —
  matching the plan's "opens Editor with template picker".
- `.suggestion-chips` styling: `style.css:167-174`.

### 3. First-visit toast — ✅
- `showFirstVisitToast()` in `app.js`, called at `app.js:960` after the
  progressive load fully completes.
- localStorage key **`vista-first-visit-shown`** — toast only renders when the
  key is unset, and sets it immediately (plus on dismiss / 8s auto-hide).
- Message: **"Click any card to expand. Try the Diagnostics tab for issues."**
  Dismissible via a `×` button (`aria-label="Dismiss"`).

### 4. Empty-state messaging (both modes) — ✅
- URL mode: hero `<h1>` "Paste any URL to see how it looks when shared on 31
  platforms" (`index.html:74`).
- Paste HTML mode: dedicated `#pasteMode` block with a textarea
  (`placeholder="Paste your HTML here..."`, `index.html:108-127`).

### 5. Hero → compact transition — ✅
- `style.css:137-144`: `.hero { transition: padding 0.3s }`,
  `.hero.compact { padding: 20px 24px }`, tagline + chips hidden in compact.
- `hero.classList.add('compact')` applied at multiple completion points
  (`app.js:801`, plus compare/sitemap paths). Smooth 300ms padding transition.

## Bug fixed in this pass

The example-chip click handler was previously bound with a bare `.chip`
selector, which **also matched the sitemap example chips** (class `chip`,
attribute `data-sitemap`, separate handler at `app.js:422`). Clicking a sitemap
chip therefore fired both handlers: the sitemap handler ran, then the generic
one overrode it with `switchMode('url')` + `inspectUrl(undefined)`.

Fix: scoped the URL-chip handler to `.chip[data-url]`, so the two chip families
are mutually exclusive. Verified no other elements relied on the bare selector
(the only `.chip` elements in `index.html` are the three URL chips and two
sitemap chips; JS-created suggestion chips use a different class).

## Verification

- `node --check src/public/app.js` — passes.
- Manual trace of the chip double-bind (sitemap chip no longer triggers
  `inspectUrl(undefined)`).
