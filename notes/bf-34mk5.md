# Task bf-34mk5: Cloudflare DNS CNAME for vista.jedarden.com - BLOCKED

## Status
**BLOCKED** - Cannot complete without Cloudflare API credentials.

**Last verified:** 2026-07-24 21:39 UTC
**CNAME status:** Still does not exist (`host -t CNAME vista.jedarden.com` returns "has no CNAME record")

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

## Required Action
To complete this task, one of the following is needed:

### Option 1: Provide API Token
Set the environment variable:
```bash
export CLOUDFLARE_API_TOKEN=<token>
```

Then the CNAME can be created via Cloudflare API v4.

### Option 2: Manual Creation via Cloudflare Dashboard
1. Log in to Cloudflare Dashboard
2. Select zone: jedarden.com
3. Go to DNS → Records
4. Add new record:
   - **Type:** CNAME
   - **Name:** vista
   - **Target:** cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
   - **TTL:** Auto (or 300)
   - **Proxy status:** DNS only (not proxied)

## Verification
Once created, verify with:
```bash
host -t CNAME vista.jedarden.com
```

## Why This Target?
The target `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com` is the Cloudflare Tunnel that fronts the Traefik ingress on apexalgo-iad. This is the same target used by all other apexalgo-iad services.

## Related
- IngressRoute: `/home/coding/declarative-config/k8s/apexalgo-iad/vista/ingressroute.yml`
- Parent bead: bf-2eu (umbrella deployment task)
- Next child bead: bf-2k4ei (end-to-end test) - blocked by this DNS record
