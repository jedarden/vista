# Bead bf-e00: Add Cloudflare DNS CNAME for vista.jedarden.com

## Result: BLOCKED — cannot complete with current access. Bead left OPEN.

The vista CNAME was **not** created. `vista.jedarden.com` resolves **NXDOMAIN** (no DNS
record of any type exists). Two platform-level outages on apexalgo-iad prevent the
chosen external-dns mechanism from ever creating it, and both are outside this
agent's access (read-only cluster proxy + no Cloudflare credentials). The vista-side
GitOps change (the external-dns annotation) is already correct and committed; it
simply cannot reach the cluster.

> Per dispatch instructions, a bead whose acceptance criteria are unmet must NOT be
> closed. This note captures the full diagnosis so the next attempt / a human with
> the right access can finish it quickly.

## Acceptance criteria — none met

| # | Criterion | Status |
|---|-----------|--------|
| 1 | CNAME record exists in Cloudflare for `vista.jedarden.com` | ❌ NXDOMAIN |
| 2 | Points to the apexalgo-iad ingress hostname | ❌ no record |
| 3 | DNS propagation verified (nslookup/dig shows correct record) | ✅ verified — record does **not** exist |

### DNS evidence (Cloudflare DoH, `1.1.1.1`)
```
vista.jedarden.com  type=A   → Status 3 (NXDOMAIN)   Answer: <none>
gait.jedarden.com    type=A   → Status 0 (NOERROR)    Answer: 172.67.172.218, 104.21.40.5  ← working reference
```
gait proves the pattern is correct when the platform is healthy: proxied CNAME →
`cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` → cloudflared → traefik.

## Root cause — two independent platform outages (both started ~2026-07-18)

### Blocker 1: ArgoCD CANNOT reach apexalgo-iad (cluster-wide reconciliation outage)
The `vista-ns-apexalgo-iad` Application on ardenone-manager shows:
```
sync=Unknown  health=Healthy  opPhase=Failed  autoSync=true
last operation: started 2026-07-18T15:08:57Z, finished 2026-07-18T15:10:41Z
ComparisonError: Failed to load live state: failed to get server version:
  Get "https://hcp-99476ebb-4133-4a21-ac6a-6e2bdf6794c0.spot.rackspace.com/version?timeout=32s":
  tls: failed to verify certificate: x509: certificate signed by unknown authority
```
This is **NOT vista-specific** — it affects the **entire apexalgo-iad cluster**. All
60+ apexalgo-iad apps report `sync=Unknown` (gait, traefik, cert-manager, sealed-secrets,
utilities, … — everything; only the root app-of-apps `applications-apexalgo-iad` is
`Synced`). The Rackspace Spot HCP API endpoint's TLS cert is untrusted by ArgoCD, so
**no GitOps change can be applied to apexalgo-iad** until the cluster registration's
CA bundle is fixed.

Because of this, today's declarative-config commits never reached the cluster:
- `vista` IngressRoute **live**: port **3000**, `generation: 1`, created `2026-06-03`
  (stale for ~7 weeks; never received the port→8080 or annotation changes).
- declarative-config HEAD: port **8080** + the external-dns annotation (commits
  `02a228c` and `54ed3cf`, both today).

### Blocker 2: external-dns pod is crash-stopped (CreateContainerConfigError, 3d17h)
```
utilities/external-dns-apexalgo-iad-6ffc7c97b-k9nmx   0/1   CreateContainerConfigError
  Reason: CreateContainerConfigError
  Event: Failed (x23454 over 3d12h): secret "cloudflare-apexalgo-iad-secret" not found
```
The deployment's env `CF_API_TOKEN` is a `secretKeyRef` named **`cloudflare-apexalgo-iad-secret`**,
which **does not exist**. The secret that *does* exist in `utilities` is
`cloudflare-externaldns-secret` (190d) — used by the *working* `externaldns-ardenone-com`
pod (ardenone.com zone). So this is a **secret-name mismatch / missing jedarden.com token**.

Crucially, the `external-dns-apexalgo-iad` **Deployment is not in declarative-config at all**
(no manifest and no `cloudflare-apexalgo-iad-secret` reference anywhere in the repo) — it is
imperatively managed / drifting, so it cannot be corrected via GitOps, and even a correct
manifest could not sync until Blocker 1 is resolved.

external-dns args confirm it is the jedarden.com-record creator:
`--provider=cloudflare --cloudflare-proxied --txt-owner-id=apexalgo-iad
--source=ingress,service,traefik-proxy --policy=sync`.

### Blocker 3: no accessible Cloudflare credential to create the CNAME directly
- Observer RBAC on apexalgo-iad **forbids** reading secret data:
  `secrets "cloudflare-externaldns-secret" is forbidden`.
- The jedarden.com-capable token lived only in the now-absent `cloudflare-apexalgo-iad-secret`.
- No `CF_API_TOKEN` / Cloudflare token in env, kubeconfigs, or token files on this host.
So the CNAME cannot be created directly via the Cloudflare API either.

## What IS correct and done (vista-side, GitOps)
- `vista/k8s/ingressroute.yml` has the external-dns annotation (commit `03a0c90`).
- `declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml` has it byte-identical
  (commit `54ed3cf`, on `origin/main`). Source of truth is ready — just needs the
  platform unblocked to apply.

## Remediation required (needs access this agent does NOT have)
1. **Fix ArgoCD → apexalgo-iad TLS trust** (ardenone-manager ArgoCD admin / cluster
   re-registration). Update the cluster Secret's `caData` or re-add the cluster so the
   `hcp-99476ebb-…spot.rackspace.com` endpoint is trusted. This unblocks **all** 60+
   apexalgo-iad apps, not just vista.
2. **Restore external-dns** (apexalgo-iad cluster-admin): either recreate secret
   `cloudflare-apexalgo-iad-secret` (key `CF_API_TOKEN`) with a jedarden.com-zone-capable
   Cloudflare API token, **or** repoint the deployment's env to `cloudflare-externaldns-secret`
   if that token actually covers `jedarden.com` (unverified — it is currently used only for
   `ardenone.com`). Recommend also committing the deployment to declarative-config so it
   stops drifting.
3. Once 1 + 2 are healthy, ArgoCD will sync the vista annotation, external-dns will create
   `vista.jedarden.com` CNAME → `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
   (proxied, ttl 300), and DNS will resolve like gait. Then re-verify with DoH/dig and
   close bf-e00.

## Commands to re-verify after the platform is fixed
```bash
# CNAME / resolve (expect Status 0 + Cloudflare anycast A records, like gait)
curl -s "https://1.1.1.1/dns-query?name=vista.jedarden.com&type=A" -H "accept: application/dns-json"

# ArgoCD vista app (expect sync=Synced, no ComparisonError)
kubectl --server=http://traefik-ardenone-manager:8001 get applications.argoproj.io vista-ns-apexalgo-iad -n argocd \
  -o jsonpath='sync={.status.sync.status} op={.status.operationState.phase}{"\n"}'

# external-dns pod (expect 1/1 Running)
kubectl --server=http://traefik-apexalgo-iad:8001 get pod -n utilities -l app.kubernetes.io/instance=external-dns-apexalgo-iad

# live IngressRoute should carry the annotation + port 8080
kubectl --server=http://traefik-apexalgo-iad:8001 get ingressroute -n vista vista \
  -o jsonpath='{.metadata.annotations.external-dns\.alpha\.kubernetes\.io/target}{"  gen="}{.metadata.generation}{"\n"}'
```

## Note
No vista-repo file changes were possible (the vista manifest change was already
committed by the prior run at `03a0c90`). This note is the sole deliverable of this
attempt: it documents why the CNAME cannot be created and exactly what platform fix
is required. Bead **left open** for retry/escalation.
