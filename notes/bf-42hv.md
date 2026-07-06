# Pluck Configuration Files - bf-42hv

## Task
Locate all Pluck configuration files in the vista codebase.

## Summary
All Pluck configuration is centralized in the `.beads/` directory at `/home/coding/vista/.beads/`

## Configuration Files

### Primary Configuration
- **`.beads/config.yaml`** - Main Pluck configuration file containing project settings
  - Defines issue prefix: `vista`
  - Default priority: `2`
  - Default type: `task`

- **`.beads/metadata.json`** - Bead database configuration
  - Specifies database file: `beads.db`
  - Specifies JSONL export file: `issues.jsonl`

- **`.beads/.gitignore`** - Defines which Pluck files are excluded from git
  - Excludes database files (*.db, journal, shm, wal)
  - Excludes lock files, temporary files
  - Excludes daemon runtime files
  - Excludes sync state files

### Data Files
- **`.beads/beads.db`** - SQLite database storing all beads (live data store)
  - Size: 565 KB
  - Contains complete bead database

- **`.beads/issues.jsonl`** - JSONL export/checkpoint of bead issues
  - Size: 145 KB
  - Contains JSON Lines export of all bead issues
  - Used for backup/restore and git tracking

- **`.beads/beads.db.backup.*`** - Multiple database backups
  - Timestamped backups from various dates (June 2026)
  - Used for recovery

### Supporting Files and Directories
- **`.beads/learnings.md`** - Workspace-specific learning/knowledge capture
- **`.beads/last-touched`** - Timestamp file tracking last bead access
- **`.beads/skills/`** - Directory containing workspace-specific skills
  - Contains skill files (e.g., for-resizable-split-panes...md)
- **`.beads/traces/`** - Directory containing bead execution traces
  - One subdirectory per bead (e.g., bf-10pd/, bf-11j/, etc.)
- **`.beads/.br_history/`** - Local command history
- **`.beads/.br_recovery/`** - Recovery directory for interrupted operations

## Naming Conventions
1. **Directory:** `.beads/` (standard Pluck/bead-forge directory structure)
2. **Configuration:** `config.yaml` (YAML format)
3. **Metadata:** `metadata.json` (JSON format)
4. **Database:** `beads.db` (SQLite)
5. **Export:** `issues.jsonl` (JSON Lines format)
6. **Backups:** `beads.db.backup.YYYYMMDDHHMMSS` (timestamped)
7. **Traces:** One directory per bead ID (bf-XXXXX/)

## Verification Status
All configuration files have been verified:
- ✅ `.beads/config.yaml` exists and is readable
- ✅ `.beads/metadata.json` exists and points to correct files
- ✅ `.beads/beads.db` exists (565 KB SQLite database)
- ✅ `.beads/issues.jsonl` exists (145 KB JSONL export)
- ✅ `.beads/.gitignore` properly excludes sensitive/temporary files
