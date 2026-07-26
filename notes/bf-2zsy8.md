# bf-2zsy8 — Add umbrella label to bf-2d8g8

## Task
Add the `umbrella` label to the parent bead `bf-2d8g8` ("Debug renderPreviews() to use smart-ordered platforms").

## Result: already present — no change needed

Verification of `bf-2d8g8`'s label set against the live bead store:

- `br show bf-2d8g8 --json` → `"labels":["umbrella"]`
- `br labels bf-2d8g8` → `umbrella`

The `umbrella` label was already attached to `bf-2d8g8` before this task bead was
created (the parent bead is itself `closed`, closed at 2026-07-24). This is the
"auto-split fires on complete work" pattern — the parent bead was already labelled,
so there was nothing to mutate.

No code changes resulted from this task; this note is the work artifact.
