# Cloudflare DNS CNAME Setup for vista.jedarden.com

## Current State

### DNS Records
- **Record type**: A records (incorrect)
- **Current IPs**: 
  - 104.21.40.5
  - 172.67.172.218
- **These are**: Cloudflare proxy IPs, not the proper apexalgo-iad ingress

### Kubernetes Configuration
- **IngressRoute**: Two exist in `vista` namespace
  - `vista` (51d old): Handles `vista.jedarden.com` but **missing external-dns annotations**
  - `vista-ingressroute` (131d old): Handles `vista.ardenone.com` with proper annotations

### External-DNS Status
- **Pod Status**: `CreateContainerConfigError`
- **Issue**: Missing secret `cloudflare-apexalgo-iad-secret`
- **Impact**: external-dns cannot create/update DNS records

## Required Configuration

### The Correct Pattern (from local declarative config)
```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: vista
  namespace: vista
  annotations:
    # external-dns (apexalgo-iad, domain-filter jedarden.com, --cloudflare-proxied)
    # creates the vista.jedarden.com CNAME → apexalgo-iad's Cloudflare tunnel,
    # which fronts the cluster's traefik ingress (see traefik/cloudflared-configmap.yml).
    external-dns.alpha.kubernetes.io/hostname: vista.jedarden.com
    external-dns.alpha.kubernetes.io/target: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
    external-dns.alpha.kubernetes.io/ttl: "300"
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`vista.jedarden.com`)
      kind: Rule
      services:
        - name: vista
          port: 3000
  tls:
    certResolver: letsencrypt
```

## Architecture

```
vista.jedarden.com (CNAME)
    ↓
cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com (Cloudflare tunnel)
    ↓
traefik-apexalgo-iad.traefik.svc.cluster.local:8443 (Traefik ingress)
    ↓
vista service (port 3000)
```

## Manual Actions Required

### 1. Fix the IngressRoute annotations
The IngressRoute on the cluster is missing the external-dns annotations. The local file has them, but ArgoCD sync is broken for apexalgo-iad.

### 2. Create the Cloudflare secret for external-dns
```bash
kubectl --server=http://traefik-apexalgo-iad:8001 create secret generic cloudflare-apexalgo-iad-secret \
  --from-literal=CF_API_TOKEN=<your-cloudflare-api-token> \
  -n utilities
```

### 3. Manual DNS Configuration in Cloudflare
Since external-dns is broken and ArgoCD sync is broken, the DNS record needs to be added manually:

1. Log in to Cloudflare Dashboard
2. Select domain: `jedarden.com`
3. Go to DNS → Records
4. Delete existing A records for `vista.jedarden.com` (pointing to 104.21.40.5, 172.67.172.218)
5. Add new CNAME record:
   - **Name**: `vista`
   - **Type**: `CNAME`
   - **Target**: `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
   - **Proxy status**: Proxied (orange cloud icon) ✓
   - **TTL**: Auto (or 300 seconds)

### 4. Verify DNS Propagation
```bash
# After 5-10 minutes, check DNS
host -t CNAME vista.jedarden.com

# Should return:
# vista.jedarden.com is an alias for cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
```

## Cloudflare Tunnel Details

- **Tunnel ID**: `cef7d924-cd61-43dc-89ad-1df7de2699bf`
- **Tunnel hostname**: `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
- **Backend**: Traefik ingress on apexalgo-iad cluster
- **Configuration**: Defined in `k8s/apexalgo-iad/traefik/cloudflared-configmap.yml`

## Related Issues

- **apexalgo-iad ArgoCD sync broken**: All apexalgo-iad apps show `Unknown` status due to cluster registration issues
- **external-dns secret missing**: Pod cannot start without Cloudflare API token
- **GHCR package private**: Image pull issues for vista image (separate issue)

## Acceptance Criteria Status

- ❌ CNAME record exists in Cloudflare for vista.jedarden.com
- ❌ DNS resolves correctly (currently shows A records)
- ❌ CNAME points to correct apexalgo-iad ingress endpoint (tunnel)

## Notes

The local declarative config at `/home/coding/declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml` already has the correct annotations. Once ArgoCD sync is fixed and external-dns is working, it should automatically create the correct DNS record. However, manual intervention is currently required due to the broken automation.
