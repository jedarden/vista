# bf-29xoc — ALERT: Agent crash on bf-6alil (resolution: stale alert, work already completed on retry)

## What this bead is

A crash-retry alert spawned by NEEDLE when the agent working `bf-6alil`
(`claude-code-glm-4.7`, assignee `claude-code-glm-4.7-h2-vista`) died with
**exit code -1 / signal -1** at `2026-07-25T14:15:37.566Z` — i.e. the process
was *killed* (OOM / external signal / timeout), not a normal error exit. The
bead was released for retry and this alert was created to track the failure.

## Investigation outcome: no action needed — bf-6alil completed on retry ~2 min later

The crash was **transient**. The bead it flagged was retried and completed
almost immediately. Precise timeline (all UTC):

| Time (UTC)            | Event                                                                |
|-----------------------|----------------------------------------------------------------------|
| 2026-07-25 14:11:45.8 | `bf-6alil` created                                                    |
| 2026-07-25 14:15:37.6 | agent killed (exit -1 / signal -1) → this alert (`bf-29xoc`) spawned |
| 2026-07-25 14:17:50.0 | `b3bd021` committed (bf-6alil's retry deliverable)                    |
| 2026-07-25 14:17:56.0 | `bf-6alil` closed — `close_reason: Completed`                         |

The bead went from crash to closed/Completed in **~2.3 minutes**. The alert is
stale: by the time it was picked up, the underlying work was already done.

## What bf-6alil's commit delivered

`b3bd021` (`feat(bf-6alil): add chrome HTML to Instagram, Facebook, LinkedIn
platforms and add Snapchat`, +82 lines) added chrome HTML templates to the
Instagram, Facebook, and LinkedIn platform configs and added Snapchat as a new
platform — i.e. it satisfied bf-6alil's acceptance criteria (add the 4 remaining
platforms to `platform-frames.config.ts`, map structure matching the existing
YouTube/TikTok/Twitter entries).

## Why Snapchat is NOT in the current config (intentional, not crash fallout)

Snapchat, as added by `b3bd021`, does not appear at HEAD. This is **not** a
revert caused by the crash — it is a deliberate, later design decision:

- `461dc53` (`feat(bf-400yr): Create platform-frames.config.ts with 7 platform
  definitions`, `2026-07-25 22:34 UTC`) rewrote the config with a **canonical
  set of 7 platforms** chosen as the project's implemented frames:

      facebook, twitter, linkedin, reddit, youtube, instagram, tiktok

  Reddit replaced Snapchat as the 7th platform. This is a separate, intentional
  decision recorded under `bf-400yr` — orthogonal to the bf-6alil crash.

## Verified state at HEAD (2026-07-26)

- The **live** config is `src/platform-frames.config.ts` (180 lines), imported by
  `src/utils/platform-frames-validator.ts`, `src/public/app.js`, and
  `src/tests/test-platform-frames-config.js`. It defines exactly the 7 canonical
  platforms above — well-formed, consistent, complete.
- `src/config/platform-frames.config.ts` (477 lines) is a richer duplicate that
  is **not imported anywhere**; it carries the same 7 platform ids. (Out of
  scope for this crash alert; left as-is.)
- No crash-related dangling or broken state in `src/`. The only untracked item
  under `src/` is an unrelated acceptance-test artifact
  (`src/public/acceptance-7-platform-theme-switching.html`).
- bf-6alil is `closed` / `Completed`.

## Conclusion

The crash was transient; bf-6alil was retried and completed ~2.3 minutes after
the kill, then later superseded on its Snapchat→Reddit dimension by the
intentional `bf-400yr` rewrite. The current platform-frames config is complete
and consistent. No code action is needed. Record the investigation and close the
alert. Same resolution pattern as `bf-mspg` (and `bf-39ql`, `bf-2fn6`).

## Bead
- **bf-29xoc** — ALERT: Agent crash on bf-6alil
- **bf-6alil** — Add remaining platform frames to config mapping (closed/Completed)
- Related: bf-400yr (canonical 7-platform rewrite), bf-mspg (precedent crash-alert resolution)
