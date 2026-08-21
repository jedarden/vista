# Pluck Configuration Analysis

**Date:** 2026-08-21
**Bead:** vista-21da82b2
**Task:** Read Pluck configuration files

## Summary

Successfully located, read, and analyzed the Pluck configuration files for the NEEDLE system.

## Configuration Files Located

### 1. Global Configuration
**Location:** `/home/coding/.config/needle/config.yaml`
**Format:** YAML
**Status:** ✅ Read and analyzed

### 2. Documentation
**Location:** `/home/coding/claude-governor/docs/plan/pluck-configuration.md`
**Format:** Markdown
**Status:** ✅ Read and analyzed

### 3. Workspace Configuration
**Location:** `/home/coding/vista/.needle.yaml`
**Format:** YAML
**Status:** ✅ Read and analyzed

## Configuration Format

All Pluck configurations use **YAML** format with the following structure:

### Global Pluck Configuration

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

### Workspace Configuration

The vista workspace specifies only the backend binding:

```yaml
bead_cli:
  backend: bead-rs
```

## Configuration Structure Analysis

### 1. exclude_labels (Array of strings)
- **Purpose:** Labels that exclude beads from being plucked
- **Current values:**
  - `deferred`: Excludes postponed work
  - `human`: Excludes work reserved for human handling
  - `blocked`: Excludes beads carrying the blocked marker
  - `starvation-alert`: Excludes starvation-alert beads from normal work selection
- **Behavior:** Exact case-sensitive matching (no wildcards, prefixes, or regex)
- **Fallback:** Built-in defaults are `["deferred", "human", "blocked"]`

### 2. split_after_failures (Integer)
- **Purpose:** Changes result when first candidate's failure count reaches threshold
- **Current value:** `3`
- **Behavior:** 
  - If first sorted candidate has `failure-count:N >= 3`, returns `Split` result
  - Setting to `0` disables splitting
  - Prevents repeatedly failing beads from monopolizing first slot

### 3. persistent_starvation_records (Boolean)
- **Purpose:** Controls starvation diagnostic output persistence
- **Current value:** `false`
- **Behavior:** When `false`, does not write persistent records to NEEDLE's starvation-record file

## Candidate Filtering Pipeline

Pluck applies multiple layers of filtering:

1. **Workspace and Store Selection**: Uses resolved workspace's `.beads` store
2. **Bead-rs `--ready` Frontier**: Base status, assignee, manual block, blocking dependencies
3. **NEEDLE Filters**: Applies `exclude_labels` and `exclude_ids`
4. **Status Guard**: Removes `in_progress` and stale assignee beads
5. **Worker-local Exclusions**: Transient exclusion set for race-lost IDs

## Ordering Behavior

Candidates are sorted deterministically by:
```
priority ASC → failure count ASC → created_at ASC → id ASC
```

Failure count is the maximum valid integer in any `failure-count:N` label.

## Key Findings

1. **Configuration is Active and Valid**: The global configuration is loaded and functional with `needle 0.4.2`

2. **Four Active Exclusion Labels**: The configuration uses four labels instead of the built-in three (added `starvation-alert`)

3. **Backend Binding**: Vista uses `bead-rs` backend (not deprecated `bf`/`br`)

4. **Runtime Configuration**: The configuration is successfully loaded and validated by `needle doctor`

5. **Starvation Monitoring**: Disabled (no persistent records written)

## Configuration Verification

✅ Configuration format: YAML
✅ All required fields present
✅ Valid values for all settings
✅ Backend binding correct
✅ No deprecated or invalid settings

## References

- Full documentation: `/home/coding/claude-governor/docs/plan/pluck-configuration.md`
- Root cause analysis: `/home/coding/claude-governor/docs/research/pluck-filter-root-cause.md`
- Global config: `/home/coding/.config/needle/config.yaml`
- Workspace config: `/home/coding/vista/.needle.yaml`
