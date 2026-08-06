# Cloudflare DNS CNAME Setup for vista.jedarden.com

## Task: bf-e00

**Date:** 2026-08-05  
**Status:** Ready for Manual Execution

## Current State Analysis

**Current DNS configuration:**
- vista.jedarden.com has A records pointing to Cloudflare proxy IPs:
  - 104.21.40.5
  - 172.67.172.218
  - Plus IPv6 addresses and HTTPS service bindings
- This indicates the domain is currently set up as a "Proxied" (☁️ orange cloud) record in Cloudflare

**Required configuration:**
- vista.jedarden.com should have a CNAME record pointing to the Cloudflare tunnel target
- This will route traffic through the Cloudflare Tunnel to the Traefik ingress on apexalgo-iad cluster
- Provides better security and direct integration with Kubernetes cluster

## Required Action: Manual Cloudflare Dashboard Setup

This DNS record must be manually updated in the Cloudflare dashboard as no API credentials are available on this system.

### Step 1: Access Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Log in with your Cloudflare account
3. Select the **jedarden.com** zone
4. Navigate to **DNS → Records**

### Step 2: Modify Existing DNS Record

**Note:** You should see existing A/AAAA records for vista.jedarden.com currently pointing to Cloudflare proxy IPs (104.21.40.5, 172.67.172.218). You need to either:

**Option A (Recommended):** Delete existing records and create new CNAME
1. Delete all existing vista.jedarden.com records (A, AAAA, and any HTTPS/SVCB records)
2. Click **Add record** to create the CNAME

**Option B:** Edit existing A record to CNAME (if Cloudflare allows type conversion)

Configure the CNAME as follows:

- **Type:** CNAME
- **Name:** vista
- **Target:** cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
- **TTL:** Auto (or 300 seconds)
- **Proxy status:** DNS only (⚙️ grey cloud icon - NOT proxied)

**CRITICAL:** The proxy status MUST be "DNS only" (grey cloud/⚙️), not "Proxied" (orange cloud/☁️). The tunnel endpoint is already proxied by Cloudflare Tunnel, so this should be a direct DNS record without additional proxying.

### Step 3: Verification Commands

After creating the record, run these commands to verify:

```bash
# Check for CNAME record
host -t CNAME vista.jedarden.com

# Expected output:
# vista.jedarden.com is an alias for cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com

# Alternative check with dig
dig +short vista.jedarden.com cname

# Expected output:
# cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com

# Test HTTPS access
curl -I https://vista.jedarden.com

# Expected: 200/301/302/404 (any response means DNS is working)
```

## Why This Target?

The target `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` is the Cloudflare Tunnel (cloudflared) that fronts the Traefik ingress on the apexalgo-iad cluster. All apexalgo-iad services use this same tunnel endpoint for secure ingress.

**References:**
- IngressRoute annotations: `/home/coding/vista/k8s/ingressroute.yml`
- Declarative config: `jedarden/declarative-config → k8s/apexalgo-iad/vista/`

## Acceptance Criteria

- [ ] CNAME record exists in Cloudflare dashboard (DNS only, grey cloud)
- [ ] `host -t CNAME vista.jedarden.com` returns the tunnel target
- [ ] `dig +short vista.jedarden.com cname` returns the CNAME
- [ ] `curl -I https://vista.jedarden.com` returns a valid HTTP response

## Related Context

This is part of the VISTA deployment on apexalgo-iad cluster. The IngressRoute already has external-dns annotations, but they require Cloudflare API credentials which are not available in the cluster. Manual DNS record creation is the workaround.

## Next Steps

1. Execute the manual Cloudflare dashboard steps above
2. Run verification commands
3. If verification succeeds, create a summary commit
4. Close bead bf-e00
