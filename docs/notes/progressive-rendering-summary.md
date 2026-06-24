# Progressive Rendering: Quick Reference

## Decision: Hybrid Approach
**Split endpoints for primary API** + **SSE for long-running operations**

---

## API Endpoints

### Primary Progressive Endpoints

| Method | Endpoint | Purpose | Typical Duration |
|--------|----------|---------|------------------|
| POST | `/api/inspect` | Create inspection, get ID | 50ms |
| GET | `/api/inspect/:id/meta` | Get parsed metadata | 500-800ms |
| GET | `/api/inspect/:id/image` | Get image probe results | 1-3s |
| GET | `/api/inspect/:id/score` | Get scoring results | 50ms (after meta) |
| GET | `/api/inspect/:id/complete` | Get all current state | varies |

### SSE Streams

| Endpoint | Purpose | Events |
|----------|---------|--------|
| GET `/api/inspect/:id/stream` | Real-time inspection updates | `stage`, `complete`, `error` |
| GET `/api/sitemap/:auditId/stream` | Sitemap audit progress | `progress`, `result`, `complete` |

---

## Loading Sequence

```
0ms:    POST /api/inspect → Show skeleton grid
500ms:  GET /api/inspect/:id/meta → Render text cards
600ms:  GET /api/inspect/:id/score → Update grades
1-3s:   GET /api/inspect/:id/image → Render images
        (poll every 500ms until complete)
```

**Alternative SSE Flow:**
```
0ms:    POST /api/inspect → inspectionId
0ms:    GET /api/inspect/:id/stream → Open SSE
500ms:  event: stage meta → Render text cards
600ms:  event: stage score → Update grades
1-3s:   event: stage image → Render images
        event: complete → Done
```

---

## Error Handling

| Error Type | Recovery | UI Behavior |
|------------|----------|-------------|
| Recoverable | Retry stage | Warning badge, continue rendering |
| Fatal | Show error, allow retry | Error banner, clear grid |
| Partial | Show what we have | Render successful data, error indicators |

---

## Key Benefits

1. **Stateless** - No database, no sessions
2. **Granular caching** - Each stage cached independently
3. **Parallel potential** - Independent fetches possible
4. **Better error isolation** - One stage failure doesn't break all
5. **Progressive UX** - Users see content immediately, images fill in

---

## Migration Path

1. **Phase 1:** Add new endpoints alongside `/api/preview` (non-breaking)
2. **Phase 2:** Client-side progressive loader module
3. **Phase 3:** Full migration to progressive endpoints
4. **Phase 4:** Deprecate old endpoint after 6 months

---

## Performance Targets

| Stage | Target | Cache TTL |
|-------|--------|-----------|
| Fetch | <500ms | 5 min |
| Meta | <300ms | 5 min |
| Image | <3s | 1 hour |
| Score | <50ms | 1 min |

---

## Implementation Files

- Architecture: `/docs/notes/progressive-rendering-architecture.md`
- Sequence diagrams: `/docs/notes/progressive-rendering-sequence.md`
- Quick reference: `/docs/notes/progressive-rendering-summary.md`
