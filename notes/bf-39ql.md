# bf-39ql — ALERT: Agent crash on bf-56pp (resolution: stale alert, work already done)

## What this bead is

A crash-retry alert spawned by NEEDLE when the agent working `bf-56pp`
(`claude-code-glm-5`, assignee `claude-code-glm-5-vista-p1`) died with
**exit code -1 / signal -1** at `2026-07-20T10:28:27.524Z` — i.e. the process
was *killed* (OOM / external signal / timeout), not a normal error exit. The
bead was released for retry and this alert was created to track the failure.

## Investigation outcome: no action needed — the work completed on retry

The crash was **transient** and the bead it flagged was already retried and
completed shortly after the alert fired. This is a stale alert.

Timeline (from `br show bf-56pp --json` + `git log`):

| Time (UTC)            | Event |
|-----------------------|-------|
| 2026-07-20 10:28:27   | agent crash (signal -1) → **bf-39ql** spawned, bf-56pp released |
| 2026-07-20 11:47:32   | retry agent commits `eee8c79` — *fix(a11y): label icon-only buttons, add roles, ensure focus rings (bf-56pp)* |
| 2026-07-20 11:48:38   | bf-56pp **closed — Completed** (cli close) |

That is ~80 minutes from crash to completion.

## Proof the work actually landed (not just closed)

`bf-56pp` has a substantive commit — it was not a false close:

- **Commit** `eee8c79` — `fix(a11y): label icon-only buttons, add roles,
  ensure focus rings (bf-56pp)` (authored 11:47:32Z, immediately precedes the
  11:48:38Z close). The commit body maps 1:1 to bf-56pp's acceptance criteria:
  - **Icon-only / custom controls labeled & roled** — platform-card icon
    buttons (theme-toggle, screenshot, context-toggle) get `aria-label`; card
    containers become `role="group"`; group headers become `role="button"` with
    `tabindex` + `aria-expanded`; card context menu gets `role="menu"` /
    `role="menuitem"` / `role="separator"` with full arrow/Home/End/Enter/Space/
    Escape keyboard nav + focus restoration; command palette gets
    `role="dialog"`/`aria-modal`, combobox semantics, and `role="option"` with
    `aria-selected`; char-gauge + template-card toggles get `role="button"`/
    `tabindex` + `aria-label`; a global Enter/Space listener activates
    div/span `role="button"` widgets; favorites/hidden remove buttons,
    copy-btn, cropper toggles, and the dynamically-built QR modal all labeled.
  - **Focus rings** — the global `:focus-visible` ring was being overridden by
    per-control `outline:none` base rules (equal specificity, later source
    order); re-declared `:focus-visible` outlines at (0,2,0) specificity across
    every input/select/textarea/editor/heatmap/feedback control so keyboard
    users always see a high-contrast ring, while pointer focus keeps its subtle
    border highlight. Added a `.focused` JS fallback for context-menu items.
- **Dependency** `bf-5idu` is also closed, so the chain `bf-5idu → bf-56pp`
  was resolved in order.
- **Independent verification** — the live codebase confirms the artifacts:
  `platform-frames-base.css:857`, `messaging-base.css:607`, and
  `frame-layouts.css:442` all define `:focus-visible`/`:focus` outlines for
  `a`, `button`, and `[role="button"]`; 29 button tags carry `aria-label`,
  and the buttons still lacking one are overwhelmingly *text-bearing* (e.g.
  `☀️ Light Mode`, `▶ Start Full Test`) whose visible text *is* their
  accessible name, not icon-only controls.

Acceptance criteria for `bf-56pp` are all satisfied.

## Why no code change here

The crash was a killed-process event (signal -1), not a defect in the work
product — the immediate retry produced the correct, committed result.
Re-running the work would only duplicate a committed, verified commit. The
only artifact this alert bead needs is this note (per the bead's commit
requirement).

## Lesson / pattern

This matches a known failure mode: **alert beads (crash-retry, auto-split)
fire on work that has since completed.** Before doing any work on such a bead,
verify the source bead's true state (`br show` + `br log` + a `git log --grep`
for the bead id) and close the alert if the work is already done. This is the
same pattern as `bf-2fn6` (which resolved a stale alert for `bf-4p8p`).
See memory note `bead-auto-split-fires-on-complete-work`.
