# bf-bajl: DNS Verification for vista.jedarden.com

## Issue Filed (2026-07-20)

Bead bf-bajl was filed during a P0 audit reporting that `vista.jedarden.com` returned NXDOMAIN and was not reachable at its documented public product URL.

## Current Status (2026-08-05): ✅ RESOLVED

The DNS issue has been **completely resolved**. vista.jedarden.com is now fully operational.

### Verification Evidence

1. **DNS Resolution** (2026-08-05):
   ```
   $ dig +short vista.jedarden.com
   104.21.40.5
   172.67.172.218
   ```

2. **HTTPS Accessibility** (2026-08-05):
   ```
   $ curl -s -o /dev/null -w "%{http_code}" https://vista.jedarden.com
   200
   ```

3. **Content Verification**: The site serves valid VISTA HTML with proper meta tags.

### Infrastructure Configuration

The IngressRoute at `apexalgo-iad/vista` has proper external-dns annotations:
- `external-dns.alpha.kubernetes.io/hostname: vista.jedarden.com`
- `external-dns.alpha.kubernetes.io/target: cef7d924-cd61-43dc-89ad-1df7de2699bf.cfargotunnel.com`
- `external-dns.alpha.kubernetes.io/ttl: "300"`

Traffic routes through Cloudflare's edge network (cf-ray headers present).

### Resolution

Per git commit 720a1a4 (2026-07-25):
> "DNS (vista.jedarden.com NXDOMAIN) - already fixed independently by bf-e00/bf-34mk5"

The DNS was fixed by the related beads bf-e00 and bf-34mk5, which handled Cloudflare CNAME setup and verification.

## Conclusion

The vista.jedarden.com public product URL is now fully operational, resolving correctly, serving through Cloudflare, and delivering the VISTA application as documented in README.md.

**Bead Status**: Ready to close as COMPLETED.
