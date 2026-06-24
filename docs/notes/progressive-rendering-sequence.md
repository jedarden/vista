# Progressive Rendering Loading Sequence Diagram

## Split Endpoint Flow

```
Client                    Server                    Processing
│                         │                         │
├─POST /api/inspect──────┤                         │
│  {url: "example.com"}   │                         │
│                         ├─Create inspectionId     │
│                         ├─Start URL fetch ───────┤
│  ◄─{inspectionId,       │                         │
│     stages: {           │                         │
│       fetch: processing,│                         │
│       meta: pending,    │                         │
│       image: pending,   │                         │
│       score: pending    │                         │
│     }}──────────────────┤                         │
│  [Show skeleton grid]   │                         │
│                         │                         │
├─GET /api/inspect/:id/meta ──────────────────────┤
│  [Wait...                │                         │
│   show spinner]          │                     Fetch complete
│                         │                     Parse HTML...
│  ◄─{stage: 'meta',       │                     Extract tags...
│     status: 'complete',  │                         │
│     data: {             │                         │
│       meta: {...},      │                     Parse complete
│       statusCode: 200   │                         │
│     }}                  │                         │
│  [Render text cards]     │                     Start image probe...
│  [Update summary bar]    │                         │
│                         │                         │
├─GET /api/inspect/:id/score ────────────────────┤
│  [Show loading badges]   │                         │
│                         │                         │
│  ◄─{stage: 'score',      │                     Score complete
│     status: 'complete',  │                         │
│     data: {             │                         │
│       scoring: {...}    │                         │
│     }}                  │                         │
│  [Update letter grades]  │                         │
│                         │                         │
├─GET /api/inspect/:id/image ─────────────────────┤
│  [Show image skeleton]    │                         │
│  [Poll every 500ms]       │                     Probing image...
│  └─GET :id/image ────────┤                     (1-3 seconds)
│    status: processing      │                         │
│  [Keep polling...]        │                         │
│  └─GET :id/image ────────┤                         │
│    status: processing      │                         │
│  [Keep polling...]        │                     Probe complete
│  └─GET :id/image ────────┤                         │
│    status: complete       │                         │
│  ◄─{stage: 'image',      │                         │
│     status: 'complete',  │                         │
│     data: {             │                         │
│       imageProbe: {     │                         │
│         width: 1200,    │                         │
│         height: 630     │                         │
│       }                │                         │
│     }}                 │                         │
│  [Render images]         │                         │
│  [Crossfade effect]      │                         │
│                         │                         │
│  [All stages complete]    │                         │
│  [Enable exports]         │                         │
```

## SSE Stream Flow

```
Client                    Server                    Processing
│                         │                         │
├─POST /api/inspect──────┤                         │
│  {url: "example.com"}   │                         │
│                         ├─Create inspectionId     │
│  ◄─{inspectionId}──────┤                         │
│                         │                         │
├─GET /api/inspect/:id/stream ────────────────────┤
│  [Open SSE connection]   │                     Start fetch...
│  [Show skeleton grid]    │                         │
│                         │                         │
│  ◄─event: stage          │                     Fetch complete
│     data: {              │                         │
│       stage: 'fetch',    │                         │
│       status: 'complete'│                         │
│     }                    │                         │
│  [Update status indicator]                        │
│                         │                     Parse HTML...
│                         │                         │
│  ◄─event: stage          │                     Parse complete
│     data: {              │                         │
│       stage: 'meta',     │                         │
│       status: 'complete',│                         │
│       data: {           │                         │
│         meta: {...}    │                         │
│       }                 │                         │
│     }                    │                         │
│  [Render text cards]     │                     Start image probe...
│  [Update summary bar]    │                         │
│                         │                         │
│  ◄─event: stage          │                         │
│     data: {              │                         │
│       stage: 'score',    │                     Score complete
│       status: 'complete',│                         │
│       data: {           │                         │
│         scoring: {...}  │                         │
│       }                 │                         │
│     }                    │                         │
│  [Update letter grades]  │                         │
│                         │                     Probing image...
│                         │                     (this takes time)
│  ◄─event: stage          │                         │
│     data: {              │                         │
│       stage: 'image',   │                         │
│       status: 'processing',│                        │
│       progress: 0.3     │                         │
│     }                    │                         │
│  [Show progress on cards]│                         │
│                         │                         │
│  ◄─event: stage          │                         │
│     data: {              │                     Still probing...
│       stage: 'image',   │                         │
│       status: 'processing',│                        │
│       progress: 0.7     │                         │
│     }                    │                         │
│  [Update progress]       │                         │
│                         │                         │
│  ◄─event: stage          │                     Probe complete
│     data: {              │                         │
│       stage: 'image',   │                         │
│       status: 'complete',│                        │
│       data: {           │                         │
│         imageProbe: {  │                         │
│           width: 1200, │                         │
│           height: 630  │                         │
│         }              │                         │
│       }                │                         │
│     }                    │                         │
│  [Render images]         │                         │
│  [Crossfade effect]      │                         │
│                         │                         │
│  ◄─event: complete       │                         │
│     data: {              │                         │
│       inspectionId,     │                         │
│       timestamp         │                         │
│     }                    │                         │
│  [Enable exports]        │                         │
│  [Close SSE connection]  │                         │
```

## Error Recovery Flow

```
Client                    Server                    Processing
│                         │                         │
├─GET /api/inspect/:id/image ─────────────────────┤
│  [Third attempt]         │                         │
│                         │                     Image probe timeout
│                         │                     (server slow)
│  ◄─{stage: 'image',      │                         │
│     status: 'error',    │                         │
│     error: 'Timeout',   │                         │
│     recoverable: true   │                         │
│     }                    │                         │
│  [Show warning badge]    │                         │
│  [Keep other stages]      │                         │
│  [Add to diagnostics]     │                         │
│  [Offer retry button]     │                         │
│                         │                         │
│  [User clicks retry]      │                         │
│  └─POST /api/inspect/:id/retry  ───────────────────┤
│     {stage: 'image'}      │                         │
│                         ├─Retry image probe ───────┤
│  [Wait...]               │                         │
│                         │                     Probe succeeds
│  ◄─{stage: 'image',      │                         │
│     status: 'complete',  │                         │
│     data: {             │                         │
│       imageProbe: {...} │                         │
│     }                    │                         │
│     }                    │                         │
│  [Remove warning badge]  │                         │
│  [Render images]         │                         │
```

## Timeline Visualization

```
Time:    0ms    300ms   600ms   900ms   1200ms  1500ms  3000ms
         │      │       │       │       │       │       │
Client:  │POST  │GET    │Render │GET    │Poll   │Poll   │Render
         │inspect│meta   │meta   │image  │image  │image  │images
         │      │       │cards  │       │       │       │
         │      │       │       │       │       │       │
Server:  │Create│Parse  │Return │Start  │Return │       │Complete
         │ID    │HTML   │meta   │probe  │processing│ │image
         │      │       │       │       │       │       │
External:│      │Fetch  │       │       │HEAD   │Download│Done
         │      │URL    │       │       │image  │bytes  │
         │      │       │       │       │       │       │
UI:      │Show  │       │Text   │Image  │       │       │Images
         │skeleton│       │cards  │shimmer│       │       │fade in
         │grid  │       │       │       │       │       │
```

## State Machine

```
                    ┌──────────────┐
                    │   Initial    │
                    │  (skeleton)  │
                    └──────┬───────┘
                           │
                    POST /api/inspect
                           │
                           ▼
                    ┌──────────────┐
                    │   Fetching   │◄─────┐
                    │   (spinner)  │      │
                    └──────┬───────┘      │
                           │              │
                    Fetch complete       │
                           │              │
                ┌──────────┴──────────┐  │
                │                     │  │
                ▼                     │  │
         ┌──────────────┐            │  │
         │  Meta Ready  │            │  │
         │(text cards)  │            │  │
         └──────┬───────┘            │  │
                │                    │  │
          Score complete             │  │
                │                    │  │
         ┌──────┴───────┐            │  │
         │              │            │  │
         ▼              ▼            │  │
    ┌─────────┐  ┌──────────┐       │  │
    │Partial  │  │  Image   │       │  │
    │Complete │  │Pending   │       │  │
    │(score   │  │(shimmer) │       │  │
    │shown)   │  └─────┬────┘       │  │
    └────┬────┘        │            │  │
         │             │            │  │
         │        Image processing  │  │
         │             │            │  │
         │        ┌────┴────┐       │  │
         │        │         │       │  │
         │        ▼         ▼       │  │
         │   ┌────────┐ ┌────────┐ │  │
         │   │Complete│ │ Error  │ │  │
         │   │(images ││(retry │ │  │
         │   │rendered)││button) │ │  │
         │   └───┬────┘ └───┬────┘ │  │
         │       │          │      │  │
         │       └──────────┘      │  │
         │              │           │  │
         └──────────────┘           │  │
                │                   │  │
                ▼                   │  │
         ┌──────────────┐           │  │
         │   Complete   │───────────┘  │
         │(all stages)  │              │
         └──────────────┘              │
                                        │
                              Fatal error
                                        │
                                        ▼
                              ┌──────────────┐
                              │    Error     │
                              │ (retry/cancel)│
                              └──────────────┘
```
