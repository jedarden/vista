# Bead bf-e00: Add Cloudflare DNS CNAME for vista.jedarden.com

## Result: STILL BLOCKED — bead left OPEN. Re-verified on attempt 8 (2026-07-21).

> **Attempt 8 (2026-07-21) — byte-identical to attempt 7; sole blocker unchanged.**
> The single remaining blocker (ArgoCD → apexalgo-iad `x509: certificate signed by unknown
> authority` for `hcp-99476ebb-…spot.rackspace.com`) is still active, hours after attempt 7.
> The platform has **not** been remediated. What attempt 8 added over prior runs: a **direct
> `ls ~/.kube/`** proving the write path situation, rather than asserting it — confirmed only
> `iad-acb.kubeconfig` + `iad-ci.kubeconfig` exist on this host; the `ardenone-manager.kubeconfig`
> / `rs-manager.kubeconfig` (cluster-admin, documented in `~/CLAUDE.md`) are **absent**, which
> closes the one theoretical path to fixing ArgoCD cluster trust. No CF token/CLI/config either.
> `vista.jedarden.com` still resolves **NXDOMAIN**; the vista IngressRoute annotation remains
> committed in git but cannot reach the cluster. See "Attempt-8 snapshot" below.

> **Attempt 7 narrowed the root cause to ONE blocker (not three).** A second, **healthy**
> external-dns instance (`externaldns-ardenone-com`, `1/1 Running`, AGE 8h) was discovered
> this attempt — it manages **jedarden.com** (plus ardenone.com, hardyrekshin.com), watches
> `ingress/service/traefik-proxy/crd` sources, policy `sync`, `--cloudflare-proxied`, and
> uses a working `cloudflare-externaldns-secret`. Prior attempts only saw the **broken**
> `external-dns-apexalgo-iad` pod (`CreateContainerConfigError`) and concluded external-dns
> was dead — that was incomplete. The already-committed vista IngressRoute annotation
> (vista-repo `03a0c90` / declarative-config `54ed3cf`) would be picked up by this healthy
> pod **the moment it lands in the cluster**. The **sole remaining blocker is the
> ArgoCD → apexalgo-iad x509 trust outage** — ArgoCD cannot apply any change to apexalgo-iad,
> so the annotation never reaches the live IngressRoute (still `generation: 1`, unannotated).
> Fixing ArgoCD cluster trust (re-add apexalgo-iad with a fresh CA bundle) is now the
> **single** unblocking action. The DNSEndpoint-CR path and the Terraform path were both
> evaluated and ruled out this attempt (see "Attempt 7" below). Git server recovered;
> branch reconciled onto `origin/main` (attempt 6 had a duplicate concurrent-agent commit,
> now deduped).

The vista CNAME was **not** created. `vista.jedarden.com` resolves **NXDOMAIN** (no DNS
record of any type) on this attempt as well. The vista-side GitOps change (the external-dns
annotation) remains correct and committed; it simply cannot reach the cluster because
ArgoCD's TLS trust to apexalgo-iad is broken cluster-wide.

> Per dispatch instructions, a bead whose acceptance criteria are unmet must NOT be closed.
> This note is updated each retry so the next attempt / a human with the right access can
> finish it quickly. **Attempt 6 (2026-07-21) re-confirmed all three blockers byte-for-byte
> unchanged — no drift; the platform has not been remediated. The ArgoCD RO API proxy
> remains unreachable (HTTP 000, same as attempt 5); no new degradation beyond attempt 5.
> New wrinkle this attempt: the git server (`git.ardenone.com`) is returning HTTP 502,
> blocking `git fetch`/`git push` — committed locally; push will be retried when the server
> recovers.**

### Attempt-8 re-verification snapshot (2026-07-21 — byte-identical to attempt 7; sole blocker unchanged)
Re-ran every check; also **directly enumerated `~/.kube/`** to hard-verify the access model.
| Check | Value observed | Verdict |
|---|---|---|
| `vista.jedarden.com` A / CNAME (Cloudflare DoH) | Status 3 NXDOMAIN, no answer | ❌ unchanged |
| `gait.jedarden.com` A (reference) | Status 0 → 104.21.40.5, 172.67.172.218 | ✅ pattern works |
| ArgoCD `vista-ns-apexalgo-iad` | sync=Unknown, health=Healthy, op=Failed ("retried 2 times") | ❌ unchanged |
| ComparisonError | `x509: certificate signed by unknown authority` for `hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com` (same endpoint) | ❌ unchanged |
| live vista IngressRoute (apexalgo-iad) | `generation: 1`, **no external-dns annotation** | ❌ unchanged — ArgoCD never applied |
| `external-dns-apexalgo-iad-…k9nmx` | `0/1 CreateContainerConfigError`, AGE 3d18h | ❌ unchanged (the broken instance) |
| `externaldns-ardenone-com-…2q7mr` | `1/1 Running`, AGE 8h — manages jedarden.com, will create CNAME once annotation lands | ✅ healthy instance, unchanged |
| **`~/.kube/` direct `ls`** | **only `iad-acb.kubeconfig` + `iad-ci.kubeconfig` present**; `ardenone-manager`/`rs-manager`/`iad-options*` kubeconfigs **absent** | 🆕 hard-confirmed: no ardenone-manager write path |
| CF credential on host | none (env empty, no `flarectl`/`cloudflared`/`cf`/`wrangler` on PATH, no `~/.cloudflared`/`~/.config/cloudflare`) | ❌ unchanged |

**Conclusion (attempt 8):** every write path is verified closed — apexalgo-iad (read-only proxy
only), ArgoCD write API (no ardenone-manager kubeconfig), and Cloudflare API (no token). The
single unblocking action remains: **re-add apexalgo-iad to ArgoCD with a fresh CA bundle from
ardenone-manager cluster-admin** (or rotate/re-trust the `hcp-99476ebb-…spot.rackspace.com`
endpoint cert). Once ArgoCD can reach apexalgo-iad again, it syncs the already-committed vista
IngressRoute annotation, the healthy `externaldns-ardenone-com` pod creates the
`vista.jedarden.com` → `cef7d924-…cfargotunnel.com` CNAME (proxied, ttl 300), and DNS resolves
like `gait`. No agent with the current (read-only) access can finish this — it needs the
platform owner. Bead **left OPEN**.

### Attempt-7 re-verification snapshot (2026-07-21 — root cause NARROWED to one blocker)
Re-ran the verification commands and, for the first time, enumerated **all** external-dns
instances on apexalgo-iad and evaluated two additional write paths (DNSEndpoint CR, Terraform).
| Check | Value observed | Verdict |
|---|---|---|
| `vista.jedarden.com` A / CNAME (Cloudflare DoH) | Status 3 NXDOMAIN | ❌ unchanged |
| `gait.jedarden.com` A (reference) | Status 0 → 104.21.40.5, 172.67.172.218 | ✅ pattern works |
| `external-dns-apexalgo-iad-…k9nmx` pod | `0/1 CreateContainerConfigError`, AGE 3d17h | ❌ unchanged (but see next row) |
| **`externaldns-ardenone-com-…2q7mr` pod** | **`1/1 Running`, AGE 8h** — manages jedarden.com, watches `traefik-proxy`+`crd`, policy sync, `--cloudflare-proxied`, secret `cloudflare-externaldns-secret` | 🆕 **HEALTHY — can create the vista CNAME** |
| ArgoCD app `externaldns-ardenone-com` | **sync=Unknown** (x509, same as vista) — healthy pod runs off an *earlier* sync; no new config can apply | ❌ confirms x509 is cluster-wide |
| ArgoCD app `vista-ns-apexalgo-iad` | sync=Unknown op=Failed; ComparisonError `x509: certificate signed by unknown authority` for `hcp-99476ebb-…spot.rackspace.com` | ❌ unchanged |
| ~all `*-apexalgo-iad` / `*-ns-apexalgo-iad` apps | sync=Unknown (spot-checked 40+; only `applications-apexalgo-iad` root app = Synced) | ❌ cluster-wide outage |
| live vista IngressRoute | `generation: 1`, **no external-dns annotation** (stale since 2026-06-03) | ❌ unchanged — ArgoCD never applied it |
| vista source `k8s/ingressroute.yml` + declarative-config twin (`54ed3cf`) | annotation intact (hostname/target/ttl) | ✅ source-of-truth correct |
| ArgoCD RO API proxy (`…ardenone-manager-ts:8444`) | HTTP 000 — unreachable | ❌ unchanged |
| `openbao` ClusterSecretStore | Ready=False reason=InvalidProviderConfig | ❌ unchanged |
| CF credential on host | none (env empty, no `~/.cloudflared`, no CLI; `~/.kube` only iad-acb+iad-ci) | ❌ unchanged |
| writable cluster access | only `iad-acb` + `iad-ci` kubeconfigs present — **no** ardenone-manager/rs-manager (so cannot fix ArgoCD cluster trust either) | ❌ unchanged |

**New paths evaluated and ruled out (attempt 7):**
- **DNSEndpoint CR** (the `commitgraph-corpus` / `apexalgo-hub` pattern): a `vista` DNSEndpoint
  committed to `declarative-config/k8s/apexalgo-iad/utilities/` would be reconciled by the
  healthy `externaldns-ardenone-com` pod — **but only after ArgoCD syncs it to apexalgo-iad**,
  which is blocked by the same x509 outage. No win over the already-committed IngressRoute
  annotation; same blocker.
- **Terraform** (`declarative-config/terraform/cloudflare/dns.tf`): the file explicitly states
  external-dns-managed subdomains must NOT be added there ("they will conflict"), and it
  requires a `cloudflare_api_token` (`terraform.tfvars`, gitignored) that is not present on
  this host. Ruled out.

**Bottom line:** remediation collapsed from three actions to **one** — fix ArgoCD's TLS trust
to apexalgo-iad (re-add the cluster with a fresh CA bundle, from ardenone-manager cluster-admin).
The already-committed vista IngressRoute annotation will then sync, the healthy
`externaldns-ardenone-com` pod will create `vista.jedarden.com` →
`cef7d924-…cfargotunnel.com` (proxied, ttl 300), and DNS will resolve like `gait`.

### Attempt-5 re-verification snapshot (2026-07-21, all still BLOCKED — identical to attempts 3–4)
| Check | Value observed | Verdict |
|---|---|---|
| `vista.jedarden.com` A / CNAME | Status 3 NXDOMAIN (Cloudflare DoH `1.1.1.1`) | ❌ unchanged |
| `gait.jedarden.com` A (reference) | NOERROR → 104.21.40.5, 172.67.172.218 | ✅ pattern still works |
| ArgoCD RO API proxy (`…ardenone-manager-ts:8444`) | **HTTP 000 — unreachable** (was serving JSON in attempts 1–4) | 🆕 NEW degradation |
| ArgoCD `vista-ns-apexalgo-iad` | not re-fetchable this attempt (RO proxy down); still `sync=Unknown` as of attempt 4 | ❌ unchanged (proxy down) |
| ArgoCD vista ComparisonError | `x509: certificate signed by unknown authority` for `hcp-99476ebb-…rackspace.com` (attempt 4) | ❌ unchanged (proxy down) |
| external-dns pod `…k9nmx` | `0/1 CreateContainerConfigError`, AGE 3d17h | ❌ unchanged |
| `openbao` ClusterSecretStore | `Ready=False reason=InvalidProviderConfig` | ❌ unchanged |
| live vista IngressRoute | `generation: 1`, **no external-dns annotation** (stale since 2026-06-03) — proves ArgoCD still has not synced apexalgo-iad | ❌ unchanged |
| vista source `k8s/ingressroute.yml` | annotation intact (lines 14–16: hostname/target/ttl) | ✅ source-of-truth correct |
| CF credential reachable from host | none (no env, no `~/.cloudflared`, no CLI; only `iad-acb`+`iad-ci` kubeconfigs in `~/.kube`) | ❌ unchanged |

(The apexalgo-iad app-sync tally, the missing `cloudflare-apexalgo-iad-secret`, and the
absent ExternalSecrets from attempt-3's snapshot all carry over unchanged — the external-dns
pod is still crash-stopped on that same missing secret, so they cannot have moved. The tally
itself could not be re-fetched this attempt because the ArgoCD RO proxy is down, but the
external-dns pod, the stale live IngressRoute, and the broken `openbao` SecretStore — all
read directly off apexalgo-iad's own proxy — are byte-for-byte unchanged, so the cluster-wide
reconciliation outage is still in effect.)

Nothing remediated between attempts 3, 4, and 5 — and the platform has actually degraded
further: the ArgoCD read-only API proxy (`argocd-ro-ardenone-manager-ts.ardenone.com:8444`)
now returns HTTP 000. The platform remediation in "Remediation required" below has not
happened. Retrying again with the same (read-only) access will produce the same result.

### Attempt-6 re-verification snapshot (2026-07-21, all still BLOCKED — identical to attempts 3–5)
Re-ran the exact commands from "Commands to re-verify after the platform is fixed". Every
apexalgo-iad check is byte-for-byte identical to attempts 3–5 — no drift at all:
| Check | Value observed | Verdict |
|---|---|---|
| `vista.jedarden.com` A / CNAME (Cloudflare DoH) | Status 3 NXDOMAIN | ❌ unchanged |
| `gait.jedarden.com` A (reference) | NOERROR → 172.67.172.218, 104.21.40.5 | ✅ pattern works |
| ArgoCD RO API proxy | HTTP 000 — unreachable (same as attempt 5) | ❌ unchanged |
| ArgoCD `vista-ns-apexalgo-iad` | `sync=Unknown op=Failed` (via traefik proxy) | ❌ unchanged |
| ArgoCD ComparisonError | `x509: certificate signed by unknown authority` for `hcp-99476ebb-…rackspace.com` | ❌ unchanged |
| external-dns pod `…k9nmx` | `0/1 CreateContainerConfigError`, AGE 3d17h | ❌ unchanged |
| `openbao` ClusterSecretStore | `Ready=False reason=InvalidProviderConfig` | ❌ unchanged |
| live vista IngressRoute | `generation: 1`, **no external-dns annotation** (stale since 2026-06-03) | ❌ unchanged |
| vista source `k8s/ingressroute.yml` | annotation intact (lines 14–16: hostname/target/ttl) | ✅ correct |
| CF credential on host | none (env empty, no `~/.cloudflared`, no CLI; `~/.kube` only `iad-acb`+`iad-ci`) | ❌ unchanged |

The git server is a **new** environmental issue this attempt: `git.ardenone.com` returns
HTTP 502 on `fetch`/`push`, so this note is committed locally and pushed when the server
recovers. Unrelated to the bf-e00 blockers (which are all apexalgo-iad / Cloudflare side).

## Acceptance criteria — none met (again)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | CNAME record exists in Cloudflare for `vista.jedarden.com` | ❌ NXDOMAIN |
| 2 | Points to the apexalgo-iad ingress hostname | ❌ no record |
| 3 | DNS propagation verified (nslookup/dig shows correct record) | ✅ verified — record does **not** exist |

### DNS evidence (Cloudflare DoH, `1.1.1.1`) — attempt 2
```
vista.jedarden.com  type=A     → Status 3 (NXDOMAIN)   Answer: <none>
vista.jedarden.com  type=CNAME → Status 3 (NXDOMAIN)   Answer: <none>
gait.jedarden.com    type=A     → Status 0 (NOERROR)    Answer: 172.67.172.218, 104.21.40.5  ← working reference
```
`gait` proves the pattern is correct when the platform is healthy: proxied CNAME →
`cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` → cloudflared → traefik.

## Root cause — three independent platform outages (all still active)

### Blocker 1: ArgoCD CANNOT reach apexalgo-iad (cluster-wide reconciliation outage)
`vista-ns-apexalgo-iad` on ardenone-manager: `sync=Unknown health=Healthy opPhase=Failed`:
```
ComparisonError: Failed to load live state: failed to get cluster info for
  "https://hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com":
  tls: failed to verify certificate: x509: certificate signed by unknown authority
```
NOT vista-specific — affects the **entire apexalgo-iad cluster**. Cluster-wide ArgoCD app
sync state on attempt 2: **`Unknown: 97, OutOfSync: 48, Synced: 107`**. The Rackspace Spot
HCP control-plane TLS cert rotated (~2026-07-18) and ArgoCD's pinned CA bundle is stale, so
**no GitOps change can be applied to apexalgo-iad** until the cluster registration is re-added.
- The apexalgo-iad ArgoCD cluster registration Secret is managed **out-of-band** (it is NOT a
  clean resource in declarative-config), so it cannot be corrected with a declarative commit
  — it needs an interactive ArgoCD cluster re-add (ardenone-manager cluster-admin).
- Live vista IngressRoute on attempt 2: `generation: 1`, host correct, **no external-dns
  annotation** — i.e. still stale since 2026-06-03, never received the port→8080 or annotation
  changes from declarative-config.

### Blocker 2: external-dns pod crash-stopped — REFINED root cause (attempt 2)
```
utilities/external-dns-apexalgo-iad-6ffc7c97b-k9nmx   0/1   CreateContainerConfigError
  Reason: CreateContainerConfigError
  Event: Failed (x23477 over 3d12h): secret "cloudflare-apexalgo-iad-secret" not found
```
The deployment's env `CF_API_TOKEN` is a `secretKeyRef` to **`cloudflare-apexalgo-iad-secret`**,
which does not exist. Attempt 2 refined this beyond the prior "secret-name mismatch" framing:

1. **There are ZERO ExternalSecrets on all of apexalgo-iad** (`No resources found`). The CRD is
   installed, but nobody uses it here — so the missing secret was created manually/imperatively
   and simply drifted away with **no reconciler** to recreate it.
2. **The `openbao` ClusterSecretStore — the token source other clusters use — is itself broken
   on apexalgo-iad:** `status=False, reason=InvalidProviderConfig, "unable to validate store"`
   since **2026-04-29**. So simply copying the iad-acb / ord-devimprint ExternalSecret pattern
   (`ClusterSecretStore: openbao`, `remoteRef: rs-manager/<x>/cloudflare`) would **fail** until
   the SecretStore is repaired. (iad-acb: `rs-manager/ai-code-battle/cloudflare` → `api-token`;
   ord-devimprint: `rs-manager/ord-devimprint/cloudflare/external-dns` → `CF_API_TOKEN`.)
3. Secrets that *do* exist in `utilities`: `cloudflare-externaldns-secret` (190d),
   `cloudflare-pages-secret` (143d), `externaldns-ardenone-com-secret` (232d). The
   `externaldns-ardenone-com` pod (ardenone.com zone) is the *working* reference.

external-dns args (attempt 2, exact): `--provider=cloudflare --cloudflare-proxied
--txt-owner-id=apexalgo-iad --source=ingress,service,traefik-proxy --policy=sync
--registry=txt --txt-prefix=external-dns-`. **Note: there is no `--domain-filter` flag** —
record creation is gated by the Cloudflare token's zone scope, not a flag. (Corrects attempt
1's note.) The external-dns deployment is **not in declarative-config** at all — imperatively
managed, drifting, cannot be corrected via GitOps, and could not sync until Blocker 1 resolves.

### Blocker 3: no accessible Cloudflare credential to create the CNAME directly
- Observer RBAC on apexalgo-iad **forbids** reading secret data.
- No `CF_API_TOKEN` / Cloudflare token in env, kubeconfigs, or token files on this host
  (confirmed again on attempt 2: env empty, `~/.cloudflared`/`~/.config/cloudflare` absent,
  no cloudflare CLI on PATH). The jedarden.com-capable token lives only in OpenBao, which is
  inaccessible and (per Blocker 2) whose SecretStore is broken on this cluster anyway.

## Access model — why no agent without platform access can finish this
- apexalgo-iad: **read-only proxy only** (`http://traefik-apexalgo-iad:8001`); no direct
  kubeconfig exists in `~/.kube/`. Cannot create/delete/modify any resource.
- ArgoCD cannot reach apexalgo-iad (Blocker 1), so declarative-config commits don't apply there.
- No Cloudflare credential reachable from this host (Blocker 3).
→ There is **no write path** to apexalgo-iad or to the jedarden.com Cloudflare zone from this agent.

## What IS correct and done (vista-side, GitOps)
- `vista/k8s/ingressroute.yml` carries the external-dns annotation (commit `03a0c90`):
  hostname `vista.jedarden.com`, target `cef7d924-…cfargotunnel.com`, ttl 300.
- `declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml` has it byte-identical (on
  `origin/main`). Source of truth is ready — just needs the platform unblocked to apply.

## Remediation required (needs access this agent does NOT have)
1. **Fix ArgoCD → apexalgo-iad TLS trust** (ardenone-manager cluster-admin): re-add the
   apexalgo-iad cluster in ArgoCD so the `hcp-99476ebb-…spot.rackspace.com` endpoint's rotated
   cert is trusted. Unblocks **all** ~97 `Unknown` apexalgo-iad apps, not just vista.
2. **Repair the `openbao` ClusterSecretStore** on apexalgo-iad (`InvalidProviderConfig` since
   2026-04-29), then commit an ExternalSecret mirroring iad-acb — e.g.
   `secretStoreRef: openbao`, target `cloudflare-apexalgo-iad-secret`, key
   `CF_API_TOKEN` ← `rs-manager/apexalgo-iad/cloudflare` (property `api-token` or `CF_API_TOKEN`).
   Ensure that OpenBao key exists and holds a **jedarden.com**-zone-capable Cloudflare token.
   (Alternatively recreate the secret by hand, but committing the ExternalSecret stops the drift
   recurring — and also commit the external-dns Deployment itself to declarative-config.)
3. Once 1 + 2 are healthy, ArgoCD syncs the vista annotation, external-dns creates
   `vista.jedarden.com` CNAME → `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
   (proxied, ttl 300), and DNS resolves like gait. Then re-verify with DoH/dig and close bf-e00.

## Commands to re-verify after the platform is fixed
```bash
# CNAME / resolve (expect Status 0 + Cloudflare anycast A records, like gait)
curl -s "https://1.1.1.1/dns-query?name=vista.jedarden.com&type=A" -H "accept: application/dns-json"

# ArgoCD vista app (expect sync=Synced, no ComparisonError)
kubectl --server=http://traefik-ardenone-manager:8001 get applications.argoproj.io -n argocd vista-ns-apexalgo-iad \
  -o jsonpath='sync={.status.sync.status} op={.status.operationState.phase}{"\n"}'

# external-dns pod (expect 1/1 Running)
kubectl --server=http://traefik-apexalgo-iad:8001 get pod -n utilities -l app.kubernetes.io/instance=external-dns-apexalgo-iad

# openbao SecretStore (expect Ready=True)
kubectl --server=http://traefik-apexalgo-iad:8001 get clustersecretstore openbao -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}{"\n"}'

# live IngressRoute should carry the annotation + port 8080
kubectl --server=http://traefik-apexalgo-iad:8001 get ingressroute -n vista vista \
  -o jsonpath='{.metadata.annotations.external-dns\.alpha\.kubernetes\.io/target}{"  gen="}{.metadata.generation}{"\n"}'
```

## Note
No vista-repo file changes were possible (the vista manifest change was already committed by
the prior run at `03a0c90`). This note is the sole deliverable: it documents why the CNAME
cannot be created and exactly what platform fixes are required. Bead **left open** for retry /
escalation. Repeated retries by any agent with the same (read-only) access will hit the same
wall — this needs the platform remediation above.

### Attempt-5 housekeeping
Attempt 5 re-verified all checks directly off apexalgo-iad's read-only proxy (DNS via
Cloudflare DoH, external-dns pod, live IngressRoute, `openbao` SecretStore) and independently
re-confirmed the access model (`~/.kube/` holds only `iad-acb` + `iad-ci` kubeconfigs — no
apexalgo-iad write path; no Cloudflare token/CLI/config on the host). The local branch had
diverged from `origin/main` by one redundant duplicate attempt-4 commit (a concurrent-agent
race — identical tree, differing only by commit trailer); this was reconciled by a soft reset
onto `origin/main` so the attempt-5 note commit pushes as a clean fast-forward. No vista
source files were modified.
