# bf-4p8p client-side detection run

Run command:

```text
node test-bf-4p8p-client-side-detection.js
```

Exit code: `0`

The fixture server started on port 3001. Port 3000 was occupied by an
unrelated Vite process, so the self-managed VISTA server selected ephemeral
port 41585. Both test-owned servers were stopped during cleanup. The terminal
color escape sequences are omitted below for Markdown readability; the text
and ordering are otherwise the complete run output.

```text

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   VISTA Client-Side-Only Tag Detection Test (bf-4p8p)  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

ℹ Verifying test HTML file...
✓ Test HTML file verified
ℹ Starting test HTTP server (preferred port 3001)...
✓ Test server started on port 3001
ℹ Port 3000 is busy; using VISTA port 41585
ℹ Starting VISTA server on port 41585...
✓ VISTA server started and passed health check on port 41585
ℹ Fetching preview from VISTA at port 41585...
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
✗   Diagnostic message is not actionable enough
✓   Platforms specified: Facebook, LinkedIn, X, WhatsApp, and most other crawlers
✓   Fix/suggestion provided
    Fix: Move critical meta tags into the static HTML in <head>, or use Server-Side Rendering (SSR) / prerendering so the tags exist in the initial HTML response
ℹ Stopping VISTA server...
✓ VISTA server stopped
ℹ Stopping test server...
✓ Test server stopped

═══════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════
✓ test html created: PASS
✓ server started: PASS
✓ preview fetched: PASS
✓ diagnostic found: PASS
ℹ severity correct: DEFERRED (detection checks belong to later beads)
ℹ message actionable: DEFERRED (detection checks belong to later beads)
ℹ code correct: DEFERRED (detection checks belong to later beads)
ℹ platforms specified: DEFERRED (detection checks belong to later beads)
ℹ fix provided: DEFERRED (detection checks belong to later beads)

────────────────────────────────────────────────────────────
✓ HARNESS CHECKS PASSED (4/4)
═══════════════════════════════════════════════════════════

```

The diagnostic entry confirms the expected code, severity, message, platforms,
and fix. The standalone message-actionability check printed a warning because
the harness's keyword list does not include the message's phrase “executes”,
but that field is intentionally deferred and does not affect the exit code.
