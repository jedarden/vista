# Pluck Configuration Files - bf-42hv

## Task
Locate all Pluck configuration files in the vista codebase.

## Discovered Configuration Files

### Primary Configuration
- **`.beads/config.yaml`** - Main Pluck configuration file containing project settings
- **`.beads/metadata.json`** - Bead database configuration

### Supporting Files
- **`.beads/beads.db`** - SQLite database storing all beads
- **`.beads/issues.jsonl`** - JSONL export/checkpoint of bead issues

## Naming Conventions
1. **Directory:** `.beads/` (standard Pluck directory structure)
2. **Configuration:** `config.yaml` (YAML format)
3. **Metadata:** `metadata.json` (JSON format)
4. **Database:** `beads.db` (SQLite)
5. **Export:** `issues.jsonl` (JSON Lines format)

## Configuration Location
All Pluck configuration is centralized in `/home/coding/vista/.beads/`

## Related Beads
- bf-45dp: "Read Pluck configuration files"
- bf-48x2: "Validate Pluck configuration syntax"
- bf-4366: "Verify Pluck configuration files and settings"
