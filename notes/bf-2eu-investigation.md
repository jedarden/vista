# Investigation: vista deployment manifests and ArgoCD sync status

## Task Objectives
Deploy vista via ArgoCD on apexalgo-iad cluster with domain vista.jedarden.com.

## Current State

### Manifests Status ✅
All K8s manifests exist and are properly configured in `~/declarative-config/k8s/apexalgo-iad/vista/`:
- `namespace.yml` - vista namespace with argocd label
- `deployment.yml` - 3 replicas, ghcr.io/jedarden/vista:1.0.5, proper resources and security
- `service.yml` - ClusterIP on port 8080 targeting port 3000
- `infressroute.yml` - Traefik IngressRoute with external-dns annotations for vista.jedarden.com

Latest commit: `b3144ab fix(vista/apexalgo-iad): repoint image to pullable GHCR registry`

### Deployment Status on Cluster ⚠️
The vista namespace exists on apexalgo-iad but deployment is OUTDATED:

**Current (Wrong):**
- Image: `ronaldraygun/vista:latest`
- Replicas: 1
- Labels: `app: vista`
- Health check: `/health`
- Memory limit: 256Mi
- ImagePullPolicy: Always

**Expected (from manifest):**
- Image: `ghcr.io/jedarden/vista:1.0.5`
- Replicas: 3
- Labels: `app.kubernetes.io/name: vista`
- Health check: `/`
- Memory limit: 512Mi
- ImagePullPolicy: IfNotPresent

**Pod Status:**
- vista-5d5f9dc954-7mzng: ImagePullBackOff (13h old)
- vista-7d87bd66df-q92hq: Running (8h old)

### ArgoCD Sync Status ❌
**CRITICAL ISSUE:** ArgoCD sync is broken for apexalgo-iad cluster.

1. **API Access:** ArgoCD read-only API at `https://argocd-ro-ardenone-manager-ts.ardenone.com:8444` is not responding to queries
2. **Cluster Registration:** Memory mentions "apexalgo-iad ArgoCD sync broken (x509 in cluster-registration)"
3. **Access Constraints:**
   - Observer serviceaccount only has read-only access
   - No write kubeconfigs exist for apexalgo-iad
   - Available kubeconfigs: iad-acb.kubeconfig, iad-ci.kubeconfig only
   - CLAUDE.md mentions ardenone-manager, rs-manager, iad-options kubeconfigs but they don't exist on disk

4. **Manual Apply Blocked:** Cannot manually apply manifests via kubectl due to Forbidden errors from observer serviceaccount

### Ingress Configuration ✅
IngressRoute is properly configured with external-dns annotations:
- Host: `vista.jedarden.com`
- CNAME target: Cloudflare tunnel `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
- TLS: LetsEncrypt certResolver
- External DNS will automatically create CNAME record

## Blockers

### Primary Blocker: ArgoCD Sync Broken
- apexalgo-iad cluster not syncing due to x509 cluster registration issue
- This is a known issue documented in memory
- Requires operator/cluster-admin intervention to fix cluster registration
- Without ArgoCD sync, deployment cannot be updated

### Secondary Blocker: No Write Access
- No write kubeconfig available for apexalgo-iad
- Observer serviceaccount is read-only
- Cannot manually apply manifests to fix deployment

## What Needs to Happen

### To Complete This Task:
1. **Fix ArgoCD cluster registration** - Requires operator access to fix x509 issue for apexalgo-iad
2. **Trigger ArgoCD sync** - Once cluster is registered, ApplicationSet should auto-discover and sync vista manifests
3. **Verify deployment** - Confirm pod runs with correct image (ghcr.io/jedarden/vista:1.0.5)
4. **Test DNS** - Confirm vista.jedarden.com resolves and routes correctly

### Alternative Path (if ArgoCD cannot be fixed):
1. **Obtain write kubeconfig** for apexalgo-iad cluster
2. **Manually apply manifests** from declarative-config
3. **Monitor for ImagePullBackOff** - GHCR image `ghcr.io/jedarden/vista:1.0.5` must be accessible (may need imagePullSecret if private)
4. **Configure ArgoCD sync** - Set up proper cluster registration once write access is available

## Memory References
- `apexalgo-iad-argocd-sync-broken.md` - documents x509 cluster-registration issue
- `vista-image-fix-in-gitops.md` - documents GHCR image repoint (b3144ab)

## Conclusion
This task is **blocked by infrastructure issues**:
1. ArgoCD cluster registration is broken (x509 error)
2. No write access to apexalgo-iad cluster
3. Cannot manually apply manifests or fix deployment

The manifests are **ready and correct**, but cannot be deployed without:
- Either fixing the ArgoCD cluster registration issue, OR
- Obtaining write access to apply manifests manually

This requires **cluster-operator intervention** to resolve.
