# Bead bf-e00: Add Cloudflare DNS CNAME for vista.jedarden.com

## Result: ✅ COMPLETED on attempt 9 (2026-07-21). Bead CLOSED.

The `vista.jedarden.com` CNAME now **exists, resolves, and serves the live VISTA app
end-to-end**. Between attempt 8 and this attempt the record was created out-of-band in
Cloudflare (almost certainly a manual edit by the platform owner following the prior
escalation notes — there is no external-dns ownership TXT for `vista`, and ArgoCD→apexalgo-iad
is still broken on the same x509 trust error, so neither GitOps nor external-dns created it).
This attempt's sole work was to **verify, hard**, that all three acceptance criteria are met.

### Attempt-9 verification snapshot (2026-07-21 — RESOLVED)
| # | Check | Value observed | Verdict |
|---|---|---|---|
| 1 | `vista.jedarden.com` A (Cloudflare DoH `1.1.1.1`) | Status 0 NOERROR → `172.67.172.218`, `104.21.40.5` (Cloudflare anycast, proxied). Was NXDOMAIN in attempts 1–8. | ✅ record exists |
| 2 | `https://vista.jedarden.com` (functional) | **HTTP/2 200**, `server: cloudflare`, `cf-ray: …EWR`, body = the real VISTA app (`<title>VISTA — Visual Inspector of Social Tags & Attributes</title>`, Inspect/Paste/Compare/Sitemap nav) | ✅ **proves it reaches apexalgo-iad ingress** |
| 3 | `gait.jedarden.com` A (reference) | Status 0 → same anycast IPs `172.67.172.218`/`104.21.40.5` | ✅ pattern matches |
| 4 | `external-dns-gait.jedarden.com` TXT (reference) | `owner=apexalgo-iad, resource=ingressroute/gait/gait-detection-ingressroute` | ✅ gait is external-dns-managed |
| 5 | `external-dns-vista.jedarden.com` TXT | Status 3 NXDOMAIN (no ownership marker) | 🆕 confirms vista record was **created manually**, not by external-dns |
| 6 | live vista IngressRoute (apexalgo-iad) | `generation: 1`, still **no external-dns annotation**, routes `Host(vista.jedarden.com)` → `service/vista:3000` | unchanged — annotation still not applied (irrelevant now: manual CNAME works) |
| 7 | vista Deployment / Service (apexalgo-iad) | `deployment/vista 1/1` (AGE 127d), `service/vista ClusterIP 10.21.64.133:3000/TCP` | ✅ backend healthy |
| 8 | ArgoCD `vista-ns-apexalgo-iad` | `sync=Unknown op=Failed`, ComparisonError `x509: certificate signed by unknown authority` for `hcp-99476ebb-…spot.rackspace.com` | ❌ still broken — **but moot**: the CNAME works without ArgoCD |
| 9 | external-dns pods (apexalgo-iad) | `external-dns-apexalgo-iad` `0/1 CreateContainerConfigError` (3d18h); `externaldns-ardenone-com` `1/1 Running` (8h) | unchanged — external-dns never created the vista record |

**Why the functional test is decisive for criterion #2 ("points to the apexalgo-iad ingress"):
** the only way an HTTPS request to `vista.jedarden.com` can return the VISTA app is to land on
apexalgo-iad's traefik `IngressRoute` (tracking-id `vista-ns-apexalgo-iad`, `Host(vista.jedarden.com)`
→ `service/vista:3000`) — i.e. the record resolves through apexalgo-iad's cloudflared/argotunnel
ingress (`cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`) to that traefik. The proxied
record hides its literal CNAME target from public DNS (DoH CNAME returns no Answer, just the zone
SOA — identical to how the known-good proxied `gait` record behaves), so the end-to-end HTTP 200
serving the real app is the strongest available proof, strictly stronger than resolving the
target hostname.

## Acceptance criteria — ALL MET

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | CNAME record exists in Cloudflare for `vista.jedarden.com` | ✅ | DoH resolves to Cloudflare anycast A records; was NXDOMAIN in attempts 1–8 |
| 2 | Points to the apexalgo-iad ingress hostname | ✅ | `https://vista.jedarden.com` → HTTP/2 200 serving the live VISTA app via apexalgo-iad traefik IngressRoute (only path that returns the vista app) |
| 3 | DNS propagation verified (nslookup/dig shows correct record) | ✅ | DoH `1.1.1.1` returns A `172.67.172.218`/`104.21.40.5` (TTL ~249); `curl` resolves + connects + serves 200 |

## How the blockage resolved
Attempts 1–8 were blocked by a cluster-wide ArgoCD↔apexalgo-iad TLS-trust outage (Rackspace Spot
HCP control-plane cert rotated ~2026-07-18; ArgoCD's pinned CA went stale), which prevented the
committed vista `external-dns.alpha.kubernetes.io/target` annotation from ever reaching the live
IngressRoute. That x509 outage is **still active** this attempt (check #8) — but it no longer
matters: the CNAME was created directly in Cloudflare, bypassing external-dns/ArgoCD entirely.
The vista-side GitOps work remains committed and correct for when ArgoCD trust is eventually
restored, but it is not required for the CNAME to function.

### What remains committed (vista-side, unchanged this attempt)
- `vista/k8s/ingressroute.yml` carries the external-dns annotation (commit `03a0c90`): hostname
  `vista.jedarden.com`, target `cef7d924-…cfargotunnel.com`, ttl 300.
- `declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml` mirrors it on `origin/main`.
- Note: the **live** IngressRoute is still `generation: 1` (port 3000, no annotation) — ArgoCD has
  not applied the declarative-config update (port 8080 + annotation) because of the x509 outage.
  This is harmless: the live `service/vista` exposes 3000 and serves correctly. Tracked separately
  from this DNS bead.

## Note
No vista-repo source changes were needed this attempt — the CNAME was created at the Cloudflare
layer and the vista manifests were already committed. This note is the deliverable: it records the
hard verification that the CNAME exists, resolves, and routes to the apexalgo-iad ingress serving
the live app. Bead **closed**.
