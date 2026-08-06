# ⚠️  These manifests are NOT the source of truth

**The authoritative Kubernetes manifests for this application are managed via GitOps in:**

```
jedarden/declarative-config → k8s/apexalgo-iad/vista/
```

## Status: Reference Only

The files in this directory are **historical artifacts** and are retained for reference only. Editing them will have **NO effect** on the live cluster.

## Known Discrepancies

As of 2026-08-05, these files differ significantly from the live deployment:

- **Image tag**: This repo shows `:1.0.5`, live cluster uses `:latest`
- **Replicas**: This repo shows `3`, live cluster uses `1`
- **Health check**: This repo uses `/`, live cluster uses `/health`
- **Service port**: This repo shows `8080→3000`, live cluster uses `3000→3000`

## How to Make Deployment Changes

1. Navigate to the `jedarden/declarative-config` repository
2. Edit the corresponding file in `k8s/apexalgo-iad/vista/`
3. Commit and push your changes
4. ArgoCD on `ardenone-manager` will automatically sync to the cluster

**Do not** edit files in this directory expecting live changes.
