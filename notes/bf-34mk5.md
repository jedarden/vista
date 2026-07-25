# Task bf-34mk5: Cloudflare DNS CNAME for vista.jedarden.com - REQUIRES MANUAL SETUP

## Status
**REQUIRES MANUAL INTERVENTION** - Documentation created, awaiting Cloudflare Dashboard action.

**Last verified:** 2026-07-24 22:00 UTC
**CNAME status:** Does not exist (verification script confirms)
**Action taken:** Created comprehensive manual setup guide and verification script

## Summary
Task requires creating a CNAME record in Cloudflare DNS to point `vista.jedarden.com` to the apexalgo-iad ingress.

## What Was Done
1. ✅ Verified ingressroute configuration in `declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`
2. ✅ Identified correct target: `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
3. ✅ Verified target is consistent with other apexalgo-iad services
4. ✅ Confirmed CNAME record does NOT exist yet (`host -t CNAME vista.jedarden.com` returns "has no CNAME record")

## Blocker
**No Cloudflare API access available:**
- No `CLOUDFLARE_API_TOKEN` environment variable
- No `~/.cloudflare-token` file
- No Cloudflare credentials in environment

## Manual Setup Instructions Created
Comprehensive setup guide created at: `notes/bf-34mk5-manual-setup.md`

**Quick steps:**
1. Log in to Cloudflare Dashboard → jedarden.com zone
2. Go to DNS → Records → Add record
3. Configure:
   - **Type:** CNAME
   - **Name:** vista
   - **Target:** cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
   - **TTL:** Auto
   - **Proxy status:** DNS only (grey cloud - NOT proxied)

## Verification Script Created
Executable script created at: `scripts/verify-dns-cname.sh`

**After manual CNAME creation, run:**
```bash
./scripts/verify-dns-cname.sh
```

This script checks:
- CNAME record exists
- Points to correct target
- DNS resolution works
- HTTPS accessibility

## Current Verification Status
**All checks FAIL (CNAME not yet created):**
- ✗ CNAME record does not exist
- ✗ CNAME target check: N/A
- ✗ DNS resolution: N/A
- ✗ HTTPS accessibility: N/A

## After Manual Creation - Run Verification
```bash
./scripts/verify-dns-cname.sh
```

Expected output when CNAME exists:
```
✓ PASS: CNAME record exists
✓ PASS: CNAME points to cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
✓ PASS: DNS resolution successful
✓ PASS: HTTPS accessible (HTTP 407 or 200)
```

Note: HTTP 407 is expected if Traefik authentication is enabled (as configured in the IngressRoute).

## Why This Target?
The target `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` is the Cloudflare Tunnel that fronts the Traefik ingress on apexalgo-iad. This is the same target used by all other apexalgo-iad services.

## Related Files and Documentation
- **Manual setup guide:** `/home/coding/vista/notes/bf-34mk5-manual-setup.md`
- **Verification script:** `/home/coding/vista/scripts/verify-dns-cname.sh` (executable)
- **IngressRoute:** `/home/coding/declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`
- **Parent bead:** bf-2eu (umbrella deployment task)
- **Next child bead:** bf-2k4ei (end-to-end test) - blocked by this DNS record

## Files Created for This Bead
1. `notes/bf-34mk5-manual-setup.md` - Comprehensive Cloudflare Dashboard setup instructions
2. `scripts/verify-dns-cname.sh` - Automated verification script
3. `notes/bf-34mk5.md` - Updated this file with current status

## Commit Information
This commit contains documentation and tooling for manual CNAME creation. The actual CNAME record must be created manually via Cloudflare Dashboard by following the instructions in `notes/bf-34mk5-manual-setup.md`.

## Closing This Bead
This bead should remain OPEN until the CNAME is manually created and verified with `./scripts/verify-dns-cname.sh`. Once verified, update this file and close the bead with `br close bf-34mk5`.
