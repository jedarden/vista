# Bead bf-4uye: Rate Limiting Already Applied

## Status: ALREADY COMPLETE

The task requested applying rate limiting to `/api/badge`, `/api/preview`, `/api/compare`, and `/api/sitemap`. However, **all of these endpoints already have rate limiting applied**.

## Current State

As of the current codebase (commit 9c7d584, July 26, 2026, bead bf-8c39):

1. **`/api/preview`** (GET/POST) - Lines 121, 157: Rate limited with `RATE_LIMIT_PREVIEW` (30/hr)
2. **`/api/compare`** (GET) - Line 1136: Rate limited with `RATE_LIMIT_PREVIEW` (30/hr)
3. **`/api/badge`** (GET) - Line 1055: Rate limited with `RATE_LIMIT_PREVIEW` (30/hr) for URL mode only
4. **`/api/sitemap`** (GET) - Line 425: Rate limited with `RATE_LIMIT_SITEMAP` (5/hr)

All endpoints use the `rateLimited()` helper wrapper which calls `checkRateLimit()` from `src/rate-limit.js` and returns HTTP 429 with the standard error shape when limits are exceeded.

## Implementation Details

The rate limiting implementation follows the pattern used in the screenshot endpoints:

```javascript
function rateLimited(req, res, limit, namespace) {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const check = checkRateLimit(clientIp, limit, namespace);
  if (!check.allowed) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: 3600,
    });
    return true;
  }
  return false;
}
```

Rate limits per endpoint:
- **Preview endpoints** (including `/api/compare` and `/api/badge` URL mode): 30 requests/hour per IP
- **Sitemap endpoint**: 5 requests/hour per IP (stricter limit due to higher cost)

## Conclusion

No changes needed. The work requested in bead bf-4uye was already completed in bead bf-8c39.
