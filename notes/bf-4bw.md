# Bead bf-4bw: Verify vista deployment on apexalgo-iad

**Date (attempt 2):** 2026-07-21  ·  **Result: ⚠️ STILL PARTIAL — 3/5 criteria pass; 2 fail, blocked on operator/infra action. Bead left open.**

This is a re-verification. The prior attempt (commit `9d02255`, earlier today) reached the same PARTIAL verdict. **No operator remediation has occurred since** — both blockers are unchanged. This note refines the root cause with freshly-confirmed evidence and adds new findings (nodes healthy; duplicate IngressRoute; GitOps source confirmed).

## Acceptance criteria verdict

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | ArgoCD app `vista` is Synced | ❌ **FAIL** | `sync=Unknown`, `health=Healthy`, `ComparisonError` — ArgoCD controller **cannot reach** apexalgo-iad. |
| 2 | Deployment pods Running | ❌ **FAIL** | 1 pod `ImagePullBackOff` (current RS) + 1 legacy pod Running. Deploy condition `Progressing=False … timed out`. |
| 3 | Service via cluster-internal DNS | ✅ PASS | `svc/vista` ClusterIP 10.21.64.133:3000; 1 healthy endpoint 10.20.92.160:3000. |
| 4 | IngressRoute working | ✅ PASS | vista.jedarden.com → CF tunnel → traefik websecure → svc → pod. |
| 5 | vista.jedarden.com responds with app | ✅ PASS | `GET https://vista.jedarden.com/` → **HTTP 200**, serves VISTA HTML. |

**3 of 5 pass.** The user-facing service is live and correct, but the deployment underneath it is broken and fragile.

## Blocker 1 — ArgoCD cannot reach apexalgo-iad (criterion 1)

```
APP: vista-ns-apexalgo-iad   sync=Unknown  health=Healthy
  lastOp: Failed — "one or more synchronization tasks are not valid (retried 2 times)"
  cond: ComparisonError — Failed to load live state: failed to get cluster info for
        "https://hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com"
  cond: ComparisonError — Failed to load target state: failed to get cluster version
  cond: UnknownError  — failed to get server version: Get "…spot.rackspace.com/version?timeout…"
```

ArgoCD's controller (on ardenone-manager) cannot reach the apexalgo-iad API server endpoint `hcp-99476ebb-….spot.rackspace.com`. Because the cache won't synchronize, sync status is stuck at `Unknown` and **nothing ArgoCD declares is enforced.** The Application CR itself is correctly pointed at `declarative-config` `k8s/apexalgo-iad/vista/` — the failure is transport/credential, not manifest.

> The read-only `kubectl-proxy` reaches apexalgo-iad fine (that's how all live data below was gathered), so the cluster API *is* up — the problem is specifically ArgoCD's direct registration/connection to it.

## Blocker 2 — image unpullable → rollout failed (criterion 2)

The image story is a **three-way split**, every leg of which is broken:

| Source | Declared image | Pullable? |
|---|---|---|
| GitOps source-of-truth: `declarative-config/k8s/apexalgo-iad/vista/deployment.yml` | `ronaldraygun/vista:1.0.5`, replicas 3 | ❌ DockerHub repo **404** |
| Live Deployment template (apexalgo-iad) | `ronaldraygun/vista:latest` | ❌ DockerHub repo **404** |
| Survivor pod (only thing serving traffic) | `ghcr.io/jedarden/vista:1.0.0` | ✅ (different registry entirely) |

```
kubectl -n vista get pods
vista-5d5f9dc954-mrksg   0/1   ImagePullBackOff   (current RS, wants ronaldraygun/vista:latest)
vista-7d87bd66df-g6tvh   1/1   Running            (old RS,   ghcr.io/jedarden/vista:1.0.0)

deploy vista: READY 1/1  UP-TO-DATE 1  AVAILABLE 1
  Available   = True   MinimumReplicasAvailable
  Progressing = False  ReplicaSet "vista-5d5f9dc954" has timed out progressing   ← FAILED rollout
```

DockerHub confirms the `ronaldraygun/vista` repo does not exist — every tag probed (`1.0.5`, `latest`, `1.0.21`, `1.0.0`) returns **404** on the hub API. So both the desired (`:1.0.5`) and the live (`:latest`) references are unresolvable. The `vista-build` CI template is configured to push to `ronaldraygun/vista`, but that push has evidently never produced a reachable image — the only working artifact lives on **GHCR** (`ghcr.io/jedarden/vista`), a registry the manifest doesn't reference.

**Risk:** vista.jedarden.com survives solely on the single 127-day-old `ghcr.io/jedarden/vista:1.0.0` pod. A pod restart or node drain would take vista down, since the current RS image cannot be pulled.

## New / refined findings since prior attempt

1. **Nodes are healthy now.** Prior note flagged `NodeNotReady` + calico errors. Current state: all 3 worker nodes `Ready` (Ubuntu 22.04, k8s v1.33.0, containerd 2.2.1). Node instability is **not currently** a factor.
2. **Duplicate IngressRoute.** apexalgo-iad has **two** IngressRoutes in `vista`: `vista` (48d, the GitOps-managed one) and a stale `vista-ingressroute` (127d). The 127d one predates argocd-ification and should be pruned to avoid routing ambiguity.
3. **GitOps source confirmed.** `declarative-config/k8s/apexalgo-iad/vista/deployment.yml` (the true ArgoCD source, not just the in-repo mirror) pins `ronaldraygun/vista:1.0.5` / replicas 3. Last commit touching this path was `54ed3cf` (the bf-e00 CNAME work) — i.e. **no image fix has landed**, so the manifest has pointed at an unpullable image across recent history.
4. **Version drift.** Repo `VERSION`=1.0.21, latest git tag=`v1.0.5`, manifest pin=`1.0.5`, working image=`1.0.0`. No `v1.0.21` image exists in any probed registry.

## Access model (why this can't be fixed from verification)

- **apexalgo-iad: read-only** (kubectl-proxy, `devpod-observer` SA). Cannot create/delete/modify — confirmed by the forbidden `run dnsprobe` attempt. Cannot restart the Deployment, change the image, delete the stuck RS, or prune the dup IngressRoute.
- **ardenone-manager: write access exists** (direct kubeconfig, incl. ArgoCD App CRDs), but Blocker 1 is transport/credential to the *apexalgo-iad* endpoint — not an Application-CR problem — and Blocker 2 needs a pullable image or a manifest/registry decision. Neither is safely in-scope for a verification task.
- Both fixes are **operator/infra** work.

## Required remediation (for an operator with write access)

1. **Restore ArgoCD → apexalgo-iad connectivity** (unblocks criterion 1, root cause). Investigate the cluster registration Secret in `argocd` ns on ardenone-manager vs. reachability/credentials of `hcp-99476ebb-….spot.rackspace.com` from the controller. Until this is fixed, sync stays `Unknown` and no GitOps state is enforced.
2. **Make the declared image pullable** (unblocks criterion 2). Either (a) actually publish `ronaldraygun/vista:1.0.5` to DockerHub (the `vista-build` CI is configured for this but no image exists there), or (b) repoint `declarative-config` to the registry that works (`ghcr.io/jedarden/vista`) and decide the canonical version — `VERSION`=1.0.21 but no `v1.0.21` image exists anywhere.
3. **Trigger an ArgoCD sync** after 1 & 2; prune the stuck `ImagePullBackOff` RS and the stale `vista-ingressroute` IngressRoute.
4. (Lower priority) Reconcile the version drift (VERSION vs. git tag vs. manifest pin).

## Conclusion

vista.jedarden.com is live and serving HTTP 200 with correct VISTA content, and the Service/IngressRoute/DNS path is sound (criteria 3–5 pass). But the deployment is **not verified-healthy**: ArgoCD sync is `Unknown/Failed` (cluster unreachable) and the rollout has `ProgressDeadlineExceeded`, surviving only on a single legacy pod whose image is not even referenced by any manifest (criteria 1–2 fail). Both blockers require operator/infra action outside read-only verification scope and have not changed since the prior attempt. **Bead left open.**
