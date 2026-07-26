# bf-4tcx — `:latest` tag pin in apexalgo-iad vista Deployment

## TL;DR
The manifest deliverable this bead asked for is **already complete** in
`jedarden/declarative-config@origin/main`. The live cluster still shows `:latest`
on the Deployment object, but only because **apexalgo-iad's ArgoCD sync is
broken** (separately tracked) — not because the manifest is wrong. No manifest
edit was needed or made.

## What this bead required
Change `k8s/apexalgo-iad/vista/deployment.yml` from
`image: ronaldraygun/vista:latest` to a pinned semver, push to declarative-config
so ArgoCD auto-sync picks it up, and leave a closing comment noting bf-iaup's
earlier "Completed" closure was inaccurate.

## Findings

### 1. Manifest is already pinned (deliverable satisfied)
Fresh `git pull` of `jedarden/declarative-config` main (`git fetch` showed local
checkout 5 commits behind; pulled to current tip). The vista Deployment manifest
now reads:

```yaml
image: ronaldraygun/vista:1.0.22
imagePullPolicy: Always
```

Commit **7223924** — `fix(vista): pin deployment to real semver tag, add missing
imagePullSecrets, auto-bump tag in CI` (jedarden, 2026-07-25) — made the change:
- `ronaldraygun/vista:latest` → `ronaldraygun/vista:1.0.22`
- added `imagePullSecrets: docker-hub-registry` (the Deployment had **none** — it
  had been stuck in `ImagePullBackOff` on `:latest` since 2026-06-03, 52+ days)
- added an `update-declarative-config` step to `vista-workflowtemplate.yml`
  (mirroring telegram-claude-bridge-build / news-trader-build) so the pinned tag
  auto-advances on future CI builds and won't drift back to `:latest`

This is a strictly stronger fix than bf-4tcx asked for.

### 2. VERSION-vs-manifest discrepancy is expected, not a defect
The vista repo `VERSION` file reads `1.0.21` while the manifest pins `1.0.22`.
Per 7223924's message: CI auto-bumps had been silently failing since 2026-07-23
due to an out-of-sync `package-lock.json` (bead **bf-2uoz8**), so `VERSION`
stalled at 1.0.21; a **manual** vista-build run then pushed the `1.0.22` tag,
which 7223924 pinned. `1.0.22` is therefore the correct current pin — downgrading
the manifest to `1.0.21` would target an older tag. (The auto-bump step added in
the same commit will keep this advancing correctly once CI builds succeed again.)

### 3. Live cluster still shows `:latest` — separate infra issue, out of scope
Read-only check against apexalgo-iad (`traefik-apexalgo-iad:8001`):

```
Deployment vista: Ready=1/2  desired image=ronaldraygun/vista:latest
  vista-5d5f9dc954-ffh9m  Pending   ronaldraygun/vista:latest     (not ready)
  vista-7d87bd66df-xbm8d  Running   ghcr.io/jedarden/vista:1.0.0  (ready)
```

The on-cluster Deployment object still desires `:latest` (with one pod stuck
`Pending`/pull-failing, plus a stray leftover running pod from the earlier
frozen `ghcr.io/jedarden/vista` repoint attempt — see memory
`vista-image-fix-in-gitops`) **because apexalgo-iad's ArgoCD sync is broken**:
all apexalgo-iad apps report `Unknown` (x509 error in cluster-registration),
repair needs an operator-level write this environment lacks (see memory
`apexalgo-iad-argocd-sync-broken`). The manifest fix therefore cannot reach the
cluster until that sync is repaired. bf-4tcx explicitly forbids direct
`kubectl apply/edit/patch/rollout` and routes all cluster state through
declarative-config → ArgoCD, so the cluster staleness is **not** something this
bead can or should fix; it is tracked separately.

### 4. bf-iaup's closure WAS a false positive (acceptance criterion #3)
bf-iaup — "Pin docker image tag in k8s manifests (no :latest)" — was closed with
`close_reason=Completed` by assignee `claude-code-glm47-vista-1`. At the time it
closed, the live manifest had **not** been changed: the 2026-07-19 audit still
read `ronaldraygun/vista:latest`. The actual change only landed later, via an
independent commit (7223924, 2026-07-25) that was not a result of bf-iaup's work.
So bf-iaup's "Completed" status was inaccurate — closed on an assumed-complete
status rather than a verified live artifact, exactly the class of bug this bead's
own description warns about. **Lesson for future audits:** do not treat `closed`
status alone as proof a manifest change landed — verify the live manifest (and,
where possible, the live cluster object).

## Outcome
- Manifest deliverable: satisfied by upstream commit 7223924 (no edit needed).
- No declarative-config change made (would be a no-op or a harmful downgrade).
- Closing comment recorded on bf-4tcx; bf-4tcx closed.
