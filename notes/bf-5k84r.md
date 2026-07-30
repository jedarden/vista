# Vista Deployment Verification (bf-5k84r)

## Date: 2026-07-24

## Summary
Verified vista deployment in apexalgo-iad cluster. Found critical issues preventing application accessibility.

## Findings

### ✅ Working Components:
- **Pod Status**: vista-7d87bd66df-q92hq is Running and Ready (using ghcr.io/jedarden/vista:1.0.0)
- **Service**: vista ClusterIP service exists at 10.21.64.133:3000
- **Endpoints**: Service has endpoint pointing to running pod at 10.20.98.23:3000
- **IngressRoute**: vista-ingressroute configured for vista.ardenone.com with TLS and auth middleware

### ❌ Critical Issues:

#### 1. Image Pull Issue
- Deployment spec: `ronaldraygun/vista:latest`
- New replicaset (51d old): vista-5d5f9dc954 - **ImagePullBackOff**
- Old replicaset (131d old): vista-7d87bd66df - Running with `ghcr.io/jedarden/vista:1.0.0`
- ArgoCD sync is broken (known issue) - deployment not synced to cluster

#### 2. Application Not Responding
- Direct curl to pod IP (10.20.98.23:3000): **TIMED OUT**
- Direct curl to service IP (10.21.64.133:3000): **TIMED OUT**
- Public HTTPS via Cloudflare: **HTTP 500** with OAuth redirect
- Phone browser test: **ERR_CONNECTION_CLOSED**

#### 3. IngressRoute Status
- Status field empty - may not be actively routing traffic
- No Traefik status available to confirm routing

## Root Cause Analysis
The pod shows as "Running" but the application is not responding on port 3000. Possible causes:
- Application crashed after startup
- Application listening on wrong interface/port
- Missing configuration or environment variables
- Resource exhaustion
- Database dependency issue

## Recommendations
1. Check pod logs for application errors
2. Verify application configuration (environment variables, config maps)
3. Check resource constraints (CPU/memory)
4. Verify database connectivity if applicable
5. Fix image pull issue - sync deployment with ArgoCD or manually update
6. Consider rolling back to known working image if recent deployment broke functionality

## Next Steps
- Investigate why application inside pod is not responding
- Check if this is recent regression (pod has been running for 10h)
- Fix ArgoCD sync issue to properly manage deployments
