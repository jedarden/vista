# Vista Deployment Verification — bf-4bw

**Date**: 2026-07-22
**Cluster**: apexalgo-iad
**Namespace**: vista

## Verification Results

### ✅ External Endpoint (Working)
- **Domain**: https://vista.jedarden.com
- **Status**: HTTP 200
- **Response**: Correct VISTA page title "VISTA — Visual Inspector of Social Tags & Attributes"
- **IngressRoute**: Configured with TLS (certResolver: letsencrypt)

### ✅ Service Configuration (Working)
- **Service**: vista (ClusterIP: 10.21.64.133:3000)
- **Endpoints**: Correctly pointing to running pod at 10.20.92.146:3000

### ✅ Pod Status (One Running)
- **vista-7d87bd66df-tmtx4**: Running (image: ghcr.io/jedarden/vista:1.0.0)
- **Running since**: 2026-07-22T08:39:04Z
- **Node**: prod-instance-17826304223870832

### ⚠️ Deployment Issues (Degraded State)
The deployment is in a broken state:
- **Deployment spec image**: `ronaldraygun/vista:latest` (CANNOT PULL)
- **Actual running pod image**: `ghcr.io/jedarden/vista:1.0.0` (WORKING)
- **Deployment status**: ProgressDeadlineExceeded
- **Old pod stuck**: vista-5d5f9dc954-8tw9b in ImagePullBackOff (14h old, should be cleaned up)

### ❓ ArgoCD Sync Status (Unknown)
- ArgoCD read-only API returned empty response - cannot verify sync status
- Application `vista-apexalgo-iad` or `vista-ns-apexalgo-iad` may exist but could not query

## Root Cause

The deployment has rolled out to a new image that doesn't exist in Docker Hub (`ronaldraygun/vista:latest`), causing the rollout to fail. The old ReplicaSet (128d old) with the working image (`ghcr.io/jedarden/vista:1.0.0`) is still serving traffic.

## Recommendations

1. **Update deployment spec** to use the working image: `ghcr.io/jedarden/vista:1.0.0`
2. **Clean up old pods** - the ImagePullBackOff pod should be removed
3. **Fix ArgoCD sync** - determine why the deployment spec drifted from the working image
4. **Verify GitOps source** - check declarative-config for the correct image reference

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| ArgoCD application Synced | ❓ API unreachable, can't verify | |
| Deployment pods Running | ⚠️ Partial | 1/2 running, 1 stuck ImagePullBackOff |
| Service accessible internally | ⚠️ Not tested | kubectl proxy host is external to cluster |
| IngressRoute working | ✅ | Configured with TLS |
| vista.jedarden.com responds | ✅ | Returns HTTP 200 with correct content |

## Conclusion

The application is **functional** and serving correctly via the external domain. However, the deployment is in a degraded state due to an image reference mismatch that needs to be addressed in GitOps.
