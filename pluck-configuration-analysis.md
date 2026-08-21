# Pluck Configuration State

**Verified:** 2026-08-21

**Documenting bead:** `vista-7a7dff17`

**Scope:** NEEDLE's effective Pluck settings when this VISTA checkout is the
target workspace.

## Summary

Pluck has three configurable settings. All three are present in the global
NEEDLE configuration and parse successfully. VISTA supplies no local Pluck
overrides; its only NEEDLE setting selects the current `bead-rs` backend.

The configuration is syntactically valid, but it has operational trade-offs to
monitor: a default `needle` invocation targets `claude-governor`, rather than
VISTA; starvation events are not durably recorded; and the custom
`starvation-alert` exclusion deliberately keeps alert-labelled work out of the
normal queue.

## Configuration sources and precedence

| Source | Relevant setting | Effective value |
|---|---|---|
| `/home/coding/.config/needle/config.yaml` | `strands.pluck` | All three Pluck settings below. |
| `/home/coding/.config/needle/config.yaml` | `workspace.default` | `/home/coding/claude-governor` |
| `/home/coding/vista/.needle.yaml` | `bead_cli.backend` | `bead-rs` |

The workspace file does not contain a `strands.pluck` block, so VISTA inherits
the global Pluck values. CLI and environment overrides can take precedence at
launch time; none were observed during this review.

## Effective Pluck settings

```yaml
strands:
  pluck:
    exclude_labels:
      - deferred
      - human
      - blocked
      - starvation-alert
    split_after_failures: 3
    persistent_starvation_records: false
```

| Key | Value | Effect |
|---|---|---|
| `strands.pluck.exclude_labels` | `deferred`, `human`, `blocked`, `starvation-alert` | A ready bead with any one of these exact, case-sensitive labels is excluded from Pluck selection. |
| `strands.pluck.split_after_failures` | `3` | When the first candidate after filtering has a `failure-count:N` label of at least `3`, Pluck returns a split instruction instead of normal work. `0` disables this behavior. |
| `strands.pluck.persistent_starvation_records` | `false` | Starvation telemetry is emitted, but no JSONL diagnostic is written to NEEDLE's state directory. |

These are the complete fields in NEEDLE's `PluckConfig`; no status selector,
required-label selector, ID exclusion, or metadata selector is configurable or
set in the VISTA configuration.

### Label inventory

| Exact label | Meaning in the current configuration |
|---|---|
| `deferred` | Keeps postponed work out of the normal dispatch queue. |
| `human` | Keeps work reserved for human handling out of automated dispatch. |
| `blocked` | Excludes a bead carrying the `blocked` *label*. This is separate from bead-rs manual blocking or an unfinished blocking dependency. |
| `starvation-alert` | Keeps starvation-alert-labelled beads out of normal automated selection. This is a deployment-specific addition, not a Pluck default. |

If `exclude_labels` were omitted or empty, Pluck would use its built-in fallback
of `deferred`, `human`, and `blocked`. A non-empty configured list replaces
that fallback rather than extending it. The active list correctly repeats all
three default labels before adding `starvation-alert`.

## Selection behavior relevant to this configuration

Before Pluck applies the label list, bead-rs supplies its ready frontier:
open, unassigned beads that are not manually blocked and do not have an
unfinished `blocks` dependency. Pluck applies the configured labels, defensive
status/assignee checks, and temporary worker-local race-loss exclusions, then
orders remaining candidates as follows:

```text
priority ASC → failure count ASC → created_at ASC → id ASC
```

The failure count is the largest valid `failure-count:N` label on a bead;
missing or malformed values count as zero. Reaching the configured threshold
does not remove a bead from the ready frontier—it changes the dispatch result
to `Split`. A repeated failure is therefore handled before the later
`outcome.quarantine_after_failures: 5` global safeguard.

When no candidates remain, `persistent_starvation_records: false` leaves
telemetry as the only Pluck-generated starvation evidence. If enabled, records
would go to `/home/coding/.needle/state/starvation-records.jsonl`, never to
VISTA's `.beads` store.

## Assessment and cautions

| Finding | Assessment | Why it matters |
|---|---|---|
| YAML syntax and field types | Valid | `needle doctor` passed the configuration check. |
| Backend selection | Correct | VISTA explicitly uses `bead-rs`, the configured current backend. |
| `workspace.default` points to `/home/coding/claude-governor` | Operational caution | Running `needle` without an explicit VISTA workspace will select the `claude-governor` bead store, not this checkout. VISTA-specific launch commands should specify their workspace. |
| `persistent_starvation_records: false` | Intentional trade-off | Starvation can still be observed through telemetry, but no local durable Pluck record is retained for later diagnosis. |
| `starvation-alert` is excluded | Intentional policy requiring review | Alert-labelled beads will not be retried by ordinary Pluck dispatch. Ensure another workflow owns their follow-up. |
| Pluck config introspection | Tooling limitation | The installed `needle 0.3.0` accepts the YAML and `needle doctor` validates it, but `needle config --get` reports these Pluck keys as unknown and `--dump` omits them. Direct YAML inspection is currently required for these values. |

The unrelated `needle doctor` heartbeat check reported one stale heartbeat at
review time. That warning does not indicate a Pluck configuration error.

## Verification evidence

- `needle --version` reported `needle 0.3.0`.
- `needle doctor` reported the configuration **valid**, the bead-rs backend
  verified, 14 passing checks, and one stale-heartbeat warning.
- The global YAML was inspected directly and the installed NEEDLE source was
  checked to confirm that `PluckConfig` contains exactly the three settings
  documented above and their stated defaults.
- VISTA's `.needle.yaml` contains only `bead_cli.backend: bead-rs`.
