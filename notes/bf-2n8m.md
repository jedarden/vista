# bf-2n8m: Verification that vista deployment image is pinned

## Task
Pin vista deployment image away from `:latest` to fix stuck ImagePullBackOff rollout.

## Status: Already Completed ✅

This issue was already fixed on 2026-07-30 by commit `37d68fda` in the `declarative-config` repository.

## Evidence

### Current deployment.yml (declarative-config)
```yaml
image: ronaldraygun/vista:1.0.21
```

### Live cluster status (apexalgo-iad)
- **Current Deployment:** `vista-59465b487f` running `ronaldraygun/vista:1.0.21` (READY 1/1)
- **Old broken ReplicaSet:** `vista-5d5f9dc954` with `:latest` is scaled to 0
- **Deployment Health:** Available, Progressing, minimum replicas met

### Version alignment
- **vista VERSION file:** `1.0.21`
- **deployment.yml image tag:** `1.0.21`
- **Live deployment image:** `ronaldraygun/vista:1.0.21`

All three are in sync.

## Related Work
- **bf-5r6a:** Auto-bump declarative-config image tag after build (separate task to prevent recurrence)

## Timeline
- **2026-06-03:** Original broken ReplicaSet created with `:latest` (ImagePullBackOff)
- **2026-07-20:** Issue observed and bead bf-2n8m created
- **2026-07-30:** Fix applied - deployment.yml updated to `1.0.21`
- **2026-08-02:** Verification completed - deployment healthy

## Fix Applied
The deployment.yml file in `jedarden/declarative-config` was updated via GitOps:
1. Changed `image: ronaldraygun/vista:latest` → `image: ronaldraygun/vista:1.0.21`
2. Committed and pushed to declarative-config
3. ArgoCD automatically synced to apexalgo-iad
4. New ReplicaSet created successfully
5. Old broken ReplicaSet scaled to 0

The fix followed proper GitOps workflow - no direct `kubectl edit` was used.
