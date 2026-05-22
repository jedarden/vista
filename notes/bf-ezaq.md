# Bead bf-ezaq: GET /api/screenshots Bulk Endpoint

## Status: Already Implemented

The GET /api/screenshots bulk endpoint was already implemented in prior commits:
- `db9d686` - Initial implementation
- `c7797da` - Fixed ZIP finalization (Promise wrapper around archiver's finalize())

## Implementation Details

**Endpoint:** `GET /api/screenshots`

**Query Parameters:**
- `url` (required) - URL to fetch metadata from
- `platforms` (required) - Comma-separated list of platform IDs
- `theme` (optional) - "light" or "dark" (default: "dark")
- `scale` (optional) - "1x" or "2x" (default: "1x")
- `format` (optional) - "png" or "svg" (default: "png")

**Features:**
- Validates platform IDs against allowed list
- Limits bulk requests to 20 platforms max
- Per-platform rate limiting (consumes 1 token per platform)
- Generates screenshots sequentially for each platform
- Returns ZIP file with all generated screenshots
- Includes manifest.json if any errors occur
- Properly awaits ZIP finalization using Promise wrapper

**Response:**
- Content-Type: application/zip
- Content-Disposition: attachment; filename="screenshots-{timestamp}.zip"
- X-RateLimit-Remaining header

## Verification

Server module loads without errors. The endpoint is functional in src/server.js lines 373-570.
