# bf-2fn6 — ALERT: Agent crash on bf-4p8p (resolution: stale alert, work already done)

## What this bead is

A crash-retry alert spawned by NEEDLE when the agent working `bf-4p8p`
(`claude-code-glm-5-vista-p1`) died with **exit code -1 / signal -1** at
`2026-07-20T03:21:10Z` — i.e. the process was *killed* (OOM / external signal /
timeout), not a normal error exit. The bead was released for retry and this
alert was created to track the failure.

## Investigation outcome: no action needed — the work completed on retry

The crash was **transient** and the bead it flagged was already retried and
completed shortly after the alert fired. This is a stale alert.

Timeline (from `br log bf-4p8p` + `issues` table):

| Time (UTC)            | Event |
|-----------------------|-------|
| 2026-07-20 03:21:10   | agent crash (signal -1) → **bf-2fn6** spawned, bf-4p8p released |
| 2026-07-20 03:31:11   | retry claim — kept succeeding through 03:55:49 |
| 2026-07-20 04:03:59   | bf-4p8p **closed — Completed** (cli close) |

That is ~42 minutes from crash to completion.

## Proof the work actually landed (not just closed)

`bf-4p8p` has a substantive commit and a full verification note — it was not a
false close:

- **Commit** `492c235` — `test(diagnostics): client-side tag detection e2e +
  reachability fixes (bf-4p8p)` (authored 04:03:46Z, matches the close time).
  Changes: `notes/bf-4p8p.md`, `src/public/app.js`, plus the described
  `server.js` progressive-`/meta` endpoint fix and the new
  `test/unit/client-side-diff.test.js` (16 tests) + Playwright
  `test/e2e/client-side-tags.e2e.js`.
- **Verification note** `notes/bf-4p8p.md` (145 lines) — documents the test
  architecture (unit + e2e Cases A/B/C), the real-URL false-negative finding
  for Khan/Reddit-class SPAs, and two reachability bugfixes
  (`rawTags`/`html`/`scores` on the progressive endpoint; the unclosed
  SvelteKit template literal in `app.js` that made `HEAD` fail `node --check`).

Acceptance criteria for `bf-4p8p` are all satisfied and recorded in that note.

## Why no code change here

The crash was a killed-process event (signal -1), not a defect in the work
product — the immediate retry produced the correct, tested result. Re-running
the work would only duplicate a committed, verified commit. The only artifact
this alert bead needs is this note (per the bead's commit requirement).

## Lesson / pattern

This matches a known failure mode: **alert beads (crash-retry, auto-split)
fire on work that has since completed.** Before doing any work on such a bead,
verify the source bead's true state (`br show` + `br log` + a `git log --grep`
for the bead id) and close the alert if the work is already done. See memory
note `bead-auto-split-fires-on-complete-work`.
