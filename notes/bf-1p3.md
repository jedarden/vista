# Bead bf-1p3: Create K8s manifests for vista deployment

## Completed
Umbrella bead verifying that all four vista K8s manifests exist, follow the plan
specification, and are committed to the `declarative-config` repo. The manifest
work was produced incrementally by this bead's child beads; this bead confirms the
assembled result against its acceptance criteria.

## Acceptance criteria — all satisfied
Location: `declarative-config/k8s/apexalgo-iad/vista/`

- ✅ `namespace.yml` — Namespace named `vista`, `managed-by: argocd`
- ✅ `deployment.yml` — Deployment `vista`, image `ronaldraygun/vista:1.0.5`,
  container port 3000, liveness/readiness probes, securityContext (non-root)
- ✅ `service.yml` — ClusterIP exposing **port 8080** → targetPort 3000
- ✅ `ingressroute.yml` — Traefik IngressRoute, `Host(vista.jedarden.com)`,
  `websecure` entrypoint, `certResolver: letsencrypt`, routes to service:8080
- ✅ All manifests follow the plan spec (`docs/plan.md` §"Kubernetes (apexalgo-iad)",
  lines 2112–2210) — committed versions are an enriched, internally-consistent
  superset (extra labels/probes/securityContext; port 8080 per this task's
  explicit criterion rather than the plan skeleton's 3000)
- ✅ Files committed to declarative-config — commit `02a228c` on `main`,
  confirmed present on `origin/main` (pushed)

## Verification
- vista source (`vista/k8s/`) and deployed (`declarative-config/.../vista/`)
  are byte-identical for all four files.
- ingress → service:8080 → targetPort:3000 (container) is consistent end-to-end.

## Commits (declarative-config repo, github.com/jedarden/declarative-config)
- `02a228c` feat(vista): sync K8s manifests to current source (bf-4359) — pushed
- Per-manifest source commits in the vista repo:
  - service.yml — bf-3ath (485545c)
  - ingressroute.yml — bf-tp2e (202e00e)
  - namespace.yml / deployment.yml — earlier commits

## Child beads (dependency chain)
namespace/deployment → bf-3ath (service) → bf-tp2e (ingressroute) →
bf-4359 (commit to declarative-config, closed) → bf-1p3 (this umbrella)
