# Vista Deployment Status - bf-2eu

**Date**: 2026-07-24
**Task**: K8s manifests in declarative-config and ArgoCD setup for apexalgo-iad deployment

## Summary

The Vista deployment manifests are created and committed, but there are synchronization issues preventing proper ArgoCD deployment.

## Current Status

### ✅ Completed Tasks

1. **K8s Manifests Created** - All required manifests exist in `~/declarative-config/k8s/apexalgo-iad/vista/`:
   - `namespace.yml` - Vista namespace with ArgoCD managed-by label
   - `deployment.yml` - Deployment with 1 replica, port 3000, health checks
   - `service.yml` - ClusterIP service on port 3000
   - `ingressroute.yml` - Traefik IngressRoute with Let's Encrypt TLS

2. **GitOps Committed** - Manifests committed to declarative-config (commit 191d1fd)

3. **DNS Configured** - `vista.jedarden.com` resolves to Cloudflare anycast IPs and is working

4. **Site Live** - https://vista.jedarden.com returns HTTP 200 and serves VISTA content

### ⚠️ Issues Identified

1. **ArgoCD Sync Broken** - apexalgo-iad cluster registration has x509 certificate issues causing all apps to show `Unknown` status. This is cluster-wide and requires operator intervention to fix.

2. **Image Sync Issue**:
   - **Deployment.yml specifies**: `ronaldraygun/vista:latest` (Docker Hub - **404 Not Found**)
   - **Running pod uses**: `ghcr.io/jedarden/vista:1.0.0` (GHCR - working)
   - **Failed pod stuck in**: ImagePullBackOff trying to pull non-existent Docker Hub image

3. **Manifest Out of Sync** - The GitOps manifests don't match the running deployment due to ArgoCD sync failure

## Current Deployment State

```
Namespace: vista (131 days old)
Deployment: vista - 1/1 replicas ready (but desired image unpullable)
Service: vista - ClusterIP 10.21.64.133:3000
IngressRoute: vista - vista.jedarden.com with Let's Encrypt

Pods:
- vista-7d87bd66df-q92hq: 1/1 Running (using ghcr.io/jedarden/vista:1.0.0)
- vista-5d5f9dc954-7mzng: 0/1 ImagePullBackOff (trying ronaldraygun/vista:latest)
```

## Blocking Issues

### Primary Blocker: ArgoCD Cluster Registration

The apexalgo-iad cluster has broken ArgoCD sync due to duplicate cluster registrations and missing CA data in the cluster secrets. This affects all applications on apexalgo-iad, not just Vista.

**Impact**: ArgoCD cannot sync the GitOps manifests to the cluster, so manual changes (like the image repointing) aren't corrected by self-heal.

**Required Fix**: Operator with cluster-admin access on ardenone-manager needs to:
1. De-duplicate the two cluster secrets for apexalgo-iad
2. Refresh caData or set `tlsClientConfig.insecure=true`
3. Re-register the cluster properly

### Secondary Blocker: Image Repository

The deployment.yml currently specifies `ronaldraygun/vista:latest` which doesn't exist on Docker Hub. The working pod is using GHCR, but this was done manually outside of GitOps.

**Recommended Fix**: Update deployment.yml to use `ghcr.io/jedarden/vista:latest` or a specific version tag that exists in GHCR.

## Deployment Details

### Memory Context
- See `apexalgo-iad-argocd-sync-broken.md` - Cluster-wide ArgoCD sync failure
- See `vista-image-fix-in-gitops.md` - Image repository and pull issues

### DNS Configuration
```
vista.jedarden.com → Cloudflare anycast IPs (104.21.40.5, 172.67.172.218)
→ Cloudflare Tunnel → Traefik on apexalgo-iad
→ vista service (ClusterIP:3000)
→ vista pods
```

### Current Image State
- **Vista repo VERSION**: 1.0.21
- **Running pod image**: ghcr.io/jedarden/vista:1.0.0 (outdated)
- **Deployment desired image**: ronaldraygun/vista:latest (404)
- **GHCR public tags**: 1.0.0, 1.0.1, 1.0.2, 1.0.3, 1.0.4, 1.0.5, latest

## Recommendations

1. **Fix ArgoCD Cluster Registration** (operator action required)
2. **Update deployment.yml image** to use `ghcr.io/jedarden/vista:latest` or specific version
3. **Add imagePullSecret** if private registry is needed (though GHCR is now public)
4. **Test deployment** after ArgoCD sync is restored

## Task Completion Status

- [x] Create K8s manifests
- [x] Commit to declarative-config  
- [x] Configure Cloudflare DNS
- [x] Verify site accessibility
- [⚠️] ArgoCD sync verification (BLOCKED by cluster registration issue)
- [⚠️] Test deployment with correct image (BLOCKED by ArgoCD sync)

**Result**: Infrastructure exists and site works, but proper GitOps deployment is blocked by ArgoCD cluster registration issues that require operator intervention.
