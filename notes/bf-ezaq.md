# Bead bf-ezaq: GET /api/screenshots Bulk Endpoint

## Status: Verified and Functional (2026-05-22)

The GET /api/screenshots bulk endpoint is fully implemented and operational.

## Implementation Details

**Endpoint:** `GET /api/screenshots`

**Query Parameters:**
- `url` (required) - URL to fetch metadata from
- `platforms` (required) - Comma-separated list of platform IDs
- `theme` (optional) - "light" or "dark" (default: "dark")
- `scale` (optional) - "1x" or "2x" (default: "1x")
- `format` (optional) - "png" or "svg" (default: "png")

**Features:**
- Validates platform IDs against allowed list (31 platforms)
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

## Verification Results (2026-05-22)

### Module Loading
- Server module loads without errors
- Archiver ZipArchive is correctly imported: `const { ZipArchive } = require('archiver');`
- 31 platforms are available for screenshot generation

### Single Platform Test
Request: `GET /api/screenshots?url=https://example.com&platforms=twitter`
Response Headers:
```
HTTP/1.1 200 OK
Content-Type: application/zip
Content-Disposition: attachment; filename="screenshots-1779479515998.zip"
X-RateLimit-Remaining: 27
```

### Bulk PNG Test (3 platforms)
Request: `GET /api/screenshots?url=https://example.com&platforms=twitter,facebook,linkedin`
Result: ZIP file containing:
- twitter-card.png (20,801 bytes)
- facebook-card.png (20,591 bytes)
- linkedin-card.png (20,386 bytes)

### Bulk PNG Test (10 platforms)
Request: `GET /api/screenshots?url=https://example.com&platforms=google,facebook,twitter,linkedin,reddit,mastodon,bluesky,threads,tumblr,pinterest`
Result: ZIP file with all 10 platform cards (206,355 bytes total)

### SVG Format Test
Request: `GET /api/screenshots?url=https://example.com&platforms=reddit&format=svg`
Result: ZIP file containing reddit-card.svg (1,580 bytes)

### Theme and Scale Parameters
Request: `GET /api/screenshots?url=https://example.com&platforms=slack&theme=light&scale=2x`
Result: ZIP file with slack-card.png (52,336 bytes - larger due to 2x scale)

### Error Handling
Request: `GET /api/screenshots?url=https://example.com&platforms=invalid_platform`
Result: `{"error":"Invalid platforms","message":"Invalid platform(s): invalid_platform. Valid platforms: google, facebook, twitter, linkedin, reddit, mastodon, bluesky, threads, tumblr, pinterest, slack, discord, whatsapp, imessage, telegram, signal, teams, googlechat, zoom, line, kakaotalk, notion, jira, github, trello, figma, medium, substack, outlook, gmail, feedly"}`

### Platform IDs Available
google, facebook, twitter, linkedin, reddit, mastodon, bluesky, threads, tumblr, pinterest, slack, discord, whatsapp, imessage, telegram, signal, teams, googlechat, zoom, line, kakaotalk, notion, jira, github, trello, figma, medium, substack, outlook, gmail, feedly

## Code Location
File: `/home/coding/vista/src/server.js`
Lines: 377-570
