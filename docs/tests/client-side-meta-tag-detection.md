# Client-Side Meta Tag Detection Test

**Test ID:** bf-4p8p
**Test Script:** `test-bf-4p8p-client-side-detection.js`
**Test Fixture:** `test-client-side-meta-tags.html`
**Status:** ✅ Verified and passing

## Overview

This test verifies that VISTA correctly detects and reports meta tags that are injected via JavaScript (client-side only), which is a critical issue for social media sharing since most crawlers do not execute JavaScript.

## Purpose

The test ensures that:

1. **Detection works:** VISTA identifies when Open Graph and Twitter Card meta tags are injected only via JavaScript
2. **Severity is correct:** The diagnostic is reported at `error` severity (not `warning` or `info`)
3. **Diagnostic code is correct:** The diagnostic uses the code `js-injected-tags`
4. **Message is actionable:** The diagnostic message clearly explains the problem and provides guidance
5. **Platforms are specified:** The diagnostic identifies which platforms are affected
6. **Fix is suggested:** The diagnostic includes actionable remediation steps

## Background

When meta tags for social media sharing (Open Graph, Twitter Card) are injected only via JavaScript:

- **Facebook crawlers** do not see the tags → No rich preview when links are shared
- **LinkedIn crawlers** do not see the tags → Poor link previews
- **X (Twitter) crawlers** do not see the tags → No card display
- **WhatsApp and others** do not see the tags → Fallback to basic title/URL only

The only social crawler that consistently executes JavaScript is Googlebot (which doesn't use Open Graph for ranking anyway).

## Test Fixture

The test fixture (`test-client-side-meta-tags.html`) is a minimal HTML page that:

1. Contains **no static meta tags** in the `<head>` section
2. Uses JavaScript to inject Open Graph tags after `DOMContentLoaded`:
   - `og:image`
   - `og:title`
   - `og:description`
   - `og:type`
   - `og:url`
3. Uses JavaScript to inject Twitter Card tags after `DOMContentLoaded`:
   - `twitter:card`
   - `twitter:title`
   - `twitter:description`
   - `twitter:image`

This simulates a common anti-pattern where developers add social meta tags dynamically rather than including them in the server-rendered HTML.

## Running the Test

### Prerequisites

- Node.js installed
- VISTA repository checked out
- Port 3001 available (or the test will auto-select an ephemeral port)

### Execution

Run from the repository root:

```bash
node test-bf-4p8p-client-side-detection.js
```

### What the Test Does

1. **Verifies test HTML** - Confirms `test-client-side-meta-tags.html` exists and contains JavaScript-injected meta tags
2. **Starts test server** - Launches an HTTP server on port 3001 (or ephemeral) to serve the fixture
3. **Starts VISTA server** - Launches a dedicated VISTA instance on port 3000 (or ephemeral) in TEST_MODE
4. **Fetches preview** - Calls VISTA's `/api/preview` endpoint with the test URL
5. **Verifies diagnostics** - Checks that the response contains the expected diagnostic

### Test Duration

The test typically completes in **10-15 seconds**:
- Server startup: ~5 seconds
- Preview fetch: ~2 seconds
- Verification: <1 second
- Cleanup: ~2 seconds

A hard timeout of **90 seconds** prevents hung tests from blocking forever.

## Expected Results

### Successful Test Output

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   VISTA Client-Side-Only Tag Detection Test (bf-4p8p)  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

ℹ Verifying test HTML file...
✓ Test HTML file verified
ℹ Starting test HTTP server (preferred port 3001)...
✓ Test server started on port 3001
ℹ Starting VISTA server on port 3000...
✓ VISTA server started and passed health check on port 3000
ℹ Fetching preview from VISTA at port 3000...
✓ Preview fetched successfully
ℹ Preview response contains diagnostics array (3 entries)
ℹ Verifying diagnostic findings...
✓ Found 1 client-side-only tag diagnostic(s)

  Diagnostic:
    Code: js-injected-tags
    Severity: error
    Message: Meta tags only appear after JavaScript executes: og:image, og:title, og:description, og:type, og:url (+4 more) — social crawlers that don't execute JS will not see these tags
    Platforms: Facebook, LinkedIn, X, WhatsApp, and most other crawlers
✓   Severity is correctly set to "error"
✓   Diagnostic code is correct: js-injected-tags
✓   Diagnostic message is actionable
✓   Platforms specified: Facebook, LinkedIn, X, WhatsApp, and most other crawlers
✓   Fix/suggestion provided
    Fix: Move critical meta tags into the static HTML in <head>, or use Server-Side Rendering (SSR) / prerendering so the tags exist in the initial HTML response

═══════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════
✓ test html created: PASS
✓ server started: PASS
✓ preview fetched: PASS
✓ diagnostic found: PASS
────────────────────────────────────────────────────────────
✓ HARNESS CHECKS PASSED (4/4)
═══════════════════════════════════════════════════════════
```

### Expected Diagnostic Structure

The test verifies that the diagnostic response includes:

```json
{
  "code": "js-injected-tags",
  "severity": "error",
  "message": "Meta tags only appear after JavaScript executes: og:image, og:title, og:description, og:type, og:url (+4 more) — social crawlers that don't execute JS will not see these tags",
  "platforms": ["Facebook", "LinkedIn", "X", "WhatsApp", "and most other crawlers"],
  "fix": "Move critical meta tags into the static HTML in <head>, or use Server-Side Rendering (SSR) / prerendering so the tags exist in the initial HTML response"
}
```

## Interpreting Failures

### Test Harness Failures

These are infrastructure-level failures that prevent the test from completing:

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| `Test HTML file does not exist` | Missing fixture file | Ensure `test-client-side-meta-tags.html` exists in repo root |
| `Port 3000 is busy` (repeated) | Port conflict | Kill process occupying port, or let test auto-select ephemeral port |
| `VISTA health check timed out` | Server failed to start | Check `src/server.js` for errors, verify dependencies installed |
| `Failed to fetch preview` | API endpoint error | Check server logs, verify `/api/preview` endpoint exists |
| `No diagnostics array in preview result` | API response malformed | Check API response format, ensure diagnostics array is returned |

### Detection Failures

These indicate that the diagnostic detection logic itself is broken:

| Symptom | Meaning | Resolution |
|---------|---------|------------|
| `Server-side rendered check did not run or did not report a client-side tag diagnostic` | VISTA failed to detect JavaScript-injected tags | Check detection logic in `src/server.js` or relevant module |
| `Expected severity "error", got "warning"` | Diagnostic severity is too low | Update diagnostic to use `error` severity |
| `Diagnostic code is incorrect` | Wrong diagnostic code used | Ensure code is `js-injected-tags` or `client-side-only-tags` |
| `Diagnostic message is not actionable enough` | Message doesn't guide users | Update message to include actionable keywords like "move", "SSR", "static" |
| `No platforms specified` | Missing platform information | Add platforms array to diagnostic |
| `No fix/suggestion provided` | Missing remediation guidance | Add fix field with clear remediation steps |

### Debugging Failed Runs

1. **Enable verbose output** - Check server logs emitted by the VISTA child process
2. **Manually test the fixture** - Open `http://localhost:3001/test-client-side-meta-tags.html` in a browser and verify:
   - DevTools Elements panel shows injected meta tags
   - View Source shows NO meta tags in the HTML
3. **Test VISTA API directly** - Use curl to call `/api/preview?url=<test-url>` and inspect JSON response
4. **Check detection logic** - Add logging to the server-side tag detection code

## CI Integration

This test can be integrated into CI pipelines:

```yaml
# Example GitHub Actions (if re-enabled) or Argo Workflow
- name: Run client-side tag detection test
  run: node test-bf-4p8p-client-side-detection.js
  timeout-minutes: 2
```

**Note:** Per project policy, this repo uses Argo Workflows in iad-ci, not GitHub Actions.

### Argo Workflow Integration

The test is designed to run in the `vista-build` WorkflowTemplate or as a standalone workflow step. It:

- Uses `TEST_MODE=true` to bypass SSRF guards for localhost URLs
- Auto-selects free ports when defaults are occupied
- Cleans up servers via `SIGTERM` and `SIGKILL` escalation
- Returns exit code 0 on success, 1 on failure
- Times out after 90 seconds to prevent hung tests

## Idempotency

The test is **fully idempotent** - it can be run multiple times with identical results:

- ✅ No persistent state created on disk
- ✅ No shared ports (auto-selects free ports)
- ✅ Servers always stopped via watchdog timers
- ✅ No race conditions between concurrent runs (different ports)

To verify idempotency:

```bash
# Run 3 times - all should pass
for i in 1 2 3; do
  echo "=== Run $i ==="
  node test-bf-4p8p-client-side-detection.js || exit 1
done
```

## Related Tests

- **Server-side tag detection:** Verifies detection of missing tags when static HTML exists
- **Tag completeness check:** Verifies all required OG/Twitter tags are present
- **Image validation:** Verifies og:image and twitter:image URLs are accessible

## References

- **Parent bead:** bf-4p8p (client-side-only tag detection implementation)
- **Prerequisite bead:** bf-1l906 (diagnostic message verification)
- **Test fixture:** `test-client-side-meta-tags.html`
- **VISTA API:** `/api/preview` endpoint
- **Detection code:** `src/server.js` (client-side tag detection logic)

## Changelog

| Date | Change |
|------|--------|
| 2026-08-15 | Test verified and passing - all harness checks pass |
| 2026-08-15 | Documentation created for regression testing |
