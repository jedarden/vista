# Task bf-55lfb: Cloudflare DNS CNAME for vista.jedarden.com

## Status: REQUIRES MANUAL INTERVENTION

**Date:** 2026-07-24  
**Issue:** CNAME record for vista.jedarden.com does not exist  
**Blocker:** No Cloudflare API credentials available - requires manual Dashboard action

## Current State

- **Expected CNAME:** vista.jedarden.com → cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
- **Actual DNS:** vista.jedarden.com has no CNAME record (verified via `host -t CNAME`)
- **Verification:** All DNS checks fail due to missing CNAME

## apexalgo-iad Ingress Endpoint Pattern

The correct target for the CNAME record is:
```
cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
```

This is the Cloudflare Tunnel endpoint that fronts the Traefik ingress on apexalgo-iad. All apexalgo-iad services use this same tunnel endpoint pattern.

**Reference:** declarative-config/k8s/apexalgo-iad/traefik/cloudflared-configmap.yml

## Manual Setup Instructions

Since no Cloudflare API credentials are available on this system, the CNAME record must be created manually via the Cloudflare Dashboard:

### Step 1: Access Cloudflare Dashboard
1. Go to https://dash.cloudflare.com/
2. Select the **jedarden.com** zone
3. Navigate to **DNS → Records**

### Step 2: Add CNAME Record
Click **Add record** and configure:

- **Type:** CNAME
- **Name:** vista
- **Target:** cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
- **TTL:** Auto (or 300)
- **Proxy status:** DNS only (grey cloud - NOT proxied)

**IMPORTANT:** The proxy status MUST be "DNS only" (grey cloud), not "Proxied" (orange cloud). The tunnel endpoint is already proxied by Cloudflare, so this should be a direct DNS record.

### Step 3: Verify CNAME Creation

After adding the record, verify with the provided script:

```bash
./scripts/verify-dns-cname.sh
```

Expected output when successful:
```
✓ PASS: CNAME record exists
✓ PASS: CNAME points to cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
✓ PASS: DNS resolution successful
✓ PASS: HTTPS accessible (HTTP 200/407)
```

## Acceptance Criteria Status

- ❌ CNAME record exists in Cloudflare for vista.jedarden.com - **REQUIRES MANUAL ACTION**
- ❌ DNS resolves correctly (test with dig/host) - **BLOCKED BY MISSING CNAME**
- ❌ CNAME points to correct apexalgo-iad ingress endpoint - **NOT APPLICABLE**

## Related Documentation

This task duplicates the requirements from bf-34mk5, which already created comprehensive documentation:
- Manual setup guide: `notes/bf-34mk5-manual-setup.md`
- Verification script: `scripts/verify-dns-cname.sh`
- Previous bead documentation: `notes/bf-34mk5.md`

## Why No API Access?

The system lacks:
- `CLOUDFLARE_API_TOKEN` environment variable
- `~/.cloudflare-token` file
- Any Cloudflare credentials in the environment

This is intentional for security reasons. The Cloudflare Dashboard must be accessed manually.

## Next Steps

1. **Manual action required:** Access Cloudflare Dashboard and create the CNAME record following the instructions above
2. **After creation:** Run `./scripts/verify-dns-cname.sh` to verify
3. **Once verified:** Update this note and close the bead

## Files Referenced

- IngressRoute: `declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`
- Verification script: `scripts/verify-dns-cname.sh`
- Manual setup guide: `notes/bf-34mk5-manual-setup.md`
