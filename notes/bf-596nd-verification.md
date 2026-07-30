# ArgoCD Sync Verification for vista (bf-596nd)

**Date:** 2026-07-24  
**Task:** Push manifests and verify ArgoCD sync for vista application on apexalgo-iad

## Summary

The manifests were already committed and pushed to declarative-config. The vista application exists in ArgoCD, but **sync is blocked** by a cluster-wide x509 certificate issue affecting all apexalgo-iad applications.

## Verification Results

### ✅ Manifests Pushed
- **Status:** COMPLETE
- **Details:** Manifests are committed and pushed to `declarative-config` main branch
- **Latest Commit:** `191d1fd` - "fix(vista): simplify deployment - use latest tag, standard labels, port 3000" (2026-07-24 22:04:18)
- **Files Present:**
  - `k8s/apexalgo-iad/vista/namespace.yml`
  - `k8s/apexalgo-iad/vista/deployment.yml`
  - `k8s/apexalgo-iad/vista/service.yml`
  - `k8s/apexalgo-iad/vista/ingressroute.yml`

### ✅ Application Discovered by ArgoCD
- **Status:** COMPLETE
- **Application Name:** `vista-ns-apexalgo-iad`
- **Source:** https://github.com/jedarden/declarative-config
- **Path:** k8s/apexalgo-iad/vista
- **Target Revision:** HEAD
- **Auto-discovery:** Working via ApplicationSet `manifest-appset-apexalgo-iad`

### ❌ Application Sync Status
- **Health Status:** Healthy ✅
- **Sync Status:** Unknown ❌
- **Last Operation:** Failed
- **Error Message:** "one or more synchronization tasks are not valid (retried 2 times)"

## Root Cause Analysis

The sync failure is **NOT vista-specific** - it affects **all apexalgo-iad applications** (61 applications total, all showing `sync=Unknown`).

### Cluster-wide Issue
According to `memory/apexalgo-iad-argocd-sync-broken.md`:

1. **Duplicate Cluster Registration:** The apexalgo-iad endpoint is registered **twice** in ArgoCD:
   - `cluster-apexalgo-iad`
   - `cluster-hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com-3689407595`
   
2. **Missing CA Certificate:** Both registrations have **no `caData`**, likely after a Rackspace HCP control-plane certificate rotation

3. **x509 Certificate Error:** ArgoCD cannot establish a trusted connection to the apexalgo-iad cluster

## Live Deployment Status

Despite ArgoCD sync issues, the vista application **is deployed and running**:

```bash
# Deployment exists and healthy
$ kubectl --server=http://traefik-apexalgo-iad:8001 get deployments -n vista
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
vista   1/1     1            1           131d

# Namespace exists
$ kubectl --server=http://traefik-apexalgo-iad:8001 get namespace vista
NAME    STATUS   AGE
vista   Active   131d
```

## Remediation Required

This issue **cannot be fixed from this host** due to access limitations:

- **No write kubeconfig:** `~/.kube/ardenone-manager.kubeconfig` does not exist (only `iad-ci.kubeconfig` and `iad-acb.kubeconfig` exist)
- **Read-only access:** Only read-only proxy access to ardenone-manager via `traefik-ardenone-manager:8001`
- **Cluster secret not in GitOps:** The ArgoCD cluster registration secrets are not managed in `declarative-config`

### Required Operator Actions

An infrastructure operator needs to perform **one** of the following on ardenone-manager in the `argocd` namespace:

**Option 1:** De-duplicate and fix CA certificate
```bash
# Delete one of the duplicate cluster secrets
kubectl delete secret cluster-hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com-3689407595 -n argocd

# Update the remaining secret with current CA data
kubectl patch secret cluster-apexalgo-iad -n argocd --type='json' \
  -p='[{"op":"add","path":"/data/ca","value":"<BASE64_CA_CERT>"}]'
```

**Option 2:** Allow insecure connection (temporary workaround)
```bash
kubectl patch secret cluster-apexalgo-iad -n argocd --type='json' \
  -p='[{"op":"add","path":"/data/tlsClientConfig.insecure","value":"true"}]'
```

**Option 3:** Re-register the cluster
```bash
argocd cluster add apexalgo-iad --name apexalgo-iad --insecure=true
```

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| Manifests pushed to declarative-config main branch | ✅ COMPLETE | Committed 2026-07-24 22:04:18 |
| ArgoCD shows the vista application | ✅ COMPLETE | `vista-ns-apexalgo-iad` discovered |
| Application status shows 'Synced' or 'Healthy' | ⚠️ PARTIAL | Health=Healthy, Sync=Unknown (cluster issue) |
| No sync errors in ArgoCD | ❌ BLOCKED | "one or more synchronization tasks are not valid" |

## Conclusion

The vista manifests are successfully deployed in GitOps and discovered by ArgoCD. However, the application cannot sync due to a **cluster-wide x509 certificate issue** affecting all apexalgo-iad applications. This requires operator intervention to fix the ArgoCD cluster registration secrets on ardenone-manager.

**Bead Status:** PARTIAL - GitOps deployment complete, but ArgoCD sync verification blocked by infrastructure issue.
