# k8s/ Manifests are Non-Authoritative

**Created:** 2024-08-02
**Bead:** bf-56n9

## Issue

This repository contains root-level `k8s/` manifests that are **NOT deployed from** and do not represent the current live configuration.

## Authoritative Source

All Kubernetes manifests for the vista deployment are managed via GitOps in:

**`jedarden/declarative-config` → `k8s/apexalgo-iad/vista/`**

The declarative-config repo is synced by ArgoCD on `ardenone-manager`. Any changes to the live cluster must go through that repo.

## Known Discrepancies (as of 2024-08-02)

| File | Local (stale) | Live (declarative-config) |
|------|---------------|----------------------------|
| `deployment.yml` - Image | `ronaldraygun/vista:1.0.5` | `ronaldraygun/vista:1.0.22` |
| `deployment.yml` - Replicas | `3` | `1` |
| `deployment.yml` - Health check | `/` | `/health` |
| `deployment.yml` - Labels | Full `app.kubernetes.io/*` | Simple `app: vista` |
| `service.yml` - Port | `8080 → 3000` | `3000 → 3000` |
| `deployment.yml` - Memory limit | `512Mi` | `256Mi` |

## Why These Files Exist

These files are historical artifacts from before the GitOps convention was established. They are retained in the repo for:
- Historical reference
- Local development or testing scenarios
- Understanding the original deployment structure

## Action Taken

Each file in the `k8s/` directory now includes a prominent warning header:

```yaml
# ⚠️  WARNING: This file is NOT the source of truth for deployment.
# The authoritative Kubernetes manifests are managed via GitOps in:
#   jedarden/declarative-config → k8s/apexalgo-iad/vista/
#
# Editing this file will have NO effect on the live cluster.
# These files are retained for reference only and are kept here for historical context.
```

## Future Contributors

**DO NOT** edit these files expecting changes to appear in the live cluster. The correct workflow is:

1. Edit the manifest in `jedarden/declarative-config/k8s/apexalgo-iad/vista/`
2. Commit and push to declarative-config
3. ArgoCD will automatically sync the changes to the cluster

If you need to make deployment changes and don't have access to declarative-config, contact the infrastructure team.
