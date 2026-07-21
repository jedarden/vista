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

---

## Attempt 50 (fresh re-verification + new surgical findings)

Re-verified live state on 2026-07-21 — **unchanged**, still PARTIAL **3/5**:

- `vista-5d5f9dc954-mrksg` 0/1 `ImagePullBackOff` (17h), `vista-7d87bd66df-g6tvh` 1/1 Running (13h, legacy RS).
- Deployment `.spec.template` still wants `ronaldraygun/vista:latest`; `Progressing=False`. `b3144ab` (GHCR fix) still never synced down.
- vista.jedarden.com still serves HTTP 200 with correct VISTA content (criteria 3–5 hold).

This attempt hunted specifically for a **self-service fix path that prior attempts hadn't ruled out**, and
produced three genuinely new findings that make the operator handoff surgical:

### NEW 1 — The apexalgo-iad cluster registration is NOT GitOps-managed (no repo self-service fix)

Searched `jedarden/declarative-config` for ArgoCD cluster-registration Secrets
(`argocd.argoproj.io/secret-type: cluster`). The only GitOps-managed cluster secrets are:

```
k8s/rs-manager/argocd/ord-devimprint-cluster-externalsecret.yml
k8s/rs-manager/argocd/iad-kalshi-cluster-externalsecret.yml
```

**There is NO `cluster-apexalgo-iad-*` manifest anywhere in the repo.** The apexalgo-iad registration was
created manually in-cluster (via `argocd cluster add`) and lives only as a live Secret. So even though I
can push to declarative-config, there is **no manifest change I can make that would fix the CA/trust
bundle** — the fix must touch the live in-cluster Secret directly. This definitively closes the "could a
repo push fix it?" question that prior attempts had left open.

### NEW 2 — Exact target Secret for the operator (the one apps actually target)

The apexalgo-iad ApplicationSet targets `destination.server: https://hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com`.
Two cluster-registration Secrets exist in ns `argocd` on ardenone-manager (read via RO proxy, names only):

```
cluster-apexalgo-iad                                                            (113d, by-name registration)
cluster-hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com-3689407595   (110d, by-server-URL — the one the appset matches)
```

The HCP-named Secret is the one ArgoCD resolves for the vista appset. The by-name `cluster-apexalgo-iad`
is a **duplicate** (3 days older) and the pair should be reconciled. Reading the Secret *data* is Forbidden
to `devpod-observer` (`cannot get resource "secrets"`), so I could not inspect whether `insecureSkipVerify`
is set or whether a CA bundle is present/mismatched — but the symptom (x509: unknown authority) means the
config lacks a trusted CA for the current HCP cert.

### NEW 3 — Documented ArgoCD RO proxy hostname no longer resolves

`argocd-ro-ardenone-manager-ts.ardenone.com` (documented in CLAUDE.md) returns DNS `no resolution` and
`curl` HTTP `000` across retries. `traefik-ardenone-manager.tail1b1987.ts.net` still resolves (100.101.205.34),
so the cluster RO kubectl path works — only the ArgoCD read-only API proxy endpoint appears to have moved/
been removed. Minor, but the CLAUDE.md pointer is now stale.

### Updated operator remediation (copy-pasteable)

On ardenone-manager (needs the missing `/home/coding/.kube/ardenone-manager.kubeconfig`, or `argocd` CLI
login), in ns `argocd`:

1. Fix the x509 trust on the HCP-named cluster Secret (pick one):
   - `argocd cluster set cluster-hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com-3689407595 --insecure-skip-server-verification` (quickest unblock), **or**
   - patch the Secret's `config` to embed the correct Rackspace HCP CA bundle under `tlsClientConfig.caData`.
2. Reconcile the duplicate: remove whichever of `cluster-apexalgo-iad` vs the HCP-named Secret is stale (keep one registration per endpoint).
3. `argocd app sync vista-ns-apexalgo-iad` — no manifest change needed; `b3144ab` already pins verified-pullable `ghcr.io/jedarden/vista:1.0.5`. This clears criteria 1 + 2.

### Verdict

Verification is **complete and accurate**; the underlying deployment is **not** healthy. Criteria 1 + 2
remain blocked on operator write access to the `argocd` ns on ardenone-manager, which this box does not
have (no ardenone-manager kubeconfig on disk; secret reads Forbidden; cluster registration not in GitOps).
**Bead left open.**

---

## Attempt 51 (fresh re-verification — unchanged)

Re-verified live state on 2026-07-21. **Still PARTIAL 3/5, byte-for-byte identical to attempt 50.**
No operator remediation has landed. Per the recorded learning
(`[[apexalgo-iad-argocd-sync-broken]]` — "do NOT spend many attempts"), this attempt was a single
focused re-confirmation rather than a fresh hunt, since every write-path candidate to ardenone-manager
/ apexalgo-iad was already closed in attempts 43–50.

Fresh evidence gathered this attempt:

- **C1 (FAIL):** `vista-ns-apexalgo-iad` `sync=Unknown`, `health=Healthy`. Conditions carry the same
  x509 error: `tls: failed to verify certificate: x509: certificate signed by unknown authority` on
  `https://hcp-99476ebb-…spot.rackspace.com/version`.
- **C2 (FAIL):** `vista-5d5f9dc954-mrksg` 0/1 `ImagePullBackOff` (18h, current RS, wants
  `ronaldraygun/vista:latest`); `vista-7d87bd66df-g6tvh` 1/1 Running (legacy RS). Deploy
  `.spec.template` image still `ronaldraygun/vista:latest`; `.spec.replicas=1` (manifest wants 3 —
  drift, since ArgoCD cannot enforce); `Progressing=False`, `ready=1/2`.
- **C3 (PASS):** `svc/vista` ClusterIP `10.21.64.133:3000`, 1 healthy endpoint `10.20.92.160:3000`.
- **C4 (PASS):** IngressRoute `vista` (48d), `Host(vista.jedarden.com)`→`svc/vista:3000`.
- **C5 (PASS):** `GET https://vista.jedarden.com/` → HTTP 200, 36 274 bytes,
  `<title>VISTA — Visual Inspector of Social Tags &amp; Attributes</title>`.

**Conclusion unchanged.** Criteria 1 + 2 are operator-blocked (ardenone-manager write access to repair
the ArgoCD cluster-registration x509 trust, then sync `b3144ab`). Not fixable from this read-only
verification box. **Bead left open.**
