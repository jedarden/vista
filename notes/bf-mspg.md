# bf-mspg — ALERT: Agent crash on bf-5rlu (resolution: stale alert, work already done)

## What this bead is

A crash-retry alert spawned by NEEDLE when the agent working `bf-5rlu`
(`claude-code-glm-5`, assignee `claude-code-glm-5-vista-p1`) died with
**exit code -1 / signal -1** at `2026-07-20T12:59:58.201Z` — i.e. the process
was *killed* (OOM / external signal / timeout), not a normal error exit. The
bead was released for retry and this alert was created to track the failure.

## Investigation outcome: no action needed — the work completed on retry

The crash was **transient** and the bead it flagged was already retried and
completed shortly after the alert fired. This is a stale alert.

Timeline (from `br show bf-5rlu --json` + `git log`):

| Time (UTC)            | Event |
|-----------------------|-------|
| 2026-07-20 12:59:58   | agent crash (signal -1) → **bf-mspg** spawned, bf-5rlu released |
| 2026-07-20 13:34:04   | retry agent commits `f15d736` — *fix(a11y): enforce ≥44px mobile tap targets with spacing (bf-5rlu)* |
| 2026-07-20 13:58:52   | bf-5rlu **closed — Completed** (cli close) |

That is ~34 minutes from crash to commit, ~59 minutes to closure.

## Proof the work actually landed (not just closed)

`bf-5rlu` has a substantive commit — it was not a false close:

- **Commit** `f15d736` — `fix(a11y): enforce ≥44px mobile tap targets with
  spacing (bf-5rlu)` (authored 13:34:04Z, immediately precedes the 13:58:52Z
  close). The commit body maps 1:1 to bf-5rlu's acceptance criteria:
  - **+116 lines in `src/public/style.css`**, scoped to `@media (max-width:
    768px)` so desktop sizing is untouched. Selectors are type/role-based so
    they cover both static markup and JS-built widgets (toasts, context menu,
    command palette, char gauges, template cards, feedback FAB).
  - **Size floor** — `button`, `[role=button]`, `[role=tab]`, `[role=menuitem]`,
    `[role=option]`, `[role=link]`, `summary`, all form text controls and
    color/file inputs → `min-height: 44px` / 44×44 hit area; icon-only controls
    (`.theme-toggle`, `.modal-close`, `.layout-btn`, `.rating-btn`, `.copy-btn`,
    `.toast-dismiss`, etc.) → `min-width/min-height: 44px`; standalone anchors
    (`a.logo`, `.skip-link`) → `min-height: 44px`.
  - **Spacing** — `.feedback-rating` gap 8px, `.card-header-controls` wrap+4px,
    `.summary-actions` wrap, `.tabs-inner` gap 6px so no adjacent targets sit
    <4px apart.
- **Dependency** `bf-5idu` is closed, so the chain `bf-5idu → bf-5rlu` was
  resolved in order. (`bf-5rlu` in turn blocks `bf-56pp`, also closed.)
- **Independent verification** — the live codebase at HEAD still contains the
  work: 13 occurrences of `44px` in `src/public/style.css`, with the
  `@media (max-width: 768px)` tap-target block present (line ~4723). The bead's
  own `notes/bf-5rlu.md` records a full Playwright/Chromium audit at 390×844
  (iPhone-class): all 121 interactive elements ≥44×44px and no adjacent targets
  <4px apart, identical results under both `file://` and the live Express
  server.

Acceptance criteria for `bf-5rlu` (audit mobile interactive elements; fix any
tap targets <44×44px; verify spacing) are all satisfied.

## Why no code change here

The crash was a killed-process event (signal -1), not a defect in the work
product — the immediate retry produced the correct, committed result.
Re-running the work would only duplicate a committed, verified commit. The
only artifact this alert bead needs is this note (per the bead's commit
requirement).

## Lesson / pattern

This matches a known failure mode: **alert beads (crash-retry, auto-split)
fire on work that has since completed.** Before doing any work on such a bead,
verify the source bead's true state (`br show` + `git log --grep` for the bead
id) and close the alert if the work is already done. Same pattern as `bf-39ql`
(stale alert for `bf-56pp`) and `bf-2fn6` (stale alert for `bf-4p8p`).
See memory note `bead-auto-split-fires-on-complete-work`.
