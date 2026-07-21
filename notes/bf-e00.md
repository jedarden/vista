# Bead bf-e00: Add Cloudflare DNS CNAME for vista.jedarden.com

## Result: STILL BLOCKED — bead left OPEN. Re-verified on attempt 2 (2026-07-21).

The vista CNAME was **not** created. `vista.jedarden.com` resolves **NXDOMAIN** (no DNS
record of any type) on this attempt as well. Three independent platform-level outages on
apexalgo-iad — all still active, all outside this agent's access (read-only cluster proxy,
no Cloudflare credentials) — prevent the CNAME from ever being created. The vista-side
GitOps change (the external-dns annotation) remains correct and committed; it simply cannot
reach the cluster, and even if it did the DNS controller is crash-stopped.

> Per dispatch instructions, a bead whose acceptance criteria are unmet must NOT be closed.
> This note is updated each retry so the next attempt / a human with the right access can
> finish it quickly. **This is attempt 2; attempt 1's diagnosis is confirmed and refined below.**

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
