# Bead bf-4bw: Verify vista deployment on apexalgo-iad

**Date:** 2026-07-21
**Result: ⚠️ PARTIAL — user-facing endpoint works, but ArgoCD sync is broken and the deployment is in a failed rollout. Criteria NOT all met; bead left open.**

## Acceptance criteria verdict

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | ArgoCD app `vista` is Synced | ❌ **FAIL** | Sync = `Unknown`, `ComparisonError`, last op `Failed`. ArgoCD **cannot reach** apexalgo-iad. |
| 2 | Deployment pods Running | ⚠️ **DEGRADED** | 1 pod Running (legacy image) + 1 pod `ImagePullBackOff`. Deployment condition `ProgressDeadlineExceeded`. |
| 3 | Service via cluster-internal DNS | ✅ PASS | `svc/vista` 10.21.64.133, 1 healthy endpoint 10.20.92.160:3000. |
| 4 | IngressRoute working | ✅ PASS | vista.jedarden.com → CF tunnel → traefik websecure → svc → pod. |
| 5 | vista.jedarden.com responds with app | ✅ PASS | `GET https://vista.jedarden.com/` → **HTTP 200**, serves VISTA HTML. |

**3 of 5 pass.** The user-facing service works, but the deployment underneath is broken and fragile.

## Root cause

**ArgoCD has lost connectivity to the apexalgo-iad cluster**, so it cannot reconcile live state:

```
APP: vista-ns-apexalgo-iad
  SYNC: Unknown | HEALTH: Healthy
  source: declarative-config @ HEAD  path: k8s/apexalgo-iad/vista   ← correct
  cond: ComparisonError - Failed to load live state: failed to get cluster info
        for "https://hcp-99476ebb-…spot.rackspace.com": error synch…
  cond: ComparisonError - Failed to load target state: failed to get cluster version
  lastOp phase: Failed — one or more synchronization tasks are not valid (retried 2 times)
```

Because ArgoCD cannot reach the cluster, nothing it declares is enforced. The live cluster has drifted heavily from git:

| Aspect | Desired (git: vista/k8s/ == declarative-config/k8s/apexalgo-iad/vista/, both committed) | Live cluster |
|---|---|---|
| image | `ronaldraygun/vista:1.0.5` | template `ronaldraygun/vista:latest`; **running pod is `ghcr.io/jedarden/vista:1.0.0`** |
| replicas | 3 | 1 (spec) / 2 actual (1 running + 1 stuck) |
| service port | 8080 → 3000 | 3000 → 3000 |
| service selector | `app.kubernetes.io/name: vista` | `app=vista` |
| IngressRoute svc port | 8080 | 3000 |

## Deployment state (the fragility)

```
kubectl -n vista get pods
vista-5d5f9dc954-mrksg   0/1   ImagePullBackOff   13h   (NewReplicaSet, current revision)
vista-7d87bd66df-g6tvh   1/1   Running             8h    (OldReplicaSet, legacy image)

deployment conditions:
  Available   True   MinimumReplicasAvailable
  Progressing False  ProgressDeadlineExceeded     ← FAILED rollout
```

- The **current** deployment template (`ronaldraygun/vista:latest`) cannot be pulled: `"pull access denied, repository does not exist or may require authorization"`. The `ronaldraygun/vista` DockerHub repo returns 404 for every tag probed (1.0.5, latest, 1.0.21) — it appears unpullable.
- vista.jedarden.com only serves because the **old** replicaset's pod (`ghcr.io/jedarden/vista:1.0.0`, a different registry entirely) is still alive.
- **Risk:** that single legacy pod is the only thing keeping vista up. A pod restart or node drain (cluster has shown `NodeNotReady` + calico errors in the last hour) would take vista down, since the new image cannot be pulled.
- Registry inconsistency is compounding: git wants DockerHub `ronaldraygun/vista`, the CI template pushes `ronaldraygun/vista`, but the only working image is GHCR `ghcr.io/jedarden/vista`.

## What I could and could not do

- **Could:** read-only inspection of apexalgo-iad (proxy), ArgoCD Application CRs (ardenone-manager proxy), declarative-config source, the external endpoint, DockerHub.
- **Could not:** apexalgo-iad is **read-only** (no fix to deployment/pods possible); ArgoCD RO HTTPS API host (`argocd-ro-ardenone-manager-ts.ardenone.com`) does **not resolve via DNS** from this host, so the documented RO endpoint was unreachable — Application CRs were instead read via the kubectl proxy.
- **Remediation requires write access / operator action**, out of scope for this verification.

## Required remediation (for an operator with write access)

1. **Restore ArgoCD → apexalgo-iad connectivity** (root cause). The cluster endpoint `hcp-99476ebb-….spot.rackspace.com` is unreachable from ArgoCD; fix the cluster registration/credential/networking so sync status leaves `Unknown`.
2. **Make `ronaldraygun/vista:1.0.5` pullable** (or repoint the manifest to a registry that works — note the working image is on GHCR `ghcr.io/jedarden/vista`). Currently `ronaldraygun/vista` is unpullable, which is why the rollout is stuck.
3. **Trigger an ArgoCD sync** once the above are fixed; prune the stuck `ImagePullBackOff` replicaset.
4. **Address node instability** on apexalgo-iad (`NodeNotReady`, calico `connection refused` events observed).

## Conclusion

vista.jedarden.com is live and serving (HTTP 200), but the deployment is **not verified-healthy**: ArgoCD sync is broken (Unknown/Failed, cluster unreachable) and the rollout has failed (`ProgressDeadlineExceeded`), surviving only on a single legacy pod. Acceptance criteria 1 and 2 are not satisfied; the bead is therefore **not closed**.
