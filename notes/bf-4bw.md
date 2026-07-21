# bf-4bw — Verify vista deployment on apexalgo-iad

**Attempt 49 · 2026-07-21 · Result: STILL PARTIAL — 3/5 criteria pass; 2 fail, blocked on operator/infra action. Bead left open.**

> This file was rewritten on attempt 49 to **correct a stale claim** that had propagated
> across ~48 prior attempts. The historical narrative (170 KB of repeated PARTIAL-3/5
> sections) is collapsed below into the accurate current state. The critical correction:
> **the GitOps image fix (`b3144ab`) IS already landed** — the manifest no longer pins
> `ronaldraygun/vista`. Only the ArgoCD→apexalgo-iad x509 connectivity remains.

## Acceptance-criteria verdict (freshly re-verified this attempt)

| # | Criterion | Verdict | Fresh evidence (2026-07-21) |
|---|-----------|---------|-----------------------------|
| 1 | ArgoCD app `vista` is Synced | ❌ **FAIL** | App `vista-ns-apexalgo-iad` (ns `argocd`): `sync=Unknown`, `health=Healthy`. Controller cannot reach apexalgo-iad's HCP API endpoint (`x509: certificate signed by unknown authority`). |
| 2 | Deployment pods Running on apexalgo-iad | ❌ **FAIL** | `vista-5d5f9dc954-mrksg` 0/1 `ImagePullBackOff` (current RS, wants `ronaldraygun/vista:latest`); `vista-7d87bd66df-g6tvh` 1/1 Running (old RS, `ghcr.io/jedarden/vista:1.0.0`). Deploy `Progressing=False` (timed out). |
| 3 | Service via cluster-internal DNS | ✅ **PASS** | `svc/vista` ClusterIP `10.21.64.133:3000`; 1 healthy endpoint `10.20.92.160:3000`. |
| 4 | IngressRoute working | ✅ **PASS** | `vista` IngressRoute, `Host(vista.jedarden.com)`→`svc/vista:3000`, entryPoint `websecure`. |
| 5 | vista.jedarden.com responds with app | ✅ **PASS** | `GET https://vista.jedarden.com/` → **HTTP 200**, 36 KB, real VISTA HTML (`<title>VISTA — Visual Inspector of Social Tags &amp; Attributes</title>`). |

**3 of 5 pass.** The public service is live and correct; the underlying deployment is not verified-healthy.

## ⚠️ Key correction vs. prior attempts (read this first)

Prior attempts' notes repeatedly stated the GitOps source-of-truth still pinned
`ronaldraygun/vista:1.0.5` / `:latest` (an unpullable DockerHub repo). **That is no longer true.**
Commit `b3144ab` ("fix(vista/apexalgo-iad): repoint image to pullable GHCR registry") already
changed it:

```
declarative-config/k8s/apexalgo-iad/vista/deployment.yml:25
    image: ghcr.io/jedarden/vista:1.0.5      # ← GitOps source-of-truth, FIXED
```

And the pinned image is **verified pullable** (anonymous GHCR token, this attempt):

```
GET https://ghcr.io/v2/jedarden/vista/tags/list  →  {"tags":["1.0.0","latest","1.0.1","1.0.2","1.0.3","1.0.4","1.0.5"]}
```

So **criterion 2's manifest-side root cause is resolved.** The live Deployment still shows
`ronaldraygun/vista:latest` *only because ArgoCD has never been able to sync `b3144ab` down*
(blocker 1). The moment ArgoCD regains connectivity, the rollout will converge to
`ghcr.io/jedarden/vista:1.0.5` and criterion 2 self-heals — no further manifest work needed.

## The single remaining blocker — ArgoCD cannot reach apexalgo-iad (criterion 1)

```
app: vista-ns-apexalgo-iad   sync=Unknown  health=Healthy
  ComparisonError / UnknownError:
    x509: certificate signed by unknown authority
    Get "https://hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com/version?timeout=…"
```

ArgoCD's controller (running on **ardenone-manager**) does not trust the TLS certificate on
apexalgo-iad's Hosted-Control-Plane API endpoint. The cluster API itself is up (the read-only
`kubectl-proxy` at `traefik-apexalgo-iad:8001` reaches it fine — that's how all live data here
was gathered); the failure is specifically ArgoCD's direct registration/connection to the HCP
endpoint, on the controller side.

Fix lives in one of: (a) the ArgoCD cluster-registration Secret (CA data) in ns `argocd` on
ardenone-manager, or (b) the controller's CA trust bundle. Both require **write access to
ardenone-manager**.

## Why this cannot be fixed from this verification task (access model)

Confirmed this attempt — `ls ~/.kube/*.kubeconfig` is ground truth:

- **apexalgo-iad:** read-only proxy only (`devpod-observer` SA). Cannot patch the Deployment,
  restart pods, delete the stuck RS, or trigger a sync. (Prior attempts confirmed `run` is forbidden.)
- **ardenone-manager:** read-only proxy only. **No write kubeconfig exists on disk** —
  `ardenone-manager.kubeconfig` is documented in CLAUDE.md but **absent** (only `iad-acb` and
  `iad-ci` kubeconfigs are present). Cannot patch the cluster-registration Secret or controller CA.
- The HCP endpoint resolves (162.209.114.65) but is not reachable over the Tailscale mesh from
  this box (direct `:443` connect fails), so the cert can't even be re-inspected from here.

Net: both remaining fixes are operator/infra work requiring write access this box does not have.

## Required operator remediation (hands the task off cleanly)

1. **Restore ArgoCD → apexalgo-iad connectivity** (unblocks criterion 1; the only real blocker).
   Patch the cluster-registration Secret / controller CA bundle in ns `argocd` on ardenone-manager
   so the controller trusts the Rackspace HCP endpoint cert. Until this is fixed, every apexalgo-iad
   app stays `Unknown` and no GitOps state is enforced.
2. **Trigger an ArgoCD sync of `vista-ns-apexalgo-iad`.** No manifest change is required — `b3144ab`
   already pins the verified-pullable `ghcr.io/jedarden/vista:1.0.5`. The sync will replace the
   `ImagePullBackOff` RS and clear `ProgressDeadlineExceeded` (criterion 2).
3. (Lower priority) Prune the stale duplicate `vista-ingressroute` IngressRoute (127d, predates
   argocd-ification) and reconcile version drift (repo `VERSION`=1.0.21 vs latest git tag `v1.0.5`
   vs working image `1.0.0` — no `v1.0.21` image exists).

## Conclusion

vista.jedarden.com is live and serving HTTP 200 with correct VISTA content; the Service /
IngressRoute / DNS path is sound (criteria 3–5 pass). The deployment is **not** verified-healthy:
ArgoCD sync is `Unknown` (cluster unreachable, x509) and the rollout has `ProgressDeadlineExceeded`,
surviving only on a single legacy pod (criteria 1–2 fail). The GitOps manifest is already corrected
and pullable, so the *sole* remaining blocker is operator-level: restoring ArgoCD's trust of the
apexalgo-iad HCP endpoint cert on ardenone-manager — outside read-only verification scope and not
fixable from this box. **Bead left open.**

---

### Prior-attempt history (collapsed)

Attempts 1–48 (all 2026-07-21, same session) all reached PARTIAL 3/5 with the same two blockers.
The repeated finding across those attempts is fully captured above. Notable progression:
- The **image fix landed mid-session** as `b3144ab` (repoint manifest DockerHub→GHCR); later
  attempts that still claimed the manifest pins `ronaldraygun/vista` were reading stale data —
  corrected here.
- The x509 cluster-connectivity blocker has been byte-for-byte identical across every attempt;
  no operator remediation landed between attempts 1 and 49.
