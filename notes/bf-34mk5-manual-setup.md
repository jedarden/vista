# Manual Cloudflare DNS Setup for vista.jedarden.com

## Status: REQUIRES MANUAL INTERVENTION

**Date:** 2026-07-24  
**Issue:** CNAME record does not exist despite external-dns annotations  
**Blocker:** No Cloudflare API credentials available on this system

## Current State

- **IngressRoute:** Deployed on apexalgo-iad with external-dns annotations
- **Expected CNAME:** vista.jedarden.com → cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
- **Actual DNS:** vista.jedarden.com resolves to Cloudflare proxy IPs (no CNAME)
- **Verification:** `host -t CNAME vista.jedarden.com` returns "has no CNAME record"

## Manual Setup Instructions

### Step 1: Log into Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select the **jedarden.com** zone
3. Navigate to **DNS → Records**

### Step 2: Add CNAME Record

Click **Add record** and configure:

- **Type:** CNAME
- **Name:** vista
- **Target:** cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
- **TTL:** Auto (or 300)
- **Proxy status:** DNS only (grey cloud icon - not proxied)

**IMPORTANT:** The proxy status MUST be "DNS only" (grey cloud), not "Proxied" (orange cloud). The tunnel endpoint is already proxied by Cloudflare, so this should be a direct DNS record.

### Step 3: Verify CNAME Creation

After adding the record, verify it exists:

```bash
# Check for CNAME record
host -t CNAME vista.jedarden.com

# Expected output:
# vista.jedarden.com is an alias for cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com

# Full DNS lookup
host vista.jedarden.com

# Should show the tunnel target
```

### Step 4: Test DNS Resolution

```bash
# Test that the domain resolves correctly
dig +short vista.jedarden.com cname

# Should return:
# cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com

# Then test that the tunnel target resolves
dig +short cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
```

### Step 5: Test HTTPS Access

```bash
# Test that the service is accessible
curl -I https://vista.jedarden.com

# Should return 200/301/302/407 (407 is expected if auth is required)
```

## Why This Target?

The target `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` is the Cloudflare Tunnel (cloudflared) that fronts the Traefik ingress on apexalgo-iad. All apexalgo-iad services use this same tunnel endpoint.

**Reference:** declarative-config/k8s/apexalgo-iad/traefik/cloudflared-configmap.yml

## Why external-dns Didn't Create It

The IngressRoute has external-dns annotations that should automatically create this CNAME, but:

1. **No Cloudflare credentials:** external-dns needs `CLOUDFLARE_API_TOKEN` env var
2. **Domain filtering:** external-dns may be filtered to specific domains
3. **Permissions:** The external-dns ServiceAccount may not have DNS write permissions

Check external-dns status:
```bash
kubectl --server=http://traefik-apexalgo-iad:8001 get pods -n traefik -l app.kubernetes.io/name=external-dns
kubectl --server=http://traefik-apexalgo-iad:8001 logs -n traefik -l app.kubernetes.io/name=external-dns --tail=50
```

## Acceptance Criteria

- [ ] CNAME record exists in Cloudflare (verify in dashboard)
- [ ] `host -t CNAME vista.jedarden.com` shows the tunnel target
- [ ] `dig +short vista.jedarden.com` returns the CNAME
- [ ] HTTPS access to https://vista.jedarden.com works

## Related Files

- IngressRoute: `/home/coding/declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`
- Bead documentation: `/home/coding/vista/notes/bf-34mk5.md`
- Bead ID: bf-34mk5

## Next Steps

Once the CNAME is manually created and verified:

1. Update bead bf-34mk5 status
2. Run end-to-end verification
3. Close the bead
