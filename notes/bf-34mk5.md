# Cloudflare DNS CNAME for vista.jedarden.com (bf-34mk5)

**Date:** 2026-07-24
**Task:** Add Cloudflare DNS CNAME for vista.jedarden.com

## Current State

### DNS Status
- **Domain:** vista.jedarden.com
- **Current Records:** A/AAAA records pointing to Cloudflare proxy IPs (104.21.40.5, 172.67.172.218)
- **CNAME Status:** ❌ No CNAME record exists
- **External DNS:** Not deployed on apexalgo-iad (no automatic DNS management)

### Target Hostname
From `/home/coding/vista/k8s/ingressroute.yml`:
```yaml
external-dns.alpha.kubernetes.io/hostname: vista.jedarden.com
external-dns.alpha.kubernetes.io/target: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
```

**Target CNAME:** `cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`

This is the Cloudflare tunnel that fronts the apexalgo-iad Traefik ingress.

## Required Action

### Manual Cloudflare Setup Required

**Cannot complete automatically** - Cloudflare API credentials not available on this server.

**To complete manually via Cloudflare Dashboard:**

1. Log into Cloudflare Dashboard
2. Select zone: `jedarden.com`
3. Navigate to DNS → Records
4. **Delete existing A/AAAA records** for vista.jedarden.com (if any)
5. **Add CNAME record:**
   - **Type:** CNAME
   - **Name:** vista
   - **Target:** cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
   - **Proxy Status:** Proxied (orange cloud) - recommended for SSL/tunnel routing
   - **TTL:** Auto (or 300 seconds)

### Alternative: Cloudflare API

If Cloudflare API credentials become available:
```bash
# Requires: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "vista",
    "content": "cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com",
    "proxied": true,
    "ttl": 300
  }'
```

## Verification

After adding the CNAME, verify with:
```bash
host -t CNAME vista.jedarden.com
# Should return: vista.jedarden.com is an alias for cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
```

## Ingress Configuration

The Traefik IngressRoute is already configured and deployed:
- **File:** `/home/coding/vista/k8s/ingressroute.yml`
- **Host:** vista.jedarden.com
- **TLS:** letsencrypt certResolver configured
- **Service:** vista service on port 8080
- **Target:** Cloudflare tunnel (cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com)

## Acceptance Criteria Status

| Criteria | Status | Notes |
|----------|--------|-------|
| CNAME record exists in Cloudflare | ❌ BLOCKED | Manual setup required via Cloudflare Dashboard |
| Record points to correct apexalgo-iad ingress target | ✅ VERIFIED | Target: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com |
| DNS resolves | ❌ BLOCKED | Depends on CNAME creation |

## Why External-DNS Won't Work

The ingressroute.yml has external-dns annotations, but:
1. **external-dns is not deployed** on apexalgo-iad (checked kube-system namespace)
2. **Even if deployed**, external-dns requires Cloudflare API credentials to manage records
3. **Alternative approach:** Add DNS record manually via Cloudflare Dashboard

## Next Steps

1. **Manual intervention required** - Add CNAME via Cloudflare Dashboard
2. **Verify DNS propagation** after record creation
3. **Test SSL certificate** issuance via Traefik's letsencrypt certResolver
4. **Verify full access** to vista.jedarden.com via browser/curl

## Dependencies

- ✅ **Child 3 (bf-2o6ao)**: Completed - Ingress deployed and target hostname known
- ⏸️ **Cloudflare API access**: Not available on this server
- ⏸️ **external-dns**: Not deployed on apexalgo-iad

## Notes

- The Cloudflare tunnel (cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com) is already configured and operational
- Traefik IngressRoute is deployed and ready to receive traffic
- Only the DNS CNAME record is missing to complete the external access path
