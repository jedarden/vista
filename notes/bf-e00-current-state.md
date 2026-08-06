# vista.jedarden.com DNS State Analysis

## Date: 2026-08-05

## Current State: Working via Cloudflare Proxy

**Current DNS Configuration:**
- vista.jedarden.com has A/AAAA records pointing to Cloudflare proxy IPs
- Proxy IPs: 104.21.40.5, 172.67.172.218 (plus IPv6)
- Status: **Proxied (☁️ orange cloud)**
- **Result: Site is WORKING** - HTTPS returns 200 with full HTML content

**Verification:**
```bash
curl -I https://vista.jedarden.com
# HTTP/2 200 - site is accessible and responding correctly
```

## Why It Works Without CNAME

The current setup uses **Cloudflare's CDN proxy** instead of the Cloudflare Tunnel:

1. User → vista.jedarden.com
2. DNS resolves to Cloudflare proxy IPs (104.21.40.5, 172.67.172.218)  
3. Cloudflare proxy → origin server (how? need to investigate)

## Required State: Cloudflare Tunnel via CNAME

**The bead (bf-e00) specifically requires:**
- CNAME record: vista.jedarden.com → cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
- DNS only (⚙️ grey cloud)
- Routes through Cloudflare Tunnel to Traefik on apexalgo-iad cluster

**Why CNAME approach is preferred for this architecture:**
1. Direct integration with Kubernetes ingress via Cloudflare Tunnel
2. Consistent with other apexalgo-iad services
3. No need to expose public origin server IPs
4. Tunnel manages TLS termination at cluster edge

## Manual Action Required

Since no Cloudflare API credentials are available, this requires manual Cloudflare dashboard intervention.

**Steps:**
1. Log into Cloudflare Dashboard → jedarden.com → DNS
2. Delete existing A/AAAA records for vista.jedarden.com  
3. Add CNAME record:
   - Name: vista
   - Target: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com
   - Proxy: DNS only (⚙️ grey cloud)
   - TTL: Auto
4. Wait 5-15 minutes for DNS propagation
5. Verify with `./verify-dns-cname.sh`

## Verification Script

Run `/home/coding/vista/verify-dns-cname.sh` after making changes to verify the CNAME setup.

## Acceptance Criteria for bf-e00

- [ ] CNAME record exists in Cloudflare for vista.jedarden.com
- [ ] Points to apexalgo-iad ingress tunnel target (cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com)
- [ ] DNS propagation verified (`host -t CNAME vista.jedarden.com` shows correct record)

## Note

The site is currently working via Cloudflare proxy, but the bead specifically requires the CNAME-to-tunnel approach for architectural consistency with the apexalgo-iad cluster setup.
