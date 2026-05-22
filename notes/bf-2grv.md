# Bead bf-2grv: og:url Missing Protocol Detection

## Status: Already Implemented

This bead requested adding detection for `og:url` values missing the protocol (e.g., `og:url="example.com"` without `https://`).

## Finding

The check was already implemented in commit `a3309c8` on 2026-05-04, before the bead was created on 2026-05-18.

### Implementation Details

**File:** `src/diagnostics.js` (lines 201-210)

```javascript
// ── Missing protocol in og:url ──
if (meta.og.url && !meta.og.url.match(/^https?:\/\//i)) {
  findings.push({
    severity: 'warning',
    code: 'og-url-missing-protocol',
    message: `\`og:url\` is missing the protocol ("${meta.og.url}") — use a full absolute URL`,
    fix: `Change to: https://${meta.og.url}`,
    platforms: 'All platforms',
  });
}
```

**Fix Simulation:** `src/public/scoring-simulator.js` (lines 391-397)

```javascript
'og-url-missing-protocol': (meta, imageProbe) => {
  const newMeta = JSON.parse(JSON.stringify(meta));
  if (newMeta.og?.url) {
    newMeta.og.url = 'https://' + newMeta.og.url;
  }
  return { meta: newMeta, imageProbe };
},
```

### Verification

Tested with `og:url="example.com"`:
- Detection: ✓ Working
- Severity: warning
- Message: `` `og:url` is missing the protocol ("example.com") — use a full absolute URL ``
- Fix suggestion: `Change to: https://example.com`

## Timeline

- 2026-05-04: Check implemented in commit `a3309c8` (feat: implement quantified impact predictions for diagnostic fixes)
- 2026-05-18: Bead created (noting "not currently checked" — incorrect)
- 2026-05-22: Verification confirms check is working
