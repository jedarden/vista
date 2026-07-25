# ArgoCD Sync Verification for Vista (bf-2o6ao)

**Date:** 2026-07-24
**Cluster:** apexalgo-iad
**Application:** vista

## Summary

❌ **ArgoCD sync is NOT working** - Known x509 certificate issue prevents communication
✅ **Kubernetes resources exist** - All resources deployed (but outdated vs. current manifests)
⚠️ **Configuration drift detected** - Running deployment does not match current manifests

## ArgoCD Application Status

**Application:** `vista-ns-apexalgo-iad` (managed by ApplicationSet `manifest-appset-apexalgo-iad`)

- **Sync Status:** `Unknown` ⚠️
- **Health Status:** `Healthy`
- **Last Sync Attempt:** 2026-07-18 15:08:57Z (FAILED)

### Blocking Error

```
tls: failed to verify certificate: x509: certificate signed by unknown authority
```

**Impact:** ArgoCD cannot communicate with apexalgo-iad cluster to sync or verify resources. This is a known cluster-registration issue affecting ALL apexalgo-iad applications.

### Last Sync Operation (2026-07-18)

All resources failed to sync with the same x509 error:
- `namespace/vista` - SyncFailed
- `deployment/vista` - SyncFailed
- `service/vista` - SyncFailed
- `ingressroute/vista` - SyncFailed
- `ingressroute/vista-ingressroute` - SyncFailed
- `certificate/vista-service-cert` - SyncFailed

## Kubernetes Resources on apexalgo-iad

### ✅ Resources Exist

All resources are deployed and present:

| Resource | Status | Age |
|----------|--------|-----|
| namespace/vista | Active | 131d |
| deployment/vista | 1/1 ready | 131d |
| service/vista | ClusterIP 10.21.64.133 | 131d |
| ingressroute/vista | Active | 131d |
| ingressroute/vista-ingressroute | Active | 51d |

### Pod Status

| Pod | Status | Age |
|-----|--------|-----|
| vista-7d87bd66df-q92hq | Running | 9h |
| vista-5d5f9dc954-7mzng | ImagePullBackOff | 13h |

One pod is running successfully. The ImagePullBackOff pod is from an older replicaset and will be cleaned up by the deployment controller.

## ⚠️ Configuration Drift

The running deployment does **NOT** match the current manifests in declarative-config:

| Setting | Manifest (declarative-config) | Running (apexalgo-iad) |
|---------|------------------------------|------------------------|
| Image | `ronaldraygun/vista:1.0.5` | `ronaldraygun/vista:latest` |
| Replicas | `3` | `1` |

**Root Cause:** ArgoCD cannot sync changes due to x509 certificate error, so the cluster retains the old configuration from the last successful sync.

## Acceptance Criteria Assessment

| Criteria | Status | Notes |
|----------|--------|-------|
| ArgoCD shows vista application synced | ❌ FAILED | Shows `Unknown` - x509 certificate error |
| namespace/vista exists | ✅ PASS | Active, 131d old |
| deployment/vista exists | ✅ PASS | 1/1 ready, but outdated |
| service/vista exists | ✅ PASS | ClusterIP, 131d old |
| ingressroute/vista exists | ✅ PASS | 2 IngressRoutes present |
| Pod status shows Attempted or Running | ⚠️ PARTIAL | 1 Running, 1 ImagePullBackOff |
| No ArgoCD sync errors | ❌ FAILED | x509 certificate errors |

## Conclusion

The vista manifests were successfully pushed to declarative-config (Child 2 completed), but **ArgoCD cannot sync them to apexalgo-iad** due to a cluster-level x509 certificate registration issue. This affects ALL applications on apexalgo-iad, not just vista.

The Kubernetes resources exist and are functional, but they are running outdated configuration (ronaldraygun/vista:latest, replicas: 1) instead of the current manifest specification (ronaldraygun/vista:1.0.5, replicas: 3).

## Resolution Path

To fully sync vista manifests, the apexalgo-iad cluster registration issue must be resolved (this requires operator-level access to ArgoCD cluster secrets, which is not available on this server). See memory note: `apexalgo-iad-argocd-sync-broken.md`.

Once ArgoCD can communicate with apexalgo-iad:
1. The application will auto-sync (automated prune enabled)
2. Deployment will update to ronaldraygun/vista:1.0.5
3. Replicas will scale to 3
4. Configuration drift will be resolved
