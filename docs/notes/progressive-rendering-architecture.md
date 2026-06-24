# Progressive Rendering Architecture

## Executive Summary

**Decision: Hybrid Approach** - Split endpoints for primary API design with SSE for long-running operations.

This architecture maintains vista's stateless design while enabling progressive data delivery that matches the natural processing stages of URL inspection.

---

## Chosen Approach: Split Endpoints with SSE Streaming

### Why Split Endpoints?

1. **Stateless Alignment** - Vista's architecture has no database or sessions. Split endpoints work naturally with stateless design.
2. **Granular Caching** - Each stage can be cached independently (metadata changes less frequently than images).
3. **Parallel Potential** - Clients can fetch independent data streams concurrently.
4. **Better Error Isolation** - Failure in one stage doesn't invalidate the entire response.
5. **API Composability** - Other tools can consume specific endpoints without parsing full responses.

### Why SSE for Long Operations?

1. **Sitemap Audits** - Crawling 100+ URLs takes minutes. SSE provides real-time progress updates.
2. **Bulk Screenshots** - Generating 20+ PNGs benefits from incremental delivery.
3. **Client Experience** - Users see progress bars instead of spinner limbo.

---

## API Structure

### Primary Progressive Endpoints

#### 1. Initiate Inspection

```
POST /api/inspect
Request: { url: string, html?: string, base?: string }
Response: {
  inspectionId: string,      // UUID for this inspection
  url: string,
  status: 'started' | 'partial' | 'complete',
  stages: {
    fetch: 'pending' | 'processing' | 'complete' | 'error',
    meta: 'pending' | 'processing' | 'complete' | 'error',
    image: 'pending' | 'processing' | 'complete' | 'error',
    score: 'pending' | 'processing' | 'complete' | 'error',
  },
  expiresAt: ISO timestamp,   // 15 minutes from now (stateless TTL)
}
```

**Purpose:** Creates inspection context, returns ID for subsequent calls. Begins URL fetch immediately.

#### 2. Fetch Metadata (Fast)

```
GET /api/inspect/:id/meta
Response: {
  inspectionId: string,
  stage: 'meta',
  status: 'complete' | 'partial' | 'error',
  data: {
    finalUrl: string,
    statusCode: number,
    redirectChain: RedirectStep[],
    meta: Metadata,
    responseHeaders: Record<string, string>,
    // Note: imageProbe null here until image stage completes
  },
  timestamp: ISO timestamp,
}
```

**Purpose:** Returns all data available immediately after HTML parsing (typically 300-800ms). Used for initial card rendering.

#### 3. Fetch Image Probe (Slow)

```
GET /api/inspect/:id/image
Response: {
  inspectionId: string,
  stage: 'image',
  status: 'processing' | 'complete' | 'error' | 'unavailable',
  data: {
    imageProbe: ImageProbe | null,
  },
  timestamp: ISO timestamp,
}
```

**Purpose:** Image dimension detection via HTTP HEAD + partial download. Can take 1-5 seconds depending on image size and server response time. Status `processing` indicates not ready yet.

#### 4. Fetch Scoring (Fast, depends on meta)

```
GET /api/inspect/:id/score
Response: {
  inspectionId: string,
  stage: 'score',
  status: 'complete' | 'error',
  data: {
    scoring: ScoringResult,
    diagnostics: Diagnostic[],
    autoFixes: AutoFix[],
  },
  timestamp: ISO timestamp,
}
```

**Purpose:** Runs scoring algorithm on metadata. Nearly instant once metadata is available.

#### 5. Fetch Complete (All Stages)

```
GET /api/inspect/:id/complete
Response: {
  inspectionId: string,
  status: 'complete' | 'partial' | 'error',
  data: {
    url: string,
    finalUrl: string,
    statusCode: number,
    meta: Metadata,
    imageProbe: ImageProbe | null,
    scoring: ScoringResult,
    diagnostics: Diagnostic[],
    autoFixes: AutoFix[],
    redirectChain: RedirectStep[],
    responseHeaders: Record<string, string>,
    headerAnalysis: HeaderAnalysis,
  },
  stagesComplete: string[],     // ['fetch', 'meta', 'score']
  stagesPending: string[],      // ['image'] if image probe pending
  errors: { stage: string, error: string }[],
}
```

**Purpose:** Legacy-compatible endpoint that returns the full current state. Used for initial client migration.

---

### SSE Streaming Endpoints

#### 1. Inspection Progress Stream

```
GET /api/inspect/:id/stream
Response: SSE stream
```

**Event Types:**

```
event: stage
data: {
  stage: 'fetch',
  status: 'processing',
  progress: 0.3,
}

event: stage
data: {
  stage: 'fetch',
  status: 'complete',
  data: { /* fetch result */ }
}

event: stage
data: {
  stage: 'meta',
  status: 'complete',
  data: { /* metadata */ }
}

event: stage
data: {
  stage: 'image',
  status: 'processing',
  progress: 0.5,
}

event: stage
data: {
  stage: 'image',
  status: 'complete',
  data: { imageProbe: {...} }
}

event: stage
data: {
  stage: 'score',
  status: 'complete',
  data: { scoring: {...} }
}

event: complete
data: {
  inspectionId: string,
  status: 'complete',
  timestamp: ISO timestamp,
}

event: error
data: {
  stage: string,
  error: string,
  recoverable: boolean,
}
```

**Purpose:** Real-time updates during inspection. Client can render each increment immediately.

#### 2. Sitemap Audit Stream

```
GET /api/sitemap/:auditId/stream
Response: SSE stream
```

**Event Types:**

```
event: progress
data: {
  total: number,
  processed: number,
  passed: number,
  failed: number,
  currentUrl: string,
}

event: result
data: {
  url: string,
  score: number,
  grade: string,
  issues: string[],
}

event: complete
data: {
  auditId: string,
  totalResults: number,
  timestamp: ISO timestamp,
}
```

**Purpose:** Real-time feedback during sitemap crawl. Shows live progress bar and incremental results.

---

## Data Flow

### Client-Side Loading Sequence

```
┌─────────────────────────────────────────────────────────────┐
│  User submits URL                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/inspect { url }                                   │
│  → Returns inspectionId immediately                         │
│  → Show skeleton grid (0ms)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/inspect/:id/meta                                   │
│  → Render text-only cards (500ms)                            │
│  → Populate summary bar with score                           │
│  → Show skeleton images                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/inspect/:id/image                                  │
│  → Status: processing? Poll every 500ms                      │
│  → Status: complete? Render images in cards (1-3s)            │
│  → Remove skeleton, crossfade to real images                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/inspect/:id/score                                   │
│  → Update letter grades (usually already complete with meta) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Complete: All stages done                                    │
│  → Enable export buttons, screenshot generation               │
└─────────────────────────────────────────────────────────────┘
```

### Alternative: SSE Stream Flow

```
┌─────────────────────────────────────────────────────────────┐
│  POST /api/inspect { url }                                    │
│  → inspectionId: abc-123                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/inspect/:id/stream                                 │
│  → Open SSE connection                                        │
│  → Show skeleton grid                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  event: stage { stage: 'fetch', status: 'complete' }          │
│  → Hide spinner, show "Analyzing..."                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  event: stage { stage: 'meta', status: 'complete', data }      │
│  → Render text-only cards, update score                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  event: stage { stage: 'image', status: 'processing', ... }   │
│  → Show image progress indicators on cards                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  event: stage { stage: 'image', status: 'complete', data }     │
│  → Render images, crossfade from skeleton                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  event: complete { }                                          │
│  → Enable all interactive features                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Loading States

### Per-Stage States

| Stage | Status | UI State | Action |
|-------|--------|----------|--------|
| fetch | pending | Spinner | "Connecting..." |
| fetch | processing | Spinner | "Fetching page..." |
| fetch | complete | - | Continue to meta |
| fetch | error | Error banner | Show retry button |
| meta | pending | Skeleton cards | - |
| meta | processing | Skeleton cards | "Parsing metadata..." |
| meta | complete | Text cards rendered | Update summary bar |
| meta | error | Partial cards | Show what we have |
| image | pending | Skeleton images | - |
| image | processing | Progress indicator on cards | "Loading images..." |
| image | complete | Images rendered | Crossfade from skeleton |
| image | unavailable | Gray placeholder | "No image available" |
| image | error | Error badge | "Image load failed" |
| score | pending | Loading badge | - |
| score | processing | Loading badge | - |
| score | complete | Letter grades shown | Update card grades |
| score | error | Show '?' badge | "Scoring failed" |

### Aggregate States

```javascript
const getState = (stages) => {
  if (stages.some(s => s.status === 'error')) return 'error';
  if (stages.every(s => s.status === 'complete')) return 'complete';
  if (stages.some(s => s.status === 'processing')) return 'loading';
  if (stages.fetch === 'complete') return 'partial';
  return 'initial';
};
```

### Visual State Indicators

1. **Summary Bar Progress**
   - Shows progress ring: (complete stages / total stages)
   - Color: gray (pending) → blue (loading) → green (complete) → red (error)

2. **Card-Level States**
   - Skeleton shimmer (CSS animation)
   - Progress badge for images (percentage or "...")
   - Error badge with tooltip
   - Success checkmark when all stages done

3. **Global Loading Bar**
   - Top of page: thin progress line
   - Animates as stages complete
   - Disappears on complete

---

## Error Handling Strategy

### Error Categories

#### 1. Recoverable Errors

**Definition:** Temporary failures that don't invalidate the entire inspection.

**Examples:**
- Image probe timeout (image server slow)
- Single platform scoring failure
- Non-critical diagnostic check failure

**Handling:**
```javascript
{
  stage: 'image',
  status: 'error',
  error: 'Image probe timeout after 5s',
  recoverable: true,
  fallback: {
    imageProbe: null,
    note: 'Image dimensions unavailable - card rendering will estimate layout'
  }
}
```

**UI Behavior:**
- Show warning badge on affected cards
- Continue rendering with fallback data
- Add diagnostic entry
- Allow retry via button

#### 2. Fatal Errors

**Definition:** Failures that prevent core functionality.

**Examples:**
- URL fetch failure (DNS error, 404, connection refused)
- HTML parse failure (malformed response)
- Inspection ID not found / expired

**Handling:**
```javascript
{
  stage: 'fetch',
  status: 'error',
  error: 'DNS resolution failed for example.com',
  recoverable: false,
  userMessage: 'Could not reach the server. Check the URL and try again.',
  retryAllowed: true
}
```

**UI Behavior:**
- Show error banner at top of page
- Clear skeleton grid
- Show retry button
- Disable export features

#### 3. Partial Errors

**Definition:** Some data succeeded, some failed.

**Examples:**
- Metadata parsed but image probe failed
- Scoring complete but one platform's scorer crashed

**Handling:**
```javascript
{
  status: 'partial',
  stagesComplete: ['fetch', 'meta', 'score'],
  stagesPending: [],
  errors: [
    {
      stage: 'image',
      error: 'Image server returned 403 Forbidden',
      impact: 'Card images will show placeholders'
    }
  ],
  data: {
    // All successful data included
  }
}
```

**UI Behavior:**
- Render all successful data
- Show warning indicator for failed stages
- Add error entries to diagnostics panel
- Allow retry on just the failed stage

### Client-Side Error Recovery

```javascript
async function fetchWithRetry(stageUrl, options = {}) {
  const { maxRetries = 2, retryDelay = 1000 } = options;
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(stageUrl);
      if (response.ok) return await response.json();

      if (response.status === 404) {
        // Inspection expired - unrecoverable
        throw new Error('Inspection expired. Please refresh and try again.');
      }

      if (response.status >= 500) {
        // Server error - retryable
        lastError = `Server error: ${response.status}`;
        if (i < maxRetries) {
          await new Promise(r => setTimeout(r, retryDelay * (i + 1)));
          continue;
        }
      }

      return await response.json(); // Contains error info
    } catch (err) {
      lastError = err.message;
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, retryDelay * (i + 1)));
      }
    }
  }

  throw new Error(lastError || 'Unknown error');
}
```

### Server-Side Error Handling

```javascript
// In-memory inspection store (15-minute TTL)
const inspections = new Map();

async function createInspection(url) {
  const id = generateId();
  const inspection = {
    id,
    url,
    status: 'started',
    stages: {
      fetch: { status: 'processing' },
      meta: { status: 'pending' },
      image: { status: 'pending' },
      score: { status: 'pending' },
    },
    errors: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
  };

  inspections.set(id, inspection);

  // Start fetch asynchronously
  processFetch(id, url).catch(err => {
    const insp = inspections.get(id);
    if (insp) {
      insp.stages.fetch = { status: 'error', error: err.message };
      insp.errors.push({ stage: 'fetch', error: err.message });
    }
  });

  return inspection;
}

// Cleanup expired inspections every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, insp] of inspections.entries()) {
    if (now > insp.expiresAt) {
      inspections.delete(id);
    }
  }
}, 5 * 60 * 1000);
```

---

## Migration Path

### Phase 1: Add Progressive Endpoints (Non-Breaking)

1. Keep existing `/api/preview` endpoint unchanged
2. Add new `/api/inspect` and `/api/inspect/:id/{stage}` endpoints
3. Server-side logic refactored to share code between old and new
4. Client continues using old endpoint initially

### Phase 2: Client-Side Progressive Loading

1. New client-side module `progressive-loader.js`
2. Initially wraps old endpoint, simulates stages
3. Gradually switch to calling new endpoints
4. A/B testing for performance comparison

### Phase 3: Full Migration

1. All client code uses progressive endpoints
2. Old `/api/preview` marked deprecated
3. SSE streams implemented for long operations
4. Documentation updated

### Phase 4: Cleanup

1. Old `/api/preview` removed after 6-month deprecation period
2. Code simplified (no dual-endpoint maintenance)
3. Performance monitoring confirms improvement

---

## Performance Considerations

### Caching Strategy

Each stage can be cached independently:

```javascript
// Cache headers per stage
const CACHE_HEADERS = {
  meta: 'public, max-age=300, stale-while-revalidate=600',    // 5 min
  image: 'public, max-age=3600, stale-while-revalidate=7200', // 1 hour
  score: 'public, max-age=60, stale-while-revalidate=300',    // 1 min
};
```

### Server-Side Optimization

1. **Parallel Processing**
   - Image probe starts immediately when image URL found in metadata
   - Scoring can run in parallel with image probing (depends only on metadata)

2. **Memory Management**
   - In-memory inspection store limited to 1000 concurrent inspections
   - Automatic cleanup of expired inspections
   - LRU eviction when limit reached

3. **Request Coalescing**
   - Multiple clients requesting same URL share processing
   - First request triggers processing, others wait on same inspectionId
   - TTL-based deduplication cache

### Client-Side Optimization

1. **Request Batching**
   - Single SSE connection replaces multiple polling requests
   - Reduces connection overhead

2. **Progressive Enhancement**
   - Text content renders immediately (no waiting for images)
   - Images load asynchronously with blurhash placeholders

3. **Polling Optimization**
   - Exponential backoff for image stage polling
   - Start: 200ms → 400ms → 800ms → 1600ms (max)
   - Stop when status is `complete` or `unavailable`

---

## Monitoring & Observability

### Metrics to Track

1. **Stage Durations**
   - Time from `/api/inspect` to `meta` complete
   - Time from `meta` to `image` complete
   - Total inspection time

2. **Error Rates**
   - Per-stage error frequency
   - Timeout vs. hard error breakdown

3. **Cache Effectiveness**
   - Cache hit rate per stage
   - Deduplication rate (same URL, different clients)

4. **Resource Usage**
   - Concurrent inspection count
   - Memory usage of inspection store
   - SSE connection count

### Logging Strategy

```javascript
// Structured logging per stage
console.log(JSON.stringify({
  event: 'stage_complete',
  inspectionId,
  stage: 'meta',
  duration: Date.now() - startTime,
  url: sanitizeUrl(url),
}));

console.log(JSON.stringify({
  event: 'stage_error',
  inspectionId,
  stage: 'image',
  error: err.message,
  recoverable: true,
}));
```

---

## Implementation Checklist

### Server-Side

- [ ] `/api/inspect` POST endpoint (create inspection)
- [ ] `/api/inspect/:id/meta` GET endpoint
- [ ] `/api/inspect/:id/image` GET endpoint
- [ ] `/api/inspect/:id/score` GET endpoint
- [ ] `/api/inspect/:id/complete` GET endpoint
- [ ] `/api/inspect/:id/stream` SSE endpoint
- [ ] `/api/sitemap/:auditId/stream` SSE endpoint
- [ ] In-memory inspection store with TTL
- [ ] Request coalescing logic
- [ ] Per-stage error handling
- [ ] Cache headers configuration
- [ ] Metrics collection hooks

### Client-Side

- [ ] `progressive-loader.js` module
- [ ] Stage-based state management
- [ ] Skeleton card rendering system
- [ ] Error boundary components
- [ ] SSE event handling
- [ ] Polling fallback for unsupported browsers
- [ ] Retry logic with exponential backoff
- [ ] Loading state indicators
- [ ] Migration layer for old `/api/preview`

### Testing

- [ ] Unit tests for inspection store
- [ ] Integration tests for all endpoints
- [ ] SSE reconnection tests
- [ ] Error recovery tests
- [ ] Cache invalidation tests
- [ ] Load testing (100 concurrent inspections)
- [ ] Browser compatibility tests

---

## Appendix: Alternative Approaches Considered

### Pure SSE (Rejected)

**Pros:**
- Single connection
- Natural progressive delivery
- Real-time updates

**Cons:**
- Complex connection management (timeouts, reconnection)
- Harder to cache intermediate results
- Stateless server becomes stateful (keep connections)
- Overkill for fast operations (metadata parsing is ~500ms)

### Pure Polling (Rejected)

**Pros:**
- Simple implementation
- Works everywhere
- Stateless

**Cons:**
- Inefficient (many requests return no new data)
- Poor UX (spinner limbo)
- Server load from repeated polling

### WebSocket (Rejected)

**Pros:**
- Bidirectional communication
- Real-time updates

**Cons:**
- Overkill for unidirectional data flow
- Complex handshake protocol
- Stateful connection management
- Browser compatibility issues (some proxies block)

### GraphQL (Rejected)

**Pros:**
- Single endpoint
- Client decides what to fetch

**Cons:**
- Over-engineered for this use case
- Adds dependency complexity
- Caching is more complex
- Doesn't match vista's simple REST pattern

---

## Conclusion

The hybrid approach balances simplicity, performance, and UX:

- **Split endpoints** provide the foundation for progressive delivery while maintaining stateless design
- **SSE streams** enhance long-running operations without affecting the fast path
- **Error handling** is granular and recoverable where possible
- **Migration path** allows gradual adoption without breaking existing functionality

This architecture enables vista to deliver perceived performance that feels instant while actual processing completes progressively in the background.
